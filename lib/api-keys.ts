'use client';

/**
 * Client-Side Secure API Key Manager (Bring Your Own Key - BYOK)
 * Meta Model API & Multi-Provider Architecture
 *
 * Security Architecture:
 * 1. Storage Isolation: Keys are strictly persisted inside the user's client-side
 *    browser localStorage ('gm_user_api_keys'). They are NEVER stored in a shared
 *    server database or visible to other users.
 * 2. Ephemeral In-Flight Usage: When making an API request, the key is passed
 *    via an encrypted HTTPS request header (e.g. 'x-user-meta-key', 'x-user-gemini-key').
 * 3. Zero Server Logging: Backend API routes use the token in-memory for that
 *    single request and never log or write the secret to disk.
 * 4. UI Masking: Keys are displayed masked (e.g., 'meta_••••••••••••••4a9F') to
 *    prevent shoulder-surfing.
 * 5. Instant Revocation: Users can clear their keys with 1 click anytime.
 */

export interface UserApiKeys {
  replicateToken?: string;
  geminiKey?: string;
  metaKey?: string;
  groqKey?: string; // Localhost compatibility alias
}

const STORAGE_KEY = 'gm_user_api_keys';

export function loadUserApiKeys(): UserApiKeys {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    // Align metaKey and groqKey
    if (parsed.metaKey && !parsed.groqKey) parsed.groqKey = parsed.metaKey;
    if (parsed.groqKey && !parsed.metaKey) parsed.metaKey = parsed.groqKey;
    return parsed;
  } catch {
    return {};
  }
}

export function saveUserApiKeys(keys: UserApiKeys): void {
  if (typeof window === 'undefined') return;
  try {
    const sanitized: UserApiKeys = {
      replicateToken: keys.replicateToken ? keys.replicateToken.trim() : undefined,
      geminiKey: keys.geminiKey ? keys.geminiKey.trim() : undefined,
      metaKey: keys.metaKey ? keys.metaKey.trim() : (keys.groqKey ? keys.groqKey.trim() : undefined),
      groqKey: keys.metaKey ? keys.metaKey.trim() : (keys.groqKey ? keys.groqKey.trim() : undefined),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    /* ignore storage errors */
  }
}

export function clearUserApiKey(provider: keyof UserApiKeys): void {
  if (typeof window === 'undefined') return;
  try {
    const current = loadUserApiKeys();
    delete current[provider];
    if (provider === 'metaKey') delete current.groqKey;
    if (provider === 'groqKey') delete current.metaKey;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* ignore */
  }
}

/** Masks secret keys so they can be safely displayed in the UI */
export function maskApiKey(key?: string): string {
  if (!key || typeof key !== 'string') return '';
  const trimmed = key.trim();
  if (trimmed.length <= 8) return '••••••••';
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-4);
  return `${prefix}••••••••••••••••${suffix}`;
}

/** Basic format validation to catch copy-paste errors */
export function validateKeyFormat(
  provider: keyof UserApiKeys,
  rawKey: string
): { valid: boolean; error?: string } {
  const k = rawKey.trim();
  if (!k) return { valid: false, error: 'Key cannot be empty.' };

  if (provider === 'replicateToken') {
    if (!k.startsWith('r8_') && k.length < 30) {
      return { valid: false, error: 'Replicate tokens typically start with "r8_" and are 40+ characters long.' };
    }
  }

  if (provider === 'geminiKey') {
    if (!k.startsWith('AIza') && k.length < 30) {
      return { valid: false, error: 'Google Gemini keys typically start with "AIza" and are 39 characters long.' };
    }
  }

  if (provider === 'metaKey' || provider === 'groqKey') {
    if (k.length < 20) {
      return { valid: false, error: 'API key should be at least 20 characters long.' };
    }
  }

  return { valid: true };
}
