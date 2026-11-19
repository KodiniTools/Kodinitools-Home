/**
 * GET gegen die Admin-API (wie `api()` in `public/core.ts`, aber ohne dessen
 * Modul zu importieren): URL relativ zum Auslieferungsort, Session-Cookie,
 * Kennungs-Header. Wirft nie; Fehler kommen als `ok: false`.
 */
export async function apiGet(
  path: string,
  init: { signal?: AbortSignal } = {},
): Promise<{ ok: boolean; status: number; data: unknown }> {
  try {
    const res = await fetch(new URL('api' + path, document.baseURI).toString(), {
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'X-Kodini-Admin': '1' },
      signal: init.signal,
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* kann leer sein */
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.warn('[admin] API-Aufruf fehlgeschlagen', path, e);
    return { ok: false, status: 0, data: null };
  }
}

/**
 * POST mit JSON-Body gegen die Admin-API (Kennungs-Header für CSRF). Wirft nie;
 * Fehler kommen als `ok: false`, `data` trägt dann meist `{ error }`.
 */
export async function apiPost(
  path: string,
  body: unknown,
  init: { signal?: AbortSignal } = {},
): Promise<{ ok: boolean; status: number; data: unknown }> {
  try {
    const res = await fetch(new URL('api' + path, document.baseURI).toString(), {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-Kodini-Admin': '1', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: init.signal,
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* kann leer sein */
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    console.warn('[admin] API-Aufruf fehlgeschlagen', path, e);
    return { ok: false, status: 0, data: null };
  }
}
