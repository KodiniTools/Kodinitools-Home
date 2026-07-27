// Kleine HTTP-Helfer (ohne externe Deps).

/** Liest den kompletten Request-Body als Buffer, mit Größenlimit. */
export function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
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

/** Liest den Body und parst ihn als JSON. */
export async function readJson(req, maxBytes = 5 * 1024 * 1024) {
  const buf = await readBody(req, maxBytes);
  if (buf.length === 0) return {};
  return JSON.parse(buf.toString('utf8'));
}

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

export function sendText(res, status, text, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
  res.end(text);
}

/** Ermittelt die Client-IP (respektiert X-Forwarded-For von nginx). */
export function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * CSRF-Schutz: Mutationen müssen den Custom-Header X-Kodini-Admin tragen.
 * Cross-Site-Formulare können keine Custom-Header setzen; zusammen mit
 * SameSite=Strict-Cookies genügt das für dieses Ein-Konto-Setup.
 */
export function csrfOk(req) {
  return req.headers['x-kodini-admin'] === '1';
}
