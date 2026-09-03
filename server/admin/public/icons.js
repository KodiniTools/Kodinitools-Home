// „Icons"-Tab: durchsucht die Font-Awesome-Icons aus dem Serverordner
// /fontawesome/svgs (Solid, Regular, Brands), zeigt ALLE Treffer in einer
// scrollbaren Bibliothek und erlaubt, ein Icon zur Seite hinzuzufügen –
// als Einzel-Banner, als Raster-Kachel oder als Tool-Karten-Icon (je Sprache)
// oder seine URL zu kopieren. Die Icon-Liste wird beim ersten Öffnen geladen.

import { $, api, esc, toast } from './core.js';
import { state, setMediaVal, setPath } from './model.js';

const ICON_CATS = ['solid', 'regular', 'brands'];
const CAT_LABEL = { solid: 'Solid', regular: 'Regular', brands: 'Brands' };
const SECTION_LABEL = {
  tools: 'Audio-Tools',
  imageTools: 'Bild-Tools',
  diverseTools: 'Diverse Tools',
};
const HERO_CELLS = 6; // Kachel 1..6 (größtmögliche Kachelzahl über alle Layouts)

// Modul-Zustand (bleibt über Tab-Wechsel erhalten).
let ICONS = null; // { solid:[], regular:[], brands:[] } oder null (noch nicht geladen)
let loading = false;
const ui = { q: '', cat: '', sel: null, link: '', target: 'banner' }; // Suche, Filter, Icon, Link, Ziel
let searchTimer = null;

const iconUrl = (cat, name) => `/fontawesome/svgs/${cat}/${encodeURIComponent(name)}`;
const iconLabel = (name) => name.replace(/\.svg$/i, '');

// Alle Tools (section+key+Titel) aus den Standard-Locales – für das Ziel-Dropdown.
function toolList() {
  const out = [];
  const defs = (state.defaults && state.defaults.de) || {};
  for (const section of ['tools', 'imageTools', 'diverseTools']) {
    const sec = defs[section];
    if (!sec || typeof sec !== 'object') continue;
    for (const [key, entry] of Object.entries(sec)) {
      if (entry && typeof entry === 'object' && (entry.link || entry.svg)) {
        out.push({ section, key, title: entry.title || key });
      }
    }
  }
  return out;
}

// Gefilterte Icons (nach Kategorie + Suche) – ALLE Treffer (scrollbare Bibliothek).
function filtered() {
  if (!ICONS) return [];
  const q = ui.q.trim().toLowerCase();
  const cats = ui.cat ? [ui.cat] : ICON_CATS;
  const items = [];
  for (const cat of cats) {
    for (const name of ICONS[cat] || []) {
      if (q && !iconLabel(name).toLowerCase().includes(q)) continue;
      items.push({ cat, name });
    }
  }
  return items;
}

function tileHtml({ cat, name }) {
  const sel = ui.sel && ui.sel.cat === cat && ui.sel.name === name;
  return `<button type="button" class="icon-tile" data-icon="${esc(cat + '/' + name)}"
      title="${esc(iconLabel(name))} (${CAT_LABEL[cat]})"
      style="display:flex;flex-direction:column;align-items:center;gap:.25rem;padding:.45rem .3rem;border:1px solid ${sel ? 'var(--accent)' : 'var(--border)'};border-radius:8px;background:#fff;cursor:pointer;${sel ? 'outline:2px solid var(--accent);outline-offset:-1px' : ''}">
      <img src="${iconUrl(cat, name)}" alt="" loading="lazy" width="26" height="26" style="width:26px;height:26px;object-fit:contain" />
      <span style="font-size:.62rem;color:#333;max-width:76px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(iconLabel(name))}</span>
    </button>`;
}

