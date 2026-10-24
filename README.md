# GrowMitra 🌱

**Your AI marketing mitra for Indian small business** — one product photo and one line about your sale becomes a full, festival-ready campaign in your own language.

> "Mitra" means friend in Hindi, Telugu and many Indian languages. GrowMitra is built to be the friend behind the counter of every jewellery shop, boutique, cloud kitchen and home bakery in India — doing the repetitive 80% of marketing so owners can run their business.

---

## Why this exists

Small Indian businesses need social media to survive, but agencies charge ₹20,000–₹50,000 a month. Owners end up posting inconsistently, in a language their customers don't connect with, with weak photos and no way to tell what works. Existing AI tools are English-first and stop at generating text — the owner is still left to design visuals, edit video and interpret results alone.

**GrowMitra's wedge (verified against the competitor landscape, Oct 2026):** vernacular voice-in → festival-tied campaign + poster → WhatsApp-out → daily metric logging with coaching in the same language. Captions are commoditized; this loop is not.

## What it does today

| Capability | Where |
|---|---|
| **Campaign generator** — speak or type your brief in 7 languages (English, Hinglish, हिंदी, తెలుగు, தமிழ், ಕನ್ನಡ, मराठी), get a day-by-day plan with captions, hashtags, posting times and a budget split | `/campaign` |
| **Post Studio** — upload a product photo, get a festival poster (1:1 / 4:5 / 9:16) rendered on canvas with 18 art-directed palettes and 5 layouts, A/B caption variants, ready replies, an Instagram-context preview and a one-tap WhatsApp offer message | `/post-studio` |
| **Festival intelligence** — 18-festival Indian calendar (Diwali → Pongal → Rakhi → Onam → Akshaya Tritiya…) with dates for 2026–27, per-festival poster palettes, copy hooks and shopping behaviour, wired into every prompt | `lib/india.ts` |
| **Voice input** — tap the mic and speak your brief (Web Speech API; Indic languages in Chrome) | campaign, post-studio |
| **AI Performance Coach** — reads your logged numbers, explains what to change next in your language, returns a forwardable WhatsApp script and can read advice aloud | `/dashboard/[id]` |
| **Caption scorer with A/B mode** — score one caption or race two head-to-head; Indian-Instagram rubric | `/scorer` |
| **Reply agent** — paste any DM ("price kya hai?"), get brand-consistent replies in Hinglish/Tanglish/English | `/reply-agent` |
| **Video studio** — scene-by-scene reel scripts with shots, voiceover, b-roll, overlays | `/video-studio` |
| **Content ideas** — trending formats, hooks, hashtag sets, best posting times | `/content-studio` |
| **Budget strategy** — interactive creator-vs-boost split with expected reach | `/strategy` |
| **Growth dashboard** — projected vs actual charts, day table, ROI calculator, ad packages | `/dashboard/[id]` |
| **Festival calendar** — every festival with hooks, palette preview and one-tap campaign/post creation | `/festivals` |
| **Voice shop diary** — speak today's numbers, AI extracts them into your dashboard | `/dashboard/[id]` |
| **Auth + Firestore** — Firebase email/Google auth, per-user plans and campaign persistence | `lib/firebase.ts` |

## Stack (all verified working)

- **Next.js 15** (App Router) · React 19 · Tailwind CSS 3 (CSS-variable design tokens, dark + light)
- **Groq** — `openai/gpt-oss-120b` for all text generation (JSON mode, low reasoning effort, retry-once), `whisper-large-v3` for voice-note transcription. *Llama models were retired from Groq's non-Enterprise tiers in Aug 2026 — see `lib/groq.ts`.*
- **Together AI** — optional FLUX image generation in Post Studio (gracefully skipped when out of credits; the canvas poster engine carries the visual load)
- **Voiceovers** — promo videos get narration via Sarvam AI TTS (optional `SARVAM_API_KEY`, real Indian-language voices in 7 languages); without it a free Pollinations voice is used, and if both are unavailable the video simply renders silent — never a hard failure
- **Scene images** — video scenes get photorealistic stills via Gemini image models (optional `GEMINI_API_KEY`, free at aistudio.google.com/apikey); without it a free Pollinations flux fallback is fetched server-side, so scenes always have a visual — never a hard failure
- **Firebase** — Auth + Firestore (`users`, `orders`, `campaigns`)
- **No billing** — all plans are free during beta; activation is direct (Razorpay removed by design)
- **Canvas poster engine** — `lib/poster.ts`, zero external image APIs: seeded-deterministic rendering (preview ≡ download), marigold torans, diyas, rangoli corners, Indic-script sub-lines via Noto fonts

