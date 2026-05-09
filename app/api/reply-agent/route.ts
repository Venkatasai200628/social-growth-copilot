import { NextRequest, NextResponse } from 'next/server';
import { getGroqClient, MODEL } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const { message, messageType, businessName, category, tone, productContext } = await req.json();
    if (!message?.trim()) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

    const groq = getGroqClient();

    const prompt = `You are the social media manager for "${businessName || 'our business'}", a ${category || 'business'}.

INCOMING ${messageType === 'dm' ? 'DIRECT MESSAGE' : 'COMMENT'}:
"${message}"

${productContext ? `BUSINESS CONTEXT: ${productContext}` : ''}
BRAND TONE: ${tone || 'Friendly and professional'}

Perform deep intent analysis and generate conversion-focused replies.

Respond ONLY in valid JSON (no markdown):
{
  "intent": "<precise intent — e.g. 'Price inquiry with high purchase intent', 'Complaint needing resolution', 'Curiosity, not ready to buy', 'Ready to buy, needs final push'>",
  "sentiment": "<positive|neutral|negative|mixed>",
  "urgency": "<low|medium|high|urgent>",
  "purchase_probability": "<0-100>%",
  "recommended_action": "<what to do beyond replying — e.g. 'Send product catalog via DM', 'Offer limited-time discount', 'Ask for phone number to close sale', 'Escalate to owner'>",
  "replies": [
    {
      "style": "Warm & Conversational",
      "text": "<reply — feels human, builds rapport, soft CTA>",
      "conversion_tip": "<why this style works for this specific message>"
    },
    {
      "style": "Professional & Direct",
      "text": "<reply — confident, answers the question fully, clear next step>",
      "conversion_tip": "<when to use this>"
    },
    {
      "style": "Sales-Driven",
      "text": "<reply — creates mild urgency, highlights value, strong CTA>",
      "conversion_tip": "<use when purchase probability is high>"
    }
  ],
  "follow_up_message": "<a follow-up DM to send 24hrs later if they don't respond — keep it natural>",
  "red_flags": "<any warning signs in this message — e.g. 'May be a competitor', 'Seems price-sensitive', 'Negative experience' — or 'None'>",
  "emoji_suggestion": "<1-2 emojis that fit this brand and this reply context>"
}`;

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert social media community manager and conversion specialist. Analyse intent deeply and write replies that feel human while moving customers toward purchase. Respond with valid JSON only.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1200,
      temperature: 0.72,
    });

    const raw = response.choices[0]?.message?.content || '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('{'), end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('Model did not return valid JSON. Please try again.');
    const data = JSON.parse(cleaned.slice(start, end + 1));
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[reply-agent]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
