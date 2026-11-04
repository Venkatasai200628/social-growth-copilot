/**
 * GrowMitra promo video renderer — builds a real, downloadable video file
 * (MP4/WebM via MediaRecorder) entirely in the browser:
 *   1. Scene images come from the owner's own photos (spec.photos, in
 *      order), with AI stills from our own /api/scene-image route (Gemini
 *      when the owner added a key, free fallback otherwise) filling the rest.
 *   2. Scenes animate on a canvas (Ken-Burns zoom, slide-in text overlays).
 *   3. canvas.captureStream() + MediaRecorder produces the file; an optional
 *      AI voiceover (via /api/tts) is decoded and mixed into the audio track.
 */

import { authFetch } from '@/lib/client';

export interface VideoScene {
  /**
   * Visual prompt for this scene (screenplay visual line + product context)
   * — turned into an image at render time via our /api/scene-image route.
   * Omitted (or a failed fetch) → animated gradient scene.
   */
  imagePrompt?: string;
  /** Big text for this scene (already in the owner's language). */
  title: string;
  /** Smaller supporting line. */
  subtitle?: string;
  /** Specific image data URL or link assigned to this exact scene */
  imageDataUrl?: string;
}

/** AI narration mixed into the video's audio track. */
export interface VoiceoverSpec {
  /** Narration text (callers clamp to ~500 chars; the API allows 600). */
  text: string;
  /** App language id — the app is English-only, so this is always 'english'. */
  language: string;
  voice?: 'female' | 'male';
}

export type TransitionType = 'crossfade' | 'slide' | 'zoom' | 'fadeBlack';
export type VideoFormatStyle = 'motionExplainer' | 'whiteboard' | 'cinematic';
export type AspectRatioType = '9:16' | '16:9' | '1:1';

export const VIDEO_FORMAT_STYLES: { id: VideoFormatStyle; name: string; desc: string; badge: string }[] = [
  { id: 'motionExplainer', name: 'Motion Explainer Reel', desc: 'Segmented scene progress, floating showcase frame & speech subtitle capsule', badge: 'Recommended' },
  { id: 'whiteboard', name: 'Studio Whiteboard Explainer', desc: 'Clean bright minimalist canvas, framed product focus & crisp callouts', badge: 'Clean' },
  { id: 'cinematic', name: 'Cinematic Full-Bleed Reel', desc: 'Dynamic Ken-Burns zoom, dramatic lighting & high-impact lower third', badge: 'Classic' },
];

export const ASPECT_RATIOS: { id: AspectRatioType; label: string; ratio: string }[] = [
  { id: '9:16', label: '9:16 Reels / Shorts', ratio: '1080×1920' },
  { id: '16:9', label: '16:9 Landscape', ratio: '1920×1080' },
  { id: '1:1', label: '1:1 Square Feed', ratio: '1080×1080' },
];

export interface VideoTheme {
  id: string;
  name: string;
  description: string;
  accent: string;
  bg1: string;
  bg2: string;
}

export type TypographyStyle = 'impactSans' | 'luxurySerif' | 'modernChic' | 'boldNeon';

export const TYPOGRAPHY_STYLES: { id: TypographyStyle; name: string; desc: string; sample: string }[] = [
  { id: 'impactSans', name: 'Impact Bold (Food & Retail)', desc: 'Punchy heavy sans-serif for high conversions', sample: 'Montserrat / Arial Black' },
  { id: 'luxurySerif', name: 'Royal Serif (Jewellery & Luxury)', desc: 'High-end elegant display serif', sample: 'Playfair Display / Cinzel' },
  { id: 'modernChic', name: 'Modern Chic (Fashion & Lifestyle)', desc: 'Refined editorial clean typography', sample: 'Poppins / Trebuchet' },
  { id: 'boldNeon', name: 'Cyber Tech (Tech & Mobile)', desc: 'High-contrast modern geometric sans', sample: 'Inter / Roboto' },
];

export const VIDEO_THEMES: VideoTheme[] = [
  { id: 'royalGold', name: 'Royal Gold', description: 'Luxury, Jewellery & Festive', accent: '#d4af37', bg1: '#141414', bg2: '#000000' },
  { id: 'diwaliMaroon', name: 'Diwali Special', description: 'Festive Maroon & Golden Spark', accent: '#f5c04a', bg1: '#2b0a0a', bg2: '#120303' },
  { id: 'kitchenSpice', name: 'Spice Orange', description: 'Vibrant for Cloud Kitchens, Burgers & Food', accent: '#ff6b35', bg1: '#2a0f0a', bg2: '#120604' },
  { id: 'burgerNeon', name: 'Burger & Street Food', description: 'Punchy Golden Mustard & Sizzling Red', accent: '#f59e0b', bg1: '#881337', bg2: '#380614' },
  { id: 'bakeryWarm', name: 'Warm Bakery', description: 'Cozy Artisanal, Sweets & Cafe', accent: '#ffb347', bg1: '#4a2c2a', bg2: '#1e0f0e' },
  { id: 'tealLuxe', name: 'Luxe Teal', description: 'Modern, Fresh & High-End', accent: '#2dd4bf', bg1: '#042f2b', bg2: '#01100e' },
  { id: 'boutiqueRose', name: 'Boutique Rose', description: 'Chic Apparel & Aesthetics', accent: '#f4a6c0', bg1: '#3d1c3a', bg2: '#160a16' },
  { id: 'cyberBlue', name: 'Cyber Tech Blue', description: 'Electric Cyan & Sleek Navy', accent: '#38bdf8', bg1: '#0f172a', bg2: '#020617' },
];

