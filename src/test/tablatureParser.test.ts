import { describe, it, expect } from "vitest";

// Copy the parser logic for testing
const OPEN_STRINGS = [329.63, 246.94, 196.00, 146.83, 110.00, 82.41];

function fretToFreq(stringIndex: number, fret: number): number {
  return OPEN_STRINGS[stringIndex] * Math.pow(2, fret / 12);
}

interface TabNote { time: number; freq: number; duration: number; }

function parseTablature(tab: string): TabNote[] {
  const lines = tab.split("\n");
  const notes: TabNote[] = [];
  const stringOrder = ["e", "B", "G", "D", "A", "E"];
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
      const mapped = group.map(g => ({ content: g.content, label: g.label }));
      const maxLen = Math.max(...mapped.map(m => m.content.length));
      const tempo = 0.15;

      for (let col = 0; col < maxLen; col++) {
        for (let str = 0; str < 6; str++) {
          const ch = mapped[str].content[col];
          if (!ch || !/\d/.test(ch)) continue;
          if (col > 0) {
            const prevCh = mapped[str].content[col - 1];
            if (prevCh && /\d/.test(prevCh)) continue;
          }
          let fretStr = ch;
          const nextCh = mapped[str].content[col + 1];
          if (nextCh && /\d/.test(nextCh)) fretStr += nextCh;
          const fret = parseInt(fretStr);
          if (isNaN(fret) || fret >= 25) continue;
          notes.push({ time: groupTimeOffset + col * tempo, freq: fretToFreq(str, fret), duration: 0.5 });
        }
      }
      groupTimeOffset += maxLen * tempo + 0.1;
      i = j;
    } else {
      i = j > i ? j : i + 1;
    }
  }
  notes.sort((a, b) => a.time - b.time);
  return notes;
}

describe("parseTablature", () => {
  it("parses basic C chord pattern", () => {
    const tab = `C
e|-------0-----------0---|
B|-----------1-----------|
G|---0-----------0-------|
D|-----2-------2---------|
A|-3-------3-------------|
E|-----------------------|`;
    
    const notes = parseTablature(tab);
    expect(notes.length).toBeGreaterThan(0);
    console.log(`Parsed ${notes.length} notes from basic C pattern`);
    notes.forEach(n => console.log(`  t=${n.time.toFixed(2)} freq=${n.freq.toFixed(1)}`));
  });

  it("parses multi-chord tablature", () => {
    const tab = `C
e|-------0-----------0---|
B|-----------1-----------|
G|---0-----------0-------|
D|-----2-------2---------|
A|-3-------3-------------|
E|-----------------------|

G
e|-------3-----------3---|
B|-----------0-----------|
G|---0-----------0-------|
D|-----0-------0---------|
A|-----------------------|
E|-3-------3-------------|`;

    const notes = parseTablature(tab);
    expect(notes.length).toBeGreaterThan(5);
    console.log(`Parsed ${notes.length} notes from multi-chord pattern`);
  });

  it("parses full song tablature with headers", () => {
    const tab = `[Intro]
e|-------0-----------|-------3-----------|
B|---1-------1-------|---0-------0-------|
G|-----0-------0-----|-----0-------0-----|
D|---------2---------|---------0---------|
A|-3-----------------|--------------------|
E|-------------------|-3-----------------|`;

    const notes = parseTablature(tab);
    expect(notes.length).toBeGreaterThan(0);
    console.log(`Parsed ${notes.length} notes from full song intro`);
  });

  it("parses advanced tablature with h and p notations", () => {
    const tab = `C
e|-------0h3p0-------0---|
B|---1-----------1-------|
G|-----0-------0-------0-|
D|---------2-------2-----|
A|---3-------------------|
E|-----------------------|`;

    const notes = parseTablature(tab);
    expect(notes.length).toBeGreaterThan(0);
    console.log(`Parsed ${notes.length} notes from advanced pattern`);
    notes.forEach(n => console.log(`  t=${n.time.toFixed(2)} freq=${n.freq.toFixed(1)}`));
  });
});
