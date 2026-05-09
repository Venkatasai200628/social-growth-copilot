import { NextRequest, NextResponse } from 'next/server';
import { getGroqClient, MODEL } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const { businessName, category, productDescription, targetAudience,
            goal, platforms, price, duration, efficiency, videoUrl } = await req.json();

    const groq = getGroqClient();

    const prompt = `Create complete, ready-to-use ad packages for "${businessName}" (${category}).

PRODUCT: ${productDescription}
AUDIENCE: ${targetAudience}
GOAL: ${goal}
BUDGET: ₹${price} over ${duration} days
EFFICIENCY: ${efficiency}
PLATFORMS: ${platforms?.join(', ')}
${videoUrl ? `VIDEO: ${videoUrl}` : ''}

Generate a complete ad package for EACH platform in ${platforms?.join(', ')}.

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

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an expert paid advertising strategist specialising in Indian markets. Create detailed, actionable ad packages ready to be pasted into ad managers. Use markdown formatting.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 3500,
      temperature: 0.75,
    });

    const packages = response.choices[0]?.message?.content || '';
    return NextResponse.json({ packages });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
