# 🚀 Social Growth Copilot — Pro Edition

Full-stack AI social media promotion platform with payments, dashboards, and real campaign tracking.

## Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page with pricing plans |
| `/onboard?plan=starter` | 3-step business details form |
| `/checkout` | Razorpay payment + order creation |
| `/dashboard/[id]` | Live campaign dashboard with charts |
| `/campaign` | Free AI campaign generator |
| `/scorer` | Free virality scorer |
| `/reply-agent` | Free auto-reply agent |

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
Copy `.env.local.example` to `.env.local` and fill in:

```env
# Groq (required)
GROQ_API_KEY=gsk_xxxxx

# Razorpay — get from dashboard.razorpay.com → Settings → API Keys
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx

# Firebase — get from console.firebase.google.com
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxxx
```

### 3. Firebase setup
1. Go to console.firebase.google.com → New Project
2. Enable **Firestore Database** (start in test mode)
3. Enable **Authentication** (optional — for user accounts)
4. Go to Project Settings → Your Apps → Add Web App → copy the config

### 4. Razorpay setup
1. Go to dashboard.razorpay.com → Sign up (free)
2. Settings → API Keys → Generate Test Key
3. Copy Key ID and Key Secret to .env.local
4. Test card: `4111 1111 1111 1111`, any CVV, any future date

### 5. Run
```bash
npm run dev
```

## Demo Mode
Without API keys, the app runs in demo mode:
- Payments are simulated (no real charge)
- Firebase falls back to localStorage
- AI still works with Groq key

## Tech Stack
- **Next.js 15** — App Router
- **Groq + Llama 3.3 70B** — AI strategy generation
- **Razorpay** — Indian payment gateway
- **Firebase Firestore** — Orders + campaign data
- **Recharts** — Growth charts
- **Tailwind CSS** — Styling
- **TypeScript** — Type safety

## Firestore Security Rules (IMPORTANT)

Deploy these rules to lock data to each user:

1. Go to Firebase Console → Firestore → Rules tab
2. Replace the default rules with the contents of `firestore.rules`
3. Click **Publish**

Or deploy via CLI:
```bash
npm install -g firebase-tools
firebase login
firebase init firestore   # select your project
firebase deploy --only firestore:rules,firestore:indexes
```

## Composite Index (required for user-scoped queries)

When you first open /my-campaigns, Firebase will show an error with a link to create the required index automatically. Click that link — it creates the index in ~1 minute.

Or deploy manually:
```bash
firebase deploy --only firestore:indexes
```
