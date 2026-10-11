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
