# GrowMitra 🌱 — AI Marketing Copilot for Local Businesses

> **Turn one product photo and description into full, high-converting commercial marketing campaigns in minutes, not weeks.**

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

## 🏛️ The 5 Dedicated Studios Inside

```
                                  ┌──────────────────────────────┐
                                  │       GrowMitra Copilot      │
                                  └──────────────┬───────────────┘
                                                 │
         ┌───────────────────┬───────────────────┼───────────────────┬───────────────────┐
         │                   │                   │                   │                   │
         ▼                   ▼                   ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Campaign Studio │ │  Video Studio   │ │   Post Studio   │ │ Virality Scorer │ │ AI Growth Coach │
│ Multi-day plans │ │ Kinetic Reels & │ │ 30+ regional    │ │ A/B testing     │ │ WhatsApp flows  │
│ & budget splits │ │ Generative LTX  │ │ canvas posters  │ │ & hook scoring  │ │ & closing CRM   │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 1. 🎯 Campaign Studio (`/campaign`)
* **Multi-Day Promotional Roadmaps:** Input or speak a product brief to receive a structured 3-day to 7-day marketing schedule with daily hooks, posting times, and ad spend allocations.
* **Multilingual Voice Input:** Speak naturally in Hindi, Telugu, Tamil, Kannada, Marathi, or English via Web Speech API. Copy is written in high-converting Indian English.
* **Festival Integration:** Automatically weaves upcoming festival angles and regional greetings into daily themes.

### 2. 🎬 Dual-Engine Video Studio & Generator (`/video-studio` & `/video-generator`)
* **Scene-by-Scene Visual Storyboard:** AI generates 5–7 contextual commercial scenes (close-up, over-the-shoulder, macro action, food preparation, brand ambassador).
* **⚡ Instant Kinetic Reel Engine (100% Free):**
  * Composites all 7 storyboard scenes with punchy kinetic typography headlines, promotional discount badges, atmospheric particle embers, and synchronized AI voiceover narration into a 9:16 CapCut-grade vertical reel in ~3 seconds.
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
│   ├── Replicate API Token  (r8_••••••••••••••••)       │
│   ├── Google Gemini Key    (AIza•••••••••••••••)       │
│   └── Groq API Key         (gsk_•••••••••••••••)       │
└───────────────────────────┬────────────────────────────┘
                            │
               Encrypted HTTPS Request Headers
               (x-user-replicate-key / x-user-gemini-key)
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Next.js API Routes                   │
│                                                        │
│   1. Read key into ephemeral execution memory          │
│   2. Execute external API call (Replicate / Gemini)    │
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
* **AI Text & Reasoning:** [Groq](https://groq.com/) (Llama 3.3 70B Versatile, Whisper Large v3)
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
# AI Text & Transcription (Required)
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

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 How to Get a Free Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/apikey).
2. Sign in with your standard Google account.
3. Click **"Create API Key"** and copy your key (starts with `AIzaSy...`).
4. Paste it into your `.env.local` (`GEMINI_API_KEY=...`) or open the **"🔑 Connect Key"** modal in GrowMitra.
5. *Google provides 15 Requests Per Minute completely free forever without requiring a credit card.*

---

## ☁️ Deploying to Vercel

GrowMitra is optimized for instant zero-configuration deployment on Vercel:

### Deploy via Vercel CLI
```bash
# Link to project
vercel link

# Deploy to production
vercel --prod
```

### Configure Environment Variables on Vercel
In your Vercel Dashboard under **Project Settings → Environment Variables**, add:
* `GROQ_API_KEY`
* `NEXT_PUBLIC_FIREBASE_*` (API Key, Auth Domain, Project ID, App ID)
* `REPLICATE_API_TOKEN` (optional)
* `GEMINI_API_KEY` (optional)

---

## 📄 License & Attribution

Built with ❤️ for India's local business owners and retail entrepreneurs.  
**GrowMitra © 2026. All rights reserved.**
