import type { Lang, SectionVideoKey, ThemeMode } from '../../../types';
import { rgbaFromHex } from '../../../public/model-core';

/**
 * Datenmodell und reine Regeln des Tabs „Medien“ (Vue-Fassung von
 * `renderMedia` in `public/media.ts` und `public/sectionmedia.ts`). Arbeiten nur
 * auf übergebenen Objekten (`state.media[lang]` bzw. dessen
 * `sectionMedia[key]`); Standardwerte, Zwischenspeicher und Medien-Auswahl
 * reicht die Vanilla-Seite als Service herein – keine zweite `state`-Instanz im
 * Bundle.
 */

export type SectionKey = SectionVideoKey;
export const SECTION_KEYS: readonly SectionKey[] = ['audio', 'image', 'diverse'];
/** Wie `SECTION_MEDIA_LABELS` in `public/model-sectionmedia.ts`. */
export const SECTION_LABEL: Record<SectionKey, string> = {
  audio: 'Audio-Tools',
  image: 'Bild-Tools',
  diverse: 'Diverse Tools',
};
export const MODE_LABEL: Record<ThemeMode, string> = { light: '☀️ Hell', dark: '🌙 Dunkel' };
export const MODE_VIEW: Record<ThemeMode, string> = {
  light: '☀️ Hell-Ansicht',
  dark: '🌙 Dunkel-Ansicht',
};
/** Preset-Positionen (⤒ Oben / ◎ Mitte / ⤓ Unten) als y-Wert in %. */
export const POS_PRESET_Y = { top: 10, center: 50, bottom: 90 } as const;
export type PosPreset = keyof typeof POS_PRESET_Y;
/** Rahmen ohne „Eigener Umriss“ (Standard aus components.css). */
export const BASE_BORDER = '1.5px solid rgba(1,79,153,.2)';
export const TRANSITION_LABEL: Record<string, string> = {
  fade: 'Überblenden',
  slide: 'Schieben',
  zoom: 'Zoom (Ken Burns)',
  none: 'Harter Schnitt',
};

/** Design eines Modus (`defaultSectionMediaSide`). */
export interface SectionSide {
  customBorder: boolean;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  opacity: number;
  darken: number;
}
/** Text über dem Sektions-Medium (`defaultSectionMediaText`). */
export interface SectionText {
  text: string;
  font: string;
  color: string;
  size: number;
  x: number;
  y: number;
  opacity: number;
  shadow: boolean;
  shadowColor: string;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  strokeColor: string;
  strokeWidth: number;
}
/** Diashow-Einstellungen (`defaultBannerSlideshow`). */
export interface Slideshow {
  interval: number;
  duration: number;
  transition: string;
  pauseOnHover: boolean;
  dots: boolean;
}
/** `media.<lang>.sectionMedia[key]` (normalisiert über `getSectionMedia`). */
export interface SectionMediaCfg {
  style: Record<ThemeMode, SectionSide>;
  slides: string[];
  slideshow: Slideshow;
  text: SectionText;
  offsetX: number;
  offsetY: number;
}
/** Teil von `media.<lang>`, den der Tab liest/schreibt. */
export interface MediaHost {
  sectionVideos: Record<SectionKey, string>;
  heroBanner?: string;
  heroMode?: string;
  heroLayout?: string;
  heroGrid?: string[];
  heroGridLinks?: string[];
}
export type SlotKey = SectionKey | 'heroBanner' | `grid${number}`;

/** Aufgelöstes Medium (Server-URL oder Zwischenspeicher). */
export interface ResolvedMedia {
  src: string;
  isVid: boolean;
  /** Dateiname, wenn das Medium lokal im Zwischenspeicher liegt, sonst null. */
  localName: string | null;
}

/** Was `public/media.ts` dem Tab übergibt (zustandsgebundene Teile). */
export interface MediaService {
  /** Sichert die Struktur und liefert `media[lang].sectionMedia[key]` (Roh-Objekt). */
  sectionMedia: (lang: Lang, key: SectionKey) => SectionMediaCfg;
  /** Slot-Wert (`/uploads/…`, URL oder `staged:<id>`) auflösen; null = nicht gefunden/leer. */
  resolve: (val: string) => ResolvedMedia | null;
  /**
   * Auswahlfenster (Server + Zwischenspeicher) öffnen. false = es gibt keine
   * Medien (dann öffnet sich nichts).
   */
  pick: (opts: { title: string; imagesOnly?: boolean }, onPick: (url: string) => void) => boolean;
  /** Standardwert eines Sektions-Slots (`defMediaVal`). */
  defaultVal: (key: SectionKey) => string;
  defaultSide: () => SectionSide;
  defaultText: () => SectionText;
  defaultSlideshow: () => Slideshow;
  /** Zahl der Kacheln eines Hero-Layouts (`heroLayoutCells`). */
  heroCells: (layout: string) => number;
  slidesMax: number;
  transitions: readonly string[];
}

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const int = (v: unknown) => parseInt(String(v), 10) || 0;

