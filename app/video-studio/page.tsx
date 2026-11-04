'use client';

import { useState, useEffect } from 'react';
import { Film, ChevronDown, Sparkles, AlertCircle, RefreshCw, Download, Clock, Music, Camera,
  Fish, Target, Mic, PenLine, Image as ImageIcon, Clapperboard, Scissors, Megaphone,
  Edit3, Check, Palette, Layers, Layout, Monitor, CheckCircle2, Wand2, Plus, Trash2, Zap } from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { useToast } from '../components/Toast';
import { Button, Card, Field, inputCls, CopyButton, Skeleton, Tabs, PageHeader, EmptyState } from '../components/ui';
import { authFetch } from '@/lib/client';
import { renderPromoVideo, downloadVideo, RenderResult, VIDEO_THEMES, VIDEO_TRANSITIONS,
  VIDEO_FORMAT_STYLES, ASPECT_RATIOS, VideoFormatStyle, AspectRatioType, TransitionType } from '@/lib/video';
import PhotoPicker from './PhotoPicker';
import { CATEGORIES } from '@/lib/types';

const PLATFORMS = ['Instagram Reels','YouTube Shorts','TikTok','Facebook Reels','LinkedIn Video'];
const DURATIONS = ['15','30','45','60','90'];
const STYLES = ['Talking Head','Product Showcase','Tutorial / How-To','Behind the Scenes','Testimonial Style','Cinematic / Story','Fast-Cut Trendy','Voiceover + B-Roll'];
const GOALS = ['Drive Sales','Brand Awareness','Generate Leads','Educate Audience','Viral / Entertainment','Promote Event'];

interface Scene {
  scene_number: number;
  duration_seconds: number;
  shot_type: string;
  visual: string;
  voiceover: string;
  text_overlay: string;
  music_mood: string;
}

interface VideoScript {
  title: string;
  hook_line: string;
  voiceover_script: string;
  scenes: Scene[];
  caption: string;
  hashtags: string[];
  thumbnail_idea: string;
  cta: string;
  editing_tips: string[];
  music_suggestion: string;
  b_roll_list: string[];
  best_posting_time: string;
}

type TabKey = 'script' | 'scenes' | 'caption' | 'production';

