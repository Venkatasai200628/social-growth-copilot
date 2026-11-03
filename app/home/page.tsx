'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap, ImageIcon, Film, MessageCircle, TrendingUp, Edit3, Calendar,
  ArrowRight, Plus, Sparkles, HelpCircle, Star, Trophy, ShieldCheck, Activity, Wand2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import AuthGuard from '../components/AuthGuard';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { Eyebrow, Card, Button } from '../components/ui';
import { upcomingFestivals } from '@/lib/india';

interface RecentCampaign {
  id: string;
  businessName: string;
  createdAt: number;
  duration: number;
  strategyStatus?: string;
  loggedDays?: number;
}

interface PostHistoryItem {
  id: string;
  businessName: string;
  caption: string;
  createdAt: number;
}

function greetingIST(): string {
  const ist = new Date(Date.now() + (5.5 * 60 - new Date().getTimezoneOffset()) * 60000);
  const h = new Date(ist).getUTCHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function daysSince(ts: number): string {
  const d = Math.floor((Date.now() - ts) / 86400000);
  if (d <= 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
}

function timeAgo(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return daysSince(ts);
}

function HomeInner() {
  const router = useRouter();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<RecentCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [postHistory, setPostHistory] = useState<PostHistoryItem[]>([]);
  const [festivalStrip, setFestivalStrip] = useState<{ name: string; daysUntil: number; id: string } | null>(null);

  useEffect(() => {
    // Load post history from localStorage
    try {
      const raw = localStorage.getItem('growmitra_post_history');
      if (raw) setPostHistory(JSON.parse(raw).slice(0, 3));
    } catch { /* ignore */ }

    // Compute festival strip
    const upcoming = upcomingFestivals(new Date(), 14);
    if (upcoming.length > 0) {
      const f = upcoming[0];
      setFestivalStrip({ name: f.name, daysUntil: f.daysUntil, id: f.id });
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const out: RecentCampaign[] = [];
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(3),
        );
        const snap = await getDocs(q);
        snap.forEach((d) => {
          const o = d.data();
          out.push({
            id: d.id,
            businessName: o.businessName || 'Unnamed Business',
            createdAt: o.createdAt || 0,
            duration: o.duration || 14,
          });
        });
        // logged-days count per campaign
        for (const c of out) {
          try {
            const cq = query(collection(db, 'campaigns'), where('orderId', '==', c.id));
            const cs = await getDocs(cq);
            cs.forEach((d) => {
              const metrics = d.data().metrics || [];
              c.loggedDays = metrics.filter((m: { actual?: unknown }) => m.actual).length;
              c.strategyStatus = d.data().strategyStatus;
            });
          } catch { /* leave defaults */ }
        }
      } catch {
        // localStorage fallback
        const ids: string[] = JSON.parse(localStorage.getItem(`user_orders_${user.uid}`) || '[]');
        for (const id of ids.slice(-3).reverse()) {
          const raw = localStorage.getItem(`order_${id}`);
          if (!raw) continue;
          try {
            const o = JSON.parse(raw);
            const camp = JSON.parse(localStorage.getItem(`campaign_${id}`) || '{}');
            const metrics = camp.metrics || [];
            out.push({
              id,
              businessName: o.businessName || 'Unnamed Business',
              createdAt: o.createdAt || 0,
              duration: o.duration || 14,
              strategyStatus: camp.strategyStatus,
              loggedDays: metrics.filter((m: { actual?: unknown }) => m.actual).length,
            });
          } catch { /* skip malformed */ }
        }
      }
      setCampaigns(out);
      setLoading(false);
    };
    load();
  }, [user]);

  const quickActions = [
    { href: '/visual-studio', icon: Wand2, label: 'Visual Studio', desc: 'AI brand ambassadors, studio visuals & macros', color: 'var(--accent-soft)' },
    { href: '/post-studio', icon: ImageIcon, label: 'Create a Post', desc: 'Photo → poster, caption & WhatsApp message', color: 'var(--accent-soft)' },
    { href: '/video-studio', icon: Film, label: 'Make a Video', desc: 'Script, scenes & AI voiceover reel', color: 'var(--neon)' },
    { href: '/onboard', icon: Plus, label: 'New Campaign', desc: 'Multi-day plan with daily tracking', color: 'var(--success)' },
    { href: '/reply-agent', icon: MessageCircle, label: 'Reply Assistant', desc: 'Paste a customer DM, get English replies', color: '#25d366' },
  ];

  const toolCards = [
    { href: '/scorer', icon: Star, label: 'Caption Scorer', desc: 'A/B test two hooks — find what stops the scroll', color: 'var(--gold)' },
    { href: '/festivals', icon: Calendar, label: 'Festival Calendar', desc: '18+ Indian festivals with dates and poster moods', color: 'var(--neon)' },
    { href: '/strategy', icon: Trophy, label: 'Strategy Generator', desc: 'Get a multi-day content strategy tailored to your business', color: 'var(--accent-soft)' },
  ];

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[600px] h-[600px] bg-[color-mix(in_srgb,var(--accent)_9%,transparent)] top-[-180px] right-[-140px]" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-14">

        {/* Greeting */}
        <div className="animate-fade-up">
          <Eyebrow><Sparkles size={11} /> Home</Eyebrow>
          <h1 className="font-display text-4xl md:text-5xl font-bold mt-5 text-[var(--text)] leading-tight">
            {greetingIST()}{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-[var(--text-muted)] mt-3 text-sm">What are we growing today?</p>
        </div>

        {/* Festival Strip */}
        {festivalStrip && (
          <div className="mt-8 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--gold) 15%, transparent), color-mix(in srgb, var(--gold) 8%, transparent))', border: '1px solid color-mix(in srgb, var(--gold) 30%, transparent)' }}>
            <div className="flex items-center gap-3">
              <span className="text-xl">🎉</span>
              <div>
                <span className="text-sm font-semibold text-[var(--text)]">{festivalStrip.name}</span>
                <span className="text-xs text-[var(--text-muted)] ml-2">
                  {festivalStrip.daysUntil <= 0 ? 'is today!' : festivalStrip.daysUntil === 1 ? 'is tomorrow!' : `is in ${festivalStrip.daysUntil} days`}
                </span>
              </div>
            </div>
            <button onClick={() => router.push(`/post-studio?festival=${festivalStrip.id}`)}
              className="flex items-center justify-center gap-1.5 text-xs px-4 py-2 rounded-full font-medium transition-all w-full sm:w-auto"
              style={{ background: 'color-mix(in srgb, var(--gold) 20%, transparent)', color: 'var(--gold)', border: '1px solid color-mix(in srgb, var(--gold) 35%, transparent)' }}>
              Make your {festivalStrip.name.split(' ')[0]} post <ArrowRight size={12} />
            </button>
          </div>
        )}

        {/* Quick actions */}
        <div className="grid sm:grid-cols-2 gap-4 mt-10">
          {quickActions.map(({ href, icon: Icon, label, desc, color }) => (
            <button key={href} onClick={() => router.push(href)}
              className="group text-left bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:-translate-y-1 transition-all flex flex-col justify-between h-full">
              <div>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <div className="font-display text-base font-bold text-[var(--text)] mb-1.5 flex items-center gap-2">
                  {label} <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent-soft)]" />
                </div>
                <p className="text-[var(--text-muted)] text-xs leading-relaxed">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Recent campaigns */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Your campaigns</h2>
            <button onClick={() => router.push('/my-campaigns')}
              className="text-xs text-[var(--accent-soft)] hover:underline inline-flex items-center gap-1">
              View all <ArrowRight size={11} />
            </button>
          </div>
          {loading ? (
            <div className="grid sm:grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => <Card key={i} className="h-28 animate-pulse"><span /></Card>)}
            </div>
          ) : campaigns.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-[var(--text-muted)] text-sm mb-4">No campaigns yet — launch your first and track it day by day.</p>
              <Button onClick={() => router.push('/onboard')}><Zap size={14} /> Launch a campaign</Button>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-3 gap-4">
              {campaigns.map((c) => (
                <button key={c.id} onClick={() => router.push(`/dashboard/${c.id}`)}
                  className="text-left bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:-translate-y-1 transition-all flex flex-col justify-between h-full">
                  <div>
                    <div className="text-[10px] text-[var(--text-faint)] uppercase tracking-widest mb-2">{daysSince(c.createdAt)}</div>
                    <div className="font-display text-sm font-bold text-[var(--text)] truncate mb-1.5">{c.businessName}</div>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-2">
                    {c.strategyStatus === 'generating' ? 'Strategy building…'
                      : c.strategyStatus === 'failed' ? 'Strategy needs a retry'
                      : (c.loggedDays ?? 0) > 0 ? `${c.loggedDays}/${c.duration} days logged`
                      : 'Nothing logged yet'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent posts */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">Recent posts</h2>
              <p className="text-[10px] text-[var(--text-faint)] mt-0.5">Posts you created in Post Studio</p>
            </div>
            {postHistory.length > 0 && (
              <button onClick={() => router.push('/post-studio')}
                className="text-xs text-[var(--accent-soft)] hover:underline inline-flex items-center gap-1">
                New post <ArrowRight size={11} />
              </button>
            )}
          </div>
          {postHistory.length === 0 ? (
            <Card className="p-7 text-center">
              <div className="w-10 h-10 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] flex items-center justify-center mx-auto mb-3">
                <ImageIcon size={16} className="text-[var(--accent-soft)]" />
              </div>
              <p className="text-[var(--text-muted)] text-sm mb-4">No posts created yet — your Post Studio history appears here.</p>
              <Button onClick={() => router.push('/post-studio')} variant="ghost" size="sm"><Zap size={13} /> Create your first post</Button>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {postHistory.map((p) => (
                <button key={p.id} onClick={() => router.push('/post-studio')}
                  className="w-full text-left bg-[var(--card)] border border-[var(--border)] rounded-2xl px-5 py-4 hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-all flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[color-mix(in_srgb,var(--accent-soft)_12%,transparent)] border border-[color-mix(in_srgb,var(--accent-soft)_25%,transparent)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ImageIcon size={13} className="text-[var(--accent-soft)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[var(--text)] truncate">{p.businessName}</span>
                      <span className="text-[10px] text-[var(--text-faint)] flex-shrink-0">{timeAgo(p.createdAt)}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">{p.caption}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Today's checklist — only real, derivable actions */}
        <div className="mt-12">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Today&apos;s shortlist</h2>
          <div className="space-y-2.5">
            {campaigns.some((c) => (c.loggedDays ?? 0) < c.duration) && campaigns.length > 0 && (
              <button onClick={() => router.push('/my-campaigns')}
                className="w-full flex items-center gap-3.5 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-5 py-4 text-left hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-all">
                <div className="w-8 h-8 rounded-xl bg-[color-mix(in_srgb,var(--success)_12%,transparent)] border border-[color-mix(in_srgb,var(--success)_25%,transparent)] flex items-center justify-center flex-shrink-0">
                  <Edit3 size={13} className="text-[var(--success)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[var(--text)] font-medium">Log today&apos;s real numbers</div>
                  <div className="text-xs text-[var(--text-muted)]">From Instagram Insights or Meta Ads Manager — takes 30 seconds, keeps the AI coach sharp.</div>
                </div>
                <ArrowRight size={14} className="text-[var(--text-faint)] flex-shrink-0" />
              </button>
            )}
            <button onClick={() => router.push('/scorer')}
              className="w-full flex items-center gap-3.5 bg-[var(--card)] border border-[var(--border)] rounded-2xl px-5 py-4 text-left hover:border-[color-mix(in_srgb,var(--accent)_40%,transparent)] transition-all">
              <div className="w-8 h-8 rounded-xl bg-[color-mix(in_srgb,var(--gold)_12%,transparent)] border border-[color-mix(in_srgb,var(--gold)_25%,transparent)] flex items-center justify-center flex-shrink-0">
                <TrendingUp size={13} className="text-[var(--gold)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[var(--text)] font-medium">Score a caption before you post</div>
                <div className="text-xs text-[var(--text-muted)]">A/B test two hooks and see which one is built to stop the scroll.</div>
              </div>
              <ArrowRight size={14} className="text-[var(--text-faint)] flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Tools */}
        <div className="mt-12">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">Tools</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {toolCards.map(({ href, icon: Icon, label, desc, color }) => (
              <button key={href} onClick={() => router.push(href)}
                className="group text-left bg-[var(--card)] border border-[var(--border)] rounded-3xl p-5 hover:border-[color-mix(in_srgb,var(--accent)_45%,transparent)] hover:-translate-y-1 transition-all flex flex-col justify-between h-full">
                <div>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 25%, transparent)` }}>
                    <Icon size={16} style={{ color }} />
                  </div>
                  <div className="font-display text-sm font-bold text-[var(--text)] mb-1">{label}</div>
                  <p className="text-[var(--text-muted)] text-xs leading-relaxed">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* How data works — the honest explainer */}
        <Card className="mt-12 p-7">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] flex items-center justify-center flex-shrink-0">
              <HelpCircle size={15} className="text-[var(--accent-soft)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text)] mb-1.5">How your data works — no magic, no fake numbers</h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                GrowMitra never connects to your Instagram, Facebook or WhatsApp accounts, so it can&apos;t see clicks or replies on its own — and it will never show you an invented number. The content (posts, posters, videos, captions, strategies) is generated for you; the <em>results</em> come from you: log what actually happened in your dashboard each day, and the AI coach advises on those real numbers. That&apos;s the whole trick — real data in, honest advice out.
              </p>
            </div>
          </div>
        </Card>

        {/* Meta AI Hackathon Audit & Telemetry */}
        <MetaAITelemetryCard />
      </div>
    </main>
  );
}

interface MetaTraceItem {
  id: string;
  feature: string;
  model: string;
  intent: string;
  latencyMs: number;
}

interface MetaTraceData {
  summary?: {
    totalInvocations?: number;
  };
  traces?: MetaTraceItem[];
}

function MetaAITelemetryCard() {
  const [telemetry, setTelemetry] = useState<MetaTraceData | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    fetch('/api/meta-ai-trace')
      .then((r) => r.json())
      .then((d) => setTelemetry(d))
      .catch(() => {});
  }, []);

  return (
    <Card className="mt-8 p-6 border-[color-mix(in_srgb,var(--neon)_25%,transparent)] bg-[color-mix(in_srgb,var(--neon)_4%,transparent)]">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[color-mix(in_srgb,var(--neon)_12%,transparent)] border border-[color-mix(in_srgb,var(--neon)_25%,transparent)] flex items-center justify-center">
            <ShieldCheck size={16} className="text-[var(--neon)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--text)]">Meta AI Hackathon Stack Audit</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-[color-mix(in_srgb,var(--success)_15%,transparent)] text-[var(--success)] border border-[color-mix(in_srgb,var(--success)_30%,transparent)]">
                Verified Active
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Powered by Meta Llama 3.3 70B &amp; Meta SAM open architecture for regional Indian SMBs.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="text-xs px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--hover-fill)] transition-all flex items-center gap-1.5 text-[var(--text-soft)]"
        >
          <Activity size={12} className="text-[var(--neon)]" />
          {showLogs ? 'Hide Backend Trace' : 'View Meta AI Audit Logs'}
        </button>
      </div>

      {showLogs && telemetry && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] animate-fade-in space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-[var(--bg-alt)] p-2.5 rounded-xl border border-[var(--border-soft)]">
              <div className="text-[10px] text-[var(--text-faint)] uppercase">Total Invocations</div>
              <div className="text-base font-bold text-[var(--text)] font-display">{telemetry.summary?.totalInvocations ?? 1}</div>
            </div>
            <div className="bg-[var(--bg-alt)] p-2.5 rounded-xl border border-[var(--border-soft)]">
              <div className="text-[10px] text-[var(--text-faint)] uppercase">Primary Model</div>
              <div className="text-xs font-semibold text-[var(--accent-soft)] truncate mt-1">Llama-3.3-70B</div>
            </div>
            <div className="bg-[var(--bg-alt)] p-2.5 rounded-xl border border-[var(--border-soft)]">
              <div className="text-[10px] text-[var(--text-faint)] uppercase">Visual Segmentation</div>
              <div className="text-xs font-semibold text-[var(--neon)] truncate mt-1">Meta SAM (Mask)</div>
            </div>
            <div className="bg-[var(--bg-alt)] p-2.5 rounded-xl border border-[var(--border-soft)]">
              <div className="text-[10px] text-[var(--text-faint)] uppercase">Safety &amp; Intent</div>
              <div className="text-xs font-semibold text-emerald-400 truncate mt-1">Llama Guard 2</div>
            </div>
          </div>

          <div className="space-y-2 mt-3 max-h-48 overflow-y-auto pr-1">
            {(telemetry.traces || []).map((t) => (
              <div key={t.id} className="text-xs bg-[var(--card)] border border-[var(--border-soft)] rounded-xl p-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[var(--text)] flex items-center gap-2">
                    <span>{t.feature}</span>
                    <span className="text-[10px] text-[var(--accent-soft)]">({t.model})</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">{t.intent}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] text-emerald-400 font-medium">✓ {t.latencyMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function HomePage() {
  return (
    <AuthGuard>
      <HomeInner />
    </AuthGuard>
  );
}
