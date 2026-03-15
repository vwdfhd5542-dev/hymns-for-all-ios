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
  time: number;
  freq: number;
  duration: number;
}

function parseTablature(tab: string): TabNote[] {
  const lines = tab.split("\n");
  const notes: TabNote[] = [];
  const stringOrder = ["e", "B", "G", "D", "A", "E"];

  // Collect all tab line groups (6 consecutive string lines)
  let i = 0;
  let groupTimeOffset = 0;

  while (i < lines.length) {
    const group: { label: string; content: string }[] = [];
    let j = i;

    while (j < lines.length && group.length < 6) {
      const line = lines[j].trim();
      // Match: e|...|  or  E|...|  — flexible, supports multi-measure
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
      // Map each line to its string index (0=e, 1=B, 2=G, 3=D, 4=A, 5=E)
      const mapped = group.map(g => {
        const idx = stringOrder.indexOf(g.label === "E" ? "E" : g.label);
        // Handle "E" — could be high e or low E based on position
        return { content: g.content, label: g.label };
      });

      // Determine string index by position in the group (top=e, bottom=E)
      const maxLen = Math.max(...mapped.map(m => m.content.length));
      const tempo = 0.15; // seconds per column

      for (let col = 0; col < maxLen; col++) {
        for (let str = 0; str < 6; str++) {
          const ch = mapped[str].content[col];
          if (!ch || !/\d/.test(ch)) continue;

          // Check for two-digit fret numbers
          let fretStr = ch;
          const nextCh = mapped[str].content[col + 1];
          if (nextCh && /\d/.test(nextCh)) {
            fretStr += nextCh;
          }
          
          // Skip if this is the second digit of a two-digit number we already processed
          if (col > 0) {
            const prevCh = mapped[str].content[col - 1];
            if (prevCh && /\d/.test(prevCh)) continue;
          }

          const fret = parseInt(fretStr);
          if (isNaN(fret) || fret >= 25) continue;

          notes.push({
            time: groupTimeOffset + col * tempo,
            freq: fretToFreq(str, fret),
            duration: 0.5,
          });
        }
      }

      groupTimeOffset += maxLen * tempo + 0.1; // gap between groups
      i = j;
    } else {
      i = j > i ? j : i + 1;
    }
  }

  // Sort by time
  notes.sort((a, b) => a.time - b.time);

  console.log(`[TablaturePlayer] Parsed ${notes.length} notes, duration: ${notes.length > 0 ? (notes[notes.length - 1].time + 0.5).toFixed(1) : 0}s`);

  return notes;
}

function createPluckSound(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  volume: number = 0.3
) {
  // Use a more reliable approach: create gain envelope properly
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = "triangle";
  osc.frequency.value = freq;
  osc2.type = "sine";
  osc2.frequency.value = freq * 2;

  filter.type = "lowpass";
  filter.frequency.value = Math.min(freq * 4, 8000);
  filter.Q.value = 1;

  // Envelope
  gainNode.gain.setValueAtTime(0.001, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.008);
  gainNode.gain.setValueAtTime(volume, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
  osc2.start(startTime);
  osc2.stop(startTime + duration + 0.05);
}

export function useTablaturePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number>();
  const startTimeRef = useRef(0);
  const totalDurationRef = useRef(0);

  const stop = useCallback(() => {
    if (ctxRef.current) {
      try { ctxRef.current.close(); } catch {}
      ctxRef.current = null;
    }
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = undefined;
    }
    setIsPlaying(false);
    setProgress(0);
  }, []);

  const play = useCallback(async (tablature: string, bpm: number = 120) => {
    stop();

    const notes = parseTablature(tablature);
    if (notes.length === 0) {
      console.warn("[TablaturePlayer] No notes parsed from tablature");
      return;
    }

    // Create AudioContext — on iOS this requires user gesture (which we have from button click)
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    ctxRef.current = ctx;

    // CRITICAL: Resume AudioContext (required on iOS Safari)
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    console.log(`[TablaturePlayer] AudioContext state: ${ctx.state}, playing ${notes.length} notes at ${bpm} BPM`);

    const tempoScale = 120 / bpm;
    const totalDuration = Math.max(...notes.map(n => n.time + n.duration)) * tempoScale + 0.5;
    totalDurationRef.current = totalDuration;

    const now = ctx.currentTime + 0.05;
    startTimeRef.current = now;

    // Schedule all notes
    for (const note of notes) {
      createPluckSound(
        ctx,
        note.freq,
        now + note.time * tempoScale,
        Math.min(note.duration * tempoScale, 1.5),
        0.2
      );
    }

    setIsPlaying(true);

    // Progress animation
    const updateProgress = () => {
      if (!ctxRef.current) return;
      const elapsed = ctxRef.current.currentTime - startTimeRef.current;
      const pct = Math.min(elapsed / totalDuration, 1);
      setProgress(pct);

      if (pct >= 1) {
        setIsPlaying(false);
        setProgress(0);
        ctxRef.current = null;
        return;
      }
      timerRef.current = requestAnimationFrame(updateProgress);
    };
    timerRef.current = requestAnimationFrame(updateProgress);
  }, [stop]);

  return { play, stop, isPlaying, progress };
}
