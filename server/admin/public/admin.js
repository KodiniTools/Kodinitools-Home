// KodiniTools Adminbereich — Frontend (Vanilla JS, kein Build-Schritt).
// Kommuniziert mit dem Admin-Backend unter <base>/api/*.

// --- API-Basis relativ zum Auslieferungsort (funktioniert unter /admin/ und lokal /) ---
const apiUrl = (p) => new URL('api' + p, document.baseURI).toString();

async function api(path, { method = 'GET', body, raw, headers = {} } = {}) {
  const opts = {
    method,
    credentials: 'same-origin',
    headers: { 'X-Kodini-Admin': '1', ...headers },
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
async function mediaAll() {
  const db = await openDb();
  return new Promise((res, rej) => {
    const rq = db.transaction('media').objectStore('media').getAll();
    rq.onsuccess = () => res(rq.result || []);
    rq.onerror = () => rej(rq.error);
  });
}
async function mediaGet(id) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const rq = db.transaction('media').objectStore('media').get(id);
    rq.onsuccess = () => res(rq.result || null);
    rq.onerror = () => rej(rq.error);
  });
}
async function mediaPut(item) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction('media', 'readwrite');
    tx.objectStore('media').put(item);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
async function mediaDel(id) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction('media', 'readwrite');
    tx.objectStore('media').delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

// --- App-Zustand ---
const state = {
  overrides: { de: {}, en: {} },
  ticker: { de: emptyTicker(), en: emptyTicker() },
  media: defaultMedia(),
  loadedMedia: defaultMedia(), // Fallback für nicht aufgelöste Staging-Refs beim Speichern
  defaults: { de: {}, en: {} },
  stagedItems: [], // aus IndexedDB
  objectUrls: new Map(), // id -> objectURL (für Vorschau)
};

function emptyTicker() {
  return { enabled: false, speed: 'normal', items: [] };
}
function defaultMedia() {
  return {
    sectionVideos: {
      audio: '/videos/audio-tools.mp4',
      image: '/videos/image-tools.mp4',
      diverse: '/videos/diverse-tools.mp4',
    },
    heroBanner: '',
  };
}

// Alle austauschbaren Medien-Ziele: die drei Sektions-Videos + das Hero-Banner.
// 'heroBanner' liegt auf oberster Ebene, die anderen unter sectionVideos.
const MEDIA_TARGETS = ['audio', 'image', 'diverse', 'heroBanner'];
function getMediaVal(target) {
  return target === 'heroBanner'
    ? state.media.heroBanner || ''
    : state.media.sectionVideos[target] || '';
}
function setMediaVal(target, val) {
  if (target === 'heroBanner') state.media.heroBanner = val;
  else state.media.sectionVideos[target] = val;
}
function defMediaVal(target) {
  return target === 'heroBanner' ? '' : defaultMedia().sectionVideos[target];
}

// --- Pfad-Helfer für verschachtelte Overrides ---
function getPath(obj, path) {
  let cur = obj;
  for (const k of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[k];
  }
  return cur;
}
function setPath(obj, path, value) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (typeof cur[path[i]] !== 'object' || cur[path[i]] == null) cur[path[i]] = {};
    cur = cur[path[i]];
  }
  cur[path[path.length - 1]] = value;
}
function delPath(obj, path) {
  const stack = [obj];
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (cur[path[i]] == null) return;
    cur = cur[path[i]];
    stack.push(cur);
  }
  delete cur[path[path.length - 1]];
  // leere Eltern-Objekte aufräumen
  for (let i = path.length - 2; i >= 0; i--) {
    const parent = stack[i];
    const key = path[i];
    if (parent[key] && typeof parent[key] === 'object' && Object.keys(parent[key]).length === 0)
      delete parent[key];
  }
}

// --- DOM-Helfer ---
const $ = (sel) => document.querySelector(sel);
function esc(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// --- Login ---
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('#loginErr').textContent = '';
  const r = await api('/login', { method: 'POST', body: { password: $('#pw').value } });
  if (r.ok) {
    $('#pw').value = '';
    await boot();
  } else {
    $('#loginErr').textContent = r.data?.error || 'Anmeldung fehlgeschlagen';
  }
});

