// Auslieferung der gebauten Vue-Teile des Admins (`npm run build:admin` →
// server/admin/dist/) unter /admin/app/…. Fehlt der Build, antwortet der Dienst
// mit 404 – `public/index.html` lädt das Skript dann nicht und der Vanilla-Admin
// läuft unverändert weiter (kein SPA-Fallback für /app/).

import { resolve, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const APP_DIST_DIR = resolve(__dirname, 'dist');
export const APP_PREFIX = '/app';

/** true, wenn der Pfad zum Vue-Bundle gehört (`/app` oder `/app/...`). */
export function isAppPath(urlPath) {
  return urlPath === APP_PREFIX || urlPath.startsWith(APP_PREFIX + '/');
}

/**
 * Löst `/app/<datei>` sicher innerhalb von `dist` auf.
 * @param {string} urlPath bereits ohne Query, z. B. `/app/main.js`
 * @param {string} [distDir]
 * @returns {string | null} absoluter Pfad oder null (Verzeichnis/außerhalb)
 */
export function resolveAppFile(urlPath, distDir = APP_DIST_DIR) {
  let sub;
  try {
    sub = decodeURIComponent(urlPath.slice(APP_PREFIX.length));
  } catch {
    return null;
  }
  const rel = normalize(sub).replace(/^(\.\.[/\\])+/, '');
  if (!rel || rel === '/' || rel === '.') return null;
  const filePath = resolve(distDir, '.' + (rel.startsWith('/') ? rel : '/' + rel));
  return filePath.startsWith(distDir + '/') ? filePath : null;
}
