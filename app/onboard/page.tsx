'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, ArrowLeft, ChevronDown, Zap, Gauge, Flame } from 'lucide-react';
import { PLANS } from '@/lib/plans';
import AuthGuard from '@/app/components/AuthGuard';

const categories = [
  'Food & Beverage', 'Fashion & Clothing', 'Tech Startup', 'Events & Hackathons',
  'Real Estate', 'Education & Courses', 'Healthcare & Wellness', 'Gold & Jewellery',
  'Grocery & FMCG', 'Beauty & Makeup', 'B2B Services', 'Local Business',
  'Fitness & Gym', 'Travel & Tourism', 'Entertainment', 'Other',
];

const goals = [
  'Brand Awareness', 'Drive Sales / Conversions', 'Generate Leads',
  'Grow Followers', 'Promote an Event', 'Launch New Product', 'Re-engagement Campaign',
];

const efficiencyOptions = [
  {
    id: 'conservative',
    icon: Gauge,
    label: 'Conservative',
    desc: 'Steady, organic growth. Lower spend per day. Safe and sustainable.',
    color: '#22d3ee',
  },
  {
    id: 'balanced',
    icon: Zap,
    label: 'Balanced',
    desc: 'Mix of organic + paid boosts. Best ROI for most businesses.',
    color: '#7c3aed',
  },
  {
    id: 'aggressive',
    icon: Flame,
    label: 'Aggressive',
    desc: 'Maximum reach. Heavy paid promotion. Fast results, higher spend.',
    color: '#f59e0b',
  },
];

