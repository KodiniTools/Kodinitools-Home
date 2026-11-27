// Daten und Hilfen für die Startseite im modernen Design (src/components/ModernHome.astro).
// Getrennt von der Komponente, damit sie ohne Astro testbar sind.

import type { ModernCat } from '../i18n/home-ui';
import { getHomeLayout } from './content';

export {
  featureIconId,
  splitAccent,
  stripAccent,
  MODERN_ICONS,
  TILE_LAYERS,
} from './modernHomeBase';

/** Modernes Design aktiv? Nur mit Kompakt-Layout UND Schalter (Admin > Layout). */
export function isModernHome(): boolean {
  const l = getHomeLayout();
  return l.layout === 'compact' && l.modernDesign;
}

/** Karten je Reiter, bevor „Alle … anzeigen“ nötig ist (wie im Entwurf). */
export const MODERN_VISIBLE = 6;

/** Ausnahmen der Reiter-Zuordnung; sonst entscheidet die Locale-Sektion der Karte. */
const CAT_BY_KEY: Readonly<Record<string, ModernCat>> = {
  'diverseTools.videoConverter': 'media',
  'diverseTools.textEditor': 'media',
  'diverseTools.pdfEditor': 'media',
  'diverseTools.colorExtractor': 'image',
  // Favicon-Generator (Admin-Karte, Schlüssel historisch „textEditor-kopie“).
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
