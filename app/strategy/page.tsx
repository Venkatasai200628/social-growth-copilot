'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, Users, Rocket, Target, TrendingUp } from 'lucide-react';
import { calcBudgetStrategy } from '@/lib/budget';
import { PageHeader, Card, Field, inputCls } from '../components/ui';
import { useTheme } from '../components/ThemeProvider';

const PLATFORMS = ['Instagram', 'Facebook', 'WhatsApp', 'YouTube', 'Twitter/X'];

export default function StrategyPage() {
  const { theme } = useTheme();
  const [budget, setBudget] = useState('10000');
  const [platform, setPlatform] = useState('Instagram');

  const budgetNum = parseInt(budget) || 0;
  const s = calcBudgetStrategy(budgetNum, [platform.toLowerCase()]);

  const influencerSpend = s.influencerCount * s.costPerInfluencer;
  const data = [
    { name: 'Creator partnerships', value: influencerSpend },
    { name: 'Boosted posts', value: s.boostBudget },
  ].filter((d) => d.value > 0);
  const COLORS = ['#8b5cf6', theme === 'light' ? '#0891b2' : '#22d3ee'];
  const tooltipStyle = {
    background: theme === 'light' ? '#ffffff' : '#16161f',
    border: `1px solid ${theme === 'light' ? '#e6e2f4' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 12, color: theme === 'light' ? '#191a2e' : '#e2e8f0', fontFamily: 'Poppins', fontSize: 12,
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] top-[-150px] right-[-100px]" />
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-14">
        <PageHeader
          eyebrow={<><Wallet size={11} /> Budget Strategy</>}
          title="Where should your money go?"
          sub="Move the slider to your budget — see the split between creator partnerships and boosted posts, and what reach to expect. Same math your campaign plan uses."
        />

        <div className="grid lg:grid-cols-[400px_1fr] gap-6 items-start">
          <Card className="p-7 space-y-5">
            <Field label="Total budget (₹)">
              <input type="range" min={1000} max={100000} step={500} value={budgetNum}
                onChange={(e) => setBudget(e.target.value)} className="w-full mt-4 accent-[var(--accent)]" aria-label="Budget slider" />
              <input type="number" className={inputCls} value={budget} onChange={(e) => setBudget(e.target.value)} aria-label="Budget rupees" />
            </Field>
            <Field label="Main platform">
              <select className={inputCls} value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform">
                {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
            <div className="rounded-2xl bg-[var(--bg-alt)] border border-[var(--border)] p-4">
              <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">Expected reach</p>
              <p className="font-display text-2xl font-bold text-[var(--text)]">
                {s.reachMin.toLocaleString()} – {s.reachMax.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--text-faint)] mt-1">per campaign, on {s.bestPlatform}</p>
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="p-7">
              <div className="flex items-center gap-2 mb-1">
                <Target size={15} className="text-[var(--accent-soft)]" />
                <p className="text-sm font-medium text-[var(--text)]">{s.tierLabel}</p>
              </div>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">{s.summary}</p>
              {data.length > 0 && (
                <div className="grid sm:grid-cols-[200px_1fr] gap-6 items-center">
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={data} dataKey="value" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="none">
                          {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v: number | string) => `₹${Number(v).toLocaleString('en-IN')}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {data.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-sm text-[var(--text-soft)]">
                          <span className="w-3 h-3 rounded" style={{ background: COLORS[i] }} />{d.name}
                        </span>
                        <span className="text-sm font-semibold text-[var(--text)]">₹{d.value.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                      <span className="text-sm text-[var(--text-muted)]">Total</span>
                      <span className="text-sm font-semibold text-[var(--text)]">₹{budgetNum.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <div className="grid sm:grid-cols-2 gap-5">
              <Card className="p-6">
                <Users size={16} className="text-[var(--accent-soft)] mb-3" />
                <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">Creators</p>
                <p className="font-display text-3xl font-bold text-[var(--text)] mb-1">
                  {s.influencerCount > 0 ? `${s.influencerCount} × ₹${s.costPerInfluencer.toLocaleString('en-IN')}` : 'Organic only'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {s.influencerCount > 0 ? `${s.tier === 'nano' ? 'Nano (1K–10K)' : s.tier === 'micro' ? 'Micro (10K–100K)' : 'Mid-tier (100K+)'} creators per post` : 'Save the budget — post consistently instead'}
                </p>
              </Card>
              <Card className="p-6">
                <Rocket size={16} className="text-[var(--neon)] mb-3" />
                <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">Boost budget</p>
                <p className="font-display text-3xl font-bold text-[var(--text)] mb-1">₹{s.boostBudget.toLocaleString('en-IN')}</p>
                <p className="text-xs text-[var(--text-muted)]">Put this behind your best-performing post of week one</p>
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex items-start gap-3">
                <TrendingUp size={16} className="text-[var(--success)] mt-0.5" />
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  This is exactly how your generated campaign splits its budget. Ready for the full plan —
                  captions, calendar and posting times? <a href="/campaign" className="text-[var(--accent-soft)] hover:underline">Build your campaign →</a>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
