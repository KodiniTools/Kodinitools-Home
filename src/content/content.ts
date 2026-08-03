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
};

/** Laufband-Konfiguration für eine Sprache (mit vollständig aufgefülltem style). */
export function getTicker(locale: Locale): TickerConfig {
  const raw = (locale === 'en' ? enTicker : deTicker) as TickerConfig;
  return { ...raw, style: { ...TICKER_STYLE_DEFAULTS, ...(raw.style ?? {}) } };
}

// --- Medien (pro Sprache; admin-editierbar über media.json) ---

export interface MediaConfig {
  sectionVideos: { audio: string; image: string; diverse: string };
  // Hero-Bereich: 'banner' = ein einzelnes Bild/Video, 'grid' = 3er-Raster (1:1).
  heroMode: 'banner' | 'grid';
  // Option 1: austauschbares Hero-Banner (Bild oder Video). Leer = kein Banner.
  heroBanner: string;
  // Option 2: drei quadratische Bilder für das Raster.
  heroGrid: string[];
}

// Standard-Pfade entsprechen dem bisherigen Auslieferungszustand.
const MEDIA_DEFAULTS: MediaConfig = {
  sectionVideos: {
    audio: '/videos/audio-tools.mp4',
    image: '/videos/image-tools.mp4',
    diverse: '/videos/diverse-tools.mp4',
  },
  heroMode: 'banner',
  heroBanner: '',
  heroGrid: ['', '', ''],
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

/** Medien-Konfiguration für eine Sprache (Defaults + Admin-Override). */
export function getMedia(locale: Locale): MediaConfig {
  return deepMerge(MEDIA_DEFAULTS, mediaOverrideFor(locale));
}
