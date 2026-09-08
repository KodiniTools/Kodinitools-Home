// Datenmodell – Sektions-Medien (Audio/Bild/Diverse): Design je Modus,
// Diashow und Text-Overlay (Tab „Medien"), plus die Bild-Plätze der Diashows.

import { normFontFile, getPath, setPath, MEDIA_LANGS } from './model-core.js';
import { state } from './model-state.js';
import { defaultBannerSlideshow, normBannerSlides, normBannerSlideshow } from './model-grid.js';

// --- Sektions-Medien (Audio/Bild/Diverse): Design je Modus, Diashow, Text-Overlay ---
export const SECTION_MEDIA_KEYS = ['audio', 'image', 'diverse'];
export const SECTION_MEDIA_LABELS = {
  audio: 'Audio-Tools',
  image: 'Bild-Tools',
  diverse: 'Diverse Tools',
};
// Design eines Modus: eigener Rahmen (aus = Standard aus components.css), Farbe,
// Dicke, Eckenradius, Deckkraft und Verdunkelung des Mediums.
export function defaultSectionMediaSide() {
  return {
    customBorder: false,
    borderColor: '#014f99',
    borderWidth: 2, // px (0–20)
    borderRadius: 12, // px (0–80)
    opacity: 100, // % (0–100)
    darken: 0, // % (0–100)
  };
}
// Text über dem Sektions-Medium (wie Banner-Text, ohne Animation).
export function defaultSectionMediaText() {
  return {
    text: '',
    font: '',
    color: '#ffffff',
    size: 0, // px (0 = automatisch)
    x: 50,
    y: 50,
    opacity: 100,
    shadow: true,
    shadowColor: '#000000',
    shadowX: 0,
    shadowY: 2,
    shadowBlur: 6,
    strokeColor: '#000000',
    strokeWidth: 0,
  };
}
export function defaultSectionMedia() {
  return {
    style: { light: defaultSectionMediaSide(), dark: defaultSectionMediaSide() },
    slides: [],
    slideshow: defaultBannerSlideshow(),
    text: defaultSectionMediaText(),
    // Verschiebung des Medium-Blocks auf der Seite (px, relative Position; Ganzseiten-Vorschau).
    offsetX: 0,
    offsetY: 0,
  };
}
// Größte Verschiebung eines Mediums (px) waagerecht/senkrecht.
export const MEDIA_OFFSET_MAX = { x: 400, y: 300 };
export function normMediaOffset(v, axis) {
  const m = axis === 'y' ? MEDIA_OFFSET_MAX.y : MEDIA_OFFSET_MAX.x;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(-m, Math.min(m, Math.round(n))) : 0;
}
export function defaultSectionMediaAll() {
  const out = {};
  for (const k of SECTION_MEDIA_KEYS) out[k] = defaultSectionMedia();
  return out;
}
function normSectionMediaSide(o) {
  const d = defaultSectionMediaSide();
  if (!o || typeof o !== 'object') return d;
  const hex = (v, def) => (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v)) ? v : def);
  const num = (v, min, max, def) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : def;
  };
  return {
    customBorder: o.customBorder === true,
    borderColor: hex(o.borderColor, d.borderColor),
    borderWidth: num(o.borderWidth, 0, 20, d.borderWidth),
    borderRadius: num(o.borderRadius, 0, 80, d.borderRadius),
    opacity: num(o.opacity, 0, 100, d.opacity),
    darken: num(o.darken, 0, 100, d.darken),
  };
}
function normSectionMediaText(o) {
  const d = defaultSectionMediaText();
  if (!o || typeof o !== 'object') return d;
  const hex = (v, def) => (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v)) ? v : def);
  const num = (v, min, max, def) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : def;
  };
  return {
    text: typeof o.text === 'string' ? o.text.slice(0, 200) : '',
    font: normFontFile(o.font),
    color: hex(o.color, d.color),
    size: num(o.size, 0, 96, d.size),
    x: num(o.x, 0, 100, d.x),
    y: num(o.y, 0, 100, d.y),
    opacity: num(o.opacity, 0, 100, d.opacity),
    shadow: o.shadow !== false,
    shadowColor: hex(o.shadowColor, d.shadowColor),
    shadowX: num(o.shadowX, -50, 50, d.shadowX),
    shadowY: num(o.shadowY, -50, 50, d.shadowY),
    shadowBlur: num(o.shadowBlur, 0, 40, d.shadowBlur),
    strokeColor: hex(o.strokeColor, d.strokeColor),
    strokeWidth: Number.isFinite(Number(o.strokeWidth))
      ? Math.max(0, Math.min(10, Math.round(Number(o.strokeWidth) * 2) / 2))
      : d.strokeWidth,
  };
}
export function normSectionMedia(o) {
  if (!o || typeof o !== 'object') return defaultSectionMedia();
  const st = o.style && typeof o.style === 'object' ? o.style : {};
  return {
    style: { light: normSectionMediaSide(st.light), dark: normSectionMediaSide(st.dark) },
    slides: normBannerSlides(o.slides),
    slideshow: normBannerSlideshow(o.slideshow),
    text: normSectionMediaText(o.text),
    offsetX: normMediaOffset(o.offsetX, 'x'),
    offsetY: normMediaOffset(o.offsetY, 'y'),
  };
}
export function normSectionMediaAll(o) {
  const out = {};
  for (const k of SECTION_MEDIA_KEYS)
    out[k] = normSectionMedia(o && typeof o === 'object' ? o[k] : null);
  return out;
}
// Sichert die Struktur und gibt das Sektions-Medium-Objekt (audio|image|diverse).
export function getSectionMedia(lang, key) {
  const m = state.media[lang];
  if (!m.sectionMedia || typeof m.sectionMedia !== 'object')
    m.sectionMedia = normSectionMediaAll(m.sectionMedia);
  if (!m.sectionMedia[key] || !m.sectionMedia[key].style)
    m.sectionMedia[key] = normSectionMedia(m.sectionMedia[key]);
  return m.sectionMedia[key];
}
// Bild-Plätze der Sektions-Diashows (je Sprache, Sektion, Index).
export function sectionMediaImageSlots() {
  const slots = [];
  for (const lang of MEDIA_LANGS) {
    const sm = state.media[lang] && state.media[lang].sectionMedia;
    if (!sm || typeof sm !== 'object') continue;
    for (const key of SECTION_MEDIA_KEYS) {
      const arr = sm[key] && sm[key].slides;
      if (!Array.isArray(arr)) continue;
      arr.forEach((_, i) =>
        slots.push({
          root: lang,
          xLang: lang,
          path: ['sectionMedia', key, 'slides', i],
          label: `${lang.toUpperCase()} · Sektion ${SECTION_MEDIA_LABELS[key]} Diashow Bild ${i + 2}`,
        }),
      );
    }
  }
  for (const slot of slots) {
    slot.get = () => {
      const v = getPath(state.media[slot.root], slot.path);
      return typeof v === 'string' ? v : '';
    };
    slot.set = (v) => setPath(state.media[slot.root], slot.path, String(v ?? '').trim());
  }
  return slots;
}
