import { NextRequest, NextResponse } from 'next/server';
import { chatJSON } from '@/lib/meta-ai';
import { languagePrompt, festivalPrompt } from '@/lib/india';
import { requireAuth } from '@/lib/auth-guard';
import { readJson, badRequest, serverError } from '../_lib/http';

interface DimensionAI {
  score?: unknown;
  feedback?: unknown;
}
interface BreakdownAI {
  hook_strength?: DimensionAI | unknown;
  emotional_trigger?: DimensionAI | unknown;
  clarity?: DimensionAI | unknown;
  call_to_action?: DimensionAI | unknown;
  hashtag_readiness?: DimensionAI | unknown;
}
interface ScoredCaption {
  a?: { score?: unknown; breakdown?: BreakdownAI };
  b?: { score?: unknown; breakdown?: BreakdownAI };
  winner?: unknown;
  why?: unknown;
}
interface ScoreResult {
  a?: ScoredCaption['a'];
  b?: ScoredCaption['b'];
  winner?: unknown;
  why?: unknown;
  verdict?: unknown;
  verdict_reason?: unknown;
  rewritten_version?: unknown;
  algorithm_signals?: {
    saves_potential?: unknown;
    shares_potential?: unknown;
    comments_potential?: unknown;
    reach_multiplier?: unknown;
  };
  top_3_issues?: unknown;
  suggested_hashtags?: unknown;
  best_posting_time?: unknown;
  content_tip?: unknown;
  quick_wins?: unknown;
}

