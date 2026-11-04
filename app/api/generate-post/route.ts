import { NextRequest, NextResponse } from 'next/server';
import { chatJSON } from '@/lib/meta-ai';
import { languagePrompt, festivalPrompt } from '@/lib/india';
import { PALETTE_IDS, POSTER_LAYOUTS } from '@/lib/poster';
import { requireAuth } from '@/lib/auth-guard';
import { readJson, badRequest, serverError } from '../_lib/http';

interface PosterAI {
  palette?: string;
  layout?: string;
  kicker?: string;
  headline?: string;
  sub?: string;
  offer_text?: string;
}

interface ReplyTemplate {
  trigger?: unknown;
  reply?: unknown;
}

interface PostResult {
  poster?: PosterAI;
  caption?: string;
  caption_b?: string;
  hashtags?: unknown;
  first_comment?: string;
  story_idea?: string;
  best_time?: string;
  whatsapp_message?: string;
  reply_templates?: ReplyTemplate[];
  image_prompt?: string;
}


export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await readJson<{
      businessName?: string; category?: string; productDescription?: string; targetAudience?: string;
      platform?: string; postType?: string; tone?: string; goal?: string; offer?: string; language?: string; festival?: string;
      customPrompt?: string; hasPhoto?: boolean;
    }>(req);
    if (!body) return badRequest('Invalid request — please refresh the page and try again.');
    const {
      businessName, category, productDescription, targetAudience,
      platform, postType, tone, goal, offer, language, festival,
      customPrompt, hasPhoto,
    } = body;

    // ── Validation ────────────────────────────────────────────────
    if (!businessName?.trim()) return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
    if (!category?.trim()) return NextResponse.json({ error: 'Please choose your business category.' }, { status: 400 });
    if (!productDescription?.trim()) return NextResponse.json({ error: 'Please describe your product or service.' }, { status: 400 });
    if (!platform?.trim()) return NextResponse.json({ error: 'Please choose a platform.' }, { status: 400 });
    if (!postType?.trim()) return NextResponse.json({ error: 'Please choose a post type.' }, { status: 400 });
    if (!tone?.trim()) return NextResponse.json({ error: 'Please choose a tone.' }, { status: 400 });
    if (!goal?.trim()) return NextResponse.json({ error: 'Please choose a goal.' }, { status: 400 });

    // ── Prompts ───────────────────────────────────────────────────
    const systemPrompt = `You are GrowMitra's elite marketing copywriter and art director for Indian small businesses — you make a local shop's Instagram look like a national brand. You think like a copywriter (scroll-stopping hooks, WhatsApp-forwardable offers) AND like an art director (poster hierarchy, palette, typography fit).
${languagePrompt(language)}
${festivalPrompt(festival, [productDescription, customPrompt].filter(Boolean).join(' '))}
${hasPhoto ? "PHOTO RULE: the poster will feature the owner's ACTUAL product photo. kicker/headline/sub must COMPLEMENT the photo — add offer context, emotion — never describe or repeat what the photo already shows." : 'NO PHOTO: the poster is pure typography — the headline and sub carry the whole design.'}

QUALITY BAR — DESIGNED TO CONVERT & DRIVE REAL SALES:
- The poster MUST look like a premium social media advertisement that drives real business results, conversions, leads, or footfall.
- CRITICAL CURRENT YEAR CONSTRAINT: The current calendar year is 2026. NEVER output '2024' or '2025' in headlines, kickers, subtitles, or captions. If mentioning a year, festive edition, or seasonal collection, strictly use 2026 (or 2027). Outputting 2024 is strictly forbidden and makes the post look expired.
- poster.headline: A high-converting, scroll-stopping English headline. Maximum 24 characters so it fits cleanly on the poster without overflowing. Must speak directly to the customer's aspiration or immediate benefit (e.g. 'Admissions Open 2026', 'Handcrafted Gold Sets', 'Fresh Bakes Daily'). NEVER duplicate the brand name inside the headline if the brand is already displayed.
- poster.sub: A persuasive, clear English subtitle (max 65 chars) that provides the core value proposition, key advantage, or social proof.
- poster.offer_text: A high-impact CTA button text or offer badge (e.g. 'Enroll Today', 'Book A Consultation', 'Flat 15% Off', 'Order On WhatsApp', 'Visit Campus').
- poster.kicker: Category or campaign tag (e.g. 'LIMITED SEATS', 'NEW ADMISSIONS', 'FESTIVE COLLECTION', 'SPECIAL OFFER').
- Hooks must be SPECIFIC to this business, product, city or offer. Lead with the most concrete detail the owner gave you (dates, courses, prices, dishes, fabric, occasion, delivery). Specifics sell; generic buzzwords fail.
- BANNED: 'elevate your style', 'unlock happiness', 'dhamaka' unless asked, 'limited stock!!!', triple exclamation marks, more than 3 emojis per caption, wishing a festival the owner didn't ask for.
- Vary sentence rhythm: short punch -> one flowing line -> clear conversion CTA.

HARD RULES:
1. Respond ONLY with valid JSON — no markdown, no code fences, no commentary.
2. NEVER put real newline characters inside JSON string values. Use the literal token [BREAK] for paragraph breaks. Keep every string on one line.
3. poster.headline is the display-serif line: English only, max 26 characters, Latin characters only.
4. poster.sub is the supporting line: English only, max 80 characters.
5. caption, caption_b, first_comment, story_idea, whatsapp_message and reply_templates must ALL be in English — never Hindi, Hinglish or any Indic script.
6. If no offer was given, do NOT invent a discount — set poster.offer_text to "" and make the CTA about visiting/enquiring/ordering. NEVER invent offers, discounts, delivery promises, locations or ingredients the owner did not state; write only from the brief.
7. [BREAK] tokens in caption/caption_b must survive exactly as written — do not convert them to spaces or newlines.`;

    const userPrompt = `Create a complete, ready-to-post package.

BUSINESS: ${businessName} (${category})
PRODUCT/SERVICE: ${productDescription}
AUDIENCE: ${targetAudience?.trim() || 'local customers'}
PLATFORM: ${platform} | POST TYPE: ${postType}
TONE: ${tone} | GOAL: ${goal}
${offer?.trim() ? `OFFER: ${offer}` : 'OFFER: none given'}
${customPrompt?.trim() ? `OWNER'S EXTRA INSTRUCTIONS (highest priority — follow exactly): ${customPrompt}` : ''}

