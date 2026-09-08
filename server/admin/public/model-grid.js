// Datenmodell – Hero-Layout: Raster-Layouts, Kachel-Design/-Bildbearbeitung,
// Banner-Design je Hell/Dunkel sowie die Diashows (Banner und Kacheln) mit ihren
// Bild-Plätzen.

import { normFontFile, getPath, setPath, MEDIA_LANGS } from './model-core.js';
import { state } from './model-state.js';

// Empfohlene Bildabmessungen je Seitenverhältnis (crisp bei ~3-spaltiger Anzeige).
export const GRID_DIMS = { '1:1': '800 × 800 px', '16:9': '800 × 450 px', '2:3': '800 × 1200 px' };
// Verfügbare Hero-Raster-Layouts (Anordnung der Kacheln). `cells` = Anzahl der
// Bild-Plätze. 'mosaic' = eine große Kachel links + zwei kleine rechts.
export const HERO_LAYOUTS = {
  grid2: { label: '2 nebeneinander', cells: 2 },
  grid3: { label: '3 nebeneinander', cells: 3 },
  row4: { label: '4 nebeneinander', cells: 4 },
  grid4: { label: '4 im 2×2-Raster', cells: 4 },
  grid6: { label: '6 im 3×2-Raster', cells: 6 },
  big2: { label: '2 große nebeneinander', cells: 2 },
  vrow: { label: 'Vertikale Reihe', cells: 3 },
  mosaic: { label: 'Mosaik (1 groß + 2 klein)', cells: 3 },
};
export const HERO_GRID_MAX = 6; // größtmögliche Kachelzahl über alle Layouts
// Kacheln je Reihe des Layouts (Basis für die Neuaufteilung bei ausgeblendeten Kacheln).
export const HERO_LAYOUT_COLS = {
  grid2: 2,
  grid3: 3,
  row4: 4,
  grid4: 2,
  grid6: 3,
  big2: 2,
  vrow: 1,
  mosaic: 3,
};
// Kacheln je Reihe, wenn nur n Kacheln sichtbar sind: Reihenzahl wie nötig, die
// Kacheln gleichmäßig auf die Reihen verteilt (z. B. 3×2 mit 4 sichtbaren -> 2×2,
// mit 5 -> 3 + 2 zentriert). Gleiche Formel wie auf der Seite (content.ts).
export function heroGridReflowCols(layout, n) {
  const c = HERO_LAYOUT_COLS[layout] || 3;
  if (n <= 0) return 1;
  const rows = Math.ceil(n / c);
  return Math.max(1, Math.ceil(n / rows));
}
// Sichtbare Kachel-Indizes eines Layouts (ausgeblendete entfallen).
export function visibleGridCells(lang, layout) {
  const hidden = state.media[lang].heroGridHidden;
  const n = heroLayoutCells(layout);
  const out = [];
  for (let i = 0; i < n; i++) if (!(Array.isArray(hidden) && hidden[i] === true)) out.push(i);
  return out;
}
export function heroLayoutCells(layout) {
  return (HERO_LAYOUTS[layout] || HERO_LAYOUTS.grid3).cells;
}
export function normHeroLayout(v) {
  return Object.prototype.hasOwnProperty.call(HERO_LAYOUTS, v) ? v : 'grid3';
}

