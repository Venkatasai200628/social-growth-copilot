import { NextRequest, NextResponse } from 'next/server';
import { chatJSON } from '@/lib/meta-ai';
import { languagePrompt, festivalPrompt } from '@/lib/india';
import { requireAuth } from '@/lib/auth-guard';
import { readJson, badRequest, serverError, str } from '../_lib/http';

interface ReplyStyle {
  style?: string;
  text?: string;
  conversion_tip?: string;
}

interface ReplyResult {
  intent?: unknown;
  sentiment?: unknown;
  urgency?: unknown;
  purchase_probability?: unknown;
  recommended_action?: unknown;
  replies?: unknown;
  follow_up_message?: unknown;
  red_flags?: unknown;
  emoji_suggestion?: unknown;
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await readJson<{
      message?: string; messageType?: string; businessName?: string; category?: string;
      tone?: string; productContext?: string; language?: string; festival?: string;
    }>(req);
    if (!body) return badRequest('Invalid request — please refresh the page and try again.');
    const { message, messageType, businessName, category, tone, productContext, language, festival } = body;
    if (!message?.trim()) return badRequest('Please enter the customer message to reply to.');

    const systemPrompt = `You are an expert social media community manager and conversion specialist for Indian small businesses.
${languagePrompt(language)}
${festivalPrompt(festival, [message, productContext].filter(Boolean).join(' '))}
You know real Indian SMB DMs and WhatsApp messages: customers often type casually and code-mixed ("price kya hai", "brother, deliver karte ho?"), short and fast. Understand the intent behind whatever mix they used, never correct their language — but ALWAYS write the owner-facing replies in English so every shop can use them.
NEVER invent facts in a reply: no discounts, delivery promises, prices, availability or policies the business context doesn't state — instead write a helpful reply that asks the owner's exact detail or moves the customer to DM/call.
Analyse intent deeply and write replies that feel human while moving customers toward purchase. Respond ONLY with valid JSON — no markdown, no code fences.`;

    const prompt = `You are the social media manager for "${businessName || 'our business'}", a ${category || 'business'}.

INCOMING ${messageType === 'dm' ? 'DIRECT MESSAGE' : 'COMMENT'}:
"${message}"

${productContext ? `BUSINESS CONTEXT: ${productContext}` : ''}
BRAND TONE: ${tone || 'Friendly and professional'}

Perform deep intent analysis and generate conversion-focused replies. All three reply texts and the follow_up_message must be in English.

Respond ONLY in valid JSON:
{
  "intent": "<precise intent — e.g. 'Price inquiry with high purchase intent', 'Complaint needing resolution', 'Curiosity, not ready to buy', 'Ready to buy, needs final push'>",
  "sentiment": "<positive|neutral|negative|mixed>",
  "urgency": "<low|medium|high|urgent>",
  "recommended_action": "<what to do beyond replying — e.g. 'Send product catalog via DM', 'Ask for phone number to close sale', 'Escalate to owner'>",
  "replies": [
    {
      "style": "Warm & Conversational",
      "text": "<reply in English — feels human, builds rapport, soft CTA>",
      "conversion_tip": "<why this style works for this specific message>"
    },
    {
      "style": "Professional & Direct",
      "text": "<reply in English — confident, answers fully, clear next step>",
      "conversion_tip": "<when to use this>"
    },
    {
      "style": "Sales-Driven",
      "text": "<reply in English — creates mild urgency, highlights value, strong CTA>",
      "conversion_tip": "<use when purchase intent is high>"
    }
  ],
  "follow_up_message": "<a follow-up DM in English to send 24hrs later if they don't respond — keep it natural>",
  "red_flags": "<any warning signs in this message — or 'None'>",
  "emoji_suggestion": "<1-2 emojis that fit this brand and this reply context>"
}`;

    const raw = await chatJSON<ReplyResult>({
      system: systemPrompt,
      user: prompt,
      temperature: 0.72,
      maxTokens: 1200,
    });

    // ── Coerce: the page renders every field directly and copies
    // follow_up_message to the clipboard, so nothing may be undefined. ──
    const replies = Array.isArray(raw.replies)
      ? raw.replies.slice(0, 5).map((r) => {
          const o = r && typeof r === 'object' ? (r as ReplyStyle) : {};
          return {
            style: str(o.style),
            text: str(o.text),
            conversion_tip: str(o.conversion_tip),
          };
        })
      : [];

    return NextResponse.json({
      intent: str(raw.intent),
      sentiment: str(raw.sentiment) || 'neutral',
      urgency: str(raw.urgency) || 'medium',
      recommended_action: str(raw.recommended_action),
      replies,
      follow_up_message: str(raw.follow_up_message),
      red_flags: str(raw.red_flags) || 'None',
      emoji_suggestion: str(raw.emoji_suggestion),
    });
  } catch (error: unknown) {
    return serverError('reply-agent', error);
  }
}
