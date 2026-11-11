import type { FullPageService } from './fullPageData';
import type { Lang, ThemeMode } from '../../../types';
import { rgbaFromHex } from '../../../public/model-core';
import type {
  CellField,
  CellImgFields,
  CellStyle,
  GridHost,
  GridSlideshow,
  HeroLayouts,
} from './gridData';

/**
 * Datenmodell und reine Regeln des Tabs „Layout“ (Vue-Fassung von
 * `public/layout.js` und `public/layout-banner.js`): Seiten-Layout (global),
 * Hero-Modus und Einzel-Banner (Design je Hell/Dunkel, Text-Overlay mit
 * Effekten, Medium, Diashow). Arbeitet nur auf übergebenen Objekten
 * (`state.media[lang]`); Standardwerte, Zwischenspeicher, Medien-Auswahl und
 * die Ganzseiten-Vorschau reicht die Vanilla-Seite als Service herein – keine
 * zweite `state`-Instanz im Bundle.
 */

// ---- Seiten-Layout (global, DE + EN) ------------------------------------------------
export type HomeLayout = 'classic' | 'compact';
export type CardForm = 'list' | 'tile';
export type CardWidth = 'narrow' | 'medium' | 'wide';
export type MediaPosDesktop = 'top' | 'side' | 'bottom' | 'off';
export type MediaPosMobile = 'top' | 'bottom' | 'off';

/** Globale Einstellungen des Panels „Seiten-Layout“ (normalisiert gelesen). */
export interface PageSettings {
  homeLayout: HomeLayout;
  heroMediaMobile: boolean;
  cardForm: CardForm;
  cardWidth: CardWidth;
  catBar: boolean;
  catSearch: boolean;
  mediaPosDesktop: MediaPosDesktop;
  mediaPosMobile: MediaPosMobile;
}
export type PageKey = keyof PageSettings;

export const CARD_FORM_LABEL: Record<CardForm, string> = {
  list: 'Liste mit Beschreibung',
  tile: 'Kachel',
};
export const CARD_WIDTH_LABEL: Record<CardWidth, string> = {
  narrow: 'Schmal',
  medium: 'Mittel',
  wide: 'Breit',
};
export const MEDIA_POS_DESKTOP_LABEL: Record<MediaPosDesktop, string> = {
  top: 'Oben',
  side: 'Seitlich',
  bottom: 'Unten',
  off: 'Aus',
};
export const MEDIA_POS_MOBILE_LABEL: Record<MediaPosMobile, string> = {
  top: 'Oben',
  bottom: 'Unten',
  off: 'Aus',
};

/** Toast nach einer Änderung im Panel „Seiten-Layout“ (Texte wie in `public/layout.js`). */
export function pageToast<K extends PageKey>(key: K, v: PageSettings[K]): string {
  switch (key) {
    case 'homeLayout':
      return v === 'compact' ? 'Kompakt-Layout gewählt' : 'Klassisches Layout gewählt';
    case 'heroMediaMobile':
      return v ? 'Medien auf dem Handy eingeblendet' : 'Medien auf dem Handy ausgeblendet';
    case 'cardForm':
      return v === 'tile' ? 'Kartenform: Kachel' : 'Kartenform: Liste';
    case 'cardWidth':
      return 'Kartenbreite geändert';
    case 'catBar':
      return v ? 'Kategorie-Leiste eingeblendet' : 'Kategorie-Leiste ausgeblendet';
    case 'catSearch':
      return v ? 'Suche eingeblendet' : 'Suche ausgeblendet';
    case 'mediaPosDesktop':
      return 'Sektionsmedien Desktop geändert';
    case 'mediaPosMobile':
      return 'Sektionsmedien Handy/Tablet geändert';
    default: {
      const never: never = key;
      return String(never);
    }
  }
}

