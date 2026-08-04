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
// Standard-Design des Hero-Bereichs (entspricht dem Aussehen in global.css).
export function defaultHeroDesign() {
  return {
    enabled: false,
    borderColor: '#014f99',
    borderWidth: 1,
    bgColor: '#ffffff',
    bgOpacity: 70,
    chipBgColor: '#014f99',
    chipBgOpacity: 15,
    chipTextColor: '#013f7a',
    chipBorderColor: '#ffffff',
    chipBorderOpacity: 20,
    ctaBgColor: '#014f99',
    ctaTextColor: '#ffffff',
  };
}
// Geladenes Hero-Design normalisieren (fehlerhafte Werte -> Standard).
export function normHeroDesign(hd) {
  const d = defaultHeroDesign();
  if (!hd || typeof hd !== 'object') return d;
  const num = (v, min, max, def) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def;
  };
  const hex = (v, def) => (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(v)) ? v : def);
  return {
    enabled: hd.enabled === true,
    borderColor: hex(hd.borderColor, d.borderColor),
    borderWidth: num(hd.borderWidth, 0, 8, d.borderWidth),
    bgColor: hex(hd.bgColor, d.bgColor),
    bgOpacity: num(hd.bgOpacity, 0, 100, d.bgOpacity),
    chipBgColor: hex(hd.chipBgColor, d.chipBgColor),
    chipBgOpacity: num(hd.chipBgOpacity, 0, 100, d.chipBgOpacity),
    chipTextColor: hex(hd.chipTextColor, d.chipTextColor),
    chipBorderColor: hex(hd.chipBorderColor, d.chipBorderColor),
    chipBorderOpacity: num(hd.chipBorderOpacity, 0, 100, d.chipBorderOpacity),
    ctaBgColor: hex(hd.ctaBgColor, d.ctaBgColor),
    ctaTextColor: hex(hd.ctaTextColor, d.ctaTextColor),
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
    heroBanner: '',
    heroGrid: ['', '', ''],
    heroGridRatio: '1:1',
    heroGridFit: 'cover',
    heroDesign: defaultHeroDesign(),
  };
}
// Empfohlene Bildabmessungen je Seitenverhältnis (crisp bei ~3-spaltiger Anzeige).
export const GRID_DIMS = { '1:1': '800 × 800 px', '16:9': '800 × 450 px', '2:3': '800 × 1200 px' };
// Medien werden pro Sprache getrennt gepflegt: { de: {...}, en: {...} }.
export function defaultMedia() {
  return { de: defaultMediaLocale(), en: defaultMediaLocale() };
}

// Normalisiert einen geladenen Medien-Stand auf { de, en }. Akzeptiert auch die
// alte, sprachunabhängige Struktur ({ sectionVideos, heroBanner }) und wendet
// sie auf beide Sprachen an.
export function normalizeMedia(m) {
  const mk = (o) => {
    const d = defaultMediaLocale();
    const sv = o && typeof o.sectionVideos === 'object' && o.sectionVideos ? o.sectionVideos : {};
    const grid = Array.isArray(o?.heroGrid) ? o.heroGrid : [];
    return {
      sectionVideos: {
        audio: sv.audio || d.sectionVideos.audio,
        image: sv.image || d.sectionVideos.image,
        diverse: sv.diverse || d.sectionVideos.diverse,
      },
      heroMode: o && o.heroMode === 'grid' ? 'grid' : 'banner',
      heroBanner: o && typeof o.heroBanner === 'string' ? o.heroBanner : '',
      heroGrid: [0, 1, 2].map((i) => (typeof grid[i] === 'string' ? grid[i] : '')),
      heroGridRatio: ['1:1', '16:9', '2:3'].includes(o?.heroGridRatio) ? o.heroGridRatio : '1:1',
      heroGridFit: o?.heroGridFit === 'contain' ? 'contain' : 'cover',
      heroDesign: normHeroDesign(o?.heroDesign),
    };
  };
  if (m && typeof m === 'object' && m.sectionVideos) return { de: mk(m), en: mk(m) };
  const src = m && typeof m === 'object' ? m : {};
  return { de: mk(src.de), en: mk(src.en) };
}

// Sprachen + Slots. 'heroBanner' liegt auf oberster Ebene der Sprache, die
// anderen unter sectionVideos.
export const MEDIA_LANGS = ['de', 'en'];
// Slot-Schlüssel: Sektions-Videos, Einzel-Banner und die drei Rasterbilder.
export const MEDIA_KEYS = ['audio', 'image', 'diverse', 'heroBanner', 'grid0', 'grid1', 'grid2'];
export function getMediaVal(lang, key) {
  if (key === 'heroBanner') return state.media[lang].heroBanner || '';
  const g = /^grid([0-2])$/.exec(key);
  if (g) return (state.media[lang].heroGrid || [])[+g[1]] || '';
  return state.media[lang].sectionVideos[key] || '';
}
export function setMediaVal(lang, key, val) {
  if (key === 'heroBanner') {
    state.media[lang].heroBanner = val;
    return;
  }
  const g = /^grid([0-2])$/.exec(key);
  if (g) {
    if (!Array.isArray(state.media[lang].heroGrid)) state.media[lang].heroGrid = ['', '', ''];
    state.media[lang].heroGrid[+g[1]] = val;
    return;
  }
  state.media[lang].sectionVideos[key] = val;
}
export function defMediaVal(key) {
  if (key === 'heroBanner' || /^grid[0-2]$/.test(key)) return '';
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
