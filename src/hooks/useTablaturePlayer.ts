import { useState, useRef, useCallback, useEffect } from "react";
import * as Tone from "tone";

// Standard guitar tuning frequencies (Hz)
const OPEN_STRINGS = [329.63, 246.94, 196.0, 146.83, 110.0, 82.41];

function fretToFreq(stringIndex: number, fret: number): number {
  return OPEN_STRINGS[stringIndex] * Math.pow(2, fret / 12);
}

// Map frequency to nearest note name for the Sampler
function freqToNoteName(freq: number): string {
  const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const midi = Math.round(12 * Math.log2(freq / 440) + 69);
  const clampedMidi = Math.max(40, Math.min(midi, 84)); // guitar range E2-C6
  const noteName = noteNames[clampedMidi % 12];
  const octave = Math.floor(clampedMidi / 12) - 1;
  return `${noteName}${octave}`;
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

      for (let col = 0; col < maxLen; col++) {
        for (let str = 0; str < 6; str++) {
          const ch = group[str].content[col];
          if (!ch || !/\d/.test(ch)) continue;
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

// Guitar nylon samples from nbrosowsky/tonejs-instruments (CC-by 3.0)
const SAMPLE_BASE = "https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples/guitar-nylon";
const SAMPLE_NOTES: Record<string, string> = {
  A2: `${SAMPLE_BASE}/A2.mp3`,
  A3: `${SAMPLE_BASE}/A3.mp3`,
  A4: `${SAMPLE_BASE}/A4.mp3`,
  A5: `${SAMPLE_BASE}/A5.mp3`,
  B1: `${SAMPLE_BASE}/B1.mp3`,
  B2: `${SAMPLE_BASE}/B2.mp3`,
  B3: `${SAMPLE_BASE}/B3.mp3`,
  B4: `${SAMPLE_BASE}/B4.mp3`,
  D2: `${SAMPLE_BASE}/D2.mp3`,
  D3: `${SAMPLE_BASE}/D3.mp3`,
  D4: `${SAMPLE_BASE}/D4.mp3`,
  D5: `${SAMPLE_BASE}/D5.mp3`,
  E2: `${SAMPLE_BASE}/E2.mp3`,
  E3: `${SAMPLE_BASE}/E3.mp3`,
  E4: `${SAMPLE_BASE}/E4.mp3`,
  E5: `${SAMPLE_BASE}/E5.mp3`,
  "F#2": `${SAMPLE_BASE}/Fs2.mp3`,
  "F#3": `${SAMPLE_BASE}/Fs3.mp3`,
  "F#4": `${SAMPLE_BASE}/Fs4.mp3`,
  "F#5": `${SAMPLE_BASE}/Fs5.mp3`,
  G2: `${SAMPLE_BASE}/G2.mp3`,
  G3: `${SAMPLE_BASE}/G3.mp3`,
  G4: `${SAMPLE_BASE}/G4.mp3`,
  G5: `${SAMPLE_BASE}/G5.mp3`,
};

let sharedSampler: Tone.Sampler | null = null;
let sharedReverb: Tone.Reverb | null = null;
let samplerReady = false;
let samplerLoading = false;
let samplerCallbacks: (() => void)[] = [];

async function getGuitarSampler(): Promise<Tone.Sampler> {
  if (sharedSampler && samplerReady) return sharedSampler;

  if (samplerLoading) {
    return new Promise((resolve) => {
      samplerCallbacks.push(() => resolve(sharedSampler!));
    });
  }

  samplerLoading = true;

  if (!sharedReverb) {
    sharedReverb = new Tone.Reverb({ decay: 2.0, wet: 0.18 }).toDestination();
    await sharedReverb.generate();
  }

  return new Promise((resolve) => {
    sharedSampler = new Tone.Sampler({
      urls: SAMPLE_NOTES,
      release: 1.2,
      volume: -6,
      onload: () => {
        samplerReady = true;
        samplerLoading = false;
        console.info("[TablaturePlayer] Guitar samples loaded");
        samplerCallbacks.forEach((cb) => cb());
        samplerCallbacks = [];
        resolve(sharedSampler!);
      },
      onerror: (err) => {
        console.error("[TablaturePlayer] Sample load error:", err);
        samplerLoading = false;
        // Fallback: still resolve so we can try
        resolve(sharedSampler!);
      },
    }).connect(sharedReverb!);
  });
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
    sharedSampler?.releaseAll();
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

        await Tone.start();
        const context = Tone.getContext();
        if (context.state !== "running") await context.resume();

        // Load guitar samples (cached after first load)
        const sampler = await getGuitarSampler();
        setIsLoading(false);

        const secondsPerColumn = 60 / bpm / 2;
        const startAt = Tone.now() + 0.1;
        const totalDuration = parsed.totalColumns * secondsPerColumn + 1.5;
        totalDurationRef.current = totalDuration;
        perfStartRef.current = performance.now() + 100;

        // Group notes by column
        const notesByColumn = new Map<number, TabNote[]>();
        for (const note of parsed.notes) {
          if (!notesByColumn.has(note.column)) notesByColumn.set(note.column, []);
          notesByColumn.get(note.column)!.push(note);
        }

        notesByColumn.forEach((columnNotes, column) => {
          const when = startAt + column * secondsPerColumn;
          const duration = Math.max(secondsPerColumn * 1.5, 0.15);
          const noteNames = columnNotes.map((n) => freqToNoteName(n.freq));

          // Schedule audio
          sampler.triggerAttackRelease(noteNames, duration, when, 0.75);

          // Schedule highlight
          const highlightDelay = Math.max(column * secondsPerColumn * 1000, 0);
          const id = window.setTimeout(() => setCurrentColumn(column), highlightDelay);
          timeoutIdsRef.current.push(id);
        });

        // Schedule end
        const endId = window.setTimeout(() => stop(), totalDuration * 1000);
        timeoutIdsRef.current.push(endId);

        setIsPlaying(true);
        console.info(`[TablaturePlayer] Playing ${parsed.notes.length} notes at ${bpm} BPM (${totalDuration.toFixed(1)}s) with guitar samples`);

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
