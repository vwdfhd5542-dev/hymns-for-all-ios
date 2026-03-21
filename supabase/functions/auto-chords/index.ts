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
    if (!GEMINI_KEY) throw new Error("GOOGLE_GEMINI_API_KEY is not configured");

    const GROQ_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_KEY) throw new Error("GROQ_API_KEY is not configured");

    // Strip any existing chord markers
    const cleanLyrics = lyrics.replace(/\[[^\]]*\]/g, "").trim();

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: GEMINI WITH GOOGLE SEARCH — Find the REAL chords
    // ═══════════════════════════════════════════════════════════════
    const searchPrompt = `You are a music research assistant. Your ONLY job is to find the REAL, official guitar chords for this Romanian Christian hymn.

USE GOOGLE SEARCH NOW. Search for:
1. "${title}" "${artist || ""}" acorduri chitară
2. "${title}" acorduri resurse-crestine.ro
3. "${title}" acorduri cantari.ro
4. "${title}" guitar chords

From the search results, extract:
- The KEY of the song (e.g., Am, G, D, Em)
- The EXACT chord progression as it appears on the chord chart websites
- Any specific chords like E7, Am7, Dm7, G#m, Cmaj7 — do NOT simplify them
- The chord placement: which chord goes with which line/section of lyrics

OUTPUT FORMAT — Return ONLY this structured data, nothing else:
KEY: [key]
PROGRESSION: [list each unique chord used, separated by commas]
SECTIONS:
[paste the chord chart exactly as found — chords above lyrics or inline with lyrics, preserving the original placement from the source]

If you find the chords on a website, copy them EXACTLY. Do not modify, simplify, or "improve" them.
If you absolutely cannot find this song's chords anywhere, respond with ONLY the text: NOT_FOUND

Song: "${title}" by ${artist || "Unknown"}`;

    console.log("Step 1: Gemini searching for real chords...");

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: searchPrompt }] }],
        generationConfig: { temperature: 0.1 },
        tools: [{ google_search: {} }],
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini error:", errText.substring(0, 500));
      throw new Error(`Gemini search failed: ${geminiResponse.status}`);
    }

    const geminiData = JSON.parse(await geminiResponse.text());
    const geminiParts = geminiData.candidates?.[0]?.content?.parts || [];
    const chordData = geminiParts
      .filter((p: any) => p.text)
      .map((p: any) => p.text)
      .join("")
      .trim();

    // Log grounding info
    const grounding = geminiData.candidates?.[0]?.groundingMetadata;
    if (grounding?.groundingChunks) {
      console.log("Grounding sources:", grounding.groundingChunks.length);
      grounding.groundingChunks.forEach((chunk: any, i: number) => {
        if (chunk.web) console.log(`  Source ${i + 1}: ${chunk.web.uri}`);
      });
    }

    if (!chordData || chordData.includes("NOT_FOUND")) {
      console.warn("Gemini could not find chords online for:", title);
      throw new Error("NO_CHORDS_FOUND_ONLINE");
    }

    console.log("Step 1 complete. Chord data found:", chordData.substring(0, 300));

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: GROQ — Format chords into lyrics faithfully
    // ═══════════════════════════════════════════════════════════════
    console.log("Step 2: Groq formatting chords into lyrics...");

    const groqPrompt = `You are a precise chord formatter. You have TWO inputs:

INPUT 1 — CHORD DATA (found from real online sources):
${chordData}

INPUT 2 — CLEAN LYRICS:
${cleanLyrics}

YOUR TASK:
Take the chords from INPUT 1 and place them into INPUT 2 using [Chord] bracket notation.

CRITICAL RULES:
1. Use ONLY the chords from INPUT 1. Do NOT add, remove, change, or simplify ANY chord. If the source says E7, you write [E7]. If it says Am, you write [Am]. NEVER substitute.
2. Place each chord DIRECTLY before the syllable where it should be played, based on the placement shown in INPUT 1.
3. Every line of lyrics should have at least one chord.
4. Keep ALL original lyrics EXACTLY as they are — only INSERT [Chord] markers.
5. Do NOT add any explanations, titles, headers, markdown, or commentary.
6. Output ONLY the lyrics with chord brackets inserted. Nothing else.

BEGIN:`;

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a precise chord placement tool. You NEVER invent or modify chords. You ONLY use the exact chords provided to you and place them into lyrics at the correct positions. If you are unsure where a chord goes, place it at the beginning of the line. Output ONLY formatted lyrics with [Chord] brackets. No explanations."
          },
          { role: "user", content: groqPrompt }
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("Groq error:", errText.substring(0, 500));
      throw new Error(`Groq formatting failed: ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();
    let chordsLyrics = groqData.choices?.[0]?.message?.content?.trim() || "";

    // Clean up any markdown artifacts
    chordsLyrics = chordsLyrics.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "").trim();
    chordsLyrics = chordsLyrics.replace(/^(Title|Artist|Titlu|Autor|Song|Key):.*\n?/gim, "").trim();

    if (!chordsLyrics.includes("[")) {
      console.warn("Groq output has no chord brackets, raw:", chordsLyrics.substring(0, 300));
      throw new Error("NO_CHORDS_GENERATED");
    }

    console.log("Step 2 complete. Final output ready.");

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
