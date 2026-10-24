import { NextRequest, NextResponse } from 'next/server';

/**
 * Shared HTTP plumbing for GrowMitra API routes.
 *
 * Every route answers with the same JSON conventions:
 *  - bad input  → 400 { error: '<friendly message>' }
 *  - failure    → 500 { error: '<friendly message>' } — never a stack trace
 *                 or provider/SDK jargon (the raw message is logged instead).
 */

/**
 * Snippets that mark an already user-friendly error message (thrown by
 * lib/groq.ts or by routes themselves). Anything else is treated as
 * internal jargon and replaced with a generic apology.
 */
const FRIENDLY_SNIPPETS = [
  'ran out of space mid-answer',
  'did not return valid JSON',
  'returned an empty response',
  'AI service is not configured',
  'not configured yet',
  'keep recordings under',
];

/** Map an internal error to a message safe to show the owner. */
export function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  if (msg && FRIENDLY_SNIPPETS.some((s) => msg.includes(s))) return msg;
  return 'Something went wrong on our side — please try again in a moment.';
}

/**
 * Parse a JSON object body. Returns null when the body is absent,
 * malformed, or not an object (arrays/strings/null) so the route can
 * answer a friendly 400 instead of crashing into a 500.
 */
export async function readJson<T extends object>(req: NextRequest): Promise<T | null> {
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
    return body as T;
  } catch {
    return null;
  }
}

/** Friendly 400 with the standard { error } envelope. */
export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Log the raw error server-side (never key material) and answer 500 with
 * the standard { error } envelope holding a user-safe message.
 */
export function serverError(route: string, err: unknown): NextResponse {
  const message = err instanceof Error ? err.message : 'Unknown error';
  console.error(`[${route}]`, message);
  return NextResponse.json({ error: friendlyError(err) }, { status: 500 });
}

/** Shared string coercers so AI responses never carry undefined fields. */
export const str = (v: unknown): string => (typeof v === 'string' ? v : '');
export const strArr = (v: unknown, max: number): string[] =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).slice(0, max)
    : [];
