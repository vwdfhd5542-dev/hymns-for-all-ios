import { useState, useRef, useCallback, useEffect } from "react";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Major and minor key profiles (Krumhansl-Kessler)
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function frequencyToNote(freq: number): { note: string; noteIndex: number; cents: number } {
  const noteNum = 12 * Math.log2(freq / 440);
  const roundedNote = Math.round(noteNum);
  const cents = Math.round((noteNum - roundedNote) * 100);
  const noteIndex = ((roundedNote % 12) + 12 + 9) % 12; // A=0 -> C=0
  return { note: NOTE_NAMES[noteIndex], noteIndex, cents };
}

function autoCorrelate(buf: Float32Array, sampleRate: number): number {
  const size = buf.length;
  let rms = 0;
  for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / size);
  if (rms < 0.008) return -1;

  // Normalized autocorrelation
  const correlations = new Float32Array(size);
  for (let lag = 0; lag < size; lag++) {
    let sum = 0;
    let norm1 = 0;
    let norm2 = 0;
    for (let i = 0; i < size - lag; i++) {
      sum += buf[i] * buf[i + lag];
      norm1 += buf[i] * buf[i];
      norm2 += buf[i + lag] * buf[i + lag];
    }
    const norm = Math.sqrt(norm1 * norm2);
    correlations[lag] = norm > 0 ? sum / norm : 0;
  }

  // Find first dip
  let d = 1;
  while (d < size - 1 && correlations[d] > correlations[d + 1]) d++;

  // Find peak after dip
  let maxVal = -1, maxPos = -1;
  for (let i = d; i < size - 1; i++) {
    if (correlations[i] > maxVal) { maxVal = correlations[i]; maxPos = i; }
  }

  if (maxVal < 0.3 || maxPos < 1) return -1; // Low confidence

  // Parabolic interpolation
  const x1 = correlations[maxPos - 1];
  const x2 = correlations[maxPos];
  const x3 = correlations[maxPos + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  let T0 = maxPos;
  if (a !== 0) T0 = maxPos - b / (2 * a);

  return sampleRate / T0;
}

// Determine key using Krumhansl-Schmuckler algorithm
function detectKey(noteCounts: number[]): { key: string; quality: string; confidence: number } {
  let bestCorr = -Infinity;
  let bestKey = 0;
  let bestQuality = "major";

  for (let shift = 0; shift < 12; shift++) {
    // Rotate note counts
    const rotated = noteCounts.map((_, i) => noteCounts[(i + shift) % 12]);

    // Correlate with major profile
    const majorCorr = pearsonCorrelation(rotated, MAJOR_PROFILE);
    if (majorCorr > bestCorr) {
      bestCorr = majorCorr;
      bestKey = shift;
      bestQuality = "major";
    }

    // Correlate with minor profile
    const minorCorr = pearsonCorrelation(rotated, MINOR_PROFILE);
    if (minorCorr > bestCorr) {
      bestCorr = minorCorr;
      bestKey = shift;
      bestQuality = "minor";
    }
  }

  return {
    key: NOTE_NAMES[bestKey],
    quality: bestQuality,
    confidence: Math.max(0, Math.min(100, Math.round(bestCorr * 100))),
  };
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

export function usePitchDetection() {
  const [isListening, setIsListening] = useState(false);
  const [detectedNote, setDetectedNote] = useState<string | null>(null);
  const [detectedKey, setDetectedKey] = useState<string | null>(null);
  const [keyQuality, setKeyQuality] = useState<string>("major");
  const [confidence, setConfidence] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const noteCountsRef = useRef<number[]>(new Array(12).fill(0));
  const sampleCountRef = useRef(0);

  const detect = useCallback(() => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const analyser = analyserRef.current;
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);

    const freq = autoCorrelate(buf, audioContextRef.current.sampleRate);

    if (freq > 60 && freq < 1500) {
      const { note, noteIndex } = frequencyToNote(freq);
      setDetectedNote(note);

      noteCountsRef.current[noteIndex]++;
      sampleCountRef.current++;

      // Analyze key every 10 samples
      if (sampleCountRef.current % 10 === 0 && sampleCountRef.current >= 20) {
        const result = detectKey(noteCountsRef.current);
        setDetectedKey(result.key);
        setKeyQuality(result.quality);
        setConfidence(result.confidence);
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
      analyser.fftSize = 4096; // Higher resolution
      source.connect(analyser);
      analyserRef.current = analyser;

      noteCountsRef.current = new Array(12).fill(0);
      sampleCountRef.current = 0;
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
    setKeyQuality("major");
    setConfidence(0);
    noteCountsRef.current = new Array(12).fill(0);
    sampleCountRef.current = 0;
  }, []);

  useEffect(() => {
    return () => { stopListening(); };
  }, [stopListening]);

  return { isListening, detectedNote, detectedKey, keyQuality, confidence, startListening, stopListening };
}
