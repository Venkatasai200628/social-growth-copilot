import { NextRequest, NextResponse } from 'next/server';
import { chatJSON } from '@/lib/groq';
import { requireAuth } from '@/lib/auth-guard';
import { languagePrompt } from '@/lib/india';
import { readJson, badRequest } from '../_lib/http';

interface VoiceMetrics {
  reach?: number;
  clicks?: number;
  impressions?: number;
  conversions?: number;
  note?: string;
}

const SYSTEM_PROMPT =
  'Extract business metrics from what the owner just said or typed. They may speak any mix of languages — understand it all, but reply in English. Return ONLY JSON: {"reach": number, "clicks": number, "impressions": number, "conversions": number, "note": string}. Use 0 when a metric wasn\'t mentioned. \'note\' is ONE short friendly English sentence confirming what you understood, e.g. \'Got it — 4200 reach and 60 orders today.\'';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await readJson<{ language?: unknown; transcript?: unknown }>(req);
    if (!body) return badRequest('Please say or type your numbers again.');
    const language = typeof body.language === 'string' ? body.language : undefined;
    const transcript = typeof body.transcript === 'string' ? body.transcript.trim() : '';

    if (transcript.length < 3) {
      return NextResponse.json(
        { error: 'Say a little more — for example: "aaj 4200 logo tak pahuncha, 60 orders hue".' },
        { status: 400 }
      );
    }

    const raw = await chatJSON<VoiceMetrics>({
      system: SYSTEM_PROMPT + (language ? ' ' + languagePrompt(language) : ''),
      user: transcript,
      temperature: 0.2,
      maxTokens: 300,
    });

    return NextResponse.json({
      reach: Number(raw.reach) || 0,
      clicks: Number(raw.clicks) || 0,
      impressions: Number(raw.impressions) || 0,
      conversions: Number(raw.conversions) || 0,
      note: typeof raw.note === 'string' ? raw.note : '',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[voice-metrics]', message);
    return NextResponse.json(
      { error: 'Could not understand the numbers right now — please type them in instead.' },
      { status: 500 }
    );
  }
}
