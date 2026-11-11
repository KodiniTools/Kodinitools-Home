// @ts-check
// „Icons"-Tab: durchsucht die Font-Awesome-Icons aus dem Serverordner
// /fontawesome/svgs (Solid, Regular, Brands), zeigt ALLE Treffer in einer
// scrollbaren Bibliothek und erlaubt, ein Icon zur Seite hinzuzufügen –
// als Einzel-Banner, als Raster-Kachel oder als Tool-Karten-Icon (je Sprache)
// oder seine URL zu kopieren. Die Icon-Liste wird beim ersten Öffnen geladen.

import { $ } from './core.js';
import { state, getPath, toolCardKeys, TOOL_CARD_SECTIONS, navLang } from './model';
import { mountVueTab } from './islands.js';

// Kachel 1..6 (größtmögliche Kachelzahl über alle Layouts)

// Suche, Filter, Icon, Link, Ziel

// Alle Tools (section+key+Titel) – Karten der Sprachdateien plus im Tab
// „Tool-Karten" angelegte Karten (nur Override) – für das Ziel-Dropdown.
function toolList() {
  const out = [];
  for (const section of TOOL_CARD_SECTIONS) {
    for (const key of toolCardKeys('de', section)) {
      const ov = getPath(state.overrides.de, [section, key, 'title']);
      const def = getPath(state.defaults.de, [section, key, 'title']);
      const title = (typeof ov === 'string' && ov) || (typeof def === 'string' && def) || key;
      out.push({ section, key, title });
    }
  }
  return out;
}

export function renderIcons() {
  const pane = $('#content');
  // Vue-Insel (app/tabs/icons).
  mountVueTab(pane, 'icons', {
    lang: navLang(),
    overrides: state.overrides,
    defaults: state.defaults,
    media: state.media,
    tools: toolList(),
  });
}
