// Datenmodell – Laufband: Standardwerte und Normalisierung (Einträge, Design
// mit Farben je Hell/Dunkel und geteilter Typografie).

import { clampSpacing, normFontFile } from './model-core.js';

// --- Ticker-Standard & -Normalisierung ---
export function emptyTicker() {
  return { enabled: false, speed: 'normal', items: [], style: defaultTickerStyle() };
}
// Standard-Farben des Laufbands je Modus (entsprechen dem eingebauten Aussehen in
// TickerBar.astro: Hell = Blau/Weiß, Dunkel = Navy/Hellgrau).
export function defaultTickerColors(mode) {
  return mode === 'dark'
    ? { textColor: '#e2e8f0', bgColor: '#111827', bgOpacity: 100 }
    : { textColor: '#ffffff', bgColor: '#014f99', bgOpacity: 100 };
}
export function defaultTickerStyle() {
  return {
    enabled: false,
    // Geteilte Typografie (gilt für Hell- und Dunkelmodus).
    fontSize: 14,
    fontFamily: '',
    letterSpacing: 0,
    // Farben getrennt je Modus.
    light: defaultTickerColors('light'),
    dark: defaultTickerColors('dark'),
  };
}
// Laufband-Design normalisieren (aus geladener Config). Migriert die alte flache
// Struktur (Farben auf oberster Ebene, für beide Modi gleich) auf getrennte
// Farb-Sätze light/dark — verhaltensneutral (die alten Farben galten global).
export function normTickerStyle(s) {
  const d = defaultTickerStyle();
  if (!s || typeof s !== 'object') return d;
  const clamp = (v, min, max, def) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : def;
  };
  const hex = (v, def) => (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v)) ? v : def);
  const hasSides =
    (s.light && typeof s.light === 'object') || (s.dark && typeof s.dark === 'object');
  const flat =
    !hasSides && (typeof s.textColor === 'string' || typeof s.bgColor === 'string') ? s : null;
  const colors = (side, def) => {
    const o = side && typeof side === 'object' ? side : flat || {};
    return {
      textColor: hex(o.textColor, def.textColor),
      bgColor: hex(o.bgColor, def.bgColor),
      bgOpacity: clamp(o.bgOpacity, 0, 100, def.bgOpacity),
    };
  };
  return {
    enabled: s.enabled === true,
    fontSize: clamp(s.fontSize, 8, 48, d.fontSize),
    fontFamily: normFontFile(s.fontFamily),
    letterSpacing: clampSpacing(s.letterSpacing, d.letterSpacing),
    light: colors(s.light, d.light),
    dark: colors(s.dark, d.dark),
  };
}
// Vollständige Ticker-Konfiguration einer Sprache normalisieren.
export function normTicker(t) {
  if (!t || typeof t !== 'object') return emptyTicker();
  return {
    enabled: t.enabled === true,
    speed: ['slow', 'normal', 'fast'].includes(t.speed) ? t.speed : 'normal',
    items: Array.isArray(t.items)
      ? t.items.map((i) => ({ id: String(i.id ?? ''), text: i.text || '', link: i.link || '' }))
      : [],
    style: normTickerStyle(t.style),
  };
}
