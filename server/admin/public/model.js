// Datenmodell des Adminbereichs: der zentrale App-Zustand plus alle reinen
// Hilfsfunktionen zum Erzeugen/Normalisieren von Ticker- und Medien-Daten sowie
// Pfad-Helfer für verschachtelte Overrides. Keine DOM-/API-Abhängigkeiten.

// --- Ticker-Standard & -Normalisierung ---
export function emptyTicker() {
  return { enabled: false, speed: 'normal', items: [], style: defaultTickerStyle() };
}
export function defaultTickerStyle() {
  return {
    enabled: false,
    fontSize: 14,
    textColor: '#ffffff',
    bgColor: '#014f99',
    bgOpacity: 100,
    fontFamily: '',
    letterSpacing: 0,
  };
}
// Buchstabenabstand auf [-5, 20] px begrenzen, auf 0,5 gerundet.
export function clampSpacing(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(-5, Math.min(20, Math.round(n * 2) / 2)) : def;
}
// Erlaubt einen einfachen Schrift-Dateinamen oder '' (Standardschrift).
export function normFontFile(v) {
  return typeof v === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._ -]*\.(woff2|woff|ttf|otf)$/i.test(v)
    ? v
    : '';
}
// Laufband-Design normalisieren (aus geladener Config).
export function normTickerStyle(s) {
  const d = defaultTickerStyle();
  if (!s || typeof s !== 'object') return d;
  const clamp = (v, min, max, def) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : def;
  };
  const hex = (v, def) => (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v)) ? v : def);
  return {
    enabled: s.enabled === true,
    fontSize: clamp(s.fontSize, 8, 48, d.fontSize),
    textColor: hex(s.textColor, d.textColor),
    bgColor: hex(s.bgColor, d.bgColor),
    bgOpacity: clamp(s.bgOpacity, 0, 100, d.bgOpacity),
    fontFamily: normFontFile(s.fontFamily),
    letterSpacing: clampSpacing(s.letterSpacing, d.letterSpacing),
  };
}
// Vollständige Ticker-Konfiguration einer Sprache normalisieren.
export function normTicker(t) {
  if (!t || typeof t !== 'object') return emptyTicker();
  return {
    enabled: t.enabled === true,
    speed: ['slow', 'normal', 'fast'].includes(t.speed) ? t.speed : 'normal',
    items: Array.isArray(t.items)
      ? t.items.map((i) => ({ id: String(i.id ?? ''), text: i.text || '', link: i.link || '' }))
      : [],
    style: normTickerStyle(t.style),
  };
}
// Hex + Deckkraft(%) -> rgba() (für Vorschau).
export function rgbaFromHex(hex, opacityPct) {
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(String(hex || '').trim());
  if (!m) return hex;
  let h = m[1];
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = Math.max(0, Math.min(100, Number(opacityPct) || 0)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// --- Medien-Standard & -Normalisierung ---
// Standard-Design des Hero-Bereichs, getrennt für Hell- und Dunkelmodus
// (entspricht dem jeweiligen Aussehen in global.css).
export function heroSideLight() {
  return {
    borderColor: '#014f99',
    borderWidth: 1,
    bgColor: '#ffffff',
    bgOpacity: 70,
    chipBgColor: '#014f99',
    chipBgOpacity: 15,
    chipTextColor: '#013f7a',
    chipBorderColor: '#ffffff',
    chipBorderOpacity: 20,
    chipHoverBgColor: '#0160b8',
    chipHoverTextColor: '#f5f4d6',
    ctaBgColor: '#014f99',
    ctaTextColor: '#ffffff',
    ctaHoverBgColor: '#003971',
    ctaHoverTextColor: '#ffffff',
    titleTextColor: '#003971',
  };
}
export function heroSideDark() {
  return {
    borderColor: '#e8a945',
    borderWidth: 1,
    bgColor: '#0e1c32',
    bgOpacity: 80,
    chipBgColor: '#142640',
    chipBgOpacity: 40,
    chipTextColor: '#f8e1a9',
    chipBorderColor: '#ffffff',
    chipBorderOpacity: 8,
    chipHoverBgColor: '#142640',
    chipHoverTextColor: '#f5f4d6',
    ctaBgColor: '#e8a945',
    ctaTextColor: '#ffffff',
    ctaHoverBgColor: '#a07030',
    ctaHoverTextColor: '#ffffff',
    titleTextColor: '#f9f2d5',
  };
}
export function defaultHeroDesign() {
  return {
    enabled: false,
    titleFont: '', // Überschriften-Schrift (Dateiname im /fonts-Ordner)
    buttonFont: '', // Schrift der Feature-Chips + CTA
    titleLetterSpacing: 0,
    titleStrokeColor: '#000000',
    titleStrokeWidth: 0,
    buttonLetterSpacing: 0,
    buttonStrokeColor: '#000000',
    buttonStrokeWidth: 0,
    titleFontSize: 0,
    subtitleFontSize: 0,
    chipFontSize: 0,
    ctaFontSize: 0,
    light: heroSideLight(),
    dark: heroSideDark(),
  };
}
// Einen Farb-Satz (Hell/Dunkel) normalisieren.
function normHeroSide(s, def) {
  if (!s || typeof s !== 'object') return def;
  const num = (v, min, max, d) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : d;
  };
  const hex = (v, d) => (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v)) ? v : d);
  return {
    borderColor: hex(s.borderColor, def.borderColor),
    borderWidth: num(s.borderWidth, 0, 8, def.borderWidth),
    bgColor: hex(s.bgColor, def.bgColor),
    bgOpacity: num(s.bgOpacity, 0, 100, def.bgOpacity),
    chipBgColor: hex(s.chipBgColor, def.chipBgColor),
    chipBgOpacity: num(s.chipBgOpacity, 0, 100, def.chipBgOpacity),
    chipTextColor: hex(s.chipTextColor, def.chipTextColor),
    chipBorderColor: hex(s.chipBorderColor, def.chipBorderColor),
    chipBorderOpacity: num(s.chipBorderOpacity, 0, 100, def.chipBorderOpacity),
    chipHoverBgColor: hex(s.chipHoverBgColor, def.chipHoverBgColor),
    chipHoverTextColor: hex(s.chipHoverTextColor, def.chipHoverTextColor),
    ctaBgColor: hex(s.ctaBgColor, def.ctaBgColor),
    ctaTextColor: hex(s.ctaTextColor, def.ctaTextColor),
    ctaHoverBgColor: hex(s.ctaHoverBgColor, def.ctaHoverBgColor),
    ctaHoverTextColor: hex(s.ctaHoverTextColor, def.ctaHoverTextColor),
    titleTextColor: hex(s.titleTextColor, def.titleTextColor),
  };
}
// Geladenes Hero-Design normalisieren (getrennt Hell/Dunkel). Migriert die alte
// flache Struktur (Farben auf oberster Ebene) auf beide Modi.
export function normHeroDesign(hd) {
  if (!hd || typeof hd !== 'object') return defaultHeroDesign();
  const hasSides =
    (hd.light && typeof hd.light === 'object') || (hd.dark && typeof hd.dark === 'object');
  const flat = !hasSides && typeof hd.borderColor === 'string' ? hd : null;
  const hex = (v, d) => (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v)) ? v : d);
  const stroke = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(5, Math.round(n * 2) / 2)) : 0;
  };
  const fontSize = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.max(8, Math.min(96, Math.round(n))) : 0;
  };
  return {
    enabled: hd.enabled === true,
    titleFont: normFontFile(hd.titleFont),
    buttonFont: normFontFile(hd.buttonFont),
    titleLetterSpacing: clampSpacing(hd.titleLetterSpacing, 0),
    titleStrokeColor: hex(hd.titleStrokeColor, '#000000'),
    titleStrokeWidth: stroke(hd.titleStrokeWidth),
    buttonLetterSpacing: clampSpacing(hd.buttonLetterSpacing, 0),
    buttonStrokeColor: hex(hd.buttonStrokeColor, '#000000'),
    buttonStrokeWidth: stroke(hd.buttonStrokeWidth),
    titleFontSize: fontSize(hd.titleFontSize),
    subtitleFontSize: fontSize(hd.subtitleFontSize),
    chipFontSize: fontSize(hd.chipFontSize),
    ctaFontSize: fontSize(hd.ctaFontSize),
    light: normHeroSide(hasSides ? hd.light : flat, heroSideLight()),
    dark: normHeroSide(hasSides ? hd.dark : flat, heroSideDark()),
  };
}

