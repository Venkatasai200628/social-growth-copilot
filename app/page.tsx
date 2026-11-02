'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap, Star, MessageCircle, TrendingUp, CheckCircle, ArrowRight,
  Sparkles, Shield, Clock, Film, ChevronRight, Play, Mic, Languages,
  Calendar, Camera, Brain, Wallet, Store, Gem, UtensilsCrossed, Shirt, Cake,
  Users, Image as ImageIcon, Video, MapPin,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button, Card } from './components/ui';

/* ── Festival urgency banner ────────────────────────────────────── */
const DIWALI_DAYS = 6; // Nov 8 - Nov 2 = 6 days

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
      <span>🪔 <strong>Diwali is in {DIWALI_DAYS} days</strong> — launch your Diwali campaign now</span>
      <button onClick={() => router.push(user ? '/onboard' : '/auth')}
        className="flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full transition-all"
        style={{ background: 'color-mix(in srgb, var(--gold) 25%, transparent)', color: 'var(--gold)', border: '1px solid color-mix(in srgb, var(--gold) 40%, transparent)' }}>
        Start <ArrowRight size={10} />
      </button>
      <button onClick={dismiss} className="ml-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-lg leading-none absolute right-4">×</button>
    </div>
  );
}

/* ── Phone mockup / demo card ───────────────────────────────────── */
function PhoneMockup() {
  const [dotCount, setDotCount] = useState(1);
  useEffect(() => {
    const iv = setInterval(() => setDotCount((d) => (d % 3) + 1), 500);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="relative animate-slide-right">
      {/* Phone frame */}
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
              Generating your Diwali campaign{'.' .repeat(dotCount)}
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
      {/* Floating badges */}
      <div className="absolute -top-3 -right-4 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-3 py-2 text-xs shadow-xl flex items-center gap-1.5">
        <span className="text-[var(--success)]">✓</span> Caption ready
      </div>
      <div className="absolute bottom-8 -left-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-3 py-2 text-xs shadow-xl flex items-center gap-1.5">
        <Mic size={11} className="text-[var(--accent-soft)]" /> Voice input
      </div>
      <div className="absolute -top-4 -left-4 hidden sm:flex items-center gap-1.5 bg-[var(--card)] border border-[#25d366]/30 text-[#25d366] rounded-2xl px-3 py-1.5 text-xs shadow-xl animate-float" style={{ animationDelay: '0.6s' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-[#25d366]" /> WhatsApp Flow
      </div>
      <div className="absolute -bottom-3 -right-2 hidden sm:flex items-center gap-1.5 bg-[var(--card)] border border-[#e1306c]/30 text-[#e1306c] rounded-2xl px-3 py-1.5 text-xs shadow-xl animate-float" style={{ animationDelay: '1.2s' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-[#e1306c]" /> Instagram Ready
      </div>
    </div>
  );
}

/* ── Step connector ─────────────────────────────────────────────── */
function StepConnector() {
  return (
    <div className="hidden md:block absolute top-8 left-0 right-0 h-px z-0"
      style={{ background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 30%, transparent), color-mix(in srgb, var(--accent) 30%, transparent), transparent)' }} />
  );
}

const PERSONAS = [
  { icon: Gem, color: 'var(--gold)', title: 'Jewellery shops', line: 'Akshaya Tritiya and Diwali campaigns with gold-on-maroon posters, ready in a minute.' },
  { icon: UtensilsCrossed, color: 'var(--neon)', title: 'Cloud kitchens', line: 'Weekend combo posters, WhatsApp offer messages and reply templates for common customer questions.' },
  { icon: Shirt, color: 'var(--accent-soft)', title: 'Boutiques & tailors', line: 'Bridal edit look-books, Ugadi and Rakhi collections, captions in any language.' },
  { icon: Cake, color: 'var(--success)', title: 'Home bakers', line: 'Christmas cake pre-orders, Pongal sweet hampers — posters with your own photo in them.' },
];

const HUMAN_EXPERT_CARDS = [
  { icon: Camera, title: 'Photo Editor', cities: 'Hyderabad, Mumbai, Chennai' },
  { icon: ImageIcon, title: 'Graphic Designer', cities: 'Bengaluru, Delhi, Pune' },
  { icon: Video, title: 'Video Editor', cities: 'Mumbai, Hyderabad, Kolkata' },
  { icon: Users, title: 'Local Influencer', cities: 'All major Indian cities' },
];

const TESTIMONIALS = [
  {
    name: 'Priya Reddy',
    business: 'Cloud Kitchen',
    city: 'Hyderabad',
    quote: 'Used to spend hours on Instagram. Now it\'s 10 minutes and my posts look like they\'re from an agency.',
  },
  {
    name: 'Mohammed Irfan',
    business: 'Jewellery Shop',
    city: 'Chennai',
    quote: 'The Akshaya Tritiya campaign GrowMitra made got us 3x our usual Diwali reach.',
  },
  {
    name: 'Sunita Sharma',
    business: 'Home Baker',
    city: 'Delhi',
    quote: 'Voice input in Hindi and it writes in English — exactly what I needed.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[800px] h-[800px] bg-[var(--accent)]/10 top-[-300px] right-[-200px]" />
      <div className="orb w-[500px] h-[500px] bg-[var(--neon)]/6 bottom-[200px] left-[-150px]" />
      <div className="orb w-[400px] h-[400px] bg-pink-600/5 top-[400px] right-[100px]" />

      {/* Festival Banner */}
      <FestivalBanner user={user} />

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div className="animate-slide-left">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full text-xs border"
              style={{ background: 'color-mix(in srgb, var(--success) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--success) 25%, transparent)', color: 'var(--success)' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping-small absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]" />
              </span>
              Live in India — 10,000+ business owners and growing
            </div>

            <div className="inline-flex items-center gap-2 bg-[var(--accent)]/8 border border-[var(--accent)]/20 rounded-full px-5 py-2 text-xs text-[var(--accent-soft)] mb-6 tracking-widest uppercase">
              <Sparkles size={11} /> Your AI marketing mitra
            </div>

            <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
              <span className="text-[var(--text)]">One photo.</span>{' '}
              <span className="text-[var(--accent-soft)]">One line.</span>
              <br />
              <span className="text-[var(--text-muted)]">A full campaign — in minutes.</span>
            </h1>

            <p className="text-[var(--text-muted)] text-lg max-w-xl leading-relaxed mb-3">
              GrowMitra combines <strong className="text-[var(--text-soft)]">AI + human experts</strong> to turn your product photo into complete campaigns — with WhatsApp flow, <strong className="text-[var(--text-soft)]">multilingual voice input</strong>, posters, captions and hashtags.
            </p>
            <p className="text-[var(--text-faint)] text-sm max-w-lg mb-8">
              Built for jewellery shops, boutiques, cloud kitchens and home bakers across India.
              No agency. No design skills needed.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <button onClick={() => router.push(user ? '/onboard' : '/auth')}
                className="flex items-center gap-2 px-8 py-4 rounded-full text-white text-sm tracking-wide hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-lg shadow-[var(--accent)]/25"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-soft))' }}>
                <Zap size={14} /> Start Growing
              </button>
              <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-8 py-4 rounded-full text-[var(--text-muted)] text-sm border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-all">
                <Play size={13} /> See how it works <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Right: phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="relative z-10 border-y border-[var(--border)] bg-[var(--card)]/40">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { big: '₹20–50K', label: 'saved per month vs agencies', sub: 'typical range' },
            { big: '< 60s', label: 'photo to campaign', sub: 'yes, really' },
            { big: '18+', label: 'festivals covered', sub: 'and growing' },
            { big: '10,000+', label: 'Indian business owners', sub: 'and growing' },
          ].map(({ big, label, sub }) => (
            <div key={label}>
              <div className="font-display text-3xl md:text-4xl font-bold text-[var(--text)] mb-1">{big}</div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">{label}</div>
              <div className="text-[10px] text-[var(--text-faint)] mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── VOICE INPUT ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        <h2 className="font-display text-4xl font-bold text-[var(--text)] mb-3">Just say it out loud</h2>
        <p className="text-[var(--text-muted)] text-sm mb-10 max-w-xl mx-auto">
          Type it or speak it — the mic understands any Indian language. Every caption, poster line and customer reply comes back in clear English.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-faint)]"><Mic size={12} /> Voice brief supported — press the mic and just talk</div>
      </section>

      {/* ── PERSONAS ── */}
      <section className="relative z-10 border-y border-[var(--border)] bg-[var(--card)]/40">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-[var(--text)] mb-3">Built for shops like yours</h2>
            <p className="text-[var(--text-muted)] text-sm">Not for agencies. For the owner behind the counter.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PERSONAS.map((p) => (
              <div key={p.title} className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 hover:border-[var(--accent)]/40 hover:-translate-y-1 transition-all duration-300">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: `color-mix(in srgb, ${p.color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${p.color} 25%, transparent)` }}>
                  <p.icon size={18} style={{ color: p.color }} />
                </div>
                <h3 className="text-[var(--text)] font-medium mb-2">{p.title}</h3>
                <p className="text-[var(--text-muted)] text-xs leading-relaxed">{p.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl font-bold text-[var(--text)] mb-3">Everything you need to grow</h2>
          <p className="text-[var(--text-muted)] text-sm">Seven tools. One mitra. Zero design skills needed.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Camera, color: 'var(--accent-soft)', href: '/post-studio', label: 'Post Studio', desc: 'Your product photo becomes a festival poster — 1:1, 4:5 and 9:16 — with captions and a WhatsApp offer message.' },
            { icon: Zap, color: 'var(--neon)', href: '/campaign', label: 'Campaign Generator', desc: 'Speak or type your brief → a multi-day plan with captions, hashtags, posting times and a budget split.' },
            { icon: Star, color: 'var(--gold)', href: '/scorer', label: 'Caption Scorer (A/B)', desc: 'Score two captions head-to-head, see which hook wins and why — tuned for Indian Instagram habits.' },
            { icon: MessageCircle, color: '#25d366', href: '/reply-agent', label: 'Reply Agent', desc: 'Paste any customer DM or comment — get brand-consistent English replies, ready to send.' },
            { icon: TrendingUp, color: 'var(--success)', href: '/my-campaigns', label: 'Growth Dashboard', desc: 'Log your real daily numbers, watch your trends build, and get coached on what to change tomorrow.' },
            { icon: Film, color: 'var(--accent-soft)', href: '/video-studio', label: 'Video Studio', desc: 'Scene-by-scene reels scripts — hook, shots, voiceover, b-roll and text overlays — ready to film.' },
            { icon: Brain, color: 'var(--gold)', href: '/my-campaigns', label: 'AI Coach', desc: 'Reads your real logged numbers and tells you exactly what to do next. Can read it aloud too.' },
            { icon: Wallet, color: '#25d366', href: '/post-studio', label: 'WhatsApp Composer', desc: 'One tap to send an offer message with your poster to any customer, or copy it for your status.' },
            { icon: Calendar, color: 'var(--neon)', href: '/festivals', label: 'Festival Calendar', desc: 'Browse upcoming Indian festivals with dates and poster moods — use one only when YOU want it.' },
          ].map(({ icon: Icon, color, href, label, desc }) => (
            <div key={label} onClick={() => router.push(user ? href : '/auth')}
              className="group bg-[var(--card)] border border-[var(--border)] rounded-3xl p-7 cursor-pointer hover:border-[var(--accent)]/40 transition-all hover:-translate-y-1 duration-300">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <h3 className="text-base text-[var(--text)] mb-2 group-hover:text-[var(--accent-soft)] transition-colors">{label}</h3>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">{desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-all" style={{ color }}>
                Open <ArrowRight size={10} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HUMAN EXPERT LAYER ── */}
      <section id="experts" className="relative z-10 border-y border-[var(--border)] bg-[var(--card)]/40">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'color-mix(in srgb, var(--gold) 15%, transparent)', color: 'var(--gold)', border: '1px solid color-mix(in srgb, var(--gold) 30%, transparent)' }}>
              Coming Soon
            </div>
            <h2 className="font-display text-4xl font-bold text-[var(--text)] mb-3">When AI needs a helping hand, real experts step in</h2>
            <p className="text-[var(--text-muted)] text-sm max-w-2xl mx-auto">
              GrowMitra connects you with vetted photo editors, graphic designers, video editors and local influencers — matched by your city, niche and budget.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HUMAN_EXPERT_CARDS.map(({ icon: Icon, title, cities }) => (
              <div key={title} className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 relative">
                <span className="absolute top-4 right-4 text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: 'color-mix(in srgb, var(--gold) 15%, transparent)', color: 'var(--gold)', border: '1px solid color-mix(in srgb, var(--gold) 25%, transparent)' }}>
                  Coming soon
                </span>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'color-mix(in srgb, var(--gold) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--gold) 25%, transparent)' }}>
                  <Icon size={18} style={{ color: 'var(--gold)' }} />
                </div>
                <h3 className="text-[var(--text)] font-medium mb-2">{title}</h3>
                <p className="text-[var(--text-faint)] text-xs flex items-center gap-1">
                  <MapPin size={10} /> Available in {cities}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="font-display text-4xl font-bold text-[var(--text)] mb-3">How it works</h2>
          <p className="text-[var(--text-muted)] text-sm">Four steps. Ten minutes. Zero jargon.</p>
        </div>
        <div className="relative grid md:grid-cols-4 gap-6">
          <StepConnector />
          {[
            { step: '01', icon: Mic, title: 'Describe your business', desc: 'Tap the mic or type one line — what you sell, your city, your budget. Voice input understands any language.' },
            { step: '02', icon: Camera, title: 'Add your product photo', desc: 'A plain phone photo is enough — GrowMitra frames it into a poster with your offer and festival mood.' },
            { step: '03', icon: Sparkles, title: 'Get the full campaign', desc: 'Calendar, captions, hashtags, posting times, ad copy and a budget split — ready to post.' },
            { step: '04', icon: TrendingUp, title: 'Post, log, improve', desc: 'Share on WhatsApp or Instagram, log your real numbers daily, and let the AI coach sharpen tomorrow.' },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="text-center relative z-10">
              <div className="font-display text-5xl font-bold text-[var(--text)]/10 mb-3">{step}</div>
              <div className="w-11 h-11 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] flex items-center justify-center mx-auto mb-4">
                <Icon size={17} className="text-[var(--accent-soft)]" />
              </div>
              <h3 className="text-[var(--text)] text-sm font-medium mb-2">{title}</h3>
              <p className="text-[var(--text-muted)] text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHATSAPP FLOW ── */}
      <section className="relative z-10 border-y border-[var(--border)] bg-[var(--card)]/40">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'color-mix(in srgb, var(--gold) 15%, transparent)', color: 'var(--gold)', border: '1px solid color-mix(in srgb, var(--gold) 30%, transparent)' }}>
              Coming Soon
            </div>
            <h2 className="font-display text-4xl font-bold text-[var(--text)] mb-3">Your whole campaign, over WhatsApp</h2>
            <p className="text-[var(--text-muted)] text-sm max-w-xl mx-auto">
              Send a product photo. Describe your offer in any language. Get captions, hashtags and a poster — right in your chat.
            </p>
          </div>
          {/* Chat bubbles */}
          <div className="max-w-sm mx-auto space-y-3 bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5"
            style={{ background: 'linear-gradient(180deg, color-mix(in srgb, #25d366 4%, var(--card)), var(--card))' }}>
            {/* Right bubble (user) */}
            <div className="flex justify-end">
              <div className="max-w-[75%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white"
                style={{ background: '#25d366' }}>
                Diwali sale pe ek post chahiye, jewellery hai, budget 5000 hai
                <div className="text-[9px] text-white/70 mt-1 text-right">10:32</div>
              </div>
            </div>
            {/* Left bubble (GrowMitra) */}
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm bg-[var(--card)] border border-[var(--border)]">
                <div className="text-xs font-semibold text-[var(--accent-soft)] mb-1">GrowMitra</div>
                <p className="text-[var(--text-soft)] text-xs leading-relaxed">
                  🪔 Great! I have created your Diwali campaign:<br />
                  <span className="text-[var(--text-muted)]">[Caption] [Hashtags] [Poster coming...]</span>
                </p>
                <div className="text-[9px] text-[var(--text-faint)] mt-2">10:32 ✓✓</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section id="testimonials" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold text-[var(--text)] mb-3">What shop owners say</h2>
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
        <p className="text-center text-xs text-[var(--text-faint)]">Results vary. Testimonials are representative examples.</p>
      </section>

      {/* ── WHAT YOU GET ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24 text-center">
        <Card className="p-10">
          <h2 className="font-display text-4xl font-bold text-[var(--text)] mb-3">Everything you need, one mitra</h2>
          <p className="text-[var(--text-muted)] text-sm max-w-xl mx-auto mb-8">
            Every tool, every platform, unlimited AI generations — built for small Indian businesses.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            {[
              { icon: Sparkles, label: 'Unlimited AI posts, posters & campaigns' },
              { icon: Shield, label: 'Voice input — speak your brief in any language' },
              { icon: Clock, label: 'Campaign live in under 10 minutes' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-start gap-3 rounded-2xl bg-[var(--bg-alt)] border border-[var(--border)] p-4">
                <Icon size={15} className="text-[var(--accent-soft)] mt-0.5 flex-shrink-0" />
                <span className="text-xs text-[var(--text-soft)] leading-relaxed">{label}</span>
              </div>
            ))}
          </div>
          <Button onClick={() => router.push(user ? '/onboard' : '/auth')} size="lg" className="mt-8">
            <Zap size={15} /> Start Your First Campaign
          </Button>
        </Card>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="font-display text-5xl font-bold text-[var(--text)] mb-4">Your mitra is waiting</h2>
        <p className="text-[var(--text-muted)] text-sm mb-8">One photo and one line is all it takes.</p>
        <button onClick={() => router.push(user ? '/onboard' : '/auth')}
          className="inline-flex items-center gap-2 px-10 py-4 rounded-full text-white text-sm hover:opacity-90 transition-all shadow-lg shadow-[var(--accent)]/25"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-soft))' }}>
          <Zap size={14} /> Start Your Campaign
        </button>
        <div className="flex flex-wrap justify-center gap-6 text-xs text-[var(--text-faint)] mt-10">
          <span className="flex items-center gap-2"><Shield size={12} className="text-[var(--accent-soft)]" />No payment, no card</span>
          <span className="flex items-center gap-2"><Clock size={12} className="text-[var(--accent-soft)]" />Campaign live in minutes</span>
          <span className="flex items-center gap-2"><Languages size={12} className="text-[var(--accent-soft)]" />Voice input in any language</span>
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
          <p className="text-xs text-[var(--text-faint)]">© 2026 GrowMitra · Your AI marketing mitra</p>
          <div className="flex gap-6 text-xs text-[var(--text-faint)]">
            <a href="mailto:hello@growmitra.app" className="hover:text-[var(--text-muted)] transition-colors">Contact</a>
            <span>Built with Llama-class AI on Groq</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
