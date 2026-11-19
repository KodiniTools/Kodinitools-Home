import type { AiChange } from '../hero/aiHero';
import { SECTION_STYLE_LABEL, type BgService, type FxKey, type SiteBg } from './bgData';

/**
 * Einstellungen, die die KI-Beratung im Tab „Hintergrund“ per Klick setzen darf
 * (Whitelist, im Server-Prompt gespiegelt). Geschrieben wird über die
 * normalisierenden Setter des Services; Werte werden hier vorher geprüft/begrenzt.
 * Bilder (Auswahl/Upload) setzt die KI nie.
 */
type BgKey = keyof SiteBg;
const COLOR: Partial<Record<BgKey, string>> = {
  color: 'Hintergrundfarbe',
  color2: 'Verlauf: Endfarbe',
  patternColor: 'Musterfarbe',
};
const NUM: Partial<Record<BgKey, { label: string; min: number; max: number }>> = {
  opacity: { label: 'Deckkraft (%)', min: 0, max: 100 },
  angle: { label: 'Verlaufswinkel (°)', min: 0, max: 360 },
  patternSpacing: { label: 'Muster-Abstand (px)', min: 4, max: 200 },
  patternThickness: { label: 'Muster-Linienstärke (px)', min: 1, max: 6 },
  patternOpacity: { label: 'Muster-Deckkraft (%)', min: 0, max: 100 },
  imageDarken: { label: 'Bild abdunkeln (%)', min: 0, max: 100 },
  imageBlur: { label: 'Bild weichzeichnen (px)', min: 0, max: 40 },
  imageOpacity: { label: 'Bild-Deckkraft (%)', min: 0, max: 100 },
};
const FX_KEYS: readonly FxKey[] = ['fxAurora', 'fxNoise', 'fxSpotlight'];
const FX_LABEL: Record<FxKey, string> = {
  fxAurora: 'Effekt Aurora',
  fxNoise: 'Effekt Körnung',
  fxSpotlight: 'Effekt Spotlight',
};
const HEX = /^#[0-9a-fA-F]{6}$/;

export interface BgApplicable {
  label: string;
  current: string;
  next: string;
  apply: () => void;
}

function mm(label: string, mode: string): string {
  return `${label} (${mode === 'dark' ? 'Dunkel' : 'Hell'})`;
}

/** Prüft einen KI-Vorschlag; `null` = Feld unbekannt oder Wert/Modus ungültig. */
export function resolveBgChange(c: AiChange, svc: BgService): BgApplicable | null {
  const field = String(c?.field ?? '');
  const raw = String(c?.value ?? '').trim();
  const mode = String(c?.mode ?? '');
  const sideMode = mode === 'light' || mode === 'dark' ? mode : null;

  // ---- global ----
  if (field === 'sectionStyle') {
    if (!(raw in SECTION_STYLE_LABEL)) return null;
    return {
      label: 'Abgesetzte Sektionen: Stil',
      current: svc.sectionStyle(),
      next: raw,
      apply: () => svc.setSectionStyle(raw),
    };
  }
  if (field === 'sectionGap') {
    if (!/^\d+(\.\d+)?$/.test(raw)) return null;
    const v = Math.max(0, Math.min(svc.gapMax, Math.round(Number(raw))));
    return {
      label: 'Abgesetzte Sektionen: Abstand (px)',
      current: String(svc.sectionGap()),
      next: String(v),
      apply: () => svc.setSectionGap(v),
    };
  }
  const fxOn = FX_KEYS.find((k) => k === field);
  if (fxOn) {
    if (raw !== 'true' && raw !== 'false') return null;
    const on = raw === 'true';
    return {
      label: `${FX_LABEL[fxOn]} (ein/aus)`,
      current: svc.fx(fxOn).on ? 'an' : 'aus',
      next: on ? 'an' : 'aus',
      apply: () => svc.setFx(fxOn, { on }),
    };
  }
  const fxInt = FX_KEYS.find((k) => `${k}Intensity` === field);
  if (fxInt) {
    if (!/^\d+(\.\d+)?$/.test(raw)) return null;
    const v = Math.max(0, Math.min(100, Math.round(Number(raw))));
    return {
      label: `${FX_LABEL[fxInt]}: Stärke (%)`,
      current: String(svc.fx(fxInt).intensity),
      next: String(v),
      apply: () => svc.setFx(fxInt, { intensity: v }),
    };
  }

  // ---- je Modus ----
  if (!sideMode) return null;
  const read = (k: BgKey) => String(svc.bg(sideMode)[k] ?? '') || '–';
  const key = field as BgKey;
  if (COLOR[key]) {
    if (!HEX.test(raw)) return null;
    const v = raw.toLowerCase();
    return {
      label: mm(COLOR[key]!, sideMode),
      current: read(key),
      next: v,
      apply: () => svc.setBg(sideMode, { [key]: v }),
    };
  }
  const n = NUM[key];
  if (n) {
    if (!/^-?\d+(\.\d+)?$/.test(raw)) return null;
    const v = Math.max(n.min, Math.min(n.max, Math.round(Number(raw))));
    return {
      label: mm(n.label, sideMode),
      current: read(key),
      next: String(v),
      apply: () => svc.setBg(sideMode, { [key]: v }),
    };
  }
  if (field === 'gradient') {
    if (raw !== 'true' && raw !== 'false') return null;
    const on = raw === 'true';
    return {
      label: mm('Verlauf (ein/aus)', sideMode),
      current: svc.bg(sideMode).gradient ? 'an' : 'aus',
      next: on ? 'an' : 'aus',
      apply: () => svc.setBg(sideMode, { gradient: on }),
    };
  }
  if (field === 'type') {
    if (!svc.gradientTypes.includes(raw)) return null;
    return {
      label: mm('Verlaufsart', sideMode),
      current: read('type'),
      next: raw,
      apply: () => svc.setBg(sideMode, { type: raw }),
    };
  }
  if (field === 'pattern') {
    if (!svc.patterns.includes(raw)) return null;
    return {
      label: mm('Muster', sideMode),
      current: read('pattern'),
      next: raw,
      apply: () => svc.setBg(sideMode, { pattern: raw }),
    };
  }
  return null;
}
