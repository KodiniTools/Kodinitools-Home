/**
 * „Über mich“: Texte in beiden Sprachen vollständig, Pfade stabil,
 * und das Porträt liegt mit den angegebenen Massen in public/.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ABOUT_CAPTION,
  ABOUT_LOGO,
  ABOUT_PAGE,
  ABOUT_PATH,
  ABOUT_PHOTO,
} from '../../src/i18n/about';
import { HOME_UI } from '../../src/i18n/home-ui';

describe('Über-mich-Texte', () => {
  it('haben in DE und EN dieselbe Struktur', () => {
    const { de, en } = ABOUT_PAGE;
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
    expect(en.paragraphs).toHaveLength(de.paragraphs.length);
  });

  it('enthalten keine leeren Texte', () => {
    for (const page of Object.values(ABOUT_PAGE)) {
      for (const value of [
        page.title,
        page.description,
        page.breadcrumb,
        page.heading,
        page.photoAlt,
        page.back,
        ...page.paragraphs,
      ]) {
        expect(value.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('liegen unter /ueber-mich/ und /en/about/', () => {
    expect(ABOUT_PATH).toEqual({ de: '/ueber-mich/', en: '/en/about/' });
  });

  it('nennen den Namen unter dem Porträt', () => {
    expect(ABOUT_CAPTION).toBe('Dinko Ramić');
  });

  it('verweisen auf ein vorhandenes, quadratisches Logo', () => {
    expect(existsSync(resolve('public', ABOUT_LOGO.src.slice(1)))).toBe(true);
    expect(ABOUT_LOGO.width).toBe(ABOUT_LOGO.height);
  });

  it('verweisen auf ein vorhandenes Porträt im Hochformat', () => {
    expect(existsSync(resolve('public', ABOUT_PHOTO.src.slice(1)))).toBe(true);
    expect(ABOUT_PHOTO.height).toBeGreaterThan(ABOUT_PHOTO.width);
  });
});

describe('Über-mich-Link in den Navigationen', () => {
  const read = (path: string) => readFileSync(resolve(path), 'utf8');

  it('steht in der Hero-Navigation des modernen Designs (DE und EN)', () => {
    expect(read('src/components/ModernHome.astro')).toContain('m.nav.about');
    expect(HOME_UI.de.modern.nav.about).toBe('Über mich');
    expect(HOME_UI.en.modern.nav.about).toBe('About');
  });

  it('steht in der globalen Navigation mit Sprachgegenstück', () => {
    const nav = read('src/components/GlobalNav.astro');
    expect(nav).toContain("aboutHref: '/ueber-mich/'");
    expect(nav).toContain("aboutHref: '/en/about/'");
    expect(nav).toContain("'/ueber-mich/': '/en/about/'");
  });

  it('steht im Partial public/partials/nav.html mit Übersetzungen', () => {
    const partial = read('public/partials/nav.html');
    expect(partial).toContain('https://kodinitools.com/ueber-mich/');
    expect(partial).toContain('data-href-en="https://kodinitools.com/en/about/"');
    expect(partial).toContain("'nav.about': 'Über mich'");
    expect(partial).toContain("'nav.about': 'About'");
  });
});
