// Übersetzt den Admin-Server (src/*.ts) nach build/*.js – reines Transpilieren
// mit esbuild (Typprüfung: npm run typecheck). Wird genutzt von
//   - den Startern index.mjs / hash-password.mjs (nur wenn der Build fehlt
//     oder älter als die Quellen ist – selbstheilend, z. B. nach einem
//     Code-Update ohne Build-Schritt),
//   - npm run build:server bzw. deploy.sh (immer).
//
//   node server/admin/build-server.mjs   # Build erzwingen

import { existsSync, readdirSync, statSync, rmSync, mkdirSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ADMIN_DIR = dirname(fileURLToPath(import.meta.url));
export const SRC_DIR = join(ADMIN_DIR, 'src');
export const BUILD_DIR = join(ADMIN_DIR, 'build');

/** Quell-Module (ohne Tests/Deklarationen). */
function sources() {
  return readdirSync(SRC_DIR)
    .filter((n) => n.endsWith('.ts') && !n.endsWith('.d.ts'))
    .map((n) => join(SRC_DIR, n));
}

/** true, wenn zu jeder Quelle ein mindestens gleich neuer Build existiert. */
export function serverBuildUpToDate() {
  for (const src of sources()) {
    const out = join(BUILD_DIR, src.slice(SRC_DIR.length + 1).replace(/\.ts$/, '.js'));
    if (!existsSync(out) || statSync(out).mtimeMs < statSync(src).mtimeMs) return false;
  }
  return true;
}

/** Übersetzt alle Quellen neu (leert build/ vorher). */
export async function buildServer() {
  const { build } = await import('esbuild');
  const tmp = BUILD_DIR + '.tmp';
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  try {
    await build({
      entryPoints: sources(),
      outdir: tmp,
      platform: 'node',
      format: 'esm',
      target: 'node18',
      bundle: false,
      sourcemap: 'inline',
      logLevel: 'warning',
    });
  } catch (err) {
    rmSync(tmp, { recursive: true, force: true });
    throw err;
  }
  // Erst nach erfolgreichem Build austauschen: ein Fehler lässt den alten Stand stehen.
  rmSync(BUILD_DIR, { recursive: true, force: true });
  renameSync(tmp, BUILD_DIR);
}

/**
 * Für die Starter: baut nur bei Bedarf. Schlägt der Build fehl, läuft der
 * letzte vorhandene Stand weiter; ohne jeden Build bricht der Start ab.
 */
export async function ensureServerBuild() {
  if (serverBuildUpToDate()) return;
  try {
    await buildServer();
    // stderr: stdout von hash-password.mjs wird in Skripten ausgewertet.
    console.error('[kodini-admin] Server-Code übersetzt (server/admin/build).');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (existsSync(join(BUILD_DIR, 'index.js'))) {
      console.error(`[kodini-admin] Server-Build fehlgeschlagen, nutze letzten Build: ${msg}`);
      return;
    }
    console.error(`[kodini-admin] Server-Build fehlgeschlagen, kein Build vorhanden: ${msg}`);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildServer();
  console.log(`Server-Code übersetzt → ${BUILD_DIR}`);
}
