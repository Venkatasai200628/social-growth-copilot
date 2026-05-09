'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, TrendingUp, Calendar, ArrowRight, Zap, Plus, Eye, MousePointerClick, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { PLANS } from '@/lib/plans';
import { useAuth } from '@/lib/auth-context';
import AuthGuard from '../components/AuthGuard';

interface CampaignSummary {
  id: string;
  businessName: string;
  planId: string;
  status: string;
  createdAt: number;
  duration: number;
  platforms: string[];
  goal: string;
  metrics?: Array<{
    projected: { reach: number; clicks: number };
    actual?: { reach: number; clicks: number };
  }>;
}

function MyCampaignsInner() {
  const router = useRouter();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const loaded: CampaignSummary[] = [];
      try {
        // Query ONLY this user's orders using userId field
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        snap.forEach((d) => {
          const data = d.data();
          if (data.status === 'active' || data.status === 'completed') {
            loaded.push({
              id: d.id,
              businessName: data.businessName || 'Unnamed Business',
              planId: data.planId || 'starter',
              status: data.status,
              createdAt: data.createdAt,
              duration: data.duration || 7,
              platforms: data.platforms || [],
              goal: data.goal || '',
            });
          }
        });

        // Load metrics for each campaign
        for (const c of loaded) {
          try {
            const campQ = query(
              collection(db, 'campaigns'),
              where('userId', '==', user.uid),
              where('orderId', '==', c.id)
            );
            const campSnap = await getDocs(campQ);
            campSnap.forEach((d) => { c.metrics = d.data().metrics || []; });
          } catch { /* skip metrics if unavailable */ }
        }
      } catch {
        // localStorage fallback — only load THIS user's orders
        const userOrderIds: string[] = JSON.parse(
          localStorage.getItem(`user_orders_${user.uid}`) || '[]'
        );

        // Also scan all order_ keys and match by userId field for backwards compat
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('order_')) {
            try {
              const order = JSON.parse(localStorage.getItem(key) || '');
              // Only include if userId matches OR it's in the user's order list
              if (order.userId === user.uid || userOrderIds.includes(order.id)) {
                const campRaw = localStorage.getItem(`campaign_${order.id}`);
                const camp = campRaw ? JSON.parse(campRaw) : null;
                if (!loaded.find((c) => c.id === order.id)) {
                  loaded.push({
                    id: order.id,
                    businessName: order.businessName || 'Unnamed Business',
                    planId: order.planId || 'starter',
                    status: order.status,
                    createdAt: order.createdAt,
                    duration: order.duration || 7,
                    platforms: order.platforms || [],
                    goal: order.goal || '',
                    metrics: camp?.metrics || [],
                  });
                }
              }
            } catch { /* skip malformed entries */ }
          }
        });
        loaded.sort((a, b) => b.createdAt - a.createdAt);
      }

      setCampaigns(loaded);
      setLoading(false);
    };
    load();
  }, [user]);

  const getStats = (c: CampaignSummary) => {
    if (!c.metrics?.length) return { projReach: 0, actDays: 0, progress: 0 };
    const projReach = c.metrics.reduce((a, m) => a + m.projected.reach, 0);
    const actDays = c.metrics.filter((m) => m.actual).length;
    const progress = Math.round((actDays / c.metrics.length) * 100);
    return { projReach, actDays, progress };
  };

  const daysSince = (ts: number) => {
    const d = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
    if (d === 0) return 'Today';
    if (d === 1) return '1 day ago';
    return `${d} days ago`;
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-violet-600/10 top-[-150px] right-[-100px]" />
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-14">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/15 rounded-full px-4 py-1.5 text-xs text-violet-400 font-light tracking-widest uppercase mb-4">
              <LayoutDashboard size={11} /> My Campaigns
            </div>
            <h1 className="text-4xl font-light text-white tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Campaign Hub
            </h1>
            <p className="text-slate-500 mt-2 text-sm font-light">Your active and completed promotion campaigns</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="hidden md:flex items-center gap-2 text-xs font-light px-5 py-3 rounded-2xl text-white transition-all hover:opacity-85 tracking-wide"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
          >
            <Plus size={12} /> New Campaign
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-28">
            <div className="text-center">
              <Loader2 size={22} className="animate-spin text-violet-400 mx-auto mb-4" />
              <p className="text-slate-600 text-sm font-light">Loading your campaigns...</p>
            </div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-28">
            <div className="w-16 h-16 rounded-3xl bg-violet-500/8 border border-violet-500/15 flex items-center justify-center mx-auto mb-6">
              <LayoutDashboard size={26} className="text-violet-400/60" />
            </div>
            <h2 className="text-2xl font-light text-white mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              No campaigns yet
            </h2>
            <p className="text-slate-500 text-sm font-light mb-8">
              Pick a plan to launch your first AI-powered campaign
            </p>
            <button onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 text-sm font-light px-6 py-3.5 rounded-2xl text-white hover:opacity-85 transition-opacity"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
              <Zap size={13} /> Browse Plans
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((c) => {
              const plan = PLANS.find((p) => p.id === c.planId) || PLANS[0];
              const { projReach, actDays, progress } = getStats(c);
              return (
                <div key={c.id}
                  className="group bg-[#16161f] border border-white/[0.06] rounded-3xl p-6 hover:border-violet-500/20 transition-all cursor-pointer"
                  onClick={() => router.push(`/dashboard/${c.id}`)}>
                  <div className="flex flex-col md:flex-row md:items-center gap-5">

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                        <span className="text-xs font-light px-3 py-1 rounded-full"
                          style={{ background: plan.accentColor, color: plan.color, border: `1px solid ${plan.color}20` }}>
                          {plan.name}
                        </span>
                        <span className={`text-xs font-light px-2.5 py-1 rounded-full ${
                          c.status === 'active'
                            ? 'bg-green-500/8 text-green-400 border border-green-500/15'
                            : 'bg-slate-500/8 text-slate-400 border border-slate-500/15'
                        }`}>
                          {c.status === 'active' ? '● Active' : '✓ Completed'}
                        </span>
                        <span className="text-xs text-slate-600 font-light">{daysSince(c.createdAt)}</span>
                      </div>
                      <h3 className="text-lg font-light text-white mb-1 truncate" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                        {c.businessName}
                      </h3>
                      <p className="text-slate-500 text-xs font-light">
                        {c.goal} · {c.platforms.slice(0, 3).join(', ')}{c.platforms.length > 3 ? ` +${c.platforms.length - 3}` : ''}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-6 md:gap-8">
                      {[
                        { icon: Eye, label: 'Proj. Reach', val: projReach.toLocaleString() },
                        { icon: Calendar, label: 'Duration', val: `${c.duration}d` },
                        { icon: MousePointerClick, label: 'Tracked', val: `${actDays}/${c.duration}d` },
                      ].map(({ icon: Icon, label, val }) => (
                        <div key={label} className="text-center">
                          <div className="flex items-center gap-1 text-slate-600 text-xs mb-1 font-light">
                            <Icon size={9} /> {label}
                          </div>
                          <div className="text-sm font-light text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                            {val}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Progress + arrow */}
                    <div className="flex items-center gap-4 md:w-44">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-slate-600 font-light mb-1.5">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${progress}%`, background: plan.color }} />
                        </div>
                      </div>
                      <TrendingUp size={14} className="text-slate-700 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* New campaign CTA */}
            <button onClick={() => router.push('/')}
              className="w-full border border-dashed border-white/[0.06] hover:border-violet-500/20 rounded-3xl p-5 text-slate-600 hover:text-violet-400 transition-all flex items-center justify-center gap-2 text-sm font-light">
              <Plus size={14} /> Launch a new campaign
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MyCampaignsPage() {
  return (
    <AuthGuard>
      <MyCampaignsInner />
    </AuthGuard>
  );
}