export const VIDEO_TRANSITIONS: { id: TransitionType; name: string; desc: string }[] = [
  { id: 'crossfade', name: 'Smooth Crossfade', desc: 'Cinematic blend between scenes' },
  { id: 'slide', name: 'Dynamic Slide', desc: 'Modern social reel slide wipe' },
  { id: 'zoom', name: 'Zoom Dissolve', desc: 'Punchy camera punch-in effect' },
  { id: 'fadeBlack', name: 'Fade Through Black', desc: 'Dramatic blackout between scenes' },
];

export interface VideoSpec {
  scenes: VideoScene[];
  businessName: string;
  /** Final frame text, e.g. the offer / CTA. */
  cta: string;
  /** Poster palette id for the color language. */
  paletteId?: string;
  /** Typography font style. */
  fontStyle?: TypographyStyle;
  /** Business category. */
  category?: string;
  /** Seconds per scene (default 2.5). */
  secondsPerScene?: number;
  /**
   * The owner's own photos (JPEG dataURLs) mapped to scenes IN ORDER —
   * scene i uses photos[i] when present, else the scene's AI image.
   */
  photos?: (string | null)[];
  /** AI voiceover narration; null/omitted renders a silent video. */
  voiceover?: VoiceoverSpec | null;
  /** Scene transition style */
  transition?: TransitionType;
  /** Video presentation format: motion explainer, whiteboard or cinematic */
  videoStyle?: VideoFormatStyle;
  /** Video aspect ratio */
  aspect?: AspectRatioType;
}

export interface RenderResult {
  url: string;
  mimeType: string;
  durationSec: number;
  width: number;
  height: number;
}

const W = 1080;
const H = 1920; // 9:16 — reels/shorts format, where this video will live

function paletteOf(id?: string) {
  // Minimal local palette map (kept independent from lib/poster for tree-shaking clarity)
  const map: Record<string, { bg1: string; bg2: string; ink: string; sub: string; accent: string; accent2: string }> = {
    diwaliMaroon: { bg1: '#2b0a0a', bg2: '#120303', ink: '#ffe9c2', sub: '#d9b98a', accent: '#f5c04a', accent2: '#ff8b3d' },
    royalGold:    { bg1: '#141414', bg2: '#000000', ink: '#f7f0dd', sub: '#cbb98a', accent: '#d4af37', accent2: '#f1dd8f' },
    tealLuxe:     { bg1: '#042f2b', bg2: '#01100e', ink: '#ecfffb', sub: '#a7e8df', accent: '#2dd4bf', accent2: '#fbbf24' },
    bakeryWarm:   { bg1: '#4a2c2a', bg2: '#1e0f0e', ink: '#fff6ec', sub: '#e8cda8', accent: '#ffb347', accent2: '#ffe0b3' },
    kitchenSpice: { bg1: '#2a0f0a', bg2: '#120604', ink: '#fff1e4', sub: '#e0b598', accent: '#ff6b35', accent2: '#ffc14d' },
    burgerNeon:   { bg1: '#881337', bg2: '#380614', ink: '#fef3c7', sub: '#fde68a', accent: '#f59e0b', accent2: '#ef4444' },
    boutiqueRose: { bg1: '#3d1c3a', bg2: '#160a16', ink: '#fff5f8', sub: '#e8c4d4', accent: '#f4a6c0', accent2: '#ffd7e4' },
    cyberBlue:    { bg1: '#0f172a', bg2: '#020617', ink: '#f8fafc', sub: '#94a3b8', accent: '#38bdf8', accent2: '#818cf8' },
  };
  return map[id ?? ''] ?? map.royalGold;
}

export function getFontForStyle(fontStyle?: TypographyStyle, category?: string): string {
  if (fontStyle === 'impactSans') return '"Montserrat", "Arial Black", "Impact", "Arial", sans-serif';
  if (fontStyle === 'luxurySerif') return '"Playfair Display", "Cinzel", "Georgia", serif';
  if (fontStyle === 'modernChic') return '"Poppins", "Trebuchet MS", "Segoe UI", sans-serif';
  if (fontStyle === 'boldNeon') return '"Inter", "Helvetica Neue", "Arial", sans-serif';

  const cat = (category || '').toLowerCase();
  if (cat.includes('food') || cat.includes('burger') || cat.includes('dining') || cat.includes('kitchen') || cat.includes('bakery')) {
    return '"Montserrat", "Arial Black", "Impact", "Arial", sans-serif';
  }
  if (cat.includes('jewel') || cat.includes('gold') || cat.includes('saree') || cat.includes('silk') || cat.includes('festive')) {
    return '"Playfair Display", "Cinzel", "Georgia", serif';
  }
  return '"Poppins", "Segoe UI", sans-serif';
}

