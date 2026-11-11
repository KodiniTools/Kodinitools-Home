// @ts-check
// Laufband-Tab (eine Sprache): Vue-Insel (app/tabs/ticker) mit Einträgen,
// Design (Farben/Größe/Abstand/Schrift) und Live-Vorschau.

import { $ } from './core.js';
import { state, getPageBg, PAGE_BG_DEFAULT, navLang } from './model.js';
import { ensureFontFace } from './fonts.js';
import { mountVueTab } from './islands.js';

// Seitenhintergrund des Modus (aus dem Tab „Hintergrund“ bzw. Seitenstandard).
/** @param {import('../types.ts').ThemeMode} mode */
function tkPageBg(mode) {
  return getPageBg(mode) || PAGE_BG_DEFAULT[mode];
}

export function renderTicker() {
  const pane = $('#content');
  const lang = navLang();
  mountVueTab(pane, 'ticker', {
    ticker: state.ticker[lang],
    lang,
    fonts: state.fonts,
    pageBg: { light: tkPageBg('light'), dark: tkPageBg('dark') },
    ensureFontFace,
  });
}
