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
      product?: string; category?: string; goal?: string; budget?: string | number;
      targetAudience?: string; platforms?: string[]; duration?: string | number;
      language?: string; transcriptContext?: string; festival?: string;
    }>(req);
    if (!body) return badRequest('Invalid request — please refresh the page and try again.');
    const { product, category, goal, budget, targetAudience, platforms, duration,
            language, transcriptContext, festival } = body;
    const platformList = Array.isArray(platforms) && platforms.length > 0
      ? platforms.filter((p) => typeof p === 'string')
      : [];

    // ── Validation ────────────────────────────────────────────────
    if (!product?.trim()) return NextResponse.json({ error: 'Please describe your product or service.' }, { status: 400 });
    if (!category?.trim()) return NextResponse.json({ error: 'Please choose your business category.' }, { status: 400 });
    if (!goal?.trim()) return NextResponse.json({ error: 'Please choose a campaign goal.' }, { status: 400 });

    // Duration: coerce to 1-14 days so calendars stay usable and token-safe.
    const days = Math.min(Math.max(parseInt(String(duration ?? '7'), 10) || 7, 1), 14);

    // Budget tier logic — the CORE intelligence
    const budgetNum = parseInt(String(budget ?? ''), 10) || 0;
    let budgetTier = '';
    let budgetStrategy = '';

    if (budgetNum < 5000) {
      budgetTier = 'MICRO (Under ₹5,000)';
      budgetStrategy = `With ₹${budgetNum}, focus 100% on organic. No paid ads — zero budget for boosting.
Strategy: Viral content hooks, trending audio for Reels, heavy hashtag research, community engagement (commenting on 10-20 posts/day in your niche), story polls, collabs with micro-creators (bartering, no payment).
Reach depends entirely on execution — do not promise or estimate a number.`;
    } else if (budgetNum < 25000) {
      budgetTier = 'SMALL (₹5,000–₹25,000)';
      budgetStrategy = `With ₹${budgetNum}, split: 70% organic content + 30% paid boosts.
Paid allocation: ₹${Math.round(budgetNum * 0.3)} for Instagram/Facebook boost on top 2-3 posts.
Boost settings: ₹${Math.round(budgetNum * 0.3 / days)} per day, target: ${targetAudience || 'relevant audience'}, radius: city-level.
Typical CPM benchmark on Meta in India: ₹80–150 (a platform benchmark, not a promise).
No influencer budget — use micro-creator collabs (bartering).`;
    } else if (budgetNum < 100000) {
      budgetTier = 'MEDIUM (₹25,000–₹1,00,000)';
      budgetStrategy = `With ₹${budgetNum}, split: 50% paid ads + 30% micro-influencers + 20% content production.
Paid ads: ₹${Math.round(budgetNum * 0.5)} → Instagram Feed + Reels ads, Facebook carousel ads.
Influencer budget: ₹${Math.round(budgetNum * 0.3)} → 3-5 micro-influencers (10k–100k followers) at ₹${Math.round(budgetNum * 0.06)}–${Math.round(budgetNum * 0.1)} each.
Content production: ₹${Math.round(budgetNum * 0.2)} → professional photography or short video shoot.`;
    } else {
      budgetTier = 'LARGE (₹1,00,000+)';
      budgetStrategy = `With ₹${budgetNum}, run a full-funnel campaign:
- 40% (₹${Math.round(budgetNum * 0.4).toLocaleString()}) → Multi-platform paid ads (Instagram, Facebook, YouTube pre-roll, Google Display)
- 25% (₹${Math.round(budgetNum * 0.25).toLocaleString()}) → Macro-influencer (1 influencer at 500k+ followers) + 3 mid-tier (100k–500k)
- 20% (₹${Math.round(budgetNum * 0.2).toLocaleString()}) → Professional video production (Reel + ad creative)
- 10% (₹${Math.round(budgetNum * 0.1).toLocaleString()}) → Retargeting ads (website visitors, lookalike audiences)
- 5% (₹${Math.round(budgetNum * 0.05).toLocaleString()}) → A/B testing different creatives`;
    }

    const prompt = `You are a world-class social media strategist specialising in Indian market campaigns. Create a complete, budget-aware campaign.

BUSINESS: ${product}
CATEGORY: ${category}
GOAL: ${goal}
BUDGET: ₹${budget} — ${budgetTier}
TARGET AUDIENCE: ${targetAudience || 'General audience'}
PLATFORMS: ${platformList.join(', ') || 'Instagram, Facebook'}
CAMPAIGN DURATION: ${days} days
${transcriptContext?.trim() ? `
OWNER'S OWN WORDS (from a voice note they recorded — this is how they describe their business, customers and dreams. Bias the whole plan to match their voice, priorities and any specific products/offers/words they mention):
"""
${transcriptContext.trim()}
"""` : ''}

BUDGET INTELLIGENCE (incorporate this exactly into your strategy):
${budgetStrategy}

Generate a COMPLETE campaign with these exact sections:

## 💰 Budget Allocation Strategy
Based on the budget tier above, give a specific breakdown in ₹ amounts. Explain WHY each allocation maximises ROI for THIS budget level. Compare what ₹${budget} can realistically buy vs what would require more budget.

## 🎯 Platform Strategy  
For each platform in [${platformList.join(', ') || 'Instagram, Facebook'}]:
- Why it's right for this product + budget combination
- What ad format works best at this budget
- Typical CPM/CPC benchmark ranges at this budget, labelled as benchmarks (no result promises)
- Organic vs paid split recommendation

## 📊 Audience Targeting Setup
Exact targeting parameters to use in Meta Ads Manager / Google Ads:
- Age range, gender
- Interests (list 8-10 specific interest categories)
- Behaviours
- Location targeting
- Lookalike audience setup (if budget allows)

## 📅 ${days}-Day Content Calendar
For EACH day from Day 1 to Day ${days}:
**Day [N] — [Campaign phase: Awareness / Engagement / Conversion]**
- Platform: | Post Type: | Best Time:
- Caption: [Full ready-to-post caption — emotional hook, body, CTA]
- Hashtags: [12-15 relevant hashtags]
- Paid Boost: [Yes/No — if Yes: daily budget ₹X, targeting, duration]
- Organic Tactic: [specific zero-cost action for this day]

## 🚀 5 Free Organic Growth Tactics
Specific zero-cost techniques that work for this exact budget level and category:
(trending audio, collab hooks, comment pods, story mechanics, hashtag strategy)

## 📈 Tracking Plan
Do NOT estimate or promise results (reach, clicks, leads, revenue) — nobody can know them before the campaign runs. Instead:
- Where to find each real number after posting (Instagram Insights, Meta Ads Manager, WhatsApp Business stats)
- Which metric to check daily and weekly
- Typical CPM/CPC benchmark ranges for the chosen platforms, clearly labelled as benchmarks
- A simple way for the owner to log actuals day by day so the AI coach can advise

## ✅ Week-by-Week Optimisation Checklist
What to check and adjust at the end of each week to improve results.`;

    const result = await chat({
      system: `You are GrowMitra — an elite social media strategist who understands the Indian market deeply. You are budget-aware: a ₹5,000 campaign gets different advice than a ₹5,00,000 campaign. Be specific with rupee amounts derived from the stated budget. Use markdown formatting with emoji headers.
${languagePrompt(language)}
${festivalPrompt(festival, [product, transcriptContext].filter(Boolean).join(' '))}
Write EVERYTHING in English, including every ready-to-post caption. CRITICAL: The current calendar year is 2026. NEVER output '2024' or past years in campaigns, strategies, or calendars. Any dates, festival plans, or seasonal schedules must be in 2026 (or 2027). HONESTY: never invent offers, discounts, delivery promises, locations or ingredients the owner didn't state; never present estimated results (reach, clicks, leads, revenue, ROAS) as if they were known — benchmarks must be labelled as benchmarks.`,
      user: prompt,
      temperature: 0.75,
      maxTokens: 4000,
    });

    const sanitizedResult = (result || '').replace(/\b202[0-5]\b/g, '2026');
    return NextResponse.json({ result: sanitizedResult });
  } catch (error: unknown) {
    return serverError('generate-campaign', error);
  }
}