$('#logoutBtn').addEventListener('click', async () => {
  await api('/logout', { method: 'POST' });
  location.reload();
});

// --- Tabs ---
$('#tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]');
  if (!btn) return;
  document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('active', b === btn));
  const tab = btn.dataset.tab;
  document.querySelectorAll('.tabpane').forEach((p) => p.classList.add('hidden'));
  $('#tab-' + tab).classList.remove('hidden');
  if (tab === 'publish') refreshPublishStatus();
});

// --- Laden & Anzeigen ---
async function boot() {
  const sess = await api('/session');
  if (!sess.data?.authenticated) {
    $('#loginView').classList.remove('hidden');
    $('#appView').classList.add('hidden');
    return;
  }
  const r = await api('/content');
  if (!r.ok) {
    $('#loginView').classList.remove('hidden');
    $('#appView').classList.add('hidden');
    return;
  }
  state.overrides = { de: r.data.overrides?.de || {}, en: r.data.overrides?.en || {} };
  state.ticker = {
    de: normTicker(r.data.ticker?.de),
    en: normTicker(r.data.ticker?.en),
  };
  state.media = r.data.media && r.data.media.sectionVideos ? r.data.media : defaultMedia();
  if (typeof state.media.heroBanner !== 'string') state.media.heroBanner = '';
  state.loadedMedia = JSON.parse(JSON.stringify(state.media));
  state.defaults = { de: r.data.defaults?.de || {}, en: r.data.defaults?.en || {} };
  state.stagedItems = await mediaAll();

  $('#loginView').classList.add('hidden');
  $('#appView').classList.remove('hidden');
  renderTicker();
  renderTexts();
  renderVideos();
  renderAdvanced();
  renderPublish();
}

function normTicker(t) {
  if (!t || typeof t !== 'object') return emptyTicker();
  return {
    enabled: t.enabled === true,
    speed: ['slow', 'normal', 'fast'].includes(t.speed) ? t.speed : 'normal',
    items: Array.isArray(t.items)
      ? t.items.map((i) => ({ id: String(i.id ?? ''), text: i.text || '', link: i.link || '' }))
      : [],
  };
}

// ============ TAB: Laufband ============
function renderTicker() {
  const pane = $('#tab-ticker');
  pane.innerHTML = ['de', 'en'].map(tickerPanel).join('');
  pane.querySelectorAll('[data-tk]').forEach(bindTickerControl);
}

function tickerPanel(lang) {
  const t = state.ticker[lang];
  const items = t.items
    .map(
      (it, i) => `
      <div class="tick-item">
        <div class="idx">${i + 1}</div>
        <div class="grow">
          <input data-tk="text" data-lang="${lang}" data-i="${i}" placeholder="Text" value="${esc(it.text)}" />
          <input data-tk="link" data-lang="${lang}" data-i="${i}" placeholder="Link (optional, z.B. /faq/)" value="${esc(it.link || '')}" style="margin-top:.35rem" />
        </div>
        <div class="btns">
          <button data-tk="up" data-lang="${lang}" data-i="${i}" title="nach oben">▲</button>
          <button data-tk="down" data-lang="${lang}" data-i="${i}" title="nach unten">▼</button>
          <button class="danger" data-tk="del" data-lang="${lang}" data-i="${i}" title="löschen">✕</button>
        </div>
      </div>`,
    )
    .join('');
  return `
    <div class="panel">
      <h2>Laufband <span class="lang-badge">${lang.toUpperCase()}</span></h2>
      <div class="row">
        <div style="flex:0 0 auto">
          <label>Aktiv</label>
          <label style="display:flex;align-items:center;gap:.4rem;color:var(--text)">
            <input type="checkbox" data-tk="enabled" data-lang="${lang}" ${t.enabled ? 'checked' : ''} style="width:auto" /> anzeigen
          </label>
        </div>
        <div style="flex:0 0 auto">
          <label>Tempo</label>
          <select data-tk="speed" data-lang="${lang}" style="width:auto">
            <option value="slow" ${t.speed === 'slow' ? 'selected' : ''}>langsam</option>
            <option value="normal" ${t.speed === 'normal' ? 'selected' : ''}>normal</option>
            <option value="fast" ${t.speed === 'fast' ? 'selected' : ''}>schnell</option>
          </select>
        </div>
      </div>
      <label>Einträge</label>
      ${items || '<p class="hint">Noch keine Einträge.</p>'}
      <button data-tk="add" data-lang="${lang}" style="margin-top:.5rem">+ Eintrag hinzufügen</button>
    </div>`;
}

