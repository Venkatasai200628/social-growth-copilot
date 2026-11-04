'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Film, ArrowLeft, Download, RefreshCw, Sparkles, Upload, Wand2, Mic,
  Monitor, AlertCircle, Zap, Clapperboard,
  CheckCircle2, Camera, Palette, Layout, Play, Pause, Volume2, VolumeX, Maximize2, HelpCircle,
  Key
} from 'lucide-react';
import AuthGuard from '../components/AuthGuard';
import { useToast } from '../components/Toast';
import { Button, Card } from '../components/ui';
import ApiKeyModal from '../components/ApiKeyModal';
import { loadUserApiKeys, maskApiKey, UserApiKeys } from '@/lib/api-keys';
import { authFetch } from '@/lib/client';
import {
  renderPromoVideo, downloadVideo, RenderResult, VIDEO_THEMES, VIDEO_TRANSITIONS,
  VIDEO_FORMAT_STYLES, ASPECT_RATIOS, TYPOGRAPHY_STYLES, TypographyStyle, VideoFormatStyle, AspectRatioType, TransitionType, VideoScene
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
 * - Natural realism: Accurately renders real actions, natural chef hands, sizzling grill, melting cheese, dripping serum.
 * - Human presence: Allows hands, chefs, presenters and models naturally whenever appropriate to the context.
 * - Anti-distortion: Avoids contradictory negative tokens that cause floating cups, lava, or bizarre blobs.
 */
function buildContextualScenePrompt(scene: Scene, productDesc: string, category: string): string {
  const visual = (scene.visual || '').trim();
  const shotType = (scene.shot_type || '').toLowerCase();
  const vLower = visual.toLowerCase();
  const pLower = (productDesc || '').toLowerCase();
  const cLower = (category || '').toLowerCase();

  // Strip generic video camera directions to keep prompt clean for image generation
  const cleanedVisual = visual
    .replace(/^(camera fixed on|camera pans across|camera zooms into|camera follows|camera tilt to|slow tilt to|medium close-up of|close-up of|wide shot of|over-the-shoulder shot of|macro shot of)\s*/i, '')
    .trim();

  // 1. Food, Kitchen, Dining, Burger, Pizza, Bakery Context
  const isFood =
    cLower.includes('food') || cLower.includes('dining') || cLower.includes('kitchen') || cLower.includes('bakery') ||
    vLower.includes('burger') || vLower.includes('fries') || vLower.includes('truffle') || vLower.includes('pizza') ||
    vLower.includes('dish') || vLower.includes('biryani') || vLower.includes('curry') || vLower.includes('meal') ||
    vLower.includes('beverage') || vLower.includes('shake') || vLower.includes('cake') || vLower.includes('snack') ||
    vLower.includes('patty') || vLower.includes('cheese') || vLower.includes('cheddar') || vLower.includes('grill') ||
    pLower.includes('burger') || pLower.includes('fries') || pLower.includes('food') || pLower.includes('pizza') || pLower.includes('truffle');

  if (isFood) {
    const isActionOrChef =
      vLower.includes('hand') || vLower.includes('sprinkl') || vLower.includes('cheddar') ||
      vLower.includes('melt') || vLower.includes('patty') || vLower.includes('pour') ||
      vLower.includes('flip') || vLower.includes('grill') || vLower.includes('dip') ||
      vLower.includes('cook') || vLower.includes('chef') || vLower.includes('season');

    if (isActionOrChef) {
      return `Vertical 9:16 authentic commercial food photography: ${cleanedVisual}. Featuring mouthwatering ${productDesc || 'gourmet food'}, genuine human chef hands actively preparing food in a clean modern kitchen, realistic melted cheese dripping, sizzling grill, fresh ingredients, warm culinary studio lighting, photorealistic 8k DSLR photo, sharp focus`;
    }

    return `Vertical 9:16 appetizing commercial food advertisement photograph: ${cleanedVisual}. Featuring delicious ${productDesc || 'gourmet dish'}, beautifully presented on restaurant dining table, crispy golden textures, fresh garnishes, savory steam, warm culinary ambiance, 8k photorealistic commercial still`;
  }

  // 2. Jewellery & Gold Context
  const isJewellery =
    cLower.includes('jewel') || cLower.includes('gold') ||
    vLower.includes('jewel') || vLower.includes('bangle') || vLower.includes('necklace') || vLower.includes('ring') ||
    pLower.includes('jewel') || pLower.includes('gold') || pLower.includes('diamond');

  if (isJewellery) {
    const hasPerson =
      vLower.includes('model') || vLower.includes('wear') || vLower.includes('neck') ||
      vLower.includes('wrist') || vLower.includes('ear') || vLower.includes('hand') ||
      vLower.includes('face') || vLower.includes('woman') || shotType.includes('over-the-shoulder');

    if (hasPerson) {
      return `Vertical 9:16 luxury Indian jewellery commercial still: ${cleanedVisual}. Featuring exquisite ${productDesc || 'fine jewellery'}, genuine 22k Indian gold temple craftsmanship, sparkling uncut diamonds, worn gracefully by elegant Indian woman in silk saree, soft royal ambient lighting, high jewelry catalog, 8k photorealistic`;
    }

    return `Vertical 9:16 luxury commercial jewellery advertisement photograph: ${cleanedVisual}. Featuring ${productDesc || 'fine jewellery'}, 22k pure gold craftsmanship, uncut diamond sparkle, velvet showcase styling, dramatic studio lighting, 8k resolution, razor-sharp focus`;
  }

  // 3. Skincare, Beauty & Cosmetics Context
  const isBeauty =
    cLower.includes('beauty') || cLower.includes('skin') || cLower.includes('cosmetic') ||
    vLower.includes('serum') || vLower.includes('skin') || vLower.includes('glow') ||
    vLower.includes('cream') || vLower.includes('bottle') || vLower.includes('dropper') ||
    pLower.includes('serum') || pLower.includes('cream') || pLower.includes('radiance');

  if (isBeauty) {
    return `Vertical 9:16 luxury skincare commercial photography: ${cleanedVisual}. Featuring ${productDesc || 'botanical face serum'}, amber glass dropper bottle with glistening golden oil droplets, gentle hands demonstrating application, clean modern marble vanity, radiant glowing skin, soft morning studio lighting, 8k photorealistic`;
  }

  // 4. Apparel, Boutique & Fashion Context
  const isFashion =
    cLower.includes('boutique') || cLower.includes('apparel') || cLower.includes('fashion') || cLower.includes('cloth') ||
    vLower.includes('saree') || vLower.includes('dress') || vLower.includes('kurti') || vLower.includes('lehenga') ||
    pLower.includes('saree') || pLower.includes('dress') || pLower.includes('collection');

  if (isFashion) {
    return `Vertical 9:16 Indian fashion editorial catalog photography: ${cleanedVisual}. Featuring ${productDesc || 'designer ethnic wear'}, elegant silk saree or bridal attire with authentic zari embroidery, graceful Indian model in contemporary boutique studio, soft diffused fashion lighting, 8k photorealistic`;
  }

  // 5. Explicit Presenter / Talking-Head Face Shot
  const isExplicitPresenterFace =
    shotType.includes('talking head') || shotType.includes('face close-up') ||
    vLower.includes('face looking at camera') || vLower.includes('speaking to camera') || vLower.includes('shop owner smiling');

  if (isExplicitPresenterFace) {
    return `Vertical 9:16 commercial advertising still: charismatic Indian brand creator smiling warmly at camera in modern luxury studio, presenting ${productDesc || 'the brand'}, cinematic soft lighting, 8k photorealistic, professional portrait`;
  }

  // 6. General / Other Commercial Products
  return `Vertical 9:16 commercial product advertisement photograph: ${cleanedVisual}. Featuring ${productDesc || 'the product'}, authentic real-world retail setting, natural human interactions where relevant, professional commercial lighting, sharp crisp focus, 8k photorealistic commercial still`;
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
  const [showEngineInfo, setShowEngineInfo] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [userKeys, setUserKeys] = useState<UserApiKeys>({});

  useEffect(() => {
    setUserKeys(loadUserApiKeys());
  }, []);

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
  const [selectedTypography, setSelectedTypography] = useState<TypographyStyle>('impactSans');
  const [selectedTransition, setSelectedTransition] = useState<TransitionType>('crossfade');
  const [voiceOn, setVoiceOn] = useState(true);
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');

  // Scene editing
  const [editingSceneIdx, setEditingSceneIdx] = useState<number | null>(null);
  const [editSceneForm, setEditSceneForm] = useState<Scene | null>(null);

  // Auto-countdown timer for cooldown status
  useEffect(() => {
    if (cooldownSec <= 0) return;
    const timer = setInterval(() => {
      setCooldownSec((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSec]);

  // Load script and form from previous step
  useEffect(() => {
    try {
      const savedScript: VideoScript | null = JSON.parse(sessionStorage.getItem('gm_video_result') || 'null');
      const savedScriptTitle = sessionStorage.getItem('gm_scene_images_script');
      let savedImages: (string | undefined)[] = [];

      // Only load cached images if they match this exact script title and business
      if (savedScript && savedScriptTitle && savedScriptTitle === savedScript.title) {
        savedImages = JSON.parse(sessionStorage.getItem('gm_scene_images') || '[]');
      } else {
        // Discard stale images from different script or old campaigns
        sessionStorage.removeItem('gm_scene_images');
      }

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
            shot_type: 'Opening Hook',
            visual: 'Crispy gourmet burger and golden truffle fries on wooden board',
            voiceover: 'Craving the juiciest burger in town?',
            text_overlay: 'Best Burgers in Town 🍔',
            music_mood: 'Upbeat',
          },
          {
            scene_number: 2,
            duration_seconds: 5,
            shot_type: 'Product Macro',
            visual: 'Melted cheese dripping over seasoned grilled patties with crisp lettuce',
            voiceover: 'Crafted with 100% prime ingredients and secret smoky sauce.',
            text_overlay: '100% Fresh & Sizzling',
            music_mood: 'Upbeat',
          },
          {
            scene_number: 3,
            duration_seconds: 5,
            shot_type: 'Side Dish Focus',
            visual: 'Golden parmesan truffle fries tossed with fresh herbs in basket',
            voiceover: 'Served hot with our signature garlic aioli and crunchy fries.',
            text_overlay: 'Loaded Truffle Fries 🍟',
            music_mood: 'Upbeat',
          },
          {
            scene_number: 4,
            duration_seconds: 5,
            shot_type: 'Call to Action',
            visual: 'Full burger combo meal spread with refreshing cold beverage',
            voiceover: 'Order now on Swiggy & Zomato or visit us today for 20% off!',
            text_overlay: 'Flat 20% Off Today',
            music_mood: 'Upbeat',
          },
        ]);
      }

      const savedForm = JSON.parse(sessionStorage.getItem('gm_video_form') || 'null');
      if (savedForm) {
        if (savedForm.businessName) setBusinessName(savedForm.businessName);
        if (savedForm.productDescription) setProductDesc(savedForm.productDescription);
        if (savedForm.category) {
          setCategory(savedForm.category);
          const cLow = savedForm.category.toLowerCase();
          if (cLow.includes('food') || cLow.includes('dining') || cLow.includes('kitchen') || cLow.includes('bakery')) {
            setSelectedTheme('kitchenSpice');
            setSelectedTypography('impactSans');
          } else if (cLow.includes('jewel') || cLow.includes('gold')) {
            setSelectedTheme('royalGold');
            setSelectedTypography('luxurySerif');
          } else if (cLow.includes('fashion') || cLow.includes('boutique') || cLow.includes('saree')) {
            setSelectedTheme('boutiqueRose');
            setSelectedTypography('modernChic');
          } else if (cLow.includes('tech') || cLow.includes('mobile')) {
            setSelectedTheme('cyberBlue');
            setSelectedTypography('boldNeon');
          }
        }
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
      if (scriptData?.title) {
        sessionStorage.setItem('gm_scene_images_script', scriptData.title);
      }
    } catch {
      /* quota */
    }
  };

  // Clear all scene visuals to start fresh
  const clearAllVisuals = () => {
    setScenes((prev) => prev.map((s) => ({ ...s, image: undefined })));
    try {
      sessionStorage.removeItem('gm_scene_images');
      sessionStorage.removeItem('gm_scene_images_script');
    } catch { /* ignore */ }
    toast('All scene visuals cleared — ready for fresh generation!', 'ai');
  };

  // Scene editing helpers
  const startEditScene = (idx: number) => {
    setEditingSceneIdx(idx);
    setEditSceneForm({ ...scenes[idx] });
  };

  const saveEditedScene = () => {
    if (editingSceneIdx === null || !editSceneForm) return;
    setScenes((prev) => {
      const updated = prev.map((s, idx) => (idx === editingSceneIdx ? { ...editSceneForm } : s));
      saveSceneImages(updated);
      return updated;
    });
    setEditingSceneIdx(null);
    setEditSceneForm(null);
    toast('Scene updated successfully!', 'ai');
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
  const generateSceneVisual = async (sceneIndex: number): Promise<{ success: boolean; retryAfter?: number; imageDataUrl?: string }> => {
    const targetScene = scenes[sceneIndex];
    if (!targetScene) return { success: false };

    setScenes((prev) =>
      prev.map((s, idx) => (idx === sceneIndex ? { ...s, generating: true } : s))
    );

    try {
      const prompt = buildContextualScenePrompt(targetScene, productDesc, category);
      const headers: Record<string, string> = {};
      if (userKeys.geminiKey) {
        headers['x-user-gemini-key'] = userKeys.geminiKey;
      }

      const res = await authFetch('/api/scene-image', {
        prompt,
        aspect: selectedAspect,
        userGeminiKey: userKeys.geminiKey,
      }, { headers });
      const data = await res.json();

      if (res.status === 429 || data.error === 'RATE_LIMIT') {
        const waitTime = data.retryAfter || 40;
        setCooldownSec(waitTime);
        setScenes((prev) =>
          prev.map((s, idx) => (idx === sceneIndex ? { ...s, generating: false } : s))
        );
        // Quietly update top display — no popup toast
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
      return { success: true, imageDataUrl: data.imageDataUrl };
    } catch (err) {
      setScenes((prev) =>
        prev.map((s, idx) => (idx === sceneIndex ? { ...s, generating: false } : s))
      );
      toast(err instanceof Error ? err.message : 'Could not generate visual', 'error');
      return { success: false };
    }
  };

  // 1-Click AI Full Workflow: Generate All Scenes with Intelligent Cooldown & 1.5-Min Auto-Pacing
  const generateAllSceneVisuals = async () => {
    if (scenes.length === 0) return;
    setBatchBusy(true);
    cancelBatchRef.current = false;

    const currentScenes: Scene[] = [...scenes];

    for (let i = 0; i < currentScenes.length; i++) {
      if (cancelBatchRef.current) break;

      // Skip already-generated visuals to save time & API quota
      if (currentScenes[i].image) {
        continue;
      }

      let generated = false;
      while (!generated && !cancelBatchRef.current) {
        setBatchStep(i + 1);
        setBatchStatusText(`Generating Scene ${i + 1} of ${currentScenes.length}: ${currentScenes[i].shot_type || 'Visual'}…`);

        const result = await generateSceneVisual(i);
        if (cancelBatchRef.current) break;

        if (result.success && result.imageDataUrl) {
          generated = true;
          currentScenes[i] = { ...currentScenes[i], image: result.imageDataUrl };

          // If there are more scenes to generate, auto-wait the cooldown before auto-triggering the next scene
          if (i < currentScenes.length - 1 && !cancelBatchRef.current) {
            // Gemini key has no rate limit (~2s pause); free tier auto-paces every 1.5 minutes (90s)
            const waitInterval = userKeys.geminiKey ? 2 : 90;
            let remaining = waitInterval;

            while (remaining > 0 && !cancelBatchRef.current) {
              setCooldownSec(remaining);
              setBatchStatusText(
                `⏳ Auto-Pacing (1.5 min check): Scene ${i + 1} ready! Next scene auto-generating in ${remaining}s…`
              );
              await new Promise((r) => setTimeout(r, 1000));
              remaining--;
            }
            setCooldownSec(0);
          }
        } else {
          // Cooldown / Rate Limit hit — wait 1.5 minutes (90s) and automatically re-check and retry
          const waitInterval = Math.max(90, result.retryAfter || 90);
          let remaining = waitInterval;

          while (remaining > 0 && !cancelBatchRef.current) {
            setCooldownSec(remaining);
            setBatchStatusText(
              `⏳ AI Provider Cooldown: Auto-checking & retrying Scene ${i + 1} in ${remaining}s… (1.5 min check)`
            );
            await new Promise((r) => setTimeout(r, 1000));
            remaining--;
          }
          setCooldownSec(0);
        }
      }
    }

    setBatchBusy(false);
    setCooldownSec(0);
    setBatchStatusText('');

    // If batch finished without cancellation and all scenes are ready, automatically render the video!
    if (!cancelBatchRef.current && currentScenes.every((s) => !!s.image)) {
      toast('🎉 All 7 scene visuals generated! Auto-rendering full video reel…', 'ai');
      await makeKineticVideo(currentScenes);
    } else if (!cancelBatchRef.current) {
      toast('Visual batch completed for available scenes!', 'ai');
    }
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
  const makeKineticVideo = async (scenesToRender?: Scene[] | unknown) => {
    const activeScenes = Array.isArray(scenesToRender) && scenesToRender.length > 0 ? (scenesToRender as Scene[]) : scenes;
    const sceneList: VideoScene[] = activeScenes.map((s) => ({
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
          category,
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
          fontStyle: selectedTypography,
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
      const headers: Record<string, string> = {};
      if (userKeys.replicateToken) {
        headers['x-user-replicate-key'] = userKeys.replicateToken;
      }

      const res = await authFetch('/api/generate-ai-video', {
        image: targetImage,
        prompt: promptText,
        aspect: selectedAspect,
        userApiKey: userKeys.replicateToken,
      }, { method: 'POST', headers });

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

  // Instant Sample Generative AI Video preview (100% Free Demo)
  const handlePreviewSampleGenerativeVideo = () => {
    setAiVideoUrl('/samples/ai-video-demo.mp4');
    setAiVideoError('');
    setVideoError('');
    toast('Loaded sample AI physical motion video! You can test the player, scrubber, and download.', 'ai');
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }, 200);
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

        <div className="flex items-center gap-3 flex-wrap">
          {/* Top AI Engine Status Badge */}
          <div className="flex items-center gap-2">
            {cooldownSec > 0 ? (
              <div className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs font-semibold text-amber-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>AI Cooldown: Wait {cooldownSec}s</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs font-semibold text-emerald-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>AI Engine: Ready</span>
              </div>
            )}
          </div>

          {scriptData && (
            <div className="px-3 py-1.5 rounded-xl bg-[color-mix(in_srgb,var(--neon)_10%,transparent)] border border-[color-mix(in_srgb,var(--neon)_25%,transparent)] text-xs text-[var(--neon)] max-w-md truncate">
              🎬 Storyboard: <span className="font-semibold text-[var(--text)]">{scriptData.title || businessName} ({scenes.length} Scenes)</span>
            </div>
          )}
        </div>
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

              <div className="flex items-center gap-2 flex-wrap">
                {readyImagesCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllVisuals}
                    disabled={batchBusy}
                    className="text-[11px] text-[var(--text-muted)] hover:text-[var(--danger)] px-2.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] transition-colors flex items-center gap-1"
                    title="Clear previous images to start fresh"
                  >
                    <RefreshCw size={11} /> Reset Visuals
                  </button>
                )}

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
                        ? `⏳ Auto-pacing (1.5 min check): Next scene visual triggers automatically in ${cooldownSec}s…`
                        : 'Auto-pacing active: Automatically generates each scene visual and renders the video reel.'}
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
              💡 <strong>Contextual Commercial AI:</strong> Realistic food preparation (chef hands, melting cheese, sizzling textures), glowing skincare droplets, or gold jewellery styling matching the exact scene script.
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

                    {/* Scene Edit Drawer or Normal View */}
                    {editingSceneIdx === idx ? (
                      <div className="mt-2 p-3 rounded-lg border border-[var(--neon)] bg-[var(--card)] space-y-2 text-xs animate-fade-in">
                        <div>
                          <label className="text-[10px] text-[var(--neon)] block font-semibold mb-0.5">Edit Visual Description / Scene Content:</label>
                          <textarea
                            value={editSceneForm?.visual || ''}
                            onChange={(e) => setEditSceneForm((prev) => prev ? { ...prev, visual: e.target.value } : null)}
                            rows={2}
                            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded p-1.5 text-xs text-[var(--text)] focus:border-[var(--neon)] outline-none"
                            placeholder="e.g. Juicy double patty cheeseburger with loaded truffle fries and garlic aioli dip"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-[var(--text-soft)] block font-semibold mb-0.5">Headline Overlay:</label>
                            <input
                              value={editSceneForm?.text_overlay || ''}
                              onChange={(e) => setEditSceneForm((prev) => prev ? { ...prev, text_overlay: e.target.value } : null)}
                              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded p-1.5 text-xs text-[var(--text)] focus:border-[var(--neon)] outline-none"
                              placeholder="e.g. Loaded Truffle Fries 🍟"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[var(--text-soft)] block font-semibold mb-0.5">Duration (sec):</label>
                            <input
                              type="number"
                              min={2}
                              max={10}
                              value={editSceneForm?.duration_seconds || 4}
                              onChange={(e) => setEditSceneForm((prev) => prev ? { ...prev, duration_seconds: Number(e.target.value) } : null)}
                              className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded p-1.5 text-xs text-[var(--text)] focus:border-[var(--neon)] outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-[var(--text-soft)] block font-semibold mb-0.5">Spoken Voiceover Line:</label>
                          <input
                            value={editSceneForm?.voiceover || ''}
                            onChange={(e) => setEditSceneForm((prev) => prev ? { ...prev, voiceover: e.target.value } : null)}
                            className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded p-1.5 text-xs text-[var(--text)] focus:border-[var(--neon)] outline-none"
                            placeholder="Spoken narration for this shot..."
                          />
                        </div>
                        <div className="flex items-center gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => { setEditingSceneIdx(null); setEditSceneForm(null); }}
                            className="px-2.5 py-1 rounded border border-[var(--border)] text-[10px] text-[var(--text-soft)] hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={saveEditedScene}
                            className="px-3 py-1 rounded bg-[var(--neon)] text-black font-semibold text-[10px]"
                          >
                            ✓ Save Scene
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[10px] text-[var(--text-muted)] line-clamp-2 mt-0.5">
                          <strong>Visual:</strong> {scene.visual}
                        </p>

                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[var(--gold)] truncate">
                          <span className="font-semibold">Overlay:</span> &ldquo;{scene.text_overlay}&rdquo;
                        </div>
                      </>
                    )}

                    {/* Scene Action Buttons */}
                    <div className="mt-2 flex items-center gap-2 pt-1 border-t border-[var(--border)] flex-wrap">
                      {cooldownSec > 0 && !scene.generating ? (
                        <button
                          type="button"
                          disabled
                          className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1 cursor-not-allowed"
                        >
                          <span>⏳ Wait {cooldownSec}s</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => generateSceneVisual(idx)}
                          disabled={scene.generating || batchBusy}
                          className="text-[10px] text-[var(--accent-soft)] hover:underline flex items-center gap-1 font-medium"
                        >
                          <RefreshCw size={10} className={scene.generating ? 'animate-spin' : ''} />
                          {scene.generating ? 'Generating…' : (scene.image ? 'Re-roll AI' : 'Generate Visual')}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => startEditScene(idx)}
                        className="text-[10px] text-[var(--neon)] hover:underline flex items-center gap-1 font-medium"
                      >
                        ✏️ Edit Scene
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

            {/* Dual Engine Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--input-bg)] border border-[var(--border)] mb-3 text-xs">
              <button
                type="button"
                onClick={() => setVideoMode('kinetic')}
                className={`py-2 px-2.5 rounded-lg font-medium transition-all flex flex-col items-center justify-center gap-0.5 text-center ${
                  videoMode === 'kinetic'
                    ? 'bg-[var(--neon)] text-black font-bold shadow-sm'
                    : 'text-[var(--text-soft)] hover:text-[var(--text)]'
                }`}
              >
                <span className="flex items-center gap-1 text-[11px]">
                  <Zap size={13} /> Instant Kinetic Reel
                </span>
                <span className={`text-[9px] ${videoMode === 'kinetic' ? 'text-black/80' : 'text-[var(--success)]'} font-semibold`}>
                  100% Free • All 7 Scenes
                </span>
              </button>
              <button
                type="button"
                onClick={() => setVideoMode('generative')}
                className={`py-2 px-2.5 rounded-lg font-medium transition-all flex flex-col items-center justify-center gap-0.5 text-center ${
                  videoMode === 'generative'
                    ? 'bg-[var(--accent)] text-white font-bold shadow-sm'
                    : 'text-[var(--text-soft)] hover:text-[var(--text)]'
                }`}
              >
                <span className="flex items-center gap-1 text-[11px]">
                  <Film size={13} /> AI Generative Video
                </span>
                <span className={`text-[9px] ${videoMode === 'generative' ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
                  Cloud GPU Diffusion ($)
                </span>
              </button>
            </div>

            {/* Difference / FAQ Toggle Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowEngineInfo(!showEngineInfo)}
                className="text-[11px] text-[var(--accent-soft)] hover:underline flex items-center gap-1"
              >
                <HelpCircle size={12} />
                {showEngineInfo ? 'Hide engine comparison' : 'What is the difference between Kinetic Reel and AI Generative Video?'}
              </button>

              {showEngineInfo && (
                <div className="mt-2.5 p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[11px] space-y-2.5 animate-fade-in">
                  <div className="p-2 rounded-lg bg-[color-mix(in_srgb,var(--neon)_8%,transparent)] border border-[color-mix(in_srgb,var(--neon)_20%,transparent)]">
                    <p className="font-bold text-[var(--text)] flex items-center gap-1">
                      <Zap size={12} className="text-[var(--neon)]" /> ⚡ Instant Kinetic Reel (100% Free & Recommended):
                    </p>
                    <p className="text-[var(--text-muted)] mt-0.5 leading-relaxed">
                      Runs directly inside your browser. Takes all 7 scene visuals and produces a complete 30s vertical reel with animated kinetic typography, synchronized voiceover narration, promotional discount badges, and smooth transitions in ~3 seconds. <strong>Zero external API credits required.</strong>
                    </p>
                  </div>

                  <div className="p-2 rounded-lg bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)]">
                    <p className="font-bold text-[var(--text)] flex items-center gap-1">
                      <Film size={12} className="text-[var(--accent)]" /> 🎬 AI Generative Video (Replicate Cloud GPU):
                    </p>
                    <p className="text-[var(--text-muted)] mt-0.5 leading-relaxed">
                      Uses remote cloud Nvidia A100 GPUs on Replicate (Lightricks LTX-Video). It animates a single still photo into a 5-second video with physical motion and camera sweeps. <strong>Requires paid Replicate account billing credits (~$0.05/run).</strong>
                    </p>
                  </div>
                </div>
              )}
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

                {/* 3. Typography & Font Mood Selector */}
                <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                  <label className="text-xs font-semibold text-[var(--text)] flex items-center gap-1.5">
                    <Sparkles size={13} className="text-[var(--neon)]" /> Typography & Font Mood
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPOGRAPHY_STYLES.map((ts) => {
                      const isSelected = selectedTypography === ts.id;
                      return (
                        <button
                          key={ts.id}
                          type="button"
                          onClick={() => setSelectedTypography(ts.id)}
                          className={`p-2 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-[var(--neon)] bg-[color-mix(in_srgb,var(--neon)_12%,transparent)] font-semibold shadow-sm'
                              : 'border-[var(--border)] bg-[var(--input-bg)] hover:border-[var(--border-strong)]'
                          }`}
                        >
                          <span className="text-[11px] font-bold block text-[var(--text)] truncate">{ts.name}</span>
                          <span className="text-[9px] text-[var(--text-muted)] block truncate">{ts.desc}</span>
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

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border)] bg-[var(--input-bg)]">
                  <div className="flex items-center gap-2">
                    <Key size={14} className={userKeys.replicateToken ? 'text-green-400' : 'text-amber-400'} />
                    <div>
                      <p className="text-[11px] font-semibold text-[var(--text)]">
                        {userKeys.replicateToken ? (
                          <span className="text-green-400">Custom Replicate Token Connected</span>
                        ) : (
                          <span>Using System Replicate Token</span>
                        )}
                      </p>
                      <p className="text-[9px] text-[var(--text-muted)]">
                        {userKeys.replicateToken
                          ? maskApiKey(userKeys.replicateToken)
                          : 'Have your own Replicate account or new key? Connect it securely'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="subtle"
                    size="sm"
                    onClick={() => setIsKeyModalOpen(true)}
                    className="text-[10px] px-2.5 py-1"
                  >
                    {userKeys.replicateToken ? 'Change' : '🔑 Connect Key'}
                  </Button>
                </div>

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

                <div className="space-y-2 pt-1">
                  <Button
                    className="w-full"
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

                  <button
                    type="button"
                    onClick={handlePreviewSampleGenerativeVideo}
                    className="w-full py-2.5 px-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--accent)] hover:bg-white/5 text-[11px] font-semibold text-[var(--accent-soft)] transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Play size={13} /> ▶️ Test / Preview Sample AI Video (Free Instant Demo)
                  </button>
                </div>
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
              <div className="mb-4 p-3.5 rounded-xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-xs text-[var(--danger)] flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Generation notice:</p>
                  <p className="mt-0.5 leading-relaxed">{videoError || aiVideoError}</p>
                  {aiVideoError && (
                    <div className="mt-2.5 pt-2 border-t border-[color-mix(in_srgb,var(--danger)_20%,transparent)] space-y-2.5">
                      <p className="text-[11px] text-[var(--text-soft)] leading-relaxed">
                        💡 <strong>Why this happens:</strong> Replicate cloud GPUs charge ~$0.05 per video and require prepaid billing credits. You have 3 options:
                      </p>
                      <ul className="text-[10px] text-[var(--text-muted)] space-y-1 list-disc pl-3">
                        <li><strong>Switch to Free Kinetic Reel:</strong> 100% Free forever, renders full 7-scene video in 3s without any API key.</li>
                        <li><strong>Connect your own Replicate Key:</strong> If you created a new account or added credit, enter your personal token.</li>
                        <li><strong>Test Instant Free Demo:</strong> Preview and test the AI video player, scrubber, and download immediately.</li>
                      </ul>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setVideoMode('kinetic');
                            setAiVideoError('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--neon)] text-black font-semibold text-xs hover:opacity-90 transition-all shadow-sm"
                        >
                          <Zap size={13} /> Switch to Free Instant Kinetic Reel
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsKeyModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-white font-semibold text-xs hover:border-[var(--accent)] transition-all shadow-sm"
                        >
                          <Key size={13} /> 🔑 Enter Different API Key
                        </button>
                        <button
                          type="button"
                          onClick={handlePreviewSampleGenerativeVideo}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--accent)]/15 text-[var(--accent-soft)] font-semibold text-xs hover:bg-[var(--accent)]/25 transition-all shadow-sm"
                        >
                          <Play size={13} /> ▶️ Test Free Demo Video
                        </button>
                      </div>
                    </div>
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

      {/* Secure API Key Manager Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => {
          setIsKeyModalOpen(false);
          setUserKeys(loadUserApiKeys());
        }}
        onKeysChanged={() => {
          setUserKeys(loadUserApiKeys());
        }}
      />
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
