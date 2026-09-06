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
  // Text-Animation (zuschaltbar): Typ, Intensität (1–10) und Tempo.
  heroBannerTextAnim: 'none' | 'pulse' | 'float' | 'shake' | 'wobble' | 'glow';
  heroBannerTextAnimIntensity: number;
  heroBannerTextAnimSpeed: 'slow' | 'normal' | 'fast';
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
  // Größe/Farbe/Schrift einzelner Text-Slots (Schlüssel = i18n-Key): Hero-Texte
  // aus dem Tab „Hero-Design" (hero.*), Abschnitts-Titel aus dem Tab „Texte".
  // Farbe getrennt nach Hell/Dunkel (colorLight/colorDark); `color` nur noch als
  // Alt-Format für die Migration.
  textStyles: Record<
    string,
    {
      size: number;
      colorLight?: string;
      colorDark?: string;
      color?: string;
      font?: string;
      // Effekte (analog Banner-Text): Schatten, Umriss, Deckkraft, Animation.
      shadow?: boolean;
      shadowColor?: string;
      shadowX?: number;
      shadowY?: number;
      shadowBlur?: number;
      strokeColor?: string;
      strokeWidth?: number;
      opacity?: number;
      anim?: 'none' | 'pulse' | 'float' | 'shake' | 'wobble' | 'glow';
      animIntensity?: number;
      animSpeed?: 'slow' | 'normal' | 'fast';
    }
  >;
  // „Standard für alle Slots" (nur Texte-Tab): Stil des gewählten Abschnitts-
  // Titels gilt für alle Abschnitts-Titel; Hero-Slots sind ausgenommen.
  textStyleUniform?: boolean;
  textStyleUniformKey?: string;
  // Admin-einstellbares Design des Hero-Bereichs (Rahmen/Hintergrund/Buttons).
  heroDesign: HeroDesign;
  // Admin-einstellbares Design der Tool-Karten (Rahmen/Hintergrund), Standard
  // für alle Karten + optionale Einzel-Designs je Karte (Tab „Tool-Karten").
  toolCards: ToolCardsConfig;
  // Icon-Färbung je Tool-Karte (Tab „Icons"): Icon einfarbig per CSS-Maske
  // (light/dark) und/oder Kasten-Hintergrund (bg/bgDark); '' = unverändert.
  iconTint: Record<string, Partial<IconTint>>;
}
export interface IconTint {
  light: string;
  dark: string;
  bg: string;
  bgDark: string;
}

/** Rahmen + Hintergrund einer Tool-Karte für EINEN Modus (Hell oder Dunkel). */
export interface ToolCardSide {
  borderColor: string; // Hex – Rahmenfarbe
  borderOpacity: number; // 0–100 (%) – Transparenz der Rahmenfarbe
  borderWidth: number; // px – Rahmendicke (0 = kein Rahmen)
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'double'; // Linienart
  borderRadius: number; // px – Eckenradius
  bgColor: string; // Hex – Hintergrundfarbe (bei Verlauf: Startfarbe)
  bgOpacity: number; // 0–100 (%) – Transparenz des Hintergrunds
  gradient: boolean; // Farbverlauf statt einfarbig?
  bgColor2: string; // Hex – Endfarbe des Verlaufs
  gradientAngle: number; // 0–360 (Grad) – Richtung des Verlaufs
  hoverBorderColor: string; // Hex – Rahmenfarbe beim Überfahren
  hoverBorderOpacity: number; // 0–100 (%)
  hoverBgColor: string; // Hex – Hintergrund beim Überfahren
  hoverBgOpacity: number; // 0–100 (%); 0 = Hintergrund bleibt beim Überfahren unverändert
  // Text-Farben je Modus ('' = Standard der Seite): Titel, Badge (Text/Hintergrund
  // + Transparenz), „Öffnen"-Link, Popup-Beschreibung (Text/Hintergrund).
  titleColor?: string;
  badgeColor?: string;
  badgeBgColor?: string;
  badgeBgOpacity?: number;
  openColor?: string;
  descColor?: string;
  descBgColor?: string;
  // Hintergrundbild der Karte je Modus (Ebene unter dem Inhalt): URL aus der
  // Mediathek, Deckkraft (%) und Abdunkelung (%); '' = kein Bild.
  bgImage?: string;
  bgImageOpacity?: number;
  bgImageDarken?: number;
}
/** Typografie der Karten-Texte (gilt für Hell + Dunkel); 0 / '' = Standard der Seite. */
export interface ToolCardText {
  titleFont: string; // Schriftdatei aus /fonts
  titleSize: number; // px
  titleWeight: string; // '' | '400' … '800'
  titleSpacing: number; // px Buchstabenabstand
  titleTransform: string; // '' | none | uppercase | capitalize
  textFont: string; // Schrift für Badge, „Öffnen" und Popup
  badgeSize: number;
  badgeWeight: string;
  badgeTransform: string;
  openSize: number;
  openWeight: string;
  descSize: number;
}

/** Design einer Karte bzw. der Standard-Karte: getrennt Hell/Dunkel. */
export interface ToolCardStyle {
  light: ToolCardSide;
  dark: ToolCardSide;
  text?: ToolCardText;
}
const TOOL_CARD_TEXT_DEFAULT: ToolCardText = { titleFont: '', titleSize: 0, titleWeight: '', titleSpacing: 0, titleTransform: '', textFont: '', badgeSize: 0, badgeWeight: '', badgeTransform: '', openSize: 0, openWeight: '', descSize: 0 };
const TOOL_CARD_WEIGHTS: readonly string[] = ['', '400', '500', '600', '700', '800'];
const TOOL_CARD_TRANSFORMS: readonly string[] = ['', 'none', 'uppercase', 'capitalize'];

/**
 * Tool-Karten-Design. enabled=false -> Standard-Aussehen aus tool-cards.css.
 * `default` gilt für alle Karten; `cards` enthält Einzel-Designs je Karte
 * (Schlüssel = i18n-Key der Karte, z. B. "tools.audioCutter").
 */
export interface ToolCardsConfig {
  enabled: boolean;
  default: ToolCardStyle;
  cards: Record<string, ToolCardStyle>;
}

