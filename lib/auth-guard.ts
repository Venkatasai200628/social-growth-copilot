import { NextRequest, NextResponse } from 'next/server';

/**
 * Firebase ID-token guard for API routes.
 *
 * Verifies `Authorization: Bearer <firebase idToken>` against Google's
 * identitytoolkit lookup endpoint. Returns `{ uid }` on success, or a 401
 * NextResponse the route should return as-is:
 *
 *   const auth = await requireAuth(req);
 *   if (auth instanceof NextResponse) return auth;
 *
 * If NEXT_PUBLIC_FIREBASE_API_KEY is not configured the guard lets the
 * request through as uid 'dev' so local development keeps working.
 */

interface LookupUser {
  localId?: string;
}

interface LookupResponse {
  users?: LookupUser[];
}

const UNAUTHORIZED = { error: 'Please sign in to use this feature.' };

export async function requireAuth(req: NextRequest): Promise<{ uid: string } | NextResponse> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return { uid: 'dev' }; // dev fallback — no Firebase project configured

  const header = req.headers.get('authorization') ?? '';
  const idToken = header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!idToken) return NextResponse.json(UNAUTHORIZED, { status: 401 });

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        // Hard deadline so a hung identity service can never hang the route.
        signal: AbortSignal.timeout(5000),
      }
    );
    if (!res.ok) return NextResponse.json(UNAUTHORIZED, { status: 401 });

    const data = (await res.json()) as LookupResponse;
    const uid = data.users?.[0]?.localId;
    if (!uid) return NextResponse.json(UNAUTHORIZED, { status: 401 });

    return { uid };
  } catch {
    // Network/identity-service failure — treat as unauthenticated rather than 500.
    return NextResponse.json(UNAUTHORIZED, { status: 401 });
  }
}
