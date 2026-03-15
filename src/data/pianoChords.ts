export interface PianoChordData {
  name: string;
  notes: string[]; // e.g. ["C", "E", "G"]
}

export const pianoChords: Record<string, PianoChordData> = {
  // Major
  C:     { name: "C",     notes: ["C", "E", "G"] },
  D:     { name: "D",     notes: ["D", "F#", "A"] },
  E:     { name: "E",     notes: ["E", "G#", "B"] },
  F:     { name: "F",     notes: ["F", "A", "C"] },
  G:     { name: "G",     notes: ["G", "B", "D"] },
  A:     { name: "A",     notes: ["A", "C#", "E"] },
  B:     { name: "B",     notes: ["B", "D#", "F#"] },

  // Minor
  Am:    { name: "Am",    notes: ["A", "C", "E"] },
  Bm:    { name: "Bm",    notes: ["B", "D", "F#"] },
  Cm:    { name: "Cm",    notes: ["C", "D#", "G"] },
  Dm:    { name: "Dm",    notes: ["D", "F", "A"] },
  Em:    { name: "Em",    notes: ["E", "G", "B"] },
  Fm:    { name: "Fm",    notes: ["F", "G#", "C"] },
  Gm:    { name: "Gm",    notes: ["G", "A#", "D"] },

  // Sharps/flats major
  "C#":  { name: "C#",    notes: ["C#", "F", "G#"] },
  "Db":  { name: "Db",    notes: ["C#", "F", "G#"] },
  "D#":  { name: "D#",    notes: ["D#", "G", "A#"] },
  "Eb":  { name: "Eb",    notes: ["D#", "G", "A#"] },
  "F#":  { name: "F#",    notes: ["F#", "A#", "C#"] },
  "Gb":  { name: "Gb",    notes: ["F#", "A#", "C#"] },
  "G#":  { name: "G#",    notes: ["G#", "C", "D#"] },
  "Ab":  { name: "Ab",    notes: ["G#", "C", "D#"] },
  "A#":  { name: "A#",    notes: ["A#", "D", "F"] },
  "Bb":  { name: "Bb",    notes: ["A#", "D", "F"] },

  // Sharps/flats minor
  "C#m": { name: "C#m",   notes: ["C#", "E", "G#"] },
  "Dbm": { name: "Dbm",   notes: ["C#", "E", "G#"] },
  "D#m": { name: "D#m",   notes: ["D#", "F#", "A#"] },
  "Ebm": { name: "Ebm",   notes: ["D#", "F#", "A#"] },
  "F#m": { name: "F#m",   notes: ["F#", "A", "C#"] },
  "Gbm": { name: "Gbm",   notes: ["F#", "A", "C#"] },
  "G#m": { name: "G#m",   notes: ["G#", "B", "D#"] },
  "Abm": { name: "Abm",   notes: ["G#", "B", "D#"] },
  "A#m": { name: "A#m",   notes: ["A#", "C#", "F"] },
  "Bbm": { name: "Bbm",   notes: ["A#", "C#", "F"] },

  // 7th
  C7:    { name: "C7",    notes: ["C", "E", "G", "A#"] },
  D7:    { name: "D7",    notes: ["D", "F#", "A", "C"] },
  E7:    { name: "E7",    notes: ["E", "G#", "B", "D"] },
  F7:    { name: "F7",    notes: ["F", "A", "C", "D#"] },
  G7:    { name: "G7",    notes: ["G", "B", "D", "F"] },
  A7:    { name: "A7",    notes: ["A", "C#", "E", "G"] },
  B7:    { name: "B7",    notes: ["B", "D#", "F#", "A"] },

  // Maj7
  Cmaj7: { name: "Cmaj7", notes: ["C", "E", "G", "B"] },
  Dmaj7: { name: "Dmaj7", notes: ["D", "F#", "A", "C#"] },
  Emaj7: { name: "Emaj7", notes: ["E", "G#", "B", "D#"] },
  Fmaj7: { name: "Fmaj7", notes: ["F", "A", "C", "E"] },
  Gmaj7: { name: "Gmaj7", notes: ["G", "B", "D", "F#"] },
  Amaj7: { name: "Amaj7", notes: ["A", "C#", "E", "G#"] },

  // Minor 7th
  Am7:   { name: "Am7",   notes: ["A", "C", "E", "G"] },
  Bm7:   { name: "Bm7",   notes: ["B", "D", "F#", "A"] },
  Dm7:   { name: "Dm7",   notes: ["D", "F", "A", "C"] },
  Em7:   { name: "Em7",   notes: ["E", "G", "B", "D"] },
  "F#m7":{ name: "F#m7",  notes: ["F#", "A", "C#", "E"] },
  "G#m7":{ name: "G#m7",  notes: ["G#", "B", "D#", "F#"] },
  "C#m7":{ name: "C#m7",  notes: ["C#", "E", "G#", "B"] },

  // Sus
  Dsus2: { name: "Dsus2", notes: ["D", "E", "A"] },
  Dsus4: { name: "Dsus4", notes: ["D", "G", "A"] },
  Asus2: { name: "Asus2", notes: ["A", "B", "E"] },
  Asus4: { name: "Asus4", notes: ["A", "D", "E"] },
  Esus4: { name: "Esus4", notes: ["E", "A", "B"] },
  Gsus4: { name: "Gsus4", notes: ["G", "C", "D"] },
  Gsus2: { name: "Gsus2", notes: ["G", "A", "D"] },
  Csus4: { name: "Csus4", notes: ["C", "F", "G"] },
  Csus2: { name: "Csus2", notes: ["C", "D", "G"] },

  // Add9
  Cadd9: { name: "Cadd9", notes: ["C", "E", "G", "D"] },
  Gadd9: { name: "Gadd9", notes: ["G", "B", "D", "A"] },
  Dadd9: { name: "Dadd9", notes: ["D", "F#", "A", "E"] },
  Eadd9: { name: "Eadd9", notes: ["E", "G#", "B", "F#"] },
  Aadd9: { name: "Aadd9", notes: ["A", "C#", "E", "B"] },
  Fadd9: { name: "Fadd9", notes: ["F", "A", "C", "G"] },
};
