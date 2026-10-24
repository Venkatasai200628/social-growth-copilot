'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import {
  TrendingUp, Eye, MousePointerClick, Users, ArrowLeft,
  Check, ChevronDown, ChevronUp, Zap, RefreshCw,
  Edit3, CheckCircle, Brain, Package,
  ArrowUpRight, ArrowDownRight, Minus, Share2, Calendar, LineChart, Volume2, Wallet, Sparkles,
  Mic, MicOff,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Campaign, UserOrder } from '@/lib/types';
import { LANGUAGES } from '@/lib/india';
import AuthGuard from '@/app/components/AuthGuard';

import { useTheme } from '@/app/components/ThemeProvider';
import { Button, Card, LanguageSelect } from '@/app/components/ui';
import { authFetch, whatsappLink, copyText } from '@/lib/client';
import { speak, useSpeechRecognition } from '@/lib/use-speech';

const TABS = ['Overview', 'Strategy', 'Content Calendar', 'Ad Packages', 'AI Coach', 'ROI Calculator', 'Update Metrics'];

interface CoachData {
  headline: string;
  verdict: 'ahead' | 'on_track' | 'behind' | 'ready';
  analysis: string;
  actions: string[];
  whatsapp_script: string;
  metric_to_watch: string;
}

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

function DashboardPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { theme } = useTheme();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [order, setOrder] = useState<Partial<UserOrder>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [copied, setCopied] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [updateDay, setUpdateDay] = useState(1);
  const [actualMetrics, setActualMetrics] = useState({ reach: '', clicks: '', impressions: '', conversions: '' });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachData, setCoachData] = useState<CoachData | null>(null);
  const [coachError, setCoachError] = useState('');
  const [adPkgs, setAdPkgs] = useState('');
  const [adLoading, setAdLoading] = useState(false);
  const [retryingStrategy, setRetryingStrategy] = useState(false);

  // Voice diary (Update Metrics tab) — speak today's numbers instead of typing.
  const [voiceLang, setVoiceLang] = useState('english');
  const [voiceNote, setVoiceNote] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [voiceLoading, setVoiceLoading] = useState(false);
  const voiceSpeechCode = LANGUAGES.find((l) => l.id === voiceLang)?.speechCode ?? 'hi-IN';
  const speech = useSpeechRecognition(voiceSpeechCode);
  // speech.supported differs between server and client render (Web Speech API
  // is browser-only), so only trust it after mount to keep hydration stable.
  const [voiceMounted, setVoiceMounted] = useState(false);
  useEffect(() => setVoiceMounted(true), []);
  const voiceSupported = voiceMounted && speech.supported;

  useEffect(() => {
    const load = async () => {
      try {
        const [cs, os] = await Promise.all([
          getDoc(doc(db, 'campaigns', id)),
          getDoc(doc(db, 'orders', id)),
        ]);
        if (cs.exists()) setCampaign(cs.data() as Campaign);
        else {
          const lc = localStorage.getItem(`campaign_${id}`);
          if (lc) setCampaign(JSON.parse(lc));
        }
        if (os.exists()) setOrder(os.data() as UserOrder);
        else {
          const lo = localStorage.getItem(`order_${id}`);
          if (lo) setOrder(JSON.parse(lo));
        }
      } catch {
        const lc = localStorage.getItem(`campaign_${id}`);
        const lo = localStorage.getItem(`order_${id}`);
        if (lc) setCampaign(JSON.parse(lc));
        if (lo) setOrder(JSON.parse(lo));
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  // The strategy generates in the background after launch — poll until it
  // lands (or fails) instead of blocking the launch itself.
  const strategyGenerating = campaign != null && !campaign.strategy && (campaign as { strategyStatus?: string }).strategyStatus === 'generating';
  useEffect(() => {
    if (!strategyGenerating) return;
    const iv = setInterval(async () => {
      try {
        const cs = await getDoc(doc(db, 'campaigns', id));
        if (cs.exists()) setCampaign(cs.data() as Campaign);
      } catch {
        const lc = localStorage.getItem(`campaign_${id}`);
        if (lc) { try { setCampaign(JSON.parse(lc)); } catch { /* keep old */ } }
      }
    }, 8000);
    return () => clearInterval(iv);
  }, [strategyGenerating, id]);

  const retryStrategy = async () => {
    setRetryingStrategy(true);
    try {
      const res = await authFetch('/api/generate-strategy', { ...order, id, duration: metrics.length || 14 });
      if (res.ok) {
        const { strategy } = await res.json();
        const upd = { strategy: strategy || '', strategyStatus: 'ready', updatedAt: Date.now() };
        try { await updateDoc(doc(db, 'campaigns', id), upd); } catch { /* localStorage-only */ }
        setCampaign((c) => (c ? { ...c, ...upd } as Campaign : c));
      }
    } finally { setRetryingStrategy(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--text-muted)] text-sm">Loading your campaign…</p>
      </div>
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-[var(--text-soft)] mb-4">Campaign not found.</p>
        <button onClick={() => router.push('/my-campaigns')} className="text-[var(--accent-soft)] text-sm hover:underline">← My Campaigns</button>
      </div>
    </div>
  );

  const metrics = campaign.metrics || [];

  const totals = metrics.reduce((acc, m) => ({
    actReach: acc.actReach + (m.actual?.reach || 0),
    actClicks: acc.actClicks + (m.actual?.clicks || 0),
    actImpressions: acc.actImpressions + (m.actual?.impressions || 0),
    actConversions: acc.actConversions + (m.actual?.conversions || 0),
  }), { actReach: 0, actClicks: 0, actImpressions: 0, actConversions: 0 });

  const daysWithData = metrics.filter((m) => m.actual).length;
  const ctr = totals.actClicks && totals.actReach ? ((totals.actClicks / totals.actReach) * 100).toFixed(2) : '—';

  const chartData = metrics.filter((m) => m.actual).map((m) => ({
    day: `D${m.day}`,
    'Reach': m.actual?.reach || 0,
    'Clicks': m.actual?.clicks || 0,
  }));

  const handleSaveActual = async () => {
    setSaving(true);
    const updated = [...metrics];
    updated[updateDay - 1] = {
      ...updated[updateDay - 1],
      actual: {
        reach: Number(actualMetrics.reach) || 0,
        clicks: Number(actualMetrics.clicks) || 0,
        impressions: Number(actualMetrics.impressions) || 0,
        conversions: Number(actualMetrics.conversions) || 0,
      },
    };
    const updatedCampaign = { ...campaign, metrics: updated, updatedAt: Date.now() };
    try {
      await updateDoc(doc(db, 'campaigns', id), { metrics: updated, updatedAt: Date.now() });
    } catch {
      localStorage.setItem(`campaign_${id}`, JSON.stringify(updatedCampaign));
    }
    setCampaign(updatedCampaign);
    setSaving(false); setSaveSuccess(true); setCoachData(null);
    setTimeout(() => setSaveSuccess(false), 2000);
    setActualMetrics({ reach: '', clicks: '', impressions: '', conversions: '' });
  };

  const extractVoiceMetrics = async () => {
    const transcript = speech.transcript.trim();
    if (!transcript) return;
    setVoiceLoading(true); setVoiceError(''); setVoiceNote('');
    try {
      const res = await authFetch('/api/voice-metrics', { transcript, language: voiceLang });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setActualMetrics((prev) => ({
        ...prev,
        reach: String(d.reach ?? 0),
        clicks: String(d.clicks ?? 0),
        impressions: String(d.impressions ?? 0),
        conversions: String(d.conversions ?? 0),
      }));
      setVoiceNote(d.note || 'Numbers captured — check them and save.');
    } catch (e) {
      setVoiceError(e instanceof Error ? e.message : 'Could not extract the numbers — please type them instead.');
    } finally { setVoiceLoading(false); }
  };

  const getCoach = async () => {
    setCoachLoading(true); setCoachError('');
    try {
      const day = updateDay;
      const res = await authFetch('/api/ai-coach', {
        businessName: order.businessName,
        category: order.businessCategory,
        goal: order.goal,
        platforms: order.platforms || [],
        day,
        totalDays: metrics.length,
        language: 'english',
        efficiency: order.promotionEfficiency,
        actual: metrics[day - 1]?.actual,
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setCoachData(d);
    } catch (e) {
      setCoachError(e instanceof Error ? e.message : 'Coach is unavailable right now — try again shortly.');
    } finally { setCoachLoading(false); }
  };

  const loadAdPackages = async () => {
    if (adPkgs || adLoading) return;
    setAdLoading(true);
    try {
      const res = await authFetch('/api/ad-packages', {
        businessName: order.businessName || 'Business',
        category: order.businessCategory || 'Local Business',
        productDescription: order.productDescription || `${order.businessCategory || 'Our products'} campaign`,
        goal: order.goal || 'Drive Sales / Conversions',
        platforms: order.platforms || ['Instagram'],
        price: order.budget || 5000,
        duration: metrics.length || 7,
        language: 'english',
      });
      const d = await res.json();
      setAdPkgs(d.packages || d.error || 'Could not load ad packages.');
    } catch {
      setAdPkgs('Could not load ad packages — please try again.');
    } finally { setAdLoading(false); }
  };

  // Theme-aware chart colors
  const isLight = theme === 'light';
  const gridColor = isLight ? '#e6e2f4' : '#1e1e2e';
  const tickStyle = { fill: isLight ? '#6a6f8a' : '#64748b', fontSize: 11 };
  const tooltipStyle = {
    background: isLight ? '#ffffff' : '#16161f',
    border: `1px solid ${isLight ? '#e6e2f4' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 12,
    color: isLight ? '#191a2e' : '#e2e8f0',
    fontFamily: 'Poppins',
  };

  const verdictColor: Record<string, string> = {
    ahead: '#10b981', on_track: isLight ? '#0891b2' : '#22d3ee', behind: '#ef4444', ready: '#f59e0b',
  };
  const verdictIcon: Record<string, typeof ArrowUpRight> = {
    ahead: ArrowUpRight, on_track: Minus, behind: ArrowDownRight, ready: Zap,
  };

  const hasStrategy = campaign.strategy.length > 0;
  const calIdx = campaign.strategy.indexOf('## 📅');
  const calEnd = campaign.strategy.indexOf('\n## 🚀', calIdx);
  const calendarSection = calIdx > -1 ? campaign.strategy.slice(calIdx, calEnd > -1 ? calEnd : undefined) : campaign.strategy;
  const stratSection = calIdx > -1 ? campaign.strategy.slice(0, calIdx) + (calEnd > -1 ? campaign.strategy.slice(calEnd) : '') : campaign.strategy;

  const campaignSpend = order.budget || 0;
  const cpm = totals.actReach > 0 && campaignSpend > 0 ? ((campaignSpend / totals.actReach) * 1000).toFixed(2) : '—';
  const cpc = totals.actClicks > 0 && campaignSpend > 0 ? (campaignSpend / totals.actClicks).toFixed(2) : '—';
  const cpa = totals.actConversions > 0 && campaignSpend > 0 ? (campaignSpend / totals.actConversions).toFixed(2) : '—';

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[600px] h-[600px] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] top-[-200px] right-[-150px]" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
          <button onClick={() => router.push('/my-campaigns')}
            className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] text-sm transition-colors">
            <ArrowLeft size={14} /> My Campaigns
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[color-mix(in_srgb,var(--success)_10%,transparent)] border border-[color-mix(in_srgb,var(--success)_25%,transparent)] rounded-full px-4 py-1.5 text-xs text-[var(--success)]">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" /> Campaign Active
            </div>
            <button onClick={() => router.push(`/dashboard/${id}/share`)}
              className="flex items-center gap-1.5 text-xs bg-[var(--hover-fill)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-all">
              <Share2 size={11} /> Share
            </button>
          </div>
        </div>

        <h1 className="font-display text-3xl font-bold text-[var(--text)] mb-1">
          {order.businessName || 'Campaign Dashboard'}
        </h1>
        <p className="text-[var(--text-muted)] text-sm mb-8">
          {metrics.length}-day campaign · ID: {id.slice(0, 8)}…
        </p>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Reach', value: daysWithData > 0 ? totals.actReach.toLocaleString() : '—', icon: Eye, color: 'var(--accent)', sub: 'From your logged numbers' },
            { label: 'Clicks', value: daysWithData > 0 ? totals.actClicks.toLocaleString() : '—', icon: MousePointerClick, color: 'var(--neon)', sub: 'From your logged numbers' },
            { label: 'Impressions', value: daysWithData > 0 ? totals.actImpressions.toLocaleString() : '—', icon: TrendingUp, color: 'var(--success)', sub: 'From your logged numbers' },
            { label: 'Conversions', value: daysWithData > 0 ? totals.actConversions.toLocaleString() : '—', icon: Users, color: 'var(--gold)', sub: 'From your logged numbers' },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[var(--text-muted)]">{label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
                  <Icon size={13} style={{ color }} />
                </div>
              </div>
              <div className="text-2xl font-display font-bold text-[var(--text)] mb-0.5">{value}</div>
              {sub && <div className="text-xs text-[var(--text-faint)]">{sub}</div>}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-1 mb-8 overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'Ad Packages') loadAdPackages(); }}
              aria-pressed={activeTab === tab}
              className={`flex-1 min-w-fit text-xs py-2.5 px-3 rounded-xl transition-all whitespace-nowrap ${activeTab === tab ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <div className="bg-[color-mix(in_srgb,var(--accent)_6%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] rounded-2xl px-5 py-4 text-xs text-[var(--text-muted)] leading-relaxed">
              <strong className="text-[var(--text-soft)]">Where these numbers come from:</strong> GrowMitra does not track your accounts automatically. Every figure below is what you logged in the Update Metrics tab (from Instagram Insights, Meta Ads Manager or WhatsApp Business). Nothing here is a guess — and there are no projections.
            </div>
            {daysWithData === 0 ? (
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] flex items-center justify-center mx-auto mb-4">
                  <LineChart size={22} className="text-[var(--accent-soft)]" />
                </div>
                <h3 className="font-display text-lg font-bold text-[var(--text)] mb-2">No numbers logged yet</h3>
                <p className="text-[var(--text-muted)] text-sm mb-6 max-w-md mx-auto">Charts appear as soon as you log your first real numbers. Open Update Metrics, enter what today actually did (takes 30 seconds), and this dashboard fills with data that is 100% yours.</p>
                <button onClick={() => setActiveTab('Update Metrics')}
                  className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-full text-white [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]">
                  <Edit3 size={13} /> Log today&apos;s numbers
                </button>
              </div>
            ) : (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6">
              <h3 className="text-sm text-[var(--text)] mb-6 flex items-center gap-2"><LineChart size={14} className="text-[var(--accent-soft)]" />Reach — from your logged days</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="day" stroke={tickStyle.fill} tick={tickStyle} />
                  <YAxis stroke={tickStyle.fill} tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, color: tickStyle.fill }} />
                  <Area type="monotone" dataKey="Reach" stroke="#10b981" strokeWidth={2} fill="url(#actGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            )}

            {daysWithData > 0 && (
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6">
              <h3 className="text-sm text-[var(--text)] mb-6 flex items-center gap-2"><MousePointerClick size={14} className="text-[var(--neon)]" />Clicks — from your logged days</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="day" stroke={tickStyle.fill} tick={tickStyle} />
                  <YAxis stroke={tickStyle.fill} tick={tickStyle} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12, color: tickStyle.fill }} />
                  <Bar dataKey="Clicks" fill={isLight ? '#0891b2' : '#22d3ee'} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            )}

            {/* Day table */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6">
              <h3 className="text-sm text-[var(--text)] mb-4 flex items-center gap-2"><Calendar size={14} className="text-[var(--accent-soft)]" />Day-by-Day — your logged numbers</h3>
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-xs min-w-[540px]">
                  <thead>
                    <tr className="text-[var(--text-muted)] border-b border-[var(--border)]">
                      {['Day', 'Reach', 'Clicks', 'Impressions', 'Conversions', 'Status'].map((h) => (
                        <th key={h} className={`py-2 ${h === 'Day' ? 'text-left' : 'text-right'} pr-4 font-medium`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((m) => {
                      const hasActual = !!m.actual;
                      return (
                        <tr key={m.day} className="border-b border-[var(--border-soft)] hover:bg-[var(--hover-fill)]">
                          <td className="py-2.5 pr-4 text-[var(--text-soft)]">Day {m.day}</td>
                          <td className="text-right py-2.5 pr-4 text-[var(--text-muted)]">{hasActual ? m.actual!.reach.toLocaleString() : '—'}</td>
                          <td className="text-right py-2.5 pr-4 text-[var(--text-muted)]">{hasActual ? m.actual!.clicks.toLocaleString() : '—'}</td>
                          <td className="text-right py-2.5 pr-4 text-[var(--text-muted)]">{hasActual ? (m.actual!.impressions || 0).toLocaleString() : '—'}</td>
                          <td className="text-right py-2.5 pr-4 text-[var(--text-muted)]">{hasActual ? (m.actual!.conversions || 0).toLocaleString() : '—'}</td>
                          <td className="text-right py-2.5">
                            {hasActual ? <span className="text-[var(--success)]">✓ Logged</span> : <span className="text-[var(--text-faint)]">Not yet</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── STRATEGY ── */}
        {activeTab === 'Strategy' && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold text-[var(--text)]">AI-Generated Strategy</h3>
              <button onClick={async () => { if (await copyText(campaign.strategy)) { setCopied(true); setTimeout(() => setCopied(false), 2000); } }}
                className="flex items-center gap-2 text-xs bg-[var(--hover-fill)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text-muted)] hover:text-[var(--text)] transition-all">
                {copied ? <><Check size={11} className="text-[var(--success)]" />Copied</> : <><Check size={11} />Copy All</>}
              </button>
            </div>
            <div className="prose-output" dangerouslySetInnerHTML={{ __html: parseMarkdown(stratSection) }} />
          </div>
        )}

        {/* ── STRATEGY: building in background ── */}
        {activeTab === 'Strategy' && strategyGenerating && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-10 text-center">
            <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="font-display text-lg font-bold text-[var(--text)] mb-2">Your AI strategy is being written…</h3>
            <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto">It usually takes a minute. This page updates itself when it lands — meanwhile, the Content Calendar may already have material.</p>
          </div>
        )}

        {/* ── STRATEGY: generation failed — offer retry ── */}
        {activeTab === 'Strategy' && (campaign as { strategyStatus?: string }).strategyStatus === 'failed' && !campaign.strategy && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-10 text-center">
            <h3 className="font-display text-lg font-bold text-[var(--text)] mb-2">The strategy didn&apos;t generate</h3>
            <p className="text-[var(--text-muted)] text-sm max-w-md mx-auto mb-6">The AI call failed (usually a temporary network or service hiccup). Your campaign and tracking are fine — retry below.</p>
            <button onClick={retryStrategy} disabled={retryingStrategy}
              className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-full text-white [background:linear-gradient(135deg,var(--accent),var(--accent-soft))] disabled:opacity-50">
              {retryingStrategy ? 'Retrying…' : 'Retry strategy generation'}
            </button>
          </div>
        )}

        {/* ── CONTENT CALENDAR ── */}
        {activeTab === 'Content Calendar' && !hasStrategy && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-10 text-center text-[var(--text-muted)] text-sm">
            {strategyGenerating ? 'The calendar is part of your AI strategy — still building. This page updates itself when it lands.' : 'The calendar comes with your AI strategy. Open the Strategy tab to generate or retry it.'}
          </div>
        )}
        {activeTab === 'Content Calendar' && hasStrategy && (
          <div className="space-y-4">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8">
              <h3 className="font-display text-lg font-bold text-[var(--text)] mb-6 flex items-center gap-2"><Calendar size={16} className="text-[var(--accent-soft)]" />Full Content Calendar</h3>
              <div className="prose-output" dangerouslySetInnerHTML={{ __html: parseMarkdown(calendarSection) }} />
            </div>
            <div className="space-y-2">
              {metrics.map((m) => (
                <div key={m.day} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
                  <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--hover-fill)] transition-colors"
                    onClick={() => setExpandedDay(expandedDay === m.day ? null : m.day)}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--accent-soft)] font-medium">Day {m.day}</span>
                      <span className="text-sm text-[var(--text-muted)]">{m.date}</span>
                      {m.actual && <span className="text-xs text-[var(--success)]">✓ Updated</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                      {m.actual ? <span className="text-[var(--success)]">{m.actual.reach.toLocaleString()} reach logged</span> : <span>Not logged yet</span>}
                      {expandedDay === m.day ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </button>
                  {expandedDay === m.day && (
                    <div className="px-5 pb-5 border-t border-[var(--border-soft)] pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Reach', a: m.actual?.reach },
                          { label: 'Clicks', a: m.actual?.clicks },
                          { label: 'Impressions', a: m.actual?.impressions },
                          { label: 'Conversions', a: m.actual?.conversions },
                        ].map(({ label, a }) => (
                          <div key={label} className="bg-[var(--bg-alt)] rounded-xl p-3 border border-[var(--border-soft)]">
                            <div className="text-xs text-[var(--text-muted)] mb-1">{label}</div>
                            <div className="text-sm text-[var(--text)]">{a !== undefined ? a.toLocaleString() : '—'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AD PACKAGES (real data from /api/ad-packages) ── */}
        {activeTab === 'Ad Packages' && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-2">
              <Package size={18} className="text-[var(--neon)]" />
              <h3 className="font-display text-lg font-bold text-[var(--text)]">Platform Ad Packages</h3>
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-6">Ready-to-use ad copy, targeting and budgets for each platform — generated for this campaign.</p>
            {adLoading ? (
              <div className="py-14 text-center">
                <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-[var(--text-muted)] animate-pulse">Writing your ad packages…</p>
              </div>
            ) : (
              <div className="prose-output" dangerouslySetInnerHTML={{ __html: parseMarkdown(adPkgs) }} />
            )}
          </div>
        )}

        {/* ── AI COACH ── */}
        {activeTab === 'AI Coach' && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-2">
              <Brain size={18} className="text-[var(--accent-soft)]" />
              <h3 className="font-display text-lg font-bold text-[var(--text)]">AI Performance Coach</h3>
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-6">
              {daysWithData === 0
                ? 'Update your daily metrics first — the coach reads your real numbers.'
                : `Based on ${daysWithData} day${daysWithData > 1 ? 's' : ''} of logged data. Coaching for Day ${updateDay}.`}
            </p>
            {daysWithData === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] flex items-center justify-center mx-auto mb-4">
                  <Brain size={22} className="text-[var(--accent-soft)]" />
                </div>
                <p className="text-[var(--text-muted)] text-sm mb-5">No data yet — enter your day-1 numbers and come back.</p>
                <button onClick={() => setActiveTab('Update Metrics')}
                  className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-full text-white [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]">
                  <Edit3 size={13} /> Enter Day 1 Metrics
                </button>
              </div>
            ) : (
              <div>
                {/* Day selector */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {metrics.filter((m) => m.actual).map((m) => (
                    <button key={m.day} onClick={() => setUpdateDay(m.day)}
                      className={`w-10 h-10 rounded-xl text-xs border transition-all ${updateDay === m.day ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
                      {m.day}
                    </button>
                  ))}
                </div>

                {!coachData && (
                  <button onClick={getCoach} disabled={coachLoading}
                    className="w-full py-4 rounded-2xl text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]">
                    {coachLoading ? <><RefreshCw size={15} className="animate-spin" />Analysing your numbers…</> : <><Brain size={15} />Get AI Coaching for Day {updateDay}</>}
                  </button>
                )}
                {coachError && <p className="text-xs text-[var(--danger)] mt-3">{coachError}</p>}

                {coachData && (() => {
                  const VIcon = verdictIcon[coachData.verdict] || Zap;
                  const vColor = verdictColor[coachData.verdict] || 'var(--accent-soft)';
                  return (
                    <div className="space-y-4 animate-slide-up">
                      <div className="p-4 rounded-2xl border" style={{ background: `color-mix(in srgb, ${vColor} 8%, transparent)`, borderColor: `color-mix(in srgb, ${vColor} 30%, transparent)` }}>
                        <div className="flex items-start gap-3">
                          <VIcon size={20} style={{ color: vColor }} className="mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-[var(--text)]">{coachData.headline}</div>
                            <div className="text-xs text-[var(--text-muted)] capitalize mt-0.5">{coachData.verdict?.replace(/_/g, ' ')}</div>
                            <p className="text-sm text-[var(--text-soft)] leading-relaxed mt-2">{coachData.analysis}</p>
                            <button onClick={() => speak(`${coachData.headline}. ${coachData.analysis}`, 'hi-IN')}
                              className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--accent-soft)] hover:underline">
                              <Volume2 size={12} />Read aloud
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(coachData.actions || []).map((action, i) => (
                          <div key={i} className="flex items-start gap-3 bg-[var(--bg-alt)] border border-[var(--border)] rounded-xl p-4">
                            <span className="text-[var(--accent-soft)] text-xs mt-0.5 flex-shrink-0 font-semibold">{i + 1}.</span>
                            <p className="text-sm text-[var(--text-soft)]">{action}</p>
                          </div>
                        ))}
                      </div>
                      <div className="bg-[#25d366]/10 border border-[#25d366]/25 rounded-2xl p-4">
                        <p className="text-xs uppercase tracking-widest text-[#128c4b] [[data-theme=dark]_&]:text-[#25d366] mb-2 flex items-center gap-1.5"><Wallet size={12} />Forward this to your team on WhatsApp</p>
                        <p className="text-sm text-[var(--text-soft)] leading-relaxed mb-3">{coachData.whatsapp_script}</p>
                        <a href={whatsappLink(undefined, coachData.whatsapp_script)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-full text-white bg-[#25d366] hover:bg-[#1aad55] transition-colors">
                          <Wallet size={12} />Send
                        </a>
                      </div>
                      {coachData.metric_to_watch && (
                        <p className="text-xs text-[var(--gold)] flex items-center gap-1.5"><Sparkles size={12} />Watch this metric tomorrow: <span className="text-[var(--text-soft)]">{coachData.metric_to_watch}</span></p>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── ROI CALCULATOR ── */}
        {activeTab === 'ROI Calculator' && (
          <div className="space-y-6">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={18} className="text-[var(--success)]" />
                <h3 className="font-display text-lg font-bold text-[var(--text)]">ROI Calculator</h3>
              </div>
              <p className="text-[var(--text-muted)] text-sm mb-8">
                {daysWithData === 0 ? 'Update your daily metrics to unlock real ROI data.' : `Based on ${daysWithData} of ${metrics.length} days tracked · spend ₹${campaignSpend.toLocaleString('en-IN')}.`}
              </p>
              {daysWithData === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] flex items-center justify-center mx-auto mb-4">
                    <TrendingUp size={22} className="text-[var(--accent-soft)]" />
                  </div>
                  <p className="text-[var(--text-muted)] text-sm mb-5">No actual data yet — enter your results first.</p>
                  <button onClick={() => setActiveTab('Update Metrics')}
                    className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-full text-white [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]">
                    <Edit3 size={13} /> Enter Metrics
                  </button>
                </div>
              ) : (
                <>
                  {campaignSpend === 0 && (
                    <div className="bg-[color-mix(in_srgb,var(--gold)_8%,transparent)] border border-[color-mix(in_srgb,var(--gold)_25%,transparent)] rounded-2xl px-5 py-4 mb-6 text-xs text-[var(--text-muted)]">
                      No budget was set for this campaign, so spend-based metrics (CPM, CPC, cost per conversion) stay hidden. Add a budget in Update Metrics later to unlock them.
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Campaign Spend', value: `₹${campaignSpend.toLocaleString('en-IN')}`, color: 'var(--accent-soft)' },
                      { label: 'CPM (per 1000 reach)', value: `₹${cpm}`, color: 'var(--neon)' },
                      { label: 'Cost Per Click', value: `₹${cpc}`, color: 'var(--gold)' },
                      { label: 'Cost Per Conversion', value: `₹${cpa}`, color: 'var(--success)' },
                      { label: 'Click-Through Rate', value: `${ctr}%`, color: 'var(--accent-soft)' },
                      { label: 'Days Tracked', value: `${daysWithData}/${metrics.length}`, color: 'var(--gold)' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-[var(--bg-alt)] border border-[var(--border)] rounded-2xl p-4 text-center">
                        <div className="text-xs text-[var(--text-muted)] mb-2">{label}</div>
                        <div className="text-xl font-display font-bold" style={{ color }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── UPDATE METRICS ── */}
        {activeTab === 'Update Metrics' && (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-2">
              <Edit3 size={18} className="text-[var(--accent-soft)]" />
              <h3 className="font-display text-lg font-bold text-[var(--text)]">Update Daily Results</h3>
            </div>
            <p className="text-[var(--text-muted)] text-sm mb-2">Enter your actual numbers each day — 30 seconds that make the AI coach smart.</p>
            <p className="text-xs text-[var(--text-faint)] mb-6 leading-relaxed">Where to find them: <strong>Reach</strong> &amp; <strong>Impressions</strong> in Instagram/Facebook Insights, <strong>Clicks</strong> in Meta Ads Manager or your link shortener, <strong>Conversions</strong> = sales or enquiries you can attribute to the post. GrowMitra never fills these in for you.</p>

            <div className="mb-6">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-3">Select Day</p>
              <div className="flex flex-wrap gap-2">
                {metrics.map((m) => (
                  <button key={m.day} onClick={() => setUpdateDay(m.day)} aria-pressed={updateDay === m.day}
                    className={`w-10 h-10 rounded-xl text-xs border transition-all ${updateDay === m.day ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : m.actual ? 'bg-[color-mix(in_srgb,var(--success)_10%,transparent)] border-[color-mix(in_srgb,var(--success)_30%,transparent)] text-[var(--success)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
                    {m.day}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[var(--bg-alt)] border border-[var(--border)] rounded-2xl p-4 mb-6 text-xs text-[var(--text-muted)] flex flex-wrap gap-6">
              <span>Day {updateDay} of {metrics.length} · {metrics[updateDay - 1]?.date}</span>
              {metrics[updateDay - 1]?.actual && <span className="text-[var(--success)]">Already logged — save again to overwrite</span>}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                { key: 'reach', label: 'Actual Reach', placeholder: 'How many people saw your content?' },
                { key: 'clicks', label: 'Actual Clicks', placeholder: 'Link clicks / profile visits' },
                { key: 'impressions', label: 'Actual Impressions', placeholder: 'Total impressions across posts' },
                { key: 'conversions', label: 'Actual Conversions', placeholder: 'Sales / leads / sign-ups' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2" htmlFor={`m-${key}`}>{label}</label>
                  <input id={`m-${key}`} type="number" placeholder={placeholder}
                    value={actualMetrics[key as keyof typeof actualMetrics]}
                    onChange={(e) => setActualMetrics((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent)] outline-none text-sm" />
                </div>
              ))}
            </div>

            {/* Voice diary — speak today's numbers */}
            <Card className="p-5 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Mic size={14} className="text-[var(--accent-soft)]" />
                <h4 className="text-sm font-medium text-[var(--text)]">Speak today&apos;s numbers</h4>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Too busy to type? Say it out loud in whatever language comes naturally — &quot;4200 reach and 60 orders today&quot; — and we&apos;ll fill the fields above (your speech is understood in any language; everything we write stays English).
              </p>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <LanguageSelect
                  value={voiceLang}
                  onChange={setVoiceLang}
                  className="w-auto mt-0 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none"
                />
                {voiceSupported && (
                  <button type="button" onClick={() => (speech.listening ? speech.stop() : speech.start())}
                    aria-label={speech.listening ? 'Stop voice input' : 'Start voice input'}
                    className={`inline-flex items-center gap-2 text-xs px-4 py-2.5 rounded-full border transition-all ${
                      speech.listening
                        ? 'bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] border-[color-mix(in_srgb,var(--danger)_40%,transparent)] text-[var(--danger)] animate-pulse'
                        : 'bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border-[color-mix(in_srgb,var(--accent)_25%,transparent)] text-[var(--accent-soft)] hover:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]'
                    }`}>
                    {speech.listening ? <MicOff size={13} /> : <Mic size={13} />}
                    {speech.listening ? 'Listening… tap to stop' : 'Tap & speak'}
                  </button>
                )}
                <Button variant="ghost" size="sm" onClick={extractVoiceMetrics} loading={voiceLoading}
                  disabled={!speech.transcript.trim() || voiceLoading}>
                  <Sparkles size={13} /> Extract numbers
                </Button>
              </div>
              <textarea
                value={speech.transcript}
                onChange={(e) => speech.setTranscript(e.target.value)}
                rows={2}
                aria-label="Today's numbers, spoken or typed"
                placeholder={voiceSupported
                  ? 'What you sold today — speak it above or type it here…'
                  : "Your browser doesn't support voice — type what you sold today instead"}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-4 py-3 text-[var(--text)] placeholder:text-[var(--text-faint)] focus:border-[var(--accent)] outline-none text-sm resize-none"
              />
              {speech.listening && speech.interim && (
                <p className="text-xs text-[var(--accent-soft)] mt-1.5 animate-pulse">{speech.interim}</p>
              )}
              {speech.error && <p className="text-xs text-[var(--gold)] mt-1.5">{speech.error}</p>}
              {!voiceSupported && (
                <p className="text-xs text-[var(--text-faint)] mt-1.5">
                  Your browser doesn&apos;t support voice — type what you sold today instead.
                </p>
              )}
              {voiceNote && <p className="text-xs text-[var(--success)] mt-1.5">{voiceNote}</p>}
              {voiceError && <p className="text-xs text-[var(--danger)] mt-1.5">{voiceError}</p>}
            </Card>

            <button onClick={handleSaveActual} disabled={saving}
              className="w-full py-4 rounded-2xl text-white text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-60 [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]">
              {saving ? <><RefreshCw size={15} className="animate-spin" />Saving…</>
                : saveSuccess ? <><CheckCircle size={15} className="text-white" />Saved! Dashboard updated</>
                : <><Zap size={15} />Save Day {updateDay} Results</>}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AuthGuard>
      <DashboardPageInner params={params} />
    </AuthGuard>
  );
}