// ---- Slot-Werte (wie getMediaVal/setMediaVal, aber auf dem übergebenen Objekt) ----
const GRID = /^grid([0-5])$/;
export function getSlotVal(media: MediaHost, key: SlotKey): string {
  if (key === 'heroBanner') return media.heroBanner || '';
  const g = GRID.exec(key);
  if (g) return (media.heroGrid || [])[Number(g[1])] || '';
  return media.sectionVideos[key as SectionKey] || '';
}
export function setSlotVal(media: MediaHost, key: SlotKey, val: string): void {
  if (key === 'heroBanner') {
    media.heroBanner = val;
    return;
  }
  const g = GRID.exec(key);
  if (g) {
    if (!Array.isArray(media.heroGrid)) media.heroGrid = ['', '', '', '', '', ''];
    media.heroGrid[Number(g[1])] = val;
    return;
  }
  media.sectionVideos[key as SectionKey] = val;
}
/**
 * Verlinkung eines Hero-Mediums. Gilt für alle sechs Kacheln (die Vanilla-Fassung
 * erfasste nur Kachel 1–3, obwohl `heroGridLinks` sechs Einträge hat).
 */
export function getHeroLink(media: MediaHost, key: SlotKey): string {
  if (key === 'heroBanner') return (media as { heroBannerLink?: string }).heroBannerLink || '';
  const g = GRID.exec(key);
  return g ? (media.heroGridLinks || [])[Number(g[1])] || '' : '';
}
export function setHeroLink(media: MediaHost, key: SlotKey, val: string): void {
  if (key === 'heroBanner') {
    (media as { heroBannerLink?: string }).heroBannerLink = val;
    return;
  }
  const g = GRID.exec(key);
  if (!g) return;
  if (!Array.isArray(media.heroGridLinks)) media.heroGridLinks = ['', '', '', '', '', ''];
  media.heroGridLinks[Number(g[1])] = val;
}

// ---- Vorschau-Styles ----------------------------------------------------------
export const MEDIA_BASE =
  'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block';

/** Design eines Modus als Inline-CSS (wie `designCss` in `public/sectionmedia.ts`). */
export function designCss(s: SectionSide): { wrap: string; media: string } {
  const border = s.customBorder
    ? s.borderWidth > 0
      ? `${s.borderWidth}px solid ${s.borderColor}`
      : '0'
    : BASE_BORDER;
  return {
    wrap: `border:${border};border-radius:${s.borderRadius}px`,
    media: `opacity:${(s.opacity / 100).toFixed(2)};filter:${s.darken > 0 ? `brightness(${((100 - s.darken) / 100).toFixed(2)})` : 'none'}`,
  };
}

/** font-family-CSS (wie `fontFF` in `public/layout-shared.ts`), family = @font-face-Name. */
export const fontFF = (family: string) =>
  family ? `font-family:'${family}', var(--site-font, sans-serif);` : '';

/** Text-Overlay der Vorschau (wie `textStyle` + `overlayStyle`). */
export function textOverlayStyle(t: SectionText, family: string): string {
  const shadow = t.shadow
    ? `${t.shadowX}px ${t.shadowY}px ${t.shadowBlur}px ${rgbaFromHex(t.shadowColor || '#000000', 60)}`
    : 'none';
  const extra: string[] = [];
  if (t.strokeWidth > 0) extra.push(`-webkit-text-stroke:${t.strokeWidth}px ${t.strokeColor}`);
  if (t.opacity < 100) extra.push(`opacity:${(t.opacity / 100).toFixed(2)}`);
  const fs = t.size > 0 ? `${t.size}px` : '1.3rem';
  const cx = clamp(Number(t.x) || 0, 0, 100);
  const cy = clamp(Number(t.y) || 0, 0, 100);
  return (
    `position:absolute;left:${cx}%;top:${cy}%;transform:translate(-50%,-50%);max-width:92%;text-align:center;padding:.1rem .3rem;color:${t.color || '#fff'};font-size:${fs};line-height:1.2;text-shadow:${shadow};white-space:pre-line;word-break:break-word;cursor:move;pointer-events:auto;user-select:none;touch-action:none;${fontFF(family)}` +
    (extra.length ? ';' + extra.join(';') : '')
  );
}

