// @vitest-environment happy-dom
/**
 * Impressum: Texte in beiden Sprachen vollständig, und der SSI-Footer
 * (public/partials/footer.html) verlinkt das Impressum sprachabhängig.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { IMPRINT_OPERATOR, IMPRINT_PAGE, IMPRINT_PATH } from '../../src/i18n/imprint';

describe('Impressum-Texte', () => {
  it('haben in DE und EN dieselbe Struktur', () => {
    const de = IMPRINT_PAGE.de;
    const en = IMPRINT_PAGE.en;
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
    expect(en.sections).toHaveLength(de.sections.length);
    expect(en.licenses.map((l) => l.url)).toEqual(de.licenses.map((l) => l.url));
    en.sections.forEach((s, i) => {
      expect(s.paragraphs).toHaveLength(de.sections[i]!.paragraphs.length);
    });
  });

  it('enthalten keine offenen Platzhalter mehr', () => {
    expect(JSON.stringify(IMPRINT_OPERATOR)).not.toMatch(/null|\[/);
  });

  it('liegen unter /impressum/ und /en/legal-notice/', () => {
    expect(IMPRINT_PATH).toEqual({ de: '/impressum/', en: '/en/legal-notice/' });
  });
});

describe('SSI-Footer', () => {
  const html = readFileSync(resolve('public/partials/footer.html'), 'utf-8');

  /** Footer in das Dokument setzen und sein Inline-Script ausführen. */
  function mountFooter(locale: string | null) {
    if (locale) localStorage.setItem('locale', locale);
    document.body.innerHTML = html.replace(/<script[\s\S]*?<\/script>/g, '');
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].pop()![1]!;
    new Function(script)();
    return document.querySelector<HTMLAnchorElement>('[data-i18n="footer.imprint"]')!;
  }

  afterEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  it('verlinkt das deutsche Impressum (Standard)', () => {
    const link = mountFooter(null);
    expect(link.textContent).toBe('Impressum');
    expect(link.getAttribute('href')).toBe('https://kodinitools.com/impressum/');
  });

  it('verlinkt auf Englisch die Legal Notice', () => {
    const link = mountFooter('en');
    expect(link.textContent).toBe('Legal Notice');
    expect(link.getAttribute('href')).toBe('https://kodinitools.com/en/legal-notice/');
  });

  it('steht direkt nach dem Datenschutz-Link', () => {
    const link = mountFooter(null);
    expect(link.previousElementSibling?.getAttribute('data-i18n')).toBe('footer.privacy');
  });
});
