// Daten und Hilfen für die Startseite im modernen Design (src/components/ModernHome.astro).
// Getrennt von der Komponente, damit sie ohne Astro testbar sind.

import type { ModernCat } from '../i18n/home-ui';
import { getHomeLayout } from './content';

/** Modernes Design aktiv? Nur mit Kompakt-Layout UND Schalter (Admin > Layout). */
export function isModernHome(): boolean {
  const l = getHomeLayout();
  return l.layout === 'compact' && l.modernDesign;
}

/** Karten je Reiter, bevor „Alle … anzeigen“ nötig ist (wie im Entwurf). */
export const MODERN_VISIBLE = 6;

/** Ausnahmen der Reiter-Zuordnung; sonst entscheidet die Locale-Sektion der Karte. */
const CAT_BY_KEY: Readonly<Record<string, ModernCat>> = {
  'diverseTools.videoConverter': 'video',
  'diverseTools.textEditor': 'text',
  'diverseTools.pdfEditor': 'text',
  'diverseTools.colorExtractor': 'image',
  // Favicon-Konverter (Admin-Karte, Schlüssel historisch „textEditor-kopie“).
  'diverseTools.textEditor-kopie': 'image',
};

/** Reiter einer Karte: Audio = tools.*, Bild = imageTools.* (+ Ausnahmen), sonst Bild. */
export function modernCatOf(i18nKey: string): ModernCat {
  const fixed = CAT_BY_KEY[i18nKey];
  if (fixed) return fixed;
  if (i18nKey.startsWith('tools.')) return 'audio';
  return 'image';
}

/** Linien-Icon je Karte (wenn im Admin kein eigenes Icon gesetzt ist). */
const ICON_BY_KEY: Readonly<Record<string, string>> = {
  'tools.audioConverter': 'headphones',
  'tools.audioEqualizer': 'wave',
  'tools.musicPlayer': 'play',
  'tools.audioVisualizer': 'bars',
  'tools.mp3Converter': 'convert',
  'tools.interactiveEqualizer': 'sliders',
  'tools.modernPlayer': 'radio',
  'tools.playlistGenerator': 'list',
  'tools.alarmTool': 'clock',
  'tools.audioNormalizer': 'sliders',
  'tools.playlistToWebm': 'convert',
  'tools.audioCutter': 'scissors',
  'imageTools.imageConverter': 'image',
  'imageTools.batchImageEditor': 'layers',
  'imageTools.photoCollage': 'collage',
  'diverseTools.colorExtractor': 'drop',
  'diverseTools.videoConverter': 'play',
  'diverseTools.textEditor': 'text',
  'diverseTools.pdfEditor': 'pdf',
  'diverseTools.textEditor-kopie': 'favicon',
};

export function modernIconOf(i18nKey: string): string {
  return ICON_BY_KEY[i18nKey] ?? 'convert';
}

/** Icon-ID eines Vorteils (hero.features.*), unbekannte Schlüssel: Häkchen. */
export function featureIconId(key: string): string {
  return `f-${key}` in MODERN_ICONS ? `f-${key}` : 'f-check';
}

/**
 * Titel mit Akzent: Text zwischen *…* wird farbig hervorgehoben (Admin-Text, z. B.
 * „Kostenlose Tools für *Audio, Bild, Video* und Text“). Ohne Sternchen: ein Teil ohne Akzent.
 * Ein einzelnes Sternchen ohne Gegenstück bleibt als Zeichen stehen.
 */
export function splitAccent(text: string): { text: string; accent: boolean }[] {
  const parts = text.split('*');
  if (parts.length < 3) return text ? [{ text, accent: false }] : [];
  // Ungerade Anzahl Sternchen: das letzte gehört zum Text.
  if (parts.length % 2 === 0) {
    const tail = parts.pop() ?? '';
    parts[parts.length - 1] += `*${tail}`;
  }
  return parts.map((t, i) => ({ text: t, accent: i % 2 === 1 })).filter((p) => p.text !== '');
}

/** Titel ohne Akzent-Markierung (klassisches Design, Texte außerhalb des Hero). */
export function stripAccent(text: string): string {
  return splitAccent(text)
    .map((p) => p.text)
    .join('');
}

