// Veröffentlichen: Content-Dateien nach 'main' committen + pushen und
// anschließend deploy.sh ausführen. Läuft asynchron; der Status wird im
// Speicher gehalten und per Polling abgefragt.

import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { config } from './config.mjs';

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

  // 1. Nur die Content-Dateien stagen (keine unbeabsichtigten Änderungen).
  state.step = 'git-add';
  log('git add src/content/');
  await run('git', [
    'add',
    'src/content/overrides.de.json',
    'src/content/overrides.en.json',
    'src/content/ticker.de.json',
    'src/content/ticker.en.json',
  ]);

  // 2. Gibt es überhaupt Änderungen?
  const staged = await run('git', ['diff', '--cached', '--name-only']);
  if (!staged) {
    state.step = 'nochange';
    log(
      'Keine Content-Änderungen zu committen — überspringe Commit/Push, führe trotzdem Deploy aus.',
    );
  } else {
    state.step = 'commit';
    log(`git commit: ${commitMsg}`);
    await run('git', ['commit', '-m', commitMsg]);
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