// ---- Einzel-Banner: Design je Modus ---------------------------------------------------
/** `media.<lang>.heroBannerStyle[mode]` (wie `defaultBannerStyle`). */
export interface BannerStyle {
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  shadow: boolean;
  shadowColor: string;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowOpacity: number;
  opacity: number;
  darken: number;
  bgColor: string;
  bgOpacity: number;
}
export type BannerColorField = 'borderColor' | 'shadowColor' | 'bgColor';
export type BannerNumField =
  | 'borderWidth'
  | 'borderRadius'
  | 'shadowX'
  | 'shadowY'
  | 'shadowBlur'
  | 'shadowOpacity'
  | 'opacity'
  | 'darken'
  | 'bgOpacity';
export type BannerStyleField = keyof BannerStyle;
export type StyleLimits = Record<BannerNumField, { min: number; max: number }>;

/** Diashow-Einstellungen (`defaultBannerSlideshow`). */
export interface Slideshow {
  interval: number;
  duration: number;
  transition: string;
  pauseOnHover: boolean;
  dots: boolean;
}

export type BannerAnim = 'none' | 'pulse' | 'float' | 'shake' | 'wobble' | 'glow';
export type BannerAnimSpeed = 'slow' | 'normal' | 'fast';

/** Teil von `media.<lang>`, den der Banner-Modus liest und schreibt. */
export interface BannerHost {
  heroMode?: 'banner' | 'grid';
  heroBanner?: string;
  heroBannerLink?: string;
  heroBannerShow?: boolean;
  heroBannerText?: string;
  heroBannerFont?: string;
  heroBannerTextColor?: string;
  heroBannerTextSize?: number;
  heroBannerTextPos?: string;
  heroBannerTextX?: number;
  heroBannerTextY?: number;
  heroBannerTextShadow?: boolean;
  heroBannerTextShadowColor?: string;
  heroBannerTextShadowX?: number;
  heroBannerTextShadowY?: number;
  heroBannerTextShadowBlur?: number;
  heroBannerTextStrokeColor?: string;
  heroBannerTextStrokeWidth?: number;
  heroBannerTextOpacity?: number;
  heroBannerTextAnim?: string;
  heroBannerTextAnimIntensity?: number;
  heroBannerTextAnimSpeed?: string;
  heroBannerStyle?: Record<ThemeMode, BannerStyle>;
  heroBannerSlides?: string[];
  heroBannerSlideshow?: Slideshow;
}

export const MODE_LABEL: Record<ThemeMode, string> = { light: '☀️ Hell', dark: '🌙 Dunkel' };
export const MODE_NAME: Record<ThemeMode, string> = { light: 'Hellmodus', dark: 'Dunkelmodus' };
/** Seitenhintergrund der Vorschau je Modus (angenähert an die Startseite). */
export const BANNER_PREV_BG: Record<ThemeMode, string> = { light: '#f1f5f9', dark: '#0b1220' };
/** Preset-Positionen (⤒ Oben / ◎ Mitte / ⤓ Unten) als y-Wert in %. */
export const POS_PRESET_Y = { top: 10, center: 50, bottom: 90 } as const;
export type PosPreset = keyof typeof POS_PRESET_Y;
export const LANG_LABEL: Record<Lang, string> = { de: 'Deutsch', en: 'English' };
export const otherLang = (l: Lang): Lang => (l === 'de' ? 'en' : 'de');

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
/** Wie clamp, aber auf 0,5er-Schritte gerundet (Umriss-Dicke). */
export const clampHalf = (v: unknown, min: number, max: number) =>
  clamp(Math.round((Number(v) || 0) * 2) / 2, min, max);
const fin = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Wert eines Zahlenfelds des Banner-Designs begrenzen (ungültig → Standard). */
export function clampStyleNum(
  field: BannerNumField,
  raw: unknown,
  limits: StyleLimits,
  def: BannerStyle,
): number {
  const n = parseInt(String(raw), 10);
  const { min, max } = limits[field];
  return clamp(Number.isFinite(n) ? n : def[field], min, max);
}

/**
 * Design des Banners eines Modus als CSS-Deklarationen – wie
 * `content.ts → getHeroBannerCss` (Rahmen, Ecken, Schatten, Deckkraft,
 * Verdunkelung). Immer vollständig, damit die Vorschau live überschreibt.
 */
