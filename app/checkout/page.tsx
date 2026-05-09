'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, CheckCircle, Loader2, ArrowLeft, CreditCard, Zap } from 'lucide-react';
import { db } from '@/lib/firebase';
import Confetti from '@/app/components/Confetti';
import { useToast } from '@/app/components/Toast';
import { useAuth } from '@/lib/auth-context';
import { doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { PLANS } from '@/lib/plans';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const [orderData, setOrderData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'creating' | 'paying' | 'saving' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const raw = params.get('data');
    if (raw) {
      try { setOrderData(JSON.parse(decodeURIComponent(raw))); } catch {}
    }
  }, [params]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Loading order details...</div>
      </div>
    );
  }

  const plan = PLANS.find((p) => p.id === orderData.planId) || PLANS[1];

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    try {
      setStatus('creating');
      const orderId = uuidv4();
      const receipt = `sgc_${orderId.slice(0, 8)}`;

      // Create Razorpay order
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: orderData.price, currency: 'INR', receipt }),
      });
      const rzpOrder = await orderRes.json();

      setStatus('paying');
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder';
      const isDemo = rzpOrder.demo || keyId.includes('placeholder');

      if (isDemo) {
        // Demo mode — simulate payment success
        await new Promise((r) => setTimeout(r, 1500));
        await finaliseOrder(orderId, 'demo_payment_' + Date.now(), rzpOrder.id || 'demo_order');
        return;
      }

      // Real Razorpay checkout
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: 'Social Growth Copilot',
          description: `${plan.name} Plan — ${plan.duration}-day Campaign`,
          order_id: rzpOrder.id,
          theme: { color: plan.color },
          prefill: {
            email: orderData.contactEmail,
            name: orderData.businessName,
          },
          handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string }) => {
            await finaliseOrder(orderId, response.razorpay_payment_id, response.razorpay_order_id);
            resolve();
          },
          modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
        });
        rzp.open();
      });

    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Payment failed';
      if (msg !== 'Payment cancelled') setError(msg);
      setStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const finaliseOrder = async (orderId: string, paymentId: string, rzpOrderId: string) => {
    setStatus('saving');

    // Generate projected metrics
    const metricsRes = await fetch('/api/save-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orderData, id: orderId, duration: plan.duration }),
    });
    const { metrics } = await metricsRes.json();

    // Generate AI strategy
    const stratRes = await fetch('/api/generate-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...orderData, id: orderId, duration: plan.duration }),
    });
    const { strategy } = await stratRes.json();

    // Save to Firebase
    const now = Date.now();
    const fullOrder = {
      ...orderData,
      id: orderId,
      userId: user?.uid || 'anonymous',
      status: 'active',
      razorpayPaymentId: paymentId,
      razorpayOrderId: rzpOrderId,
      createdAt: now,
      duration: plan.duration,
    };

    try {
      await setDoc(doc(db, 'orders', orderId), fullOrder);
      await setDoc(doc(db, 'campaigns', orderId), {
        userId: user?.uid || 'anonymous',
        id: orderId,
        orderId,
        strategy: strategy || '',
        metrics,
        createdAt: now,
        updatedAt: now,
      });
      // ✅ Write plan to user document so Post Studio can read it
      if (user?.uid) {
        await setDoc(doc(db, 'users', user.uid), {
          plan: orderData.planId,
          planName: plan.name,
          planActivatedAt: now,
          postsThisMonth: 0,
          updatedAt: now,
        }, { merge: true });
      }
    } catch {
      // Firebase not configured — store in localStorage as fallback
      const userOrders = JSON.parse(localStorage.getItem(`user_orders_${user?.uid || 'anon'}`) || '[]');
      if (!userOrders.includes(orderId)) userOrders.push(orderId);
      localStorage.setItem(`user_orders_${user?.uid || 'anon'}`, JSON.stringify(userOrders));
      localStorage.setItem(`order_${orderId}`, JSON.stringify(fullOrder));
      localStorage.setItem(`campaign_${orderId}`, JSON.stringify({ id: orderId, orderId, strategy: strategy || '', metrics, createdAt: now, updatedAt: now }));
      // Also save plan to localStorage fallback
      localStorage.setItem(`user_plan_${user?.uid || 'anon'}`, JSON.stringify({
        plan: orderData.planId, planName: plan.name, planActivatedAt: now, postsThisMonth: 0,
      }));
    }

    setCampaignId(orderId);
    setStatus('success');
    setShowConfetti(true);
    toast('Payment successful! Your campaign is live 🚀', 'ai');
    setTimeout(() => setShowConfetti(false), 4000);
  };

  if (status === 'success') {
    return (<>
      <Confetti active={showConfetti} />
      <main className="min-h-screen relative overflow-hidden flex items-center justify-center">
        <div className="orb w-[500px] h-[500px] bg-green-600/10 top-[-200px] right-[-100px]" />
        <div className="relative z-10 max-w-md mx-auto px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={36} className="text-green-400" />
          </div>
          <h1 className="text-3xl font-light text-white mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Payment Successful!
          </h1>
          <p className="text-slate-400 mb-8">
            Your {plan.name} campaign is live. Your AI strategy has been generated and your dashboard is ready.
          </p>
          <button
            onClick={() => router.push(`/dashboard/${campaignId}`)}
            className="w-full py-4 rounded-2xl font-bold text-[#0a0a0f] flex items-center justify-center gap-2 text-sm hover:opacity-90 transition-opacity"
            style={{ background: plan.color, fontFamily: 'Cormorant Garamond, serif' }}
          >
            <Zap size={16} /> Open My Campaign Dashboard
          </button>
        </div>
      </main>
    </>);
  }

  const statusMessages: Record<string, string> = {
    creating: 'Creating your order...',
    paying: 'Opening payment...',
    saving: 'Generating your AI strategy & dashboard...',
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-violet-600/12 top-[-150px] right-[-100px]" />
      <div className="relative z-10 max-w-lg mx-auto px-6 py-14">

        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors mb-8">
          <ArrowLeft size={14} /> Back
        </button>

        <h1 className="text-3xl font-light text-white mb-8" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          Order Summary
        </h1>

        {/* Order card */}
        <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: plan.color }}>{plan.name} Plan</div>
              <div className="text-2xl font-light text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                ₹{(orderData.price as number).toLocaleString('en-IN')}
              </div>
              <div className="text-slate-500 text-xs mt-0.5">One-time payment · No hidden charges</div>
            </div>
            <div className="text-right text-xs text-slate-500">
              <div>{plan.duration}-day campaign</div>
              <div>{plan.platforms.length} platforms</div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] pt-4 space-y-2">
            {[
              ['Business', orderData.businessName as string],
              ['Category', orderData.businessCategory as string],
              ['Goal', orderData.goal as string],
              ['Platforms', (orderData.platforms as string[])?.join(', ')],
              ['Intensity', orderData.promotionEfficiency as string],
            ].map(([label, value]) => value && (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-300 text-right max-w-[60%]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-6 mb-6 text-xs text-slate-600">
          <div className="flex items-center gap-1.5"><Shield size={12} className="text-green-500" />256-bit SSL</div>
          <div className="flex items-center gap-1.5"><Shield size={12} className="text-green-500" />PCI DSS Compliant</div>
          <div className="flex items-center gap-1.5"><CreditCard size={12} className="text-green-500" />Razorpay Secured</div>
        </div>

        {/* Demo notice */}
        {(!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.includes('placeholder')) && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 mb-4 text-xs text-amber-400">
            <strong>Demo Mode</strong> — No real payment will be charged. Add your Razorpay keys in .env.local to enable live payments.
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 mb-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-bold text-[#0a0a0f] text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-60 hover:opacity-90"
          style={{ background: plan.color, fontFamily: 'Cormorant Garamond, serif' }}
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin text-[#0a0a0f]" />{statusMessages[status] || 'Processing...'}</>
          ) : (
            <><Shield size={16} /> Pay ₹{(orderData.price as number).toLocaleString('en-IN')} Securely</>
          )}
        </button>

        <p className="text-center text-xs text-slate-600 mt-4">
          By paying you agree to our terms. AI strategy generated immediately after payment.
        </p>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink flex items-center justify-center text-slate-500">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
