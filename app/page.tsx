'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap, Star, MessageCircle, TrendingUp, CheckCircle, ArrowRight,
  Sparkles, Shield, Clock, Film, ChevronRight, Play, Mic, Languages,
  Calendar, Camera, Brain, Wallet, Store, Gem, UtensilsCrossed, Shirt, Cake,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button, Card } from './components/ui';

function FloatingPill({ label, color, style }: { label: string; color: string; style: React.CSSProperties }) {
  return (
    <div className="absolute hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border backdrop-blur-xl animate-float"
      style={{ background: `${color}12`, borderColor: `${color}25`, color, ...style }}>
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}

const PERSONAS = [
  { icon: Gem, color: 'var(--gold)', title: 'Jewellery shops', line: 'Akshaya Tritiya and Diwali campaigns with gold-on-maroon posters, ready in a minute.' },
  { icon: UtensilsCrossed, color: 'var(--neon)', title: 'Cloud kitchens', line: 'Weekend combo posters, WhatsApp offer messages and reply templates for "price kya hai".' },
  { icon: Shirt, color: 'var(--accent-soft)', title: 'Boutiques & tailors', line: 'Bridal edit look-books, Ugadi and Rakhi collections, captions in Telugu or Hindi.' },
  { icon: Cake, color: 'var(--success)', title: 'Home bakers', line: 'Christmas cake pre-orders, Pongal sweet hampers — posters with your own photo in them.' },
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  useEffect(() => { /* kept for future counters */ }, []);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[800px] h-[800px] bg-[var(--accent)]/10 top-[-300px] right-[-200px]" />
      <div className="orb w-[500px] h-[500px] bg-[var(--neon)]/6 bottom-[200px] left-[-150px]" />
      <div className="orb w-[400px] h-[400px] bg-pink-600/5 top-[400px] right-[100px]" />

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-[var(--accent)]/8 border border-[var(--accent)]/20 rounded-full px-5 py-2 text-xs text-[var(--accent-soft)] mb-8 tracking-widest uppercase animate-fade-in">
          <Sparkles size={11} /> Your AI marketing mitra — आपका मार्केटिंग मित्र
        </div>

        <FloatingPill label="Instagram" color="#e1306c" style={{ top: '15%', left: '5%', animationDelay: '0s' }} />
        <FloatingPill label="WhatsApp" color="#25d366" style={{ top: '30%', left: '2%', animationDelay: '0.5s' }} />
        <FloatingPill label="हिंदी" color="#f5b942" style={{ top: '15%', right: '5%', animationDelay: '0.3s' }} />
        <FloatingPill label="தமிழ் · తెలుగు" color="#22d3ee" style={{ top: '32%', right: '2%', animationDelay: '0.8s' }} />

        <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight animate-slide-up">
          <span className="text-[var(--text)]">One photo.</span>{' '}
          <span className="text-[var(--accent-soft)]">One line.</span>
          <br />
          <span className="text-[var(--text-muted)]">A full campaign — in minutes.</span>
        </h1>

        <p className="text-[var(--text-muted)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-4">
          GrowMitra turns your product photo and one line about your business into a complete campaign —
          posters, captions, hashtags, WhatsApp messages and a day-by-day plan — in clear English.
        </p>
        <p className="text-[var(--text-faint)] text-sm max-w-xl mx-auto mb-10">
          Built for jewellery shops, boutiques, cloud kitchens and home bakers across India.
          No agency. No design skills needed — just describe what you sell.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
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

      </section>

      {/* ── WHAT YOU GET (honest numbers) ── */}
      <section className="relative z-10 border-y border-[var(--border)] bg-[var(--card)]/40">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { big: '7', label: 'AI tools in one place' },
            { big: 'Any', label: 'Voice input language' },
            { big: '18', label: 'Festival poster moods' },
            { big: '<60s', label: 'Photo to full campaign' },
          ].map(({ big, label }) => (
            <div key={label}>
              <div className="font-display text-4xl md:text-5xl font-bold text-[var(--text)] mb-2">{big}</div>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest">{label}</div>
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
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
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

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="relative z-10 border-y border-[var(--border)] bg-[var(--card)]/40">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold text-[var(--text)] mb-3">How it works</h2>
            <p className="text-[var(--text-muted)] text-sm">Four steps. Ten minutes. Zero jargon.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: Mic, title: 'Describe your business', desc: 'Tap the mic or type one line — what you sell, your city, your budget. Voice input understands any language.' },
              { step: '02', icon: Camera, title: 'Add your product photo', desc: 'A plain phone photo is enough — GrowMitra frames it into a poster with your offer and festival mood.' },
              { step: '03', icon: Sparkles, title: 'Get the full campaign', desc: 'Calendar, captions, hashtags, posting times, ad copy and a budget split — ready to post.' },
              { step: '04', icon: TrendingUp, title: 'Post, log, improve', desc: 'Share on WhatsApp or Instagram, log your real numbers daily, and let the AI coach sharpen tomorrow.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="font-display text-5xl font-bold text-[var(--text)]/10 mb-3">{step}</div>
                <div className="w-11 h-11 rounded-2xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center mx-auto mb-4">
                  <Icon size={17} className="text-[var(--accent-soft)]" />
                </div>
                <h3 className="text-[var(--text)] text-sm font-medium mb-2">{title}</h3>
                <p className="text-[var(--text-muted)] text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
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
