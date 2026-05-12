"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormData, CATEGORIES, GOALS } from "@/lib/types";
import { calcBudgetStrategy } from "@/lib/budget";
import { ArrowLeft, ChevronRight, Users, TrendingUp, Megaphone, Target, Wallet } from "lucide-react";

function budgetLabel(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)}L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`;
  return `₹${v}`;
}

function reach(n: number) {
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n/1000).toFixed(0)}K`;
  return `${n}`;
}

export default function StrategyPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("sgc_form");
    if (!raw) { router.push("/"); return; }
    setForm(JSON.parse(raw));
  }, [router]);

  if (!form) return null;

  const strategy = calcBudgetStrategy(parseInt(form.budget) || 0, form.platforms);
  const cat = CATEGORIES.find(c => c.value === form.category);
  const goal = GOALS.find(g => g.value === form.goal);

  const stats = [
    { icon: <Users size={18}/>, label: "Influencer tier",  value: strategy.tierLabel,               color: "#6c47ff" },
    { icon: <TrendingUp size={18}/>, label: "Expected reach", value: `${reach(strategy.reachMin)}–${reach(strategy.reachMax)}`, color: "#10b981" },
    { icon: <Megaphone size={18}/>, label: "Best platform",  value: strategy.bestPlatform,            color: "#f97316" },
    { icon: <Wallet size={18}/>, label: "Boost budget",    value: budgetLabel(strategy.boostBudget), color: "#0ea5e9" },
  ];

  const handleNext = () => router.push("/campaign");

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>

        {/* Back */}
        <button onClick={() => router.back()} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "var(--text-secondary)", fontSize: 14, padding: 0, marginBottom: 28,
        }}>
          <ArrowLeft size={16}/> Back
        </button>

        {/* Header */}
        <div className="animate-fade-up" style={{ marginBottom: 28 }}>
          <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>STEP 2 OF 6 — BUDGET STRATEGY</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.6rem,4vw,2.4rem)", margin: "0 0 10px" }}>
            Here&apos;s your game plan
          </h1>
          <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>
            Based on your budget of <strong>{budgetLabel(form.budget)}</strong>, here&apos;s what we recommend.
          </p>
        </div>

        {/* Product summary card */}
        <div className="animate-fade-up delay-1" style={{
          background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius)",
          padding: "16px 20px", marginBottom: 16,
          display: "flex", gap: 16, alignItems: "center",
        }}>
          <div style={{ fontSize: 32 }}>{cat?.emoji}</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16, fontFamily: "var(--font-display)" }}>{form.productName}</p>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
              {cat?.label} · Goal: {goal?.label}
            </p>
          </div>
          <div style={{
            background: "var(--brand-light)", color: "var(--brand)",
            borderRadius: 99, padding: "4px 12px", fontSize: 13, fontWeight: 600,
          }}>
            {budgetLabel(form.budget)}
          </div>
        </div>

        {/* Stat cards */}
        <div className="animate-fade-up delay-2" style={{
          display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 10, marginBottom: 16,
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius)",
              padding: "16px 18px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  background: `${s.color}18`, color: s.color,
                }}>
                  {s.icon}
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>{s.label}</span>
              </div>
              <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--text-primary)" }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Strategy detail */}
        <div className="animate-fade-up delay-3" style={{
          background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius)",
          overflow: "hidden", marginBottom: 16,
        }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>
              Recommended strategy
            </h3>
          </div>
          <div style={{ padding: "20px" }}>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {strategy.summary}
            </p>

            {strategy.influencerCount > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <BudgetRow label={`${strategy.influencerCount} influencer${strategy.influencerCount > 1 ? "s" : ""} × ${budgetLabel(strategy.costPerInfluencer)}`}
                  value={budgetLabel(strategy.influencerCount * strategy.costPerInfluencer)}
                  percent={Math.round((strategy.influencerCount * strategy.costPerInfluencer / form.budget) * 100)}
                  color="#6c47ff" />
                <BudgetRow label="Paid post boosting"
                  value={budgetLabel(strategy.boostBudget)}
                  percent={Math.round((strategy.boostBudget / form.budget) * 100)}
                  color="#f97316" />
              </div>
            )}
          </div>
        </div>

        {/* Platform breakdown */}
        <div className="animate-fade-up delay-4" style={{
          background: "white", border: "1px solid var(--border)", borderRadius: "var(--radius)",
          padding: "20px", marginBottom: 28,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Target size={16} color="var(--brand)" />
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>
              Your platforms
            </h3>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {form.platforms.map(p => (
              <span key={p} style={{
                padding: "6px 14px", borderRadius: 99,
                border: "1.5px solid var(--border)",
                fontSize: 13, fontWeight: 500, color: "var(--text-secondary)",
                background: "var(--surface-2)",
              }}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
                {p === strategy.bestPlatform.toLowerCase() && (
                  <span style={{ marginLeft: 6, color: "var(--accent)", fontSize: 11 }}>★ best fit</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Next CTA */}
        <div className="animate-fade-up delay-5" style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={handleNext} style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "var(--brand)", color: "white",
            border: "none", borderRadius: "var(--radius)",
            padding: "14px 28px", fontSize: 15, fontWeight: 600,
            cursor: "pointer", fontFamily: "var(--font-display)",
            boxShadow: "0 4px 16px rgba(108,71,255,0.35)",
          }}
            onMouseOver={e => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseOut={e => (e.currentTarget.style.transform = "translateY(0)")}
          >
            Generate my 7-day campaign
            <ChevronRight size={18}/>
          </button>
        </div>

      </div>
    </div>
  );
}

function BudgetRow({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
        <span style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{value} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({percent}%)</span></span>
      </div>
      <div style={{ height: 6, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${percent}%`, background: color, borderRadius: 99, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}