export function bannerDesignCss(s: BannerStyle): string {
  const p = [`border-radius:${s.borderRadius}px`];
  p.push(s.borderWidth > 0 ? `border:${s.borderWidth}px solid ${s.borderColor}` : 'border:0');
  p.push(
    s.shadow
      ? `box-shadow:${s.shadowX}px ${s.shadowY}px ${s.shadowBlur}px ${rgbaFromHex(s.shadowColor, s.shadowOpacity)}`
      : 'box-shadow:none',
  );
  p.push(`opacity:${(s.opacity / 100).toFixed(2)}`);
  p.push(`filter:${s.darken > 0 ? `brightness(${((100 - s.darken) / 100).toFixed(2)})` : 'none'}`);
  return p.join(';');
}
/** Basis-Styles des Vorschau-Mediums: Bild/Video bzw. Platzhalter-Kasten ohne Banner. */
export const BANNER_MEDIA_BASE = {
  media:
    'max-width:100%;max-height:240px;width:auto;height:auto;object-fit:contain;display:block;margin:0 auto;box-sizing:border-box',
  box: 'width:100%;min-height:110px;display:flex;align-items:center;justify-content:center;box-sizing:border-box',
} as const;
/** Vollständiger Inline-Style des Vorschau-Mediums; die Tönung gilt nur für den Kasten. */
export function bannerMediaStyle(s: BannerStyle, kind: 'media' | 'box'): string {
  const bg = kind === 'box' ? `;background:${rgbaFromHex(s.bgColor, s.bgOpacity)}` : '';
  return `${BANNER_MEDIA_BASE[kind]};${bannerDesignCss(s)}${bg}`;
}

/** Hell ↔ Dunkel: Werte eines Modus in den anderen kopieren (Kopie, keine Referenz). */
export function copyStyleSide(styles: Record<ThemeMode, BannerStyle>, from: ThemeMode): ThemeMode {
  const to: ThemeMode = from === 'dark' ? 'light' : 'dark';
  styles[to] = { ...styles[from] };
  return to;
}
/** Banner-Design (Hell + Dunkel) samt Diashow-Einstellungen in eine andere Sprache. */
export function copyBannerDesign(
  styles: Record<ThemeMode, BannerStyle>,
  slideshow: Slideshow,
  dst: BannerHost,
): void {
  dst.heroBannerStyle = { light: { ...styles.light }, dark: { ...styles.dark } };
  dst.heroBannerSlideshow = { ...slideshow };
}

// ---- Einzel-Banner: Text-Overlay ------------------------------------------------------
/** Felder des Banner-Textes (Kurzname → `heroBanner<Feld>`). */
export type BannerTextField =
  | 'text'
  | 'font'
  | 'textColor'
  | 'textSize'
  | 'textShadow'
  | 'textShadowColor'
  | 'textShadowX'
  | 'textShadowY'
  | 'textShadowBlur'
  | 'textStrokeColor'
  | 'textStrokeWidth'
  | 'textOpacity'
  | 'textAnim'
  | 'textAnimIntensity'
  | 'textAnimSpeed';

/** Normalisierte Sicht auf den Banner-Text (Standardwerte eingesetzt). */
export interface BannerText {
  text: string;
  font: string;
  textColor: string;
  textSize: number;
  textX: number;
  textY: number;
  textShadow: boolean;
  textShadowColor: string;
  textShadowX: number;
  textShadowY: number;
  textShadowBlur: number;
  textStrokeColor: string;
  textStrokeWidth: number;
  textOpacity: number;
  textAnim: BannerAnim;
  textAnimIntensity: number;
  textAnimSpeed: BannerAnimSpeed;
}

