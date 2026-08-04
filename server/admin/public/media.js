// Medien: der „Medien"-Tab (Hero-Bereich + Sektions-Slots), der „Dateien"-Tab
// (Server-Dateien + Browser-Zwischenspeicher), das Auswahl-Popup sowie das Laden
// der Server-Dateiliste.

import { $, esc, api, toast, fmtBytes, mediaAll, mediaPut, mediaDel } from './core.js';
import {
  state,
  getMediaVal,
  setMediaVal,
  defMediaVal,
  GRID_DIMS,
  updateMediaUrlEverywhere,
} from './model.js';

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
const VIDEO_SLOTS = [
  { key: 'audio', label: 'Audio-Tools Sektion' },
  { key: 'image', label: 'Bild-Tools Sektion' },
  { key: 'diverse', label: 'Diverse Tools Sektion' },
];
// Diese Slots akzeptieren Video ODER Bild – die Seite rendert je nach
// Dateiendung automatisch <video> oder <img>.

function objUrl(id) {
  if (state.objectUrls.has(id)) return state.objectUrls.get(id);
  const item = state.stagedItems.find((x) => x.id === id);
  if (!item) return '';
  const u = URL.createObjectURL(item.blob);
  state.objectUrls.set(id, u);
  return u;
}

function slotPreview(val) {
  if (!val) return '';
  if (val.startsWith('staged:')) {
    const id = val.slice(7);
    const item = state.stagedItems.find((x) => x.id === id);
    if (!item) return '<span class="hint">Lokales Medium nicht gefunden</span>';
    const u = objUrl(id);
    const tag = /^video\//.test(item.type)
      ? `<video src="${u}" muted style="max-width:220px;border-radius:6px"></video>`
      : `<img src="${u}" style="max-width:220px;border-radius:6px" />`;
    return `${tag}<p class="st local">● lokal – wird beim Veröffentlichen hochgeladen (${esc(item.name)})</p>`;
  }
  const isVid = /\.(mp4|webm|mov|ogg)$/i.test(val);
  const tag = isVid
    ? `<video src="${esc(val)}" muted style="max-width:220px;border-radius:6px"></video>`
    : `<img src="${esc(val)}" style="max-width:220px;border-radius:6px" onerror="this.style.display='none'" />`;
  // data-slotstatus: nach dem Rendern prüfen wir, ob die /uploads-Datei
  // wirklich auf dem Server liegt (sonst zeigt der Slot fälschlich „ok").
  return `${tag}<p class="st pub" data-slotstatus="${esc(val)}">● ${esc(val)}</p>`;
}

