// Veröffentlichen: Content-Dateien nach 'main' committen + pushen und
// anschließend deploy.sh ausführen. Läuft asynchron; der Status wird im
// Speicher gehalten und per Polling abgefragt.

import { execFile } from 'node:child_process';
import { readFile, copyFile, mkdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { config } from './config.mjs';
import { UPLOADS_GIT_MAX_BYTES } from './uploads.mjs';

/**
 * Nachsicherung: In media.json referenzierte /uploads-Dateien, die nur im
 * Webroot liegen (z.B. vor Einführung der Git-Sicherung hochgeladen), ins
 * Repo (public/uploads) kopieren, damit sie beim Commit mit gesichert werden.
 */
async function backfillReferencedUploads() {
  let media;
  try {
    media = JSON.parse(await readFile(resolve(config.repoDir, 'src/content/media.json'), 'utf8'));
  } catch {
    return;
  }
  const urls = new Set();
  const collect = (m) => {
    if (!m || typeof m !== 'object') return;
    if (typeof m.heroBanner === 'string') urls.add(m.heroBanner);
    if (Array.isArray(m.heroGrid))
      for (const v of m.heroGrid) if (typeof v === 'string') urls.add(v);
    if (m.sectionVideos && typeof m.sectionVideos === 'object') {
      for (const v of Object.values(m.sectionVideos)) if (typeof v === 'string') urls.add(v);
    }
  };
  collect(media.de);
  collect(media.en);
  collect(media); // alte, sprachunabhängige Struktur
  const repoUploads = resolve(config.repoDir, 'public/uploads');
  for (const url of urls) {
    if (!url.startsWith('/uploads/')) continue;
    const rel = url.slice('/uploads/'.length);
    // erlaubte relative Pfade: "datei" oder "de/datei" / "en/datei"
    if (!/^((de|en)\/)?[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(rel)) continue;
    const dst = resolve(repoUploads, rel);
    try {
      await stat(dst);
      continue; // schon im Repo
    } catch {
      /* fehlt -> kopieren */
    }
    try {
      const src = resolve(config.uploadsDir, rel);
      const s = await stat(src);
      if (s.isFile() && s.size <= UPLOADS_GIT_MAX_BYTES) {
        await mkdir(dirname(dst), { recursive: true });
        await copyFile(src, dst);
        log(`Upload nachgesichert: ${rel}`);
      }
    } catch {
      /* Quelle fehlt -> nichts zu tun */
    }
  }
}

let state = {
  status: 'idle', // idle | running | success | error
  step: '',
  log: [],
  startedAt: null,
  finishedAt: null,
  commit: null,
  error: null,
};

export function getPublishState() {
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
        if (err) {
          reject(Object.assign(err, { output: out }));
        } else {
          resolvePromise(out);
        }
      },
    );
  });
}

function log(line) {
  state.log.push(`[${new Date().toISOString()}] ${line}`);
  if (state.log.length > 500) state.log.shift();
}

/**
 * Startet die Veröffentlichung (idempotent: verweigert, wenn bereits läuft).
 * @param {string} message Commit-Nachricht (optional)
 */
export function startPublish(message) {
  if (state.status === 'running') {
    return { ok: false, reason: 'Es läuft bereits eine Veröffentlichung.' };
  }
  state = {
    status: 'running',
    step: 'start',
    log: [],
    startedAt: Date.now(),
    finishedAt: null,
    commit: null,
    error: null,
  };
  // Nicht awaiten — im Hintergrund laufen lassen.
  doPublish(message).catch((err) => {
    state.status = 'error';
    state.error = err?.message || String(err);
    if (err?.output) log(err.output);
    state.finishedAt = Date.now();
  });
  return { ok: true };
}

async function doPublish(message) {
  const branch = config.gitBranch;
  const remote = config.gitRemote;
  const commitMsg = `content: update via admin${message ? ` – ${message}` : ''}`;

  // 1. Content-Dateien + hochgeladene Medien (public/uploads) stagen.
  state.step = 'git-add';
  await backfillReferencedUploads();
  log('git add src/content/ + public/uploads/');
  await run('git', [
    'add',
    'src/content/overrides.de.json',
    'src/content/overrides.en.json',
    'src/content/ticker.de.json',
    'src/content/ticker.en.json',
    'src/content/media.json',
  ]);
  // -A erfasst neue UND gelöschte Upload-Dateien, damit im Admin gelöschte
  // Medien nicht beim nächsten Deploy aus Git zurückkehren. public/uploads
  // enthält nur Dateien bis zur Größengrenze (siehe saveUpload), daher fügt -A
  // keine großen Dateien hinzu.
  await run('git', ['add', '-A', '--', 'public/uploads']);

  // 2. Gibt es überhaupt Änderungen?
  const staged = await run('git', ['diff', '--cached', '--name-only']);
  if (!staged) {
    state.step = 'nochange';
    log(
      'Keine Content-Änderungen zu committen — überspringe Commit/Push, führe trotzdem Deploy aus.',
    );
  } else {
    // Commit-Identität explizit setzen, damit kein globales git user.name/email
    // auf dem Server nötig ist (Dienst läuft als www-data ohne git-Identität).
    // Wird auch beim Rebase gebraucht (setzt die Commits neu).
    const ident = [
      '-c',
      `user.name=${config.gitAuthorName}`,
      '-c',
      `user.email=${config.gitAuthorEmail}`,
    ];

    state.step = 'commit';
    log(`git commit: ${commitMsg}`);
    await run('git', [...ident, 'commit', '-m', commitMsg]);
    state.commit = (await run('git', ['rev-parse', '--short', 'HEAD'])).trim();

    // Remote-Stand holen und den Content-Commit darauf aufsetzen. Nötig, weil
    // main z.B. durch gemergte Pull-Requests vorausgeeilt sein kann; sonst wird
    // der Push als non-fast-forward abgelehnt ("Updates were rejected … fetch first").
    state.step = 'sync';
    log(`git fetch ${remote} ${branch}`);
    await run('git', ['fetch', remote, branch]);
    log(`git rebase ${remote}/${branch}`);
    try {
      await run('git', [...ident, 'rebase', `${remote}/${branch}`]);
    } catch (e) {
      // Rebase-Zustand sauber verlassen, damit der nächste Versuch nicht hängt.
      await run('git', ['rebase', '--abort']).catch(() => {});
      throw new Error(
        `Rebase auf ${remote}/${branch} fehlgeschlagen (vermutlich ein Konflikt in den ` +
          `Content-Dateien). Bitte einmalig auf dem Server auflösen. ${e.output || e.message || ''}`,
        { cause: e },
      );
    }
    state.commit = (await run('git', ['rev-parse', '--short', 'HEAD'])).trim();

    state.step = 'push';
    log(`git push ${remote} ${branch}`);
    await run('git', ['push', remote, `HEAD:${branch}`]);
  }

  // 3. Deploy ausführen.
  state.step = 'deploy';
  log('./deploy.sh');
  const deployScript = resolve(config.repoDir, 'deploy.sh');
  const out = await run(deployScript, [], { cwd: config.repoDir });
  log(out);

  state.status = 'success';
  state.step = 'done';
  state.finishedAt = Date.now();
  log('Veröffentlichung abgeschlossen.');
}
