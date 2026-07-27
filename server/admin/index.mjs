// Kodini Admin-Dienst — HTTP-Server (nur Node-Built-ins).
// Läuft lokal auf 127.0.0.1:PORT, hinter nginx unter /admin bzw. /admin/api.
// nginx entfernt das /admin-Präfix, hier kommen also / und /api/... an.

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, normalize, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config, assertConfigured } from './config.mjs';
import {
  verifyPassword,
  createSessionToken,
  sessionCookie,
  clearCookie,
  isAuthenticated,
  loginBlocked,
  recordLoginFailure,
  recordLoginSuccess,
} from './auth.mjs';
import { readJson, readBody, sendJson, sendText, clientIp, csrfOk } from './util.mjs';
import { loadContent, saveContent } from './content.mjs';
import { saveUpload } from './uploads.mjs';
import { startPublish, getPublishState } from './publish.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = resolve(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function noindex(res) {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
}

// --- Statische Auslieferung des Admin-Frontends (Phase 4) ---
async function serveStatic(req, res, urlPath) {
  // Pfad sicher innerhalb PUBLIC_DIR auflösen
  const rel = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  let filePath = resolve(PUBLIC_DIR, '.' + (rel === '/' ? '/index.html' : rel));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    return sendText(res, 403, 'Forbidden');
  }
  try {
    let s = await stat(filePath);
    if (s.isDirectory()) filePath = resolve(filePath, 'index.html');
    const body = await readFile(filePath);
    noindex(res);
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    // SPA-Fallback: unbekannte Pfade -> index.html (falls vorhanden)
    try {
      const body = await readFile(resolve(PUBLIC_DIR, 'index.html'));
      noindex(res);
      res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
      res.end(body);
    } catch {
      sendText(res, 404, 'Admin-Frontend noch nicht gebaut (Phase 4).');
    }
  }
}

// --- API ---
function requireAuth(req, res) {
  if (!isAuthenticated(req)) {
    sendJson(res, 401, { error: 'Nicht angemeldet' });
    return false;
  }
  return true;
}
function requireCsrf(req, res) {
  if (!csrfOk(req)) {
    sendJson(res, 403, { error: 'CSRF-Header fehlt' });
    return false;
  }
  return true;
}

async function handleApi(req, res, path) {
  const method = req.method;

  // Login
  if (path === '/api/login' && method === 'POST') {
    const ip = clientIp(req);
    if (loginBlocked(ip))
      return sendJson(res, 429, { error: 'Zu viele Versuche. Bitte später erneut.' });
    let body;
    try {
      body = await readJson(req);
    } catch {
      return sendJson(res, 400, { error: 'Ungültiger Body' });
    }
    const ok = await verifyPassword(String(body.password || ''), config.passwordHash);
    if (!ok) {
      recordLoginFailure(ip);
      return sendJson(res, 401, { error: 'Falsches Passwort' });
    }
    recordLoginSuccess(ip);
    const token = createSessionToken();
    return sendJson(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(token) });
  }

  // Logout
  if (path === '/api/logout' && method === 'POST') {
    return sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearCookie() });
  }

  // Session-Status
  if (path === '/api/session' && method === 'GET') {
    return sendJson(res, 200, { authenticated: isAuthenticated(req) });
  }

  // Ab hier: Auth erforderlich
  if (path === '/api/content' && method === 'GET') {
    if (!requireAuth(req, res)) return;
    const content = await loadContent();
    return sendJson(res, 200, content);
  }

  if (path === '/api/content' && method === 'PUT') {
    if (!requireAuth(req, res)) return;
    if (!requireCsrf(req, res)) return;
    let body;
    try {
      body = await readJson(req, 4 * 1024 * 1024);
    } catch {
      return sendJson(res, 400, { error: 'Ungültiger Body' });
    }
    try {
      const saved = await saveContent(body);
      return sendJson(res, 200, { ok: true, saved });
    } catch (e) {
      return sendJson(res, 400, { error: e.message });
    }
  }

  if (path === '/api/upload' && method === 'POST') {
    if (!requireAuth(req, res)) return;
    if (!requireCsrf(req, res)) return;
    const filename = req.headers['x-filename'];
    if (!filename) return sendJson(res, 400, { error: 'X-Filename-Header fehlt' });
    try {
      const buf = await readBody(req, config.maxUploadMb * 1024 * 1024);
      const result = await saveUpload(buf, filename);
      return sendJson(res, 200, { ok: true, ...result });
    } catch (e) {
      return sendJson(res, e.statusCode || 500, { error: e.message });
    }
  }

  if (path === '/api/publish' && method === 'POST') {
    if (!requireAuth(req, res)) return;
    if (!requireCsrf(req, res)) return;
    let body = {};
    try {
      body = await readJson(req);
    } catch {
      /* optional */
    }
    const result = startPublish(typeof body.message === 'string' ? body.message.slice(0, 100) : '');
    if (!result.ok) return sendJson(res, 409, { error: result.reason });
    return sendJson(res, 202, { ok: true });
  }

  if (path === '/api/publish/status' && method === 'GET') {
    if (!requireAuth(req, res)) return;
    return sendJson(res, 200, getPublishState());
  }

  return sendJson(res, 404, { error: 'Unbekannter Endpunkt' });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    if (path === '/api' || path.startsWith('/api/')) {
      await handleApi(req, res, path);
    } else {
      await serveStatic(req, res, path);
    }
  } catch (err) {
    if (!res.headersSent)
      sendJson(res, err.statusCode || 500, { error: err.message || 'Serverfehler' });
    else res.end();
  }
});

// --- Start ---
const missing = assertConfigured();
if (missing.length) {
  console.error(`[kodini-admin] FEHLENDE Konfiguration: ${missing.join(', ')}`);
  console.error('[kodini-admin] Setze diese in /opt/kodini/.env (siehe deploy/.env.example).');
  process.exit(1);
}

server.listen(config.port, config.host, () => {
  console.log(
    `[kodini-admin] läuft auf http://${config.host}:${config.port} (repo: ${config.repoDir})`,
  );
});
