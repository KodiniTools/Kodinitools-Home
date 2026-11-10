// @ts-check
// Layout-Tab – Bild aus der Zwischenablage (Strg/Cmd+V oder Button) in eine
// Kachel, das Banner oder eine Diashow einsetzen. Das Modul kennt den Tab nicht
// direkt: Neu-Rendern und Kachel-Markierung kommen über initPaste() aus layout.js.

import { $, toast, fmtBytes } from './core.js';
import {
  state,
  isLangSection,
  setMediaVal,
  getBannerSlides,
  getGridSlides,
  BANNER_SLIDES_MAX,
} from './model.js';
import { stageFile } from './media.js';

/** @import { Lang } from '../types.ts' */
/** @import { PasteTarget } from '../app/tabs/layout/layoutData' */
/**
 * Rückrufe des Layout-Tabs.
 * @typedef {{ rerender: () => void; markCell: (pane: HTMLElement, i: number) => void; activeCell: () => number | null }} PasteHooks
 */

// Rückrufe des Layout-Tabs (werden von layout.js beim Laden gesetzt).
/** @type {PasteHooks} */
const hooks = {
  rerender: () => {},
  markCell: () => {},
  activeCell: () => null,
};
/** @param {Partial<PasteHooks>} h */
export function initPaste(h) {
  Object.assign(hooks, h);
}

// Dateiendung je MIME-Typ für Bilder aus der Zwischenablage (Screenshots = PNG).
/** @type {Record<string, string>} */
const IMG_EXT = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const MAX_PASTE_BYTES = 25 * 1024 * 1024;

// Legt ein Bild (Blob) im Zwischenspeicher ab, weist es Kachel i (oder dem
// Banner bei i === 'banner') zu und rendert den Tab neu (Scrollposition bleibt,
// Kachel bleibt markiert).
/**
 * @param {Lang} lang
 * @param {PasteTarget} i
 * @param {Blob} blob
 * @returns {Promise<boolean>}
 */
async function assignImageBlob(lang, i, blob) {
  const type = blob.type || 'image/png';
  const ext = IMG_EXT[type];
  if (!ext) {
    toast(`Bildformat ${type} wird nicht unterstützt (PNG, JPEG, WebP, GIF)`);
    return false;
  }
  if (blob.size > MAX_PASTE_BYTES) {
    toast(`Bild zu groß (${fmtBytes(blob.size)}, max. ${fmtBytes(MAX_PASTE_BYTES)})`);
    return false;
  }
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-');
  const isBanner = i === 'banner';
  const isSlide = i === 'slide';
  const cellSlide =
    typeof i === 'string' && i.startsWith('cellslide:') ? Number(i.slice(10)) : null;
  if (
    (isSlide && getBannerSlides(lang).length >= BANNER_SLIDES_MAX) ||
    (cellSlide !== null && getGridSlides(lang, cellSlide).length >= BANNER_SLIDES_MAX)
  ) {
    toast(`Maximal ${BANNER_SLIDES_MAX} weitere Bilder`);
    return false;
  }
  const base = isBanner
    ? 'banner'
    : isSlide
      ? 'banner-diashow'
      : cellSlide !== null
        ? `kachel-${cellSlide + 1}-diashow`
        : `kachel-${Number(i) + 1}`;
  const name = `${base}-${stamp}.${ext}`;
  const id = await stageFile(new File([blob], name, { type }), name);
  if (isSlide) getBannerSlides(lang).push('staged:' + id);
  else if (cellSlide !== null) getGridSlides(lang, cellSlide).push('staged:' + id);
  else
    setMediaVal(
      lang,
      isBanner ? 'heroBanner' : /** @type {import('../types.ts').MediaKey} */ (`grid${i}`),
      'staged:' + id,
    );
  const y = window.scrollY;
  hooks.rerender();
  if (cellSlide !== null) hooks.markCell($('#content'), cellSlide);
  else if (typeof i === 'number') hooks.markCell($('#content'), i);
  window.scrollTo({ top: y });
  toast(
    `Bild ${isBanner ? 'als Banner' : isSlide ? 'an die Diashow angehängt' : cellSlide !== null ? `an die Diashow von Kachel ${cellSlide + 1} angehängt` : `in Kachel ${Number(i) + 1}`} (${fmtBytes(blob.size)}) – lokal bis zum Veröffentlichen`,
  );
  return true;
}