// Per-Kachel-Design (Rahmen + Hintergrund + optionaler Text/Schrift). Standard
// entspricht dem bisherigen Aussehen: kein Rahmen, leicht bläulicher Hintergrund.
export function defaultCellStyle() {
  return {
    borderColor: '#014f99',
    borderWidth: 0,
    bgColor: '#014f99',
    bgOpacity: 8,
    text: '', // Standardtext über dem Bild / im leeren Kasten
    font: '', // Schriftart des Textes (Dateiname im /fonts-Ordner; leer = Standard)
    textColor: '#ffffff', // Farbe des Textes
    textSize: 0, // Schriftgröße in px (0 = automatisch)
    textPos: 'center', // Alt: 'top'|'center'|'bottom' (nur noch Migration)
    textX: 50, // Freie Position in % (0=links, 100=rechts) – per Maus ziehbar
    textY: 50, // Freie Position in % (0=oben, 100=unten)
    // Bildbearbeitung des Kachel-Mediums (Layout-Tab): Deckkraft (%), Abdunkelung (%),
    // Weichzeichner (px) und Sättigung (%; 100 = Original, 0 = Graustufen).
    imgOpacity: 100,
    imgDarken: 0,
    imgBlur: 0,
    imgSaturate: 100,
  };
}
// Grenzen der Bildbearbeitung je Feld (min, max) – auch für die Slider im Layout-Tab.
export const CELL_IMG_FIELDS = {
  imgOpacity: { min: 0, max: 100, label: 'Deckkraft', unit: '%' },
  imgDarken: { min: 0, max: 100, label: 'Abdunkelung', unit: '%' },
  imgBlur: { min: 0, max: 20, label: 'Weichzeichner', unit: 'px' },
  imgSaturate: { min: 0, max: 200, label: 'Sättigung', unit: '%' },
};
// Erlaubte Text-Positionen im Overlay (Alt-Format, nur noch für Migration).
export function normTextPos(v) {
  return ['top', 'center', 'bottom'].includes(v) ? v : 'center';
}
// Freie Position (0–100 %). Fehlt sie, wird sie aus der alten top/center/bottom-
// Angabe abgeleitet, damit bestehende Layouts erhalten bleiben.
export function normPosPct(v, legacyPos, axisDefault) {
  const n = Number(v);
  if (Number.isFinite(n)) return Math.max(0, Math.min(100, Math.round(n)));
  return { top: 10, center: 50, bottom: 90 }[legacyPos] ?? axisDefault;
}
export function defaultCellStyles() {
  return Array.from({ length: HERO_GRID_MAX }, () => defaultCellStyle());
}

