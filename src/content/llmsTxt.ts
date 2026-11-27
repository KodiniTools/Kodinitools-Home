// Baut /llms.txt (https://llmstxt.org): eine kurze Markdown-Übersicht der Website für
// KI-Assistenten und Suchsysteme. Die Daten kommen beim Build aus denselben Quellen wie
// die Seiten (Tool-Karten aus den Locales, Blog-Artikel aus der Blog-Collection), damit
// die Datei nie veraltet. src/pages/llms.txt.ts sammelt die Daten, hier steht nur die
// reine Formatierung (testbar ohne Astro).

import type { Lang } from '../i18n/lang';

export interface LlmsLink {
  title: string;
  url: string;
  /** Kurzer Satz; HTML und Zeilenumbrüche werden entfernt. */
  description?: string;
}

export interface LlmsSection {
  heading: string;
  links: readonly LlmsLink[];
}

export interface LlmsInput {
  title: string;
  summary: string;
  /** Freitext-Absätze nach der Zusammenfassung. */
  notes: readonly string[];
  sections: readonly LlmsSection[];
}

/** Entfernt Tags, Entities wie &amp; und überzählige Leerzeichen. */
export function plainText(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Linktext darf keine eckigen Klammern enthalten (sonst bricht der Markdown-Link). */
function linkText(value: string): string {
  return plainText(value).replace(/[[\]]/g, '');
}

function line(link: LlmsLink): string {
  const desc = link.description ? plainText(link.description) : '';
  return `- [${linkText(link.title)}](${link.url})${desc ? `: ${desc}` : ''}`;
}

export function buildLlmsTxt(input: LlmsInput): string {
  const out: string[] = [`# ${input.title}`, '', `> ${plainText(input.summary)}`, ''];
  for (const note of input.notes) out.push(plainText(note), '');
  for (const section of input.sections) {
    if (section.links.length === 0) continue;
    out.push(`## ${section.heading}`, '', ...section.links.map(line), '');
  }
  return `${out.join('\n').trimEnd()}\n`;
}

/** Englische Fassung einer Tool-App: dieselbe URL mit ?lang=en (serverseitig englisch). */
export function toolUrlFor(link: string, lang: Lang): string {
  if (lang === 'de') return link;
  return `${link}${link.includes('?') ? '&' : '?'}lang=en`;
}
