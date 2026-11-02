'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Sparkles, ChevronDown, Zap, ImageIcon, TrendingUp,
  Hand, Building2, Target, Rocket, IndianRupee, Megaphone, PartyPopper,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { CATEGORIES } from '@/lib/types';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import AuthGuard from '../components/AuthGuard';

const goals = [
  { id: 'sales', icon: IndianRupee, color: 'var(--gold)', label: 'Drive Sales', desc: 'Convert followers into customers' },
  { id: 'awareness', icon: Megaphone, color: 'var(--neon)', label: 'Brand Awareness', desc: 'Get more eyes on my brand' },
  { id: 'leads', icon: Target, color: 'var(--accent-soft)', label: 'Generate Leads', desc: 'Collect contacts & inquiries' },
  { id: 'followers', icon: TrendingUp, color: 'var(--success)', label: 'Grow Following', desc: 'Build a bigger audience' },
  { id: 'event', icon: PartyPopper, color: 'var(--gold)', label: 'Promote Event', desc: 'Fill seats & drive RSVPs' },
  { id: 'launch', icon: Rocket, color: 'var(--neon)', label: 'Product Launch', desc: 'Introduce something new' },
];

function WelcomeInner() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('');
  const [saving, setSaving] = useState(false);

  const firstName = user?.displayName?.split(' ')[0] || 'there';

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        businessName, category, primaryGoal: selectedGoal,
        onboarded: true, plan: null, postsThisMonth: 0,
        createdAt: serverTimestamp(),
      }, { merge: true });
    } catch {
      localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify({ businessName, category, primaryGoal: selectedGoal, onboarded: true }));
    }
    router.replace('/home');
  };

  const StepIcon = ({ icon: Icon, color = 'var(--accent-soft)' }: { icon: typeof Zap; color?: string }) => (
    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
      style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}>
      <Icon size={20} style={{ color }} />
    </div>
  );

  const CTA = ({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
    <button onClick={onClick} disabled={disabled}
      className="w-full py-4 rounded-full text-[var(--accent-contrast)] font-medium flex items-center justify-center gap-2 text-sm transition-all hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0 shadow-lg shadow-[var(--accent)]/25 [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]">
      {children}
    </button>
  );

  const steps = [
    // Step 0 — greeting
    <div key="0" className="text-center animate-fade-in">
      <div className="flex justify-center"><StepIcon icon={Hand} /></div>
      <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--text)] mb-4 leading-tight">
        Welcome, {firstName}
      </h1>
      <p className="text-[var(--text-muted)] text-lg mb-10 max-w-sm mx-auto leading-relaxed">
        Meet GrowMitra — your marketing mitra. An AI team for your social media, ready in 60 seconds.
      </p>
      <div className="grid grid-cols-3 gap-4 mb-10 max-w-sm mx-auto">
        {[
          { icon: Zap, label: 'AI Campaigns', color: 'var(--accent-soft)' },
          { icon: ImageIcon, label: 'Post Studio', color: 'var(--neon)' },
          { icon: TrendingUp, label: 'Growth Dash', color: 'var(--success)' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 text-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div className="text-xs text-[var(--text-soft)]">{label}</div>
          </div>
        ))}
      </div>
      <div className="max-w-sm mx-auto">
        <CTA onClick={() => setStep(1)}>Let&apos;s go <ArrowRight size={14} /></CTA>
      </div>
    </div>,

    // Step 1 — business name
    <div key="1" className="animate-fade-in">
      <StepIcon icon={Building2} />
      <h2 className="font-display text-3xl font-bold text-[var(--text)] mb-2">
        What&apos;s your business called?
      </h2>
      <p className="text-[var(--text-muted)] text-sm mb-8">We&apos;ll personalise everything with this name.</p>
      <input type="text" aria-label="Business name" placeholder="e.g. Priya Gold House, Sri Lakshmi Boutiques, Spice Biryani House..."
        value={businessName} onChange={(e) => setBusinessName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && businessName.trim() && setStep(2)}
        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3.5 text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent)] outline-none text-sm mb-6 transition-colors"
        autoFocus />
      <CTA onClick={() => businessName.trim() && setStep(2)} disabled={!businessName.trim()}>
        Continue <ArrowRight size={14} />
      </CTA>
    </div>,

    // Step 2 — category
    <div key="2" className="animate-fade-in">
      <StepIcon icon={Target} />
      <h2 className="font-display text-3xl font-bold text-[var(--text)] mb-2">
        What industry are you in?
      </h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">Helps our AI write more relevant content for you.</p>
      <div className="relative mb-6">
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          aria-label="Industry" className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3.5 text-[var(--text)] focus:border-[var(--accent)] outline-none text-sm appearance-none">
          <option value="" className="bg-[var(--card)]">Select your industry...</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value} className="bg-[var(--card)]">{c.emoji} {c.label}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
      </div>
      <CTA onClick={() => category && setStep(3)} disabled={!category}>
        Continue <ArrowRight size={14} />
      </CTA>
    </div>,

    // Step 3 — primary goal
    <div key="3" className="animate-fade-in">
      <StepIcon icon={Rocket} />
      <h2 className="font-display text-3xl font-bold text-[var(--text)] mb-2">
        What&apos;s your main goal?
      </h2>
      <p className="text-[var(--text-muted)] text-sm mb-6">We&apos;ll optimise your campaigns around this.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {goals.map((g) => {
          const selected = selectedGoal === g.id;
          return (
            <button key={g.id} onClick={() => setSelectedGoal(g.id)}
              className={`text-left p-4 rounded-2xl border transition-all ${selected ? 'bg-[var(--accent)]/12 border-[var(--accent)]/40' : 'bg-[var(--bg-alt)] border-[var(--border)] hover:border-[var(--accent)]/30'}`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: `color-mix(in srgb, ${g.color} 12%, transparent)` }}>
                <g.icon size={16} style={{ color: g.color }} />
              </div>
              <div className="text-sm font-medium text-[var(--text)] mb-0.5">{g.label}</div>
              <div className="text-xs text-[var(--text-muted)]">{g.desc}</div>
            </button>
          );
        })}
      </div>
      <CTA onClick={finish} disabled={!selectedGoal || saving}>
        {saving ? 'Setting up...' : <><Sparkles size={14} />Enter GrowMitra</>}
      </CTA>
    </div>,
  ];

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-14 relative overflow-hidden">
      <div className="orb w-[600px] h-[600px] bg-[var(--accent)]/12 top-[-200px] right-[-150px]" />
      <div className="orb w-[400px] h-[400px] bg-[var(--neon)]/8 bottom-[-100px] left-[-100px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {[0,1,2,3].map((i) => (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 24 : 8, height: 8,
                background: i <= step ? 'var(--accent)' : 'var(--border)',
              }} />
          ))}
        </div>

        {steps[step]}

        {step > 0 && (
          <button onClick={() => setStep(step - 1)}
            className="mt-5 w-full text-center text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors">
            ← Back
          </button>
        )}
      </div>
    </main>
  );
}

export default function WelcomePage() {
  return <AuthGuard><WelcomeInner /></AuthGuard>;
}
