import { NextRequest, NextResponse } from 'next/server';
import { WHISPER_MODEL } from '@/lib/groq';
import { requireAuth } from '@/lib/auth-guard';

const MAX_BYTES = 25 * 1024 * 1024; // 25MB hard guard

/**
 * Transcribes a voice note with Groq Whisper (whisper-large-v3).
 * Accepts multipart/form-data with an 'audio' File (webm/mp3/wav).
 * Uses plain fetch — the groq-sdk audio API shape differs and is avoided here.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

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

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Transcription is not configured yet. Please try again later.' },
        { status: 500 }
      );
    }

    const fd = new FormData();
    fd.append('model', WHISPER_MODEL);
    fd.append('file', file, file.name || 'audio.webm');
    fd.append('response_format', 'json');

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: fd,
    });

    if (!res.ok) {
      // Never log the API key or the full response body — status only.
      console.error('[transcribe] Groq whisper failed:', res.status);
      return NextResponse.json(
        { error: 'Could not transcribe that recording. Please try again in a moment.' },
        { status: 502 }
      );
    }

    const data = (await res.json()) as { text?: string };
    return NextResponse.json({ text: typeof data.text === 'string' ? data.text : '' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[transcribe]', message);
    return NextResponse.json(
      { error: 'Transcription failed. Please try recording again.' },
      { status: 500 }
    );
  }
}