export function defaultMediaLocale() {
  return {
    sectionVideos: {
      audio: '/videos/audio-tools.mp4',
      image: '/videos/image-tools.mp4',
      diverse: '/videos/diverse-tools.mp4',
    },
    heroMode: 'banner',
    heroLayout: 'grid3',
    heroBanner: '',
    heroBannerLink: '',
    heroBannerText: '', // Text über dem Einzelbanner
    heroBannerFont: '', // Schriftart des Banner-Textes (Dateiname im /fonts-Ordner)
    heroBannerTextColor: '#ffffff',
    heroBannerTextSize: 0, // px (0 = automatisch)
    heroBannerTextPos: 'center', // 'top' | 'center' | 'bottom'
    heroGrid: ['', '', '', '', '', ''],
    heroGridLinks: ['', '', '', '', '', ''],
    heroGridStyles: defaultCellStyles(),
    heroGridRatio: '1:1',
    heroGridFit: 'cover',
    heroDesign: defaultHeroDesign(),
  };
}
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
export function heroLayoutCells(layout) {
  return (HERO_LAYOUTS[layout] || HERO_LAYOUTS.grid3).cells;
}
function normHeroLayout(v) {
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
    textPos: 'center', // Position: 'top' | 'center' | 'bottom'
  };
}
// Erlaubte Text-Positionen im Overlay.
export function normTextPos(v) {
  return ['top', 'center', 'bottom'].includes(v) ? v : 'center';
}
export function defaultCellStyles() {
  return Array.from({ length: HERO_GRID_MAX }, () => defaultCellStyle());
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
// Globale (sprachübergreifende) Seiten-Einstellungen. globalFont = Basis-
// Schriftart der ganzen Seite (Dateiname im /fonts-Ordner; leer = Standard).
export function defaultSite() {
  return { globalFont: '' };
}
export function normSite(s) {
  if (!s || typeof s !== 'object') return defaultSite();
  return { globalFont: normFontFile(s.globalFont) };
}
// Medien werden pro Sprache getrennt gepflegt, plus globale site-Einstellungen:
// { site: {...}, de: {...}, en: {...} }.
export function defaultMedia() {
  return { site: defaultSite(), de: defaultMediaLocale(), en: defaultMediaLocale() };
}
// Aktuell gesetzte globale Basis-Schrift (Dateiname oder '').
export function getGlobalFont() {
  if (!state.media.site || typeof state.media.site !== 'object') state.media.site = defaultSite();
  return state.media.site.globalFont || '';
}
// Globale Basis-Schrift setzen ('' = Standard).
export function setGlobalFont(file) {
  if (!state.media.site || typeof state.media.site !== 'object') state.media.site = defaultSite();
  state.media.site.globalFont = normFontFile(file);
}

// Normalisiert einen geladenen Medien-Stand auf { de, en }. Akzeptiert auch die
// alte, sprachunabhängige Struktur ({ sectionVideos, heroBanner }) und wendet
// sie auf beide Sprachen an.
export function normalizeMedia(m) {
  const mk = (o) => {
    const d = defaultMediaLocale();
    const sv = o && typeof o.sectionVideos === 'object' && o.sectionVideos ? o.sectionVideos : {};
    const grid = Array.isArray(o?.heroGrid) ? o.heroGrid : [];
    const gridLinks = Array.isArray(o?.heroGridLinks) ? o.heroGridLinks : [];
    return {
      sectionVideos: {
        audio: sv.audio || d.sectionVideos.audio,
        image: sv.image || d.sectionVideos.image,
        diverse: sv.diverse || d.sectionVideos.diverse,
      },
      heroMode: o && o.heroMode === 'grid' ? 'grid' : 'banner',
      heroLayout: normHeroLayout(o?.heroLayout),
      heroBanner: o && typeof o.heroBanner === 'string' ? o.heroBanner : '',
      heroBannerLink: o && typeof o.heroBannerLink === 'string' ? o.heroBannerLink : '',
      heroBannerText: typeof o?.heroBannerText === 'string' ? o.heroBannerText.slice(0, 120) : '',
      heroBannerFont: normFontFile(o?.heroBannerFont),
      heroBannerTextColor: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(o?.heroBannerTextColor))
        ? o.heroBannerTextColor
        : '#ffffff',
      heroBannerTextSize: Number.isFinite(Number(o?.heroBannerTextSize))
        ? Math.max(0, Math.min(96, Math.round(Number(o.heroBannerTextSize))))
        : 0,
      heroBannerTextPos: normTextPos(o?.heroBannerTextPos),
      heroGrid: [0, 1, 2, 3, 4, 5].map((i) => (typeof grid[i] === 'string' ? grid[i] : '')),
      heroGridLinks: [0, 1, 2, 3, 4, 5].map((i) =>
        typeof gridLinks[i] === 'string' ? gridLinks[i] : '',
      ),
      heroGridStyles: normCellStyles(o?.heroGridStyles),
      heroGridRatio: ['1:1', '16:9', '2:3'].includes(o?.heroGridRatio) ? o.heroGridRatio : '1:1',
      heroGridFit: o?.heroGridFit === 'contain' ? 'contain' : 'cover',
      heroDesign: normHeroDesign(o?.heroDesign),
    };
  };
  if (m && typeof m === 'object' && m.sectionVideos)
    return { site: defaultSite(), de: mk(m), en: mk(m) };
  const src = m && typeof m === 'object' ? m : {};
  return { site: normSite(src.site), de: mk(src.de), en: mk(src.en) };
}

