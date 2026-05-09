import { NextRequest, NextResponse } from 'next/server';
import { getGroqClient, MODEL } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const { businessName, category, day, totalDays, platforms, goal,
            projected, actual, efficiency } = await req.json();

    const groq = getGroqClient();
    const hasActual = actual && (actual.reach > 0 || actual.clicks > 0);

    const prompt = hasActual
      ? `You are a social media performance coach reviewing Day ${day} of ${totalDays} for "${businessName}" (${category}).

CAMPAIGN: ${goal} on ${platforms?.join(', ')}
EFFICIENCY MODE: ${efficiency}

DAY ${day} RESULTS:
- Projected Reach: ${projected?.reach?.toLocaleString()} | Actual: ${actual.reach.toLocaleString()}
- Projected Clicks: ${projected?.clicks?.toLocaleString()} | Actual: ${actual.clicks.toLocaleString()}
- Impressions: ${actual.impressions?.toLocaleString() || 0}
- Conversions: ${actual.conversions?.toLocaleString() || 0}

Performance vs projection: ${actual.reach > projected?.reach ? `+${Math.round(((actual.reach - projected.reach) / projected.reach) * 100)}% above` : `${Math.round(((actual.reach - projected.reach) / projected.reach) * 100)}% below`} target

Give a sharp, specific coaching message. Respond in JSON:
{
  "headline": "<one punchy headline about today's performance>",
  "verdict": "above_target" | "on_track" | "below_target",
  "analysis": "<2-3 sentences: what happened, why, what it means>",
  "tomorrow_action": "<1 specific thing to do differently tomorrow>",
  "quick_win": "<one zero-cost tactic they can do in the next 2 hours to boost reach>",
  "metric_to_watch": "<the single most important metric to focus on tomorrow and why>"
}`
      : `You are a social media coach giving Day ${day} pre-campaign prep for "${businessName}" (${category}).

CAMPAIGN: ${goal} on ${platforms?.join(', ')}
DAY ${day} of ${totalDays} — no results entered yet
EFFICIENCY: ${efficiency}
PROJECTED TODAY: Reach ${projected?.reach?.toLocaleString()}, Clicks ${projected?.clicks?.toLocaleString()}

Give a motivating pre-day briefing. Respond in JSON:
{
  "headline": "<energising headline for day ${day}>",
  "verdict": "ready",
  "analysis": "<what to focus on today based on the campaign stage — beginning/middle/end>",
  "tomorrow_action": "<the most important thing to execute today>",
  "quick_win": "<one tactic to maximise today's reach>",
  "metric_to_watch": "<what to measure today and how>"
}`;

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a sharp, results-focused social media performance coach. Always respond with valid JSON only — no markdown, no extra text.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 600,
      temperature: 0.7,
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
