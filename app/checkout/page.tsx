'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, ArrowLeft, Zap, Sparkles } from 'lucide-react';
import { db } from '@/lib/firebase';
import { authFetch } from '@/lib/client';
import Confetti from '@/app/components/Confetti';
import { useToast } from '@/app/components/Toast';
import { useAuth } from '@/lib/auth-context';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const [orderData, setOrderData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [noData, setNoData] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const raw = params.get('data');
    if (raw) {
      try { setOrderData(JSON.parse(decodeURIComponent(raw))); return; } catch { /* fall through */ }
    }
    try {
      const pending = sessionStorage.getItem('gm_pending_campaign');
      if (pending) {
        setOrderData(JSON.parse(pending));
        sessionStorage.removeItem('gm_pending_campaign');
      } else {
        setNoData(true);
      }
    } catch { setNoData(true); }
  }, [params]);

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {noData ? (
          <div className="text-center max-w-sm px-6">
            <h1 className="font-display text-2xl font-bold text-[var(--text)] mb-3">Nothing to launch yet</h1>
            <p className="text-[var(--text-muted)] text-sm mb-6">Start a campaign first — it takes two minutes and this page will be waiting.</p>
            <button onClick={() => router.push('/onboard')}
              className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-full text-white [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]">
              <Zap size={14} /> Set up a campaign
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-[var(--text-muted)] text-sm">
            <Loader2 size={16} className="animate-spin text-[var(--accent-soft)]" /> Loading your campaign…
          </div>
        )}
      </div>
    );
  }

  const campaignDays = Number(orderData.duration) || 14;

  const activate = async () => {
    setLoading(true);
    setError('');
    try {
      setStatus('saving');
      const orderId = uuidv4();

      // Day skeleton (no projections — actuals only)
      const metricsRes = await authFetch('/api/save-order',
        { ...orderData, id: orderId, duration: campaignDays });
      if (!metricsRes.ok) throw new Error('Could not prepare your campaign — please try again.');
      const { metrics } = await metricsRes.json();

      // Save the campaign NOW; the AI strategy generates in the background so
      // the owner isn't blocked on a long model call.
      const now = Date.now();
      const fullOrder = {
        ...orderData,
        id: orderId,
        userId: user?.uid || 'anonymous',
        status: 'active',
        createdAt: now,
        duration: campaignDays,
      };

      const campaignDoc = {
        userId: user?.uid || 'anonymous',
        id: orderId,
        orderId,
        strategy: '',
        strategyStatus: 'generating' as const,
        metrics: metrics ?? [],
        createdAt: now,
        updatedAt: now,
      };

      try {
        await setDoc(doc(db, 'orders', orderId), fullOrder);
        await setDoc(doc(db, 'campaigns', orderId), campaignDoc);
      } catch {
        // Firebase not configured — store in localStorage as fallback
        const userOrders = JSON.parse(localStorage.getItem(`user_orders_${user?.uid || 'anon'}`) || '[]');
        if (!userOrders.includes(orderId)) userOrders.push(orderId);
        localStorage.setItem(`user_orders_${user?.uid || 'anon'}`, JSON.stringify(userOrders));
        localStorage.setItem(`order_${orderId}`, JSON.stringify(fullOrder));
        localStorage.setItem(`campaign_${orderId}`, JSON.stringify(campaignDoc));
      }

      // Fire-and-forget strategy generation; the dashboard polls until it lands.
      authFetch('/api/generate-strategy', { ...orderData, id: orderId, duration: campaignDays })
        .then(async (stratRes) => {
          if (!stratRes.ok) throw new Error('strategy ' + stratRes.status);
          const { strategy } = await stratRes.json();
          const upd = { strategy: strategy || '', strategyStatus: 'ready' as const, updatedAt: Date.now() };
          try { await updateDoc(doc(db, 'campaigns', orderId), upd); }
          catch {
            try {
              const raw = localStorage.getItem('campaign_' + orderId);
              if (raw) {
                const c = JSON.parse(raw);
                localStorage.setItem('campaign_' + orderId, JSON.stringify({ ...c, ...upd }));
              }
            } catch { /* nothing to update */ }
          }
        })
        .catch(() => {
          // Mark failed so the dashboard can offer a retry instead of spinning.
          updateDoc(doc(db, 'campaigns', orderId), { strategyStatus: 'failed', updatedAt: Date.now() })
            .catch(() => {
              try {
                const raw = localStorage.getItem('campaign_' + orderId);
                if (raw) {
                  const c = JSON.parse(raw);
                  localStorage.setItem('campaign_' + orderId, JSON.stringify({ ...c, strategyStatus: 'failed' }));
                }
              } catch { /* nothing to update */ }
            });
        });

      setCampaignId(orderId);
      setStatus('success');
      setShowConfetti(true);
      toast('Your campaign is live!', 'ai');
      setTimeout(() => setShowConfetti(false), 4000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Activation failed — please try again.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'success') {
    return (<>
      <Confetti active={showConfetti} />
      <main className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="orb w-[500px] h-[500px] bg-[var(--success)]/10 top-[-200px] right-[-100px]" />
        <div className="relative z-10 max-w-md mx-auto px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--success)]/10 border border-[var(--success)]/25 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={36} className="text-[var(--success)]" />
          </div>
          <h1 className="font-display text-3xl font-bold text-[var(--text)] mb-3">
            You&apos;re all set!
          </h1>
          <p className="text-[var(--text-muted)] mb-8 text-sm leading-relaxed">
            Your campaign is live. Your AI strategy has been generated and your dashboard is ready.
          </p>
          <button
            onClick={() => router.push(`/dashboard/${campaignId}`)}
            className="w-full py-4 rounded-full font-semibold text-[var(--accent-contrast)] flex items-center justify-center gap-2 text-sm hover:-translate-y-0.5 transition-all [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]"
          >
            <Zap size={16} /> Open My Campaign Dashboard
          </button>
        </div>
      </main>
    </>);
  }

  const statusMessages: Record<string, string> = {
    saving: 'Generating your AI strategy & dashboard…',
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[var(--accent)]/12 top-[-150px] right-[-100px]" />
      <div className="relative z-10 max-w-lg mx-auto px-6 py-14">

        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text)] text-sm transition-colors mb-8">
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="font-display text-3xl font-bold text-[var(--text)] mb-2">Review & launch</h1>
        <p className="text-[var(--text-muted)] text-sm mb-8">Review your campaign details before it goes live.</p>

        {/* Plan card */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-1 text-[var(--accent-soft)]">New Campaign</div>
              <div className="font-display text-2xl font-bold text-[var(--text)]">Ready to launch</div>
              <div className="text-[var(--text-faint)] text-xs mt-0.5">no payment needed</div>
            </div>
            <div className="text-right text-xs text-[var(--text-muted)]">
              <div>{campaignDays}-day campaign</div>
              <div>{((orderData.platforms as string[] | undefined)?.length ?? 0) === 1 ? '1 platform' : ((orderData.platforms as string[] | undefined)?.length ?? 0) + ' platforms'}</div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4 space-y-2">
            {[
              ['Business', orderData.businessName as string],
              ['Category', orderData.businessCategory as string],
              ['Goal', orderData.goal as string],
              ['Platforms', (orderData.platforms as string[])?.join(', ')],
              ['Intensity', orderData.promotionEfficiency ? (orderData.promotionEfficiency as string).charAt(0).toUpperCase() + (orderData.promotionEfficiency as string).slice(1) : ''],
            ].map(([label, value]) => value && (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-[var(--text-muted)]">{label}</span>
                <span className="text-[var(--text-soft)] text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 mb-6 text-xs text-[var(--text-faint)]">
          <div className="flex items-center gap-1.5"><Sparkles size={12} className="text-[var(--accent-soft)]" />AI strategy builds on your dashboard</div>
          <div className="flex items-center gap-1.5"><Zap size={12} className="text-[var(--accent-soft)]" />{((orderData.platforms as string[] | undefined)?.length ?? 0) === 1 ? '1 platform' : ((orderData.platforms as string[] | undefined)?.length ?? 0) + ' platforms'}</div>
        </div>

        {error && (
          <div className="bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-2xl px-4 py-3 mb-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        <button
          onClick={activate}
          disabled={loading}
          className="w-full py-4 rounded-full font-semibold text-[var(--accent-contrast)] text-sm flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0 [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" />{statusMessages[status] || 'Activating…'}</>
          ) : (
            <><Zap size={16} /> Launch My Campaign</>
          )}
        </button>

        <p className="text-center text-xs text-[var(--text-faint)] mt-4">
          Your dashboard goes live immediately — the AI strategy keeps building in the background and appears there when ready.
        </p>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
