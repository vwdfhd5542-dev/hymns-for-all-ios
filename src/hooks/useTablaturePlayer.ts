import { useState, useRef, useCallback } from "react";
import * as Tone from "tone";

// Standard guitar tuning frequencies (Hz)
const OPEN_STRINGS = [
  329.63, // e4 (1st string)
  246.94, // B3
  196.00, // G3
  146.83, // D3
  110.00, // A2
  82.41,  // E2 (6th string)
];

function fretToFreq(stringIndex: number, fret: number): number {
  return OPEN_STRINGS[stringIndex] * Math.pow(2, fret / 12);
}

export interface TabNote {
  time: number;      // beat-relative time in columns
  freq: number;
  duration: number;
  stringIndex: number;
  column: number;     // original column index for highlight sync
  groupIndex: number; // which tab group this belongs to
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
      const m = line.match(/^([eBGDAE])\|(.+)/);
      if (m) {
        group.push({ label: m[1], content: m[2] });
        j++;
      } else if (group.length > 0) {
        break;
      } else {
        j++;
      }
    }

    if (group.length === 6) {
      const maxLen = Math.max(...group.map(g => g.content.length));
      const groupIdx = groups.length;
      groups.push({ startCol: globalColOffset, endCol: globalColOffset + maxLen - 1, lineStart: i });

      for (let col = 0; col < maxLen; col++) {
        for (let str = 0; str < 6; str++) {
          const ch = group[str].content[col];
          if (!ch || !/\d/.test(ch)) continue;
          // Skip second digit of two-digit frets
          if (col > 0) {
            const prev = group[str].content[col - 1];
            if (prev && /\d/.test(prev)) continue;
          }
          let fretStr = ch;
          const next = group[str].content[col + 1];
          if (next && /\d/.test(next)) fretStr += next;
          const fret = parseInt(fretStr);
          if (isNaN(fret) || fret >= 25) continue;

          notes.push({
            time: globalColOffset + col,
            freq: fretToFreq(str, fret),
            duration: 0.45,
            stringIndex: str,
            column: globalColOffset + col,
            groupIndex: groupIdx,
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

export function useTablaturePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentColumn, setCurrentColumn] = useState(-1);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const scheduledRef = useRef<number[]>([]);
  const timerRef = useRef<number>();
  const startTimeRef = useRef(0);
  const totalDurRef = useRef(0);

  const cleanup = useCallback(() => {
    scheduledRef.current.forEach(id => Tone.getTransport().clear(id));
    scheduledRef.current = [];
    Tone.getTransport().stop();
    Tone.getTransport().cancel();
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = undefined;
    }
    if (synthRef.current) {
      synthRef.current.releaseAll();
      synthRef.current.disconnect();
      synthRef.current.dispose();
      synthRef.current = null;
    }
    if (reverbRef.current) {
      reverbRef.current.disconnect();
      reverbRef.current.dispose();
      reverbRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setIsPlaying(false);
    setProgress(0);
    setCurrentColumn(-1);
  }, [cleanup]);

  const play = useCallback(async (tablature: string, bpm: number = 100) => {
    stop();

    const parsed = parseTablature(tablature);
    if (parsed.notes.length === 0) {
      console.warn("[TablaturePlayer] No notes parsed");
      return;
    }

    await Tone.start();
    console.log(`[TablaturePlayer] Playing ${parsed.notes.length} notes at ${bpm} BPM`);

    // Create guitar-like synth with ADSR envelope
    const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.25 }).toDestination();
    await reverb.generate();
    reverbRef.current = reverb;

    const synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 12,
      voice: Tone.Synth,
      options: {
        oscillator: {
          type: "fmtriangle",
          modulationType: "sine",
          modulationIndex: 2,
          harmonicity: 1,
        },
        envelope: {
          attack: 0.005,
          decay: 0.4,
          sustain: 0.08,
          release: 0.6,
        },
        volume: -8,
      },
    }).connect(reverb);
    synthRef.current = synth;

    // Calculate timing: each column = one 16th-note equivalent
    const secondsPerCol = 60 / bpm / 2; // 8th-note feel
    const transport = Tone.getTransport();
    transport.bpm.value = bpm;
    transport.cancel();

    const ids: number[] = [];

    // Group notes by column for simultaneous playback
    const notesByCol = new Map<number, TabNote[]>();
    for (const note of parsed.notes) {
      const col = note.column;
      if (!notesByCol.has(col)) notesByCol.set(col, []);
      notesByCol.get(col)!.push(note);
    }

    const totalDuration = parsed.totalColumns * secondsPerCol + 1;
    totalDurRef.current = totalDuration;

    for (const [col, colNotes] of notesByCol) {
      const timeInSeconds = col * secondsPerCol;
      const id = transport.schedule((time) => {
        const freqs = colNotes.map(n => n.freq);
        synth.triggerAttackRelease(freqs, "8n", time);
        // Update highlight on the main thread
        Tone.getDraw().schedule(() => {
          setCurrentColumn(col);
        }, time);
      }, timeInSeconds);
      ids.push(id);
    }

    // Schedule end
    const endId = transport.schedule(() => {
      Tone.getDraw().schedule(() => {
        stop();
      }, Tone.now());
    }, totalDuration);
    ids.push(endId);

    scheduledRef.current = ids;

    // Start transport
    startTimeRef.current = Tone.now();
    transport.start();
    setIsPlaying(true);

    // Progress animation
    const updateProgress = () => {
      const elapsed = Tone.now() - startTimeRef.current;
      const pct = Math.min(elapsed / totalDuration, 1);
      setProgress(pct);
      if (pct < 1) {
        timerRef.current = requestAnimationFrame(updateProgress);
      }
    };
    timerRef.current = requestAnimationFrame(updateProgress);
  }, [stop]);

  return { play, stop, isPlaying, progress, currentColumn };
}
