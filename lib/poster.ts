/**
 * GrowMitra poster engine — renders Instagram-ready 1:1 / 4:5 / 9:16
 * posters on a canvas, no external image API required. All randomness is
 * seeded from the headline so the preview is pixel-identical to the
 * downloaded file.
 *
 * Palettes are named (not free hexes) so the AI picks an art-directed
 * combination instead of inventing colors that clash.
 */

export const POSTER_FONTS = {
  display: '"Playfair Display", Georgia, serif',
  sans: '"Poppins", "Segoe UI", sans-serif',
  indic: '"Noto Sans Devanagari", "Noto Sans Telugu", "Noto Sans Tamil", "Noto Sans Kannada", "Nirmala UI", sans-serif',
};

export interface Palette {
  id: string;
  name: string;
  light: boolean;
  bg1: string;
  bg2: string;
  ink: string;
  sub: string;
  accent: string;
  accent2: string;
  chipInk: string;
}

export const PALETTES: Palette[] = [
  { id: 'diwaliMaroon', name: 'Diwali Maroon & Gold', light: false, bg1: '#2b0a0a', bg2: '#120303', ink: '#ffe9c2', sub: '#d9b98a', accent: '#f5c04a', accent2: '#ff8b3d', chipInk: '#2b0a0a' },
  { id: 'royalGold',    name: 'Royal Ink & Gold',     light: false, bg1: '#141414', bg2: '#000000', ink: '#f7f0dd', sub: '#cbb98a', accent: '#d4af37', accent2: '#f1dd8f', chipInk: '#141414' },
  { id: 'royalCream',   name: 'Royal Cream & Zari',   light: true,  bg1: '#f7efe0', bg2: '#eadfc8', ink: '#241a10', sub: '#6b5a41', accent: '#a8842c', accent2: '#c9a227', chipInk: '#241a10' },
  { id: 'festiveYellow',name: 'Marigold Bright',      light: false, bg1: '#4a3005', bg2: '#1c1203', ink: '#fff6d8', sub: '#e8cf8e', accent: '#ffc821', accent2: '#ff7a00', chipInk: '#4a3005' },
  { id: 'festiveRed',   name: 'Festive Red & Gold',   light: false, bg1: '#4a0e0e', bg2: '#1f0505', ink: '#fff8f0', sub: '#f0c9c9', accent: '#ffd700', accent2: '#ff6b6b', chipInk: '#4a0e0e' },
  { id: 'templeSaffron',name: 'Temple Saffron',       light: true,  bg1: '#fff4e2', bg2: '#ffe4bd', ink: '#4a2408', sub: '#8a5a2b', accent: '#e0731d', accent2: '#b45309', chipInk: '#4a2408' },
  { id: 'eidGreen',     name: 'Eid Emerald & Silver', light: false, bg1: '#06281f', bg2: '#02120d', ink: '#eafff5', sub: '#a9d8c4', accent: '#b9f2d8', accent2: '#8fd3b8', chipInk: '#06281f' },
  { id: 'pongalGreen',  name: 'Harvest Green & Gold', light: false, bg1: '#1d3b12', bg2: '#0a1a06', ink: '#fdf6d8', sub: '#c9c08e', accent: '#e8b93e', accent2: '#f76b15', chipInk: '#1d3b12' },
  { id: 'boutiqueRose', name: 'Boutique Blush',       light: true,  bg1: '#fdeef2', bg2: '#f3d9e0', ink: '#3d1220', sub: '#8a5566', accent: '#c26d84', accent2: '#a34d66', chipInk: '#3d1220' },
  { id: 'bakeryWarm',   name: 'Bakery Warm Cream',    light: true,  bg1: '#fdf3e3', bg2: '#f3ddc0', ink: '#3a2314', sub: '#7a5c3e', accent: '#c4703a', accent2: '#a3542a', chipInk: '#3a2314' },
  { id: 'kitchenSpice', name: 'Cloud Kitchen Spice',  light: false, bg1: '#2a0f0a', bg2: '#120604', ink: '#fff1e4', sub: '#e0b598', accent: '#ff6b35', accent2: '#ffc14d', chipInk: '#2a0f0a' },
  { id: 'tealLuxe',     name: 'Teal Luxe',            light: false, bg1: '#042f2b', bg2: '#01100e', ink: '#ecfffb', sub: '#a7e8df', accent: '#2dd4bf', accent2: '#fbbf24', chipInk: '#01201c' },
  { id: 'midnightNavy', name: 'Midnight Party Navy',  light: false, bg1: '#0b1030', bg2: '#030517', ink: '#eef1ff', sub: '#a8b0e0', accent: '#8b9cff', accent2: '#ffd166', chipInk: '#0b1030' },
  { id: 'garbaFuchsia', name: 'Navratri Fuchsia',     light: false, bg1: '#3d0a38', bg2: '#160418', ink: '#ffeaf9', sub: '#dda3cd', accent: '#ff5ecb', accent2: '#ffd166', chipInk: '#3d0a38' },
  { id: 'peacockTeal',  name: 'Peacock Teal & Gold',  light: false, bg1: '#06283d', bg2: '#02101c', ink: '#e8f6ff', sub: '#9fc4dd', accent: '#3fb6a8', accent2: '#ffd166', chipInk: '#06283d' },
  { id: 'holiSplash',   name: 'Holi Splash',          light: true,  bg1: '#fdf2ff', bg2: '#eef0ff', ink: '#2c1a4d', sub: '#6f5a9e', accent: '#8b5cf6', accent2: '#ec4899', chipInk: '#2c1a4d' },
  { id: 'christmasPlum',name: 'Christmas Plum',       light: false, bg1: '#2c0f2c', bg2: '#120412', ink: '#f4ffe9', sub: '#c9d8b8', accent: '#e11d48', accent2: '#4ade80', chipInk: '#2c0f2c' },
  { id: 'tricolor',     name: 'Tricolour Spirit',     light: false, bg1: '#0a2c52', bg2: '#04121f', ink: '#f4f9ff', sub: '#a9c3e0', accent: '#ff9933', accent2: '#138808', chipInk: '#0a2c52' },
  { id: 'monoEditorial',name: 'Mono Editorial',       light: true,  bg1: '#ffffff', bg2: '#ececec', ink: '#0a0a0a', sub: '#5c5c5c', accent: '#e11d2e', accent2: '#0a0a0a', chipInk: '#ffffff' },
  { id: 'midnightIndigo', name: 'Midnight Indigo & Cyan', light: false, bg1: '#070b1e', bg2: '#02040d', ink: '#e0e7ff', sub: '#a5b4fc', accent: '#06b6d4', accent2: '#6366f1', chipInk: '#070b1e' },
  { id: 'champagneSilk',  name: 'Champagne & Gold Silk',  light: true,  bg1: '#fcf8f0', bg2: '#f3ebd9', ink: '#292218', sub: '#786851', accent: '#c59b27', accent2: '#dfb74a', chipInk: '#292218' },
  { id: 'emeraldVelvet',  name: 'Royal Emerald Velvet',   light: false, bg1: '#05231a', bg2: '#01100b', ink: '#e6fcf5', sub: '#99e6cb', accent: '#10b981', accent2: '#34d399', chipInk: '#05231a' },
  { id: 'sunsetTerracotta', name: 'Sunset Terracotta',    light: false, bg1: '#3d1c14', bg2: '#1b0905', ink: '#fef3ee', sub: '#e5b29f', accent: '#f97316', accent2: '#fb923c', chipInk: '#3d1c14' },
  { id: 'minimalSlate',   name: 'Minimalist Dark Slate',  light: false, bg1: '#18181b', bg2: '#09090b', ink: '#fafafa', sub: '#a1a1aa', accent: '#38bdf8', accent2: '#818cf8', chipInk: '#18181b' },
  { id: 'coffeeMocha',    name: 'Artisan Espresso Mocha', light: true,  bg1: '#f8f4f0', bg2: '#ebdcd0', ink: '#362319', sub: '#6f5041', accent: '#854d0e', accent2: '#b45309', chipInk: '#362319' },
  { id: 'royalAmethyst',  name: 'Regal Amethyst & Gold',  light: false, bg1: '#260a2f', bg2: '#100215', ink: '#fbeeff', sub: '#dcb1e8', accent: '#c084fc', accent2: '#eab308', chipInk: '#260a2f' },
  { id: 'electricCyber',  name: 'Electric Obsidian Lime', light: false, bg1: '#0c0f12', bg2: '#000000', ink: '#f4f4f5', sub: '#a1a1aa', accent: '#84cc16', accent2: '#22c55e', chipInk: '#0c0f12' },
  { id: 'pastelSage',     name: 'Pastel Sage & Ivory',    light: true,  bg1: '#f2f7f4', bg2: '#deede4', ink: '#1c2e24', sub: '#516f60', accent: '#059669', accent2: '#10b981', chipInk: '#1c2e24' },
  { id: 'coralBloom',     name: 'Coral Bloom Chic',       light: true,  bg1: '#fff2f2', bg2: '#ffe0e0', ink: '#3b1818', sub: '#824848', accent: '#f43f5e', accent2: '#fb7185', chipInk: '#3b1818' },
  { id: 'sapphireBlue',   name: 'Sapphire & Silver Luxe', light: false, bg1: '#081d3d', bg2: '#020917', ink: '#f0f7ff', sub: '#a4cafe', accent: '#3b82f6', accent2: '#93c5fd', chipInk: '#081d3d' },
];

