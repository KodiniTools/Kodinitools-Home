// „Icons"-Tab: durchsucht die Font-Awesome-Icons aus dem Serverordner
// /fontawesome/svgs (Solid, Regular, Brands), zeigt sie in einer Vorschau und
// erlaubt, ein Icon zur Seite hinzuzufügen (als Einzel-Banner DE/EN) oder seine
// URL zu kopieren. Die Icon-Liste wird beim ersten Öffnen einmalig geladen.

import { $, api, esc, toast } from './core.js';
import { state, setMediaVal } from './model.js';

const ICON_CATS = ['solid', 'regular', 'brands'];
const CAT_LABEL = { solid: 'Solid', regular: 'Regular', brands: 'Brands' };
const MAX_TILES = 240; // maximale Anzahl gleichzeitig gerenderter Kacheln (Performance)

// Modul-Zustand (bleibt über Tab-Wechsel erhalten).
let ICONS = null; // { solid:[], regular:[], brands:[] } oder null (noch nicht geladen)
let loading = false;
const ui = { q: '', cat: '', sel: null }; // Suche, Kategorie-Filter, gewähltes Icon

const iconUrl = (cat, name) => `/fontawesome/svgs/${cat}/${encodeURIComponent(name)}`;
const iconLabel = (name) => name.replace(/\.svg$/i, '');

// Gefilterte Icons (nach Kategorie + Suche), begrenzt auf MAX_TILES fürs Rendern.
function filtered() {
  if (!ICONS) return { items: [], total: 0 };
  const q = ui.q.trim().toLowerCase();
  const cats = ui.cat ? [ui.cat] : ICON_CATS;
  const items = [];
  let total = 0;
  for (const cat of cats) {
    for (const name of ICONS[cat] || []) {
      if (q && !iconLabel(name).toLowerCase().includes(q)) continue;
      total++;
      if (items.length < MAX_TILES) items.push({ cat, name });
    }
  }
  return { items, total };
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

function detailHtml() {
  const s = ui.sel;
  if (!s)
    return '<p class="hint" style="margin:.2rem 0 0">Kein Icon gewählt — oben ein Icon anklicken.</p>';
  const url = iconUrl(s.cat, s.name);
  return `
    <div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">
      <div style="flex:0 0 auto;width:96px;height:96px;border:1px solid var(--border);border-radius:10px;background:#fff;display:flex;align-items:center;justify-content:center">
        <img src="${url}" alt="${esc(iconLabel(s.name))}" style="width:64px;height:64px;object-fit:contain" />
      </div>
      <div style="flex:1 1 240px;min-width:0">
        <strong style="display:block">${esc(iconLabel(s.name))} <span class="hint" style="font-weight:400">(${CAT_LABEL[s.cat]})</span></strong>
        <input data-iconurl type="text" readonly value="${esc(url)}" style="width:100%;margin-top:.35rem;font-size:.8rem" />
        <div class="row" style="gap:.4rem;margin-top:.5rem">
          <button type="button" data-iconbanner="de" style="flex:0 0 auto">➕ Als Banner (Deutsch)</button>
          <button type="button" data-iconbanner="en" style="flex:0 0 auto">➕ Als Banner (Englisch)</button>
          <button type="button" class="hd-reset" data-iconcopy style="flex:0 0 auto">🔗 URL kopieren</button>
        </div>
        <p class="hint" style="margin:.4rem 0 0">„Als Banner" setzt das Icon als Einzel-Banner der jeweiligen Sprache (Hero-Modus wird auf Banner gestellt). Position/Größe des Banner-Textes bleiben unter <strong>Layout</strong> einstellbar.</p>
      </div>
    </div>`;
}

// Nur das Raster + Anzahl + Detail aktualisieren (ohne das ganze Panel neu zu bauen).
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
  const { items, total: matches } = filtered();
  grid.innerHTML = items.map(tileHtml).join('') || '<p class="hint">Keine Treffer.</p>';
  if (count)
    count.textContent =
      matches > items.length
        ? `${items.length} von ${matches} Treffern (Suche verfeinern für mehr)`
        : `${matches} Treffer`;
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
  // Nur aktualisieren, wenn der Icons-Tab noch offen ist.
  if (pane.querySelector('[data-icongrid]')) updateGrid(pane);
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
        Icon anklicken für die Vorschau, dann als Banner setzen oder die URL kopieren.</p>
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
      <div data-icongrid style="display:grid;grid-template-columns:repeat(auto-fill,minmax(84px,1fr));gap:.5rem;margin-top:.7rem"></div>
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
      updateGrid(pane);
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
  if (detail)
    detail.addEventListener('click', (e) => {
      if (!ui.sel) return;
      const url = iconUrl(ui.sel.cat, ui.sel.name);
      const bannerBtn = e.target.closest('[data-iconbanner]');
      if (bannerBtn) {
        const lang = bannerBtn.dataset.iconbanner === 'en' ? 'en' : 'de';
        setMediaVal(lang, 'heroBanner', url);
        state.media[lang].heroMode = 'banner';
        toast(
          `Icon als Banner (${lang.toUpperCase()}) gesetzt — im Tab „Layout"/„Medien" sichtbar`,
        );
        return;
      }
      if (e.target.closest('[data-iconcopy]')) {
        const inp = detail.querySelector('[data-iconurl]');
        const copy = () => toast('URL kopiert');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(copy, () => {
            if (inp) {
              inp.focus();
              inp.select();
            }
          });
        } else if (inp) {
          inp.focus();
          inp.select();
          try {
            document.execCommand('copy');
            copy();
          } catch {
            /* Auswahl bleibt zum manuellen Kopieren */
          }
        }
      }
    });
}
