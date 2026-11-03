'use client';

import { useState } from 'react';
import { Lightbulb, Zap, TrendingUp, Hash, Clock, AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';
import { PageHeader, Card, Field, inputCls, Button, Skeleton, Tabs, EmptyState } from '../components/ui';
import { CATEGORIES } from '@/lib/types';
import { authFetch } from '@/lib/client';

interface ReelFormat { format: string; description: string; example: string; difficulty: string; virality: number }
interface Hook { hook: string; type: string; platform: string }
interface ContentAngle { angle: string; description: string; example: string }
interface HashtagSet { set_name: string; tags: string[] }
interface PostingTime { platform: string; times: string[]; reason: string }
interface StudioData {
  reel_formats: ReelFormat[];
  hooks: Hook[];
  content_angles: ContentAngle[];
  hashtag_sets: HashtagSet[];
  best_posting_times: PostingTime[];
  content_dont: string[];
}

const DIFF_COLOR: Record<string, string> = { Easy: 'var(--success)', Medium: 'var(--gold)', Hard: 'var(--danger)' };

export default function ContentStudioPage() {
  const [category, setCategory] = useState(CATEGORIES[7].value);
  const [goal, setGoal] = useState('Drive Sales / Conversions');
  const [language] = useState('english');
  const [platform, setPlatform] = useState('Instagram');
  const [data, setData] = useState<StudioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('formats');
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true); setError(''); setData(null);
    try {
      const res = await authFetch('/api/content-studio', { category, goal, platforms: [platform], language });
      const json = await res.json();
      if (json.success) setData(json.data);
      else throw new Error(json.error || 'Could not generate ideas.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong — please try again in a moment.');
    } finally { setLoading(false); }
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(key);
    setTimeout(() => setCopiedIdx(null), 1600);
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[color-mix(in_srgb,var(--neon)_8%,transparent)] top-[-150px] right-[-100px]" />
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-14">
        <PageHeader
          eyebrow={<><Lightbulb size={11} /> Content Ideas</>}
          title="What should you post this week?"
          sub="Trending formats, hooks and hashtag sets for your niche — with copy-ready examples in your language."
        />

        <Card className="p-7 mb-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="Category">
              <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
              </select>
            </Field>
            <Field label="Goal">
              <select className={inputCls} value={goal} onChange={(e) => setGoal(e.target.value)} aria-label="Goal">
                {['Drive Sales / Conversions', 'Brand Awareness', 'Grow Followers', 'Generate Leads'].map((g) => <option key={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="Platform">
              <select className={inputCls} value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform">
                {['Instagram', 'Facebook', 'WhatsApp', 'YouTube'].map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <Button onClick={generate} disabled={loading} className="mt-5" size="lg">
            {loading ? 'Finding what works…' : <><Zap size={15} />Get Content Ideas</>}
          </Button>
          {error && (
            <div className="mt-5 flex items-start gap-2 bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] border border-[color-mix(in_srgb,var(--danger)_20%,transparent)] rounded-xl px-4 py-3 text-[var(--danger)] text-xs">
              <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />{error}
            </div>
          )}
        </Card>

        {loading && (
          <Card className="p-7 space-y-4">
            <Skeleton className="h-6 w-1/4" />
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </Card>
        )}

        {!data && !loading && (
          <EmptyState
            icon={<Lightbulb size={22} />}
            title="Ideas for your niche appear here"
            sub="Trending reel formats, scroll-stopping hooks, content angles, hashtag sets and the best times to post — all copy-ready."
            action={<Button onClick={generate}><Zap size={15} />Get Content Ideas</Button>}
          />
        )}

        {data && !loading && (
          <div className="animate-slide-up space-y-5">
            <Tabs
              tabs={[
                { id: 'formats', label: 'Reel Formats' },
                { id: 'hooks', label: 'Hooks' },
                { id: 'angles', label: 'Content Angles' },
                { id: 'hashtags', label: 'Hashtag Sets' },
                { id: 'timing', label: 'Best Times' },
                { id: 'donts', label: 'Don&apos;ts' },
              ]}
              active={tab}
              onChange={setTab}
            />

            {tab === 'formats' && (
              <div className="grid md:grid-cols-2 gap-4">
                {(data.reel_formats || []).map((f, i) => (
                  <Card key={i} className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-[var(--text)]">{f.format}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-full border border-[var(--border)]" style={{ color: DIFF_COLOR[f.difficulty] || 'var(--text-muted)' }}>{f.difficulty}</span>
                        <span className="text-xs text-[var(--gold)] flex items-center gap-1"><TrendingUp size={11} />{f.virality}/10</span>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">{f.description}</p>
                    <div className="bg-[var(--bg-alt)] border border-[var(--border)] rounded-xl p-3 flex items-start justify-between gap-3">
                      <p className="text-xs text-[var(--text-soft)] italic">&ldquo;{f.example}&rdquo;</p>
                      <button onClick={() => copy(f.example, `f${i}`)} aria-label="Copy example" className="text-[var(--text-faint)] hover:text-[var(--text)] flex-shrink-0">
                        {copiedIdx === `f${i}` ? <Check size={12} className="text-[var(--success)]" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {tab === 'hooks' && (
              <div className="space-y-3">
                {(data.hooks || []).map((h, i) => (
                  <Card key={i} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-[var(--text)]">&ldquo;{h.hook}&rdquo;</p>
                      <p className="text-xs text-[var(--text-faint)] mt-1">{h.type} · {h.platform}</p>
                    </div>
                    <button onClick={() => copy(h.hook, `h${i}`)} aria-label="Copy hook" className="text-[var(--text-faint)] hover:text-[var(--text)] flex-shrink-0">
                      {copiedIdx === `h${i}` ? <Check size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
                    </button>
                  </Card>
                ))}
              </div>
            )}

            {tab === 'angles' && (
              <div className="grid md:grid-cols-2 gap-4">
                {(data.content_angles || []).map((a, i) => (
                  <Card key={i} className="p-5">
                    <p className="text-sm font-medium text-[var(--text)] mb-1.5">{a.angle}</p>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-3">{a.description}</p>
                    <p className="text-xs text-[var(--text-soft)] italic bg-[var(--bg-alt)] border border-[var(--border)] rounded-xl p-3">{a.example}</p>
                  </Card>
                ))}
              </div>
            )}

            {tab === 'hashtags' && (
              <div className="grid md:grid-cols-2 gap-4">
                {(data.hashtag_sets || []).map((s, i) => (
                  <Card key={i} className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5"><Hash size={11} />{s.set_name}</p>
                      <button onClick={() => copy(s.tags.join(' '), `s${i}`)} aria-label="Copy hashtag set" className="text-xs text-[var(--accent-soft)] hover:underline flex items-center gap-1">
                        {copiedIdx === `s${i}` ? <Check size={11} /> : <Copy size={11} />}Copy
                      </button>
                    </div>
                    <p className="text-xs text-[var(--text-soft)] leading-relaxed">{s.tags.join(' ')}</p>
                  </Card>
                ))}
              </div>
            )}

            {tab === 'timing' && (
              <div className="grid md:grid-cols-2 gap-4">
                {(data.best_posting_times || []).map((t, i) => (
                  <Card key={i} className="p-5">
                    <p className="text-sm font-medium text-[var(--text)] mb-2 flex items-center gap-2"><Clock size={13} className="text-[var(--accent-soft)]" />{t.platform}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {t.times.map((time) => <span key={time} className="text-xs px-3 py-1 rounded-full bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)]">{time}</span>)}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{t.reason}</p>
                  </Card>
                ))}
              </div>
            )}

            {tab === 'donts' && (
              <Card className="p-6 space-y-3">
                {(data.content_dont || []).map((d, i) => (
                  <div key={i} className="flex items-start gap-3 bg-[color-mix(in_srgb,var(--danger)_6%,transparent)] border border-[color-mix(in_srgb,var(--danger)_15%,transparent)] rounded-xl p-4">
                    <AlertTriangle size={13} className="text-[var(--danger)] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[var(--text-soft)]">{d}</p>
                  </div>
                ))}
              </Card>
            )}

            <div className="flex justify-center pt-2">
              <Button variant="ghost" onClick={generate}><RefreshCw size={13} />Regenerate ideas</Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
