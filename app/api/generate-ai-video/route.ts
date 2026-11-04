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

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return badRequest('REPLICATE_API_TOKEN is not configured on the server.');
  }

  try {
    const body = await readJson<{
      image?: string;
      prompt?: string;
      aspect?: string;
    }>(req);

    if (!body || !body.image) {
      return badRequest('An image data URL or image link is required to generate AI video.');
    }

    const replicate = new Replicate({ auth: token });
    const promptText = (body.prompt || 'Cinematic camera movement, high quality, commercial advertisement, photorealistic').slice(0, 300);

    const startTime = Date.now();

    // Call Lightricks LTX-Video for rapid, high-quality image-to-video diffusion
    const output = await replicate.run(
      'lightricks/ltx-video',
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
      model: 'Meta SAM & Lightricks LTX Diffusion',
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
  } catch (err) {
    return serverError('generate-ai-video', err);
  }
}
