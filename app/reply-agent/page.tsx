'use client';

import { useState } from 'react';
import { MessageCircle, ChevronDown, AlertCircle, Zap, TrendingUp,
  Search, AlertTriangle, Send, Smile, Mail } from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { useToast } from '../components/Toast';
import { PageHeader, Card, Field, inputCls, Button, CopyButton, Skeleton } from '../components/ui';
import { authFetch } from '@/lib/client';

const categories = ['Food & Beverage','Fashion & Clothing','Tech Startup','Events','Real Estate','Education','Healthcare','Gold & Jewellery','Grocery','Beauty & Makeup','B2B Services','Local Business','Other'];
const tones = ['Friendly & Warm','Professional & Formal','Playful & Fun','Urgent & Sales-Driven','Empathetic & Caring','Bold & Confident','Luxury & Premium'];

interface Reply { style: string; text: string; conversion_tip: string; }
interface ReplyResult {
  intent: string; sentiment: string; urgency: string;
  recommended_action: string;
  replies: Reply[];
  follow_up_message: string;
  red_flags: string;
  emoji_suggestion: string;
}

const sentimentColors: Record<string, string> = { positive:'var(--success)', neutral:'var(--text-muted)', negative:'var(--danger)', mixed:'var(--gold)' };
const urgencyColors: Record<string, string> = { low:'var(--success)', medium:'var(--gold)', high:'var(--danger)', urgent:'var(--danger)' };
const styleAccents: Record<string, string> = { 'Warm & Conversational':'var(--gold)', 'Professional & Direct':'var(--neon)', 'Sales-Driven':'var(--accent-soft)' };

