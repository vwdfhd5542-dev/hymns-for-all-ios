import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const langNames: Record<string, string> = {
  ro: "Romanian",
  es: "Spanish",
  en: "English",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lyrics, targetLanguage } = await req.json();

    const prompt = `You are an expert translator of Christian worship songs. Translate the following song lyrics to ${langNames[targetLanguage] || "English"}.

Rules:
- Keep ALL chord notations in [Chord] format exactly as they are, do not translate or modify chords
- Translate ONLY the lyrics text between chords
- Preserve the exact same line structure and formatting
- Make the translation singable and natural, not word-for-word
- Keep empty lines as empty lines
- Return ONLY the translated lyrics with chords, no explanations

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
    const translatedLyrics = data.choices?.[0]?.message?.content?.trim() || lyrics;

    return new Response(JSON.stringify({ lyrics: translatedLyrics }), {
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
