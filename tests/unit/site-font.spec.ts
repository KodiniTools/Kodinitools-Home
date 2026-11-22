import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Vorgabe 22.11.2026: Arial Bold ist die einzige Schrift der Website; keine Schriftdateien.
const ROOT = join(__dirname, '../..');
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8');

function files(dir: string, ext: RegExp): string[] {
  const out: string[] = [];
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) out.push(...files(rel, ext));
    else if (ext.test(name)) out.push(rel);
  }
  return out;
}

describe('Schrift: nur Arial Bold', () => {
  it('site-font.css erzwingt Arial und Stärke 700 für alle Elemente', () => {
    const css = read('src/styles/site-font.css');
    expect(css).toMatch(/body \*,/);
    expect(css).toMatch(/font-family: var\(--site-font, Arial[^)]*\) !important;/);
    expect(css).toMatch(/font-weight: 700 !important;/);
  });

  it('--site-font beginnt mit Arial', () => {
    expect(read('src/styles/parts/tokens.css')).toMatch(/--site-font: Arial,/);
  });

  it('site-font.css wird global (per JS-Import) eingebunden', () => {
    for (const p of [
      'src/components/SiteFont.astro',
      'src/layouts/HomeLayout.astro',
      'src/layouts/BlogArticleLayout.astro',
    ])
      expect(read(p), p).toMatch(/import '\.\.\/styles\/site-font\.css'/);
  });

  it('keine Schriftdateien und kein @font-face im Website-Code', () => {
    expect(existsSync(join(ROOT, 'public/fonts'))).toBe(false);
    for (const p of [
      ...files('src', /\.(css|astro|ts)$/),
      ...files('public/partials', /\.html$/),
    ]) {
      const s = read(p);
      expect(s, p).not.toMatch(/@font-face|\/fonts\//);
      expect(s, p).not.toMatch(/Supreme|Plus Jakarta/);
    }
  });

  it('Partials für die Tool-Seiten setzen Arial', () => {
    for (const p of ['public/partials/nav.html', 'public/partials/footer.html'])
      expect(read(p), p).toMatch(/font-family: Arial,/);
  });
});
