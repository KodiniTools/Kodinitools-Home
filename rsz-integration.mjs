// Astro-Integration: erzeugt nach dem Build die verkleinerten Bildfassungen,
// auf die die Seiten per srcset verweisen (src/content/responsiveImage.ts).
// Gesucht wird in den gebauten HTML-Dateien nach _astro/rsz/<Breite>/<Pfad>.webp;
// jede Fassung entsteht einmal mit sharp aus public/<Pfad>.
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RSZ_URL = /_astro\/rsz\/(\d{2,4})\/(uploads\/[A-Za-z0-9._\-/]+?\.(?:webp|jpe?g|png))\.webp/gi;

/** Alle angeforderten Fassungen eines HTML-Texts als { width, rel }. */
export function collectRszJobs(html) {
  const jobs = new Map();
  for (const m of html.matchAll(RSZ_URL)) {
    const width = Number(m[1]);
    const rel = m[2];
    if (rel.includes('..') || width < 16 || width > 4000) continue;
    jobs.set(`${width}/${rel}`, { width, rel });
  }
  return [...jobs.values()];
}

function htmlFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...htmlFiles(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

export default function rszIntegration({ publicDir = resolve('public') } = {}) {
  return {
    name: 'kodini-rsz',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const jobs = new Map();
        for (const f of htmlFiles(outDir)) {
          for (const j of collectRszJobs(readFileSync(f, 'utf-8')))
            jobs.set(`${j.width}/${j.rel}`, j);
        }
        if (jobs.size === 0) return;
        const { default: sharp } = await import('sharp');
        let made = 0;
        for (const { width, rel } of jobs.values()) {
          const src = resolve(publicDir, rel);
          if (!existsSync(src)) continue;
          const target = join(outDir, '_astro', 'rsz', String(width), `${rel}.webp`);
          mkdirSync(dirname(target), { recursive: true });
          await sharp(src)
            .resize({ width, withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(target);
          made++;
        }
        logger.info(`${made} verkleinerte Bildfassung(en) erzeugt`);
      },
    },
  };
}
