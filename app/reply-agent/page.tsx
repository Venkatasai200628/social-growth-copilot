'use client';

import { useState } from 'react';
import { MessageCircle, Loader2, Copy, Check, ChevronDown, AlertCircle, Zap, TrendingUp } from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { useToast } from '../components/Toast';

const categories = ['Food & Beverage','Fashion & Clothing','Tech Startup','Events','Real Estate','Education','Healthcare','Gold & Jewellery','Grocery','Beauty & Makeup','B2B Services','Local Business','Other'];
const tones = ['Friendly & Warm','Professional & Formal','Playful & Fun','Urgent & Sales-Driven','Empathetic & Caring','Bold & Confident','Luxury & Premium'];

interface Reply { style: string; text: string; conversion_tip: string; }
interface ReplyResult {
  intent: string; sentiment: string; urgency: string; purchase_probability: string;
  recommended_action: string;
  replies: Reply[];
  follow_up_message: string;
  red_flags: string;
  emoji_suggestion: string;
}

const sentimentColors: Record<string, string> = { positive:'#10b981', neutral:'#64748b', negative:'#ef4444', mixed:'#f59e0b' };
const urgencyColors: Record<string, string> = { low:'#10b981', medium:'#f59e0b', high:'#ef4444', urgent:'#dc2626' };
const styleAccents: Record<string, string> = { 'Warm & Conversational':'#f59e0b', 'Professional & Direct':'#22d3ee', 'Sales-Driven':'#a78bfa' };

