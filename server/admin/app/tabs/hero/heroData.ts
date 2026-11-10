import type { FontEntry, Lang, ObjPath, Overrides, ThemeMode } from '../../../types';
import { getPath, rgbaFromHex } from '../../../public/model-core.js';
import {
  colorField,
  ensureTextStyle,
  fxActive,
  slotFxParts,
  type TextStyle,
  type TextStyleHost,
} from '../texts/textStyle';

/**
 * Datenmodell und reine Regeln des Tabs „Hero-Design“ (Vue-Fassung von
 * `public/design.js`). Gelesen/geschrieben werden `media.<lang>.heroDesign`,
 * `media.<lang>.textStyles["hero.*"]` und die Text-Overrides; was das
 * Admin-Modell braucht (Defaults, Medien, Schriften), reicht die Vanilla-Seite
 * als Service herein – das Bundle importiert `public/model.js` nicht.
 */

export type HeroImgKey = 'bgImageOpacity' | 'bgImageDarken' | 'bgImageBlur' | 'bgImageSaturate';
/** Teile der Vorschau, die angeklickt/gezogen werden können. */
export type HeroPartKind = 'chip' | 'cta' | 'title' | 'subtitle';
export type HeroSlotKey = 'hero.title' | 'hero.subtitle' | 'hero.cta';

/** Diashow-Einstellungen des Hintergrunds (`defaultHeroBgSlideshow`). */
export interface HeroSlideshow {
  interval: number;
  duration: number;
  transition: string;
  pauseOnHover: boolean;
  dots: boolean;
}
/** Farb-Satz eines Modus (`heroSideLight/Dark` in model-hero.js). */
export interface HeroSide {
  borderColor: string;
  borderWidth: number;
  bgColor: string;
  bgOpacity: number;
  chipBgColor: string;
  chipBgOpacity: number;
  chipTextColor: string;
  chipBorderColor: string;
  chipBorderOpacity: number;
  chipHoverBgColor: string;
  chipHoverTextColor: string;
  ctaBgColor: string;
  ctaBgOpacity: number;
  ctaTextColor: string;
  ctaBorderColor: string;
  ctaBorderOpacity: number;
  ctaHoverBgColor: string;
  ctaHoverTextColor: string;
  titleTextColor: string;
  bgImage: string;
  bgImageOpacity: number;
  bgImageDarken: number;
  bgImageBlur: number;
  bgImageSaturate: number;
  bgSlides: string[];
  bgSlideshow: HeroSlideshow;
}
export type HeroColorField = {
  [K in keyof HeroSide]: HeroSide[K] extends string ? K : never;
}[keyof HeroSide];
export type HeroNumField = Exclude<
  {
    [K in keyof HeroSide]: HeroSide[K] extends number ? K : never;
  }[keyof HeroSide],
  undefined
>;

/** `media.<lang>.heroDesign` (`defaultHeroDesign`). */
export interface HeroDesign {
  enabled: boolean;
  titleFont: string;
  buttonFont: string;
  titleLetterSpacing: number;
  titleStrokeColor: string;
  titleStrokeWidth: number;
  buttonLetterSpacing: number;
  buttonStrokeColor: string;
  buttonStrokeWidth: number;
  titleFontSize: number;
  subtitleFontSize: number;
  chipFontSize: number;
  ctaFontSize: number;
  showTitle: boolean;
  showSubtitle: boolean;
  showChips: boolean;
  hiddenChips: string[];
  chipOffsets: Record<string, { x: number; y: number }>;
  showCta: boolean;
  light: HeroSide;
  dark: HeroSide;
}
/** Typografie-Zahlen (gelten für beide Modi). */
export type HeroTypoNum =
  | 'titleLetterSpacing'
  | 'titleStrokeWidth'
  | 'buttonLetterSpacing'
  | 'buttonStrokeWidth'
  | 'titleFontSize'
  | 'subtitleFontSize'
  | 'chipFontSize'
  | 'ctaFontSize';
export type HeroShowKey = 'showTitle' | 'showSubtitle' | 'showChips' | 'showCta';

export interface HeroFeature {
  key: string;
  def: string;
}
export interface HeroTextSlot {
  key: HeroSlotKey;
  path: ObjPath;
  label: string;
}
export interface HeroImgField {
  min: number;
  max: number;
  def: number;
  label: string;
  unit: string;
}
export interface HeroPreviewMedia {
  src: string;
  isVid: boolean;
}
/** `media.<lang>` mit den Teilen, die der Tab braucht. */
export type HeroMediaHost = TextStyleHost & { heroDesign?: HeroDesign };