function OnboardContent() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = params.get('plan') || 'growth';
  const plan = PLANS.find((p) => p.id === planId) || PLANS[1];

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    businessName: '',
    businessCategory: '',
    productDescription: '',
    targetAudience: '',
    goal: '',
    websiteUrl: '',
    videoUrl: '',
    contactEmail: '',
    promotionEfficiency: 'balanced' as 'conservative' | 'balanced' | 'aggressive',
    platforms: plan.platforms,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!form.businessName.trim()) e.businessName = 'Required';
      if (!form.businessCategory) e.businessCategory = 'Required';
      if (!form.productDescription.trim()) e.productDescription = 'Required';
      if (!form.contactEmail.trim() || !form.contactEmail.includes('@')) e.contactEmail = 'Valid email required';
    }
    if (s === 2) {
      if (!form.targetAudience.trim()) e.targetAudience = 'Required';
      if (!form.goal) e.goal = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate(step)) setStep((s) => s + 1); };
  const back = () => setStep((s) => s - 1);

  const proceed = () => {
    if (!validate(step)) return;
    const encoded = encodeURIComponent(JSON.stringify({ ...form, planId, price: plan.price, duration: plan.duration, planName: plan.name }));
    router.push(`/checkout?data=${encoded}`);
  };

  const F = (label: string, key: keyof typeof form, placeholder: string, type = 'text') => (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key] as string}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full bg-white/[0.03] border rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none text-sm transition-colors"
        style={{ borderColor: errors[key] ? '#ef4444' : 'rgba(255,255,255,0.08)' }}
      />
      {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-violet-600/12 top-[-150px] right-[-100px]" />
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-14">

        {/* Back */}
        <button onClick={() => router.push('/')} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors mb-8">
          <ArrowLeft size={14} /> Back to Plans
        </button>

        {/* Plan badge */}
        <div className="flex items-center gap-3 mb-8 bg-[#16161f] border border-white/[0.06] rounded-2xl p-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: plan.accentColor, border: `1px solid ${plan.color}30` }}>
            <Zap size={16} style={{ color: plan.color }} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white">{plan.name} Plan — ₹{plan.price.toLocaleString('en-IN')}</div>
            <div className="text-xs text-slate-500">{plan.duration}-day campaign · {plan.platforms.length} platforms</div>
          </div>
          <div className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: plan.accentColor, color: plan.color }}>
            Step {step} of 3
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/[0.06] rounded-full mb-8 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%`, background: plan.color }} />
        </div>

        <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-8">

          {/* Step 1 — Business Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-2xl font-light text-white mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Tell us about your business
              </h2>
              {F('Business / Brand Name *', 'businessName', 'e.g. Priya Gold House, TechLaunch, Biryani by Spice...')}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Category *</label>
                <div className="relative">
                  <select value={form.businessCategory}
                    onChange={(e) => setForm({ ...form, businessCategory: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none text-sm appearance-none"
                    style={{ borderColor: errors.businessCategory ? '#ef4444' : undefined }}>
                    <option value="" className="bg-[#16161f]">Select category...</option>
                    {categories.map((c) => <option key={c} value={c} className="bg-[#16161f]">{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
                {errors.businessCategory && <p className="text-red-400 text-xs mt-1">{errors.businessCategory}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Describe your product / service *</label>
                <textarea rows={3} placeholder="What exactly are you selling? What makes it unique? Any offers or USPs?"
                  value={form.productDescription}
                  onChange={(e) => setForm({ ...form, productDescription: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none text-sm resize-none"
                  style={{ borderColor: errors.productDescription ? '#ef4444' : undefined }} />
                {errors.productDescription && <p className="text-red-400 text-xs mt-1">{errors.productDescription}</p>}
              </div>
              {F('Contact Email *', 'contactEmail', 'you@yourbusiness.com', 'email')}
              {F('Website URL', 'websiteUrl', 'https://yourbusiness.com (optional)')}
              {F('Video / Content URL', 'videoUrl', 'YouTube link, Drive link, etc. (optional)')}
            </div>
          )}

          {/* Step 2 — Campaign Details */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-2xl font-light text-white mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Campaign details
              </h2>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Target Audience *</label>
                <textarea rows={2} placeholder="Who are your ideal customers? Age, location, interests, income level..."
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none text-sm resize-none"
                  style={{ borderColor: errors.targetAudience ? '#ef4444' : undefined }} />
                {errors.targetAudience && <p className="text-red-400 text-xs mt-1">{errors.targetAudience}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Primary Goal *</label>
                <div className="relative">
                  <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none text-sm appearance-none"
                    style={{ borderColor: errors.goal ? '#ef4444' : undefined }}>
                    <option value="" className="bg-[#16161f]">Select goal...</option>
                    {goals.map((g) => <option key={g} value={g} className="bg-[#16161f]">{g}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
                {errors.goal && <p className="text-red-400 text-xs mt-1">{errors.goal}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Platforms to promote on</label>
                <div className="flex flex-wrap gap-2">
                  {['Instagram', 'Facebook', 'Twitter/X', 'LinkedIn', 'YouTube', 'WhatsApp'].map((p) => {
                    const available = plan.platforms.includes(p);
                    const selected = form.platforms.includes(p);
                    return (
                      <button key={p} disabled={!available}
                        onClick={() => setForm((prev) => ({
                          ...prev,
                          platforms: selected ? prev.platforms.filter((x) => x !== p) : [...prev.platforms, p],
                        }))}
                        className={`text-xs px-3 py-2 rounded-xl border font-medium transition-all ${
                          !available ? 'opacity-30 cursor-not-allowed bg-white/[0.02] border-white/[0.05] text-slate-600'
                          : selected ? 'border-violet-500/40 text-violet-300 bg-violet-600/20'
                          : 'bg-white/[0.03] border-white/[0.08] text-slate-500 hover:border-white/[0.15]'
                        }`}>
                        {p}{!available && ' 🔒'}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-600 mt-2">Locked platforms available in higher plans</p>
              </div>
            </div>
          )}

          {/* Step 3 — Promotion Intensity */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-light text-white mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                How aggressive should we promote?
              </h2>
              <p className="text-slate-500 text-sm mb-8">This tells our AI how to allocate your budget and build your strategy.</p>
              <div className="space-y-4">
                {efficiencyOptions.map(({ id, icon: Icon, label, desc, color }) => {
                  const selected = form.promotionEfficiency === id;
                  return (
                    <button key={id} onClick={() => setForm({ ...form, promotionEfficiency: id as typeof form.promotionEfficiency })}
                      className="w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4"
                      style={{
                        background: selected ? `${color}10` : 'rgba(255,255,255,0.02)',
                        borderColor: selected ? `${color}50` : 'rgba(255,255,255,0.06)',
                        boxShadow: selected ? `0 0 20px ${color}15` : 'none',
                      }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                        <Icon size={18} style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm mb-1" style={{ fontFamily: 'Cormorant Garamond, serif', color: selected ? color : undefined }}>
                          {label}
                        </div>
                        <div className="text-slate-400 text-xs leading-relaxed">{desc}</div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1"
                        style={{ borderColor: selected ? color : 'rgba(255,255,255,0.15)' }}>
                        {selected && <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={back}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm border border-white/[0.08] text-slate-400 hover:border-white/[0.15] transition-all flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> Back
              </button>
            )}
            {step < 3 ? (
              <button onClick={next}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2"
                style={{ background: plan.color, fontFamily: 'Cormorant Garamond, serif' }}>
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button onClick={proceed}
                className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-[#0a0a0f] transition-all flex items-center justify-center gap-2 hover:opacity-90"
                style={{ background: plan.color, fontFamily: 'Cormorant Garamond, serif' }}>
                Proceed to Payment <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function OnboardPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 font-light">Loading...</div>}>
        <OnboardContent />
      </Suspense>
    </AuthGuard>
  );
}
