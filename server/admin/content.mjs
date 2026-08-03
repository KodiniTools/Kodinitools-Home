// Lesen/Schreiben der admin-editierbaren Content-Dateien
// (src/content/overrides.*.json + ticker.*.json). Mit Validierung.

import { readFile, writeFile } from 'node:fs/promises';
import { contentPaths } from './config.mjs';

async function readJsonFile(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return fallback;
  }
}

/** Aktueller Content-Stand (Overrides + Ticker + Medien + Standard-Locales). */
export async function loadContent() {
  const p = contentPaths();
  const [overridesDe, overridesEn, tickerDe, tickerEn, media, localesDe, localesEn] =
    await Promise.all([
      readJsonFile(p.overridesDe, {}),
      readJsonFile(p.overridesEn, {}),
      readJsonFile(p.tickerDe, defaultTicker()),
      readJsonFile(p.tickerEn, defaultTicker()),
      readJsonFile(p.media, defaultMedia()),
      readJsonFile(p.localesDe, {}),
      readJsonFile(p.localesEn, {}),
    ]);
  return {
    overrides: { de: overridesDe, en: overridesEn },
    ticker: { de: tickerDe, en: tickerEn },
    media,
    defaults: { de: localesDe, en: localesEn },
  };
}

function defaultTickerStyle() {
  return { enabled: false, fontSize: 14, textColor: '#ffffff', bgColor: '#014f99', bgOpacity: 100 };
}

function defaultTicker() {
  return { enabled: false, speed: 'normal', items: [], style: defaultTickerStyle() };
}

function normHexColor(v, def) {
  if (typeof v !== 'string') return def;
  const m = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(v.trim());
  if (!m) return def;
  let h = m[1];
  if (h.length === 3)
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  return '#' + h.toLowerCase();
}

function clampNum(v, min, max, def) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/** Validiert/normalisiert das Laufband-Design (fehlerhafte Werte -> Standard). */
export function validateTickerStyle(s) {
  const d = defaultTickerStyle();
  if (!isPlainObject(s)) return d;
  return {
    enabled: s.enabled === true,
    fontSize: clampNum(s.fontSize, 8, 48, d.fontSize),
    textColor: normHexColor(s.textColor, d.textColor),
    bgColor: normHexColor(s.bgColor, d.bgColor),
    bgOpacity: clampNum(s.bgOpacity, 0, 100, d.bgOpacity),
  };
}

function defaultMediaLocale() {
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
  };
}

/** Medien-Standard pro Sprache ({ de, en }). */
function defaultMedia() {
  return { de: defaultMediaLocale(), en: defaultMediaLocale() };
}

function isPlainObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Validiert eine Ticker-Konfiguration und normalisiert sie. */
export function validateTicker(t) {
  if (!isPlainObject(t)) throw new Error('ticker muss ein Objekt sein');
  const speed = ['slow', 'normal', 'fast'].includes(t.speed) ? t.speed : 'normal';
  if (!Array.isArray(t.items)) throw new Error('ticker.items muss ein Array sein');
  const items = t.items.map((it, i) => {
    if (!isPlainObject(it)) throw new Error(`ticker.items[${i}] ungültig`);
    if (typeof it.text !== 'string' || it.text.length === 0)
      throw new Error(`ticker.items[${i}].text fehlt`);
    if (it.text.length > 300) throw new Error(`ticker.items[${i}].text zu lang`);
    const out = { id: String(it.id ?? i + 1), text: it.text };
    if (it.link != null) {
      if (typeof it.link !== 'string') throw new Error(`ticker.items[${i}].link ungültig`);
      // Nur interne Pfade oder http(s)-URLs erlauben
      if (!/^(\/[^\s]*|https?:\/\/[^\s]+)$/.test(it.link))
        throw new Error(`ticker.items[${i}].link muss / oder http(s) sein`);
      out.link = it.link;
    }
    return out;
  });
  return { enabled: t.enabled === true, speed, items, style: validateTickerStyle(t.style) };
}

/** Validiert Overrides (nur Plain-Object, begrenzte Tiefe/Größe). */
export function validateOverrides(o) {
  if (!isPlainObject(o)) throw new Error('overrides muss ein Objekt sein');
  const json = JSON.stringify(o);
  if (json.length > 2 * 1024 * 1024) throw new Error('overrides zu groß');
  return o;
}