/** Brücke zum Vanilla-Admin (`heroService` in `public/design.js`). */
export interface HeroService {
  lang: Lang;
  /** `media.<lang>.heroDesign` (legt Standardwerte an, falls es fehlt). */
  design: () => HeroDesign;
  designOf: (lang: Lang) => HeroDesign;
  media: () => HeroMediaHost;
  mediaOf: (lang: Lang) => HeroMediaHost;
  overrides: () => Overrides;
  defaults: () => Overrides;
  features: () => HeroFeature[];
  globalFont: () => string;
  setGlobalFont: (file: string) => void;
  homeLayout: () => 'classic' | 'compact';
  fonts: () => FontEntry[];
  ensureFontFace: (file: string) => string;
  /** Vorschau-URL eines Bildes ('staged:<id>' → Objekt-URL), '' ohne Bild. */
  resolveUrl: (val: string) => string;
  slideInfo: (val: string) => { src: string; name: string } | null;
  /** Mediathek öffnen; false = keine Medien vorhanden. */
  pick: (kind: 'heroimg' | 'heroslide', title: string, onPick: (url: string) => void) => boolean;
  previewMedia: () => HeroPreviewMedia | null;
  mediaStyle: (mode: ThemeMode, compact: boolean) => string;
  /** CSS des Kompakt-Layouts der Vorschau (`HERO_PREVIEW_LAYOUT_CSS`). */
  layoutCss: string;
  sideDefault: (mode: ThemeMode) => HeroSide;
  designDefault: () => HeroDesign;
  slideshowDefault: () => HeroSlideshow;
  imgFields: Record<HeroImgKey, HeroImgField>;
  slidesMax: number;
  transitions: readonly string[];
  offsetMax: { x: number; y: number };
  textSlots: readonly HeroTextSlot[];
}

export const MODES: readonly ThemeMode[] = ['light', 'dark'];
export const MODE_NAME: Record<ThemeMode, string> = { light: 'Hell', dark: 'Dunkel' };
export const MODE_LABEL: Record<ThemeMode, string> = { light: '☀️ Hell', dark: '🌙 Dunkel' };
/** Breite des Hero-Kastens auf der Seite (max-width in hero.css). */
export const HERO_SITE_WIDTH = 1200;
/** Start-Höhe des Scrollrahmens der Vorschau (px), mindestens 120. */
export const HD_PREVIEW_HEIGHT = 300;
export const HD_PREVIEW_MIN = 120;
/** Hintergrund der Vorschau je Modus (wie `previewBg` in textstyle.js). */
export const PREVIEW_BG: Record<ThemeMode, string> = { light: '#f5f6f8', dark: '#0e1c32' };

/** Texte der Vorschau, falls weder Override noch Sprachdatei einen liefern. */
export const HERO_TEXT_FALLBACK: Record<HeroSlotKey, Record<Lang, string>> = {
  'hero.title': { de: 'Kostenlose Online-Tools', en: 'Free Online Tools' },
  'hero.subtitle': { de: 'Sichere Bearbeitung im Browser', en: 'Secure editing in the browser' },
  'hero.cta': { de: 'Jetzt starten', en: 'Get started' },
};

export const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

// ---- Texte ---------------------------------------------------------------------------
/** Effektiver Text: Override, sonst Standard der Sprache, sonst Fallback. */
export function effText(ov: Overrides, defs: Overrides, path: ObjPath, fallback: string): string {
  const o = getPath(ov, path);
  if (o != null && o !== '') return String(o);
  const d = getPath(defs, path);
  return d != null && d !== '' ? String(d) : fallback;
}
export function slotText(ov: Overrides, defs: Overrides, lang: Lang, slot: HeroTextSlot): string {
  const fb = HERO_TEXT_FALLBACK[slot.key];
  return effText(ov, defs, slot.path, fb ? fb[lang] || fb.de : slot.key);
}
export const featPath = (key: string): ObjPath => ['hero', 'features', key];
/** Beschriftung eines Feature-Buttons (Override, sonst Standard, sonst Schlüssel). */
export function featLabel(ov: Overrides, f: HeroFeature): string {
  const o = getPath(ov, featPath(f.key));
  return o != null && o !== '' ? String(o) : f.def || f.key;
}

