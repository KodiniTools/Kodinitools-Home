// Feste Texte der Blog-Übersicht (/blog/, /en/blog/) je Sprache.

import type { Lang } from './lang';

export const BLOG_INDEX_PATH: Record<Lang, string> = { de: '/blog/', en: '/en/blog/' };

export interface BlogIndexTexts {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  heading: string;
  subtitle: string;
  /** Überschrift mit Anzahl, z. B. „19 Beiträge von Dinko Ramić“. */
  count: (n: number) => string;
  searchLabel: string;
  searchPlaceholder: string;
  /** Platzhalter {n} und {total} ersetzt das Such-Skript im Browser. */
  searchFound: string;
  searchFoundOne: string;
  /** Lesezeit-Suffix nach der Minutenzahl. */
  minutes: string;
  readArticle: string;
  searchEmpty: string;
  scrollTopLabel: string;
  scrollTop: string;
  /** Intl-Locale für das Anzeigedatum. */
  dateLocale: string;
  invalidDate: (iso: string) => string;
}

export const BLOG_INDEX: Record<Lang, BlogIndexTexts> = {
  de: {
    title: 'Blog – Tipps & Anleitungen für Audio und Bildbearbeitung | KodiniTools',
    description:
      'How-to Guides für kostenlose Online-Tools: Audiodatei Format ändern, JPG zu WebP konvertieren, Audio normalisieren, TikTok Videos erstellen und mehr – DSGVO-konform.',
    ogTitle: 'Blog – Tipps & Anleitungen für Audio und Bildbearbeitung | KodiniTools',
    ogDescription:
      'How-to Guides für kostenlose Online-Tools: Audio konvertieren, Bilder optimieren, TikTok Videos erstellen und mehr.',
    heading: 'Blog – Tipps & Anleitungen',
    subtitle:
      'How-to Guides für Audio- und Bildbearbeitung – kostenlos, DSGVO-konform, ohne Registrierung.',
    count: (n) => `${n} Beiträge von Dinko Ramić`,
    searchLabel: 'Blog durchsuchen',
    searchPlaceholder: 'Beiträge durchsuchen …',
    searchFound: '{n} von {total} Beiträgen gefunden',
    searchFoundOne: '1 von {total} Beiträgen gefunden',
    minutes: 'Min.',
    readArticle: 'Artikel lesen',
    searchEmpty: 'Keine Beiträge gefunden. Versuchen Sie einen anderen Suchbegriff.',
    scrollTopLabel: 'Zum Seitenanfang scrollen',
    scrollTop: 'Nach oben',
    dateLocale: 'de-DE',
    invalidDate: (iso) => `Ungültiges Datum „${iso}“ in der Blog-Übersicht – erwartet JJJJ-MM-TT`,
  },
  en: {
    title: 'Blog – How-to Guides for Audio & Image Editing | KodiniTools',
    description:
      'How-to guides for free online tools: JPG to WebP, normalize audio, create TikTok videos and more — GDPR compliant, no registration.',
    ogTitle: 'Blog – How-to Guides for Audio & Image Editing | KodiniTools',
    ogDescription:
      'How-to guides for free online tools: convert audio, optimize images, create TikTok videos and more.',
    heading: 'Blog – Tips & How-to Guides',
    subtitle:
      'Step-by-step guides for audio and image editing — free, GDPR compliant, no registration required.',
    count: (n) => `${n} posts by Dinko Ramić`,
    searchLabel: 'Search the blog',
    searchPlaceholder: 'Search posts …',
    searchFound: '{n} of {total} posts found',
    searchFoundOne: '1 of {total} posts found',
    minutes: 'min read',
    readArticle: 'Read article',
    searchEmpty: 'No posts found. Try a different search term.',
    scrollTopLabel: 'Scroll to top of page',
    scrollTop: 'Back to top',
    dateLocale: 'en-US',
    invalidDate: (iso) => `Invalid date "${iso}" in the blog overview – expected YYYY-MM-DD`,
  },
};
