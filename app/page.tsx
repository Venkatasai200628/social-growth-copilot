'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap, Star, MessageCircle, TrendingUp, ArrowRight,
  Sparkles, Shield, Clock, Film, ChevronRight, Play, Mic, Languages,
  Calendar, Camera, Brain, Wallet, Store, Gem, UtensilsCrossed, Shirt, Cake,
  Users, Image as ImageIcon, Video, MapPin, Wand2, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

/* ── Festival urgency banner ────────────────────────────────────── */
const DIWALI_DAYS = 6;

function FestivalBanner({ user }: { user: { uid: string } | null }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('gm_diwali_banner_dismissed') === '1') {
        setDismissed(true);
      }
    } catch { /* ignore */ }
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem('gm_diwali_banner_dismissed', '1'); } catch { /* ignore */ }
  };

  if (dismissed) return null;

  return (
    <div className="relative z-20 flex items-center justify-center gap-3 px-6 py-2.5 text-sm"
      style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--gold) 20%, transparent), color-mix(in srgb, var(--gold) 12%, transparent), color-mix(in srgb, var(--gold) 20%, transparent))', borderBottom: '1px solid color-mix(in srgb, var(--gold) 25%, transparent)' }}>
      <span>🪔 <strong>Diwali is in {DIWALI_DAYS} days</strong> — prepare your campaign and festival offers</span>
      <button onClick={() => router.push(user ? '/home' : '/auth')}
        className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full transition-all"
        style={{ background: 'color-mix(in srgb, var(--gold) 25%, transparent)', color: 'var(--gold)', border: '1px solid color-mix(in srgb, var(--gold) 40%, transparent)' }}>
        Get Started <ArrowRight size={10} />
      </button>
      <button onClick={dismiss} className="ml-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-lg leading-none absolute right-4">×</button>
    </div>
  );
}

