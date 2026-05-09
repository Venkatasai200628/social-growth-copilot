'use client';

import { useState } from 'react';
import { Zap, Loader2, Copy, Check, ChevronDown, AlertCircle } from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { useToast } from '../components/Toast';

const categories = ['Food & Beverage','Fashion & Clothing','Tech Startup','Events & Hackathons','Real Estate','Education & Courses','Healthcare & Wellness','Gold & Jewellery','Grocery & FMCG','Beauty & Makeup','B2B Services','Local Business','Fitness & Gym','Travel & Tourism','Entertainment','Other'];
const goals = ['Brand Awareness','Drive Sales / Conversions','Generate Leads','Grow Followers','Promote Event','Launch New Product','Re-engagement'];
const platformOptions = ['Instagram','Facebook','Twitter/X','LinkedIn','YouTube','WhatsApp'];

const BUDGET_TIERS = [
  { label:'Micro — Under ₹5,000', min:0, max:4999, desc:'100% organic, no paid ads', color:'#22d3ee' },
  { label:'Small — ₹5K to ₹25K', min:5000, max:24999, desc:'Mostly organic + small boosts', color:'#10b981' },
  { label:'Medium — ₹25K to ₹1L', min:25000, max:99999, desc:'Paid ads + micro-influencers', color:'#7c3aed' },
  { label:'Large — ₹1L+', min:100000, max:Infinity, desc:'Full-funnel multi-platform', color:'#f59e0b' },
];

function parseMarkdown(text: string) {
  return text
    .replace(/^## (.+)$/gm,'<h2>$1</h2>')
    .replace(/^### (.+)$/gm,'<h3>$1</h3>')
    .replace(/^\*\*(.+)\*\*$/gm,'<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/^- (.+)$/gm,'<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g,m=>`<ul>${m}</ul>`)
    .replace(/\n\n/g,'</p><p>')
    .replace(/<p><\/p>/g,'');
}

function CampaignInner() {
  const toast = useToast();
  const [form, setForm] = useState({ product:'', category:'', goal:'', budget:'', targetAudience:'', platforms:[] as string[], duration:'7' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const budgetNum = parseInt(form.budget) || 0;
  const currentTier = BUDGET_TIERS.find(t => budgetNum >= t.min && budgetNum <= t.max) || BUDGET_TIERS[0];

  const togglePlatform = (p: string) => setForm(prev => ({
    ...prev,
    platforms: prev.platforms.includes(p) ? prev.platforms.filter(x=>x!==p) : [...prev.platforms,p],
  }));

  const generate = async () => {
    if (!form.product||!form.category||!form.goal||!form.budget) { setError('Please fill in Product, Category, Goal, and Budget.'); return; }
    setError(''); setLoading(true); setResult('');
    try {
      const res = await fetch('/api/generate-campaign', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form),
      });
      const ct = res.headers.get('content-type')||'';
      if (!ct.includes('application/json')) throw new Error('Server error — check GROQ_API_KEY in .env.local');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data.result);
      toast('Campaign generated!','ai');
    } catch(e:unknown) { setError(e instanceof Error?e.message:'Something went wrong'); }
    finally { setLoading(false); }
  };

  const copy = () => { navigator.clipboard.writeText(result); setCopied(true); toast('Campaign copied!'); setTimeout(()=>setCopied(false),2000); };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-violet-600/10 top-[-150px] right-[-100px]"/>
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-14">

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs text-violet-400 font-light tracking-widest uppercase mb-4">
            <Zap size={11}/> Smart Campaign Generator
          </div>
          <h1 className="text-5xl font-light text-white mb-3 tracking-wide" style={{fontFamily:'Cormorant Garamond,serif'}}>
            Build Your Campaign
          </h1>
          <p className="text-slate-400 text-sm font-light">Product + goal + budget → complete multi-day campaign. Strategy changes based on your exact budget.</p>
        </div>

        <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-5">

            <div className="md:col-span-2">
              <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Product / Service *</label>
              <input type="text" placeholder="e.g. Gold jewellery shop in Nellore, SaaS HR tool, Biryani restaurant..."
                value={form.product} onChange={e=>setForm({...form,product:e.target.value})}
                className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/30 text-sm font-light"/>
            </div>

            <div>
              <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Category *</label>
              <div className="relative">
                <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}
                  className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white focus:outline-none text-sm font-light appearance-none">
                  <option value="" className="bg-[#16161f]">Select category...</option>
                  {categories.map(c=><option key={c} value={c} className="bg-[#16161f]">{c}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Campaign Goal *</label>
              <div className="relative">
                <select value={form.goal} onChange={e=>setForm({...form,goal:e.target.value})}
                  className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white focus:outline-none text-sm font-light appearance-none">
                  <option value="" className="bg-[#16161f]">Select goal...</option>
                  {goals.map(g=><option key={g} value={g} className="bg-[#16161f]">{g}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"/>
              </div>
            </div>

            {/* Budget with tier indicator */}
            <div>
              <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Total Budget (₹) *</label>
              <input type="number" placeholder="e.g. 5000, 50000, 500000"
                value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}
                className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/30 text-sm font-light"/>
              {form.budget && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{background:currentTier.color}}/>
                  <span className="text-xs font-light" style={{color:currentTier.color}}>{currentTier.label}</span>
                  <span className="text-xs text-slate-600 font-light">— {currentTier.desc}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Duration</label>
              <div className="relative">
                <select value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}
                  className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white focus:outline-none text-sm font-light appearance-none">
                  {['3','5','7','10','14','30'].map(d=><option key={d} value={d} className="bg-[#16161f]">{d} days</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"/>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Target Audience</label>
              <input type="text" placeholder="e.g. Women 25-45 interested in weddings and gold, Tier 1 cities..."
                value={form.targetAudience} onChange={e=>setForm({...form,targetAudience:e.target.value})}
                className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-violet-500/30 text-sm font-light"/>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-3">Platforms</label>
              <div className="flex flex-wrap gap-2">
                {platformOptions.map(p=>(
                  <button key={p} onClick={()=>togglePlatform(p)}
                    className="text-xs px-3 py-2 rounded-xl border font-light transition-all"
                    style={{ background:form.platforms.includes(p)?'rgba(124,58,237,0.15)':'rgba(255,255,255,0.02)', borderColor:form.platforms.includes(p)?'rgba(124,58,237,0.4)':'rgba(255,255,255,0.07)', color:form.platforms.includes(p)?'#a78bfa':'#475569' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-2 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3 text-red-400 text-xs font-light">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0"/>{error}
            </div>
          )}

          <button onClick={generate} disabled={loading}
            className="mt-6 w-full py-4 rounded-2xl font-light text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:opacity-85"
            style={{background:'linear-gradient(135deg,#7c3aed,#6d28d9)'}}>
            {loading ? <><Loader2 size={15} className="animate-spin"/>Generating Campaign...</> : <><Zap size={15}/>Generate Full Campaign</>}
          </button>
        </div>

        {result && (
          <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-light text-white" style={{fontFamily:'Cormorant Garamond,serif'}}>Your Campaign</h2>
              <button onClick={copy} className="flex items-center gap-1.5 text-xs bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-1.5 text-slate-400 hover:bg-white/[0.07] transition-all font-light">
                {copied ? <><Check size={11} className="text-green-400"/>Copied</> : <><Copy size={11}/>Copy All</>}
              </button>
            </div>
            <div className="prose-output" dangerouslySetInnerHTML={{__html:parseMarkdown(result)}}/>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CampaignPage() {
  return <AuthGuard><CampaignInner /></AuthGuard>;
}
