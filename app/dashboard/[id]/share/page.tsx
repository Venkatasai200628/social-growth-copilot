'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Eye, MousePointerClick, Users, ArrowLeft, Zap, LineChart } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Campaign, UserOrder } from '@/lib/types';
import { useTheme } from '@/app/components/ThemeProvider';

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { theme } = useTheme();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [order, setOrder] = useState<Partial<UserOrder>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cs, os] = await Promise.all([getDoc(doc(db, 'campaigns', id)), getDoc(doc(db, 'orders', id))]);
        if (cs.exists()) setCampaign(cs.data() as Campaign);
        if (os.exists()) setOrder(os.data() as UserOrder);
      } catch {
        const lc = localStorage.getItem(`campaign_${id}`);
        const lo = localStorage.getItem(`order_${id}`);
        if (lc) setCampaign(JSON.parse(lc));
        if (lo) setOrder(JSON.parse(lo));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-[var(--text-soft)] mb-4">Campaign not found.</p>
        <button onClick={() => router.push('/')} className="text-[var(--accent-soft)] text-sm hover:underline">← Go Home</button>
      </div>
    </div>
  );

  const metrics = campaign.metrics || [];
  const daysTracked = metrics.filter((m) => m.actual).length;
  const totals = metrics.reduce((acc, m) => ({
    actReach: acc.actReach + (m.actual?.reach || 0),
    actClicks: acc.actClicks + (m.actual?.clicks || 0),
    actConv: acc.actConv + (m.actual?.conversions || 0),
  }), { actReach: 0, actClicks: 0, actConv: 0 });

  const chartData = metrics.filter((m) => m.actual).map((m) => ({
    day: `D${m.day}`,
    Reach: m.actual?.reach || 0,
  }));

  const isLight = theme === 'light';
  const tickStyle = { fill: isLight ? '#6a6f8a' : '#64748b', fontSize: 10 };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] top-[-200px] right-[-100px]" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-14">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 text-xs font-semibold text-[var(--accent-soft)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] rounded-full px-4 py-1.5">
            <Zap size={12} /> Campaign Report · GrowMitra
          </div>
          <h1 className="font-display text-4xl font-bold text-[var(--text)] mb-2">
            {order.businessName || 'Campaign Report'}
          </h1>
          <p className="text-[var(--text-muted)] text-sm">{order.goal} · {(order.platforms || []).join(', ')}</p>

          <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent-soft)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
            {metrics.length}-day Campaign
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Reach', value: totals.actReach.toLocaleString(), icon: Eye, color: 'var(--accent-soft)' },
            { label: 'Actual Reach', value: daysTracked > 0 ? totals.actReach.toLocaleString() : '—', icon: TrendingUp, color: 'var(--success)' },
            { label: 'Total Clicks', value: daysTracked > 0 ? totals.actClicks.toLocaleString() : '—', icon: MousePointerClick, color: 'var(--neon)' },
            { label: 'Conversions', value: daysTracked > 0 ? totals.actConv.toLocaleString() : '—', icon: Users, color: 'var(--gold)' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 text-center">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
                <Icon size={14} style={{ color }} />
              </div>
              <div className="font-display text-xl font-bold text-[var(--text)] mb-0.5">{value}</div>
              <div className="text-xs text-[var(--text-muted)]">{label}</div>
            </div>
          ))}
        </div>

        {/* Growth chart */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-[var(--text)] mb-5 flex items-center gap-2"><LineChart size={13} className="text-[var(--accent-soft)]" />Reach Over Campaign</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e6e2f4' : '#1e1e2e'} />
              <XAxis dataKey="day" stroke={tickStyle.fill} tick={tickStyle} />
              <YAxis stroke={tickStyle.fill} tick={tickStyle} />
              <Tooltip contentStyle={{ background: isLight ? '#ffffff' : '#16161f', border: `1px solid ${isLight ? '#e6e2f4' : 'rgba(255,255,255,0.08)'}`, borderRadius: 12, color: isLight ? '#191a2e' : '#e2e8f0' }} />
              <Area type="monotone" dataKey="Reach" stroke="#10b981" strokeWidth={2} fill="url(#g1)" />
              <Area type="monotone" dataKey="Actual" stroke="#10b981" strokeWidth={2} fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Progress */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 mb-8">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-[var(--text-muted)] font-medium">Campaign Progress</span>
            <span className="text-[var(--text)] font-semibold">{daysTracked}/{metrics.length} days tracked</span>
          </div>
          <div className="h-2.5 bg-[var(--border)] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${metrics.length > 0 ? (daysTracked / metrics.length) * 100 : 0}%`, background: 'var(--accent)' }} />
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-xs text-[var(--text-faint)] mb-4">Want results like this for your business?</p>
          <button onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-sm font-semibold px-8 py-3.5 rounded-full text-white hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-soft))' }}>
            <Zap size={14} /> Start Your Campaign
          </button>
        </div>

        <div className="text-center mt-8">
          <button onClick={() => router.push(`/dashboard/${id}`)} className="text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)] transition-colors flex items-center gap-1.5 mx-auto">
            <ArrowLeft size={11} /> Back to full dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