/** Standardwerte der ↺-Knöpfe (wie `bindBanner` in `public/layout-banner.js`). */
export const BANNER_TEXT_DEFAULTS: Record<BannerTextField, string | number | boolean> = {
  text: '',
  font: '',
  textColor: '#ffffff',
  textSize: 0,
  textShadow: true,
  textShadowColor: '#000000',
  textShadowX: 0,
  textShadowY: 2,
  textShadowBlur: 6,
  textStrokeColor: '#000000',
  textStrokeWidth: 0,
  textOpacity: 100,
  textAnim: 'none',
  textAnimIntensity: 5,
  textAnimSpeed: 'normal',
};
/** Felder des Text-Designs (alles außer dem Text selbst) für „nach DE/EN übertragen“. */
export const BANNER_TEXT_DESIGN_KEYS = [
  'heroBannerFont',
  'heroBannerTextColor',
  'heroBannerTextSize',
  'heroBannerTextPos',
  'heroBannerTextX',
  'heroBannerTextY',
  'heroBannerTextShadow',
  'heroBannerTextShadowColor',
  'heroBannerTextShadowX',
  'heroBannerTextShadowY',
  'heroBannerTextShadowBlur',
  'heroBannerTextStrokeColor',
  'heroBannerTextStrokeWidth',
  'heroBannerTextOpacity',
  'heroBannerTextAnim',
  'heroBannerTextAnimIntensity',
  'heroBannerTextAnimSpeed',
] as const satisfies readonly (keyof BannerHost)[];

export const ANIM_LABEL: Record<BannerAnim, string> = {
  none: 'Keine',
  pulse: 'Puls',
  float: 'Schweben',
  shake: 'Wackeln',
  wobble: 'Kippen',
  glow: 'Glühen',
};
export const ANIM_SPEED_LABEL: Record<BannerAnimSpeed, string> = {
  slow: 'Langsam',
  normal: 'Normal',
  fast: 'Schnell',
};
const ANIM_DUR: Record<BannerAnimSpeed, string> = { slow: '2.6s', normal: '1.8s', fast: '1s' };
const ANIM_TYPES = Object.keys(ANIM_LABEL) as BannerAnim[];
const ANIM_SPEEDS = Object.keys(ANIM_SPEED_LABEL) as BannerAnimSpeed[];

const fieldKey = (f: BannerTextField) =>
  `heroBanner${f.charAt(0).toUpperCase()}${f.slice(1)}` as keyof BannerHost;

/** Banner-Text mit Standardwerten lesen (wie die Locals in `bannerLayoutHtml`). */
export function readBannerText(m: BannerHost): BannerText {
  return {
    text: m.heroBannerText || '',
    font: m.heroBannerFont || '',
    textColor: m.heroBannerTextColor || '#ffffff',
    textSize: m.heroBannerTextSize || 0,
    textX: fin(m.heroBannerTextX) ? m.heroBannerTextX : 50,
    textY: fin(m.heroBannerTextY) ? m.heroBannerTextY : 50,
    textShadow: m.heroBannerTextShadow !== false,
    textShadowColor: m.heroBannerTextShadowColor || '#000000',
    textShadowX: fin(m.heroBannerTextShadowX) ? m.heroBannerTextShadowX : 0,
    textShadowY: fin(m.heroBannerTextShadowY) ? m.heroBannerTextShadowY : 2,
    textShadowBlur: fin(m.heroBannerTextShadowBlur) ? m.heroBannerTextShadowBlur : 6,
    textStrokeColor: m.heroBannerTextStrokeColor || '#000000',
    textStrokeWidth: fin(m.heroBannerTextStrokeWidth) ? m.heroBannerTextStrokeWidth : 0,
    textOpacity: fin(m.heroBannerTextOpacity) ? m.heroBannerTextOpacity : 100,
    textAnim: ANIM_TYPES.includes(m.heroBannerTextAnim as BannerAnim)
      ? (m.heroBannerTextAnim as BannerAnim)
      : 'none',
    textAnimIntensity: fin(m.heroBannerTextAnimIntensity) ? m.heroBannerTextAnimIntensity : 5,
    textAnimSpeed: ANIM_SPEEDS.includes(m.heroBannerTextAnimSpeed as BannerAnimSpeed)
      ? (m.heroBannerTextAnimSpeed as BannerAnimSpeed)
      : 'normal',
  };
}

