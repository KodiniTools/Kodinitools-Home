// Cookie-Banner (public/partials/cookie-banner.html) für die Home-Seiten in der
// Seitensprache vorrendern. Das Partial wird auch per SSI in die Tools
// eingebunden und bleibt deshalb sprachneutral (deutsches Markup + Wörterbuch
// im Script). Für /en/… ersetzt der Build die deutschen Texte durch die
// englischen aus demselben Wörterbuch und setzt data-lang am Banner, damit das
// Script die Seitensprache nicht durch eine gespeicherte Wahl überschreibt.

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Lang } from './lang';

const PARTIAL = 'public/partials/cookie-banner.html';

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Liest das Wörterbuch einer Sprache aus COOKIE_TRANSLATIONS im Partial. */
export function cookieTranslations(html: string, lang: Lang): Record<string, string> {
  const block = new RegExp(`\\n\\s{4}${lang}: \\{([\\s\\S]*?)\\n\\s{4}\\}`).exec(html);
  if (!block) throw new Error(`cookie-banner: Wörterbuch "${lang}" fehlt`);
  const out: Record<string, string> = {};
  for (const m of block[1].matchAll(/'(cookie\.[\w]+)': '((?:[^'\\]|\\.)*)'/g)) {
    out[m[1]] = m[2].replace(/\\(.)/g, '$1');
  }
  return out;
}

/** Banner-HTML in der Seitensprache (Texte, aria-label, data-lang). */
export function localizeCookieBanner(html: string, lang: Lang): string {
  const t = cookieTranslations(html, lang);
  const missing: string[] = [];
  let out = html.replace(
    /(<(\w+)[^>]*\sdata-i18n="(cookie\.[\w]+)"[^>]*>)([^<]*)(<\/\2>)/g,
    (all, open: string, _tag: string, key: string, _text: string, close: string) => {
      if (!(key in t)) {
        missing.push(key);
        return all;
      }
      return `${open}${escapeHtml(t[key])}${close}`;
    },
  );
  out = out.replace(
    /aria-label="[^"]*"(\s+data-i18n-aria="(cookie\.[\w]+)")/g,
    (all, rest: string, key: string) =>
      key in t ? `aria-label="${escapeHtml(t[key])}"${rest}` : all,
  );
  if (missing.length) throw new Error(`cookie-banner: Übersetzung fehlt für ${missing.join(', ')}`);
  const withLang = out.replace(
    '<div id="cookieBanner" class="cookie-banner">',
    `<div id="cookieBanner" class="cookie-banner" data-lang="${lang}">`,
  );
  if (withLang === out) throw new Error('cookie-banner: #cookieBanner nicht gefunden');
  return withLang;
}

/** Für Astro-Seiten: Partial lesen und in der Seitensprache zurückgeben. */
export function loadCookieBanner(lang: Lang): string {
  return localizeCookieBanner(readFileSync(resolve(PARTIAL), 'utf-8'), lang);
}