/** Dynamically generate a balanced Palette from ANY user-selected hex color */
export function createCustomPalette(hex: string): Palette {
  const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
  const r = parseInt(cleanHex.slice(1, 3), 16) || 120;
  const g = parseInt(cleanHex.slice(3, 5), 16) || 80;
  const b = parseInt(cleanHex.slice(5, 7), 16) || 200;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isLight = luminance > 0.6;

  if (isLight) {
    return {
      id: `custom_${cleanHex.slice(1)}`,
      name: `Custom (${cleanHex})`,
      light: true,
      bg1: '#ffffff',
      bg2: `${cleanHex}1f`,
      ink: '#111827',
      sub: '#4b5563',
      accent: cleanHex,
      accent2: '#2563eb',
      chipInk: '#ffffff',
    };
  }

  const darkBg1 = `rgb(${Math.max(8, Math.round(r * 0.14))}, ${Math.max(8, Math.round(g * 0.14))}, ${Math.max(12, Math.round(b * 0.14))})`;
  const darkBg2 = '#05070a';

  return {
    id: `custom_${cleanHex.slice(1)}`,
    name: `Custom (${cleanHex})`,
    light: false,
    bg1: darkBg1,
    bg2: darkBg2,
    ink: '#f9fafb',
    sub: '#d1d5db',
    accent: cleanHex,
    accent2: '#f59e0b',
    chipInk: darkBg1,
  };
}

