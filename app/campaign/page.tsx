'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, AlertCircle, ChevronDown, Mic, MicOff, Calendar, Sparkles, Megaphone, Send, X } from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { useToast } from '../components/Toast';
import { Button, Card, Field, inputCls, CopyButton, Skeleton } from '../components/ui';
import { CATEGORIES, GOALS } from '@/lib/types';
import { LANGUAGES, FESTIVALS } from '@/lib/india';
import { useSpeechRecognition } from '@/lib/use-speech';
import { authFetch, whatsappLink, downloadFile } from '@/lib/client';

const platformOptions = ['Instagram', 'Facebook', 'WhatsApp', 'Twitter/X', 'LinkedIn', 'YouTube'];

const BUDGET_TIERS = [
  { label: 'Micro — Under ₹5,000', min: 0, max: 4999, desc: '100% organic, no paid ads', color: '#22d3ee' },
  { label: 'Small — ₹5K to ₹25K', min: 5000, max: 24999, desc: 'Mostly organic + small boosts', color: '#10b981' },
  { label: 'Medium — ₹25K to ₹1L', min: 25000, max: 99999, desc: 'Paid ads + micro-influencers', color: '#8b5cf6' },
  { label: 'Large — ₹1L+', min: 100000, max: Infinity, desc: 'Full-funnel multi-platform', color: '#f59e0b' },
];

const LOADING_STAGES = [
  'Understanding your product…',
  'Shaping the strategy…',
  'Planning your day-by-day calendar…',
  'Writing captions & hashtags…',
  'Splitting your budget…',
];

function parseMarkdown(text: string) {
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\*\*(.+)\*\*$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/<p><\/p>/g, '');
}

