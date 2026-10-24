import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/groq';
import { languagePrompt, festivalPrompt } from '@/lib/india';
import { requireAuth } from '@/lib/auth-guard';
import { readJson, badRequest, serverError } from '../_lib/http';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await readJson<Record<string, unknown>>(req);
    if (!body) return badRequest('Invalid request — please refresh the page and try again.');
    const order = body as {
      businessName?: string; businessCategory?: string; productDescription?: string;
      targetAudience?: string; goal?: string; platforms?: string[]; duration?: string | number;
      promotionEfficiency?: string; budget?: string | number; price?: string | number; videoUrl?: string;
      websiteUrl?: string; transcriptContext?: string; language?: string; festival?: string;
    };

    // ── Validation ────────────────────────────────────────────────
    if (!order?.businessName?.trim()) return badRequest('Business name is required.');
    if (!order?.businessCategory?.trim()) return badRequest('Please choose your business category.');
    if (!order?.productDescription?.trim()) return badRequest('Please describe your product or service.');
    if (!order?.goal?.trim()) return badRequest('Please choose a campaign goal.');

    // ── Coerce optional fields so the prompt can never read "undefined" ──
    const platformList = Array.isArray(order.platforms) && order.platforms.length > 0
      ? order.platforms.filter((p) => typeof p === 'string')
      : [];
    const platformsText = platformList.join(', ') || 'Instagram';
    const price = Number(order.budget) || Number(order.price) || 0;
    const videoUrl = typeof order.videoUrl === 'string' ? order.videoUrl.trim() : '';
    const websiteUrl = typeof order.websiteUrl === 'string' ? order.websiteUrl.trim() : '';
    const transcriptContext = typeof order.transcriptContext === 'string' ? order.transcriptContext : '';

    // Keep calendars usable and token-safe.
    const days = Math.min(Math.max(parseInt(String(order.duration ?? 7), 10) || 7, 1), 30);

    const efficiencyMap: Record<string, string> = {
      conservative: 'organic-first, minimal paid spend, steady growth over time',
      balanced: 'mix of organic content and strategic paid boosts for maximum ROI',
      aggressive: 'heavy paid promotion, maximum reach, fast results',
    };
    // Object.hasOwn keeps inherited names like "constructor" out of the prompt.
    const efficiency = typeof order.promotionEfficiency === 'string' && Object.hasOwn(efficiencyMap, order.promotionEfficiency)
      ? efficiencyMap[order.promotionEfficiency]
      : efficiencyMap.balanced;

    const prompt = `You are a world-class social media strategist. Create a complete, paid promotion campaign.

BUSINESS: ${order.businessName}
CATEGORY: ${order.businessCategory}
PRODUCT/SERVICE: ${order.productDescription}
TARGET AUDIENCE: ${order.targetAudience || 'local customers'}
GOAL: ${order.goal}
PLATFORMS: ${platformsText}
CAMPAIGN DURATION: ${days} days
PROMOTION STYLE: ${efficiency}
BUDGET: ₹${price} (one-time campaign fee)
${videoUrl ? `VIDEO CONTENT: ${videoUrl}` : ''}
${websiteUrl ? `WEBSITE: ${websiteUrl}` : ''}
${transcriptContext.trim() ? `
OWNER'S OWN WORDS (from a voice note they recorded — bias the plan to match their voice, priorities and any products/offers they mention):
"""
${transcriptContext.trim()}
"""` : ''}

Generate a COMPLETE promotion strategy with these exact sections:

## 🎯 Campaign Strategy Overview
2-3 paragraphs: overall approach, why this strategy fits this business, what success looks like.

## 💰 Budget Breakdown
How to allocate the ₹${price} across platforms, paid ads, and content creation. Be specific with numbers.

## 📅 Day-by-Day Campaign Calendar
For EACH of the ${days} days:
**Day [N] — [Hook/Theme]**
- Platform: [platform]
- Post Type: [Reel/Story/Tweet/etc]
- Caption: [full ready-to-post caption with emojis, in English]
- Hashtags: [10-15 relevant tags]
- Paid Boost: [Yes/No — if yes, budget and targeting]

## 🚀 Platform-Specific Ad Strategy
For each platform in ${platformsText}:
- Ad format to use
- Targeting parameters (age, location, interests)
- Daily budget recommendation (must add up to the total budget)
- Bid strategy
- Typical CPM/CPC benchmark ranges for this platform in India (label them "benchmark")

## 📊 Growth Techniques
5-7 specific zero-cost techniques to maximise organic reach alongside paid promotion.

## 🔄 Weekly Review Checklist
What metrics to check each week and how to optimise.

Make everything actionable, specific to the Indian market, and copy-paste ready.`;

    const strategy = await chat({
      system: `You are GrowMitra — an elite social media strategist specialising in Indian market promotions. Create detailed, actionable campaigns. Use markdown formatting.
${languagePrompt(order.language)}
${festivalPrompt(order.festival, order.productDescription)}
Write EVERYTHING in English, including every ready-to-post caption in the calendar.
HONESTY RULES: never invent results — no projected orders, revenue, ROAS, reach numbers or conversion rates presented as expectations. Budget splits must be simple arithmetic from the stated budget. Platform CPM/CPC figures may appear only as clearly-labelled benchmarks. Never mention offers, discounts or delivery promises the owner did not state.`,
      user: prompt,
      temperature: 0.8,
      maxTokens: 6000,
    });

    return NextResponse.json({ strategy });
  } catch (error: unknown) {
    return serverError('generate-strategy', error);
  }
}
