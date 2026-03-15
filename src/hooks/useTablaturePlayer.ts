import { useState, useRef, useCallback, useEffect } from "react";

// Standard guitar tuning frequencies (Hz) - e B G D A E
const OPEN_STRINGS = [329.63, 246.94, 196.0, 146.83, 110.0, 82.41];

function fretToFreq(stringIndex: number, fret: number): number {
  return OPEN_STRINGS[stringIndex] * Math.pow(2, fret / 12);
}

export interface TabNote {
  time: number;
  freq: number;
  duration: number;
  stringIndex: number;
  column: number;
  groupIndex: number;
}

export interface ParsedTablature {
  notes: TabNote[];
  totalColumns: number;
  groups: { startCol: number; endCol: number; lineStart: number }[];
}

export function parseTablature(tab: string): ParsedTablature {
  const lines = tab.split("\n");
  const notes: TabNote[] = [];
  const groups: { startCol: number; endCol: number; lineStart: number }[] = [];
  let i = 0;
  let globalColOffset = 0;

  while (i < lines.length) {
    const group: { label: string; content: string }[] = [];
    let j = i;

    while (j < lines.length && group.length < 6) {
      const line = lines[j].trim();
      const match = line.match(/^([eBGDAE])\|(.+)/);
      if (match) {
        group.push({ label: match[1], content: match[2] });
        j++;
      } else if (group.length > 0) {
        break;
      } else {
        j++;
      }
    }

    if (group.length === 6) {
      const maxLen = Math.max(...group.map((g) => g.content.length));
      const groupIndex = groups.length;
      groups.push({ startCol: globalColOffset, endCol: globalColOffset + maxLen - 1, lineStart: i });

      // Find columns that have at least one note (digit not preceded by another digit)
      for (let col = 0; col < maxLen; col++) {
        for (let str = 0; str < 6; str++) {
          const ch = group[str].content[col];
          if (!ch || !/\d/.test(ch)) continue;
          // Skip if this digit is a continuation of a multi-digit fret
          if (col > 0 && /\d/.test(group[str].content[col - 1] || "")) continue;

          let fretStr = ch;
          const next = group[str].content[col + 1];
          if (next && /\d/.test(next)) fretStr += next;

          const fret = Number.parseInt(fretStr, 10);
          if (Number.isNaN(fret) || fret >= 25) continue;

          notes.push({
            time: globalColOffset + col,
            freq: fretToFreq(str, fret),
            duration: 0.42,
            stringIndex: str,
            column: globalColOffset + col,
            groupIndex,
          });
        }
      }

      globalColOffset += maxLen;
      i = j;
    } else {
      i = j > i ? j : i + 1;
    }
  }

  notes.sort((a, b) => a.time - b.time);
  return { notes, totalColumns: globalColOffset, groups };
}

// Transpose parsed tablature by semitones
export function transposeParsedTab(tab: string, semitones: number): string {
  if (semitones === 0) return tab;

  return tab.split("\n").map((line) => {
    const match = line.match(/^([eBGDAE])\|(.+)/);
    if (!match) return line;

    const label = match[1];
    const stringIndex = ["e", "B", "G", "D", "A", "E"].indexOf(label);
    if (stringIndex === -1) return line;

    const content = match[2];
    let result = "";
    let ci = 0;

    while (ci < content.length) {
      const ch = content[ci];
      if (/\d/.test(ch)) {
        let fretStr = ch;
        if (ci + 1 < content.length && /\d/.test(content[ci + 1])) {
          fretStr += content[ci + 1];
          ci++;
        }
        const fret = parseInt(fretStr, 10);
        const newFret = Math.max(0, Math.min(24, fret + semitones));
        const newFretStr = String(newFret);
        result += newFretStr;
        // Pad or trim to maintain alignment
        if (newFretStr.length < fretStr.length) result += "-";
        ci++;
      } else {
        result += ch;
        ci++;
      }
    }

    return `${label}|${result}`;
  }).join("\n");
}

