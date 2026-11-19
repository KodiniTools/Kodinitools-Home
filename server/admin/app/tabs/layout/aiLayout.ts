import type { AiChange } from '../hero/aiHero';
import {
  ANIM_LABEL,
  ANIM_SPEED_LABEL,
  setBannerText,
  type BannerHost,
  type BannerText,
  type BannerTextField,
} from './layoutData';

/**
 * Banner-Text-Einstellungen, die die KI-Beratung im Layout per Klick setzen darf
 * (Whitelist, auf dem Server im Prompt gespiegelt). Geschrieben wird über
 * `setBannerText`, das Werte begrenzt; Auswahlwerte und Farben werden vorher geprüft.
 */
type Kind = 'anim' | 'speed' | 'int' | 'color' | 'text' | 'link';
const FIELDS: Record<string, { kind: Kind; label: string; min?: number; max?: number }> = {
  text: { kind: 'text', label: 'Banner-Text (echter Text auf dem Banner)' },
  bannerLink: { kind: 'link', label: 'Banner-Verlinkung' },
  textAnim: { kind: 'anim', label: 'Banner-Text: Animation' },
  textAnimSpeed: { kind: 'speed', label: 'Banner-Text: Animationsgeschwindigkeit' },
  textAnimIntensity: {
    kind: 'int',
    label: 'Banner-Text: Animationsstärke (1–10)',
    min: 1,
    max: 10,
  },
  textSize: {
    kind: 'int',
    label: 'Banner-Text: Schriftgröße (px, 0 = automatisch)',
    min: 0,
    max: 96,
  },
  textOpacity: { kind: 'int', label: 'Banner-Text: Deckkraft (%)', min: 0, max: 100 },
  textColor: { kind: 'color', label: 'Banner-Text: Farbe' },
};
const HEX = /^#[0-9a-fA-F]{6}$/;
const MAX_TEXT = 120;
const MAX_LINK = 300;

export interface ResolvedLayoutChange {
  field: BannerTextField | 'bannerLink';
  label: string;
  value: string;
}

export function resolveLayoutChange(c: AiChange): ResolvedLayoutChange | null {
  const def = FIELDS[String(c?.field)];
  if (!def) return null;
  const raw = String(c.value ?? '').trim();
  let value: string;
  switch (def.kind) {
    case 'anim':
      if (!(raw in ANIM_LABEL)) return null;
      value = raw;
      break;
    case 'speed':
      if (!(raw in ANIM_SPEED_LABEL)) return null;
      value = raw;
      break;
    case 'text':
      if (!raw || raw.length > MAX_TEXT || /[<>]/.test(raw)) return null;
      value = raw;
      break;
    case 'link':
      // Intern („/pfad“, nicht „//host“) oder https; wie die Verlinkung im Tab.
      if (raw.length > MAX_LINK || /\s/.test(raw)) return null;
      if (!(/^\/(?!\/)/.test(raw) || /^https:\/\/[^\s/]+/i.test(raw))) return null;
      value = raw;
      break;
    case 'color':
      if (!HEX.test(raw)) return null;
      value = raw.toLowerCase();
      break;
    default: {
      if (!/^-?\d+(\.\d+)?$/.test(raw)) return null;
      value = String(Math.max(def.min ?? 0, Math.min(def.max ?? 100, Math.round(Number(raw)))));
    }
  }
  return { field: c.field as ResolvedLayoutChange['field'], label: def.label, value };
}

export function describeLayoutCurrent(
  t: BannerText,
  r: ResolvedLayoutChange,
  m?: BannerHost,
): string {
  if (r.field === 'bannerLink') return m?.heroBannerLink || '(leer)';
  const v = (t as unknown as Record<string, unknown>)[r.field];
  return v === undefined || v === '' ? '–' : String(v);
}

export function applyLayoutChange(m: BannerHost, r: ResolvedLayoutChange): void {
  if (r.field === 'bannerLink') {
    m.heroBannerLink = r.value;
    return;
  }
  setBannerText(m, r.field, r.value);
}
