import type { ThemeMode } from '../../../types';
import { rgbaFromHex } from '../../../public/model-core';

/**
 * Datenmodell und reine Regeln des Tabs „Hintergrund“ (Vue-Fassung von
 * `public/background.ts`). Lesen/Schreiben von `media.site` bleibt bei den
 * normalisierenden Funktionen aus `public/model-site.ts`; die Vanilla-Seite
 * reicht sie als Service herein (keine zweite `state`-Instanz im Bundle).
 */

export type SiteSectionKey = 'audio' | 'image' | 'diverse';
export type FxKey = 'fxAurora' | 'fxNoise' | 'fxSpotlight';

/** Hintergrund eines Modus (`getSiteBg`); color '' = Standardfarbe des Modus. */
export interface SiteBg {
  color: string;
  opacity: number;
  gradient: boolean;
  color2: string;
  type: string;
  angle: number;
  pattern: string;
  patternColor: string;
  patternSpacing: number;
  patternThickness: number;
  patternOpacity: number;
  image: string;
  imageDarken: number;
  imageBlur: number;
  imageOpacity: number;
  imageFixed: boolean;
}
/** Abgesetzte Sektion eines Modus (`getSiteSection`). */
export interface SiteSectionSide {
  color: string;
  opacity: number;
  image: string;
  imageDarken: number;
  imageBlur: number;
  imageOpacity: number;
}
export interface FxState {
  on: boolean;
  intensity: number;
}
/** Bild-Ebene (`siteBgImageLayer` mit aufgelöster Vorschau-URL). */
export interface ImageLayer {
  url: string;
  filter: string;
  opacity: number;
  fixed: boolean;
}
/** Vorschau-Ebenen eines Modus, berechnet wie auf der Seite (model-site.ts). */
export interface BgLayers {
  /** Alles zusammen (`siteBgLayerCss`). */
  full: string;
  /** Grundfarbe (`siteBgSplit().ground`). */
  ground: string;
  /** Muster + durchscheinende Farbe (`siteBgSplit().overlay`). */
  overlay: string;
  image: ImageLayer | null;
}

/** Was `public/background.ts` dem Tab übergibt. */
export interface BgService {
  bg: (mode: ThemeMode) => SiteBg;
  setBg: (mode: ThemeMode, patch: Partial<SiteBg>) => void;
  layers: (mode: ThemeMode) => BgLayers;
  fx: (key: FxKey) => FxState;
  setFx: (key: FxKey, patch: Partial<FxState>) => void;
  sectionStyle: () => string;
  setSectionStyle: (v: string) => void;
  sectionGap: () => number;
  setSectionGap: (v: number) => void;
  section: (key: SiteSectionKey, mode: ThemeMode) => SiteSectionSide;
  setSection: (key: SiteSectionKey, mode: ThemeMode, patch: Partial<SiteSectionSide>) => void;
  /** Vorschau-URL (`staged:<id>` → Objekt-URL), '' = nicht auffindbar. */
  resolveUrl: (val: string) => string;
  /** Bild-Auswahl (alle Sprachen, nur Bilder); false = keine Medien vorhanden. */
  pick: (title: string, onPick: (url: string) => void) => boolean;
  fxList: readonly { key: FxKey; label: string }[];
  patterns: readonly string[];
  gradientTypes: readonly string[];
  gapMax: number;
  pageBgDefault: Record<ThemeMode, string>;
  defaultSectionSide: () => SiteSectionSide;
}