// Standard-Werte je Modus – entsprechen exakt dem eingebauten Aussehen in
// tool-cards.css (Rahmen 1px --border-color, Hintergrund --bg-secondary bzw.
// --card-bg, Radius 1rem, Hover-Rahmen Blau/Gold 22 %), sodass ein aktiviertes
// Design mit Standardwerten verhaltensneutral bleibt.
const TOOL_CARD_LIGHT_DEFAULT: ToolCardSide = {
  borderColor: '#e5e7eb',
  borderOpacity: 100,
  borderWidth: 1,
  borderStyle: 'solid',
  borderRadius: 16,
  bgColor: '#ffffff',
  bgOpacity: 100,
  gradient: false,
  bgColor2: '#f1f5f9',
  gradientAngle: 135,
  hoverBorderColor: '#014f99',
  hoverBorderOpacity: 22,
  hoverBgColor: '#ffffff',
  hoverBgOpacity: 0,
  titleColor: '',
  badgeColor: '',
  badgeBgColor: '',
  badgeBgOpacity: 100,
  openColor: '',
  descColor: '',
  descBgColor: '',
  bgImage: '',
  bgImageOpacity: 100,
  bgImageDarken: 0,
};
const TOOL_CARD_DARK_DEFAULT: ToolCardSide = {
  borderColor: '#1d3a5c',
  borderOpacity: 100,
  borderWidth: 1,
  borderStyle: 'solid',
  borderRadius: 16,
  bgColor: '#142640',
  bgOpacity: 100,
  gradient: false,
  bgColor2: '#0e1c32',
  gradientAngle: 135,
  hoverBorderColor: '#e8a945',
  hoverBorderOpacity: 22,
  hoverBgColor: '#142640',
  hoverBgOpacity: 0,
  titleColor: '',
  badgeColor: '',
  badgeBgColor: '',
  badgeBgOpacity: 100,
  openColor: '',
  descColor: '',
  descBgColor: '',
  bgImage: '',
  bgImageOpacity: 100,
  bgImageDarken: 0,
};

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
  // Bildbearbeitung des Kachel-Mediums (im Admin: Layout-Tab, u. a. per
  // Zwischenablage eingefügt). Fehlende Werte = Standard (Bild unverändert).
  imgOpacity?: number; // 0–100 (%) – Deckkraft des Bildes (100 = deckend)
  imgDarken?: number; // 0–100 (%) – Abdunkelung (0 = keine)
  imgBlur?: number; // 0–20 px – Weichzeichner (0 = aus)
  imgSaturate?: number; // 0–200 (%) – Sättigung (100 = Original, 0 = Graustufen)
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
  heroBannerTextAnim: 'none',
  heroBannerTextAnimIntensity: 5,
  heroBannerTextAnimSpeed: 'normal',
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
    imgOpacity: 100,
    imgDarken: 0,
    imgBlur: 0,
    imgSaturate: 100,
  })),
  heroGridUniform: false,
  heroGridUniformCell: 0,
  heroGridRatio: '1:1',
  heroGridFit: 'cover',
  textStyles: {},
  textStyleUniform: false,
  textStyleUniformKey: 'tools.sectionTitle',
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
  toolCards: {
    enabled: false,
    default: {
      light: { ...TOOL_CARD_LIGHT_DEFAULT },
      dark: { ...TOOL_CARD_DARK_DEFAULT },
      text: { ...TOOL_CARD_TEXT_DEFAULT },
    },
    cards: {},
  },
  iconTint: {},
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
  'imgOpacity',
  'imgDarken',
  'imgBlur',
  'imgSaturate',
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

/**
 * Bildbearbeitung einer Raster-Kachel (Deckkraft, Abdunkelung, Weichzeichner,
 * Sättigung) als CSS-Variablen für `.hero-grid-cell` (siehe hero.css). Leerer
 * String bei Standardwerten, damit unveränderte Seiten identisch bleiben.
 */