// ---- Begrenzungen ------------------------------------------------------------------
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
/** Verschiebung auf den erlaubten Bereich begrenzen (px, ganzzahlig). */
export function clampOffset(v: unknown, max: number): number {
  return clamp(Math.round(Number(v) || 0), -max, max);
}
/** Zahlenwert eines Modus begrenzen (wie der `data-hd`-Handler der Vanilla-Fassung). */
export function clampSideNum(
  field: HeroNumField,
  v: unknown,
  imgFields: Record<HeroImgKey, HeroImgField>,
): number {
  const n = parseInt(String(v), 10) || 0;
  if (field === 'borderWidth') return clamp(n, 0, 8);
  if (/Opacity$/.test(field)) return clamp(n, 0, 100);
  const c = imgFields[field as HeroImgKey];
  return c ? clamp(n, c.min, c.max) : n;
}
/** Typografie-Zahl begrenzen; Schriftgrößen: leer/0 = Standard, sonst 8–96. */
export function clampTypo(field: HeroTypoNum, v: unknown): number {
  if (/LetterSpacing$/.test(field))
    return clamp(Math.round((parseFloat(String(v)) || 0) * 2) / 2, -5, 20);
  if (/StrokeWidth$/.test(field))
    return clamp(Math.round((parseFloat(String(v)) || 0) * 2) / 2, 0, 5);
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) && n > 0 ? clamp(n, 8, 96) : 0;
}
/** Ist für einen Hero-Text eine Feinabstimmung gesetzt (Schrift/Größe/Effekte/Versatz)? */
export function slotTuned(st: TextStyle): boolean {
  return !!(st.font || st.size > 0 || fxActive(st) || st.offsetX || st.offsetY);
}

// ---- Stile der Vorschau (1:1 wie design.js) ---------------------------------------
/** font-family-Wert für eine Schriftdatei oder ''. */
export type FontFamilyOf = (file: string) => string;

