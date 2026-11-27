import { describe, expect, it } from 'vitest';
import { buildLlmsTxt, plainText, toolUrlFor } from '../../src/content/llmsTxt';

describe('buildLlmsTxt', () => {
  it('erzeugt Titel, Zusammenfassung, Hinweise und Abschnitte im llms.txt-Format', () => {
    const txt = buildLlmsTxt({
      title: 'KodiniTools',
      summary: 'Kurz <b>und</b> knapp',
      notes: ['Hinweis'],
      sections: [
        {
          heading: 'Tools',
          links: [
            { title: 'Bild [neu]', url: 'https://example.com/a/', description: 'A &amp; B\n  C' },
            { title: 'Ohne Text', url: 'https://example.com/b/' },
          ],
        },
        { heading: 'Leer', links: [] },
      ],
    });
    expect(txt).toBe(
      [
        '# KodiniTools',
        '',
        '> Kurz und knapp',
        '',
        'Hinweis',
        '',
        '## Tools',
        '',
        '- [Bild neu](https://example.com/a/): A & B C',
        '- [Ohne Text](https://example.com/b/)',
        '',
      ].join('\n'),
    );
  });

  it('lässt leere Abschnitte weg', () => {
    expect(
      buildLlmsTxt({
        title: 'T',
        summary: 'S',
        notes: [],
        sections: [{ heading: 'X', links: [] }],
      }),
    ).not.toContain('## X');
  });
});

describe('plainText', () => {
  it('entfernt Tags und Entities', () => {
    expect(plainText('<a href="x">Hi</a>&nbsp;&quot;du&quot;')).toBe('Hi "du"');
  });
});

describe('toolUrlFor', () => {
  it('hängt für Englisch ?lang=en an', () => {
    expect(toolUrlFor('https://kodinitools.com/audiokonverter/', 'de')).toBe(
      'https://kodinitools.com/audiokonverter/',
    );
    expect(toolUrlFor('https://kodinitools.com/audiokonverter/', 'en')).toBe(
      'https://kodinitools.com/audiokonverter/?lang=en',
    );
    expect(toolUrlFor('https://kodinitools.com/x/?a=1', 'en')).toBe(
      'https://kodinitools.com/x/?a=1&lang=en',
    );
  });
});