export const POSTER_LAYOUTS = ['festival', 'editorial', 'modern', 'offer', 'rangoli'] as const;
export type PosterLayout = (typeof POSTER_LAYOUTS)[number];

export const POSTER_FORMATS = {
  '1:1': { w: 1080, h: 1080, label: 'Feed 1:1' },
  '4:5': { w: 1080, h: 1350, label: 'Feed 4:5' },
  '9:16': { w: 1080, h: 1920, label: 'Story 9:16' },
} as const;
export type PosterFormat = keyof typeof POSTER_FORMATS;

export interface PosterSpec {
  format: PosterFormat;
  layout: PosterLayout;
  paletteId: string;
  kicker: string;      // small label chip, e.g. "Diwali Dhamaka"
  headline: string;    // display serif headline
  sub: string;         // supporting line — often Indic script
  offer: string;       // CTA pill, e.g. "Flat 20% Off" ('' = none)
  brand: string;
  city?: string;
  photo?: string | null; // dataURL / URL of product photo
}

const M = 72;

function palette(id: string): Palette {
  if (id.startsWith('custom_')) {
    const hex = `#${id.slice(7)}`;
    return createCustomPalette(hex);
  }
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

/** Deterministic PRNG so preview === download. */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let s = h >>> 0;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number): string[] {
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
  return lines.length ? lines : [text];
}