export function getPromoBadgeText(sceneIdx: number, totalScenes: number, category?: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('food') || cat.includes('burger') || cat.includes('dining') || cat.includes('kitchen') || cat.includes('bakery')) {
    const foodBadges = ['🔥 MUST TRY SPECIAL', '🍔 CHEF\'S SIGNATURE', '✨ FRESH & SIZZLING', '⚡ CRAVE-WORTHY DEAL', '🍟 CRISPY & HOT'];
    return foodBadges[sceneIdx % foodBadges.length];
  }
  if (cat.includes('jewel') || cat.includes('gold') || cat.includes('saree') || cat.includes('silk')) {
    const jewelBadges = ['✨ 100% PURE CRAFTSMANSHIP', '💎 FESTIVE DHAMAKA', '🌟 TIMELESS ELEGANCE', '🏷️ EXCLUSIVE DISCOUNT', '🎁 INSURED DELIVERY'];
    return jewelBadges[sceneIdx % jewelBadges.length];
  }
  const generalBadges = ['⭐ EXCLUSIVE DEAL', '🔥 LIMITED TIME OFFER', '✨ PREMIUM QUALITY', '⚡ TOP RATED SELECTION', '🏷️ SPECIAL PROMOTION'];
  return generalBadges[sceneIdx % generalBadges.length];
}

const DISPLAY = '"Playfair Display", Georgia, serif';
const SANS = '"Poppins", "Segoe UI", sans-serif';
const INDIC = '"Noto Sans Devanagari", "Noto Sans Telugu", "Noto Sans Tamil", "Nirmala UI", sans-serif';

function loadImage(src: string, timeoutMs = 25_000): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    // Hard timeout: a hanging image request (rate-limited endpoint, dead
    // network) must degrade to a gradient scene, never stall the render.
    const timer = setTimeout(() => { img.src = ''; res(null); }, timeoutMs);
    img.onload = () => { clearTimeout(timer); res(img); };
    img.onerror = () => { clearTimeout(timer); res(null); };
    img.src = src;
  });
}

/**
 * Fetch an AI scene image from our own /api/scene-image route — Gemini when
 * the owner added a key, a free fallback provider otherwise. The route
 * answers with a data:image/...;base64 dataURL, so no third-party image
 * host is ever hit from the browser. Returns null on ANY failure (bad
 * input, all providers down, network error, 35s timeout) — callers fall
 * back to a gradient scene; this never throws.
 */
export async function fetchSceneImage(
  prompt: string,
  aspect: '9:16' | '1:1' | '16:9' = '9:16'
): Promise<string | null> {
  const attempt = async (): Promise<string | null> => {
    const r = await authFetch('/api/scene-image', { prompt, aspect });
    if (!r.ok) return null; // 400/503 — gradient scene, never throw
    const { imageDataUrl } = await r.json();
    return typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image')
      ? imageDataUrl
      : null;
  };
  // 35s hard ceiling over the whole operation (fetch + body parse): a hung
  // route must degrade to a gradient scene, never stall the render.
  const timeout = new Promise<null>((res) => setTimeout(() => res(null), 35_000));
  try {
    return await Promise.race([attempt(), timeout]);
  } catch {
    return null;
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else line = t;
  }
  if (lines.length < maxLines && line) lines.push(line);
  return lines;
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, alpha: number, zoom: number, dy: number) {
  const s = Math.max(W / img.width, H / img.height) * zoom;
  const dw = img.width * s;
  const dh = img.height * s;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2 + dy, dw, dh);
  ctx.restore();
}

interface AmbientParticle {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

const _particles: AmbientParticle[] = [];
function getParticles(w: number, h: number): AmbientParticle[] {
  if (_particles.length === 0) {
    for (let i = 0; i < 30; i++) {
      _particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 3.5 + 1.5,
        speed: Math.random() * 1.4 + 0.6,
        alpha: Math.random() * 0.45 + 0.15,
      });
    }
  }
  return _particles;
}

