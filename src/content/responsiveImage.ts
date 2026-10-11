// Verkleinerte Fassungen hochgeladener Bilder (srcset) für Bilder, die deutlich
// kleiner angezeigt werden, als sie hochgeladen wurden (z. B. Hero-Banner
// 1800 px breit, angezeigt ≤ 500 px). Die Seite verweist auf
// _astro/rsz/<Breite>/<Pfad>.webp; die Integration rsz-integration.mjs erzeugt
// genau diese Dateien nach dem Build mit sharp aus public/. Ohne Quelldatei in
// public/ (z. B. große Uploads nur im Webroot) bleibt es beim Original.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/** Breiten der erzeugten Fassungen (px). */
export const RSZ_WIDTHS = [480, 640, 960, 1280] as const;
/** Ablage im Build-Ordner (wird mit _astro/ bei jedem Deploy erneuert). */
export const RSZ_DIR = '_astro/rsz';

const RASTER = /\.(webp|jpe?g|png)$/i;
// Nur Pfade unter /uploads/ ohne Sonderzeichen, die eine srcset-Liste brechen.
const SAFE_UPLOAD = /^\/uploads\/[A-Za-z0-9._\-/]+$/;

/**
 * srcset für ein Bild aus public/uploads oder undefined, wenn es keine kleineren
 * Fassungen gibt. `width` ist die natürliche Breite, `base` der Astro-Base-Pfad.
 */
export function uploadSrcset(
  src: string | undefined,
  width: number | undefined,
  base = '/',
  publicDir = resolve('public'),
): string | undefined {
  if (!src || !width || !SAFE_UPLOAD.test(src) || !RASTER.test(src) || src.includes('..')) {
    return undefined;
  }
  if (!existsSync(resolve(publicDir, src.slice(1)))) return undefined;
  const widths = RSZ_WIDTHS.filter((w) => w < width);
  if (widths.length === 0) return undefined;
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return [
    ...widths.map((w) => `${prefix}${RSZ_DIR}/${w}${src}.webp ${w}w`),
    `${src} ${width}w`,
  ].join(', ');
}
