import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Level = "basic" | "intermediate" | "advanced";
type Mode = "chord" | "full";

interface SongSection {
  label: string;
  lines: string[];
  chords: string[];
}

const CHORD_REGEX = /\[([^\]]+)\]/g;
const LINE_LABELS = ["e", "B", "G", "D", "A", "E"];
const OPEN_CHORD_SHAPES: Record<string, Array<number | null>> = {
  C: [0, 1, 0, 2, 3, null],
  G: [3, 0, 0, 0, 2, 3],
  Am: [0, 1, 2, 2, 0, null],
  F: [1, 1, 2, 3, 3, 1],
  D: [2, 3, 2, 0, null, null],
  Dm: [1, 3, 2, 0, null, null],
  Em: [0, 0, 0, 2, 2, 0],
  E: [0, 0, 1, 2, 2, 0],
  A: [0, 2, 2, 2, 0, null],
  Bm: [2, 3, 4, 4, 2, null],
  "C#m": [4, 5, 6, 6, 4, null],
  Gm: [3, 3, 3, 5, 5, 3],
};

const levelDescriptions: Record<Level, string> = {
  basic: `- Keep it compact and easy.
- Use open-position or first-position voicings.
- Melody should be clear on strings e and B.
- Use simple bass + melody movement.`,
  intermediate: `- Keep the real hymn melody recognizable.
- Use alternating bass where helpful.
- Add light passing tones and occasional hammer-ons or pull-offs.
- Keep output compact and playable.`,
  advanced: `- Preserve the real sung melody as closely as possible.
- Use independent bass and richer inner voices.
- Add tasteful ornamentation only when musical.
- Keep the arrangement compact; do not over-write repeated sections.`,
};

function extractOrderedChords(text: string): string[] {
  const chords = Array.from(text.matchAll(CHORD_REGEX)).map((match) => match[1].trim()).filter(Boolean);
  return Array.from(new Set(chords));
}

function stripChordMarkup(text: string): string {
  return text.replace(CHORD_REGEX, "").replace(/\n{3,}/g, "\n\n").trim();
}

function cleanLyricLine(line: string): string {
  return line
    .replace(/^\d+\.\s*/, "")
    .replace(/^R:\s*/i, "")
    .replace(/^\/:\s*/, "")
    .replace(/\s*:\/\s*$/, "")
    .trim();
}

function parseSections(lyrics: string): SongSection[] {
  const blocks = lyrics
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  let verseIndex = 1;

  return blocks
    .map((block) => {
      const rawLines = block.split("\n").map((line) => line.trim()).filter(Boolean);
      if (!rawLines.length) return null;

      const firstLine = rawLines[0];
      let label = `Verse ${verseIndex}`;

      if (/^R:/i.test(firstLine)) {
        label = "Chorus";
      } else {
        verseIndex += 1;
      }

      const lines = rawLines.map(cleanLyricLine).filter(Boolean).slice(0, 3);
      const chords = extractOrderedChords(block).slice(0, 6);

      return lines.length ? { label, lines, chords } : null;
    })
    .filter((section): section is SongSection => Boolean(section));
}

function buildSectionDigest(lyrics: string): { form: string; sections: SongSection[] } {
  const sections = parseSections(lyrics);
  const selected: SongSection[] = [];
  let hasVerse = false;
  let hasChorus = false;

  for (const section of sections) {
    if (section.label.startsWith("Verse")) {
      if (hasVerse) continue;
      hasVerse = true;
      selected.push({ ...section, label: "Verse" });
    } else if (section.label === "Chorus") {
      if (hasChorus) continue;
      hasChorus = true;
      selected.push(section);
    } else if (selected.length < 3) {
      selected.push(section);
    }

    if (selected.length >= 3) break;
  }

  if (!selected.length) {
    selected.push({
      label: "Verse",
      lines: stripChordMarkup(lyrics).split("\n").map(cleanLyricLine).filter(Boolean).slice(0, 3),
      chords: extractOrderedChords(lyrics).slice(0, 6),
    });
  }

  const form = selected.map((section) => section.label).join(" + ") || "Verse";
  return { form, sections: selected };
}

function simplifyChordName(chord: string): string {
  const root = chord.split("/")[0].replace(/\([^)]*\)/g, "").trim();
  if (OPEN_CHORD_SHAPES[root]) return root;

  const simplified = root
    .replace(/maj7|maj|sus2|sus4|add\d+|dim|aug/gi, "")
    .replace(/m7/gi, "m")
    .replace(/7|9|11|13/gi, "");

  if (OPEN_CHORD_SHAPES[simplified]) return simplified;
  return simplified.endsWith("m") ? "Am" : "C";
}

function beatSegment(fret: number | null): string {
  if (fret === null) return "------";
  const value = String(fret);
  return `--${value}${"-".repeat(Math.max(0, 4 - value.length))}`;
}

function pickBassString(shape: Array<number | null>): number {
  for (const index of [5, 4, 3]) {
    if (shape[index] !== null) return index;
  }
  return 4;
}

