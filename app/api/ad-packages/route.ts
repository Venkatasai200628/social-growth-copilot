import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/meta-ai';
import { languagePrompt, festivalPrompt } from '@/lib/india';
import { requireAuth } from '@/lib/auth-guard';
import { readJson, badRequest, serverError } from '../_lib/http';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await readJson<{
      businessName?: string; category?: string; productDescription?: string; targetAudience?: string;
      goal?: string; platforms?: string[]; price?: string | number; duration?: string | number;
      efficiency?: string; videoUrl?: string; language?: string; festival?: string;
    }>(req);
    if (!body) return badRequest('Invalid request — please refresh the page and try again.');
    const { businessName, category, productDescription, targetAudience,
            goal, platforms, price, duration, efficiency, videoUrl, language, festival } = body;

    // ── Validation ────────────────────────────────────────────────
    if (!businessName?.trim()) return badRequest('Business name is required.');
    if (!category?.trim()) return badRequest('Please choose your business category.');
    if (!productDescription?.trim()) return badRequest('Please describe your product or service.');

    const platformList = Array.isArray(platforms) && platforms.length > 0
      ? platforms.filter((p) => typeof p === 'string')
      : [];
    const platformsText = platformList.join(', ') || 'Instagram';
    const priceNum = Number(price) || 0;
    const days = Math.min(Math.max(parseInt(String(duration ?? 7), 10) || 7, 1), 90);

    const prompt = `Create complete, ready-to-use ad packages for "${businessName}" (${category}).

PRODUCT: ${productDescription}
AUDIENCE: ${targetAudience || 'local customers'}
GOAL: ${goal || 'Drive Sales / Conversions'}
BUDGET: ₹${priceNum} over ${days} days
EFFICIENCY: ${efficiency || 'balanced'}
PLATFORMS: ${platformsText}
${videoUrl ? `VIDEO: ${videoUrl}` : ''}

Generate a complete ad package for EACH platform in ${platformsText}.

For each platform respond with this structure:

## [Platform Name] Ad Package

### 🎯 Targeting Settings
- Age range:
- Locations:
- Interests to target:
- Behaviours:
- Lookalike audience suggestion:

### 💰 Budget & Bidding
- Daily budget: ₹X
- Total platform budget: ₹X  
- Bid strategy:
- Expected CPM: ₹X
- Expected CPC: ₹X
- Expected daily reach:

### 📝 Ad Copy — Version A
**Headline:** [max 40 chars]
**Primary Text:** [125 chars, hook + benefit + CTA]
**Description:** [30 chars]
**CTA Button:** [e.g. Shop Now, Learn More, Sign Up]

### 📝 Ad Copy — Version B (for A/B test)
**Headline:**
**Primary Text:**
**Description:**
**CTA Button:**

### 🎨 Creative Direction
- Ad format: [e.g. Single image / Carousel / Reel / Story]
- Visual style: [specific description]
- Thumbnail tip: [for video ads]
- Dimensions: [exact pixel specs]

### 📊 Optimisation Tips
3 specific tips to improve ROAS on this platform for this category.

---
Be precise with rupee amounts. Use Indian market context.`;

    const packages = await chat({
      system: `You are an expert paid advertising strategist specialising in Indian markets. Create detailed, actionable ad packages ready to be pasted into ad managers. Use markdown formatting.
${languagePrompt(language)}
${festivalPrompt(festival, productDescription)}
Write EVERYTHING in English — ad copy versions A and B, settings, budgets and tips alike.
CRITICAL HONESTY RULE: never invent offers, discounts (e.g. "10% off"), free delivery, delivery times or purchase promises the owner did not state. If no offer was given, write copy around the product's real strengths and a visit/enquire/order CTA — no fabricated percentages or perks.
Expected CPM/CPC ranges are acceptable as clearly-marked platform benchmarks, but never present invented results as the owner's expected outcome.`,
      user: prompt,
      temperature: 0.75,
      maxTokens: 3500,
    });

    return NextResponse.json({ packages });
  } catch (error: unknown) {
    return serverError('ad-packages', error);
  }
}
