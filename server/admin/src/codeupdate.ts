// Code-Aktualisierung des Server-Klons + Neustart-Erkennung des Admin-Dienstes.
//
// Hintergrund: Der Admin-Dienst baut die Vorschau aus dem Arbeitsverzeichnis
// (/opt/kodini/repo). Neuer Code landet dort bisher nur beim Deploy
// (deploy.sh → git reset --hard origin/main). Damit die Vorschau immer den
// aktuellen main-Stand zeigt (z. B. neue Admin-Tabs), holt sie den Code vorher
// per fast-forward. Ändert sich dabei der Server-Code (server/admin/src/*.ts),
// läuft noch der alte Prozess – unter systemd (Restart=on-failure) beendet er
// sich nach Abschluss selbst und wird automatisch neu gestartet.

import { readdir, stat, writeFile, mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config, ADMIN_DIR } from './config.js';
import { asErr } from './util.js';

// Startzeit des Prozesses: Server-Dateien, die danach geändert wurden, sind
// noch nicht geladen (ES-Module werden nur beim Start eingelesen).
const STARTED_AT = Date.now();

/** Läuft der Dienst unter systemd (dann ist ein Selbst-Neustart möglich)? */
export function underSystemd() {
  return !!process.env.INVOCATION_ID && process.env.ADMIN_AUTO_RESTART !== '0';
}

// Server-Code: Quellen (src/*.ts), übersetzter Stand (build/*.js) und die
// Starter (*.mjs) in server/admin.
const SERVER_CODE: Array<[dir: string, ext: string]> = [
  ['src', '.ts'],
  ['build', '.js'],
  ['', '.mjs'],
];

/**
 * true, wenn Server-Code (Quellen, Build oder Starter) nach dem Prozessstart
 * geändert wurde – der laufende Prozess hat dann veralteten Code.
 */
export async function serverCodeChanged() {
  for (const [sub, ext] of SERVER_CODE) {
    const dir = resolve(ADMIN_DIR, sub);
    try {
      for (const n of await readdir(dir)) {
        if (!n.endsWith(ext)) continue;
        const s = await stat(resolve(dir, n));
        // Strikt „nach dem Start": keine Toleranz, sonst könnte eine kurz vor dem
        // Start geänderte Datei jede Vorschau in einen erneuten Neustart treiben.
        if (s.mtimeMs > STARTED_AT) return true;
      }
    } catch {
      /* Fehler beim Lesen -> kein Neustart erzwingen */
    }
  }
  return false;
}

/** Ändert die Datei den Server-Code des Admins (muss neu übersetzt werden)? */
export function needsServerBuild(file: string) {
  return file.startsWith('server/admin/src/') || file === 'server/admin/build-server.mjs';
}

/** Prozess-Runner (execFile im Repo-Verzeichnis); liefert stdout+stderr. */
export type RunFn = (
  cmd: string,
  args: string[],
  opts?: import('node:child_process').ExecFileOptions,
) => Promise<string>;
export type JobStatus = 'idle' | 'running' | 'success' | 'error';
/** Gemeinsamer Teil des Vorgangs-Status (Vorschau/Veröffentlichung). */
export type JobState = {
  status: JobStatus;
  step: string;
  log: string[];
  startedAt: number | null;
  finishedAt: number | null;
  error: string | null;
  restarting: boolean;
  restarted: boolean;
};
export type LogFn = (line: string) => void;
/** Ergebnis des Code-Updates vor einer Vorschau. */
export type CodeUpdateResult = {
  updated: boolean;
  from: string;
  to: string;
  files: string[];
  error?: string;
};

/**
 * Holt den aktuellen Stand von origin/<branch> per fast-forward in das
 * Arbeitsverzeichnis (ohne lokale Entwürfe anzufassen: bei Konflikt mit
 * ungespeicherten Dateien verweigert git den Merge, dann bleibt alles wie es
 * ist). Führt `npm ci` aus, wenn sich package.json/package-lock.json änderten.
 *
 * @param env Umgebung für npm (HOME etc.)
 */
export async function updateCodeFromRemote(
  run: RunFn,
  log: LogFn,
  env: NodeJS.ProcessEnv,
): Promise<CodeUpdateResult> {
  const branch = config.gitBranch;
  const remote = config.gitRemote;
  const short = (h: unknown) =>
    String(h || '')
      .trim()
      .slice(0, 7);
  let from = '';
  try {
    from = (await run('git', ['rev-parse', 'HEAD'])).trim();
    log(`git fetch ${remote} ${branch} (Code-Update für die Vorschau)`);
    await run('git', ['fetch', remote, branch]);
    const to = (await run('git', ['rev-parse', `${remote}/${branch}`])).trim();
    if (to === from) {
      log(`Code ist aktuell (${short(from)}).`);
      return { updated: false, from: short(from), to: short(to), files: [] };
    }
    await run('git', ['merge', '--ff-only', `${remote}/${branch}`]);
    const files = (await run('git', ['diff', '--name-only', from, to]))
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    log(`Code aktualisiert: ${short(from)} → ${short(to)} (${files.length} Datei(en)).`);
    if (files.some((f) => /^package(-lock)?\.json$/.test(f))) {
      log('Abhängigkeiten geändert → npm ci --include=dev');
      log(await run('npm', ['ci', '--include=dev'], { env }));
    }
    if (files.some(needsAdminBuild)) await buildAdminUi(run, log, env);
    if (files.some(needsServerBuild)) await buildServer(run, log, env);
    return { updated: true, from: short(from), to: short(to), files };
  } catch (errRaw) {
    const err = asErr(errRaw);
    const msg = `${err?.message || err}${err?.output ? `\n${err.output}` : ''}`.trim();
    log(`Code-Update übersprungen (Vorschau baut den lokalen Stand): ${msg}`);
    return { updated: false, from: short(from), to: '', files: [], error: msg };
  }
}

