// Laufband-Tab (eine Sprache): Vue-Insel (app/tabs/ticker) mit Einträgen,
// Design (Farben/Größe/Abstand/Schrift) und Live-Vorschau.

import { $ } from './core';
import { state, getPageBg, PAGE_BG_DEFAULT, navLang } from './model';
import { ensureFontFace } from './fonts';
import { mountVueTab } from './islands';
import type { ThemeMode } from '../types';

// Seitenhintergrund des Modus (aus dem Tab „Hintergrund“ bzw. Seitenstandard).

function tkPageBg(mode: ThemeMode) {
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
