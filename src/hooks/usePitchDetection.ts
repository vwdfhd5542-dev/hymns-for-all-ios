import { useState, useRef, useCallback, useEffect } from "react";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function frequencyToNote(freq: number): { note: string; octave: number; cents: number } {
  const noteNum = 12 * (Math.log2(freq / 440));
  const roundedNote = Math.round(noteNum);
  const cents = Math.round((noteNum - roundedNote) * 100);
  const noteIndex = ((roundedNote % 12) + 12) % 12;
  const octave = Math.floor((roundedNote + 69) / 12);
  return { note: NOTE_NAMES[(noteIndex + 9) % 12], octave, cents };
}

function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  let size = buf.length;
  let rms = 0;
  for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) return -1; // too quiet

  // Trim silence
  let r1 = 0, r2 = size - 1;
  const threshold = 0.2;
  for (let i = 0; i < size / 2; i++) {
    if (Math.abs(buf[i]) < threshold) { r1 = i; break; }
  }
  for (let i = 1; i < size / 2; i++) {
    if (Math.abs(buf[size - i]) < threshold) { r2 = size - i; break; }
  }

  buf = buf.slice(r1, r2);
  size = buf.length;

  const c = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size - i; j++) {
      c[i] += buf[j] * buf[j + i];
    }
  }

  let d = 0;
  while (c[d] > c[d + 1]) d++;

  let maxVal = -1, maxPos = -1;
  for (let i = d; i < size; i++) {
    if (c[i] > maxVal) { maxVal = c[i]; maxPos = i; }
  }

  let T0 = maxPos;
  // Parabolic interpolation
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

export function usePitchDetection() {
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState<string | null>(null);
  const [detectedKey, setDetectedKey] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const noteHistoryRef = useRef<string[]>([]);

  const detect = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const analyser = analyserRef.current;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);

    const freq = autoCorrelate(buf, audioContextRef.current.sampleRate);

    if (freq > 60 && freq < 1500) {
      const { note } = frequencyToNote(freq);
      setDetectedNote(note);

      const history = noteHistoryRef.current;
      history.push(note);
      if (history.length > 30) history.shift();

      // Determine most common note as likely key
      const counts: Record<string, number> = {};
      history.forEach(n => { counts[n] = (counts[n] || 0) + 1; });
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sorted.length > 0) {
        setDetectedKey(sorted[0][0]);
        setConfidence(Math.round((sorted[0][1] / history.length) * 100));
      }
    }

    rafRef.current = requestAnimationFrame(detect);
  }, []);

  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      noteHistoryRef.current = [];
      setIsListening(true);
      rafRef.current = requestAnimationFrame(detect);
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [detect]);

  const stopListening = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setIsListening(false);
    setDetectedNote(null);
    setDetectedKey(null);
    setConfidence(0);
    noteHistoryRef.current = [];
  }, []);

  useEffect(() => {
    return () => { stopListening(); };
  }, [stopListening]);

  return { isListening, detectedNote, detectedKey, confidence, startListening, stopListening };
}
