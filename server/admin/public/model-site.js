// @ts-check
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

/** @import { ThemeMode, ImageSlot, ImageSlotBase } from '../types.ts' */
/** @typedef {'audio' | 'image' | 'diverse'} SiteSectionKey */
/** @typedef {ReturnType<typeof defaultSectionSide>} SectionSide */
/** @typedef {{ style: string; gap: number } & Record<SiteSectionKey, Record<ThemeMode, SectionSide>>} SiteSections */
/** @typedef {ReturnType<typeof defaultSite>} Site */
/**
 * Hintergrund eines Modus als einheitliches Objekt (siehe getSiteBg).
 * @typedef {{ color: string; opacity: number; gradient: boolean; color2: string; type: string;
 *   angle: number; pattern: string; patternColor: string; patternSpacing: number;
 *   patternThickness: number; patternOpacity: number; image: string; imageDarken: number;
 *   imageBlur: number; imageOpacity: number; imageFixed: boolean }} SiteBg
 */

/**
 * Wert aus einer festen Liste, sonst Standard.
 * @template {string} T
 * @param {readonly T[]} list
 * @param {unknown} v
 * @param {T} def
 * @returns {T}
 */
const oneOf = (list, v, def) =>
  typeof v === 'string' && list.includes(/** @type {T} */ (v)) ? /** @type {T} */ (v) : def;
/** @type {(v: unknown, min: number, max: number, d: number) => number} */
const clampInt = (v, min, max, d) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : d;
};

// Globale (sprachübergreifende) Seiten-Einstellungen. globalFont = Basis-
// Schriftart der ganzen Seite (Dateiname im /fonts-Ordner; leer = Standard).
// bgColor/bgColorDark = Seiten-Hintergrundfarbe für Hell-/Dunkelmodus
// (leer = Standardfarbe des jeweiligen Modus).
// bgOpacity*: Deckkraft (0–100 %) über der Standardfarbe; bgGradient*/bgColor2*/
// bgGradientType*/bgAngle*: optionaler Farbverlauf je Modus (Suffix Dark = Dunkel).
export function defaultSite() {
  return {
    hiddenCards: /** @type {string[]} */ ([]), // auf der Seite ausgeblendete Tool-Karten ("sektion.key"), gilt für DE + EN
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
    // Muster je Modus (SITE_PATTERNS, 'none' = aus) mit Farbe, Abstand (px),
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
    // Startseiten-Layout (Tab „Layout“): 'classic' | 'compact'; heroMediaMobile =
    // Hero-Banner bzw. -Raster im Kompakt-Layout auch auf dem Handy zeigen.
    homeLayout: 'classic',
    heroMediaMobile: true,
    // Nur im Kompakt-Layout: Kartenform 'list' | 'tile', Kartenbreite 'narrow' | 'medium' | 'wide'.
    cardForm: 'list',
    cardWidth: 'medium',
    // Nur im Kompakt-Layout: Kategorie-Leiste (Sprunglinks) mit Suchfeld und
    // Lage der Sektionsmedien je Gerät.
    catBar: true,
    catSearch: true,
    mediaPosDesktop: 'side',
    mediaPosMobile: 'bottom',
  };
}
/** @type {SiteSectionKey[]} */
export const SITE_SECTION_KEYS = ['audio', 'image', 'diverse'];
export const CARD_WIDTHS = ['narrow', 'medium', 'wide'];
export const MEDIA_POS_DESKTOP = ['top', 'side', 'bottom', 'off'];
export const MEDIA_POS_MOBILE = ['top', 'bottom', 'off'];
/** @type {Record<SiteSectionKey, string>} */
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
/** @returns {SiteSections} */
export function defaultSections() {
  const o = /** @type {SiteSections} */ ({ style: 'band', gap: 0 });
  for (const k of SITE_SECTION_KEYS)
    o[k] = { light: defaultSectionSide(), dark: defaultSectionSide() };
  return o;
}
/** @param {unknown} v */
function normGap(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(SECTION_GAP_MAX, Math.round(n))) : 0;
}
/**
 * @param {any} v
 * @returns {SectionSide}
 */
