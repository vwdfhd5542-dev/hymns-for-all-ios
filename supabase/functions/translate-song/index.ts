import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const prompt = `You are a gifted Christian hymn poet and lyricist fluent in ${langNames[targetLanguage] || "English"}. Your task is to translate and ADAPT the following worship song so it RHYMES beautifully in ${langNames[targetLanguage] || "English"}.

ABSOLUTE REQUIREMENTS:
1. Keep ALL chord notations in [Chord] format EXACTLY as they are — never translate, move, or modify chords
2. The translated lyrics MUST RHYME. Use rhyme schemes like AABB or ABAB for each stanza
3. You may freely rephrase, restructure sentences, and use synonyms to achieve rhyme — do NOT do a literal translation
4. The result must sound like a song ORIGINALLY WRITTEN in ${langNames[targetLanguage] || "English"}, not a translation
5. Maintain the spiritual meaning, emotion, and singability
6. Preserve exact line count and empty lines
7. Return ONLY the translated lyrics with chords, no explanations or notes

EXAMPLE of good rhyming in English:
"A wanderer without a home" / "Through desert lands I lonely roam"
"My treasure waits in heaven above" / "My homeland rests in God's great love"

EXAMPLE of good rhyming in Spanish:
"Soy peregrino sin hogar" / "Por el desierto he de andar"
"Mas en los cielos mi tesoro está" / "Y mi patria eterna allá será"

Now translate this song to ${langNames[targetLanguage] || "English"}, making every stanza rhyme:

${lyrics}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API returned ${response.status}`);
    }

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
