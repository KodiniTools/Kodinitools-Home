// Volltext-Suchindex für die Blog-Übersicht (/blog/, /en/blog/).
//
// Liest beim Build alle Artikel-Seiten eines Blog-Verzeichnisses, extrahiert den
// sichtbaren Artikeltext und liefert ihn als { "/blog/slug/": "text" }. Die
// Übersicht lädt den Index erst beim ersten Fokus auf das Suchfeld nach, damit
// das initiale Seitengewicht unverändert bleibt.

import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

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
 * Extrahiert den Lesetext aus dem Quelltext einer Artikel-Seite
 * (Inhalt von <BlogArticleLayout>, ohne „Verwandte Artikel", Tags und Skripte).
 */
export function extractArticleText(source: string): string {
  let body = source
  // Öffnender Layout-Tag endet mit einer Zeile, die nur „>" enthält
  const open = body.match(/<BlogArticleLayout[\s\S]*?\n\s*>/)
  if (open && open.index !== undefined) body = body.slice(open.index + open[0].length)
  const close = body.indexOf('</BlogArticleLayout>')
  if (close !== -1) body = body.slice(0, close)
  // Verwandte Artikel nennen fremde Titel und würden falsche Treffer erzeugen
  const related = body.indexOf('class="blog-related"')
  if (related !== -1) body = body.slice(0, body.lastIndexOf('<', related))

  const text = body
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
  return decodeEntities(text).replace(/\s+/g, ' ').trim()
}

/**
 * Baut den Index für ein Blog-Verzeichnis.
 * @param dir  Verzeichnis relativ zum Projekt, z. B. 'src/pages/blog'
 * @param base URL-Präfix der Artikel, z. B. '/blog/'
 */
export function buildBlogSearchIndex(dir: string, base: string): Record<string, string> {
  const absDir = resolve(dir)
  const index: Record<string, string> = {}
  for (const file of readdirSync(absDir).sort()) {
    if (!file.endsWith('.astro') || file === 'index.astro') continue
    const slug = `${base}${file.slice(0, -'.astro'.length)}/`
    index[slug] = extractArticleText(readFileSync(resolve(absDir, file), 'utf-8'))
  }
  return index
}

export function searchIndexResponse(index: Record<string, string>): Response {
  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}
