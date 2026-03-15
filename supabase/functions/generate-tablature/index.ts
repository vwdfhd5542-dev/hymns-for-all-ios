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

    const levelDescriptions: Record<string, string> = {
      basic: `Simple fingerpicking using thumb (p) on bass strings and index-middle (i-m) alternating on treble strings.
- The melody on treble strings (1,2,3) MUST follow the real hymn melody note by note.
- Bass notes: root of each chord on beats 1 and 3.
- Keep a steady 4/4 Travis picking pattern.
- Use ONLY open position chords and simple fret numbers (0-3).`,
      intermediate: `Intermediate fingerpicking with thumb-index-middle-ring (p-i-m-a).
- Treble strings (1,2,3) carry the real melody of the hymn — each note must correspond to the actual pitch of the sung melody.
- Bass strings (4,5,6): alternating bass with root and 5th on beats 1 and 3.
- Add occasional hammer-ons (h) and pull-offs (p) for ornamentation.
- Include some syncopation and passing tones between chord changes.
- Use bar lines | every 4 beats for readability.`,
      advanced: `Advanced fingerstyle arrangement in the style of Tommy Emmanuel or Chet Atkins.
- This MUST be a complete solo guitar arrangement where the melody is clearly audible.
- Treble strings (1,2,3): play the EXACT melody of the hymn, note for note.
- Bass strings (4,5,6): independent bass line with the thumb playing root and 5th alternating (Travis picking style) on beats 1 and 3.
- Middle voices fill in harmonic content on strings 3 and 4.
- Use hammer-ons (h), pull-offs (p), slides (/,\\), and harmonics where musical.
- Add an intro (4 bars) and an ending.
- Use bar lines | every 4 beats. Mark sections clearly.`,
    };

    // Extract chord info for context
    const chordRegex = /\[([^\]]+)\]/g;
    const chords = new Set<string>();
    let match;
    while ((match = chordRegex.exec(lyrics)) !== null) {
      chords.add(match[1]);
    }
    const chordList = Array.from(chords).join(", ");

    let prompt: string;

    if (mode === "chord") {
      prompt = `You are an expert classical/fingerstyle guitarist creating tablature.

Generate a fingerpicking pattern for each of these chords: ${chordList}

Difficulty: ${level}
${levelDescriptions[level] || levelDescriptions.basic}

CRITICAL FORMATTING RULES:
- Standard guitar tab: 6 strings labeled e, B, G, D, A, E (high to low)
- Each pattern = exactly 1 measure in 4/4 time
- Use bar lines | to separate beats (4 beats per measure)
- Numbers = fret numbers, - = rest/sustain, h = hammer-on, p = pull-off
- Show chord name on its own line above each pattern
- Return ONLY tablature, zero explanations or markdown

Example format:
Am
e|--0---|--0---|--0---|--0---|
B|--1---|--1---|--1---|--1---|
G|--2---|--2---|--2---|--2---|
D|------|--2---|------|--2---|
A|--0---|------|--0---|------|
E|------|------|------|------|`;
    } else {
      prompt = `You are an expert fingerstyle guitarist creating a complete solo guitar arrangement.

Song: "${title}" by ${artist || "Traditional"}
Key chords used: ${chordList}

Lyrics with chords:
${lyrics}

Difficulty: ${level}
${levelDescriptions[level] || levelDescriptions.basic}

CRITICAL REQUIREMENTS:
1. The MELODY on treble strings MUST follow the actual sung melody of this hymn.
2. Each section must be labeled: [Intro], [Verse 1], [Chorus], etc.
3. Under each section label, show a snippet of the lyrics being played.

CRITICAL FORMATTING RULES:
- Standard guitar tab: 6 strings labeled e, B, G, D, A, E (high to low)
- Use bar lines | every 4 beats (4/4 time)
- Numbers = fret numbers, - = rest, h = hammer-on, p = pull-off, / = slide up, \\ = slide down
- Return ONLY tablature with section headers, zero explanations or markdown code blocks

Example format:
[Intro]
e|--0---0---|--1---0---|
B|--1---1---|--1---1---|
G|--0---0---|--2---0---|
D|--2-------|--3-------|
A|--0-------|------0---|
E|------0---|----------|

[Verse 1 - "First line of lyrics..."]
e|--0---0---|--2---2---|
B|--1---1---|--3---3---|
G|--0---0---|--2---2---|
D|--2-------|--0-------|
A|--0-------|----------|
E|----------|----------|`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a professional guitar transcriber. Output ONLY guitar tablature in plain text. Never use markdown code blocks. Never add explanations. The melody must be musically accurate to the real hymn."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
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
    let tablature = data.choices?.[0]?.message?.content?.trim() || "";
    
    // Clean up: remove markdown code blocks if present
    tablature = tablature.replace(/```[a-z]*\n?/g, "").replace(/```$/g, "").trim();

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