/** Erlaubt interne Pfade oder http(s)-URLs. */
function isValidMediaUrl(v) {
  return typeof v === 'string' && /^(\/[^\s]*|https?:\/\/[^\s]+)$/.test(v);
}

/** Validiert die Medien EINER Sprache; fehlende Werte fallen auf Standard zurück. */
function validateMediaLocale(m, langLabel) {
  const def = defaultMediaLocale();
  if (!isPlainObject(m)) return def;
  const sv = isPlainObject(m.sectionVideos) ? m.sectionVideos : {};
  const out = { sectionVideos: {} };
  for (const key of ['audio', 'image', 'diverse']) {
    const val = sv[key];
    if (val == null || val === '') {
      out.sectionVideos[key] = def.sectionVideos[key];
    } else if (!isValidMediaUrl(val)) {
      throw new Error(`media.${langLabel}.sectionVideos.${key} ungültig`);
    } else {
      out.sectionVideos[key] = val;
    }
  }
  // Hero-Modus: 'banner' (Einzelbild) oder 'grid' (3er-Raster).
  out.heroMode = m.heroMode === 'grid' ? 'grid' : 'banner';
  // Option 1 – Hero-Banner: optional. Leerer String = kein Banner; sonst gültige URL.
  out.heroBanner = '';
  if (m.heroBanner != null && m.heroBanner !== '') {
    if (!isValidMediaUrl(m.heroBanner)) throw new Error(`media.${langLabel}.heroBanner ungültig`);
    out.heroBanner = m.heroBanner;
  }
  // Option 2 – Hero-Raster: genau drei Felder, je '' oder gültige URL.
  out.heroGrid = ['', '', ''];
  if (Array.isArray(m.heroGrid)) {
    for (let i = 0; i < 3; i++) {
      const v = m.heroGrid[i];
      if (v == null || v === '') continue;
      if (!isValidMediaUrl(v)) throw new Error(`media.${langLabel}.heroGrid[${i}] ungültig`);
      out.heroGrid[i] = v;
    }
  }
  // Seitenverhältnis + Darstellung (zuschneiden vs. ganzes Bild) des Rasters.
  out.heroGridRatio = ['1:1', '16:9', '2:3'].includes(m.heroGridRatio) ? m.heroGridRatio : '1:1';
  out.heroGridFit = m.heroGridFit === 'contain' ? 'contain' : 'cover';
  return out;
}

/**
 * Validiert die Medien-Konfiguration und normalisiert auf { de, en }.
 * Akzeptiert die alte, sprachunabhängige Struktur ({ sectionVideos, heroBanner })
 * und wendet sie auf beide Sprachen an.
 */
export function validateMedia(m) {
  if (!isPlainObject(m)) throw new Error('media muss ein Objekt sein');
  // Alte, flache Struktur -> auf beide Sprachen anwenden.
  if (isPlainObject(m.sectionVideos)) {
    const one = validateMediaLocale(m, 'de');
    return { de: one, en: JSON.parse(JSON.stringify(one)) };
  }
  return {
    de: validateMediaLocale(m.de ?? {}, 'de'),
    en: validateMediaLocale(m.en ?? {}, 'en'),
  };
}

const pretty = (obj) => JSON.stringify(obj, null, 2) + '\n';

/**
 * Speichert einen kompletten Content-Stand (Draft im Arbeitsverzeichnis;
 * noch NICHT committet — das macht publish()).
 * payload: { overrides:{de,en}, ticker:{de,en}, media }
 */
export async function saveContent(payload) {
  if (!isPlainObject(payload)) throw new Error('ungültiger Payload');
  const overrides = payload.overrides || {};
  const ticker = payload.ticker || {};

  const oDe = validateOverrides(overrides.de ?? {});
  const oEn = validateOverrides(overrides.en ?? {});
  const tDe = validateTicker(ticker.de ?? defaultTicker());
  const tEn = validateTicker(ticker.en ?? defaultTicker());
  const media = validateMedia(payload.media ?? defaultMedia());

  const p = contentPaths();
  await Promise.all([
    writeFile(p.overridesDe, pretty(oDe), 'utf8'),
    writeFile(p.overridesEn, pretty(oEn), 'utf8'),
    writeFile(p.tickerDe, pretty(tDe), 'utf8'),
    writeFile(p.tickerEn, pretty(tEn), 'utf8'),
    writeFile(p.media, pretty(media), 'utf8'),
  ]);

  return { overrides: { de: oDe, en: oEn }, ticker: { de: tDe, en: tEn }, media };
}
