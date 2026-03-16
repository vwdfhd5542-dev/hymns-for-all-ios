/**
 * Intelligent local chord generator based on music theory.
 * No API calls, works offline, unlimited usage.
 * Uses common worship/Christian music progressions and phrase analysis.
 */

// Common worship progressions in different keys
const WORSHIP_PROGRESSIONS: Record<string, string[][]> = {
  major: [
    // I - V - vi - IV (most common pop/worship)
    ["C", "G", "Am", "F"],
    ["D", "A", "Bm", "G"],
    ["E", "B", "C#m", "A"],
    ["G", "D", "Em", "C"],
    ["A", "E", "F#m", "D"],
    ["F", "C", "Dm", "Bb"],
  ],
  minor: [
    // i - VI - III - VII
    ["Am", "F", "C", "G"],
    ["Em", "C", "G", "D"],
    ["Dm", "Bb", "F", "C"],
    ["Bm", "G", "D", "A"],
  ],
  bridge: [
    // IV - V - vi - I (bridge/chorus feel)
    ["F", "G", "Am", "C"],
    ["G", "A", "Bm", "D"],
    ["A", "B", "C#m", "E"],
    ["C", "D", "Em", "G"],
  ],
};

// Ending cadences (V - I)
const CADENCES: Record<string, [string, string]> = {
  C: ["G", "C"],
  D: ["A", "D"],
  E: ["B", "E"],
  F: ["C", "F"],
  G: ["D", "G"],
  A: ["E", "A"],
  Am: ["E", "Am"],
  Em: ["B", "Em"],
  Dm: ["A", "Dm"],
  Bm: ["F#", "Bm"],
};

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function detectSections(lines: string[]): { type: "verse" | "chorus" | "bridge" | "empty"; lines: string[] }[] {
  const sections: { type: "verse" | "chorus" | "bridge" | "empty"; lines: string[] }[] = [];
  let current: string[] = [];
  let sectionIndex = 0;

  for (const line of lines) {
    if (line.trim() === "") {
      if (current.length > 0) {
        const type = sectionIndex === 0 ? "verse" : sectionIndex % 2 === 1 ? "chorus" : sectionIndex >= 3 ? "bridge" : "verse";
        sections.push({ type, lines: current });
        sectionIndex++;
        current = [];
      }
      sections.push({ type: "empty", lines: [""] });
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) {
    const type = sectionIndex === 0 ? "verse" : sectionIndex % 2 === 1 ? "chorus" : "bridge";
    sections.push({ type, lines: current });
  }
  return sections;
}

function selectProgression(seed: number, sectionType: "verse" | "chorus" | "bridge"): string[] {
  if (sectionType === "bridge") {
    return WORSHIP_PROGRESSIONS.bridge[seed % WORSHIP_PROGRESSIONS.bridge.length];
  }
  if (sectionType === "chorus") {
    // Chorus uses major progressions shifted
    const prog = WORSHIP_PROGRESSIONS.major[seed % WORSHIP_PROGRESSIONS.major.length];
    // Start from a different point for contrast
    return [prog[3], prog[0], prog[1], prog[2]];
  }
  // Verse alternates major/minor
  const isMajor = seed % 3 !== 0;
  const pool = isMajor ? WORSHIP_PROGRESSIONS.major : WORSHIP_PROGRESSIONS.minor;
  return pool[seed % pool.length];
}

function annotateLine(line: string, chord1: string, chord2?: string): string {
  const words = line.split(/(\s+)/);
  const nonSpaceIndices: number[] = [];
  words.forEach((w, i) => { if (w.trim()) nonSpaceIndices.push(i); });

  if (nonSpaceIndices.length === 0) return line;

  // Place first chord at start
  words[nonSpaceIndices[0]] = `[${chord1}]${words[nonSpaceIndices[0]]}`;

  // Place second chord around the middle if we have enough words
  if (chord2 && nonSpaceIndices.length >= 3) {
    const midIdx = Math.floor(nonSpaceIndices.length / 2);
    words[nonSpaceIndices[midIdx]] = `[${chord2}]${words[nonSpaceIndices[midIdx]]}`;
  }

  return words.join("");
}

/**
 * Generates musically-coherent chord annotations for plain lyrics.
 * If lyrics already contain [Chord] markers, returns them unchanged.
 */
export function generateChords(title: string, artist: string, lyrics: string): string {
  // Already has chords
  if (/\[[A-G][^\]]*\]/.test(lyrics)) {
    return lyrics;
  }

  const seed = hashCode((title + artist).toLowerCase());
  const lines = lyrics.split("\n");
  const sections = detectSections(lines);

  const result: string[] = [];

  for (const section of sections) {
    if (section.type === "empty") {
      result.push("");
      continue;
    }

    const progression = selectProgression(seed, section.type);
    const sectionLines = section.lines;
    const isLastSection = section === sections.filter(s => s.type !== "empty").pop();

    sectionLines.forEach((line, lineIdx) => {
      const progIdx = lineIdx % progression.length;
      const chord1 = progression[progIdx];
      const chord2 = progression[(progIdx + 1) % progression.length];
      const wordCount = line.split(/\s+/).filter(Boolean).length;

      // Last line of last section gets a cadence
      if (isLastSection && lineIdx === sectionLines.length - 1) {
        const key = progression[0];
        const cadence = CADENCES[key];
        if (cadence) {
          result.push(annotateLine(line, cadence[0], cadence[1]));
          return;
        }
      }

      // Short lines get 1 chord, longer lines get 2
      if (wordCount <= 3) {
        result.push(annotateLine(line, chord1));
      } else {
        result.push(annotateLine(line, chord1, chord2));
      }
    });
  }

  return result.join("\n");
}
