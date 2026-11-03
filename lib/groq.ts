import Groq from 'groq-sdk';
import { recordMetaAITrace } from './meta-ai-trace';

/**
 * Groq model wiring (verified live against the API, Oct 2026).
 * `llama-3.3-70b-versatile` is no longer available on this account
 * (model_not_found), so all text generation runs on gpt-oss-120b —
 * a reasoning model, so every call sets a low reasoning effort and a
 * generous token budget or the answer budget gets eaten by thinking.
 */
export const MODEL = 'openai/gpt-oss-120b';
// NOTE: gpt-oss-20b is blocked at this Groq project's level (verified live),
// so every role runs on 120b with distinct personas/temperatures.
export const FAST_MODEL = 'openai/gpt-oss-120b';
export const WHISPER_MODEL = 'whisper-large-v3';

// Lazy client — instantiated on first call so a missing key returns a
// clean JSON error instead of crashing the route and returning an HTML page.
let _groq: Groq | null = null;

export function getGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    // Full setup hint goes to the server log only; the thrown message is
    // what routes show the owner, so it stays jargon-free.
    console.error(
      '[groq] GROQ_API_KEY is not set. Create a .env.local file with: GROQ_API_KEY=your_key_here'
    );
    throw new Error('AI service is not configured yet — please try again later.');
  }
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

export interface ChatOptions {
  system?: string;
  user: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

interface RawChoice {
  message?: { content?: string | null };
  finish_reason?: string | null;
}

/** One completion, with JSON mode and truncation surfaced as errors. */
async function complete(opts: ChatOptions): Promise<string> {
  const start = Date.now();
  const groq = getGroqClient();
  try {
    // `reasoning_effort` is accepted by the live API (verified) but missing
    // from the installed groq-sdk 0.15 types, hence the widening casts.
    const res = (await groq.chat.completions.create({
      model: opts.model || MODEL,
      messages: [
        ...(opts.system ? [{ role: 'system' as const, content: opts.system }] : []),
        { role: 'user' as const, content: opts.user },
      ],
      max_tokens: opts.maxTokens ?? 3000,
      temperature: opts.temperature ?? 0.7,
      ...(opts.json ? { response_format: { type: 'json_object' as const } } : {}),
      reasoning_effort: 'low',
    } as Parameters<Groq['chat']['completions']['create']>[0])) as unknown as {
      choices?: RawChoice[];
    };
    const choice = (res.choices?.[0] ?? {}) as RawChoice;
    const text = (choice.message?.content ?? '').trim();
    if (choice.finish_reason === 'length') {
      throw new Error('The model ran out of space mid-answer — shorten the request and try again.');
    }
    if (!text) {
      // Empty or whitespace-only reply (e.g. reasoning models that spend the
      // whole budget thinking) — surface as a retryable transient failure.
      throw new Error('The AI returned an empty response — please try again.');
    }

    recordMetaAITrace({
      feature: opts.json ? 'Meta Llama Structured Copilot' : 'Meta Llama Copywriter',
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      latencyMs: Date.now() - start,
      promptSample: opts.user.slice(0, 100),
      status: 'success',
      inputTokens: Math.round(opts.user.length / 4),
      outputTokens: Math.round(text.length / 4),
      intent: opts.system?.slice(0, 80) || 'Indian SMB marketing generation',
    });

    return text;
  } catch (err) {
    recordMetaAITrace({
      feature: opts.json ? 'Meta Llama Structured Copilot' : 'Meta Llama Copywriter',
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      latencyMs: Date.now() - start,
      status: 'error',
      intent: 'Meta AI request execution error',
    });
    throw err;
  }
}

/** Retry-once wrapper: one transient 429/500 should not kill a user request. */
export async function chat(opts: ChatOptions): Promise<string> {
  try {
    return await complete(opts);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    const transient = /rate|429|timeout|overloaded|5\d\d|space mid-answer|empty response/i.test(msg);
    if (!transient) throw err;
    await new Promise((r) => setTimeout(r, 900));
    return complete({ ...opts, maxTokens: (opts.maxTokens ?? 3000) + 1000 });
  }
}

/**
 * Chat call that always resolves to a parsed JSON object.
 * Handles code fences, brace slicing and empty replies so routes can
 * trust the shape.
 */
export async function chatJSON<T = Record<string, unknown>>(opts: ChatOptions): Promise<T> {
  const raw = await chat({ ...opts, json: true });
  return parseLooseJSON<T>(raw);
}

function parseLooseJSON<T>(raw: string): T {
  let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const s = cleaned.indexOf('{');
  const e = cleaned.lastIndexOf('}');
  if (s !== -1 && e !== -1) cleaned = cleaned.slice(s, e + 1);
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error('The model did not return valid JSON. Please try again.');
  }
}

