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
/** Farbsatz des Laufbands für einen Modus (Hell oder Dunkel). */
export interface TickerColorSet {
  textColor: string; // Hex
  bgColor: string; // Hex
  bgOpacity: number; // 0–100 (%)
}
/**
 * Admin-einstellbares Aussehen des Laufbands. enabled=false -> Standard-Design.
 * Typografie gilt für beide Modi; die Farben sind getrennt nach Hell/Dunkel.
 */
export interface TickerStyle {
  enabled: boolean;
  fontSize: number; // px (geteilt)
  fontFamily: string; // Dateiname im /fonts-Ordner; leer = Standardschrift (geteilt)
  letterSpacing: number; // px (geteilt)
  light: TickerColorSet; // Farben für Hellmodus
  dark: TickerColorSet; // Farben für Dunkelmodus
}
export interface TickerConfig {
  enabled: boolean;
  speed: 'slow' | 'normal' | 'fast';
  items: TickerItem[];
  style?: TickerStyle;
}

// Standard-Farben je Modus (entsprechen dem eingebauten Aussehen in TickerBar.astro).
const TICKER_LIGHT_DEFAULT: TickerColorSet = {
  textColor: '#ffffff',
  bgColor: '#014f99',
  bgOpacity: 100,
};
const TICKER_DARK_DEFAULT: TickerColorSet = {
  textColor: '#e2e8f0',
  bgColor: '#111827',
  bgOpacity: 100,
};
const TICKER_FONT_FILE = /^[a-zA-Z0-9][a-zA-Z0-9._ -]*\.(woff2|woff|ttf|otf)$/i;
const TICKER_HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Normalisiert das (evtl. veraltete) Laufband-Design auf die neue Struktur mit
 * getrennten Farb-Sätzen light/dark. Die alte flache Struktur (Farben oben, für
 * beide Modi gleich) wird auf beide Modi übernommen — verhaltensneutral.
 */
export function normalizeTickerStyle(raw: unknown): TickerStyle {
  const s: Record<string, unknown> = isPlainObject(raw) ? raw : {};
  const hasSides = isPlainObject(s.light) || isPlainObject(s.dark);
  const flat: Record<string, unknown> | null =
    !hasSides && (typeof s.textColor === 'string' || typeof s.bgColor === 'string') ? s : null;
  const int = (v: unknown, min: number, max: number, d: number): number => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : d;
  };
  const spacing = (v: unknown, d: number): number => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(-5, Math.min(20, Math.round(n * 2) / 2)) : d;
  };
  const colors = (side: unknown, def: TickerColorSet): TickerColorSet => {
    const o: Record<string, unknown> = isPlainObject(side) ? side : flat ?? {};
    const hex = (v: unknown, d: string) => (TICKER_HEX.test(String(v)) ? String(v) : d);
    return {
      textColor: hex(o.textColor, def.textColor),
      bgColor: hex(o.bgColor, def.bgColor),
      bgOpacity: int(o.bgOpacity, 0, 100, def.bgOpacity),
    };
  };
  const font = typeof s.fontFamily === 'string' && TICKER_FONT_FILE.test(s.fontFamily.trim())
    ? s.fontFamily.trim()
    : '';
  return {
    enabled: s.enabled === true,
    fontSize: int(s.fontSize, 8, 48, 14),
    fontFamily: font,
    letterSpacing: spacing(s.letterSpacing, 0),
    light: colors(s.light, TICKER_LIGHT_DEFAULT),
    dark: colors(s.dark, TICKER_DARK_DEFAULT),
  };
}

