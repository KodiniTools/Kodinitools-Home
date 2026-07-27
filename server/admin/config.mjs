// Konfiguration des Admin-Dienstes. Werte kommen aus der Umgebung
// (systemd EnvironmentFile=/opt/kodini/.env). Für lokale Entwicklung gibt es
// sinnvolle Defaults, die auf die Repo-Struktur zeigen.

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// server/admin -> Repo-Wurzel
const REPO_ROOT_DEFAULT = resolve(__dirname, '../..');

function int(name, def) {
  const v = process.env[name];
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : def;
}

export const config = {
  host: process.env.BIND_HOST || '127.0.0.1',
  port: int('PORT', 9020),

  // Auth
  passwordHash: process.env.ADMIN_PASSWORD_HASH || '',
  sessionSecret: process.env.SESSION_SECRET || '',
  sessionTtlHours: int('SESSION_TTL_HOURS', 8),
  totpSecret: process.env.ADMIN_TOTP_SECRET || '', // optional (Phase 5)

  // Pfade
  repoDir: process.env.REPO_DIR || REPO_ROOT_DEFAULT,
  webroot: process.env.WEBROOT || '/var/www/kodinitools.com',
  uploadsDir: process.env.UPLOADS_DIR || resolve(REPO_ROOT_DEFAULT, 'uploads'),

  // Git
  gitBranch: process.env.GIT_BRANCH || 'main',
  gitRemote: process.env.GIT_REMOTE || 'origin',

  // Uploads
  maxUploadMb: int('MAX_UPLOAD_MB', 2048),

  // Login-Bruteforce-Schutz
  loginMaxAttempts: int('LOGIN_MAX_ATTEMPTS', 8),
  loginWindowMs: int('LOGIN_WINDOW_MS', 15 * 60 * 1000),

  isProd: process.env.NODE_ENV === 'production',
};

/** Pfade zu den vom Admin editierbaren Content-Dateien. */
export function contentPaths() {
  const base = resolve(config.repoDir, 'src/content');
  return {
    overridesDe: resolve(base, 'overrides.de.json'),
    overridesEn: resolve(base, 'overrides.en.json'),
    tickerDe: resolve(base, 'ticker.de.json'),
    tickerEn: resolve(base, 'ticker.en.json'),
    localesDe: resolve(config.repoDir, 'src/locales/de.json'),
    localesEn: resolve(config.repoDir, 'src/locales/en.json'),
    base,
  };
}

/** Startet der Dienst? Prüft, ob Pflicht-Secrets gesetzt sind. */
export function assertConfigured() {
  const missing = [];
  if (!config.passwordHash) missing.push('ADMIN_PASSWORD_HASH');
  if (!config.sessionSecret) missing.push('SESSION_SECRET');
  return missing;
}
