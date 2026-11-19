// Cookie-Banner: deutsches Markup mit echten Umlauten, englische Seiten
// bekommen den Banner beim Build auf Englisch (src/i18n/cookieBanner.ts).
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';
import { cookieTranslations, localizeCookieBanner } from '../../src/i18n/cookieBanner';

const html = readFileSync(resolve('public/partials/cookie-banner.html'), 'utf-8');
const visibleText = (s: string) =>
  s
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ');

describe('Cookie-Banner', () => {
  it('schreibt Umlaute aus (kein ae/oe/ue-Ersatz)', () => {
    expect(html).not.toMatch(/koenn|moecht|waehl|fuer |Praeferenz|Effektivitaet/);
  });

  it('hat für jeden data-i18n-Schlüssel eine DE- und EN-Übersetzung', () => {
    const keys = [...html.matchAll(/data-i18n(?:-aria)?="(cookie\.\w+)"/g)].map((m) => m[1]);
    expect(keys.length).toBeGreaterThan(15);
    const de = cookieTranslations(html, 'de');
    const en = cookieTranslations(html, 'en');
    for (const k of keys) {
      expect(de[k], `de ${k}`).toBeTruthy();
      expect(en[k], `en ${k}`).toBeTruthy();
    }
  });

  it('rendert auf englischen Seiten englische Texte und setzt data-lang', () => {
    const out = localizeCookieBanner(html, 'en');
    const text = visibleText(out);
    expect(out).toContain('<div id="cookieBanner" class="cookie-banner" data-lang="en">');
    expect(text).toContain('We use cookies to give you the best experience on our website.');
    expect(out).toContain('data-i18n="cookie.rejectAll">Reject</button>');
    expect(text).not.toContain('Decline');
    expect(text).toContain('Reject all');
    expect(text).toContain('Save settings');
    expect(text).toContain('Always active');
    expect(text).not.toMatch(/Wir verwenden|Einstellungen|ablehnen|akzeptieren|Immer aktiv/);
    expect(out).toContain('aria-label="Close"');
  });

  it('lässt deutsche Seiten deutsch und setzt data-lang="de"', () => {
    const out = localizeCookieBanner(html, 'de');
    expect(out).toContain('data-lang="de"');
    expect(visibleText(out)).toContain('Sie können wählen, welche Cookies Sie zulassen möchten.');
    // Script und Styles bleiben unverändert.
    expect(out.slice(out.indexOf('<script>'))).toBe(html.slice(html.indexOf('<script>')));
  });
});

describe('Anrede und Schreibung (DE)', () => {
  it('Spendenseite siezt durchgehend und schreibt ß', async () => {
    const { DONATE_PAGE } = await import('../../src/i18n/donate');
    const all = JSON.stringify(DONATE_PAGE.de);
    expect(all).not.toMatch(/\b(du|dir|dich|dein\w*|Dein\w*|Unterstütze|Hilf|wähle)\b/);
    expect(all).not.toMatch(/fliesst|grosses|regelmässig|abzuschliessen/);
  });

  it('Cookie-Banner nennt „Notwendige Cookies“', () => {
    expect(html).not.toContain('Essentielle');
    expect(cookieTranslations(html, 'de')['cookie.essentialTitle']).toBe('Notwendige Cookies');
  });
});

describe('Keine Marketing-Cookies', () => {
  it('Banner, Consent-Code und Texte erwähnen keine Werbe-Einwilligung mehr', () => {
    expect(html).not.toMatch(/marketing|ad_storage/i);
    for (const f of [
      'public/partials/consent-mode.html',
      'src/layouts/HomeLayout.astro',
      'src/layouts/BlogArticleLayout.astro',
      'src/components/pages/FaqPage.astro',
      'src/components/pages/DonatePage.astro',
      'src/components/pages/ImprintPage.astro',
      'src/components/pages/BlogIndexPage.astro',
    ]) {
      const src = readFileSync(resolve(f), 'utf-8');
      expect(src, f).not.toMatch(/\.marketing|'ad_storage': 'granted'/);
    }
    for (const l of ['de', 'en']) {
      expect(readFileSync(resolve(`src/locales/${l}.json`), 'utf-8'), l).not.toMatch(/marketing/i);
    }
  });
});
