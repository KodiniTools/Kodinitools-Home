// KodiniTools Adminbereich — Einstiegsmodul. Bindet Login, die zweistufige
// Navigation und den Startvorgang zusammen. Die Tabs sind Vue-Inseln
// (app/tabs/…, gebaut mit `npm run build:admin`); die Module hier halten den
// Zustand (model*.ts) und reichen ihn als Props/Services an die Inseln.

import { $, api, mediaAll } from './core';
import type { NavSection, SubtabKey } from '../types';
import { state, normTicker, normalizeMedia, SUBTABS, isLangSection } from './model';
import { renderTicker } from './ticker';
import { loadFonts } from './fonts';
import { renderTexts, renderAdvanced } from './content';
import { renderHeroDesign } from './design';
import { renderBackground } from './background';
import { renderToolCards } from './toolcards';
import { renderLayout } from './layout';
import { renderMedia, renderFiles, loadServerFiles } from './media';
import { renderIcons } from './icons';
import { renderPublish, refreshPublishStatus, initSaveTracking } from './publish';
import { unmountVueTab, markVueMissing } from './islands';

// --- Login ---
$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('#loginErr').textContent = '';
  const r = await api('/login', {
    method: 'POST',
    body: { password: ($('#pw') as HTMLInputElement).value },
  });
  if (r.ok) {
    ($('#pw') as HTMLInputElement).value = '';
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
  document.querySelectorAll('#topnav button').forEach((b) => {
    b.classList.toggle('active', (b as HTMLElement).dataset.sec === section);
  });
  const subnav = $('#subnav');
  if (isLangSection(section)) {
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
    isLangSection(section) &&
    (sub === 'cards' ||
      sub === 'texts' ||
      sub === 'background' ||
      sub === 'design' ||
      sub === 'layout' ||
      sub === 'media');
  $('#appView').classList.toggle('app-wide', wide);
  if (isLangSection(section)) {
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

export function goto(section: NavSection, sub?: SubtabKey) {
  state.nav.section = section;
  if (sub) state.nav.sub = sub;
  renderNav();
  renderMain();
}

$('#topnav').addEventListener('click', (e) => {
  const btn = (e.target as Element).closest('button[data-sec]') as HTMLElement | null;
  if (btn) goto(btn.dataset.sec as NavSection);
});
$('#subnav').addEventListener('click', (e) => {
  const btn = (e.target as Element).closest('button[data-sub]') as HTMLElement | null;
  if (btn) goto(state.nav.section, btn.dataset.sub as SubtabKey);
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

// Vue-Teile (app/main.ts, eigener Chunk im Bundle) parallel laden. Kommen sie
// nach dem ersten Rendern an, den aktiven Tab neu rendern (er zeigt bis dahin
// einen Ladehinweis); schlägt das Laden fehl, zeigt der Tab einen Fehlerhinweis.
const rerenderIfOpen = () => {
  if (!$('#appView').classList.contains('hidden')) renderMain();
};
window.addEventListener('kodini-admin-vue-ready', rerenderIfOpen);
import('../app/main').catch((e) => {
  markVueMissing(e);
  rerenderIfOpen();
});

// --- Start ---
boot();
