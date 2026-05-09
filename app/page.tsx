'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Star, MessageCircle, TrendingUp, CheckCircle, ArrowRight,
  Sparkles, Shield, Clock, Users, Film, ChevronRight, Play } from 'lucide-react';
import { PLANS } from '@/lib/plans';
import { useAuth } from '@/lib/auth-context';

function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = target / 60;
      const timer = setInterval(() => {
        start += step;
        if (start >= target) { setVal(target); clearInterval(timer); }
        else setVal(Math.floor(start));
      }, 16);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

function FloatingPill({ label, color, style }: { label: string; color: string; style: React.CSSProperties }) {
  return (
    <div className="absolute hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-light border backdrop-blur-xl animate-float"
      style={{ background: `${color}12`, borderColor: `${color}25`, color, ...style }}>
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label}
    </div>
  );
}

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Gold Jewellery Store, Chennai', avatar: 'PS', rating: 5, plan: 'Growth', text: 'The campaign generator wrote better captions than I ever could. Sales went up 34% in the first two weeks. Worth every rupee.' },
  { name: 'Arjun Mehta', role: 'SaaS Founder, Bangalore', avatar: 'AM', rating: 5, plan: 'Pro', text: 'Post Studio is insane. I used to spend hours on content — now 10 minutes and my whole week is done.' },
  { name: 'Divya Krishnan', role: 'Makeup Artist, Hyderabad', avatar: 'DK', rating: 5, plan: 'Growth', text: 'My Instagram went from 2k to 11k followers in 45 days. The hashtag strategy and comment templates made a huge difference.' },
  { name: 'Rahul Nair', role: 'Restaurant Owner, Kochi', avatar: 'RN', rating: 5, plan: 'Starter', text: 'Even the Starter plan gave me a full 7-day campaign. Every caption was restaurant-specific and ready to post.' },
  { name: 'Sneha Patel', role: 'Fashion Brand, Mumbai', avatar: 'SP', rating: 5, plan: 'Pro', text: 'The video script generator alone is worth the Pro plan. Shot-by-shot directions, voiceover script, b-roll list — my editor loves me now.' },
  { name: 'Vikram Reddy', role: 'Ed-Tech Startup, Pune', avatar: 'VR', rating: 5, plan: 'Pro', text: 'Dashboard is excellent. Tracking projected vs actual reach day-by-day showed us exactly which days to boost.' },
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(p => (p + 1) % TESTIMONIALS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[800px] h-[800px] bg-violet-600/10 top-[-300px] right-[-200px]" />
      <div className="orb w-[500px] h-[500px] bg-cyan-600/6 bottom-[200px] left-[-150px]" />
      <div className="orb w-[400px] h-[400px] bg-pink-600/5 top-[400px] right-[100px]" />

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-20 pb-28 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-500/8 border border-violet-500/15 rounded-full px-5 py-2 text-xs text-violet-300 font-light mb-8 tracking-widest uppercase animate-fade-in">
          <Sparkles size={11} /> AI-Powered Social Media Promotion
        </div>

        <FloatingPill label="Instagram" color="#e1306c" style={{ top: '15%', left: '5%', animationDelay: '0s' }} />
        <FloatingPill label="YouTube" color="#ff0000" style={{ top: '30%', left: '2%', animationDelay: '0.5s' }} />
        <FloatingPill label="LinkedIn" color="#0077b5" style={{ top: '15%', right: '5%', animationDelay: '0.3s' }} />
        <FloatingPill label="Twitter / X" color="#1da1f2" style={{ top: '32%', right: '2%', animationDelay: '0.8s' }} />

        <h1 className="text-6xl md:text-8xl font-light mb-6 leading-none tracking-tight animate-slide-up" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          <span className="text-white">Promote Smarter.</span><br />
          <span style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 40%, #22d3ee 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Grow Faster.
          </span><br />
          <span className="text-white/60 text-5xl md:text-6xl">Do Less.</span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light mb-10">
          Pick a plan. Tell us about your business. Get a complete AI-generated promotion strategy, daily content, video scripts and a live growth dashboard.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <button onClick={() => router.push(user ? '/onboard?plan=growth' : '/auth')}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-light text-sm tracking-wide hover:opacity-85 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <Zap size={14} /> Start Growing — from ₹999
          </button>
          <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl text-slate-400 font-light text-sm border border-white/[0.08] hover:border-white/[0.15] hover:text-white transition-all">
            <Play size={13} /> See Plans <ChevronRight size={13} />
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-xs text-slate-600 font-light">
          {[
            { icon: Shield, text: 'Secure Payments' },
            { icon: Clock, text: 'Campaign live in minutes' },
            { icon: Users, text: '500+ businesses promoted' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2"><Icon size={12} className="text-violet-400" />{text}</div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 border-y border-white/[0.04] bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { target: 500, suffix: '+', label: 'Businesses Promoted' },
            { target: 6, suffix: '', label: 'Platforms Covered' },
            { target: 98, suffix: '%', label: 'Satisfaction Rate' },
            { target: 3, suffix: 'x', label: 'Avg. Reach Boost' },
          ].map(({ target, suffix, label }) => (
            <div key={label}>
              <div className="text-4xl md:text-5xl font-light text-white mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                <Counter target={target} suffix={suffix} />
              </div>
              <div className="text-xs text-slate-500 font-light uppercase tracking-widest">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-white mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Everything you need to grow</h2>
          <p className="text-slate-500 text-sm font-light">Six tools. One platform. Zero excuses.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Zap, color: '#7c3aed', href: '/campaign', label: 'Campaign Generator', desc: 'Product + budget + goal → complete multi-day campaign with captions, hashtags and posting schedule.' },
            { icon: Star, color: '#22d3ee', href: '/scorer', label: 'Virality Scorer', desc: 'Paste any caption and get a score out of 100, emotional hook analysis and an AI-improved version.' },
            { icon: MessageCircle, color: '#f59e0b', href: '/reply-agent', label: 'Auto-Reply Agent', desc: 'Paste any DM or comment. Get 3 conversion-focused reply options with intent and sentiment analysis.' },
            { icon: TrendingUp, color: '#10b981', href: '/my-campaigns', label: 'Growth Dashboard', desc: 'Day-by-day projected vs actual reach charts, ROI calculator, AI performance coaching.' },
            { icon: Film, color: '#f472b6', href: '/video-studio', label: 'Video Studio', desc: 'Scene-by-scene shot plan, voiceover script, b-roll list, editing tips — ready to film.' },
            { icon: Sparkles, color: '#a78bfa', href: '/post-studio', label: 'Post Studio', desc: 'AI-designed post image + caption + hashtags + comment strategy. Growth & Pro plans.' },
          ].map(({ icon: Icon, color, href, label, desc }) => (
            <div key={label} onClick={() => router.push(user ? href : '/auth')}
              className="group bg-[#16161f] border border-white/[0.05] rounded-3xl p-7 cursor-pointer hover:border-violet-500/20 transition-all hover:-translate-y-1 duration-300">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5" style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <h3 className="text-base font-light text-white mb-2 group-hover:text-violet-200 transition-colors" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{label}</h3>
              <p className="text-slate-500 text-xs font-light leading-relaxed">{desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-light opacity-0 group-hover:opacity-100 transition-all" style={{ color }}>
                Open <ArrowRight size={10} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PLATFORMS ── */}
      <section className="relative z-10 border-y border-white/[0.04] bg-white/[0.01] py-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs text-slate-600 font-light uppercase tracking-widest mb-6">Campaigns for every platform</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Instagram','Facebook','Twitter / X','LinkedIn','YouTube','WhatsApp'].map(p => (
              <span key={p} className="text-xs bg-white/[0.03] border border-white/[0.06] rounded-full px-4 py-2 text-slate-400 font-light">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-light text-white mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Choose your plan</h2>
          <p className="text-slate-500 text-sm font-light">One-time payment. Full campaign. Real results.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map(plan => {
            const isHovered = hoveredPlan === plan.id;
            return (
              <div key={plan.id}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                className="relative rounded-3xl overflow-hidden transition-all duration-300 cursor-pointer"
                style={{ transform: isHovered ? 'translateY(-8px)' : 'none', boxShadow: isHovered ? `0 24px 60px ${plan.color}20` : 'none' }}
                onClick={() => router.push(user ? `/onboard?plan=${plan.id}` : '/auth')}>
                {plan.badge && (
                  <div className="absolute top-5 right-5 z-20 text-xs font-light px-3 py-1 rounded-full" style={{ background: plan.color, color: '#08080d' }}>{plan.badge}</div>
                )}
                <div className="absolute inset-0 bg-[#16161f]" />
                <div className="absolute inset-0 border border-white/[0.05] rounded-3xl transition-colors" style={{ borderColor: isHovered ? `${plan.color}35` : undefined }} />
                <div className="relative z-10 p-8">
                  <div className="text-xs font-light uppercase tracking-widest mb-5" style={{ color: plan.color }}>{plan.name}</div>
                  <div className="mb-1">
                    <span className="text-5xl font-light text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>₹{plan.price.toLocaleString('en-IN')}</span>
                    <span className="text-slate-600 text-sm ml-2 font-light">one-time</span>
                  </div>
                  <p className="text-slate-500 text-xs font-light mb-6">{plan.highlight}</p>
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {plan.platforms.map(p => (
                      <span key={p} className="text-xs px-2.5 py-1 rounded-full border font-light" style={{ background: plan.accentColor, color: plan.color, borderColor: `${plan.color}20` }}>{p}</span>
                    ))}
                  </div>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5 text-xs text-slate-400 font-light">
                        <CheckCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color: plan.color }} />{f}
                      </li>
                    ))}
                  </ul>
                  <button className="w-full py-3.5 rounded-2xl font-light text-sm transition-all flex items-center justify-center gap-2"
                    style={{ background: isHovered ? plan.color : plan.accentColor, color: isHovered ? '#08080d' : plan.color, border: `1px solid ${plan.color}30` }}>
                    Get {plan.name} <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-light text-white mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Businesses that grew with us</h2>
          <div className="flex items-center justify-center gap-1 mb-1">
            {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
          </div>
          <p className="text-slate-500 text-xs font-light">Rated 4.9/5 by 500+ businesses</p>
        </div>
        <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 rounded-full -translate-y-32 translate-x-32" />
          <div className="relative z-10">
            <div className="flex items-center gap-1 mb-5">
              {[...Array(5)].map((_, i) => <Star key={i} size={13} className="text-amber-400 fill-amber-400" />)}
            </div>
            <p className="text-slate-200 text-lg font-light leading-relaxed mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              &ldquo;{TESTIMONIALS[activeTestimonial].text}&rdquo;
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center text-violet-300 text-xs font-light">
                  {TESTIMONIALS[activeTestimonial].avatar}
                </div>
                <div>
                  <div className="text-sm font-light text-white">{TESTIMONIALS[activeTestimonial].name}</div>
                  <div className="text-xs text-slate-500 font-light">{TESTIMONIALS[activeTestimonial].role}</div>
                </div>
              </div>
              <span className="text-xs font-light px-3 py-1 rounded-full" style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>
                {TESTIMONIALS[activeTestimonial].plan} Plan
              </span>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-2 mb-8">
          {TESTIMONIALS.map((_, i) => (
            <button key={i} onClick={() => setActiveTestimonial(i)}
              className="rounded-full transition-all duration-300"
              style={{ width: i === activeTestimonial ? 24 : 8, height: 8, background: i === activeTestimonial ? '#7c3aed' : 'rgba(255,255,255,0.08)' }} />
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {TESTIMONIALS.slice(0, 3).map((t, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 cursor-pointer hover:border-violet-500/15 transition-all"
              onClick={() => setActiveTestimonial(i)}>
              <div className="flex items-center gap-1 mb-3">{[...Array(t.rating)].map((_, j) => <Star key={j} size={10} className="text-amber-400 fill-amber-400" />)}</div>
              <p className="text-slate-400 text-xs font-light leading-relaxed mb-4 line-clamp-3">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-violet-600/15 flex items-center justify-center text-violet-300 text-[10px] font-light">{t.avatar}</div>
                <div>
                  <div className="text-xs font-light text-white">{t.name}</div>
                  <div className="text-[10px] text-slate-600 font-light">{t.plan} Plan</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative z-10 border-t border-white/[0.04] bg-white/[0.01]">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-light text-white mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>How it works</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: Star, title: 'Pick a Plan', desc: 'Choose Starter, Growth, or Pro based on your budget and goals' },
              { step: '02', icon: MessageCircle, title: 'Tell Us Everything', desc: 'Business name, category, target audience, platforms and promotion intensity' },
              { step: '03', icon: Shield, title: 'Pay Securely', desc: 'One-time secure payment. Your campaign is live immediately after.' },
              { step: '04', icon: TrendingUp, title: 'Campaign Goes Live', desc: 'AI generates your full strategy. Track growth on your live dashboard.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="text-5xl font-light text-white/5 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{step}</div>
                <div className="w-11 h-11 rounded-2xl bg-violet-500/8 border border-violet-500/15 flex items-center justify-center mx-auto mb-4">
                  <Icon size={17} className="text-violet-400" />
                </div>
                <h3 className="font-light text-white text-sm mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{title}</h3>
                <p className="text-slate-500 text-xs font-light leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
        <h2 className="text-5xl font-light text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Ready to grow?</h2>
        <p className="text-slate-500 text-sm font-light mb-8">Join 500+ businesses already growing with Social Growth Copilot.</p>
        <button onClick={() => router.push(user ? '/onboard?plan=growth' : '/auth')}
          className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-white font-light text-sm hover:opacity-85 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
          <Zap size={14} /> Start Your Campaign
        </button>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-white/[0.04] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-violet-600/15 border border-violet-500/25 flex items-center justify-center">
              <TrendingUp size={11} className="text-violet-400" />
            </div>
            <span className="text-sm font-light text-white tracking-widest uppercase" style={{ letterSpacing: '0.15em' }}>
              Social <span className="text-violet-400">Growth</span> Copilot
            </span>
          </div>
          <p className="text-xs text-slate-700 font-light">© 2025 Social Growth Copilot. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-slate-600 font-light">
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Contact</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
