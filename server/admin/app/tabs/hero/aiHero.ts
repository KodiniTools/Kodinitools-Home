import type { ThemeMode } from '../../../types';
import { clampTypo, type HeroDesign, type HeroTypoNum } from './heroData';

/**
 * Einstellungen des Hero-Designs, die die KI-Beratung per Klick setzen darf.
 * Nur diese Felder (Whitelist, auf dem Server im Prompt gespiegelt); Werte werden
 * hier erneut geprüft und begrenzt, nie ungeprüft übernommen.
 */
export interface AiChange {
  field: string;
  mode: string;
  value: string;
  why: string;
}

type Kind = 'typo' | 'color' | 'percent' | 'bool';
const FIELDS: Record<string, { kind: Kind; label: string }> = {
  titleFontSize: { kind: 'typo', label: 'Schriftgröße Hero-Titel (px, 0 = Standard)' },
  subtitleFontSize: { kind: 'typo', label: 'Schriftgröße Untertitel (px, 0 = Standard)' },
  chipFontSize: { kind: 'typo', label: 'Schriftgröße Chips (px, 0 = Standard)' },
  ctaFontSize: { kind: 'typo', label: 'Schriftgröße Button (px, 0 = Standard)' },
  titleTextColor: { kind: 'color', label: 'Titelfarbe' },
  chipTextColor: { kind: 'color', label: 'Chip-Textfarbe' },
  chipBgColor: { kind: 'color', label: 'Chip-Hintergrund' },
  ctaTextColor: { kind: 'color', label: 'Button-Textfarbe' },
  ctaBgColor: { kind: 'color', label: 'Button-Hintergrund' },
  bgColor: { kind: 'color', label: 'Hero-Hintergrundfarbe' },
  borderColor: { kind: 'color', label: 'Rahmenfarbe' },
  bgOpacity: { kind: 'percent', label: 'Deckkraft Hintergrund (%)' },
  bgImageDarken: { kind: 'percent', label: 'Verdunkelung Hintergrundbild (%)' },
  showTitle: { kind: 'bool', label: 'Hero-Titel anzeigen' },
  showSubtitle: { kind: 'bool', label: 'Hero-Untertitel anzeigen' },
  showChips: { kind: 'bool', label: 'Feature-Chips anzeigen (alle)' },
  showCta: { kind: 'bool', label: 'Hero-Button anzeigen' },
};
const HEX = /^#[0-9a-fA-F]{6}$/;
const CHIP_FIELD = /^chip:([A-Za-z0-9_-]{1,40})$/;
const MODES: readonly ThemeMode[] = ['light', 'dark'];
const MODE_NAME: Record<ThemeMode, string> = { light: 'Hell', dark: 'Dunkel' };

export interface ResolvedChange {
  field: string;
  kind: Kind | 'chip';
  modes: ThemeMode[];
  value: string | number | boolean;
  label: string;
}

/** `true`/`false` (auch „an/aus“, „show/hide“) → Wahrheitswert oder `null`. */
function parseBool(raw: string): boolean | null {
  const v = raw.toLowerCase();
  if (['true', 'an', 'ein', 'show', 'ja', '1'].includes(v)) return true;
  if (['false', 'aus', 'hide', 'nein', '0'].includes(v)) return false;
  return null;
}

/**
 * Prüft einen Vorschlag; liefert die geprüfte Änderung oder `null` (unbekannt/ungültig).
 * `chipKeys` = vorhandene Chip-Schlüssel (Feld `chip:<schlüssel>` blendet einen Chip ein/aus).
 */
export function resolveChange(
  c: AiChange,
  chipKeys: readonly string[] = [],
): ResolvedChange | null {
  const field = String(c?.field);
  const raw = String(c?.value ?? '').trim();
  const chip = CHIP_FIELD.exec(field);
  if (chip) {
    const key = chip[1]!;
    const on = parseBool(raw);
    if (!chipKeys.includes(key) || on === null) return null;
    return { field, kind: 'chip', modes: [], value: on, label: `Chip „${key}“ anzeigen` };
  }
  const def = FIELDS[field];
  if (!def) return null;
  let value: string | number | boolean;
  if (def.kind === 'color') {
    if (!HEX.test(raw)) return null;
    value = raw.toLowerCase();
  } else if (def.kind === 'bool') {
    const on = parseBool(raw);
    if (on === null) return null;
    value = on;
  } else if (def.kind === 'typo') {
    if (/^0+$/.test(raw)) value = 0;
    else {
      value = clampTypo(field as HeroTypoNum, raw);
      if (!value) return null;
    }
  } else {
    if (!/^-?\d+(\.\d+)?$/.test(raw)) return null;
    value = Math.max(0, Math.min(100, Math.round(Number(raw))));
  }
  const modes: ThemeMode[] =
    def.kind === 'color' || def.kind === 'percent'
      ? c.mode === 'light'
        ? ['light']
        : c.mode === 'dark'
          ? ['dark']
          : [...MODES]
      : [];
  return { field, kind: def.kind, modes, value, label: def.label };
}

/** Aktueller Wert zum Anzeigen. */
export function describeCurrent(hd: HeroDesign, r: ResolvedChange): string {
  const rec = hd as unknown as Record<string, unknown>;
  if (r.kind === 'chip') {
    const key = r.field.slice('chip:'.length);
    return (hd.hiddenChips ?? []).includes(key) ? 'ausgeblendet' : 'sichtbar';
  }
  if (r.kind === 'typo') return rec[r.field] ? String(rec[r.field]) : 'Standard';
  if (r.kind === 'bool') return rec[r.field] === false ? 'aus' : 'an';
  return r.modes
    .map(
      (m) =>
        `${MODE_NAME[m]} ${String((hd[m] as unknown as Record<string, unknown>)[r.field] ?? '')}`,
    )
    .join(', ');
}

/** Anzeige des neuen Werts. */
export function describeNext(r: ResolvedChange): string {
  if (r.kind === 'chip' || r.kind === 'bool') return r.value ? 'an' : 'aus';
  if (r.kind === 'typo') return r.value === 0 ? 'Standard' : String(r.value);
  return `${r.modes.map((m) => MODE_NAME[m]).join('/')} ${r.value}`;
}

/** Schreibt die geprüfte Änderung in den Entwurf (Undo/Autosave wie bei jedem Feld). */
export function applyResolved(hd: HeroDesign, r: ResolvedChange): void {
  const rec = hd as unknown as Record<string, unknown>;
  if (r.kind === 'chip') {
    const key = r.field.slice('chip:'.length);
    const hidden = (hd.hiddenChips ?? []).filter((k) => k !== key);
    if (!r.value) hidden.push(key);
    hd.hiddenChips = hidden;
    return;
  }
  if (r.kind === 'typo' || r.kind === 'bool') {
    rec[r.field] = r.value;
    return;
  }
  for (const m of r.modes) (hd[m] as unknown as Record<string, unknown>)[r.field] = r.value;
}

export const AI_HERO_FIELDS = Object.keys(FIELDS);
