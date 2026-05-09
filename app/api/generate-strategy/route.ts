import { NextRequest, NextResponse } from 'next/server';
import { getGroqClient, MODEL } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const order = await req.json();
    const groq = getGroqClient();

    const efficiencyMap = {
      conservative: 'organic-first, minimal paid spend, steady growth over time',
      balanced: 'mix of organic content and strategic paid boosts for maximum ROI',
      aggressive: 'heavy paid promotion, maximum reach, fast results',
    };

    const prompt = `You are a world-class social media strategist. Create a complete, paid promotion campaign.

BUSINESS: ${order.businessName}
CATEGORY: ${order.businessCategory}
PRODUCT/SERVICE: ${order.productDescription}
TARGET AUDIENCE: ${order.targetAudience}
GOAL: ${order.goal}
PLATFORMS: ${order.platforms?.join(', ')}
CAMPAIGN DURATION: ${order.duration} days
PROMOTION STYLE: ${efficiencyMap[order.promotionEfficiency as keyof typeof efficiencyMap]}
BUDGET: ₹${order.price} (one-time campaign fee)
${order.videoUrl ? `VIDEO CONTENT: ${order.videoUrl}` : ''}
${order.websiteUrl ? `WEBSITE: ${order.websiteUrl}` : ''}

Generate a COMPLETE promotion strategy with these exact sections:

## 🎯 Campaign Strategy Overview
2-3 paragraphs: overall approach, why this strategy fits this business, what success looks like.

## 💰 Budget Breakdown
How to allocate the ₹${order.price} across platforms, paid ads, and content creation. Be specific with numbers.

## 📅 Day-by-Day Campaign Calendar
For EACH of the ${order.duration} days:
**Day [N] — [Hook/Theme]**
- Platform: [platform]
- Post Type: [Reel/Story/Tweet/etc]
- Caption: [full ready-to-post caption with emojis]
- Hashtags: [10-15 relevant tags]
- Paid Boost: [Yes/No — if yes, budget and targeting]
- Expected Reach: [realistic number]

## 🚀 Platform-Specific Ad Strategy
For each platform in ${order.platforms?.join(', ')}:
- Ad format to use
- Targeting parameters (age, location, interests)
- Daily budget recommendation
- Bid strategy
- Expected CPM and CPC

## 📊 Growth Techniques
5-7 specific zero-cost techniques to maximise organic reach alongside paid promotion.

## 🔄 Weekly Review Checklist
What metrics to check each week and how to optimise.

Make everything actionable, specific to the Indian market, and copy-paste ready.`;

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are Social Growth Copilot — an elite social media strategist specialising in Indian market promotions. Create detailed, actionable campaigns. Use markdown formatting.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 4000,
      temperature: 0.8,
    });

    const strategy = response.choices[0]?.message?.content || '';
    return NextResponse.json({ strategy });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