// Ziel-Auswahl (Banner / Kacheln / Tool-Icons) als <optgroup>-Struktur.
function targetOptions() {
  const sel = (v) => (ui.target === v ? 'selected' : '');
  const cells = Array.from(
    { length: HERO_CELLS },
    (_, i) => `<option value="grid${i}" ${sel('grid' + i)}>Kachel ${i + 1}</option>`,
  ).join('');
  const tools = toolList()
    .map((t) => {
      const v = `tool:${t.section}:${t.key}`;
      return `<option value="${esc(v)}" ${sel(v)}>${esc(SECTION_LABEL[t.section] || t.section)} – ${esc(t.title)}</option>`;
    })
    .join('');
  return `
    <optgroup label="Banner"><option value="banner" ${sel('banner')}>Einzel-Banner</option></optgroup>
    <optgroup label="Raster-Kacheln">${cells}</optgroup>
    ${tools ? `<optgroup label="Tool-Karten-Icon">${tools}</optgroup>` : ''}`;
}

// Mini-Vorschau der Tool-Karte (nur wenn Ziel ein Tool ist) – zeigt das Icon so,
// wie es auf der Karte erscheint, schon vor dem Veröffentlichen.
function toolPrevHtml() {
  if (!ui.sel || !(ui.target || '').startsWith('tool:')) return '';
  const parts = ui.target.split(':');
  const key = parts.slice(2).join(':');
  const t = toolList().find((x) => x.section === parts[1] && x.key === key);
  const url = iconUrl(ui.sel.cat, ui.sel.name);
  return `
    <span class="hint" style="margin:.1rem 0 .3rem;display:block">Vorschau Tool-Karte (vor dem Veröffentlichen):</span>
    <div style="display:inline-flex;align-items:center;gap:.6rem;background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:.7rem .9rem;max-width:340px">
      <span style="width:44px;height:44px;border-radius:.6rem;background:#fff;box-sizing:border-box;padding:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0"><img src="${url}" alt="" style="width:100%;height:100%;object-fit:contain" /></span>
      <strong style="font-size:.9rem">${esc(t ? t.title : key)}</strong>
    </div>`;
}

function detailHtml() {
  const s = ui.sel;
  if (!s)
    return '<p class="hint" style="margin:.2rem 0 0">Kein Icon gewählt — oben in der Bibliothek ein Icon anklicken.</p>';
  const url = iconUrl(s.cat, s.name);
  return `
    <div style="display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap">
      <div style="flex:0 0 auto;width:96px;height:96px;border:1px solid var(--border);border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center">
        <img src="${url}" alt="${esc(iconLabel(s.name))}" style="width:64px;height:64px;object-fit:contain" />
      </div>
      <div style="flex:1 1 260px;min-width:0">
        <strong style="display:block">${esc(iconLabel(s.name))} <span class="hint" style="font-weight:400">(${CAT_LABEL[s.cat]})</span></strong>
        <input data-iconurl type="text" readonly value="${esc(url)}" style="width:100%;margin-top:.35rem;font-size:.8rem" />
        <div style="margin-top:.4rem">
          <label style="margin-top:0">Link (optional) — für Banner/Kachel</label>
          <input data-iconlink type="text" placeholder="/pfad oder https://… (leer = kein Link)" value="${esc(ui.link || '')}" style="width:100%" />
        </div>
        <div class="row" style="align-items:flex-end;gap:.4rem;margin-top:.5rem">
          <div style="flex:0 0 auto">
            <label style="margin-top:0">Sprache</label>
            <select data-iconlang style="width:auto;height:38px">
              <option value="de" ${state.nav.section === 'en' ? '' : 'selected'}>Deutsch</option>
              <option value="en" ${state.nav.section === 'en' ? 'selected' : ''}>Englisch</option>
            </select>
          </div>
          <div style="flex:1 1 220px">
            <label style="margin-top:0">Ziel</label>
            <select data-icontarget style="width:100%;height:38px">${targetOptions()}</select>
          </div>
          <div style="flex:0 0 auto">
            <button type="button" data-iconadd style="flex:0 0 auto">➕ Hinzufügen</button>
          </div>
          <div style="flex:0 0 auto">
            <button type="button" class="hd-reset" data-iconcopy style="flex:0 0 auto">🔗 URL kopieren</button>
          </div>
        </div>
        <p class="hint" style="margin:.4rem 0 0">Banner/Kachel stellen den Hero-Modus passend um und weisen das Icon als Bild zu.
          „Tool-Karten-Icon" ersetzt das Icon der gewählten Tool-Karte. Wirkt nach dem Speichern/Veröffentlichen.</p>
        <div data-icontoolprev style="margin-top:.5rem">${toolPrevHtml()}</div>
      </div>
    </div>`;
}

