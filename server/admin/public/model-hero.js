// Datenmodell – Hero-Design (Farben je Hell/Dunkel) und Text-Stile der
// Hero-/Abschnitts-Texte (Tabs „Hero-Design" und „Texte").

import {
  normFontFile,
  clampSpacing,
  normSiteMediaUrl,
  getPath,
  setPath,
  MEDIA_LANGS,
  BANNER_ANIM_TYPES,
  BANNER_ANIM_SPEEDS,
} from './model-core.js';
import { state } from './model-state.js';
import {
  BANNER_SLIDES_MAX,
  defaultBannerSlideshow,
  normBannerSlides,
  normBannerSlideshow,
} from './model-grid.js';

// Diashow-Einstellungen des Hero-Hintergrunds (je Modus): wie die Banner-Diashow,
// aber ohne Punkte (Hintergrund) als Standard.
export function defaultHeroBgSlideshow() {
  return { ...defaultBannerSlideshow(), dots: false };
}
function normHeroBgSlideshow(o) {
  const ss = normBannerSlideshow(o);
  ss.dots = !!(o && typeof o === 'object' && o.dots === true);
  return ss;
}

// --- Medien-Standard & -Normalisierung ---
// Hintergrundbild des Hero-Bereichs je Modus (Tab „Hero-Design", Seitenleisten):
// Bild (Server-URL oder 'staged:<id>' bis zum Veröffentlichen) mit Bildbearbeitung.
// Unabhängig vom An-Schalter „Eigenes Hero-Design" wirksam.
export const HERO_IMG_FIELDS = {
  bgImageOpacity: { min: 0, max: 100, def: 100, label: 'Deckkraft', unit: '%' },
  bgImageDarken: { min: 0, max: 100, def: 0, label: 'Abdunkelung', unit: '%' },
  bgImageBlur: { min: 0, max: 20, def: 0, label: 'Weichzeichner', unit: 'px' },
  bgImageSaturate: { min: 0, max: 200, def: 100, label: 'Sättigung', unit: '%' },
};
function heroImageDefaults() {
  const o = { bgImage: '' };
  for (const [k, c] of Object.entries(HERO_IMG_FIELDS)) o[k] = c.def;
  o.bgSlides = []; // weitere Bilder: das Hintergrundbild läuft als Diashow
  o.bgSlideshow = defaultHeroBgSlideshow();
  return o;
}
// Standard-Design des Hero-Bereichs, getrennt für Hell- und Dunkelmodus
// (entspricht dem jeweiligen Aussehen in global.css).
export function heroSideLight() {
  return {
    borderColor: '#014f99',
    borderWidth: 1,
    bgColor: '#ffffff',
    bgOpacity: 70,
    chipBgColor: '#014f99',
    chipBgOpacity: 15,
    chipTextColor: '#013f7a',
    chipBorderColor: '#ffffff',
    chipBorderOpacity: 20,
    chipHoverBgColor: '#0160b8',
    chipHoverTextColor: '#f5f4d6',
    ctaBgColor: '#014f99',
    ctaBgOpacity: 100,
    ctaTextColor: '#ffffff',
    ctaBorderColor: '#ffffff',
    ctaBorderOpacity: 0,
    ctaHoverBgColor: '#003971',
    ctaHoverTextColor: '#ffffff',
    titleTextColor: '#003971',
    ...heroImageDefaults(),
  };
}
export function heroSideDark() {
  return {
    borderColor: '#e8a945',
    borderWidth: 1,
    bgColor: '#0e1c32',
    bgOpacity: 80,
    chipBgColor: '#142640',
    chipBgOpacity: 40,
    chipTextColor: '#f8e1a9',
    chipBorderColor: '#ffffff',
    chipBorderOpacity: 8,
    chipHoverBgColor: '#142640',
    chipHoverTextColor: '#f5f4d6',
    ctaBgColor: '#e8a945',
    ctaBgOpacity: 100,
    ctaTextColor: '#ffffff',
    ctaBorderColor: '#ffffff',
    ctaBorderOpacity: 0,
    ctaHoverBgColor: '#a07030',
    ctaHoverTextColor: '#ffffff',
    titleTextColor: '#f9f2d5',
    ...heroImageDefaults(),
  };
}
// Einzeln ausgeblendete Feature-Buttons: eindeutige Schlüssel (max. 20).
// Verschiebung je Feature-Button: { key: { x, y } }, nur Einträge ≠ 0/0, max. 20.
export function normChipOffsets(v) {
  const out = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out;
  const num = (n, m) => {
    const x = Number(n);
    return Number.isFinite(x) ? Math.max(-m, Math.min(m, Math.round(x))) : 0;
  };
  for (const k of Object.keys(v)) {
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(k) || !v[k] || typeof v[k] !== 'object') continue;
    const x = num(v[k].x, TEXT_OFFSET_MAX.x);
    const y = num(v[k].y, TEXT_OFFSET_MAX.y);
    if (x || y) out[k] = { x, y };
    if (Object.keys(out).length >= 20) break;
  }
  return out;
}
export function normHiddenChips(v) {
  if (!Array.isArray(v)) return [];
  const out = [];
  for (const k of v) {
    if (typeof k === 'string' && /^[a-zA-Z0-9_-]{1,40}$/.test(k) && !out.includes(k)) out.push(k);
    if (out.length >= 20) break;
  }
  return out;
}
export function defaultHeroDesign() {
  return {
    enabled: false,
    titleFont: '', // Überschriften-Schrift (Dateiname im /fonts-Ordner)
    buttonFont: '', // Schrift der Feature-Chips + CTA
    titleLetterSpacing: 0,
    titleStrokeColor: '#000000',
    titleStrokeWidth: 0,
    buttonLetterSpacing: 0,
    buttonStrokeColor: '#000000',
    buttonStrokeWidth: 0,
    titleFontSize: 0,
    subtitleFontSize: 0,
    chipFontSize: 0,
    ctaFontSize: 0,
    // Texte und Buttons im Hero ein-/ausblenden (gilt für beide Modi).
    showTitle: true, // Titel
    showSubtitle: true, // Untertitel
    showChips: true, // Feature-Buttons (Chips) insgesamt
    hiddenChips: [], // einzeln ausgeblendete Feature-Buttons (Schlüssel aus hero.features)
    chipOffsets: {}, // Verschiebung je Feature-Button { key: { x, y } } (px, nur ≠ 0)
    showCta: true, // CTA-Button („Jetzt starten")
    light: heroSideLight(),
    dark: heroSideDark(),
  };
}
// Einen Farb-Satz (Hell/Dunkel) normalisieren.
function normHeroSide(s, def) {
  if (!s || typeof s !== 'object') return def;
  const num = (v, min, max, d) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : d;
  };
  const hex = (v, d) => (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v)) ? v : d);
  return {
    borderColor: hex(s.borderColor, def.borderColor),
    borderWidth: num(s.borderWidth, 0, 8, def.borderWidth),
    bgColor: hex(s.bgColor, def.bgColor),
    bgOpacity: num(s.bgOpacity, 0, 100, def.bgOpacity),
    chipBgColor: hex(s.chipBgColor, def.chipBgColor),
    chipBgOpacity: num(s.chipBgOpacity, 0, 100, def.chipBgOpacity),
    chipTextColor: hex(s.chipTextColor, def.chipTextColor),
    chipBorderColor: hex(s.chipBorderColor, def.chipBorderColor),
    chipBorderOpacity: num(s.chipBorderOpacity, 0, 100, def.chipBorderOpacity),
    chipHoverBgColor: hex(s.chipHoverBgColor, def.chipHoverBgColor),
    chipHoverTextColor: hex(s.chipHoverTextColor, def.chipHoverTextColor),
    ctaBgColor: hex(s.ctaBgColor, def.ctaBgColor),
    ctaBgOpacity: num(s.ctaBgOpacity, 0, 100, def.ctaBgOpacity),
    ctaTextColor: hex(s.ctaTextColor, def.ctaTextColor),
    ctaBorderColor: hex(s.ctaBorderColor, def.ctaBorderColor),
    ctaBorderOpacity: num(s.ctaBorderOpacity, 0, 100, def.ctaBorderOpacity),
    ctaHoverBgColor: hex(s.ctaHoverBgColor, def.ctaHoverBgColor),
    ctaHoverTextColor: hex(s.ctaHoverTextColor, def.ctaHoverTextColor),
    titleTextColor: hex(s.titleTextColor, def.titleTextColor),
    bgImage: normSiteMediaUrl(s.bgImage),
    bgImageOpacity: num(s.bgImageOpacity, 0, 100, def.bgImageOpacity),
    bgImageDarken: num(s.bgImageDarken, 0, 100, def.bgImageDarken),
    bgImageBlur: num(s.bgImageBlur, 0, 20, def.bgImageBlur),
    bgImageSaturate: num(s.bgImageSaturate, 0, 200, def.bgImageSaturate),
    bgSlides: normBannerSlides(s.bgSlides),
    bgSlideshow: normHeroBgSlideshow(s.bgSlideshow),
  };
}
// Geladenes Hero-Design normalisieren (getrennt Hell/Dunkel). Migriert die alte
// flache Struktur (Farben auf oberster Ebene) auf beide Modi.
export function normHeroDesign(hd) {
  if (!hd || typeof hd !== 'object') return defaultHeroDesign();
  const hasSides =
    (hd.light && typeof hd.light === 'object') || (hd.dark && typeof hd.dark === 'object');
  const flat = !hasSides && typeof hd.borderColor === 'string' ? hd : null;
  const hex = (v, d) => (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v)) ? v : d);
  const stroke = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(5, Math.round(n * 2) / 2)) : 0;
  };
  const fontSize = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.max(8, Math.min(96, Math.round(n))) : 0;
  };
  return {
    enabled: hd.enabled === true,
    titleFont: normFontFile(hd.titleFont),
    buttonFont: normFontFile(hd.buttonFont),
    titleLetterSpacing: clampSpacing(hd.titleLetterSpacing, 0),
    titleStrokeColor: hex(hd.titleStrokeColor, '#000000'),
    titleStrokeWidth: stroke(hd.titleStrokeWidth),
    buttonLetterSpacing: clampSpacing(hd.buttonLetterSpacing, 0),
    buttonStrokeColor: hex(hd.buttonStrokeColor, '#000000'),
    buttonStrokeWidth: stroke(hd.buttonStrokeWidth),
    titleFontSize: fontSize(hd.titleFontSize),
    subtitleFontSize: fontSize(hd.subtitleFontSize),
    chipFontSize: fontSize(hd.chipFontSize),
    ctaFontSize: fontSize(hd.ctaFontSize),
    showTitle: hd.showTitle !== false,
    showSubtitle: hd.showSubtitle !== false,
    showChips: hd.showChips !== false,
    hiddenChips: normHiddenChips(hd.hiddenChips),
    chipOffsets: normChipOffsets(hd.chipOffsets),
    showCta: hd.showCta !== false,
    light: normHeroSide(hasSides ? hd.light : flat, heroSideLight()),
    dark: normHeroSide(hasSides ? hd.dark : flat, heroSideDark()),
  };
}
// Bild-Plätze des Hero-Hintergrundbilds (je Sprache und Modus) – für Upload beim
// Veröffentlichen, Auflösen von staged:-Referenzen und „wird verwendet in".
export function heroImageSlots() {
  const modeLabel = (m) => (m === 'dark' ? 'Dunkel' : 'Hell');
  const slots = [];
  for (const lang of MEDIA_LANGS)
    for (const mode of ['light', 'dark'])
      slots.push({
        root: lang,
        xLang: lang,
        path: ['heroDesign', mode, 'bgImage'],
        mode,
        label: `${lang.toUpperCase()} · Hero-Hintergrund (${modeLabel(mode)})`,
      });
  // Weitere Bilder der Hintergrund-Diashow (nur vorhandene Einträge).
  for (const lang of MEDIA_LANGS)
    for (const mode of ['light', 'dark']) {
      const hd = state.media[lang] && state.media[lang].heroDesign;
      const side = hd && hd[mode];
      const n =
        side && Array.isArray(side.bgSlides)
          ? Math.min(side.bgSlides.length, BANNER_SLIDES_MAX)
          : 0;
      for (let i = 0; i < n; i++)
        slots.push({
          root: lang,
          xLang: lang,
          path: ['heroDesign', mode, 'bgSlides', i],
          mode,
          label: `${lang.toUpperCase()} · Hero-Hintergrund Diashow Bild ${i + 2} (${modeLabel(mode)})`,
        });
    }
  for (const slot of slots) {
    slot.get = () => {
      const v = getPath(state.media[slot.root], slot.path);
      return typeof v === 'string' ? v : '';
    };
    slot.set = (v) => setPath(state.media[slot.root], slot.path, normSiteMediaUrl(v));
  }
  return slots;
}

