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

    // CRITICAL: Strip any existing chord markers so Gemini generates fresh chords
    const cleanLyrics = lyrics.replace(/\[[^\]]*\]/g, "").trim();

    const prompt = `You are an expert musician specializing in Romanian Christian hymns (imnuri creștine). Your task: add the REAL, accurate guitar chords to the following song lyrics.

CRITICAL INSTRUCTIONS — FOLLOW IN ORDER:

STEP 1 — USE GOOGLE SEARCH:
You have access to Google Search. BEFORE generating any chords, you MUST search for the real chords of this song.
Search queries to try (in this order):
1. "${title}" "${artist || ""}" acorduri chitară
2. "${title}" acorduri resurse-crestine.ro
3. "${title}" guitar chords Romanian hymn
4. "${title}" acorduri

Analyze the search results carefully. If you find chord charts from sites like resurse-crestine.ro, acorduri.cantari.ro, or any Romanian Christian music site, USE THOSE EXACT CHORDS.

STEP 2 — PRIORITIZE THE REAL VERSION:
- If the search results show specific chords (e.g., E7, Am, D7, G#m, Cmaj7), you MUST use them exactly as they appear.
- Do NOT replace rich chords with simplified versions. If the original uses E7, do NOT replace it with E. If it uses Am7, keep Am7.
- The harmonic richness of the original arrangement must be preserved: dominant 7ths, minor 7ths, diminished, augmented — whatever the real song uses.
- Pay special attention to chord PLACEMENT — the chord must go exactly where the harmony changes, not just at the beginning of each line.

STEP 3 — ONLY IF NOT FOUND ONLINE:
If and ONLY if you cannot find this specific song's chords through search, then use your musical knowledge to deduce an appropriate progression. Even in this case, use musically rich chords appropriate for Romanian Christian worship music — not just basic major triads.

STEP 4 — FORMAT:
1. Insert chord names in square brackets like [Am], [E7], [G#m], [Cmaj7] DIRECTLY before the syllable where the chord should be played
2. Every line should have at least one chord
3. Keep ALL original lyrics exactly unchanged — only ADD [Chord] markers
4. Return ONLY the modified lyrics with chords. No explanations, no markdown, no code blocks, no commentary, no "Title:" or "Artist:" headers.

NOW ADD THE REAL CHORDS TO THIS SONG:
Title: ${title}
Artist: ${artist || "Unknown"}

${cleanLyrics}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
        tools: [{ google_search: {} }],
      }),
    });

    const rawText = await response.text();
    console.log("Gemini status:", response.status);

    if (!response.ok) {
      console.error("Gemini error:", rawText.substring(0, 500));
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = JSON.parse(rawText);
    
    // Extract text from all parts (Gemini with search may return multiple parts)
    const parts = data.candidates?.[0]?.content?.parts || [];
    let chordsLyrics = parts
      .filter((p: any) => p.text)
      .map((p: any) => p.text)
      .join("")
      .trim();

    // Log search grounding info if present
    const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
    if (groundingMetadata?.searchEntryPoint) {
      console.log("Search grounding was used");
    }
    if (groundingMetadata?.groundingChunks) {
      console.log("Grounding sources:", groundingMetadata.groundingChunks.length);
    }

    if (!chordsLyrics) {
      console.error("No content in Gemini response:", rawText.substring(0, 500));
      throw new Error("Gemini did not return content");
    }

    chordsLyrics = chordsLyrics.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "").trim();
    
    // Remove any "Title:" or "Artist:" header lines the model might add
    chordsLyrics = chordsLyrics.replace(/^(Title|Artist|Titlu|Autor):.*\n?/gim, "").trim();

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
