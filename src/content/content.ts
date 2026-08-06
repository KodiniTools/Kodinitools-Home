// Zentrale Content-Schicht (Phase 2).
//
// Zwei Ebenen:
//   1. Standard-Werte  -> src/locales/de.json | en.json   (Entwickler-Hoheit)
//   2. Admin-Overrides -> src/content/overrides.de.json | overrides.en.json
//
// Beim Build werden die Overrides tief über die Standards gemergt. Solange die
// Override-Dateien leer ({}) sind, ist die Ausgabe identisch zu vorher.
// Der Adminbereich (Phase 3/4) schreibt ausschließlich in die overrides.*.json
// (und ticker.*.json) — die großen Locale-Dateien bleiben unangetastet.

import deLocale from '../locales/de.json';
import enLocale from '../locales/en.json';
import deOverrides from './overrides.de.json';
import enOverrides from './overrides.en.json';
import deTicker from './ticker.de.json';
import enTicker from './ticker.en.json';
import mediaOverrides from './media.json';

export type Locale = 'de' | 'en';

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Tiefes Mergen: Objekte werden rekursiv zusammengeführt, alle anderen Werte
 * (inkl. Arrays) vom Override vollständig ersetzt. `base` bleibt unverändert.
 */
function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined) return base;
  if (!isPlainObject(base) || !isPlainObject(override)) return override as T;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    out[key] = key in out ? deepMerge(out[key], value) : value;
  }
  return out as T;
}

const mergedDe = deepMerge(deLocale, deOverrides);
const mergedEn = deepMerge(enLocale, enOverrides);

/** Gemergte Inhalte (Standard + Admin-Override) für eine Sprache. */
export function getContent(locale: 'de'): typeof mergedDe;
export function getContent(locale: 'en'): typeof mergedEn;
export function getContent(locale: Locale) {
  return locale === 'en' ? mergedEn : mergedDe;
}

/** Fertig gemergte Nachrichten für die vue-i18n-Instanz (Client + SSR). */
export const messages = { de: mergedDe, en: mergedEn };

// --- Laufband / Ticker (neues, admin-editierbares Feature; Rendering in Phase 3b) ---

export interface TickerItem {
  id: string;
  text: string;
  link?: string;
}
/** Admin-einstellbares Aussehen des Laufbands. enabled=false -> Standard-Design. */
export interface TickerStyle {
  enabled: boolean;
  fontSize: number; // px
  textColor: string; // Hex
  bgColor: string; // Hex
  bgOpacity: number; // 0–100 (%)
  fontFamily: string; // Dateiname im /fonts-Ordner (z.B. "Chillax-Variable.woff2"); leer = Standardschrift
  letterSpacing: number; // Buchstabenabstand in px (0 = normal)
}
export interface TickerConfig {
  enabled: boolean;
  speed: 'slow' | 'normal' | 'fast';
  items: TickerItem[];
  style?: TickerStyle;
}

const TICKER_STYLE_DEFAULTS: TickerStyle = {
  enabled: false,
  fontSize: 14,
  textColor: '#ffffff',
  bgColor: '#014f99',
  bgOpacity: 100,
  fontFamily: '',
  letterSpacing: 0,
};

/** Laufband-Konfiguration für eine Sprache (mit vollständig aufgefülltem style). */
export function getTicker(locale: Locale): TickerConfig {
  const raw = (locale === 'en' ? enTicker : deTicker) as TickerConfig;
  return { ...raw, style: { ...TICKER_STYLE_DEFAULTS, ...(raw.style ?? {}) } };
}

// --- Medien (pro Sprache; admin-editierbar über media.json) ---

export interface MediaConfig {
  sectionVideos: { audio: string; image: string; diverse: string };
  // Hero-Bereich: 'banner' = ein einzelnes Bild/Video, 'grid' = Kachel-Raster.
  heroMode: 'banner' | 'grid';
  // Anordnung der Kacheln im Raster-Modus.
  heroLayout: 'grid2' | 'grid3' | 'row4' | 'grid4' | 'grid6' | 'big2' | 'vrow' | 'mosaic';
  // Option 1: austauschbares Hero-Banner (Bild oder Video). Leer = kein Banner.
  heroBanner: string;
  // Verlinkung des Banners (interner Pfad oder http(s)). Leer = nicht klickbar.
  heroBannerLink: string;
  // Optionaler Text über dem Banner + dessen Schriftart (Dateiname im /fonts-Ordner).
  heroBannerText: string;
  heroBannerFont: string;
  // Option 2: bis zu sechs Bilder fürs Raster + gewähltes Seitenverhältnis.
  heroGrid: string[];
  // Verlinkung der Rasterbilder (interner Pfad oder http(s)). Leer = nicht klickbar.
  heroGridLinks: string[];
  // Per-Kachel-Design: Rahmen (Farbe/Dicke) + Hintergrund (Farbe/Transparenz).
  heroGridStyles: HeroCellStyle[];
  heroGridRatio: '1:1' | '16:9' | '2:3';
  // 'cover' = auf Format zuschneiden, 'contain' = ganzes Bild zeigen (mit Rand).
  heroGridFit: 'cover' | 'contain';
  // Admin-einstellbares Design des Hero-Bereichs (Rahmen/Hintergrund/Buttons).
  heroDesign: HeroDesign;
}