function renderBeatwiseChordLine(chords: string[]): string {
  const beatShapes = Array.from({ length: 4 }, (_, index) => {
    const chord = chords[index] ?? chords[chords.length - 1] ?? "C";
    return OPEN_CHORD_SHAPES[simplifyChordName(chord)] ?? OPEN_CHORD_SHAPES.C;
  });

  return LINE_LABELS.map((label, stringIndex) => {
    const segments = beatShapes.map((shape, beatIndex) => {
      const bassString = pickBassString(shape);
      const activeStrings = [bassString, 2, 1, 0];
      const activeIndex = activeStrings[beatIndex] ?? 0;
      return beatSegment(activeIndex === stringIndex ? shape[stringIndex] : null);
    });

    return `${label}|${segments.join("|")}|`;
  }).join("\n");
}

function buildFallbackTablature(lyrics: string, mode: Mode): string {
  const chordList = extractOrderedChords(lyrics);

  if (mode === "chord") {
    const fallbackChords = chordList.slice(0, 8);
    return fallbackChords
      .map((chord) => `${chord}\n${renderBeatwiseChordLine([chord, chord, chord, chord])}`)
      .join("\n\n");
  }

  const { sections } = buildSectionDigest(lyrics);
  return sections
    .map((section) => {
      const renderedLines = section.lines.slice(0, 2).map((line) => {
        const lineChords = extractOrderedChords(line).slice(0, 4);
        const sectionChords = lineChords.length ? lineChords : section.chords.slice(0, 4);
        return `[${section.label} - "${line}"]\n${renderBeatwiseChordLine(sectionChords)}`;
      });

      return renderedLines.join("\n\n");
    })
    .join("\n\n");
}

function buildPrompt(params: {
  artist?: string;
  form: string;
  level: Level;
  lyrics: string;
  mode: Mode;
  sectionDigest: SongSection[];
  title: string;
  chordList: string[];
}): string {
  const { artist, form, level, mode, sectionDigest, title, chordList } = params;
  const sectionSummary = sectionDigest
    .map((section) => `${section.label}\nLyrics: ${section.lines.join(" / ")}\nChords: ${section.chords.join(", ")}`)
    .join("\n\n");

  if (mode === "chord") {
    return `You are a Romanian hymn guitarist.

Create ONE compact fingerpicking measure for each chord in "${title}" by ${artist || "Traditional"}.
Chords: ${chordList.join(", ")}
Reference lyric excerpt: ${stripChordMarkup(params.lyrics).split("\n").map(cleanLyricLine).filter(Boolean).slice(0, 2).join(" / ")}
Difficulty: ${level}
${levelDescriptions[level]}

Rules:
- Return only plain text tablature.
- One measure per chord.
- Keep each pattern short and playable.
- Standard guitar tab only: e B G D A E.
- No explanations, no markdown.`;
  }

  return `You are a Romanian hymn transcriber.

Create a FAST, compact fingerstyle arrangement for "${title}" by ${artist || "Traditional Romanian hymn"}.
Detected song form: ${form}.
Generate ONLY unique sections, not every repeated verse.
If verses repeat the same melody, write one Verse template only.

Section digest:
${sectionSummary}

Difficulty: ${level}
${levelDescriptions[level]}

Hard limits:
- Max 4 sections total.
- Max 8 bars per section.
- Output only [Intro], [Verse], [Chorus], [Outro] when needed.
- Keep the total answer under 140 lines.
- Standard guitar tab only.
- No explanations, no markdown.`;
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return error.name === "AbortError" || error.name === "TimeoutError" || /aborted|timeout/i.test(error.message);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lyrics, title, artist, level = "basic", mode = "chord" } = await req.json() as {
      lyrics: string;
      title: string;
      artist?: string;
      level?: Level;
      mode?: Mode;
    };

    const startedAt = Date.now();
    const chordList = extractOrderedChords(lyrics);
    const { form, sections } = buildSectionDigest(lyrics);
    const prompt = buildPrompt({
      artist,
      form,
      level,
      lyrics,
      mode,
      sectionDigest: sections,
      title,
      chordList,
    });

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(mode === "full" ? 18000 : 12000),
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a professional guitar transcriber for Romanian Christian hymns.
Preserve recognizable melody, but keep the output compact.
Return only plain text guitar tablature.
Never use markdown code blocks.
Never repeat identical sections verbatim.`
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.1,
          max_tokens: mode === "full" ? 1800 : 900,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const tablature = (data.choices?.[0]?.message?.content?.trim() || "")
          .replace(/```[a-z]*\n?/g, "")
          .replace(/```$/g, "")
          .trim();

        if (tablature) {
          console.info(`[generate-tablature] AI success in ${Date.now() - startedAt}ms (${mode}/${level})`);
          return new Response(JSON.stringify({ tablature, source: "ai" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        const text = await response.text();
        console.error("[generate-tablature] AI gateway error:", response.status, text);
      }
    } catch (error) {
      console.error("[generate-tablature] AI request failed:", error);
      if (!isTimeoutError(error)) {
        console.warn("[generate-tablature] Falling back after non-timeout AI failure");
      }
    }

    const fallback = buildFallbackTablature(lyrics, mode);
    console.info(`[generate-tablature] Fallback success in ${Date.now() - startedAt}ms (${mode}/${level})`);

    return new Response(JSON.stringify({ tablature: fallback, source: "fallback" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[generate-tablature] Fatal error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