## Setup

```bash
npm install
cp .env.local.example .env.local   # fill in the keys below
npm run dev
```

Required keys (see `.env.local.example`):

| Key | Used for |
|---|---|
| `GROQ_API_KEY` | All AI text + Whisper (required) |
| `NEXT_PUBLIC_FIREBASE_*` | Auth + Firestore (required) |
| `TOGETHER_API_KEY` | Optional AI background images in Post Studio |
| `SARVAM_API_KEY` | Optional Indian-language voiceovers for promo videos (free fallback voice without it) |
| `GEMINI_API_KEY` | Optional Gemini scene images for promo videos (free Pollinations fallback without it) |
| `COMPOSIO_API_KEY` / `COMPOSIO_ENTITY_ID` | Optional Instagram publishing (`/api/instagram-post`) |

## Architecture notes

- **Design system** — CSS variables under `:root` / `[data-theme="light"]` in `app/globals.css`, mapped into Tailwind (`bg-card`, `text-muted`, …). A pre-hydration script in `app/layout.tsx` prevents theme flash. Shared primitives live in `app/components/ui.tsx`.
- **AI plumbing** — every route goes through `chat()` / `chatJSON()` in `lib/groq.ts` (JSON mode, fence-stripping, truncation detection, one retry). The flagship Post Studio uses `chatRefine()`: a drafter → a ruthless editor → a refiner (models reviewing each other). Prompts always include `languagePrompt()` + `festivalPrompt(festival, userText)` — festivals are strictly opt-in, detected from the owner's own words.
- **Auth on AI routes** — `/api/*` AI endpoints verify the Firebase ID token (`lib/auth-guard.ts` → `accounts:lookup`); clients attach it via `authFetch()` in `lib/client.ts`.
- **WhatsApp-first distribution** — no WhatsApp Business API: `wa.me` deep links with pre-filled text (≤300 chars) for offers, statuses and coach scripts. User presses send — consent stays with them.
- **Deterministic posters** — all randomness in `lib/poster.ts` is seeded from the headline, so the preview PNG is pixel-identical to the downloaded PNG.

## Honest status vs. the original vision

- ✅ Multilingual campaigns, voice input, opt-in festival intelligence (never forced), photo→poster pipeline, metric logging + voice diary + coaching, A/B caption testing, WhatsApp offer composer, festival calendar, multi-model quality pipeline
- 🟡 Multimodal photo *understanding* (photo→product analysis) — scaffolded, needs a vision provider (Together VL models are wired for when credits return; Groq currently offers no vision model)
- 🟡 Meta SAM background removal — the poster engine frames/cleans up photos compositionally today; true segmentation awaits a vision provider
- ⏳ Human-expert marketplace, inbound WhatsApp flow (needs WhatsApp Business API or Composio trigger), Llama fine-tuning on Indian marketing copy (dataset + eval planned — open-model adaptability is the long-term moat)

## Roadmap highlights

1. **Fine-tune & eval** — Llama-class open model on Indian-language marketing copy, compared against the base model (open models make vernacular adaptation and low campaign cost possible)
2. **Voice shop diary** — speak today's numbers in any language → Whisper → structured metrics → coached in the same language
3. **Festival countdown automations** — per-category festival calendar with "start 7 days before" nudges
4. **Instagram Graph publishing** — posters uploaded to a public URL then published via the two-step container flow (requires a Professional account)

---

Built with ❤️ for Bharat's small businesses · GrowMitra © 2026