// Prüft nach dem Rendern, ob referenzierte /uploads-Dateien serverseitig
// existieren. Fehlt eine, wird eine deutliche Warnung eingeblendet — so sieht
// der Admin sofort, dass der Slot zwar gesetzt, die Datei aber weg ist.
async function verifyPublishedSlots(pane) {
  const nodes = pane.querySelectorAll('[data-slotstatus]');
  for (const el of nodes) {
    const url = el.dataset.slotstatus;
    if (!/^\/uploads\//.test(url)) continue; // nur hochgeladene Medien prüfen
    let ok;
    try {
      const r = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      ok = r.ok;
    } catch {
      ok = false;
    }
    if (!ok && el.isConnected) {
      el.insertAdjacentHTML(
        'afterend',
        '<p class="st" style="color:#f87171;font-weight:600">⚠ Datei fehlt auf dem Server – bitte über „📁 Aus Zwischenspeicher wählen" neu zuweisen und veröffentlichen.</p>',
      );
    }
  }
}

// Ein einzelner Medien-Slot (Sprache + Schlüssel). data-Attribute kodieren
// "lang:key", damit die Bindings wissen, welche Sprache/welcher Slot gemeint ist.
function mediaSlotPanel(lang, key, { title, hint, placeholder, resetLabel }) {
  const val = getMediaVal(lang, key);
  const staged = val.startsWith('staged:');
  const id = `${lang}:${key}`;
  return `
      <div class="panel">
        <h2>${title}</h2>
        <p class="hint">${hint}</p>
        ${slotPreview(val)}
        <label>Pfad/URL</label>
        <input data-slot="${id}" value="${esc(staged ? '' : val)}" placeholder="${esc(placeholder)}" ${staged ? 'disabled' : ''} />
        <div class="row" style="margin-top:.5rem">
          <button data-slotpick="${id}" style="flex:0 0 auto">📁 Aus Zwischenspeicher wählen</button>
          <button data-slotreset="${id}" style="flex:0 0 auto">${resetLabel}</button>
        </div>
      </div>`;
}

// Hero-Bereich einer Sprache: Umschalter Banner <-> 3er-Raster + passende Slots.
function heroPanel(lang) {
  const mode = state.media[lang].heroMode === 'grid' ? 'grid' : 'banner';
  const toggle = `
      <div class="panel">
        <h2>Hero-Bereich (oben auf der Seite)</h2>
        <p class="hint">Wähle, was ganz oben angezeigt wird.</p>
        <div class="row" style="gap:1.25rem;margin-top:.4rem">
          <label style="display:flex;align-items:center;gap:.4rem;color:var(--text)">
            <input type="radio" name="heromode-${lang}" data-heromode="banner" data-lang="${lang}" ${mode === 'banner' ? 'checked' : ''} style="width:auto" />
            Option 1: Einzel-Banner
          </label>
          <label style="display:flex;align-items:center;gap:.4rem;color:var(--text)">
            <input type="radio" name="heromode-${lang}" data-heromode="grid" data-lang="${lang}" ${mode === 'grid' ? 'checked' : ''} style="width:auto" />
            Option 2: 3er-Bildraster (1:1)
          </label>
        </div>
      </div>`;
  if (mode === 'grid') {
    const ratio = ['1:1', '16:9', '2:3'].includes(state.media[lang].heroGridRatio)
      ? state.media[lang].heroGridRatio
      : '1:1';
    const fitContain = state.media[lang].heroGridFit === 'contain';
    const ratioSel = `
      <div class="panel">
        <label>Seitenverhältnis der Rasterbilder</label>
        <select data-gridratio data-lang="${lang}" style="width:auto">
          <option value="1:1" ${ratio === '1:1' ? 'selected' : ''}>3 × 1:1 (quadratisch)</option>
          <option value="16:9" ${ratio === '16:9' ? 'selected' : ''}>3 × 16:9 (breit)</option>
          <option value="2:3" ${ratio === '2:3' ? 'selected' : ''}>3 × 2:3 (hochkant)</option>
        </select>
        <label style="display:flex;align-items:center;gap:.4rem;color:var(--text);margin-top:.7rem">
          <input type="checkbox" data-gridfit data-lang="${lang}" ${fitContain ? 'checked' : ''} style="width:auto" />
          Ganzes Bild zeigen (nicht beschneiden)
        </label>
        <p class="hint" data-griddims style="margin-top:.6rem">📐 Empfohlene Bildgröße für optimale Darstellung: <strong>${GRID_DIMS[ratio]}</strong> — für alle drei Bilder gleich.</p>
        <p class="hint">Standard: Bild wird formatfüllend zugeschnitten („cover"). Mit Häkchen: das <strong>ganze Bild</strong> wird gezeigt („contain"), ggf. mit Rand.</p>
      </div>`;
    const cells = [0, 1, 2]
      .map((i) =>
        mediaSlotPanel(lang, 'grid' + i, {
          title: `Rasterbild ${i + 1}`,
          hint: 'Wird im 3er-Raster oben angezeigt. Leer = Feld bleibt frei.',
          placeholder: '/uploads/bild.jpg',
          resetLabel: '↺ Entfernen',
        }),
      )
      .join('');
    return toggle + ratioSel + cells;
  }
  return (
    toggle +
    mediaSlotPanel(lang, 'heroBanner', {
      title: 'Banner (ein Bild oder Video)',
      hint: 'Erscheint ganz oben im Hero-Bereich. Bild oder Video. Leer lassen = kein Banner. 📐 Empfohlen: breites Format, ca. 1800 × 480 px (Anzeige bis 900 × 240 px).',
      placeholder: '/uploads/mein-banner.jpg',
      resetLabel: '↺ Entfernen',
    })
  );
}

// Medien-Gruppe einer Sprache: Überschrift + Hero-Bereich + drei Sektions-Slots.
function renderLangMedia(lang) {
  const head = lang === 'de' ? '🇩🇪 Deutsche Startseite' : '🇬🇧 English homepage';
  const forWhich = lang === 'de' ? 'deutsche' : 'englische';
  const header = `
      <div class="panel" style="border-color:var(--accent);background:var(--panel-2)">
        <h2 style="margin:.1rem 0">${head}</h2>
        <p class="hint">Diese Medien gelten nur für die ${forWhich} Startseite.</p>
      </div>`;
  const slots = VIDEO_SLOTS.map((s) =>
    mediaSlotPanel(lang, s.key, {
      title: 'Medium: ' + s.label,
      hint: 'Video oder Bild – wird je nach Datei automatisch passend angezeigt.',
      placeholder: defMediaVal(s.key),
      resetLabel: '↺ Standard',
    }),
  ).join('');
  return header + heroPanel(lang) + slots;
}

const LOC_LABEL = { de: 'DE', en: 'EN', '': 'Gemeinsam' };

// Kacheln für Server-Dateien (Verschieben in andere Sprache + Löschen).
// loc = aktueller Ordner der Dateien ('de' | 'en' | '' = gemeinsam).
function fileTilesHtml(files, loc) {
  if (!files.length) return '<p class="hint">Keine Dateien.</p>';
  const targets = loc === 'de' ? ['en', ''] : loc === 'en' ? ['de', ''] : ['de', 'en'];
  return files
    .map((f) => {
      const isVid = /\.(mp4|webm|mov|ogg)$/i.test(f.name);
      const media = isVid
        ? `<video src="${esc(f.url)}" muted></video>`
        : `<img src="${esc(f.url)}" alt="" loading="lazy" />`;
      const moveBtns = targets
        .map(
          (t) =>
            `<button data-srvmove="${esc(f.path)}" data-tolang="${t}" style="flex:1;padding:.2rem;font-size:.68rem">→ ${LOC_LABEL[t]}</button>`,
        )
        .join('');
      return `<div class="media-tile">
        ${media}
        <div class="nm">${esc(f.name)}</div>
        <div class="st pub">✓ auf Server · ${fmtBytes(f.bytes)}</div>
        <div class="row" style="gap:.25rem;margin-top:.35rem">${moveBtns}</div>
        <button class="danger" data-srvdel="${esc(f.path)}" style="margin-top:.25rem;width:100%;padding:.2rem;font-size:.72rem">Löschen</button>
      </div>`;
    })
    .join('');
}

// Server-Dateien EINER Sprache (+ ggf. gemeinsame Altdateien).
function serverFilesPanel(lang) {
  const langLabel = lang === 'de' ? 'Deutsch' : 'English';
  const langFiles = state.serverFiles[lang] || [];
  const shared = state.serverFiles.shared || [];
  const sharedBlock = shared.length
    ? `
    <div class="panel">
      <h2>📂 Gemeinsame Dateien (ohne Sprache)</h2>
      <p class="hint">Ältere Uploads ohne Sprach-Zuordnung (direkt unter <code>/uploads/</code>).
        Mit „→ DE" / „→ EN" einer Sprache zuordnen (verschieben) oder direkt zuweisen.</p>
      <div class="media-grid">${fileTilesHtml(shared, '')}</div>
    </div>`
    : '';
  return `
    <div class="panel">
      <h2>📂 Dateien auf dem Server — ${langLabel}</h2>
      <p class="hint">Nur die für <strong>${langLabel}</strong> hochgeladenen Medien (unter <code>/uploads/${lang}/</code>) –
        so bleibt getrennt, was auf welche Seite kommt. Über „📁 Aus Zwischenspeicher wählen" bei einem Slot zuweisen.
        <strong>Löschen</strong> entfernt sofort; dauerhaft (auch aus Git) beim nächsten <strong>Veröffentlichen</strong>.</p>
      <div class="media-grid">${fileTilesHtml(langFiles, lang)}</div>
    </div>${sharedBlock}`;
}

// Medien EINER Sprache (Banner + Sektions-Slots) im Bereich #content.
export function renderMedia() {
  const lang = state.nav.section;
  const pane = $('#content');
  pane.innerHTML = renderLangMedia(lang);

  pane.querySelectorAll('[data-heromode]').forEach((el) =>
    el.addEventListener('change', () => {
      if (el.checked) {
        state.media[el.dataset.lang].heroMode = el.dataset.heromode;
        renderMedia();
      }
    }),
  );
  pane.querySelectorAll('[data-gridratio]').forEach((el) =>
    el.addEventListener('change', () => {
      state.media[el.dataset.lang].heroGridRatio = el.value;
      const dims = pane.querySelector('[data-griddims]');
      if (dims)
        dims.innerHTML = `📐 Empfohlene Bildgröße für optimale Darstellung: <strong>${GRID_DIMS[el.value] || ''}</strong> — für alle drei Bilder gleich.`;
    }),
  );
  pane.querySelectorAll('[data-gridfit]').forEach((el) =>
    el.addEventListener('change', () => {
      state.media[el.dataset.lang].heroGridFit = el.checked ? 'contain' : 'cover';
    }),
  );
  pane.querySelectorAll('[data-slot]').forEach((el) =>
    el.addEventListener('input', () => {
      const [l, key] = el.dataset.slot.split(':');
      const v = el.value.trim();
      setMediaVal(l, key, v || defMediaVal(key));
    }),
  );
  pane.querySelectorAll('[data-slotreset]').forEach((el) =>
    el.addEventListener('click', () => {
      const [l, key] = el.dataset.slotreset.split(':');
      setMediaVal(l, key, defMediaVal(key));
      renderMedia();
    }),
  );
  pane.querySelectorAll('[data-slotpick]').forEach((el) =>
    el.addEventListener('click', () => {
      const [l, key] = el.dataset.slotpick.split(':');
      pickFromLibrary(l, key);
    }),
  );

  verifyPublishedSlots(pane);
}

// Bereich „Dateien" EINER Sprache: Server-Dateien + Browser-Zwischenspeicher.
export function renderFiles() {
  const lang = state.nav.section;
  const langLabel = lang === 'de' ? 'Deutsch' : 'English';
  const pane = $('#content');
  const tiles = state.stagedItems.length
    ? state.stagedItems.map(mediaTile).join('')
    : '<p class="hint">Noch nichts im Zwischenspeicher. Dateien unten hineinziehen oder auswählen.</p>';

  pane.innerHTML = `
    ${serverFilesPanel(lang)}
    <div class="panel">
      <h2>Medien-Zwischenspeicher (Browser)</h2>
      <p class="hint">Neue Dateien hier ablegen und dann bei einem <strong>${langLabel}</strong>-Slot zuweisen.
        Beim <strong>Veröffentlichen</strong> landen sie automatisch im ${langLabel}-Ordner
        (<code>/uploads/${lang}/</code>). Der Zwischenspeicher ist gemeinsam – die Sprache
        ergibt sich aus dem Slot, dem du die Datei zuweist.</p>
      <div class="dropzone" id="dropzone">
        Dateien hierher ziehen oder
        <label style="display:inline;color:var(--accent);cursor:pointer;text-decoration:underline">
          auswählen<input type="file" id="fileInput" accept="image/*,video/*" multiple style="display:none" />
        </label>
      </div>
      <div class="media-grid">${tiles}</div>
    </div>`;

  pane.querySelectorAll('[data-srvdel]').forEach((el) =>
    el.addEventListener('click', async () => {
      const path = el.dataset.srvdel;
      if (!confirm(`Datei „${path}" vom Server löschen?`)) return;
      const r = await api('/uploads/delete', { method: 'POST', body: { path } });
      if (!r.ok) {
        toast('Löschen fehlgeschlagen: ' + (r.data?.error || r.status));
        return;
      }
      await loadServerFiles();
      renderFiles();
      toast('Gelöscht – dauerhaft beim nächsten Veröffentlichen');
    }),
  );
  pane.querySelectorAll('[data-srvmove]').forEach((el) =>
    el.addEventListener('click', async () => {
      const path = el.dataset.srvmove;
      const lang = el.dataset.tolang; // '' | 'de' | 'en'
      const r = await api('/uploads/move', { method: 'POST', body: { path, lang } });
      if (!r.ok) {
        toast('Verschieben fehlgeschlagen: ' + (r.data?.error || r.status));
        return;
      }
      // Verweise in den Slots mitziehen (alte URL -> neue URL).
      updateMediaUrlEverywhere('/uploads/' + path, r.data.url);
      await loadServerFiles();
      renderFiles();
      toast(`Verschoben nach „${LOC_LABEL[lang]}" – zum Übernehmen veröffentlichen`);
    }),
  );
  pane.querySelectorAll('[data-mediadel]').forEach((el) =>
    el.addEventListener('click', async () => {
      await mediaDel(el.dataset.mediadel);
      state.stagedItems = await mediaAll();
      renderFiles();
    }),
  );

  const dz = $('#dropzone');
  const fi = $('#fileInput');
  fi.addEventListener('change', () => addFiles(fi.files));
  ['dragover', 'dragenter'].forEach((ev) =>
    dz.addEventListener(ev, (e) => {
      e.preventDefault();
      dz.classList.add('drag');
    }),
  );
  ['dragleave', 'drop'].forEach((ev) =>
    dz.addEventListener(ev, (e) => {
      e.preventDefault();
      dz.classList.remove('drag');
    }),
  );
  dz.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));
}