// Nur Bibliothek + Anzahl + Detail aktualisieren (ohne das ganze Panel neu zu bauen).
function updateGrid(pane) {
  const grid = pane.querySelector('[data-icongrid]');
  const count = pane.querySelector('[data-iconcount]');
  const detail = pane.querySelector('[data-icondetail]');
  if (!grid) return;
  if (loading) {
    grid.innerHTML = '<p class="hint">Icons werden geladen …</p>';
    if (count) count.textContent = '';
    return;
  }
  const total = ICONS ? ICON_CATS.reduce((n, c) => n + (ICONS[c] || []).length, 0) : 0;
  if (!total) {
    grid.innerHTML =
      '<p class="hint">Keine Icons gefunden. Erwartet werden SVG-Dateien im Serverordner <code>/fontawesome/svgs/{solid,regular,brands}</code>.</p>';
    if (count) count.textContent = '';
    if (detail) detail.innerHTML = detailHtml();
    return;
  }
  const items = filtered();
  grid.innerHTML = items.map(tileHtml).join('') || '<p class="hint">Keine Treffer.</p>';
  if (count) count.textContent = `${items.length} Treffer`;
  if (detail) detail.innerHTML = detailHtml();
}

async function ensureLoaded(pane) {
  if (ICONS || loading) return;
  loading = true;
  updateGrid(pane);
  const r = await api('/fontawesome');
  const data = r.ok && r.data && r.data.icons ? r.data.icons : {};
  ICONS = {
    solid: Array.isArray(data.solid) ? data.solid : [],
    regular: Array.isArray(data.regular) ? data.regular : [],
    brands: Array.isArray(data.brands) ? data.brands : [],
  };
  loading = false;
  if (pane.querySelector('[data-icongrid]')) updateGrid(pane);
}

// Nur '' oder ein interner Pfad (/…) bzw. eine http(s)-URL sind gültige Links
// (entspricht der Server-Validierung isValidMediaUrl -> vermeidet Fehler beim
// Veröffentlichen).
function validLink(v) {
  return v === '' || /^(\/|https?:\/\/)/.test(v);
}

// Gewähltes Icon dem gewählten Ziel zuweisen (optional mit Link für Banner/Kachel).
function addIcon(pane) {
  if (!ui.sel) return;
  const url = iconUrl(ui.sel.cat, ui.sel.name);
  const langSel = pane.querySelector('[data-iconlang]');
  const tgtSel = pane.querySelector('[data-icontarget]');
  const linkInp = pane.querySelector('[data-iconlink]');
  const lang = langSel && langSel.value === 'en' ? 'en' : 'de';
  const target = tgtSel ? tgtSel.value : 'banner';
  const link = (linkInp ? linkInp.value : ui.link || '').trim();
  const langUp = lang.toUpperCase();
  if (!validLink(link)) {
    toast('Ungültiger Link: bitte / (interner Pfad) oder https://… verwenden');
    return;
  }
  if (target === 'banner') {
    setMediaVal(lang, 'heroBanner', url);
    state.media[lang].heroBannerLink = link;
    state.media[lang].heroMode = 'banner';
    toast(`Icon als Einzel-Banner (${langUp}) gesetzt${link ? ' + Link' : ''}`);
  } else if (/^grid[0-5]$/.test(target)) {
    const i = Number(target.slice(4));
    setMediaVal(lang, target, url);
    if (!Array.isArray(state.media[lang].heroGridLinks))
      state.media[lang].heroGridLinks = ['', '', '', '', '', ''];
    state.media[lang].heroGridLinks[i] = link;
    state.media[lang].heroMode = 'grid';
    toast(`Icon in Kachel ${i + 1} (${langUp}) gesetzt${link ? ' + Link' : ''}`);
  } else if (target.startsWith('tool:')) {
    const parts = target.split(':');
    const section = parts[1];
    const key = parts.slice(2).join(':');
    setPath(state.overrides[lang], [section, key, 'svg'], url);
    toast(`Tool-Icon „${key}" (${langUp}) gesetzt`);
  }
}