function fitHeadline(ctx: CanvasRenderingContext2D, text: string, maxW: number, startSize: number) {
  let size = startSize;
  for (; size > 42; size -= 4) {
    ctx.font = `900 ${size}px ${POSTER_FONTS.display}`;
    const lines = wrapLines(ctx, text, maxW, 3);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest <= maxW && lines.length <= 3) return { size, lines };
  }
  ctx.font = `900 ${size}px ${POSTER_FONTS.display}`;
  return { size, lines: wrapLines(ctx, text, maxW, 3) };
}

function chip(
  ctx: CanvasRenderingContext2D, text: string, x: number, y: number, p: Palette,
  opts: { size?: number; padX?: number; h?: number; maxW?: number } = {}
) {
  if (!text) return;
  const size = opts.size ?? 30;
  const padX = opts.padX ?? 30;
  const h = opts.h ?? 66;
  const label = text.toUpperCase();
  ctx.font = `700 ${size}px ${POSTER_FONTS.sans}`;
  const maxW = opts.maxW ?? 1080 - M * 2;
  const w = Math.min(ctx.measureText(label).width + padX * 2, maxW);
  ctx.save();
  rr(ctx, x, y, w, h, h / 2);
  if (p.light) {
    ctx.fillStyle = p.accent;
    ctx.fill();
    ctx.fillStyle = p.chipInk;
  } else {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, p.accent);
    g.addColorStop(1, p.accent2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = p.chipInk;
  }
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${size}px ${POSTER_FONTS.sans}`;
  ctx.fillText(label, x + padX, y + h / 2 + 2, w - padX * 2);
  ctx.restore();
}

// ── motifs ──────────────────────────────────────────────────────────

function toran(ctx: CanvasRenderingContext2D, p: Palette, W: number) {
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const x = (W / steps) * i;
    const sag = Math.sin((i / steps) * Math.PI) * 34;
    const y = M * 0.55 + sag;
    if (i < steps) {
      ctx.strokeStyle = p.accent;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + W / (steps * 2), y + 22, x + W / steps, M * 0.55 + Math.sin(((i + 1) / steps) * Math.PI) * 34);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const r = i % 2 ? 15 : 11;
    const g = ctx.createRadialGradient(x - 3, y + 7, 2, x, y + 10, r);
    g.addColorStop(0, p.accent2);
    g.addColorStop(1, p.accent);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y + 10, r, 0, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath();
    ctx.arc(x, y + 10, r * 0.35, 0, 7);
    ctx.fill();
    if (i % 2 === 0) {
      ctx.fillStyle = p.light ? '#4a7c2f' : '#7fb069';
      ctx.beginPath();
      ctx.ellipse(x + 13, y + 18, 9, 4, -0.5, 0, 7);
      ctx.fill();
    }
  }
}

function diyaRow(ctx: CanvasRenderingContext2D, cx: number, y: number, n: number, p: Palette) {
  for (let i = 0; i < n; i++) {
    const x = cx + (i - (n - 1) / 2) * 150;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1.15, 1.15);
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.moveTo(-40, 0);
    ctx.quadraticCurveTo(0, 30, 40, 0);
    ctx.quadraticCurveTo(0, 12, -40, 0);
    ctx.closePath();
    ctx.fill();
    const fg = ctx.createLinearGradient(0, -36, 0, 4);
    fg.addColorStop(0, '#fff6d8');
    fg.addColorStop(0.55, '#ffb347');
    fg.addColorStop(1, '#ff5e13');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(0, -32);
    ctx.quadraticCurveTo(10, -12, 0, 2);
    ctx.quadraticCurveTo(-10, -12, 0, -32);
    ctx.fill();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#ffb347';
    ctx.beginPath();
    ctx.arc(0, -14, 30, 0, 7);
    ctx.fill();
    ctx.restore();
  }
}

function rangoliCorner(ctx: CanvasRenderingContext2D, p: Palette, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = p.accent;
  ctx.fillStyle = p.accent;
  for (let ring = 0; ring < 4; ring++) {
    const r = 34 + ring * 26;
    ctx.globalAlpha = 0.75 - ring * 0.12;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, ring % 2 ? Math.PI * 0.06 : Math.PI * 0.12, ring % 2 ? Math.PI * 0.44 : Math.PI * 0.38);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * (0.14 + i * 0.18);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 130, Math.sin(a) * 130, 5, 0, 7);
    ctx.fill();
  }
  ctx.restore();
}

function softBlobs(ctx: CanvasRenderingContext2D, p: Palette, rand: () => number, W: number, H: number) {
  for (let i = 0; i < 6; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = 90 + rand() * 160;
    const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
    g.addColorStop(0, p.accent);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalAlpha = p.light ? 0.1 : 0.13;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.fill();
    ctx.restore();
  }
}

function bokeh(ctx: CanvasRenderingContext2D, p: Palette, rand: () => number, W: number, H: number, n = 60) {
  for (let i = 0; i < n; i++) {
    const x = rand() * W;
    const y = rand() * H;
    const r = rand() * 2.2 + 0.6;
    ctx.save();
    ctx.globalAlpha = rand() * 0.4 + 0.12;
    ctx.fillStyle = i % 4 ? p.accent2 : p.accent;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 7);
    ctx.fill();
    ctx.restore();
  }
}

/** Ornamental brand monogram panel — used when a poster has no product photo. */
function monogramPanel(
  ctx: CanvasRenderingContext2D, initial: string,
  x: number, y: number, w: number, h: number, p: Palette
) {
  ctx.save();
  rr(ctx, x, y, w, h, 26);
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, p.accent);
  g.addColorStop(1, p.light ? p.bg2 : p.bg1);
  ctx.globalAlpha = p.light ? 0.16 : 0.32;
  ctx.fillStyle = g;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 2.5;
  ctx.globalAlpha = 0.7;
  rr(ctx, x + 14, y + 14, w - 28, h - 28, 18);
  ctx.stroke();
  // dotted ring
  ctx.globalAlpha = 0.55;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(x + w / 2 + Math.cos(a) * Math.min(w, h) * 0.3, y + h / 2 + Math.sin(a) * Math.min(w, h) * 0.3, 2.2, 0, 7);
    ctx.fill();
  }
  // the initial itself
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = p.accent;
  ctx.font = `900 ${Math.round(Math.min(w, h) * 0.34)}px ${POSTER_FONTS.display}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText((initial || 'G').toUpperCase(), x + w / 2, y + h / 2);
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/** Horizontal ornament divider — diyas or a dotted paisley line. */
function ornamentDivider(ctx: CanvasRenderingContext2D, p: Palette, cx: number, y: number, W: number) {
  ctx.save();
  ctx.strokeStyle = p.accent;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - W * 0.18, y);
  ctx.lineTo(cx - 90, y);
  ctx.moveTo(cx + 90, y);
  ctx.lineTo(cx + W * 0.18, y);
  ctx.stroke();
  ctx.globalAlpha = 0.9;
  for (const dx of [-W * 0.18 - 10, W * 0.18 + 10]) {
    ctx.beginPath();
    ctx.arc(cx + dx, y, 4, 0, 7);
    ctx.fillStyle = p.accent;
    ctx.fill();
  }
  ctx.restore();
  diyaRow(ctx, cx, y, 3, p);
}

