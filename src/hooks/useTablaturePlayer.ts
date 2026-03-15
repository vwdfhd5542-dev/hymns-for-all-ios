import { useState, useRef, useCallback, useEffect } from "react";
import * as Tone from "tone";

const OPEN_STRINGS = [
  329.63,
  246.94,
  196.0,
  146.83,
  110.0,
  82.41,
];

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
      groups.push({
        startCol: globalColOffset,
        endCol: globalColOffset + maxLen - 1,
        lineStart: i,
      });

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

export function useTablaturePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentColumn, setCurrentColumn] = useState(-1);

  const synthRef = useRef<Tone.PolySynth<Tone.Synth> | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const filterRef = useRef<Tone.Filter | null>(null);
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

    synthRef.current?.releaseAll();
    synthRef.current?.dispose();
    synthRef.current = null;

    reverbRef.current?.dispose();
    reverbRef.current = null;

    filterRef.current?.dispose();
    filterRef.current = null;
  }, []);

  const stop = useCallback(() => {
    cleanup();
    setIsPlaying(false);
    setProgress(0);
    setCurrentColumn(-1);
  }, [cleanup]);

  useEffect(() => stop, [stop]);

  const play = useCallback(async (tablature: string, bpm: number = 100) => {
    try {
      stop();

      const parsed = parseTablature(tablature);
      if (parsed.notes.length === 0) {
        console.warn("[TablaturePlayer] No notes parsed");
        return;
      }

      await Tone.start();
      const context = Tone.getContext();
      if (context.state !== "running") {
        await context.resume();
      }

      const filter = new Tone.Filter({
        type: "lowpass",
        frequency: 2800,
        rolloff: -24,
      }).toDestination();
      filterRef.current = filter;

      const reverb = new Tone.Reverb({ decay: 1.6, wet: 0.22 });
      reverbRef.current = reverb;
      reverb.connect(filter);
      await reverb.generate();

      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: {
          attack: 0.003,
          decay: 0.22,
          sustain: 0.12,
          release: 0.45,
        },
        volume: -10,
      }).connect(reverb);
      synthRef.current = synth;

      const secondsPerColumn = 60 / bpm / 2;
      const startAt = Tone.now() + 0.08;
      const totalDuration = parsed.totalColumns * secondsPerColumn + 0.6;
      totalDurationRef.current = totalDuration;
      perfStartRef.current = performance.now() + 80;

      const notesByColumn = new Map<number, TabNote[]>();
      for (const note of parsed.notes) {
        if (!notesByColumn.has(note.column)) notesByColumn.set(note.column, []);
        notesByColumn.get(note.column)!.push(note);
      }

      notesByColumn.forEach((columnNotes, column) => {
        const when = startAt + column * secondsPerColumn;
        const duration = Math.max(secondsPerColumn * 0.92, 0.08);
        const frequencies = columnNotes.map((note) => Tone.Frequency(note.freq, "hz").toFrequency());
        synth.triggerAttackRelease(frequencies, duration, when, 0.7);

        const highlightId = window.setTimeout(() => {
          setCurrentColumn(column);
        }, Math.max(column * secondsPerColumn * 1000, 0));
        timeoutIdsRef.current.push(highlightId);
      });

      const endId = window.setTimeout(() => {
        stop();
      }, totalDuration * 1000);
      timeoutIdsRef.current.push(endId);

      setIsPlaying(true);
      console.info(`[TablaturePlayer] Playing ${parsed.notes.length} notes at ${bpm} BPM for ${totalDuration.toFixed(2)}s`);

      const tick = () => {
        const elapsed = Math.max(performance.now() - perfStartRef.current, 0);
        const pct = Math.min(elapsed / (totalDurationRef.current * 1000), 1);
        setProgress(pct);
        if (pct < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (error) {
      console.error("[TablaturePlayer] Play failed", error);
      stop();
    }
  }, [stop]);

  return { play, stop, isPlaying, progress, currentColumn };
}

