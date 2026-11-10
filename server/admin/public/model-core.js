// @ts-check
// Datenmodell des Adminbereichs – Kern: reine Helfer ohne Abhängigkeiten
// (Farben, Schrift-Dateinamen, Medien-URLs, Pfad-Helfer), Sprach-/Slot-Konstanten
// und Navigations-Daten. Alle anderen model-*.js bauen darauf auf; nach außen
// wird alles über model.js gebündelt.

/** @import { Lang, Subtab, MediaKey, ObjPath, AnyObj } from '../types.ts' */

// Buchstabenabstand auf [-5, 20] px begrenzen, auf 0,5 gerundet.
/**
 * @param {unknown} v
 * @param {number} def Rückgabe bei ungültigem Wert
 * @returns {number}
 */
export function clampSpacing(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(-5, Math.min(20, Math.round(n * 2) / 2)) : def;
}
// Erlaubt einen einfachen Schrift-Dateinamen oder '' (Standardschrift).
/**
 * @param {unknown} v
 * @returns {string}
 */
export function normFontFile(v) {
  return typeof v === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._ -]*\.(woff2|woff|ttf|otf)$/i.test(v)
    ? v
    : '';
}
// Hex + Deckkraft(%) -> rgba() (für Vorschau). Ungültiges Hex kommt unverändert zurück.
/**
 * @template T
 * @param {T} hex
 * @param {unknown} opacityPct
 * @returns {string | T}
 */
export function rgbaFromHex(hex, opacityPct) {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(String(hex || '').trim());
  if (!m) return hex;
  let h = m[1];
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = Math.max(0, Math.min(100, Number(opacityPct) || 0)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
// Hex-Farbe (#rgb oder #rrggbb) oder '' (= Standard/keine eigene Farbe).
/**
 * @param {unknown} v
 * @returns {string}
 */
export function normHexOrEmpty(v) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v)) ? /** @type {string} */ (v) : '';
}
// Verfügbare Text-Animationen des Banner-Textes (zuschaltbar) und Tempo-Stufen.
export const BANNER_ANIM_TYPES = ['none', 'pulse', 'float', 'shake', 'wobble', 'glow'];
export const BANNER_ANIM_SPEEDS = ['slow', 'normal', 'fast'];
// Erlaubte Medien-URLs der Bild-Plätze: interner Pfad, http(s)-URL oder eine
// gestagte Datei ('staged:<id>') bis zum Veröffentlichen.
const SITE_MEDIA_URL = /^(\/[^\s"'()\\]*|https?:\/\/[^\s"'()\\]+|staged:[\w-]+)$/;
/**
 * @param {unknown} v
 * @returns {string}
 */
export function normSiteMediaUrl(v) {
  const t = String(v ?? '').trim();
  return SITE_MEDIA_URL.test(t) ? t : '';
}

// Sprachen + Slots. 'heroBanner' liegt auf oberster Ebene der Sprache, die
// anderen unter sectionVideos.
/** @type {Lang[]} */
export const MEDIA_LANGS = ['de', 'en'];
// Slot-Schlüssel: Sektions-Videos, Einzel-Banner und die sechs Rasterbilder.
/** @type {MediaKey[]} */
export const MEDIA_KEYS = [
  'audio',
  'image',
  'diverse',
  'heroBanner',
  'grid0',
  'grid1',
  'grid2',
  'grid3',
  'grid4',
  'grid5',
];

// --- Pfad-Helfer für verschachtelte Overrides ---
// Pfade sind Schlüssel-Listen, z. B. ['hero', 'title'] bzw. ['items', 0].

/**
 * @param {unknown} obj
 * @param {ObjPath} path
 * @returns {unknown}
 */
export function getPath(obj, path) {
  /** @type {any} */
  let cur = obj;
  for (const k of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[k];
  }
  return cur;
}
/**
 * Legt fehlende Zwischen-Objekte an.
 * @param {AnyObj} obj
 * @param {ObjPath} path
 * @param {unknown} value
 * @returns {void}
 */
export function setPath(obj, path, value) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (typeof cur[path[i]] !== 'object' || cur[path[i]] == null) cur[path[i]] = {};
    cur = cur[path[i]];
  }
  cur[path[path.length - 1]] = value;
}
/**
 * Löscht den Schlüssel und räumt dabei leer gewordene Eltern-Objekte auf.
 * @param {AnyObj} obj
 * @param {ObjPath} path
 * @returns {void}
 */
export function delPath(obj, path) {
  const stack = [obj];
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (cur[path[i]] == null) return;
    cur = cur[path[i]];
    stack.push(cur);
  }
  delete cur[path[path.length - 1]];
  // leere Eltern-Objekte aufräumen
  for (let i = path.length - 2; i >= 0; i--) {
    const parent = stack[i];
    const key = path[i];
    if (parent[key] && typeof parent[key] === 'object' && Object.keys(parent[key]).length === 0)
      delete parent[key];
  }
}

// --- Navigation: Ebenen-Konstanten (reine Daten) ---
/** @type {Subtab[]} */
export const SUBTABS = [
  { key: 'ticker', label: 'Laufband' },
  { key: 'texts', label: 'Texte' },
  { key: 'media', label: 'Medien' },
  { key: 'layout', label: 'Layout' },
  { key: 'design', label: 'Hero-Design' },
  { key: 'background', label: 'Hintergrund' },
  { key: 'cards', label: 'Tool-Karten' },
  { key: 'files', label: 'Dateien' },
  { key: 'icons', label: 'Icons' },
  { key: 'advanced', label: 'Erweitert' },
];
/** @type {Lang[]} */
export const LANG_SECTIONS = ['de', 'en'];
