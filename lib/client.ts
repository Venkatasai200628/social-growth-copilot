'use client';
import { getAuth } from 'firebase/auth';
import { getApp } from 'firebase/app';

/**
 * Authenticated fetch for GrowMitra API routes. Attaches the Firebase ID
 * token when a user is signed in; routes reject unauthenticated calls to
 * AI endpoints. Falls back to a plain fetch when no user is signed in
 * (the route will decide what to do with it).
 */
export async function authFetch(url: string, body?: unknown, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers || {});
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  try {
    const auth = getAuth(getApp());
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) headers.set('Authorization', `Bearer ${token}`);
    }
  } catch {
    // Firebase not initialized — send without token.
  }
  return fetch(url, {
    ...init,
    method: init.method ?? (body !== undefined ? 'POST' : 'GET'),
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

/** Copy text to clipboard with a legacy fallback. Returns true on success. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

/** wa.me deep link with URL-safe pre-filled text (WhatsApp-first sharing). */
export function whatsappLink(phone: string | undefined, text: string): string {
  const encoded = encodeURIComponent(text.slice(0, 300));
  const num = (phone || '').replace(/[^\d]/g, '');
  return `https://wa.me/${num}?text=${encoded}`;
}

/** Download any text/blob as a file. */
export function downloadFile(data: Blob | string, filename: string, type = 'text/plain') {
  const blob = typeof data === 'string' ? new Blob([data], { type: `${type};charset=utf-8` }) : data;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
