// Medien: der „Medien"-Tab (Hero-Bereich + Sektions-Slots), der „Dateien"-Tab
// (Server-Dateien + Browser-Zwischenspeicher), das Auswahl-Popup sowie das Laden
// der Server-Dateiliste.

import { $, esc, api, mediaAll, mediaPut, mediaDel } from './core.js';
import { mountVueTab } from './islands.js';
import {
  state,
  getMediaVal,
  setMediaVal,
  defMediaVal,
  MEDIA_LANGS,
  MEDIA_KEYS,
  allImageSlots,
  heroLayoutCells,
  updateMediaUrlEverywhere,
  getSectionMedia,
  defaultSectionMediaSide,
  defaultSectionMediaText,
  defaultBannerSlideshow,
  BANNER_SLIDES_MAX,
  BANNER_TRANSITIONS,
  getPageBg,
  PAGE_BG_DEFAULT,
} from './model.js';
import { ensureFontFace } from './fonts.js';

// Anzeige-Namen der Medien-Plätze (für „wird verwendet in").
const SLOT_LABELS = {
  audio: 'Audio-Sektion',
  image: 'Bild-Sektion',
  diverse: 'Diverse-Sektion',
  heroBanner: 'Hero-Banner',
  grid0: 'Kachel 1',
  grid1: 'Kachel 2',
  grid2: 'Kachel 3',
  grid3: 'Kachel 4',
  grid4: 'Kachel 5',
  grid5: 'Kachel 6',
};
// Alle Plätze (Sprache · Slot), die auf eine der übergebenen Referenzen zeigen –
// als { label, mode } mit mode 'light' | 'dark' (Platz gilt nur in diesem Modus)
// oder 'both' (Hero-Medien, Sektions-Medien, Diashows: in beiden Modi).
function usageDetailed(...refs) {
  const set = refs.filter(Boolean);
  const out = [];
  if (!set.length) return out;
  for (const lang of MEDIA_LANGS) {
    for (const key of MEDIA_KEYS) {
      if (set.includes(getMediaVal(lang, key))) {
        out.push({ label: `${lang.toUpperCase()} · ${SLOT_LABELS[key] || key}`, mode: 'both' });
      }
    }
  }
  for (const slot of allImageSlots()) {
    if (set.includes(slot.get()))
      out.push({
        label: slot.label,
        mode: slot.mode === 'dark' || slot.mode === 'light' ? slot.mode : 'both',
      });
  }
  return out;
}
// Datei-Endung als Format-Badge (z.B. „WEBP").
function fileExt(name) {
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toUpperCase() : '';
}

// Server-Uploads getrennt nach Sprache laden ({ de, en, shared }).
export async function loadServerFiles() {
  const r = await api('/uploads');
  const d = (r.ok && r.data) || {};
  state.serverFiles = {
    de: Array.isArray(d.de) ? d.de : [],
    en: Array.isArray(d.en) ? d.en : [],
    shared: Array.isArray(d.shared) ? d.shared : [],
  };
}

// ============ TAB: Videos & Medien ============
// Diese Slots akzeptieren Video ODER Bild – die Seite rendert je nach
// Dateiendung automatisch <video> oder <img>.

export function objUrl(id) {
  if (state.objectUrls.has(id)) return state.objectUrls.get(id);
  const item = state.stagedItems.find((x) => x.id === id);
  if (!item) return '';
  const u = URL.createObjectURL(item.blob);
  state.objectUrls.set(id, u);
  return u;
}

// Medien EINER Sprache (Banner + Sektions-Slots) im Bereich #content.
export function renderMedia() {
  const lang = state.nav.section;
  const pane = $('#content');
  // Vue-Insel (app/tabs/media).
  mountVueTab(pane, 'media', {
    lang,
    media: state.media[lang],
    service: mediaService(lang),
    pageBg: {
      light: getPageBg('light') || PAGE_BG_DEFAULT.light,
      dark: getPageBg('dark') || PAGE_BG_DEFAULT.dark,
    },
    fonts: state.fonts,
    ensureFontFace,
    gotoLayout: () => document.querySelector('#subnav button[data-sub="layout"]')?.click(),
  });
}

