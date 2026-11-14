import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const SCRIPT = resolve(__dirname, '../../scripts/prune-astro-assets.sh');
const DAY = 86400;
const T0 = 1_800_000_000;

let root: string;
let live: string;
let dist: string;
let state: string;

function put(dir: string, rel: string) {
  const full = join(dir, rel);
  mkdirSync(join(full, '..'), { recursive: true });
  writeFileSync(full, rel);
}

function run(now: number, ...extra: string[]) {
  const res = spawnSync('bash', [SCRIPT, live, dist, state, '7', ...extra], {
    env: { ...process.env, NOW: String(now) },
    encoding: 'utf8',
  });
  expect(res.status, res.stderr).toBe(0);
  return res.stdout;
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'prune-astro-'));
  live = join(root, 'webroot/_astro');
  dist = join(root, 'dist/_astro');
  state = join(root, 'state/astro-obsolete.tsv');
  mkdirSync(live, { recursive: true });
  mkdirSync(dist, { recursive: true });
  mkdirSync(join(root, 'state'));
});

afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('prune-astro-assets.sh', () => {
  it('behält veraltete Bundles bis zum Ablauf der Frist und löscht sie danach', () => {
    put(live, 'index.OLD.css');
    put(live, 'index.NEW.css');
    put(dist, 'index.NEW.css');

    run(T0);
    expect(existsSync(join(live, 'index.OLD.css'))).toBe(true);
    expect(readFileSync(state, 'utf8')).toBe(`index.OLD.css\t${T0}\n`);

    // Späterer Deploy innerhalb der Frist: Zeitstempel bleibt der erste.
    run(T0 + 6 * DAY);
    expect(existsSync(join(live, 'index.OLD.css'))).toBe(true);
    expect(readFileSync(state, 'utf8')).toBe(`index.OLD.css\t${T0}\n`);

    run(T0 + 7 * DAY);
    expect(existsSync(join(live, 'index.OLD.css'))).toBe(false);
    expect(existsSync(join(live, 'index.NEW.css'))).toBe(true);
    expect(readFileSync(state, 'utf8')).toBe('');
  });

  it('löscht nie Dateien des aktuellen Builds, auch mit altem Status-Eintrag', () => {
    put(live, 'chunks/a.HASH.js');
    put(dist, 'chunks/a.HASH.js');
    writeFileSync(state, `chunks/a.HASH.js\t${T0 - 30 * DAY}\n`);

    run(T0);
    expect(existsSync(join(live, 'chunks/a.HASH.js'))).toBe(true);
    expect(readFileSync(state, 'utf8')).toBe('');
  });

  it('räumt leere Unterordner auf', () => {
    put(live, 'chunks/old.js');
    writeFileSync(state, `chunks/old.js\t${T0 - 8 * DAY}\n`);

    run(T0);
    expect(existsSync(join(live, 'chunks'))).toBe(false);
    expect(existsSync(live)).toBe(true);
  });

  it('--dry-run ändert weder Dateien noch Status', () => {
    put(live, 'old.css');
    writeFileSync(state, `old.css\t${T0 - 8 * DAY}\n`);

    const out = run(T0, '--dry-run');
    expect(out).toContain('würde löschen: _astro/old.css');
    expect(existsSync(join(live, 'old.css'))).toBe(true);
    expect(readFileSync(state, 'utf8')).toBe(`old.css\t${T0 - 8 * DAY}\n`);
  });

  it('bricht bei ungültiger Frist ab', () => {
    const res = spawnSync('bash', [SCRIPT, live, dist, state, 'x'], { encoding: 'utf8' });
    expect(res.status).toBe(2);
  });
});
