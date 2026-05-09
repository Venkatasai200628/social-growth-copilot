import { NextRequest, NextResponse } from 'next/server';
import { getGroqClient, MODEL } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { product, category, goal, budget, targetAudience, platforms, duration } = body;
    const groq = getGroqClient();

    // Budget tier logic — the CORE intelligence
    const budgetNum = parseInt(budget) || 0;
    let budgetTier = '';
    let budgetStrategy = '';

    if (budgetNum < 5000) {
      budgetTier = 'MICRO (Under ₹5,000)';
      budgetStrategy = `With ₹${budgetNum}, focus 100% on organic. No paid ads — zero budget for boosting.
Strategy: Viral content hooks, trending audio for Reels, heavy hashtag research, community engagement (commenting on 50+ posts/day in niche), story polls, collabs with micro-creators (bartering, no payment).
Realistic reach: 500–3,000 organically over ${duration} days if posting consistently.`;
    } else if (budgetNum < 25000) {
      budgetTier = 'SMALL (₹5,000–₹25,000)';
      budgetStrategy = `With ₹${budgetNum}, split: 70% organic content + 30% paid boosts.
Paid allocation: ₹${Math.round(budgetNum * 0.3)} for Instagram/Facebook boost on top 2-3 posts.
Boost settings: ₹${Math.round(budgetNum * 0.3 / parseInt(duration || '7'))} per day, target: ${targetAudience || 'relevant audience'}, radius: city-level.
Expected CPM: ₹80–150. Expected reach from paid: ${Math.round((budgetNum * 0.3) / 100 * 700).toLocaleString()} people.
No influencer budget — use micro-creator collabs (bartering).`;
    } else if (budgetNum < 100000) {
      budgetTier = 'MEDIUM (₹25,000–₹1,00,000)';
      budgetStrategy = `With ₹${budgetNum}, split: 50% paid ads + 30% micro-influencers + 20% content production.
Paid ads: ₹${Math.round(budgetNum * 0.5)} → Instagram Feed + Reels ads, Facebook carousel ads.
Influencer budget: ₹${Math.round(budgetNum * 0.3)} → 3-5 micro-influencers (10k–100k followers) at ₹${Math.round(budgetNum * 0.06)}–${Math.round(budgetNum * 0.1)} each.
Content production: ₹${Math.round(budgetNum * 0.2)} → professional photography or short video shoot.
Expected total reach: ${Math.round(budgetNum * 2.5).toLocaleString()} people. Expected CPL: ₹${Math.round(budgetNum / (budgetNum * 0.008))}.`;
    } else {
      budgetTier = 'LARGE (₹1,00,000+)';
      budgetStrategy = `With ₹${budgetNum}, run a full-funnel campaign:
- 40% (₹${Math.round(budgetNum * 0.4).toLocaleString()}) → Multi-platform paid ads (Instagram, Facebook, YouTube pre-roll, Google Display)
- 25% (₹${Math.round(budgetNum * 0.25).toLocaleString()}) → Macro-influencer (1 influencer at 500k+ followers) + 3 mid-tier (100k–500k)
- 20% (₹${Math.round(budgetNum * 0.2).toLocaleString()}) → Professional video production (Reel + ad creative)
- 10% (₹${Math.round(budgetNum * 0.1).toLocaleString()}) → Retargeting ads (website visitors, lookalike audiences)
- 5% (₹${Math.round(budgetNum * 0.05).toLocaleString()}) → A/B testing different creatives
Expected reach: ${Math.round(budgetNum * 8).toLocaleString()}+ people. Projected conversions: ${Math.round(budgetNum * 0.008).toLocaleString()}.`;
    }

    const prompt = `You are a world-class social media strategist specialising in Indian market campaigns. Create a complete, budget-aware campaign.

BUSINESS: ${product}
CATEGORY: ${category}
GOAL: ${goal}
BUDGET: ₹${budget} — ${budgetTier}
TARGET AUDIENCE: ${targetAudience || 'General audience'}
PLATFORMS: ${platforms?.join(', ') || 'Instagram, Facebook'}
CAMPAIGN DURATION: ${duration || 7} days

BUDGET INTELLIGENCE (incorporate this exactly into your strategy):
${budgetStrategy}

Generate a COMPLETE campaign with these exact sections:

## 💰 Budget Allocation Strategy
Based on the budget tier above, give a specific breakdown in ₹ amounts. Explain WHY each allocation maximises ROI for THIS budget level. Compare what ₹${budget} can realistically buy vs what would require more budget.

## 🎯 Platform Strategy  
For each platform in [${platforms?.join(', ')}]:
- Why it's right for this product + budget combination
- What ad format works best at this budget
- Expected CPM, CPC, and reach with the allocated budget
- Organic vs paid split recommendation

## 📊 Audience Targeting Setup
Exact targeting parameters to use in Meta Ads Manager / Google Ads:
- Age range, gender
- Interests (list 8-10 specific interest categories)
- Behaviours
- Location targeting
- Lookalike audience setup (if budget allows)

## 📅 ${duration || 7}-Day Content Calendar
For EACH day from Day 1 to Day ${duration || 7}:
**Day [N] — [Campaign phase: Awareness / Engagement / Conversion]**
- Platform: | Post Type: | Best Time:
- Caption: [Full ready-to-post caption — emotional hook, body, CTA]
- Hashtags: [12-15 relevant hashtags]
- Paid Boost: [Yes/No — if Yes: daily budget ₹X, targeting, duration]
- Organic Tactic: [specific zero-cost action for this day]

## 🚀 5 Free Organic Growth Tactics
Specific zero-cost techniques that work for this exact budget level and category:
(trending audio, collab hooks, comment pods, story mechanics, hashtag strategy)

## 📈 ROI Projections
Be realistic based on the ₹${budget} budget:
- Estimated reach (paid + organic)
- Estimated impressions
- Estimated clicks / profile visits
- Estimated conversions / leads
- Estimated cost per lead
- Timeline to see results

## ✅ Week-by-Week Optimisation Checklist
What to check and adjust at the end of each week to improve results.`;

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are Social Growth Copilot — an elite social media strategist who understands Indian market deeply. You are budget-aware: a ₹5,000 campaign gets different advice than a ₹5,00,000 campaign. Always be specific with numbers, rupee amounts, and realistic projections. Use markdown formatting with emoji headers.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4000,
      temperature: 0.75,
    });

    const result = response.choices[0]?.message?.content || '';
    return NextResponse.json({ result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[generate-campaign]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