function framePhoto(
  ctx: CanvasRenderingContext2D, img: HTMLImageElement | null,
  x: number, y: number, w: number, h: number, p: Palette, mono: string
) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.22)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  rr(ctx, x, y, w, h, 24);
  ctx.fillStyle = p.light ? '#ffffff' : 'rgba(255,255,255,.08)';
  ctx.fill();
  ctx.restore();

  ctx.save();
  rr(ctx, x, y, w, h, 24);
  ctx.clip();
  if (img) {
    // Fill backing card
    ctx.fillStyle = p.light ? '#ffffff' : '#1c1c24';
    ctx.fillRect(x, y, w, h);

    // Smart contain/cover:
    // If the image has extreme aspect ratio (like wide banner/logo or tall portrait),
    // contain it with padding so logos and products are never cropped off.
    const pad = 12;
    const availW = w - pad * 2;
    const availH = h - pad * 2;
    const imgRatio = img.width / img.height;
    const boxRatio = availW / availH;

    let drawW: number;
    let drawH: number;

    // Use contain mode so entire product or logo stays 100% visible
    if (imgRatio > boxRatio) {
      drawW = availW;
      drawH = availW / imgRatio;
    } else {
      drawH = availH;
      drawW = availH * imgRatio;
    }

    const drawX = x + (w - drawW) / 2;
    const drawY = y + (h - drawH) / 2;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  } else {
    monogramPanel(ctx, mono, x, y, w, h, p);
  }
  ctx.restore();

  // Subtle border around photo container
  ctx.save();
  ctx.strokeStyle = p.light ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.5;
  rr(ctx, x, y, w, h, 24);
  ctx.stroke();
  ctx.restore();
}

