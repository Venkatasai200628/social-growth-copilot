'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Film, ArrowLeft, Download, RefreshCw, Sparkles, Upload, Wand2, Mic,
  Monitor, AlertCircle, Zap, Clapperboard,
  CheckCircle2, Camera, Palette, Layout, Play, Pause, Volume2, VolumeX, Maximize2
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
  image?: string;
  generating?: boolean;
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

/**
 * Intelligent contextual visual prompt generator.
 * Inspects each scene's visual cue, shot type, product details, and category:
 * - Direct Subject Fidelity: Directly translates the actual physical objects, textures, ingredients, and actions.
 * - Human Faces: Strictly restricted to explicit presenter / talking-head scenes without product action.
 * - Hands & Demonstration: Emphasizes hand movements, amber liquid droplets, packaging, and textures.
 * - Pure Product / Food / Jewellery: Pure product photography with NO human faces.
 */
function buildContextualScenePrompt(scene: Scene, productDesc: string, category: string): string {
  const visual = (scene.visual || '').trim();
  const shotType = (scene.shot_type || '').toLowerCase();
  const vLower = visual.toLowerCase();

  // Strip generic video camera directions to keep prompt clean for image generation
  const cleanedVisual = visual
    .replace(/^(camera fixed on|camera pans across|camera zooms into|camera follows|camera tilt to|slow tilt to|medium close-up of|close-up of|wide shot of|over-the-shoulder shot of|macro shot of)\s*/i, '')
    .trim();

  // Explicit face portrait ONLY when the shot is an explicit presenter / talking-head without product action
  const isExplicitPresenterFace =
    (shotType.includes('talking head') || shotType.includes('face close-up') || vLower.includes('face looking at camera') || vLower.includes('speaking to camera')) &&
    !vLower.includes('bottle') &&
    !vLower.includes('drop') &&
    !vLower.includes('hand open') &&
    !vLower.includes('apply') &&
    !vLower.includes('serum') &&
    !vLower.includes('cream') &&
    !vLower.includes('pour') &&
    !vLower.includes('jewellery') &&
    !vLower.includes('bangles') &&
    !vLower.includes('necklace') &&
    !vLower.includes('food') &&
    !vLower.includes('dish');

  if (isExplicitPresenterFace) {
    return `Vertical 9:16 commercial advertising still: charismatic Indian brand creator smiling warmly at camera in modern luxury studio, presenting ${productDesc || 'the brand'}, cinematic soft lighting, 8k photorealistic, professional portrait`;
  }

  // Hand actions, ingredient macro, application, drops, pouring, opening packaging
  const isActionOrTexture =
    vLower.includes('hand') ||
    vLower.includes('drop') ||
    vLower.includes('apply') ||
    vLower.includes('pat') ||
    vLower.includes('fingertip') ||
    vLower.includes('pour') ||
    vLower.includes('open') ||
    vLower.includes('texture') ||
    vLower.includes('liquid') ||
    vLower.includes('glisten') ||
    shotType.includes('demonstration') ||
    shotType.includes('over-the-shoulder');

  if (isActionOrTexture) {
    return `Vertical 9:16 macro commercial advertising photograph: ${cleanedVisual}, showcasing ${productDesc || 'the product'}. Focus on hands, texture, glistening droplets and packaging detail, luxury studio lighting, aesthetic depth of field, 8k resolution, photorealistic commercial still`;
  }

  // Pure product showcase / packaging / jewellery / food (NO human face when not requested!)
  return `Vertical 9:16 commercial product advertisement photograph: ${cleanedVisual}. Featuring ${productDesc || 'the product'}, ${category || 'Premium Brand'} commercial styling, pristine studio lighting, elegant reflection, high-end packaging detail, crisp 8k photorealistic, no human face`;
}