// Sprachen + Slots. 'heroBanner' liegt auf oberster Ebene der Sprache, die
// anderen unter sectionVideos.
export const MEDIA_LANGS = ['de', 'en'];
// Slot-Schlüssel: Sektions-Videos, Einzel-Banner und die sechs Rasterbilder.
export const MEDIA_KEYS = [
  'audio',
  'image',
  'diverse',
  'heroBanner',
  'grid0',
  'grid1',
  'grid2',
  'grid3',
  'grid4',
  'grid5',
];
export function getMediaVal(lang, key) {
  if (key === 'heroBanner') return state.media[lang].heroBanner || '';
  const g = /^grid([0-5])$/.exec(key);
  if (g) return (state.media[lang].heroGrid || [])[+g[1]] || '';
  return state.media[lang].sectionVideos[key] || '';
}
export function setMediaVal(lang, key, val) {
  if (key === 'heroBanner') {
    state.media[lang].heroBanner = val;
    return;
  }
  const g = /^grid([0-5])$/.exec(key);
  if (g) {
    if (!Array.isArray(state.media[lang].heroGrid))
      state.media[lang].heroGrid = ['', '', '', '', '', ''];
    state.media[lang].heroGrid[+g[1]] = val;
    return;
  }
  state.media[lang].sectionVideos[key] = val;
}
export function defMediaVal(key) {
  if (key === 'heroBanner' || /^grid[0-5]$/.test(key)) return '';
  return defaultMediaLocale().sectionVideos[key];
}
// Ersetzt eine Medien-URL in ALLEN Slots (beide Sprachen) — z.B. nachdem eine
// Datei serverseitig verschoben wurde, damit die Zuweisungen erhalten bleiben.
export function updateMediaUrlEverywhere(oldUrl, newUrl) {
  for (const lang of MEDIA_LANGS) {
    for (const key of MEDIA_KEYS) {
      if (getMediaVal(lang, key) === oldUrl) setMediaVal(lang, key, newUrl);
    }
  }
}

