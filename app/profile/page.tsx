'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail, LogOut, Shield, Zap, Loader2, TrendingUp, Sparkles, Calendar,
  Video, Star, MessageCircle, Lightbulb, Sun, Moon, Wallet, Wallet2, Camera,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useTheme } from '../components/ThemeProvider';
import { Card } from '../components/ui';

const QUICK_ACTIONS = [
  { icon: Camera, label: 'Post Studio', desc: 'Photo → festival poster', href: '/post-studio', color: 'var(--accent-soft)' },
  { icon: Zap, label: 'New Campaign', desc: 'Voice or typed brief', href: '/campaign', color: 'var(--neon)' },
  { icon: Calendar, label: 'Festival Calendar', desc: 'Browse Indian festivals for planning', href: '/festivals', color: 'var(--gold)' },
  { icon: Video, label: 'Video Studio', desc: 'Reel scripts, shot by shot', href: '/video-studio', color: 'var(--accent-soft)' },
  { icon: Star, label: 'Caption Scorer', desc: 'A/B test your hooks', href: '/scorer', color: 'var(--gold)' },
  { icon: MessageCircle, label: 'Reply Agent', desc: 'Answer DMs in your language', href: '/reply-agent', color: 'var(--neon)' },
  { icon: Lightbulb, label: 'Content Ideas', desc: 'Trending formats & hooks', href: '/content-studio', color: 'var(--gold)' },
  { icon: Wallet2, label: 'Budget Strategy', desc: 'Creators vs boosted posts', href: '/strategy', color: 'var(--neon)' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [businessName, setBusinessName] = useState('');
  const [postsUsed, setPostsUsed] = useState(0);
  const [campaignCount, setCampaignCount] = useState<number | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/auth');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      let orders: { createdAt?: number }[] = [];

      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const d = snap.data();
          if (d.businessName) setBusinessName(d.businessName);
          setPostsUsed(d.postsThisMonth || 0);
        }
      } catch { /* fall through */ }

      try {
        const snap = await getDocs(query(collection(db, 'orders'), where('userId', '==', user.uid)));
        snap.forEach((d) => orders.push(d.data() as { createdAt?: number }));
      } catch { /* fall through */ }

      if (!orders.length) {
        // localStorage fallback
        const keys = Object.keys(localStorage).filter((k) => k.startsWith('order_'));
        orders = keys.map((k) => { try { return JSON.parse(localStorage.getItem(k) || '{}'); } catch { return {}; } });
      }

      setCampaignCount(orders.length);
      setDataLoading(false);
    };
    load();
  }, [user]);

  if (loading || dataLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={22} className="animate-spin text-[var(--accent-soft)]" />
    </div>
  );

  if (!user) return null;

  const initials = user.displayName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || user.email?.[0].toUpperCase() || '?';
  const memberSince = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;
  const displayName = businessName || user.displayName || 'Shop Owner';

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[var(--accent)]/8 top-[-200px] right-[-100px]" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 py-14">

        {/* ── Identity card ── */}
        <Card className="p-8 mb-5 animate-fade-up">
          <div className="flex items-center gap-6 flex-wrap">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="" className="w-16 h-16 rounded-2xl" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/25 flex items-center justify-center text-[var(--accent-soft)] text-xl font-display font-bold">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-2xl font-bold text-[var(--text)] mb-0.5">{displayName}</h2>
              <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                <Mail size={12} /><span className="truncate">{user.email}</span>
              </div>
              {memberSince && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-faint)] mt-1">
                  <Calendar size={10} /> Mitra since {memberSince}
                </div>
              )}
            </div>
            {user.providerData[0]?.providerId === 'google.com' && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--text-faint)]">
                <Shield size={10} /> Google account
              </span>
            )}
          </div>
        </Card>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4 mb-5 animate-fade-up delay-1">
          <Card className="p-5 text-center">
            <TrendingUp size={16} className="text-[var(--success)] mx-auto mb-2" />
            <div className="font-display text-2xl font-bold text-[var(--text)]">{campaignCount ?? '—'}</div>
            <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide mt-0.5">Campaigns</div>
          </Card>
          <Card className="p-5 text-center">
            <Sparkles size={16} className="text-[var(--accent-soft)] mx-auto mb-2" />
            <div className="font-display text-2xl font-bold text-[var(--text)]">{postsUsed}</div>
            <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide mt-0.5">Posts created</div>
          </Card>
          <Card className="p-5 text-center">
            <Zap size={16} className="text-[var(--gold)] mx-auto mb-2" />
            <div className="font-display text-2xl font-bold text-[var(--text)]">∞</div>
            <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wide mt-0.5">Generations left</div>
          </Card>
        </div>

        {/* ── Access ── */}
        <Card className="p-6 mb-5 animate-fade-up delay-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]">
                <Zap size={16} className="text-[var(--accent-soft)]" />
              </div>
              <div>
                <div className="text-base font-semibold text-[var(--text)]">Everything unlocked</div>
                <div className="text-xs text-[var(--text-muted)]">All tools · every platform · unlimited AI generations</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-lg font-bold text-[var(--accent-soft)]">All access</div>
              <div className="text-xs text-[var(--text-faint)]">everything unlocked</div>
            </div>
          </div>
        </Card>

        {/* ── All tools ── */}
        <div className="mb-5 animate-fade-up delay-3">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-3 px-1">Everything in your mitra</div>
          <div className="grid sm:grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ icon: Icon, label, desc, href, color }) => (
              <button key={href} onClick={() => router.push(href)}
                className="flex items-center gap-3.5 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-left hover:border-[var(--accent)]/40 hover:-translate-y-0.5 transition-all">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)` }}>
                  <Icon size={15} style={{ color }} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-[var(--text)]">{label}</div>
                  <div className="text-xs text-[var(--text-faint)] truncate">{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── Appearance ── */}
        <Card className="p-5 mb-5 animate-fade-up delay-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon size={15} className="text-[var(--accent-soft)]" /> : <Sun size={15} className="text-[var(--gold)]" />}
              <div>
                <div className="text-sm text-[var(--text)]">Appearance</div>
                <div className="text-xs text-[var(--text-faint)]">{theme === 'dark' ? 'Dark mode' : 'Light mode'} — both look great here</div>
              </div>
            </div>
            <button onClick={toggle} role="switch" aria-checked={theme === 'dark'} aria-label="Toggle dark mode"
              className="relative w-12 rounded-full border border-[var(--border)] bg-[var(--bg-alt)] transition-colors" style={{ height: 26 }}>
              <span className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--accent)] shadow transition-all"
                style={{ left: theme === 'dark' ? 3 : 25 }} />
            </button>
          </div>
        </Card>

        {/* ── Sign out ── */}
        <button onClick={async () => { await logout(); router.push('/'); }}
          className="w-full py-3.5 rounded-full text-sm text-[var(--danger)] border border-[var(--danger)]/20 hover:bg-[var(--danger)]/8 transition-all flex items-center justify-center gap-2 animate-fade-up delay-5">
          <LogOut size={13} />Sign Out
        </button>
      </div>
    </main>
  );
}