// Hero-Text-Slots (Tab „Hero-Design"): Text-Override-Pfad + Stil-Schlüssel.
export const HERO_TEXT_SLOTS = [
  { key: 'hero.title', path: ['hero', 'title'], label: 'Titel' },
  { key: 'hero.subtitle', path: ['hero', 'subtitle'], label: 'Untertitel' },
  { key: 'hero.cta', path: ['hero', 'cta'], label: 'Button-Text („Jetzt starten")' },
];
// Text-Slots des „Texte"-Tabs (Abschnitts-Titel); nur für diese gilt
// „Standard für alle Slots" (textStyleUniform/-Key).
export const UNIFORM_TEXT_KEYS = [
  'tools.sectionTitle',
  'imageTools.sectionTitle',
  'diverseTools.sectionTitle',
];
// Alle Text-Slots mit einstellbarem Stil (Hero-Design-Tab + Texte-Tab).
export const TEXT_STYLE_KEYS = [...HERO_TEXT_SLOTS.map((s) => s.key), ...UNIFORM_TEXT_KEYS];
const textHex = (v) => (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v)) ? v : '');
const textNum = (v, min, max, def) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : def;
};
const textHalf = (v, min, max, def) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n * 2) / 2)) : def;
};
// Größte Verschiebung eines Hero-Textes (px) waagerecht/senkrecht.
export const TEXT_OFFSET_MAX = { x: 400, y: 300 };
export function normTextStyles(o) {
  const out = {};
  if (!o || typeof o !== 'object') return out;
  for (const k of TEXT_STYLE_KEYS) {
    const s = o[k];
    if (!s || typeof s !== 'object') continue;
    const px = textNum(s.size, 0, 120, 0);
    const font = normFontFile(s.font);
    // Migration: altes einzelnes color gilt für beide Modi.
    const legacy = textHex(s.color);
    const colorLight = textHex(s.colorLight) || legacy;
    const colorDark = textHex(s.colorDark) || legacy;
    // Effekte (Schatten, Umriss, Deckkraft, Animation) – analog Banner-Text.
    const shadow = s.shadow === true;
    const strokeWidth = textHalf(s.strokeWidth, 0, 10, 0);
    const opacity = textNum(s.opacity, 0, 100, 100);
    const anim = BANNER_ANIM_TYPES.includes(s.anim) ? s.anim : 'none';
    const hasFx = shadow || strokeWidth > 0 || opacity < 100 || anim !== 'none';
    // Verschiebung (px, relativ zur normalen Position; nur Hero-Texte bedienbar).
    const offsetX = textNum(s.offsetX, -TEXT_OFFSET_MAX.x, TEXT_OFFSET_MAX.x, 0);
    const offsetY = textNum(s.offsetY, -TEXT_OFFSET_MAX.y, TEXT_OFFSET_MAX.y, 0);
    const hasOff = offsetX !== 0 || offsetY !== 0;
    if (px > 0 || colorLight || colorDark || font || hasFx || hasOff) {
      const entry = { size: px, colorLight, colorDark, font };
      if (hasOff) {
        entry.offsetX = offsetX;
        entry.offsetY = offsetY;
      }
      if (hasFx) {
        entry.shadow = shadow;
        entry.shadowColor = textHex(s.shadowColor) || '#000000';
        entry.shadowX = textNum(s.shadowX, -50, 50, 0);
        entry.shadowY = textNum(s.shadowY, -50, 50, 2);
        entry.shadowBlur = textNum(s.shadowBlur, 0, 40, 6);
        entry.strokeColor = textHex(s.strokeColor) || '#000000';
        entry.strokeWidth = strokeWidth;
        entry.opacity = opacity;
        entry.anim = anim;
        entry.animIntensity = textNum(s.animIntensity, 1, 10, 5);
        entry.animSpeed = BANNER_ANIM_SPEEDS.includes(s.animSpeed) ? s.animSpeed : 'normal';
      }
      out[k] = entry;
    }
  }
  return out;
}
// Style-Objekt eines Text-Slots (legt es bei Bedarf an). Farben getrennt nach
// Hell/Dunkel; ein evtl. noch flaches color wird auf beide Modi migriert.
export function getTextStyle(lang, key) {
  const m = state.media[lang];
  if (!m.textStyles || typeof m.textStyles !== 'object') m.textStyles = {};
  if (!m.textStyles[key]) m.textStyles[key] = { size: 0, colorLight: '', colorDark: '', font: '' };
  const s = m.textStyles[key];
  if (typeof s.font !== 'string') s.font = '';
  if (typeof s.color === 'string' && s.color) {
    if (!s.colorLight) s.colorLight = s.color;
    if (!s.colorDark) s.colorDark = s.color;
    delete s.color;
  }
  if (typeof s.colorLight !== 'string') s.colorLight = '';
  if (typeof s.colorDark !== 'string') s.colorDark = '';
  // Effekt-Defaults ergänzen (für ältere Einträge ohne diese Felder). Entsprechen
  // dem „aus"-Zustand, sodass sich am Standardaussehen nichts ändert.
  if (typeof s.shadow !== 'boolean') s.shadow = false;
  if (typeof s.shadowColor !== 'string') s.shadowColor = '#000000';
  if (!Number.isFinite(s.shadowX)) s.shadowX = 0;
  if (!Number.isFinite(s.shadowY)) s.shadowY = 2;
  if (!Number.isFinite(s.shadowBlur)) s.shadowBlur = 6;
  if (typeof s.strokeColor !== 'string') s.strokeColor = '#000000';
  if (!Number.isFinite(s.strokeWidth)) s.strokeWidth = 0;
  if (!Number.isFinite(s.opacity)) s.opacity = 100;
  if (!BANNER_ANIM_TYPES.includes(s.anim)) s.anim = 'none';
  if (!Number.isFinite(s.animIntensity)) s.animIntensity = 5;
  if (!BANNER_ANIM_SPEEDS.includes(s.animSpeed)) s.animSpeed = 'normal';
  if (!Number.isFinite(s.offsetX)) s.offsetX = 0;
  if (!Number.isFinite(s.offsetY)) s.offsetY = 0;
  return s;
}
// Effektiver Stil eines Text-Slots: bei aktivem „Standard für alle Slots"
// gelten die Werte des gewählten Slots für alle Slots des Texte-Tabs (Größe,
// Farbe, Schriftart, Effekte). Hero-Slots nutzen immer ihren eigenen Stil.
export function getEffectiveTextStyle(lang, key) {
  const m = state.media[lang];
  const own = getTextStyle(lang, key);
  if (!m.textStyleUniform || !UNIFORM_TEXT_KEYS.includes(key)) return own;
  const masterKey = UNIFORM_TEXT_KEYS.includes(m.textStyleUniformKey)
    ? m.textStyleUniformKey
    : UNIFORM_TEXT_KEYS[0];
  return { ...getTextStyle(lang, masterKey) };
}
