import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lyrics, title, artist, level, mode } = await req.json();

    const GEMINI_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_KEY) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    }

    const chordRegex = /\[([^\]]+)\]/g;
    const chords = new Set<string>();
    let match;
    while ((match = chordRegex.exec(lyrics)) !== null) {
      chords.add(match[1]);
    }
    const chordList = Array.from(chords).join(", ");
    const pureLyrics = lyrics.replace(/\[([^\]]+)\]/g, "").trim();

    const levelDescriptions: Record<string, string> = {
      basic: `Simple fingerpicking: thumb plays root bass note on beats 1 and 3, index and middle alternate on treble strings playing the melody.
- Use ONLY open position chords (frets 0-3).
- The melody MUST follow the real sung melody of the hymn.
- Keep a steady, repetitive pattern per chord. Travis picking style.`,
      intermediate: `Intermediate fingerpicking with thumb-index-middle-ring (p-i-m-a):
- Thumb plays alternating bass (root + 5th) on strings 4-6, beats 1 and 3.
- Fingers play the REAL melody of the hymn on strings 1-3.
- Add hammer-ons (h) and pull-offs (p) for ornamentation.
- Include passing tones between chord changes.`,
      advanced: `Advanced fingerstyle solo guitar arrangement:
- Strings 1-2: EXACT melody of the hymn, note for note as it is actually sung.
- Strings 4-6: Independent bass line with alternating bass (root + 5th) Travis picking on beats 1 and 3.
- Strings 2-3: Harmonic fill between melody and bass.
- Use hammer-ons (h), pull-offs (p), slides (/,\\), and natural harmonics where musical.
- This must sound like a complete solo guitar arrangement of the hymn.`,
    };

    const systemPrompt = `You are a professional guitar transcriber who specializes in Romanian Christian hymns (imnuri creștine).
You have deep knowledge of Romanian hymn melodies from collections like Speranța, Boanerges, and Elim Harmony.
You transcribe the REAL melodies faithfully — the melody must match what is actually sung in churches.
Output ONLY plain text guitar tablature. Never use markdown code blocks. Never add explanations.`;

    let prompt: string;

    if (mode === "chord") {
      prompt = `Generate a fingerpicking tablature pattern for each of these chords used in the hymn "${title}": ${chordList}

The hymn "${title}" by ${artist || "Traditional"} has this melody in its lyrics:
${pureLyrics.substring(0, 300)}

Difficulty: ${level}
${levelDescriptions[level] || levelDescriptions.basic}

CRITICAL - MELODY ACCURACY:
- You MUST know this hymn. "${title}" is a well-known Romanian Christian hymn.
- The melody notes on the treble strings MUST match the actual sung melody of this hymn for each chord section.
- Do NOT invent a random melody. Use the real melody.

FORMATTING RULES:
- Standard guitar tab: e, B, G, D, A, E (high to low)
- Each pattern = 1 measure in 4/4, with bar lines | between beats
- Numbers = frets, - = rest, h = hammer-on, p = pull-off
- Chord name on its own line above each pattern
- ONLY output tablature. No explanations, no markdown code blocks.

Example:
Am
e|--0---|--1---|--0---|--0---|
B|--1---|--1---|--1---|--1---|
G|--2---|--2---|--2---|--2---|
D|------|--2---|------|--2---|
A|--0---|------|--0---|------|
E|------|------|------|------|`;
    } else {
      prompt = `Create a complete fingerstyle guitar tablature for this hymn:

Title: "${title}"
Artist: ${artist || "Traditional Romanian hymn"}
Chords used: ${chordList}

Lyrics:
${pureLyrics}

Difficulty: ${level}
${levelDescriptions[level] || levelDescriptions.basic}

CRITICAL - THIS IS THE MOST IMPORTANT RULE:
"${title}" is a known Romanian Christian hymn. You MUST use your knowledge of how this hymn is actually sung.
- The melody notes on strings 1-2 MUST follow the REAL sung melody, note by note, syllable by syllable.
- Match the rhythm of the words to the note placement in the tablature.
- The bass notes must follow the chord progression as written in the lyrics.

SECTION LABELING:
- Label each section: [Intro], [Verse 1], [Chorus], [Verse 2], etc.
- Under each label, write the lyrics being played in that section.

FORMATTING RULES:
- Standard guitar tab: e, B, G, D, A, E (high to low)
- Bar lines | every 4 beats (4/4 time)
- Numbers = frets, - = rest, h = hammer-on, p = pull-off, / = slide up, \\\\ = slide down
- Output ONLY tablature with section headers and lyrics. No markdown, no explanations.

Example:
[Verse 1 - "First line of the hymn..."]
e|--0---1---|--3---1---|--0---0---|--1---0---|
B|--1---1---|--0---0---|--1---1---|--1---1---|
G|--0---0---|--0---0---|--2---2---|--0---0---|
D|--2-------|--0-------|--2-------|--2-------|
A|--0-------|------2---|--0-------|--3-------|
E|----------|----------|----------|----------|`;
    }

    const fullPrompt = `${systemPrompt}\n\n${prompt}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.2 },
        }),
      });

      clearTimeout(timeoutId);

      const rawText = await response.text();
      console.log("Gemini status:", response.status);

      if (!response.ok) {
        console.error("Gemini error:", rawText.substring(0, 500));
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = JSON.parse(rawText);
      let tablature = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      tablature = tablature.replace(/```[a-z]*\n?/g, "").replace(/```$/g, "").trim();

      return new Response(JSON.stringify({ tablature }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
