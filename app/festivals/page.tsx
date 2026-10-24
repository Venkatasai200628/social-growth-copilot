'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Flame, Megaphone, ImageIcon, Sparkles } from 'lucide-react';
import { PageHeader, Card } from '../components/ui';
import { FESTIVALS, upcomingFestivals } from '@/lib/india';
import { PALETTES } from '@/lib/poster';

const DAY = 24 * 60 * 60 * 1000;

interface FestivalEntry {
  id: string;
  name: string;
  greeting: string;
  daysUntil: number;
  isNow: boolean;
  hooks: string[];
  palette: string;
  nextYear: boolean; // first listed date has already passed this cycle
}

/**
 * The next 12 months of the festival calendar: everything
 * upcomingFestivals returns within a ~400-day horizon, deduped by id
 * (multi-date festivals keep their earliest date), then any festival
 * not yet covered appended from its first listed date — past dates
 * surface as "next year".
 */
function buildRoster(): FestivalEntry[] {
  const today = new Date();
  const byId = new Map<string, FestivalEntry>();

  for (const f of upcomingFestivals(today, 400)) {
    const existing = byId.get(f.id);
    if (!existing || f.daysUntil < existing.daysUntil) {
      byId.set(f.id, {
        id: f.id, name: f.name, greeting: f.greeting,
        daysUntil: f.daysUntil, isNow: f.isNow,
        hooks: f.hooks, palette: f.palette, nextYear: false,
      });
    }
  }

  for (const f of FESTIVALS) {
    if (byId.has(f.id)) continue;
    const date = new Date(f.dates[0] + 'T00:00:00');
    const days = Math.round((date.getTime() - today.getTime()) / DAY);
    byId.set(f.id, {
      id: f.id, name: f.name, greeting: f.greeting,
      daysUntil: days, isNow: days >= -2 && days <= 1,
      hooks: f.hooks, palette: f.palette, nextYear: days < 0,
    });
  }

  return [...byId.values()].sort((a, b) => {
    if (a.nextYear !== b.nextYear) return a.nextYear ? 1 : -1;
    return a.daysUntil - b.daysUntil;
  });
}

function CountdownBadge({ f }: { f: FestivalEntry }) {
  const now = f.isNow || (!f.nextYear && f.daysUntil <= 1);
  return (
    <span
      className={`text-[11px] font-semibold tracking-wide rounded-full px-3 py-1 border whitespace-nowrap ${
        now
          ? 'bg-[color-mix(in_srgb,var(--success)_12%,transparent)] border-[color-mix(in_srgb,var(--success)_35%,transparent)] text-[var(--success)]'
          : 'bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border-[color-mix(in_srgb,var(--accent)_25%,transparent)] text-[var(--accent-soft)]'
      }`}
    >
      {now ? '🔥 Now' : f.nextYear ? 'Next year' : `in ${f.daysUntil}d`}
    </span>
  );
}

function FestivalCard({ f, index }: { f: FestivalEntry; index: number }) {
  const pal = PALETTES.find((p) => p.id === f.palette) ?? PALETTES[0];
  const linkCls =
    'inline-flex items-center justify-center gap-1.5 text-xs px-4 py-2 rounded-full border border-[var(--border)] text-[var(--text-soft)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-all';
  return (
    <div className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}>
      <Card hover className="p-6 h-full flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl border border-[var(--border)] flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${pal.bg1}, ${pal.accent})` }}
            title={pal.name}
            aria-label={`Poster palette: ${pal.name}`}
          />
          <CountdownBadge f={f} />
        </div>
        <h3 className="text-sm font-medium text-[var(--text)] leading-snug">{f.name}</h3>
        <p className="font-display text-2xl text-[var(--accent-soft)] mt-2 leading-snug">{f.greeting}</p>
        <div className="flex flex-wrap gap-1.5 mt-4 mb-5">
          {f.hooks.slice(0, 3).map((h) => (
            <span key={h} className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--hover-fill)] text-[var(--text-muted)]">
              {h}
            </span>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <Link href={`/campaign?festival=${f.id}`} className={linkCls}>
            <Megaphone size={12} /> Plan campaign
          </Link>
          <Link href={`/post-studio?festival=${f.id}`} className={linkCls}>
            <ImageIcon size={12} /> Create post
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function FestivalsPage() {
  // Built after mount — dates render differently on a UTC server than an
  // IST browser, and that divergence breaks hydration on deploy.
  const [roster, setRoster] = useState<FestivalEntry[]>([]);
  useEffect(() => { setRoster(buildRoster()); }, []);
  const now = roster.filter((f) => !f.nextYear && f.daysUntil <= 30);
  const later = roster.filter((f) => f.nextYear || f.daysUntil > 30);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] top-[-150px] right-[-100px]" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-14">
        <PageHeader
          eyebrow={<><Calendar size={11} /> Festival calendar</>}
          title="Never miss a festival"
          sub="GrowMitra plans your campaigns around what India is shopping for. Every festival below ships with ready-made campaign hooks and a poster palette — tap through and it's pre-loaded into your plan."
        />

        {now.length > 0 && (
          <section className="mb-12">
            <h2 className="flex items-center gap-2 text-xs font-semibold text-[var(--text-soft)] uppercase tracking-[0.18em] mb-5">
              <Flame size={13} className="text-[var(--gold)]" /> Happening now · This month
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {now.map((f, i) => <FestivalCard key={f.id} f={f} index={i} />)}
            </div>
          </section>
        )}

        {later.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-xs font-semibold text-[var(--text-soft)] uppercase tracking-[0.18em] mb-5">
              <Sparkles size={13} className="text-[var(--accent-soft)]" /> Coming up
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {later.map((f, i) => <FestivalCard key={f.id} f={f} index={i} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