function normSectionSide(v) {
  const d = defaultSectionSide();
  if (!v || typeof v !== 'object') return d;
  const num = clampInt;
  return {
    color: normHexOrEmpty(v.color),
    opacity: num(v.opacity, 0, 100, 8),
    image: normSiteMediaUrl(v.image),
    imageDarken: num(v.imageDarken, 0, 100, 0),
    imageBlur: num(v.imageBlur, 0, 40, 0),
    imageOpacity: num(v.imageOpacity, 0, 100, 100),
  };
}
/**
 * @param {any} v
 * @returns {SiteSections}
 */
export function normSections(v) {
  const o = defaultSections();
  if (!v || typeof v !== 'object') return o;
  o.style = oneOf(SECTION_STYLES, v.style, 'band');
  o.gap = normGap(v.gap);
  for (const k of SITE_SECTION_KEYS) {
    const c = v[k] && typeof v[k] === 'object' ? v[k] : {};
    o[k] = { light: normSectionSide(c.light), dark: normSectionSide(c.dark) };
  }
  return o;
}
export const SITE_GRADIENT_TYPES = ['linear', 'radial'];
export const SITE_PATTERNS = [
  'none',
  'dots',
  'grid',
  'cross',
  'diagonal',
  'diamond',
  'triangles',
  'waves',
  'blueprint',
];
// Bild-Felder in media.site (Hintergrundbild Hell/Dunkel) – können wie die
// Sprach-Slots eine gestagte Datei ('staged:<id>') referenzieren.
/** @type {('bgImage' | 'bgImageDark')[]} */
export const SITE_MEDIA_KEYS = ['bgImage', 'bgImageDark'];
// --- Ausgeblendete Tool-Karten (global, DE + EN) ---
function hiddenList() {
  const site = state.media.site || (state.media.site = defaultSite());
  if (!Array.isArray(site.hiddenCards)) site.hiddenCards = [];
  return site.hiddenCards;
}
/** @param {string} id */
export function isCardHidden(id) {
  return hiddenList().includes(id);
}
/**
 * @param {string} id
 * @param {boolean} hidden
 */
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
/** @type {{ key: 'fxAurora' | 'fxNoise' | 'fxSpotlight'; label: string }[]} */
export const SITE_FX = [
  { key: 'fxAurora', label: 'Aurora-Farbflecken' },
  { key: 'fxNoise', label: 'Feines Rauschen' },
  { key: 'fxSpotlight', label: 'Maus-Spotlight' },
];
/**
 * @param {any} s
 * @returns {Site}
 */
export function normSite(s) {
  if (!s || typeof s !== 'object') return defaultSite();
  const num = clampInt;
  /** @type {(v: unknown) => string} */
  const gtype = (v) => oneOf(SITE_GRADIENT_TYPES, v, 'linear');
  /** @type {(v: unknown) => string} */
  const pat = (v) => oneOf(SITE_PATTERNS, v, 'none');
  return {
    hiddenCards: Array.isArray(s.hiddenCards)
      ? [
          ...new Set(
            /** @type {unknown[]} */ (s.hiddenCards).filter(
              (k) => typeof k === 'string' && TOOL_CARD_KEY.test(k),
            ),
          ),
        ].map(String)
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
    homeLayout: s.homeLayout === 'compact' ? 'compact' : 'classic',
    heroMediaMobile: s.heroMediaMobile !== false,
    cardForm: s.cardForm === 'tile' ? 'tile' : 'list',
    cardWidth: oneOf(CARD_WIDTHS, s.cardWidth, 'medium'),
    catBar: s.catBar !== false,
    catSearch: s.catSearch !== false,
    mediaPosDesktop: oneOf(MEDIA_POS_DESKTOP, s.mediaPosDesktop, 'side'),
    mediaPosMobile: oneOf(MEDIA_POS_MOBILE, s.mediaPosMobile, 'bottom'),
  };
}
// Seiten-Hintergrund eines Modus als CSS-background-Wert – identisch zur
// Berechnung auf der Seite (content.ts getSiteBackgroundStyle): eigene Farbe
// bzw. Verlauf mit Deckkraft ÜBER der Standardfarbe. Für alle Admin-Vorschauen
// (Hintergrund-Tab, Tool-Karten), damit sie das gleiche Ergebnis zeigen.
/** @param {ThemeMode} mode */
export function siteBgLayerCss(mode) {
  const { ground, overlay } = siteBgSplit(mode);
  return overlay ? `${overlay}, ${ground}` : ground;
}
// Seiten-Hintergrund eines Modus in zwei Teile: `ground` = flache Grundfarbe
// (eigene deckende Farbe, sonst Standard) und `overlay` = Muster + durch-
// scheinende Farbe/Verlauf als background-Liste ('' = nichts). Mit Hintergrund-
// bild liegt das Overlay auf der Seite ÜBER dem Bild (content.ts: body::after),
// der Grund darunter – die Vorschau baut die Ebenen genauso.
/**
 * @param {ThemeMode} mode
 * @returns {{ ground: string; overlay: string }}
 */
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
// Muster-Ebenen als background-Einträge – identisch zu content.ts
// sitePatternLayers (Test prüft Gleichheit). Leer bei 'none'. Alles reine
// CSS-Verläufe in festen Kacheln (Abstand = Kachelmaß), keine Bilder.
/**
 * @param {Pick<SiteBg, 'pattern' | 'patternColor' | 'patternOpacity' | 'patternSpacing' | 'patternThickness'>} s
 * @returns {string[]}
 */
