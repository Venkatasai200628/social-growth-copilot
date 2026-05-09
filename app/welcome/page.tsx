'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, ChevronDown, Zap, Star, ImageIcon, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import AuthGuard from '../components/AuthGuard';

const categories = [
  'Food & Beverage','Fashion & Clothing','Tech Startup','Events & Hackathons',
  'Real Estate','Education & Courses','Healthcare & Wellness','Gold & Jewellery',
  'Grocery & FMCG','Beauty & Makeup','B2B Services','Local Business',
  'Fitness & Gym','Travel & Tourism','Entertainment','Other',
];

const goals = [
  { id: 'sales', icon: '💰', label: 'Drive Sales', desc: 'Convert followers into customers' },
  { id: 'awareness', icon: '📣', label: 'Brand Awareness', desc: 'Get more eyes on my brand' },
  { id: 'leads', icon: '🎯', label: 'Generate Leads', desc: 'Collect contacts & inquiries' },
  { id: 'followers', icon: '📈', label: 'Grow Following', desc: 'Build a bigger audience' },
  { id: 'event', icon: '🎉', label: 'Promote Event', desc: 'Fill seats & drive RSVPs' },
  { id: 'launch', icon: '🚀', label: 'Product Launch', desc: 'Introduce something new' },
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
    router.replace('/my-campaigns');
  };

  const steps = [
    // Step 0 — greeting
    <div key="0" className="text-center animate-fade-in">
      <div className="text-6xl mb-6">👋</div>
      <h1 className="text-5xl font-light text-white mb-4 leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
        Welcome, {firstName}
      </h1>
      <p className="text-slate-400 text-lg font-light mb-10 max-w-sm mx-auto leading-relaxed">
        You&apos;re about to have an AI team working on your social media. Let&apos;s set things up in 60 seconds.
      </p>
      <div className="grid grid-cols-3 gap-4 mb-10 max-w-sm mx-auto">
        {[
          { icon: Zap, label: 'AI Campaigns', color: '#7c3aed' },
          { icon: ImageIcon, label: 'Post Studio', color: '#22d3ee' },
          { icon: TrendingUp, label: 'Growth Dash', color: '#10b981' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 text-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${color}15` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div className="text-xs font-light text-slate-400">{label}</div>
          </div>
        ))}
      </div>
      <button onClick={() => setStep(1)}
        className="w-full max-w-sm mx-auto py-4 rounded-2xl text-white font-light flex items-center justify-center gap-2 text-sm hover:opacity-85 transition-opacity"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
        Let&apos;s go <ArrowRight size={14} />
      </button>
    </div>,

    // Step 1 — business name
    <div key="1" className="animate-fade-in">
      <div className="text-4xl mb-4">🏢</div>
      <h2 className="text-4xl font-light text-white mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
        What&apos;s your business called?
      </h2>
      <p className="text-slate-500 text-sm font-light mb-8">We&apos;ll personalise everything with this name.</p>
      <input type="text" placeholder="e.g. Priya Gold House, TechLaunch, Spice Biryani..."
        value={businessName} onChange={(e) => setBusinessName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && businessName.trim() && setStep(2)}
        className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-4 text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/40 text-base font-light mb-6 transition-colors"
        autoFocus />
      <button onClick={() => businessName.trim() && setStep(2)} disabled={!businessName.trim()}
        className="w-full py-4 rounded-2xl text-white font-light flex items-center justify-center gap-2 text-sm hover:opacity-85 transition-all disabled:opacity-30"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
        Continue <ArrowRight size={14} />
      </button>
    </div>,

    // Step 2 — category
    <div key="2" className="animate-fade-in">
      <div className="text-4xl mb-4">🎯</div>
      <h2 className="text-4xl font-light text-white mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
        What industry are you in?
      </h2>
      <p className="text-slate-500 text-sm font-light mb-6">Helps our AI write more relevant content for you.</p>
      <div className="relative mb-6">
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl px-5 py-4 text-white focus:outline-none text-sm font-light appearance-none">
          <option value="" className="bg-[#16161f]">Select your industry...</option>
          {categories.map((c) => <option key={c} value={c} className="bg-[#16161f]">{c}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
      </div>
      <button onClick={() => category && setStep(3)} disabled={!category}
        className="w-full py-4 rounded-2xl text-white font-light flex items-center justify-center gap-2 text-sm hover:opacity-85 transition-all disabled:opacity-30"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
        Continue <ArrowRight size={14} />
      </button>
    </div>,

    // Step 3 — primary goal
    <div key="3" className="animate-fade-in">
      <div className="text-4xl mb-4">🚀</div>
      <h2 className="text-4xl font-light text-white mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
        What&apos;s your main goal?
      </h2>
      <p className="text-slate-500 text-sm font-light mb-6">We&apos;ll optimise your campaigns around this.</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {goals.map((g) => (
          <button key={g.id} onClick={() => setSelectedGoal(g.id)}
            className="text-left p-4 rounded-2xl border transition-all"
            style={{
              background: selectedGoal === g.id ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)',
              borderColor: selectedGoal === g.id ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.07)',
            }}>
            <div className="text-xl mb-1.5">{g.icon}</div>
            <div className="text-sm font-light text-white mb-0.5">{g.label}</div>
            <div className="text-xs text-slate-500 font-light">{g.desc}</div>
          </button>
        ))}
      </div>
      <button onClick={finish} disabled={!selectedGoal || saving}
        className="w-full py-4 rounded-2xl text-white font-light flex items-center justify-center gap-2 text-sm hover:opacity-85 transition-all disabled:opacity-30"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
        {saving ? 'Setting up...' : <><Sparkles size={14} />Enter Social Growth Copilot</>}
      </button>
    </div>,
  ];

  return (
    <main className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      <div className="orb w-[600px] h-[600px] bg-violet-600/12 top-[-200px] right-[-150px]" />
      <div className="orb w-[400px] h-[400px] bg-cyan-600/8 bottom-[-100px] left-[-100px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-10">
          {[0,1,2,3].map((i) => (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{
                width: i === step ? 24 : 8, height: 8,
                background: i <= step ? '#7c3aed' : 'rgba(255,255,255,0.08)',
              }} />
          ))}
        </div>

        {steps[step]}

        {step > 0 && (
          <button onClick={() => setStep(step - 1)}
            className="mt-5 w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors font-light">
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
