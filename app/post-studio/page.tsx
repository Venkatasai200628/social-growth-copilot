'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, AlertCircle, Lock, Download, Clock, MessageSquare, Mic, MicOff, Upload, X,
  Image as ImageIcon, Send, Heart, MessageCircle, Instagram, Wallet,
  Camera, ChevronDown, Wand2, Trophy,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '../components/Toast';
import AuthGuard from '../components/AuthGuard';
import { Button, Card, Field, inputCls, CopyButton, Skeleton, Tabs } from '../components/ui';
import { renderPoster, PALETTES, POSTER_LAYOUTS, PosterFormat, PosterLayout } from '@/lib/poster';
import { LANGUAGES, upcomingFestivals } from '@/lib/india';
import { useSpeechRecognition } from '@/lib/use-speech';
import { authFetch, whatsappLink, downloadFile } from '@/lib/client';
import { CATEGORIES } from '@/lib/types';

const PLATFORMS = ['Instagram', 'WhatsApp', 'Facebook', 'Twitter/X', 'YouTube'];
const POST_TYPES = ['Feed Post', 'Reel', 'Story', 'Carousel', 'Ad Copy'];
const TONES = ['Luxury & Premium', 'Engaging & Warm', 'Bold & Confident', 'Playful & Fun', 'Professional', 'Urgent & Sales-Driven'];
const GOALS = ['Drive Sales', 'Brand Awareness', 'Generate Leads', 'Grow Followers', 'Promote Event', 'Product Launch'];

interface PosterBrief {
  palette: string;
  layout: string;
  kicker: string;
  headline: string;
  sub: string;
  offer_text: string;
}
interface PostData {
  poster: PosterBrief;
  caption: string;
  caption_b: string;
  hashtags: string[];
  first_comment: string;
  story_idea: string;
  best_time: string;
  whatsapp_message: string;
  reply_templates: { trigger: string; reply: string }[];
  image_prompt: string;
  image_url: string | null;
}

