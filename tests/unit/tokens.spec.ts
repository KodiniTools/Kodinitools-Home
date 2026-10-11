/**
 * Design-Tokens: tokens.css muss zu tokens.json passen, und die in tokens.json
 * unter `contrast` deklarierten Farbpaare müssen den WCAG-Mindestkontrast halten.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  renderTokensCss,
  TOKENS_CSS,
  TOKENS_JSON,
  validateTokens,
  valueIn,
} from '../../scripts/build-tokens.mjs';

interface Token {
  name: string;
  value: string | Record<string, string>;
  usage: string;
}
interface Tokens {
  themes: Record<string, string>;
  groups: { name: string; tokens: Token[] }[];
  contrast: { fg: string; bg: string; min: number; themes?: string[] }[];
}

const data = JSON.parse(readFileSync(TOKENS_JSON, 'utf-8')) as Tokens;
const tokens = new Map(data.groups.flatMap((g) => g.tokens).map((t) => [t.name, t]));

/** Wert im Theme; ein im dunklen Modus fehlender Wert erbt den hellen (wie in CSS). */
function resolve(name: string, theme: string): string {
  const token = tokens.get(name);
  if (!token) throw new Error(`Token ${name} fehlt`);
  const value = (valueIn(token, theme) ?? valueIn(token, 'light')) as string | undefined;
  if (!value) throw new Error(`Token ${name} hat im Theme ${theme} keinen Wert`);
  return value;
}

function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m?.[1]) throw new Error(`Kontrast nur für #rrggbb prüfbar: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1]!.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe('tokens.json', () => {
  it('ist gültig', () => {
    expect(() => validateTokens(data)).not.toThrow();
  });

  it('tokens.css ist aktuell (sonst `npm run tokens`)', () => {
    expect(readFileSync(TOKENS_CSS, 'utf-8')).toBe(renderTokensCss(data));
  });

  it('lehnt doppelte Namen und unsichere Werte ab', () => {
    const bad = (value: string) => ({
      themes: data.themes,
      groups: [{ name: 'x', tokens: [{ name: 'a', value, usage: 'u' }] }],
    });
    expect(() => validateTokens(bad('red; } body { color: red'))).toThrow('ungültiger Wert');
    expect(() =>
      validateTokens({
        themes: data.themes,
        groups: [
          {
            name: 'x',
            tokens: [
              { name: 'a', value: '1px', usage: 'u' },
              { name: 'a', value: '2px', usage: 'u' },
            ],
          },
        ],
      }),
    ).toThrow('doppelt');
  });
});

describe('Kontrast (WCAG 2)', () => {
  it('berechnet bekannte Werte', () => {
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(contrast('#ffffff', '#e8a945')).toBeCloseTo(2.06, 2);
  });

  const cases = data.contrast.flatMap((pair) =>
    (pair.themes ?? Object.keys(data.themes)).map((theme) => ({ ...pair, theme })),
  );
  it.each(cases)('$fg auf $bg ($theme) ≥ $min:1', ({ fg, bg, min, theme }) => {
    expect(contrast(resolve(fg, theme), resolve(bg, theme))).toBeGreaterThanOrEqual(min);
  });
});
