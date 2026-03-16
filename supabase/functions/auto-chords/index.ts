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

    const prompt = `You are an expert musician. Your task: add guitar chords to the following song lyrics.

INSTRUCTIONS:
1. Insert chord names in square brackets like [Am], [C], [G7] DIRECTLY before the syllable where the chord should be played
2. Use standard chord notation: C, Dm, Em, F, G, Am, Bm, C#m, G7, Cmaj7, etc.
3. Choose chords that fit a typical harmonic progression for this style of music
4. Every line should have at least one chord
5. Keep ALL original lyrics exactly unchanged - only ADD [Chord] markers
6. Return ONLY the modified lyrics with chords. No explanations, no markdown, no code blocks.

EXAMPLE INPUT:
Aleluia, slavă Domnului,
Aleluia, slavă Regelui,

EXAMPLE OUTPUT:
[E]Aleluia, [B]slavă Domnului,
[C#m]Aleluia, [A]slavă Regelui,

NOW ADD CHORDS TO THIS SONG:
Title: ${title}
Artist: ${artist || "Unknown"}

${lyrics}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_KEY}`;

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

    // Strip markdown code blocks if wrapped
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
