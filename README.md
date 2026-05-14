<div align="center">

<img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" />
<img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" />
<img src="https://img.shields.io/badge/Firebase-Firestore-orange?style=for-the-badge&logo=firebase" />
<img src="https://img.shields.io/badge/Anthropic-Claude-blueviolet?style=for-the-badge" />
<img src="https://img.shields.io/badge/Razorpay-Payments-02042b?style=for-the-badge&logo=razorpay" />
<img src="https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel" />

<br/><br/>

# 🚀 Social Growth Copilot

### The AI-powered social media promotion platform built for Indian businesses.
### Generate campaigns, track ROI, create viral content — all in one place.

<br/>

> **"From zero to a full 30-day campaign in under 5 minutes."**

<br/>

[🌐 Live Demo](https://social-growth-copilot.vercel.app) &nbsp;·&nbsp; [📖 Setup Guide](#%EF%B8%8F-setup--run-locally) &nbsp;·&nbsp; [🐛 Issues](https://github.com/Venkatasai200628/social-growth-copilot/issues)

</div>

---

## 🌍 Why Social Growth Copilot Exists

Most small businesses in India can't afford a marketing agency. A decent agency charges ₹20,000–₹50,000/month — and even then, you're handing over control, waiting days for content, and hoping they understand your product.

**Social Growth Copilot changes that.**

It puts an AI marketing team in your hands for a fraction of the price. Whether you run a jewellery store in Chennai, a cloud kitchen in Pune, or a SaaS startup in Bangalore — you get a full, professional campaign in minutes, not weeks.

No marketing degree. No agency. No waiting.

---

## 💡 The Problem It Solves

| Without Social Growth Copilot | With Social Growth Copilot |
|-------------------------------|---------------------------|
| Spend hours writing captions | AI generates 30 days of captions in seconds |
| Guess which hashtags to use | Category-specific, trending hashtag strategies |
| No idea how to allocate budget | AI recommends exact influencer + boost split |
| Can't track what's working | Live dashboard: projected vs actual reach daily |
| Video content feels impossible | Shot-by-shot video scripts with voiceover included |
| Miss DMs and comments | Auto-reply templates ready to copy-paste |
| Pay ₹30,000/month to an agency | Full campaign from ₹999 |

---

## ✨ Features

### 🧠 AI Campaign Generator
Enter your product name, category, goal, and budget. Get a complete multi-platform campaign plan with a day-by-day content calendar, captions, hashtags, posting times, and influencer strategy — all tailored to your specific business.

### 📊 Live Campaign Dashboard
Track your campaign in real time. Every day you update your actual numbers — reach, clicks, impressions, conversions — and the dashboard shows you how you're tracking against projections with beautiful charts. Know exactly which days to push harder and which are over-performing.

### 🤖 AI Performance Coach
After a few days of data, the AI Coach analyses your actual performance and tells you exactly what to do next. Are you above target? Here's how to double down. Below target? Here's what to fix. It's like having a growth consultant on call 24/7.

### 🎬 Video Script Generator
Video is the highest-reach format on every platform — and the hardest to create. Social Growth Copilot generates complete video scripts with shot-by-shot directions, voiceover text, b-roll suggestions, and on-screen text overlays. Hand it to any videographer and they can shoot immediately.

### ✍️ Post Studio
Generate platform-optimised captions for Instagram, LinkedIn, Twitter/X, Facebook, YouTube, and WhatsApp. Each caption is written in the right tone for that platform, with hooks, CTAs, and hashtags. What used to take 2 hours now takes 2 minutes.

### 🔥 Virality Scorer
Paste any caption and get an instant virality score out of 100 — with a breakdown of what's working, what's weak, and a rewritten version that scores higher. Stop posting content that flops.

### 💬 Auto-Reply Agent
Running out of things to say in your DMs and comment sections? The reply agent generates context-aware, brand-consistent responses based on the kind of message you received. Never leave a customer waiting again.

### 📸 Instagram Auto-Posting
Connect your Instagram account via Composio and post directly from the platform. No switching apps, no copy-pasting. Generate, approve, post — all in one flow.

### 💰 Budget Strategy Engine
Tell the platform your campaign budget and it calculates the optimal split between influencer partnerships and paid post boosting. It recommends the right influencer tier (nano, micro, or mid-tier), how many to work with, and exactly how much to spend on each — based on your category and goal.

### 📅 Content Studio
Browse AI-generated content ideas by category. See what formats, hooks, and strategies are actually performing right now in your niche — so you always know what to post next, even outside your paid campaign.

---

## 🖼️ App Pages

| Route | What it does |
|-------|-------------|
| `/` | Landing page with pricing plans and testimonials |
| `/welcome` | Post-login welcome screen |
| `/onboard?plan=starter` | 3-step business details form |
| `/checkout` | Razorpay payment + order creation |
| `/strategy` | AI budget strategy breakdown |
| `/campaign` | Free AI 7-day campaign generator |
| `/content-studio` | AI content ideas by category |
| `/post-studio` | Generate ready-to-post captions |
| `/video-studio` | AI video script generator |
| `/reply-agent` | Auto-reply templates for DMs & comments |
| `/scorer` | Free virality scorer for any caption |
| `/dashboard/[id]` | Live campaign dashboard with ROI charts |
| `/my-campaigns` | All your campaigns in one place |
| `/profile` | User profile and account settings |

---

## 💰 Pricing Plans

| Plan | Price | Duration | Platforms | Best For |
|------|-------|----------|-----------|----------|
| **Starter** | ₹999 | 7 days | Instagram, Facebook | Small businesses & solo creators |
| **Growth** | ₹2,999 | 14 days | + Twitter/X, LinkedIn | Growing brands & startups |
| **Pro** | ₹7,999 | 30 days | All 6 platforms incl. YouTube | Serious businesses ready to scale |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Auth & Database | Firebase (Authentication + Firestore) |
| Payments | Razorpay |
| Instagram Posting | Composio |
| Charts | Recharts |
| Deployment | Vercel |

---

## ⚙️ Setup — Run Locally

### Prerequisites

Make sure you have these installed:
- [Node.js 18+](https://nodejs.org)
- [Git](https://git-scm.com)
- npm (comes with Node.js)

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/Venkatasai200628/social-growth-copilot.git
cd social-growth-copilot
npm install
```

---

### Step 2 — Create your `.env.local` file

In the root of the project, create a file named `.env.local` and paste the following:

```env
# ── Anthropic (Claude AI) ──────────────────────────────────────
ANTHROPIC_API_KEY=

# ── Firebase ──────────────────────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# ── Razorpay ──────────────────────────────────────────────────
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=

# ── Composio (Instagram posting) ──────────────────────────────
COMPOSIO_API_KEY=
COMPOSIO_ENTITY_ID=
```

Fill in the values by following the steps below 👇

---

### Step 3 — Get your API keys

#### 🤖 Anthropic (Claude AI) — Required for all AI features

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to **API Keys** → click **Create Key**
4. Copy the key → paste as `ANTHROPIC_API_KEY`

---

#### 🔥 Firebase — Required for Auth and Database

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add Project** → give it a name → click through the setup
3. Once inside your project:

**Enable Firestore:**
- Click **Firestore Database** in the left sidebar
- Click **Create database**
- Choose **Production mode** → select a region (`asia-south1` recommended for India) → click **Enable**

**Enable Google Auth:**
- Click **Authentication** → **Get started**
- Click **Google** → toggle **Enable** → click **Save**

**Get your config:**
- Click the ⚙️ gear icon → **Project Settings**
- Scroll to **Your apps** → click **Add app** → choose the **Web** icon (`</>`)
- Register the app → copy the `firebaseConfig` values into your `.env.local`

**Set Firestore security rules:**
- Go to **Firestore** → **Rules** tab
- Replace everything with:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
- Click **Publish**

---

#### 💳 Razorpay — Required for payments

1. Go to [dashboard.razorpay.com](https://dashboard.razorpay.com) → Sign up (free)
2. Go to **Settings** → **API Keys** → **Generate Test Key**
3. Copy **Key ID** → paste as both `RAZORPAY_KEY_ID` and `NEXT_PUBLIC_RAZORPAY_KEY_ID`
4. Copy **Key Secret** → paste as `RAZORPAY_KEY_SECRET`

> **Test card:** `4111 1111 1111 1111` · Any CVV · Any future expiry date

---

#### 📸 Composio — Required for Instagram auto-posting (optional)

1. Go to [app.composio.dev](https://app.composio.dev) → Sign up
2. Go to **Settings** → copy your **API Key** → paste as `COMPOSIO_API_KEY`
3. Go to **Connections** → **Add connection** → search **Instagram** → connect your account
4. Copy your **Entity ID** → paste as `COMPOSIO_ENTITY_ID`

> If you skip this, everything else still works — Instagram auto-posting is just disabled.

---

### Step 4 — Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 🚀 Deploy to Vercel

### Step 1 — Push to GitHub

```bash
git add .
git commit -m "initial setup"
git push origin main
```

### Step 2 — Import to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo → click **Deploy**

### Step 3 — Add environment variables

1. Go to your project → **Settings** → **Environment Variables**
2. Add every key from your `.env.local`
3. Set environment to **Production + Preview + Development** for each key

### Step 4 — Redeploy

Go to **Deployments** → click **three dots** → **Redeploy** → uncheck "Use build cache"

### Step 5 — Add your Vercel domain to Firebase

1. Firebase → **Authentication** → **Settings** → **Authorized domains**
2. Click **Add domain** → enter your Vercel URL (e.g. `your-app.vercel.app`) — no `https://`
3. Click **Add**

Your app is now live ✅

---

## 📁 Project Structure

```
social-growth-copilot/
├── app/
│   ├── api/                   # All API routes (AI, payments, Composio)
│   │   ├── content-studio/    # AI content idea generator
│   │   ├── create-order/      # Razorpay order creation
│   │   ├── generate-campaign/ # Full campaign generator
│   │   ├── generate-strategy/ # Budget strategy AI
│   │   ├── instagram-post/    # Composio Instagram posting
│   │   ├── reply-agent/       # Auto-reply generator
│   │   ├── save-order/        # Save order to Firestore
│   │   ├── score-caption/     # Virality scorer
│   │   └── ai-coach/          # AI performance coaching
│   ├── components/            # Shared UI components
│   ├── dashboard/[id]/        # Live campaign dashboard
│   ├── campaign/              # Campaign generator page
│   ├── content-studio/        # Content idea page
│   ├── post-studio/           # Caption generator page
│   ├── video-studio/          # Video script generator
│   ├── reply-agent/           # Auto-reply page
│   ├── scorer/                # Virality scorer page
│   ├── onboard/               # Onboarding flow
│   ├── checkout/              # Payment page
│   ├── strategy/              # Budget strategy page
│   ├── my-campaigns/          # Campaign list
│   └── profile/               # User profile
├── lib/
│   ├── firebase.ts            # Firebase config
│   ├── auth-context.tsx       # Auth state provider
│   ├── types.ts               # Shared TypeScript types
│   ├── plans.ts               # Pricing plan definitions
│   └── budget.ts              # Budget strategy calculator
├── public/                    # Static assets
├── next.config.js             # Next.js config
├── firestore.rules            # Firestore security rules
├── firestore.indexes.json     # Firestore indexes
└── tailwind.config.js         # Tailwind config
```

---

## 🔒 Environment Variables Reference

| Variable | Required | Where to get it |
|----------|----------|----------------|
| `ANTHROPIC_API_KEY` | ✅ Yes | [console.anthropic.com](https://console.anthropic.com) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ Yes | Firebase → Project Settings |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ Yes | Firebase → Project Settings |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ Yes | Firebase → Project Settings |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ Yes | Firebase → Project Settings |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ Yes | Firebase → Project Settings |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ Yes | Firebase → Project Settings |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | ⚠️ Optional | Firebase → Project Settings |
| `RAZORPAY_KEY_ID` | ✅ Yes | [dashboard.razorpay.com](https://dashboard.razorpay.com) → API Keys |
| `RAZORPAY_KEY_SECRET` | ✅ Yes | [dashboard.razorpay.com](https://dashboard.razorpay.com) → API Keys |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | ✅ Yes | Same as `RAZORPAY_KEY_ID` |
| `COMPOSIO_API_KEY` | ⚠️ Optional | [app.composio.dev](https://app.composio.dev) → Settings |
| `COMPOSIO_ENTITY_ID` | ⚠️ Optional | [app.composio.dev](https://app.composio.dev) → Connections |

---

## 👨‍💻 Built By

**Venkatasai** — [@Venkatasai200628](https://github.com/Venkatasai200628)

---

<div align="center">

⭐ **If this project helped you, please give it a star!** ⭐

</div>
