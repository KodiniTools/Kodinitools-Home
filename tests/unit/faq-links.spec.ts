/**
 * FAQ: Tool-Namen in den Antworten werden auf die echten Tool-URLs verlinkt,
 * und DE/EN haben dieselben Fragen.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getContent } from '../../src/content/content';
import { FAQ_LINKS, faqSegmentsToHtml, linkFaqAnswer } from '../../src/i18n/faq';
import type { Lang } from '../../src/i18n/lang';

const LANGS: Lang[] = ['de', 'en'];
const questions = (lang: Lang) =>
  lang === 'de' ? getContent('de').faq.questions : getContent('en').faq.questions;

/** Alle Links aus Tool-Karten (Locales + Overrides), GlobalNav und Footer. */
function knownUrls(): Set<string> {
  const urls = new Set<string>();
  const files = [
    'src/locales/de.json',
    'src/locales/en.json',
    'src/content/overrides.de.json',
    'src/content/overrides.en.json',
    'src/components/GlobalNav.astro',
    'src/components/SiteFooter.astro',
  ];
  for (const f of files) {
    for (const m of readFileSync(resolve(f), 'utf-8').matchAll(
      /https:\/\/kodinitools\.com\/[\w\-/]*/g,
    )) {
      urls.add(m[0]);
    }
  }
  return urls;
}

describe('linkFaqAnswer', () => {
  const links = { 'Audio Konverter': '/a/', 'MP3 Konverter': '/m/', Bildkonverter: '/b/' };

  it('verlinkt jede Erwähnung und lässt den übrigen Text unverändert', () => {
    const text = 'Mit dem Audio Konverter und dem MP3 Konverter, dann wieder Audio Konverter.';
    const segs = linkFaqAnswer(text, links);
    expect(segs.map((s) => s.text).join('')).toBe(text);
    expect(segs.filter((s) => s.href).map((s) => s.href)).toEqual(['/a/', '/m/', '/a/']);
  });

  it('verlinkt nur ganze Wörter', () => {
    expect(linkFaqAnswer('Die Bildkonverter-Seite', links).some((s) => s.href)).toBe(true);
    expect(linkFaqAnswer('Der Bildkonverterpro', links).some((s) => s.href)).toBe(false);
  });

  it('liefert reinen Text ohne Treffer und bei leerem Text', () => {
    expect(linkFaqAnswer('Nichts zu verlinken', links)).toEqual([{ text: 'Nichts zu verlinken' }]);
    expect(linkFaqAnswer('', links)).toEqual([{ text: '' }]);
  });

  it('escaped HTML für das JSON-LD', () => {
    const html = faqSegmentsToHtml([{ text: 'A & <b>' }, { text: 'MP3 Konverter', href: '/m/' }]);
    expect(html).toBe('A &amp; &lt;b&gt;<a href="/m/">MP3 Konverter</a>');
  });
});

describe('FAQ-Inhalte', () => {
  it('haben in DE und EN dieselben Fragen', () => {
    expect(Object.keys(questions('en'))).toEqual(Object.keys(questions('de')));
  });

  it('verlinken nur auf URLs aus Tool-Karten, Navigation oder Footer', () => {
    const urls = knownUrls();
    for (const lang of LANGS) {
      for (const href of Object.values(FAQ_LINKS[lang])) expect(urls, href).toContain(href);
    }
  });

  it('haben in DE und EN dieselben Link-Ziele', () => {
    const targets = (lang: Lang) => [...new Set(Object.values(FAQ_LINKS[lang]))].sort();
    expect(targets('en')).toEqual(targets('de'));
  });

  it('verlinken in jeder Sprache dieselben Ziele pro Frage', () => {
    const de = questions('de');
    const en = questions('en');
    for (const key of Object.keys(de) as (keyof typeof de)[]) {
      const hrefs = (answer: string, lang: Lang) =>
        [
          ...new Set(
            linkFaqAnswer(answer, FAQ_LINKS[lang]).flatMap((s) => (s.href ? [s.href] : [])),
          ),
        ].sort();
      expect(hrefs(en[key].answer, 'en'), String(key)).toEqual(hrefs(de[key].answer, 'de'));
    }
  });

  it('verlinken den Audio Visualizer in der TikTok-Frage', () => {
    for (const lang of LANGS) {
      const segs = linkFaqAnswer(questions(lang).q14.answer, FAQ_LINKS[lang]);
      expect(segs).toContainEqual({
        text: 'Audio Visualizer',
        href: 'https://kodinitools.com/visualizer/',
      });
    }
  });

  it('nutzt jeden Link-Namen in mindestens einer Antwort', () => {
    for (const lang of LANGS) {
      const all = Object.values(questions(lang))
        .map((q) => q.answer)
        .join('\n');
      for (const name of Object.keys(FAQ_LINKS[lang]))
        expect(all, `${lang}: ${name}`).toContain(name);
    }
  });
});