const int = (raw: unknown) => parseInt(String(raw), 10) || 0;
/**
 * Eingabe eines Banner-Text-Felds übernehmen – mit denselben Grenzen wie die
 * Vanilla-Bindings (`[data-bannerfield]` in `bindBanner`).
 */
export function setBannerText(m: BannerHost, f: BannerTextField, raw: string | boolean): void {
  switch (f) {
    case 'text':
      m.heroBannerText = String(raw);
      break;
    case 'font':
      m.heroBannerFont = String(raw);
      break;
    case 'textColor':
      m.heroBannerTextColor = String(raw);
      break;
    case 'textSize':
      m.heroBannerTextSize = clamp(int(raw), 0, 96);
      break;
    case 'textShadow':
      m.heroBannerTextShadow = raw === true;
      break;
    case 'textShadowColor':
      m.heroBannerTextShadowColor = String(raw);
      break;
    case 'textShadowX':
      m.heroBannerTextShadowX = clamp(int(raw), -50, 50);
      break;
    case 'textShadowY':
      m.heroBannerTextShadowY = clamp(int(raw), -50, 50);
      break;
    case 'textShadowBlur':
      m.heroBannerTextShadowBlur = clamp(int(raw), 0, 40);
      break;
    case 'textStrokeColor':
      m.heroBannerTextStrokeColor = String(raw);
      break;
    case 'textStrokeWidth':
      m.heroBannerTextStrokeWidth = clampHalf(raw, 0, 10);
      break;
    case 'textOpacity':
      m.heroBannerTextOpacity = clamp(int(raw), 0, 100);
      break;
    case 'textAnim':
      m.heroBannerTextAnim = ANIM_TYPES.includes(raw as BannerAnim) ? String(raw) : 'none';
      break;
    case 'textAnimSpeed':
      m.heroBannerTextAnimSpeed = ANIM_SPEEDS.includes(raw as BannerAnimSpeed)
        ? String(raw)
        : 'normal';
      break;
    case 'textAnimIntensity': {
      const n = parseInt(String(raw), 10);
      m.heroBannerTextAnimIntensity = clamp(Number.isFinite(n) ? n : 5, 1, 10);
      break;
    }
    default: {
      const never: never = f;
      throw new Error(`Unbekanntes Banner-Feld ${String(never)}`);
    }
  }
}
/** ↺ eines Banner-Text-Felds ('pos' = Position auf 50/50). */
export function resetBannerText(m: BannerHost, f: BannerTextField | 'pos'): void {
  if (f === 'pos') {
    m.heroBannerTextX = 50;
    m.heroBannerTextY = 50;
    return;
  }
  (m as Record<string, unknown>)[fieldKey(f)] = BANNER_TEXT_DEFAULTS[f];
}
/** Text-Design (alles außer dem Text) in eine andere Sprache übernehmen. */
export function copyTextDesign(src: BannerHost, dst: BannerHost): void {
  const s = src as Record<string, unknown>;
  const d = dst as Record<string, unknown>;
  for (const k of BANNER_TEXT_DESIGN_KEYS) d[k] = s[k];
}

/** Textschatten aus den Feldern (oder 'none'); Standard reproduziert das alte Aussehen. */
export function bannerShadowCss(t: BannerText): string {
  if (!t.textShadow) return 'none';
  return `${t.textShadowX}px ${t.textShadowY}px ${t.textShadowBlur}px ${rgbaFromHex(t.textShadowColor, 60)}`;
}
/** CSS-Variablen der aktiven Text-Animation (leer bei 'none'). */
export function bannerAnimVars(t: BannerText): string[] {
  const type = t.textAnim;
  if (type === 'none') return [];
  const it = clamp(t.textAnimIntensity, 1, 10);
  const out = [`--anim-dur:${ANIM_DUR[t.textAnimSpeed] || '1.8s'}`];
  if (type === 'pulse') out.push(`--anim-scale:${(1 + it * 0.02).toFixed(3)}`);
  else if (type === 'float' || type === 'shake') out.push(`--anim-shift:${it}px`);
  else if (type === 'wobble') out.push(`--anim-rot:${it}deg`);
  else if (type === 'glow') out.push(`--anim-glow:${it * 2}px`);
  return out;
}
/** Animationsklasse des Vorschau-Textes (`kt-<typ>`) oder ''. */
export const bannerAnimClass = (t: BannerText) =>
  t.text && t.textAnim !== 'none' ? `kt-${t.textAnim}` : '';