/** SVG-Pfade (24×24, Linien) für das Inline-Sprite der Seite. */
export const MODERN_ICONS: Readonly<Record<string, string>> = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  burger: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'play-solid': '<path fill="currentColor" stroke="none" d="M6 4v16l14-8z"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  headphones:
    '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/>',
  wave: '<path d="M3 10v4M7 7v10M11 3v18M15 8v8M19 10v4" stroke-width="2"/>',
  play: '<circle cx="12" cy="12" r="9.5"/><path d="M10 8v8l6-4z" fill="currentColor"/>',
  sliders:
    '<path d="M3 6h18M3 12h18M3 18h18"/><g fill="currentColor" stroke="none"><circle cx="15" cy="6" r="1.8"/><circle cx="9" cy="12" r="1.8"/><circle cx="14" cy="18" r="1.8"/></g>',
  radio:
    '<path fill="currentColor" stroke="none" d="M4 8h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2zm4 3.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM14 12v1.6h5V12zm0 3v1.6h5V15z"/><path d="m5 8 11-5"/>',
  convert: '<path d="M4 7h16M16 3l4 4-4 4M20 17H4m4-4-4 4 4 4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
  music:
    '<path d="M9 18V5l12-2v13M9 9l12-2"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  list: '<path d="M3 6h12M3 12h12M3 18h8"/><circle cx="18" cy="17" r="2.5"/><path d="M20.5 17V8l2-1"/>',
  scissors:
    '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
  image:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9.5" r="1.6"/><path d="m4 18 5-5 3 3 3-4 5 6"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 12 10 5 10-5M2 17l10 5 10-5"/>',
  collage:
    '<rect x="3" y="3" width="8" height="18" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
  drop: '<path d="M12 2.7 6.3 9a8 8 0 1 0 11.4 0z"/>',
  text: '<path d="M5 5h14M12 5v15M9 20h6"/>',
  pdf: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  favicon:
    '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m12 7 1.5 3.2 3.5.4-2.6 2.4.7 3.5L12 14.8 8.9 16.5l.7-3.5L7 10.6l3.5-.4z"/>',
  'cat-audio':
    '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/>',
  'cat-image':
    '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9.5" r="1.6"/><path d="m4 18 5-5 3 3 3-4 5 6"/>',
  'cat-video': '<path d="M6 4v16l14-8z"/>',
  'cat-text': '<path d="M5 5h14M12 5v15M9 20h6M5 5v2M19 5v2"/>',
  'f-free': '<path fill="currentColor" stroke="none" d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  'f-privacy':
    '<path fill="currentColor" stroke="none" d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/><path d="m8.5 12 2.5 2.5 4.5-5" style="stroke:var(--md-bg)" stroke-width="2.2"/>',
  'f-browserBased':
    '<path fill="currentColor" stroke="none" d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/><path d="m8.5 12 2.5 2.5 4.5-5" style="stroke:var(--md-bg)" stroke-width="2.2"/>',
  'f-serverBased':
    '<rect x="3" y="3" width="18" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/><path d="M7 7h.01M7 17h.01"/>',
  'f-multiLanguage':
    '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.8 3 2.8 16 0 19M12 2.5c-2.8 3-2.8 16 0 19"/>',
  'f-noInstall': '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  'f-check': '<path d="M20 6 9 17l-5-5"/>',
  bars: '<g fill="currentColor" stroke="none"><rect x="3" y="14" width="3" height="7" rx="1.2"/><rect x="8" y="11" width="3" height="10" rx="1.2"/><rect x="13" y="7" width="3" height="14" rx="1.2"/><rect x="18" y="3" width="3" height="18" rx="1.2"/></g>',
  film: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4M3 12h18"/>',
  gif: '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M9 10H7.5a1.5 1.5 0 0 0 0 3H9v-1.5M12 9.5v5M15 14.5v-5h2.5M15 12h2"/>',
  camera: '<rect x="2" y="6" width="14" height="12" rx="2"/><path d="m16 10 6-3v10l-6-3z"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
};

/**
 * Dicke der 3D-Kachel: 30 gestapelte Bild-Ebenen (1 px Abstand) hinter der Front, hinten
 * dunkler (tile-layer-1…4), vorn die helle Kante (tile-layer-5). Bilder statt CSS-Masken,
 * weil Safari Masken in 3D nicht zuverlässig zeichnet. `fine`: Zwischenebenen, die Handy
 * und Tablet weglassen (gleiche Dicke mit 10 statt 30 Ebenen, wie im Entwurf).
 * Reihenfolge von hinten nach vorn.
 */
export const TILE_LAYERS: readonly { depth: number; src: string; fine: boolean }[] = Array.from(
  { length: 30 },
  (_, n) => {
    const depth = 30 - n;
    const k = depth / 30;
    const n4 = Math.min(3, Math.floor(k * 4 - 1e-9));
    return {
      depth,
      src: `/image/home/tile/tile-layer-${depth <= 1 ? 5 : n4 + 1}.webp`,
      // Handy: jede dritte Ebene; statt Tiefe 3 die helle Kante (Tiefe 1).
      fine: depth === 3 || (depth !== 1 && depth % 3 !== 0),
    };
  },
);
