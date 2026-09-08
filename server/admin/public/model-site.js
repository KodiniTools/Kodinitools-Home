// Datenmodell – globale Seiten-Einstellungen (media.site): Seiten-Hintergrund
// (Farbe/Verlauf/Muster/Bild je Modus), abgesetzte Sektionen, Effekte,
// ausgeblendete Tool-Karten, globale Schrift; dazu die Bild-Plätze der Seite.

import {
  rgbaFromHex,
  normHexOrEmpty,
  normFontFile,
  normSiteMediaUrl,
  getPath,
  setPath,
} from './model-core.js';
import { state } from './model-state.js';
import { TOOL_CARD_KEY } from './model-toolcards.js';

// Globale (sprachübergreifende) Seiten-Einstellungen. globalFont = Basis-
// Schriftart der ganzen Seite (Dateiname im /fonts-Ordner; leer = Standard).
// bgColor/bgColorDark = Seiten-Hintergrundfarbe für Hell-/Dunkelmodus
// (leer = Standardfarbe des jeweiligen Modus).
// bgOpacity*: Deckkraft (0–100 %) über der Standardfarbe; bgGradient*/bgColor2*/
// bgGradientType*/bgAngle*: optionaler Farbverlauf je Modus (Suffix Dark = Dunkel).
export function defaultSite() {
  return {
    hiddenCards: [], // auf der Seite ausgeblendete Tool-Karten ("sektion.key"), gilt für DE + EN
    globalFont: '',
    bgColor: '',
    bgColorDark: '',
    bgOpacity: 100,
    bgOpacityDark: 100,
    bgGradient: false,
    bgGradientDark: false,
    bgColor2: '',
    bgColor2Dark: '',
    bgGradientType: 'linear',
    bgGradientTypeDark: 'linear',
    bgAngle: 180,
    bgAngleDark: 180,
    // Hintergrund-Effekte (global): an/aus + Intensität 0–100.
    fxAurora: false,
    fxAuroraIntensity: 50,
    fxNoise: false,
    fxNoiseIntensity: 50,
    fxSpotlight: false,
    fxSpotlightIntensity: 50,
    // Muster je Modus: 'none' | 'dots' | 'grid' mit Farbe, Abstand (px),
    // Stärke (px) und Deckkraft (%).
    bgPattern: 'none',
    bgPatternDark: 'none',
    bgPatternColor: '#014f99',
    bgPatternColorDark: '#e8a945',
    bgPatternSpacing: 24,
    bgPatternSpacingDark: 24,
    bgPatternThickness: 1,
    bgPatternThicknessDark: 1,
    bgPatternOpacity: 12,
    bgPatternOpacityDark: 12,
    // Hintergrundbild je Modus (URL; leer = keins) mit Abdunkelung (%),
    // Weichzeichner (px), Deckkraft (%) und fixierter Position beim Scrollen.
    bgImage: '',
    bgImageDark: '',
    bgImageDarken: 0,
    bgImageDarkenDark: 0,
    bgImageBlur: 0,
    bgImageBlurDark: 0,
    bgImageOpacity: 100,
    bgImageOpacityDark: 100,
    bgImageFixed: true,
    bgImageFixedDark: true,
    // Abgesetzte Tool-Sektionen (Audio/Bild/Diverse): style 'band' (volle
    // Breite) | 'card' (abgerundet in der Sektion); je Sektion Hell/Dunkel mit
    // Tönung (color '' = keine, opacity %) und optionalem Bild.
    sections: defaultSections(),
  };
}
export const SITE_SECTION_KEYS = ['audio', 'image', 'diverse'];
export const SECTION_LABELS = {
  audio: 'Audio-Tools',
  image: 'Bild-Tools',
  diverse: 'Diverse Tools',
};
export const SECTION_STYLES = ['band', 'card'];
export function defaultSectionSide() {
  return { color: '', opacity: 8, image: '', imageDarken: 0, imageBlur: 0, imageOpacity: 100 };
}
export const SECTION_GAP_MAX = 160;
export function defaultSections() {
  const o = { style: 'band', gap: 0 };
  for (const k of SITE_SECTION_KEYS)
    o[k] = { light: defaultSectionSide(), dark: defaultSectionSide() };
  return o;
}
function normGap(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(SECTION_GAP_MAX, Math.round(n))) : 0;
}
function normSectionSide(v) {
  const d = defaultSectionSide();
  if (!v || typeof v !== 'object') return d;
  const num = (x, min, max, def) => {
    const n = Number(x);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : def;
  };
  return {
    color: normHexOrEmpty(v.color),
    opacity: num(v.opacity, 0, 100, 8),
    image: normSiteMediaUrl(v.image),
    imageDarken: num(v.imageDarken, 0, 100, 0),
    imageBlur: num(v.imageBlur, 0, 40, 0),
    imageOpacity: num(v.imageOpacity, 0, 100, 100),
  };
}
export function normSections(v) {
  const o = defaultSections();
  if (!v || typeof v !== 'object') return o;
  o.style = SECTION_STYLES.includes(v.style) ? v.style : 'band';
  o.gap = normGap(v.gap);
  for (const k of SITE_SECTION_KEYS) {
    const c = v[k] && typeof v[k] === 'object' ? v[k] : {};
    o[k] = { light: normSectionSide(c.light), dark: normSectionSide(c.dark) };
  }
  return o;
}
export const SITE_GRADIENT_TYPES = ['linear', 'radial'];
export const SITE_PATTERNS = ['none', 'dots', 'grid'];
// Bild-Felder in media.site (Hintergrundbild Hell/Dunkel) – können wie die
// Sprach-Slots eine gestagte Datei ('staged:<id>') referenzieren.
export const SITE_MEDIA_KEYS = ['bgImage', 'bgImageDark'];
// --- Ausgeblendete Tool-Karten (global, DE + EN) ---
function hiddenList() {
  const site = state.media.site || (state.media.site = defaultSite());
  if (!Array.isArray(site.hiddenCards)) site.hiddenCards = [];
  return site.hiddenCards;
}
export function isCardHidden(id) {
  return hiddenList().includes(id);
}
export function setCardHidden(id, hidden) {
  const list = hiddenList();
  const i = list.indexOf(id);
  if (hidden && i < 0) list.push(id);
  if (!hidden && i >= 0) list.splice(i, 1);
}
export function hiddenCardIds() {
  return [...hiddenList()];
}
// Effekt-Schlüssel (Feldpräfix in media.site) mit Beschriftung.
export const SITE_FX = [
  { key: 'fxAurora', label: 'Aurora-Farbflecken' },
  { key: 'fxNoise', label: 'Feines Rauschen' },
  { key: 'fxSpotlight', label: 'Maus-Spotlight' },
];
export function normSite(s) {
  if (!s || typeof s !== 'object') return defaultSite();
  const num = (v, min, max, d) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : d;
  };
  const gtype = (v) => (SITE_GRADIENT_TYPES.includes(v) ? v : 'linear');
  const pat = (v) => (SITE_PATTERNS.includes(v) ? v : 'none');
  return {
    hiddenCards: Array.isArray(s.hiddenCards)
      ? [...new Set(s.hiddenCards.filter((k) => typeof k === 'string' && TOOL_CARD_KEY.test(k)))]
      : [],
    globalFont: normFontFile(s.globalFont),
    bgColor: normHexOrEmpty(s.bgColor),
    bgColorDark: normHexOrEmpty(s.bgColorDark),
    bgOpacity: num(s.bgOpacity, 0, 100, 100),
    bgOpacityDark: num(s.bgOpacityDark, 0, 100, 100),
    bgGradient: s.bgGradient === true,
    bgGradientDark: s.bgGradientDark === true,
    bgColor2: normHexOrEmpty(s.bgColor2),
    bgColor2Dark: normHexOrEmpty(s.bgColor2Dark),
    bgGradientType: gtype(s.bgGradientType),
    bgGradientTypeDark: gtype(s.bgGradientTypeDark),
    bgAngle: num(s.bgAngle, 0, 360, 180),
    bgAngleDark: num(s.bgAngleDark, 0, 360, 180),
    fxAurora: s.fxAurora === true,
    fxAuroraIntensity: num(s.fxAuroraIntensity, 0, 100, 50),
    fxNoise: s.fxNoise === true,
    fxNoiseIntensity: num(s.fxNoiseIntensity, 0, 100, 50),
    fxSpotlight: s.fxSpotlight === true,
    fxSpotlightIntensity: num(s.fxSpotlightIntensity, 0, 100, 50),
    bgPattern: pat(s.bgPattern),
    bgPatternDark: pat(s.bgPatternDark),
    bgPatternColor: normHexOrEmpty(s.bgPatternColor) || '#014f99',
    bgPatternColorDark: normHexOrEmpty(s.bgPatternColorDark) || '#e8a945',
    bgPatternSpacing: num(s.bgPatternSpacing, 4, 200, 24),
    bgPatternSpacingDark: num(s.bgPatternSpacingDark, 4, 200, 24),
    bgPatternThickness: num(s.bgPatternThickness, 1, 6, 1),
    bgPatternThicknessDark: num(s.bgPatternThicknessDark, 1, 6, 1),
    bgPatternOpacity: num(s.bgPatternOpacity, 0, 100, 12),
    bgPatternOpacityDark: num(s.bgPatternOpacityDark, 0, 100, 12),
    bgImage: normSiteMediaUrl(s.bgImage),
    bgImageDark: normSiteMediaUrl(s.bgImageDark),
    bgImageDarken: num(s.bgImageDarken, 0, 100, 0),
    bgImageDarkenDark: num(s.bgImageDarkenDark, 0, 100, 0),
    bgImageBlur: num(s.bgImageBlur, 0, 40, 0),
    bgImageBlurDark: num(s.bgImageBlurDark, 0, 40, 0),
    bgImageOpacity: num(s.bgImageOpacity, 0, 100, 100),
    bgImageOpacityDark: num(s.bgImageOpacityDark, 0, 100, 100),
    bgImageFixed: s.bgImageFixed !== false,
    bgImageFixedDark: s.bgImageFixedDark !== false,
    sections: normSections(s.sections),
  };
}
// Seiten-Hintergrund eines Modus als CSS-background-Wert – identisch zur
// Berechnung auf der Seite (content.ts getSiteBackgroundStyle): eigene Farbe
// bzw. Verlauf mit Deckkraft ÜBER der Standardfarbe. Für alle Admin-Vorschauen
// (Hintergrund-Tab, Tool-Karten), damit sie das gleiche Ergebnis zeigen.
export function siteBgLayerCss(mode) {
  const { ground, overlay } = siteBgSplit(mode);
  return overlay ? `${overlay}, ${ground}` : ground;
}
// Seiten-Hintergrund eines Modus in zwei Teile: `ground` = flache Grundfarbe
// (eigene deckende Farbe, sonst Standard) und `overlay` = Muster + durch-
// scheinende Farbe/Verlauf als background-Liste ('' = nichts). Mit Hintergrund-
// bild liegt das Overlay auf der Seite ÜBER dem Bild (content.ts: body::after),
// der Grund darunter – die Vorschau baut die Ebenen genauso.
export function siteBgSplit(mode) {
  const s = getSiteBg(mode);
  const base = PAGE_BG_DEFAULT[mode];
  const layers = sitePatternLayers(s);
  let ground = base;
  if (s.color) {
    const c1 = rgbaFromHex(s.color, s.opacity);
    if (s.gradient && s.color2) {
      const c2 = rgbaFromHex(s.color2, s.opacity);
      layers.push(
        s.type === 'radial'
          ? `radial-gradient(ellipse at 50% 0%, ${c1}, ${c2})`
          : `linear-gradient(${s.angle}deg, ${c1}, ${c2})`,
      );
    } else if (s.opacity >= 100) ground = s.color;
    else layers.push(`linear-gradient(${c1}, ${c1})`);
  }
  return { ground, overlay: layers.join(', ') };
}
// Muster-Ebenen (Punktraster / Gitter) als background-Einträge – identisch zu
// content.ts sitePatternLayers. Leer bei 'none'.
export function sitePatternLayers(s) {
  if ((s.pattern !== 'dots' && s.pattern !== 'grid') || !s.patternColor) return [];
  const c = rgbaFromHex(s.patternColor, s.patternOpacity);
  const t = s.patternThickness;
  const size = `${s.patternSpacing}px ${s.patternSpacing}px`;
  if (s.pattern === 'dots')
    return [`radial-gradient(circle, ${c} ${t}px, transparent ${t + 0.5}px) 0 0 / ${size} repeat`];
  return [
    `linear-gradient(${c} ${t}px, transparent ${t}px) 0 0 / ${size} repeat`,
    `linear-gradient(90deg, ${c} ${t}px, transparent ${t}px) 0 0 / ${size} repeat`,
  ];
}
// Bild-Ebene eines Modus für die Admin-Vorschau: null ohne Bild, sonst
// { url, filter, opacity, fixed } (url = auflösbare Vorschau-URL, staged via objUrl).
export function siteBgImageLayer(mode, resolveUrl) {
  const s = getSiteBg(mode);
  if (!s.image) return null;
  const url = resolveUrl ? resolveUrl(s.image) : s.image;
  if (!url) return null;
  const f = [];
  if (s.imageBlur > 0) f.push(`blur(${s.imageBlur}px)`);
  if (s.imageDarken > 0) f.push(`brightness(${(1 - s.imageDarken / 100).toFixed(3)})`);
  return { url, filter: f.join(' ') || 'none', opacity: s.imageOpacity / 100, fixed: s.imageFixed };
}
// Effekt lesen: { on, intensity } für key aus SITE_FX.
export function getSiteFx(key) {
  const s = siteObj();
  return { on: s[key] === true, intensity: s[`${key}Intensity`] };
}
// Effekt setzen (Teilobjekt { on?, intensity? }).
export function setSiteFx(key, patch) {
  const s = siteObj();
  if ('on' in patch) s[key] = patch.on === true;
  if ('intensity' in patch) {
    const n = Number(patch.intensity);
    s[`${key}Intensity`] = Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 50;
  }
}
// Sichert, dass media.site vollständig (mit allen Feldern) vorliegt.
function siteObj() {
  if (!state.media.site || typeof state.media.site !== 'object') state.media.site = defaultSite();
  const s = state.media.site;
  const d = defaultSite();
  for (const k of Object.keys(d)) if (!(k in s)) s[k] = d[k];
  return s;
}
// Hintergrund-Einstellungen eines Modus als einheitliches Objekt
// { color, opacity, gradient, color2, type, angle } (color '' = Standard).
export function getSiteBg(mode) {
  const s = siteObj();
  const k = (key) => (mode === 'dark' ? key + 'Dark' : key);
  return {
    color: s[k('bgColor')] || '',
    opacity: s[k('bgOpacity')],
    gradient: s[k('bgGradient')] === true,
    color2: s[k('bgColor2')] || '',
    type: s[k('bgGradientType')],
    angle: s[k('bgAngle')],
    pattern: s[k('bgPattern')],
    patternColor: s[k('bgPatternColor')] || '',
    patternSpacing: s[k('bgPatternSpacing')],
    patternThickness: s[k('bgPatternThickness')],
    patternOpacity: s[k('bgPatternOpacity')],
    image: s[k('bgImage')] || '',
    imageDarken: s[k('bgImageDarken')],
    imageBlur: s[k('bgImageBlur')],
    imageOpacity: s[k('bgImageOpacity')],
    imageFixed: s[k('bgImageFixed')] !== false,
  };
}
// Teilweise setzen (nur übergebene Felder), Werte werden normalisiert.
export function setSiteBg(mode, patch) {
  const s = siteObj();
  const k = (key) => (mode === 'dark' ? key + 'Dark' : key);
  const num = (v, min, max, d) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : d;
  };
  if ('color' in patch) s[k('bgColor')] = normHexOrEmpty(patch.color);
  if ('opacity' in patch) s[k('bgOpacity')] = num(patch.opacity, 0, 100, 100);
  if ('gradient' in patch) s[k('bgGradient')] = patch.gradient === true;
  if ('color2' in patch) s[k('bgColor2')] = normHexOrEmpty(patch.color2);
  if ('type' in patch)
    s[k('bgGradientType')] = SITE_GRADIENT_TYPES.includes(patch.type) ? patch.type : 'linear';
  if ('angle' in patch) s[k('bgAngle')] = num(patch.angle, 0, 360, 180);
  if ('pattern' in patch)
    s[k('bgPattern')] = SITE_PATTERNS.includes(patch.pattern) ? patch.pattern : 'none';
  if ('patternColor' in patch) {
    const d = mode === 'dark' ? '#e8a945' : '#014f99';
    s[k('bgPatternColor')] = normHexOrEmpty(patch.patternColor) || d;
  }
  if ('patternSpacing' in patch) s[k('bgPatternSpacing')] = num(patch.patternSpacing, 4, 200, 24);
  if ('patternThickness' in patch)
    s[k('bgPatternThickness')] = num(patch.patternThickness, 1, 6, 1);
  if ('patternOpacity' in patch) s[k('bgPatternOpacity')] = num(patch.patternOpacity, 0, 100, 12);
  if ('image' in patch) s[k('bgImage')] = normSiteMediaUrl(patch.image);
  if ('imageDarken' in patch) s[k('bgImageDarken')] = num(patch.imageDarken, 0, 100, 0);
  if ('imageBlur' in patch) s[k('bgImageBlur')] = num(patch.imageBlur, 0, 40, 0);
  if ('imageOpacity' in patch) s[k('bgImageOpacity')] = num(patch.imageOpacity, 0, 100, 100);
  if ('imageFixed' in patch) s[k('bgImageFixed')] = patch.imageFixed !== false;
}
// Bild-Feld in media.site lesen/setzen (key aus SITE_MEDIA_KEYS).
export function getSiteMediaVal(key) {
  return SITE_MEDIA_KEYS.includes(key) ? siteObj()[key] || '' : '';
}
export function setSiteMediaVal(key, val) {
  if (SITE_MEDIA_KEYS.includes(key)) siteObj()[key] = normSiteMediaUrl(val);
}
// Sichert die vollständige Sektions-Struktur in media.site.sections.
function sectionsObj() {
  const s = siteObj();
  if (!s.sections || typeof s.sections !== 'object') s.sections = defaultSections();
  const o = s.sections;
  if (!SECTION_STYLES.includes(o.style)) o.style = 'band';
  o.gap = normGap(o.gap);
  for (const k of SITE_SECTION_KEYS) {
    if (!o[k] || typeof o[k] !== 'object') o[k] = {};
    for (const mode of ['light', 'dark']) {
      if (!o[k][mode] || typeof o[k][mode] !== 'object') o[k][mode] = defaultSectionSide();
      const d = defaultSectionSide();
      for (const f of Object.keys(d)) if (!(f in o[k][mode])) o[k][mode][f] = d[f];
    }
  }
  return o;
}
export function getSectionStyle() {
  return sectionsObj().style;
}
export function setSectionStyle(v) {
  sectionsObj().style = SECTION_STYLES.includes(v) ? v : 'band';
}
// Abstand zwischen abgesetzten Sektionen (px, 0–SECTION_GAP_MAX).
export function getSectionGap() {
  return sectionsObj().gap;
}
export function setSectionGap(v) {
  sectionsObj().gap = normGap(v);
}
// Einstellungen einer Sektion (key aus SITE_SECTION_KEYS) für einen Modus.
export function getSiteSection(key, mode) {
  return { ...sectionsObj()[key][mode] };
}
// Teilweise setzen (nur übergebene Felder), Werte werden normalisiert.
export function setSiteSection(key, mode, patch) {
  if (!SITE_SECTION_KEYS.includes(key)) return;
  const side = sectionsObj()[key][mode];
  const num = (v, min, max, d) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : d;
  };
  if ('color' in patch) side.color = normHexOrEmpty(patch.color);
  if ('opacity' in patch) side.opacity = num(patch.opacity, 0, 100, 8);
  if ('image' in patch) side.image = normSiteMediaUrl(patch.image);
  if ('imageDarken' in patch) side.imageDarken = num(patch.imageDarken, 0, 100, 0);
  if ('imageBlur' in patch) side.imageBlur = num(patch.imageBlur, 0, 40, 0);
  if ('imageOpacity' in patch) side.imageOpacity = num(patch.imageOpacity, 0, 100, 100);
}
// Alle Bild-Plätze in media.site (Seiten-Hintergrund + Sektionen) als
// { path, label, get(), set(v) } – für Upload beim Veröffentlichen, Auflösen
// von staged:-Referenzen und „wird verwendet in" der Mediathek.
export function siteImageSlots() {
  const modeLabel = (m) => (m === 'dark' ? 'Dunkel' : 'Hell');
  // mode: Modus, in dem der Platz gilt ('light' | 'dark'; Plätze ohne mode gelten
  // in beiden Modi) – für die Modus-Übersicht im Tab „Dateien".
  const slots = SITE_MEDIA_KEYS.map((key) => ({
    root: 'site',
    xLang: 'shared',
    path: [key],
    mode: key.endsWith('Dark') ? 'dark' : 'light',
    label: `Global · Seiten-Hintergrund (${modeLabel(key.endsWith('Dark') ? 'dark' : 'light')})`,
  }));
  for (const k of SITE_SECTION_KEYS)
    for (const mode of ['light', 'dark'])
      slots.push({
        root: 'site',
        xLang: 'shared',
        path: ['sections', k, mode, 'image'],
        mode,
        label: `Global · Sektion ${SECTION_LABELS[k]} (${modeLabel(mode)})`,
      });
  for (const slot of slots) {
    slot.get = () => {
      sectionsObj();
      const v = getPath(siteObj(), slot.path);
      return typeof v === 'string' ? v : '';
    };
    slot.set = (v) => {
      sectionsObj();
      setPath(siteObj(), slot.path, normSiteMediaUrl(v));
    };
  }
  return slots;
}
// Standard-Hintergrundfarben je Modus (identisch zu global.css --bg-color).
export const PAGE_BG_DEFAULT = { light: '#fafafa', dark: '#091428' };
// Seiten-Hintergrundfarbe (global) lesen. mode: 'light' | 'dark'. '' = Standard.
export function getPageBg(mode) {
  if (!state.media.site || typeof state.media.site !== 'object') state.media.site = defaultSite();
  return (mode === 'dark' ? state.media.site.bgColorDark : state.media.site.bgColor) || '';
}
// Seiten-Hintergrundfarbe (global) setzen ('' = Standard des Modus).
export function setPageBg(mode, val) {
  if (!state.media.site || typeof state.media.site !== 'object') state.media.site = defaultSite();
  const hex = normHexOrEmpty(val);
  if (mode === 'dark') state.media.site.bgColorDark = hex;
  else state.media.site.bgColor = hex;
}
// Aktuell gesetzte globale Basis-Schrift (Dateiname oder '').
export function getGlobalFont() {
  if (!state.media.site || typeof state.media.site !== 'object') state.media.site = defaultSite();
  return state.media.site.globalFont || '';
}
// Globale Basis-Schrift setzen ('' = Standard).
export function setGlobalFont(file) {
  if (!state.media.site || typeof state.media.site !== 'object') state.media.site = defaultSite();
  state.media.site.globalFont = normFontFile(file);
}
