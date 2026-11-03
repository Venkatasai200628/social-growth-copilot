'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Download, Wand2, ArrowRight,
  Camera, UserCheck, Layers, Video, ChevronDown, Check,
} from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { useToast } from '../components/Toast';
import { PageHeader, Card, Field, inputCls, Button } from '../components/ui';
import { authFetch, downloadFile } from '@/lib/client';
import { CATEGORIES } from '@/lib/types';

interface GeneratedConcept {
  id: string;
  url: string;
  title: string;
  prompt: string;
  style: string;
  timestamp: number;
}

const VISUAL_STYLES = [
  {
    id: 'ai_presenter',
    name: 'AI Human Presenter',
    desc: 'Charismatic Indian brand ambassador / creator holding & presenting product',
    icon: UserCheck,
    promptPrefix: 'Vertical 9:16 portrait of an attractive, charismatic Indian brand ambassador creator smiling warmly, presenting and holding',
    promptSuffix: 'modern luxury studio background, 8k resolution, crisp facial detail, cinematic lighting, photorealistic',
  },
  {
    id: 'product_macro',
    name: 'Photorealistic Product Macro',
    desc: 'Commercial studio hero shot, dramatic lighting & rich textures',
    icon: Camera,
    promptPrefix: 'Vertical 9:16 commercial advertisement macro hero still of',
    promptSuffix: 'studio lighting, clean reflection, pristine luxury presentation, 8k resolution, photorealistic',
  },
  {
    id: 'lifestyle_scene',
    name: 'Lifestyle & Customer Story',
    desc: 'Authentic Indian store, kitchen or boutique setting with customer delight',
    icon: Layers,
    promptPrefix: 'Vertical 9:16 lifestyle advertisement photo of happy Indian customers experiencing',
    promptSuffix: 'authentic warm Indian atmosphere, vibrant natural daylight, candid commercial aesthetic',
  },
  {
    id: 'festival_poster_shot',
    name: 'Festival Celebration Mood',
    desc: 'Diwali, Eid, Pongal or festive celebration still with golden glowing ambience',
    icon: Sparkles,
    promptPrefix: 'Vertical 9:16 festive Indian celebration commercial photography of',
    promptSuffix: 'festive golden warm bokeh, marigold and diya glow, celebration mood, 8k commercial quality',
  },
];

