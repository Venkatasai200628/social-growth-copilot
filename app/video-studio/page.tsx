'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Film, ChevronDown, Sparkles, AlertCircle, RefreshCw, Download, Clock, Music, Camera,
  Fish, Target, Mic, PenLine, Image as ImageIcon, Clapperboard, Scissors, Megaphone,
  Edit3, Check, Plus, Trash2 } from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { useToast } from '../components/Toast';
import { Button, Card, Field, inputCls, CopyButton, Skeleton, Tabs, PageHeader, EmptyState } from '../components/ui';
import { authFetch } from '@/lib/client';
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
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    businessName: '', category: '', productDescription: '',
    targetAudience: '', platform: 'Instagram Reels', duration: '30',
    style: 'Talking Head', goal: 'Drive Sales', hook: '', language: 'english',
  });
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<VideoScript | null>(null);

  // Restore the last generation AFTER hydration
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('gm_video_result') || 'null');
      if (saved) setResult(saved);
    } catch { /* corrupt save — start fresh */ }
  }, []);

  const updateResult = (r: VideoScript | null) => { setResult(r); try { sessionStorage.setItem('gm_video_result', JSON.stringify(r)); } catch { /* quota */ } };
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('script');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingHook, setEditingHook] = useState(false);
  const [editingScript, setEditingScript] = useState(false);
  const [editingSceneIdx, setEditingSceneIdx] = useState<number | null>(null);

  const updateVoiceoverScript = (val: string) => {
    if (!result) return;
    updateResult({ ...result, voiceover_script: val });
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

  const generate = async () => {
    if (!form.businessName || !form.productDescription || !form.category) {
      setError('Business name, category and product description are required.');
      return;
    }
    setError(''); setGenerating(true); updateResult(null);
    try {
      sessionStorage.removeItem('gm_scene_images');
    } catch { /* ignore */ }
    try {
      const payload = {
        ...form,
        duration: Number(form.duration),
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

            <div className="p-3.5 rounded-xl bg-[color-mix(in_srgb,var(--neon)_8%,transparent)] border border-[color-mix(in_srgb,var(--neon)_20%,transparent)] text-xs text-[var(--text-soft)] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Film size={14} className="text-[var(--neon)] shrink-0" />
                <span>Photos & AI Presenters are selected in <strong>Step 2 (Video Generator)</strong></span>
              </span>
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

                  {/* Step 2 Callout: Go to Video Generator */}
                  <div className="mt-5 rounded-2xl border border-[color-mix(in_srgb,var(--neon)_30%,transparent)] bg-[color-mix(in_srgb,var(--neon)_8%,transparent)] p-5 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-xs text-[var(--neon)] uppercase tracking-wider font-bold flex items-center gap-1.5 mb-1">
                        <Clapperboard size={14} /> Ready to Produce This Video Reel?
                      </div>
                      <p className="text-xs text-[var(--text-muted)] max-w-md">
                        Proceed to the dedicated Video Generator to choose your visuals, animate with AI presenters, and render your video with synchronized voiceover.
                      </p>
                    </div>
                    <Button
                      size="md"
                      onClick={() => {
                        sessionStorage.setItem('gm_video_form', JSON.stringify(form));
                        sessionStorage.setItem('gm_video_result', JSON.stringify(result));
                        router.push('/video-generator');
                      }}
                      className="shadow-md"
                    >
                      <Film size={14} /> Proceed to Video Generator ➔
                    </Button>
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
                          <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold">Full Voiceover Script</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingScript(!editingScript)}
                              className="text-xs text-[var(--neon)] hover:underline font-medium px-2.5 py-1 rounded-lg bg-[color-mix(in_srgb,var(--neon)_12%,transparent)] border border-[color-mix(in_srgb,var(--neon)_25%,transparent)] transition-all"
                            >
                              {editingScript ? '✓ Done Editing' : '✏️ Edit Script'}
                            </button>
                            <CopyButton text={result.voiceover_script} label="Copy script" />
                          </div>
                        </div>
                        <div className="bg-[var(--bg-alt)] rounded-2xl p-5 border border-[var(--border)]">
                          {editingScript ? (
                            <textarea
                              value={result.voiceover_script}
                              onChange={(e) => updateVoiceoverScript(e.target.value)}
                              rows={8}
                              className="w-full bg-transparent text-[var(--text)] text-sm leading-relaxed border border-[var(--input-border)] rounded-xl p-3 focus:outline-none focus:border-[var(--neon)] resize-y"
                              placeholder="Type or customize your full voiceover script here..."
                            />
                          ) : (
                            <p className="text-[var(--text-soft)] text-sm leading-loose whitespace-pre-wrap">{result.voiceover_script}</p>
                          )}
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-faint)]">
                          <Clock size={11} />Estimated read time: ~{Math.ceil((result.voiceover_script || '').split(' ').length / 2.5)}s at normal pace
                        </div>
                        <div className="mt-5 p-4 rounded-xl border border-[color-mix(in_srgb,var(--neon)_30%,transparent)] bg-[color-mix(in_srgb,var(--neon)_8%,transparent)] flex items-center justify-between gap-4 flex-wrap">
                          <div>
                            <p className="text-xs font-semibold text-[var(--text)]">Like this voiceover script?</p>
                            <p className="text-[11px] text-[var(--text-muted)]">Turn it into a ready-to-post video reel with synchronized voiceover & visuals.</p>
                          </div>
                          <Button size="sm" onClick={() => {
                            sessionStorage.setItem('gm_video_form', JSON.stringify(form));
                            sessionStorage.setItem('gm_video_result', JSON.stringify(result));
                            router.push('/video-generator');
                          }}>
                            <Film size={13} /> Proceed to Video Generator ➔
                          </Button>
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