/** font-family-Deklaration einer Schriftdatei (lädt @font-face) oder ''. */
export type FontDecl = (file: string) => string;

/**
 * Gemeinsamer Overlay-Style (wie `overlayStyle` in `public/layout-shared.js`):
 * Text an (x,y) in % verankert, in der Vorschau verschiebbar.
 */
export function overlayStyle(
  o: {
    color: string;
    size: number;
    x: number;
    y: number;
    font: string;
    fsDefault: string;
    shadow: string;
    extra: string;
  },
  fontDecl: FontDecl,
): string {
  const fs = o.size > 0 ? `${o.size}px` : o.fsDefault;
  const cx = clamp(Number(o.x) || 0, 0, 100);
  const cy = clamp(Number(o.y) || 0, 0, 100);
  return `position:absolute;left:${cx}%;top:${cy}%;transform:translate(-50%,-50%);max-width:92%;text-align:center;padding:.1rem .3rem;color:${o.color || '#fff'};font-size:${fs};line-height:1.2;text-shadow:${o.shadow};white-space:pre-line;word-break:break-word;cursor:move;pointer-events:auto;user-select:none;touch-action:none;${fontDecl(o.font)}${o.extra}`;
}
/** Inline-Style des Banner-Textes (leer ohne Text, wie die Vanilla-Vorschau). */
export function bannerTextStyle(t: BannerText, fontDecl: FontDecl): string {
  if (!t.text) return '';
  const parts: string[] = [];
  if (t.textStrokeWidth > 0)
    parts.push(`-webkit-text-stroke:${t.textStrokeWidth}px ${t.textStrokeColor}`);
  if (t.textOpacity < 100) parts.push(`opacity:${clamp(t.textOpacity, 0, 100) / 100}`);
  parts.push(...bannerAnimVars(t));
  return overlayStyle(
    {
      color: t.textColor,
      size: t.textSize,
      x: t.textX,
      y: t.textY,
      font: t.font,
      fsDefault: '1.3rem',
      shadow: bannerShadowCss(t),
      extra: parts.length ? `;${parts.join(';')}` : '',
    },
    fontDecl,
  );
}

// ---- Medium & Diashow ---------------------------------------------------------------
/** Aufgelöstes Medium: Quelle, Video?, lokaler Name/Größe (Zwischenspeicher). */
export interface ResolvedMedia {
  src: string;
  isVid: boolean;
  /** Name im Zwischenspeicher ('' = Server-Datei/URL). */
  localName: string;
  /** Größe in Bytes (nur lokal, sonst 0). */
  bytes: number;
}
/** Ein Diashow-Bild (Server-URL oder `staged:<id>`) in der Liste. */
export interface SlideRow {
  val: string;
  info: ResolvedMedia | null;
}
export function slideLabel(row: SlideRow): string {
  if (row.info?.localName)
    return `● ${row.info.localName} – lokal, wird beim Veröffentlichen hochgeladen`;
  if (row.info) return row.val;
  return `⚠ ${row.val} (lokales Bild nicht gefunden)`;
}
/** Diashow-Liste: Element verschieben (Tausch mit dem Nachbarn); false = am Rand. */
export function moveSlide(list: string[], i: number, dir: -1 | 1): boolean {
  const j = i + dir;
  if (i < 0 || j < 0 || i >= list.length || j >= list.length) return false;
  [list[i], list[j]] = [list[j]!, list[i]!];
  return true;
}
/** Zahl der Diashow-Einstellungen begrenzen (wie `[data-slideshow]` in `bindBanner`). */
export function clampSlideshowNum(field: 'interval' | 'duration', raw: unknown): number {
  const n = parseInt(String(raw), 10);
  return field === 'interval'
    ? clamp(Number.isFinite(n) ? n : 5, 1, 30)
    : clamp(Number.isFinite(n) ? n : 800, 0, 5000);
}

