// Sprachen der Seite und sprachabhängige Grundwerte.

export const LANGS = ['de', 'en'] as const;
export type Lang = (typeof LANGS)[number];

export const SITE = 'https://kodinitools.com';

/** Open-Graph-Locale je Sprache. */
export const OG_LOCALE: Record<Lang, string> = { de: 'de_DE', en: 'en_US' };

/** Pfad der Startseite je Sprache. */
export const HOME_PATH: Record<Lang, string> = { de: '/', en: '/en/' };

/** Bezeichnung der Startseite (Breadcrumb). */
export const HOME_LABEL: Record<Lang, string> = { de: 'Startseite', en: 'Home' };

/**
 * hreflang-Links einer Seite, die es in beiden Sprachen gibt.
 * x-default zeigt immer auf die deutsche Fassung.
 */
export function alternates(paths: Record<Lang, string>) {
  return {
    de: `${SITE}${paths.de}`,
    en: `${SITE}${paths.en}`,
    xDefault: `${SITE}${paths.de}`,
  };
}
