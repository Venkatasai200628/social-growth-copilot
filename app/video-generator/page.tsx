'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Film, ArrowLeft, Download, RefreshCw, Sparkles, Upload, Wand2, Mic,
  Monitor, AlertCircle, Zap, Clapperboard,
  CheckCircle2, Trash2, Camera, Palette, Layout, Play, Pause, Volume2, VolumeX, Maximize2
} from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { useToast } from '../components/Toast';
import { Button, Card } from '../components/ui';
import { authFetch } from '@/lib/client';
import {
  renderPromoVideo, downloadVideo, RenderResult, VIDEO_THEMES, VIDEO_TRANSITIONS,
  VIDEO_FORMAT_STYLES, ASPECT_RATIOS, VideoFormatStyle, AspectRatioType, TransitionType, VideoScene
} from '@/lib/video';

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
}

function VideoGeneratorInner() {
  const toast = useToast();

  const [scriptData, setScriptData] = useState<VideoScript | null>(null);
  const [businessName, setBusinessName] = useState('GrowMitra Brand');
  const [productDesc, setProductDesc] = useState('');
  const [category, setCategory] = useState('');

  // Video Engine Mode
  const [videoMode, setVideoMode] = useState<'kinetic' | 'generative'>('kinetic');

  // Kinetic Video Render state
  const [video, setVideo] = useState<RenderResult | null>(null);
  const [videoBusy, setVideoBusy] = useState(false);
  const [videoPct, setVideoPct] = useState(0);
  const [videoError, setVideoError] = useState('');

  // Generative AI Video state (Replicate)
  const [aiVideoUrl, setAiVideoUrl] = useState<string | null>(null);
  const [aiVideoBusy, setAiVideoBusy] = useState(false);
  const [aiVideoError, setAiVideoError] = useState('');

  // Custom Video Player Scrubber & Controls
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Visuals State (Uploads + AI generation)
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoSourceTab, setPhotoSourceTab] = useState<'upload' | 'ai_generate'>('ai_generate');
  const [aiConceptPrompt, setAiConceptPrompt] = useState('');
  const [aiConceptStyle, setAiConceptStyle] = useState<'ai_presenter' | 'product_macro' | 'festival_mood'>('ai_presenter');
  const [aiConceptBusy, setAiConceptBusy] = useState(false);

  // Video controls
  const [selectedFormat, setSelectedFormat] = useState<VideoFormatStyle>('motionExplainer');
  const [selectedAspect, setSelectedAspect] = useState<AspectRatioType>('9:16');
  const [selectedTheme, setSelectedTheme] = useState<string>('royalGold');
  const [selectedTransition, setSelectedTransition] = useState<TransitionType>('crossfade');
  const [voiceOn, setVoiceOn] = useState(true);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');

  // Load script and form from previous step
  useEffect(() => {
    try {
      const savedScript = JSON.parse(sessionStorage.getItem('gm_video_result') || 'null');
      if (savedScript) setScriptData(savedScript);

      const savedForm = JSON.parse(sessionStorage.getItem('gm_video_form') || 'null');
      if (savedForm) {
        if (savedForm.businessName) setBusinessName(savedForm.businessName);
        if (savedForm.productDescription) setProductDesc(savedForm.productDescription);
        if (savedForm.category) setCategory(savedForm.category);
      }

      const savedPhotos = JSON.parse(sessionStorage.getItem('gm_video_photos') || '[]');
      if (Array.isArray(savedPhotos) && savedPhotos.length > 0) {
        setPhotos(savedPhotos);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Save photos whenever updated
  const updatePhotos = (newPhotos: string[]) => {
    setPhotos(newPhotos);
    try {
      sessionStorage.setItem('gm_video_photos', JSON.stringify(newPhotos));
    } catch {
      /* quota */
    }
  };

  // Upload local photos
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).slice(0, 4).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          updatePhotos([reader.result, ...photos.slice(0, 3)]);
        }
      };
      reader.readAsDataURL(file);
    });
    toast('Photo added to video timeline!', 'ai');
  };

  // 1-Click AI Visual Generator
  const generateAiVisual = async () => {
    const promptInput = aiConceptPrompt.trim() || productDesc.trim() || 'Festive Indian commercial showcase';
    setAiConceptBusy(true);
    try {
      let fullPrompt = '';
      if (aiConceptStyle === 'ai_presenter') {
        fullPrompt = `Vertical 9:16 portrait of an attractive charismatic Indian brand ambassador creator smiling warmly, presenting ${promptInput}, ${category || 'Retail'} commercial, modern luxury studio, crisp facial details, cinematic lighting, photorealistic`;
      } else if (aiConceptStyle === 'product_macro') {
        fullPrompt = `Vertical 9:16 commercial advertisement hero macro still of ${promptInput}, ${category || 'Retail'} advertising, dramatic studio lighting, rich textures, pristine presentation, 8k photorealistic`;
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

      updatePhotos([data.imageDataUrl, ...photos.slice(0, 3)]);
      toast('AI visual generated and added to your video! 📸', 'ai');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not generate visual', 'error');
    } finally {
      setAiConceptBusy(false);
    }
  };

  // Render Instant Kinetic Reel (CapCut-grade)
  const makeKineticVideo = async () => {
    const sceneList: VideoScene[] = (scriptData?.scenes && scriptData.scenes.length > 0)
      ? scriptData.scenes.map((s) => ({
          title: s.text_overlay || s.shot_type || 'Special Offer',
          subtitle: s.voiceover || s.visual || '',
          imagePrompt: s.visual,
        }))
      : [
          {
            title: businessName,
            subtitle: scriptData?.hook_line || 'Special offer just for you!',
            imagePrompt: productDesc || 'Product Hero View',
          },
          {
            title: 'Premium Quality',
            subtitle: 'Handcrafted quality and premium design.',
            imagePrompt: productDesc || 'Craft & Quality',
          },
          {
            title: 'Visit Us Today',
            subtitle: 'Visit our store or order online today!',
            imagePrompt: 'Store and website offer details',
          },
        ];

    setVideoBusy(true);
    setVideoError('');
    setVideo(null);
    try {
      const res = await renderPromoVideo(
        {
          businessName,
          cta: scriptData?.cta || 'Order Now',
          scenes: sceneList,
          photos: photos.length > 0 ? photos : undefined,
          voiceover: voiceOn
            ? {
                text: (scriptData?.voiceover_script || scriptData?.hook_line || 'Experience the quality today.').slice(0, 500),
                language: 'english',
                voice: voiceGender,
              }
            : null,
          paletteId: selectedTheme,
          transition: selectedTransition,
          videoStyle: selectedFormat,
          aspect: selectedAspect,
          secondsPerScene: 2.8,
        },
        (p: number) => setVideoPct(p)
      );
      setVideo(res);
      setVideoDuration(res.durationSec);
      toast('Kinetic Video Reel rendered successfully! 🎬', 'ai');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to render video';
      setVideoError(msg);
      toast(msg, 'error');
    } finally {
      setVideoBusy(false);
    }
  };

  // Generate Generative AI Video (Replicate)
  const makeGenerativeVideo = async () => {
    const targetImage = photos[0];
    if (!targetImage) {
      toast('Please upload or generate at least one photo first to bring it to life with AI video!', 'error');
      return;
    }

    setAiVideoBusy(true);
    setAiVideoError('');
    setAiVideoUrl(null);
    try {
      const promptText = `Cinematic commercial camera pan, physical subject movement, photorealistic high quality ad of ${productDesc || 'product and presenter'}`;
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

  // Player controls helpers
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    if (!isFinite(v.duration) || isNaN(v.duration)) {
      v.currentTime = 1e10;
      v.ontimeupdate = () => {
        v.ontimeupdate = null;
        v.currentTime = 0;
        setVideoDuration(v.duration || video?.durationSec || 10);
      };
    } else {
      setVideoDuration(v.duration || video?.durationSec || 10);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <main className="min-h-screen py-10 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-4 mb-8 pb-5 border-b border-[var(--border)] flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/video-studio"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--text-soft)] hover:text-[var(--text)] transition-colors"
          >
            <ArrowLeft size={13} /> Back to Script Studio
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[var(--text)] flex items-center gap-2">
              <Film className="text-[var(--neon)]" size={22} /> AI Video Production Studio
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Render your video reel with kinetic typography, custom theme palettes, or physical AI diffusion motion.
            </p>
          </div>
        </div>

        {scriptData && (
          <div className="px-3 py-1.5 rounded-xl bg-[color-mix(in_srgb,var(--neon)_10%,transparent)] border border-[color-mix(in_srgb,var(--neon)_25%,transparent)] text-xs text-[var(--neon)] max-w-md truncate">
            🎬 Script: <span className="font-semibold text-[var(--text)]">{scriptData.title || businessName}</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visuals & Engine Configuration (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Visuals (Upload or AI Generation) */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs text-[var(--neon)] uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Camera size={13} /> Step 1: Video Visuals & Photos
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">{photos.length}/4 visuals ready</span>
            </div>

            {/* Visuals source tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] mb-4 text-xs">
              <button
                type="button"
                onClick={() => setPhotoSourceTab('ai_generate')}
                className={`py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                  photoSourceTab === 'ai_generate'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-soft)] hover:text-[var(--text)]'
                }`}
              >
                <Wand2 size={12} /> Generate AI Visual
              </button>
              <button
                type="button"
                onClick={() => setPhotoSourceTab('upload')}
                className={`py-1.5 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                  photoSourceTab === 'upload'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-soft)] hover:text-[var(--text)]'
                }`}
              >
                <Upload size={12} /> Upload Photos
              </button>
            </div>

            {photoSourceTab === 'ai_generate' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setAiConceptStyle('ai_presenter')}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                      aiConceptStyle === 'ai_presenter'
                        ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--text)] font-semibold'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    Ambassador
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiConceptStyle('product_macro')}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                      aiConceptStyle === 'product_macro'
                        ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--text)] font-semibold'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    Product Macro
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiConceptStyle('festival_mood')}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                      aiConceptStyle === 'festival_mood'
                        ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--text)] font-semibold'
                        : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    Festive Mood
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiConceptPrompt}
                    onChange={(e) => setAiConceptPrompt(e.target.value)}
                    placeholder={productDesc || 'e.g. 22K royal gold bridal necklace with diyas'}
                    className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--accent)] outline-none"
                  />
                  <Button size="sm" onClick={generateAiVisual} disabled={aiConceptBusy}>
                    {aiConceptBusy ? <RefreshCw size={12} className="animate-spin" /> : <><Sparkles size={12} /> Generate</>}
                  </Button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-xl p-4 text-center cursor-pointer block transition-colors bg-[var(--input-bg)]">
                <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                <Upload size={18} className="mx-auto text-[var(--text-muted)] mb-1" />
                <p className="text-xs font-medium text-[var(--text)]">Click or drag photos here</p>
                <p className="text-[10px] text-[var(--text-muted)]">Upload up to 4 images for your video timeline</p>
              </label>
            )}

            {/* Active photos strip */}
            {photos.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] text-[var(--text-soft)] font-medium">
                    Timeline Visuals ({photos.length} active — cycled across all scenes):
                  </span>
                  <button
                    type="button"
                    onClick={() => updatePhotos([])}
                    className="text-[10px] text-[var(--danger)] hover:underline flex items-center gap-1"
                  >
                    <Trash2 size={10} /> Clear all
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((src, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-[var(--border)] aspect-[9/16] bg-black">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Visual #${i + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 bg-black/70 text-[9px] px-1 py-0.5 rounded text-white font-mono">
                        #{i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Card 2: Engine & Customization */}
          <Card className="p-5">
            <div className="text-xs text-[var(--neon)] uppercase tracking-wider font-bold flex items-center gap-1.5 mb-3">
              <Clapperboard size={13} /> Step 2: Video Engine & Themes
            </div>

            <div className="grid grid-cols-2 p-1 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] mb-4 text-xs">
              <button
                type="button"
                onClick={() => setVideoMode('kinetic')}
                className={`py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                  videoMode === 'kinetic'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-soft)] hover:text-[var(--text)]'
                }`}
              >
                <Zap size={13} /> Instant Kinetic Reel
              </button>
              <button
                type="button"
                onClick={() => setVideoMode('generative')}
                className={`py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                  videoMode === 'generative'
                    ? 'bg-[var(--accent)] text-white shadow-sm'
                    : 'text-[var(--text-soft)] hover:text-[var(--text)]'
                }`}
              >
                <Film size={13} /> AI Generative Video
              </button>
            </div>

            {videoMode === 'kinetic' ? (
              <div className="space-y-4 text-xs">
                <p className="text-[11px] text-[var(--text-muted)]">
                  ⚡ <strong>CapCut-grade kinetic typography</strong> with atmospheric ember particles, scene transitions, and synchronized voice narration. 100% Free & Fast (~3s).
                </p>

                {/* 1. Theme Palette Selector */}
                <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                  <label className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
                    <Palette size={13} className="text-[var(--gold)]" /> Design Theme Palette
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {VIDEO_THEMES.map((theme) => {
                      const isSelected = selectedTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setSelectedTheme(theme.id)}
                          className={`p-2 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col gap-1 ${
                            isSelected
                              ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] shadow-sm'
                              : 'border-[var(--border)] bg-[var(--input-bg)] hover:border-[var(--border-strong)]'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: theme.accent }}
                            />
                            {isSelected && <span className="text-[10px] text-[var(--accent)] font-bold">✓</span>}
                          </div>
                          <span className="text-[11px] font-bold text-[var(--text)] mt-0.5">{theme.name}</span>
                          <span className="text-[9px] text-[var(--text-muted)] truncate">{theme.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Format Style Selector */}
                <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                  <label className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
                    <Layout size={13} className="text-[var(--neon)]" /> Video Presentation Format
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {VIDEO_FORMAT_STYLES.map((fs) => {
                      const isSelected = selectedFormat === fs.id;
                      return (
                        <button
                          key={fs.id}
                          type="button"
                          onClick={() => setSelectedFormat(fs.id)}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-[var(--neon)] bg-[color-mix(in_srgb,var(--neon)_15%,transparent)] font-semibold'
                              : 'border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text)]'
                          }`}
                        >
                          <span className="text-[11px] font-bold block text-[var(--text)] truncate">{fs.name}</span>
                          <span className="text-[9px] text-[var(--text-muted)] block truncate">{fs.badge}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Dimensions, Transitions & Voice */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
                  <div>
                    <label className="text-[11px] text-[var(--text-soft)] block mb-1">Dimensions</label>
                    <select
                      value={selectedAspect}
                      onChange={(e) => setSelectedAspect(e.target.value as AspectRatioType)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text)]"
                    >
                      {ASPECT_RATIOS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-[var(--text-soft)] block mb-1">Transitions</label>
                    <select
                      value={selectedTransition}
                      onChange={(e) => setSelectedTransition(e.target.value as TransitionType)}
                      className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-2.5 py-1.5 text-xs text-[var(--text)]"
                    >
                      {VIDEO_TRANSITIONS.map((tr) => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                  <label className="flex items-center gap-2 text-xs text-[var(--text-soft)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={voiceOn}
                      onChange={(e) => setVoiceOn(e.target.checked)}
                      className="w-3.5 h-3.5 accent-[var(--neon)]"
                    />
                    <Mic size={12} /> AI Voiceover
                  </label>
                  {voiceOn && (
                    <select
                      value={voiceGender}
                      onChange={(e) => setVoiceGender(e.target.value as 'female' | 'male')}
                      className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-full px-2.5 py-0.5 text-xs text-[var(--text)]"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                    </select>
                  )}
                </div>

                {/* 4. Scene Storyboard & Visuals Sync Preview */}
                <div className="pt-2 border-t border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--text)]">
                    <span className="flex items-center gap-1.5">
                      <Clapperboard size={12} className="text-[var(--neon)]" /> Storyboard Text & Visuals Sync
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {scriptData?.scenes?.length || 3} scenes
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {((scriptData?.scenes && scriptData.scenes.length > 0) ? scriptData.scenes : [
                      { scene_number: 1, text_overlay: businessName, voiceover: scriptData?.hook_line || 'Special Offer' },
                      { scene_number: 2, text_overlay: 'Exclusive Quality', voiceover: 'Handcrafted quality and premium design.' },
                      { scene_number: 3, text_overlay: 'Limited Time Offer', voiceover: 'Visit our store or order online today!' }
                    ]).map((sc, i) => {
                      const activePhoto = photos.length > 0 ? photos[i % photos.length] : null;
                      return (
                        <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]">
                          {activePhoto ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={activePhoto} alt="" className="w-6 h-9 object-cover rounded border border-[var(--border)] shrink-0" />
                          ) : (
                            <div className="w-6 h-9 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-[9px] text-white/40">
                              #{i + 1}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold text-[var(--text)] truncate">Scene {i + 1}: {sc.text_overlay || 'Scene'}</p>
                            <p className="text-[9px] text-[var(--text-muted)] truncate italic">&ldquo;{sc.voiceover}&rdquo;</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button className="w-full mt-2" size="lg" onClick={makeKineticVideo} disabled={videoBusy}>
                  {videoBusy ? `Rendering Reel ${Math.round(videoPct * 100)}%…` : <><Zap size={14} /> Render Kinetic Reel 🎬</>}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-[11px] text-[var(--text-muted)]">
                  🎬 <strong>Replicate LTX-Video neural diffusion</strong> generates physical camera sweep and subject motion from your first visual.
                </p>

                {photos.length === 0 ? (
                  <div className="p-3 rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] text-[11px] text-[var(--text-soft)] flex items-center gap-2">
                    <Sparkles size={14} className="text-[var(--accent)] shrink-0" />
                    Please upload or generate at least one photo above first!
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photos[0]} alt="Hero visual" className="w-12 h-16 object-cover rounded-lg border border-[var(--border)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--text)] truncate">Primary Visual Ready</p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">Lightricks LTX-Video (25 FPS diffusion motion)</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[color-mix(in_srgb,var(--neon)_15%,transparent)] text-[var(--neon)] font-medium">Ready</span>
                  </div>
                )}

                <Button
                  className="w-full mt-2"
                  size="lg"
                  onClick={makeGenerativeVideo}
                  disabled={aiVideoBusy || photos.length === 0}
                >
                  {aiVideoBusy ? (
                    <><RefreshCw size={14} className="animate-spin" /> Generating LTX Diffusion Video… (~25s)</>
                  ) : (
                    <><Film size={14} /> Generate Physical AI Video 🚀</>
                  )}
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Dedicated Video Player & Download Center (7 Cols) */}
        <div className="lg:col-span-7">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
              <div className="text-xs text-[var(--neon)] uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Monitor size={14} /> Video Player & Download Center
              </div>
              {(video || aiVideoUrl) && (
                <span className="text-xs text-[var(--success)] font-medium flex items-center gap-1">
                  <CheckCircle2 size={12} /> Video Ready to Export
                </span>
              )}
            </div>

            {/* Error notifications */}
            {(videoError || aiVideoError) && (
              <div className="mb-4 p-3.5 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-xs text-[var(--danger)] flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Generation notice:</p>
                  <p className="mt-0.5">{videoError || aiVideoError}</p>
                  {aiVideoError && (
                    <p className="mt-1 text-[11px] text-[var(--text-soft)]">
                      👉 Tip: You can switch to the <strong>⚡ Instant Kinetic Reel</strong> tab on the left to render your video reel immediately for free!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Rendering Progress View */}
            {(videoBusy || aiVideoBusy) && (
              <div className="py-20 text-center space-y-4">
                <div className="w-12 h-12 rounded-full border-3 border-[var(--accent)] border-t-transparent animate-spin mx-auto" />
                <div>
                  <h3 className="text-base font-semibold text-[var(--text)]">
                    {videoBusy ? 'Rendering CapCut-Grade Kinetic Typography Reel…' : 'Synthesizing Neural Diffusion Motion with LTX-Video…'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {videoBusy ? `Compositing particles, scenes & audio frames (${Math.round(videoPct * 100)}%)` : 'Rendering physical camera movement at 25 FPS (takes ~20-30s)'}
                  </p>
                </div>
                {videoBusy && (
                  <div className="max-w-xs mx-auto h-2 bg-[var(--input-bg)] rounded-full overflow-hidden border border-[var(--border)]">
                    <div className="h-full bg-[var(--neon)] transition-all duration-200" style={{ width: `${videoPct * 100}%` }} />
                  </div>
                )}
              </div>
            )}

            {/* Rendered Video Player with Smooth Custom Scrubber */}
            {!videoBusy && !aiVideoBusy && (video || aiVideoUrl) && (
              <div className="space-y-6">
                <div className="relative group rounded-2xl overflow-hidden bg-black border border-[var(--border)] shadow-2xl flex flex-col items-center">
                  <video
                    ref={videoRef}
                    src={video ? video.url : aiVideoUrl!}
                    playsInline
                    autoPlay
                    loop
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="max-h-[500px] w-auto mx-auto object-contain cursor-pointer"
                    onClick={togglePlay}
                  />

                  {/* Sleek Custom Scrubber & Control Bar */}
                  <div className="w-full bg-slate-900/90 backdrop-blur-md px-4 py-3 border-t border-white/10 space-y-2">
                    {/* Draggable Progress Slider */}
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={videoDuration || video?.durationSec || 10}
                        step={0.05}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-2 rounded-lg bg-white/20 accent-[var(--neon)] cursor-pointer"
                      />
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between text-xs text-white">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={togglePlay}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                          title={isPlaying ? 'Pause' : 'Play'}
                        >
                          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </button>

                        <button
                          type="button"
                          onClick={toggleMute}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                          title={isMuted ? 'Unmute' : 'Mute'}
                        >
                          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>

                        <span className="font-mono text-[11px] text-white/70">
                          {Math.floor(currentTime)}s / {Math.floor(videoDuration || video?.durationSec || 10)}s
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleFullscreen}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                        title="Fullscreen"
                      >
                        <Maximize2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Big Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  {video && (
                    <Button
                      size="lg"
                      onClick={() => downloadVideo(video.url, businessName || 'growmitra', video.mimeType)}
                      className="w-full sm:w-auto shadow-lg"
                    >
                      <Download size={15} /> Download Video Reel ({video.mimeType.includes('mp4') ? 'MP4' : 'WebM'})
                    </Button>
                  )}
                  {aiVideoUrl && (
                    <a
                      href={aiVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={`${businessName.toLowerCase().replace(/\s+/g, '_')}_ai_video.mp4`}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-[var(--accent)] text-white hover:opacity-95 shadow-lg"
                    >
                      <Download size={15} /> Download Generative MP4
                    </a>
                  )}
                  <Button
                    size="lg"
                    variant="ghost"
                    onClick={video ? makeKineticVideo : makeGenerativeVideo}
                    className="w-full sm:w-auto"
                  >
                    <RefreshCw size={14} /> Re-render Video
                  </Button>
                </div>

                <div className="text-center text-[11px] text-[var(--text-muted)] space-y-1">
                  {video && (
                    <p>Format: {video.width}×{video.height} · {video.durationSec}s · Synchronized Voiceover · Atmospheric Particles</p>
                  )}
                  {aiVideoUrl && (
                    <p>Format: 25 FPS · Lightricks LTX-Video Generative Neural Diffusion</p>
                  )}
                  <p>Ready to post directly on Instagram Reels, YouTube Shorts & WhatsApp Status!</p>
                </div>
              </div>
            )}

            {/* Empty State before any video is rendered */}
            {!videoBusy && !aiVideoBusy && !video && !aiVideoUrl && (
              <div className="py-24 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
                  <Film size={28} />
                </div>
                <h3 className="text-sm font-semibold text-[var(--text)]">Your Video Preview Will Appear Here</h3>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                  Select your visuals and configure your settings on the left, then click <strong>Render Kinetic Reel</strong> or <strong>Generate AI Video</strong> to produce your video!
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </main>
  );
}

export default function VideoGeneratorPage() {
  return (
    <AuthGuard>
      <VideoGeneratorInner />
    </AuthGuard>
  );
}
