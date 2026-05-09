import { NextRequest, NextResponse } from 'next/server';
import { getGroqClient, MODEL } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const { caption, platform, category } = await req.json();
    if (!caption?.trim()) return NextResponse.json({ error: 'Caption is required' }, { status: 400 });

    const groq = getGroqClient();

    const prompt = `You are a viral content expert with deep knowledge of ${platform || 'Instagram'} algorithms and Indian social media trends.

Analyze this caption for virality potential:
"${caption}"

Platform: ${platform || 'Instagram'}
Business Category: ${category || 'General'}

Score it across 5 dimensions (0-20 each = 100 total) and give SPECIFIC, ACTIONABLE feedback.

Respond ONLY in valid JSON (no markdown, no extra text):
{
  "score": <total 0-100>,
  "verdict": "<Viral Potential|Strong|Average|Needs Work|Poor>",
  "verdict_reason": "<one sentence explaining the score>",
  "breakdown": {
    "hook_strength": { "score": <0-20>, "feedback": "<specific feedback on the first line hook>" },
    "emotional_trigger": { "score": <0-20>, "feedback": "<what emotion it triggers and how strong>" },
    "clarity": { "score": <0-20>, "feedback": "<is the message clear, is CTA obvious>" },
    "call_to_action": { "score": <0-20>, "feedback": "<quality of the CTA — specific improvement>" },
    "hashtag_readiness": { "score": <0-20>, "feedback": "<are hashtags effective for this platform>" }
  },
  "algorithm_signals": {
    "saves_potential": "<High|Medium|Low — reason>",
    "shares_potential": "<High|Medium|Low — reason>",
    "comments_potential": "<High|Medium|Low — reason>",
    "reach_multiplier": "<estimate: 1x|2x|3x|5x+ organic reach based on content quality>"
  },
  "top_3_issues": [
    "<most critical thing hurting the score — specific>",
    "<second issue>",
    "<third issue>"
  ],
  "quick_wins": [
    "<change you can make in 30 seconds to improve score>",
    "<another quick fix>",
    "<third quick fix>"
  ],
  "rewritten_version": "<completely rewritten caption — same message but higher virality. Keep the brand voice but make every line earn its place. Use proven hooks.>",
  "suggested_hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8","#tag9","#tag10","#tag11","#tag12"],
  "best_posting_time": "<specific day + time for ${platform || 'Instagram'} in India>",
  "content_tip": "<one specific tip about what visual/video to pair with this caption for maximum impact>"
}`;

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a viral content strategist and social media algorithm expert. Give brutally honest, specific feedback. Respond with valid JSON only — no markdown, no extra text.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1600,
      temperature: 0.6,
    });

    const raw = response.choices[0]?.message?.content || '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('{'), end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('Model did not return valid JSON. Please try again.');
    const data = JSON.parse(cleaned.slice(start, end + 1));
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[score-caption]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
