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
  'tools.audioVisualizer': 'wave',
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
  search: '<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  burger: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'play-solid': '<path d="m7 4 13 8-13 8z" fill="currentColor" stroke="none"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  headphones:
    '<path d="M3 14v-3a9 9 0 0 1 18 0v3M3 14v5a2 2 0 0 0 2 2h2v-8H5a2 2 0 0 0-2 2m18-1v5a2 2 0 0 1-2 2h-2v-8h2a2 2 0 0 1 2 2"/>',
  wave: '<path d="M3 9v6M7 4v16M11 8v8M15 2v20M19 6v12M23 10v4"/>',
  play: '<path d="m7 3 14 9-14 9z"/>',
  sliders:
    '<path d="M3 6h18M3 12h18M3 18h18"/><circle cx="8" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/>',
  radio:
    '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M5 8 18 3M15 13h4M15 17h4"/><circle cx="8" cy="15" r="3"/>',
  convert: '<path d="M4 7h16M16 3l4 4-4 4M20 17H4m4-4-4 4 4 4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',
  music:
    '<path d="M9 18V5l12-2v13M9 9l12-2"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  list: '<path d="M3 6h12M3 12h12M3 18h8"/><circle cx="18" cy="17" r="2.5"/><path d="M20.5 17V8l2-1"/>',
  scissors:
    '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12"/>',
  image:
    '<rect x="2" y="3" width="20" height="18" rx="2"/><circle cx="8" cy="9" r="2"/><path d="m2 18 6-6 4 4 4-5 6 7"/>',
  layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 12 10 5 10-5M2 17l10 5 10-5"/>',
  collage:
    '<rect x="3" y="3" width="8" height="18" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/>',
  drop: '<path d="M12 2.7 6.3 9a8 8 0 1 0 11.4 0z"/>',
  text: '<path d="M3 6V4h18v2M12 4v16m-5 0h10"/>',
  favicon:
    '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m12 7 1.5 3.2 3.5.4-2.6 2.4.7 3.5L12 14.8 8.9 16.5l.7-3.5L7 10.6l3.5-.4z"/>',
  'cat-audio':
    '<path d="M3 14v-3a9 9 0 0 1 18 0v3M3 14v5a2 2 0 0 0 2 2h2v-8H5a2 2 0 0 0-2 2m18-1v5a2 2 0 0 1-2 2h-2v-8h2a2 2 0 0 1 2 2"/>',
  'cat-image':
    '<rect x="2" y="3" width="20" height="18" rx="2"/><circle cx="8" cy="9" r="2"/><path d="m2 18 6-6 4 4 4-5 6 7"/>',
  'cat-video': '<path d="m7 3 14 9-14 9z"/>',
  'cat-text': '<path d="M3 6V4h18v2M12 4v16m-5 0h10"/>',
  'f-free': '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  'f-privacy': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  'f-browserBased':
    '<path d="m12 3 8.5 6.2-3.2 10H6.7L3.5 9.2z" fill="currentColor" stroke="none"/>',
  'f-serverBased':
    '<rect x="3" y="3" width="18" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/><path d="M7 7h.01M7 17h.01"/>',
  'f-multiLanguage': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
  'f-noInstall': '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  'f-check': '<path d="M20 6 9 17l-5-5"/>',
};
