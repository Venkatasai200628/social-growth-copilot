'use client';

import { useState } from 'react';
import { Star, Loader2, Copy, Check, ChevronDown, AlertCircle, TrendingUp, Zap, BookOpen } from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { useToast } from '../components/Toast';

const platforms = ['Instagram','Facebook','Twitter/X','LinkedIn','YouTube Shorts'];
const categories = ['Food & Beverage','Fashion & Clothing','Tech Startup','Events','Real Estate','Education','Healthcare','Gold & Jewellery','Grocery','Beauty & Makeup','B2B Services','Local Business','Other'];

interface BreakdownItem { score: number; feedback: string; }
interface ScoreResult {
  score: number;
  verdict: string;
  verdict_reason: string;
  breakdown: Record<string, BreakdownItem>;
  algorithm_signals: { saves_potential: string; shares_potential: string; comments_potential: string; reach_multiplier: string };
  top_3_issues: string[];
  quick_wins: string[];
  rewritten_version: string;
  suggested_hashtags: string[];
  best_posting_time: string;
  content_tip: string;
}

function ScoreRing({ score }: { score: number }) {
  const r = 52, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 75 ? 'Strong' : score >= 50 ? 'Average' : 'Weak';
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#1e1e2e" strokeWidth="10"/>
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 65 65)" style={{ transition:'stroke-dashoffset 1s ease-in-out' }}/>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-light text-white" style={{ fontFamily:'Cormorant Garamond,serif' }}>{score}</span>
        <span className="text-xs font-light" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value, feedback, max = 20 }: { label: string; value: number; feedback: string; max?: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 75 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4 cursor-pointer" onClick={() => setOpen(!open)}>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-400 font-light">{label}</span>
        <span className="font-light" style={{ color }}>{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-1">
        <div className="h-full rounded-full transition-all duration-700" style={{ width:`${pct}%`, background: color }}/>
      </div>
      {open && <p className="text-xs text-slate-500 font-light leading-relaxed mt-1 pl-1">{feedback}</p>}
      {!open && <p className="text-xs text-slate-600 font-light">↓ tap for feedback</p>}
    </div>
  );
}