export function sitePatternLayers(s) {
  if (!SITE_PATTERNS.includes(s.pattern) || s.pattern === 'none' || !s.patternColor) return [];
  const c = rgbaFromHex(s.patternColor, s.patternOpacity);
  const sp = s.patternSpacing;
  const t = s.patternThickness;
  const px = (/** @type {number} */ n) => `${Math.round(n * 100) / 100}px`;
  const h = t / 2;
  const tile = (/** @type {number} */ w, ht = w) => `0 0 / ${px(w)} ${px(ht)} repeat`;
  const grid = (/** @type {string} */ col, /** @type {number} */ th, /** @type {number} */ w) => [
    `linear-gradient(${col} ${th}px, transparent ${th}px) ${tile(w)}`,
    `linear-gradient(90deg, ${col} ${th}px, transparent ${th}px) ${tile(w)}`,
  ];
  // Diagonale Linie durch zwei Kachelecken (50 %) samt Parallelen durch die
  // übrigen Ecken (0 %/100 %) – mit 0,5 px Kantenglättung.
  const diag = (/** @type {string} */ dir) =>
    `linear-gradient(${dir}, ${c} ${px(h)}, transparent ${px(h + 0.5)} calc(50% - ${px(h + 0.5)}), ` +
    `${c} calc(50% - ${px(h)}) calc(50% + ${px(h)}), transparent calc(50% + ${px(h + 0.5)}) calc(100% - ${px(h + 0.5)}), ` +
    `${c} calc(100% - ${px(h)}))`;
  switch (s.pattern) {
    case 'dots':
      return [`radial-gradient(circle, ${c} ${t}px, transparent ${t + 0.5}px) ${tile(sp)}`];
    case 'grid':
      return grid(c, t, sp);
    case 'cross': {
      // Plus-Zeichen an jedem Rasterpunkt: zwei Balken als conic-Rechtecke.
      const len = Math.min(sp, Math.max(t * 3, Math.round(sp * 0.3)));
      const bar = (/** @type {number} */ w, /** @type {number} */ ht) =>
        `conic-gradient(from 270deg at ${px(w)} ${px(ht)}, ${c} 0 90deg, transparent 0)`;
      return [
        `${bar(len, t)} ${px(-len / 2)} ${px(-h)} / ${px(sp)} ${px(sp)} repeat`,
        `${bar(t, len)} ${px(-h)} ${px(-len / 2)} / ${px(sp)} ${px(sp)} repeat`,
      ];
    }
    case 'diagonal':
      return [`${diag('to top right')} ${tile(sp)}`];
    case 'diamond':
      return [`${diag('to top right')} ${tile(sp)}`, `${diag('to top left')} ${tile(sp)}`];
    case 'triangles': {
      // Isometrisches Dreiecksgitter: Kachel Breite × Breite·√3 (gerade Höhe),
      // beide Diagonalen + Waagerechte auf halber Höhe treffen sich in den Ecken.
      const ht = Math.max(2, 2 * Math.round((sp * Math.sqrt(3)) / 2));
      return [
        `${diag('to top right')} ${tile(sp, ht)}`,
        `${diag('to top left')} ${tile(sp, ht)}`,
        `linear-gradient(${c} ${t}px, transparent ${t}px) 0 ${px(-h)} / ${px(sp)} ${px(ht / 2)} repeat`,
      ];
    }
    case 'waves': {
      // Wellenlinien aus Halbkreis-Ringen: oben offener Bogen unten in der
      // Kachel, unten offener Bogen oben – die Kachelkante schneidet je halb ab.
      const r = sp / 4;
      const inner = Math.max(0, r - h);
      const ring = (/** @type {number} */ x, /** @type {number} */ y) =>
        `radial-gradient(circle at ${px(x)} ${px(y)}, transparent ${px(Math.max(0, inner - 0.5))}, ` +
        `${c} ${px(inner)} ${px(r + h)}, transparent ${px(r + h + 0.5)}) ${tile(sp, sp / 2)}`;
      return [ring(sp / 4, sp / 2), ring((sp * 3) / 4, 0)];
    }
    case 'blueprint':
      // Blueprint-Karo: Hauptgitter + feines Untergitter (¼ Abstand, 1 px, 40 % Deckkraft).
      return [
        ...grid(c, t, sp),
        ...grid(rgbaFromHex(s.patternColor, Math.round(s.patternOpacity * 0.4)), 1, sp / 4),
      ];
    default:
      return [];
  }
}
// Bild-Ebene eines Modus für die Admin-Vorschau: null ohne Bild, sonst
// { url, filter, opacity, fixed } (url = auflösbare Vorschau-URL, staged via objUrl).
/**
 * @param {ThemeMode} mode
 * @param {(url: string) => string} [resolveUrl]
 */
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
/** @param {string} key */
export function getSiteFx(key) {
  const s = siteDyn();
  return { on: s[key] === true, intensity: s[`${key}Intensity`] };
}
// Effekt setzen (Teilobjekt { on?, intensity? }).
/**
 * @param {string} key
 * @param {{ on?: unknown; intensity?: unknown }} patch
 */