// Karplus-Strong plucked string synthesis - sounds like a real guitar
function createPluckedString(
  ctx: AudioContext,
  freq: number,
  duration: number,
  startTime: number,
  destination: AudioNode,
  volume: number = 0.3
) {
  const sampleRate = ctx.sampleRate;
  const totalSamples = Math.ceil(sampleRate * duration);
  const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // Karplus-Strong
  const period = Math.round(sampleRate / freq);
  if (period < 2) return;

  // Initialize with noise burst
  for (let i = 0; i < period; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.8;
  }

  // Apply low-pass averaging filter for natural decay
  const damping = 0.996 - (freq > 400 ? 0.002 : 0); // slightly more damping for highs
  for (let i = period; i < totalSamples; i++) {
    data[i] = damping * 0.5 * (data[i - period] + data[i - period + 1]);
  }

  // Apply gentle exponential decay envelope
  const decayRate = 3.0 / duration;
  for (let i = 0; i < totalSamples; i++) {
    data[i] *= Math.exp(-decayRate * (i / sampleRate)) * volume;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(destination);
  source.start(startTime);
}

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = new AudioContext();
  }
  return sharedCtx;
}

export function useTablaturePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentColumn, setCurrentColumn] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const timeoutIdsRef = useRef<number[]>([]);
  const rafRef = useRef<number>();
  const perfStartRef = useRef(0);
  const totalDurationRef = useRef(0);

  const cleanup = useCallback(() => {
    timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutIdsRef.current = [];
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = undefined;
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setIsPlaying(false);
    setProgress(0);
    setCurrentColumn(-1);
  }, [cleanup]);

  useEffect(() => stop, [stop]);

  const play = useCallback(
    async (tablature: string, bpm: number = 100) => {
      try {
        stop();
        setIsLoading(true);

        const parsed = parseTablature(tablature);
        if (parsed.notes.length === 0) {
          console.warn("[TablaturePlayer] No notes parsed");
          setIsLoading(false);
          return;
        }

        const ctx = getAudioContext();
        if (ctx.state === "suspended") await ctx.resume();

        // Create a compressor to prevent clipping
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -18;
        compressor.knee.value = 12;
        compressor.ratio.value = 4;
        compressor.connect(ctx.destination);

        setIsLoading(false);

        const secondsPerColumn = 60 / bpm / 2;
        const startAt = ctx.currentTime + 0.05;
        const totalDuration = parsed.totalColumns * secondsPerColumn + 1.5;
        totalDurationRef.current = totalDuration;
        perfStartRef.current = performance.now() + 50;

        // Group notes by column
        const notesByColumn = new Map<number, TabNote[]>();
        for (const note of parsed.notes) {
          if (!notesByColumn.has(note.column)) notesByColumn.set(note.column, []);
          notesByColumn.get(note.column)!.push(note);
        }

        notesByColumn.forEach((columnNotes, column) => {
          const when = startAt + column * secondsPerColumn;
          const duration = Math.max(secondsPerColumn * 3, 0.5);

          // Play each note with Karplus-Strong synthesis
          for (const note of columnNotes) {
            const vol = note.stringIndex >= 3 ? 0.35 : 0.25; // bass slightly louder
            createPluckedString(ctx, note.freq, duration, when, compressor, vol);
          }

          // Schedule highlight
          const highlightDelay = Math.max(column * secondsPerColumn * 1000, 0);
          const id = window.setTimeout(() => setCurrentColumn(column), highlightDelay);
          timeoutIdsRef.current.push(id);
        });

        // Schedule end
        const endId = window.setTimeout(() => stop(), totalDuration * 1000);
        timeoutIdsRef.current.push(endId);

        setIsPlaying(true);
        console.info(`[TablaturePlayer] Playing ${parsed.notes.length} notes at ${bpm} BPM (${totalDuration.toFixed(1)}s) with Karplus-Strong synthesis`);

        // Progress animation
        const tick = () => {
          const elapsed = Math.max(performance.now() - perfStartRef.current, 0);
          const pct = Math.min(elapsed / (totalDurationRef.current * 1000), 1);
          setProgress(pct);
          if (pct < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (error) {
        console.error("[TablaturePlayer] Play failed", error);
        setIsLoading(false);
        stop();
      }
    },
    [stop]
  );

  return { play, stop, isPlaying, progress, currentColumn, isLoading };
}