// Zustandsgebundene Teile des Medien-Tabs für die Vue-Fassung (app/tabs/media):
// Struktur sichern, Zwischenspeicher auflösen, Auswahlfenster, Standardwerte.
function mediaService(lang) {
  return {
    sectionMedia: (l, key) => getSectionMedia(l, key),
    resolve: (val) => {
      if (!val) return null;
      if (val.startsWith('staged:')) {
        const id = val.slice(7);
        const item = state.stagedItems.find((x) => x.id === id);
        if (!item) return null;
        return { src: objUrl(id), isVid: /^video\//.test(item.type), localName: item.name };
      }
      return { src: val, isVid: /\.(mp4|webm|mov|m4v|ogv|ogg)$/i.test(val), localName: null };
    },
    pick: (opts, onPick) => {
      const srv = [lang, 'shared'].reduce((n, l) => n + (state.serverFiles[l] || []).length, 0);
      if (!state.stagedItems.length && !srv) return false;
      openMediaPicker(lang, 'vue', { ...opts, onPick });
      return true;
    },
    defaultVal: (key) => defMediaVal(key),
    defaultSide: defaultSectionMediaSide,
    defaultText: defaultSectionMediaText,
    defaultSlideshow: defaultBannerSlideshow,
    heroCells: (layout) => heroLayoutCells(layout),
    slidesMax: BANNER_SLIDES_MAX,
    transitions: BANNER_TRANSITIONS,
  };
}

// ---- Datei-Aktionen (Service des Tabs „Dateien“) ----
// Liefern { ok, error? } und aktualisieren state.serverFiles bzw.
// state.stagedItems, rendern aber nichts neu.
async function deleteServerFile(path) {
  const r = await api('/uploads/delete', { method: 'POST', body: { path } });
  if (!r.ok) return { ok: false, error: String(r.data?.error || r.status) };
  await loadServerFiles();
  return { ok: true };
}
async function moveServerFile(path, lang) {
  const r = await api('/uploads/move', { method: 'POST', body: { path, lang } });
  if (!r.ok) return { ok: false, error: String(r.data?.error || r.status) };
  // Verweise in den Slots mitziehen (alte URL -> neue URL).
  updateMediaUrlEverywhere('/uploads/' + path, r.data.url);
  await loadServerFiles();
  return { ok: true };
}
async function deleteStagedItem(id) {
  await mediaDel(id);
  state.stagedItems = await mediaAll();
  return { ok: true };
}
// Dateien in den Zwischenspeicher legen; zu große werden übersprungen.
async function stageFiles(fileList) {
  const files = Array.from(fileList || []);
  const tooBig = [];
  let added = 0;
  for (const f of files) {
    if (f.size > 2048 * 1024 * 1024) {
      tooBig.push(f.name);
      continue;
    }
    await stageFile(f);
    added++;
  }
  state.stagedItems = await mediaAll();
  return { ok: true, added, tooBig };
}

// Ansichtsdaten des Tabs für die Vue-Fassung: Dateien mit ihren Plätzen
// („wird verwendet in"), berechnet mit den Helfern aus model.js.
function filesSnapshot(lang) {
  const srv = (f) => ({
    kind: 'server',
    key: 'srv:' + f.path,
    name: f.name,
    src: f.url,
    path: f.path,
    bytes: f.bytes,
    ext: fileExt(f.name),
    isVid: /\.(mp4|webm|mov|ogg)$/i.test(f.name),
    usage: usageDetailed(f.url, '/uploads/' + f.path),
  });
  return {
    server: (state.serverFiles[lang] || []).map(srv),
    shared: (state.serverFiles.shared || []).map(srv),
    staged: state.stagedItems.map((item) => ({
      kind: 'staged',
      key: 'stg:' + item.id,
      id: item.id,
      name: item.name,
      src: objUrl(item.id),
      bytes: item.blob ? item.blob.size : null,
      ext: fileExt(item.name),
      isVid: /^video\//.test(item.type),
      published: !!item.publishedUrl,
      usage: usageDetailed('staged:' + item.id, item.publishedUrl),
    })),
  };
}

// Bereich „Dateien" EINER Sprache: Server-Dateien + Browser-Zwischenspeicher.
export function renderFiles() {
  const lang = state.nav.section;
  const pane = $('#content');
  // Vue-Insel (app/tabs/files).
  mountVueTab(pane, 'files', {
    lang,
    service: {
      snapshot: () => filesSnapshot(lang),
      deleteServer: deleteServerFile,
      moveServer: moveServerFile,
      deleteStaged: deleteStagedItem,
      addFiles: stageFiles,
    },
  });
}

// Legt EINE Datei (File/Blob) im Browser-Zwischenspeicher (IndexedDB) ab und
// liefert die neue Kennung – Slot-Wert dann 'staged:<id>'. Wird auch von anderen
// Tabs genutzt (z. B. Layout: Bild aus der Zwischenablage in eine Kachel).
// Aktualisiert state.stagedItems, rendert aber KEINE Ansicht neu.
export async function stageFile(file, name) {
  const item = {
    id: 'm' + Date.now() + Math.random().toString(36).slice(2, 7),
    name: name || file.name || 'datei',
    type: file.type || 'application/octet-stream',
    blob: file,
    createdAt: Date.now(),
    publishedUrl: null,
  };
  await mediaPut(item);
  state.stagedItems = await mediaAll();
  return item.id;
}

// Anklickbares Auswahlfenster: zeigt die Server-Dateien DIESER Sprache (+
// gemeinsame) UND den Browser-Zwischenspeicher. Kachel klicken -> zuweisen.
// opts (optional, für andere Tabs wie den Seiten-Hintergrund):
//   onPick(url)  statt Slot-Zuweisung aufrufen (url = Server-URL oder 'staged:<id>')
//   allLangs     Dateien aller Sprachen anzeigen (global genutztes Medium)
//   imagesOnly   nur Bilder anbieten (keine Videos)
//   title        Fenstertitel
export function openMediaPicker(lang, key, opts = {}) {
  document.getElementById('mediaPicker')?.remove();
  const isVideoName = (name) => /\.(mp4|webm|mov|ogg)$/i.test(name);
  const items = opts.imagesOnly
    ? state.stagedItems.filter((i) => !/^video\//.test(i.type) && !isVideoName(i.name))
    : state.stagedItems;

  const langs = opts.allLangs ? ['de', 'en', 'shared'] : [lang, 'shared'];
  let serverList = langs.flatMap((l) => state.serverFiles[l] || []);
  if (opts.imagesOnly) serverList = serverList.filter((f) => !isVideoName(f.name));
  const serverTiles = serverList
    .map((f) => {
      const media = /\.(mp4|webm|mov|ogg)$/i.test(f.name)
        ? `<video src="${esc(f.url)}" muted></video>`
        : `<img src="${esc(f.url)}" alt="" />`;
      return `<button type="button" class="picker-tile" data-picksrv="${esc(f.url)}">
        ${media}<div class="nm">${esc(f.name)}</div><div class="st pub">✓ auf Server</div>
      </button>`;
    })
    .join('');

  const stagedTiles = items
    .map((item) => {
      const u = objUrl(item.id);
      const media = /^video\//.test(item.type)
        ? `<video src="${u}" muted></video>`
        : `<img src="${u}" alt="" />`;
      const st = item.publishedUrl
        ? '<div class="st pub">✓ veröffentlicht</div>'
        : '<div class="st local">● nur lokal</div>';
      return `<button type="button" class="picker-tile" data-pick="${item.id}">
        ${media}<div class="nm">${esc(item.name)}</div>${st}
      </button>`;
    })
    .join('');

  const section = (title, tiles, empty) =>
    `<h4 style="margin:.75rem 0 .35rem">${title}</h4>` +
    (tiles ? `<div class="media-grid">${tiles}</div>` : `<p class="hint">${empty}</p>`);

  const overlay = document.createElement('div');
  overlay.className = 'picker-overlay';
  overlay.id = 'mediaPicker';
  overlay.innerHTML = `
    <div class="picker-modal" role="dialog" aria-modal="true">
      <h3>${esc(opts.title || 'Medium auswählen')}</h3>
      <p class="hint" style="margin-bottom:.25rem">Auf eine Datei klicken, um sie diesem Platz zuzuweisen.</p>
      ${section('📂 Auf dem Server', serverTiles, 'Noch nichts auf dem Server.')}
      ${section('🖥️ Zwischenspeicher (Browser)', stagedTiles, 'Zwischenspeicher leer.')}
      <div class="row" style="margin-top:1rem;justify-content:flex-end">
        <button type="button" data-pickcancel style="flex:0 0 auto">Abbrechen</button>
      </div>
    </div>`;

  const onKey = (e) => {
    if (e.key === 'Escape') close();
  };
  function close() {
    overlay.remove();
    document.removeEventListener('keydown', onKey);
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close(); // Klick auf den abgedunkelten Hintergrund
  });
  overlay.querySelector('[data-pickcancel]').addEventListener('click', close);
  const assign = (url) => {
    if (opts.onPick) opts.onPick(url);
    else {
      setMediaVal(lang, key, url);
      renderMedia();
    }
  };
  overlay.querySelectorAll('[data-pick]').forEach((el) =>
    el.addEventListener('click', () => {
      const item = items.find((x) => x.id === el.dataset.pick);
      if (item) assign(item.publishedUrl || 'staged:' + item.id);
      close();
    }),
  );
  overlay.querySelectorAll('[data-picksrv]').forEach((el) =>
    el.addEventListener('click', () => {
      assign(el.dataset.picksrv); // direkt die Server-URL zuweisen
      close();
    }),
  );
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
}
