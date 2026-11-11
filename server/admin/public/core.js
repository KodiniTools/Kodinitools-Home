// @ts-check
// Kern-Hilfen des Adminbereichs: API-Aufrufe, IndexedDB-Zwischenspeicher und
// kleine DOM-Helfer. Keine Abhängigkeiten zu anderen Admin-Modulen.

/** @import { StagedItem } from '../types.ts' */
/** @import { ToastType } from '../app/stores/toast' */

/**
 * Antwort von `api()`: `data` ist das geparste JSON (oder `null`).
 * @typedef {{ ok: boolean; status: number; data: any }} ApiResult
 */
/**
 * @typedef {object} ApiOptions
 * @property {string} [method]
 * @property {unknown} [body] wird als JSON gesendet
 * @property {BodyInit} [raw] wird unverändert gesendet (z. B. Datei)
 * @property {Record<string, string>} [headers]
 */

// --- API-Basis relativ zum Auslieferungsort (funktioniert unter /admin/ und lokal /) ---
export const apiUrl = (/** @type {string} */ p) => new URL('api' + p, document.baseURI).toString();

/**
 * @param {string} path
 * @param {ApiOptions} [options]
 * @returns {Promise<ApiResult>}
 */
export async function api(path, { method = 'GET', body, raw, headers = {} } = {}) {
  /** @type {Record<string, string>} */
  const hdrs = { 'X-Kodini-Admin': '1', ...headers };
  /** @type {RequestInit & { headers: Record<string, string> }} */
  const opts = { method, credentials: 'same-origin', headers: hdrs };
  if (raw !== undefined) {
    opts.body = raw;
  } else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(apiUrl(path), opts);
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* kann leer sein */
  }
  return { ok: res.ok, status: res.status, data };
}

// --- IndexedDB: lokaler Medien-Zwischenspeicher (Staging) ---
/** @returns {Promise<IDBDatabase>} */
function openDb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('kodini-admin', 1);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains('media'))
        r.result.createObjectStore('media', { keyPath: 'id' });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
/** @returns {Promise<StagedItem[]>} */
export async function mediaAll() {
  const db = await openDb();
  return new Promise((res, rej) => {
    const rq = db.transaction('media').objectStore('media').getAll();
    rq.onsuccess = () => res(rq.result || []);
    rq.onerror = () => rej(rq.error);
  });
}
/**
 * @param {string} id
 * @returns {Promise<StagedItem | null>}
 */
export async function mediaGet(id) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const rq = db.transaction('media').objectStore('media').get(id);
    rq.onsuccess = () => res(rq.result || null);
    rq.onerror = () => rej(rq.error);
  });
}
/**
 * @param {StagedItem} item
 * @returns {Promise<void>}
 */
export async function mediaPut(item) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction('media', 'readwrite');
    tx.objectStore('media').put(item);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function mediaDel(id) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction('media', 'readwrite');
    tx.objectStore('media').delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

// --- DOM-Helfer ---
/**
 * Element der festen Admin-Oberfläche (index.html); fehlt es, ist das ein
 * Programmierfehler – daher ohne `null` typisiert.
 * @template {HTMLElement} [T=HTMLElement]
 * @param {string} sel
 * @returns {T}
 */
export const $ = (sel) => /** @type {T} */ (document.querySelector(sel));
/** @type {Record<string, string>} */
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** @param {unknown} s */
export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ESC[c] ?? c);
}
/** @type {ReturnType<typeof setTimeout> | undefined} */
let toastTimer;
// Kurzmeldung. Sind die Vue-Teile geladen (window.kodiniAdminVue), übernimmt
// deren Toast-Store (mehrere Meldungen, Schließen-Knopf, Fehler länger sichtbar);
// sonst die bisherige Einzelmeldung in #toast.
/**
 * @param {unknown} msg
 * @param {ToastType} [type]
 */
export function toast(msg, type = 'info') {
  const vue = typeof window !== 'undefined' ? window.kodiniAdminVue : undefined;
  if (vue && typeof vue.toast === 'function') {
    try {
      vue.toast(String(msg), { type });
      return;
    } catch {
      /* Fallback auf den Vanilla-Toast */
    }
  }
  const t = $('#toast');
  t.textContent = String(msg);
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/** @param {number | null | undefined} n */
export function fmtBytes(n) {
  if (!n && n !== 0) return '';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}
