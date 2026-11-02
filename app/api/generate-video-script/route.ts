import { NextRequest, NextResponse } from 'next/server';
import { chatJSON } from '@/lib/groq';
import { languagePrompt, festivalPrompt } from '@/lib/india';
import { requireAuth } from '@/lib/auth-guard';
import { readJson, badRequest, serverError, str, strArr } from '../_lib/http';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await readJson<{
      businessName?: string; category?: string; productDescription?: string; targetAudience?: string;
      platform?: string; duration?: number; style?: string; goal?: string; hook?: string;
      language?: string; festival?: string; photoCount?: number;
    }>(req);
    if (!body) return badRequest('Invalid request — please refresh the page and try again.');
    const { businessName, category, productDescription, targetAudience,
            platform, duration, style, goal, hook, language, festival, photoCount } = body;

    // ── Validation ────────────────────────────────────────────────
    if (!businessName?.trim()) return badRequest('Business name is required.');
    if (!category?.trim()) return badRequest('Please choose your business category.');
    if (!productDescription?.trim()) return badRequest('Please describe your product or service.');
    if (!platform?.trim()) return badRequest('Please choose a platform.');
    if (typeof duration !== 'number' || Number.isNaN(duration) || duration <= 0) {
      return badRequest('Video duration must be a number of seconds.');
    }

    const systemPrompt = `You are an expert video director and social media content strategist for Indian small businesses. You write scripts a shop owner can film on a phone today: exact shots, exact spoken words, no jargon.
${languagePrompt(language)}
${festivalPrompt(festival, [productDescription, style].filter(Boolean).join(' '))}
CRITICAL CURRENT YEAR CONSTRAINT: The current calendar year is 2026. NEVER output '2024' or past years in video titles, hooks, voiceover lines, or overlays. Any festive season, collection, or offer is in 2026 (or 2027).
EVERY scene must visually reference the ACTUAL product/service details from the brief (dish names, materials, city, offer) — a scene that could belong to any business is a failure. text_overlay is the caption burned onto the video for that scene: 3-7 punchy English words, not a stage direction. The visual field of each scene is used VERBATIM as the AI image-generation prompt for that scene — write it as a concrete, filmable shot description (subject, action, setting, lighting), never a vague instruction. The voiceover_script, hook_line, scene voiceovers, text overlays, caption and cta must all be in English (Indian English phrasing). NEVER invent offers, discounts, delivery promises, locations or ingredients the owner did not state — if there is no offer, make the CTA about visiting/enquiring/ordering. Field names stay English. Respond ONLY with valid JSON — no markdown, no code fences.`;

    const prompt = `Create a complete video production package for "${businessName}" (${category}).

PRODUCT: ${productDescription}
${typeof photoCount === 'number' && photoCount > 0 ? `OWNER PHOTOS: the owner uploaded ${Math.min(photoCount, 6)} real photos of their items — the FIRST ${Math.min(photoCount, 6)} scenes must show exactly those items (the photos become the video's opening shots)
` : ''}AUDIENCE: ${targetAudience || 'general audience'}
PLATFORM: ${platform} (${duration}-second video)
STYLE: ${style || 'natural and authentic'}
GOAL: ${goal || 'engagement'}
${hook?.trim() ? `HOOK IDEA: ${hook}` : ''}

Respond ONLY in valid JSON (no markdown):
{
  "title": "<video title>",
  "hook_line": "<the very first spoken sentence, in English — must stop the scroll in 2 seconds>",
  "voiceover_script": "<complete word-for-word voiceover script in English, natural speech, ${duration} seconds when read aloud at normal pace>",
  "scenes": [
    {
      "scene_number": 1,
      "duration_seconds": <number>,
      "shot_type": "<e.g. Close-up, Wide shot, Over-the-shoulder>",
      "visual": "<exactly what to film — be very specific about framing, movement, props>",
      "voiceover": "<exact words spoken during this scene, in English>",
      "text_overlay": "<on-screen text or caption to show, in English>",
      "music_mood": "<e.g. Upbeat, Emotional, Energetic>"
    }
  ],
  "caption": "<full ready-to-post caption in English with hook, body, CTA and emojis — no invented offers>",
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8","#tag9","#tag10","#tag11","#tag12","#tag13","#tag14","#tag15"],
  "thumbnail_idea": "<describe the perfect thumbnail — text overlay, visual, colors>",
  "cta": "<specific call-to-action to say at end of video, in English>",
  "editing_tips": ["<tip 1 for editing this video>","<tip 2>","<tip 3>"],
  "music_suggestion": "<specific type of background music with tempo and mood — mention Indian trending audio where it fits>",
  "b_roll_list": ["<b-roll clip 1 to film>","<b-roll clip 2>","<b-roll clip 3>","<b-roll clip 4>"],
  "best_posting_time": "<day + time for maximum reach on ${platform} in India>"
}`;

    const raw = await chatJSON<Record<string, unknown>>({
      system: systemPrompt,
      user: prompt,
      temperature: 0.85,
      maxTokens: 3200,
    });

    // ── Coerce: the page calls .map() on scenes/hashtags and .replace() on
    // title directly, so every field must exist with the right type. ──
    const cleanYear = (s: string) => s.replace(/\b202[0-5]\b/g, '2026');
    const num = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const scenes = Array.isArray(raw.scenes)
      ? raw.scenes.slice(0, 20).map((s, i) => {
          const o = s && typeof s === 'object' ? (s as Record<string, unknown>) : {};
          return {
            scene_number: num(o.scene_number) || i + 1,
            duration_seconds: num(o.duration_seconds),
            shot_type: cleanYear(str(o.shot_type)),
            visual: cleanYear(str(o.visual)),
            voiceover: cleanYear(str(o.voiceover)),
            text_overlay: cleanYear(str(o.text_overlay)),
            music_mood: str(o.music_mood),
          };
        })
      : [];

    return NextResponse.json({
      title: cleanYear(str(raw.title)) || `${businessName} — ${platform} video`,
      hook_line: cleanYear(str(raw.hook_line)),
      voiceover_script: cleanYear(str(raw.voiceover_script)),
      scenes,
      caption: cleanYear(str(raw.caption)),
      hashtags: strArr(raw.hashtags, 30),
      thumbnail_idea: cleanYear(str(raw.thumbnail_idea)),
      cta: cleanYear(str(raw.cta)),
      editing_tips: strArr(raw.editing_tips, 10),
      music_suggestion: str(raw.music_suggestion),
      b_roll_list: strArr(raw.b_roll_list, 12),
      best_posting_time: str(raw.best_posting_time),
    });
  } catch (error: unknown) {
    return serverError('generate-video-script', error);
  }
}
