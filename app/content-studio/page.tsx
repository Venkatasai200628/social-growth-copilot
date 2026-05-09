"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FormData, CATEGORIES } from "@/lib/types";
import { ArrowLeft, ChevronRight, Copy, Check, Zap, TrendingUp, Hash, Clock, AlertTriangle, RefreshCw, Sparkles } from "lucide-react";

interface ReelFormat { format: string; description: string; example: string; difficulty: string; virality: number; }
interface Hook { hook: string; type: string; platform: string; }
interface ContentAngle { angle: string; description: string; example: string; }
interface HashtagSet { set_name: string; tags: string[]; }
interface PostingTime { platform: string; times: string[]; reason: string; }
interface StudioData {
  reel_formats: ReelFormat[];
  hooks: Hook[];
  content_angles: ContentAngle[];
  hashtag_sets: HashtagSet[];
  best_posting_times: PostingTime[];
  content_dont: string[];
}

const DIFF_COLOR: Record<string, string> = { Easy: "#10b981", Medium: "#f97316", Hard: "#ef4444" };
const HOOK_COLORS: Record<string, string> = { Curiosity: "#6c47ff", Shock: "#ef4444", Relatability: "#10b981", FOMO: "#f97316", Humor: "#0ea5e9" };

function CopyBtn({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ display:"flex", alignItems:"center", gap:4, padding: small ? "3px 8px" : "5px 10px", borderRadius:6, border:"1px solid var(--border)", background:"white", fontSize:11, color:"var(--text-secondary)", cursor:"pointer" }}>
      {copied ? <Check size={10} color="#10b981"/> : <Copy size={10}/>}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function LoadingState() {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:20 }}>
      <div style={{ width:60, height:60, borderRadius:"50%", border:"3px solid var(--brand-light)", borderTop:"3px solid var(--brand)", animation:"spin 1s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <h2 style={{ fontFamily:"var(--font-display)", margin:0 }}>Analysing trending content...</h2>
      <p style={{ color:"var(--text-secondary)", margin:0, fontSize:14 }}>Finding what works for your niche right now</p>
    </div>
  );
}