function bindTickerControl(el) {
  const kind = el.dataset.tk;
  const lang = el.dataset.lang;
  const i = el.dataset.i != null ? parseInt(el.dataset.i, 10) : null;
  const t = state.ticker[lang];
  if (kind === 'enabled') el.addEventListener('change', () => (t.enabled = el.checked));
  else if (kind === 'speed') el.addEventListener('change', () => (t.speed = el.value));
  else if (kind === 'text') el.addEventListener('input', () => (t.items[i].text = el.value));
  else if (kind === 'link') el.addEventListener('input', () => (t.items[i].link = el.value));
  else if (kind === 'add')
    el.addEventListener('click', () => {
      t.items.push({ id: String(Date.now()), text: '', link: '' });
      renderTicker();
    });
  else if (kind === 'del')
    el.addEventListener('click', () => {
      t.items.splice(i, 1);
      renderTicker();
    });
  else if (kind === 'up')
    el.addEventListener('click', () => {
      if (i > 0) {
        [t.items[i - 1], t.items[i]] = [t.items[i], t.items[i - 1]];
        renderTicker();
      }
    });
  else if (kind === 'down')
    el.addEventListener('click', () => {
      if (i < t.items.length - 1) {
        [t.items[i + 1], t.items[i]] = [t.items[i], t.items[i + 1]];
        renderTicker();
      }
    });
}

// ============ TAB: Texte ============
const TEXT_FIELDS = [
  { path: ['hero', 'title'], label: 'Hero – Titel' },
  { path: ['hero', 'subtitle'], label: 'Hero – Untertitel', textarea: true },
  { path: ['hero', 'cta'], label: 'Hero – Button-Text' },
  { path: ['tools', 'sectionTitle'], label: 'Abschnitt – Audio-Tools (Titel)' },
  { path: ['imageTools', 'sectionTitle'], label: 'Abschnitt – Bild-Tools (Titel)' },
  { path: ['diverseTools', 'sectionTitle'], label: 'Abschnitt – Diverse Tools (Titel)' },
];

function renderTexts() {
  const pane = $('#tab-texts');
  pane.innerHTML = ['de', 'en'].map(textPanel).join('');
  pane.querySelectorAll('[data-txt]').forEach((el) => {
    const idx = parseInt(el.dataset.txt, 10);
    const lang = el.dataset.lang;
    const field = TEXT_FIELDS[idx];
    el.addEventListener('input', () => {
      const v = el.value;
      if (v.trim() === '') delPath(state.overrides[lang], field.path);
      else setPath(state.overrides[lang], field.path, v);
    });
  });
}

function textPanel(lang) {
  const fields = TEXT_FIELDS.map((f, idx) => {
    const cur = getPath(state.overrides[lang], f.path);
    const def = getPath(state.defaults[lang], f.path);
    const val = cur != null ? cur : '';
    const ph = def != null ? String(def).replace(/\n/g, ' ') : '';
    const input = f.textarea
      ? `<textarea data-txt="${idx}" data-lang="${lang}" placeholder="${esc(ph)}">${esc(val)}</textarea>`
      : `<input data-txt="${idx}" data-lang="${lang}" placeholder="${esc(ph)}" value="${esc(val)}" />`;
    return `<label>${f.label}</label>${input}<p class="hint">Leer lassen = Standardtext.</p>`;
  }).join('');
  return `<div class="panel"><h2>Texte <span class="lang-badge">${lang.toUpperCase()}</span></h2>${fields}</div>`;
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
  return `${tag}<p class="st pub">● ${esc(val)}</p>`;
}