/** Rahmen + Hintergrund + optionaler Text einer einzelnen Raster-Kachel. */
export interface HeroCellStyle {
  borderColor: string; // Hex – Rahmenfarbe der Kachel
  borderWidth: number; // px – Rahmendicke (0 = kein Rahmen)
  bgColor: string; // Hex – Hintergrundfarbe
  bgOpacity: number; // 0–100 (%) – Transparenz des Hintergrunds
  text: string; // Standardtext über dem Bild / im leeren Kasten (leer = keiner)
  font: string; // Schriftart des Textes (Dateiname im /fonts-Ordner; leer = Standard)
}

/** Ein Farb-Satz des Hero-Bereichs (für Hell- bzw. Dunkelmodus getrennt). */
export interface HeroDesignSide {
  borderColor: string; // Hex – Rahmenfarbe des Hero-Kastens
  borderWidth: number; // px
  bgColor: string; // Hex – Hintergrundfarbe
  bgOpacity: number; // 0–100 (%)
  chipBgColor: string; // Hex – Hintergrund der Buttons (Feature-Chips)
  chipBgOpacity: number; // 0–100 (%)
  chipTextColor: string; // Hex – Schriftfarbe der Buttons
  chipBorderColor: string; // Hex – Rahmenfarbe der Buttons
  chipBorderOpacity: number; // 0–100 (%)
  chipHoverBgColor: string; // Hex – Hintergrund der Buttons beim Überfahren
  chipHoverTextColor: string; // Hex – Schriftfarbe der Buttons beim Überfahren
  ctaBgColor: string; // Hex – Hintergrund des CTA-Buttons ("Jetzt starten")
  ctaTextColor: string; // Hex – Schriftfarbe des CTA-Buttons
  ctaHoverBgColor: string; // Hex – Hintergrund des CTA-Buttons beim Überfahren
  ctaHoverTextColor: string; // Hex – Schriftfarbe des CTA-Buttons beim Überfahren
  titleTextColor: string; // Hex – Textfarbe der Überschriften (Titel + Untertitel)
}

/**
 * Aussehen des Hero-Bereichs, getrennt für Hell- und Dunkelmodus.
 * enabled=false -> Standard-Design (global.css).
 */
export interface HeroDesign {
  enabled: boolean;
  // Eigene Schriften (Dateiname im /fonts-Ordner; leer = Standard), für beide Modi.
  titleFont: string; // Überschriften (Hero-Titel/Untertitel)
  buttonFont: string; // Feature-Chips + CTA-Button
  // Typografie (für beide Modi): Buchstabenabstand + Buchstaben-Kontur (Rahmen).
  titleLetterSpacing: number; // px (Überschriften)
  titleStrokeColor: string; // Hex – Konturfarbe der Überschriften
  titleStrokeWidth: number; // px – Konturbreite (0 = keine)
  buttonLetterSpacing: number; // px (Buttons)
  buttonStrokeColor: string; // Hex – Konturfarbe der Buttons
  buttonStrokeWidth: number; // px – Konturbreite (0 = keine)
  // Schriftgrößen (0 = Standard) je Hero-Text.
  titleFontSize: number; // px – Titel
  subtitleFontSize: number; // px – Untertitel
  chipFontSize: number; // px – Feature-Chips
  ctaFontSize: number; // px – CTA-Button
  light: HeroDesignSide;
  dark: HeroDesignSide;
}

