/**
 * Schnelle Prüfung der Blog-Quelldateien (src/content/blog/) ohne Build:
 * Frontmatter lesbar, Übersetzungen vorhanden und wechselseitig verknüpft.
 * Das vollständige Schema prüft Astro beim Build (src/content.config.ts).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseArticleFile } from '../../src/content/blogLoader';

const ROOT = join(process.cwd(), 'src/content/blog');
const LANGS = ['de', 'en'] as const;

const articles = LANGS.flatMap((lang) =>
  readdirSync(join(ROOT, lang))
    .filter((name) => name.endsWith('.html'))
    .map((name) => {
      const file = `${lang}/${name}`;
      const { data, body } = parseArticleFile(readFileSync(join(ROOT, file), 'utf-8'), file);
      return { lang, slug: name.slice(0, -'.html'.length), file, data, body };
    }),
);

describe('parseArticleFile', () => {
  it('trennt Frontmatter und HTML-Rumpf', () => {
    const { data, body } = parseArticleFile(
      '---\ntitle: "A & B"\npublished: "2026-01-02"\n---\n<p>Text</p>\n',
      'x.html',
    );
    expect(data).toEqual({ title: 'A & B', published: '2026-01-02' });
    expect(body).toBe('<p>Text</p>\n');
  });

  it('meldet fehlendes Frontmatter mit Dateinamen', () => {
    expect(() => parseArticleFile('<p>Text</p>', 'de/x.html')).toThrow('de/x.html');
  });

  it('lehnt Frontmatter ab, das kein Objekt ist', () => {
    expect(() => parseArticleFile('---\n- a\n---\n', 'de/x.html')).toThrow('kein YAML-Objekt');
  });
});

describe('Blog-Artikel', () => {
  it('gibt es in beiden Sprachen gleich oft', () => {
    const count = (lang: string) => articles.filter((a) => a.lang === lang).length;
    expect(count('de')).toBeGreaterThan(0);
    expect(count('de')).toBe(count('en'));
  });

  it.each(articles.map((a) => [a.file, a] as const))(
    '%s: Übersetzung existiert und verweist zurück',
    (_, article) => {
      const otherLang = article.lang === 'de' ? 'en' : 'de';
      const other = articles.find((a) => a.lang === otherLang && a.slug === article.data.alternate);
      expect(other, `alternate: ${String(article.data.alternate)}`).toBeDefined();
      expect(other?.data.alternate).toBe(article.slug);
    },
  );

  it.each(articles.map((a) => [a.file, a] as const))(
    '%s: Datum als Text und Rumpf mit <h1>',
    (_, article) => {
      expect(typeof article.data.published).toBe('string');
      expect(article.body).toMatch(/^<h1>/);
    },
  );
});
