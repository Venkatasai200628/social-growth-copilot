import { NextRequest, NextResponse } from 'next/server';
import { chatJSON } from '@/lib/groq';
import { languagePrompt, festivalPrompt } from '@/lib/india';
import { requireAuth } from '@/lib/auth-guard';
import { readJson, badRequest, serverError } from '../_lib/http';

interface Metrics {
  reach?: number;
  clicks?: number;
  impressions?: number;
  conversions?: number;
}

interface CoachResult {
  headline?: string;
  verdict?: string;
  analysis?: string;
  actions?: unknown;
  whatsapp_script?: string;
  metric_to_watch?: string;
}

const VERDICTS_WITH_ACTUAL = ['ahead', 'on_track', 'behind'];

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await readJson<{
      businessName?: string; category?: string; goal?: string; platforms?: string[]; day?: number;
      totalDays?: number; festival?: string; language?: string; efficiency?: string;
      actual?: Metrics;
    }>(req);
    if (!body) return badRequest('Invalid request — please refresh the page and try again.');
    const { businessName, category, goal, platforms, day, totalDays, festival,
            language, efficiency, actual } = body;

    // ── Validation ────────────────────────────────────────────────
    if (!businessName?.trim()) return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
    if (!category?.trim()) return NextResponse.json({ error: 'Please choose your business category.' }, { status: 400 });
    if (!goal?.trim()) return NextResponse.json({ error: 'Please choose a campaign goal.' }, { status: 400 });
    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'Please select at least one platform.' }, { status: 400 });
    }
    if (typeof day !== 'number' || Number.isNaN(day) || day < 1) {
      return NextResponse.json({ error: 'Campaign day must be a positive number.' }, { status: 400 });
    }
    if (typeof totalDays !== 'number' || Number.isNaN(totalDays) || totalDays < 1) {
      return NextResponse.json({ error: 'Total days must be a positive number.' }, { status: 400 });
    }

    // ── Guarded math (never trust optional metrics) ───────────────
    const act: Metrics = actual ?? {};
    const actReach = Number(act.reach) || 0;
    const actClicks = Number(act.clicks) || 0;
    const actImpressions = Number(act.impressions) || 0;
    const actConversions = Number(act.conversions) || 0;
    const hasActual = actReach > 0 || actClicks > 0;
    const fmt = (n: number): string => n.toLocaleString('en-IN');

    const systemPrompt = `You are GrowMitra's AI growth coach for Indian small-business owners — sharp, warm and relentlessly practical, like a trusted business friend. Never corporate, never generic. Every recommendation must be doable today by a busy shop owner.
${languagePrompt(language)}
${festivalPrompt(festival, goal)}
All analysis, actions and the whatsapp_script MUST be written in English. Coach only on the REAL numbers the owner logged — never invent comparisons to projections or benchmarks. Respond ONLY with valid JSON — no markdown, no code fences.`;

    const prompt = hasActual
      ? `Day ${day} of ${totalDays} review for "${businessName}" (${category}).

CAMPAIGN: ${goal} on ${platforms.join(', ')}
EFFICIENCY MODE: ${efficiency || 'balanced'}

DAY ${day} RESULTS (the owner's real, logged numbers):
- Reach: ${fmt(actReach)}
- Clicks: ${fmt(actClicks)}
- Impressions: ${fmt(actImpressions)}
- Conversions: ${fmt(actConversions)}

Coach the owner on today's performance. Respond in JSON:
{
  "headline": "<punchy one-line headline about today, in English>",
  "verdict": "<'ahead' if the numbers look strong for this category, 'on_track' if reasonable, 'behind' if clearly weak — your expert judgment>",
  "analysis": "<2-3 sentences in English: what the numbers say, why, and what it means for the campaign>",
  "actions": ["<3 concrete actions for tomorrow, each specific to these numbers, in English>", "<2nd>", "<3rd>"],
  "whatsapp_script": "<max 60 words in English the owner can forward to their team or post as a WhatsApp status>",
  "metric_to_watch": "<the single metric to watch tomorrow and why, in English>"
}`
      : `Day ${day} of ${totalDays} for "${businessName}" (${category}) — no results logged yet.

CAMPAIGN: ${goal} on ${platforms.join(', ')}
EFFICIENCY MODE: ${efficiency || 'balanced'}

The owner has not logged today's numbers. Coach them on (a) exactly how and where to start logging their daily numbers (Instagram Insights, Meta Business Suite, WhatsApp Business stats), and (b) what to focus on at this stage of the campaign (day ${day} of ${totalDays}). Respond in JSON:
{
  "headline": "<energising headline for day ${day}, in English>",
  "verdict": "ready",
  "analysis": "<2-3 sentences in English: why logging matters today and what this campaign stage should feel like>",
  "actions": ["<3 concrete actions for today including starting to log numbers, in English>", "<2nd>", "<3rd>"],
  "whatsapp_script": "<max 60 words in English the owner can forward to their team or post as a WhatsApp status>",
  "metric_to_watch": "<the metric to start tracking today and why, in English>"
}`;

    const raw = await chatJSON<CoachResult>({
      system: systemPrompt,
      user: prompt,
      temperature: 0.6,
      maxTokens: 900,
    });

    // ── Coerce ────────────────────────────────────────────────────
    const allowed = hasActual ? VERDICTS_WITH_ACTUAL : ['ready'];
    const verdict = typeof raw.verdict === 'string' && allowed.includes(raw.verdict)
      ? raw.verdict
      : (hasActual ? 'on_track' : 'ready');

    const actions: string[] = Array.isArray(raw.actions)
      ? raw.actions.filter((a): a is string => typeof a === 'string' && a.trim().length > 0).slice(0, 3)
      : [];

    return NextResponse.json({
      headline: typeof raw.headline === 'string' ? raw.headline : `Day ${day} check-in`,
      verdict,
      analysis: typeof raw.analysis === 'string' ? raw.analysis : '',
      actions,
      whatsapp_script: typeof raw.whatsapp_script === 'string' ? raw.whatsapp_script.slice(0, 600) : '',
      metric_to_watch: typeof raw.metric_to_watch === 'string' ? raw.metric_to_watch : '',
    });
  } catch (error: unknown) {
    return serverError('ai-coach', error);
  }
}
