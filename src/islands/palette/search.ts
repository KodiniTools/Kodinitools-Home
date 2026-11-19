// Suche der Command-Palette: reine Funktionen ohne DOM, damit sie ohne Browser
// getestet werden können. Findet Tools nach Titel, Anwendungsfall (Suchbegriffe
// aus dem Tool-Katalog), Dateiformat und Beschreibung.

export interface SearchItem {
  /** i18n-Schlüssel der Karte, z. B. „tools.audioConverter“. */
  key: string;
  /** Angezeigter Titel (darf Zeilenumbrüche enthalten, z. B. „Name\nformate“). */
  title: string;
  description: string;
  keywords: readonly string[];
  formats: readonly string[];
}

/** Kleinbuchstaben ohne Akzente/Umlaute, nur a–z und 0–9, Rest wird zu Leerzeichen. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// Füllwörter zählen nicht als Suchwort („heic in jpg“), außer die Eingabe besteht nur daraus.
const STOPWORDS = new Set([
  'in',
  'zu',
  'auf',
  'und',
  'der',
  'die',
  'das',
  'ein',
  'to',
  'and',
  'the',
  'a',
  'of',
]);

export function tokens(query: string): string[] {
  const all = normalize(query).split(' ').filter(Boolean);
  const content = all.filter((t) => !STOPWORDS.has(t));
  return content.length ? content : all;
}

const startsWord = (haystack: string, token: string): boolean =>
  haystack.split(' ').some((w) => w.startsWith(token));

/** Punkte eines Tools für die Eingabe; 0 = kein Treffer (alle Suchwörter müssen passen). */
export function scoreItem(item: SearchItem, query: string): number {
  const toks = tokens(query);
  if (!toks.length) return 0;
  const title = normalize(item.title);
  const keywords = item.keywords.map(normalize);
  const formats = item.formats.map(normalize);
  const desc = normalize(item.description);
  let total = 0;
  for (const tok of toks) {
    let best = 0;
    if (title.split(' ').includes(tok)) best = 120;
    else if (startsWord(title, tok)) best = 100;
    if (formats.includes(tok)) best = Math.max(best, 80);
    else if (tok.length >= 2 && formats.some((f) => f.startsWith(tok))) best = Math.max(best, 40);
    if (keywords.some((k) => startsWord(k, tok))) best = Math.max(best, 70);
    if (best === 0 && tok.length >= 3 && desc.includes(tok)) best = 20;
    if (best === 0) return 0;
    total += best;
  }
  // Ganze Wendung („lauter machen“) in einem Suchbegriff: deutlich vorn.
  const phrase = tokens(query).join(' ');
  if (keywords.some((k) => k.includes(phrase))) total += 60;
  return total;
}

/** Treffer absteigend nach Punkten; bei Gleichstand bleibt die Reihenfolge der Karten. */
export function searchTools<T extends SearchItem>(items: readonly T[], query: string): T[] {
  return items
    .map((item, index) => ({ item, index, score: scoreItem(item, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((r) => r.item);
}
