// Medien: der „Medien"-Tab (Hero-Bereich + Sektions-Slots), der „Dateien"-Tab
// (Server-Dateien + Browser-Zwischenspeicher), das Auswahl-Popup sowie das Laden
// der Server-Dateiliste.

import { $, esc, api, toast, fmtBytes, mediaAll, mediaPut, mediaDel } from './core.js';
import { bindSliders } from './slider.js';
import { bindColorPickers } from './color.js';
import { captureView, restoreView } from './viewstate.js';
import { centerHtml, leftHtml, rightHtml, bindSectionMedia, fullPageHtml } from './sectionmedia.js';
import {
  state,
  getMediaVal,
  setMediaVal,
  defMediaVal,
  MEDIA_LANGS,
  MEDIA_KEYS,
  allImageSlots,
  HERO_LAYOUTS,
  heroLayoutCells,
  updateMediaUrlEverywhere,
} from './model.js';

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
// Nur die Beschriftungen (für Rückfragen beim Löschen).
function usageOf(...refs) {
  return usageDetailed(...refs).map((u) => u.label);
}
// Datei-Endung als Format-Badge (z.B. „WEBP").
function fileExt(name) {
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toUpperCase() : '';
}
// Im Tab „Dateien" gewählter Modus (Hell/Dunkel): die Übersicht „Eingesetzte
// Dateien" zeigt nur diesen Modus, der andere ist zu einer klickbaren Leiste
// zugeklappt; Kacheln, die in diesem Modus eingesetzt sind, werden markiert.
let filesPrevMode = 'light';
const FILE_MODE_LABEL = { light: '☀️ Hell', dark: '🌙 Dunkel' };
const FILE_MODE_ICON = { light: '☀️', dark: '🌙', both: '' };
// Gilt der Platz im Modus? ('both' = immer)
const inMode = (u, mode) => u.mode === 'both' || u.mode === mode;
// „wird verwendet in"-Zeile für eine Medien-Kachel: Plätze nur eines Modus tragen
// ☀️/🌙; Plätze des gewählten Modus sind hervorgehoben.
function usageHtml(list) {
  if (!list.length) return '<div class="st" style="color:var(--muted)">↪ nicht zugewiesen</div>';
  const parts = list.map((u) => {
    const on = inMode(u, filesPrevMode);
    const icon = FILE_MODE_ICON[u.mode] ? FILE_MODE_ICON[u.mode] + ' ' : '';
    return `<span style="${on ? '' : 'opacity:.55'}">${icon}${esc(u.label)}</span>`;
  });
  return `<div class="st" style="color:var(--accent)" title="Zugewiesene Plätze (☀️ nur Hell, 🌙 nur Dunkel, ohne Symbol: beide Modi)">↪ ${parts.join(', ')}</div>`;
}
// Kachel-Markierung, wenn die Datei im gewählten Modus eingesetzt ist.
function modeMarkHtml(list) {
  const used = list.filter((u) => inMode(u, filesPrevMode));
  if (!used.length) return '';
  const only = used.every((u) => u.mode === filesPrevMode);
  return `<div class="st" data-filemodemark style="font-weight:600;color:var(--text)">${FILE_MODE_LABEL[filesPrevMode]}${only ? ' (nur dieser Modus)' : ''} ✓</div>`;
}
// Alle Dateien dieses Tabs (Sprach-Ordner, gemeinsame, Zwischenspeicher) mit
// ihren Referenzen – Grundlage der Modus-Übersicht.
function allFileEntries(lang) {
  const out = [];
  const add = (files, where) =>
    (files || []).forEach((f) =>
      out.push({
        name: f.name,
        src: f.url,
        isVid: /\.(mp4|webm|mov|ogg)$/i.test(f.name),
        where,
        usage: usageDetailed(f.url, '/uploads/' + f.path),
      }),
    );
  add(state.serverFiles[lang], LOC_LABEL[lang]);
  add(state.serverFiles.shared, LOC_LABEL['']);
  for (const item of state.stagedItems)
    out.push({
      name: item.name,
      src: objUrl(item.id),
      isVid: /^video\//.test(item.type),
      where: 'Zwischenspeicher',
      usage: usageDetailed('staged:' + item.id, item.publishedUrl),
    });
  return out;
}
// Übersicht „Eingesetzte Dateien" eines Modus: offen für den gewählten Modus
// (Liste der Dateien, die dort auf der Seite erscheinen, mit ihren Plätzen),
// sonst zugeklappt als klickbare Leiste (Klick/Enter/Leertaste).
function modeFilesPanel(lang, mode) {
  if (mode !== filesPrevMode)
    return `
    <div class="panel tc-mode-collapsed" data-filemodepanel="${mode}" data-fileshowmode="${mode}" role="button" tabindex="0" title="Eingesetzte Dateien im ${FILE_MODE_LABEL[mode]}-Modus anzeigen">
      <span style="font-size:1.2rem">${mode === 'dark' ? '🌙' : '☀️'}</span>
      <span>${mode === 'dark' ? 'Dunkelmodus' : 'Hellmodus'} – anklicken: welche Dateien sind dort eingesetzt?</span>
    </div>`;
  const entries = allFileEntries(lang)
    .map((e) => ({ ...e, used: e.usage.filter((u) => inMode(u, mode)) }))
    .filter((e) => e.used.length);
  const onlyHere = entries.filter((e) => e.used.every((u) => u.mode === mode)).length;
  const rows = entries
    .map((e) => {
      const thumb = e.isVid
        ? `<video src="${esc(e.src)}" muted style="width:44px;height:32px;object-fit:cover;border-radius:5px;flex-shrink:0"></video>`
        : `<img src="${esc(e.src)}" alt="" loading="lazy" style="width:44px;height:32px;object-fit:cover;border-radius:5px;flex-shrink:0" />`;
      const places = e.used
        .map((u) => `${FILE_MODE_ICON[u.mode] ? FILE_MODE_ICON[u.mode] + ' ' : ''}${esc(u.label)}`)
        .join(', ');
      return `
        <div data-filemoderow style="display:flex;align-items:center;gap:.6rem;padding:.35rem 0;border-top:1px solid var(--border)">
          ${thumb}
          <span style="flex:1 1 auto;min-width:0">
            <strong style="font-weight:600">${esc(e.name)}</strong> <span class="hint" style="margin:0 0 0 .3rem">${esc(e.where)}</span>
            <div class="st" style="color:var(--accent)">↪ ${places}</div>
          </span>
        </div>`;
    })
    .join('');
  return `
    <div class="panel" data-filemodepanel="${mode}">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;flex-wrap:wrap">
        <strong style="padding:.1rem .4rem;border-radius:6px;outline:2px solid var(--accent)">${FILE_MODE_LABEL[mode]} – eingesetzte Dateien <span class="hint" style="margin:0;font-weight:400">👁</span></strong>
        <span class="hint" data-filemodecount style="margin:0">${entries.length} Datei(en) erscheinen im ${mode === 'dark' ? 'Dunkel' : 'Hell'}modus${onlyHere ? `, davon ${onlyHere} nur dort` : ''}</span>
      </div>
      <p class="hint" style="margin:.3rem 0 .2rem">Dateien dieser Sprache, gemeinsame Dateien und Zwischenspeicher, die auf der Seite im ${FILE_MODE_LABEL[mode]}-Modus zu sehen sind. ☀️/🌙 = Platz gilt nur in diesem Modus (Seiten-Hintergrund, Sektions-Hintergründe, Tool-Karten-Bilder); ohne Symbol = in beiden Modi (Hero, Sektions-Medien, Diashows).</p>
      ${rows || '<p class="hint" style="margin:.4rem 0 0">Keine Datei ist in diesem Modus eingesetzt.</p>'}
    </div>`;
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

// Verlinkung eines Hero-Mediums (Banner oder Rasterbild) lesen/schreiben.
function heroLinkVal(lang, key) {
  if (key === 'heroBanner') return state.media[lang].heroBannerLink || '';
  const g = /^grid([0-2])$/.exec(key);
  if (g) return (state.media[lang].heroGridLinks || [])[+g[1]] || '';
  return '';
}
function setHeroLink(lang, key, val) {
  if (key === 'heroBanner') {
    state.media[lang].heroBannerLink = val;
    return;
  }
  const g = /^grid([0-2])$/.exec(key);
  if (g) {
    if (!Array.isArray(state.media[lang].heroGridLinks))
      state.media[lang].heroGridLinks = ['', '', ''];
    state.media[lang].heroGridLinks[+g[1]] = val;
  }
}

// Ein einzelner Medien-Slot (Sprache + Schlüssel). data-Attribute kodieren
// "lang:key", damit die Bindings wissen, welche Sprache/welcher Slot gemeint ist.
// withLink=true blendet ein optionales Verlinkungsfeld ein (nur Banner/Raster).
function mediaSlotPanel(lang, key, { title, hint, placeholder, resetLabel, withLink }) {
  const val = getMediaVal(lang, key);
  const staged = val.startsWith('staged:');
  const id = `${lang}:${key}`;
  const linkField = withLink
    ? `
        <label style="margin-top:.6rem">🔗 Verlinkung (optional) — öffnet beim Klick auf das Medium</label>
        <input data-slotlink="${id}" value="${esc(heroLinkVal(lang, key))}" placeholder="https://… oder /faq/" />
        <p class="hint">Leer = nicht klickbar. Externe Links (http/https) öffnen in neuem Tab; interne Pfade (z.B. <code>/faq/</code>) im selben Tab.</p>`
    : '';
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
        ${linkField}
      </div>`;
}

// Hero-Bereich einer Sprache: die Medien-Slots passend zum im Layout-Tab
// gewählten Modus/Layout. Anordnung, Form und Kachel-Design liegen im Layout-Tab.
function heroPanel(lang) {
  const mode = state.media[lang].heroMode === 'grid' ? 'grid' : 'banner';
  const info = `
      <div class="panel">
        <h2>Hero-Bereich (oben auf der Seite)</h2>
        <p class="hint">Anordnung, Form &amp; Kachel-Design stellst du im Tab <strong>Layout</strong> ein.
          ${mode === 'grid' ? 'Hier (oder im Layout-Tab je Kachel) weist du den Plätzen die Bilder/Videos zu.' : 'Das Banner samt Verlinkung und Design bearbeitest du im Tab <strong>Layout</strong>.'}</p>
      </div>`;
  if (mode === 'grid') {
    const layout = Object.prototype.hasOwnProperty.call(HERO_LAYOUTS, state.media[lang].heroLayout)
      ? state.media[lang].heroLayout
      : 'grid3';
    const cellsN = heroLayoutCells(layout);
    const isMosaic = layout === 'mosaic';
    const cells = Array.from({ length: cellsN }, (_, i) =>
      mediaSlotPanel(lang, 'grid' + i, {
        title: isMosaic && i === 0 ? 'Große Kachel (links)' : `Kachel ${i + 1}`,
        hint: 'Wird im Raster oben angezeigt. Leer = Feld bleibt frei.',
        placeholder: '/uploads/bild.jpg',
        resetLabel: '↺ Entfernen',
        withLink: true,
      }),
    ).join('');
    return info + cells;
  }
  // Banner-Modus: Bild/Video, Verlinkung und Design des Banners liegen komplett im
  // Layout-Tab (Mitte: „Banner (Bild oder Video)", Seitenleisten: Design/Text).
  const val = getMediaVal(lang, 'heroBanner');
  return (
    info +
    `
      <div class="panel">
        <h2>Banner (ein Bild oder Video)</h2>
        <p class="hint">Das Banner-Bild/-Video, seine Verlinkung und das Banner-Design (Rahmen, Schatten, Deckkraft,
          Verdunkelung – Hell/Dunkel) bearbeitest du jetzt gesammelt im Tab <strong>Layout</strong>.</p>
        ${val ? slotPreview(val) : '<p class="hint" style="margin:.2rem 0">Aktuell kein Banner gewählt.</p>'}
        <div class="row" style="margin-top:.5rem">
          <button type="button" data-gotolayout style="flex:0 0 auto">➡️ Zum Tab „Layout"</button>
        </div>
      </div>`
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
  // Dreispaltig: links Design/Diashow der gewählten Sektion, Mitte Sektionswahl +
  // Sticky-Vorschau + Medium-Slot + Hero-Bereich, rechts Text-Overlay.
  return `<div class="tc-layout">${leftHtml(lang)}<div class="tc-main">${header}${centerHtml(lang)}${fullPageHtml(lang)}${heroPanel(lang)}</div>${rightHtml(lang)}</div>`;
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
      const ext = fileExt(f.name);
      const usage = usageDetailed(f.url, '/uploads/' + f.path);
      const inCur = usage.some((u) => inMode(u, filesPrevMode));
      return `<div class="media-tile" ${inCur ? 'data-inmode="1" style="outline:2px solid var(--accent);outline-offset:-1px"' : ''}>
        ${media}
        <div class="nm">${esc(f.name)}</div>
        <div class="st pub">✓ Server${ext ? ' · ' + ext : ''} · ${fmtBytes(f.bytes)}</div>
        ${modeMarkHtml(usage)}
        ${usageHtml(usage)}
        <div class="row" style="gap:.25rem;margin-top:.35rem">${moveBtns}</div>
        <button class="danger" data-srvdel="${esc(f.path)}" data-srvurl="${esc(f.url)}" style="margin-top:.25rem;width:100%;padding:.2rem;font-size:.72rem">Löschen</button>
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
  const view = captureView(pane);
  pane.innerHTML = renderLangMedia(lang);
  // Anordnung/Form (heromode/herolayout/gridratio/gridfit) liegen jetzt im Layout-Tab.
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
  pane.querySelectorAll('[data-gotolayout]').forEach((el) =>
    el.addEventListener('click', () => {
      document.querySelector('#subnav button[data-sub="layout"]')?.click();
    }),
  );
  pane.querySelectorAll('[data-slotlink]').forEach((el) =>
    el.addEventListener('input', () => {
      const [l, key] = el.dataset.slotlink.split(':');
      setHeroLink(l, key, el.value.trim());
    }),
  );

  bindSectionMedia(pane, lang, renderMedia);
  bindSliders(pane);
  bindColorPickers(pane);
  verifyPublishedSlots(pane);
  restoreView(pane, view);
}

// Bereich „Dateien" EINER Sprache: Server-Dateien + Browser-Zwischenspeicher.
export function renderFiles() {
  const lang = state.nav.section;
  const langLabel = lang === 'de' ? 'Deutsch' : 'English';
  const pane = $('#content');
  const view = captureView(pane); // Scroll über das Neu-Rendern (z. B. Modus-Wechsel) erhalten
  const tiles = state.stagedItems.length
    ? state.stagedItems.map(mediaTile).join('')
    : '<p class="hint">Noch nichts im Zwischenspeicher. Dateien unten hineinziehen oder auswählen.</p>';

  pane.innerHTML = `
    <div class="tc-sticky" style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-top:0">
      <span class="hint" style="margin:0">👁 Eingesetzte Dateien im Modus:</span>
      <span class="mode-switch" title="Zeigen, welche Dateien im Hell- oder Dunkelmodus auf der Seite erscheinen">
        ${['light', 'dark'].map((md) => `<button type="button" class="hd-reset${md === filesPrevMode ? ' active' : ''}" data-fileprevmode="${md}" aria-pressed="${md === filesPrevMode}">${FILE_MODE_LABEL[md]}</button>`).join('')}
      </span>
      <span class="hint" style="margin:0">– der andere Modus ist zugeklappt; markierte Kacheln unten sind in diesem Modus eingesetzt.</span>
    </div>
    ${modeFilesPanel(lang, 'light')}${modeFilesPanel(lang, 'dark')}
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

  // Hell/Dunkel: Übersicht und Markierungen für den gewählten Modus neu rendern.
  const showMode = (mode) => {
    const next = mode === 'dark' ? 'dark' : 'light';
    if (next === filesPrevMode) return;
    filesPrevMode = next;
    renderFiles();
  };
  pane
    .querySelectorAll('[data-fileprevmode]')
    .forEach((b) => b.addEventListener('click', () => showMode(b.dataset.fileprevmode)));
  pane.querySelectorAll('[data-fileshowmode]').forEach((el) => {
    el.addEventListener('click', () => showMode(el.dataset.fileshowmode));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        showMode(el.dataset.fileshowmode);
      }
    });
  });
  pane.querySelectorAll('[data-srvdel]').forEach((el) =>
    el.addEventListener('click', async () => {
      const path = el.dataset.srvdel;
      const used = usageOf(el.dataset.srvurl, '/uploads/' + path);
      const msg = used.length
        ? `⚠ Diese Datei wird noch verwendet in:\n• ${used.join('\n• ')}\n\n` +
          `Trotzdem löschen? Die betroffenen Plätze zeigen dann kein Medium mehr.`
        : `Datei „${path}" vom Server löschen?`;
      if (!confirm(msg)) return;
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
      if (
        parseInt(el.dataset.used, 10) > 0 &&
        !confirm(
          '⚠ Dieses Medium ist einem Platz zugewiesen. Wirklich aus dem Zwischenspeicher ' +
            'entfernen? Der zugewiesene Platz verliert dann sein Medium.',
        )
      )
        return;
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
  restoreView(pane, view);
}

function mediaTile(item) {
  const u = objUrl(item.id);
  const tag = /^video\//.test(item.type)
    ? `<video src="${u}" muted></video>`
    : `<img src="${u}" />`;
  const status = item.publishedUrl
    ? `<div class="st pub">✓ veröffentlicht</div>`
    : `<div class="st local">● nur lokal</div>`;
  const ext = fileExt(item.name);
  const size = item.blob ? fmtBytes(item.blob.size) : '';
  const meta = [ext, size].filter(Boolean).join(' · ');
  const usage = usageDetailed('staged:' + item.id, item.publishedUrl);
  const inCur = usage.some((u) => inMode(u, filesPrevMode));
  return `<div class="media-tile" ${inCur ? 'data-inmode="1" style="outline:2px solid var(--accent);outline-offset:-1px"' : ''}>
    ${tag}
    <div class="nm">${esc(item.name)}</div>
    ${meta ? `<div class="st" style="color:var(--muted)">${esc(meta)}</div>` : ''}
    ${status}
    ${modeMarkHtml(usage)}
    ${usageHtml(usage)}
    <button class="danger" data-mediadel="${item.id}" data-used="${usage.length}" style="margin-top:.35rem;width:100%;padding:.2rem;font-size:.72rem">Entfernen</button>
  </div>`;
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

async function addFiles(fileList) {
  const files = Array.from(fileList || []);
  for (const f of files) {
    const maxBytes = 2048 * 1024 * 1024;
    if (f.size > maxBytes) {
      toast(`${f.name} zu groß`);
      continue;
    }
    await stageFile(f);
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
