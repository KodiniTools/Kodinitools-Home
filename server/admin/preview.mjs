// Vorschau-Build: baut den AKTUELLEN Arbeitsstand (die per saveContent
// geschriebenen Entwürfe) in ein separates Verzeichnis dist-preview/ mit
// base '/admin/preview/'. Es wird NICHTS committet, gepusht oder deployt.
// Der Admin-Dienst liefert dist-preview/ unter /admin/preview/ aus, sodass
// der Admin alle Änderungen vor dem Veröffentlichen im Browser sieht.

import { execFile } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { config } from './config.mjs';

// Öffentlicher Pfad der Vorschau (hinter nginx) und lokales Ausgabeverzeichnis.
export const PREVIEW_BASE = '/admin/preview/';
export const PREVIEW_DIR = resolve(config.repoDir, 'dist-preview');

let state = {
  status: 'idle', // idle | running | success | error
  step: '',
  log: [],
  startedAt: null,
  finishedAt: null,
  error: null,
};

export function getPreviewState() {
  return state;
}

function run(cmd, args, opts = {}) {
  return new Promise((resolvePromise, reject) => {
    execFile(
      cmd,
      args,
      { cwd: config.repoDir, maxBuffer: 10 * 1024 * 1024, ...opts },
      (err, stdout, stderr) => {
        const out = `${stdout || ''}${stderr || ''}`.trim();
        if (err) reject(Object.assign(err, { output: out }));
        else resolvePromise(out);
      },
    );
  });
}

function log(line) {
  state.log.push(`[${new Date().toISOString()}] ${line}`);
  if (state.log.length > 500) state.log.shift();
}

/** Startet den Vorschau-Build (idempotent: verweigert, wenn bereits läuft). */
export function startPreview() {
  if (state.status === 'running') {
    return { ok: false, reason: 'Es läuft bereits ein Vorschau-Build.' };
  }
  state = {
    status: 'running',
    step: 'start',
    log: [],
    startedAt: Date.now(),
    finishedAt: null,
    error: null,
  };
  doPreview().catch((err) => {
    state.status = 'error';
    state.error = err?.message || String(err);
    if (err?.output) log(err.output);
    state.finishedAt = Date.now();
  });
  return { ok: true };
}

async function doPreview() {
  state.step = 'build';
  log('astro build (Vorschau) -> dist-preview/');

  // Build-Umgebung wie im Deploy robust machen: Telemetrie aus, sicher
  // beschreibbares HOME. Zusätzlich base + Ausgabeverzeichnis der Vorschau.
  const env = {
    ...process.env,
    ASTRO_BASE: PREVIEW_BASE,
    ASTRO_OUT_DIR: PREVIEW_DIR,
    ASTRO_TELEMETRY_DISABLED: '1',
    DO_NOT_TRACK: '1',
    HOME: process.env.HOME || resolve(dirname(config.repoDir), '.build-home'),
  };

  const out = await run('npm', ['run', 'build'], { env });
  log(out);

  state.status = 'success';
  state.step = 'done';
  state.finishedAt = Date.now();
  log('Vorschau-Build abgeschlossen.');
}