// Design des Einzelbanners (Layout-Tab, Banner-Modus, Seitenleiste „Banner-Design"),
// je Hell-/Dunkelmodus: Rahmen, Eckenradius, Schatten, Deckkraft, Verdunkelung.
// Standard = bisheriges Aussehen (kein Rahmen, Radius 14 px, kein Schatten,
// deckend, nicht verdunkelt).
export function defaultBannerStyle() {
  return {
    borderColor: '#014f99',
    borderWidth: 0, // px (0–20; 0 = kein Rahmen)
    borderRadius: 14, // px (0–80)
    shadow: false, // Schatten an/aus
    shadowColor: '#000000',
    shadowX: 0, // px (−50–50)
    shadowY: 8, // px (−50–50)
    shadowBlur: 24, // px (0–80)
    shadowOpacity: 40, // % (0–100)
    opacity: 100, // % Deckkraft des Banners (0–100)
    darken: 0, // % Verdunkelung (0–100)
  };
}
export function defaultBannerStyles() {
  return { light: defaultBannerStyle(), dark: defaultBannerStyle() };
}
// Grenzen der Zahlenfelder des Banner-Designs (auch für die Regler im Layout-Tab).
export const BANNER_STYLE_LIMITS = {
  borderWidth: { min: 0, max: 20 },
  borderRadius: { min: 0, max: 80 },
  shadowX: { min: -50, max: 50 },
  shadowY: { min: -50, max: 50 },
  shadowBlur: { min: 0, max: 80 },
  shadowOpacity: { min: 0, max: 100 },
  opacity: { min: 0, max: 100 },
  darken: { min: 0, max: 100 },
};
function normBannerSide(s) {
  const d = defaultBannerStyle();
  if (!s || typeof s !== 'object') return d;
  const hex = (v, def) => (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v)) ? v : def);
  const num = (v, key) => {
    const n = Number(v);
    const { min, max } = BANNER_STYLE_LIMITS[key];
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : d[key];
  };
  return {
    borderColor: hex(s.borderColor, d.borderColor),
    borderWidth: num(s.borderWidth, 'borderWidth'),
    borderRadius: num(s.borderRadius, 'borderRadius'),
    shadow: s.shadow === true,
    shadowColor: hex(s.shadowColor, d.shadowColor),
    shadowX: num(s.shadowX, 'shadowX'),
    shadowY: num(s.shadowY, 'shadowY'),
    shadowBlur: num(s.shadowBlur, 'shadowBlur'),
    shadowOpacity: num(s.shadowOpacity, 'shadowOpacity'),
    opacity: num(s.opacity, 'opacity'),
    darken: num(s.darken, 'darken'),
  };
}
// { light, dark }; Alt-Format (flaches Objekt) wird auf beide Modi übernommen.
export function normBannerStyle(s) {
  if (!s || typeof s !== 'object') return defaultBannerStyles();
  const flat = !(s.light && typeof s.light === 'object') && !(s.dark && typeof s.dark === 'object');
  if (flat) return { light: normBannerSide(s), dark: normBannerSide(s) };
  return { light: normBannerSide(s.light), dark: normBannerSide(s.dark) };
}
// Sichert, dass heroBannerStyle existiert, und gibt das Objekt des Modus der Sprache.
export function getBannerStyle(lang, mode = 'light') {
  const m = state.media[lang];
  if (!m.heroBannerStyle || typeof m.heroBannerStyle !== 'object' || !m.heroBannerStyle.light)
    m.heroBannerStyle = normBannerStyle(m.heroBannerStyle);
  return m.heroBannerStyle[mode === 'dark' ? 'dark' : 'light'];
}
function normCellStyle(s) {
  const d = defaultCellStyle();
  if (!s || typeof s !== 'object') return d;
  const hex = (v, def) => (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v)) ? v : def);
  const num = (v, min, max, def) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : def;
  };
  return {
    borderColor: hex(s.borderColor, d.borderColor),
    borderWidth: num(s.borderWidth, 0, 20, d.borderWidth),
    bgColor: hex(s.bgColor, d.bgColor),
    bgOpacity: num(s.bgOpacity, 0, 100, d.bgOpacity),
    text: typeof s.text === 'string' ? s.text.slice(0, 120) : '',
    font: normFontFile(s.font),
    textColor: hex(s.textColor, d.textColor),
    textSize: num(s.textSize, 0, 96, d.textSize),
    textPos: normTextPos(s.textPos),
    textX: normPosPct(s.textX, undefined, 50),
    textY: normPosPct(s.textY, normTextPos(s.textPos), 50),
    imgOpacity: num(s.imgOpacity, 0, 100, d.imgOpacity),
    imgDarken: num(s.imgDarken, 0, 100, d.imgDarken),
    imgBlur: num(s.imgBlur, 0, 20, d.imgBlur),
    imgSaturate: num(s.imgSaturate, 0, 200, d.imgSaturate),
  };
}
export function normCellStyles(arr) {
  return Array.from({ length: HERO_GRID_MAX }, (_, i) =>
    normCellStyle(Array.isArray(arr) ? arr[i] : null),
  );
}
// Sichert, dass heroGridStyles existiert und gibt das Style-Objekt der Kachel i.
export function getCellStyle(lang, i) {
  const m = state.media[lang];
  if (!Array.isArray(m.heroGridStyles)) m.heroGridStyles = defaultCellStyles();
  if (!m.heroGridStyles[i]) m.heroGridStyles[i] = defaultCellStyle();
  return m.heroGridStyles[i];
}
// Eigenschaften, die „Standard für alle Kacheln" von der Master-Kachel übernimmt.
export const CELL_SYNC_PROPS = [
  'borderColor',
  'borderWidth',
  'bgColor',
  'bgOpacity',
  'font',
  'textSize',
  'textColor',
  'textX',
  'textY',
  'imgOpacity',
  'imgDarken',
  'imgBlur',
  'imgSaturate',
];
// Effektiver Style der Kachel i: bei aktivem „Standard für alle Kacheln" werden
// die synchronisierten Eigenschaften von der Master-Kachel übernommen; der
// eigene Text (und das Bild) bleiben je Kachel erhalten.
export function getEffectiveCellStyle(lang, i) {
  const m = state.media[lang];
  const base = getCellStyle(lang, i);
  if (!m.heroGridUniform) return base;
  const master = getCellStyle(lang, m.heroGridUniformCell || 0);
  const out = { ...base };
  for (const p of CELL_SYNC_PROPS) out[p] = master[p];
  return out;
}
// --- Diashow des Einzelbanners (weitere Bilder zusätzlich zum Banner) ---
export const BANNER_SLIDES_MAX = 12;
export const BANNER_TRANSITIONS = ['fade', 'slide', 'zoom', 'none'];
export function defaultBannerSlideshow() {
  return {
    interval: 5, // Sekunden je Bild (1–30)
    duration: 800, // ms – Dauer des Übergangs (0–5000)
    transition: 'fade', // fade | slide | zoom | none
    pauseOnHover: true, // bei Mauszeiger über dem Banner anhalten
    dots: true, // Punkte zum Umschalten anzeigen
  };
}
// Diashow der Raster-Kacheln: gemeinsame Einstellungen aller Kacheln, zusätzlich
// „versetzt wechseln" (Kacheln nacheinander statt gleichzeitig).
export function defaultGridSlideshow() {
  return { ...defaultBannerSlideshow(), stagger: true };
}
export function normGridSlides(arr) {
  return Array.from({ length: HERO_GRID_MAX }, (_, i) =>
    normBannerSlides(Array.isArray(arr) ? arr[i] : null),
  );
}
export function normBannerSlides(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((v) => typeof v === 'string' && v.trim())
    .map((v) => v.trim())
    .slice(0, BANNER_SLIDES_MAX);
}
export function normBannerSlideshow(o, withStagger = false) {
  const d = withStagger ? defaultGridSlideshow() : defaultBannerSlideshow();
  if (!o || typeof o !== 'object') return d;
  const n = Number(o.interval);
  const dur = Number(o.duration);
  const out = {
    interval: Number.isFinite(n) ? Math.max(1, Math.min(30, Math.round(n))) : d.interval,
    duration: Number.isFinite(dur) ? Math.max(0, Math.min(5000, Math.round(dur))) : d.duration,
    transition: BANNER_TRANSITIONS.includes(o.transition) ? o.transition : d.transition,
    pauseOnHover: o.pauseOnHover !== false,
    dots: o.dots !== false,
  };
  if (withStagger) out.stagger = o.stagger !== false;
  return out;
}
export function getGridSlides(lang, i) {
  const m = state.media[lang];
  if (!Array.isArray(m.heroGridSlides) || m.heroGridSlides.length !== HERO_GRID_MAX)
    m.heroGridSlides = normGridSlides(m.heroGridSlides);
  if (!Array.isArray(m.heroGridSlides[i])) m.heroGridSlides[i] = [];
  return m.heroGridSlides[i];
}
export function getGridSlideshow(lang) {
  const m = state.media[lang];
  if (!m.heroGridSlideshow || typeof m.heroGridSlideshow !== 'object')
    m.heroGridSlideshow = normBannerSlideshow(m.heroGridSlideshow, true);
  return m.heroGridSlideshow;
}
// Sichert die Diashow-Strukturen der Sprache und gibt sie zurück.
export function getBannerSlides(lang) {
  const m = state.media[lang];
  if (!Array.isArray(m.heroBannerSlides)) m.heroBannerSlides = normBannerSlides(m.heroBannerSlides);
  return m.heroBannerSlides;
}
export function getBannerSlideshow(lang) {
  const m = state.media[lang];
  if (!m.heroBannerSlideshow || typeof m.heroBannerSlideshow !== 'object')
    m.heroBannerSlideshow = normBannerSlideshow(m.heroBannerSlideshow);
  return m.heroBannerSlideshow;
}
// Bild-Plätze der Diashow (je Sprache und Index) – Upload in den Ordner der Sprache.
export function heroSlideImageSlots() {
  const slots = [];
  for (const lang of MEDIA_LANGS) {
    const arr = state.media[lang] && state.media[lang].heroBannerSlides;
    if (!Array.isArray(arr)) continue;
    arr.forEach((_, i) =>
      slots.push({
        root: lang,
        xLang: lang,
        path: ['heroBannerSlides', i],
        label: `${lang.toUpperCase()} · Banner-Diashow Bild ${i + 2}`,
      }),
    );
  }
  for (const lang of MEDIA_LANGS) {
    const grid = state.media[lang] && state.media[lang].heroGridSlides;
    if (!Array.isArray(grid)) continue;
    grid.forEach((cell, c) => {
      if (!Array.isArray(cell)) return;
      cell.forEach((_, j) =>
        slots.push({
          root: lang,
          xLang: lang,
          path: ['heroGridSlides', c, j],
          label: `${lang.toUpperCase()} · Kachel ${c + 1} Diashow Bild ${j + 2}`,
        }),
      );
    });
  }
  for (const slot of slots) {
    slot.get = () => {
      const v = getPath(state.media[slot.root], slot.path);
      return typeof v === 'string' ? v : '';
    };
    slot.set = (v) => setPath(state.media[slot.root], slot.path, String(v ?? '').trim());
  }
  return slots;
}
