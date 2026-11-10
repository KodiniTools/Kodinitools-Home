import type { ThemeMode } from '../../../types';

/**
 * Ganzseiten-Vorschau im Tab „Layout“ (Vue-Fassung von
 * `public/layout-fullpage.js`): Typen der Daten aus dem Service und reine
 * Regeln für Verschieben, Einrasten, Skalieren und den eigenen Verlauf.
 * Element-Schlüssel: 'hero' | 'audio' | 'image' | 'diverse' |
 * 'card:<sektion.key>' | 'text:<slot>'.
 */

/** Versatz (px der Seite) und bei Tool-Karten Skalierung in %. */
export interface FpOffset {
  x: number;
  y: number;
  w?: number;
  h?: number;
}
export interface FpMedia {
  src: string;
  isVid: boolean;
  style: string;
}
export type FpHero =
  | { kind: 'grid'; cols: number; maxW: number; tiles: { i: number; media: FpMedia | null }[] }
  | { kind: 'media'; media: FpMedia }
  | { kind: 'msg'; text: string };
export interface FpCard {
  id: string;
  title: string;
  svg: string;
  badge: string;
  d: {
    bg: string;
    border: string;
    radius: number;
    titleSize: number;
    titleWeight: number;
    badgeSize: number;
    align: string;
    alignSelf: string;
    titleFont: string;
    hidden: Record<'icon' | 'badge' | 'title' | 'fav' | 'open', boolean>;
  };
}
export interface FpSection {
  key: string;
  /** Text-Slot der Überschrift (z. B. 'tools.sectionTitle'). */
  slot: string;
  title: string;
  label: string;
  media: FpMedia | null;
  wrapCss: string;
  text: { text: string; css: string };
  /** Bild-/Diverse-Tools: zentriertes Raster mit 210–300 px breiten Spalten. */
  centered: boolean;
  cards: FpCard[];
}
/** Schematische Startseite (wie `fullPageHtml`), nur Daten. */
export interface FpModel {
  pageW: number;
  mode: ThemeMode;
  colors: { title: string; text: string; muted: string; card: string };
  compact: boolean;
  grid: boolean;
  heroHasMedia: boolean;
  hero: FpHero;
  shown: { title: boolean; subtitle: boolean; chips: boolean; cta: boolean };
  title: string;
  subtitle: string;
  cta: string;
  chips: { key: string; label: string; hidden: boolean }[];
  sections: FpSection[];
  pageBg: string;
  fontCss: string;
  /** @font-face der Seitenschrift + Kompakt-Layout-CSS (Präfix fp). */
  css: string;
}
export interface FpKey {
  key: string;
  label: string;
  /** '' = Medien, 'Texte', 'Tool-Karten <Sektion>'. */
  group: string;
}
export interface FpCardOffset extends FpOffset {
  id: string;
  title: string;
}

/** Brücke zu `public/layout-fullpage.js` (über `layoutService(lang).fullPage`). */
export interface FullPageService {
  /** Liest nur – Öffnen des Tabs ändert nichts am Zustand. */
  model: (mode: ThemeMode) => FpModel;
  keys: () => FpKey[];
  offset: (key: string) => FpOffset;
  /** Schreibt (begrenzt) und gibt den gespeicherten Versatz zurück. */
  setOffset: (key: string, x: number, y: number, w?: number, h?: number) => FpOffset;
  movedKeys: () => string[];
  cardOffsets: () => FpCardOffset[];
  cardOffsetIds: () => string[];
  /** Schlüssel, die sich mit `key` bewegen (gemeinsame Abschnitts-Überschriften). */
  linkedKeys: (key: string) => string[];
  labels: Record<string, string>;
  normOffset: (v: number, axis: 'x' | 'y') => number;
  normScale: (v: number) => number;
  scaleMin: number;
  scaleMax: number;
  offsetMax: { x: number; y: number };
}

export const GRID_STEPS = [10, 20, 25, 50, 100] as const;
export const MODE_LABEL: Record<ThemeMode, string> = { light: '☀️ Hell', dark: '🌙 Dunkel' };
export const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

export const isScaled = (o: FpOffset) =>
  (o.w != null && o.w !== 100) || (o.h != null && o.h !== 100);
/** Inline-Style eines verschiebbaren Elements (wie `moveCss` + `activeCss`). */
export function moveStyle(o: FpOffset, active: boolean): string {
  const sc = isScaled(o);
  return (
    `position:relative;left:${o.x}px;top:${o.y}px;z-index:${o.x || o.y || sc ? 2 : 1};` +
    `cursor:move;touch-action:none;user-select:none` +
    (sc ? `;transform:scale(${o.w! / 100},${o.h! / 100});transform-origin:top left` : '') +
    (active ? ';outline:3px solid var(--accent);outline-offset:2px' : '')
  );
}
/** Hilfsraster: Linien alle `step` px, jede fünfte kräftiger. */
export function gridOverlayCss(step: number, mode: ThemeMode): string {
  const thin = mode === 'dark' ? 'rgba(255,255,255,.14)' : 'rgba(1,79,153,.16)';
  const bold = mode === 'dark' ? 'rgba(255,255,255,.32)' : 'rgba(1,79,153,.38)';
  const big = step * 5;
  return `background-image:linear-gradient(to right,${bold} 1px,transparent 1px),linear-gradient(to bottom,${bold} 1px,transparent 1px),linear-gradient(to right,${thin} 1px,transparent 1px),linear-gradient(to bottom,${thin} 1px,transparent 1px);background-size:${big}px ${big}px,${big}px ${big}px,${step}px ${step}px,${step}px ${step}px`;
}
/** Kante (Ausgangsplatz + Versatz) auf das Raster legen; gibt den Versatz zurück. */
export const snapTo = (origin: { x: number; y: number }, x: number, y: number, step: number) => ({
  x: Math.round((origin.x + x) / step) * step - origin.x,
  y: Math.round((origin.y + y) / step) * step - origin.y,
});
/**
 * Pfeiltaste mit Raster: nächste Rasterlinie in Pfeilrichtung (`lines` = 1 oder 5).
 * Liegt die Kante (bis auf Rundung) schon auf einer Linie, geht es von dort weiter.
 * `pos` = absolute Kante, Rückgabe = neue absolute Kante.
 */