function drawAtmosphericParticles(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string) {
  const pts = getParticles(w, h);
  ctx.save();
  for (const pt of pts) {
    pt.y -= pt.speed;
    if (pt.y < 0) {
      pt.y = h;
      pt.x = Math.random() * w;
    }
    ctx.fillStyle = accent;
    ctx.globalAlpha = pt.alpha;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** CapCut-Grade Kinetic Typography & Subtitle Engine */
function drawSceneText(
  ctx: CanvasRenderingContext2D,
  p: ReturnType<typeof paletteOf>,
  title: string,
  subtitle: string | undefined,
  progress: number,
  displayFont: string,
  badgeText: string
) {
  // 1. Cinematic gradient scrim for maximum text legibility
  const scrim = ctx.createLinearGradient(0, H * 0.45, 0, H);
  scrim.addColorStop(0, 'rgba(0,0,0,0)');
  scrim.addColorStop(0.25, 'rgba(0,0,0,0.65)');
  scrim.addColorStop(1, 'rgba(0,0,0,0.96)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H * 0.45, W, H * 0.55);

  // 2. Kinetic snap-in slide and alpha
  const easeProgress = Math.min(1, progress * 1.8);
  const slide = (1 - easeProgress) * 45;
  const alpha = Math.min(1, progress * 3.0);

  ctx.save();
  ctx.globalAlpha = alpha;

  // 3. Highlight Category / Promotional Badge Pill
  const badgeY = H - 590 + slide;
  ctx.font = `800 24px ${displayFont}`;
  const badgeW = ctx.measureText(badgeText).width + 44;
  drawRoundRect(ctx, 80, badgeY - 40, badgeW, 40, 20);
  ctx.fillStyle = `${p.accent}33`;
  ctx.fill();
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = p.accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, 80 + badgeW / 2, badgeY - 20);
  ctx.textAlign = 'left';

  // 4. Kinetic Main Title with Drop Shadow
  let size = 84;
  ctx.font = `900 ${size}px ${displayFont}`;
  while (ctx.measureText(title).width > W - 160 && size > 38) {
    size -= 4;
    ctx.font = `900 ${size}px ${displayFont}`;
  }
  const titleLines = wrap(ctx, title, W - 160, 3);
  ctx.textBaseline = 'top';

  titleLines.forEach((l, i) => {
    const lineY = H - 530 + slide + i * (size * 1.15);
    // Crisp drop shadow
    ctx.shadowColor = 'rgba(0,0,0,0.95)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(l, 80, lineY);
  });
  ctx.shadowBlur = 0; // reset shadow

  // 5. Spoken Narration Subtitle with glowing backdrop
  if (subtitle) {
    const subY = H - 530 + slide + titleLines.length * (size * 1.15) + 32;
    ctx.font = `600 38px ${INDIC}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    wrap(ctx, subtitle, W - 180, 2).forEach((l, i) => ctx.fillText(l, 80, subY + i * 52));
  }
  ctx.restore();
}

function drawRoundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}

/** Segmented scene progress bar across the top */
function drawChapterBars(
  ctx: CanvasRenderingContext2D,
  currentIdx: number,
  localProgress: number,
  totalScenes: number,
  w: number,
  accentColor: string,
  isWhiteboard: boolean
) {
  const barTop = 45;
  const barHeight = 8;
  const margin = 50;
  const gap = 10;
  const availableW = w - margin * 2;
  const segW = (availableW - gap * (totalScenes - 1)) / totalScenes;

  ctx.save();
  for (let i = 0; i < totalScenes; i++) {
    const x = margin + i * (segW + gap);
    // Background track
    ctx.fillStyle = isWhiteboard ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.2)';
    drawRoundRect(ctx, x, barTop, segW, barHeight, 4);
    ctx.fill();

    // Filled portion
    let fill = 0;
    if (i < currentIdx) fill = 1;
    else if (i === currentIdx) fill = Math.min(1, Math.max(0, localProgress));

    if (fill > 0) {
      ctx.fillStyle = accentColor;
      drawRoundRect(ctx, x, barTop, segW * fill, barHeight, 4);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Floating showcase card for product image or vector motif */
function drawShowcaseCard(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  w: number,
  h: number,
  p: ReturnType<typeof paletteOf>,
  local: number,
  isWhiteboard: boolean
) {
  const cardMargin = 60;
  const cardX = cardMargin;
  const cardY = h * 0.11;
  const cardW = w - cardMargin * 2;
  const cardH = h > 1400 ? h * 0.44 : h * 0.46;
  const radius = 32;

  ctx.save();
  // Ambient drop shadow / glow
  ctx.shadowColor = isWhiteboard ? 'rgba(0, 0, 0, 0.08)' : `${p.accent}33`;
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 12;

  // Background
  ctx.fillStyle = isWhiteboard ? '#ffffff' : '#0b0f19';
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.fill();
  ctx.shadowBlur = 0; // reset shadow

  // Clip content inside rounded card
  ctx.save();
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.clip();

  if (img) {
    // 1. Draw ambient background backing so letterbox areas look intentionally luxury
    const bgGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    bgGrad.addColorStop(0, isWhiteboard ? '#f1f5f9' : p.bg1);
    bgGrad.addColorStop(1, isWhiteboard ? '#e2e8f0' : p.bg2);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    // 2. Proportional Contain with padding so human presenters and products are NEVER cut off!
    const pad = 12;
    const availW = cardW - pad * 2;
    const availH = cardH - pad * 2;
    const zoom = 1.0 + 0.03 * local;
    const s = Math.min(availW / img.width, availH / img.height) * zoom;
    const dw = img.width * s;
    const dh = img.height * s;
    const dx = cardX + (cardW - dw) / 2;
    const dy = cardY + (cardH - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    // Elegant graphic vector backdrop
    const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    grad.addColorStop(0, p.bg1);
    grad.addColorStop(1, p.bg2);
    ctx.fillStyle = grad;
    ctx.fillRect(cardX, cardY, cardW, cardH);

    // Glowing concentric rings
    ctx.strokeStyle = p.accent;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cardX + cardW / 2, cardY + cardH / 2, 100 + 20 * Math.sin(local * Math.PI), 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cardX + cardW / 2, cardY + cardH / 2, 200 + 30 * Math.sin(local * Math.PI), 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore(); // end clip

  // Card outline border
  ctx.strokeStyle = isWhiteboard ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.22)';
  ctx.lineWidth = 2;
  drawRoundRect(ctx, cardX, cardY, cardW, cardH, radius);
  ctx.stroke();

  ctx.restore();
}

/** Spoken subtitle capsule pill */
function drawSubtitleCapsule(
  ctx: CanvasRenderingContext2D,
  subtitle: string,
  w: number,
  h: number,
  local: number,
  isWhiteboard: boolean
) {
  const capsuleY = h - 290;
  const slide = (1 - Math.min(1, local * 2.5)) * 30;
  const alpha = Math.min(1, local * 2.5);

  ctx.save();
  ctx.globalAlpha = alpha;

  ctx.font = `600 34px ${INDIC}`;
  const lines = wrap(ctx, `🎙️ "${subtitle}"`, w - 160, 2);
  const boxW = w - 120;
  const boxH = Math.max(86, lines.length * 44 + 32);
  const boxX = 60;
  const boxY = capsuleY + slide;

  // Capsule container
  ctx.fillStyle = isWhiteboard ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = isWhiteboard ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, boxX, boxY, boxW, boxH, 24);
  ctx.fill();
  ctx.stroke();

  // Subtitle text
  ctx.fillStyle = isWhiteboard ? '#1e293b' : '#f8fafc';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => {
    ctx.fillText(l, boxX + 26, boxY + 16 + i * 42);
  });

  ctx.restore();
}

interface VoiceAudio {
  ctx: AudioContext;
  buffer: AudioBuffer;
  dest: MediaStreamAudioDestinationNode;
}

/**
 * Fetch the AI voiceover from /api/tts and decode it ahead of recording.
 * Returns null on ANY failure (network error, non-ok response, decode
 * error) — the renderer then proceeds silent; voice must never fail the
 * whole render.
 */
async function prepareVoiceAudio(vo: VoiceoverSpec): Promise<VoiceAudio | null> {
  try {
    const res = await authFetch(
      '/api/tts',
      { text: vo.text, language: vo.language, voice: vo.voice },
      { method: 'POST' }
    );
    if (!res.ok) return null; // route errors are short + human; we just go silent
    const bytes = await res.arrayBuffer();
    const ctx = new AudioContext();
    const buffer = await ctx.decodeAudioData(bytes);
    const dest = ctx.createMediaStreamDestination();
    // autoplay policy can leave the context suspended (which would record
    // silence) — nudge it awake, best effort
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {});
    return { ctx, buffer, dest };
  } catch {
    return null;
  }
}

/**
 * Render the promo video and return a blob URL the caller can play and
 * download. `onProgress` gets 0..1 for a progress bar.
 */
export async function renderPromoVideo(
  spec: VideoSpec,
  onProgress?: (fraction: number) => void
): Promise<RenderResult> {
  // 1. preload every scene image (nulls are fine — gradient scenes).
  //    The owner's own photo (photos[i], a dataURL) wins — zero network.
  //    Any other scene with an imagePrompt fetches an AI still from our own
  //    /api/scene-image route as a dataURL. Every scene resolves
  //    independently and is caught to null, so one bad scene (slow route,
  //    failed fetch) never stalls or fails the whole render.
  const images = await Promise.all(
    spec.scenes.map(async (s, i) => {
      try {
        // 1. Scene's own dedicated visual generated specifically for this scene context
        if (s.imageDataUrl && (s.imageDataUrl.startsWith('data:image') || s.imageDataUrl.startsWith('http') || s.imageDataUrl.startsWith('/'))) {
          return await loadImage(s.imageDataUrl);
        }
        // 2. If the user has photos (uploaded or AI generated), cycle them across scenes
        if (spec.photos && spec.photos.length > 0) {
          const photo = spec.photos[i % spec.photos.length];
          if (photo && (photo.startsWith('data:image') || photo.startsWith('http') || photo.startsWith('/'))) {
            return await loadImage(photo);
          }
        }
        // 3. Fallback to imagePrompt
        if (s.imagePrompt) {
          const dl = await fetchSceneImage(s.imagePrompt);
          if (dl) return await loadImage(dl);
        }
        return null; // → animated gradient scene
      } catch {
        return null;
      }
    })
  );

  // 2. voiceover audio — fetched and decoded BEFORE the recorder starts, so
  //    its duration can pace the scenes and its track can join the stream.
  const voice =
    spec.voiceover && spec.voiceover.text.trim() ? await prepareVoiceAudio(spec.voiceover) : null;

  // 3. recorder setup
  const aspect = spec.aspect ?? '9:16';
  let canvasW = 1080;
  let canvasH = 1920;
  if (aspect === '16:9') {
    canvasW = 1920;
    canvasH = 1080;
  } else if (aspect === '1:1') {
    canvasW = 1080;
    canvasH = 1080;
  }
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');

  const W = canvasW;
  const H = canvasH;

  const canvasStream = canvas.captureStream(30);
  // mix the decoded narration into the recorded stream when available
  const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
  if (voice) tracks.push(...voice.dest.stream.getAudioTracks());
  const stream = new MediaStream(tracks);
  // with audio present, ask for an audio codec (opus) explicitly
  // MP4 (h264+AAC) first: plays in every browser and webview (some builds
  // can record WebM+opus but not play it back), and uploads cleanly to
  // Instagram/WhatsApp. WebM variants remain as fallbacks.
  const mimeCandidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm',
  ];
  const mime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
  if (!mime) throw new Error('This browser cannot record video (WebM unsupported). Try Chrome or Edge.');
  const chunks: Blob[] = [];
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

  const p = paletteOf(spec.paletteId);
  const totalScenes = spec.scenes.length + 1; // + CTA card
  let sps = spec.secondsPerScene ?? 2.6;
  if (voice) {
    // pace the scenes to the narration so the video roughly matches it —
    // floor 2.2s per scene, total capped at 30s
    sps = Math.max(2.2, voice.buffer.duration / totalScenes);
    if (sps * totalScenes > 30) sps = 30 / totalScenes;
  }
  const totalMs = totalScenes * sps * 1000;

  const formatStyle = spec.videoStyle ?? 'motionExplainer';
  const isWhiteboard = formatStyle === 'whiteboard';

  const bgFill = (t: number) => {
    if (isWhiteboard) {
      // Clean bright whiteboard background
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(1, '#f1f5f9');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // Subtle grid dots for whiteboard aesthetic
      ctx.fillStyle = 'rgba(0, 0, 0, 0.035)';
      for (let x = 40; x < W; x += 60) {
        for (let y = 40; y < H; y += 60) {
          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      const g = ctx.createLinearGradient(0, 0, W, H);
      const k = 0.5 + 0.5 * Math.sin(t * 0.7);
      g.addColorStop(0, p.bg1);
      g.addColorStop(1, p.bg2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      // soft moving glow keeps gradient scenes alive
      const glow = ctx.createRadialGradient(W * (0.3 + 0.4 * k), H * 0.3, 40, W * 0.5, H * 0.45, H * 0.6);
      glow.addColorStop(0, `${p.accent}26`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    }
  };

  // 4. animate + record
  const done = new Promise<Blob>((resolve, reject) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: mime }));
    rec.onerror = () => reject(new Error('Recording failed — please try again.'));
    if (voice) {
      try {
        // narration starts at the same moment recording starts
        const src = voice.ctx.createBufferSource();
        src.buffer = voice.buffer;
        src.connect(voice.dest); // → the recorded audio track
        // also let the owner hear it live while rendering
        const monitor = voice.ctx.createGain();
        monitor.gain.value = 0.9;
        src.connect(monitor);
        monitor.connect(voice.ctx.destination);
        src.start();
      } catch {
        // voice setup failed — continue silent rather than fail the render
      }
    }
    rec.start(250);

    const start = performance.now();
    const transType = spec.transition ?? 'crossfade';
    const transFrac = 0.16; // ~0.4s smooth transition window at scene boundary

    const drawSceneLayer = (sceneIdx: number, localProgress: number, timeVal: number) => {
      if (sceneIdx < spec.scenes.length) {
        const img = images[sceneIdx];
        const scene = spec.scenes[sceneIdx];
        const displayFont = getFontForStyle(spec.fontStyle, spec.category);
        const badgeText = getPromoBadgeText(sceneIdx, spec.scenes.length, spec.category);

        if (formatStyle === 'motionExplainer' || formatStyle === 'whiteboard') {
          // ── Motion / Whiteboard Explainer ──
          // 1. Top Chapter progress bar
          drawChapterBars(ctx, sceneIdx, localProgress, totalScenes, W, p.accent, isWhiteboard);

          // 2. Top Chapter Tag Pill & Branded Header
          ctx.save();
          ctx.font = `700 22px ${SANS}`;
          const chapterText = `SCENE ${sceneIdx + 1} OF ${spec.scenes.length}`;
          const pillW = ctx.measureText(chapterText).width + 50;
          const pillX = (W - pillW) / 2;
          ctx.fillStyle = isWhiteboard ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)';
          ctx.strokeStyle = isWhiteboard ? 'rgba(0,0,0,0.14)' : `${p.accent}88`;
          ctx.lineWidth = 1.5;
          drawRoundRect(ctx, pillX, 72, pillW, 36, 18);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = p.accent;
          ctx.beginPath();
          ctx.arc(pillX + 18, 90, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = isWhiteboard ? '#1e293b' : '#ffffff';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(chapterText, pillX + 30, 90);
          ctx.restore();

          // 3. Central Framed Showcase Card (images stay complete without getting cropped)
          drawShowcaseCard(ctx, img, W, H, p, localProgress, isWhiteboard);

          // 4. Atmospheric particle embers for rich cinematic depth
          if (!isWhiteboard) {
            drawAtmosphericParticles(ctx, W, H, p.accent);
          }

          // 5. Kinetic Typography (Scene Title & High-Contrast Promo Card)
          const titleBoxY = H > 1400 ? H * 0.58 : H * 0.60;
          const slide = (1 - Math.min(1, localProgress * 2.2)) * 35;
          const titleAlpha = Math.min(1, localProgress * 2.2);
          ctx.save();
          ctx.globalAlpha = titleAlpha;

          // 5a. Promo Badge Pill
          ctx.font = `800 22px ${displayFont}`;
          const badgeW = ctx.measureText(badgeText).width + 36;
          drawRoundRect(ctx, 60, titleBoxY + slide - 38, badgeW, 36, 18);
          ctx.fillStyle = isWhiteboard ? 'rgba(0,0,0,0.06)' : `${p.accent}25`;
          ctx.fill();
          ctx.strokeStyle = p.accent;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = p.accent;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, 60 + badgeW / 2, titleBoxY + slide - 20);
          ctx.textAlign = 'left';

          // 5b. High-impact Headline Card Background
          let size = 68;
          ctx.font = `900 ${size}px ${displayFont}`;
          while (ctx.measureText(scene.title).width > W - 180 && size > 36) {
            size -= 4;
            ctx.font = `900 ${size}px ${displayFont}`;
          }
          const tLines = wrap(ctx, scene.title, W - 180, 2);
          const boxH = tLines.length * (size * 1.15) + 36;
          drawRoundRect(ctx, 60, titleBoxY + slide + 6, W - 120, boxH, 24);
          ctx.fillStyle = isWhiteboard ? 'rgba(255, 255, 255, 0.95)' : 'rgba(11, 15, 25, 0.88)';
          ctx.fill();
          ctx.strokeStyle = isWhiteboard ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.16)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // 5c. Crisp Headline Text with Shadow
          ctx.textBaseline = 'top';
          ctx.fillStyle = isWhiteboard ? '#0f172a' : '#ffffff';
          tLines.forEach((l, i) => {
            ctx.fillText(l, 86, titleBoxY + slide + 24 + i * (size * 1.15));
          });
          ctx.restore();

          // 6. Voiceover Subtitle Capsule
          if (scene.subtitle) {
            drawSubtitleCapsule(ctx, scene.subtitle, W, H, localProgress, isWhiteboard);
          }
        } else {
          // ── Cinematic Full-Bleed Reel ──
          if (img) {
            const zoom = 1.05 + 0.12 * localProgress;
            const dy = -30 * localProgress;
            drawCover(ctx, img, 1, zoom, dy);
          } else {
            ctx.save();
            ctx.globalAlpha = 0.12;
            ctx.fillStyle = p.accent;
            ctx.beginPath();
            ctx.arc(W / 2, H * 0.42, 300 + 60 * Math.sin(timeVal / 600), 0, 7);
            ctx.fill();
            ctx.restore();
          }
          drawSceneText(ctx, p, scene.title, scene.subtitle, localProgress, displayFont, badgeText);
        }
      } else {
        // ── final CTA Outro Card ──
        if (formatStyle === 'motionExplainer' || formatStyle === 'whiteboard') {
          drawChapterBars(ctx, totalScenes - 1, 1, totalScenes, W, p.accent, isWhiteboard);
        }

        ctx.save();
        ctx.globalAlpha = Math.min(1, localProgress * 2);

        // Outro Card Container
        const cardMargin = 80;
        const cardW = W - cardMargin * 2;
        const cardH = 680;
        const cardX = cardMargin;
        const cardY = (H - cardH) / 2;

        ctx.fillStyle = isWhiteboard ? '#ffffff' : 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = isWhiteboard ? 'rgba(0,0,0,0.12)' : `${p.accent}55`;
        ctx.lineWidth = 2;
        drawRoundRect(ctx, cardX, cardY, cardW, cardH, 36);
        ctx.fill();
        ctx.stroke();

        // Badge
        ctx.fillStyle = `${p.accent}22`;
        ctx.strokeStyle = p.accent;
        ctx.lineWidth = 1.5;
        drawRoundRect(ctx, W / 2 - 150, cardY + 60, 300, 40, 20);
        ctx.fill();
        ctx.stroke();
        ctx.font = `700 20px ${SANS}`;
        ctx.fillStyle = p.accent;
        ctx.textAlign = 'center';
        ctx.fillText('SPECIAL OFFER', W / 2, cardY + 86);

        // CTA Title
        let size = 96;
        ctx.font = `900 ${size}px ${DISPLAY}`;
        const cta = spec.cta.toUpperCase();
        while (ctx.measureText(cta).width > cardW - 80 && size > 44) {
          size -= 4;
          ctx.font = `900 ${size}px ${DISPLAY}`;
        }
        ctx.fillStyle = isWhiteboard ? '#0f172a' : '#ffffff';
        ctx.fillText(cta, W / 2, cardY + 220);

        // Business Name
        ctx.font = `700 48px ${SANS}`;
        ctx.fillStyle = p.accent;
        ctx.fillText(spec.businessName.toUpperCase(), W / 2, cardY + 310);

        // Action Pill
        ctx.fillStyle = p.accent;
        drawRoundRect(ctx, W / 2 - 180, cardY + 390, 360, 76, 38);
        ctx.fill();
        ctx.font = `800 28px ${SANS}`;
        ctx.fillStyle = '#000000';
        ctx.fillText('ENQUIRE NOW →', W / 2, cardY + 438);

        // Watermark
        ctx.font = `400 26px ${SANS}`;
        ctx.fillStyle = isWhiteboard ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.6)';
        ctx.fillText('powered by GrowMitra', W / 2, cardY + 540);
        ctx.restore();
      }
    };

    const frame = () => {
      const t = performance.now() - start;
      onProgress?.(Math.min(1, t / totalMs));
      const idx = Math.min(Math.floor(t / (sps * 1000)), totalScenes - 1);
      const local = (t - idx * sps * 1000) / (sps * 1000); // 0..1 within scene

      bgFill(t / 1000);

      // Smooth transition handling between scenes
      if (idx > 0 && local < transFrac) {
        const rawP = local / transFrac;
        // Smooth cubic ease-in-out
        const ease = rawP * rawP * (3 - 2 * rawP);

        if (transType === 'slide') {
          // Dynamic slide: previous slides left, current slides in from right
          ctx.save();
          ctx.translate(-W * ease, 0);
          drawSceneLayer(idx - 1, 1, t);
          ctx.restore();

          ctx.save();
          ctx.translate(W * (1 - ease), 0);
          drawSceneLayer(idx, local, t);
          ctx.restore();
        } else if (transType === 'zoom') {
          // Zoom dissolve: previous scales up and fades, current dissolves in
          ctx.save();
          ctx.globalAlpha = 1 - ease;
          ctx.translate(W / 2, H / 2);
          ctx.scale(1 + 0.25 * ease, 1 + 0.25 * ease);
          ctx.translate(-W / 2, -H / 2);
          drawSceneLayer(idx - 1, 1, t);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = ease;
          drawSceneLayer(idx, local, t);
          ctx.restore();
        } else if (transType === 'fadeBlack') {
          // Fade through black
          if (ease < 0.5) {
            ctx.save();
            ctx.globalAlpha = 1 - ease * 2;
            drawSceneLayer(idx - 1, 1, t);
            ctx.restore();
          } else {
            ctx.save();
            ctx.globalAlpha = (ease - 0.5) * 2;
            drawSceneLayer(idx, local, t);
            ctx.restore();
          }
        } else {
          // Default: Smooth Crossfade
          ctx.save();
          drawSceneLayer(idx - 1, 1, t);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = ease;
          drawSceneLayer(idx, local, t);
          ctx.restore();
        }
      } else {
        // Direct scene playback
        drawSceneLayer(idx, local, t);
      }

      if (t < totalMs) {
        requestAnimationFrame(frame);
      } else {
        // hold the last frame briefly, then stop
        setTimeout(() => rec.stop(), 300);
      }
    };
    requestAnimationFrame(frame);
  });

  let blob: Blob;
  try {
    blob = await done;
  } finally {
    // release the AudioContext whether recording succeeded or not
    if (voice) void voice.ctx.close().catch(() => {});
  }
  return {
    url: URL.createObjectURL(blob),
    mimeType: mime,
    durationSec: Math.round(totalMs / 100) / 10,
    width: W,
    height: H,
  };
}

export function downloadVideo(url: string, businessName: string, mimeType?: string) {
  const ext = mimeType?.includes('mp4') ? 'mp4' : 'webm';
  const a = document.createElement('a');
  a.href = url;
  a.download = `${businessName.replace(/\s+/g, '_')}_promo.${ext}`;
  a.click();
}
