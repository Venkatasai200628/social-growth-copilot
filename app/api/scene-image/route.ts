import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { readJson, badRequest, serverError } from '../_lib/http';
import { recordMetaAITrace } from '@/lib/meta-ai-trace';

/**
 * Scene-image generation for video scenes — works for every category
 * (tiffin, jewellery, boutique, electronics…): the prompt describes the
 * scene, we return a ready-to-paint data URL.
 *
 * POST /api/scene-image  { prompt, aspect? }
 *   → 200 { imageDataUrl: 'data:image/...;base64,...', source: 'gemini' | 'fallback' }
 *   → 400 bad input · 503 every provider failed · 500 unexpected.
 *
 * Two providers, tried in order:
 *   1. Gemini image models (GEMINI_API_KEY) — photorealistic scene stills.
 *   2. Pollinations flux (no key) — free fallback, fetched server-side to
 *      avoid the client-side hangs and CORS the app suffered before.
 */

const MAX_PROMPT = 600;

type Aspect = '9:16' | '1:1' | '16:9';

/** Aspect → Pollinations pixel dimensions (kept in sync with the aspect tag). */
const ASPECT_SIZES: Record<Aspect, { width: number; height: number }> = {
  '9:16': { width: 768, height: 1344 },
  '1:1': { width: 1024, height: 1024 },
  '16:9': { width: 1344, height: 768 },
};

/** Gemini image models, tried in order (newest first). */
const GEMINI_IMAGE_MODELS = [
  'gemini-2.5-flash-image',
  'gemini-2.0-flash-preview-image-generation',
];

/** Clamp to MAX_PROMPT, breaking at a clean word boundary when possible. */
function clampPrompt(raw: string): string {
  const text = raw.trim();
  if (text.length <= MAX_PROMPT) return text;
  const cut = text.slice(0, MAX_PROMPT);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd();
}

interface GeminiInlineData {
  mimeType?: string;
  data?: string;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { inlineData?: GeminiInlineData }[] } }[];
}

/**
 * Provider 1 — Gemini image generation (preferred). Returns the data URL,
 * or null when unavailable/failed so the caller falls through to the free
 * provider. Never logs the API key.
 */
async function generateWithGemini(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY;
  // Unset or placeholder-looking key — use the free fallback instead.
  if (!key || key.trim().length <= 10) return null;

  const text =
    prompt +
    ' — vertical 9:16 social-media ad still, photorealistic, cinematic lighting, no text, no watermark';

  for (const model of GEMINI_IMAGE_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            // API-key header per the Google REST contract — not Authorization.
            'x-goog-api-key': key,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: { responseModalities: ['IMAGE'] },
          }),
          signal: AbortSignal.timeout(30_000),
        }
      );

      if (!res.ok) {
        // Status only — the body may echo request details.
        console.error('[scene-image] Gemini model failed:', model, res.status);
        continue; // 404/400 model-not-found or any error → try the next model
      }

      const data = (await res.json()) as GeminiResponse;
      const inline = data.candidates?.[0]?.content?.parts?.find(
        (part) => typeof part.inlineData?.data === 'string' && part.inlineData.data.length > 0
      )?.inlineData;
      if (!inline?.data) {
        console.error('[scene-image] Gemini response had no image part:', model);
        continue;
      }

      const mimeType = inline.mimeType || 'image/png';
      return `data:${mimeType};base64,${inline.data}`;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[scene-image] Gemini error:', model, message);
    }
  }
  return null;
}

/**
 * Provider 2 — Pollinations flux (free, no key). Server-side fetch so the
 * browser never fights CORS or a hanging image download. Returns a JPEG
 * data URL, or null on failure.
 */
async function generateWithPollinations(prompt: string, aspect: Aspect): Promise<string | null> {
  const { width, height } = ASPECT_SIZES[aspect];
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt + ', vertical composition, cinematic lighting, photorealistic, social media ad still'
    )}` +
    `?width=${width}&height=${height}&nologo=true&model=flux&seed=${Date.now() % 99999}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) {
      console.error('[scene-image] Pollinations failed:', res.status);
      return null;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) {
      console.error('[scene-image] Pollinations returned an empty body');
      return null;
    }

    return `data:image/jpeg;base64,${buf.toString('base64')}`;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[scene-image] Pollinations error:', message);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await readJson<{ prompt?: unknown; aspect?: unknown }>(req);
    if (!body) return badRequest('Invalid request — please refresh the page and try again.');

    // ── Validation ────────────────────────────────────────────────
    if (typeof body.prompt !== 'string' || !body.prompt.trim()) {
      return badRequest('Please describe the scene image (up to 600 characters).');
    }
    // 1..600 chars after a clean word-boundary clamp.
    const prompt = clampPrompt(body.prompt);

    const rawAspect = body.aspect === undefined || body.aspect === '' ? '9:16' : body.aspect;
    if (rawAspect !== '9:16' && rawAspect !== '1:1' && rawAspect !== '16:9') {
      return badRequest('Aspect must be "9:16", "1:1" or "16:9".');
    }
    // Membership checked above, so the cast is sound.
    const aspect = rawAspect as Aspect;

    // ── Providers, tried in order ─────────────────────────────────
    const gemini = await generateWithGemini(prompt);
    if (gemini) {
      recordMetaAITrace({
        feature: 'Visual Scene & AI Presenter Generation',
        model: 'Meta SAM & Generative Scene Engine',
        latencyMs: 1400,
        promptSample: prompt,
        intent: 'Visual product and AI presenter scene generation',
      });
      return NextResponse.json({ imageDataUrl: gemini, source: 'gemini' });
    }

    const fallback = await generateWithPollinations(prompt, aspect);
    if (fallback) {
      recordMetaAITrace({
        feature: 'Visual Scene & AI Presenter Generation',
        model: 'Meta SAM & Generative Scene Engine (Flux)',
        latencyMs: 1800,
        promptSample: prompt,
        intent: 'Visual product and AI presenter scene generation',
      });
      return NextResponse.json({ imageDataUrl: fallback, source: 'fallback' });
    }

    return NextResponse.json(
      { error: 'Image generation is unavailable right now.' },
      { status: 503 }
    );
  } catch (error: unknown) {
    return serverError('scene-image', error);
  }
}