export function boxStyle(s: HeroSide, globalFF: string): string {
  const bg = rgbaFromHex(s.bgColor, s.bgOpacity);
  const base = globalFF ? `font-family:${globalFF};` : '';
  return `${base}position:relative;overflow:hidden;isolation:isolate;box-sizing:border-box;width:${HERO_SITE_WIDTH}px;max-width:none;margin:0 auto;font-size:16px;line-height:1.6;background:${bg};border:${s.borderWidth}px solid ${s.borderColor};border-radius:32px;padding:64px 32px;text-align:center`;
}
/** Bildebene (wie .hero::before): Deckkraft, Abdunkelung, Weichzeichner, Sättigung. */
export function imageStyle(s: HeroSide, url: string): string {
  if (!url) return '';
  const f: string[] = [];
  if (s.bgImageBlur > 0) f.push(`blur(${s.bgImageBlur}px)`);
  if (s.bgImageDarken > 0) f.push(`brightness(${(1 - s.bgImageDarken / 100).toFixed(3)})`);
  if (s.bgImageSaturate !== 100) f.push(`saturate(${s.bgImageSaturate}%)`);
  const inset = s.bgImageBlur > 0 ? -s.bgImageBlur * 2 : 0;
  return `position:absolute;inset:${inset}px;z-index:-1;pointer-events:none;border-radius:inherit;background:url('${url.replace(/['"]/g, '')}') center / cover no-repeat;opacity:${(s.bgImageOpacity / 100).toFixed(2)};filter:${f.join(' ') || 'none'}`;
}
export function titleTypo(hd: HeroDesign, ff: FontFamilyOf): string {
  const fam = ff(hd.titleFont);
  let css = fam ? `font-family:${fam};` : '';
  if (hd.titleLetterSpacing) css += `letter-spacing:${hd.titleLetterSpacing}px;`;
  if (hd.titleStrokeWidth > 0)
    css += `-webkit-text-stroke:${hd.titleStrokeWidth}px ${hd.titleStrokeColor};`;
  return css;
}
export function buttonTypo(hd: HeroDesign, ff: FontFamilyOf): string {
  const fam = ff(hd.buttonFont);
  let css = fam ? `font-family:${fam};` : '';
  if (hd.buttonLetterSpacing) css += `letter-spacing:${hd.buttonLetterSpacing}px;`;
  if (hd.buttonStrokeWidth > 0)
    css += `-webkit-text-stroke:${hd.buttonStrokeWidth}px ${hd.buttonStrokeColor};`;
  return css;
}
/** Feinabstimmung eines Hero-Textes als Inline-CSS (überschreibt die allgemeinen Werte). */
export function slotOverrideCss(st: TextStyle, mode: ThemeMode, ff: FontFamilyOf): string {
  const parts: string[] = [];
  if (st.size > 0) parts.push(`font-size:${st.size}px`);
  if (st.font) parts.push(`font-family:${ff(st.font)}`);
  const c = st[colorField(mode)];
  if (c) parts.push(`color:${c}`);
  if (st.offsetX || st.offsetY)
    parts.push('position:relative', `left:${st.offsetX || 0}px`, `top:${st.offsetY || 0}px`);
  return parts.concat(slotFxParts(st)).join(';');
}
export function chipStyle(s: HeroSide, hd: HeroDesign, ff: FontFamilyOf): string {
  const bg = rgbaFromHex(s.chipBgColor, s.chipBgOpacity);
  const bd = rgbaFromHex(s.chipBorderColor, s.chipBorderOpacity);
  const size = hd.chipFontSize > 0 ? `${hd.chipFontSize}px` : '15.2px';
  return `background:${bg};color:${s.chipTextColor};border:1px solid ${bd};border-radius:12px;padding:13.6px 8px;font-weight:600;font-size:${size};text-align:center;${buttonTypo(hd, ff)}`;
}
export function chipHidden(hd: HeroDesign, key: string): boolean {
  return Array.isArray(hd.hiddenChips) && hd.hiddenChips.includes(key);
}
/** Ziehbar, Versatz (relative Position, Platz bleibt), ggf. ausgeblendet. */
export function chipExtraCss(hd: HeroDesign, key: string): string {
  const o = hd.chipOffsets && hd.chipOffsets[key];
  const off = o && (o.x || o.y) ? `;position:relative;left:${o.x || 0}px;top:${o.y || 0}px` : '';
  return `;cursor:move;touch-action:none;user-select:none${off}${chipHidden(hd, key) ? ';visibility:hidden' : ''}`;
}
export function ctaStyle(
  s: HeroSide,
  hd: HeroDesign,
  st: TextStyle,
  mode: ThemeMode,
  ff: FontFamilyOf,
): string {
  const size = hd.ctaFontSize > 0 ? `${hd.ctaFontSize}px` : '16.8px';
  const bg = rgbaFromHex(s.ctaBgColor, s.ctaBgOpacity);
  const bd =
    s.ctaBorderOpacity > 0
      ? `border:1px solid ${rgbaFromHex(s.ctaBorderColor, s.ctaBorderOpacity)};`
      : '';
  return `display:inline-block;margin-top:32px;padding:13.6px 35.2px;border-radius:50px;background:${bg};color:${s.ctaTextColor};${bd}font-weight:700;font-size:${size};cursor:move;touch-action:none;user-select:none;${buttonTypo(hd, ff)}${slotOverrideCss(st, mode, ff)}${hd.showCta === false ? ';visibility:hidden' : ''}`;
}
function textHiddenCss(shown: boolean): string {
  return `;cursor:move;touch-action:none;user-select:none${shown ? '' : ';visibility:hidden'}`;
}
export function titleStyle(
  s: HeroSide,
  hd: HeroDesign,
  st: TextStyle,
  mode: ThemeMode,
  ff: FontFamilyOf,
): string {
  const size = hd.titleFontSize > 0 ? `${hd.titleFontSize}px` : '40px';
  return `font-weight:800;font-size:${size};line-height:1.2;margin:0 0 12px;letter-spacing:-0.02em;color:${s.titleTextColor};${titleTypo(hd, ff)}${slotOverrideCss(st, mode, ff)}${textHiddenCss(hd.showTitle !== false)}`;
}
export function subtitleStyle(
  s: HeroSide,
  hd: HeroDesign,
  st: TextStyle,
  mode: ThemeMode,
  ff: FontFamilyOf,
): string {
  const size = hd.subtitleFontSize > 0 ? `${hd.subtitleFontSize}px` : '17.6px';
  return `max-width:600px;margin:0 auto;font-weight:500;font-size:${size};white-space:pre-line;color:${s.titleTextColor};${titleTypo(hd, ff)}${slotOverrideCss(st, mode, ff)}${textHiddenCss(hd.showSubtitle !== false)}`;
}
/** Echte Hover-Regeln der Vorschau (Chips + CTA), je Modus. */
export function hoverCss(hd: HeroDesign): string {
  return MODES.map((mode) => {
    const s = hd[mode];
    const p = `[data-hdprev="${mode}"]`;
    return (
      `${p} [data-hdchip]:hover{background:${s.chipHoverBgColor} !important;color:${s.chipHoverTextColor} !important;border-color:transparent !important}` +
      `${p} [data-hdcta]:hover{background:${s.ctaHoverBgColor} !important;color:${s.ctaHoverTextColor} !important}`
    );
  }).join('');
}
export function noteText(hd: HeroDesign): string {
  return hd.enabled
    ? '✅ Dieses Hero-Design wird auf der Seite angewandt (Hell und Dunkel getrennt).'
    : '⚠️ „Eigenes Hero-Design verwenden“ ist aus – auf der Seite bleibt das Standard-Design. Die Vorschau zeigt dein eingestelltes Design.';
}

