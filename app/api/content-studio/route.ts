import { NextRequest, NextResponse } from 'next/server';
import { chatJSON } from '@/lib/groq';
import { languagePrompt, festivalPrompt } from '@/lib/india';
import { requireAuth } from '@/lib/auth-guard';
import { CATEGORIES, GOALS } from '@/lib/types';
import { readJson, badRequest, serverError, str, strArr } from '../_lib/http';

interface StudioIdea {
  format?: unknown; description?: unknown; example?: unknown; difficulty?: unknown; virality?: unknown;
}
interface StudioDataAI {
  reel_formats?: unknown;
  hooks?: unknown;
  content_angles?: unknown;
  hashtag_sets?: unknown;
  competitor_angles?: unknown;
  best_posting_times?: unknown;
  content_dont?: unknown;
}

/** Coerce one reel_format — the page renders these fields directly. */
const reelFormat = (r: StudioIdea) => ({
  format: str(r.format),
  description: str(r.description),
  example: str(r.example),
  difficulty: str(r.difficulty) || 'Easy',
  virality: Math.max(0, Math.min(100, Math.round(Number(r.virality) || 0))),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const form = await readJson<{
      businessName?: string; category?: string; goal?: string;
      platforms?: string[]; language?: string; festival?: string;
    }>(req);
    if (!form) return badRequest('Invalid request — please refresh the page and try again.');
    const {
      businessName, category, goal, platforms, language, festival,
    } = form;

    if (!category?.trim()) {
      return NextResponse.json({ error: 'Please choose your business category.' }, { status: 400 });
    }

    const cat = CATEGORIES.find((c) => c.value === category);
    const goalMeta = GOALS.find((g) => g.value === goal);
    const platformList = Array.isArray(platforms) && platforms.length > 0 ? platforms : ['Instagram'];

    const systemPrompt = `You are an expert social media content strategist for Indian small businesses. You generate trending, ready-to-use content ideas tuned to how Indian audiences actually engage (festival moments, WhatsApp forwardability, local-city pride).
${languagePrompt(language)}
${festivalPrompt(festival, goal)}
CRITICAL: The current calendar year is 2026. NEVER output '2024' or past years in hooks, ideas, or examples. Any season or collection must be 2026 (or 2027).
Hooks and examples must be written in English; structural labels and set names stay English too. Respond ONLY with valid JSON — no markdown, no fences.`;

    const prompt = `Generate trending content ideas for this business.

BUSINESS: ${businessName?.trim() || 'this business'}
CATEGORY: ${cat?.label ?? category}
GOAL: ${goalMeta?.label ?? 'Brand Awareness'}
PLATFORMS: ${platformList.join(', ')}

Respond ONLY with this JSON shape:
{
  "reel_formats": [
    { "format": "format name", "description": "what it is", "example": "exact example for this product, in English", "difficulty": "Easy|Medium|Hard", "virality": 85 }
  ],
  "hooks": [
    { "hook": "exact hook text, in English", "type": "Curiosity|Shock|Relatability|FOMO|Humor", "platform": "Instagram" }
  ],
  "content_angles": [
    { "angle": "angle name", "description": "how to execute", "example": "specific example for this product" }
  ],
  "hashtag_sets": [
    { "set_name": "Niche", "tags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"] },
    { "set_name": "Broad", "tags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"] },
    { "set_name": "Trending", "tags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"] },
    { "set_name": "Local (India)", "tags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"] }
  ],
  "competitor_angles": ["angle1", "angle2", "angle3"],
  "best_posting_times": [
    { "platform": "Instagram", "times": ["7:00 PM", "12:00 PM"], "reason": "why" }
  ],
  "content_dont": ["mistake1", "mistake2", "mistake3"]
}

Rules:
- reel_formats: 5 formats, highly specific to ${cat?.label ?? category}
- hooks: 8 hooks, varied types, ready to use word-for-word, in English
- content_angles: 5 angles specific to ${cat?.label ?? category} and goal: ${goalMeta?.label ?? 'Brand Awareness'}
- hashtag_sets: exactly 4 sets, 5-8 tags each, real working hashtags (mix category tags, brand tags and local-city tags)
- best_posting_times: for each platform in [${platformList.join(', ')}] with IST times for India
- content_dont: 3 common mistakes for ${cat?.label ?? category} promotion`;

    const raw = await chatJSON<StudioDataAI>({
      system: systemPrompt,
      user: prompt,
      temperature: 0.8,
      maxTokens: 3000,
    });

    // ── Coerce: the page calls .join()/.map() on nested fields, so every
    // array must be an array and every field must exist.
    const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
    const obj = (v: unknown): Record<string, unknown> =>
      v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
    const data = {
      reel_formats: arr(raw.reel_formats).slice(0, 10).map((r) => reelFormat(r as StudioIdea)),
      hooks: arr(raw.hooks).slice(0, 15).map((h) => {
        const o = obj(h);
        return { hook: str(o.hook), type: str(o.type), platform: str(o.platform) };
      }),
      content_angles: arr(raw.content_angles).slice(0, 10).map((a) => {
        const o = obj(a);
        return { angle: str(o.angle), description: str(o.description), example: str(o.example) };
      }),
      hashtag_sets: arr(raw.hashtag_sets).slice(0, 6).map((s) => {
        const o = obj(s);
        return { set_name: str(o.set_name) || 'Hashtags', tags: strArr(o.tags, 15) };
      }),
      competitor_angles: strArr(raw.competitor_angles, 8),
      best_posting_times: arr(raw.best_posting_times).slice(0, 8).map((t) => {
        const o = obj(t);
        return { platform: str(o.platform), times: strArr(o.times, 6), reason: str(o.reason) };
      }),
      content_dont: strArr(raw.content_dont, 6),
    };

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return serverError('content-studio', error);
  }
}
