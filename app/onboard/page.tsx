'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, ChevronDown, Zap, Gauge, Flame, Lock } from 'lucide-react';
import { CATEGORIES } from '@/lib/types';
import AuthGuard from '@/app/components/AuthGuard';

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

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    businessName: '',
    businessCategory: '',
    productDescription: '',
    targetAudience: '',
    goal: '',
    budget: '',
    duration: '14',
    websiteUrl: '',
    videoUrl: '',
    contactEmail: '',
    promotionEfficiency: 'balanced' as 'conservative' | 'balanced' | 'aggressive',
    platforms: ['Instagram', 'WhatsApp', 'Facebook'],
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
    const payload = {
      ...form,
      budget: Number(form.budget) || 0,
      duration: Number(form.duration) || 14,
    };
    sessionStorage.setItem('gm_pending_campaign', JSON.stringify(payload));
    router.push('/checkout');
  };

  const F = (label: string, key: keyof typeof form, placeholder: string, type = 'text') => (
    <div>
      <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={form[key] as string}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full bg-[var(--input-bg)] border rounded-xl px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none text-sm transition-colors"
        style={{ borderColor: errors[key] ? 'var(--danger)' : 'var(--input-border)' }}
      />
      {errors[key] && <p className="text-[var(--danger)] text-xs mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[var(--accent)]/12 top-[-150px] right-[-100px]" />
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-14">

        {/* Back */}
        <button onClick={() => router.push('/')} className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] text-sm transition-colors mb-8">
          <ArrowLeft size={14} /> Back to Home
        </button>

        {/* Step header */}
        <div className="flex items-center gap-3 mb-8 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)]">
            <Zap size={16} className="text-[var(--accent-soft)]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-[var(--text)]">New campaign setup</div>
            <div className="text-xs text-[var(--text-muted)]">AI strategy, content calendar &amp; daily tracking</div>
          </div>
          <div className="text-xs font-bold px-3 py-1 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent-soft)]">
            Step {step} of 3
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[var(--border)] rounded-full mb-8 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(step / 3) * 100}%`, background: 'var(--accent)' }} />
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8">

          {/* Step 1 — Business Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-3xl font-bold text-[var(--text)] mb-6">
                Tell us about your business
              </h2>
              {F('Business / Brand Name *', 'businessName', 'e.g. Priya Gold House, TechLaunch, Biryani by Spice...')}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Category *</label>
                <div className="relative">
                  <select value={form.businessCategory}
                    onChange={(e) => setForm({ ...form, businessCategory: e.target.value })}
                    className="w-full bg-[var(--input-bg)] border rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none text-sm appearance-none"
                    style={{ borderColor: errors.businessCategory ? 'var(--danger)' : 'var(--input-border)' }}>
                    <option value="" className="bg-[var(--card)]">Select category...</option>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value} className="bg-[var(--card)]">{c.emoji} {c.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
                </div>
                {errors.businessCategory && <p className="text-[var(--danger)] text-xs mt-1">{errors.businessCategory}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Describe your product / service *</label>
                <textarea rows={3} placeholder="What exactly are you selling? What makes it unique? Any offers or USPs?"
                  value={form.productDescription}
                  onChange={(e) => setForm({ ...form, productDescription: e.target.value })}
                  className="w-full bg-[var(--input-bg)] border rounded-xl px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none text-sm resize-none"
                  style={{ borderColor: errors.productDescription ? 'var(--danger)' : 'var(--input-border)' }} />
                {errors.productDescription && <p className="text-[var(--danger)] text-xs mt-1">{errors.productDescription}</p>}
              </div>
              {F('Contact Email *', 'contactEmail', 'you@yourbusiness.com', 'email')}
              {F('Website URL', 'websiteUrl', 'https://yourbusiness.com (optional)')}
              {F('Video / Content URL', 'videoUrl', 'YouTube link, Drive link, etc. (optional)')}
            </div>
          )}

          {/* Step 2 — Campaign Details */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-display text-3xl font-bold text-[var(--text)] mb-6">
                Campaign details
              </h2>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Target Audience *</label>
                <textarea rows={2} placeholder="Who are your ideal customers? Age, location, interests, income level..."
                  value={form.targetAudience}
                  onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                  className="w-full bg-[var(--input-bg)] border rounded-xl px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none text-sm resize-none"
                  style={{ borderColor: errors.targetAudience ? 'var(--danger)' : 'var(--input-border)' }} />
                {errors.targetAudience && <p className="text-[var(--danger)] text-xs mt-1">{errors.targetAudience}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Primary Goal *</label>
                <div className="relative">
                  <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}
                    className="w-full bg-[var(--input-bg)] border rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none text-sm appearance-none"
                    style={{ borderColor: errors.goal ? 'var(--danger)' : 'var(--input-border)' }}>
                    <option value="" className="bg-[var(--card)]">Select goal...</option>
                    {goals.map((g) => <option key={g} value={g} className="bg-[var(--card)]">{g}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
                </div>
                {errors.goal && <p className="text-[var(--danger)] text-xs mt-1">{errors.goal}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Total budget (₹)</label>
                  <input
                    type="number"
                    placeholder="5000 (0 = organic only)"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className="w-full bg-[var(--input-bg)] border rounded-xl px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-faint)] focus:outline-none text-sm transition-colors"
                    style={{ borderColor: 'var(--input-border)' }}
                  />
                  <p className="text-[var(--text-faint)] text-xs mt-1.5">Only used for budget splits — never shown as a result promise.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Duration</label>
                  <div className="relative">
                    <select value={form.duration}
                      onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      className="w-full bg-[var(--input-bg)] border rounded-xl px-4 py-3 text-[var(--text)] focus:outline-none text-sm appearance-none"
                      style={{ borderColor: 'var(--input-border)' }}>
                      {['7', '10', '14'].map((d) => <option key={d} value={d}>{d} days</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">Platforms to promote on</label>
                <div className="flex flex-wrap gap-2">
                  {['Instagram', 'Facebook', 'Twitter/X', 'LinkedIn', 'YouTube', 'WhatsApp'].map((p) => {
                    const available = true;
                    const selected = form.platforms.includes(p);
                    return (
                      <button key={p} disabled={!available}
                        onClick={() => setForm((prev) => ({
                          ...prev,
                          platforms: selected ? prev.platforms.filter((x) => x !== p) : [...prev.platforms, p],
                        }))}
                        className={`inline-flex items-center text-xs px-3 py-2 rounded-xl border font-medium transition-all ${
                          !available ? 'opacity-50 cursor-not-allowed bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text-faint)]'
                          : selected ? 'border-[var(--accent)]/40 text-[var(--accent-soft)] bg-[var(--accent)]/20'
                          : 'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-muted)] hover:border-[var(--accent)]/30'
                        }`}>
                        {p}{!available && <Lock size={10} className="ml-1" />}
                      </button>
                    );
                  })}
                </div>
                
              </div>
            </div>
          )}

          {/* Step 3 — Promotion Intensity */}
          {step === 3 && (
            <div>
              <h2 className="font-display text-3xl font-bold text-[var(--text)] mb-2">
                How aggressive should we promote?
              </h2>
              <p className="text-[var(--text-muted)] text-sm mb-8">This tells our AI how to allocate your budget and build your strategy.</p>
              <div className="space-y-4">
                {efficiencyOptions.map(({ id, icon: Icon, label, desc, color }) => {
                  const selected = form.promotionEfficiency === id;
                  return (
                    <button key={id} onClick={() => setForm({ ...form, promotionEfficiency: id as typeof form.promotionEfficiency })}
                      className="w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4"
                      style={{
                        background: selected ? `${color}10` : 'var(--bg-alt)',
                        borderColor: selected ? `${color}50` : 'var(--border)',
                        boxShadow: selected ? `0 0 20px ${color}15` : 'none',
                      }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                        <Icon size={18} style={{ color }} />
                      </div>
                      <div className="flex-1">
                        <div className="font-display font-bold text-base mb-1 text-[var(--text)]" style={{ color: selected ? color : undefined }}>
                          {label}
                        </div>
                        <div className="text-[var(--text-muted)] text-xs leading-relaxed">{desc}</div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1"
                        style={{ borderColor: selected ? color : 'var(--text-faint)' }}>
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
                className="flex-1 py-3.5 rounded-full font-medium text-sm border border-[var(--input-border)] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:text-[var(--text)] transition-all flex items-center justify-center gap-2">
                <ArrowLeft size={14} /> Back
              </button>
            )}
            {step < 3 ? (
              <button onClick={next}
                className="flex-1 py-3.5 rounded-full font-bold text-sm text-[#08080d] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                style={{ background: 'var(--accent)' }}>
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button onClick={proceed}
                className="flex-1 py-3.5 rounded-full font-bold text-sm text-[#08080d] transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                style={{ background: 'var(--accent)' }}>
                Continue to Activation <ArrowRight size={14} />
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
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[var(--text-muted)]">Loading...</div>}>
        <OnboardContent />
      </Suspense>
    </AuthGuard>
  );
}
