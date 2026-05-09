'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';
import {
  TrendingUp, Eye, MousePointerClick, Users, ArrowLeft,
  Copy, Check, ChevronDown, ChevronUp, Zap, RefreshCw,
  Edit3, CheckCircle, Brain, Package, Loader2,
  ArrowUpRight, ArrowDownRight, Minus, Share2,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Campaign, UserOrder, DayMetric } from '@/lib/types';
import { PLANS } from '@/lib/plans';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';

const TABS = ['Overview', 'Strategy', 'Content Calendar', 'Ad Packages', 'AI Coach', 'ROI Calculator', 'Update Metrics'];

function parseMarkdown(text: string) {
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^\*\*(.+)\*\*$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
    .replace(/<p><\/p>/g, '');
}

function DashboardPageInner({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
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
  const [coachData, setCoachData] = useState<{verdict:string;analysis:string;actions:string[]} | null>(null);

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 text-sm font-light">Loading your campaign...</p>
      </div>
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-400 mb-4 font-light">Campaign not found.</p>
        <button onClick={() => router.push('/my-campaigns')} className="text-violet-400 text-sm font-light">← My Campaigns</button>
      </div>
    </div>
  );

  const metrics = campaign.metrics || [];
  const plan = PLANS.find(p => p.id === order.planId) || PLANS[0];

  const totals = metrics.reduce((acc, m) => ({
    projReach: acc.projReach + m.projected.reach,
    projClicks: acc.projClicks + m.projected.clicks,
    actReach: acc.actReach + (m.actual?.reach || 0),
    actClicks: acc.actClicks + (m.actual?.clicks || 0),
    actConversions: acc.actConversions + (m.actual?.conversions || 0),
  }), { projReach: 0, projClicks: 0, actReach: 0, actClicks: 0, actConversions: 0 });

  const daysWithData = metrics.filter(m => m.actual).length;
  const ctr = totals.actClicks && totals.actReach ? ((totals.actClicks / totals.actReach) * 100).toFixed(2) : '—';

  const chartData = metrics.map(m => ({
    day: `D${m.day}`,
    'Projected Reach': m.projected.reach,
    'Actual Reach': m.actual?.reach || 0,
    'Projected Clicks': m.projected.clicks,
    'Actual Clicks': m.actual?.clicks || 0,
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
    setSaving(false); setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
    setActualMetrics({ reach: '', clicks: '', impressions: '', conversions: '' });
  };

  const verdictColor: Record<string, string> = {
    above_target: '#10b981', on_track: '#22d3ee', below_target: '#ef4444', ready: '#f59e0b',
  };
  const verdictIcon: Record<string, typeof ArrowUpRight> = {
    above_target: ArrowUpRight, on_track: Minus, below_target: ArrowDownRight, ready: Zap,
  };

  const calIdx = campaign.strategy.indexOf('## 📅');
  const calEnd = campaign.strategy.indexOf('\n## 🚀', calIdx);
  const calendarSection = calIdx > -1 ? campaign.strategy.slice(calIdx, calEnd > -1 ? calEnd : undefined) : campaign.strategy;
  const stratSection = calIdx > -1 ? campaign.strategy.slice(0, calIdx) + (calEnd > -1 ? campaign.strategy.slice(calEnd) : '') : campaign.strategy;

  // ROI data
  const campaignSpend = order.price || 999;
  const reachEff = totals.projReach > 0 ? Math.round((totals.actReach / totals.projReach) * 100) : 0;
  const cpm = totals.actReach > 0 ? ((campaignSpend / totals.actReach) * 1000).toFixed(2) : '—';
  const cpc = totals.actClicks > 0 ? (campaignSpend / totals.actClicks).toFixed(2) : '—';
  const cpa = totals.actConversions > 0 ? (campaignSpend / totals.actConversions).toFixed(2) : '—';

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[600px] h-[600px] bg-violet-600/8 top-[-200px] right-[-150px]" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.push('/my-campaigns')}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm font-light transition-colors">
            <ArrowLeft size={14} /> My Campaigns
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 text-xs text-green-400 font-light">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Campaign Active
            </div>
            <button onClick={() => router.push(`/dashboard/${id}/share`)}
              className="flex items-center gap-1.5 text-xs bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-slate-400 hover:bg-white/[0.08] transition-all font-light">
              <Share2 size={11} /> Share
            </button>
          </div>
        </div>

        <h1 className="text-3xl font-light text-white mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {order.businessName || 'Campaign Dashboard'}
        </h1>
        <p className="text-slate-500 text-sm font-light mb-8">
          {plan.name} Plan · {metrics.length}-day campaign · ID: {id.slice(0, 8)}...
        </p>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Projected Reach', value: totals.projReach.toLocaleString(), icon: Eye, color: '#7c3aed', sub: 'Total campaign' },
            { label: 'Actual Reach', value: daysWithData > 0 ? totals.actReach.toLocaleString() : '—', icon: TrendingUp, color: '#10b981', sub: `${daysWithData} days tracked` },
            { label: 'Actual Clicks', value: daysWithData > 0 ? totals.actClicks.toLocaleString() : '—', icon: MousePointerClick, color: '#22d3ee', sub: `CTR: ${ctr}%` },
            { label: 'Conversions', value: daysWithData > 0 ? totals.actConversions.toLocaleString() : '—', icon: Users, color: '#f59e0b', sub: 'Total tracked' },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="bg-[#16161f] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500 font-light">{label}</span>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                  <Icon size={13} style={{ color }} />
                </div>
              </div>
              <div className="text-2xl font-light text-white mb-0.5" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{value}</div>
              <div className="text-xs text-slate-600 font-light">{sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#16161f] border border-white/[0.06] rounded-2xl p-1 mb-8 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 min-w-fit text-xs font-light py-2.5 px-3 rounded-xl transition-all whitespace-nowrap"
              style={{ background: activeTab === tab ? '#7c3aed' : 'transparent', color: activeTab === tab ? 'white' : '#64748b' }}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6">
              <h3 className="text-sm font-light text-white mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>📈 Reach — Projected vs Actual</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                  <XAxis dataKey="day" stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, color: '#e2e8f0', fontFamily: 'Outfit' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
                  <Area type="monotone" dataKey="Projected Reach" stroke="#7c3aed" strokeWidth={2} fill="url(#projGrad)" />
                  <Area type="monotone" dataKey="Actual Reach" stroke="#10b981" strokeWidth={2} fill="url(#actGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6">
              <h3 className="text-sm font-light text-white mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>🖱️ Clicks — Projected vs Actual</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                  <XAxis dataKey="day" stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis stroke="#334155" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, color: '#e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
                  <Bar dataKey="Projected Clicks" fill="#7c3aed" radius={[4,4,0,0]} opacity={0.6} />
                  <Bar dataKey="Actual Clicks" fill="#22d3ee" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Day table */}
            <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6">
              <h3 className="text-sm font-light text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>📅 Day-by-Day Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-white/[0.06]">
                      {['Day','Proj. Reach','Act. Reach','Proj. Clicks','Act. Clicks','Status'].map(h => (
                        <th key={h} className={`py-2 ${h === 'Day' ? 'text-left' : 'text-right'} pr-4 font-light`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map(m => {
                      const hasActual = !!m.actual;
                      const diff = hasActual ? ((m.actual!.reach - m.projected.reach) / m.projected.reach * 100).toFixed(0) : null;
                      return (
                        <tr key={m.day} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                          <td className="py-2.5 pr-4 font-light text-slate-300">Day {m.day}</td>
                          <td className="text-right py-2.5 pr-4 text-slate-400 font-light">{m.projected.reach.toLocaleString()}</td>
                          <td className="text-right py-2.5 pr-4 font-light">
                            {hasActual ? (
                              <span style={{ color: Number(diff) >= 0 ? '#10b981' : '#ef4444' }}>
                                {m.actual!.reach.toLocaleString()}
                                <span className="ml-1 text-[10px]">({Number(diff) >= 0 ? '+' : ''}{diff}%)</span>
                              </span>
                            ) : <span className="text-slate-600">—</span>}
                          </td>
                          <td className="text-right py-2.5 pr-4 text-slate-400 font-light">{m.projected.clicks.toLocaleString()}</td>
                          <td className="text-right py-2.5 pr-4 text-slate-400 font-light">{hasActual ? m.actual!.clicks.toLocaleString() : '—'}</td>
                          <td className="text-right py-2.5 font-light">
                            {hasActual ? <span className="text-green-400">✓ Updated</span> : <span className="text-slate-600">Pending</span>}
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
          <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-light text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>AI-Generated Strategy</h3>
              <button onClick={() => { navigator.clipboard.writeText(campaign.strategy); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="flex items-center gap-2 text-xs bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-slate-400 hover:bg-white/[0.08] transition-all font-light">
                {copied ? <><Check size={11} className="text-green-400" />Copied</> : <><Copy size={11} />Copy All</>}
              </button>
            </div>
            <div className="prose-output" dangerouslySetInnerHTML={{ __html: parseMarkdown(stratSection) }} />
          </div>
        )}

        {/* ── CONTENT CALENDAR ── */}
        {activeTab === 'Content Calendar' && (
          <div className="space-y-4">
            <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-8">
              <h3 className="text-lg font-light text-white mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>📅 Full Content Calendar</h3>
              <div className="prose-output" dangerouslySetInnerHTML={{ __html: parseMarkdown(calendarSection) }} />
            </div>
            <div className="space-y-2">
              {metrics.map(m => (
                <div key={m.day} className="bg-[#16161f] border border-white/[0.06] rounded-2xl overflow-hidden">
                  <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpandedDay(expandedDay === m.day ? null : m.day)}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-light px-2.5 py-1 rounded-full bg-violet-600/20 text-violet-300">Day {m.day}</span>
                      <span className="text-sm text-slate-400 font-light">{m.date}</span>
                      {m.actual && <span className="text-xs text-green-400 font-light">✓ Updated</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-light">
                      <span>~{m.projected.reach.toLocaleString()} reach</span>
                      {expandedDay === m.day ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </button>
                  {expandedDay === m.day && (
                    <div className="px-5 pb-5 border-t border-white/[0.04] pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Proj. Reach', v: m.projected.reach, a: m.actual?.reach, color: '#7c3aed' },
                          { label: 'Proj. Clicks', v: m.projected.clicks, a: m.actual?.clicks, color: '#22d3ee' },
                          { label: 'Impressions', v: m.projected.impressions, a: m.actual?.impressions, color: '#f59e0b' },
                          { label: 'Conversions', v: m.projected.conversions, a: m.actual?.conversions, color: '#10b981' },
                        ].map(({ label, v, a, color }) => (
                          <div key={label} className="bg-white/[0.02] rounded-xl p-3">
                            <div className="text-xs text-slate-500 font-light mb-1">{label}</div>
                            <div className="text-sm font-light text-white">{v.toLocaleString()}</div>
                            {a !== undefined && <div className="text-xs mt-0.5 font-light" style={{ color }}>Actual: {a.toLocaleString()}</div>}
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

        {/* ── AD PACKAGES ── */}
        {activeTab === 'Ad Packages' && (
          <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Package size={18} className="text-cyan-400" />
              <h3 className="text-lg font-light text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Platform Ad Packages</h3>
            </div>
            <p className="text-slate-500 text-sm font-light mb-6">Ready-to-use ad copy and targeting for each platform in your campaign.</p>
            <div className="prose-output" dangerouslySetInnerHTML={{ __html: parseMarkdown(campaign.strategy) }} />
          </div>
        )}

        {/* ── AI COACH ── */}
        {activeTab === 'AI Coach' && (
          <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-2">
              <Brain size={18} className="text-violet-400" />
              <h3 className="text-lg font-light text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>AI Performance Coach</h3>
            </div>
            <p className="text-slate-500 text-sm font-light mb-6">
              {daysWithData === 0 ? 'Update your daily metrics first to get AI coaching based on your actual performance.' : `Based on ${daysWithData} days of data.`}
            </p>
            {daysWithData === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-4">🤖</div>
                <p className="text-slate-500 text-sm font-light mb-5">No data yet. Go to Update Metrics tab and enter your day-1 numbers.</p>
                <button onClick={() => setActiveTab('Update Metrics')}
                  className="inline-flex items-center gap-2 text-sm font-light px-5 py-2.5 rounded-2xl text-white transition-all hover:opacity-85"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                  <Edit3 size={13} /> Enter Day 1 Metrics
                </button>
              </div>
            ) : (
              <div>
                {!coachData && (
                  <button onClick={async () => {
                    setCoachLoading(true);
                    try {
                      const res = await fetch('/api/ai-coach', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ metrics, order, plan: plan.id }),
                      });
                      if (res.ok) { const d = await res.json(); setCoachData(d); }
                    } catch { /* skip */ }
                    setCoachLoading(false);
                  }} disabled={coachLoading}
                    className="w-full py-4 rounded-2xl text-sm font-light text-white flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-85 transition-all"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                    {coachLoading ? <><Loader2 size={15} className="animate-spin" />Analysing your campaign...</> : <><Brain size={15} />Get AI Coaching</>}
                  </button>
                )}
                {coachData && (() => {
                  const VIcon = verdictIcon[coachData.verdict] || Zap;
                  const vColor = verdictColor[coachData.verdict] || '#a78bfa';
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 rounded-2xl border" style={{ background: `${vColor}10`, borderColor: `${vColor}25` }}>
                        <VIcon size={20} style={{ color: vColor }} />
                        <div>
                          <div className="text-sm font-light text-white capitalize">{coachData.verdict?.replace(/_/g, ' ')}</div>
                          <div className="text-xs text-slate-400 font-light">{coachData.analysis}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(coachData.actions || []).map((action: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                            <span className="text-violet-400 text-xs font-light mt-0.5 flex-shrink-0">{i + 1}.</span>
                            <p className="text-sm text-slate-300 font-light">{action}</p>
                          </div>
                        ))}
                      </div>
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
            <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={18} className="text-green-400" />
                <h3 className="text-lg font-light text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>ROI Calculator</h3>
              </div>
              <p className="text-slate-500 text-sm font-light mb-8">
                {daysWithData === 0 ? 'Update your daily metrics to unlock real ROI data.' : `Based on ${daysWithData} of ${metrics.length} days tracked.`}
              </p>
              {daysWithData === 0 ? (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">📊</div>
                  <p className="text-slate-500 text-sm font-light mb-5">No actual data yet. Enter your results in the Update Metrics tab.</p>
                  <button onClick={() => setActiveTab('Update Metrics')}
                    className="inline-flex items-center gap-2 text-sm font-light px-5 py-2.5 rounded-2xl text-white hover:opacity-85 transition-all"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
                    <Edit3 size={13} /> Enter Metrics
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 mb-6">
                    <div className="text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Campaign Efficiency</div>
                    <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(reachEff, 100)}%`, background: reachEff >= 90 ? '#10b981' : reachEff >= 60 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    <div className="text-xs text-slate-500 mt-1.5 font-light">{reachEff}% of projected reach delivered</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: 'Campaign Spend', value: `₹${campaignSpend.toLocaleString('en-IN')}`, color: '#7c3aed' },
                      { label: 'CPM (per 1000 reach)', value: `₹${cpm}`, color: '#22d3ee' },
                      { label: 'Cost Per Click', value: `₹${cpc}`, color: '#f59e0b' },
                      { label: 'Cost Per Conversion', value: `₹${cpa}`, color: '#10b981' },
                      { label: 'Click-Through Rate', value: `${ctr}%`, color: '#a78bfa' },
                      { label: 'Days Tracked', value: `${daysWithData}/${metrics.length}`, color: '#f472b6' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 text-center">
                        <div className="text-xs text-slate-500 font-light mb-2">{label}</div>
                        <div className="text-xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif', color }}>{value}</div>
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
          <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-2">
              <Edit3 size={18} className="text-violet-400" />
              <h3 className="text-lg font-light text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Update Daily Results</h3>
            </div>
            <p className="text-slate-500 text-sm font-light mb-8">Enter your actual performance numbers each day to track real growth.</p>

            <div className="mb-6">
              <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-3">Select Day</label>
              <div className="flex flex-wrap gap-2">
                {metrics.map(m => (
                  <button key={m.day} onClick={() => setUpdateDay(m.day)}
                    className="w-10 h-10 rounded-xl text-xs font-light border transition-all"
                    style={{
                      background: updateDay === m.day ? '#7c3aed' : m.actual ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                      borderColor: updateDay === m.day ? '#7c3aed' : m.actual ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)',
                      color: updateDay === m.day ? 'white' : m.actual ? '#10b981' : '#64748b',
                    }}>
                    {m.day}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.02] rounded-2xl p-4 mb-6 text-xs text-slate-500 font-light flex gap-6">
              <span>Day {updateDay} · {metrics[updateDay - 1]?.date}</span>
              <span>Proj. Reach: <span className="text-slate-300">{metrics[updateDay - 1]?.projected.reach.toLocaleString()}</span></span>
              <span>Proj. Clicks: <span className="text-slate-300">{metrics[updateDay - 1]?.projected.clicks.toLocaleString()}</span></span>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {[
                { key: 'reach', label: 'Actual Reach', placeholder: 'How many people saw your content?' },
                { key: 'clicks', label: 'Actual Clicks', placeholder: 'Link clicks / profile visits' },
                { key: 'impressions', label: 'Actual Impressions', placeholder: 'Total impressions across posts' },
                { key: 'conversions', label: 'Actual Conversions', placeholder: 'Sales / leads / sign-ups' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">{label}</label>
                  <input type="number" placeholder={placeholder}
                    value={actualMetrics[key as keyof typeof actualMetrics]}
                    onChange={e => setActualMetrics(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/50 text-sm font-light" />
                </div>
              ))}
            </div>

            <button onClick={handleSaveActual} disabled={saving}
              className="w-full py-4 rounded-2xl font-light text-white text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-60 hover:opacity-85"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
              {saving ? <><RefreshCw size={15} className="animate-spin" />Saving...</>
                : saveSuccess ? <><CheckCircle size={15} className="text-green-400" />Saved! Dashboard updated</>
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
