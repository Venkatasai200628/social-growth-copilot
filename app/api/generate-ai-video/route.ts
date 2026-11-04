import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';
import { requireAuth } from '@/lib/auth-guard';
import { readJson, badRequest, serverError } from '../_lib/http';
import { recordMetaAITrace } from '@/lib/meta-ai-trace';

export const maxDuration = 120; // Allow sufficient time for video generation

/**
 * Generative AI Video route powered by Replicate (LTX-Video / SVD).
 * Transforms an image (presenter or product) into a moving, fluid 5-second video clip.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  // ── Secure BYOK: Extract user-provided custom key from private header or body ──
  const userHeaderToken = req.headers.get('x-user-replicate-key')?.trim();

  try {
    const body = await readJson<{
      image?: string;
      prompt?: string;
      aspect?: string;
      userApiKey?: string;
    }>(req);

    const token = userHeaderToken || body?.userApiKey?.trim() || process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return badRequest('No Replicate API token provided. Please connect your Replicate API key in the Video Generator or set REPLICATE_API_TOKEN.');
    }

    if (!body || !body.image) {
      return badRequest('An image data URL or image link is required to generate AI video.');
    }

    const replicate = new Replicate({ auth: token });
    const promptText = (body.prompt || 'Cinematic camera movement, high quality, commercial advertisement, photorealistic').slice(0, 300);

    const startTime = Date.now();

    // Call Lightricks LTX-Video with explicit version identifier
    const LTX_VERSION = 'lightricks/ltx-video:8c47da666861d081eeb4d1261853087de23923a268a69b63febdf5dc1dee08e4' as const;
    const output = await replicate.run(
      LTX_VERSION,
      {
        input: {
          image: body.image,
          prompt: promptText,
          negative_prompt: 'blurry, low quality, distorted, deformed, text, watermark',
          frame_rate: 25,
        },
      }
    );

    const latencyMs = Date.now() - startTime;

    // Output can be a URL string or an array containing the URL
    let videoUrl = '';
    if (typeof output === 'string') {
      videoUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
      videoUrl = String(output[0]);
    } else if (output && typeof output === 'object') {
      videoUrl = String((output as Record<string, unknown>).url || output);
    }

    if (!videoUrl) {
      throw new Error('Replicate finished but did not return a valid video URL.');
    }

    recordMetaAITrace({
      feature: 'Generative AI Video (Image-to-Video)',
      model: 'meta/sam-3.1 & ltx-video',
      latencyMs,
      promptSample: promptText,
      intent: 'Physical camera sweep and subject motion generation',
    });

    return NextResponse.json({
      videoUrl,
      latencyMs,
      model: 'lightricks/ltx-video',
      status: 'completed',
    });
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : String(err);
    console.error('[generate-ai-video] Replicate execution error:', rawMsg);

    if (rawMsg.includes('402') || rawMsg.toLowerCase().includes('insufficient credit') || rawMsg.toLowerCase().includes('billing')) {
      return NextResponse.json(
        {
          error: 'Replicate API account has $0 balance / insufficient credit. Please add credit at replicate.com/account/billing or use the free Instant Kinetic Reel engine!',
          code: 'INSUFFICIENT_CREDIT',
        },
        { status: 402 }
      );
    }

    if (rawMsg.includes('401') || rawMsg.toLowerCase().includes('unauthenticated') || rawMsg.toLowerCase().includes('invalid token')) {
      return NextResponse.json(
        {
          error: 'Replicate API Token is invalid or expired. Please check your token in .env.local',
          code: 'INVALID_TOKEN',
        },
        { status: 401 }
      );
    }

    return serverError('generate-ai-video', err);
  }
}