/**
 * Ändert die Datei das gebaute Admin-Frontend (server/admin/dist)? Gebündelt
 * werden `public/admin.ts` mit allen importierten Modulen unter `public/` und
 * die Vue-Teile unter `app/`.
 */
export function needsAdminBuild(file: string) {
  return (
    file.startsWith('server/admin/app/') ||
    file.startsWith('server/admin/public/') ||
    file === 'server/admin/types.ts' ||
    file === 'vite.admin.config.ts' ||
    /^package(-lock)?\.json$/.test(file)
  );
}

/**
 * Baut die Vue-Teile des Admins neu (`npm run build:admin`). Ein Fehler wird
 * protokolliert; der zuletzt erfolgreiche Build bleibt dann liegen (Vite leert
 * dist erst beim Schreiben); deploy.sh bricht bei einem Fehler dagegen ab.
 */
export async function buildAdminUi(run: RunFn, log: LogFn, env: NodeJS.ProcessEnv) {
  try {
    log('Admin-UI geändert → npm run build:admin');
    log(await run('npm', ['run', 'build:admin'], { env }));
  } catch (errRaw) {
    const err = asErr(errRaw);
    log(`Admin-UI-Build fehlgeschlagen (Admin nutzt den letzten Build): ${err?.message || err}`);
  }
}

/**
 * Übersetzt den Server-Code neu (`npm run build:server`). Schlägt das fehl,
 * bleibt der letzte Build liegen; der Starter versucht es beim Neustart erneut.
 */
export async function buildServer(run: RunFn, log: LogFn, env: NodeJS.ProcessEnv) {
  try {
    log('Server-Code geändert → npm run build:server');
    log(await run('npm', ['run', 'build:server'], { env }));
  } catch (errRaw) {
    const err = asErr(errRaw);
    log(`Server-Build fehlgeschlagen (Dienst nutzt den letzten Build): ${err?.message || err}`);
  }
}

/**
 * Beendet den Prozess nach kurzer Verzögerung, wenn Server-Code geändert wurde
 * und systemd ihn neu starten kann. Gibt true zurück, wenn ein Neustart
 * eingeplant wurde (der Aufrufer sollte seinen Status vorher persistieren).
 */
export async function restartIfServerCodeChanged(log: LogFn) {
  if (!(await serverCodeChanged())) return false;
  if (!underSystemd()) {
    log(
      'Hinweis: Server-Code (server/admin/src) wurde aktualisiert – Admin-Dienst neu starten: sudo systemctl restart kodini-admin',
    );
    return false;
  }
  log('Server-Code wurde aktualisiert – Admin-Dienst startet in 2 s neu (systemd).');
  setTimeout(() => process.exit(1), 2000).unref();
  return true;
}

// --- Persistenz von Vorgangs-Status (Vorschau/Veröffentlichung) über einen
// Neustart hinweg, damit das Frontend beim Polling das Ergebnis noch sieht. ---
const STATE_DIR = resolve(config.repoDir, '.kodini-admin');

/**
 * Status-Objekt unter `name` speichern (best effort, nicht blockierend).
 */
export async function persistState(name: string, state: unknown) {
  try {
    await mkdir(STATE_DIR, { recursive: true });
    await writeFile(resolve(STATE_DIR, `${name}.json`), JSON.stringify(state), 'utf8');
  } catch {
    /* Persistenz ist optional */
  }
}

/**
 * Gespeicherten Status laden (synchron beim Modulstart). Ein beim Neustart
 * noch „laufender" Vorgang wird als Fehler markiert, damit kein Polling hängt.
 */
export function restoreState<T>(name: string, fallback: T): T {
  try {
    const s = JSON.parse(readFileSync(resolve(STATE_DIR, `${name}.json`), 'utf8'));
    if (!s || typeof s !== 'object') return fallback;
    if (s.status === 'running') {
      s.status = 'error';
      s.error = 'Vorgang durch Neustart des Admin-Dienstes abgebrochen – bitte erneut starten.';
      s.finishedAt = Date.now();
    }
    // Merker fürs Frontend: dieser Stand stammt aus der Zeit vor dem Neustart
    // (Frontend lädt sich dann einmalig neu, um neue Module zu laden).
    s.restarted = s.restarting === true;
    s.restarting = false;
    return { ...fallback, ...s };
  } catch {
    return fallback;
  }
}