function VideoStudioInner() {
  const toast = useToast();
  const [form, setForm] = useState({
    businessName: '', category: '', productDescription: '',
    targetAudience: '', platform: 'Instagram Reels', duration: '30',
    style: 'Talking Head', goal: 'Drive Sales', hook: '', language: 'english',
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<VideoScript | null>(null);

  // Restore the last generation AFTER hydration + load any saved photos from Visual Studio
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('gm_video_result') || 'null');
      if (saved) setResult(saved);
    } catch { /* corrupt save — start fresh */ }

    try {
      const savedPhotos = JSON.parse(sessionStorage.getItem('gm_uploaded_photos') || '[]');
      if (Array.isArray(savedPhotos) && savedPhotos.length > 0) {
        setPhotos(savedPhotos);
      }
    } catch { /* ignore */ }
  }, []);

  const updateResult = (r: VideoScript | null) => { setResult(r); try { sessionStorage.setItem('gm_video_result', JSON.stringify(r)); } catch { /* quota */ } };
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('script');
  const [video, setVideo] = useState<RenderResult | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoPct, setVideoPct] = useState(0);
  const [videoError, setVideoError] = useState('');

  // Dual-Engine Video Studio (Kinetic Reel vs Generative AI Video)
  const [videoMode, setVideoMode] = useState<'kinetic' | 'generative'>('kinetic');
  const [aiVideoUrl, setAiVideoUrl] = useState<string | null>(null);
  const [aiVideoBusy, setAiVideoBusy] = useState(false);
  const [aiVideoError, setAiVideoError] = useState('');

  // Unified Photo Studio State (Upload vs Direct AI Generation)
  const [photoSourceTab, setPhotoSourceTab] = useState<'upload' | 'ai_generate'>('upload');
  const [aiConceptPrompt, setAiConceptPrompt] = useState('');
  const [aiConceptStyle, setAiConceptStyle] = useState<'ai_presenter' | 'product_macro' | 'festival_mood'>('ai_presenter');
  const [aiConceptBusy, setAiConceptBusy] = useState(false);

  // owner's own photos — kept across generations on purpose
  const [photos, setPhotos] = useState<string[]>([]);
  // AI voiceover options for the promo video
  const [voiceOn, setVoiceOn] = useState(true);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  // Visual theme, format style, aspect ratio & transitions
  const [selectedFormat, setSelectedFormat] = useState<VideoFormatStyle>('motionExplainer');
  const [selectedAspect, setSelectedAspect] = useState<AspectRatioType>('9:16');
  const [selectedTheme, setSelectedTheme] = useState<string>('royalGold');
  const [selectedTransition, setSelectedTransition] = useState<TransitionType>('crossfade');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingHook, setEditingHook] = useState(false);
  const [editingSceneIdx, setEditingSceneIdx] = useState<number | null>(null);

  // 1-Click AI Photo & Presenter Generator inside Video Studio
  const generateAiConceptPhoto = async () => {
    const promptInput = aiConceptPrompt.trim() || form.productDescription.trim() || 'Festive commercial collection';
    setAiConceptBusy(true);
    try {
      let fullPrompt = '';
      if (aiConceptStyle === 'ai_presenter') {
        fullPrompt = `Vertical 9:16 portrait of an attractive charismatic Indian brand ambassador creator smiling warmly, presenting ${promptInput}, ${form.category || 'Retail'} context, modern luxury studio, crisp facial details, cinematic lighting, photorealistic`;
      } else if (aiConceptStyle === 'product_macro') {
        fullPrompt = `Vertical 9:16 commercial advertisement hero macro still of ${promptInput}, ${form.category || 'Retail'} advertising, dramatic studio lighting, rich textures, pristine presentation, 8k photorealistic`;
      } else {
        fullPrompt = `Vertical 9:16 festive Indian celebration commercial photography of ${promptInput}, golden warm diya glow, celebration mood, 8k commercial quality`;
      }

      const res = await authFetch('/api/scene-image', {
        prompt: fullPrompt,
        aspect: selectedAspect,
      });
      const data = await res.json();
      if (!data.imageDataUrl) {
        throw new Error(data.error || 'Failed to generate visual');
      }

      setPhotos((prev) => [data.imageDataUrl, ...prev.slice(0, 3)]);
      toast('AI visual generated and added to your video photos! 📸', 'ai');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not generate AI visual', 'error');
    } finally {
      setAiConceptBusy(false);
    }
  };

  // Physical Generative AI Video using Replicate LTX-Video
  const generateAiGenerativeVideo = async () => {
    const targetImage = photos[0];
    if (!targetImage) {
      toast('Please upload or generate at least one photo first to bring it to life with AI video!', 'error');
      return;
    }

    setAiVideoBusy(true);
    setAiVideoError('');
    setAiVideoUrl(null);
    try {
      const promptText = `Cinematic commercial camera pan, physical subject movement, photorealistic high quality ad of ${form.productDescription || 'product and presenter'}`;
      const res = await authFetch('/api/generate-ai-video', {
        image: targetImage,
        prompt: promptText,
        aspect: selectedAspect,
      }, { method: 'POST' });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Generative video failed');
      }

      setAiVideoUrl(data.videoUrl);
      toast('Generative AI Video completed with physical motion! 🎬', 'ai');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate AI video';
      setAiVideoError(msg);
      toast(msg, 'error');
    } finally {
      setAiVideoBusy(false);
    }
  };

  const addCustomScene = () => {
    if (!result) return;
    const newSceneNum = result.scenes.length + 1;
    const newScene: Scene = {
      scene_number: newSceneNum,
      duration_seconds: 3,
      shot_type: 'Product Showcase',
      visual: `Detailed showcase angle of ${form.productDescription || 'product'}`,
      voiceover: 'Experience the quality and craft for yourself.',
      text_overlay: form.businessName || 'Special Offer',
      music_mood: 'Upbeat',
    };
    const updated = { ...result, scenes: [...result.scenes, newScene] };
    updateResult(updated);
    setEditingSceneIdx(result.scenes.length);
    toast('Custom scene added! Edit details below.', 'ai');
  };

  const deleteScene = (idx: number) => {
    if (!result || result.scenes.length <= 1) return;
    const filtered = result.scenes.filter((_, i) => i !== idx).map((s, i) => ({
      ...s,
      scene_number: i + 1,
    }));
    updateResult({ ...result, scenes: filtered });
    setEditingSceneIdx(null);
    toast('Scene removed', 'info');
  };

  const updateScene = (idx: number, patch: Partial<Scene>) => {
    if (!result) return;
    const updatedScenes = [...result.scenes];
    updatedScenes[idx] = { ...updatedScenes[idx], ...patch };
    updateResult({ ...result, scenes: updatedScenes });
  };

  const updateTitle = (val: string) => {
    if (!result) return;
    updateResult({ ...result, title: val });
  };

  const updateHook = (val: string) => {
    if (!result) return;
    updateResult({ ...result, hook_line: val });
  };

  // Build a real promo video from the generated scenes: user's photos or AI stills animated with Ken-Burns + text overlays
  const makeVideo = async () => {
    if (!result) return;
    setVideoBusy(true); setVideoError(''); setVideo(null); setVideoPct(0);
    try {
      const scenes = (result.scenes || []).slice(0, 6).map((sc) => ({
        imagePrompt: `${sc.visual}. ${form.category} context: ${form.productDescription.slice(0, 120)}`,
        title: (sc.text_overlay || sc.visual || '').slice(0, 70),
        subtitle: (sc.voiceover || '').slice(0, 110) || undefined,
      }));
      const sceneList = scenes.length ? scenes : [{ title: result.title, subtitle: result.hook_line }];
      // Use user's uploaded photos for each scene (or fallback to auto scene image generator)
      const effectivePhotos = sceneList.map((_, i) => photos[i] ?? null);
      const out = await renderPromoVideo(
        {
          scenes: sceneList,
          photos: effectivePhotos,
          businessName: form.businessName || 'Your Business',
          cta: form.goal === 'Drive Sales' ? 'Order Now' : 'Follow for more',
          paletteId: selectedTheme,
          transition: selectedTransition,
          videoStyle: selectedFormat,
          aspect: selectedAspect,
          secondsPerScene: 2.6,
          voiceover: voiceOn
            ? {
                text: (result.voiceover_script || result.hook_line || '').slice(0, 500),
                language: form.language,
                voice: voiceGender,
              }
            : null,
        },
        setVideoPct
      );
      setVideo(out);
      toast('Your promo video is ready! 🎬', 'ai');
    } catch (e) {
      setVideoError(e instanceof Error ? e.message : 'Could not render the video — please try again.');
    } finally {
      setVideoBusy(false);
    }
  };

  const generate = async () => {
    if (!form.businessName || !form.productDescription || !form.category) {
      setError('Business name, category and product description are required.');
      return;
    }
    setError(''); setGenerating(true); updateResult(null);
    try {
      const payload = {
        ...form,
        duration: Number(form.duration),
        photoCount: photos.length > 0 ? photos.length : undefined,
      };
      const res = await authFetch('/api/generate-video-script', payload, { method: 'POST' });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        console.error('generate-video-script returned non-JSON', res.status);
        throw new Error('Something went wrong on our side — please try again in a moment.');
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      updateResult(data);
      toast('Video script generated!', 'ai');
    } catch (e: unknown) {
      console.error('Video script generation failed:', e);
      setError(e instanceof Error && e.message !== 'Failed to fetch'
        ? e.message
        : 'Something went wrong on our side — please try again in a moment.');
    } finally { setGenerating(false); }
  };

  const downloadScript = () => {
    if (!result) return;
    const text = [
      `VIDEO SCRIPT — ${result.title}`,
      `Platform: ${form.platform} | Duration: ${form.duration}s`,
      `\n═══ HOOK ═══\n${result.hook_line}`,
      `\n═══ FULL VOICEOVER SCRIPT ═══\n${result.voiceover_script}`,
      `\n═══ SCENES ═══`,
      ...(result.scenes || []).map((s) =>
        `\nScene ${s.scene_number} (${s.duration_seconds}s) — ${s.shot_type}\nVisual: ${s.visual}\nVoiceover: "${s.voiceover}"\nText Overlay: ${s.text_overlay}\nMusic Mood: ${s.music_mood}`
      ),
      `\n═══ PRODUCTION ═══`,
      `Music: ${result.music_suggestion}`,
      `CTA: ${result.cta}`,
      `Thumbnail: ${result.thumbnail_idea}`,
      `\nB-Roll List:\n${(result.b_roll_list || []).map((b,i) => `${i+1}. ${b}`).join('\n')}`,
      `\nEditing Tips:\n${(result.editing_tips || []).map((t,i) => `${i+1}. ${t}`).join('\n')}`,
      `\n═══ CAPTION ═══\n${result.caption}`,
      `\nHashtags: ${(result.hashtags || []).join(' ')}`,
      `\nBest Posting Time: ${result.best_posting_time}`,
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${result.title.replace(/\s+/g, '_')}_script.txt`;
    a.click(); URL.revokeObjectURL(url);
    toast('Script downloaded!');
  };

  const tabItems = [
    { id: 'script', label: 'Script' },
    { id: 'scenes', label: 'Scene Plan' },
    { id: 'caption', label: 'Caption' },
    { id: 'production', label: 'Production' },
  ];

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] top-[-150px] right-[-100px]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <PageHeader
          eyebrow={<><Film size={11} /> Video Studio</>}
          title="Create Your Video"
          sub="AI-generated script, scene-by-scene shot plan, voiceover, captions and production guide."
        />

        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
          {/* Form */}
          <Card className="p-7 space-y-4 h-fit">
            <h2 className="font-display text-lg font-semibold text-[var(--text)]">Video details</h2>

            <Field label="Business / Brand name">
              <input className={inputCls} placeholder="e.g. Priya Gold House..." value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
            </Field>

            <Field label="What are you promoting?">
              <textarea rows={2} className={inputCls + ' resize-none'} placeholder="Describe your product or service..." value={form.productDescription}
                onChange={(e) => setForm({ ...form, productDescription: e.target.value })} />
            </Field>

            {/* Unified Photo Engine (Upload or Direct AI Visual Generation) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon size={13} className="text-[var(--accent-soft)]" /> Product Photos & Visuals
                </label>
                <div className="flex items-center gap-1 bg-[var(--bg-alt)] border border-[var(--border)] rounded-xl p-0.5">
                  <button
                    type="button"
                    onClick={() => setPhotoSourceTab('upload')}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all ${
                      photoSourceTab === 'upload'
                        ? 'bg-[var(--accent)] text-white shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    Upload Photos
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoSourceTab('ai_generate')}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      photoSourceTab === 'ai_generate'
                        ? 'bg-[var(--accent)] text-white shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    <Wand2 size={10} /> Generate AI Visuals
                  </button>
                </div>
              </div>

              {photoSourceTab === 'upload' ? (
                <div className="space-y-2">
                  <PhotoPicker photos={photos} onChange={setPhotos} max={6} />
                  {photos.length === 0 && (
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Tip: Don&apos;t have product photos? Click <strong>&ldquo;Generate AI Visuals&rdquo;</strong> above to create Indian brand ambassadors or commercial product macro stills instantly.
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[var(--bg-alt)] border border-[var(--border)] space-y-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { id: 'ai_presenter', label: 'Brand Ambassador' },
                      { id: 'product_macro', label: 'Product Macro' },
                      { id: 'festival_mood', label: 'Festive Mood' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setAiConceptStyle(s.id as 'ai_presenter' | 'product_macro' | 'festival_mood')}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          aiConceptStyle === s.id
                            ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
                            : 'bg-[var(--card)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      className={inputCls + ' text-xs py-2'}
                      placeholder={form.productDescription ? `e.g. ${form.productDescription.slice(0, 45)}` : 'Describe the product or visual concept...'}
                      value={aiConceptPrompt}
                      onChange={(e) => setAiConceptPrompt(e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={generateAiConceptPhoto}
                      loading={aiConceptBusy}
                      disabled={aiConceptBusy}
                      className="shrink-0 text-xs"
                    >
                      <Sparkles size={12} className="mr-1" /> Generate
                    </Button>
                  </div>

                  {photos.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border-soft)]">
                      <div className="text-[11px] text-[var(--text-muted)] mb-2 flex items-center justify-between">
                        <span>Active Video Photos ({photos.length})</span>
                        <button
                          type="button"
                          onClick={() => setPhotos([])}
                          className="text-[10px] text-[var(--danger)] hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {photos.map((pUrl, i) => (
                          <div key={i} className="w-14 h-14 rounded-xl border border-[var(--border)] overflow-hidden shrink-0 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={pUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {photos.length > 0 && photoSourceTab === 'upload' && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 size={13} /> {photos.length} photo{photos.length > 1 ? 's' : ''} active. Video script will be generated for exactly {photos.length} matching scene{photos.length > 1 ? 's' : ''}.
                  </span>
                  <button
                    type="button"
                    onClick={() => setPhotos([])}
                    className="text-[10px] text-[var(--text-muted)] hover:text-[var(--danger)] underline ml-2"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            <Field label="Target audience">
              <input className={inputCls} placeholder="e.g. Women 25–40, small business owners..." value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} />
            </Field>

            <Field label="Category">
              <div className="relative">
                <select className={inputCls + ' appearance-none'} value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/3 text-[var(--text-faint)] pointer-events-none" />
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Platform', key: 'platform', options: PLATFORMS },
                { label: 'Duration', key: 'duration', options: DURATIONS, suffix: 's' },
                { label: 'Style', key: 'style', options: STYLES },
                { label: 'Goal', key: 'goal', options: GOALS },
              ].map(({ label, key, options, suffix }) => (
                <Field key={key} label={label}>
                  <div className="relative">
                    <select className={inputCls + ' appearance-none'} value={form[key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
                      {options.map((o) => <option key={o} value={o}>{o}{suffix || ''}</option>)}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/3 text-[var(--text-faint)] pointer-events-none" />
                  </div>
                </Field>
              ))}
            </div>

            <Field label="Hook idea" hint="Optional — e.g. start with a shocking stat, show before/after">
              <input className={inputCls} placeholder="e.g. Start with a shocking stat, show before/after..."
                value={form.hook} onChange={(e) => setForm({ ...form, hook: e.target.value })} />
            </Field>

            {error && (
              <div className="flex items-start gap-2 bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] border border-[color-mix(in_srgb,var(--danger)_20%,transparent)] rounded-xl px-4 py-3 text-[var(--danger)] text-xs">
                <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />{error}
              </div>
            )}

            <Button onClick={generate} loading={generating} size="lg" className="w-full">
              {generating ? 'Generating script…' : <><Sparkles size={15} />Generate Video Package</>}
            </Button>
          </Card>

          {/* Result */}
          <div className="space-y-4">
            {!result && !generating && (
              <EmptyState
                icon={<Film size={22} />}
                title="Your video script will appear here"
                sub="Fill in the details on the left and click generate — script, scenes, caption and production guide in one go."
              />
            )}

            {generating && (
              <Card className="p-8 space-y-4">
                {['Writing your hook…','Planning scenes…','Scripting voiceover…','Building production guide…'].map((msg, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl shimmer flex-shrink-0" />
                    <div className="flex-1 h-3 rounded-full shimmer" />
                    <span className="text-xs text-[var(--text-faint)]">{msg}</span>
                  </div>
                ))}
                <Skeleton className="w-full h-3" />
              </Card>
            )}

            {result && (
              <div className="space-y-4 animate-slide-up">
                {/* Title + actions */}
                <Card className="p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      {editingTitle ? (
                        <div className="flex items-center gap-2 mb-1">
                          <input
                            type="text"
                            value={result.title}
                            onChange={(e) => updateTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setEditingTitle(false); }}
                            className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-1.5 text-base font-bold text-[var(--text)] focus:border-[var(--accent)] outline-none flex-1"
                            autoFocus
                          />
                          <Button size="sm" onClick={() => setEditingTitle(false)}><Check size={12} /> Save</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="font-display text-xl font-bold text-[var(--text)]">{result.title}</h2>
                          <button
                            onClick={() => setEditingTitle(true)}
                            className="opacity-60 hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-opacity"
                            title="Edit video title"
                          >
                            <Edit3 size={13} />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] flex-wrap">
                        <span className="flex items-center gap-1"><Clock size={10} />{form.duration}s · {form.platform}</span>
                        <span className="flex items-center gap-1"><Target size={10} />{form.goal}</span>
                        <span className="flex items-center gap-1">{form.style}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={downloadScript}><Download size={13} />Download</Button>
                      <Button variant="ghost" size="sm" onClick={generate}><RefreshCw size={13} />Redo</Button>
                    </div>
                  </div>

                  {/* Hook callout */}
                  <div className="mt-5 bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-xs text-[var(--accent-soft)] uppercase tracking-widest flex items-center gap-1.5"><Fish size={11} /> Opening Hook</div>
                      <button
                        onClick={() => setEditingHook(!editingHook)}
                        className="text-xs text-[var(--accent-soft)] hover:underline flex items-center gap-1"
                      >
                        {editingHook ? <><Check size={11} /> Done</> : <><Edit3 size={11} /> Edit hook</>}
                      </button>
                    </div>
                    {editingHook ? (
                      <textarea
                        value={result.hook_line}
                        onChange={(e) => updateHook(e.target.value)}
                        rows={2}
                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-2.5 text-sm text-[var(--text)] focus:border-[var(--accent)] outline-none"
                      />
                    ) : (
                      <p className="text-[var(--text)] text-sm leading-relaxed italic">&ldquo;{result.hook_line}&rdquo;</p>
                    )}
                  </div>

                  {/* Dual-Engine Promo Video Studio */}
                  <div className="mt-5 rounded-2xl border border-[color-mix(in_srgb,var(--neon)_25%,transparent)] bg-[color-mix(in_srgb,var(--neon)_6%,transparent)] p-4 sm:p-5">
                    {/* Engine Mode Switcher */}
                    <div className="flex items-center justify-between gap-3 flex-wrap pb-3.5 border-b border-[var(--border)]">
                      <div>
                        <div className="text-xs text-[var(--neon)] uppercase tracking-widest mb-1 flex items-center gap-1.5 font-bold">
                          <Clapperboard size={13} /> Dual-Engine Video Maker
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                          Choose between instant CapCut-grade kinetic typography reels or Replicate generative AI video with physical motion.
                        </p>
                      </div>
                      <div className="inline-flex p-1 rounded-xl bg-[var(--input-bg)] border border-[var(--border)]">
                        <button
                          type="button"
                          onClick={() => setVideoMode('kinetic')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            videoMode === 'kinetic'
                              ? 'bg-[var(--accent)] text-white shadow-sm'
                              : 'text-[var(--text-soft)] hover:text-[var(--text)]'
                          }`}
                        >
                          <Zap size={12} /> Instant Kinetic Reel
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoMode('generative')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            videoMode === 'generative'
                              ? 'bg-[var(--accent)] text-white shadow-sm'
                              : 'text-[var(--text-soft)] hover:text-[var(--text)]'
                          }`}
                        >
                          <Wand2 size={12} /> AI Generative Video (Replicate)
                        </button>
                      </div>
                    </div>

                    {videoMode === 'kinetic' ? (
                      /* Mode 1: Instant Kinetic Reel */
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <span className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
                              ⚡ Kinetic Typographic Reel (CapCut-Grade)
                            </span>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              {photos.length > 0
                                ? `Animating your ${photos.length} visual${photos.length > 1 ? 's' : ''} with atmospheric particle embers, kinetic karaoke typography & synchronized narration.`
                                : 'Using AI visuals with kinetic typography, particle physics & synchronized narration.'}
                            </p>
                          </div>
                          <Button size="sm" onClick={makeVideo} disabled={videoBusy}>
                            {videoBusy ? `Rendering ${Math.round(videoPct * 100)}%…` : <><Film size={13} /> Render Kinetic Reel 🎬</>}
                          </Button>
                        </div>

                        {/* Controls grid: Format Style, Aspect Ratio, Theme, Transition */}
                        <div className="pt-3 border-t border-[var(--border)] grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {/* Format Style */}
                          <div className="space-y-1">
                            <label className="text-xs text-[var(--text-soft)] flex items-center gap-1.5 font-medium">
                              <Layout size={12} className="text-[var(--neon)]" /> Video Format
                            </label>
                            <div className="relative mt-1">
                              <select
                                aria-label="Video Format Style"
                                className="w-full appearance-none bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-3 pr-7 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none cursor-pointer"
                                value={selectedFormat}
                                onChange={(e) => setSelectedFormat(e.target.value as VideoFormatStyle)}
                              >
                                {VIDEO_FORMAT_STYLES.map((fs) => (
                                  <option key={fs.id} value={fs.id}>{fs.name}</option>
                                ))}
                              </select>
                              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
                            </div>
                          </div>

                          {/* Aspect Ratio */}
                          <div className="space-y-1">
                            <label className="text-xs text-[var(--text-soft)] flex items-center gap-1.5 font-medium">
                              <Monitor size={12} className="text-[var(--accent-soft)]" /> Dimensions
                            </label>
                            <div className="relative mt-1">
                              <select
                                aria-label="Aspect Ratio"
                                className="w-full appearance-none bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-3 pr-7 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none cursor-pointer"
                                value={selectedAspect}
                                onChange={(e) => setSelectedAspect(e.target.value as AspectRatioType)}
                              >
                                {ASPECT_RATIOS.map((ar) => (
                                  <option key={ar.id} value={ar.id}>{ar.label}</option>
                                ))}
                              </select>
                              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
                            </div>
                          </div>

                          {/* Theme / Palette */}
                          <div className="space-y-1">
                            <label className="text-xs text-[var(--text-soft)] flex items-center gap-1.5 font-medium">
                              <Palette size={12} className="text-[var(--gold)]" /> Design Theme
                            </label>
                            <div className="relative mt-1">
                              <select
                                aria-label="Design Theme"
                                className="w-full appearance-none bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-3 pr-7 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none cursor-pointer"
                                value={selectedTheme}
                                onChange={(e) => setSelectedTheme(e.target.value)}
                              >
                                {VIDEO_THEMES.map((theme) => (
                                  <option key={theme.id} value={theme.id}>{theme.name}</option>
                                ))}
                              </select>
                              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
                            </div>
                          </div>

                          {/* Scene Transitions */}
                          <div className="space-y-1">
                            <label className="text-xs text-[var(--text-soft)] flex items-center gap-1.5 font-medium">
                              <Layers size={12} className="text-[var(--accent-soft)]" /> Transitions
                            </label>
                            <div className="relative mt-1">
                              <select
                                aria-label="Scene Transition"
                                className="w-full appearance-none bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-3 pr-7 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none cursor-pointer"
                                value={selectedTransition}
                                onChange={(e) => setSelectedTransition(e.target.value as TransitionType)}
                              >
                                {VIDEO_TRANSITIONS.map((tr) => (
                                  <option key={tr.id} value={tr.id}>{tr.name}</option>
                                ))}
                              </select>
                              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
                            </div>
                          </div>
                        </div>

                        {/* Secondary row: Voice narration options */}
                        <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-3 flex-wrap">
                          <label className="flex items-center gap-2 text-xs text-[var(--text-soft)] cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={voiceOn}
                              onChange={(e) => setVoiceOn(e.target.checked)}
                              className="w-3.5 h-3.5 accent-[var(--neon)] cursor-pointer"
                            />
                            <Mic size={12} /> Synchronized AI narration
                          </label>
                          {voiceOn && (
                            <div className="relative">
                              <select
                                aria-label="Voice"
                                className="appearance-none bg-[var(--input-bg)] border border-[var(--input-border)] rounded-full pl-3 pr-7 py-1 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none cursor-pointer"
                                value={voiceGender}
                                onChange={(e) => setVoiceGender(e.target.value as 'female' | 'male')}
                              >
                                <option value="female">Female narration</option>
                                <option value="male">Male narration</option>
                              </select>
                              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-faint)] pointer-events-none" />
                            </div>
                          )}
                        </div>

                        {videoBusy && (
                          <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden mt-3">
                            <div className="h-full rounded-full bg-[var(--neon)] transition-all" style={{ width: `${videoPct * 100}%` }} />
                          </div>
                        )}
                        {videoError && <p className="text-xs text-[var(--danger)] mt-2">{videoError}</p>}
                        {video && !videoBusy && (
                          <div className="mt-4 space-y-3 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                            <video src={video.url} controls playsInline className="w-full max-w-[280px] mx-auto rounded-2xl border border-[var(--border)] shadow-lg" />
                            <div className="flex items-center justify-center gap-2">
                              <Button size="sm" onClick={() => downloadVideo(video.url, form.businessName || 'growmitra', video.mimeType)}>
                                <Download size={13} /> Download Kinetic Video
                              </Button>
                              <Button size="sm" variant="ghost" onClick={makeVideo}><RefreshCw size={13} /> Re-render</Button>
                            </div>
                            <p className="text-[10px] text-center text-[var(--text-faint)]">{video.width}×{video.height} · {video.durationSec}s · {video.mimeType.includes('mp4') ? 'MP4' : 'WebM'}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Mode 2: Replicate LTX Physical Generative Video */
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <span className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
                              🎬 Physical Motion Generative Video (Replicate LTX-Video)
                            </span>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              Brings your primary visual to life with camera sweeps, realistic physical motion, and photorealistic motion physics.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={generateAiGenerativeVideo}
                            disabled={aiVideoBusy || photos.length === 0}
                          >
                            {aiVideoBusy ? (
                              <><RefreshCw size={13} className="animate-spin" /> Generating LTX Video… (~25s)</>
                            ) : (
                              <><Film size={13} /> Generate Physical AI Video 🚀</>
                            )}
                          </Button>
                        </div>

                        {photos.length === 0 ? (
                          <div className="p-3.5 rounded-xl border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-xs text-[var(--text-soft)] flex items-center gap-2">
                            <Sparkles size={14} className="text-[var(--accent)] shrink-0" />
                            <span>Upload a photo or generate an AI visual above first to bring it to life as physical AI video.</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-xs">
                            {/* thumbnail of the photo that will be animated */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photos[0]} alt="Hero visual" className="w-12 h-16 object-cover rounded-lg border border-[var(--border)] shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[var(--text)] truncate">Animating: Primary Visual</p>
                              <p className="text-[var(--text-muted)] text-[11px] truncate">
                                Model: Lightricks LTX-Video (25 FPS, commercial camera pan & motion physics)
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[color-mix(in_srgb,var(--neon)_15%,transparent)] text-[var(--neon)] font-medium">
                              Ready
                            </span>
                          </div>
                        )}

                        {aiVideoBusy && (
                          <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-center space-y-3">
                            <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin mx-auto" />
                            <p className="text-xs font-medium text-[var(--text)]">Synthesizing physical motion with Replicate LTX-Video...</p>
                            <p className="text-[11px] text-[var(--text-muted)]">
                              Rendering neural diffusion frames at 25 fps. This usually takes around 20 to 30 seconds.
                            </p>
                          </div>
                        )}

                        {aiVideoError && (
                          <div className="p-3 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] text-xs text-[var(--danger)]">
                            {aiVideoError}
                          </div>
                        )}

                        {aiVideoUrl && !aiVideoBusy && (
                          <div className="space-y-3 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                            <video
                              src={aiVideoUrl}
                              controls
                              playsInline
                              autoPlay
                              loop
                              className="w-full max-w-[280px] mx-auto rounded-2xl border border-[var(--border)] shadow-xl"
                            />
                            <div className="flex items-center justify-center gap-2">
                              <a
                                href={aiVideoUrl}
                                target="_blank"
                                rel="noreferrer"
                                download={`${(form.businessName || 'growmitra').toLowerCase().replace(/\s+/g, '_')}_ltx_video.mp4`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--accent)] text-white hover:opacity-95 shadow-md"
                              >
                                <Download size={13} /> Download Generative MP4
                              </a>
                              <Button size="sm" variant="ghost" onClick={generateAiGenerativeVideo}>
                                <RefreshCw size={13} /> Re-generate
                              </Button>
                            </div>
                            <p className="text-[10px] text-center text-[var(--text-faint)]">
                              Generated with Replicate LTX-Video · 25 FPS · Full Generative Motion
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Tabs */}
                <Card className="p-6">
                  <Tabs
                    tabs={tabItems}
                    active={activeTab}
                    onChange={(t) => setActiveTab(t as TabKey)}
                  />

                  <div className="pt-5">
                    {/* Script tab */}
                    {activeTab === 'script' && (
                      <div id="video-tab-script" role="tabpanel" aria-label="Full voiceover script">
                        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                          <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Full Voiceover Script</span>
                          <CopyButton text={result.voiceover_script} label="Copy script" />
                        </div>
                        <div className="bg-[var(--bg-alt)] rounded-2xl p-5 border border-[var(--border)]">
                          <p className="text-[var(--text-soft)] text-sm leading-loose whitespace-pre-wrap">{result.voiceover_script}</p>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-faint)]">
                          <Clock size={11} />Estimated read time: ~{Math.ceil((result.voiceover_script || '').split(' ').length / 2.5)}s at normal pace
                        </div>
                      </div>
                    )}

                    {/* Scenes tab */}
                    {activeTab === 'scenes' && (
                      <div id="video-tab-scenes" role="tabpanel" className="space-y-4">
                        <div className="p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--text-muted)] flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <span className="font-semibold text-[var(--text)]">💡 Optional starting point:</span>
                            <span className="ml-1 text-[var(--text-muted)]">Customize text overlays, voiceovers, shot durations, or craft your own scenes from scratch.</span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={addCustomScene}
                            className="text-xs text-[var(--accent-soft)] hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]"
                          >
                            <Plus size={12} className="mr-1" /> Add Custom Scene
                          </Button>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)] pb-1 flex-wrap">
                          <span>{result.scenes.length} Scenes in Storyboard</span>
                          <span className="text-[var(--accent-soft)]">Click &ldquo;Edit Scene&rdquo; on any scene to customize titles, visual cues & voiceover</span>
                        </div>
                        {result.scenes.map((scene, idx) => {
                          const isEditing = editingSceneIdx === idx;
                          return (
                            <div key={scene.scene_number || idx} className="bg-[var(--bg-alt)] border border-[var(--border)] rounded-2xl p-5 transition-all">
                              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_25%,transparent)]">
                                    Scene {scene.scene_number}
                                  </span>
                                  <span className="text-xs text-[var(--text-muted)]">{scene.duration_seconds}s · {scene.shot_type}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[var(--text-faint)] italic hidden sm:inline mr-1">{scene.music_mood}</span>
                                  <button
                                    onClick={() => setEditingSceneIdx(isEditing ? null : idx)}
                                    className="flex items-center gap-1.5 text-xs text-[var(--accent-soft)] hover:underline font-medium px-2.5 py-1 rounded-lg hover:bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] transition-all"
                                  >
                                    {isEditing ? <><Check size={11} /> Done</> : <><Edit3 size={11} /> Edit Scene</>}
                                  </button>
                                  {result.scenes.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => deleteScene(idx)}
                                      className="text-xs text-[var(--text-faint)] hover:text-[var(--danger)] p-1.5 rounded-lg hover:bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] transition-all"
                                      title="Delete Scene"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {isEditing ? (
                                <div className="space-y-3 pt-2">
                                  <div>
                                    <label className="text-[11px] font-medium text-[var(--gold)] uppercase tracking-wider flex items-center gap-1 mb-1">
                                      <PenLine size={10} /> Title / On-Screen Text Overlay
                                    </label>
                                    <input
                                      type="text"
                                      value={scene.text_overlay || ''}
                                      onChange={(e) => updateScene(idx, { text_overlay: e.target.value })}
                                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none"
                                      placeholder="Main caption displayed on screen"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-medium text-[var(--accent-soft)] uppercase tracking-wider flex items-center gap-1 mb-1">
                                      <Mic size={10} /> Spoken Voiceover Narration
                                    </label>
                                    <textarea
                                      value={scene.voiceover}
                                      onChange={(e) => updateScene(idx, { voiceover: e.target.value })}
                                      rows={2}
                                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-2.5 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none"
                                      placeholder="What the narrator says in this scene"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[11px] font-medium text-[var(--text-faint)] uppercase tracking-wider flex items-center gap-1 mb-1">
                                      <Camera size={10} /> Visual Cue / Image Prompt
                                    </label>
                                    <textarea
                                      value={scene.visual}
                                      onChange={(e) => updateScene(idx, { visual: e.target.value })}
                                      rows={2}
                                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl p-2.5 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none"
                                      placeholder="Scene imagery or product shot direction"
                                    />
                                  </div>
                                  <div className="flex gap-3">
                                    <div className="flex-1">
                                      <label className="text-[11px] font-medium text-[var(--text-faint)] uppercase tracking-wider block mb-1">Shot Type</label>
                                      <input
                                        type="text"
                                        value={scene.shot_type}
                                        onChange={(e) => updateScene(idx, { shot_type: e.target.value })}
                                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none"
                                      />
                                    </div>
                                    <div className="w-28">
                                      <label className="text-[11px] font-medium text-[var(--text-faint)] uppercase tracking-wider block mb-1">Duration (s)</label>
                                      <input
                                        type="number"
                                        min={1}
                                        max={15}
                                        value={scene.duration_seconds}
                                        onChange={(e) => updateScene(idx, { duration_seconds: Number(e.target.value) || 3 })}
                                        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2.5">
                                  <div>
                                    <span className="text-xs text-[var(--text-faint)] uppercase tracking-widest flex items-center gap-1"><Camera size={10}/> Visual</span>
                                    <p className="text-sm text-[var(--text-soft)] mt-1 leading-relaxed">{scene.visual}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs text-[var(--text-faint)] uppercase tracking-widest flex items-center gap-1"><Mic size={10}/> Voiceover</span>
                                    <p className="text-sm text-[var(--accent-soft)] mt-1 italic">&ldquo;{scene.voiceover}&rdquo;</p>
                                  </div>
                                  {scene.text_overlay && (
                                    <div>
                                      <span className="text-xs text-[var(--text-faint)] uppercase tracking-widest flex items-center gap-1"><PenLine size={10}/> Text Overlay</span>
                                      <p className="text-sm text-[var(--gold)] mt-1">{scene.text_overlay}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Caption tab */}
                    {activeTab === 'caption' && (
                      <div id="video-tab-caption" role="tabpanel" className="space-y-5">
                        <div>
                          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                            <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest">Post Caption</span>
                            <CopyButton text={result.caption} label="Copy caption" />
                          </div>
                          <div className="bg-[var(--bg-alt)] rounded-2xl p-4 border border-[var(--border)]">
                            <p className="text-[var(--text-soft)] text-sm leading-relaxed whitespace-pre-wrap">{result.caption}</p>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                            <span className="text-xs text-[var(--text-faint)] uppercase tracking-widest"># Hashtags</span>
                            <CopyButton text={(result.hashtags || []).join(' ')} label="Copy all" />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {result.hashtags.map((h, i) => (
                              <span key={i} className="text-xs bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] text-[var(--accent-soft)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] rounded-full px-2.5 py-1">{h}</span>
                            ))}
                          </div>
                        </div>
                        <div className="bg-[color-mix(in_srgb,var(--gold)_8%,transparent)] border border-[color-mix(in_srgb,var(--gold)_20%,transparent)] rounded-2xl p-4">
                          <div className="text-xs text-[var(--gold)] uppercase tracking-widest mb-1 flex items-center gap-1.5"><Clock size={11} /> Best time to post</div>
                          <p className="text-sm text-[var(--text-soft)]">{result.best_posting_time}</p>
                        </div>
                      </div>
                    )}

                    {/* Production tab */}
                    {activeTab === 'production' && (
                      <div id="video-tab-production" role="tabpanel" className="space-y-4">
                        <div className="bg-[var(--bg-alt)] border border-[var(--border)] rounded-2xl p-5">
                          <div className="text-xs text-[var(--accent-soft)] uppercase tracking-widest mb-2 flex items-center gap-1.5"><Music size={11} /> Music</div>
                          <p className="text-sm text-[var(--text-soft)]">{result.music_suggestion}</p>
                        </div>
                        <div className="bg-[var(--bg-alt)] border border-[var(--border)] rounded-2xl p-5">
                          <div className="text-xs text-[var(--neon)] uppercase tracking-widest mb-2 flex items-center gap-1.5"><ImageIcon size={11} /> Thumbnail</div>
                          <p className="text-sm text-[var(--text-soft)]">{result.thumbnail_idea}</p>
                        </div>
                        <div className="bg-[var(--bg-alt)] border border-[var(--border)] rounded-2xl p-5">
                          <div className="text-xs text-[var(--success)] uppercase tracking-widest mb-3 flex items-center gap-1.5"><Clapperboard size={11} /> B-Roll List</div>
                          <ul className="space-y-2">
                            {(result.b_roll_list || []).map((b, i) => (
                              <li key={i} className="text-sm text-[var(--text-soft)] flex gap-2">
                                <span className="text-[var(--text-faint)]">{i + 1}.</span>{b}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-[var(--bg-alt)] border border-[var(--border)] rounded-2xl p-5">
                          <div className="text-xs text-[var(--gold)] uppercase tracking-widest mb-3 flex items-center gap-1.5"><Scissors size={11} /> Editing Tips</div>
                          <ul className="space-y-2">
                            {(result.editing_tips || []).map((t, i) => (
                              <li key={i} className="text-sm text-[var(--text-soft)] flex gap-2">
                                <span className="text-[var(--text-faint)]">{i + 1}.</span>{t}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] rounded-2xl p-5">
                          <div className="text-xs text-[var(--accent-soft)] uppercase tracking-widest mb-2 flex items-center gap-1.5"><Megaphone size={11} /> Closing CTA</div>
                          <p className="text-[var(--text)] text-sm italic">&ldquo;{result.cta}&rdquo;</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VideoStudioPage() {
  return <AuthGuard><VideoStudioInner /></AuthGuard>;
}
