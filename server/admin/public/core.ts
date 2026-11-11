// Kern-Hilfen des Adminbereichs: API-Aufrufe, IndexedDB-Zwischenspeicher und
// kleine DOM-Helfer. Keine Abhängigkeiten zu anderen Admin-Modulen.

import type { StagedItem, RawJson } from '../types';
import type { ToastType } from '../app/stores/toast';

/** Antwort von `api()`: `data` ist das geparste JSON (oder `null`). */
export type ApiResult = { ok: boolean; status: number; data: RawJson };
export type ApiOptions = {
  method?: string;
  /** wird als JSON gesendet */
  body?: unknown;
  /** wird unverändert gesendet (z. B. Datei) */
  raw?: BodyInit;
  headers?: Record<string, string>;
};

// --- API-Basis relativ zum Auslieferungsort (funktioniert unter /admin/ und lokal /) ---
export const apiUrl = (p: string) => new URL('api' + p, document.baseURI).toString();

export async function api(
  path: string,
  { method = 'GET', body, raw, headers = {} }: ApiOptions = {},
): Promise<ApiResult> {
  const hdrs: Record<string, string> = { 'X-Kodini-Admin': '1', ...headers };
  const opts: RequestInit & { headers: Record<string, string> } = {
    method,
    credentials: 'same-origin',
    headers: hdrs,
  };
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

function openDb(): Promise<IDBDatabase> {
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

export async function mediaAll(): Promise<StagedItem[]> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const rq = db.transaction('media').objectStore('media').getAll();
    rq.onsuccess = () => res(rq.result || []);
    rq.onerror = () => rej(rq.error);
  });
}
export async function mediaGet(id: string): Promise<StagedItem | null> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const rq = db.transaction('media').objectStore('media').get(id);
    rq.onsuccess = () => res(rq.result || null);
    rq.onerror = () => rej(rq.error);
  });
}
export async function mediaPut(item: StagedItem): Promise<void> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction('media', 'readwrite');
    tx.objectStore('media').put(item);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
export async function mediaDel(id: string): Promise<void> {
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
 */
export const $ = <T = HTMLElement>(sel: string): T => document.querySelector(sel) as T;
const ESC: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function esc(s: unknown) {
  return String(s).replace(/[&<>"']/g, (c) => ESC[c] ?? c);
}
let toastTimer: ReturnType<typeof setTimeout> | undefined;
// Kurzmeldung. Sind die Vue-Teile geladen (window.kodiniAdminVue), übernimmt
// deren Toast-Store (mehrere Meldungen, Schließen-Knopf, Fehler länger sichtbar);
// sonst die bisherige Einzelmeldung in #toast.
export function toast(msg: unknown, type: ToastType = 'info') {
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

export function fmtBytes(n: number | null | undefined) {
  if (!n && n !== 0) return '';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB';
  return (n / 1024 / 1024).toFixed(1) + ' MB';
}
