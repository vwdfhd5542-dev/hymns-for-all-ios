import { useState, useRef, useCallback } from "react";

// Standard guitar tuning - open string frequencies (Hz)
const OPEN_STRINGS = [
  329.63, // e4 (1st string - high e)
  246.94, // B3
  196.00, // G3
  146.83, // D3
  110.00, // A2
  82.41,  // E2 (6th string - low E)
];

function fretToFreq(stringIndex: number, fret: number): number {
  return OPEN_STRINGS[stringIndex] * Math.pow(2, fret / 12);
}

interface TabNote {
  time: number; // in seconds
  freq: number;
  duration: number;
}

function parseTablature(tab: string): TabNote[] {
  const lines = tab.split("\n");
  const notes: TabNote[] = [];

  // Find groups of 6 consecutive tab lines (e, B, G, D, A, E)
  const stringLabels = ["e", "B", "G", "D", "A", "E"];
  let i = 0;

  while (i < lines.length) {
    // Try to find a group of 6 tab lines
    const group: string[] = [];
    let j = i;

    while (j < lines.length && group.length < 6) {
      const line = lines[j].trim();
      // Match tab lines like: e|---0---1---| or E|---3---|
      const tabMatch = line.match(/^[eBGDAe]\|(.+)\|?\s*$/);
      if (tabMatch) {
        group.push(tabMatch[1]);
        j++;
      } else if (group.length > 0) {
        break; // End of this group
      } else {
        j++;
      }
    }

    if (group.length === 6) {
      // Parse this group of 6 strings
      const maxLen = Math.max(...group.map(g => g.length));
      const tempo = 0.15; // seconds per character position

      for (let col = 0; col < maxLen; col++) {
        for (let str = 0; str < 6; str++) {
          const char = group[str][col];
          if (char && /\d/.test(char)) {
            // Check if next char is also a digit (for frets >= 10)
            let fretStr = char;
            if (col + 1 < group[str].length && /\d/.test(group[str][col + 1])) {
              fretStr += group[str][col + 1];
            }
            const fret = parseInt(fretStr);
            if (!isNaN(fret) && fret < 25) {
              notes.push({
                time: col * tempo,
                freq: fretToFreq(str, fret),
                duration: 0.4,
              });
            }
          }
        }
      }

      i = j;
    } else {
      i = j > i ? j : i + 1;
    }
  }

  // Sort by time
  notes.sort((a, b) => a.time - b.time);

  // Remove duplicates at same time (from double-digit fret parsing)
  const filtered: TabNote[] = [];
  for (const note of notes) {
    const dup = filtered.find(n => Math.abs(n.time - note.time) < 0.01 && Math.abs(n.freq - note.freq) < 1);
    if (!dup) filtered.push(note);
  }

  return filtered;
}

function createPluckSound(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume: number = 0.3
) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  // Triangle + sine for guitar-like timbre
  osc1.type = "triangle";
  osc1.frequency.setValueAtTime(freq, startTime);
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(freq * 2, startTime); // harmonic

  // Low-pass filter for warmth
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(freq * 4, startTime);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + duration * 0.5);
  filter.Q.setValueAtTime(1, startTime);

  // Pluck envelope: fast attack, exponential decay
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.005);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc1.start(startTime);
  osc1.stop(startTime + duration);
  osc2.start(startTime);
  osc2.stop(startTime + duration);
}

export function useTablaturePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number>();
  const startTimeRef = useRef(0);
  const durationRef = useRef(0);

  const stop = useCallback(() => {
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = undefined;
    }
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const play = useCallback((tablature: string, bpm: number = 120) => {
    stop();

    const notes = parseTablature(tablature);
    if (notes.length === 0) return;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const totalDuration = Math.max(...notes.map(n => n.time + n.duration)) + 0.5;
    durationRef.current = totalDuration;

    // Scale tempo based on BPM
    const tempoScale = 120 / bpm;

    // Schedule all notes
    const now = ctx.currentTime + 0.1;
    startTimeRef.current = now;

    for (const note of notes) {
      createPluckSound(ctx, note.freq, now + note.time * tempoScale, note.duration * tempoScale, 0.25);
    }

    setIsPlaying(true);

    // Update progress
    const updateProgress = () => {
      if (!ctxRef.current) return;
      const elapsed = ctxRef.current.currentTime - startTimeRef.current;
      const scaledDuration = totalDuration * tempoScale;
      const pct = Math.min(elapsed / scaledDuration, 1);
      setProgress(pct);

      if (pct >= 1) {
        setIsPlaying(false);
        setProgress(0);
        return;
      }
      timerRef.current = requestAnimationFrame(updateProgress);
    };
    timerRef.current = requestAnimationFrame(updateProgress);
  }, [stop]);

  return { play, stop, isPlaying, progress };
}