// --- Pfad-Helfer für verschachtelte Overrides ---
export function getPath(obj, path) {
  let cur = obj;
  for (const k of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[k];
  }
  return cur;
}
export function setPath(obj, path, value) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (typeof cur[path[i]] !== 'object' || cur[path[i]] == null) cur[path[i]] = {};
    cur = cur[path[i]];
  }
  cur[path[path.length - 1]] = value;
}
export function delPath(obj, path) {
  const stack = [obj];
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    if (cur[path[i]] == null) return;
    cur = cur[path[i]];
    stack.push(cur);
  }
  delete cur[path[path.length - 1]];
  // leere Eltern-Objekte aufräumen
  for (let i = path.length - 2; i >= 0; i--) {
    const parent = stack[i];
    const key = path[i];
    if (parent[key] && typeof parent[key] === 'object' && Object.keys(parent[key]).length === 0)
      delete parent[key];
  }
}

// --- Navigation: Ebenen-Konstanten (reine Daten) ---
export const SUBTABS = [
  { key: 'ticker', label: 'Laufband' },
  { key: 'texts', label: 'Texte' },
  { key: 'media', label: 'Medien' },
  { key: 'layout', label: 'Layout' },
  { key: 'design', label: 'Hero-Design' },
  { key: 'files', label: 'Dateien' },
  { key: 'advanced', label: 'Erweitert' },
];
export const LANG_SECTIONS = ['de', 'en'];

// --- Zentraler App-Zustand ---
export const state = {
  overrides: { de: {}, en: {} },
  ticker: { de: emptyTicker(), en: emptyTicker() }, // style ist pro Sprache Teil des Tickers
  media: defaultMedia(),
  loadedMedia: defaultMedia(), // Fallback für nicht aufgelöste Staging-Refs beim Speichern
  defaults: { de: {}, en: {} },
  stagedItems: [], // aus IndexedDB (nur im Browser)
  serverFiles: { de: [], en: [], shared: [] }, // Server-Uploads getrennt nach Sprache
  fonts: [], // verfügbare Schriftarten aus /fonts (für die Laufband-Schrift)
  objectUrls: new Map(), // id -> objectURL (für Vorschau)
  nav: { section: 'de', sub: 'ticker' }, // Ebene 1 (de|en|dateien|publish) + Ebene 2
  publishing: false, // läuft gerade eine Veröffentlichung?
};
