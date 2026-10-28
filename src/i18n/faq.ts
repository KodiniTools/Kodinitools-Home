// Feste Texte der FAQ-Seite (/faq/, /en/faq/). Fragen, Titel und Untertitel
// kommen aus src/locales/*.json (faq.*) über content.ts.

import type { Lang } from './lang';

export const FAQ_PATH: Record<Lang, string> = { de: '/faq/', en: '/en/faq/' };

export const FAQ_PAGE: Record<
  Lang,
  { title: string; description: string; ogTitle: string; ogDescription: string; listLabel: string }
> = {
  de: {
    title: 'FAQ – Häufige Fragen zu KodiniTools | Kostenlose Online Tools',
    description:
      'Antworten auf die häufigsten Fragen zu KodiniTools: MP3 konvertieren, Bilder umwandeln, Audio normalisieren, Datenschutz, Dateiformate und mehr – kostenlos, ohne Registrierung.',
    ogTitle: 'FAQ – Häufige Fragen zu KodiniTools',
    ogDescription:
      'Antworten zu MP3 konvertieren, Bildformate, Datenschutz, Dateigrössen und mehr.',
    listLabel: 'Häufig gestellte Fragen',
  },
  en: {
    title: 'FAQ – Frequently Asked Questions about KodiniTools | Free Online Tools',
    description:
      'Answers to the most common questions about KodiniTools: convert MP3, convert images, normalize audio, privacy, file formats and more – free, no registration required.',
    ogTitle: 'FAQ – Frequently Asked Questions about KodiniTools',
    ogDescription: 'Answers about MP3 conversion, image formats, privacy, file sizes and more.',
    listLabel: 'Frequently Asked Questions',
  },
};

/** Ein Abschnitt einer FAQ-Antwort: reiner Text oder ein Link auf ein Tool/eine Seite. */
export interface FaqSegment {
  text: string;
  href?: string;
}

// Tool- und Seitennamen, wie sie in den FAQ-Antworten vorkommen, mit ihrer Live-URL.
// URLs stammen aus den Tool-Karten (src/locales/*.json, link) und der GlobalNav.
// Neue Tools/Schreibweisen hier ergänzen, dann werden sie in allen Antworten verlinkt.
const TOOL_URL = {
  audioConverter: 'https://kodinitools.com/audiokonverter/',
  mp3Converter: 'https://kodinitools.com/mp3konverter/',
  audioNormalizer: 'https://kodinitools.com/audionormalisierer/',
  audioVisualizer: 'https://kodinitools.com/visualizer/',
  audioCutter: 'https://kodinitools.com/audio-cutter/',
  playlistConverter: 'https://kodinitools.com/playlistkonverter/',
  imageConverter: 'https://kodinitools.com/bildkonverter/',
  batchImageEditor: 'https://kodinitools.com/bilderseriebearbeiten/',
  photoCollage: 'https://kodinitools.com/collagemaker/',
  colorExtractor: 'https://kodinitools.com/kodini-color-extractor/',
  videoConverter: 'https://kodinitools.com/videokonverter/',
  faviconConverter: 'https://kodinitools.com/favicon-tool/',
  gallery: 'https://kodinitools.com/bildergalerie/',
  contact: 'https://kodinitools.com/kontaktformular/',
  privacy: 'https://kodinitools.com/datenschutz/',
} as const;

export const FAQ_LINKS: Record<Lang, Record<string, string>> = {
  de: {
    'Audio Konverter': TOOL_URL.audioConverter,
    'MP3 Konverter': TOOL_URL.mp3Converter,
    'Audio Normalizer': TOOL_URL.audioNormalizer,
    'Audio Visualizer': TOOL_URL.audioVisualizer,
    'Audio-Schneider': TOOL_URL.audioCutter,
    'Wiedergabeliste Konverter': TOOL_URL.playlistConverter,
    Bildkonverter: TOOL_URL.imageConverter,
    'Batch Bildbearbeiter': TOOL_URL.batchImageEditor,
    'Fotocollage-Tool': TOOL_URL.photoCollage,
    'Kodini Farbextraktor': TOOL_URL.colorExtractor,
    Videokonverter: TOOL_URL.videoConverter,
    'Favicon Konverter': TOOL_URL.faviconConverter,
    Bildergalerie: TOOL_URL.gallery,
    Kontaktformular: TOOL_URL.contact,
    Datenschutzerklärung: TOOL_URL.privacy,
  },
  en: {
    'Audio Converter': TOOL_URL.audioConverter,
    'MP3 Converter': TOOL_URL.mp3Converter,
    'Audio Normalizer': TOOL_URL.audioNormalizer,
    'Audio Visualizer': TOOL_URL.audioVisualizer,
    'Audio Cutter': TOOL_URL.audioCutter,
    'Audio Playlist Converter': TOOL_URL.playlistConverter,
    'Image Converter': TOOL_URL.imageConverter,
    'Batch Image Editor': TOOL_URL.batchImageEditor,
    'Photo Collage tool': TOOL_URL.photoCollage,
    'Kodini Color Extractor': TOOL_URL.colorExtractor,
    'Video Converter': TOOL_URL.videoConverter,
    'Favicon Converter': TOOL_URL.faviconConverter,
    'Image Gallery': TOOL_URL.gallery,
    'contact form': TOOL_URL.contact,
    'privacy policy': TOOL_URL.privacy,
  },
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Zerlegt eine FAQ-Antwort in Text- und Link-Abschnitte. Jede Erwähnung eines
 * Namens aus `links` wird verlinkt (exakte Schreibweise, nur ganze Wörter;
 * längere Namen haben Vorrang vor kürzeren).
 */
export function linkFaqAnswer(text: string, links: Record<string, string>): FaqSegment[] {
  const names = Object.keys(links).sort((a, b) => b.length - a.length);
  if (names.length === 0 || text === '') return [{ text }];
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(?:${names.map(escapeRegExp).join('|')})(?![\\p{L}\\p{N}])`,
    'gu',
  );
  const out: FaqSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    const start = m.index;
    if (start > last) out.push({ text: text.slice(last, start) });
    out.push({ text: m[0], href: links[m[0]] });
    last = start + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** HTML-Fassung für das FAQPage-JSON-LD (Google erlaubt <a> in Answer.text). */
export function faqSegmentsToHtml(segments: FaqSegment[]): string {
  return segments
    .map((s) =>
      s.href ? `<a href="${escapeHtml(s.href)}">${escapeHtml(s.text)}</a>` : escapeHtml(s.text),
    )
    .join('');
}