export const MODE_LABEL: Record<ThemeMode, string> = { light: '☀️ Hell', dark: '🌙 Dunkel' };
export const SECTION_KEYS: readonly SiteSectionKey[] = ['audio', 'image', 'diverse'];
export const SECTION_LABEL: Record<SiteSectionKey, string> = {
  audio: 'Audio-Tools',
  image: 'Bild-Tools',
  diverse: 'Diverse Tools',
};
export const FX_DESC: Record<FxKey, string> = {
  fxAurora:
    'Weiche Farbflecken in den Markenfarben (Blau/Gold) über dem Seitenhintergrund. Farben folgen automatisch dem Hell-/Dunkelmodus.',
  fxNoise:
    'Feine Körnung, die großen Flächen den sterilen Eindruck nimmt und Verläufe weicher macht.',
  fxSpotlight:
    'Sanfter Lichtkegel, der dem Mauszeiger folgt (nur Startseiten; auf Touch-Geräten unsichtbar).',
};
/** Wie background.css / index.astro (Vorschau entspricht der Seite). */
export const AURORA_BG: Record<ThemeMode, string> = {
  light:
    'radial-gradient(ellipse 75% 60% at 12% -5%, rgba(1, 79, 153, 0.24), transparent 55%),' +
    'radial-gradient(ellipse 55% 45% at 92% 8%, rgba(232, 169, 69, 0.26), transparent 55%),' +
    'radial-gradient(ellipse 65% 55% at 85% 105%, rgba(58, 123, 200, 0.22), transparent 55%)',
  dark:
    'radial-gradient(ellipse 75% 60% at 12% -5%, rgba(232, 169, 69, 0.26), transparent 55%),' +
    'radial-gradient(ellipse 55% 45% at 92% 8%, rgba(1, 79, 153, 0.44), transparent 55%),' +
    'radial-gradient(ellipse 65% 55% at 85% 105%, rgba(232, 169, 69, 0.14), transparent 55%)',
};
export const FX_NOISE_MAX = 0.08;
const SPOT_BASE: Record<ThemeMode, string> = {
  light: 'rgba(1, 79, 153, A)',
  dark: 'rgba(201, 152, 77, A)',
};
const SPOT_ALPHA: Record<ThemeMode, number> = { light: 0.4, dark: 0.3 };
/** Beispiel-Textfarbe der Vorschau je Modus. */
export const PREVIEW_FG: Record<ThemeMode, string> = { light: '#003971', dark: '#e2e8f0' };
/** Vorschlag für die Endfarbe, wenn der Verlauf eingeschaltet wird. */
export const GRADIENT_END_DEFAULT: Record<ThemeMode, string> = {
  light: '#e3ecf6',
  dark: '#142640',
};
export const GRADIENT_TYPE_LABEL: Record<string, string> = {
  linear: 'Linear (Richtung wählbar)',
  radial: 'Radial (von oben Mitte)',
};
export const PATTERN_LABEL: Record<string, string> = {
  none: 'Kein Muster',
  dots: 'Punktraster',
  grid: 'Feines Gitter',
  cross: 'Plus-Raster',
  diagonal: 'Diagonallinien',
  diamond: 'Rautengitter',
  triangles: 'Dreiecksgitter (isometrisch)',
  waves: 'Wellen',
  blueprint: 'Blueprint-Karo',
};
/** Vorschlag für die Tönung einer Sektion (Markenfarben). */
export const SECTION_TINT_DEFAULT: Record<ThemeMode, string> = {
  light: '#014f99',
  dark: '#e8a945',
};
export const SECTION_STYLE_LABEL: Record<string, string> = {
  band: 'Volle Breite (Band bis zum Seitenrand)',
  card: 'Abgerundete Fläche innerhalb der Sektion',
};
/** „↺ Standard“ eines Modus (Farbe, Verlauf, Muster, Bild). */
export const BG_RESET: SiteBg = {
  color: '',
  opacity: 100,
  gradient: false,
  color2: '',
  type: 'linear',
  angle: 180,
  pattern: 'none',
  patternColor: '',
  patternSpacing: 24,
  patternThickness: 1,
  patternOpacity: 12,
  image: '',
  imageDarken: 0,
  imageBlur: 0,
  imageOpacity: 100,
  imageFixed: true,
};