// Standard-Pfade entsprechen dem bisherigen Auslieferungszustand.
const MEDIA_DEFAULTS: MediaConfig = {
  sectionVideos: {
    audio: '/videos/audio-tools.mp4',
    image: '/videos/image-tools.mp4',
    diverse: '/videos/diverse-tools.mp4',
  },
  heroMode: 'banner',
  heroLayout: 'grid3',
  heroBanner: '',
  heroBannerLink: '',
  heroBannerText: '',
  heroBannerFont: '',
  heroGrid: ['', '', '', '', '', ''],
  heroGridLinks: ['', '', '', '', '', ''],
  heroGridStyles: Array.from({ length: 6 }, () => ({
    borderColor: '#014f99',
    borderWidth: 0,
    bgColor: '#014f99',
    bgOpacity: 8,
    text: '',
    font: '',
  })),
  heroGridRatio: '1:1',
  heroGridFit: 'cover',
  heroDesign: {
    enabled: false,
    titleFont: '',
    buttonFont: '',
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
    light: {
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
      ctaTextColor: '#ffffff',
      ctaHoverBgColor: '#003971',
      ctaHoverTextColor: '#ffffff',
      titleTextColor: '#003971',
    },
    dark: {
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
      ctaTextColor: '#ffffff',
      ctaHoverBgColor: '#a07030',
      ctaHoverTextColor: '#ffffff',
      titleTextColor: '#f9f2d5',
    },
  },
};

/**
 * Liefert den Admin-Override für eine Sprache. Unterstützt beide Formen von
 * media.json:
 *   - neu:  { de: {...}, en: {...} }  (pro Sprache getrennt)
 *   - alt:  { sectionVideos, heroBanner }  (sprachunabhängig -> beide Sprachen)
 */
function mediaOverrideFor(locale: Locale): unknown {
  const m = mediaOverrides as Record<string, unknown>;
  if (isPlainObject(m) && (isPlainObject(m.de) || isPlainObject(m.en))) {
    return m[locale];
  }
  return m; // alte, sprachunabhängige Struktur
}

/** Anzahl Bild-Kacheln je Hero-Raster-Layout. */
export const HERO_LAYOUT_CELLS: Record<MediaConfig['heroLayout'], number> = {
  grid2: 2,
  grid3: 3,
  row4: 4,
  grid4: 4,
  grid6: 6,
  big2: 2,
  vrow: 3,
  mosaic: 3,
};

/** Medien-Konfiguration für eine Sprache (Defaults + Admin-Override). */
export function getMedia(locale: Locale): MediaConfig {
  return deepMerge(MEDIA_DEFAULTS, mediaOverrideFor(locale));
}

// --- Globale (sprachübergreifende) Seiten-Einstellungen ---

export interface SiteConfig {
  // Basis-Schriftart der ganzen Seite (Dateiname im /fonts-Ordner; leer =
  // System-Standard). Wird im Admin per Kachel gesetzt und gilt für alle Sprachen.
  globalFont: string;
}

const SITE_DEFAULTS: SiteConfig = { globalFont: '' };

/**
 * Globale Seiten-Einstellungen aus media.json (`site`-Zweig, sprachübergreifend).
 * Fällt auf Standard zurück, wenn nicht gesetzt.
 */
export function getSite(): SiteConfig {
  const m = mediaOverrides as Record<string, unknown>;
  const site = isPlainObject(m) && isPlainObject(m.site) ? m.site : {};
  return deepMerge(SITE_DEFAULTS, site);
}

// System-Fallback-Stack, wenn die globale Schrift nicht lädt.
const SITE_FONT_FALLBACK =
  "'Supreme', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif";
const VALID_FONT_FILE = /^[a-zA-Z0-9][a-zA-Z0-9._ -]*\.(woff2|woff|ttf|otf)$/i;
function siteFontId(file: string): string {
  return 'kodini-font-' + file.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]+/g, '-');
}

/**
 * CSS zum Setzen der globalen Basis-Schrift der ganzen Seite (@font-face plus
 * Überschreiben der CSS-Variable --site-font). Gibt `undefined` zurück, wenn
 * keine (gültige) globale Schrift gesetzt ist – dann bleibt der Standard.
 * Wird von allen Layouts (BaseLayout, EnLayout, BlogArticleLayout) im <head>
 * eingebunden, damit die Schrift auf der GANZEN Website greift.
 */
export function getSiteFontStyle(): string | undefined {
  const file = getSite().globalFont;
  if (!file || !VALID_FONT_FILE.test(file)) return undefined;
  const ext = (file.split('.').pop() || '').toLowerCase();
  const fmt =
    ({ woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' } as Record<string, string>)[
      ext
    ] || '';
  const src = `url("/fonts/${encodeURIComponent(file)}")${fmt ? ` format("${fmt}")` : ''}`;
  const id = siteFontId(file);
  // html:root gewinnt gegen global.css :root (höhere Spezifität), unabhängig von der Reihenfolge.
  return `@font-face{font-family:"${id}";src:${src};font-display:swap;}html:root{--site-font:"${id}", ${SITE_FONT_FALLBACK};}`;
}
