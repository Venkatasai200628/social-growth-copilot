'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronDown, AlertCircle, TrendingUp, Zap, BookOpen,
  Radio, Siren, Sparkles, Clock, Trophy } from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { useToast } from '../components/Toast';
import { useTheme } from '../components/ThemeProvider';
import { PageHeader, Card, Field, inputCls, Button, CopyButton, Skeleton, EmptyState } from '../components/ui';
import { authFetch } from '@/lib/client';
import { LANGUAGES } from '@/lib/india';

const platforms = ['Instagram','Facebook','Twitter/X','LinkedIn','YouTube Shorts'];
const categories = ['Food & Beverage','Fashion & Clothing','Tech Startup','Events','Real Estate','Education','Healthcare','Gold & Jewellery','Grocery','Beauty & Makeup','B2B Services','Local Business','Other'];

interface BreakdownItem { score: number; feedback: string; }
interface ABResult {
  winner: 'a' | 'b';
  why: string;
  scores: { a: number; b: number };
}
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
  ab?: ABResult;
}

function ScoreRing({ score }: { score: number }) {
  const { theme } = useTheme();
  const [track, setTrack] = useState('#1e1e2e');
  const r = 52, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--gold)' : 'var(--danger)';
  const label = score >= 75 ? 'Strong' : score >= 50 ? 'Average' : 'Weak';

  // The ring track should follow the theme's border token (light mode = light track).
  useEffect(() => {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();
      setTrack(v || '#1e1e2e');
    } catch {
      setTrack('#1e1e2e');
    }
  }, [theme]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="130" height="130" viewBox="0 0 130 130" role="img" aria-label={`Virality score ${score} out of 100`}>
        <circle cx="65" cy="65" r={r} fill="none" stroke={track} strokeWidth="10"/>
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 65 65)" style={{ transition:'stroke-dashoffset 1s ease-in-out' }}/>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-4xl font-bold text-[var(--text)]">{score}</span>
        <span className="text-xs" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, value, feedback, max = 20 }: { label: string; value: number; feedback: string; max?: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--gold)' : 'var(--danger)';
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4 cursor-pointer" onClick={() => setOpen(!open)} role="button" aria-expanded={open}>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-[var(--text-soft)]">{label}</span>
        <span style={{ color }}>{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden mb-1">
        <div className="h-full rounded-full transition-all duration-700" style={{ width:`${pct}%`, background: color }}/>
      </div>
      {open && <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1 pl-1">{feedback}</p>}
      {!open && <p className="text-xs text-[var(--text-faint)]">↓ tap for feedback</p>}
    </div>
  );
}

