import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { FormData, CATEGORIES, GOALS } from "@/lib/types";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const form: FormData = await req.json();
    const cat  = CATEGORIES.find(c => c.value === form.category);
    const goal = GOALS.find(g => g.value === form.goal);

    const prompt = `You are an expert social media content strategist. Generate trending content ideas for this product.

PRODUCT: ${form.productName}
CATEGORY: ${cat?.label}
GOAL: ${goal?.label}
PLATFORMS: ${form.platforms.join(", ")}

Respond ONLY with raw JSON. No markdown, no backticks.

{
  "reel_formats": [
    { "format": "format name", "description": "what it is", "example": "exact example for this product", "difficulty": "Easy|Medium|Hard", "virality": 85 }
  ],
  "hooks": [
    { "hook": "exact hook text", "type": "Curiosity|Shock|Relatability|FOMO|Humor", "platform": "Instagram" }
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
- reel_formats: 5 formats, highly specific to ${cat?.label}
- hooks: 8 hooks, varied types, ready to use word-for-word
- content_angles: 5 angles specific to ${cat?.label} and goal: ${goal?.label}
- hashtag_sets: exactly 4 sets, 5-8 tags each, real working hashtags
- best_posting_times: for each platform in [${form.platforms.join(", ")}]
- content_dont: 3 common mistakes for ${cat?.label} promotion`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    const data = JSON.parse(cleaned);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
