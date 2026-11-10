// KodiniTools Adminbereich — Einstiegsmodul. Bindet Login, die zweistufige
// Navigation und den Startvorgang zusammen. Die Tabs sind Vue-Inseln
// (app/tabs/…, gebaut mit `npm run build:admin`); die Module hier halten den
// Zustand (model*.js) und reichen ihn als Props/Services an die Inseln.

import { $, api, mediaAll } from './core.js';
import { state, normTicker, normalizeMedia, SUBTABS, LANG_SECTIONS } from './model.js';
import { renderTicker } from './ticker.js';
import { loadFonts } from './fonts.js';
import { renderTexts, renderAdvanced } from './content.js';
import { renderHeroDesign } from './design.js';
import { renderBackground } from './background.js';
import { renderToolCards } from './toolcards.js';
import { renderLayout } from './layout.js';
import { renderMedia, renderFiles, loadServerFiles } from './media.js';
import { renderIcons } from './icons.js';
import { renderPublish, refreshPublishStatus, initSaveTracking } from './publish.js';
import { unmountVueTab, markVueMissing } from './islands.js';

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

// --- Navigation (zwei Ebenen) ---
function renderNav() {
  const { section, sub } = state.nav;
  document
    .querySelectorAll('#topnav button')
    .forEach((b) => b.classList.toggle('active', b.dataset.sec === section));
  const subnav = $('#subnav');
  if (LANG_SECTIONS.includes(section)) {
    subnav.classList.remove('hidden');
    subnav.innerHTML = SUBTABS.map(
      (t) =>
        `<button data-sub="${t.key}" class="${t.key === sub ? 'active' : ''}">${t.label}</button>`,
    ).join('');
  } else {
    subnav.classList.add('hidden');
    subnav.innerHTML = '';
  }
}

// Rendert den aktuellen Bereich in #content (Sprache = state.nav.section).
export function renderMain() {
  const { section, sub } = state.nav;
  // Eine gemountete Vue-Insel abhängen, bevor ein Tab #content neu befüllt.
  unmountVueTab();
  // Tabs mit dreispaltigem Layout (Seitenleisten Hell/Dunkel) brauchen einen breiteren Rahmen.
  const wide =
    LANG_SECTIONS.includes(section) &&
    (sub === 'cards' ||
      sub === 'texts' ||
      sub === 'background' ||
      sub === 'design' ||
      sub === 'layout' ||
      sub === 'media');
  $('#appView').classList.toggle('app-wide', wide);
  if (LANG_SECTIONS.includes(section)) {
    if (sub === 'ticker') renderTicker();
    else if (sub === 'texts') renderTexts();
    else if (sub === 'media') renderMedia();
    else if (sub === 'layout') renderLayout();
    else if (sub === 'design') renderHeroDesign();
    else if (sub === 'background') renderBackground();
    else if (sub === 'cards') renderToolCards();
    else if (sub === 'files') renderFiles();
    else if (sub === 'icons') renderIcons();
    else if (sub === 'advanced') renderAdvanced();
  } else if (section === 'publish') {
    renderPublish();
    refreshPublishStatus();
  }
}

export function goto(section, sub) {
  state.nav.section = section;
  if (sub) state.nav.sub = sub;
  renderNav();
  renderMain();
}

$('#topnav').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-sec]');
  if (btn) goto(btn.dataset.sec);
});
$('#subnav').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-sub]');
  if (btn) goto(state.nav.section, btn.dataset.sub);
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
  // Läuft der Dienst mit veraltetem Server-Code (nach einem Code-Update)?
  // Vorschau/Veröffentlichen starten ihn unter systemd automatisch neu.
  const codeHint = $('#codeHint');
  if (codeHint) {
    codeHint.classList.toggle('hidden', !sess.data?.serverCodeChanged);
    codeHint.textContent = sess.data?.serverCodeChanged
      ? '⚠️ Neuer Server-Code – Neustart nötig (Vorschau/Veröffentlichen erledigt das)'
      : '';
  }
  state.overrides = { de: r.data.overrides?.de || {}, en: r.data.overrides?.en || {} };
  state.ticker = {
    de: normTicker(r.data.ticker?.de),
    en: normTicker(r.data.ticker?.en),
  };
  state.media = normalizeMedia(r.data.media);
  state.loadedMedia = JSON.parse(JSON.stringify(state.media));
  state.defaults = { de: r.data.defaults?.de || {}, en: r.data.defaults?.en || {} };
  state.stagedItems = await mediaAll();
  await loadServerFiles();
  await loadFonts();

  $('#loginView').classList.add('hidden');
  $('#appView').classList.remove('hidden');
  renderNav();
  renderMain();
  // Änderungs-Schutz + Autosave starten (Basis-Snapshot = frisch geladener Stand).
  initSaveTracking();
}

// Vue-Teile (./app/main.js) parallel laden. Kommen sie nach dem ersten
// Rendern an, den aktiven Tab neu rendern (er zeigt bis dahin einen
// Ladehinweis); fehlen sie, zeigt der Tab einen Fehlerhinweis.
const rerenderIfOpen = () => {
  if (!$('#appView').classList.contains('hidden')) renderMain();
};
window.addEventListener('kodini-admin-vue-ready', rerenderIfOpen);
import('./app/main.js').catch((e) => {
  markVueMissing(e);
  rerenderIfOpen();
});

// --- Start ---
boot();