function VisualStudioInner() {
  const router = useRouter();
  const toast = useToast();

  const [form, setForm] = useState({
    businessName: '',
    category: 'Gold & Jewellery',
    conceptPrompt: '',
    style: 'ai_presenter',
    aspect: '9:16' as '9:16' | '1:1' | '16:9',
    count: 2,
  });

  const [loading, setLoading] = useState(false);
  const [concepts, setConcepts] = useState<GeneratedConcept[]>([]);
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);

  // Generate concept visuals
  const generateConcepts = async () => {
    if (!form.conceptPrompt.trim()) {
      toast('Please enter your product or campaign concept idea', 'error');
      return;
    }

    setLoading(true);
    const styleObj = VISUAL_STYLES.find((s) => s.id === form.style) ?? VISUAL_STYLES[0];
    const newItems: GeneratedConcept[] = [];

    try {
      for (let i = 0; i < form.count; i++) {
        setGeneratingIdx(i);
        const variation = i === 0 ? 'hero showcase angle' : i === 1 ? 'detailed closeup angle' : 'lifestyle angle';
        const fullPrompt = `${styleObj.promptPrefix} ${form.conceptPrompt.trim()} (${form.category || 'Retail'}), ${variation}, ${styleObj.promptSuffix}`;

        const res = await authFetch('/api/scene-image', {
          prompt: fullPrompt,
          aspect: form.aspect,
        });

        const data = await res.json();
        if (data.imageDataUrl) {
          const cleanTitle = (form.conceptPrompt.slice(0, 32).replace(/[^a-zA-Z0-9]+/g, '_') || 'Concept') + `_${styleObj.id}_${i + 1}`;
          newItems.push({
            id: `concept-${Date.now()}-${i}`,
            url: data.imageDataUrl,
            title: cleanTitle,
            prompt: form.conceptPrompt,
            style: styleObj.name,
            timestamp: Date.now(),
          });
        }
      }

      setConcepts((prev) => [...newItems, ...prev]);
      toast(`Generated ${newItems.length} concept image${newItems.length > 1 ? 's' : ''}!`, 'ai');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not generate images', 'error');
    } finally {
      setLoading(false);
      setGeneratingIdx(null);
    }
  };

  // Convert dataURL to Blob and download with clean concept-derived title
  const handleDownload = (concept: GeneratedConcept) => {
    try {
      const b64 = concept.url.split(',')[1];
      const bin = atob(b64);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      const blob = new Blob([arr], { type: 'image/png' });
      downloadFile(blob, `${concept.title}.png`);
      toast(`Downloaded "${concept.title}.png"!`, 'ai');
    } catch {
      toast('Could not download image', 'error');
    }
  };

  // Pre-load image into Video Studio and navigate
  const sendToVideoStudio = (concept: GeneratedConcept) => {
    try {
      const existing = JSON.parse(sessionStorage.getItem('gm_uploaded_photos') || '[]');
      existing.unshift(concept.url);
      sessionStorage.setItem('gm_uploaded_photos', JSON.stringify(existing.slice(0, 4)));
    } catch { /* ignore */ }
    toast('Image sent to Video Studio! Navigating...', 'ai');
    router.push('/video-studio');
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] top-[-100px] right-[-100px]" />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-14">

        <PageHeader
          eyebrow={<><Wand2 size={11} /> AI Visual Concept Studio</>}
          title="AI Visuals & Presenters"
          sub="Generate photorealistic product concepts & AI human creators for your brand. Download them or send directly into Video Studio."
        />

        {/* Concept Input Form */}
        <Card className="p-6 md:p-8 mb-10">
          <div className="grid md:grid-cols-2 gap-5 mb-5">
            <Field label="Business Name">
              <input
                className={inputCls}
                placeholder="e.g. Sri Lakshmi Jewellers or Amrita College..."
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              />
            </Field>

            <Field label="Category">
              <div className="relative">
                <select
                  className={inputCls + ' appearance-none'}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
              </div>
            </Field>
          </div>

          <Field label="What product, presenter or scene do you want to generate?">
            <textarea
              className={inputCls + ' min-h-[90px]'}
              placeholder="e.g. An Indian female presenter smiling warmly, presenting admission letters for Intermediate graduates in a modern college campus... or 22k antique gold necklace on velvet..."
              value={form.conceptPrompt}
              onChange={(e) => setForm({ ...form, conceptPrompt: e.target.value })}
            />
          </Field>

          {/* Visual Style Selection */}
          <div className="mt-5">
            <label className="block text-xs text-[var(--text-muted)] uppercase tracking-widest mb-3">
              Select Visual Concept Style
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              {VISUAL_STYLES.map((st) => {
                const Icon = st.icon;
                const active = form.style === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setForm({ ...form, style: st.id })}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      active
                        ? 'bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] border-[var(--accent)] text-[var(--text)]'
                        : 'bg-[var(--card)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/40 hover:text-[var(--text)]'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: active ? 'var(--accent)' : 'var(--input-bg)', color: active ? '#ffffff' : 'var(--text-muted)' }}
                    >
                      <Icon size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
                        {st.name} {active && <Check size={12} className="text-[var(--accent-soft)]" />}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-tight mt-0.5">{st.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls: Dimensions & Number of Variations */}
          <div className="grid sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-[var(--border)]">
            <div>
              <label className="block text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">Dimensions</label>
              <div className="flex gap-2">
                {[
                  { id: '9:16', label: '9:16 Reels / Shorts' },
                  { id: '1:1', label: '1:1 Square Feed' },
                  { id: '16:9', label: '16:9 Landscape' },
                ].map((ar) => (
                  <button
                    key={ar.id}
                    type="button"
                    onClick={() => setForm({ ...form, aspect: ar.id as '9:16' | '1:1' | '16:9' })}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs border transition-all ${
                      form.aspect === ar.id
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] uppercase tracking-widest mb-2">Variations to Generate</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm({ ...form, count: n })}
                    className={`flex-1 py-2 rounded-xl text-xs border transition-all ${
                      form.count === n
                        ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                        : 'bg-[var(--input-bg)] border-[var(--input-border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {n} {n === 1 ? 'Shot' : 'Shots'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-[var(--text-muted)]">
              Images download with concept titles so they stay organized for your campaigns.
            </p>
            <Button
              onClick={generateConcepts}
              disabled={loading || !form.conceptPrompt.trim()}
              loading={loading}
            >
              <Sparkles size={14} /> {loading ? (generatingIdx !== null ? `Generating Shot ${generatingIdx + 1}…` : 'Generating AI Images…') : 'Generate Concept Visuals'}
            </Button>
          </div>
        </Card>

        {/* Gallery of Generated Concepts */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-[var(--text)]">Your Concept Gallery</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Download images or pass them directly to Video Studio</p>
            </div>
            {concepts.length > 0 && (
              <button
                onClick={() => router.push('/video-studio')}
                className="text-xs text-[var(--accent-soft)] hover:underline flex items-center gap-1.5"
              >
                Go to Video Studio <ArrowRight size={12} />
              </button>
            )}
          </div>

          {concepts.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)] flex items-center justify-center mx-auto mb-3">
                <Camera size={20} className="text-[var(--accent-soft)]" />
              </div>
              <h3 className="font-display text-base font-bold text-[var(--text)] mb-1">No visuals generated yet</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mb-4">
                Enter your business idea above and choose &ldquo;AI Human Presenter&rdquo; or &ldquo;Product Showcase&rdquo; to create visuals.
              </p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {concepts.map((item) => (
                <div
                  key={item.id}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-4 flex flex-col justify-between hover:border-[var(--accent)]/40 transition-all shadow-lg"
                >
                  <div className="w-full aspect-[9/16] bg-[var(--bg-alt)] rounded-2xl overflow-hidden relative border border-[var(--border-soft)] mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-contain bg-black/40"
                    />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white font-medium">
                      {item.style}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[var(--text)] truncate mb-1" title={item.title}>
                      {item.title}.png
                    </h4>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mb-4 leading-relaxed">
                      {item.prompt}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-soft)]">
                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-medium border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--hover-fill)] text-[var(--text)] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Download size={12} /> Download
                    </button>
                    <button
                      type="button"
                      onClick={() => sendToVideoStudio(item)}
                      className="flex-1 py-2 px-3 rounded-xl text-xs font-medium text-white transition-all flex items-center justify-center gap-1.5 [background:linear-gradient(135deg,var(--accent),var(--accent-soft))]"
                    >
                      <Video size={12} /> Use in Video
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function VisualStudioPage() {
  return (
    <AuthGuard>
      <VisualStudioInner />
    </AuthGuard>
  );
}
