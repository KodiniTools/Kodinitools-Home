import { defineCollection, z } from 'astro:content';
import { htmlArticleLoader } from './content/blogLoader';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Datum als JJJJ-MM-TT angeben');
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug: nur a-z, 0-9 und -');
const sitePath = z.string().startsWith('/', 'Pfad muss mit / beginnen');

/**
 * Blog-Artikel: src/content/blog/<lang>/<slug>.html
 * URL = /blog/<slug>/ (de) bzw. /en/blog/<slug>/ (en).
 */
const blog = defineCollection({
  loader: htmlArticleLoader('src/content/blog'),
  schema: z
    .object({
      /** Aus dem Ordnernamen gesetzt, nicht ins Frontmatter schreiben. */
      lang: z.enum(['de', 'en']),
      /** <title> und og:title (inkl. „| KodiniTools“). */
      title: z.string().min(1),
      /** Meta-Description. */
      description: z.string().min(1),
      published: isoDate,
      /** Letzte inhaltliche Änderung; ohne Angabe = published. */
      modified: isoDate.optional(),
      /** Slug desselben Artikels in der anderen Sprache (hreflang). */
      alternate: slug,
      /** Social-Preview-Bild (1200×630); ohne Angabe = Standardbild. */
      ogImage: z.string().optional(),
      /** Karte in der Blog-Übersicht. */
      card: z
        .object({
          title: z.string().min(1),
          description: z.string().min(1),
          tag: z.string().min(1),
          minutes: z.number().int().positive(),
          image: sitePath,
          /** Artikel in neuem Tab öffnen. */
          newTab: z.boolean().default(false),
          /** Reihenfolge bei gleichem Datum: höher = weiter oben. */
          order: z.number().int().default(0),
        })
        .strict(),
    })
    .strict(),
});

export const collections = { blog };
