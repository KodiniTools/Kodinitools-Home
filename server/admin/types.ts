/**
 * Typen des Admin-Datenmodells (nur Typen, kein Laufzeit-Code).
 *
 * Die Admin-Module unter `public/` bleiben Vanilla-JS ohne Build-Schritt und
 * beziehen diese Typen per JSDoc (`@typedef {import('../types.ts').X} X`). Wo die
 * Struktur bereits durch eine Normalisierungs-Funktion festgelegt ist, wird der
 * Typ aus deren Rückgabe abgeleitet (eine Quelle der Wahrheit); nur offene
 * Strukturen (Overrides, Text-Stile, Offsets) sind hier ausgeschrieben.
 *
 * Grundlage für die schrittweise Migration des Admins nach Vue 3 + Pinia.
 */
import type { normTickerStyle } from './public/model-ticker.ts';
import type { defaultMediaLocale, normalizeMedia } from './public/model-media.ts';

/** Inhalts-Sprachen der Seite. */
export type Lang = 'de' | 'en';
/** Darstellungs-Modus, für den Farben getrennt gepflegt werden. */
export type ThemeMode = 'light' | 'dark';
/** Wert je Sprache. */
export type ByLang<T> = Record<Lang, T>;

/** Tempo des Laufbands. */
export type TickerSpeed = 'slow' | 'normal' | 'fast';
/** Ein Eintrag des Laufbands. */
export interface TickerItem {
  id: string;
  text: string;
  link: string;
}
/** Farben des Laufbands für einen Modus. */
export interface TickerColors {
  textColor: string;
  bgColor: string;
  /** Deckkraft des Hintergrunds in % (0–100). */
  bgOpacity: number;
}
/** Design des Laufbands (Typografie geteilt, Farben je Modus). */
export type TickerStyle = ReturnType<typeof normTickerStyle>;
/** Vollständige, normalisierte Laufband-Konfiguration einer Sprache. */
export interface TickerConfig {
  enabled: boolean;
  speed: TickerSpeed;
  items: TickerItem[];
  style: TickerStyle;
}

/** Sektion mit eigenem Video/Bild (`sectionVideos`). */
export type SectionVideoKey = 'audio' | 'image' | 'diverse';
/** Medien-Slot: Sektions-Video, Einzel-Banner oder eine der sechs Raster-Kacheln. */
export type MediaKey = SectionVideoKey | 'heroBanner' | `grid${0 | 1 | 2 | 3 | 4 | 5}`;

/**
 * Bild-Platz für das Veröffentlichen (lokale Bilder hochladen, URL eintragen)
 * und die Übersicht im Tab „Dateien“. `root` = Objekt in `state.media`
 * ('site' | Sprache), `xLang` = Upload-Ordner ('shared' | Sprache).
 */
export interface ImageSlot {
  root: 'site' | Lang;
  xLang: 'shared' | Lang;
  path: ObjPath;
  label: string;
  /** Modus, in dem der Platz gilt (fehlt = beide). */
  mode?: ThemeMode;
  get: () => string;
  set: (v: unknown) => void;
}
/** Bild-Platz vor dem Anhängen von get/set. */
export type ImageSlotBase = Omit<ImageSlot, 'get' | 'set'> &
  Partial<Pick<ImageSlot, 'get' | 'set'>>;

/** Verschiebung/Skalierung einer Tool-Karte (Tab „Layout“), Schlüssel `sektion.key`. */
export interface ToolCardOffset {
  x: number;
  y: number;
  /** Breite in % (25–300), nur gespeichert, wenn ≠ 100. */
  w?: number;
  /** Höhe in % (25–300), nur gespeichert, wenn ≠ 100. */
  h?: number;
}

/** Medien-/Design-Einstellungen einer Sprache (normalisiert). */
export type MediaLocale = Omit<
  ReturnType<typeof defaultMediaLocale>,
  'toolCardOffsets' | 'heroMode' | 'heroGridFit'
> & {
  heroMode: 'banner' | 'grid';
  heroGridFit: 'cover' | 'contain';
  toolCardOffsets: Record<string, ToolCardOffset>;
};
/** Geladener/normalisierter Medien-Stand: globale `site` plus je Sprache. */
export type MediaState = ReturnType<typeof normalizeMedia>;
/** Globale Seiten-Einstellungen (sprachübergreifend). */
export type SiteSettings = MediaState['site'];

