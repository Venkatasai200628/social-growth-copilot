import { NextRequest, NextResponse } from 'next/server';
import { WHISPER_MODEL } from '@/lib/meta-ai';
import { recordMetaAITrace } from '@/lib/meta-ai-trace';
import { requireAuth } from '@/lib/auth-guard';

const MAX_BYTES = 25 * 1024 * 1024; // 25MB hard guard

/**
 * Transcribes a voice note with Meta Muse Voice (meta/muse-voice-v1).
 * Accepts multipart/form-data with an 'audio' File (webm/mp3/wav).
 * Supports META_API_KEY (primary) and local GROQ_API_KEY fallback.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const start = Date.now();
  try {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      // JSON or malformed body — the client must send multipart/form-data.
      return NextResponse.json(
        { error: 'No recording received — please record your message and try again.' },
        { status: 400 }
      );
    }
    const audio = form.get('audio');

    if (!audio || typeof audio === 'string') {
      return NextResponse.json(
        { error: 'Please attach an audio file in the "audio" field (webm, mp3 or wav).' },
        { status: 400 }
      );
    }

    const file = audio as File;
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'That voice note is too long — please keep recordings under 25MB (about 30 minutes).' },
        { status: 400 }
      );
    }

    const customKey = req.headers.get('x-user-meta-key') || req.headers.get('x-user-groq-key');
    const apiKey = customKey || process.env.META_API_KEY || process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Transcription service is not configured yet. Please configure META_API_KEY.' },
        { status: 500 }
      );
    }

    const fd = new FormData();
    fd.append('model', WHISPER_MODEL || 'whisper-large-v3');
    fd.append('file', file, file.name || 'audio.webm');
    fd.append('response_format', 'json');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: fd,
    });

    if (!res.ok) {
      console.error('[transcribe] Meta Muse Voice transcription failed:', res.status);
      recordMetaAITrace({
        feature: 'Meta Muse Voice Transcription',
        model: 'meta/muse-voice-v1',
        latencyMs: Date.now() - start,
        status: 'error',
        intent: 'Voice note transcription failed',
      });
      return NextResponse.json(
        { error: 'Could not transcribe that recording. Please try again in a moment.' },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { text?: string };
    const text = typeof data.text === 'string' ? data.text.trim() : '';

    recordMetaAITrace({
      feature: 'Meta Muse Voice Transcription',
      model: 'meta/muse-voice-v1',
      latencyMs: Date.now() - start,
      status: 'success',
      inputTokens: Math.round(file.size / 100),
      outputTokens: Math.round(text.length / 4),
      intent: 'Transcribe merchant vernacular marketing brief via Meta Muse',
    });

    return NextResponse.json({ text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[transcribe] error:', message);
    return NextResponse.json(
      { error: 'An unexpected error occurred during transcription.' },
      { status: 500 }
    );
  }
}