function renderVideos() {
  const pane = $('#tab-videos');
  const slots = VIDEO_SLOTS.map((s) => {
    const val = state.media.sectionVideos[s.key] || '';
    const def = defaultMedia().sectionVideos[s.key];
    return `
      <div class="panel">
        <h2>Medium: ${s.label}</h2>
        <p class="hint">Video oder Bild – wird je nach Datei automatisch passend angezeigt.</p>
        ${slotPreview(val)}
        <label>Pfad/URL</label>
        <input data-slot="${s.key}" value="${esc(val.startsWith('staged:') ? '' : val)}" placeholder="${esc(def)}" ${val.startsWith('staged:') ? 'disabled' : ''} />
        <div class="row" style="margin-top:.5rem">
          <button data-slotpick="${s.key}" style="flex:0 0 auto">📁 Aus Zwischenspeicher wählen</button>
          <button data-slotreset="${s.key}" style="flex:0 0 auto">↺ Standard</button>
        </div>
      </div>`;
  }).join('');

  // Hero-Banner (oben auf der Seite, ersetzt das frühere Logo).
  const bval = state.media.heroBanner || '';
  const bannerPanel = `
      <div class="panel">
        <h2>Hero-Banner (oben auf der Seite)</h2>
        <p class="hint">Erscheint ganz oben im Hero-Bereich (anstelle des früheren Logos).
          Bild oder Video. Leer lassen = kein Banner.</p>
        ${slotPreview(bval)}
        <label>Pfad/URL</label>
        <input data-slot="heroBanner" value="${esc(bval.startsWith('staged:') ? '' : bval)}" placeholder="/uploads/mein-banner.jpg" ${bval.startsWith('staged:') ? 'disabled' : ''} />
        <div class="row" style="margin-top:.5rem">
          <button data-slotpick="heroBanner" style="flex:0 0 auto">📁 Aus Zwischenspeicher wählen</button>
          <button data-slotreset="heroBanner" style="flex:0 0 auto">↺ Entfernen</button>
        </div>
      </div>`;

  const tiles = state.stagedItems.length
    ? state.stagedItems.map(mediaTile).join('')
    : '<p class="hint">Noch nichts im Zwischenspeicher. Dateien oben hineinziehen oder auswählen.</p>';

  pane.innerHTML = `
    ${bannerPanel}
    ${slots}
    <div class="panel">
      <h2>Medien-Zwischenspeicher (Browser)</h2>
      <p class="hint">Bilder/Videos werden zunächst nur lokal im Browser gespeichert (Vorschau).
        Erst beim <strong>Veröffentlichen</strong> werden sie auf den Server geladen.</p>
      <div class="dropzone" id="dropzone">
        Dateien hierher ziehen oder
        <label style="display:inline;color:var(--accent);cursor:pointer;text-decoration:underline">
          auswählen<input type="file" id="fileInput" accept="image/*,video/*" multiple style="display:none" />
        </label>
      </div>
      <div class="media-grid">${tiles}</div>
    </div>`;

  // Bindings
  pane.querySelectorAll('[data-slot]').forEach((el) =>
    el.addEventListener('input', () => {
      const v = el.value.trim();
      setMediaVal(el.dataset.slot, v || defMediaVal(el.dataset.slot));
    }),
  );
  pane.querySelectorAll('[data-slotreset]').forEach((el) =>
    el.addEventListener('click', () => {
      setMediaVal(el.dataset.slotreset, defMediaVal(el.dataset.slotreset));
      renderVideos();
    }),
  );
  pane
    .querySelectorAll('[data-slotpick]')
    .forEach((el) => el.addEventListener('click', () => pickFromLibrary(el.dataset.slotpick)));
  pane.querySelectorAll('[data-mediadel]').forEach((el) =>
    el.addEventListener('click', async () => {
      await mediaDel(el.dataset.mediadel);
      state.stagedItems = await mediaAll();
      renderVideos();
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
  renderVideos();
  if (files.length) toast(`${files.length} Datei(en) im Zwischenspeicher`);
}

function pickFromLibrary(target) {
  const local = state.stagedItems;
  if (!local.length) {
    toast('Zwischenspeicher ist leer — zuerst Datei hinzufügen.');
    return;
  }
  openMediaPicker(target, local);
}

// Anklickbares Auswahlfenster: Kachel klicken -> Medium diesem Platz zuweisen.
function openMediaPicker(target, items) {
  document.getElementById('mediaPicker')?.remove();

  const tiles = items
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

  const overlay = document.createElement('div');
  overlay.className = 'picker-overlay';
  overlay.id = 'mediaPicker';
  overlay.innerHTML = `
    <div class="picker-modal" role="dialog" aria-modal="true">
      <h3>Medium auswählen</h3>
      <p class="hint" style="margin-bottom:.75rem">Auf eine Datei klicken, um sie diesem Platz zuzuweisen.</p>
      <div class="media-grid">${tiles}</div>
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
        setMediaVal(target, item.publishedUrl || 'staged:' + item.id);
        renderVideos();
      }
      close();
    }),
  );
  document.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
}

// ============ TAB: Erweitert (rohe Overrides) ============
function renderAdvanced() {
  const pane = $('#tab-advanced');
  pane.innerHTML = `
    <div class="panel">
      <h2>Erweitert — Overrides als JSON</h2>
      <p class="hint">Für Felder, die es oben nicht als Formular gibt. Struktur wie in den Locale-Dateien,
        nur die zu ändernden Schlüssel. Ungültiges JSON wird beim Übernehmen abgelehnt.</p>
      ${['de', 'en']
        .map(
          (l) => `
        <label>Overrides <span class="lang-badge">${l.toUpperCase()}</span></label>
        <textarea data-adv="${l}" style="min-height:160px">${esc(JSON.stringify(state.overrides[l], null, 2))}</textarea>
      `,
        )
        .join('')}
      <div class="err" id="advErr"></div>
      <button id="advApply" style="margin-top:.5rem">Übernehmen</button>
    </div>`;
  $('#advApply').addEventListener('click', () => {
    $('#advErr').textContent = '';
    try {
      for (const l of ['de', 'en']) {
        const txt = pane.querySelector(`[data-adv="${l}"]`).value.trim();
        const obj = txt ? JSON.parse(txt) : {};
        if (typeof obj !== 'object' || obj === null || Array.isArray(obj))
          throw new Error(`${l}: kein Objekt`);
        state.overrides[l] = obj;
      }
      renderTexts();
      toast('Overrides übernommen (noch nicht gespeichert)');
    } catch (e) {
      $('#advErr').textContent = 'Fehler: ' + e.message;
    }
  });
}

// ============ TAB: Veröffentlichen ============
function renderPublish() {
  const pane = $('#tab-publish');
  pane.innerHTML = `
    <div class="panel">
      <h2>Veröffentlichen</h2>
      <p class="hint">Speichert die Inhalte, lädt lokale Medien hoch, committet nach <code>main</code>
        und startet den Deploy auf den Server. Dauert typischerweise 1–2 Minuten.</p>
      <label>Notiz (optional)</label>
      <input id="pubMsg" placeholder="z.B. Neue Hero-Texte" />
      <div style="margin-top:.75rem">
        Status: <span class="pill idle" id="pubPill2">bereit</span>
      </div>
      <div class="status" id="pubLog">—</div>
    </div>`;
}

// --- Speichern (Draft) ---
function resolveMediaForSave() {
  // Ersetzt staged:-Referenzen durch bereits veröffentlichte URLs oder
  // (falls noch nicht hochgeladen) durch den zuletzt geladenen/Default-Wert.
  const m = JSON.parse(JSON.stringify(state.media));
  if (typeof m.heroBanner !== 'string') m.heroBanner = '';
  for (const key of ['audio', 'image', 'diverse']) {
    const v = m.sectionVideos[key];
    if (typeof v === 'string' && v.startsWith('staged:')) {
      const id = v.slice(7);
      const item = state.stagedItems.find((x) => x.id === id);
      m.sectionVideos[key] =
        (item && item.publishedUrl) ||
        state.loadedMedia.sectionVideos[key] ||
        defaultMedia().sectionVideos[key];
    }
  }
  if (typeof m.heroBanner === 'string' && m.heroBanner.startsWith('staged:')) {
    const id = m.heroBanner.slice(7);
    const item = state.stagedItems.find((x) => x.id === id);
    m.heroBanner = (item && item.publishedUrl) || state.loadedMedia.heroBanner || '';
  }
  return m;
}

function buildPayload(media) {
  return {
    overrides: state.overrides,
    ticker: {
      de: cleanTicker(state.ticker.de),
      en: cleanTicker(state.ticker.en),
    },
    media: media || resolveMediaForSave(),
  };
}
function cleanTicker(t) {
  return {
    enabled: t.enabled === true,
    speed: t.speed,
    items: t.items
      .filter((i) => i.text && i.text.trim())
      .map((i, idx) => {
        const o = { id: String(i.id || idx + 1), text: i.text.trim() };
        if (i.link && i.link.trim()) o.link = i.link.trim();
        return o;
      }),
  };
}

async function saveDraft() {
  const r = await api('/content', { method: 'PUT', body: buildPayload() });
  if (r.ok) {
    state.loadedMedia = JSON.parse(JSON.stringify(r.data.saved.media));
    return true;
  }
  toast('Speichern fehlgeschlagen: ' + (r.data?.error || r.status));
  return false;
}

$('#saveBtn').addEventListener('click', async () => {
  $('#saveBtn').disabled = true;
  if (await saveDraft()) toast('Als Entwurf gespeichert ✓');
  $('#saveBtn').disabled = false;
});

// --- Veröffentlichen ---
async function uploadStagedReferenced() {
  // Lädt alle staged Medien hoch, die in Slots referenziert werden.
  const referenced = new Set();
  for (const target of MEDIA_TARGETS) {
    const v = getMediaVal(target);
    if (typeof v === 'string' && v.startsWith('staged:')) referenced.add(v.slice(7));
  }
  for (const id of referenced) {
    const item = await mediaGet(id);
    if (!item) continue;
    if (item.publishedUrl) continue; // schon hochgeladen
    const r = await api('/upload', {
      method: 'POST',
      raw: item.blob,
      headers: { 'X-Filename': item.name, 'Content-Type': item.type || 'application/octet-stream' },
    });
    if (!r.ok) throw new Error(`Upload ${item.name}: ${r.data?.error || r.status}`);
    item.publishedUrl = r.data.url;
    await mediaPut(item);
  }
  state.stagedItems = await mediaAll();
  // Slots auf endgültige URLs setzen
  for (const target of MEDIA_TARGETS) {
    const v = getMediaVal(target);
    if (typeof v === 'string' && v.startsWith('staged:')) {
      const item = state.stagedItems.find((x) => x.id === v.slice(7));
      if (item && item.publishedUrl) setMediaVal(target, item.publishedUrl);
    }
  }
}

let pollTimer;
$('#publishBtn').addEventListener('click', async () => {
  $('#publishBtn').disabled = true;
  setPill('running', 'lädt Medien…');
  try {
    await uploadStagedReferenced();
    const media = resolveMediaForSave();
    // Save mit finalen URLs
    const put = await api('/content', { method: 'PUT', body: buildPayload(media) });
    if (!put.ok) throw new Error(put.data?.error || 'Speichern fehlgeschlagen');
    state.loadedMedia = JSON.parse(JSON.stringify(media));
    renderVideos();
    // Publish starten
    const msg = ($('#pubMsg')?.value || '').slice(0, 100);
    const pub = await api('/publish', { method: 'POST', body: { message: msg } });
    if (!pub.ok) throw new Error(pub.data?.error || 'Publish fehlgeschlagen');
    // In den Publish-Tab wechseln und pollen
    document.querySelector('#tabs button[data-tab="publish"]').click();
    startPolling();
  } catch (e) {
    setPill('error', 'Fehler');
    const log = $('#pubLog');
    if (log) log.textContent = String(e.message || e);
    $('#publishBtn').disabled = false;
  }
});

// --- Vorschau (Build ohne Deploy, öffnet die gerenderte Seite in neuem Tab) ---
let previewPollTimer;
$('#previewBtn').addEventListener('click', async () => {
  // Neuen Tab SOFORT (synchron zum Klick) öffnen, sonst blockt der Popup-Blocker
  // das spätere Navigieren nach dem asynchronen Build.
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(
      '<!doctype html><meta charset="utf-8"><title>Vorschau wird erstellt…</title>' +
        '<body style="font-family:system-ui;background:#0f172a;color:#e2e8f0;padding:2rem;line-height:1.6">' +
        '<p>🛠️ <strong>Vorschau wird gebaut …</strong></p>' +
        '<p>Das dauert typischerweise 15–40 Sekunden. Dieses Fenster lädt die ' +
        'Vorschau automatisch, sobald sie fertig ist.</p></body>',
    );
  }
  $('#previewBtn').disabled = true;
  $('#publishBtn').disabled = true;
  setPill('running', 'Vorschau…');
  try {
    await uploadStagedReferenced();
    const media = resolveMediaForSave();
    const put = await api('/content', { method: 'PUT', body: buildPayload(media) });
    if (!put.ok) throw new Error(put.data?.error || 'Speichern fehlgeschlagen');
    state.loadedMedia = JSON.parse(JSON.stringify(media));
    renderVideos();
    const pv = await api('/preview', { method: 'POST' });
    if (!pv.ok) throw new Error(pv.data?.error || 'Vorschau-Build fehlgeschlagen');
    pollPreview(win);
  } catch (e) {
    setPill('error', 'Fehler');
    if (win)
      win.document.body.innerHTML =
        '<p style="font-family:system-ui;color:#fecaca;padding:2rem">Fehler: ' +
        esc(String(e.message || e)) +
        '</p>';
    toast('Vorschau: ' + (e.message || e));
    $('#previewBtn').disabled = false;
    $('#publishBtn').disabled = false;
  }
});

function pollPreview(win) {
  clearInterval(previewPollTimer);
  previewPollTimer = setInterval(async () => {
    const r = await api('/preview/status');
    if (!r.ok) return;
    const s = r.data;
    setPill(s.status, s.status === 'running' ? 'Vorschau… (' + (s.step || '') + ')' : s.status);
    if (s.status !== 'success' && s.status !== 'error') return;
    clearInterval(previewPollTimer);
    $('#previewBtn').disabled = false;
    $('#publishBtn').disabled = false;
    if (s.status === 'success') {
      setPill('idle', 'bereit');
      if (win) win.location.href = '/admin/preview/';
      else window.open('/admin/preview/', '_blank');
      toast('Vorschau bereit ✓');
    } else {
      if (win)
        win.document.body.innerHTML =
          '<pre style="font-family:ui-monospace;color:#fecaca;padding:1rem;white-space:pre-wrap">' +
          esc((s.log || []).join('\n') || s.error || 'Build-Fehler') +
          '</pre>';
      toast('Vorschau fehlgeschlagen');
    }
  }, 2000);
}

function setPill(cls, text) {
  for (const id of ['#pubPill', '#pubPill2']) {
    const el = $(id);
    if (el) {
      el.className = 'pill ' + cls;
      el.textContent = text;
    }
  }
}

function startPolling() {
  clearInterval(pollTimer);
  pollTimer = setInterval(refreshPublishStatus, 1500);
  refreshPublishStatus();
}

async function refreshPublishStatus() {
  const r = await api('/publish/status');
  if (!r.ok) return;
  const s = r.data;
  setPill(s.status, statusLabel(s));
  const log = $('#pubLog');
  if (log) log.textContent = (s.log || []).join('\n') || '—';
  if (s.status === 'success' || s.status === 'error') {
    clearInterval(pollTimer);
    $('#publishBtn').disabled = false;
    if (s.status === 'success') toast('Veröffentlicht ✓');
  }
}
function statusLabel(s) {
  if (s.status === 'running') return 'läuft… (' + (s.step || '') + ')';
  if (s.status === 'success') return 'veröffentlicht';
  if (s.status === 'error') return 'Fehler';
  return 'bereit';
}

// --- Start ---
boot();
