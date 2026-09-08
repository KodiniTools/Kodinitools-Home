// Datenmodell – Hero-Design (Farben je Hell/Dunkel) und Text-Stile der
// Hero-/Abschnitts-Texte (Tabs „Hero-Design" und „Texte").

import { normFontFile, clampSpacing, BANNER_ANIM_TYPES, BANNER_ANIM_SPEEDS } from './model-core.js';
import { state } from './model-state.js';

// --- Medien-Standard & -Normalisierung ---
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
  };
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
    light: normHeroSide(hasSides ? hd.light : flat, heroSideLight()),
    dark: normHeroSide(hasSides ? hd.dark : flat, heroSideDark()),
  };
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
    if (px > 0 || colorLight || colorDark || font || hasFx) {
      const entry = { size: px, colorLight, colorDark, font };
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
