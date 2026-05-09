import { NextRequest, NextResponse } from 'next/server';
import { getGroqClient, MODEL } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const { businessName, category, productDescription, targetAudience,
            platform, duration, style, goal, hook } = await req.json();

    const groq = getGroqClient();

    const prompt = `Create a complete video production package for "${businessName}" (${category}).

PRODUCT: ${productDescription}
AUDIENCE: ${targetAudience}
PLATFORM: ${platform} (${duration}-second video)
STYLE: ${style}
GOAL: ${goal}
${hook ? `HOOK IDEA: ${hook}` : ''}

Respond ONLY in valid JSON (no markdown):
{
  "title": "<video title>",
  "hook_line": "<the very first spoken sentence — must stop the scroll in 2 seconds>",
  "voiceover_script": "<complete word-for-word voiceover script, natural speech, ${duration} seconds when read aloud at normal pace>",
  "scenes": [
    {
      "scene_number": 1,
      "duration_seconds": <number>,
      "shot_type": "<e.g. Close-up, Wide shot, Over-the-shoulder>",
      "visual": "<exactly what to film — be very specific about framing, movement, props>",
      "voiceover": "<exact words spoken during this scene>",
      "text_overlay": "<on-screen text or caption to show>",
      "music_mood": "<e.g. Upbeat, Emotional, Energetic>"
    }
  ],
  "caption": "<full ready-to-post caption with hook, body, CTA and emojis>",
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8","#tag9","#tag10","#tag11","#tag12","#tag13","#tag14","#tag15"],
  "thumbnail_idea": "<describe the perfect thumbnail — text overlay, visual, colors>",
  "cta": "<specific call-to-action to say at end of video>",
  "editing_tips": ["<tip 1 for editing this video>","<tip 2>","<tip 3>"],
  "music_suggestion": "<specific type of background music with tempo and mood>",
  "b_roll_list": ["<b-roll clip 1 to film>","<b-roll clip 2>","<b-roll clip 3>","<b-roll clip 4>"],
  "best_posting_time": "<day + time for maximum reach on ${platform}>"
}`;

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an expert video director and social media content strategist. Create complete, filmable video scripts. Respond with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 2500,
      temperature: 0.85,
    });

    const raw = response.choices[0]?.message?.content || '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    const data = JSON.parse(cleaned.slice(start, end + 1));
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