function ReplyAgentInner() {
  const toast = useToast();
  const [form, setForm] = useState({ message:'', messageType:'comment', businessName:'', category:'', tone:'Friendly & Warm', productContext:'' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReplyResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<number | null>(null);
  const [copiedFollow, setCopiedFollow] = useState(false);

  const generate = async () => {
    if (!form.message.trim()) { setError('Please paste the incoming message.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const res = await fetch('/api/reply-agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Server error — check GROQ_API_KEY in .env.local');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      toast('Replies generated!', 'ai');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally { setLoading(false); }
  };

  const copyReply = (text: string, idx: number) => {
    navigator.clipboard.writeText(text); setCopied(idx); toast('Reply copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-amber-600/8 top-[-150px] right-[-100px]"/>
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-14">

        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 text-xs text-amber-400 font-light tracking-widest uppercase mb-4">
            <MessageCircle size={11}/> Auto-Reply Agent
          </div>
          <h1 className="text-5xl font-light text-white mb-3 tracking-wide" style={{ fontFamily:'Cormorant Garamond,serif' }}>
            Smart Reply Agent
          </h1>
          <p className="text-slate-400 text-sm font-light">Paste any DM or comment — get intent analysis, 3 conversion-focused replies, and a follow-up message.</p>
        </div>

        {/* Form */}
        <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Business Name</label>
              <input type="text" placeholder="e.g. Sri Lakshmi Jewellers..." value={form.businessName}
                onChange={e => setForm({...form,businessName:e.target.value})}
                className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-amber-500/30 text-sm font-light"/>
            </div>
            <div>
              <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Category</label>
              <div className="relative">
                <select value={form.category} onChange={e => setForm({...form,category:e.target.value})}
                  className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white focus:outline-none text-sm font-light appearance-none">
                  <option value="" className="bg-[#16161f]">Any category...</option>
                  {categories.map(c => <option key={c} value={c} className="bg-[#16161f]">{c}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Message Type</label>
              <div className="flex gap-3">
                {[{v:'comment',l:'💬 Comment'},{v:'dm',l:'📩 DM'}].map(({v,l}) => (
                  <button key={v} onClick={() => setForm({...form,messageType:v})}
                    className="flex-1 py-3 rounded-xl text-sm font-light border transition-all"
                    style={{ background:form.messageType===v?'rgba(245,158,11,0.15)':'rgba(255,255,255,0.02)', borderColor:form.messageType===v?'rgba(245,158,11,0.4)':'rgba(255,255,255,0.07)', color:form.messageType===v?'#f59e0b':'#475569' }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Reply Tone</label>
              <div className="relative">
                <select value={form.tone} onChange={e => setForm({...form,tone:e.target.value})}
                  className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white focus:outline-none text-sm font-light appearance-none">
                  {tones.map(t => <option key={t} value={t} className="bg-[#16161f]">{t}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none"/>
              </div>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Product / Business Context <span className="normal-case text-slate-700">(optional)</span></label>
            <input type="text" placeholder="e.g. Gold jewellery, delivery in 3 days, COD available, 10% off ongoing..."
              value={form.productContext} onChange={e => setForm({...form,productContext:e.target.value})}
              className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-amber-500/30 text-sm font-light"/>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-light text-slate-500 uppercase tracking-widest mb-2">Incoming Message *</label>
            <textarea rows={4} placeholder="Paste the DM or comment you received here..."
              value={form.message} onChange={e => setForm({...form,message:e.target.value})}
              className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-4 py-3 text-white placeholder-slate-700 focus:outline-none focus:border-amber-500/30 text-sm font-light resize-none"/>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 bg-red-500/8 border border-red-500/15 rounded-xl px-4 py-3 text-red-400 text-xs font-light">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0"/>{error}
            </div>
          )}

          <button onClick={generate} disabled={loading}
            className="w-full py-4 rounded-2xl font-light text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 hover:opacity-85"
            style={{ background:'linear-gradient(135deg,#d97706,#b45309)' }}>
            {loading ? <><Loader2 size={15} className="animate-spin"/>Generating replies...</> : <><Zap size={15}/>Generate Smart Replies</>}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-5 animate-slide-up">

            {/* Intent analysis bar */}
            <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6">
              <h3 className="text-xs font-light text-slate-500 uppercase tracking-widest mb-4">🔍 Intent Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                  { label:'Intent', val:result.intent, color:'#e2e8f0' },
                  { label:'Sentiment', val:result.sentiment, color:sentimentColors[result.sentiment]||'#64748b' },
                  { label:'Urgency', val:result.urgency, color:urgencyColors[result.urgency]||'#64748b' },
                  { label:'Buy Probability', val:result.purchase_probability, color: parseInt(result.purchase_probability||'0')>60?'#10b981':parseInt(result.purchase_probability||'0')>30?'#f59e0b':'#ef4444' },
                ].map(({label,val,color})=>(
                  <div key={label} className="bg-white/[0.02] rounded-2xl p-3 border border-white/[0.04]">
                    <div className="text-xs text-slate-500 font-light mb-1.5">{label}</div>
                    <div className="text-sm font-light capitalize" style={{color}}>{val}</div>
                  </div>
                ))}
              </div>
              <div className="bg-amber-500/8 border border-amber-500/15 rounded-2xl p-4">
                <div className="text-xs text-amber-400 font-light uppercase tracking-widest mb-1.5 flex items-center gap-1"><TrendingUp size={10}/>Recommended Action</div>
                <p className="text-sm text-slate-300 font-light">{result.recommended_action}</p>
              </div>
              {result.red_flags && result.red_flags !== 'None' && (
                <div className="mt-3 bg-red-500/8 border border-red-500/15 rounded-2xl p-4">
                  <div className="text-xs text-red-400 font-light uppercase tracking-widest mb-1">⚠️ Red Flags</div>
                  <p className="text-sm text-slate-400 font-light">{result.red_flags}</p>
                </div>
              )}
            </div>

            {/* 3 reply options */}
            <div className="space-y-4">
              {(result.replies || []).map((reply, idx) => {
                const accent = styleAccents[reply.style] || '#a78bfa';
                return (
                  <div key={idx} className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6"
                    style={{ borderLeft:`3px solid ${accent}35` }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-light px-3 py-1 rounded-full"
                        style={{ background:`${accent}12`, color:accent, border:`1px solid ${accent}25` }}>
                        {reply.style}
                      </span>
                      <button onClick={() => copyReply(reply.text, idx)}
                        className="flex items-center gap-1.5 text-xs bg-white/[0.04] border border-white/[0.07] rounded-xl px-3 py-1.5 text-slate-400 hover:bg-white/[0.07] transition-all font-light">
                        {copied===idx ? <><Check size={11} className="text-green-400"/>Copied</> : <><Copy size={11}/>Copy</>}
                      </button>
                    </div>
                    <p className="text-slate-200 text-sm font-light leading-relaxed bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] mb-3">
                      {reply.text}
                    </p>
                    {reply.conversion_tip && (
                      <p className="text-xs text-slate-500 font-light italic">{reply.conversion_tip}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Follow-up + emoji */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-light text-violet-400 uppercase tracking-widest">📩 Follow-up (send after 24hrs)</h3>
                  <button onClick={() => { navigator.clipboard.writeText(result.follow_up_message); setCopiedFollow(true); toast('Copied!'); setTimeout(()=>setCopiedFollow(false),2000); }}
                    className="text-slate-600 hover:text-slate-400 transition-colors">
                    {copiedFollow ? <Check size={12} className="text-green-400"/> : <Copy size={12}/>}
                  </button>
                </div>
                <p className="text-sm text-slate-300 font-light leading-relaxed">{result.follow_up_message}</p>
              </div>
              <div className="bg-[#16161f] border border-white/[0.06] rounded-3xl p-6">
                <h3 className="text-xs font-light text-amber-400 uppercase tracking-widest mb-3">✨ Emoji Suggestion</h3>
                <p className="text-3xl mb-2">{result.emoji_suggestion}</p>
                <p className="text-xs text-slate-500 font-light">Add to your reply for warmer tone</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ReplyAgentPage() {
  return <AuthGuard><ReplyAgentInner /></AuthGuard>;
}