const DIMENSIONS = [
  ['hook_strength', 'hook — does line 1 stop the scroll? (Indian feed habits: bold claim, question, festival hook)'],
  ['emotional_trigger', 'emotional_trigger — does it trigger feeling (festival pride, FOMO, family, aspiration)?'],
  ['clarity', 'clarity — is the offer/message instantly understandable even skim-reading?'],
  ['call_to_action', 'call_to_action — is there a specific, easy CTA (DM "PRICE", WhatsApp, visit today)?'],
  ['hashtag_readiness', 'hashtag_readiness — would the caption pair well with findable Indian hashtags?'],
] as const;

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await readJson<{
      caption?: string; caption_b?: string; platform?: string; category?: string; language?: string; festival?: string;
    }>(req);
    if (!body) return badRequest('Invalid request — please refresh the page and try again.');
    const { caption, caption_b, platform, category, language, festival } = body;
    if (!caption?.trim()) return NextResponse.json({ error: 'Please enter a caption to score.' }, { status: 400 });

    // Optional field: an empty caption_b just means "no A/B test".
    const hasB = typeof caption_b === 'string' && caption_b.trim().length > 0;

    const systemPrompt = `You are India's toughest-but-fairest Instagram caption judge. You score captions the way the Indian Instagram algorithm and audience actually behave:
- Judge the caption on its own terms: hook strength, clarity and CTA matter most; phrasing that feels natural beats stiff or translated-sounding copy.
- Festival and seasonal references (Diwali, Rakhi, Eid, Navratri...) boost engagement when they feel genuine.
- A caption is only as good as its WhatsApp forwardability — people forward offers to family groups, so shareable offers score high.
- Hooks must stop the scroll in under a second; CTAs must name the exact next step (DM, visit, order on WhatsApp).
${languagePrompt(language)}
${festivalPrompt(festival, [caption, caption_b].filter(Boolean).join(' '))}
Respond ONLY with valid JSON — no markdown, no code fences.`;

    const dimJson = DIMENSIONS.map(([k]) => `"${k}": {"score": <0-20>, "feedback": "<one short reason>"}`).join(', ');

    const prompt = `Score this caption${hasB ? ' pair' : ''} for virality on ${platform || 'Instagram'} in India.

BUSINESS CATEGORY: ${category || 'General'}

CAPTION A:
"""
${caption}
"""
${hasB ? `
CAPTION B (A/B challenger):
"""
${caption_b}
"""` : ''}

Rubric — score each dimension 0-20 for every caption given:
${DIMENSIONS.map(([, d]) => `- ${d}`).join('\n')}

${hasB ? `Compare A and B head-to-head. Pick ONE winner and explain why in terms of the rubric.
` : ''}Respond ONLY in this JSON shape:
{
  "a": {"score": <0-100 total>, "breakdown": {${dimJson}}}${hasB ? `,
  "b": {"score": <0-100 total>, "breakdown": {${dimJson}}},
  "winner": "a" | "b",
  "why": "<1-2 sentences: why the winner beats the other — cite the rubric>"` : ''},
  "verdict": "<Viral Potential | Strong | Average | Needs Work | Poor>",
  "verdict_reason": "<2-3 sentences explaining the verdict, citing specific lines>",
  "rewritten_version": "<the best caption rewritten for maximum virality — same message and language as the original, stronger hook and CTA>",
  "algorithm_signals": {"saves_potential": "<High|Medium|Low — one clause why>", "shares_potential": "<High|Medium|Low — why>", "comments_potential": "<High|Medium|Low — why>", "reach_multiplier": "<e.g. 1.8x — what drives it>"},
  "top_3_issues": ["<the single biggest weakness>", "<second>", "<third>"],
  "suggested_hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8"],
  "best_posting_time": "<specific day + time IST for ${category || 'this category'}>",
  "content_tip": "<one concrete next-post idea for this business>",
  "quick_wins": ["<30-second fix that raises the score>", "<second>", "<third>"]
}`;

    const raw = await chatJSON<ScoreResult>({
      system: systemPrompt,
      user: prompt,
      temperature: 0.4,
      maxTokens: 2000,
    });

    // ── Coerce: clamp every dimension, derive totals from the rubric ──
    const clamp = (n: unknown): number => Math.max(0, Math.min(20, Math.round(Number(n) || 0)));
    const dimOf = (v: unknown): { score: number; feedback: string } => ({
      score: clamp(typeof v === 'object' && v !== null ? (v as DimensionAI).score : v),
      feedback: typeof v === 'object' && v !== null && typeof (v as DimensionAI).feedback === 'string'
        ? (v as DimensionAI).feedback as string : '',
    });
    const breakdownOf = (s: BreakdownAI | undefined) => ({
      hook_strength: dimOf(s?.hook_strength),
      emotional_trigger: dimOf(s?.emotional_trigger),
      clarity: dimOf(s?.clarity),
      call_to_action: dimOf(s?.call_to_action),
      hashtag_readiness: dimOf(s?.hashtag_readiness),
    });
    const totalOf = (b: ReturnType<typeof breakdownOf>): number =>
      b.hook_strength.score + b.emotional_trigger.score + b.clarity.score + b.call_to_action.score + b.hashtag_readiness.score;

    const aBreakdown = breakdownOf(raw.a?.breakdown);
    const bBreakdown = hasB ? breakdownOf(raw.b?.breakdown) : null;

    const winner: 'a' | 'b' = hasB && raw.winner === 'b' ? 'b' : 'a';
    const winnerBreakdown = winner === 'b' && bBreakdown ? bBreakdown : aBreakdown;
    const winnerScore = winnerBreakdown === bBreakdown && bBreakdown ? totalOf(bBreakdown) : totalOf(aBreakdown);

    const strArr = (v: unknown, n: number): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, n) : [];
    const str = (v: unknown): string => (typeof v === 'string' ? v : '');

    const signals = raw.algorithm_signals ?? {};
    const signal = (v: unknown): string => str(v) || 'Medium';

    return NextResponse.json({
      score: winnerScore,
      breakdown: winnerBreakdown,
      verdict: str(raw.verdict) || 'Average',
      verdict_reason: str(raw.verdict_reason),
      rewritten_version: str(raw.rewritten_version),
      rewrite: str(raw.rewritten_version), // back-compat alias
      algorithm_signals: {
        saves_potential: signal(signals.saves_potential),
        shares_potential: signal(signals.shares_potential),
        comments_potential: signal(signals.comments_potential),
        reach_multiplier: signal(signals.reach_multiplier),
      },
      top_3_issues: strArr(raw.top_3_issues, 3),
      suggested_hashtags: strArr(raw.suggested_hashtags, 8),
      best_posting_time: str(raw.best_posting_time),
      content_tip: str(raw.content_tip),
      quick_wins: strArr(raw.quick_wins, 5),
      ...(hasB
        ? {
            ab: {
              winner,
              why: str(raw.why),
              scores: {
                a: totalOf(aBreakdown),
                b: bBreakdown ? totalOf(bBreakdown) : 0,
              },
            },
          }
        : {}),
    });
  } catch (error: unknown) {
    return serverError('score-caption', error);
  }
}
