'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Flame, Megaphone, ImageIcon, Sparkles, Plus, Trash2, X, Tag } from 'lucide-react';
import { PageHeader, Card, Button } from '../components/ui';
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
  nextYear: boolean;
  isCustom?: boolean;
}

interface CustomFestivalStorage {
  id: string;
  name: string;
  greeting: string;
  date: string; // YYYY-MM-DD
  palette: string;
  hooks: string[];
}

function loadCustomFestivals(): CustomFestivalStorage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('gm_custom_festivals');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomFestivals(list: CustomFestivalStorage[]) {
  try {
    localStorage.setItem('gm_custom_festivals', JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function buildRoster(customList: CustomFestivalStorage[] = []): FestivalEntry[] {
  const today = new Date();
  const byId = new Map<string, FestivalEntry>();

  // 1. Standard upcoming festivals
  for (const f of upcomingFestivals(today, 400)) {
    const existing = byId.get(f.id);
    if (!existing || f.daysUntil < existing.daysUntil) {
      byId.set(f.id, {
        id: f.id,
        name: f.name,
        greeting: f.greeting,
        daysUntil: f.daysUntil,
        isNow: f.isNow,
        hooks: f.hooks,
        palette: f.palette,
        nextYear: false,
      });
    }
  }

  for (const f of FESTIVALS) {
    if (byId.has(f.id)) continue;
    const date = new Date(f.dates[0] + 'T00:00:00');
    const days = Math.round((date.getTime() - today.getTime()) / DAY);
    byId.set(f.id, {
      id: f.id,
      name: f.name,
      greeting: f.greeting,
      daysUntil: days,
      isNow: days >= -2 && days <= 1,
      hooks: f.hooks,
      palette: f.palette,
      nextYear: days < 0,
    });
  }

  // 2. Custom User-Created Festivals & Sales Events
  for (const cf of customList) {
    const date = new Date(cf.date + 'T00:00:00');
    const days = Math.round((date.getTime() - today.getTime()) / DAY);
    byId.set(cf.id, {
      id: cf.id,
      name: cf.name,
      greeting: cf.greeting,
      daysUntil: days,
      isNow: days >= -2 && days <= 1,
      hooks: cf.hooks,
      palette: cf.palette,
      nextYear: days < -2,
      isCustom: true,
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

function FestivalCard({
  f,
  index,
  onDeleteCustom,
}: {
  f: FestivalEntry;
  index: number;
  onDeleteCustom?: (id: string) => void;
}) {
  const pal = PALETTES.find((p) => p.id === f.palette) ?? PALETTES[0];
  const linkCls =
    'inline-flex items-center justify-center gap-1.5 text-xs px-4 py-2 rounded-full border border-[var(--border)] text-[var(--text-soft)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-all';

  return (
    <div className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}>
      <Card hover className="p-6 h-full flex flex-col relative overflow-hidden">
        {f.isCustom && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Tag size={10} /> Custom Event
            </span>
            {onDeleteCustom && (
              <button
                type="button"
                onClick={() => onDeleteCustom(f.id)}
                title="Delete this custom festival"
                className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors rounded"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xl border border-[var(--border)] flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${pal.bg1}, ${pal.accent})` }}
            title={pal.name}
            aria-label={`Poster palette: ${pal.name}`}
          />
          <CountdownBadge f={f} />
        </div>

        <h3 className="text-sm font-semibold text-[var(--text)] leading-snug">{f.name}</h3>
        <p className="font-display text-xl text-[var(--accent-soft)] mt-2 leading-snug">{f.greeting}</p>

        <div className="flex flex-wrap gap-1.5 mt-4 mb-5">
          {f.hooks.slice(0, 3).map((h) => (
            <span
              key={h}
              className="text-[11px] px-2.5 py-1 rounded-full bg-[var(--hover-fill)] text-[var(--text-muted)]"
            >
              {h}
            </span>
          ))}
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Link href={`/campaign?festival=${encodeURIComponent(f.id)}`} className={linkCls}>
            <Megaphone size={12} /> Plan campaign
          </Link>
          <Link href={`/post-studio?festival=${encodeURIComponent(f.id)}`} className={linkCls}>
            <ImageIcon size={12} /> Create post
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function FestivalsPage() {
  const [roster, setRoster] = useState<FestivalEntry[]>([]);
  const [customList, setCustomList] = useState<CustomFestivalStorage[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for Adding Custom Festival
  const [formName, setFormName] = useState('');
  const [formGreeting, setFormGreeting] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formPalette, setFormPalette] = useState('festiveYellow');
  const [formHooks, setFormHooks] = useState('');

  useEffect(() => {
    const customs = loadCustomFestivals();
    setCustomList(customs);
    setRoster(buildRoster(customs));
  }, []);

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDate) return;

    const id = `custom_${Date.now()}`;
    const hooksArray = formHooks.trim()
      ? formHooks.split(',').map((h) => h.trim()).filter(Boolean)
      : ['anniversary mega discounts', 'exclusive store offers', 'limited time gift vouchers'];

    const newCustom: CustomFestivalStorage = {
      id,
      name: formName.trim(),
      greeting: formGreeting.trim() || `Happy ${formName.trim()}! Special Offers For You`,
      date: formDate,
      palette: formPalette,
      hooks: hooksArray,
    };

    const updated = [newCustom, ...customList];
    setCustomList(updated);
    saveCustomFestivals(updated);
    setRoster(buildRoster(updated));

    // Reset Form
    setFormName('');
    setFormGreeting('');
    setFormDate('');
    setFormHooks('');
    setShowAddModal(false);
  };

  const handleDeleteCustom = (id: string) => {
    if (!confirm('Are you sure you want to remove this custom festival/event?')) return;
    const updated = customList.filter((item) => item.id !== id);
    setCustomList(updated);
    saveCustomFestivals(updated);
    setRoster(buildRoster(updated));
  };

  const now = roster.filter((f) => !f.nextYear && f.daysUntil <= 30);
  const later = roster.filter((f) => f.nextYear || f.daysUntil > 30);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] top-[-150px] right-[-100px]" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <PageHeader
            eyebrow={<><Calendar size={11} /> Pan-Indian Festival & Offer Calendar</>}
            title="Celebrate every festival & event"
            sub="GrowMitra synchronizes your marketing with regional Indian shopping occasions — from Makar Sankranti and Pongal to Ugadi, Eid, Tamil New Year, and Diwali. Or create your own custom store celebration below!"
          />
          <Button
            size="md"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 shrink-0 self-start md:self-auto shadow-md"
          >
            <Plus size={15} /> Add Custom Festival / Sale
          </Button>
        </div>

        {/* Modal: Add Custom Festival or Offer Event */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
                  <Sparkles size={16} className="text-[var(--accent)]" /> Add Custom Festival or Store Sale
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddCustom} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-soft)] mb-1">
                    Event / Festival Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. 5th Store Anniversary Sale, Regional Utsav, Bonalu"
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-soft)] mb-1">
                    Greeting or Offer Tagline
                  </label>
                  <input
                    type="text"
                    value={formGreeting}
                    onChange={(e) => setFormGreeting(e.target.value)}
                    placeholder="e.g. Celebrating 5 Golden Years! Flat 25% Off"
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-soft)] mb-1">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-soft)] mb-1">
                      Poster Palette
                    </label>
                    <select
                      value={formPalette}
                      onChange={(e) => setFormPalette(e.target.value)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-2.5 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none"
                    >
                      {PALETTES.map((pal) => (
                        <option key={pal.id} value={pal.id}>
                          {pal.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-soft)] mb-1">
                    Campaign Hooks (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formHooks}
                    onChange={(e) => setFormHooks(e.target.value)}
                    placeholder="e.g. flat 20% off all items, free gold coin with purchase, limited weekend gift hampers"
                    className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Add Event & Update Calendar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {now.length > 0 && (
          <section className="mb-12">
            <h2 className="flex items-center gap-2 text-xs font-semibold text-[var(--text-soft)] uppercase tracking-[0.18em] mb-5">
              <Flame size={13} className="text-[var(--gold)]" /> Happening now · This month
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {now.map((f, i) => (
                <FestivalCard
                  key={f.id}
                  f={f}
                  index={i}
                  onDeleteCustom={f.isCustom ? handleDeleteCustom : undefined}
                />
              ))}
            </div>
          </section>
        )}

        {later.length > 0 && (
          <section>
            <h2 className="flex items-center gap-2 text-xs font-semibold text-[var(--text-soft)] uppercase tracking-[0.18em] mb-5">
              <Sparkles size={13} className="text-[var(--accent-soft)]" /> Coming up
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {later.map((f, i) => (
                <FestivalCard
                  key={f.id}
                  f={f}
                  index={i}
                  onDeleteCustom={f.isCustom ? handleDeleteCustom : undefined}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