Return EXACTLY this JSON structure (use the literal token [BREAK] instead of real newlines inside strings):
{
  "poster": {
    "palette": "<pick the single best art-directed fit from exactly these ids: ${PALETTE_IDS.join(', ')}>",
    "layout": "<one of: ${POSTER_LAYOUTS.join(' | ')} — pick what suits the post type>",
    "kicker": "<=28 chars, small chip label for this specific post>",
    "headline": "<=26 chars, punchy English display headline — concrete, not generic>",
    "sub": "<=80 chars English supporting line that adds context or emotion>",
    "offer_text": "<=24 chars CTA pill naming the owner's actual offer, or '' if none was given>"
  },
  "caption": "<English: specific scroll-stopping hook>[BREAK][BREAK]<2-3 sentence body with concrete sensory/emotional detail about THIS product>[BREAK][BREAK]<clear CTA>",
  "caption_b": "<A/B challenger with a DIFFERENT hook style — much shorter and punchier, or a question hook — then body and CTA, also in English>",
  "hashtags": ["<12-15 English hashtags: category tags and local-city tags>"],
  "first_comment": "<engaging question in English to pin as the first comment>",
  "story_idea": "<15-30 second companion Story concept in English>",
  "best_time": "<specific day + time IST to post on ${platform} for this category>",
  "whatsapp_message": "<=280 chars, English message with emoji, ready to forward on WhatsApp — only mention an offer if the owner gave one>",
  "reply_templates": [
    {"trigger": "<typical customer DM, e.g. 'What's the price?>", "reply": "<warm, helpful reply in English>"},
    {"trigger": "<e.g. 'Do you deliver?>", "reply": "<reply in English — if the owner didn't state delivery, suggest they reply with their own detail>"},
    {"trigger": "<e.g. 'Where is your shop?>", "reply": "<reply in English>"},
    {"trigger": "<e.g. 'Any discount?>", "reply": "<reply in English — never invent a discount; suggest asking the owner if none was stated>"}
  ],
  "image_prompt": "<at least 50 words, extremely detailed image-generation prompt: exact subject, styling, lighting, background, colours, mood, composition, camera feel — tuned to the product>"
}`;

    // Single pass (the old 3-call refine chain tripled latency and its
    // editor step could rewrite English copy into Hindi). The editor bar
    // is folded into the system prompt above.
    const raw = await chatJSON<PostResult>({
      system: systemPrompt,
      user: userPrompt,
      temperature: 0.85,
      maxTokens: 2600,
    });

    // ── Coerce / validate poster fields ───────────────────────────
    const sanitizeYear = (str: string): string => str.replace(/\b202[0-5]\b/g, '2026');

    const oneLine = (v: unknown, max: number): string =>
      typeof v === 'string' ? sanitizeYear(v.replace(/\s+/g, ' ').trim()).slice(0, max) : '';

    const p = raw.poster ?? {};
    const palette = PALETTE_IDS.includes(p.palette ?? '') ? (p.palette as string) : 'diwaliMaroon';
    const layout = (POSTER_LAYOUTS as readonly string[]).includes(p.layout ?? '') ? (p.layout as string) : 'modern';
    const poster = {
      palette,
      layout,
      kicker: oneLine(p.kicker, 26) || 'NEW',
      headline: oneLine(p.headline, 24) || 'Special Announcement',
      sub: oneLine(p.sub, 68),
      offer_text: oneLine(p.offer_text, 22),
    };

    const hashtags: string[] = Array.isArray(raw.hashtags)
      ? raw.hashtags
          .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
          .map((t) => t.trim())
          .slice(0, 30)
      : [];

    const replyTemplates = Array.isArray(raw.reply_templates)
      ? raw.reply_templates
          .filter((r): r is { trigger: string; reply: string } =>
            !!r && typeof r === 'object' && typeof r.trigger === 'string' && typeof r.reply === 'string')
          .map((r) => ({
            trigger: r.trigger.trim().slice(0, 200),
            reply: r.reply.trim().slice(0, 1000),
          }))
          .slice(0, 8)
      : [];

    // ── AI background / hero image (Backend Gemini & Fast Server-Side Proxy) ──────────
    let image_url: string | null = null;
    const imagePrompt =
      oneLine(raw.image_prompt, 800) ||
      `${customPrompt || productDescription}, premium product commercial photography, studio lighting, high resolution, 4K`;

    // 1. Try Gemini backend key (never exposed to client)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey.trim().length > 10) {
      const models = ['gemini-2.5-flash-image', 'gemini-2.0-flash-preview-image-generation'];
      const promptText = `${imagePrompt} — square 1:1 commercial brand photography, clean product framing, no text, no watermark`;
      for (const model of models) {
        try {
          const gr = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: 'POST',
              headers: {
                'x-goog-api-key': geminiKey.trim(),
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { responseModalities: ['IMAGE'] },
              }),
              signal: AbortSignal.timeout(25_000),
            }
          );
          if (gr.ok) {
            const gd = (await gr.json()) as {
              candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[];
            };
            const inline = gd.candidates?.[0]?.content?.parts?.find(
              (p) => typeof p.inlineData?.data === 'string' && p.inlineData.data.length > 0
            )?.inlineData;
            if (inline?.data) {
              image_url = `data:${inline.mimeType || 'image/png'};base64,${inline.data}`;
              break;
            }
          }
        } catch {
          /* continue to next model or fallback */
        }
      }
    }

    // 2. Fallback: Fetch server-side image to avoid client-side CORS issues
    if (!image_url) {
      try {
        const fallbackUrl =
          `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}` +
          `?width=1024&height=1024&nologo=true&model=flux&seed=${Math.floor(Math.random() * 99999)}`;
        const fr = await fetch(fallbackUrl, { signal: AbortSignal.timeout(20_000) });
        if (fr.ok) {
          const buf = await fr.arrayBuffer();
          const mime = fr.headers.get('content-type') || 'image/jpeg';
          image_url = `data:${mime};base64,${Buffer.from(buf).toString('base64')}`;
        }
      } catch {
        image_url = null;
      }
    }

    return NextResponse.json({
      poster,
      caption: oneLine(raw.caption, 2200),
      caption_b: oneLine(raw.caption_b, 2200),
      hashtags,
      first_comment: oneLine(raw.first_comment, 500),
      story_idea: oneLine(raw.story_idea, 500),
      best_time: oneLine(raw.best_time, 120),
      whatsapp_message: oneLine(raw.whatsapp_message, 300),
      reply_templates: replyTemplates,
      image_prompt: oneLine(raw.image_prompt, 2000),
      image_url,
    });
  } catch (error: unknown) {
    return serverError('generate-post', error);
  }
}