// ---- Hinweise -------------------------------------------------------------------
export function noteFor(s: SiteBg, defColor: string): string {
  if (!s.color) return `⚠️ Keine eigene Farbe – es gilt die Standardfarbe (${defColor}).`;
  const parts: string[] = [];
  if (s.gradient && s.color2)
    parts.push(s.type === 'radial' ? 'radialer Verlauf' : `linearer Verlauf, ${s.angle}°`);
  if (s.opacity < 100) parts.push(`Deckkraft ${s.opacity} % über der Standardfarbe ${defColor}`);
  return `✅ Eigener Hintergrund wird auf der Seite angewandt${parts.length ? ` (${parts.join('; ')})` : ''}.`;
}
export function extrasNote(s: SiteBg): string {
  const parts: string[] = [];
  if (s.pattern !== 'none')
    parts.push(
      `${PATTERN_LABEL[s.pattern] ?? s.pattern} (${s.patternSpacing} px, ${s.patternOpacity} % Deckkraft)`,
    );
  if (s.image) {
    const bits = [s.imageFixed ? 'fixiert beim Scrollen' : 'scrollt mit, läuft nach unten aus'];
    if (s.imageDarken > 0) bits.push(`${s.imageDarken} % abgedunkelt`);
    if (s.imageBlur > 0) bits.push(`${s.imageBlur} px weich`);
    if (s.imageOpacity < 100) bits.push(`${s.imageOpacity} % Deckkraft`);
    parts.push(
      `Hintergrundbild${s.image.startsWith('staged:') ? ' (lokal, wird beim Veröffentlichen hochgeladen)' : ''}: ${bits.join(', ')}`,
    );
  }
  return parts.length ? `✅ ${parts.join(' · ')}.` : 'Kein Muster und kein Hintergrundbild.';
}
export function sectionNote(
  get: (k: SiteSectionKey, m: ThemeMode) => SiteSectionSide,
  gap: number,
): string {
  const parts: string[] = [];
  for (const k of SECTION_KEYS) {
    const bits: string[] = [];
    for (const mode of ['light', 'dark'] as const) {
      const c = get(k, mode);
      const what = [c.color ? `Tönung ${c.opacity} %` : '', c.image ? 'Bild' : ''].filter(Boolean);
      if (what.length) bits.push(`${mode === 'dark' ? 'Dunkel' : 'Hell'}: ${what.join(' + ')}`);
    }
    if (bits.length) parts.push(`${SECTION_LABEL[k]} (${bits.join(', ')})`);
  }
  return parts.length
    ? `✅ Abgesetzt: ${parts.join(' · ')}${gap > 0 ? ` · Abstand ${gap} px` : ''}.`
    : 'Keine Sektion abgesetzt – die Sektionen liegen wie bisher direkt auf dem Seitenhintergrund.';
}

// ---- Vorschau-Styles (wie background.ts) -----------------------------------------
const cssUrl = (u: string) => `url('${u.replace(/['"]/g, '')}')`;
/** Grund der Vorschau-Box: mit Bild nur die Grundfarbe, sonst alle Ebenen. */
export function previewStyle(l: BgLayers, mode: ThemeMode): string {
  return `background:${l.image ? l.ground : l.full};color:${PREVIEW_FG[mode]}`;
}
export function imageLayerStyle(l: BgLayers): string {
  const img = l.image;
  if (!img) return 'display:none';
  const mask = img.fixed
    ? ''
    : 'mask-image:linear-gradient(#000 60%, transparent);-webkit-mask-image:linear-gradient(#000 60%, transparent);';
  return `background:${cssUrl(img.url)} center / cover no-repeat;filter:${img.filter};opacity:${img.opacity};${mask}`;
}
export function overlayLayerStyle(l: BgLayers): string {
  if (!l.image || !l.overlay) return 'display:none';
  return `background:${l.overlay}`;
}
export function sectionImgStyle(c: SiteSectionSide, resolve: (v: string) => string): string {
  const url = c.image ? resolve(c.image) : '';
  if (!url) return 'display:none';
  const f: string[] = [];
  if (c.imageBlur > 0) f.push(`blur(${c.imageBlur}px)`);
  if (c.imageDarken > 0) f.push(`brightness(${(1 - c.imageDarken / 100).toFixed(3)})`);
  return `background:${cssUrl(url)} center / cover no-repeat;filter:${f.join(' ') || 'none'};opacity:${c.imageOpacity / 100}`;
}
export const sectionTint = (c: SiteSectionSide) =>
  c.color ? rgbaFromHex(c.color, c.opacity) : 'transparent';
/** Abstand der Vorschau-Streifen: Seitenwert 1:10 (mind. 1 px). */
export const previewGap = (gap: number) => Math.max(1, Math.round(gap / 10));
export function spotlight(mode: ThemeMode, intensity: number, x: number, y: number): string {
  const alpha = (SPOT_ALPHA[mode] * (intensity / 100)).toFixed(3);
  return `radial-gradient(420px circle at ${x}% ${y}%, ${SPOT_BASE[mode].replace('A', alpha)}, transparent 45%)`;
}
