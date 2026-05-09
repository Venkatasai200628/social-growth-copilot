'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Eye, MousePointerClick, Users, ArrowLeft, Zap } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Campaign, UserOrder } from '@/lib/types';
import { PLANS } from '@/lib/plans';

export default function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
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
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-400 mb-4">Campaign not found.</p>
        <button onClick={() => router.push('/')} className="text-violet-400 text-sm">← Go Home</button>
      </div>
    </div>
  );

  const metrics = campaign.metrics || [];
  const plan = PLANS.find((p) => p.id === order.planId) || PLANS[0];
  const daysTracked = metrics.filter((m) => m.actual).length;
  const totals = metrics.reduce((acc, m) => ({
    projReach: acc.projReach + m.projected.reach,
    actReach: acc.actReach + (m.actual?.reach || 0),
    actClicks: acc.actClicks + (m.actual?.clicks || 0),
    actConv: acc.actConv + (m.actual?.conversions || 0),
  }), { projReach: 0, actReach: 0, actClicks: 0, actConv: 0 });

  const chartData = metrics.map((m) => ({
    day: `D${m.day}`,
    'Projected': m.projected.reach,
    'Actual': m.actual?.reach || 0,
  }));

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-violet-600/10 top-[-200px] right-[-100px]" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-14">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5">
            <Zap size={12} /> Campaign Report · Social Growth Copilot
          </div>
          <h1 className="text-4xl font-light text-white mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {order.businessName || 'Campaign Report'}
          </h1>
          <p className="text-slate-500 text-sm">{order.goal} · {(order.platforms || []).join(', ')}</p>

          {/* Plan badge */}
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full text-xs font-bold"
            style={{ background: plan.accentColor, color: plan.color, border: `1px solid ${plan.color}25` }}>
            {plan.name} Plan · {metrics.length}-day Campaign
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Projected Reach', value: totals.projReach.toLocaleString(), icon: Eye, color: '#7c3aed' },
            { label: 'Actual Reach', value: daysTracked > 0 ? totals.actReach.toLocaleString() : '—', icon: TrendingUp, color: '#10b981' },
            { label: 'Total Clicks', value: daysTracked > 0 ? totals.actClicks.toLocaleString() : '—', icon: MousePointerClick, color: '#22d3ee' },
            { label: 'Conversions', value: daysTracked > 0 ? totals.actConv.toLocaleString() : '—', icon: Users, color: '#f59e0b' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[#16161f] border border-white/[0.06] rounded-2xl p-4 text-center">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${color}15` }}>
                <Icon size={14} style={{ color }} />
              </div>
              <div className="text-xl font-light text-white mb-0.5" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Growth chart */}
        <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6 mb-8">
          <h3 className="text-sm font-bold text-white mb-5" style={{ fontFamily: 'Cormorant Garamond, serif' }}>📈 Reach Over Campaign</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="day" stroke="#334155" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis stroke="#334155" tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#16161f', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="Projected" stroke="#7c3aed" strokeWidth={2} fill="url(#g1)" />
              <Area type="monotone" dataKey="Actual" stroke="#10b981" strokeWidth={2} fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Progress */}
        <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6 mb-8">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-slate-400 font-semibold">Campaign Progress</span>
            <span className="text-white font-bold">{daysTracked}/{metrics.length} days tracked</span>
          </div>
          <div className="h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{ width: `${metrics.length > 0 ? (daysTracked / metrics.length) * 100 : 0}%`, background: plan.color }} />
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-xs text-slate-600 mb-4">Want results like this for your business?</p>
          <button onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-sm font-bold px-8 py-3.5 rounded-2xl text-white hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <Zap size={14} /> Start Your Campaign
          </button>
        </div>

        <div className="text-center mt-8">
          <button onClick={() => router.push(`/dashboard/${id}`)} className="text-xs text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1.5 mx-auto">
            <ArrowLeft size={11} /> Back to full dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
