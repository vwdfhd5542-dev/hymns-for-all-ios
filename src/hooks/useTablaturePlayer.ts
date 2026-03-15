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
  let i = 0;
  let groupTimeOffset = 0;

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
      const tempo = 0.15;

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
            time: groupTimeOffset + col * tempo,
            freq: fretToFreq(str, fret),
            duration: 0.45,
          });
        }
      }
      groupTimeOffset += maxLen * tempo + 0.05;
      i = j;
    } else {
      i = j > i ? j : i + 1;
    }
  }

  notes.sort((a, b) => a.time - b.time);
  return notes;
}

// Generate WAV audio buffer from notes
function generateWavBuffer(notes: TabNote[], sampleRate: number, tempoScale: number): ArrayBuffer {
  if (notes.length === 0) return new ArrayBuffer(0);

  const totalDuration = Math.max(...notes.map(n => (n.time + n.duration) * tempoScale)) + 0.3;
  const numSamples = Math.ceil(totalDuration * sampleRate);
  const buffer = new Float32Array(numSamples);

  for (const note of notes) {
    const startSample = Math.floor(note.time * tempoScale * sampleRate);
    const durSamples = Math.floor(note.duration * tempoScale * sampleRate);
    const freq = note.freq;

    for (let s = 0; s < durSamples && startSample + s < numSamples; s++) {
      const t = s / sampleRate;
      const progress = s / durSamples;

      // Pluck envelope: fast attack, exponential decay
      const attack = Math.min(t / 0.005, 1);
      const decay = Math.exp(-progress * 5);
      const envelope = attack * decay;

      // Guitar-like timbre: fundamental + harmonics with decay
      const fundamental = Math.sin(2 * Math.PI * freq * t);
      const harmonic2 = 0.5 * Math.sin(2 * Math.PI * freq * 2 * t) * Math.exp(-progress * 7);
      const harmonic3 = 0.25 * Math.sin(2 * Math.PI * freq * 3 * t) * Math.exp(-progress * 9);

      const sample = envelope * (fundamental + harmonic2 + harmonic3) * 0.15;
      buffer[startSample + s] += sample;
    }
  }

  // Clamp
  for (let i = 0; i < numSamples; i++) {
    buffer[i] = Math.max(-1, Math.min(1, buffer[i]));
  }

  // Encode WAV
  const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(wavBuffer);

  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, numSamples * 2, true);

  // Convert float to int16
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    view.setInt16(44 + i * 2, s * 0x7FFF, true);
  }

  return wavBuffer;
}

export function useTablaturePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number>();
  const urlRef = useRef<string>("");

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = "";
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
    if (notes.length === 0) {
      console.warn("[TablaturePlayer] No notes parsed");
      return;
    }

    const tempoScale = 120 / bpm;
    const sampleRate = 22050;

    console.log(`[TablaturePlayer] Generating WAV: ${notes.length} notes at ${bpm} BPM`);

    const wavBuffer = generateWavBuffer(notes, sampleRate, tempoScale);
    const blob = new Blob([wavBuffer], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    urlRef.current = url;

    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onplay = () => {
      setIsPlaying(true);
      const updateProgress = () => {
        if (!audioRef.current) return;
        const pct = audioRef.current.duration > 0
          ? audioRef.current.currentTime / audioRef.current.duration
          : 0;
        setProgress(Math.min(pct, 1));
        if (pct < 1 && !audioRef.current.paused) {
          timerRef.current = requestAnimationFrame(updateProgress);
        }
      };
      timerRef.current = requestAnimationFrame(updateProgress);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.onerror = (e) => {
      console.error("[TablaturePlayer] Audio error:", e);
      setIsPlaying(false);
    };

    audio.play().catch(err => {
      console.error("[TablaturePlayer] Play failed:", err);
      setIsPlaying(false);
    });
  }, [stop]);

  return { play, stop, isPlaying, progress };
}