function ScorerInner() {
  const toast = useToast();
  const [caption, setCaption] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const analyze = async () => {
    if (!caption.trim()) { setError('Please enter a caption to analyze.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const res = await fetch('/api/score-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, platform, category }),
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Server error — check GROQ_API_KEY in .env.local');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      toast(`Score: ${data.score}/100 — ${data.verdict}`, data.score >= 60 ? 'success' : 'info');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally { setLoading(false); }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text); setCopied(key); toast('Copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  const breakdownLabels: Record<string, string> = {
    hook_strength: 'Hook Strength',
    emotional_trigger: 'Emotional Trigger',
    clarity: 'Clarity & Readability',
    call_to_action: 'Call to Action',
    hashtag_readiness: 'Hashtag Readiness',
  };

  const signalColor = (val: string) => val?.toLowerCase().startsWith('high') ? '#10b981' : val?.toLowerCase().startsWith('medium') ? '#f59e0b' : '#ef4444';

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-cyan-600/10 top-[-150px] right-[-100px]"/>
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-14">

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-xs text-cyan-400 font-light tracking-widest uppercase mb-4">
            <Star size={11}/> Virality Score Predictor
          </div>
          <h1 className="text-5xl font-light text-white mb-3 tracking-wide" style={{ fontFamily:'Cormorant Garamond,serif' }}>
            Will it go viral?
          </h1>
          <p className="text-slate-400 text-sm font-light">Paste your caption — get a score, deep analysis, and an AI-improved version before you post.</p>
        </div>

        {/* Input card */}
        <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Platform</label>
              <div className="relative">
                <select value={platform} onChange={e => setPlatform(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white focus:outline-none text-sm font-light appearance-none">
                  {platforms.map(p => <option key={p} value={p} className="bg-[#16161f]">{p}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Business Category</label>
              <div className="relative">
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white focus:outline-none text-sm font-light appearance-none">
                  <option value="" className="bg-[#16161f]">Any category...</option>
                  {categories.map(c => <option key={c} value={c} className="bg-[#16161f]">{c}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"/>
              </div>
            </div>
          </div>

          <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Your Caption / Content Idea *</label>
          <textarea rows={5} placeholder="Paste your caption, post idea, or content hook here..."
            value={caption} onChange={e => setCaption(e.target.value)}
            className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500/30 text-sm font-light resize-none transition-colors"/>
          <div className="flex justify-between items-center mt-1.5 mb-5">
            <span className="text-xs text-slate-600 font-light">{caption.length} characters</span>
            {caption.length > 0 && <button onClick={() => setCaption('')} className="text-xs text-slate-600 hover:text-slate-400 font-light transition-colors">Clear</button>}
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3 text-red-400 text-xs font-light">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0"/>{error}
            </div>
          )}

          <button onClick={analyze} disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-light rounded-2xl py-4 flex items-center justify-center gap-2 transition-all text-sm">
            {loading ? <><Loader2 size={15} className="animate-spin"/>Analyzing...</> : <><TrendingUp size={15}/>Predict Virality Score</>}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-5 animate-slide-up">

            {/* Score + verdict */}
            <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 text-center">
                <ScoreRing score={result.score}/>
                <p className="text-xs text-slate-500 font-light mt-2">{result.verdict}</p>
              </div>
              <div className="flex-1 w-full">
                <p className="text-slate-400 text-sm font-light mb-5 leading-relaxed">{result.verdict_reason}</p>
                {Object.entries(result.breakdown).map(([k, v]) => (
                  <BreakdownBar key={k} label={breakdownLabels[k] || k} value={typeof v === 'object' ? v.score : v}
                    feedback={typeof v === 'object' ? v.feedback : ''} />
                ))}
              </div>
            </div>

            {/* Algorithm signals */}
            {result.algorithm_signals && (
              <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6">
                <h3 className="text-xs font-light text-slate-500 uppercase tracking-widest mb-4">📡 Algorithm Signals</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Saves', val: result.algorithm_signals.saves_potential },
                    { label: 'Shares', val: result.algorithm_signals.shares_potential },
                    { label: 'Comments', val: result.algorithm_signals.comments_potential },
                    { label: 'Reach Multiplier', val: result.algorithm_signals.reach_multiplier },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-white/[0.02] rounded-2xl p-4 text-center border border-white/[0.04]">
                      <div className="text-xs text-slate-500 font-light mb-2">{label}</div>
                      <div className="text-sm font-light" style={{ color: signalColor(val || '') }}>
                        {(val || '—').split('—')[0].split(' ')[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issues + Quick wins */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6">
                <h3 className="text-xs font-light text-red-400 uppercase tracking-widest mb-4">🚨 Top 3 Issues</h3>
                <ul className="space-y-3">
                  {(result.top_3_issues || []).map((issue, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400 font-light">
                      <span className="text-red-500 flex-shrink-0 mt-0.5">{i + 1}.</span>{issue}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6">
                <h3 className="text-xs font-light text-green-400 uppercase tracking-widest mb-4">⚡ Quick Wins</h3>
                <ul className="space-y-3">
                  {(result.quick_wins || []).map((win, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400 font-light">
                      <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span>{win}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Rewritten version */}
            <div className="bg-[#16161f] border border-violet-500/20 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-light text-violet-400 uppercase tracking-widest flex items-center gap-2">
                  <Zap size={12}/> AI-Improved Version
                </h3>
                <button onClick={() => copy(result.rewritten_version, 'rewrite')}
                  className="flex items-center gap-1.5 text-xs bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-1.5 text-slate-400 hover:bg-white/[0.07] transition-all font-light">
                  {copied === 'rewrite' ? <><Check size={11} className="text-green-400"/>Copied</> : <><Copy size={11}/>Copy</>}
                </button>
              </div>
              <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.04]">
                <p className="text-slate-200 text-sm font-light leading-relaxed whitespace-pre-wrap">{result.rewritten_version}</p>
              </div>
            </div>

            {/* Hashtags + Tips */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-light text-cyan-400 uppercase tracking-widest">Suggested Hashtags</h3>
                  <button onClick={() => copy((result.suggested_hashtags || []).join(' '), 'hashtags')}
                    className="text-xs text-slate-600 hover:text-slate-400 font-light transition-colors">
                    {copied === 'hashtags' ? '✓ Copied' : 'Copy all'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(result.suggested_hashtags || []).map((h, i) => (
                    <span key={i} onClick={() => copy(h, `h${i}`)}
                      className="text-xs bg-cyan-500/8 text-cyan-400 border border-cyan-500/15 rounded-full px-2.5 py-1 font-light cursor-pointer hover:bg-cyan-500/15 transition-colors">
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6 space-y-4">
                <div>
                  <h3 className="text-xs font-light text-amber-400 uppercase tracking-widest mb-2">📅 Best Time to Post</h3>
                  <p className="text-sm text-slate-300 font-light">{result.best_posting_time}</p>
                </div>
                <div>
                  <h3 className="text-xs font-light text-violet-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <BookOpen size={10}/> Visual Tip
                  </h3>
                  <p className="text-sm text-slate-300 font-light leading-relaxed">{result.content_tip}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ScorerPage() {
  return <AuthGuard><ScorerInner /></AuthGuard>;
}