export function heroCellImageVars(cs: HeroCellStyle | null | undefined): string {
  if (!cs) return '';
  const num = (v: unknown, min: number, max: number, def: number): number => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def;
  };
  const opacity = num(cs.imgOpacity, 0, 100, 100);
  const darken = num(cs.imgDarken, 0, 100, 0);
  const blur = num(cs.imgBlur, 0, 20, 0);
  const saturate = num(cs.imgSaturate, 0, 200, 100);
  const out: string[] = [];
  if (opacity < 100) out.push(`--cell-img-opacity:${(opacity / 100).toFixed(2)}`);
  const f: string[] = [];
  if (blur > 0) f.push(`blur(${blur}px)`);
  if (darken > 0) f.push(`brightness(${((100 - darken) / 100).toFixed(2)})`);
  if (saturate !== 100) f.push(`saturate(${saturate}%)`);
  if (f.length) out.push(`--cell-img-filter:${f.join(' ')}`);
  // Weichzeichner franst am Rand aus -> Medium etwas über den Rand hinaus vergrößern.
  if (blur > 0) out.push(`--cell-img-inset:-${blur * 2}px`);
  return out.join(';');
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
// Tempo (Animationsdauer) je Geschwindigkeitsstufe – identisch zum Banner-Text.
const TEXT_ANIM_DUR: Record<string, string> = { slow: '2.6s', normal: '1.8s', fast: '1s' };
// Hex (#rgb/#rrggbb) -> rgba() mit fester Deckkraft (für den Textschatten).
function textHexToRgba(hex: string, alpha: number): string {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec((hex || '').trim());
  if (!m) return `rgba(0, 0, 0, ${alpha})`;
  let h = m[1];
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
// Effekt-CSS-Deklarationen (Deckkraft, Umriss, Schatten, Animation) eines Text-Slots.
// Analog zum Banner-Text; `none`/Standardwerte erzeugen nichts (kein Regress).
function textFxDecls(s: MediaConfig['textStyles'][string]): string[] {
  const isHex = (v: unknown): v is string => /^#[0-9a-fA-F]{3,6}$/.test(String(v ?? ''));
  const decl: string[] = [];
  const strokeW = typeof s.strokeWidth === 'number' ? s.strokeWidth : 0;
  if (strokeW > 0)
    decl.push(`-webkit-text-stroke:${strokeW}px ${isHex(s.strokeColor) ? s.strokeColor : '#000000'}`);
  if (s.shadow === true) {
    const sc = isHex(s.shadowColor) ? s.shadowColor : '#000000';
    const sx = typeof s.shadowX === 'number' ? s.shadowX : 0;
    const sy = typeof s.shadowY === 'number' ? s.shadowY : 2;
    const sb = typeof s.shadowBlur === 'number' ? s.shadowBlur : 6;
    decl.push(`text-shadow:${sx}px ${sy}px ${sb}px ${textHexToRgba(sc, 0.6)}`);
  }
  const anim = s.anim && s.anim !== 'none' ? s.anim : '';
  if (anim) {
    const it = Math.max(1, Math.min(10, typeof s.animIntensity === 'number' ? s.animIntensity : 5));
    const dur = TEXT_ANIM_DUR[s.animSpeed || 'normal'] || '1.8s';
    decl.push(`animation:kodini-banner-${anim} ${dur} ease-in-out infinite`);
    if (anim === 'pulse') decl.push(`--anim-scale:${(1 + it * 0.02).toFixed(3)}`);
    else if (anim === 'float' || anim === 'shake') decl.push(`--anim-shift:${it}px`);
    else if (anim === 'wobble') decl.push(`--anim-rot:${it}deg`);
    else if (anim === 'glow') decl.push(`--anim-glow:${it * 2}px`);
  }
  // Deckkraft: <100 explizit; bei aktiver Animation opacity:1 erzwingen, weil die
  // Loop-Animation den Entrance ersetzt und manche Slots mit opacity:0 starten.
  const op = typeof s.opacity === 'number' ? s.opacity : 100;
  if (op < 100) decl.push(`opacity:${op / 100}`);
  else if (anim) decl.push('opacity:1');
  return decl;
}
const TEXT_STYLE_SELECTORS: Record<string, string> = {
  'hero.title': '#app .hero-title',
  'hero.subtitle': '#app [data-i18n="hero.subtitle"]',
  'hero.cta': '#app [data-i18n="hero.cta"]',
  'tools.sectionTitle': '#app [data-i18n="tools.sectionTitle"]',
  'imageTools.sectionTitle': '#app [data-i18n="imageTools.sectionTitle"]',
  'diverseTools.sectionTitle': '#app [data-i18n="diverseTools.sectionTitle"]',
};
// Slots des Tabs „Texte" – nur für diese gilt „Standard für alle Slots". Die
// Hero-Slots (hero.*, Tab „Hero-Design") nutzen immer ihren eigenen Stil.
const UNIFORM_TEXT_KEYS: readonly string[] = [
  'tools.sectionTitle',
  'imageTools.sectionTitle',
  'diverseTools.sectionTitle',
];

/**
 * CSS für die in den Tabs „Hero-Design" (hero.*) und „Texte" gesetzten
 * Größen/Farben/Schriften/Effekte einzelner Text-Slots.
 * Gibt `undefined` zurück, wenn nichts eingestellt ist (dann bleibt der Standard).
 * Mehrzeilige Texte werden über white-space:pre-line umgebrochen.
 */
export function getTextStylesCss(media: MediaConfig): string | undefined {
  const ts = media.textStyles;
  if (!ts) return undefined;
  // „Standard für alle Slots": Stil des gewählten Abschnitts-Titels gilt für alle
  // Abschnitts-Titel (nicht für die Hero-Slots).
  const uniform = media.textStyleUniform === true;
  // Ungültiger/alter Master-Schlüssel (z. B. ein Hero-Slot) fällt – wie in der
  // Admin-Validierung – auf den ersten Abschnitts-Titel zurück.
  const rawKey = media.textStyleUniformKey || '';
  const masterKey = UNIFORM_TEXT_KEYS.includes(rawKey) ? rawKey : UNIFORM_TEXT_KEYS[0];
  const master = uniform ? ts[masterKey] : undefined;
  // Zeilenumbrüche in allen Text-Slots respektieren (mehrzeilige Texte).
  const rules: string[] = [
    `${Object.values(TEXT_STYLE_SELECTORS).join(',')}{white-space:pre-line}`,
  ];
  const faces = new Set<string>();
  const isHex = (v: unknown): v is string => /^#[0-9a-fA-F]{3,6}$/.test(String(v ?? ''));
  // -webkit-text-fill-color überschreibt auch Verlaufs-Überschriften.
  const colorDecl = (c: string) => `color:${c};-webkit-text-fill-color:${c};background:none`;
  // Hell-Farbe nur ohne Dunkelmodus (GlobalNav setzt data-theme; ohne Attribut
  // gilt Hell). Sonst würde eine Hell-Farbe ohne gesetzte Dunkel-Farbe auch im
  // Dunkelmodus gelten und dort z. B. die Hero-Design-Farbe überdecken.
  const lightSel = (sel: string) => `:root:not([data-theme="dark"]) ${sel}`;
  for (const [key, sel] of Object.entries(TEXT_STYLE_SELECTORS)) {
    const s = uniform && UNIFORM_TEXT_KEYS.includes(key) ? master : ts[key];
    if (!s) continue;
    // Migration: altes einzelnes color gilt für beide Modi.
    const legacy = isHex(s.color) ? s.color : '';
    const light = isHex(s.colorLight) ? s.colorLight : legacy;
    const dark = isHex(s.colorDark) ? s.colorDark : legacy;
    // Basis-Regel (beide Modi): Größe + Schrift + Effekte. Farben je Modus getrennt.
    const decl: string[] = [];
    if (typeof s.size === 'number' && s.size > 0) decl.push(`font-size:${s.size}px`);
    const font = (s.font || '').trim();
    if (font && TEXT_FONT_FILE.test(font)) {
      faces.add(textFontFaceCss(font));
      decl.push(`font-family:"${textFontId(font)}", var(--site-font)`);
    }
    // Effekte (Deckkraft, Umriss, Schatten, Animation) anhängen.
    for (const d of textFxDecls(s)) decl.push(d);
    if (decl.length) rules.push(`${sel}{${decl.join(';')}}`);
    // Hell-Farbe nur im Hellmodus, Dunkel-Farbe nur im Dunkelmodus; fehlt eine
    // von beiden, bleibt in diesem Modus der Seiten- bzw. Hero-Design-Standard.
    if (light) rules.push(`${lightSel(sel)}{${colorDecl(light)}}`);
    if (dark) rules.push(`[data-theme="dark"] ${sel}{${colorDecl(dark)}}`);
  }
  return [...faces].join('') + rules.join('');
}

// --- Tool-Karten-Design (Tab „Tool-Karten") ---

const TOOL_CARD_KEY = /^(tools|imageTools|diverseTools)\.[a-zA-Z0-9_-]+$/;
const TOOL_CARD_HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const TOOL_CARD_BORDER_STYLES: readonly string[] = ['solid', 'dashed', 'dotted', 'double'];

/**
 * CSS-Variablen (--tc-*) eines Farb-Satzes. tool-cards.css liest diese
 * Variablen mit den Standardwerten als Fallback – fehlt eine Variable, bleibt
 * das eingebaute Aussehen. Ungültige Farben werden übersprungen.
 */
function toolCardSideVars(side: ToolCardSide): string {
  const v: string[] = [];
  const isHex = (h: unknown): h is string => TOOL_CARD_HEX.test(String(h ?? ''));
  const num = (n: unknown, min: number, max: number, d: number) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : d;
  if (isHex(side.borderColor))
    v.push(`--tc-bc:${textHexToRgba(side.borderColor, num(side.borderOpacity, 0, 100, 100) / 100)}`);
  v.push(`--tc-bw:${num(side.borderWidth, 0, 8, 1)}px`);
  const bs = TOOL_CARD_BORDER_STYLES.includes(side.borderStyle) ? side.borderStyle : 'solid';
  v.push(`--tc-bs:${bs}`);
  v.push(`--tc-radius:${num(side.borderRadius, 0, 40, 16)}px`);
  if (isHex(side.bgColor)) {
    const a = num(side.bgOpacity, 0, 100, 100) / 100;
    const c1 = textHexToRgba(side.bgColor, a);
    if (side.gradient === true && isHex(side.bgColor2)) {
      const c2 = textHexToRgba(side.bgColor2, a);
      v.push(`--tc-bg:linear-gradient(${num(side.gradientAngle, 0, 360, 135)}deg, ${c1}, ${c2})`);
    } else {
      v.push(`--tc-bg:${c1}`);
    }
  }
  if (isHex(side.hoverBorderColor))
    v.push(
      `--tc-hover-bc:${textHexToRgba(side.hoverBorderColor, num(side.hoverBorderOpacity, 0, 100, 22) / 100)}`,
    );
  // Hover-Hintergrund nur bei Transparenz > 0 (0 = unverändert lassen).
  const hbo = num(side.hoverBgOpacity, 0, 100, 0);
  if (hbo > 0 && isHex(side.hoverBgColor))
    v.push(`--tc-hover-bg:${textHexToRgba(side.hoverBgColor, hbo / 100)}`);
  // Hintergrundbild (immer explizit, damit Dunkel ohne Bild das helle nicht erbt).
  const img = String(side.bgImage ?? '');
  if (img && SITE_MEDIA_URL.test(img)) {
    const darken = num(side.bgImageDarken, 0, 100, 0) / 100;
    v.push(`--tc-img:url("${img}")`);
    v.push(`--tc-img-opacity:${num(side.bgImageOpacity, 0, 100, 100) / 100}`);
    v.push(`--tc-img-filter:${darken > 0 ? `brightness(${(1 - darken).toFixed(3)})` : 'none'}`);
  } else {
    v.push('--tc-img:none', '--tc-img-opacity:1', '--tc-img-filter:none');
  }
  return v.join(';');
}

/**
 * CSS für das im Admin eingestellte Tool-Karten-Design (Standard für alle
 * Karten + Einzel-Designs je Karte, getrennt Hell/Dunkel). Gibt `undefined`
 * zurück, wenn das Design nicht aktiviert ist (dann bleibt tool-cards.css).
 * Einzel-Karten werden über ihr data-i18n-Key-Attribut adressiert; die
 * Selektoren sind so gestaffelt, dass Dunkel > Hell und Karte > Standard gilt.
 */
export function getToolCardsCss(media: MediaConfig): string | undefined {
  const tc = media.toolCards;
  if (!tc || tc.enabled !== true || !isPlainObject(tc.default)) return undefined;
  const rules: string[] = [];
  const faces = new Set<string>();
  const def = tc.default;
  if (isPlainObject(def.light)) rules.push(`#app .tool-card{${toolCardSideVars(def.light)}}`);
  if (isPlainObject(def.dark))
    rules.push(`[data-theme="dark"] #app .tool-card{${toolCardSideVars(def.dark)}}`);
  // Text-Farben/-Typografie liegen auf .svg-card-link, damit auch das Popup
  // (Geschwister der Karte) die Variablen erbt. Die Hell-Regeln gelten auch im
  // Dunkelmodus (Spezifität), daher setzt die Dunkel-Regel jede von Hell gesetzte
  // Variable ausdrücklich – auf den Dunkel-Wert oder `initial` (= Seitenstandard).
  const colorMap = (side: ToolCardSide | undefined) =>
    new Map(isPlainObject(side) ? toolCardTextColorVars(side) : []);
  const emit = (sel: string, entries: Array<[string, string]>) => {
    if (entries.length) rules.push(`${sel}{${entries.map(([k, v]) => `${k}:${v}`).join(';')}}`);
  };
  const defL = colorMap(def.light);
  const defD = colorMap(def.dark);
  const darkEntries = (maps: Array<Map<string, string>>, lookup: Array<Map<string, string>>) => {
    const keys = new Set<string>();
    for (const m of maps) for (const k of m.keys()) keys.add(k);
    return [...keys].map((k): [string, string] => {
      for (const m of lookup) if (m.has(k)) return [k, m.get(k) as string];
      return [k, 'initial'];
    });
  };
  const pushText = (sel: string, style: ToolCardStyle, isDefault: boolean) => {
    const L = isDefault ? defL : colorMap(style.light);
    const D = isDefault ? defD : colorMap(style.dark);
    const typo = isPlainObject(style.text) ? toolCardTextVars(style.text, faces) : [];
    emit(sel, [...L.entries(), ...typo]);
    const dark = isDefault ? darkEntries([defL, defD], [defD]) : darkEntries([defL, defD, L, D], [D, defD]);
    emit(`[data-theme="dark"] ${sel}`, dark);
  };
  pushText('#app .svg-card-link', def, true);
  const cards = isPlainObject(tc.cards) ? tc.cards : {};
  for (const [key, style] of Object.entries(cards)) {
    if (!TOOL_CARD_KEY.test(key) || !isPlainObject(style)) continue;
    const sel = `#app .svg-card-link[data-i18n-key="${key}"] .tool-card`;
    if (isPlainObject(style.light)) rules.push(`${sel}{${toolCardSideVars(style.light)}}`);
    if (isPlainObject(style.dark))
      rules.push(`[data-theme="dark"] ${sel}{${toolCardSideVars(style.dark)}}`);
    pushText(`#app .svg-card-link[data-i18n-key="${key}"]`, style, false);
  }
  if (!rules.length) return undefined;
  return [...faces, ...rules].join('');
}
// Text-Farben eines Modus als [--tc-*-Variable, Wert] (nur gesetzte Felder).
function toolCardTextColorVars(side: ToolCardSide): Array<[string, string]> {
  const v: Array<[string, string]> = [];
  const isHex = (h: unknown): h is string => TOOL_CARD_HEX.test(String(h ?? ''));
  if (isHex(side.titleColor)) v.push(['--tc-title-color', side.titleColor]);
  if (isHex(side.badgeColor)) v.push(['--tc-badge-color', side.badgeColor]);
  if (isHex(side.badgeBgColor)) {
    const a =
      typeof side.badgeBgOpacity === 'number' && Number.isFinite(side.badgeBgOpacity)
        ? Math.max(0, Math.min(100, side.badgeBgOpacity)) / 100
        : 1;
    v.push(['--tc-badge-bg', textHexToRgba(side.badgeBgColor, a)]);
  }
  if (isHex(side.openColor)) v.push(['--tc-open-color', side.openColor]);
  if (isHex(side.descColor)) v.push(['--tc-desc-color', side.descColor]);
  if (isHex(side.descBgColor)) v.push(['--tc-desc-bg', side.descBgColor]);
  return v;
}
// Typografie (Hell + Dunkel) als Variablen; Schriften ergänzen @font-face in `faces`.
function toolCardTextVars(text: ToolCardText, faces: Set<string>): Array<[string, string]> {
  const v: Array<[string, string]> = [];
  const num = (n: unknown, min: number, max: number) =>
    typeof n === 'number' && Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : 0;
  const font = (file: unknown, name: string) => {
    const f = String(file ?? '').trim();
    if (!f || !TEXT_FONT_FILE.test(f)) return;
    faces.add(textFontFaceCss(f));
    v.push([name, `"${textFontId(f)}", ${SITE_FONT_FALLBACK}`]);
  };
  font(text.titleFont, '--tc-title-font');
  font(text.textFont, '--tc-text-font');
  const size = (n: unknown, max: number, name: string) => {
    const s = num(n, 0, max);
    if (s > 0) v.push([name, `${s}px`]);
  };
  const weight = (w: unknown, name: string) => {
    const s = String(w ?? '');
    if (s && TOOL_CARD_WEIGHTS.includes(s)) v.push([name, s]);
  };
  const transform = (t: unknown, name: string) => {
    const s = String(t ?? '');
    if (s && TOOL_CARD_TRANSFORMS.includes(s)) v.push([name, s]);
  };
  size(text.titleSize, 40, '--tc-title-size');
  weight(text.titleWeight, '--tc-title-weight');
  const sp = num(text.titleSpacing, -2, 5);
  if (sp !== 0) v.push(['--tc-title-spacing', `${sp}px`]);
  transform(text.titleTransform, '--tc-title-transform');
  size(text.badgeSize, 20, '--tc-badge-size');
  weight(text.badgeWeight, '--tc-badge-weight');
  transform(text.badgeTransform, '--tc-badge-transform');
  size(text.openSize, 20, '--tc-open-size');
  weight(text.openWeight, '--tc-open-weight');
  size(text.descSize, 24, '--tc-desc-size');
  return v;
}

/**
 * CSS für die Icon-Färbung der Tool-Karten (Tab „Icons"). Das <img> bleibt im
 * Markup (Alt-Text, Lazy-Loading); bei gesetzter Icon-Farbe wird es unsichtbar
 * und ein ::after-Element zeigt das SVG als einfarbige Maske in der Farbe.
 * Kasten-Hintergrund je Modus; Dunkel fällt ausdrücklich auf den Standard
 * zurück, wenn nur Hell gesetzt ist (Spezifität der Hell-Regel wäre höher).
 */
export function getIconTintCss(locale: Locale): string | undefined {
  const media = getMedia(locale);
  const tints = isPlainObject(media.iconTint) ? media.iconTint : {};
  const content = (locale === 'en' ? getContent('en') : getContent('de')) as unknown as Record<
    string,
    Record<string, { svg?: unknown }>
  >;
  const hex = (v: unknown) => (typeof v === 'string' && SITE_HEX.test(v) ? v : '');
  const rules: string[] = [];
  for (const [key, t] of Object.entries(tints)) {
    if (!TOOL_CARD_KEY.test(key) || !isPlainObject(t)) continue;
    const [section, k] = key.split('.');
    const svg = String(content[section]?.[k]?.svg ?? '');
    const sel = `#app .svg-card-link[data-i18n-key="${key}"] .tool-card-icon`;
    const light = hex(t.light);
    const dark = hex(t.dark);
    const bg = hex(t.bg);
    const bgDark = hex(t.bgDark);
    const mask = `url("${svg}") center / contain no-repeat`;
    const tintRule = (prefix: string, color: string) =>
      `${prefix}${sel} img{visibility:hidden;}${prefix}${sel}::after{content:"";position:absolute;inset:5px;background:${color};-webkit-mask:${mask};mask:${mask};}`;
    const untintRule = (prefix: string) =>
      `${prefix}${sel} img{visibility:visible;}${prefix}${sel}::after{content:none;}`;
    if (svg !== '' && SITE_MEDIA_URL.test(svg)) {
      if (light) rules.push(tintRule('', light));
      if (dark) rules.push(tintRule('[data-theme="dark"] ', dark));
      else if (light) rules.push(untintRule('[data-theme="dark"] '));
    }
    if (bg) rules.push(`${sel}{background:${bg};}`);
    if (bgDark) rules.push(`[data-theme="dark"] ${sel}{background:${bgDark};}`);
    else if (bg) rules.push(`[data-theme="dark"] ${sel}{background:#eef1f5;}`);
  }
  return rules.length ? rules.join('') : undefined;
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
  // Deckkraft (0–100 %) der eigenen Farbe bzw. des Verlaufs über der
  // Standardfarbe des Modus (100 = deckend, wie bisher).
  bgOpacity: number;
  bgOpacityDark: number;
  // Farbverlauf: an/aus, Endfarbe (Hex), Art (linear = Winkel, radial = von
  // oben Mitte nach außen) und Richtung in Grad (nur linear).
  bgGradient: boolean;
  bgGradientDark: boolean;
  bgColor2: string;
  bgColor2Dark: string;
  bgGradientType: 'linear' | 'radial';
  bgGradientTypeDark: 'linear' | 'radial';
  bgAngle: number;
  bgAngleDark: number;
  // Hintergrund-Effekte (global, Farben folgen dem Modus): Aurora-Farbflecken,
  // feines Rauschen, Maus-Spotlight – je an/aus + Intensität 0–100.
  fxAurora: boolean;
  fxAuroraIntensity: number;
  fxNoise: boolean;
  fxNoiseIntensity: number;
  fxSpotlight: boolean;
  fxSpotlightIntensity: number;
  // Muster je Modus (reines CSS): Punktraster oder feines Gitter – Farbe,
  // Abstand (px), Stärke (px) und Deckkraft (%). 'none' = kein Muster.
  bgPattern: 'none' | 'dots' | 'grid';
  bgPatternDark: 'none' | 'dots' | 'grid';
  bgPatternColor: string;
  bgPatternColorDark: string;
  bgPatternSpacing: number;
  bgPatternSpacingDark: number;
  bgPatternThickness: number;
  bgPatternThicknessDark: number;
  bgPatternOpacity: number;
  bgPatternOpacityDark: number;
  // Hintergrundbild je Modus (URL aus der Mediathek; leer = keins) mit
  // Abdunkelung (%), Weichzeichner (px), Deckkraft (%) und „fixiert beim
  // Scrollen" (sonst deckt es die erste Bildschirmhöhe ab und läuft aus).
  bgImage: string;
  bgImageDark: string;
  bgImageDarken: number;
  bgImageDarkenDark: number;
  bgImageBlur: number;
  bgImageBlurDark: number;
  bgImageOpacity: number;
  bgImageOpacityDark: number;
  bgImageFixed: boolean;
  bgImageFixedDark: boolean;
  // Abgesetzte Tool-Sektionen (Audio / Bild / Diverse): je Sektion und Modus
  // eine Tönung (Farbe + Deckkraft) und/oder ein Bild; style = Vollbreite-Band
  // oder abgerundete Fläche innerhalb der Sektion.
  sections: SiteSections;
}
export interface SiteSectionSide {
  color: string; // '' = keine Tönung
  opacity: number; // 0–100 %
  image: string; // '' = kein Bild
  imageDarken: number;
  imageBlur: number;
  imageOpacity: number;
}
export interface SiteSectionCfg {
  light: SiteSectionSide;
  dark: SiteSectionSide;
}
export interface SiteSections {
  style: 'band' | 'card';
  gap: number; // Abstand zwischen abgesetzten Sektionen in px (0–160)
  audio: SiteSectionCfg;
  image: SiteSectionCfg;
  diverse: SiteSectionCfg;
}
export const SITE_SECTION_KEYS = ['audio', 'image', 'diverse'] as const;
const EMPTY_SECTION_SIDE: SiteSectionSide = {
  color: '',
  opacity: 8,
  image: '',
  imageDarken: 0,
  imageBlur: 0,
  imageOpacity: 100,
};
function emptySectionCfg(): SiteSectionCfg {
  return { light: { ...EMPTY_SECTION_SIDE }, dark: { ...EMPTY_SECTION_SIDE } };
}

const SITE_DEFAULTS: SiteConfig = {
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
  fxAurora: false,
  fxAuroraIntensity: 50,
  fxNoise: false,
  fxNoiseIntensity: 50,
  fxSpotlight: false,
  fxSpotlightIntensity: 50,
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
  sections: {
    style: 'band',
    gap: 0,
    audio: emptySectionCfg(),
    image: emptySectionCfg(),
    diverse: emptySectionCfg(),
  },
};
// Erlaubte Bild-URL (interner Pfad oder http(s)), ohne Zeichen, die url("…") brechen.
const SITE_MEDIA_URL = /^(\/[^\s"'()\\]*|https?:\/\/[^\s"'()\\]+)$/;
// Standard-Hintergrundfarben je Modus (identisch zu base.css --bg-color).
// Skalierung der Effekt-Intensität (0–100) auf CSS-Deckkraft: Aurora 0–1,
// Rauschen 0–0,08, Spotlight-Faktor 0–1 (index.astro multipliziert mit der
// Grundfarbe). Intensität 50 entspricht dem früheren eingebauten Aussehen.
const FX_NOISE_MAX = 0.08;
const PAGE_BG_BASE: Record<'light' | 'dark', string> = { light: '#fafafa', dark: '#091428' };

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
  const light = siteBgRules(site, 'light');
  const dark = siteBgRules(site, 'dark');
  const rules = [...light.rules, ...dark.rules];
  // Die Hell-Regeln (html:root, Spezifität 0,1,1) gelten auch im Dunkelmodus und
  // schlagen dort die Standardwerte aus base.css ([data-theme="dark"], 0,1,0).
  // Hat Dunkel selbst keine Farbe / kein Muster / kein Bild, muss es die hellen
  // Werte ausdrücklich zurücksetzen.
  if (light.bgVar && !dark.bgVar)
    rules.push(`html[data-theme="dark"]{--bg-color:${PAGE_BG_BASE.dark};}`);
  if (light.bodyBg && !dark.bodyBg)
    rules.push('html[data-theme="dark"] body{background:var(--bg-color);}');
  if (light.image && !dark.image) rules.push('html[data-theme="dark"] body::before{content:none;}');
  rules.push(...siteFxRules(site));
  rules.push(...siteSectionRules(site));
  return rules.length ? rules.join('') : undefined;
}

/**
 * CSS für abgesetzte Tool-Sektionen. Das Markup enthält je Sektion
 * <section data-bgsection="…"><div class="section-bg"> (components.css:
 * absolute Ebene hinter dem Inhalt; ::before = Bild, ::after = Tönung, beide
 * über CSS-Variablen gesteuert). Hier werden nur die Variablen je Sektion und
 * Modus gesetzt; ohne Tönung/Bild bleibt die Ebene ausgeblendet (wie bisher).
 * Die Hell-Regeln (html:root) gelten auch im Dunkelmodus, deshalb wird für
 * Dunkel immer eine vollständige Regel ausgegeben, sobald Hell eine hat.
 */
function siteSectionRules(site: SiteConfig): string[] {
  const secs = site.sections;
  if (!isPlainObject(secs)) return [];
  const num = (v: unknown, min: number, max: number, d: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : d;
  const rules: string[] = [];
  let any = false;
  const decl = (side: Partial<SiteSectionSide> | undefined): string | null => {
    if (!isPlainObject(side)) return null;
    const color = String(side.color ?? '');
    const tint = SITE_HEX.test(color) ? textHexToRgba(color, num(side.opacity, 0, 100, 8) / 100) : '';
    const img = String(side.image ?? '');
    const hasImg = img !== '' && SITE_MEDIA_URL.test(img);
    if (!tint && !hasImg) return null;
    const out = [`display:block`, `--sec-tint:${tint || 'transparent'}`];
    if (hasImg) {
      const blur = num(side.imageBlur, 0, 40, 0);
      const darken = num(side.imageDarken, 0, 100, 0) / 100;
      const f: string[] = [];
      if (blur > 0) f.push(`blur(${blur}px)`);
      if (darken > 0) f.push(`brightness(${(1 - darken).toFixed(3)})`);
      out.push(
        `--sec-img:url("${img}")`,
        `--sec-img-filter:${f.join(' ') || 'none'}`,
        `--sec-img-opacity:${num(side.imageOpacity, 0, 100, 100) / 100}`,
        `--sec-img-inset:-${blur * 2}px`,
      );
    } else out.push('--sec-img:none');
    return out.join(';');
  };
  for (const key of SITE_SECTION_KEYS) {
    const cfg = (secs as unknown as Record<string, SiteSectionCfg | undefined>)[key];
    const light = decl(cfg?.light);
    const dark = decl(cfg?.dark);
    if (!light && !dark) continue;
    any = true;
    const sel = (mode: 'light' | 'dark') =>
      `${mode === 'dark' ? 'html[data-theme="dark"]' : 'html:root'} .tools-section[data-bgsection="${key}"] .section-bg`;
    if (light) rules.push(`${sel('light')}{${light};}`);
    if (dark) rules.push(`${sel('dark')}{${dark};}`);
    else if (light) rules.push(`${sel('dark')}{display:none;}`);
  }
  if (any) {
    // Abstand: jedes Band wird oben und unten um die Hälfte eingerückt, sodass
    // zwischen zwei Bändern genau `gap` px Seitenhintergrund sichtbar bleiben.
    const gap = num(secs.gap, 0, 160, 0);
    rules.push(
      (secs.style === 'card'
        ? 'html:root{--sec-bleed:0px;--sec-radius:1.5rem;'
        : 'html:root{--sec-bleed:calc(50% - 50vw);--sec-radius:0px;') + `--sec-gap:${gap}px;}`,
    );
  }
  return rules;
}
// Ergebnis von siteBgRules: CSS-Regeln plus, ob ein body-Hintergrund bzw. ein
// Hintergrundbild (body::before) für den Modus ausgegeben wurde.
interface SiteBgRules {
  rules: string[];
  bgVar: boolean; // eigene --bg-color gesetzt
  bodyBg: boolean;
  image: boolean;
}

/**
 * CSS für die Hintergrund-Effekte. Die Ebene .global-background (in den Seiten
 * vorhanden, per background.css ausgeblendet) wird nur eingeblendet, wenn
 * mindestens ein Effekt aktiv ist; inaktive Effekte bleiben ausgeblendet.
 * Ohne aktive Effekte entstehen keine Regeln (Aussehen wie bisher).
 */
function siteFxRules(site: SiteConfig): string[] {
  const num = (v: unknown, d: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : d;
  const aurora = site.fxAurora === true;
  const noise = site.fxNoise === true;
  const spot = site.fxSpotlight === true;
  if (!aurora && !noise && !spot) return [];
  const fmt = (n: number) => String(Math.round(n * 1000) / 1000);
  // Präfix `html` erhöht die Spezifität über die Klassenregeln in background.css
  // (das Inline-<style> steht im <head> VOR dem gebündelten Stylesheet).
  const rules: string[] = ['html .global-background{display:block;}'];
  rules.push(
    aurora
      ? `html .global-gradient{opacity:${fmt(num(site.fxAuroraIntensity, 50) / 100)};}`
      : 'html .global-gradient{display:none;}',
  );
  rules.push(
    noise
      ? `html .global-noise{opacity:${fmt((num(site.fxNoiseIntensity, 50) / 100) * FX_NOISE_MAX)};}`
      : 'html .global-noise{display:none;}',
  );
  rules.push(
    spot
      ? `html:root{--fx-spotlight:${fmt(num(site.fxSpotlightIntensity, 50) / 100)};}`
      : 'html .mouse-spotlight{display:none;}',
  );
  return rules;
}

// Hex (#rgb/#rrggbb) -> [r,g,b].
function siteHexRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
// Farbe `top` mit Deckkraft `a` über `base` gemischt -> flacher Hex-Wert.
function siteMixHex(top: string, base: string, a: number): string {
  const t = siteHexRgb(top);
  const b = siteHexRgb(base);
  const mix = (i: number) => Math.round(t[i] * a + b[i] * (1 - a));
  return '#' + [0, 1, 2].map((i) => mix(i).toString(16).padStart(2, '0')).join('');
}
/**
 * CSS-Regeln für einen Modus. Deckend und ohne Verlauf bleibt es bei der
 * bisherigen Variable --bg-color (kein Regress). Mit Deckkraft < 100 % oder
 * Verlauf liegt der eigene Hintergrund als Ebene ÜBER der Standardfarbe des
 * Modus (body: <Ebene>, <Standardfarbe>); --bg-color wird auf die flache
 * Mischfarbe gesetzt, damit weitere Verbraucher der Variable passend bleiben.
 */
function siteBgRules(site: SiteConfig, mode: 'light' | 'dark'): SiteBgRules {
  const sfx = mode === 'dark' ? 'Dark' : '';
  const s = site as unknown as Record<string, unknown>;
  const sel = mode === 'dark' ? 'html[data-theme="dark"]' : 'html:root';
  const num = (v: unknown, min: number, max: number, d: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : d;
  const base = PAGE_BG_BASE[mode];
  const rules: string[] = [];

  // 1. Eigene Farbe / Verlauf mit Deckkraft (wie bisher).
  const color = String(s[`bgColor${sfx}`] ?? '');
  const hasColor = SITE_HEX.test(color);
  const opacity = num(s[`bgOpacity${sfx}`], 0, 100, 100);
  const color2 = String(s[`bgColor2${sfx}`] ?? '');
  const gradient = hasColor && s[`bgGradient${sfx}`] === true && SITE_HEX.test(color2);
  let colorLayer: string | null = null;
  if (hasColor) {
    if (!gradient && opacity >= 100) {
      rules.push(`${sel}{--bg-color:${color};}`); // flach + deckend: nur die Variable
    } else {
      const a = opacity / 100;
      const c1 = textHexToRgba(color, a);
      if (gradient) {
        const c2 = textHexToRgba(color2, a);
        colorLayer =
          s[`bgGradientType${sfx}`] === 'radial'
            ? `radial-gradient(ellipse at 50% 0%, ${c1}, ${c2})`
            : `linear-gradient(${num(s[`bgAngle${sfx}`], 0, 360, 180)}deg, ${c1}, ${c2})`;
      } else {
        colorLayer = `linear-gradient(${c1}, ${c1})`;
      }
      rules.push(`${sel}{--bg-color:${siteMixHex(color, base, a)};}`);
    }
  }

  // 2. Muster (Punktraster / Gitter) als sich wiederholende Ebene(n) über der Farbe.
  const layers = [
    ...sitePatternLayers(
      String(s[`bgPattern${sfx}`] ?? 'none'),
      String(s[`bgPatternColor${sfx}`] ?? ''),
      num(s[`bgPatternSpacing${sfx}`], 4, 200, 24),
      num(s[`bgPatternThickness${sfx}`], 1, 6, 1),
      num(s[`bgPatternOpacity${sfx}`], 0, 100, 12),
    ),
  ];
  if (colorLayer) layers.push(colorLayer);
  const bodyBg = layers.length > 0;
  if (bodyBg) {
    // Grund: flache deckende eigene Farbe (falls gesetzt), sonst Standardfarbe.
    const ground = hasColor && !colorLayer ? color : base;
    rules.push(`${sel} body{background:${layers.join(', ')}, ${ground};}`);
  }

  // 3. Hintergrundbild als body::before (eigene Ebene, damit Weichzeichner und
  //    Abdunkelung per filter möglich sind), unter der Effekt-Ebene (z-index -2).
  //    Alle Eigenschaften werden ausdrücklich gesetzt, damit im Dunkelmodus
  //    nichts aus der Hell-Regel (html:root) durchscheint.
  const img = String(s[`bgImage${sfx}`] ?? '');
  const image = img !== '' && SITE_MEDIA_URL.test(img);
  if (image) {
    const darken = num(s[`bgImageDarken${sfx}`], 0, 100, 0) / 100;
    const blur = num(s[`bgImageBlur${sfx}`], 0, 40, 0);
    const op = num(s[`bgImageOpacity${sfx}`], 0, 100, 100) / 100;
    const fixed = s[`bgImageFixed${sfx}`] !== false;
    const filters: string[] = [];
    if (blur > 0) filters.push(`blur(${blur}px)`);
    if (darken > 0) filters.push(`brightness(${(1 - darken).toFixed(3)})`);
    // Weichzeichner franst am Rand aus -> Ebene etwas über den Rand hinaus vergrößern.
    const grow = blur > 0 ? blur * 2 : 0;
    const box = fixed
      ? `position:fixed;inset:-${grow}px;height:auto`
      : `position:absolute;left:-${grow}px;right:-${grow}px;top:-${grow}px;bottom:auto;height:calc(100vh + ${grow * 2}px)`;
    // Nicht fixiert: Bild deckt die erste Bildschirmhöhe ab und läuft nach unten aus.
    const mask = fixed ? 'none' : 'linear-gradient(#000 60%, transparent)';
    if (!fixed) rules.push(`${sel} body{position:relative;}`);
    rules.push(
      `${sel} body::before{content:"";${box};z-index:-2;pointer-events:none;background:url("${img}") center / cover no-repeat;` +
        `filter:${filters.join(' ') || 'none'};opacity:${op};mask-image:${mask};-webkit-mask-image:${mask};}`,
    );
  }
  return { rules, bgVar: hasColor, bodyBg, image };
}

/**
 * CSS-Hintergrund-Ebenen für ein Muster (als Einträge einer background-Liste
 * mit Position/Größe/Wiederholung). Leer bei 'none' oder ungültiger Farbe.
 */
function sitePatternLayers(
  type: string,
  color: string,
  spacing: number,
  thickness: number,
  opacityPct: number,
): string[] {
  if ((type !== 'dots' && type !== 'grid') || !SITE_HEX.test(color)) return [];
  const c = textHexToRgba(color, opacityPct / 100);
  const size = `${spacing}px ${spacing}px`;
  if (type === 'dots')
    return [`radial-gradient(circle, ${c} ${thickness}px, transparent ${thickness + 0.5}px) 0 0 / ${size} repeat`];
  return [
    `linear-gradient(${c} ${thickness}px, transparent ${thickness}px) 0 0 / ${size} repeat`,
    `linear-gradient(90deg, ${c} ${thickness}px, transparent ${thickness}px) 0 0 / ${size} repeat`,
  ];
}
