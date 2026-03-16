import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, artist, lyrics } = await req.json();

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

    console.log("Calling AI with prompt length:", prompt.length);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a chord annotation assistant. You ONLY output lyrics with [Chord] markers inserted. Never output explanations or markdown." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
      }),
    });

    const rawText = await response.text();
    console.log("AI raw response status:", response.status);
    console.log("AI raw response body:", rawText.substring(0, 500));
    
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", parseErr);
      throw new Error("AI response was not valid JSON: " + rawText.substring(0, 200));
    }
    
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("AI returned no content. Full response:", rawText.substring(0, 500));
      throw new Error("AI did not return chord annotations");
    }
    
    let chordsLyrics = data.choices[0].message.content.trim();
    
    // Strip markdown code blocks if the model wrapped the output
    chordsLyrics = chordsLyrics.replace(/^```[^\n]*\n?/, "").replace(/\n?```$/, "").trim();
    
    if (!chordsLyrics.includes("[")) {
      console.warn("AI response contained no chord brackets");
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