function mediaTile(item) {
  const u = objUrl(item.id);
  const tag = /^video\//.test(item.type)
    ? `<video src="${u}" muted></video>`
    : `<img src="${u}" />`;
  const status = item.publishedUrl
    ? `<div class="st pub">✓ veröffentlicht</div>`
    : `<div class="st local">● nur lokal</div>`;
  return `<div class="media-tile">
    ${tag}
    <div class="nm">${esc(item.name)}</div>
    ${status}
    <button class="danger" data-mediadel="${item.id}" style="margin-top:.35rem;width:100%;padding:.2rem;font-size:.72rem">Entfernen</button>
  </div>`;
}

async function addFiles(fileList) {
  const files = Array.from(fileList || []);
  for (const f of files) {
    const maxBytes = 2048 * 1024 * 1024;
    if (f.size > maxBytes) {
      toast(`${f.name} zu groß`);
      continue;
    }
    const item = {
      id: 'm' + Date.now() + Math.random().toString(36).slice(2, 7),
      name: f.name,
      type: f.type || 'application/octet-stream',
      blob: f,
      createdAt: Date.now(),
      publishedUrl: null,
    };
    await mediaPut(item);
  }
  state.stagedItems = await mediaAll();
  renderFiles();
  if (files.length) toast(`${files.length} Datei(en) im Zwischenspeicher`);
}