function ScorerInner() {
  const toast = useToast();
  const [caption, setCaption] = useState('');
  const [captionB, setCaptionB] = useState('');
  const [platform, setPlatform] = useState('Instagram');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('english');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoreResult | null>(null);

  // Restore the last generation AFTER hydration — reading sessionStorage in
  // the initial render makes server and client HTML diverge (hydration error).
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('gm_scorer_result') || 'null');
      if (saved) setResult(saved);
    } catch { /* corrupt save — start fresh */ }
  }, []);
  const updateResult = (r: ScoreResult | null) => { setResult(r); try { if (r) sessionStorage.setItem('gm_scorer_result', JSON.stringify(r)); else sessionStorage.removeItem('gm_scorer_result'); } catch { /* quota */ } };
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!caption.trim()) { setError('Please enter a caption to analyze.'); return; }
    setError(''); setLoading(true); updateResult(null);
    try {
      const res = await authFetch('/api/score-caption', {
        caption,
        ...(captionB.trim() ? { caption_b: captionB.trim() } : {}),
        language,
        platform,
        ...(category ? { category } : {}),
      }, { method: 'POST' });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        console.error('score-caption returned non-JSON', res.status);
        throw new Error('Something went wrong on our side — please try again in a moment.');
      }
      const data = await res.json() as ScoreResult & { error?: string };
      if (data.error) throw new Error(data.error);
      updateResult(data);
      toast(`Score: ${data.score}/100 — ${data.verdict}`, data.score >= 60 ? 'success' : 'info');
    } catch (e: unknown) {
      console.error('Virality scoring failed:', e);
      setError(e instanceof Error && e.message !== 'Failed to fetch'
        ? e.message
        : 'Something went wrong on our side — please try again in a moment.');
    } finally { setLoading(false); }
  };

  const breakdownLabels: Record<string, string> = {
    hook_strength: 'Hook Strength',
    emotional_trigger: 'Emotional Trigger',
    clarity: 'Clarity & Readability',
    call_to_action: 'Call to Action',
    hashtag_readiness: 'Hashtag Readiness',
  };

  const signalColor = (val: string) => val?.toLowerCase().startsWith('high') ? 'var(--success)' : val?.toLowerCase().startsWith('medium') ? 'var(--gold)' : 'var(--danger)';

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[color-mix(in_srgb,var(--neon)_10%,transparent)] top-[-150px] right-[-100px]"/>
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-14">

        <PageHeader
          eyebrow={<><Star size={11} /> Virality Score Predictor</>}
          title="Will it go viral?"
          sub="Paste your caption — get a score, deep analysis, and an AI-improved version before you post."
        />

        {/* Input card */}
        <Card className="p-6 md:p-8 mb-8">
          <div className="grid md:grid-cols-3 gap-5 mb-5">
            <Field label="Platform">
              <div className="relative">
                <select id="scorer-platform" className={inputCls + ' appearance-none'} value={platform} onChange={e => setPlatform(e.target.value)}>
                  {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/3 text-[var(--text-faint)] pointer-events-none"/>
              </div>
            </Field>
            <Field label="Business Category">
              <div className="relative">
                <select id="scorer-category" className={inputCls + ' appearance-none'} value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">Any category...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/3 text-[var(--text-faint)] pointer-events-none"/>
              </div>
            </Field>
            <Field label="Language">
              <div className="relative">
                <select id="scorer-language" className={inputCls + ' appearance-none'} value={language} onChange={e => setLanguage(e.target.value)}>
                  {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/3 text-[var(--text-faint)] pointer-events-none"/>
              </div>
            </Field>
          </div>

          <Field label="Your Caption / Content Idea *">
            <textarea id="scorer-caption" rows={5} className={inputCls + ' resize-none'} placeholder="Paste your caption, post idea, or content hook here..."
              value={caption} onChange={e => setCaption(e.target.value)} />
          </Field>
          <div className="flex justify-between items-center mt-1.5 mb-5">
            <span className="text-xs text-[var(--text-faint)]">{caption.length} characters</span>
            {caption.length > 0 && <button onClick={() => setCaption('')} className="text-xs text-[var(--text-faint)] hover:text-[var(--text)] transition-colors">Clear</button>}
          </div>

          <Field label="Variant B — test against the first" hint="Optional A/B — we score both and tell you which to post">
            <textarea id="scorer-caption-b" rows={3} className={inputCls + ' resize-none'} placeholder="Write an alternative version of the caption — we'll score both and tell you which one to post..."
              value={captionB} onChange={e => setCaptionB(e.target.value)} />
          </Field>

          {error && (
            <div className="mt-5 flex items-start gap-2 bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] border border-[color-mix(in_srgb,var(--danger)_20%,transparent)] rounded-xl px-4 py-3 text-[var(--danger)] text-xs">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0"/>{error}
            </div>
          )}

          <Button onClick={analyze} loading={loading} size="lg" className="w-full mt-6">
            {loading ? 'Analyzing…' : <><TrendingUp size={15}/>Predict Virality Score</>}
          </Button>
        </Card>

        {/* Loading skeleton */}
        {loading && (
          <Card className="p-8 space-y-5">
            <div className="flex items-center gap-6">
              <Skeleton className="w-[130px] h-[130px] rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-5/6" /><Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <p className="text-xs text-[var(--text-muted)] text-center animate-pulse">Scanning hook, emotion, clarity and CTA…</p>
          </Card>
        )}

        {/* Empty state */}
        {!result && !loading && (
          <EmptyState
            icon={<TrendingUp size={22} />}
            title="Your score report appears here"
            sub="Score, algorithm signals, top issues and an AI-improved rewrite — post with confidence."
          />
        )}

        {/* Results */}
        {result && (
          <div className="space-y-5 animate-slide-up">

            {/* Score + verdict */}
            <Card className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0 text-center">
                <ScoreRing score={result.score}/>
                <p className="text-xs text-[var(--text-muted)] mt-2">{result.verdict}</p>
              </div>
              <div className="flex-1 w-full min-w-0">
                <p className="text-[var(--text-soft)] text-sm mb-5 leading-relaxed">{result.verdict_reason}</p>
                {Object.entries(result.breakdown).map(([k, v]) => (
                  <BreakdownBar key={k} label={breakdownLabels[k] || k} value={typeof v === 'object' ? v.score : v}
                    feedback={typeof v === 'object' ? v.feedback : ''} />
                ))}
              </div>
            </Card>

            {/* A/B verdict */}
            {result.ab && (
              <Card className="p-6 border-[color-mix(in_srgb,var(--neon)_25%,transparent)]">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[color-mix(in_srgb,var(--neon)_10%,transparent)] text-[var(--neon)] border border-[color-mix(in_srgb,var(--neon)_25%,transparent)] uppercase tracking-widest">
                    <Trophy size={12}/> Winner: Variant {result.ab.winner === 'a' ? 'A (first caption)' : 'B'}
                  </span>
                  <div className="flex gap-3 text-sm">
                    <span className="text-[var(--text-soft)]">A: <span className="text-[var(--text)] font-semibold">{result.ab.scores?.a ?? '—'}</span></span>
                    <span className="text-[var(--text-soft)]">B: <span className="text-[var(--text)] font-semibold">{result.ab.scores?.b ?? '—'}</span></span>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-soft)] leading-relaxed">{result.ab.why}</p>
              </Card>
            )}

            {/* Algorithm signals */}
            {result.algorithm_signals && (
              <Card className="p-6">
                <h3 className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-4 flex items-center gap-1.5"><Radio size={12} className="text-[var(--neon)]"/> Algorithm Signals</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Saves', val: result.algorithm_signals.saves_potential },
                    { label: 'Shares', val: result.algorithm_signals.shares_potential },
                    { label: 'Comments', val: result.algorithm_signals.comments_potential },
                    { label: 'Reach Multiplier', val: result.algorithm_signals.reach_multiplier },
                  ].map(({ label, val }) => (
                    <div key={label} className="bg-[var(--bg-alt)] rounded-2xl p-4 text-center border border-[var(--border)]">
                      <div className="text-xs text-[var(--text-muted)] mb-2">{label}</div>
                      <div className="text-sm font-semibold" style={{ color: signalColor(val || '') }}>
                        {(val || '—').split('—')[0].split(' ')[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Issues + Quick wins */}
            <div className="grid md:grid-cols-2 gap-5">
              <Card className="p-6">
                <h3 className="text-xs text-[var(--danger)] uppercase tracking-widest mb-4 flex items-center gap-1.5"><Siren size={12} className="text-[var(--danger)]"/> Top 3 Issues</h3>
                <ul className="space-y-3">
                  {(result.top_3_issues || []).map((issue, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--text-soft)]">
                      <span className="text-[var(--danger)] flex-shrink-0 mt-0.5">{i + 1}.</span>{issue}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="p-6">
                <h3 className="text-xs text-[var(--success)] uppercase tracking-widest mb-4 flex items-center gap-1.5"><Sparkles size={12} className="text-[var(--success)]"/> Quick Wins</h3>
                <ul className="space-y-3">
                  {(result.quick_wins || []).map((win, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--text-soft)]">
                      <span className="text-[var(--success)] flex-shrink-0 mt-0.5">✓</span>{win}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Rewritten version */}
            <Card className="p-6 border-[color-mix(in_srgb,var(--accent)_25%,transparent)]">
              <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                <h3 className="text-xs text-[var(--accent-soft)] uppercase tracking-widest flex items-center gap-2">
                  <Zap size={12}/> AI-Improved Version
                </h3>
                <CopyButton text={result.rewritten_version} label="Copy improved caption" />
              </div>
              <div className="bg-[var(--bg-alt)] rounded-2xl p-4 border border-[var(--border)]">
                <p className="text-[var(--text-soft)] text-sm leading-relaxed whitespace-pre-wrap">{result.rewritten_version}</p>
              </div>
            </Card>

            {/* Hashtags + Tips */}
            <div className="grid md:grid-cols-2 gap-5">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                  <h3 className="text-xs text-[var(--neon)] uppercase tracking-widest">Suggested Hashtags</h3>
                  <CopyButton text={(result.suggested_hashtags || []).join(' ')} label="Copy all" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(result.suggested_hashtags || []).map((h, i) => (
                    <span key={i} className="text-xs bg-[color-mix(in_srgb,var(--neon)_8%,transparent)] text-[var(--neon)] border border-[color-mix(in_srgb,var(--neon)_20%,transparent)] rounded-full px-2.5 py-1 cursor-pointer hover:bg-[color-mix(in_srgb,var(--neon)_15%,transparent)] transition-colors">
                      {h}
                    </span>
                  ))}
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <div>
                  <h3 className="text-xs text-[var(--gold)] uppercase tracking-widest mb-2 flex items-center gap-1.5"><Clock size={11} className="text-[var(--gold)]"/> Best Time to Post</h3>
                  <p className="text-sm text-[var(--text-soft)]">{result.best_posting_time}</p>
                </div>
                <div>
                  <h3 className="text-xs text-[var(--accent-soft)] uppercase tracking-widest mb-2 flex items-center gap-1">
                    <BookOpen size={10}/> Visual Tip
                  </h3>
                  <p className="text-sm text-[var(--text-soft)] leading-relaxed">{result.content_tip}</p>
                </div>
              </Card>
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