// ---- Aktionen ----------------------------------------------------------------------
/** Versatz eines Feature-Buttons setzen (0/0 = Eintrag entfernen). */
export function setChipOffset(hd: HeroDesign, key: string, x: number, y: number): void {
  if (!hd.chipOffsets || typeof hd.chipOffsets !== 'object') hd.chipOffsets = {};
  if (x || y) hd.chipOffsets[key] = { x, y };
  else delete hd.chipOffsets[key];
}
export function chipOffset(hd: HeroDesign, key: string): { x: number; y: number } {
  const o = hd.chipOffsets && hd.chipOffsets[key];
  return { x: (o && o.x) || 0, y: (o && o.y) || 0 };
}
/** Einzelnen Feature-Button ein-/ausblenden. */
export function setChipShown(hd: HeroDesign, key: string, shown: boolean): void {
  const set = new Set(Array.isArray(hd.hiddenChips) ? hd.hiddenChips : []);
  if (shown) set.delete(key);
  else set.add(key);
  hd.hiddenChips = [...set];
}
/** Diashow-Liste eines Modus (legt sie bei Bedarf an). */
export function slidesOf(s: HeroSide): string[] {
  if (!Array.isArray(s.bgSlides)) s.bgSlides = [];
  return s.bgSlides;
}
/** Felder eines Modus, die beim Kopieren der Farben im Ziel bleiben (Bild + Diashow). */
export function imageKeys(imgFields: Record<HeroImgKey, HeroImgField>): (keyof HeroSide)[] {
  return ['bgImage', ...(Object.keys(imgFields) as HeroImgKey[]), 'bgSlides', 'bgSlideshow'];
}
/**
 * Farben eines Modus (Farbsatz + Hero-Text-Farben) in den anderen kopieren; das
 * Hintergrundbild des Ziel-Modus bleibt erhalten.
 */
export function copySideColors(
  hd: HeroDesign,
  media: HeroMediaHost,
  from: ThemeMode,
  keep: readonly (keyof HeroSide)[],
  slots: readonly HeroTextSlot[],
): ThemeMode {
  const to: ThemeMode = from === 'dark' ? 'light' : 'dark';
  const kept: Partial<HeroSide> = {};
  for (const k of keep) (kept as Record<string, unknown>)[k] = hd[to][k];
  hd[to] = { ...clone(hd[from]), ...kept };
  for (const sl of slots) {
    const st = ensureTextStyle(media, sl.key);
    st[colorField(to)] = st[colorField(from)];
  }
  return to;
}
/** Hintergrundbild, Bildbearbeitung und Diashow in den anderen Modus übernehmen. */
export function copyImage(
  hd: HeroDesign,
  from: ThemeMode,
  imgFields: Record<HeroImgKey, HeroImgField>,
  slideshowDefault: () => HeroSlideshow,
): ThemeMode {
  const to: ThemeMode = from === 'dark' ? 'light' : 'dark';
  const src = hd[from];
  const dst = hd[to] as unknown as Record<string, unknown>;
  for (const k of ['bgImage', ...Object.keys(imgFields)]) dst[k] = src[k as keyof HeroSide];
  hd[to].bgSlides = [...slidesOf(src)];
  hd[to].bgSlideshow = { ...(src.bgSlideshow || slideshowDefault()) };
  return to;
}
/**
 * Hero-Design (Hell + Dunkel) samt Feinabstimmung der Hero-Texte in die andere
 * Sprache kopieren; Texte und Beschriftungen bleiben je Sprache.
 */
export function copyDesignToLang(
  src: HeroMediaHost,
  srcDesign: HeroDesign,
  dst: HeroMediaHost,
  slots: readonly HeroTextSlot[],
): void {
  dst.heroDesign = clone(srcDesign);
  const srcTs = src.textStyles || {};
  if (!dst.textStyles || typeof dst.textStyles !== 'object') dst.textStyles = {};
  for (const sl of slots) {
    if (srcTs[sl.key]) dst.textStyles[sl.key] = clone(srcTs[sl.key]!);
    else delete dst.textStyles[sl.key];
  }
}
