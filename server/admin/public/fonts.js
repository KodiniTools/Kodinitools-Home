// Gemeinsame Schrift-Helfer für den Adminbereich (Laufband & Hero-Design):
// Schriften laden, @font-face für die Vorschau einfügen und Auswahl-<option>s
// erzeugen. Die Fonts liegen unter /fonts auf der Domain (Serverordner
// /var/www/kodinitools.com/fonts bzw. public/fonts).

import { api } from './core.js';
import { state } from './model.js';

// Verfügbare Schriftarten laden (für die Schriftauswahl).
export async function loadFonts() {
  const r = await api('/fonts');
  state.fonts = (r.ok && Array.isArray(r.data?.fonts) ? r.data.fonts : []).filter(
    (f) => f && f.name,
  );
}

// Dateiname -> CSS-sicherer Family-Name (identisch zu TickerBar.astro/index.astro).
function fontFamilyId(file) {
  return (
    'kodini-font-' +
    String(file)
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
  );
}

// @font-face für eine Schriftdatei einmalig in die Admin-Seite einfügen, damit
// die Vorschau die echte Schrift zeigt. Rückgabe: der Family-Name (oder '').
export function ensureFontFace(file) {
  if (!file) return '';
  const fam = fontFamilyId(file);
  const id = 'ff-' + fam;
  if (!document.getElementById(id)) {
    const ext = (file.split('.').pop() || '').toLowerCase();
    const fmt = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' }[ext] || '';
    const st = document.createElement('style');
    st.id = id;
    st.textContent = `@font-face{font-family:"${fam}";src:url("/fonts/${encodeURIComponent(
      file,
    )}")${fmt ? ` format("${fmt}")` : ''};font-display:swap;}`;
    document.head.appendChild(st);
  }
  return fam;
}
