import type { PageMetaKey } from '../../../public/model-media';

/** Adressen der Seiten mit Seiten-Meta je Sprache (für „Seite lesen“ der KI). */
export const PAGE_META_URL: Record<'de' | 'en', Record<PageMetaKey, string>> = {
  de: {
    home: 'https://kodinitools.com/',
    faq: 'https://kodinitools.com/faq/',
    donate: 'https://kodinitools.com/spenden/',
    imprint: 'https://kodinitools.com/impressum/',
    blog: 'https://kodinitools.com/blog/',
  },
  en: {
    home: 'https://kodinitools.com/en/',
    faq: 'https://kodinitools.com/en/faq/',
    donate: 'https://kodinitools.com/en/donate/',
    imprint: 'https://kodinitools.com/en/legal-notice/',
    blog: 'https://kodinitools.com/en/blog/',
  },
};

/** Anzeigenamen der Seiten mit Seiten-Meta. */
export const PAGE_META_LABEL: Record<PageMetaKey, string> = {
  home: 'Startseite',
  faq: 'FAQ',
  donate: 'Spenden',
  imprint: 'Impressum',
  blog: 'Blog-Übersicht',
};