/* ── Phone mockup / preview card ────────────────────────────────── */
function PhoneMockup() {
  const [dotCount, setDotCount] = useState(1);
  useEffect(() => {
    const iv = setInterval(() => setDotCount((d) => (d % 3) + 1), 500);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="relative animate-slide-right">
      <div className="w-[280px] mx-auto rounded-[2.5rem] border-2 border-[var(--border)] bg-[var(--card)] shadow-2xl overflow-hidden" style={{ boxShadow: '0 32px 80px rgba(139,92,246,0.18)' }}>
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-soft)]">
          <span className="text-[10px] text-[var(--text-muted)]">9:41</span>
          <div className="w-16 h-3 rounded-full bg-[var(--bg)]" />
          <span className="text-[10px] text-[var(--text-muted)]">●●●</span>
        </div>
        {/* Poster preview card */}
        <div className="m-4 rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #1a0533, #2d0a4f, #3d0f6b)', minHeight: 200 }}>
          <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 70% 30%, #f5b942 0%, transparent 60%)' }} />
          <div className="relative p-5">
            <div className="text-[10px] text-amber-300 uppercase tracking-widest mb-1 font-semibold">🪔 Diwali Special</div>
            <div className="text-white font-bold text-base leading-tight mb-1">Sri Lakshmi Jewellers</div>
            <div className="text-amber-200 text-xs mb-3">Flat 20% off on all gold bangles</div>
            <div className="w-full h-px bg-amber-400 opacity-30 mb-3" />
            <div className="text-[9px] text-amber-300 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Crafting your marketing campaign{'.' .repeat(dotCount)}
            </div>
          </div>
        </div>
        {/* Caption preview */}
        <div className="px-4 pb-4 space-y-2">
          <div className="h-2 bg-[var(--border)] rounded-full w-full animate-pulse-slow" />
          <div className="h-2 bg-[var(--border)] rounded-full w-3/4 animate-pulse-slow" />
          <div className="h-2 bg-[var(--border)] rounded-full w-1/2 animate-pulse-slow" />
          <div className="flex gap-2 mt-3">
            {['#diwali', '#jewellery', '#gold'].map((t) => (
              <span key={t} className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent-soft)' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const PERSONAS = [
  { icon: Gem, color: 'var(--gold)', title: 'Jewellery Shops', line: 'Akshaya Tritiya, Dhanteras and wedding campaigns with gold-on-maroon posters and high-ticket customer scripts.' },
  { icon: UtensilsCrossed, color: 'var(--neon)', title: 'Cloud Kitchens & Cafes', line: 'Weekend special posters, menu highlights, and fast WhatsApp templates for hungry customers.' },
  { icon: Shirt, color: 'var(--accent-soft)', title: 'Boutiques & Apparel', line: 'Festive edit look-books, bridal collections, and styled AI brand ambassador reels.' },
  { icon: Cake, color: 'var(--success)', title: 'Home Bakers & Confectioners', line: 'Holiday hampers, custom cake pre-orders, and studio-grade macro photography stills.' },
];

const PLATFORM_AREAS = [
  {
    badge: 'Media Creation',
    color: 'var(--accent-soft)',
    title: 'Visual & Motion Studios',
    subtitle: 'From a single phone photo or concept to studio-grade marketing assets.',
    items: [
      {
        icon: Wand2,
        name: 'AI Visual Studio',
        desc: 'Generate charismatic Indian brand ambassador creators, studio product macros, and lifestyle settings with downloadable high-res stills.',
      },
      {
        icon: ImageIcon,
        name: 'Festival Post Studio',
        desc: 'Turn product photos into polished posters across 1:1 square, 4:5 vertical, and 9:16 story formats with 30+ regional color palettes.',
      },
      {
        icon: Film,
        name: 'Video Studio',
        desc: 'Create animated promo reels with Ken-Burns motion, sound synchronization, text overlays, and coordinated AI voice narration.',
      },
    ],
  },
  {
    badge: 'Marketing Strategy',
    color: 'var(--gold)',
    title: 'Campaign & Strategy Planning',
    subtitle: 'Structured plans that remove the guesswork from social media consistency.',
    items: [
      {
        icon: Zap,
        name: 'Campaign Generator',
        desc: 'Speak or type your goal to receive a multi-day plan with daily hooks, posting schedules, caption copy, and recommended ad spend.',
      },
      {
        icon: Calendar,
        name: 'Festival Intelligence Calendar',
        desc: 'Countdown, cultural significance, and tailored promotion ideas for 18+ major Indian shopping occasions (Diwali, Pongal, Eid, etc.).',
      },
      {
        icon: Star,
        name: 'Virality Scorer (A/B Testing)',
        desc: 'Score two hooks or captions head-to-head before posting to discover which one will stop the Instagram scroll.',
      },
    ],
  },
  {
    badge: 'Conversions & Growth',
    color: '#25d366',
    title: 'Customer Conversations & Optimization',
    subtitle: 'Convert casual profile viewers into paying local customers.',
    items: [
      {
        icon: MessageCircle,
        name: 'Reply Assistant',
        desc: 'Paste any customer comment or DM inquiry to get courteous, brand-aligned English replies that close orders faster.',
      },
      {
        icon: Wallet,
        name: 'WhatsApp Commerce Flow',
        desc: 'One-click WhatsApp offer copy tailored for direct messaging, status updates, and broadcast lists.',
      },
      {
        icon: Brain,
        name: 'AI Growth Coach',
        desc: 'Reviews your real logged numbers day-by-day and delivers concrete, actionable tactical adjustments.',
      },
    ],
  },
];

const HUMAN_EXPERT_CARDS = [
  { icon: Camera, title: 'Photo Editor', cities: 'Hyderabad, Mumbai, Chennai' },
  { icon: ImageIcon, title: 'Graphic Designer', cities: 'Bengaluru, Delhi, Pune' },
  { icon: Video, title: 'Video Editor', cities: 'Mumbai, Hyderabad, Kolkata' },
  { icon: Users, title: 'Local Influencer', cities: 'All major Indian metro areas' },
];

const TESTIMONIALS = [
  {
    name: 'Priya Reddy',
    business: 'Cloud Kitchen',
    city: 'Hyderabad',
    quote: 'Used to spend hours stressing over Instagram. Now in 10 minutes my campaigns look like they came from a top creative agency.',
  },
  {
    name: 'Mohammed Irfan',
    business: 'Jewellery Boutique',
    city: 'Chennai',
    quote: 'The Akshaya Tritiya campaign GrowMitra created gave us our strongest festive footfall of the year.',
  },
  {
    name: 'Sunita Sharma',
    business: 'Home Bakery',
    city: 'Delhi',
    quote: 'Speaking my brief naturally and getting high-converting English posters and captions is a total game changer.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace('/home');
    }
  }, [user, router]);

  // Clean transition loader for authenticated users
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--text-muted)] tracking-wider uppercase">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[800px] h-[800px] bg-[var(--accent)]/10 top-[-300px] right-[-200px]" />
      <div className="orb w-[500px] h-[500px] bg-[var(--neon)]/6 bottom-[200px] left-[-150px]" />
      <div className="orb w-[400px] h-[400px] bg-pink-600/5 top-[400px] right-[100px]" />

      {/* Festival Banner */}
      <FestivalBanner user={user} />

      {/* ── HERO ── */}
      <section id="overview" className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div className="animate-slide-left">
            <div className="inline-flex items-center gap-2 bg-[var(--accent)]/8 border border-[var(--accent)]/20 rounded-full px-5 py-2 text-xs text-[var(--accent-soft)] mb-6 tracking-widest uppercase">
              <Sparkles size={11} /> AI Marketing Copilot for Local Businesses
            </div>

            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
              <span className="text-[var(--text)]">Turn one product</span>{' '}
              <span className="text-[var(--accent-soft)]">into full campaigns.</span>
              <br />
              <span className="text-[var(--text-muted)]">In minutes, not weeks.</span>
            </h1>

            <p className="text-[var(--text-muted)] text-base md:text-lg max-w-xl leading-relaxed mb-4">
              GrowMitra combines <strong className="text-[var(--text-soft)]">AI media creation with human expert assistance</strong> to turn simple phone photos into commercial posters, animated promo reels, WhatsApp flows, and strategic marketing calendars.
            </p>
            <p className="text-[var(--text-faint)] text-xs md:text-sm max-w-lg mb-8">
              Built specifically for jewellery shops, boutiques, cloud kitchens, and local retailers across India. No agencies. No design experience required.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button onClick={() => router.push('/auth')}
                className="flex items-center gap-2 px-8 py-4 rounded-full text-white text-sm font-medium tracking-wide hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-lg shadow-[var(--accent)]/25 [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]">
                <Zap size={14} /> Get Started Free
              </button>
              <button onClick={() => document.getElementById('studios')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-8 py-4 rounded-full text-[var(--text-muted)] text-sm border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-all">
                <Play size={13} /> Explore Studios <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Right: phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ── CORE PILLARS BAR (Clean capabilities without random fake numbers) ── */}
      <section className="relative z-10 border-y border-[var(--border)] bg-[var(--card)]/40">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Languages, title: 'Multilingual Voice Input', desc: 'Speak naturally in Hindi, Tamil, Telugu, Marathi or English; outputs ready-to-post English campaigns.' },
            { icon: Sparkles, title: 'Authentic Indian Aesthetics', desc: 'Curated color palettes and festive motifs tuned for local festivals, wedding seasons, and retail promotions.' },
            { icon: ShieldCheck, title: 'Meta AI Open Intelligence', desc: 'Enterprise-grade reasoning powered by Llama 3.3 70B, Meta SAM segmentation, and Llama Guard safety.' },
            { icon: Store, title: 'Direct Business Ownership', desc: 'Zero agency retainers. Full ownership of all generated visual graphics, video reels, and scripts.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon size={16} className="text-[var(--accent-soft)]" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider mb-1">{title}</h4>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPREHENSIVE STUDIO OVERVIEWS (Organized by functional areas) ── */}
      <section id="studios" className="relative z-10 max-w-6xl mx-auto px-6 py-24 space-y-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-full px-4 py-1.5 text-xs text-[var(--accent-soft)] mb-3 uppercase tracking-widest">
            Complete Marketing Suite
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-[var(--text)] mb-4">
            Everything your business needs to grow
          </h2>
          <p className="text-sm md:text-base text-[var(--text-muted)]">
            GrowMitra organizes your marketing into dedicated studios — from visual generation to multi-day campaign execution.
          </p>
        </div>

        {PLATFORM_AREAS.map((area) => (
          <div key={area.title} className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <span className="text-[11px] uppercase tracking-widest font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: `color-mix(in srgb, ${area.color} 15%, transparent)`, color: area.color }}>
                  {area.badge}
                </span>
                <h3 className="text-2xl font-bold text-[var(--text)] mt-2 font-display">{area.title}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{area.subtitle}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {area.items.map((item) => (
                <div key={item.name} className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-7 hover:border-[var(--accent)]/40 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                      style={{ background: `color-mix(in srgb, ${area.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${area.color} 25%, transparent)` }}>
                      <item.icon size={20} style={{ color: area.color }} />
                    </div>
                    <h4 className="text-base font-semibold text-[var(--text)] mb-2.5">{item.name}</h4>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[var(--border-soft)]">
                    <button
                      onClick={() => router.push('/auth')}
                      className="text-xs font-medium text-[var(--accent-soft)] hover:underline flex items-center gap-1"
                    >
                      Learn more in studio <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="relative z-10 max-w-5xl mx-auto px-6 py-20 border-t border-[var(--border)]">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl font-bold text-[var(--text)] mb-3">How it works</h2>
          <p className="text-[var(--text-muted)] text-sm">Four straightforward steps. Zero technical complexity.</p>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { step: '01', icon: Mic, title: 'Share your idea', desc: 'Tap the mic or type one line — what you sell, your city, your offer. Voice input understands any regional language.' },
            { step: '02', icon: Camera, title: 'Add your photo', desc: 'Upload a phone photo, or generate commercial stills and AI presenters in Visual Studio.' },
            { step: '03', icon: Sparkles, title: 'Get complete package', desc: 'Receive posters, motion reel scripts, voice narration, hashtags, and a structured multi-day calendar.' },
            { step: '04', icon: TrendingUp, title: 'Publish & track', desc: 'Share on Instagram or WhatsApp, track real customer inquiries, and sharpen tomorrow’s campaigns.' },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="text-center bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6">
              <div className="font-display text-3xl font-bold text-[var(--accent-soft)] mb-3">{step}</div>
              <div className="w-10 h-10 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] flex items-center justify-center mx-auto mb-4">
                <Icon size={16} className="text-[var(--accent-soft)]" />
              </div>
              <h4 className="text-[var(--text)] text-sm font-semibold mb-2">{title}</h4>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PERSONAS ── */}
      <section className="relative z-10 border-t border-[var(--border)] bg-[var(--card)]/40">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-[var(--text)] mb-3">Tailored for Indian retail & commerce</h2>
            <p className="text-[var(--text-muted)] text-sm">Engineered for the independent business owner.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PERSONAS.map((p) => (
              <div key={p.title} className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 hover:border-[var(--accent)]/40 hover:-translate-y-1 transition-all duration-300">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: `color-mix(in srgb, ${p.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${p.color} 25%, transparent)` }}>
                  <p.icon size={18} style={{ color: p.color }} />
                </div>
                <h4 className="text-[var(--text)] font-semibold mb-2">{p.title}</h4>
                <p className="text-[var(--text-muted)] text-xs leading-relaxed">{p.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HUMAN EXPERT LAYER ── */}
      <section id="experts" className="relative z-10 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'color-mix(in srgb, var(--gold) 15%, transparent)', color: 'var(--gold)', border: '1px solid color-mix(in srgb, var(--gold) 30%, transparent)' }}>
              Human Hybrid Network
            </div>
            <h2 className="font-display text-4xl font-bold text-[var(--text)] mb-3">When AI needs human polish, experts step in</h2>
            <p className="text-[var(--text-muted)] text-sm max-w-2xl mx-auto">
              GrowMitra connects you with vetted photo retouchers, graphic designers, video editors, and local creators — matched by city, category, and budget.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HUMAN_EXPERT_CARDS.map(({ icon: Icon, title, cities }) => (
              <div key={title} className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 relative">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'color-mix(in srgb, var(--gold) 12%, transparent)', border: `1px solid color-mix(in srgb, var(--gold) 25%, transparent)` }}>
                  <Icon size={18} style={{ color: 'var(--gold)' }} />
                </div>
                <h4 className="text-[var(--text)] font-semibold mb-2">{title}</h4>
                <p className="text-[var(--text-faint)] text-xs flex items-center gap-1">
                  <MapPin size={10} /> Active in {cities}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section id="testimonials" className="relative z-10 max-w-6xl mx-auto px-6 py-20 border-t border-[var(--border)]">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold text-[var(--text)] mb-3">Trusted by growing businesses</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 mb-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-7">
              <div className="flex gap-0.5 mb-4">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} size={13} className="fill-current" style={{ color: 'var(--gold)' }} />
                ))}
              </div>
              <p className="text-[var(--text-soft)] text-sm leading-relaxed mb-5 italic">&ldquo;{t.quote}&rdquo;</p>
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">{t.name}</div>
                <div className="text-xs text-[var(--text-muted)]">{t.business} · {t.city}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center border-t border-[var(--border)]">
        <h2 className="font-display text-4xl md:text-5xl font-bold text-[var(--text)] mb-4">Start growing your business today</h2>
        <p className="text-[var(--text-muted)] text-sm mb-8">One photo and one sentence is all you need to start.</p>
        <button onClick={() => router.push('/auth')}
          className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-white text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/25 [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]">
          <Zap size={14} /> Get Started Free
        </button>
        <div className="flex flex-wrap justify-center gap-6 text-xs text-[var(--text-faint)] mt-8">
          <span className="flex items-center gap-2"><Shield size={12} className="text-[var(--accent-soft)]" />No payment required</span>
          <span className="flex items-center gap-2"><Clock size={12} className="text-[var(--accent-soft)]" />Campaigns ready in minutes</span>
          <span className="flex items-center gap-2"><Languages size={12} className="text-[var(--accent-soft)]" />Multilingual speech input</span>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-[var(--border)] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/25 flex items-center justify-center">
              <Store size={11} className="text-[var(--accent-soft)]" />
            </div>
            <span className="text-sm text-[var(--text)] uppercase" style={{ letterSpacing: '0.15em' }}>
              Grow<span className="text-[var(--accent-soft)]">Mitra</span>
            </span>
          </div>
          <p className="text-xs text-[var(--text-faint)]">© 2026 GrowMitra · Built for Indian Retailers & Creators</p>
          <div className="flex gap-6 text-xs text-[var(--text-faint)]">
            <a href="mailto:hello@growmitra.app" className="hover:text-[var(--text-muted)] transition-colors">Contact</a>
            <span>Meta Open AI Hackathon Edition</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
