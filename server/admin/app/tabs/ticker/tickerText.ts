/**
 * Reine Helfer des Laufband-Tabs (ohne DOM/State), 1:1 aus `public/ticker.js`
 * übernommen: Inline-Links `[Wort](url)`, einzeilige Darstellung, Vorschau-Stil.
 */
import type { ThemeMode, TickerItem, TickerStyle } from '../../../types';
import { rgbaFromHex } from '../../../public/model-core';

/** Erlaubte Link-Ziele: intern (`/…`) oder extern (`http(s)://…`), wie TickerBar.astro. */
export const VALID_LINK = /^(\/[^\s]*|https?:\/\/[^\s]+)$/;

/** Zeilenumbrüche → Leerzeichen (das Laufband läuft immer einzeilig). */
export function oneLine(text: unknown): string {
  return String(text ?? '').replace(/\s*[\r\n]+\s*/g, ' ');
}

export type TickerSegment =
  | { kind: 'text'; text: string }
  | { kind: 'link'; text: string; url: string };

/**
 * Zerlegt den Text in Text- und Link-Stücke. Ungültige Link-Ziele bleiben
 * wörtlich stehen (wie auf der Seite). Ersetzt die bisherige HTML-Erzeugung
 * per String: Vue rendert die Stücke escaped.
 */
export function parseTickerText(text: unknown): TickerSegment[] {
  const src = oneLine(text);
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  const out: TickerSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const pushText = (s: string) => {
    if (!s) return;
    const prev = out[out.length - 1];
    if (prev && prev.kind === 'text') prev.text += s;
    else out.push({ kind: 'text', text: s });
  };
  while ((m = re.exec(src)) !== null) {
    pushText(src.slice(last, m.index));
    const [full, label = '', url = ''] = m;
    if (VALID_LINK.test(url)) out.push({ kind: 'link', text: label, url });
    else pushText(full);
    last = m.index + full.length;
  }
  pushText(src.slice(last));
  return out;
}

export type InsertLinkResult = { ok: true } | { ok: false; msg: string };

/**
 * Fügt `[Wort](url)` in den Text des Eintrags ein (ersetzt das erste Vorkommen
 * des Wortes, sonst angehängt). Verändert `item` direkt.
 */
export function insertInlineLink(item: TickerItem, word: string, url: string): InsertLinkResult {
  const w = (word || '').trim();
  const u = (url || '').trim();
  if (!w || !u) return { ok: false, msg: 'Bitte Wort und Link ausfüllen.' };
  if (!VALID_LINK.test(u))
    return { ok: false, msg: 'Der Link muss mit / (intern) oder http(s):// (extern) beginnen.' };
  const text = item.text || '';
  const md = `[${w}](${u})`;
  const idx = text.indexOf(w);
  item.text =
    idx >= 0 ? text.slice(0, idx) + md + text.slice(idx + w.length) : text ? `${text} ${md}` : md;
  return { ok: true };
}

/**
 * Inline-Stil der Vorschau für einen Modus. `fontFamilyId` ist der per
 * `ensureFontFace` geladene Family-Name ('' = Systemschrift).
 */
export function tickerPreviewStyle(
  s: TickerStyle,
  mode: ThemeMode,
  fontFamilyId: string,
): Record<string, string> {
  const c = s[mode] || s.light;
  const style: Record<string, string> = {
    background: String(rgbaFromHex(c.bgColor, c.bgOpacity)),
    color: c.textColor,
    fontSize: `${s.fontSize}px`,
    letterSpacing: `${Number(s.letterSpacing) || 0}px`,
    fontWeight: '500',
    padding: '8px 14px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };
  if (fontFamilyId) style.fontFamily = `"${fontFamilyId}", system-ui, sans-serif`;
  return style;
}

/** Hinweis unter der Vorschau: geht das Design tatsächlich live? */
export function tickerPreviewNote(s: TickerStyle): string {
  return s.enabled
    ? '✅ Dieses Design wird auf der Seite angewandt.'
    : '⚠️ „Eigenes Design verwenden" ist aus – auf der Seite erscheint das Standard-Design (Blau). Die Vorschau zeigt dein eingestelltes Design.';
}

/** Schriftgröße wie bisher: 8–48 px, ungültig → 14. */
export function clampFontSize(v: unknown): number {
  return Math.max(8, Math.min(48, parseInt(String(v), 10) || 14));
}

/** Deckkraft 0–100 %, ungültig → 0 (wie bisher). */
export function clampOpacity(v: unknown): number {
  return Math.max(0, Math.min(100, parseInt(String(v), 10) || 0));
}
