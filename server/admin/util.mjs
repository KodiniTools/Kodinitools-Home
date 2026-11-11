// @ts-check
// Kleine HTTP-/Prozess-Helfer (ohne externe Deps).

import { spawn } from 'node:child_process';

/** @import { IncomingMessage, ServerResponse, OutgoingHttpHeaders } from 'node:http' */
/**
 * Optionen für {@link runStreaming}.
 * @typedef {{
 *   cwd?: string;
 *   env?: NodeJS.ProcessEnv;
 *   timeoutMs?: number;
 *   onLine?: (line: string) => void;
 * }} RunOptions
 */
/** Fehler mit HTTP-Status (z. B. 413 bei zu großem Body). */
/** @typedef {Error & { statusCode?: number }} HttpError */

/**
 * Liest den kompletten Request-Body als Buffer, mit Größenlimit.
 * @param {IncomingMessage} req
 * @param {number} maxBytes
 * @returns {Promise<Buffer>}
 */
export function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    /** @type {Buffer[]} */
    const chunks = [];
    let size = 0;
    req.on('data', (/** @type {Buffer} */ c) => {
      size += c.length;
      if (size > maxBytes) {
        reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Liest den Body und parst ihn als JSON.
 * @param {IncomingMessage} req
 * @param {number} [maxBytes]
 * @returns {Promise<any>}
 */
export async function readJson(req, maxBytes = 5 * 1024 * 1024) {
  const buf = await readBody(req, maxBytes);
  if (buf.length === 0) return {};
  return JSON.parse(buf.toString('utf8'));
}

/**
 * @param {ServerResponse} res
 * @param {number} status
 * @param {unknown} obj
 * @param {OutgoingHttpHeaders} [extraHeaders]
 */
export function sendJson(res, status, obj, extraHeaders = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  res.end(body);
}

/**
 * @param {ServerResponse} res
 * @param {number} status
 * @param {string} text
 * @param {OutgoingHttpHeaders} [headers]
 */
export function sendText(res, status, text, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(text);
}

/**
 * Ermittelt die Client-IP (respektiert X-Forwarded-For von nginx).
 * @param {IncomingMessage} req
 * @returns {string}
 */
export function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * CSRF-Schutz: Mutationen müssen den Custom-Header X-Kodini-Admin tragen.
 * Cross-Site-Formulare können keine Custom-Header setzen; zusammen mit
 * SameSite=Strict-Cookies genügt das für dieses Ein-Konto-Setup.
 * @param {IncomingMessage} req
 */
export function csrfOk(req) {
  return req.headers['x-kodini-admin'] === '1';
}

/**
 * Startet einen Prozess und liefert seine Ausgabe ZEILENWEISE über `onLine`
 * (Live-Log für lange Schritte wie deploy.sh / astro build), statt sie erst am
 * Ende am Stück zurückzugeben. ANSI-Farbcodes werden entfernt. Nach `timeoutMs`
 * wird der Prozess beendet (SIGTERM, dann SIGKILL) und die Promise verworfen.
 * Löst mit der gesamten (gekürzten) Ausgabe auf; Exit-Code != 0 -> Fehler.
 * @param {string} cmd
 * @param {string[]} args
 * @param {RunOptions} [opts]
 * @returns {Promise<string>}
 */
export function runStreaming(cmd, args, { cwd, env, timeoutMs = 20 * 60 * 1000, onLine } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    const MAX_KEEP = 2 * 1024 * 1024;
    let all = '';
    let buf = '';
    let timedOut = false;
    // eslint-disable-next-line no-control-regex -- ANSI-Escape (ESC) gezielt entfernen
    const strip = (/** @type {string} */ t) => t.replace(/\x1b\[[0-9;]*m/g, '');
    const feed = (/** @type {Buffer} */ chunk) => {
      const text = strip(chunk.toString());
      all += text;
      if (all.length > MAX_KEEP) all = all.slice(-MAX_KEEP);
      buf += text;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trimEnd();
        buf = buf.slice(i + 1);
        if (line.trim() && onLine) onLine(line);
      }
    };
    child.stdout.on('data', feed);
    child.stderr.on('data', feed);
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 5000).unref();
    }, timeoutMs);
    let done = false;
    /** @type {NodeJS.Timeout | undefined} */
    let graceTimer;
    /**
     * @param {number | null} code
     * @param {NodeJS.Signals | null} signal
     */
    const finish = (code, signal) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      clearTimeout(graceTimer);
      if (buf.trim() && onLine) onLine(buf.trimEnd());
      if (timedOut)
        reject(new Error(`Zeitüberschreitung nach ${Math.round(timeoutMs / 60000)} min: ${cmd}`));
      else if (code !== 0)
        reject(new Error(`${cmd} beendet mit Code ${code}${signal ? ` (${signal})` : ''}`));
      else resolvePromise(all.trim());
    };
    child.on('error', (err) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      reject(err);
    });
    // 'exit' = Prozess ist beendet. 'close' folgt erst, wenn auch die stdio-
    // Pipes zu sind – das bleibt aus, wenn ein Hintergrund-Enkelprozess (z. B.
    // aus einem Deploy-Skript) die Pipe geerbt hat und weiterläuft. execFile
    // wartete darauf endlos („läuft…" ohne Ende). Daher: nach 'exit' höchstens
    // kurz auf 'close' warten, dann mit dem Exit-Code abschließen.
    child.on('exit', (code, signal) => {
      graceTimer = setTimeout(() => {
        if (done) return;
        if (onLine)
          onLine(
            'Hinweis: Ein Hintergrundprozess hält die Ausgabe noch offen – Schritt gilt mit Exit-Code ' +
              `${code} als beendet.`,
          );
        finish(code, signal);
      }, 2000);
      graceTimer.unref();
    });
    child.on('close', (code, signal) => finish(code, signal));
  });
}
