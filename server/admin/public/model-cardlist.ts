// Datenmodell – Liste der Tool-Karten: Standard-Karten aus den Sprachdateien plus
// im Admin angelegte Karten (Duplikat oder neu, Tab „Tool-Karten").
//
// Eine angelegte Karte existiert nur als Override (overrides.<lang>.json) unter
// "<sektion>.<key>" mit title/badge/description/link/svg – die Seite mergt die
// Overrides tief über die Sprachdatei (content.ts deepMerge) und rendert jeden
// Eintrag mit title + link als Karte. Angelegt wird immer in DE und EN, damit die
// Karte in beiden Sprachen existiert.

import type { Lang, AnyObj } from '../types';

import { getPath, delPath, MEDIA_LANGS } from './model-core';
import { state } from './model-state';
import { TOOL_CARD_KEY } from './model-toolcards';
import { setCardHidden } from './model-site';

export type ToolCardSection = 'tools' | 'imageTools' | 'diverseTools';
export const TOOL_CARD_SECTIONS: ToolCardSection[] = ['tools', 'imageTools', 'diverseTools'];
// Textfelder einer Karte (Override-Felder der Sprachdatei).
export const CARD_TEXT_KEYS = ['title', 'badge', 'description', 'link', 'svg'];
const COPY_SUFFIX = { de: ' (Kopie)', en: ' (Copy)' };
const KEY_MAX = 60;

const isObj = (v: unknown): v is AnyObj => !!v && typeof v === 'object' && !Array.isArray(v);
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
/** Overrides einer Sprache als beschreibbares Objekt. */
const ovr = (lang: Lang) => state.overrides[lang] as AnyObj;

/**
 * Ist ein Locale-Eintrag eine Tool-Karte (wie isTool auf der Startseite)?
 */
export function isToolCardEntry(e: unknown) {
  return isObj(e) && 'title' in e && 'link' in e;
}

/**
 * Schlüssel der Karten einer Sektion in Seiten-Reihenfolge: zuerst die Karten
 * der Sprachdatei, dann die im Admin angelegten (nur im Override vorhanden).
 */
export function toolCardKeys(lang: Lang, section: string): string[] {
  const defs = getPath(state.defaults[lang], [section]);
  const ovs = getPath(state.overrides[lang], [section]);
  const out = [];
  if (isObj(defs)) for (const [k, e] of Object.entries(defs)) if (isToolCardEntry(e)) out.push(k);
  if (isObj(ovs))
    for (const [k, e] of Object.entries(ovs))
      if (!(isObj(defs) && k in defs) && isToolCardEntry(e)) out.push(k);
  return out;
}

/**
 * Im Admin angelegte Karte (in keiner Sprachdatei vorhanden)?
 */
export function isCustomCard(id: string) {
  if (!TOOL_CARD_KEY.test(id)) return false;
  const path = id.split('.');
  return MEDIA_LANGS.every((l) => getPath(state.defaults[l], path) === undefined);
}

// Effektiver Text eines Karten-Felds (Override, sonst Sprachdatei; '' bleibt '').
/** @param lang @param path */
function effField(lang: Lang, path: string[]) {
  const o = getPath(state.overrides[lang], path);
  if (o !== undefined) return typeof o === 'string' ? o : '';
  const d = getPath(state.defaults[lang], path);
  return typeof d === 'string' ? d : '';
}

// Ist "<sektion>.<key>" in irgendeiner Sprache (Datei oder Override) belegt?
/** @param section @param key */
function keyTaken(section: string, key: string) {
  return MEDIA_LANGS.some(
    (l) =>
      getPath(state.defaults[l], [section, key]) !== undefined ||
      getPath(state.overrides[l], [section, key]) !== undefined,
  );
}

/**
 * Freier Karten-Schlüssel "<base>", "<base>-2", … (nur a-z, 0-9, _ und -).
 */
export function uniqueCardKey(section: string, base: unknown): string {
  const b =
    String(base || '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, KEY_MAX) || 'karte';
  if (!keyTaken(section, b)) return b;
  for (let i = 2; ; i++) {
    const k = `${b}-${i}`;
    if (!keyTaken(section, k)) return k;
  }
}

// Titel der Kopie: Suffix an die letzte Zeile (Titel haben max. 2 Zeilen).
/** @param title @param lang */
function copyTitle(title: unknown, lang: Lang) {
  const t = String(title || '').trim();
  return t ? `${t}${COPY_SUFFIX[lang]}` : COPY_SUFFIX[lang].trim();
}

/**
 * Dupliziert eine Karte in DE + EN: Texte (Titel mit „(Kopie)"/„(Copy)", Badge,
 * Beschreibung, Link, Icon), Einzel-Design (Hell + Dunkel, Typografie,
 * Sichtbarkeit) und Icon-Färbung je Sprache. Position/Größe (Layout-Tab) und
 * „ausgeblendet" werden nicht übernommen. Gibt die neue Karten-ID zurück.
 */
export function duplicateCard(srcId: string): string | null {
  if (!TOOL_CARD_KEY.test(srcId)) return null;
  const [section, srcKey] = srcId.split('.');
  const key = uniqueCardKey(section, `${srcKey}-kopie`);
  const id = `${section}.${key}`;
  for (const lang of MEDIA_LANGS) {
    const entry: Record<string, string> = {};
    for (const f of CARD_TEXT_KEYS) entry[f] = effField(lang, [section, srcKey, f]);
    entry.title = copyTitle(entry.title, lang);
    const o = ovr(lang);
    if (!isObj(o[section])) o[section] = {};
    o[section][key] = entry;
    const m = state.media[lang];
    if (!m) continue;
    if (isObj(m.toolCards?.cards) && isObj(m.toolCards.cards[srcId]))
      m.toolCards.cards[id] = clone(m.toolCards.cards[srcId]);
    if (isObj(m.iconTint) && isObj(m.iconTint[srcId])) m.iconTint[id] = clone(m.iconTint[srcId]);
  }
  return id;
}

/**
 * Legt eine leere Karte in DE + EN an (Standard-Design). Sie startet auf der
 * Seite ausgeblendet, damit keine leere Karte live geht; „Wieder einblenden"
 * zeigt sie an. Gibt die neue Karten-ID zurück.
 */
export function createCard(section: string): string | null {
  if (!TOOL_CARD_SECTIONS.includes(section as ToolCardSection)) return null;
  const key = uniqueCardKey(section, 'neue-karte');
  for (const lang of MEDIA_LANGS) {
    const o = ovr(lang);
    if (!isObj(o[section])) o[section] = {};
    const entry: Record<string, string> = {};
    for (const f of CARD_TEXT_KEYS) entry[f] = '';
    o[section][key] = entry;
  }
  const id = `${section}.${key}`;
  setCardHidden(id, true);
  return id;
}

/**
 * Löscht eine im Admin angelegte Karte vollständig (Texte DE + EN, Einzel-Design,
 * Icon-Färbung, Position, Ausblenden). Karten aus der Sprachdatei: false.
 */
export function deleteCustomCard(id: string) {
  if (!isCustomCard(id)) return false;
  const path = id.split('.');
  for (const lang of MEDIA_LANGS) {
    delPath(ovr(lang), path);
    const m = state.media[lang];
    if (!m) continue;
    if (isObj(m.toolCards?.cards)) delete m.toolCards.cards[id];
    if (isObj(m.iconTint)) delete m.iconTint[id];
    if (isObj(m.toolCardOffsets)) delete m.toolCardOffsets[id];
  }
  setCardHidden(id, false);
  return true;
}