// ---- Service der Vanilla-Seite ---------------------------------------------------------
/** Schriftdatei aus `/fonts` (wie `state.fonts`). */
export interface FontEntry {
  name: string;
  label?: string;
}
export interface FontOption {
  value: string;
  label: string;
  style?: { fontFamily: string };
}
/** Optionen einer Schriftauswahl (jede in ihrer Schrift; fehlende bleibt wählbar). */
export function fontOptionsOf(
  fonts: readonly FontEntry[],
  ensureFontFace: (file: string) => string,
  cur: string,
): FontOption[] {
  const list = fonts.slice();
  if (cur && !list.some((f) => f.name === cur))
    list.unshift({ name: cur, label: `${cur} (nicht gefunden)` });
  return [
    { value: '', label: 'Standard (System)' },
    ...list.map((f) => {
      const fam = ensureFontFace(f.name);
      return {
        value: f.name,
        label: f.label || f.name,
        style: fam ? { fontFamily: `'${fam}', system-ui, sans-serif` } : undefined,
      };
    }),
  ];
}

/** Ziel der Medien-Auswahl: Banner, Banner-Diashow, Kachel i, Diashow von Kachel i. */
export type PickTarget = 'banner' | 'slide' | { cell: number } | { cellSlide: number };
/** Ziel beim Einfügen aus der Zwischenablage (wie `assignImageBlob` in layout-paste.js). */
export type PasteTarget = 'banner' | 'slide' | number | `cellslide:${number}`;

/** Kachel-Markierung, die `public/layout-paste.js` (Strg/Cmd+V) mitbenutzt. */
export interface CellHooks {
  mark: (i: number) => void;
  active: () => number | null;
}

/** Brücke zu `public/layout.js` (`layoutService(lang)`). */
export interface LayoutService {
  lang: Lang;
  /** `state.media[lang]` (Roh-Objekt). */
  media: () => BannerHost & GridHost;
  mediaOf: (lang: Lang) => BannerHost & GridHost;
  /**
   * Sichert die Banner- und Raster-Strukturen einer Sprache (wie getBannerStyle,
   * getCellStyle, getGridSlides & Co.); bei normalisierten Daten ändert sich nichts.
   */
  ensure: (lang: Lang) => void;
  page: () => PageSettings;
  setPage: <K extends PageKey>(key: K, v: PageSettings[K]) => void;
  /** Slot-Wert (`/uploads/…`, URL oder `staged:<id>`) auflösen; null = leer/nicht gefunden. */
  resolve: (val: string) => ResolvedMedia | null;
  /** Medien-Auswahl öffnen; false = keine Medien vorhanden (öffnet nichts). */
  pick: (target: PickTarget, title: string, onPick: (url: string) => void) => boolean;
  /** Bild aus der Zwischenablage einsetzen (zeichnet den Tab neu). */
  paste: (target: PasteTarget) => void;
  /** Kachel-Markierung für Strg/Cmd+V anmelden; Rückgabe meldet wieder ab. */
  bindCells: (hooks: CellHooks) => () => void;
  fonts: () => readonly FontEntry[];
  ensureFontFace: (file: string) => string;
  fmtBytes: (n: number) => string;
  styleDefault: () => BannerStyle;
  styleLimits: StyleLimits;
  slideshowDefault: () => Slideshow;
  slidesMax: number;
  transitions: readonly string[];
  // ---- Raster (Konstanten aus public/model-grid.ts) ----
  layouts: HeroLayouts;
  layoutCols: Record<string, number>;
  gridDims: Record<string, string>;
  imgFields: CellImgFields;
  syncProps: readonly CellField[];
  cellDefault: () => CellStyle;
  gridSlideshowDefault: () => GridSlideshow;
  /** Ganzseiten-Vorschau (Daten + Versatz, `public/layout-fullpage.js`). */
  fullPage: FullPageService;
}
