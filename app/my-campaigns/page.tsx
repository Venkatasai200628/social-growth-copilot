'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, TrendingUp, Calendar, Zap, Plus, Eye, MousePointerClick, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, where, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import AuthGuard from '../components/AuthGuard';
import { Eyebrow, Button, Card, Skeleton, EmptyState } from '../components/ui';

interface CampaignSummary {
  id: string;
  businessName: string;
  status: string;
  createdAt: number;
  duration: number;
  platforms: string[];
  goal: string;
  metrics?: Array<{
    actual?: { reach: number; clicks: number };
  }>;
}

function MyCampaignsInner() {
  const router = useRouter();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

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
    if (!c.metrics?.length) return { actReach: 0, actDays: 0, progress: 0 };
    const actReach = c.metrics.reduce((a, m) => a + (m.actual?.reach || 0), 0);
    const actDays = c.metrics.filter((m) => m.actual).length;
    const progress = Math.round((actDays / c.metrics.length) * 100);
    return { actReach, actDays, progress };
  };

  const deleteCampaign = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" and all its tracked data? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'orders', id));
      await deleteDoc(doc(db, 'campaigns', id));
      localStorage.removeItem(`order_${id}`);
      localStorage.removeItem(`campaign_${id}`);
      localStorage.setItem(`user_orders_${user?.uid || 'anon'}`,
        JSON.stringify((JSON.parse(localStorage.getItem(`user_orders_${user?.uid || 'anon'}`) || '[]') as string[]).filter((x) => x !== id)));
      setCampaigns((cs) => cs.filter((c) => c.id !== id));
    } catch { /* localStorage-only campaign: local removal above already handled it */ }
    setDeleting(null);
  };

  const daysSince = (ts: number) => {
    const d = Math.floor((Date.now() - ts) / (1000 * 60 * 60 * 24));
    if (d === 0) return 'Today';
    if (d === 1) return '1 day ago';
    return `${d} days ago`;
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] top-[-150px] right-[-100px]" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-14">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-10 flex-wrap">
          <div className="animate-fade-up">
            <Eyebrow><LayoutDashboard size={11} /> My Campaigns</Eyebrow>
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-5 text-[var(--text)] leading-tight">Campaign Hub</h1>
            <p className="text-[var(--text-muted)] mt-3 text-sm">Your active and completed promotion campaigns</p>
          </div>
          <Button onClick={() => router.push('/onboard')} className="hidden md:inline-flex">
            <Plus size={14} /> New Campaign
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-5">
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-10 w-full md:w-44" />
                </div>
              </Card>
            ))}
            <p className="text-center text-xs text-[var(--text-muted)] animate-pulse">Loading your campaigns…</p>
          </div>
        ) : campaigns.length === 0 ? (
          <EmptyState
            icon={<LayoutDashboard size={22} />}
            title="No campaigns yet"
            sub="Launch your first AI-powered campaign — strategy, content calendar and daily tracking included."
            action={<Button onClick={() => router.push('/onboard')}><Zap size={14} /> Launch your first campaign</Button>}
          />
        ) : (
          <div className="space-y-4">
            {campaigns.map((c) => {
              const { actReach, actDays, progress } = getStats(c);
              return (
                <Card key={c.id} hover className="group p-6 !p-0 overflow-hidden">
                  <a href={`/dashboard/${c.id}`}
                    className="block p-6 cursor-pointer"
                    onClick={(e) => { e.preventDefault(); router.push(`/dashboard/${c.id}`); }}
                  >
                  <div className="flex flex-col md:flex-row md:items-center gap-5">

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)]">
                          Campaign
                        </span>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          c.status === 'active'
                            ? 'bg-[color-mix(in_srgb,var(--success)_10%,transparent)] text-[var(--success)] border border-[color-mix(in_srgb,var(--success)_30%,transparent)]'
                            : 'bg-[var(--hover-fill)] text-[var(--text-muted)] border border-[var(--border)]'
                        }`}>
                          {c.status === 'active' ? '● Active' : '✓ Completed'}
                        </span>
                        <span className="text-xs text-[var(--text-faint)]">{daysSince(c.createdAt)}</span>
                      </div>
                      <h3 className="font-display text-lg font-bold text-[var(--text)] mb-1 truncate">
                        {c.businessName}
                      </h3>
                      <p className="text-[var(--text-muted)] text-xs">
                        {c.goal} · {c.platforms.slice(0, 3).join(', ')}{c.platforms.length > 3 ? ` +${c.platforms.length - 3}` : ''}
                      </p>
                    </div>

                    {/* Stats — real logged data only */}
                    <div className="flex gap-6 md:gap-8">
                      {[
                        { icon: Eye, label: 'Reach logged', val: actDays > 0 ? actReach.toLocaleString() : '—' },
                        { icon: Calendar, label: 'Duration', val: `${c.duration}d` },
                        { icon: MousePointerClick, label: 'Tracked', val: `${actDays}/${c.duration}d` },
                      ].map(({ icon: Icon, label, val }) => (
                        <div key={label} className="text-center">
                          <div className="flex items-center justify-center gap-1 text-[var(--text-faint)] text-xs mb-1">
                            <Icon size={9} /> {label}
                          </div>
                          <div className="font-display text-sm font-bold text-[var(--text)]">
                            {val}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Progress + arrow */}
                    <div className="flex items-center gap-4 md:w-44">
                      <div className="flex-1">
                        <div className="flex justify-between text-xs text-[var(--text-faint)] mb-1.5">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1 bg-[var(--border)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${progress}%`, background: 'var(--accent)' }} />
                        </div>
                      </div>
                      <TrendingUp size={14} className="text-[var(--text-faint)] group-hover:text-[var(--accent-soft)] transition-colors flex-shrink-0" />
                    </div>
                  </div>
                  </a>
                  <div className="px-6 pb-4 -mt-1 flex justify-end">
                    <button
                      onClick={() => deleteCampaign(c.id, c.businessName)}
                      disabled={deleting === c.id}
                      aria-label={`Delete ${c.businessName}`}
                      className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-faint)] hover:text-[var(--danger)] transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={11} /> {deleting === c.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </Card>
              );
            })}

            {/* New campaign CTA */}
            <button onClick={() => router.push('/onboard')}
              className="w-full border border-dashed border-[var(--border)] hover:border-[color-mix(in_srgb,var(--accent)_60%,transparent)] rounded-3xl p-5 text-[var(--text-muted)] hover:text-[var(--accent-soft)] transition-all flex items-center justify-center gap-2 text-sm">
              <Plus size={14} /> Launch a new campaign
            </button>
            <div className="md:hidden">
              <Button onClick={() => router.push('/onboard')} className="w-full">
                <Plus size={14} /> New Campaign
              </Button>
            </div>
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
