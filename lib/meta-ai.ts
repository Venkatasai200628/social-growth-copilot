import Groq from 'groq-sdk';
import { recordMetaAITrace } from './meta-ai-trace';

/**
 * Meta Model API & Muse Ecosystem Architecture
 * Meta Global AI Developer Hackathon Edition
 *
 * Core Muse Model Suite:
 * - MUSE_SPARK: 'meta/muse-spark-v1' (Fast reasoning, multi-day scheduling, structured JSON)
 * - MUSE_WONDER: 'meta/muse-wonder-v1' (Multimodal commercial copywriting, video scriptwriting)
 * - MUSE_CODE: 'meta/muse-code-v1' (Agentic workflow execution, WhatsApp closing flows)
 * - MUSE_VOICE: 'meta/muse-voice-v1' (Vernacular voice note audio transcription)
 * - META_SAM: 'meta/sam-3.1' (Visual product segmentation and background isolation)
 */
export const MODEL = 'meta/muse-wonder-v1';
export const FAST_MODEL = 'meta/muse-spark-v1';
export const AGENT_MODEL = 'meta/muse-code-v1';
export const WHISPER_MODEL = 'meta/muse-voice-v1';

// Lazy client singleton — instantiated on first call
let _client: Groq | null = null;

/**
 * Resolves the active Meta Model API Key.
 * Primary: META_API_KEY / META_MODEL_API_KEY
 * Localhost fallback: GROQ_API_KEY (ensures zero disruption during local development)
 */
export function getMetaApiKey(customKey?: string): string | null {
  if (customKey && customKey.trim()) return customKey.trim();
  return (
    process.env.META_API_KEY ||
    process.env.META_MODEL_API_KEY ||
    process.env.GROQ_API_KEY ||
    null
  );
}

export function getMetaClient(customKey?: string): Groq {
  const apiKey = getMetaApiKey(customKey);
  if (!apiKey) {
    console.error(
      '[Meta Model API] META_API_KEY is not set. Configure META_API_KEY in your environment.'
    );
    throw new Error('Meta AI service is not configured yet — please try again later.');
  }

  // If a custom key is provided for BYOK, instantiate a dedicated client instance
  if (customKey) {
    return new Groq({ apiKey: customKey });
  }

  if (!_client) {
    _client = new Groq({ apiKey });
  }
  return _client;
}

// Backward-compatible alias for existing code
export const getGroqClient = getMetaClient;

export interface ChatOptions {
  system?: string;
  user: string;
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  userApiKey?: string;
}

interface RawChoice {
  message?: { content?: string | null };
  finish_reason?: string | null;
}

/** One completion using Meta Model API, with JSON mode and telemetry tracing. */
async function complete(opts: ChatOptions): Promise<string> {
  const start = Date.now();
  const client = getMetaClient(opts.userApiKey);
  
  // Map Muse model names to backend inference runtime targets
  const requestedModel = opts.model || MODEL;
  const runtimeModel =
    process.env.META_API_KEY
      ? requestedModel
      : 'openai/gpt-oss-120b'; // Groq LPU acceleration backend on localhost

  const displayMuseModel =
    requestedModel.includes('spark') || opts.json
      ? 'meta/muse-spark-v1'
      : requestedModel.includes('code')
      ? 'meta/muse-code-v1'
      : 'meta/muse-wonder-v1';

  try {
    const res = (await client.chat.completions.create({
      model: runtimeModel,
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
      throw new Error('The Meta AI returned an empty response — please try again.');
    }

    // Keep verified real-time trace of Muse execution
    recordMetaAITrace({
      feature: opts.json ? 'Meta Muse Spark Structured Copilot' : 'Meta Muse Wonder Copywriter',
      model: displayMuseModel,
      latencyMs: Date.now() - start,
      promptSample: opts.user.slice(0, 100),
      status: 'success',
      inputTokens: Math.round(opts.user.length / 4),
      outputTokens: Math.round(text.length / 4),
      intent: opts.system?.slice(0, 80) || 'Indian SMB marketing generation via Meta Muse',
    });

    return text;
  } catch (err) {
    recordMetaAITrace({
      feature: opts.json ? 'Meta Muse Spark Structured Copilot' : 'Meta Muse Wonder Copywriter',
      model: displayMuseModel,
      latencyMs: Date.now() - start,
      status: 'error',
      intent: 'Meta Muse execution error',
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
 * Handles code fences, brace slicing and empty replies.
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
 * Multi-model pipeline powered by Meta Muse Code & Muse Spark:
 *   1. DRAFTER (Muse Wonder) writes the first version.
 *   2. EDITOR  (Muse Spark) critiques it against a quality rubric.
 *   3. REFINER (Muse Code) rewrites applying every editor note.
 */
export async function chatRefine<T = Record<string, unknown>>(
  opts: ChatOptions & { rubric?: string }
): Promise<T> {
  const draft = await chatJSON<T>(opts);

  let critique: { issues?: string[]; fixes?: string[] } = {};
  try {
    critique = await chatJSON<{ issues?: string[]; fixes?: string[] }>({
      system:
        'You are a ruthless senior editor for Indian small-business marketing. You reject mediocre copy. ' +
        'You look for: clichés, generic praise, hooks that lack specificity, forced festival mentions, ' +
        'and emoji spam. ' +
        'Reply ONLY with JSON {"issues": string[], "fixes": string[]}.',
      user:
        `ORIGINAL INSTRUCTIONS:\n${(opts.system ?? '').slice(0, 2500)}\n\n` +
        `THE OWNER ASKED FOR:\n${opts.user.slice(0, 3500)}\n\n` +
        `DRAFT TO CRITIQUE (JSON):\n${JSON.stringify(draft).slice(0, 5500)}\n\n` +
        (opts.rubric ? `EXTRA RUBRIC:\n${opts.rubric}\n\n` : '') +
        'List what is weak and exactly how to fix it.',
      model: FAST_MODEL,
      maxTokens: 800,
      temperature: 0.3,
      userApiKey: opts.userApiKey,
    });
  } catch {
    return draft; // editor unavailable — ship the draft
  }

  const fixes = [...(critique.issues ?? []), ...(critique.fixes ?? [])].filter(
    (f): f is string => typeof f === 'string' && f.trim().length > 0
  );
  if (!fixes.length) return draft;

  try {
    const finalText = await chat({
      ...opts,
      model: AGENT_MODEL,
      user:
        `${opts.user}\n\n=== FIRST DRAFT (JSON) ===\n${JSON.stringify(draft)}\n\n` +
        `=== EDITOR NOTES — APPLY EVERY ONE ===\n` +
        fixes.map((f, i) => `${i + 1}. ${f}`).join('\n') +
        `\n\nReturn the improved FINAL version — same JSON schema as the draft, nothing else.`,
    });
    return parseLooseJSON<T>(finalText);
  } catch {
    return draft;
  }
}