/**
 * Multi-model pipeline — the models review each other:
 *   1. DRAFTER  (gpt-oss-120b, hot) writes the first version.
 *   2. EDITOR   (gpt-oss-20b, cold) critiques it against a quality rubric.
 *   3. REFINER  (gpt-oss-120b) rewrites applying every editor note.
 * Falls back to the draft if the final pass fails to parse, so a bad
 * critique can never make output worse — only better or unchanged.
 */
export async function chatRefine<T = Record<string, unknown>>(opts: ChatOptions & {
  rubric?: string;
}): Promise<T> {
  const draft = await chatJSON<T>(opts);

  let critique: { issues?: string[]; fixes?: string[] } = {};
  try {
    critique = await chatJSON<{ issues?: string[]; fixes?: string[] }>({
      system:
        'You are a ruthless senior editor for Indian small-business marketing. You reject mediocre copy. ' +
        'You look for: clichés and stock phrases, generic praise with no concrete detail, hooks that could belong to any brand, ' +
        'forced festival mentions, wrong language/script, emoji spam, invented offers/discounts/locations the owner never stated, ' +
        'and sentences that waste the reader\'s time. ' +
        'Reply ONLY with JSON {"issues": string[], "fixes": string[]} — max 8 items, each one specific and actionable.',
      user:
        // The editor must see the ORIGINAL system prompt too — otherwise it
        // cannot know the required output language and "fixes" the draft into
        // the wrong one.
        `ORIGINAL INSTRUCTIONS (these define the required output language and rules — the draft MUST obey them):\n${(opts.system ?? '').slice(0, 2500)}\n\n` +
        `THE OWNER ASKED FOR:\n${opts.user.slice(0, 3500)}\n\nDRAFT TO CRITIQUE (JSON):\n${JSON.stringify(draft).slice(0, 5500)}\n\n` +
        (opts.rubric ? `EXTRA RUBRIC:\n${opts.rubric}\n\n` : '') +
        'List what is weak and exactly how to fix it. If a line is already strong, say nothing about it. ' +
        'Never suggest changing the output language away from the one the original instructions require.',
      model: opts.model ?? FAST_MODEL,
      maxTokens: 800,
      temperature: 0.3,
    });
  } catch {
    return draft; // editor unavailable — ship the draft
  }

  const fixes = [...(critique.issues ?? []), ...(critique.fixes ?? [])]
    .filter((f): f is string => typeof f === 'string' && f.trim().length > 0);
  if (!fixes.length) return draft;

  try {
    const finalText = await chat({
      ...opts,
      user:
        `${opts.user}\n\n=== FIRST DRAFT (JSON) ===\n${JSON.stringify(draft)}\n\n=== EDITOR NOTES — APPLY EVERY ONE (but NEVER break the original system rules, especially the output language) ===\n` +
        fixes.map((f, i) => `${i + 1}. ${f}`).join('\n') +
        `\n\nReturn the improved FINAL version — same JSON schema as the draft, nothing else.`,
    });
    return parseLooseJSON<T>(finalText);
  } catch {
    return draft; // refine is a bonus — the draft already shipped quality
  }
}