function ReplyAgentInner() {
  const toast = useToast();
  const [form, setForm] = useState({ message:'', messageType:'comment', businessName:'', category:'', tone:'Friendly & Warm', productContext:'', language:'english' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReplyResult | null>(null);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!form.message.trim()) { setError('Please paste the incoming message.'); return; }
    setError(''); setLoading(true); setResult(null);
    try {
      const res = await authFetch('/api/reply-agent', form, { method: 'POST' });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        console.error('reply-agent returned non-JSON', res.status);
        throw new Error('Something went wrong on our side — please try again in a moment.');
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      toast('Replies generated!', 'ai');
    } catch (e: unknown) {
      console.error('Reply generation failed:', e);
      setError(e instanceof Error && e.message !== 'Failed to fetch'
        ? e.message
        : 'Something went wrong on our side — please try again in a moment.');
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[color-mix(in_srgb,var(--gold)_8%,transparent)] top-[-150px] right-[-100px]"/>
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-14">

        <PageHeader
          eyebrow={<><MessageCircle size={11} /> Auto-Reply Agent</>}
          title="Smart Reply Agent"
          sub="Paste any DM or comment — get intent analysis, 3 conversion-focused replies, and a follow-up message."
        />

        {/* Form */}
        <Card className="p-6 md:p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <Field label="Business Name">
              <input className={inputCls} placeholder="e.g. Sri Lakshmi Jewellers..." value={form.businessName}
                onChange={e => setForm({...form,businessName:e.target.value})} />
            </Field>
            <Field label="Category">
              <div className="relative">
                <select className={inputCls + ' appearance-none'} value={form.category} onChange={e => setForm({...form,category:e.target.value})}>
                  <option value="">Any category...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/3 text-[var(--text-faint)] pointer-events-none"/>
              </div>
            </Field>
            <Field label="Message Type">
              <div className="flex gap-3 mt-2">
                {[{v:'comment',l:'Comment',Icon:MessageCircle},{v:'dm',l:'DM',Icon:Mail}].map(({v,l,Icon}) => (
                  <button key={v} onClick={() => setForm({...form,messageType:v})} aria-pressed={form.messageType===v}
                    className={`flex-1 py-3 rounded-xl text-sm border transition-all flex items-center justify-center gap-1.5 ${
                      form.messageType===v
                        ? 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] border-[color-mix(in_srgb,var(--accent)_40%,transparent)] text-[var(--accent-soft)]'
                        : 'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}>
                    <Icon size={12}/>{l}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Reply Tone">
              <div className="relative">
                <select className={inputCls + ' appearance-none'} value={form.tone} onChange={e => setForm({...form,tone:e.target.value})}>
                  {tones.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/3 text-[var(--text-faint)] pointer-events-none"/>
              </div>
            </Field>
          </div>

          <div className="mb-5">
            <Field label="Product / Business Context">
              <input className={inputCls} placeholder="e.g. Gold jewellery, delivery in 3 days, COD available, 10% off ongoing..."
                value={form.productContext} onChange={e => setForm({...form,productContext:e.target.value})} />
            </Field>
          </div>

          <Field label="Incoming Message *">
            <textarea rows={4} className={inputCls + ' resize-none'} placeholder="Paste the DM or comment you received here..."
              value={form.message} onChange={e => setForm({...form,message:e.target.value})} />
          </Field>

          {error && (
            <div className="mt-5 flex items-start gap-2 bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] border border-[color-mix(in_srgb,var(--danger)_20%,transparent)] rounded-xl px-4 py-3 text-[var(--danger)] text-xs">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0"/>{error}
            </div>
          )}

          <Button onClick={generate} loading={loading} size="lg" className="w-full mt-6">
            {loading ? 'Generating replies…' : <><Zap size={15}/>Generate Smart Replies</>}
          </Button>
        </Card>

        {/* Loading skeleton */}
        {loading && (
          <Card className="p-8 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
            <p className="text-xs text-[var(--text-muted)] text-center animate-pulse">Reading the message, drafting replies…</p>
          </Card>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-5 animate-slide-up">

            {/* Intent analysis bar */}
            <Card className="p-6">
              <h3 className="text-xs text-[var(--text-muted)] uppercase tracking-widest mb-4 flex items-center gap-1.5"><Search size={12} className="text-[var(--text-soft)]"/> Intent Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                  { label:'Intent', val:result.intent, color:'var(--text)' },
                  { label:'Sentiment', val:result.sentiment, color:sentimentColors[result.sentiment]||'var(--text-muted)' },
                  { label:'Urgency', val:result.urgency, color:urgencyColors[result.urgency]||'var(--text-muted)' },
                ].map(({label,val,color})=>(
                  <div key={label} className="bg-[var(--bg-alt)] rounded-2xl p-3 border border-[var(--border)]">
                    <div className="text-xs text-[var(--text-muted)] mb-1.5">{label}</div>
                    <div className="text-sm font-semibold capitalize" style={{color}}>{val}</div>
                  </div>
                ))}
              </div>
              <div className="bg-[color-mix(in_srgb,var(--gold)_8%,transparent)] border border-[color-mix(in_srgb,var(--gold)_20%,transparent)] rounded-2xl p-4">
                <div className="text-xs text-[var(--gold)] uppercase tracking-widest mb-1.5 flex items-center gap-1"><TrendingUp size={10}/>Recommended Action</div>
                <p className="text-sm text-[var(--text-soft)]">{result.recommended_action}</p>
              </div>
              {result.red_flags && result.red_flags !== 'None' && (
                <div className="mt-3 bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] border border-[color-mix(in_srgb,var(--danger)_20%,transparent)] rounded-2xl p-4">
                  <div className="text-xs text-[var(--danger)] uppercase tracking-widest mb-1 flex items-center gap-1.5"><AlertTriangle size={11}/> Red Flags</div>
                  <p className="text-sm text-[var(--text-soft)]">{result.red_flags}</p>
                </div>
              )}
            </Card>

            {/* 3 reply options */}
            <div className="space-y-4">
              {(result.replies || []).map((reply, idx) => {
                const accent = styleAccents[reply.style] || 'var(--accent-soft)';
                return (
                  <Card key={idx} className="p-6"
                    style={{ borderLeft: '3px solid color-mix(in srgb, ' + accent + ' 45%, transparent)' }}>
                    <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                      <span className="text-xs px-3 py-1 rounded-full"
                        style={{ background: 'color-mix(in srgb, ' + accent + ' 12%, transparent)', color: accent, border: '1px solid color-mix(in srgb, ' + accent + ' 25%, transparent)' }}>
                        {reply.style}
                      </span>
                      <CopyButton text={reply.text} label="Copy reply" />
                    </div>
                    <p className="text-[var(--text)] text-sm leading-relaxed bg-[var(--bg-alt)] rounded-xl p-4 border border-[var(--border)] mb-3">
                      {reply.text}
                    </p>
                    {reply.conversion_tip && (
                      <p className="text-xs text-[var(--text-muted)] italic">{reply.conversion_tip}</p>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Follow-up + emoji */}
            <div className="grid md:grid-cols-2 gap-5">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h3 className="text-xs text-[var(--accent-soft)] uppercase tracking-widest flex items-center gap-1.5"><Send size={11}/> Follow-up (send after 24hrs)</h3>
                  <CopyButton text={result.follow_up_message} label="" />
                </div>
                <p className="text-sm text-[var(--text-soft)] leading-relaxed">{result.follow_up_message}</p>
              </Card>
              <Card className="p-6">
                <h3 className="text-xs text-[var(--gold)] uppercase tracking-widest mb-3 flex items-center gap-1.5"><Smile size={12}/> Emoji Suggestion</h3>
                <p className="text-3xl mb-2">{result.emoji_suggestion}</p>
                <p className="text-xs text-[var(--text-muted)]">Add to your reply for warmer tone</p>
              </Card>
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
