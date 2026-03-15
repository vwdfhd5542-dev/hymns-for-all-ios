// Guitar chord diagram data
// Each chord: frets array (6 strings, low E to high E), -1 = muted, 0 = open
// barres: optional barre definitions

export interface ChordDiagramData {
  name: string;
  frets: number[]; // 6 strings: E A D G B e
  fingers: number[]; // finger numbers (0 = open/mute)
  barres?: { fret: number; from: number; to: number }[];
  baseFret?: number; // 1 if open position
}

export const chordDiagrams: Record<string, ChordDiagramData> = {
  // Major chords
  C:     { name: "C",     frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  D:     { name: "D",     frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  E:     { name: "E",     frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  F:     { name: "F",     frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barres: [{ fret: 1, from: 0, to: 5 }] },
  G:     { name: "G",     frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  A:     { name: "A",     frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  B:     { name: "B",     frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barres: [{ fret: 2, from: 1, to: 5 }] },

  // Minor chords
  Am:    { name: "Am",    frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  Bm:    { name: "Bm",    frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barres: [{ fret: 2, from: 1, to: 5 }] },
  Cm:    { name: "Cm",    frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3, barres: [{ fret: 3, from: 1, to: 5 }] },
  Dm:    { name: "Dm",    frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  Em:    { name: "Em",    frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  Fm:    { name: "Fm",    frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], barres: [{ fret: 1, from: 0, to: 5 }] },
  Gm:    { name: "Gm",    frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barres: [{ fret: 3, from: 0, to: 5 }] },

  // Sharps/flats
  "C#":  { name: "C#",   frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barres: [{ fret: 4, from: 1, to: 5 }] },
  "Db":  { name: "Db",   frets: [-1, 4, 6, 6, 6, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barres: [{ fret: 4, from: 1, to: 5 }] },
  "D#":  { name: "D#",   frets: [-1, -1, 1, 3, 4, 3], fingers: [0, 0, 1, 2, 4, 3] },
  "Eb":  { name: "Eb",   frets: [-1, -1, 1, 3, 4, 3], fingers: [0, 0, 1, 2, 4, 3] },
  "F#":  { name: "F#",   frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], barres: [{ fret: 2, from: 0, to: 5 }] },
  "Gb":  { name: "Gb",   frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], barres: [{ fret: 2, from: 0, to: 5 }] },
  "G#":  { name: "G#",   frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barres: [{ fret: 4, from: 0, to: 5 }] },
  "Ab":  { name: "Ab",   frets: [4, 6, 6, 5, 4, 4], fingers: [1, 3, 4, 2, 1, 1], baseFret: 4, barres: [{ fret: 4, from: 0, to: 5 }] },
  "A#":  { name: "A#",   frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], barres: [{ fret: 1, from: 1, to: 5 }] },
  "Bb":  { name: "Bb",   frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], barres: [{ fret: 1, from: 1, to: 5 }] },

  "C#m": { name: "C#m",  frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barres: [{ fret: 4, from: 1, to: 5 }] },
  "Dbm": { name: "Dbm",  frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barres: [{ fret: 4, from: 1, to: 5 }] },
  "D#m": { name: "D#m",  frets: [-1, -1, 1, 3, 4, 2], fingers: [0, 0, 1, 3, 4, 2] },
  "Ebm": { name: "Ebm",  frets: [-1, -1, 1, 3, 4, 2], fingers: [0, 0, 1, 3, 4, 2] },
  "F#m": { name: "F#m",  frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barres: [{ fret: 2, from: 0, to: 5 }] },
  "Gbm": { name: "Gbm",  frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barres: [{ fret: 2, from: 0, to: 5 }] },
  "G#m": { name: "G#m",  frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barres: [{ fret: 4, from: 0, to: 5 }] },
  "Abm": { name: "Abm",  frets: [4, 6, 6, 4, 4, 4], fingers: [1, 3, 4, 1, 1, 1], baseFret: 4, barres: [{ fret: 4, from: 0, to: 5 }] },
  "A#m": { name: "A#m",  frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], barres: [{ fret: 1, from: 1, to: 5 }] },
  "Bbm": { name: "Bbm",  frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], barres: [{ fret: 1, from: 1, to: 5 }] },

  // 7th chords
  C7:    { name: "C7",    frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  D7:    { name: "D7",    frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  E7:    { name: "E7",    frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  F7:    { name: "F7",    frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], barres: [{ fret: 1, from: 0, to: 5 }] },
  G7:    { name: "G7",    frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  A7:    { name: "A7",    frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0] },
  B7:    { name: "B7",    frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },

  // Maj7 chords
  Cmaj7: { name: "Cmaj7", frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  Dmaj7: { name: "Dmaj7", frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 2, 3] },
  Emaj7: { name: "Emaj7", frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0] },
  Fmaj7: { name: "Fmaj7", frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
  Gmaj7: { name: "Gmaj7", frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1] },
  Amaj7: { name: "Amaj7", frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },

  // Minor 7th
  Am7:   { name: "Am7",   frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  Bm7:   { name: "Bm7",   frets: [-1, 2, 4, 2, 3, 2], fingers: [0, 1, 3, 1, 2, 1], barres: [{ fret: 2, from: 1, to: 5 }] },
  Dm7:   { name: "Dm7",   frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
  Em7:   { name: "Em7",   frets: [0, 2, 0, 0, 0, 0], fingers: [0, 1, 0, 0, 0, 0] },
  "F#m7":{ name: "F#m7",  frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1], barres: [{ fret: 2, from: 0, to: 5 }] },
  "G#m7":{ name: "G#m7",  frets: [4, 6, 4, 4, 4, 4], fingers: [1, 3, 1, 1, 1, 1], baseFret: 4, barres: [{ fret: 4, from: 0, to: 5 }] },
  "C#m7":{ name: "C#m7",  frets: [-1, 4, 6, 4, 5, 4], fingers: [0, 1, 3, 1, 2, 1], baseFret: 4, barres: [{ fret: 4, from: 1, to: 5 }] },

  // Sus chords
  Dsus2: { name: "Dsus2", frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] },
  Dsus4: { name: "Dsus4", frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3] },
  Asus2: { name: "Asus2", frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
  Asus4: { name: "Asus4", frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },
  Esus4: { name: "Esus4", frets: [0, 2, 2, 2, 0, 0], fingers: [0, 1, 2, 3, 0, 0] },
  Gsus4: { name: "Gsus4", frets: [3, 3, 0, 0, 1, 3], fingers: [2, 3, 0, 0, 1, 4] },
  Gsus2: { name: "Gsus2", frets: [3, 0, 0, 0, 3, 3], fingers: [1, 0, 0, 0, 2, 3] },
  Csus4: { name: "Csus4", frets: [-1, 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 2] },
  Csus2: { name: "Csus2", frets: [-1, 3, 0, 0, 1, 0], fingers: [0, 2, 0, 0, 1, 0] },

  // Add9
  Cadd9: { name: "Cadd9", frets: [-1, 3, 2, 0, 3, 0], fingers: [0, 2, 1, 0, 3, 0] },
  Gadd9: { name: "Gadd9", frets: [3, 2, 0, 2, 0, 3], fingers: [3, 1, 0, 2, 0, 4] },
  Dadd9: { name: "Dadd9", frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] },
  Eadd9: { name: "Eadd9", frets: [0, 2, 2, 1, 0, 2], fingers: [0, 2, 3, 1, 0, 4] },
  Aadd9: { name: "Aadd9", frets: [-1, 0, 2, 4, 2, 0], fingers: [0, 0, 1, 3, 2, 0] },
  Fadd9: { name: "Fadd9", frets: [-1, -1, 3, 2, 1, 3], fingers: [0, 0, 3, 2, 1, 4] },
};

// Enrichment map: musically sensible chord substitutions that "flower" the song
// These are chosen to sound good as drop-in replacements
export const chordEnrichmentMap: Record<string, string> = {
  // Major → richer voicings
  C: "Cmaj7",
  D: "Dsus2",
  E: "Eadd9",
  F: "Fmaj7",
  G: "Gadd9",
  A: "Asus2",
  B: "B7",

  // Minor → minor 7ths (warmer, jazzier)
  Am: "Am7",
  Bm: "Bm7",
  Cm: "Cm",    // keep as-is (already rich)
  Dm: "Dm7",
  Em: "Em7",
  Fm: "Fm",
  Gm: "Gm",

  // Sharps/flats
  "F#m": "F#m7",
  "C#m": "C#m7",
  "G#m": "G#m7",
  "Bb": "Bb",
  "Eb": "Eb",
  "Ab": "Ab",
};
