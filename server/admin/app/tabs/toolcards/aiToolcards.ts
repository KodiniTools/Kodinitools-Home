import type { ThemeMode } from '../../../types';
import type { AiChange } from '../hero/aiHero';
import type { TcApi } from './useTc';
import type { TcSide, TcStyle, TcText } from './tcData';

/**
 * Einstellungen, die die KI-Beratung im Tab „Tool-Karten“ per Klick setzen darf
 * (Whitelist, im Server-Prompt gespiegelt). Geschrieben wird über `setSide`/`setText`
 * des Tabs: wirkt auf das gerade bearbeitete Design (Standard oder eigenes der Karte).
 */
type SideKey = keyof TcSide;
type TextKey = keyof TcText;
type Def =
  | { kind: 'color'; key: SideKey; label: string }
  | { kind: 'num'; target: 'side'; key: SideKey; label: string; min: number; max: number }
  | { kind: 'num'; target: 'text'; key: TextKey; label: string; min: number; max: number };

const DEFS: Record<string, Def> = {
  borderColor: { kind: 'color', key: 'borderColor', label: 'Rahmenfarbe' },
  bgColor: { kind: 'color', key: 'bgColor', label: 'Hintergrundfarbe' },
  titleColor: { kind: 'color', key: 'titleColor', label: 'Titelfarbe' },
  badgeColor: { kind: 'color', key: 'badgeColor', label: 'Badge-Textfarbe' },
  badgeBgColor: { kind: 'color', key: 'badgeBgColor', label: 'Badge-Hintergrund' },
  openColor: { kind: 'color', key: 'openColor', label: 'Farbe „Öffnen“' },
  descColor: { kind: 'color', key: 'descColor', label: 'Beschreibungsfarbe' },
  bgOpacity: {
    kind: 'num',
    target: 'side',
    key: 'bgOpacity',
    label: 'Hintergrund-Deckkraft (%)',
    min: 0,
    max: 100,
  },
  borderOpacity: {
    kind: 'num',
    target: 'side',
    key: 'borderOpacity',
    label: 'Rahmen-Deckkraft (%)',
    min: 0,
    max: 100,
  },
  borderWidth: {
    kind: 'num',
    target: 'side',
    key: 'borderWidth',
    label: 'Rahmenbreite (px)',
    min: 0,
    max: 8,
  },
  borderRadius: {
    kind: 'num',
    target: 'side',
    key: 'borderRadius',
    label: 'Eckenradius (px)',
    min: 0,
    max: 40,
  },
  titleSize: {
    kind: 'num',
    target: 'text',
    key: 'titleSize',
    label: 'Titel-Schriftgröße (px, 0 = Standard)',
    min: 0,
    max: 40,
  },
  descSize: {
    kind: 'num',
    target: 'text',
    key: 'descSize',
    label: 'Beschreibung-Schriftgröße (px, 0 = Standard)',
    min: 0,
    max: 24,
  },
  badgeSize: {
    kind: 'num',
    target: 'text',
    key: 'badgeSize',
    label: 'Badge-Schriftgröße (px, 0 = Standard)',
    min: 0,
    max: 20,
  },
  openSize: {
    kind: 'num',
    target: 'text',
    key: 'openSize',
    label: '„Öffnen“-Schriftgröße (px, 0 = Standard)',
    min: 0,
    max: 20,
  },
};
const HEX = /^#[0-9a-fA-F]{6}$/;

export interface ResolvedTcChange {
  def: Def;
  mode: ThemeMode | 'both';
  value: string | number;
  label: string;
}

/** Prüft einen KI-Vorschlag; `null` = Feld unbekannt oder Wert/Modus ungültig. */
export function resolveTcChange(c: AiChange): ResolvedTcChange | null {
  const def = DEFS[String(c?.field)];
  if (!def) return null;
  const raw = String(c.value ?? '').trim();
  const mode = String(c.mode ?? '');
  if (def.kind === 'color') {
    if (mode !== 'light' && mode !== 'dark') return null;
    if (!HEX.test(raw)) return null;
    return { def, mode, value: raw.toLowerCase(), label: modeLabel(def.label, mode) };
  }
  if (!/^-?\d+(\.\d+)?$/.test(raw)) return null;
  const value = Math.max(def.min, Math.min(def.max, Math.round(Number(raw))));
  if (def.target === 'text') {
    return { def, mode: 'both', value, label: def.label };
  }
  if (mode !== 'light' && mode !== 'dark') return null;
  return { def, mode, value, label: modeLabel(def.label, mode) };
}

function modeLabel(label: string, mode: ThemeMode): string {
  return `${label} (${mode === 'light' ? 'Hell' : 'Dunkel'})`;
}

export function describeTcCurrent(style: TcStyle, text: TcText, r: ResolvedTcChange): string {
  const v =
    r.def.kind === 'num' && r.def.target === 'text'
      ? text[r.def.key]
      : r.mode === 'both'
        ? undefined
        : style[r.mode][r.def.key as SideKey];
  return v === undefined || v === '' ? '–' : String(v);
}

export function applyTcChange(api: Pick<TcApi, 'setSide' | 'setText'>, r: ResolvedTcChange): void {
  if (r.def.kind === 'num' && r.def.target === 'text') {
    api.setText(r.def.key, r.value as never);
    return;
  }
  if (r.mode === 'both') return;
  api.setSide(r.mode, { [r.def.key]: r.value } as Partial<TcSide>);
}