/* ── Poster stage: renders via lib/poster engine ─────────────── */
function PosterStage({
  result,
  brand,
  city,
  photo,
  onPhotoChange,
}: {
  result: PostData;
  brand: string;
  city?: string;
  photo: string | null;
  onPhotoChange?: (p: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<PosterFormat>('1:1');
  const [paletteId, setPaletteId] = useState(result.poster.palette);
  const [customColor, setCustomColor] = useState('#8b5cf6');
  const [layout, setLayout] = useState<PosterLayout>((result.poster.layout as PosterLayout) || 'modern');
  const [fontsReady, setFontsReady] = useState(false);
  const [activePhoto, setActivePhoto] = useState<string | null>(photo || result.image_url);
  const [phone, setPhone] = useState('');
  const [waMsg, setWaMsg] = useState(result.whatsapp_message);
  const toast = useToast();

  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && setFontsReady(true));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    setPaletteId(result.poster.palette);
    setLayout((result.poster.layout as PosterLayout) || 'modern');
    setActivePhoto(photo || result.image_url);
  }, [result, photo]);

  const draw = useCallback(async () => {
    if (!canvasRef.current || !fontsReady) return;
    await renderPoster(canvasRef.current, {
      format, layout, paletteId,
      kicker: result.poster.kicker,
      headline: result.poster.headline,
      sub: result.poster.sub,
      offer: result.poster.offer_text,
      brand: brand || 'Your Brand',
      city,
      photo: activePhoto,
    });
  }, [format, layout, paletteId, result, brand, city, activePhoto, fontsReady]);

  useEffect(() => { draw(); }, [draw]);

  const dataUrl = () => canvasRef.current?.toDataURL('image/png') ?? '';

  const download = () => {
    const url = dataUrl();
    if (url) downloadFile(url ? dataUrlBlob(url) : new Blob(), `${(brand || 'post').replace(/\s+/g, '_')}_${format.replace(':', 'x')}.png`);
  };
  const dataUrlBlob = (u: string) => {
    const b64 = u.split(',')[1];
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: 'image/png' });
  };

  const handleItemPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setActivePhoto(reader.result);
        onPhotoChange?.(reader.result);
        toast('Item photo updated on poster! ✨', 'ai');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* format + controls */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <Tabs
          tabs={[{ id: '1:1', label: 'Feed 1:1' }, { id: '4:5', label: 'Feed 4:5' }, { id: '9:16', label: 'Story 9:16' }]}
          active={format}
          onChange={(f) => setFormat(f as PosterFormat)}
        />
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={download}><Download size={13} />PNG</Button>
        </div>
      </div>

      {/* Hero Product / Item Visual Control Bar */}
      <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] flex items-center justify-between gap-3 flex-wrap text-xs">
        {activePhoto ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activePhoto} alt="Product visual" className="w-10 h-10 object-cover rounded-lg border border-[var(--border)] shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--text)] truncate">Hero Item Photo Active</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">Product image is composed directly into poster</p>
            </div>
            <label className="px-2.5 py-1 rounded-lg bg-[var(--input-bg)] border border-[var(--border)] text-[11px] text-[var(--text-soft)] hover:text-white cursor-pointer font-medium">
              Change Item Photo
              <input type="file" accept="image/*" onChange={handleItemPhotoUpload} className="hidden" />
            </label>
            <button
              type="button"
              onClick={() => { setActivePhoto(null); onPhotoChange?.(null); }}
              className="text-[11px] text-[var(--danger)] hover:underline ml-1"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 flex-1">
            <div>
              <p className="font-semibold text-[var(--text)]">Typographic Poster Mode</p>
              <p className="text-[10px] text-[var(--text-muted)]">Upload a photo of your product (burger, jewellery, dish) to feature it as the hero visual</p>
            </div>
            <label className="px-3 py-1.5 rounded-lg bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] text-xs text-[var(--accent-soft)] hover:text-white cursor-pointer flex items-center gap-1.5 font-medium shrink-0">
              <Upload size={12} /> Upload Product Photo
              <input type="file" accept="image/*" onChange={handleItemPhotoUpload} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {/* poster + IG context preview */}
      <div className="grid md:grid-cols-2 gap-6 items-start">
        <div className="relative group">
          <canvas ref={canvasRef} className="w-full rounded-2xl border border-[var(--border)] shadow-2xl" style={{ display: 'block' }} />
          {!fontsReady && <div className="absolute inset-0 shimmer rounded-2xl" />}
        </div>

        {/* Instagram-context preview — how followers will see it */}
        <div className="mx-auto w-full max-w-[340px] rounded-[2rem] border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xl">
          <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-[var(--border)]">
            <div className="w-8 h-8 rounded-full p-[2px]" style={{ background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)' }}>
              <div className="w-full h-full rounded-full bg-[var(--card)] flex items-center justify-center text-[11px] font-bold text-[var(--text)]">
                {(brand || 'G').charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--text)] truncate">{(brand || 'yourbrand').toLowerCase().replace(/\s+/g, '')}</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">{city || 'India'}</p>
            </div>
            <Instagram size={14} className="text-[var(--text-muted)]" />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl()}
            alt="Post preview"
            className={`w-full object-cover bg-[var(--bg-alt)] ${
              format === '9:16' ? 'aspect-[9/16]' : format === '4:5' ? 'aspect-[4/5]' : 'aspect-square'
            }`}
          />
          <div className="px-3.5 py-3">
            <div className="flex items-center gap-3 mb-2 text-[var(--text)]">
              <Heart size={16} /><MessageCircle size={16} /><Send size={16} />
              <span className="ml-auto text-[10px] text-[var(--text-muted)]">Preview</span>
            </div>
            <p className="text-[10px] text-[var(--text-soft)] leading-relaxed line-clamp-3">
              <span className="font-semibold">{(brand || 'yourbrand').toLowerCase().replace(/\s+/g, '')} </span>
              {result.caption.split('\n')[0]}
            </p>
          </div>
        </div>
      </div>

      {/* palette + layout pickers */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5">
              <Wand2 size={11} />Colour Mood & Palette ({PALETTES.length}+ Styles)
            </p>
            <label className="inline-flex items-center gap-1.5 text-xs text-[var(--accent-soft)] hover:underline cursor-pointer">
              <span>Custom:</span>
              <input
                type="color"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setPaletteId(`custom_${e.target.value.replace('#', '')}`);
                }}
                className="w-5 h-5 rounded-full border border-[var(--border)] cursor-pointer p-0 bg-transparent"
                title="Pick custom brand color"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
            {paletteId.startsWith('custom_') && (
              <button
                onClick={() => setPaletteId(paletteId)}
                title="Current Custom Brand Color"
                className="w-9 h-9 rounded-xl border-2 border-[var(--accent)] scale-110 shadow-md relative"
                style={{ background: customColor }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-bold">✓</span>
              </button>
            )}
            {PALETTES.map((p) => (
              <button key={p.id} onClick={() => setPaletteId(p.id)} title={p.name} aria-label={`Palette ${p.name}`}
                className={`w-9 h-9 rounded-xl border-2 transition-all ${paletteId === p.id ? 'border-[var(--accent)] scale-110 shadow-md' : 'border-[var(--border)] hover:scale-105'}`}
                style={{ background: `linear-gradient(135deg, ${p.bg1} 55%, ${p.accent} 55%)` }} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5"><ImageIcon size={11} />Layout</p>
          <div className="flex flex-wrap gap-2">
            {POSTER_LAYOUTS.map((l) => (
              <button key={l} onClick={() => setLayout(l)}
                className={`px-3.5 py-1.5 rounded-full text-xs capitalize border transition-all ${layout === l ? 'border-[var(--accent)] text-[var(--text)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* WhatsApp composer */}
      <Card className="p-5 border-[#25d366]/30" hover={false}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-[#25d366]/15 border border-[#25d366]/30 flex items-center justify-center">
            <Wallet size={14} className="text-[#128c4b] [[data-theme=dark]_&]:text-[#25d366]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text)]">Send it on WhatsApp</p>
            <p className="text-xs text-[var(--text-muted)]">Offer message ready — one tap to a customer, or copy for your status</p>
          </div>
        </div>
        <textarea
          value={waMsg}
          key={result.whatsapp_message}
          onChange={(e) => setWaMsg(e.target.value)}
          rows={3}
          className={inputCls + ' font-normal'}
        />
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <input
            type="tel" placeholder="Customer WhatsApp no. (with country code)" value={phone} onChange={(e) => setPhone(e.target.value)}
            className={inputCls + ' !mt-0 flex-1 min-w-[200px]'}
          />
          <a
            href={whatsappLink(phone, waMsg)}
            target="_blank" rel="noopener noreferrer"
            onClick={(e) => { if (!phone.replace(/\D/g, '')) { e.preventDefault(); toast('Enter a WhatsApp number first'); } }}
            className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-full font-medium text-white bg-[#25d366] hover:bg-[#1aad55] transition-colors"
          >
            <Send size={14} />Send
          </a>
          <CopyButton text={waMsg} label="Copy for status" className="!py-2.5" />
        </div>
      </Card>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
function PostStudioInner() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();

  const [form, setForm] = useState({
    businessName: '', category: 'Gold & Jewellery', productDescription: '', targetAudience: '',
    city: '', platform: 'Instagram', postType: 'Feed Post', tone: 'Luxury & Premium',
    goal: 'Drive Sales', offer: '', customPrompt: '',
  });
  const [language] = useState('english');
  const [festival, setFestival] = useState('');

  // Festivals page deep-link: /post-studio?festival=diwali
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get('festival');
    if (f) setFestival(f);
  }, []);
  const [photo, setPhoto] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<PostData | null>(null);

  // Restore the last generation AFTER hydration — reading sessionStorage in
  // the initial render makes server and client HTML diverge (hydration error).
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('gm_post_result') || 'null');
      if (saved) setResult(saved);
    } catch { /* corrupt save — start fresh */ }
  }, []);
  const updateResult = (r: PostData | null) => { setResult(r); try { if (r) sessionStorage.setItem('gm_post_result', JSON.stringify(r)); else sessionStorage.removeItem('gm_post_result'); } catch { /* quota */ } };
  const [error, setError] = useState('');
  const [tab, setTab] = useState('poster');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const lang = LANGUAGES.find((l) => l.id === language) ?? LANGUAGES[0];
  const speech = useSpeechRecognition(lang.speechCode);
  const fileRef = useRef<HTMLInputElement>(null);
  const [festivals, setFestivals] = useState<ReturnType<typeof upcomingFestivals>>([]);
  useEffect(() => { setFestivals(upcomingFestivals(new Date(), 45)); }, []);

  // Every signed-in user can generate unlimited posts.
  const canGenerate = true;

  // Voice transcript flows into the description field
  useEffect(() => {
    if (speech.transcript) setForm((f) => ({ ...f, productDescription: speech.transcript }));
  }, [speech.transcript]);

  const onPhoto = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Please choose an image file'); return; }
    const rd = new FileReader();
    rd.onload = () => { setPhoto(rd.result as string); toast('Photo added — it becomes the hero of your poster ✨', 'ai'); };
    rd.readAsDataURL(file);
  };

  const generate = async () => {
    if (!canGenerate) return;
    if (!form.businessName || !form.productDescription) { setError('Business name and product description are required.'); return; }
    setError(''); setGenerating(true); updateResult(null); setTab('poster');
    try {
      const res = await authFetch('/api/generate-post', {
        ...form, language, festival, hasPhoto: !!photo,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.caption) data.caption = data.caption.replace(/\[BREAK\]/g, '\n');
      if (data.caption_b) data.caption_b = data.caption_b.replace(/\[BREAK\]/g, '\n');
      if (!data.poster) data.poster = { palette: 'diwaliMaroon', layout: 'modern', kicker: festival || 'New Post', headline: form.businessName, sub: form.offer || form.productDescription.slice(0, 60), offer_text: form.offer || '' };
      updateResult(data);
      // Save to post history in localStorage
      try {
        const historyItem = {
          id: Date.now().toString(),
          businessName: form.businessName || 'My Business',
          caption: data.caption,
          createdAt: Date.now(),
        };
        const history = JSON.parse(localStorage.getItem('growmitra_post_history') || '[]');
        history.unshift(historyItem);
        localStorage.setItem('growmitra_post_history', JSON.stringify(history.slice(0, 20)));
      } catch { /* localStorage unavailable */ }
      toast('Your post is ready! ✨', 'ai');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong — please try again in a moment.');
    } finally { setGenerating(false); }
  };

  if (!user) return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-xs">
        <div className="w-12 h-12 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] flex items-center justify-center mx-auto mb-5"><Lock size={20} className="text-[var(--accent-soft)]" /></div>
        <h2 className="text-2xl font-display font-bold text-[var(--text)] mb-3">Sign in required</h2>
        <p className="text-[var(--text-muted)] text-sm mb-7">Post Studio is for Growth and Pro plan members.</p>
        <Button onClick={() => router.push('/auth')}>Sign In / Sign Up</Button>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] top-[-150px] right-[-100px]" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-10 gap-4 flex-wrap">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] uppercase text-[var(--accent-soft)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] rounded-full px-4 py-1.5">
              <Sparkles size={11} /> Post Studio
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold mt-5 text-[var(--text)] leading-tight">Create a Post</h1>
            <p className="text-[var(--text-muted)] mt-3 max-w-xl text-sm leading-relaxed">
              Add a product photo, tell us about your sale — by voice or text, in your language — and get a festival-ready poster, caption and WhatsApp message.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_480px] gap-6 items-start">
          {/* ── Form ── */}
          <Card className="p-7 space-y-5">
            {/* Photo */}
            <div>
              <p className="text-xs font-medium text-[var(--text-soft)] tracking-wide uppercase mb-2 flex items-center gap-2"><Camera size={12} />Product photo (optional — becomes the poster hero)</p>
              <div className="flex gap-3 items-start">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] flex flex-col items-center justify-center gap-1 text-[var(--text-muted)] hover:text-[var(--accent-soft)] transition-all overflow-hidden flex-shrink-0"
                  aria-label="Upload product photo"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {photo ? <img src={photo} alt="Product" className="w-full h-full object-cover" /> : <><Upload size={18} /><span className="text-[10px]">Add photo</span></>}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0] ?? null)} />
                <div className="text-xs text-[var(--text-muted)] leading-relaxed pt-1">
                  A plain phone photo works — we compose it into the poster with a festival frame, headline and your offer.
                  {photo && <button onClick={() => setPhoto(null)} className="block mt-1.5 text-[var(--danger)] hover:underline flex items-center gap-1"><X size={11} />Remove photo</button>}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Business name *">
                <input className={inputCls} placeholder="Sri Lakshmi Jewellers" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
              </Field>
              <Field label="City">
                <input className={inputCls} placeholder="Hyderabad" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
            </div>

            {/* Voice + description */}
            <Field label="What are you promoting? *" hint="Speak or type — one line is enough">
              <div className="relative">
                <textarea rows={3} className={inputCls + ' pr-14'} placeholder="Diwali sale — 20% off on all gold bangles, gift boxes available…"
                  value={form.productDescription} onChange={(e) => { setForm({ ...form, productDescription: e.target.value }); speech.setTranscript(e.target.value); }} />
                <button
                  onClick={() => (speech.listening ? speech.stop() : speech.start())}
                  aria-label={speech.listening ? 'Stop voice input' : 'Start voice input'}
                  className={`absolute right-3 top-3 w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                    speech.listening
                      ? 'bg-[color-mix(in_srgb,var(--danger)_15%,transparent)] border-[color-mix(in_srgb,var(--danger)_40%,transparent)] text-[var(--danger)] animate-pulse'
                      : 'bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border-[color-mix(in_srgb,var(--accent)_25%,transparent)] text-[var(--accent-soft)] hover:bg-[color-mix(in_srgb,var(--accent)_20%,transparent)]'
                  }`}
                >
                  {speech.listening ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
              </div>
              {speech.listening && <p className="text-xs text-[var(--accent-soft)] mt-1.5 animate-pulse">Listening… {speech.interim}</p>}
              {speech.error && <p className="text-xs text-[var(--gold)] mt-1.5">{speech.error}</p>}
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Festival mood">
                <div className="relative">
                  <select className={inputCls + ' appearance-none'} value={festival} onChange={(e) => setFestival(e.target.value)} aria-label="Festival mood">
                    <option value="">Everyday (no festival)</option>
                    {festivals.map((f) => (
                      <option key={f.id} value={f.id}>{f.name} · {f.daysUntil <= 1 ? 'now!' : `in ${f.daysUntil}d`}</option>
                    ))}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/3 text-[var(--text-faint)] pointer-events-none" />
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {([
                { label: 'Category', key: 'category', options: CATEGORIES.map((c) => c.value) },
                { label: 'Platform', key: 'platform', options: PLATFORMS },
                { label: 'Post type', key: 'postType', options: POST_TYPES },
                { label: 'Tone', key: 'tone', options: TONES },
                { label: 'Goal', key: 'goal', options: GOALS },
              ] as const).map(({ label, key, options }) => (
                <Field key={key} label={label}>
                  <select className={inputCls} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
                    {options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
              ))}
              <Field label="Offer">
                <input className={inputCls} placeholder="Flat 20% off" value={form.offer} onChange={(e) => setForm({ ...form, offer: e.target.value })} />
              </Field>
            </div>

            {/* Advanced */}
            <div>
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-1.5 transition-colors">
                <ChevronDown size={12} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                Advanced — audience & style instructions
              </button>
              {showAdvanced && (
                <div className="mt-3 space-y-4 animate-fade-in">
                  <Field label="Target audience">
                    <input className={inputCls} placeholder="Women 25–45, weddings & festive shopping" value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} />
                  </Field>
                  <Field label="Style instructions" hint="Overrides AI defaults — e.g. dark luxury with gold accents">
                    <textarea rows={2} className={inputCls} value={form.customPrompt} onChange={(e) => setForm({ ...form, customPrompt: e.target.value })} />
                  </Field>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] border border-[color-mix(in_srgb,var(--danger)_20%,transparent)] rounded-xl px-4 py-3 text-[var(--danger)] text-xs">
                <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />{error}
              </div>
            )}

            <Button onClick={generate} disabled={generating || !canGenerate} size="lg" className="w-full">
              {generating ? 'Designing your post…' : <><Wand2 size={15} />Generate Post</>}
            </Button>
          </Card>

          {/* ── Result ── */}
          <div className="space-y-4">
            {generating && (
              <Card className="p-6 space-y-3">
                <Skeleton className="w-full aspect-square" />
                <Skeleton className="w-3/4 h-3" /><Skeleton className="w-full h-3" /><Skeleton className="w-1/2 h-3" />
                <p className="text-xs text-[var(--text-muted)] text-center pt-2 animate-pulse">Writing your caption, picking a palette, framing the festival mood…</p>
              </Card>
            )}

            {!result && !generating && (
              <Card className="p-10 text-center min-h-[320px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-3xl bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] border border-[color-mix(in_srgb,var(--accent)_15%,transparent)] flex items-center justify-center mb-4">
                  <Sparkles size={26} className="text-[var(--accent-soft)] opacity-50" />
                </div>
                <p className="text-lg font-display text-[color-mix(in_srgb,var(--text)_60%,transparent)]">Your post appears here</p>
                <p className="text-[var(--text-faint)] text-xs mt-1">Poster · caption · hashtags · WhatsApp message</p>
              </Card>
            )}

            {result && (
              <div className="animate-slide-up space-y-4">
                <Tabs
                  tabs={[
                    { id: 'poster', label: 'Poster' },
                    { id: 'caption', label: 'Caption A/B' },
                    { id: 'extras', label: 'Timing & Replies' },
                  ]}
                  active={tab}
                  onChange={setTab}
                />

                {tab === 'poster' && (
                  <Card className="p-4 animate-fade-in">
                    <PosterStage
                      result={result}
                      brand={form.businessName}
                      city={form.city}
                      photo={photo || result.image_url}
                      onPhotoChange={setPhoto}
                    />
                  </Card>
                )}

                {tab === 'caption' && (
                  <Card className="p-6 animate-fade-in space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1.5"><Trophy size={11} className="text-[var(--gold)]" />Version A — main</span>
                        <CopyButton text={result.caption + '\n\n' + result.hashtags.join(' ')} label="Copy caption + tags" />
                      </div>
                      <div className="bg-[var(--bg-alt)] rounded-2xl p-4 border border-[var(--border)]">
                        <p className="text-sm text-[var(--text-soft)] leading-relaxed whitespace-pre-wrap">{result.caption}</p>
                        <p className="text-xs text-[var(--accent-soft)] mt-3 leading-relaxed">{result.hashtags.join(' ')}</p>
                      </div>
                    </div>
                    {result.caption_b && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs uppercase tracking-widest text-[var(--text-muted)]">Version B — challenger hook</span>
                          <CopyButton text={result.caption_b} label="Copy B" />
                        </div>
                        <div className="bg-[var(--bg-alt)] rounded-2xl p-4 border border-[var(--border)]">
                          <p className="text-sm text-[var(--text-soft)] leading-relaxed whitespace-pre-wrap">{result.caption_b}</p>
                        </div>
                        <p className="text-xs text-[var(--text-faint)] mt-2">
                          Post A first, then B to a similar audience — keep whichever gets more saves and shares. Score both in the <a href="/scorer" className="text-[var(--accent-soft)] hover:underline">Caption Scorer</a>.
                        </p>
                      </div>
                    )}
                    <div className="flex items-start gap-2.5 bg-[color-mix(in_srgb,var(--gold)_8%,transparent)] border border-[color-mix(in_srgb,var(--gold)_20%,transparent)] rounded-2xl p-4">
                      <Clock size={13} className="text-[var(--gold)] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-[var(--text-soft)]">Best time to post: <span className="text-[var(--gold)] font-medium">{result.best_time}</span> · First comment: {result.first_comment}</p>
                    </div>
                  </Card>
                )}

                {tab === 'extras' && (
                  <Card className="p-6 animate-fade-in space-y-5">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-2 flex items-center gap-1.5"><MessageSquare size={11} />Story idea</p>
                      <p className="text-sm text-[var(--text-soft)] leading-relaxed">{result.story_idea}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-3">Ready replies for DMs</p>
                      <div className="space-y-3">
                        {(result.reply_templates || []).map((rt, i) => (
                          <div key={i} className="bg-[var(--bg-alt)] border border-[var(--border)] rounded-2xl p-4">
                            <p className="text-xs text-[var(--text-muted)] italic mb-1.5">&ldquo;{rt.trigger}&rdquo;</p>
                            <div className="flex items-start gap-3">
                              <p className="text-sm text-[var(--text-soft)] leading-relaxed flex-1">{rt.reply}</p>
                              <CopyButton text={rt.reply} label="" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {result.image_url && (
                      <div>
                        <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-2">AI background image (optional)</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={result.image_url} alt="AI generated" className="w-full rounded-2xl border border-[var(--border)]" />
                      </div>
                    )}
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PostStudioPage() {
  return <AuthGuard><PostStudioInner /></AuthGuard>;
}
