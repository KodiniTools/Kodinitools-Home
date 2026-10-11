// Zugriff auf die Blog-Collection (src/content/blog/) für Artikelseiten,
// Übersichten und Suchindex.

import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogLang = 'de' | 'en';
export type BlogEntry = CollectionEntry<'blog'>;

export const SITE = 'https://kodinitools.com';

/** Basis-Pfad der Artikel einer Sprache. */
export const blogBase = (lang: BlogLang): string => (lang === 'de' ? '/blog/' : '/en/blog/');

/** Slug aus der Eintrags-ID „<lang>/<slug>“. */
export const slugOf = (entry: BlogEntry): string => entry.id.slice(entry.id.indexOf('/') + 1);

/** Site-Pfad eines Artikels, z. B. „/blog/audio-normalisieren/“. */
export const articlePath = (lang: BlogLang, slug: string): string => `${blogBase(lang)}${slug}/`;

/** Absolute URL eines Artikels. */
export const articleUrl = (entry: BlogEntry): string =>
  `${SITE}${articlePath(entry.data.lang, slugOf(entry))}`;

/** Absolute URL desselben Artikels in der anderen Sprache. */
export const alternateUrl = (entry: BlogEntry): string =>
  `${SITE}${articlePath(entry.data.lang === 'de' ? 'en' : 'de', entry.data.alternate)}`;

/**
 * Prüft, dass jede Übersetzung existiert und auf den Artikel zurückverweist.
 * Ein Fehler bricht den Build ab, statt kaputte hreflang-Paare auszuliefern.
 */
function assertAlternates(all: BlogEntry[]): void {
  const byId = new Map(all.map((entry) => [entry.id, entry]));
  for (const entry of all) {
    const otherLang: BlogLang = entry.data.lang === 'de' ? 'en' : 'de';
    const other = byId.get(`${otherLang}/${entry.data.alternate}`);
    if (!other) {
      throw new Error(
        `Blog: ${entry.filePath} verweist auf fehlende Übersetzung ${otherLang}/${entry.data.alternate}`,
      );
    }
    if (other.data.alternate !== slugOf(entry)) {
      throw new Error(
        `Blog: ${other.filePath} muss mit alternate: ${slugOf(entry)} auf ${entry.filePath} zurückverweisen`,
      );
    }
  }
}

let checked = false;

/** Alle Artikel einer Sprache (Reihenfolge: nach Slug). */
export async function getArticles(lang: BlogLang): Promise<BlogEntry[]> {
  const all = await getCollection('blog');
  if (!checked) {
    assertAlternates(all);
    checked = true;
  }
  return all
    .filter((entry) => entry.data.lang === lang)
    .sort((a, b) => slugOf(a).localeCompare(slugOf(b)));
}

/** Karte der Blog-Übersicht. */
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  published: string;
  tag: string;
  minutes: number;
  image: string;
  newTab: boolean;
  order: number;
}

export const toBlogPost = (entry: BlogEntry): BlogPost => ({
  slug: articlePath(entry.data.lang, slugOf(entry)),
  ...entry.data.card,
  published: entry.data.published,
});

/** Neueste zuerst; bei gleichem Datum entscheidet `card.order` (höher = weiter oben). */
export const compareNewestFirst = (a: BlogPost, b: BlogPost): number =>
  b.published.localeCompare(a.published) || b.order - a.order;
