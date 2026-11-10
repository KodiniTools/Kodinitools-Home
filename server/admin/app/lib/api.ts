/**
 * GET gegen die Admin-API (wie `api()` in `public/core.js`, aber ohne dessen
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