function CampaignInner() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    product: '', productName: '', category: '', goal: '', budget: '',
    targetAudience: '', platforms: [] as string[], duration: '7', city: '',
  });
  const [language, setLanguage] = useState('english');
  const [festivalId, setFestivalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const lang = LANGUAGES.find((l) => l.id === language) ?? LANGUAGES[0];
  const speech = useSpeechRecognition(lang.speechCode);
  const activeFestival = FESTIVALS.find((f) => f.id === festivalId) ?? null;

  // Deep link from Festival Radar: /campaign?festival=<id>
  useEffect(() => {
    const fid = new URLSearchParams(window.location.search).get('festival');
    if (fid && FESTIVALS.some((f) => f.id === fid)) setFestivalId(fid);
  }, []);

  useEffect(() => {
    if (speech.transcript) setForm((f) => ({ ...f, product: speech.transcript, productName: speech.transcript }));
  }, [speech.transcript]);

  useEffect(() => {
    if (!loading) return;
    setStage(0);
    const iv = setInterval(() => setStage((s) => Math.min(s + 1, LOADING_STAGES.length - 1)), 2600);
    return () => clearInterval(iv);
  }, [loading]);

  const budgetNum = parseInt(form.budget) || 0;
  const currentTier = BUDGET_TIERS.find((t) => budgetNum >= t.min && budgetNum <= t.max) || BUDGET_TIERS[0];

  const togglePlatform = (p: string) =>
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(p) ? prev.platforms.filter((x) => x !== p) : [...prev.platforms, p],
    }));

  const generate = async () => {
    if (!form.product || !form.category || !form.goal || !form.budget) {
      setError('Please fill in Product, Category, Goal and Budget.');
      return;
    }
    setError(''); setLoading(true); setResult('');
    try {
      const res = await authFetch('/api/generate-campaign', {
        ...form,
        budget: budgetNum,
        duration: Math.min(parseInt(form.duration) || 7, 14),
        language,
        festival: festivalId || undefined,
        transcriptContext: speech.transcript || undefined,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.result);
      toast('Campaign generated!', 'ai');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong — please try again in a moment.');
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] top-[-150px] right-[-100px]" />
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-14">
        <div className="mb-10 animate-fade-up">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--accent-soft)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] rounded-full px-4 py-1.5">
            <Zap size={11} /> Smart Campaign Generator
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold mt-5 text-[var(--text)] leading-tight">Build Your Campaign</h1>
          <p className="text-[var(--text-muted)] mt-3 max-w-2xl text-sm leading-relaxed">
            Speak or type your product and budget — get a complete multi-day campaign with
            captions, hashtags, posting times and a budget split.
          </p>
          {activeFestival && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-2 text-xs text-[var(--accent-soft)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] rounded-full px-4 py-2 animate-fade-in">
                <Calendar size={12} /> Planning around: {activeFestival.name}
                <button onClick={() => setFestivalId(null)} aria-label="Clear selected festival"
                  className="ml-0.5 inline-flex hover:text-[var(--text)] transition-colors">
                  <X size={12} />
                </button>
              </span>
            </div>
          )}
        </div>

        <Card className="p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <Field label="Tell us about your business *" hint="Type or tap the mic and speak — one line is enough">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Eggless cakes and brownies bakery in Hyderabad, budget 5000"
                    value={form.product}
                    onChange={(e) => { setForm({ ...form, product: e.target.value, productName: e.target.value }); speech.setTranscript(e.target.value); }}
                    className={inputCls + ' pr-14'}
                  />
                  <button
                    onClick={() => (speech.listening ? speech.stop() : speech.start())}
                    aria-label={speech.listening ? 'Stop voice input' : 'Start voice input'}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                      speech.listening
                        ? 'bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] border-[color-mix(in_srgb,var(--danger)_40%,transparent)] text-[var(--danger)] animate-pulse'
                        : 'bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border-[color-mix(in_srgb,var(--accent)_25%,transparent)] text-[var(--accent-soft)] hover:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]'
                    }`}
                  >
                    {speech.listening ? <MicOff size={15} /> : <Mic size={15} />}
                  </button>
                </div>
                {speech.listening && <p className="text-xs text-[var(--accent-soft)] mt-1.5 animate-pulse">Listening… {speech.interim}</p>}
                {speech.error && <p className="text-xs text-[var(--gold)] mt-1.5">{speech.error}</p>}
              </Field>
            </div>

            <Field label="Category *">
              <div className="relative">
                <select className={inputCls + ' appearance-none'} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 translate-y-1/4 text-[var(--text-faint)] pointer-events-none" />
              </div>
            </Field>

            <Field label="Campaign goal *">
              <div className="relative">
                <select className={inputCls + ' appearance-none'} value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
                  <option value="">Select goal…</option>
                  {GOALS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 translate-y-1/4 text-[var(--text-faint)] pointer-events-none" />
              </div>
            </Field>

            <Field label="Total budget (₹) *">
              <input
                type="number" placeholder="5000"
                value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className={inputCls}
              />
              {form.budget && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: currentTier.color }} />
                  <span className="text-xs" style={{ color: currentTier.color }}>{currentTier.label}</span>
                  <span className="text-xs text-[var(--text-faint)]">— {currentTier.desc}</span>
                </div>
              )}
            </Field>

            <Field label="Duration" hint="Up to 14 days keeps every day fully planned">
              <div className="relative">
                <select className={inputCls + ' appearance-none'} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}>
                  {['3', '5', '7', '10', '14'].map((d) => <option key={d} value={d}>{d} days</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 translate-y-1/4 text-[var(--text-faint)] pointer-events-none" />
              </div>
            </Field>

            <Field label="City" hint="Powers local hashtags & timing">
              <input className={inputCls} placeholder="Hyderabad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>

            <div className="md:col-span-2">
              <Field label="Target audience">
                <input
                  className={inputCls}
                  placeholder="Women 25–45 interested in weddings and gold…"
                  value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-medium text-[var(--text-soft)] tracking-wide uppercase mb-2.5">Platforms</p>
              <div className="flex flex-wrap gap-2">
                {platformOptions.map((p) => {
                  const on = form.platforms.includes(p);
                  return (
                    <button key={p} onClick={() => togglePlatform(p)} aria-pressed={on}
                      className={`text-xs px-3.5 py-2 rounded-xl border transition-all ${on ? 'bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] border-[color-mix(in_srgb,var(--accent)_40%,transparent)] text-[var(--accent-soft)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {error && (
            <div className="mt-5 flex items-start gap-2 bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] border border-[color-mix(in_srgb,var(--danger)_20%,transparent)] rounded-xl px-4 py-3 text-[var(--danger)] text-xs">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />{error}
            </div>
          )}

          <Button onClick={generate} disabled={loading} size="lg" className="w-full mt-6">
            {loading ? 'Generating Campaign…' : <><Zap size={15} />Generate Full Campaign</>}
          </Button>
        </Card>

        {loading && (
          <Card className="p-8 space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <p className="text-sm text-[var(--accent-soft)] text-center pt-2 animate-pulse flex items-center justify-center gap-2">
              <Sparkles size={14} />{LOADING_STAGES[stage]}
            </p>
          </Card>
        )}

        {result && !loading && (
          <Card className="p-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
              <h2 className="font-display text-xl font-bold text-[var(--text)]">Your Campaign</h2>
              <div className="flex items-center gap-2">
                <CopyButton text={result} label="Copy all" className="!py-2" />
                <a
                  href={whatsappLink(undefined, `My campaign plan from GrowMitra 🌱\n\n${result.slice(0, 250)}`)}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-[#25d366]/40 text-[#128c4b] [[data-theme=dark]_&]:text-[#25d366] hover:bg-[#25d366]/10 transition-all"
                >
                  <Send size={12} />WhatsApp
                </a>
                <button
                  onClick={() => downloadFile(result, 'growmitra-campaign.md')}
                  className="text-xs px-3 py-2 rounded-full border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] transition-all"
                >
                  Download
                </button>
                <button
                  onClick={() => {
                    sessionStorage.setItem('gm_pending_campaign', JSON.stringify({
                      businessName: form.product.slice(0, 60) || 'My Business',
                      businessCategory: form.category,
                      productDescription: form.product,
                      targetAudience: form.targetAudience,
                      goal: form.goal,
                      budget: budgetNum,
                      platforms: form.platforms.length ? form.platforms : ['Instagram'],
                      duration: Math.min(parseInt(form.duration) || 7, 14),
                      promotionEfficiency: 'balanced',
                    }));
                    router.push('/checkout');
                  }}
                  className="text-xs px-3 py-2 rounded-full text-white [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]"
                >
                  Track this campaign
                </button>
              </div>
            </div>
            <div className="prose-output" dangerouslySetInnerHTML={{ __html: parseMarkdown(result) }} />
          </Card>
        )}
      </div>
    </main>
  );
}

export default function CampaignPage() {
  return <AuthGuard><CampaignInner /></AuthGuard>;
}
