import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { normFontFile } from '../../server/admin/public/model-core';

// Vorgabe 22.11.2026: Supreme Regular ist die einzige Schrift der Website (eine Datei, vorgeladen).
// Der Admin bleibt bei Arial Bold.
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

describe('Schrift: nur Supreme Regular', () => {
  it('site-font.css lädt Supreme Regular und erzwingt sie mit Stärke 400 für alle Elemente', () => {
    const css = read('src/styles/site-font.css');
    expect(css).toMatch(/body \*,/);
    expect(css).toMatch(/src: url\('\/fonts\/Supreme-Regular\.woff2'\) format\('woff2'\);/);
    expect(css).toMatch(/font-display: swap;/);
    expect(css.replace(/\s+/g, ' ')).toMatch(
      /font-family: var\( ?--site-font, 'Supreme', Arial[^)]*\) !important;/,
    );
    expect(css).toMatch(/font-weight: 400 !important;/);
  });

  it('--site-font beginnt mit Supreme', () => {
    expect(read('src/styles/parts/tokens.css')).toMatch(/--site-font: 'Supreme', Arial,/);
  });

  it('die Schriftdatei wird im <head> vorgeladen', () => {
    for (const p of [
      'src/components/SiteFont.astro',
      'src/layouts/HomeLayout.astro',
      'src/layouts/BlogArticleLayout.astro',
    ])
      expect(read(p), p).toMatch(
        /<link rel="preload" href="\/fonts\/Supreme-Regular\.woff2" as="font" type="font\/woff2" crossorigin/,
      );
  });

  it('site-font.css wird global (per JS-Import) eingebunden', () => {
    for (const p of [
      'src/components/SiteFont.astro',
      'src/layouts/HomeLayout.astro',
      'src/layouts/BlogArticleLayout.astro',
    ])
      expect(read(p), p).toMatch(/import '\.\.\/styles\/site-font\.css'/);
  });

  it('nur eine Schriftdatei, @font-face nur in site-font.css und im Nav-Partial', () => {
    expect(readdirSync(join(ROOT, 'public/fonts'))).toEqual(['Supreme-Regular.woff2']);
    const faces = [
      ...files('src', /\.(css|astro|ts|vue)$/),
      ...files('public/partials', /\.html$/),
    ].filter((p) => /@font-face/.test(read(p)));
    expect(faces.sort()).toEqual(['public/partials/nav.html', 'src/styles/site-font.css']);
    for (const p of files('src', /\.(css|astro|ts|vue)$/))
      expect(read(p), p).not.toMatch(/Plus Jakarta|font-family: Arial/);
  });

  it('Partials für die Tool-Seiten setzen Supreme Regular', () => {
    for (const p of ['public/partials/nav.html', 'public/partials/footer.html']) {
      const s = read(p);
      expect(s, p).toMatch(/font-family: 'Supreme', Arial,/);
      expect(s, p).not.toMatch(/font-family: Arial|font-weight: [5-9]00/);
    }
    expect(read('public/partials/nav.html')).toMatch(/url\('\/fonts\/Supreme-Regular\.woff2'\)/);
  });

  it('Admin: keine Schriftwahl, kein /api/fonts, Oberfläche in Arial Bold', () => {
    expect(normFontFile('Inter.woff2')).toBe('');
    expect(read('server/admin/src/index.ts')).not.toMatch(/\/api\/fonts'/);
    expect(existsSync(join(ROOT, 'server/admin/src/fonts.ts'))).toBe(false);
    expect(existsSync(join(ROOT, 'server/admin/public/fonts.ts'))).toBe(false);
    const html = read('server/admin/public/index.html');
    expect(html).toMatch(/font-family: Arial, [^;]*!important;/);
    expect(html).toMatch(/font-weight: 700 !important;/);
    expect(read('server/admin/app/design-system/tokens-v2.css')).toMatch(/--ds-font-sans: Arial,/);
    for (const p of files('server/admin/app', /\.(vue|ts)$/)) {
      const s = read(p);
      expect(s, p).not.toMatch(
        /ensureFontFace|@font-face|data-(tk|tx|md)-font[\s>=]|data-hdfont[\s>=]/,
      );
    }
  });
});
