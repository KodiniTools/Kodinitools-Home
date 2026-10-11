// Volltext-Suchindex für die Blog-Übersicht (/blog/, /en/blog/).
//
// Liest beim Build alle Artikel einer Sprache aus der Blog-Collection
// (src/content/blog/), extrahiert den sichtbaren Artikeltext und liefert ihn als
// { "/blog/slug/": "text" }. Die Übersicht lädt den Index erst beim ersten Fokus
// auf das Suchfeld nach, damit das initiale Seitengewicht unverändert bleibt.

import { articlePath, getArticles, slugOf, type BlogLang } from './blog'

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  shy: '',
}

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const num = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(num) ? String.fromCodePoint(num) : match
    }
    return ENTITIES[code.toLowerCase()] ?? match
  })
}

/**
 * Extrahiert den Lesetext aus dem HTML-Rumpf eines Artikels
 * (ohne „Verwandte Artikel", Tags und Skripte).
 */
export function extractArticleText(html: string): string {
  let body = html
  // Verwandte Artikel nennen fremde Titel und würden falsche Treffer erzeugen
  const related = body.indexOf('class="blog-related"')
  if (related !== -1) body = body.slice(0, body.lastIndexOf('<', related))

  const text = body
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
  return decodeEntities(text).replace(/\s+/g, ' ').trim()
}

/** Baut den Index aller Artikel einer Sprache. */
export async function buildBlogSearchIndex(lang: BlogLang): Promise<Record<string, string>> {
  const index: Record<string, string> = {}
  for (const entry of await getArticles(lang)) {
    index[articlePath(lang, slugOf(entry))] = extractArticleText(entry.body ?? '')
  }
  return index
}

export function searchIndexResponse(index: Record<string, string>): Response {
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
