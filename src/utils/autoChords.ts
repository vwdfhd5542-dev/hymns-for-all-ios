/**
 * Local chord generator — no API calls, no credits.
 * Assigns chords based on common progressions for Christian/worship music.
 */

const PROGRESSIONS_MAJOR = [
  ["C", "G", "Am", "F"],
  ["G", "D", "Em", "C"],
  ["D", "A", "Bm", "G"],
  ["E", "B", "C#m", "A"],
  ["F", "C", "Dm", "Bb"],
  ["A", "E", "F#m", "D"],
];

const PROGRESSIONS_MINOR = [
  ["Am", "F", "C", "G"],
  ["Em", "C", "G", "D"],
  ["Dm", "Bb", "F", "C"],
  ["Bm", "G", "D", "A"],
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pickProgression(title: string, artist: string) {
  const seed = hashString((title + artist).toLowerCase());
  const allProgs = [...PROGRESSIONS_MAJOR, ...PROGRESSIONS_MINOR];
  return allProgs[seed % allProgs.length];
}

function isEmptyOrWhitespace(line: string) {
  return line.trim().length === 0;
}

/**
 * Generates chord annotations for plain lyrics.
 * If lyrics already contain [Chord] markers, returns them as-is.
 */
export function generateChords(title: string, artist: string, lyrics: string): string {
  // If already has chords, return as-is
  if (lyrics.includes("[") && lyrics.includes("]")) {
    return lyrics;
  }

  const progression = pickProgression(title, artist);
  const lines = lyrics.split("\n");
  let chordIndex = 0;

  const result = lines.map((line) => {
    if (isEmptyOrWhitespace(line)) return line;

    const words = line.split(/(\s+)/);
    const nonSpaceWords = words.filter((w) => w.trim().length > 0);

    if (nonSpaceWords.length === 0) return line;

    // Place 1-2 chords per line depending on word count
    const chordsPerLine = nonSpaceWords.length >= 4 ? 2 : 1;
    const positions: number[] = [0];
    if (chordsPerLine === 2) {
      positions.push(Math.floor(nonSpaceWords.length / 2));
    }

    let wordIdx = 0;
    const annotated = words.map((segment) => {
      if (segment.trim().length === 0) return segment;
      const currentWordIdx = wordIdx;
      wordIdx++;

      if (positions.includes(currentWordIdx)) {
        const chord = progression[chordIndex % progression.length];
        chordIndex++;
        return `[${chord}]${segment}`;
      }
      return segment;
    });

    return annotated.join("");
  });

  return result.join("\n");
}