export function nextLine(pos: number, dir: number, step: number, lines: number): number {
  if (!dir) return pos;
  const n = Math.round(pos / step);
  if (Math.abs(pos - n * step) < 1) return (n + dir * lines) * step;
  return (dir > 0 ? Math.floor(pos / step) + lines : Math.ceil(pos / step) - lines) * step;
}

/** Zustand beim Start einer Skalierung (Grundmaße ohne Skalierung in Seiten-px). */
export interface ResizeStart {
  handle: string;
  o: Required<FpOffset>;
  W: number;
  H: number;
}
/**
 * Skalieren an einem Punkt: Ecke = proportional (die stärkere Bewegung zählt),
 * 'e' = Breite, 's' = Höhe; die gegenüberliegende Kante bleibt stehen.
 */
export function resizeTo(
  rs: ResizeStart,
  dx: number,
  dy: number,
  norm: (v: number) => number,
): Required<FpOffset> {
  const { handle: h, o } = rs;
  const sw = (rs.W * o.w) / 100;
  const sh = (rs.H * o.h) / 100;
  const growX = h.includes('e') ? dx : h.includes('w') ? -dx : 0;
  const growY = h.includes('s') ? dy : h.includes('n') ? -dy : 0;
  let nw: number;
  let nh: number;
  if (h.length === 2) {
    const f = Math.abs(growX) >= Math.abs(growY) ? (sw + growX) / sw : (sh + growY) / sh;
    nw = Math.floor(o.w * f);
    nh = Math.floor(o.h * f);
  } else {
    nw = h === 'e' ? Math.round(((sw + growX) / rs.W) * 100) : o.w;
    nh = h === 's' ? Math.round(((sh + growY) / rs.H) * 100) : o.h;
  }
  nw = norm(nw);
  nh = norm(nh);
  return {
    x: h.includes('w') ? o.x - (rs.W * (nw - o.w)) / 100 : o.x,
    y: h.includes('n') ? o.y - (rs.H * (nh - o.h)) / 100 : o.y,
    w: nw,
    h: nh,
  };
}
export const HANDLES: readonly { h: string; pos: string; title: string }[] = [
  { h: 'nw', pos: 'left:-6px;top:-6px;cursor:nwse-resize', title: 'corner' },
  { h: 'ne', pos: 'right:-6px;top:-6px;cursor:nesw-resize', title: 'corner' },
  { h: 'sw', pos: 'left:-6px;bottom:-6px;cursor:nesw-resize', title: 'corner' },
  { h: 'se', pos: 'right:-6px;bottom:-6px;cursor:nwse-resize', title: 'corner' },
  { h: 'e', pos: 'right:-6px;top:50%;margin-top:-6px;cursor:ew-resize', title: 'w' },
  { h: 's', pos: 'bottom:-6px;left:50%;margin-left:-6px;cursor:ns-resize', title: 'h' },
].map((x) => ({
  ...x,
  title:
    x.title === 'corner'
      ? 'Ecke ziehen: proportional skalieren (Inhalt skaliert mit)'
      : x.title === 'w'
        ? 'Kante ziehen: Breite'
        : 'Kante ziehen: Höhe',
}));

/**
 * Eigener Verlauf der Vorschau je Sprache (↶ Rückgängig): Gruppen mit dem
 * Zustand VOR der Änderung; bleibt über Neu-Zeichnen und Sprachwechsel erhalten.
 * Wiederholte Schritte desselben Elements innerhalb von 800 ms (Pfeiltasten,
 * Felder) zählen als einer.
 */
export type FpHistEntry = FpOffset & { key: string };
export class FpHistory {
  private stacks: Record<string, FpHistEntry[][]> = {};
  private last = { key: '', t: 0 };
  constructor(
    private max = 200,
    private now: () => number = () => Date.now(),
  ) {}
  stack(lang: string): FpHistEntry[][] {
    return (this.stacks[lang] ??= []);
  }
  /** Gruppe vor einer Änderung merken; `coalesce` fasst schnelle Wiederholungen zusammen. */
  push(lang: string, entries: FpHistEntry[], coalesce = false): boolean {
    const t = this.now();
    const key = entries.length === 1 ? entries[0]!.key : '';
    if (coalesce && key && this.last.key === key && t - this.last.t < 800) {
      this.last.t = t;
      return false;
    }
    this.last = coalesce ? { key, t } : { key: '', t: 0 };
    const s = this.stack(lang);
    s.push(entries);
    if (s.length > this.max) s.shift();
    return true;
  }
  pop(lang: string): FpHistEntry[] | undefined {
    this.last = { key: '', t: 0 };
    return this.stack(lang).pop();
  }
}
