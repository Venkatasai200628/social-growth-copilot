# GrowMitra 🌱 — AI Marketing Copilot for Local Businesses

> **Meta Global AI Developer Hackathon 2026 Edition**  
> *Turn one product photo and description into full, high-converting commercial marketing campaigns in minutes, not weeks.*

[![Meta Model API](https://img.shields.io/badge/Meta_Model_API-Muse_Spark_%7C_Wonder_%7C_Code-0866FF?logo=meta&logoColor=white)](https://ai.meta.com/)
[![SAM 3.1](https://img.shields.io/badge/Meta_SAM-3.1_Vision-0668E1)](https://segment-anything.com/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15_App_Router-black?logo=next.js)](https://nextjs.org/)
[![Production Live](https://img.shields.io/badge/Vercel_Production-Live-00C7B7?logo=vercel)](https://social-growth-copilot.vercel.app)

GrowMitra is an all-in-one AI Growth Copilot designed specifically for Indian retail shops, jewellery boutiques, cloud kitchens, apparel stores, and local businesses. It replaces expensive ₹25,000–₹50,000/month digital marketing agencies by giving shop owners studio-grade media creation, video generation, multilingual copywriting, and festival planning directly from their mobile device or browser.

---

## 🌟 Why Local Businesses Need GrowMitra

| Traditional Agency Marketing | GrowMitra AI Copilot |
| :--- | :--- |
| **₹25,000 – ₹50,000 / month** agency retainers | **Zero retainers** — 100% self-serve AI generation |
| **2 to 3 weeks** turnaround for a single promo poster or reel | **3 minutes** from phone photo to customer-ready campaign |
| Generic templates that ignore regional Indian festivals | **20+ Indian festival calendars** (Diwali, Makar Sankranti, Pongal, Ugadi, Eid, Tamil New Year) |
| Disconnected text and complex editing software | **Full-loop execution:** Storyboard → Canvas Poster → 9:16 Video Reel → WhatsApp Broadcast |
| Inflexible fixed campaign dates | **Custom Store Sale Events:** Add anniversary sales, temple utsavs, or flash clearance events |

---

## 🧠 Meta Model API & Muse Ecosystem Architecture

GrowMitra is built natively on top of the **Meta Model API** and the **Muse** model family, orchestrating a multi-model agentic pipeline:

```
                                  ┌──────────────────────────────┐
                                  │      GrowMitra Copilot       │
                                  └──────────────┬───────────────┘
                                                 │
          ┌───────────────────┬───────────────────┼───────────────────┬───────────────────┐
          │                   │                   │                   │                   │
          ▼                   ▼                   ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│    Muse Spark    │ │   Muse Wonder    │ │    Muse Code     │ │   Meta SAM 3.1   │ │    Muse Voice    │
│  Fast Reasoning  │ │ Creative Copy &  │ │ Multi-Agent Auto │ │ Visual Product   │ │ Vernacular Speech│
│  & JSON Roadmap  │ │ Video Storyboard │ │ Refinement & CRM │ │ Cutout & Cleanup │ │  Transcription   │
└──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘ └──────────────────┘
```

* **Meta Muse Spark (`meta/muse-spark-v1`):** Fast structured reasoning model used for multi-day campaign planning, budget splitting, calendar scheduling, and virality A/B scoring.
* **Meta Muse Wonder (`meta/muse-wonder-v1`):** High-capacity creative engine for commercial copywriting, cultural greeting generation, and scene-by-scene 9:16 video storyboarding.
* **Meta Muse Code (`meta/muse-code-v1`):** Autonomous multi-agent pipeline engine — Muse Spark writes the draft, Muse Wonder critiques against Indian retail rubrics, and Muse Code synthesizes the final high-converting output.
* **Meta SAM 3.1 (Segment Anything Model):** Automatic visual product isolation and background segmentation for raw phone photos of jewelry, sarees, and culinary items.
* **Meta Muse Voice (`meta/muse-voice-v1`):** High-accuracy speech-to-text engine accepting vernacular Indian merchant voice notes (Hindi, Telugu, Tamil, Hinglish).

### 📊 Real-Time Muse Audit & Telemetry
Every Meta Model API invocation is certified, measured, and verified in real-time through [`lib/meta-ai-trace.ts`](./lib/meta-ai-trace.ts) and the live `/api/meta-ai-trace` telemetry endpoint, giving hackathon judges and operators verifiable proof of model execution, token accounting, and latency metrics.

---

## 🏛️ The 5 Dedicated Studios Inside

### 1. 🎯 Campaign Studio (`/campaign`)
* **Multi-Day Promotional Roadmaps:** Input or speak a product brief to receive a structured 3-day to 7-day marketing schedule with daily hooks, posting times, and ad spend allocations.
* **Multilingual Voice Input:** Speak naturally in Hindi, Telugu, Tamil, Kannada, Marathi, or English via Web Speech API. Copy is written in high-converting Indian English.
* **Festival Integration:** Automatically weaves upcoming festival angles and regional greetings into daily themes.

### 2. 🎬 Dual-Engine Video Studio & Generator (`/video-studio` & `/video-generator`)
* **Scene-by-Scene Visual Storyboard:** AI generates 5–7 contextual commercial scenes (close-up, over-the-shoulder, macro action, food preparation, brand ambassador).
* **⚡ Instant Kinetic Reel Engine (100% Free):**
  * Composites all storyboard scenes with punchy kinetic typography headlines, promotional discount badges, atmospheric particle embers, and synchronized AI voiceover narration into a 9:16 CapCut-grade vertical reel in ~3 seconds.
  * Runs entirely client-side via HTML5 Canvas and MediaRecorder. Zero external API credits required.
* **🎬 AI Generative Video Engine (Replicate Cloud GPU):**
  * Powered by Lightricks LTX-Video neural diffusion running on cloud Nvidia A100 GPUs.
  * Transforms static photos into physical fluid motion with realistic camera sweeps.
* **Automated 1.5-Minute Batch Auto-Pacing:**
  * When clicking "1-Click: Generate All Visuals", GrowMitra automatically generates each scene, manages the 1.5-minute cooldown interval with live countdown timers, and automatically renders the complete video reel upon completion.

### 3. 🎨 Festival Post Studio (`/post-studio`)
* **Studio-Grade Canvas Posters:** Generates high-resolution graphics in **1:1 Square Feed**, **4:5 Vertical Feed**, and **9:16 Story/Reels** formats.
* **30+ Regional Art-Directed Palettes:** Authentic Indian festival colors including Royal Gold, Diwali Maroon, Temple Saffron, Garba Fuchsia, Eid Emerald, and Pongal Green.
* **Custom Hero Product Placement:** Easily upload and frame your real store product (e.g. burger, saree, gold necklace) onto the poster canvas.

### 4. 📈 Virality & Copy Scorer (`/scorer`)
* **Head-to-Head A/B Testing:** Compare two hooks, headlines, or captions before posting to predict engagement and scroll-stopping potential.
* **Rubric-Based Evaluation:** Evaluates hook urgency, clarity, retail call-to-action, cultural resonance, and hashtag effectiveness.

### 5. 🤖 AI Growth Coach & WhatsApp Commerce (`/strategy` & `/reply-agent`)
* **Direct WhatsApp Flows:** One-tap `wa.me` links with pre-filled promo offers, status messages, and customer closing scripts.
* **Smart DM Reply Agent:** Paste customer inquiries (e.g. *"Price please"*, *"Is home delivery available?"*) and generate courteous, conversion-focused responses.

---

## 🪔 Pan-Indian Festival & Seasonal Intelligence

GrowMitra features a dynamic cultural engine ([`lib/india.ts`](./lib/india.ts)) covering 20+ major shopping festivals across India:

* **Makar Sankranti / Pongal / Lohri:** Inclusive greetings across Tamil Nadu (`பொங்கல் நல்வாழ்த்துகள்`), Andhra/Telangana (`సంక్రాంతి శుభాకాంక్షలు`), and North India (`मकर संक्रांति`).
* **Sri Rama Navami:** Nationwide celebrations with Hindi, Telugu, Tamil, and English.
* **Tamil Festivals:** Dedicated support for Tamil New Year (**Puthandu / சித்திரை புத்தாண்டு**) and **Karthigai Deepam (கார்த்திகை தீபம்)**.
* **Regional Celebrations:** Bathukamma (Telangana Flower Festival), Chhath Puja, Onam, Ganesh Chaturthi, Navratri, and Eid al-Fitr.
* **➕ Custom Festival & Store Sale Builder:** Store owners can add custom celebrations (e.g. *5th Store Anniversary Sale*, *Local Temple Utsav*, *Monsoon Clearance*) with custom dates, taglines, and poster palettes.

---

## 🔐 Security Architecture & BYOK (Bring Your Own Key)

GrowMitra implements a strict client-side **Bring Your Own Key (BYOK)** framework ([`lib/api-keys.ts`](./lib/api-keys.ts)):

```
┌────────────────────────────────────────────────────────┐
│                   User's Web Browser                   │
│                                                        │
│   localStorage ('gm_user_api_keys')                   │
│   ├── Meta Model API Key   (meta_••••••••••••••)       │
│   ├── Replicate API Token  (r8_••••••••••••••••)       │
│   └── Google Gemini Key    (AIza•••••••••••••••)       │
└───────────────────────────┬────────────────────────────┘
                            │
               Encrypted HTTPS Request Headers
               (x-user-meta-key / x-user-replicate-key)
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Next.js API Routes                   │
│                                                        │
│   1. Read key into ephemeral execution memory          │
│   2. Execute external API call                         │
│   3. Key immediately dropped from memory               │
│   4. NEVER logged to console or stored on server disk │
└────────────────────────────────────────────────────────┘
```

* 🔒 **100% Local Browser Isolation:** Keys are stored strictly in the user's browser `localStorage`. They are never written to Firestore, databases, or shared files.
* 🛡️ **Zero Server Logging:** API routes use keys in memory for that single request and never log or persist them.
* 👁️ **Client-Side Masking:** Keys are masked with an eye toggle to prevent shoulder-surfing.
* 🗑️ **Instant 1-Click Disconnect:** Users can wipe keys from their browser at any time to revert to default system keys.

---

## 🛠️ Tech Stack & System Design

* **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Components & Route Handlers)
* **Frontend:** [React 19](https://react.dev/), [Tailwind CSS 3](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
* **AI Text, Reasoning & Agents:** [Meta Model API](https://ai.meta.com/) (Muse Spark, Muse Wonder, Muse Code, Muse Voice)
* **Visual Segmentation:** [Meta SAM 3.1](https://segment-anything.com/) (Segment Anything Model)
* **AI Video Generation:** [Replicate](https://replicate.com/) (Lightricks LTX-Video 25 FPS diffusion)
* **AI Image Generation:** [Google Gemini API](https://aistudio.google.com/) (`gemini-2.5-flash-image`) & Pollinations Flux fallback
* **In-Browser Video Compositing:** HTML5 Canvas API + Web Audio API + MediaRecorder (Zero-dependency MP4/WebM rendering)
* **Authentication & Database:** [Firebase](https://firebase.google.com/) Authentication & Cloud Firestore
* **Hosting & CDN:** [Vercel](https://vercel.com/) Edge Network

---

## 🚀 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/Venkatasai200628/social-growth-copilot.git
cd social-growth-copilot
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the root directory:
```bash
cp .env.local.example .env.local
```

Required keys:
```env
# Meta Model API Key (Primary for Meta AI / Muse Suite)
META_API_KEY=meta_sec_your_meta_api_key

# Localhost Fast Inference Fallback (Optional)
GROQ_API_KEY=gsk_your_groq_api_key

# Firebase Authentication & Firestore (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# AI Video Diffusion (Optional - or connect in UI via BYOK)
REPLICATE_API_TOKEN=r8_your_replicate_token

# Google Gemini Image Models (Optional - or connect in UI via BYOK)
GEMINI_API_KEY=AIzaSy_your_free_gemini_key
```

> **Localhost Development Note:** The app automatically falls back to `GROQ_API_KEY` if running on localhost, allowing seamless local development without needing a cloud Meta Model API setup.

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Production Deployment

GrowMitra is deployed on the Vercel Edge Network:
* **Production Live URL:** [https://social-growth-copilot.vercel.app](https://social-growth-copilot.vercel.app)
* **GitHub Repository:** [https://github.com/Venkatasai200628/social-growth-copilot](https://github.com/Venkatasai200628/social-growth-copilot)

---

## 📄 License
MIT License. Built for the Meta Global AI Developer Hackathon 2026.
