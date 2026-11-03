import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { readJson, badRequest, serverError } from '../_lib/http';

/**
 * Text-to-speech for promo-video voiceovers.
 *
 * POST /api/tts  { text, language, voice? }
 *   → 200 with RAW audio bytes (audio/mpeg or audio/wav) — never base64/JSON.
 *   → 400 bad input · 503 no provider available · 500 unexpected.
 *
 * Two providers, tried in order:
 *   1. Sarvam AI (SARVAM_API_KEY) — real Indian-language voices.
 *   2. Google Translate TTS (no key) — free, all 7 languages, chunked+merged MP3.
 * If both fail the client skips the voiceover and renders a silent video,
 * so error messages stay short and human.
 */

const MAX_CHARS = 600;

/** Request language → Sarvam BCP-47 target_language_code. */
const SARVAM_LANGUAGES = {
  english: 'en-IN',
} as const;

type Language = keyof typeof SARVAM_LANGUAGES;

/** Set (not `in`) so prototype keys like "toString" can never pass validation. */
const LANGUAGE_KEYS = new Set<string>(Object.keys(SARVAM_LANGUAGES));

/** Clamp to MAX_CHARS, breaking at a clean word boundary when possible. */
function clampText(raw: string): string {
  const text = raw.trim();
  if (text.length <= MAX_CHARS) return text;
  const cut = text.slice(0, MAX_CHARS);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

/**
 * Provider 1 — Sarvam AI (preferred: real Indian-language voices).
 * Returns the audio response, or null when unavailable/failed (caller
 * falls through to the free provider). Never logs the API key.
 */
async function synthesizeWithSarvam(
  text: string,
  language: Language,
  voice: 'female' | 'male'
): Promise<NextResponse | null> {
  const key = process.env.SARVAM_API_KEY;
  // Unset or placeholder-looking key — use the free fallback instead.
  if (!key || key.trim().length <= 10) return null;

  try {
    const res = await fetch('https://api.sarvam.ai/v1/text-to-speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        target_language_code: SARVAM_LANGUAGES[language],
        model: 'bulbul:v1',
        // Canonical bulbul:v1 speakers (lowercase, case-sensitive).
        speaker: voice === 'male' ? 'rohit' : 'meera',
        audio_format: 'MP3',
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      // Status only — the body may echo request details.
      console.error('[tts] Sarvam TTS failed:', res.status);
      return null;
    }

    const data = (await res.json()) as { audios?: unknown };
    const b64 = Array.isArray(data.audios) && typeof data.audios[0] === 'string'
      ? data.audios[0]
      : '';
    const audio = Buffer.from(b64, 'base64');
    if (audio.length === 0) {
      console.error('[tts] Sarvam returned empty audio');
      return null;
    }

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        'content-type': 'audio/mpeg',
        'content-length': String(audio.length),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[tts] Sarvam TTS error:', message);
    return null;
  }
}

/**
 * Provider 2 — Google Translate TTS (free, no key). Unofficial but stable
 * for years; supports all our languages. One request per ~190-char chunk
 * (the endpoint's limit), MP3 frames concatenated — valid because each
 * chunk is a self-contained MPEG stream and players handle serial frames.
 * Gender is not controllable here; Sarvam handles voice gender.
 */
const GTTS_LANG: Record<Language, string> = {
  english: 'en',
};

function chunkText(text: string, size = 190): string[] {
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > size) {
    let cut = rest.lastIndexOf(' ', size);
    if (cut <= 0) cut = size;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

async function synthesizeWithGoogle(text: string, language: Language): Promise<NextResponse | null> {
  const tl = GTTS_LANG[language];
  const chunks = chunkText(text);
  try {
    const parts: Uint8Array[] = [];
    for (const chunk of chunks) {
      const url =
        `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob` +
        `&q=${encodeURIComponent(chunk)}&tl=${tl}`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        console.error('[tts] Google TTS failed:', res.status);
        return null;
      }
      const buf = new Uint8Array(await res.arrayBuffer());
      if (buf.length < 200) {
        console.error('[tts] Google TTS returned a suspiciously short body');
        return null;
      }
      parts.push(buf);
    }
    const total = parts.reduce((n, p) => n + p.length, 0);
    const merged = new Uint8Array(total);
    let at = 0;
    for (const p of parts) {
      merged.set(p, at);
      at += p.length;
    }
    return new NextResponse(merged, {
      status: 200,
      headers: { 'content-type': 'audio/mpeg', 'content-length': String(total) },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[tts] Google TTS error:', message);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await readJson<{ text?: unknown; language?: unknown; voice?: unknown }>(req);
    if (!body) return badRequest('Invalid request — please refresh the page and try again.');

    // ── Validation ────────────────────────────────────────────────
    if (typeof body.text !== 'string' || !body.text.trim()) {
      return badRequest('Please provide the voiceover text (up to 600 characters).');
    }

    const rawLanguage =
      body.language === undefined || body.language === '' ? 'english' : body.language;
    if (typeof rawLanguage !== 'string' || !LANGUAGE_KEYS.has(rawLanguage)) {
      return badRequest('Voiceover supports English.');
    }
    // Membership checked against LANGUAGE_KEYS above, so the cast is sound.
    const language = rawLanguage as Language;

    const rawVoice = body.voice === undefined || body.voice === '' ? 'female' : body.voice;
    if (rawVoice !== 'female' && rawVoice !== 'male') {
      return badRequest('Voice must be "female" or "male".');
    }
    const voice: 'female' | 'male' = rawVoice;

    // Client sends the script's first ~500 chars — hard-clamp anything longer.
    const text = clampText(body.text);

    // ── Providers, tried in order ─────────────────────────────────
    const sarvam = await synthesizeWithSarvam(text, language, voice);
    if (sarvam) return sarvam;

    const fallback = await synthesizeWithGoogle(text, language);
    if (fallback) return fallback;

    return NextResponse.json(
      { error: 'Voice is unavailable right now — the video will be silent.' },
      { status: 503 }
    );
  } catch (error: unknown) {
    return serverError('tts', error);
  }
}
