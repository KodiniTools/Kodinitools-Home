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

function defaultTicker() {
  return { enabled: false, speed: 'normal', items: [] };
}

function defaultMedia() {
  return {
    sectionVideos: {
      audio: '/videos/audio-tools.mp4',
      image: '/videos/image-tools.mp4',
      diverse: '/videos/diverse-tools.mp4',
    },
  };
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
  return { enabled: t.enabled === true, speed, items };
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

/** Validiert die Medien-Konfiguration (Sektions-Videos). */
export function validateMedia(m) {
  if (!isPlainObject(m)) throw new Error('media muss ein Objekt sein');
  const sv = m.sectionVideos;
  if (!isPlainObject(sv)) throw new Error('media.sectionVideos fehlt');
  const out = { sectionVideos: {} };
  for (const key of ['audio', 'image', 'diverse']) {
    const val = sv[key];
    if (!isValidMediaUrl(val)) throw new Error(`media.sectionVideos.${key} ungültig`);
    out.sectionVideos[key] = val;
  }
  return out;
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
