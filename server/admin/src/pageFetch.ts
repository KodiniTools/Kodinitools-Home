import { inputError } from './aiTasks.js';

/**
 * Liest eine Seite von kodinitools.com für die KI-Aufgaben (SEO, Vergleich).
 * Nur https und nur die eigene Domain (auch nach Weiterleitungen), mit Zeit- und
 * Größenlimit. Der Inhalt ist fremder Text: er geht als Daten in den Prompt.
 */
export const ALLOWED_HOSTS: readonly string[] = ['kodinitools.com', 'www.kodinitools.com'];
const MAX_BYTES = 1_500_000;
const MAX_TEXT = 12_000;
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

export interface PageInfo {
  url: string;
  lang: string;
  title: string;
  description: string;
  h1: string[];
  text: string;
}

/** Prüft eine URL: https, eigene Domain, kein Port, keine Zugangsdaten. */
export function parseSiteUrl(raw: unknown): URL {
  if (typeof raw !== 'string' || !raw.trim() || raw.length > 500) throw inputError('url ungültig');
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    throw inputError('url ungültig');
  }
  if (u.protocol !== 'https:' || u.port || u.username || u.password)
    throw inputError('url muss mit https:// beginnen');
  if (!ALLOWED_HOSTS.includes(u.hostname.toLowerCase()))
    throw inputError('Nur Seiten von kodinitools.com können gelesen werden');
  u.hash = '';
  return u;
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};
function decode(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const n = e[1]?.toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ' ';
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}
const clean = (s: string) =>
  decode(s.replace(/<[^>]*>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();

/** Titel, Beschreibung, H1 und sichtbaren Text aus HTML ziehen (ohne Skripte, Stile, Navigation). */
export function extractPage(html: string, url: string): PageInfo {
  const attr = (tag: string, name: string) =>
    new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i').exec(tag);
  const title = clean(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '');
  let description = '';
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const n = attr(m[0], 'name');
    if ((n?.[1] ?? n?.[2] ?? '').toLowerCase() === 'description') {
      const c = attr(m[0], 'content');
      description = clean(c?.[1] ?? c?.[2] ?? '');
      break;
    }
  }
  const htmlTag = /<html\b[^>]*>/i.exec(html)?.[0] ?? '';
  const l = attr(htmlTag, 'lang');
  const body = (/<body\b[^>]*>([\s\S]*)/i.exec(html)?.[1] ?? html)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template|nav|footer|iframe)\b[\s\S]*?<\/\1\s*>/gi, ' ');
  const h1 = [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((m) => clean(m[1] ?? ''))
    .filter(Boolean)
    .slice(0, 3);
  return {
    url,
    lang: (l?.[1] ?? l?.[2] ?? '').slice(0, 10),
    title: title.slice(0, 300),
    description: description.slice(0, 500),
    h1,
    text: clean(body.replace(/<\/(p|div|li|h[1-6]|section|article|tr)>/gi, '. '))
      .replace(/(?:\.\s*){2,}/g, '. ')
      .replace(/^\.\s*/, '')
      .slice(0, MAX_TEXT),
  };
}

/** Holt die Seite (Weiterleitungen nur innerhalb der eigenen Domain) und wertet sie aus. */
export async function fetchPage(raw: unknown, fetchFn: typeof fetch = fetch): Promise<PageInfo> {
  let url = parseSiteUrl(raw);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    let res: Response;
    try {
      res = await fetchFn(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { accept: 'text/html', 'user-agent': 'KodiniAdmin/1.0' },
      });
    } catch {
      throw Object.assign(new Error(`Seite nicht erreichbar: ${url.href}`), { statusCode: 502 });
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) break;
      url = parseSiteUrl(new URL(loc, url).href);
      continue;
    }
    if (!res.ok)
      throw Object.assign(new Error(`Seite antwortet mit ${res.status}: ${url.href}`), {
        statusCode: 502,
      });
    if (!/html/i.test(res.headers.get('content-type') ?? ''))
      throw inputError('Die Adresse liefert keine HTML-Seite');
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) throw inputError('Seite ist zu groß (max. 1,5 MB)');
    const page = extractPage(new TextDecoder('utf-8').decode(buf), url.href);
    if (page.text.length < 40)
      throw inputError(
        'Auf der Seite steht kaum lesbarer Text (wird vermutlich erst im Browser aufgebaut). Bitte den Text selbst einfügen.',
      );
    return page;
  }
  throw inputError('Zu viele Weiterleitungen');
}
