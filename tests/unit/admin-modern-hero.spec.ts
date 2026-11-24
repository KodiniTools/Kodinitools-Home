/**
 * Hero-Vorschau des modernen Designs im Admin (server/admin/app/components/modern):
 * Datenregeln wie ModernHomePage.astro, Markup wie ModernHome.astro.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  modernHeroData,
  modernHeroDoc,
  modernHeroSection,
} from '../../server/admin/app/components/modern/modernHero';

const base = {
  lang: 'de' as const,
  title: 'Titel',
  subtitle: 'Zeile 1\nZeile 2',
  cta: 'Los',
  features: [
    { key: 'free', text: 'Gratis' },
    { key: 'privacy', text: 'Privat' },
  ],
};

describe('modernHeroData', () => {
  it('übernimmt Ein-/Ausblenden wie die Seite', () => {
    expect(modernHeroData({ ...base, design: {} }).features).toHaveLength(2);
    const d = modernHeroData({
      ...base,
      design: { showTitle: false, showSubtitle: false, hiddenChips: ['privacy'] },
    });
    expect(d.title).toBe('');
    expect(d.subtitle).toBe('');
    expect(d.features.map((f) => f.key)).toEqual(['free']);
    expect(modernHeroData({ ...base, design: { showChips: false } }).features).toEqual([]);
  });
});

describe('modernHeroSection', () => {
  it('Akzent, Zeilenumbrüche, Escaping, Rückfall-Texte je Sprache', () => {
    const html = modernHeroSection({
      ...base,
      title: 'A *<b>* C',
      features: [{ key: 'unbekannt', text: '"x"' }],
    });
    expect(html).toContain('A <span class="mh-accent">&lt;b&gt;</span> C');
    expect(html).toContain('Zeile 1<br>Zeile 2');
    expect(html).toContain('&quot;x&quot;');
    expect(html).toContain('#mhi-f-check');
    expect(html).toContain('Alle Tools');
    const en = modernHeroSection({ ...base, lang: 'en', title: '', subtitle: '', cta: '' });
    expect(en).toContain('Get Started');
    expect(en).toContain('Free Online Tools for Audio &amp; Images');
    expect(en).not.toContain('mh-lead');
  });

  it('nutzt nur Klassen, die es auch im Hero der Seite gibt', () => {
    const astro = readFileSync(join(__dirname, '../../src/components/ModernHome.astro'), 'utf8');
    const classes = new Set(
      [...modernHeroSection(base).matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1]!.split(' ')),
    );
    for (const c of classes) expect(astro, `Klasse ${c}`).toContain(c);
  });

  it('Dokument mit Thema und App-Hülle des modernen Designs', () => {
    const doc = modernHeroDoc(modernHeroData({ ...base, design: {} }), 'light');
    expect(doc).toContain('data-theme="light"');
    expect(doc).toContain('<div id="app" data-design="modern"');
    expect(doc).toContain('<symbol id="mhi-play-solid"');
  });
});
