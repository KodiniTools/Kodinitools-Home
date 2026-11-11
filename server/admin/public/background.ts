// Hintergrund-Tab (global, sprachübergreifend): Hintergrund der GESAMTEN
// Website – getrennt für Hell- und Dunkelmodus – mit Live-Vorschau. Je Modus:
// eigene Farbe, Deckkraft (Mischung mit der Standardfarbe des Modus) und
// optionaler Farbverlauf (Endfarbe, linear mit Richtung oder radial).
// Dazu je Modus ein reines CSS-Muster (Punkte, Gitter, Linien, Wellen …: Farbe, Abstand,
// Stärke, Deckkraft) und ein Hintergrundbild aus der Mediathek (Abdunkelung,
// Weichzeichner, Deckkraft, fixiert beim Scrollen).
// Gespeichert wird global in media.site (bgColor*, bgOpacity*, bgGradient*,
// bgColor2*, bgGradientType*, bgAngle*, bgPattern*, bgImage*; Suffix Dark =
// Dunkelmodus); leer = Standardfarbe des jeweiligen Modus (wie bisher).

import { $ } from './core';
import {
  state,
  getSiteBg,
  setSiteBg,
  getSiteFx,
  setSiteFx,
  SITE_FX,
  PAGE_BG_DEFAULT,
  siteBgLayerCss,
  siteBgSplit,
  siteBgImageLayer,
  SITE_GRADIENT_TYPES,
  SITE_PATTERNS,
  getSectionStyle,
  setSectionStyle,
  getSectionGap,
  setSectionGap,
  SECTION_GAP_MAX,
  getSiteSection,
  setSiteSection,
  defaultSectionSide,
} from './model';
import { objUrl, openMediaPicker } from './media';
import { mountVueTab } from './islands';
import type { BgService } from '../app/tabs/background/bgData';
import type { ThemeMode } from '../types';

// Bild-URL für die Vorschau auflösen (staged:<id> -> Objekt-URL des Browsers).

function previewUrl(val: string) {
  if (!val) return '';
  if (val.startsWith('staged:')) return objUrl(val.slice(7));
  return val;
}

// Hintergrund-Ebene eines Modus (gemeinsam mit der Tool-Karten-Vorschau, model.ts).
const layerCss = siteBgLayerCss;

// Zustandsgebundene Teile für die Vue-Fassung (app/tabs/background): Lesen und
// Schreiben über die normalisierenden Funktionen aus model-site.ts.

function bgService(): BgService {
  const pick = (title: string, onPick: (url: string) => void): boolean => {
    const srv = (['de', 'en', 'shared'] as const).reduce(
      (n, l) => n + (state.serverFiles[l] || []).length,
      0,
    );
    if (!state.stagedItems.length && !srv) return false;
    openMediaPicker('de', 'bgImage', { allLangs: true, imagesOnly: true, title, onPick });
    return true;
  };
  return {
    bg: getSiteBg,
    setBg: setSiteBg,
    layers: (mode: ThemeMode) => {
      const { ground, overlay } = siteBgSplit(mode);
      return { full: layerCss(mode), ground, overlay, image: siteBgImageLayer(mode, previewUrl) };
    },
    fx: getSiteFx,
    setFx: setSiteFx,
    sectionStyle: getSectionStyle,
    setSectionStyle,
    sectionGap: getSectionGap,
    setSectionGap,
    section: getSiteSection,
    setSection: setSiteSection,
    resolveUrl: previewUrl,
    pick,
    fxList: SITE_FX,
    patterns: SITE_PATTERNS,
    gradientTypes: SITE_GRADIENT_TYPES,
    gapMax: SECTION_GAP_MAX,
    pageBgDefault: PAGE_BG_DEFAULT,
    defaultSectionSide,
  };
}

export function renderBackground() {
  const pane = $('#content');
  // Vue-Insel (app/tabs/background).
  mountVueTab(pane, 'background', { service: bgService() });
}
