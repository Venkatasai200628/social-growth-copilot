import { NextRequest, NextResponse } from 'next/server';
import { getGroqClient, MODEL } from '@/lib/groq';

export async function POST(req: NextRequest) {
  try {
    const { businessName, category, productDescription, targetAudience,
            platform, postType, tone, goal, offer, customPrompt } = await req.json();
    const groq = getGroqClient();

    const formatGuide: Record<string, string> = {
      'Reel':      'SHORT VIDEO REEL — caption under 150 chars, action words, urgent offer pill.',
      'Story':     'STORY (9:16) — ultra short caption 1-2 sentences, bold text readable at glance.',
      'Carousel':  'CAROUSEL — headline teases slide 1, caption starts with "Swipe to see...", list 3-5 benefits.',
      'Ad Copy':   'PAID AD — pain point → solution → offer. Headline is the hook. Offer pill = conversion CTA.',
      'Feed Post': 'FEED POST — longer caption: hook, story, CTA. Shareable and emotional.',
    };
    const formatInstruction = formatGuide[postType] || formatGuide['Feed Post'];
    const hasDetailedPrompt = customPrompt && customPrompt.length > 80;

    const systemPrompt = `You are an elite social media visual designer and content strategist for premium brands.
${hasDetailedPrompt ? 'The user has provided a detailed creative brief — follow it EXACTLY for tone, style, image description, and content. It overrides all defaults.' : ''}
CRITICAL RULES:
1. Respond ONLY with valid JSON — no markdown, no explanation, no code fences.
2. In JSON string values, NEVER use real newline characters. Use the literal token [BREAK] for paragraph breaks.
3. Keep all string values on one line — no line breaks inside strings.
4. Headline must be SHORT — max 18 characters total so it fits the canvas.`;

    const userPrompt = hasDetailedPrompt
      ? `${customPrompt}

BUSINESS: ${businessName} (${category})
PLATFORM: ${platform} | POST TYPE: ${postType}
${offer ? `OFFER: ${offer}` : ''}

Follow the creative brief above exactly. Return this JSON structure (use [BREAK] not real newlines in string values):
{
  "visual_style": "<luxury_dark|bold_minimal|vibrant_gradient|editorial_clean|neon_modern|earthy_warm>",
  "colors": {"bg":"<hex>","bg2":"<hex>","accent":"<hex>","accent2":"<hex>","text_primary":"<hex>","text_secondary":"<hex>"},
  "headline": "<MAX 18 CHARS — punchy brand headline>",
  "headline_accent": "<1-2 words from headline to highlight in accent color, or empty string>",
  "tagline": "<max 6 words — elegant brand tagline>",
  "badge_text": "<max 4 words — occasion or collection label>",
  "offer_text": "<max 5 words — CTA pill text, or empty string if no offer>",
  "visual_motif": "<geometric_circles|diagonal_lines|dot_grid|hexagon_pattern|wave_lines>",
  "caption": "<hook sentence>[BREAK][BREAK]<body 2-3 sentences>[BREAK][BREAK]<CTA>",
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8","#tag9","#tag10","#tag11","#tag12"],
  "first_comment": "<engaging question to post within 5 min of publishing>",
  "story_idea": "<15-30s companion Story concept>",
  "best_time": "<specific day and time e.g. Sunday 7:00 PM IST>",
  "image_prompt": "<DETAILED AI image generation prompt — describe subject, lighting, background, mood, jewellery style, colours — minimum 60 words. This is critical — make it extremely specific based on the brief.>",
  "reply_templates": [
    {"trigger":"<question>","reply":"<premium reply>"},
    {"trigger":"<question>","reply":"<premium reply>"},
    {"trigger":"<question>","reply":"<premium reply>"},
    {"trigger":"<question>","reply":"<premium reply>"}
  ]
}`
      : `Create a complete social media post package.

BUSINESS: ${businessName} (${category})
PRODUCT: ${productDescription}
AUDIENCE: ${targetAudience || 'general audience'}
PLATFORM: ${platform} | POST TYPE: ${postType}
TONE: ${tone} | GOAL: ${goal}
${offer ? `OFFER: ${offer}` : ''}
${customPrompt ? `VISUAL INSTRUCTIONS (follow exactly for style and image): ${customPrompt}` : ''}
FORMAT: ${formatInstruction}

Return this JSON (use [BREAK] not real newlines in strings, headline max 18 chars):
{
  "visual_style": "<match the tone — luxury_dark for premium, vibrant_gradient for fun, editorial_clean for minimal>",
  "colors": {"bg":"<hex>","bg2":"<hex>","accent":"<hex>","accent2":"<hex>","text_primary":"<hex>","text_secondary":"<hex>"},
  "headline": "<MAX 18 CHARS>",
  "headline_accent": "<1-2 accent words or empty string>",
  "tagline": "<max 6 words>",
  "badge_text": "<max 4 words>",
  "offer_text": "<max 5 words or empty string>",
  "visual_motif": "<geometric_circles|diagonal_lines|dot_grid|hexagon_pattern|wave_lines>",
  "caption": "<hook>[BREAK][BREAK]<body>[BREAK][BREAK]<CTA>",
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7","#tag8","#tag9","#tag10","#tag11","#tag12","#tag13","#tag14","#tag15"],
  "first_comment": "<engaging question>",
  "story_idea": "<15-30s story concept>",
  "best_time": "<specific day + time IST>",
  "image_prompt": "<detailed AI image prompt — minimum 50 words describing the exact visual scene, subject, lighting, background, colours, mood, style>",
  "reply_templates": [
    {"trigger":"How much does it cost?","reply":"<reply>"},
    {"trigger":"Where can I buy?","reply":"<reply>"},
    {"trigger":"Is it available online?","reply":"<reply>"},
    {"trigger":"Looks amazing!","reply":"<reply>"}
  ]
}`;

    const res = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.8,
    });

    const raw = res.choices[0]?.message?.content || '';
    let cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}');
    if (s === -1 || e === -1) throw new Error('Model did not return valid JSON. Please try again.');
    cleaned = cleaned.slice(s, e + 1);
    cleaned = cleaned.replace(/[\r\n\t]/g, ' ').replace(/\s{2,}/g, ' ');
    const data = JSON.parse(cleaned);
    if (data.caption) data.caption = data.caption.replace(/\[BREAK\]/g, '\n');

    // ── Together AI image generation ──────────────────────────────
    let imageUrl: string | null = null;
    const tk = process.env.TOGETHER_API_KEY;

    console.log('[generate-post] TOGETHER_API_KEY present:', !!tk);
    console.log('[generate-post] Key prefix:', tk?.slice(0, 10));

    if (tk && tk.length > 10 && !tk.includes('your_') && !tk.includes('placeholder')) {
      try {
        const imagePrompt = data.image_prompt ||
          `${customPrompt || productDescription}, luxury brand photography, professional studio lighting, ultra high quality, 4K`;

        console.log('[generate-post] Sending image prompt to Together AI:', imagePrompt.slice(0, 100));

        const ir = await fetch('https://api.together.xyz/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tk}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'black-forest-labs/FLUX.1-schnell-Free',
            prompt: imagePrompt,
            width: 1024,
            height: 1024,
            steps: 4,
            n: 1,
          }),
        });

        console.log('[generate-post] Together AI status:', ir.status);

        if (ir.ok) {
          const id = await ir.json();
          imageUrl = id.data?.[0]?.url || id.data?.[0]?.b64_json ? `data:image/png;base64,${id.data[0].b64_json}` : null;
          console.log('[generate-post] Image URL received:', imageUrl ? 'YES' : 'NO', imageUrl?.slice(0, 50));
        } else {
          const errText = await ir.text();
          console.error('[generate-post] Together AI error:', ir.status, errText.slice(0, 200));
        }
      } catch (imgErr: unknown) {
        const imgMsg = imgErr instanceof Error ? imgErr.message : 'Unknown image error';
        console.error('[generate-post] Image generation exception:', imgMsg);
      }
    } else {
      console.log('[generate-post] Together API key not valid, skipping image generation');
    }

    return NextResponse.json({ ...data, imageUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generate-post]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