/** Animation eines Text-Slots (wie Banner-Text). */
export type TextAnim = 'none' | 'pulse' | 'float' | 'shake' | 'wobble' | 'glow';
/** Tempo der Text-Animation. */
export type TextAnimSpeed = 'slow' | 'normal' | 'fast';
/**
 * Vollständiger Stil eines Text-Slots (`media.<lang>.textStyles[key]`), wie ihn
 * `getTextStyle` beim Bearbeiten ergänzt. Gespeichert/normalisiert sind nur
 * Teile davon (siehe `TextStyleEntry`).
 */
export interface TextStyle {
  /** px, 0 = Standard (0–120). */
  size: number;
  colorLight: string;
  colorDark: string;
  /** Schriftdatei aus `/fonts` oder '' (Standard). */
  font: string;
  shadow: boolean;
  shadowColor: string;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  strokeColor: string;
  strokeWidth: number;
  /** Deckkraft in % (0–100). */
  opacity: number;
  anim: TextAnim;
  animIntensity: number;
  animSpeed: TextAnimSpeed;
  offsetX: number;
  offsetY: number;
}
/** Eintrag in `media.<lang>.textStyles` (Effekte/Versatz nur, wenn gesetzt). */
export type TextStyleEntry = Partial<TextStyle>;

/** Feld der Icon-Färbung einer Tool-Karte (Tab „Icons“). */
export type IconTintField = 'light' | 'dark' | 'bg' | 'bgDark';
/**
 * Icon-Färbung einer Tool-Karte (`media.<lang>.iconTint["sektion.key"]`):
 * light/dark = Icon-Farbe (SVG als einfarbige Maske), bg/bgDark = Kasten;
 * '' = unverändert.
 */
export type IconTint = Record<IconTintField, string>;

/** Schlüssel-Pfad in verschachtelte Objekte, z. B. `['hero', 'title']` oder `['items', 0]`. */
export type ObjPath = Array<string | number>;
/** Offenes Objekt für die Pfad-Helfer (`setPath`/`delPath`). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyObj = Record<string | number, any>;
/** Unvalidierter JSON-Eingang der Normalisierer (`norm*`): Form erst nach Prüfung bekannt. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawJson = any;

/** Text-Overrides einer Sprache (beliebig verschachtelt, Struktur der Locale-Dateien). */
export type Overrides = Record<string, unknown>;

/** Datei im Browser-Zwischenspeicher (IndexedDB), referenziert als `staged:<id>`. */
export interface StagedItem {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  createdAt: number;
  /** Server-URL nach dem Veröffentlichen, sonst `null`. */
  publishedUrl: string | null;
}

/** Eintrag der Server-Uploads (`GET /api/uploads`). */
export interface ServerFile {
  name: string;
  /** Pfad relativ zu `/uploads`, z. B. `de/bild.webp`. */
  path: string;
  url: string;
  bytes: number;
  mtime: number;
}
/** Server-Uploads getrennt nach Sprache; `shared` = alte, ungetrennte Dateien. */
export type ServerFiles = ByLang<ServerFile[]> & { shared: ServerFile[] };

/** Verfügbare Schrift (`GET /api/fonts`). */
export interface FontEntry {
  name: string;
  label: string;
  url: string;
  bytes: number;
}

/** Schlüssel der Unter-Tabs je Sprache (Reihenfolge siehe `SUBTABS`). */
export type SubtabKey =
  | 'ticker'
  | 'texts'
  | 'media'
  | 'layout'
  | 'design'
  | 'background'
  | 'cards'
  | 'files'
  | 'icons'
  | 'advanced';
/** Eintrag der Unter-Navigation. */
export interface Subtab {
  key: SubtabKey;
  label: string;
}
/** Ebene 1 der Navigation: Sprache oder Status/Veröffentlichen. */
export type NavSection = Lang | 'publish';
export interface NavState {
  section: NavSection;
  sub: SubtabKey;
}

/** Zentraler App-Zustand des Admins (`model-state.ts`). */
export interface AdminState {
  overrides: ByLang<Overrides>;
  ticker: ByLang<TickerConfig>;
  media: MediaState;
  /** Fallback für nicht aufgelöste Staging-Refs beim Speichern. */
  loadedMedia: MediaState;
  defaults: ByLang<Overrides>;
  stagedItems: StagedItem[];
  serverFiles: ServerFiles;
  fonts: FontEntry[];
  /** id → objectURL (Vorschau gestagter Dateien). */
  objectUrls: Map<string, string>;
  nav: NavState;
  publishing: boolean;
}
