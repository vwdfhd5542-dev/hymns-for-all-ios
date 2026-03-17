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
    const { title, artist, lyrics } = await req.json();

    const GEMINI_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
    if (!GEMINI_KEY) {
      throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
    }

    const prompt = `You are an expert musician specializing in Romanian Christian hymns (imnuri creștine). Your task: add the REAL, accurate guitar chords to the following song lyrics.

CRITICAL INSTRUCTIONS — FOLLOW IN ORDER:

STEP 1 — MANDATORY RESEARCH:
Before generating ANY chords, you MUST recall or search your training data for the REAL chord progression of this specific song. Check your knowledge of:
- "Resurse Creștine" (resurse-crestine.ro) chord charts
- Popular YouTube performances and tutorials of this exact hymn
- Romanian Christian songbooks: Speranța, Boanerges, Eldad, Elim Harmony
- Any known published chord sheet for "${title}" by "${artist || "Unknown"}"
If you have seen this song's chords in your training data, USE THOSE EXACT CHORDS. Do not simplify or substitute them.

STEP 2 — PRIORITIZE THE REAL VERSION:
- If the song is known to use specific chords (e.g., E7, Am, D7, G#m, Cmaj7), you MUST use them exactly as they appear in the real version.
- Do NOT replace rich chords with simplified versions. If the original uses E7, do NOT replace it with E. If it uses Am7, keep Am7.
- The harmonic richness of the original arrangement must be preserved: dominant 7ths, minor 7ths, diminished, augmented — whatever the real song uses.
- Example: "Dac-asculți de Dumnezeu" uses G → E → Am progression. If you know this, use it exactly.

STEP 3 — ONLY IF UNKNOWN:
If and ONLY if you have absolutely no knowledge of this specific song's chords, then analyze the melody and lyrics to deduce an appropriate progression that fits the style of Romanian Christian worship music. Even in this case, use musically rich chords — not just major triads.

STEP 4 — FORMAT:
1. Insert chord names in square brackets like [Am], [E7], [G#m], [Cmaj7] DIRECTLY before the syllable where the chord should be played
2. Every line should have at least one chord
3. Keep ALL original lyrics exactly unchanged — only ADD [Chord] markers
4. Return ONLY the modified lyrics with chords. No explanations, no markdown, no code blocks, no commentary.

EXAMPLE OUTPUT:
[G]Dac-asculți de [E]Dumnezeu,
[Am]Binecuvântat vei [D7]fi mereu,

NOW ADD THE REAL CHORDS TO THIS SONG:
Title: ${title}
Artist: ${artist || "Unknown"}

${lyrics}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 },
      }),
    });

    const rawText = await response.text();
    console.log("Gemini status:", response.status);

    if (!response.ok) {
      console.error("Gemini error:", rawText.substring(0, 500));
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = JSON.parse(rawText);
    let chordsLyrics = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!chordsLyrics) {
      console.error("No content in Gemini response:", rawText.substring(0, 500));
      throw new Error("Gemini did not return content");
    }

    chordsLyrics = chordsLyrics.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "").trim();

    if (!chordsLyrics.includes("[")) {
      console.warn("Response has no chord brackets");
      throw new Error("NO_CHORDS_GENERATED");
    }

    return new Response(JSON.stringify({ lyrics: chordsLyrics }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