// Erstes Bild aus einer DataTransfer-Liste (Zwischenablage/Drop) oder null.
/**
 * @param {DataTransfer | null} dt
 * @returns {File | null}
 */
function imageFromDataTransfer(dt) {
  if (!dt) return null;
  for (const it of Array.from(dt.items || [])) {
    if (it.kind === 'file' && /^image\//.test(it.type)) return it.getAsFile();
  }
  for (const f of Array.from(dt.files || [])) if (/^image\//.test(f.type)) return f;
  return null;
}

// Button „Aus Zwischenablage einfügen": liest die Zwischenablage über die
// Clipboard-API (nur HTTPS/localhost, fragt ggf. um Erlaubnis). Ohne Zugriff
// bleibt Strg/Cmd+V auf der markierten Kachel als Weg.
/**
 * @param {Lang} lang
 * @param {PasteTarget} i
 */
export async function pasteFromClipboardApi(lang, i) {
  if (!navigator.clipboard || typeof navigator.clipboard.read !== 'function') {
    toast(
      i === 'banner' || i === 'slide' || String(i).startsWith('cellslide:')
        ? 'Zwischenablage nicht direkt lesbar – jetzt Strg/Cmd+V drücken'
        : 'Zwischenablage nicht direkt lesbar – Kachel ist markiert: jetzt Strg/Cmd+V drücken',
    );
    return;
  }
  try {
    const items = await navigator.clipboard.read();
    for (const it of items) {
      const type = it.types.find((t) => /^image\//.test(t));
      if (!type) continue;
      const blob = await it.getType(type);
      await assignImageBlob(lang, i, blob);
      return;
    }
    toast('Kein Bild in der Zwischenablage');
  } catch (e) {
    const hint =
      i === 'banner' || i === 'slide' || String(i).startsWith('cellslide:')
        ? 'jetzt Strg/Cmd+V drücken'
        : 'Kachel ist markiert: jetzt Strg/Cmd+V drücken';
    toast(
      e instanceof Error && e.name === 'NotAllowedError'
        ? `Zugriff auf die Zwischenablage abgelehnt – ${hint}`
        : `Zwischenablage nicht lesbar – ${hint}`,
    );
  }
}

// Strg/Cmd+V im Layout-Tab: Bild aus der Zwischenablage in die Kachel einfügen,
// deren Editor den Fokus hat, sonst in die zuletzt markierte Kachel. Text-Einfügen
// in Eingabefelder bleibt unberührt (nur Bild-Daten werden abgefangen).
/** @param {ClipboardEvent} e */
function onDocumentPaste(e) {
  if (state.nav.sub !== 'layout' || !isLangSection(state.nav.section)) return;
  const lang = state.nav.section;
  const pane = $('#content');
  if (!pane) return;
  // Banner-Modus: Bild aus der Zwischenablage wird zum Banner (außer beim Text-
  // Einfügen in ein Eingabefeld – dort nur, wenn wirklich Bilddaten anliegen).
  if (pane.querySelector('[data-bannermediablock]')) {
    const blob = imageFromDataTransfer(e.clipboardData);
    if (!blob) return;
    e.preventDefault();
    assignImageBlob(lang, 'banner', blob).catch((err) => {
      console.error(err);
      toast('Einfügen fehlgeschlagen');
    });
    return;
  }
  if (!pane.querySelector('[data-celleditor]')) return;
  const blob = imageFromDataTransfer(e.clipboardData);
  if (!blob) return;
  const editor =
    e.target instanceof Element
      ? /** @type {HTMLElement | null} */ (e.target.closest('[data-celleditor]'))
      : null;
  const i = editor ? Number(editor.dataset.celleditor) : hooks.activeCell();
  if (i === null || i === undefined || !pane.querySelector(`[data-celleditor="${i}"]`)) {
    toast('Zuerst eine Kachel anklicken, dann Strg/Cmd+V');
    return;
  }
  e.preventDefault();
  assignImageBlob(lang, i, blob).catch((err) => {
    console.error(err);
    toast('Einfügen fehlgeschlagen');
  });
}
document.addEventListener('paste', onDocumentPaste);