/** Laufband-Konfiguration für eine Sprache (mit vollständig aufgefülltem style). */
export function getTicker(locale: Locale): TickerConfig {
  // Die JSON-Dateien können noch die alte flache style-Struktur enthalten; daher
  // erst über unknown casten und den style anschließend normalisieren/migrieren.
  const raw = (locale === 'en' ? enTicker : deTicker) as unknown as TickerConfig;
  return { ...raw, style: normalizeTickerStyle((raw as { style?: unknown }).style) };
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
  // Optionaler Text über dem Banner + Schriftart, Farbe, Größe, Position.
  heroBannerText: string;
  heroBannerFont: string;
  heroBannerTextColor: string;
  heroBannerTextSize: number;
  heroBannerTextPos: 'top' | 'center' | 'bottom';
  // Freie Position des Banner-Textes in % (per Maus im Admin ziehbar).
  heroBannerTextX: number;
  heroBannerTextY: number;
  // Textschatten (an/aus + Farbe + Weichzeichnung), Umriss (Kontur) und Deckkraft
  // des Banner-Textes – im Admin unter „Banner-Text" einstellbar.
  heroBannerTextShadow: boolean;
  heroBannerTextShadowColor: string;
  heroBannerTextShadowX: number;
  heroBannerTextShadowY: number;
  heroBannerTextShadowBlur: number;
  heroBannerTextStrokeColor: string;
  heroBannerTextStrokeWidth: number;
  heroBannerTextOpacity: number;
  // Pulsierende Animation (zuschaltbar) + Intensität (1–10, steuert die Amplitude).
  heroBannerTextPulse: boolean;
  heroBannerTextPulseIntensity: number;
  // Option 2: bis zu sechs Bilder fürs Raster + gewähltes Seitenverhältnis.
  heroGrid: string[];
  // Verlinkung der Rasterbilder (interner Pfad oder http(s)). Leer = nicht klickbar.
  heroGridLinks: string[];
  // Per-Kachel-Design: Rahmen (Farbe/Dicke) + Hintergrund (Farbe/Transparenz).
  heroGridStyles: HeroCellStyle[];
  // „Standard für alle Kacheln": übernimmt Werte der Master-Kachel für alle.
  heroGridUniform: boolean;
  heroGridUniformCell: number;
  heroGridRatio: '1:1' | '16:9' | '2:3';
  // 'cover' = auf Format zuschneiden, 'contain' = ganzes Bild zeigen (mit Rand).
  heroGridFit: 'cover' | 'contain';
  // Größe/Farbe/Schrift einzelner Text-Slots aus dem „Texte"-Tab (Schlüssel = i18n-Key).
  // Farbe getrennt nach Hell/Dunkel (colorLight/colorDark); `color` nur noch als
  // Alt-Format für die Migration.
  textStyles: Record<
    string,
    { size: number; colorLight?: string; colorDark?: string; color?: string; font?: string }
  >;
  // „Standard für alle Slots": Stil des gewählten Slots gilt für alle.
  textStyleUniform?: boolean;
  textStyleUniformKey?: string;
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
  textColor: string; // Hex – Textfarbe
  textSize: number; // px – Schriftgröße (0 = automatisch)
  textPos: 'top' | 'center' | 'bottom'; // Alt: vertikale Position (nur Migration)
  textX: number; // Freie Position in % (0=links … 100=rechts), per Maus ziehbar
  textY: number; // Freie Position in % (0=oben … 100=unten)
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
  ctaBgOpacity: number; // 0–100 (%) – Transparenz des CTA-Hintergrunds
  ctaTextColor: string; // Hex – Schriftfarbe des CTA-Buttons
  ctaBorderColor: string; // Hex – Rahmenfarbe des CTA-Buttons
  ctaBorderOpacity: number; // 0–100 (%) – Transparenz der CTA-Rahmenfarbe (0 = kein Rahmen)
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
  heroBannerTextColor: '#ffffff',
  heroBannerTextSize: 0,
  heroBannerTextPos: 'center',
  heroBannerTextX: 50,
  heroBannerTextY: 50,
  heroBannerTextShadow: true,
  heroBannerTextShadowColor: '#000000',
  heroBannerTextShadowX: 0,
  heroBannerTextShadowY: 2,
  heroBannerTextShadowBlur: 6,
  heroBannerTextStrokeColor: '#000000',
  heroBannerTextStrokeWidth: 0,
  heroBannerTextOpacity: 100,
  heroBannerTextPulse: false,
  heroBannerTextPulseIntensity: 5,
  heroGrid: ['', '', '', '', '', ''],
  heroGridLinks: ['', '', '', '', '', ''],
  heroGridStyles: Array.from({ length: 6 }, () => ({
    borderColor: '#014f99',
    borderWidth: 0,
    bgColor: '#014f99',
    bgOpacity: 8,
    text: '',
    font: '',
    textColor: '#ffffff',
    textSize: 0,
    textPos: 'center' as const,
    textX: 50,
    textY: 50,
  })),
  heroGridUniform: false,
  heroGridUniformCell: 0,
  heroGridRatio: '1:1',
  heroGridFit: 'cover',
  textStyles: {},
  textStyleUniform: false,
  textStyleUniformKey: 'hero.title',
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
      ctaBgOpacity: 100,
      ctaTextColor: '#ffffff',
      ctaBorderColor: '#ffffff',
      ctaBorderOpacity: 0,
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
      ctaBgOpacity: 100,
      ctaTextColor: '#ffffff',
      ctaBorderColor: '#ffffff',
      ctaBorderOpacity: 0,
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

// Eigenschaften, die „Standard für alle Kacheln" von der Master-Kachel übernimmt.
const CELL_SYNC_PROPS = [
  'borderColor',
  'borderWidth',
  'bgColor',
  'bgOpacity',
  'font',
  'textSize',
  'textColor',
  'textX',
  'textY',
] as const;
/**
 * Effektiver Style einer Raster-Kachel: bei aktivem „Standard für alle Kacheln"
 * werden die synchronisierten Eigenschaften von der Master-Kachel übernommen;
 * der eigene Text bleibt je Kachel erhalten.
 */
export function effectiveHeroCellStyle(media: MediaConfig, i: number): HeroCellStyle {
  const styles = media.heroGridStyles || [];
  const base = styles[i];
  if (!media.heroGridUniform) return base;
  const master = styles[media.heroGridUniformCell] || base;
  const out: HeroCellStyle = { ...base };
  for (const p of CELL_SYNC_PROPS) (out[p] as HeroCellStyle[typeof p]) = master[p];
  return out;
}

// Schrift-Helfer für die Text-Slots (Dateiname -> Family-Name + @font-face).
const TEXT_FONT_FILE = /^[a-zA-Z0-9][a-zA-Z0-9._ -]*\.(woff2|woff|ttf|otf)$/i;
function textFontId(file: string): string {
  return 'kodini-font-' + file.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]+/g, '-');
}
function textFontFaceCss(file: string): string {
  const ext = (file.split('.').pop() || '').toLowerCase();
  const fmt =
    ({ woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' } as Record<string, string>)[
      ext
    ] || '';
  const src = `url("/fonts/${encodeURIComponent(file)}")${fmt ? ` format("${fmt}")` : ''}`;
  return `@font-face{font-family:"${textFontId(file)}";src:${src};font-display:swap;}`;
}

// CSS-Selektor je Text-Slot. Alle Slots außer dem Hero-Titel (wird per
// Tipp-Animation gefüllt) sind über ihr data-i18n-Attribut erreichbar.
const TEXT_STYLE_SELECTORS: Record<string, string> = {
  'hero.title': '#app .hero-title',
  'hero.subtitle': '#app [data-i18n="hero.subtitle"]',
  'hero.cta': '#app [data-i18n="hero.cta"]',
  'tools.sectionTitle': '#app [data-i18n="tools.sectionTitle"]',
  'imageTools.sectionTitle': '#app [data-i18n="imageTools.sectionTitle"]',
  'diverseTools.sectionTitle': '#app [data-i18n="diverseTools.sectionTitle"]',
};

/**
 * CSS für die im „Texte"-Tab gesetzten Größen/Farben einzelner Text-Slots.
 * Gibt `undefined` zurück, wenn nichts eingestellt ist (dann bleibt der Standard).
 * Mehrzeilige Texte werden über white-space:pre-line umgebrochen.
 */
export function getTextStylesCss(media: MediaConfig): string | undefined {
  const ts = media.textStyles;
  if (!ts) return undefined;
  // „Standard für alle Slots": Stil des gewählten Slots gilt für jeden Slot.
  const uniform = media.textStyleUniform === true;
  const master = uniform ? ts[media.textStyleUniformKey || ''] : undefined;
  // Zeilenumbrüche in allen Text-Slots respektieren (mehrzeilige Texte).
  const rules: string[] = [
    `${Object.values(TEXT_STYLE_SELECTORS).join(',')}{white-space:pre-line}`,
  ];
  const faces = new Set<string>();
  const isHex = (v: unknown): v is string => /^#[0-9a-fA-F]{3,6}$/.test(String(v ?? ''));
  // -webkit-text-fill-color überschreibt auch Verlaufs-Überschriften.
  const colorDecl = (c: string) => `color:${c};-webkit-text-fill-color:${c};background:none`;
  for (const [key, sel] of Object.entries(TEXT_STYLE_SELECTORS)) {
    const s = uniform ? master : ts[key];
    if (!s) continue;
    // Migration: altes einzelnes color gilt für beide Modi.
    const legacy = isHex(s.color) ? s.color : '';
    const light = isHex(s.colorLight) ? s.colorLight : legacy;
    const dark = isHex(s.colorDark) ? s.colorDark : legacy;
    // Basis-Regel: geteilte Größe + Schrift + Hell-Farbe.
    const decl: string[] = [];
    if (typeof s.size === 'number' && s.size > 0) decl.push(`font-size:${s.size}px`);
    const font = (s.font || '').trim();
    if (font && TEXT_FONT_FILE.test(font)) {
      faces.add(textFontFaceCss(font));
      decl.push(`font-family:"${textFontId(font)}", var(--site-font)`);
    }
    if (light) decl.push(colorDecl(light));
    if (decl.length) rules.push(`${sel}{${decl.join(';')}}`);
    // Dunkelmodus-Farbe (höhere Spezifität durch [data-theme="dark"]).
    if (dark) rules.push(`[data-theme="dark"] ${sel}{${colorDecl(dark)}}`);
  }
  return [...faces].join('') + rules.join('');
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
  // Seiten-Hintergrundfarbe für Hell-/Dunkelmodus (Hex; leer = Standardfarbe des
  // jeweiligen Modus). Wird im Admin im Tab „Hintergrund" gesetzt, gilt global.
  bgColor: string;
  bgColorDark: string;
}

const SITE_DEFAULTS: SiteConfig = { globalFont: '', bgColor: '', bgColorDark: '' };

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

// Gültige Hex-Farbe (#rgb oder #rrggbb).
const SITE_HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * CSS zum Überschreiben der Seiten-Hintergrundfarbe (CSS-Variable --bg-color),
 * getrennt für Hell- und Dunkelmodus. Gibt `undefined` zurück, wenn keine
 * (gültige) Farbe gesetzt ist – dann bleibt die Standardfarbe aus global.css.
 * Die Selektoren `html:root` bzw. `html[data-theme="dark"]` haben höhere
 * Spezifität als die Standardregeln (:root / [data-theme="dark"]) und gewinnen
 * unabhängig von der Reihenfolge. Wird von allen Layouts im <head> eingebunden.
 */
export function getSiteBackgroundStyle(): string | undefined {
  const site = getSite();
  const rules: string[] = [];
  if (SITE_HEX.test(site.bgColor || '')) rules.push(`html:root{--bg-color:${site.bgColor};}`);
  if (SITE_HEX.test(site.bgColorDark || ''))
    rules.push(`html[data-theme="dark"]{--bg-color:${site.bgColorDark};}`);
  return rules.length ? rules.join('') : undefined;
}