function pickFromLibrary(lang, key) {
  const srv = (state.serverFiles[lang] || []).length + (state.serverFiles.shared || []).length;
  if (!state.stagedItems.length && !srv) {
    toast('Keine Medien vorhanden — zuerst eine Datei hinzufügen.');
    return;
  }
  openMediaPicker(lang, key);
}

// Anklickbares Auswahlfenster: zeigt die Server-Dateien DIESER Sprache (+
// gemeinsame) UND den Browser-Zwischenspeicher. Kachel klicken -> zuweisen.
function openMediaPicker(lang, key) {
  document.getElementById('mediaPicker')?.remove();
  const items = state.stagedItems;

  const serverList = [...(state.serverFiles[lang] || []), ...(state.serverFiles.shared || [])];
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
      <h3>Medium auswählen</h3>
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
  overlay.querySelectorAll('[data-pick]').forEach((el) =>
    el.addEventListener('click', () => {
      const item = items.find((x) => x.id === el.dataset.pick);
      if (item) {
        setMediaVal(lang, key, item.publishedUrl || 'staged:' + item.id);
        renderMedia();
      }
      close();
    }),
  );
  overlay.querySelectorAll('[data-picksrv]').forEach((el) =>
    el.addEventListener('click', () => {
      setMediaVal(lang, key, el.dataset.picksrv); // direkt die Server-URL zuweisen
      renderMedia();
      close();
    }),
  );
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
}