function footer(ctx: CanvasRenderingContext2D, p: Palette, brand: string, city: string | undefined, W: number, H: number) {
  const fy = H - M - 48;
  ctx.save();
  ctx.strokeStyle = p.accent;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(M, fy);
  ctx.lineTo(W - M, fy);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.font = `700 28px ${POSTER_FONTS.sans}`;
  ctx.fillStyle = p.ink;
  ctx.textBaseline = 'middle';
  const brandY = fy + 28;
  const maxBrandW = W - M * 2 - 220;
  ctx.fillText(brand, M, brandY, maxBrandW);
  const bw = Math.min(ctx.measureText(brand).width, maxBrandW);

  if (city) {
    ctx.font = `500 22px ${POSTER_FONTS.sans}`;
    ctx.fillStyle = p.sub;
    ctx.fillText('· ' + city, M + bw + 12, brandY);
  }

  ctx.textAlign = 'right';
  ctx.font = `700 22px ${POSTER_FONTS.sans}`;
  ctx.fillStyle = p.accent;
  ctx.fillText('GrowMitra', W - M, brandY);
  ctx.restore();
}

function loadImage(src: string, timeoutMs = 20_000): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => { img.src = ''; res(null); }, timeoutMs);
    img.onload = () => { clearTimeout(timer); res(img); };
    img.onerror = () => {
      if (img.crossOrigin) {
        img.crossOrigin = null as unknown as string;
        img.src = src;
      } else {
        clearTimeout(timer);
        res(null);
      }
    };
    img.src = src;
  });
}

