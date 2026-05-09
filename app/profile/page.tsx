'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, LogOut, Shield, ImageIcon, LayoutDashboard, Zap, Loader2, TrendingUp } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PLANS } from '@/lib/plans';

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [postsUsed, setPostsUsed] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists() && snap.data().plan) {
          setUserPlan(snap.data().plan || null);
          setPostsUsed(snap.data().postsThisMonth || 0);
          setDataLoading(false);
          return;
        }
      } catch { /* fall through */ }

      // Check orders collection directly
      try {
        const { getDocs, collection, query, where } = await import('firebase/firestore');
        const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const orders: {planId: string}[] = [];
          snap.forEach((d) => orders.push(d.data() as {planId: string}));
          const rank: Record<string,number> = { pro: 3, growth: 2, starter: 1 };
          const best = orders.reduce((a, b) => (rank[b.planId]||0) > (rank[a.planId]||0) ? b : a);
          if (best.planId) { setUserPlan(best.planId); setDataLoading(false); return; }
        }
      } catch { /* fall through */ }

      // localStorage fallback
      const planData = localStorage.getItem(`user_plan_${user.uid}`);
      if (planData) {
        try { const p = JSON.parse(planData); setUserPlan(p.plan || null); setDataLoading(false); return; } catch { /* ignore */ }
      }
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('order_'));
      if (keys.length > 0) {
        const orders = keys.map((k) => { try { return JSON.parse(localStorage.getItem(k)||'{}'); } catch { return {}; }});
        const userOrders = orders.filter((o) => o.userId === user.uid || !o.userId);
        if (userOrders.length > 0) {
          const rank: Record<string,number> = { pro: 3, growth: 2, starter: 1 };
          const best = userOrders.reduce((a: {planId:string}, b: {planId:string}) =>
            (rank[b.planId]||0) > (rank[a.planId]||0) ? b : a, { planId: 'none' });
          setUserPlan(best.planId !== 'none' ? best.planId : null);
        }
      }
      setDataLoading(false);
    };
    load();
  }, [user]);

  if (loading || dataLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={22} className="animate-spin text-violet-400" />
    </div>
  );

  if (!user) return null;

  const plan = PLANS.find((p) => p.id === userPlan);
  const postLimit = userPlan === 'pro' ? Infinity : userPlan === 'growth' ? 15 : 0;
  const initials = user.displayName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || user.email?.[0].toUpperCase() || '?';

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-violet-600/8 top-[-200px] right-[-100px]" />
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-14">

        <h1 className="text-4xl font-light text-white mb-10 tracking-wide" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          My Profile
        </h1>

        {/* Avatar + name */}
        <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-8 mb-5 flex items-center gap-6">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-16 h-16 rounded-2xl" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/25 flex items-center justify-center text-violet-300 text-xl font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-light text-white mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {user.displayName || 'User'}
            </h2>
            <div className="flex items-center gap-1.5 text-sm text-slate-500 font-light">
              <Mail size={12} />{user.email}
            </div>
            {user.providerData[0]?.providerId === 'google.com' && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-light mt-1.5">
                <Shield size={10} /> Signed in with Google
              </span>
            )}
          </div>
        </div>

        {/* Plan */}
        <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6 mb-5">
          <div className="text-xs font-light text-slate-500 uppercase tracking-widest mb-4">Current Plan</div>
          {plan ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: plan.accentColor }}>
                  <TrendingUp size={16} style={{ color: plan.color }} />
                </div>
                <div>
                  <div className="text-base font-light text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{plan.name} Plan</div>
                  <div className="text-xs text-slate-500 font-light">{plan.duration}-day campaigns · {plan.platforms.length} platforms</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-light" style={{ fontFamily: 'Cormorant Garamond, serif', color: plan.color }}>
                  ₹{plan.price.toLocaleString('en-IN')}
                </div>
                <div className="text-xs text-slate-600 font-light">one-time</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-light text-sm">No active plan</span>
              <button onClick={() => router.push('/')}
                className="text-xs font-light text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
                <Zap size={10} />Browse plans
              </button>
            </div>
          )}
        </div>

        {/* Post Studio usage */}
        {(userPlan === 'growth' || userPlan === 'pro') && (
          <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6 mb-5">
            <div className="text-xs font-light text-slate-500 uppercase tracking-widest mb-4">Post Studio — This Month</div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-light text-slate-400">Posts generated</span>
              <span className="text-sm font-light text-white">
                {postsUsed} / {postLimit === Infinity ? '∞' : postLimit}
              </span>
            </div>
            {postLimit !== Infinity && (
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min((postsUsed / (postLimit as number)) * 100, 100)}%`, background: postsUsed >= (postLimit as number) ? '#ef4444' : '#10b981' }} />
              </div>
            )}
          </div>
        )}

        {/* Quick links */}
        <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-4 mb-5 space-y-1">
          {[
            { icon: LayoutDashboard, label: 'My Campaigns', href: '/my-campaigns' },
            { icon: ImageIcon, label: 'Post Studio', href: '/post-studio' },
          ].map(({ icon: Icon, label, href }) => (
            <button key={href} onClick={() => router.push(href)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-light text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all text-left">
              <Icon size={14} />{label}
            </button>
          ))}
        </div>

        {/* Sign out */}
        <button onClick={async () => { await logout(); router.push('/'); }}
          className="w-full py-3.5 rounded-2xl text-sm font-light text-red-400 border border-red-500/15 hover:bg-red-500/6 transition-all flex items-center justify-center gap-2">
          <LogOut size={13} />Sign Out
        </button>
      </div>
    </main>
  );
}
