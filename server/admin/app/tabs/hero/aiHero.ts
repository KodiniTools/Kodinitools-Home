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

type Kind = 'typo' | 'color' | 'percent';
const FIELDS: Record<string, { kind: Kind; label: string }> = {
  titleFontSize: { kind: 'typo', label: 'Schriftgröße Hero-Titel (px)' },
  subtitleFontSize: { kind: 'typo', label: 'Schriftgröße Untertitel (px)' },
  chipFontSize: { kind: 'typo', label: 'Schriftgröße Chips (px)' },
  ctaFontSize: { kind: 'typo', label: 'Schriftgröße Button (px)' },
  titleTextColor: { kind: 'color', label: 'Titelfarbe' },
  chipTextColor: { kind: 'color', label: 'Chip-Textfarbe' },
  chipBgColor: { kind: 'color', label: 'Chip-Hintergrund' },
  ctaTextColor: { kind: 'color', label: 'Button-Textfarbe' },
  ctaBgColor: { kind: 'color', label: 'Button-Hintergrund' },
  bgColor: { kind: 'color', label: 'Hero-Hintergrundfarbe' },
  borderColor: { kind: 'color', label: 'Rahmenfarbe' },
  bgOpacity: { kind: 'percent', label: 'Deckkraft Hintergrund (%)' },
  bgImageDarken: { kind: 'percent', label: 'Verdunkelung Hintergrundbild (%)' },
};
const HEX = /^#[0-9a-fA-F]{6}$/;
const MODES: readonly ThemeMode[] = ['light', 'dark'];
const MODE_NAME: Record<ThemeMode, string> = { light: 'Hell', dark: 'Dunkel' };

export interface ResolvedChange {
  field: string;
  kind: Kind;
  modes: ThemeMode[];
  value: string | number;
  label: string;
}

/** Prüft einen Vorschlag; liefert die geprüfte Änderung oder `null` (unbekannt/ungültig). */
export function resolveChange(c: AiChange): ResolvedChange | null {
  const def = FIELDS[String(c?.field)];
  if (!def) return null;
  const raw = String(c.value ?? '').trim();
  let value: string | number;
  if (def.kind === 'color') {
    if (!HEX.test(raw)) return null;
    value = raw.toLowerCase();
  } else if (def.kind === 'typo') {
    value = clampTypo(c.field as HeroTypoNum, raw);
    if (!value) return null;
  } else {
    if (!/^-?\d+(\.\d+)?$/.test(raw)) return null;
    value = Math.max(0, Math.min(100, Math.round(Number(raw))));
  }
  const modes: ThemeMode[] =
    def.kind === 'typo'
      ? []
      : c.mode === 'light'
        ? ['light']
        : c.mode === 'dark'
          ? ['dark']
          : [...MODES];
  return { field: c.field, kind: def.kind, modes, value, label: def.label };
}

/** Aktueller Wert zum Anzeigen („Hell …, Dunkel …“ oder eine Zahl). */
export function describeCurrent(hd: HeroDesign, r: ResolvedChange): string {
  if (r.kind === 'typo') {
    const v = (hd as unknown as Record<string, number>)[r.field];
    return v ? String(v) : 'Standard';
  }
  return r.modes
    .map(
      (m) =>
        `${MODE_NAME[m]} ${String((hd[m] as unknown as Record<string, unknown>)[r.field] ?? '')}`,
    )
    .join(', ');
}

/** Schreibt die geprüfte Änderung in den Entwurf (Undo/Autosave wie bei jedem Feld). */
export function applyResolved(hd: HeroDesign, r: ResolvedChange): void {
  if (r.kind === 'typo') {
    (hd as unknown as Record<string, number>)[r.field] = r.value as number;
    return;
  }
  for (const m of r.modes) (hd[m] as unknown as Record<string, string | number>)[r.field] = r.value;
}

export const AI_HERO_FIELDS = Object.keys(FIELDS);