// ---- Eingaben begrenzen (wie die Vanilla-Bindings) ----------------------------
export type SideNumField = 'borderWidth' | 'borderRadius' | 'opacity' | 'darken';
const SIDE_MAX: Record<SideNumField, number> = {
  borderWidth: 20,
  borderRadius: 80,
  opacity: 100,
  darken: 100,
};
export const clampSide = (f: SideNumField, v: unknown) => clamp(int(v), 0, SIDE_MAX[f]);

export type TextNumField =
  | 'size'
  | 'opacity'
  | 'shadowX'
  | 'shadowY'
  | 'shadowBlur'
  | 'strokeWidth';
export const TEXT_LIMITS: Record<TextNumField, { min: number; max: number; step: number }> = {
  size: { min: 0, max: 96, step: 1 },
  opacity: { min: 0, max: 100, step: 1 },
  shadowX: { min: -50, max: 50, step: 1 },
  shadowY: { min: -50, max: 50, step: 1 },
  shadowBlur: { min: 0, max: 40, step: 1 },
  strokeWidth: { min: 0, max: 10, step: 0.5 },
};
export function clampText(f: TextNumField, v: unknown): number {
  const { min, max } = TEXT_LIMITS[f];
  if (f === 'strokeWidth') return clamp(Math.round((Number(v) || 0) * 2) / 2, min, max);
  return clamp(int(v), min, max);
}
export function clampSlideshow(f: 'interval' | 'duration', v: unknown): number {
  const n = parseInt(String(v), 10);
  if (f === 'interval') return clamp(Number.isFinite(n) ? n : 5, 1, 30);
  return clamp(Number.isFinite(n) ? n : 800, 0, 5000);
}

// ---- Aktionen auf mehreren Objekten -------------------------------------------
/** Design (Hell + Dunkel), Diashow-Takt und Text-Design übertragen; Text bleibt. */
export function copySectionDesign(src: SectionMediaCfg, dst: SectionMediaCfg): void {
  dst.style = { light: { ...src.style.light }, dark: { ...src.style.dark } };
  dst.slideshow = { ...src.slideshow };
  dst.text = { ...src.text, text: dst.text.text };
}

/** Diashow-Reihenfolge: Elemente i und i+dir tauschen; false = außerhalb. */
export function moveSlide(slides: string[], i: number, dir: -1 | 1): boolean {
  const j = i + dir;
  if (i < 0 || j < 0 || i >= slides.length || j >= slides.length) return false;
  [slides[i], slides[j]] = [slides[j]!, slides[i]!];
  return true;
}

/** Quellen der Vorschau-Diashow: Hauptbild + aufgelöste weitere Bilder. */
export function slideSources(
  main: ResolvedMedia | null,
  slides: string[],
  resolve: (v: string) => ResolvedMedia | null,
): string[] {
  if (!main || main.isVid) return [];
  return [main.src, ...slides.map((v) => (v ? resolve(v)?.src || '' : ''))].filter(Boolean);
}

/** Rückfrage-Texte (wie die Vanilla-confirm()-Texte). */
export const QUESTION = {
  resetAll: (mode: ThemeMode) =>
    `Design (${MODE_LABEL[mode]}) der Sektion auf Standard zurücksetzen?`,
  applyAll: (mode: ThemeMode, key: SectionKey) =>
    `${MODE_LABEL[mode]}-Design von „${SECTION_LABEL[key]}“ für alle Sektionen übernehmen? Das ${MODE_LABEL[mode]}-Design von ${SECTION_KEYS.filter(
      (k) => k !== key,
    )
      .map((k) => SECTION_LABEL[k])
      .join(' und ')} wird ersetzt.`,
  copyLang: (key: SectionKey, to: Lang) =>
    `Design (Hell + Dunkel), Diashow-Einstellungen und Text-Design der Sektion „${SECTION_LABEL[key]}“ nach ${to === 'de' ? 'Deutsch' : 'English'} übertragen? Medium, Bilder und Text bleiben.`,
  clearSlides: 'Alle weiteren Bilder aus der Diashow entfernen?',
};