function copyUrl(pane) {
  if (!ui.sel) return;
  const url = iconUrl(ui.sel.cat, ui.sel.name);
  const inp = pane.querySelector('[data-iconurl]');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(
      () => toast('URL kopiert'),
      () => {
        if (inp) {
          inp.focus();
          inp.select();
        }
      },
    );
  } else if (inp) {
    inp.focus();
    inp.select();
    try {
      document.execCommand('copy');
      toast('URL kopiert');
    } catch {
      /* Auswahl bleibt zum manuellen Kopieren */
    }
  }
}

export function renderIcons() {
  const pane = $('#content');
  const catOpts = ['<option value="">Alle Sets</option>']
    .concat(
      ICON_CATS.map(
        (c) => `<option value="${c}" ${ui.cat === c ? 'selected' : ''}>${CAT_LABEL[c]}</option>`,
      ),
    )
    .join('');
  pane.innerHTML = `
    <div class="panel">
      <h2>Icons <span class="lang-badge">Font Awesome</span></h2>
      <p class="hint">Icons aus dem Serverordner <code>/fontawesome/svgs</code> (Solid, Regular, Brands).
        Icon anklicken für die Vorschau, dann als Banner, Raster-Kachel oder Tool-Icon setzen bzw. die URL kopieren.</p>
      <div class="row" style="align-items:flex-end;gap:.5rem">
        <div style="flex:2 1 240px">
          <label style="margin-top:0">Suche</label>
          <input data-iconsearch type="search" placeholder="z. B. star, arrow, github" value="${esc(ui.q)}" />
        </div>
        <div style="flex:0 0 auto">
          <label style="margin-top:0">Set</label>
          <select data-iconcat style="width:auto;height:38px">${catOpts}</select>
        </div>
        <div style="flex:1 1 auto">
          <span class="hint" data-iconcount style="margin:0"></span>
        </div>
      </div>
      <div data-icongrid style="display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:.5rem;margin-top:.7rem;max-height:52vh;overflow-y:auto;padding:.15rem;border:1px solid var(--border);border-radius:8px"></div>
      <div style="border-top:1px solid var(--border);margin-top:.9rem;padding-top:.7rem">
        <label style="margin-top:0">Vorschau &amp; Hinzufügen</label>
        <div data-icondetail></div>
      </div>
    </div>`;

  updateGrid(pane);
  ensureLoaded(pane);

  const search = pane.querySelector('[data-iconsearch]');
  if (search)
    search.addEventListener('input', () => {
      ui.q = search.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => updateGrid(pane), 120); // entlastet das Tippen bei vielen Icons
    });
  const cat = pane.querySelector('[data-iconcat]');
  if (cat)
    cat.addEventListener('change', () => {
      ui.cat = cat.value;
      updateGrid(pane);
    });
  const grid = pane.querySelector('[data-icongrid]');
  if (grid)
    grid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-icon]');
      if (!btn) return;
      const [c, ...rest] = btn.dataset.icon.split('/');
      ui.sel = { cat: c, name: rest.join('/') };
      updateGrid(pane);
      const detail = pane.querySelector('[data-icondetail]');
      if (detail) detail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });

  // Aktionen im Detailbereich (delegiert, da der Inhalt neu gerendert wird).
  const detail = pane.querySelector('[data-icondetail]');
  if (detail) {
    detail.addEventListener('click', (e) => {
      if (e.target.closest('[data-iconadd]')) addIcon(pane);
      else if (e.target.closest('[data-iconcopy]')) copyUrl(pane);
    });
    // Getippten Link merken, damit er ein Neu-Rendern des Detailbereichs übersteht.
    detail.addEventListener('input', (e) => {
      const el = e.target.closest('[data-iconlink]');
      if (el) ui.link = el.value;
    });
    // Ziel merken + Tool-Karten-Vorschau live aktualisieren.
    detail.addEventListener('change', (e) => {
      const el = e.target.closest('[data-icontarget]');
      if (!el) return;
      ui.target = el.value;
      const tp = pane.querySelector('[data-icontoolprev]');
      if (tp) tp.innerHTML = toolPrevHtml();
    });
  }
}
