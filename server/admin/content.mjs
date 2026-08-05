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
  return {
    enabled: false,
    fontSize: 14,
    textColor: '#ffffff',
    bgColor: '#014f99',
    bgOpacity: 100,
    fontFamily: '', // Dateiname im Fonts-Ordner; leer = Standardschrift
    letterSpacing: 0, // Buchstabenabstand in px (0 = normal)
  };
}

/** Buchstabenabstand: auf [-5, 20] px begrenzen, auf 0,5 gerundet. */
function clampSpacing(v, def) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(-5, Math.min(20, Math.round(n * 2) / 2));
}

/** Erlaubt einen einfachen Schrift-Dateinamen (kein Pfad) oder '' (Standard). */
function normFontFile(v) {
  if (typeof v !== 'string' || v === '') return '';
  return /^[a-zA-Z0-9][a-zA-Z0-9._ -]*\.(woff2|woff|ttf|otf)$/i.test(v.trim()) ? v.trim() : '';
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
    fontFamily: normFontFile(s.fontFamily),
    letterSpacing: clampSpacing(s.letterSpacing, d.letterSpacing),
  };
}

// Standard-Design des Hero-Bereichs, getrennt für Hell- und Dunkelmodus. Die
// Standardwerte entsprechen dem jeweiligen Aussehen in global.css, sodass
// enabled=false (und auch enabled=true mit Standardwerten) unverändert wirkt.
function heroSideLight() {
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
  };
}
function heroSideDark() {
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
  };
}
function defaultHeroDesign() {
  return {
    enabled: false,
    // Eigene Schriften (Dateiname im /fonts-Ordner; leer = Standard). Gelten für
    // beide Modi. titleFont: Überschriften, buttonFont: Feature-Chips + CTA.
    titleFont: '',
    buttonFont: '',
    light: heroSideLight(),
    dark: heroSideDark(),
  };
}

/** Validiert einen Farb-Satz (Hell oder Dunkel) gegen dessen Standard. */
function validateHeroSide(s, def) {
  if (!isPlainObject(s)) return def;
  return {
    borderColor: normHexColor(s.borderColor, def.borderColor),
    borderWidth: clampNum(s.borderWidth, 0, 8, def.borderWidth),
    bgColor: normHexColor(s.bgColor, def.bgColor),
    bgOpacity: clampNum(s.bgOpacity, 0, 100, def.bgOpacity),
    chipBgColor: normHexColor(s.chipBgColor, def.chipBgColor),
    chipBgOpacity: clampNum(s.chipBgOpacity, 0, 100, def.chipBgOpacity),
    chipTextColor: normHexColor(s.chipTextColor, def.chipTextColor),
    chipBorderColor: normHexColor(s.chipBorderColor, def.chipBorderColor),
    chipBorderOpacity: clampNum(s.chipBorderOpacity, 0, 100, def.chipBorderOpacity),
    chipHoverBgColor: normHexColor(s.chipHoverBgColor, def.chipHoverBgColor),
    chipHoverTextColor: normHexColor(s.chipHoverTextColor, def.chipHoverTextColor),
    ctaBgColor: normHexColor(s.ctaBgColor, def.ctaBgColor),
    ctaTextColor: normHexColor(s.ctaTextColor, def.ctaTextColor),
    ctaHoverBgColor: normHexColor(s.ctaHoverBgColor, def.ctaHoverBgColor),
    ctaHoverTextColor: normHexColor(s.ctaHoverTextColor, def.ctaHoverTextColor),
  };
}

/**
 * Validiert/normalisiert das Hero-Design (getrennt Hell/Dunkel).
 * Migriert die alte flache Struktur (Farben auf oberster Ebene) -> beide Modi.
 */
function validateHeroDesign(hd) {
  if (!isPlainObject(hd)) return defaultHeroDesign();
  const hasSides = isPlainObject(hd.light) || isPlainObject(hd.dark);
  const flat = !hasSides && typeof hd.borderColor === 'string' ? hd : null;
  return {
    enabled: hd.enabled === true,
    titleFont: normFontFile(hd.titleFont),
    buttonFont: normFontFile(hd.buttonFont),
    light: validateHeroSide(hasSides ? hd.light : flat, heroSideLight()),
    dark: validateHeroSide(hasSides ? hd.dark : flat, heroSideDark()),
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
    heroBannerLink: '',
    heroGrid: ['', '', ''],
    heroGridLinks: ['', '', ''],
    heroGridRatio: '1:1',
    heroGridFit: 'cover',
    heroDesign: defaultHeroDesign(),
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
  // Verlinkung des Banners (optional): interner Pfad oder http(s). Leer = kein Link.
  out.heroBannerLink = '';
  if (m.heroBannerLink != null && m.heroBannerLink !== '') {
    if (!isValidMediaUrl(m.heroBannerLink))
      throw new Error(`media.${langLabel}.heroBannerLink muss / oder http(s) sein`);
    out.heroBannerLink = m.heroBannerLink;
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
  // Verlinkung der drei Rasterbilder (optional): interner Pfad oder http(s).
  out.heroGridLinks = ['', '', ''];
  if (Array.isArray(m.heroGridLinks)) {
    for (let i = 0; i < 3; i++) {
      const v = m.heroGridLinks[i];
      if (v == null || v === '') continue;
      if (!isValidMediaUrl(v))
        throw new Error(`media.${langLabel}.heroGridLinks[${i}] muss / oder http(s) sein`);
      out.heroGridLinks[i] = v;
    }
  }
  // Seitenverhältnis + Darstellung (zuschneiden vs. ganzes Bild) des Rasters.
  out.heroGridRatio = ['1:1', '16:9', '2:3'].includes(m.heroGridRatio) ? m.heroGridRatio : '1:1';
  out.heroGridFit = m.heroGridFit === 'contain' ? 'contain' : 'cover';
  // Hero-Design (Rahmen/Hintergrund/Buttons) – optional, mit Standard-Fallback.
  out.heroDesign = validateHeroDesign(m.heroDesign);
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