export function setSiteFx(key, patch) {
  const s = siteDyn();
  if ('on' in patch) s[key] = patch.on === true;
  if ('intensity' in patch) {
    const n = Number(patch.intensity);
    s[`${key}Intensity`] = Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 50;
  }
}
// Sichert, dass media.site vollständig (mit allen Feldern) vorliegt.
/** @returns {Site} */
function siteObj() {
  if (!state.media.site || typeof state.media.site !== 'object') state.media.site = defaultSite();
  const s = /** @type {Record<string, unknown>} */ (state.media.site);
  const d = /** @type {Record<string, unknown>} */ (defaultSite());
  for (const k of Object.keys(d)) if (!(k in s)) s[k] = d[k];
  return state.media.site;
}
// media.site mit Feldzugriff über berechnete Schlüssel (z. B. `bgColor` + 'Dark').
const siteDyn = () => /** @type {Record<string, any>} */ (siteObj());
// Hintergrund-Einstellungen eines Modus als einheitliches Objekt
// { color, opacity, gradient, color2, type, angle } (color '' = Standard).
/**
 * @param {ThemeMode | string} mode
 * @returns {SiteBg}
 */
export function getSiteBg(mode) {
  const s = siteDyn();
  const k = (/** @type {string} */ key) => (mode === 'dark' ? key + 'Dark' : key);
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
/**
 * @param {ThemeMode | string} mode
 * @param {Partial<Record<keyof SiteBg, unknown>>} patch
 */
export function setSiteBg(mode, patch) {
  const s = siteDyn();
  const k = (/** @type {string} */ key) => (mode === 'dark' ? key + 'Dark' : key);
  const num = clampInt;
  if ('color' in patch) s[k('bgColor')] = normHexOrEmpty(patch.color);
  if ('opacity' in patch) s[k('bgOpacity')] = num(patch.opacity, 0, 100, 100);
  if ('gradient' in patch) s[k('bgGradient')] = patch.gradient === true;
  if ('color2' in patch) s[k('bgColor2')] = normHexOrEmpty(patch.color2);
  if ('type' in patch) s[k('bgGradientType')] = oneOf(SITE_GRADIENT_TYPES, patch.type, 'linear');
  if ('angle' in patch) s[k('bgAngle')] = num(patch.angle, 0, 360, 180);
  if ('pattern' in patch) s[k('bgPattern')] = oneOf(SITE_PATTERNS, patch.pattern, 'none');
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
/** @param {string} key */
export function getSiteMediaVal(key) {
  return isSiteMediaKey(key) ? siteObj()[key] || '' : '';
}
/**
 * @param {string} key
 * @param {unknown} val
 */
export function setSiteMediaVal(key, val) {
  if (isSiteMediaKey(key)) siteObj()[key] = normSiteMediaUrl(val);
}
// Sichert die vollständige Sektions-Struktur in media.site.sections.
/** @type {(key: string) => key is 'bgImage' | 'bgImageDark'} */
const isSiteMediaKey = (key) => SITE_MEDIA_KEYS.includes(/** @type {any} */ (key));
/** @returns {SiteSections} */
function sectionsObj() {
  const s = siteObj();
  if (!s.sections || typeof s.sections !== 'object') s.sections = defaultSections();
  const o = /** @type {any} */ (s.sections);
  if (!SECTION_STYLES.includes(o.style)) o.style = 'band';
  o.gap = normGap(o.gap);
  for (const k of SITE_SECTION_KEYS) {
    if (!o[k] || typeof o[k] !== 'object') o[k] = {};
    for (const mode of ['light', 'dark']) {
      if (!o[k][mode] || typeof o[k][mode] !== 'object') o[k][mode] = defaultSectionSide();
      const d = defaultSectionSide();
      for (const f of Object.keys(d))
        if (!(f in o[k][mode])) o[k][mode][f] = d[/** @type {keyof SectionSide} */ (f)];
    }
  }
  return o;
}
export function getSectionStyle() {
  return sectionsObj().style;
}
/** @param {unknown} v */
export function setSectionStyle(v) {
  sectionsObj().style = oneOf(SECTION_STYLES, v, 'band');
}
// Abstand zwischen abgesetzten Sektionen (px, 0–SECTION_GAP_MAX).
export function getSectionGap() {
  return sectionsObj().gap;
}
/** @param {unknown} v */
export function setSectionGap(v) {
  sectionsObj().gap = normGap(v);
}
// Einstellungen einer Sektion (key aus SITE_SECTION_KEYS) für einen Modus.
/**
 * @param {SiteSectionKey} key
 * @param {ThemeMode} mode
 * @returns {SectionSide}
 */
export function getSiteSection(key, mode) {
  return { ...sectionsObj()[key][mode] };
}
// Teilweise setzen (nur übergebene Felder), Werte werden normalisiert.
/**
 * @param {SiteSectionKey | string} key
 * @param {ThemeMode} mode
 * @param {Partial<Record<keyof SectionSide, unknown>>} patch
 */
export function setSiteSection(key, mode, patch) {
  if (!SITE_SECTION_KEYS.includes(/** @type {SiteSectionKey} */ (key))) return;
  const side = sectionsObj()[/** @type {SiteSectionKey} */ (key)][mode];
  const num = clampInt;
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
/** @returns {ImageSlot[]} */
export function siteImageSlots() {
  const modeLabel = (/** @type {ThemeMode} */ m) => (m === 'dark' ? 'Dunkel' : 'Hell');
  // mode: Modus, in dem der Platz gilt ('light' | 'dark'; Plätze ohne mode gelten
  // in beiden Modi) – für die Modus-Übersicht im Tab „Dateien".
  /** @type {ImageSlotBase[]} */
  const slots = SITE_MEDIA_KEYS.map((key) => ({
    root: /** @type {const} */ ('site'),
    xLang: /** @type {const} */ ('shared'),
    path: [key],
    mode: /** @type {ThemeMode} */ (key.endsWith('Dark') ? 'dark' : 'light'),
    label: `Global · Seiten-Hintergrund (${modeLabel(key.endsWith('Dark') ? 'dark' : 'light')})`,
  }));
  for (const k of SITE_SECTION_KEYS)
    for (const mode of /** @type {ThemeMode[]} */ (['light', 'dark']))
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
    slot.set = (/** @type {unknown} */ v) => {
      sectionsObj();
      setPath(siteObj(), slot.path, normSiteMediaUrl(v));
    };
  }
  return /** @type {ImageSlot[]} */ (slots);
}
// Standard-Hintergrundfarben je Modus (identisch zu global.css --bg-color).
/** @type {Record<ThemeMode, string>} */
export const PAGE_BG_DEFAULT = { light: '#fafafa', dark: '#091428' };
// Seiten-Hintergrundfarbe (global) lesen. mode: 'light' | 'dark'. '' = Standard.
/** @param {ThemeMode | string} mode */
export function getPageBg(mode) {
  if (!state.media.site || typeof state.media.site !== 'object') state.media.site = defaultSite();
  return (mode === 'dark' ? state.media.site.bgColorDark : state.media.site.bgColor) || '';
}
// Seiten-Hintergrundfarbe (global) setzen ('' = Standard des Modus).
/**
 * @param {ThemeMode | string} mode
 * @param {unknown} val
 */
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
/** @param {unknown} file */
export function setGlobalFont(file) {
  if (!state.media.site || typeof state.media.site !== 'object') state.media.site = defaultSite();
  state.media.site.globalFont = normFontFile(file);
}
// Startseiten-Layout ('classic' | 'compact'), gilt für DE + EN.
export function getHomeLayout() {
  return siteObj().homeLayout === 'compact' ? 'compact' : 'classic';
}
/** @param {unknown} v */
export function setHomeLayout(v) {
  siteObj().homeLayout = v === 'compact' ? 'compact' : 'classic';
}
// Kompakt-Layout: Hero-Banner bzw. -Raster auf dem Handy zeigen.
export function getHeroMediaMobile() {
  return siteObj().heroMediaMobile !== false;
}
/** @param {unknown} on */
export function setHeroMediaMobile(on) {
  siteObj().heroMediaMobile = on === true;
}
// Kompakt-Layout: Kartenform ('list' | 'tile') und Kartenbreite ('narrow' | 'medium' | 'wide').
export function getCardForm() {
  return siteObj().cardForm === 'tile' ? 'tile' : 'list';
}
/** @param {unknown} v */
export function setCardForm(v) {
  siteObj().cardForm = v === 'tile' ? 'tile' : 'list';
}
export function getCardWidth() {
  const v = siteObj().cardWidth;
  return oneOf(CARD_WIDTHS, v, 'medium');
}
/** @param {unknown} v */
export function setCardWidth(v) {
  siteObj().cardWidth = oneOf(CARD_WIDTHS, v, 'medium');
}
// Kompakt-Layout: Kategorie-Leiste und Suchfeld darin.
export function getCatBar() {
  return siteObj().catBar !== false;
}
/** @param {unknown} on */
export function setCatBar(on) {
  siteObj().catBar = on === true;
}
export function getCatSearch() {
  return siteObj().catSearch !== false;
}
/** @param {unknown} on */
export function setCatSearch(on) {
  siteObj().catSearch = on === true;
}
// Kompakt-Layout: Lage der Sektionsmedien je Gerät.
export function getMediaPosDesktop() {
  const v = siteObj().mediaPosDesktop;
  return oneOf(MEDIA_POS_DESKTOP, v, 'side');
}
/** @param {unknown} v */
export function setMediaPosDesktop(v) {
  siteObj().mediaPosDesktop = oneOf(MEDIA_POS_DESKTOP, v, 'side');
}
export function getMediaPosMobile() {
  const v = siteObj().mediaPosMobile;
  return oneOf(MEDIA_POS_MOBILE, v, 'bottom');
}
/** @param {unknown} v */
export function setMediaPosMobile(v) {
  siteObj().mediaPosMobile = oneOf(MEDIA_POS_MOBILE, v, 'bottom');
}