export default function ContentStudioPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData | null>(null);
  const [data, setData] = useState<StudioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"formats"|"hooks"|"angles"|"hashtags"|"timing"|"donts">("formats");

  const generate = useCallback(async (f: FormData) => {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/content-studio", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(f) });
      const json = await res.json();
      if (json.success) { setData(json.data); sessionStorage.setItem("sgc_studio", JSON.stringify(json.data)); }
      else setError(json.error);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem("sgc_form");
    if (!raw) { router.push("/"); return; }
    const f = JSON.parse(raw) as FormData;
    setForm(f);
    const cached = sessionStorage.getItem("sgc_studio");
    if (cached) { setData(JSON.parse(cached)); setLoading(false); }
    else generate(f);
  }, [router, generate]);

  if (loading) return <LoadingState />;
  if (error) return <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12 }}><p style={{ color:"#ef4444" }}>{error}</p><button onClick={() => form && generate(form)} style={{ padding:"9px 18px", borderRadius:8, background:"var(--brand)", color:"white", border:"none", cursor:"pointer" }}>Retry</button></div>;
  if (!data || !form) return null;

  const cat = CATEGORIES.find(c => c.value === form.category);

  const TABS = [
    { key:"formats", label:"Reel formats", icon:<Zap size={13}/> },
    { key:"hooks",   label:"Hooks",        icon:<Sparkles size={13}/> },
    { key:"angles",  label:"Content angles", icon:<TrendingUp size={13}/> },
    { key:"hashtags",label:"Hashtags",     icon:<Hash size={13}/> },
    { key:"timing",  label:"Best times",   icon:<Clock size={13}/> },
    { key:"donts",   label:"Avoid these",  icon:<AlertTriangle size={13}/> },
  ] as const;

  return (
    <div style={{ minHeight:"100vh", background:"var(--surface)" }}>
      <div style={{ maxWidth:860, margin:"0 auto", padding:"2rem 1.5rem 5rem" }}>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:28 }}>
          <button onClick={() => router.push("/campaign")} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"var(--text-secondary)", fontSize:14, padding:0 }}>
            <ArrowLeft size={16}/> Back
          </button>
          <button onClick={() => { sessionStorage.removeItem("sgc_studio"); form && generate(form); }}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:8, border:"1px solid var(--border)", background:"white", fontSize:12, color:"var(--text-secondary)", cursor:"pointer" }}>
            <RefreshCw size={12}/> Refresh ideas
          </button>
        </div>

        {/* Header */}
        <div className="animate-fade-up" style={{ marginBottom:24 }}>
          <p style={{ margin:"0 0 6px", fontSize:13, color:"var(--text-muted)", fontWeight:500 }}>STEP 4 OF 6 — CONTENT STUDIO</p>
          <h1 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"clamp(1.5rem,4vw,2.2rem)", margin:"0 0 8px" }}>
            Trending ideas for {cat?.label} {cat?.emoji}
          </h1>
          <p style={{ fontSize:14, color:"var(--text-secondary)", margin:0 }}>
            Content formats, hooks, and strategies that are performing right now in your category.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4, marginBottom:20, scrollbarWidth:"none" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, padding:"8px 14px", borderRadius:10, border: activeTab===t.key ? "2px solid var(--brand)" : "1.5px solid var(--border)", background: activeTab===t.key ? "var(--brand-light)" : "white", cursor:"pointer", fontSize:13, fontWeight:500, color: activeTab===t.key ? "var(--brand)" : "var(--text-secondary)", transition:"all .12s" }}>
              <span style={{ color: activeTab===t.key ? "var(--brand)" : "var(--text-muted)" }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* REEL FORMATS */}
        {activeTab === "formats" && (
          <div className="animate-fade-in" style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {data.reel_formats?.map((f, i) => (
              <div key={i} style={{ background:"white", borderRadius:14, border:"1px solid var(--border)", overflow:"hidden" }}>
                <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", background:"var(--surface-2)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:"var(--brand-light)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontWeight:800, fontSize:14, color:"var(--brand)" }}>{i+1}</div>
                    <h3 style={{ margin:0, fontFamily:"var(--font-display)", fontWeight:700, fontSize:15 }}>{f.format}</h3>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:99, background:`${DIFF_COLOR[f.difficulty]}20`, color:DIFF_COLOR[f.difficulty] }}>{f.difficulty}</span>
                    <span style={{ fontSize:13, fontWeight:700, color: f.virality>=80?"#10b981":f.virality>=65?"#f97316":"#ef4444" }}>{f.virality}/100</span>
                  </div>
                </div>
                <div style={{ padding:"14px 18px", display:"flex", flexDirection:"column", gap:8 }}>
                  <p style={{ margin:0, fontSize:13, color:"var(--text-secondary)", lineHeight:1.6 }}>{f.description}</p>
                  <div style={{ padding:"10px 14px", borderRadius:8, background:"#ede9ff", border:"1px solid #c4b5fd" }}>
                    <p style={{ margin:0, fontSize:13, color:"#4c1d95", fontWeight:500 }}>Example: {f.example}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HOOKS */}
        {activeTab === "hooks" && (
          <div className="animate-fade-in" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
            {data.hooks?.map((h, i) => (
              <div key={i} style={{ background:"white", borderRadius:12, border:"1px solid var(--border)", padding:"14px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:99, background:`${HOOK_COLORS[h.type]||"#6c47ff"}18`, color:HOOK_COLORS[h.type]||"#6c47ff" }}>{h.type}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ fontSize:11, color:"var(--text-muted)" }}>{h.platform}</span>
                    <CopyBtn text={h.hook} small />
                  </div>
                </div>
                <p style={{ margin:0, fontSize:14, color:"var(--text-primary)", lineHeight:1.6, fontWeight:500 }}>
                  &ldquo;{h.hook}&rdquo;
                </p>
              </div>
            ))}
          </div>
        )}

        {/* CONTENT ANGLES */}
        {activeTab === "angles" && (
          <div className="animate-fade-in" style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {data.content_angles?.map((a, i) => (
              <div key={i} style={{ background:"white", borderRadius:12, border:"1px solid var(--border)", padding:"16px 20px" }}>
                <h3 style={{ margin:"0 0 6px", fontFamily:"var(--font-display)", fontWeight:700, fontSize:15 }}>{a.angle}</h3>
                <p style={{ margin:"0 0 10px", fontSize:13, color:"var(--text-secondary)", lineHeight:1.6 }}>{a.description}</p>
                <div style={{ padding:"10px 14px", borderRadius:8, background:"#fff7ed", border:"1px solid #fed7aa" }}>
                  <p style={{ margin:0, fontSize:13, color:"#92400e" }}>Try this: {a.example}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* HASHTAGS */}
        {activeTab === "hashtags" && (
          <div className="animate-fade-in" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
            {data.hashtag_sets?.map((hs, i) => (
              <div key={i} style={{ background:"white", borderRadius:12, border:"1px solid var(--border)", padding:"14px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <h3 style={{ margin:0, fontFamily:"var(--font-display)", fontWeight:700, fontSize:14 }}>{hs.set_name} hashtags</h3>
                  <CopyBtn text={hs.tags.join(" ")} />
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {hs.tags?.map((t, j) => (
                    <span key={j} style={{ padding:"4px 10px", borderRadius:6, background:"#d1fae5", color:"#065f46", fontSize:12, fontWeight:500 }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ background:"var(--brand-light)", borderRadius:12, border:"2px dashed #c4b5fd", padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:8, cursor:"pointer" }}
              onClick={() => { const all = data.hashtag_sets?.flatMap(s=>s.tags).join(" "); navigator.clipboard.writeText(all); }}>
              <Copy size={18} color="var(--brand)"/>
              <p style={{ margin:0, fontSize:13, fontWeight:600, color:"var(--brand)" }}>Copy all hashtags</p>
            </div>
          </div>
        )}

        {/* TIMING */}
        {activeTab === "timing" && (
          <div className="animate-fade-in" style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {data.best_posting_times?.map((pt, i) => (
              <div key={i} style={{ background:"white", borderRadius:12, border:"1px solid var(--border)", padding:"16px 20px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                  <Clock size={16} color="var(--brand)"/>
                  <h3 style={{ margin:0, fontFamily:"var(--font-display)", fontWeight:700, fontSize:15 }}>{pt.platform}</h3>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:10 }}>
                  {pt.times?.map((t, j) => (
                    <span key={j} style={{ padding:"6px 14px", borderRadius:8, background:"var(--brand-light)", color:"var(--brand)", fontSize:14, fontWeight:700, fontFamily:"var(--font-display)" }}>{t}</span>
                  ))}
                </div>
                <p style={{ margin:0, fontSize:13, color:"var(--text-secondary)", lineHeight:1.5 }}>{pt.reason}</p>
              </div>
            ))}
          </div>
        )}

        {/* DON'TS */}
        {activeTab === "donts" && (
          <div className="animate-fade-in" style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <div style={{ padding:"14px 18px", borderRadius:12, background:"#fef2f2", border:"1px solid #fecaca", marginBottom:4 }}>
              <p style={{ margin:0, fontSize:14, color:"#991b1b", lineHeight:1.6 }}>
                These are the most common mistakes brands in <strong>{cat?.label}</strong> make on social media. Avoid all of them.
              </p>
            </div>
            {data.content_dont?.map((d, i) => (
              <div key={i} style={{ background:"white", borderRadius:12, border:"1px solid var(--border)", padding:"14px 18px", display:"flex", alignItems:"flex-start", gap:12 }}>
                <div style={{ width:24, height:24, borderRadius:"50%", background:"#fef2f2", border:"1px solid #fecaca", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                  <AlertTriangle size={12} color="#ef4444"/>
                </div>
                <p style={{ margin:0, fontSize:14, color:"var(--text-primary)", lineHeight:1.6 }}>{d}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:28 }}>
          <button onClick={() => router.push("/scorer")} style={{ display:"flex", alignItems:"center", gap:10, background:"var(--brand)", color:"white", border:"none", borderRadius:14, padding:"14px 28px", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"var(--font-display)", boxShadow:"0 4px 16px rgba(108,71,255,0.35)" }}
            onMouseOver={e=>(e.currentTarget.style.transform="translateY(-1px)")} onMouseOut={e=>(e.currentTarget.style.transform="translateY(0)")}>
            Score my captions <ChevronRight size={18}/>
          </button>
        </div>

      </div>
    </div>
  );
}
