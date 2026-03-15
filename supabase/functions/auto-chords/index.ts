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

    const prompt = `You are an expert musician who adds guitar/piano chords to song lyrics. 
Given the following song lyrics (Romanian Christian song), add appropriate chords in [Chord] notation above/inline with the text.

Rules:
- Use standard chord notation: C, Dm, Em, F, G, Am, Bm, etc.
- Place chords in square brackets like [Am] directly before the syllable where the chord changes
- Choose chords that fit the melody and harmonic progression typical of Romanian Christian music
- Use major chords for major keys and minor chords for minor keys appropriately
- Keep the lyrics exactly as provided, only add [Chord] markers
- Return ONLY the lyrics with chords added, no explanations

Song title: ${title}
Artist: ${artist || "Unknown"}

Lyrics:
${lyrics}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const chordsLyrics = data.choices?.[0]?.message?.content?.trim() || lyrics;

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
