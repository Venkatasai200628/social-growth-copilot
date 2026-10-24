import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-guard';
import { readJson, badRequest, friendlyError } from '../_lib/http';

// New Composio SDK: @composio/core v0.8+
// Dynamic import to avoid build errors if not installed
async function getComposioClient() {
  const { Composio } = await import('@composio/core');
  const apiKey = process.env.COMPOSIO_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('COMPOSIO_API_KEY not configured in .env.local');
  }
  const composio = new Composio({ apiKey });
  return composio.getClient();
}

// POST — publish post to Instagram
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await readJson<{ imageUrl?: string; caption?: string; hashtags?: string[] }>(req);
    if (!body) return badRequest('Invalid request — please regenerate your post and try again.');
    const { imageUrl, caption, hashtags } = body;

    if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
      return NextResponse.json({
        error: 'An image URL is required to post to Instagram. Enable AI image generation by adding TOGETHER_API_KEY to .env.local, then regenerate your post.',
      }, { status: 400 });
    }

    const tags = Array.isArray(hashtags)
      ? hashtags.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      : [];
    const fullCaption = tags.length
      ? `${typeof caption === 'string' ? caption : ''}\n\n${tags.join(' ')}`
      : typeof caption === 'string' ? caption : '';

    const client = await getComposioClient();
    const entityId = process.env.COMPOSIO_ENTITY_ID || 'default';

    // Execute the Instagram publish action
    // @ts-expect-error — composio SDK types don't match runtime API
    const result = await client.tools.execute({
      slug: 'INSTAGRAM_MEDIA_PUBLISH',
      connectedAccountId: entityId,
      input: {
        image_url: imageUrl.trim(),
        caption: fullCaption,
      },
    });

    return NextResponse.json({
      success: true,
      post: result,
      message: 'Successfully posted to Instagram!',
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[instagram-post]', message);

    if (message.includes('COMPOSIO_API_KEY') || message.includes('not configured')) {
      return NextResponse.json({
        error: 'Publishing is not configured yet. Add COMPOSIO_API_KEY to .env.local — get it from app.composio.dev/settings',
      }, { status: 400 });
    }
    if (message.includes('connected account') || message.includes('ConnectedAccount') || message.includes('not found')) {
      return NextResponse.json({
        error: 'Instagram not connected to Composio. Go to app.composio.dev → Connections → Add Instagram → connect your account.',
      }, { status: 401 });
    }
    if (message.includes('image') || message.includes('media') || message.includes('url')) {
      return NextResponse.json({
        error: 'Instagram rejected the image URL. Make sure TOGETHER_API_KEY is set so a real public image URL is generated.',
      }, { status: 400 });
    }

    return NextResponse.json({ error: friendlyError(error) }, { status: 500 });
  }
}

// GET — check if Instagram is connected via Composio
export async function GET() {
  try {
    const apiKey = process.env.COMPOSIO_API_KEY;
    if (!apiKey || apiKey.includes('your_')) {
      return NextResponse.json({ connected: false, reason: 'no_api_key' });
    }

    const client = await getComposioClient();

    // List connected accounts and find Instagram
    const accounts = await client.connectedAccounts.list({});
    const igAccount = (accounts?.items || []).find(
      (a: { appName?: string; status?: string }) =>
        a.appName?.toLowerCase().includes('instagram') && a.status === 'ACTIVE'
    );

    return NextResponse.json({
      connected: !!igAccount,
      accountId: igAccount?.id || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      username: ((igAccount as any)?.metadata?.username) || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[instagram-check]', message);
    return NextResponse.json({ connected: false, reason: 'error', detail: friendlyError(err) });
  }
}
