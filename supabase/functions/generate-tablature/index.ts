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
    const { lyrics, title, artist, level, mode } = await req.json();
    // mode: "chord" (pattern per chord) or "full" (full song tablature)
    // level: "basic", "intermediate", "advanced"

    const levelDescriptions: Record<string, string> = {
      basic: "Simple fingerpicking patterns using basic thumb-index-middle (p-i-m) patterns. Travis picking style, simple arpeggios. Keep patterns repetitive and easy to follow.",
      intermediate: "More complex fingerpicking with thumb-index-middle-ring (p-i-m-a) patterns. Include hammer-ons, pull-offs, and some melody notes mixed with bass. Add some syncopation.",
      advanced: "Advanced fingerstyle arrangements with complex melody lines, bass runs, harmonics, slides, hammer-ons, pull-offs, and percussive elements. Create a full fingerstyle arrangement that sounds complete without vocals.",
    };

    let prompt: string;

    if (mode === "chord") {
      // Extract unique chords from lyrics
      const chordRegex = /\[([^\]]+)\]/g;
      const chords = new Set<string>();
      let match;
      while ((match = chordRegex.exec(lyrics)) !== null) {
        chords.add(match[1]);
      }
      const chordList = Array.from(chords).join(", ");

      prompt = `You are an expert guitarist who creates fingerpicking patterns in tablature format.

Generate a fingerpicking pattern for each of these chords: ${chordList}

Difficulty level: ${level}
${levelDescriptions[level] || levelDescriptions.basic}

Rules:
- Use standard guitar tablature format with 6 strings (e, B, G, D, A, E from top to bottom)
- Each pattern should be 1-2 measures (4/4 time)
- Show the chord name above each pattern
- Use numbers for frets (0 = open string, - = not played in that beat)
- Make patterns musical and idiomatic for the chord shape
- Return ONLY the tablature, no explanations
- Separate each chord pattern with a blank line
- Format each pattern like:
[ChordName]
e|---0---0---0---0---|
B|---1---1---1---1---|
G|---0---0---0---0---|
D|---2-------2-------|
A|---3-----------3---|
E|-------------------|`;
    } else {
      prompt = `You are an expert guitarist who creates fingerstyle guitar arrangements.

Create a complete fingerstyle tablature arrangement for this song:

Title: ${title}
Artist: ${artist || "Unknown"}

Lyrics with chords:
${lyrics}

Difficulty level: ${level}
${levelDescriptions[level] || levelDescriptions.basic}

Rules:
- Use standard guitar tablature format with 6 strings (e, B, G, D, A, E from top to bottom)
- Follow the chord progression from the lyrics
- Add the lyric text above the corresponding tablature sections
- Create a musical arrangement that follows the melody
- Use numbers for frets, h for hammer-on, p for pull-off, / for slide up, \\ for slide down
- Include an intro if appropriate
- Return ONLY the tablature with lyrics markers, no explanations
- Format like:
[Intro]
e|---0---0---0---0---|
B|---1---1---1---1---|
G|---0---0---0---0---|
D|---2-------2-------|
A|---3-----------3---|
E|-------------------|

[Verse - "lyrics text here..."]
e|---0---0---0---0---|---2---2---2---2---|
B|---1---1---1---1---|---3---3---3---3---|
G|---0---0---0---0---|---2---2---2---2---|
D|---2-------2-------|---0-------0-------|
A|---3-----------3---|-------------------|
E|-------------------|-------------------|`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const tablature = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ tablature }), {
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