function bg(ctx: CanvasRenderingContext2D, p: Palette, W: number, H: number, radial: boolean) {
  const g = radial
    ? ctx.createRadialGradient(W * 0.5, H * 0.32, 60, W * 0.5, H * 0.55, H * 0.9)
    : ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, p.bg1);
  g.addColorStop(1, p.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/**
 * Render a poster onto a canvas. Await `document.fonts.ready` once on the
 * page before calling so Playfair/Poppins/Noto are live for canvas.
 */
export async function renderPoster(canvas: HTMLCanvasElement, spec: PosterSpec): Promise<void> {
  const { w: W, h: H } = POSTER_FORMATS[spec.format] ?? POSTER_FORMATS['1:1'];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const p = palette(spec.paletteId);
  const rand = seeded(spec.headline + spec.kicker + spec.brand);

  const img = spec.photo ? await loadImage(spec.photo) : null;
  ctx.clearRect(0, 0, W, H);
  bg(ctx, p, W, H, spec.layout === 'festival' || spec.layout === 'rangoli');

  if (spec.layout === 'festival') {
    toran(ctx, p, W);
    const hasImg = !!img;
    const photoW = 380;
    const photoH = Math.min(H * 0.44, 470);
    const photoX = W - M - photoW;
    const photoY = spec.format === '9:16' ? 300 : 236;
    const textW = hasImg ? photoX - M - 44 : W - M * 2;

    chip(ctx, spec.kicker, M, M + 62, p, { maxW: textW });
    const { size, lines } = fitHeadline(ctx, spec.headline, textW, hasImg ? 96 : 104);
    ctx.font = `900 ${size}px ${POSTER_FONTS.display}`;
    ctx.fillStyle = p.ink;
    ctx.textBaseline = 'top';
    const headY = photoY + 8;
    lines.forEach((l, i) => ctx.fillText(l, M, headY + i * (size * 1.12), textW));
    ctx.fillStyle = p.accent;
    rr(ctx, M, headY + lines.length * (size * 1.12) + 12, 130, 7, 4);
    ctx.fill();

    const subY = headY + lines.length * (size * 1.12) + 52;
    ctx.font = `600 42px ${POSTER_FONTS.indic}`;
    ctx.fillStyle = p.sub;
    const subLines = wrapLines(ctx, spec.sub, textW, 3);
    subLines.forEach((l, i) => ctx.fillText(l, M, subY + i * 62, textW));

    if (hasImg) {
      framePhoto(ctx, img, photoX, photoY, photoW, photoH, p, spec.brand.charAt(0));
      if (spec.offer) {
        const offerY = Math.min(subY + subLines.length * 62 + 24, H - M - 170);
        chip(ctx, spec.offer, M, offerY, p, { size: 32, padX: 34, h: 72, maxW: textW });
      }
      diyaRow(ctx, W / 2, H - M - 120, 3, p);
    } else {
      // full-width typographic poster — ornament instead of an empty photo box
      const oy = Math.min(subY + subLines.length * 62 + 90, H - M - 210);
      ornamentDivider(ctx, p, W / 2, oy, W);
      if (spec.offer) {
        ctx.font = '700 34px ' + POSTER_FONTS.sans;
        const cw = Math.min(ctx.measureText(spec.offer.toUpperCase()).width + 80, W - M * 2);
        chip(ctx, spec.offer, (W - cw) / 2, Math.min(oy + 60, H - M - 150), p, { size: 34, padX: 40, h: 80, maxW: cw });
      }
    }
  }

  if (spec.layout === 'modern') {
    softBlobs(ctx, p, rand, W, H);
    bokeh(ctx, p, rand, W, H, 55);
    const hasImg = !!img;
    const photoW = 390;
    const photoH = Math.min(H * 0.42, 440);
    const photoX = W - M - photoW;
    const photoY = spec.format === '9:16' ? 320 : 230;
    const textW = hasImg ? photoX - M - 44 : W - M * 2;

    chip(ctx, spec.kicker, M, M + 10, p, { maxW: textW });
    const { size, lines } = fitHeadline(ctx, spec.headline, textW, hasImg ? 92 : 102);
    ctx.font = `900 ${size}px ${POSTER_FONTS.display}`;
    ctx.fillStyle = p.ink;
    ctx.textBaseline = 'top';
    const headY = photoY + 10;
    lines.forEach((l, i) => ctx.fillText(l, M, headY + i * (size * 1.12), textW));
    ctx.fillStyle = p.accent;
    rr(ctx, M, headY + lines.length * (size * 1.12) + 12, 130, 7, 4);
    ctx.fill();

    const subY = headY + lines.length * (size * 1.12) + 52;
    ctx.font = `600 40px ${POSTER_FONTS.indic}`;
    ctx.fillStyle = p.sub;
    const subLines = wrapLines(ctx, spec.sub, textW, 3);
    subLines.forEach((l, i) => ctx.fillText(l, M, subY + i * 58, textW));

    if (hasImg) {
      framePhoto(ctx, img, photoX, photoY, photoW, photoH, p, spec.brand.charAt(0));
      if (spec.offer) {
        const offerY = Math.min(subY + subLines.length * 58 + 30, H - M - 140);
        chip(ctx, spec.offer, M, offerY, p, { size: 32, padX: 36, h: 72 });
      }
    } else {
      const oy = Math.min(subY + subLines.length * 58 + 84, H - M - 200);
      ornamentDivider(ctx, p, W / 2, oy, W);
      if (spec.offer) {
        ctx.font = '700 36px ' + POSTER_FONTS.sans;
        const cw = Math.min(ctx.measureText(spec.offer.toUpperCase()).width + 84, W - M * 2);
        chip(ctx, spec.offer, (W - cw) / 2, Math.min(oy + 58, H - M - 150), p, { size: 36, padX: 42, h: 84, maxW: cw });
      }
    }
  }

  if (spec.layout === 'editorial') {
    // Proportional photo panel on top with breathing room so text never collides with footer
    const hasKicker = !!spec.kicker;
    const hasOffer = !!spec.offer;
    const panelH = Math.round(H * (spec.format === '9:16' ? 0.40 : 0.43));
    framePhoto(ctx, img, M, M, W - M * 2, panelH, p, spec.brand.charAt(0));

    let y = M + panelH + 24;
    if (hasKicker) {
      chip(ctx, spec.kicker, M, y, p, { size: 24, padX: 24, h: 48 });
      y += 64;
    }

    const textW = W - M * 2;
    const footerTop = H - M - 64;

    const { size, lines } = fitHeadline(ctx, spec.headline, textW, 68);
    ctx.font = `800 ${size}px ${POSTER_FONTS.display}`;
    ctx.fillStyle = p.ink;
    ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, M, y + i * (size * 1.12), textW));
    y += lines.length * (size * 1.12) + 14;

    ctx.font = `500 30px ${POSTER_FONTS.sans}`;
    ctx.fillStyle = p.sub;
    const subLines = wrapLines(ctx, spec.sub, textW, 2);
    subLines.forEach((l, i) => ctx.fillText(l, M, y + i * 42, textW));
    y += subLines.length * 42 + 20;

    if (hasOffer) {
      const offerY = Math.min(y, footerTop - 64);
      chip(ctx, spec.offer, M, offerY, p, { size: 28, padX: 30, h: 56 });
    }
  }

  if (spec.layout === 'offer') {
    bokeh(ctx, p, rand, W, H, 45);
    chip(ctx, spec.kicker, M, M + (spec.format === '9:16' ? 90 : 12), p);
    // Giant stacked offer words
    const words = (spec.offer || 'Grand Sale').toUpperCase().split(' ');
    let size = spec.format === '9:16' ? 200 : 168;
    ctx.textBaseline = 'top';
    let y = H * 0.26;
    for (const w of words.slice(0, 4)) {
      for (; size > 60; size -= 6) {
        ctx.font = `900 ${size}px ${POSTER_FONTS.display}`;
        if (ctx.measureText(w).width <= W - M * 2) break;
      }
      const isNum = /\d/.test(w);
      ctx.fillStyle = isNum ? p.accent : p.ink;
      ctx.fillText(w, M, y, W - M * 2);
      y += size * 1.02;
    }
    ctx.font = `600 42px ${POSTER_FONTS.indic}`;
    ctx.fillStyle = p.sub;
    const subLines = wrapLines(ctx, spec.sub, W - M * 2, 2);
    subLines.forEach((l, i) => ctx.fillText(l, M, y + 26 + i * 58, W - M * 2));
    ctx.font = `800 ${spec.format === '9:16' ? 54 : 44}px ${POSTER_FONTS.display}`;
    ctx.fillStyle = p.ink;
    ctx.fillText(spec.headline, M, H - M - 190, W - M * 2);
  }

  if (spec.layout === 'rangoli') {
    rangoliCorner(ctx, p, W - M + 6, M + 6);
    rangoliCorner(ctx, p, M - 6, M + 6);
    const cx = W / 2;
    chip(ctx, spec.kicker, cx - 160, M + 60, p, { maxW: 320 });
    const textW = W - M * 2 - 60;
    const { size, lines } = fitHeadline(ctx, spec.headline, textW, 96);
    ctx.font = `900 ${size}px ${POSTER_FONTS.display}`;
    ctx.fillStyle = p.ink;
    ctx.textBaseline = 'top';
    let y = H * 0.3;
    ctx.textAlign = 'center';
    lines.forEach((l, i) => ctx.fillText(l, cx, y + i * (size * 1.12), textW));
    y += lines.length * (size * 1.12) + 40;
    ctx.font = `600 42px ${POSTER_FONTS.indic}`;
    ctx.fillStyle = p.sub;
    const subLines = wrapLines(ctx, spec.sub, textW, 2);
    subLines.forEach((l, i) => ctx.fillText(l, cx, y + i * 60, textW));
    ctx.textAlign = 'left';
    if (spec.offer) {
      ctx.font = '700 34px ' + POSTER_FONTS.sans;
      const w = ctx.measureText(spec.offer.toUpperCase()).width + 80;
      chip(ctx, spec.offer, cx - w / 2, y + subLines.length * 60 + 34, p, { size: 34, padX: 40, h: 80 });
    }
    diyaRow(ctx, cx, H - M - 108, 2, p);
  }

  footer(ctx, p, spec.brand, spec.city, W, H);
}

/** Palette ids the model may choose from, for prompts. */
export const PALETTE_IDS = PALETTES.map((p) => p.id);