function VideoGeneratorInner() {
  const toast = useToast();

  const [scriptData, setScriptData] = useState<VideoScript | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [businessName, setBusinessName] = useState('GrowMitra Brand');
  const [productDesc, setProductDesc] = useState('');
  const [category, setCategory] = useState('');

  // 1-Click AI Full Workflow Batch & Cooldown State
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchStep, setBatchStep] = useState(0);
  const [batchStatusText, setBatchStatusText] = useState('');
  const [cooldownSec, setCooldownSec] = useState(0);
  const cancelBatchRef = useRef(false);

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
      const savedScript: VideoScript | null = JSON.parse(sessionStorage.getItem('gm_video_result') || 'null');
      const savedImages: (string | undefined)[] = JSON.parse(sessionStorage.getItem('gm_scene_images') || '[]');

      if (savedScript && savedScript.scenes && savedScript.scenes.length > 0) {
        setScriptData(savedScript);
        setScenes(
          savedScript.scenes.map((sc, i) => ({
            ...sc,
            image: savedImages[i] || sc.image || undefined,
          }))
        );
      } else {
        // Fallback default commercial storyboard
        setScenes([
          {
            scene_number: 1,
            duration_seconds: 4,
            shot_type: 'Opening Hook & Face',
            visual: 'Camera fixed on owner face smiling holding product',
            voiceover: 'Tired of dull skin and dark spots?',
            text_overlay: 'Dull Skin? Dark Spots?',
            music_mood: 'Upbeat',
          },
          {
            scene_number: 2,
            duration_seconds: 5,
            shot_type: 'Product Macro',
            visual: 'Amber serum bottle with saffron glistening in studio light',
            voiceover: 'Meet 10% Kumkumadi Radiance Face Serum, packed with saffron & sandalwood.',
            text_overlay: '10% Kumkumadi Radiance',
            music_mood: 'Upbeat',
          },
          {
            scene_number: 3,
            duration_seconds: 5,
            shot_type: 'Demonstration & Application',
            visual: 'Applying a few drops on fingertips onto cheek in soft focus',
            voiceover: 'Apply a few drops daily morning and night on clean skin.',
            text_overlay: 'Apply Daily AM & PM',
            music_mood: 'Upbeat',
          },
          {
            scene_number: 4,
            duration_seconds: 5,
            shot_type: 'Results & Call to Action',
            visual: 'Radiant glowing skin in natural sunlight with product',
            voiceover: 'In just 7 days, get that 24-hour glass skin glow. Order today!',
            text_overlay: '7-Day Glass Skin Glow',
            music_mood: 'Upbeat',
          },
        ]);
      }

      const savedForm = JSON.parse(sessionStorage.getItem('gm_video_form') || 'null');
      if (savedForm) {
        if (savedForm.businessName) setBusinessName(savedForm.businessName);
        if (savedForm.productDescription) setProductDesc(savedForm.productDescription);
        if (savedForm.category) setCategory(savedForm.category);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Save scene images to sessionStorage
  const saveSceneImages = (updatedScenes: Scene[]) => {
    try {
      const imagesArr = updatedScenes.map((s) => s.image);
      sessionStorage.setItem('gm_scene_images', JSON.stringify(imagesArr));
    } catch {
      /* quota */
    }
  };

  // Stop or pause the batch generation queue
  const stopBatch = () => {
    cancelBatchRef.current = true;
    setBatchBusy(false);
    setCooldownSec(0);
    setBatchStatusText('');
    toast('Automated visual queue paused.', 'ai');
  };

  // Generate visual for a single specific scene
  const generateSceneVisual = async (sceneIndex: number): Promise<{ success: boolean; retryAfter?: number }> => {
    const targetScene = scenes[sceneIndex];
    if (!targetScene) return { success: false };

    setScenes((prev) =>
      prev.map((s, idx) => (idx === sceneIndex ? { ...s, generating: true } : s))
    );

    try {
      const prompt = buildContextualScenePrompt(targetScene, productDesc, category);
      const res = await authFetch('/api/scene-image', {
        prompt,
        aspect: selectedAspect,
      });
      const data = await res.json();

      if (res.status === 429 || data.error === 'RATE_LIMIT') {
        const waitTime = data.retryAfter || 40;
        setScenes((prev) =>
          prev.map((s, idx) => (idx === sceneIndex ? { ...s, generating: false } : s))
        );
        toast(`Free AI cooldown active: next visual ready in ${waitTime}s.`, 'ai');
        return { success: false, retryAfter: waitTime };
      }

      if (!data.imageDataUrl) {
        throw new Error(data.error || 'Failed to generate visual');
      }

      setScenes((prev) => {
        const updated = prev.map((s, idx) =>
          idx === sceneIndex ? { ...s, image: data.imageDataUrl, generating: false } : s
        );
        saveSceneImages(updated);
        return updated;
      });

      toast(`Scene ${sceneIndex + 1} visual generated! 📸`, 'ai');
      return { success: true };
    } catch (err) {
      setScenes((prev) =>
        prev.map((s, idx) => (idx === sceneIndex ? { ...s, generating: false } : s))
      );
      toast(err instanceof Error ? err.message : 'Could not generate visual', 'error');
      return { success: false };
    }
  };

  // 1-Click AI Full Workflow: Generate All Scenes with Intelligent Cooldown & Auto-Retry
  const generateAllSceneVisuals = async () => {
    if (scenes.length === 0) return;
    setBatchBusy(true);
    cancelBatchRef.current = false;

    for (let i = 0; i < scenes.length; i++) {
      if (cancelBatchRef.current) break;

      // Skip already-generated visuals to save time & API quota
      if (scenes[i].image) {
        continue;
      }

      setBatchStep(i + 1);
      setBatchStatusText(`Generating Scene ${i + 1} of ${scenes.length}: ${scenes[i].shot_type || 'Visual'}…`);

      let result = await generateSceneVisual(i);
      if (cancelBatchRef.current) break;

      // If hit provider cooldown (1 image every 45s), countdown live and auto-retry
      if (!result.success && result.retryAfter) {
        let remaining = result.retryAfter + 2;
        while (remaining > 0 && !cancelBatchRef.current) {
          setCooldownSec(remaining);
          setBatchStatusText(
            `⏳ AI Provider Cooldown: Generating Scene ${i + 1} in ${remaining}s… (Free tier auto-pacing)`
          );
          await new Promise((r) => setTimeout(r, 1000));
          remaining--;
        }
        setCooldownSec(0);

        if (!cancelBatchRef.current) {
          setBatchStatusText(`Retrying Scene ${i + 1} of ${scenes.length}…`);
          result = await generateSceneVisual(i);
        }
      }

      // Small 1.5s aesthetic pause between scenes
      if (i < scenes.length - 1 && !cancelBatchRef.current) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    setBatchBusy(false);
    setCooldownSec(0);
    setBatchStatusText('');
    toast('Contextual AI visual workflow completed! 🎬', 'ai');
  };

  // Upload custom photo for a specific scene
  const handleSceneFileUpload = (sceneIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const dataUrl = reader.result;
        setScenes((prev) => {
          const updated = prev.map((s, idx) =>
            idx === sceneIndex ? { ...s, image: dataUrl } : s
          );
          saveSceneImages(updated);
          return updated;
        });
        toast(`Custom image assigned to Scene ${sceneIndex + 1}!`, 'ai');
      }
    };
    reader.readAsDataURL(file);
  };

  // Render Instant Kinetic Reel (CapCut-grade) using all scenes & their exact matching visuals
  const makeKineticVideo = async () => {
    const sceneList: VideoScene[] = scenes.map((s) => ({
      title: s.text_overlay || s.shot_type || 'Special Offer',
      subtitle: s.voiceover || s.visual || '',
      imagePrompt: s.visual,
      imageDataUrl: s.image,
    }));

    setVideoBusy(true);
    setVideoError('');
    setVideo(null);
    try {
      const res = await renderPromoVideo(
        {
          businessName,
          cta: scriptData?.cta || 'Order Now',
          scenes: sceneList,
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
      toast('Kinetic Video Reel rendered successfully with all scenes! 🎬', 'ai');
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
    const targetImage = scenes.find((s) => s.image)?.image;
    if (!targetImage) {
      toast('Please generate or upload at least one scene visual first!', 'error');
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

  const readyImagesCount = scenes.filter((s) => !!s.image).length;

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
              <Film className="text-[var(--neon)]" size={22} /> Full-Fledged AI Video Studio
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Scene-by-scene contextual visual generation matching your screenplay, themes, and animated typography.
            </p>
          </div>
        </div>

        {scriptData && (
          <div className="px-3 py-1.5 rounded-xl bg-[color-mix(in_srgb,var(--neon)_10%,transparent)] border border-[color-mix(in_srgb,var(--neon)_25%,transparent)] text-xs text-[var(--neon)] max-w-md truncate">
            🎬 Storyboard: <span className="font-semibold text-[var(--text)]">{scriptData.title || businessName} ({scenes.length} Scenes)</span>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visuals & Engine Configuration (6 Cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card 1: Full-Fledged Scene-by-Scene AI Visuals */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <div className="text-xs text-[var(--neon)] uppercase tracking-wider font-bold flex items-center gap-1.5">
                  <Camera size={13} /> Step 1: Scene-by-Scene Visual Storyboard
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {readyImagesCount} of {scenes.length} scene visuals generated
                </p>
              </div>

              {/* 1-Click AI Full Workflow Button */}
              {batchBusy ? (
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={stopBatch}
                  className="shadow-md text-xs font-semibold text-amber-300 border border-amber-500/40 hover:bg-amber-500/20"
                >
                  <Pause size={12} className="mr-1" /> Pause Queue ({batchStep}/{scenes.length})
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={generateAllSceneVisuals}
                  className="shadow-md text-xs font-semibold"
                >
                  <Wand2 size={13} className="mr-1" /> 1-Click: Generate All {scenes.length} Visuals ✨
                </Button>
              )}
            </div>

            {/* Active Batch Queue Status Banner */}
            {batchBusy && (
              <div className="mb-3 p-3 rounded-xl bg-[color-mix(in_srgb,var(--neon)_12%,transparent)] border border-[color-mix(in_srgb,var(--neon)_30%,transparent)] flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <RefreshCw size={14} className="animate-spin text-[var(--neon)] shrink-0" />
                  <div>
                    <p className="font-semibold text-[var(--text)]">
                      {batchStatusText || `Generating Scene ${batchStep} of ${scenes.length}…`}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {cooldownSec > 0
                        ? `⏳ Free tier auto-pacing: next visual unlocks in ${cooldownSec}s…`
                        : 'Auto-pacing guarantees 100% reliable image delivery without rate-limit errors.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={stopBatch}
                  className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--card)] text-[11px] text-[var(--text-soft)] hover:text-white transition-colors"
                >
                  Pause
                </button>
              </div>
            )}

            {/* Context Notice */}
            <div className="mb-4 p-2.5 rounded-xl bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] text-[11px] text-[var(--text-soft)]">
              💡 <strong>Contextual Visual AI:</strong> Faces are generated only for talking-head scenes; product macros and action textures are generated with pure product focus.
            </div>

            {/* Scene-by-Scene Visual Cards List */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {scenes.map((scene, idx) => (
                <div
                  key={scene.scene_number || idx}
                  className="p-3 rounded-xl border border-[var(--border)] bg-[var(--input-bg)] flex items-start gap-3 transition-all hover:border-[var(--border-strong)]"
                >
                  {/* Thumbnail / Image Box */}
                  <div className="relative w-16 h-24 rounded-lg overflow-hidden border border-[var(--border)] bg-black shrink-0 flex items-center justify-center">
                    {scene.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={scene.image} alt={`Scene ${idx + 1}`} className="w-full h-full object-cover" />
                    ) : scene.generating ? (
                      <div className="flex flex-col items-center gap-1 text-[9px] text-[var(--neon)] font-mono">
                        <RefreshCw size={14} className="animate-spin" />
                        <span>{cooldownSec > 0 ? `${cooldownSec}s` : 'AI…'}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => generateSceneVisual(idx)}
                        className="w-full h-full flex flex-col items-center justify-center p-1 text-[9px] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-white/5 transition-colors"
                      >
                        <Wand2 size={12} className="mb-1 text-[var(--accent)]" />
                        <span>Gen Visual</span>
                      </button>
                    )}
                    <span className="absolute top-1 left-1 bg-black/75 text-[8px] px-1 py-0.5 rounded text-white font-mono">
                      #{idx + 1}
                    </span>
                  </div>

                  {/* Scene Description & Actions */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <span className="text-[11px] font-bold text-[var(--text)] truncate">
                        Scene {idx + 1}: {scene.shot_type || 'Commercial Shot'}
                      </span>
                      <span className="text-[10px] text-[var(--text-faint)]">{scene.duration_seconds}s</span>
                    </div>

                    <p className="text-[10px] text-[var(--text-muted)] line-clamp-2 mt-0.5">
                      <strong>Visual:</strong> {scene.visual}
                    </p>

                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[var(--gold)] truncate">
                      <span className="font-semibold">Overlay:</span> &ldquo;{scene.text_overlay}&rdquo;
                    </div>

                    {/* Scene Action Buttons */}
                    <div className="mt-2 flex items-center gap-2 pt-1 border-t border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => generateSceneVisual(idx)}
                        disabled={scene.generating || batchBusy}
                        className="text-[10px] text-[var(--accent-soft)] hover:underline flex items-center gap-1 font-medium"
                      >
                        <RefreshCw size={10} className={scene.generating ? 'animate-spin' : ''} />
                        {scene.generating
                          ? (cooldownSec > 0 ? `Ready in ${cooldownSec}s…` : 'Generating…')
                          : (scene.image ? 'Re-roll AI' : 'Generate Visual')}
                      </button>

                      <label className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] cursor-pointer flex items-center gap-1 ml-auto">
                        <Upload size={10} />
                        <span>Custom Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleSceneFileUpload(idx, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Card 2: Engine & Customization */}
          <Card className="p-5">
            <div className="text-xs text-[var(--neon)] uppercase tracking-wider font-bold flex items-center gap-1.5 mb-3">
              <Clapperboard size={13} /> Step 2: Choose Video Engine & Theme
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
                    <Mic size={12} /> AI Voiceover Narration
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

                <Button className="w-full mt-2" size="lg" onClick={makeKineticVideo} disabled={videoBusy}>
                  {videoBusy ? `Rendering All ${scenes.length} Scenes (${Math.round(videoPct * 100)}%)…` : <><Zap size={14} /> Render All {scenes.length} Scenes into Video Reel 🎬</>}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <p className="text-[11px] text-[var(--text-muted)]">
                  🎬 <strong>Replicate LTX-Video neural diffusion</strong> generates physical camera sweep and subject motion from your first visual.
                </p>

                {readyImagesCount === 0 ? (
                  <div className="p-3 rounded-xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] text-[11px] text-[var(--text-soft)] flex items-center gap-2">
                    <Sparkles size={14} className="text-[var(--accent)] shrink-0" />
                    Please generate at least one scene visual above to bring it to life as physical video!
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={scenes.find((s) => !!s.image)?.image} alt="Hero visual" className="w-12 h-16 object-cover rounded-lg border border-[var(--border)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[var(--text)] truncate">Primary Scene Visual Ready</p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">Lightricks LTX-Video (25 FPS diffusion motion)</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-[color-mix(in_srgb,var(--neon)_15%,transparent)] text-[var(--neon)] font-medium">Ready</span>
                  </div>
                )}

                <Button
                  className="w-full mt-2"
                  size="lg"
                  onClick={makeGenerativeVideo}
                  disabled={aiVideoBusy || readyImagesCount === 0}
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

        {/* Right Column: Dedicated Video Player & Download Center (6 Cols) */}
        <div className="lg:col-span-6">
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
                    {videoBusy ? `Rendering All ${scenes.length} Scenes with Kinetic Typography…` : 'Synthesizing Neural Diffusion Motion with LTX-Video…'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {videoBusy ? `Compositing particles, visuals & voiceover narration (${Math.round(videoPct * 100)}%)` : 'Rendering physical camera movement at 25 FPS (takes ~20-30s)'}
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
                    <p>Format: {video.width}×{video.height} · {video.durationSec}s · All {scenes.length} Scenes Synchronized · Voiceover & Embers</p>
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
                  Click <strong>&ldquo;1-Click: Generate All {scenes.length} Visuals&rdquo;</strong> to generate contextual images for every scene, then click <strong>Render All Scenes into Video Reel</strong>!
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
