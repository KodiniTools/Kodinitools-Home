// Favoriten der Startseite: Datenmodell und reine Funktionen (ohne DOM),
// damit sie ohne Browser getestet werden können. Gespeichert in localStorage.

export const FAV_KEY = 'kdt-favorites';

/** Gespeicherter Favorit – Felder wie bisher, damit bestehende Einträge gültig bleiben. */
export interface FavoriteItem {
  /** i18n-Schlüssel der Karte, z. B. „tools.audioConverter“. */
  key: string;
  title: string;
  description: string;
  link: string;
  badge: string;
  /** Icon-Pfad; leer = kein Icon. */
  svg: string;
}

const isText = (value: unknown): value is string => typeof value === 'string';

/**
 * Liest die gespeicherte Liste. Ungültige Einträge (z. B. das alte Format mit
 * reinen Strings) und im Admin ausgeblendete Karten fallen heraus.
 */
export function parseFavorites(
  raw: string | null,
  hiddenKeys: ReadonlySet<string>,
): FavoriteItem[] {
  let data: unknown;
  try {
    data = JSON.parse(raw ?? '[]');
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  return data
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    .filter((entry) => isText(entry.key) && entry.key !== '' && !hiddenKeys.has(entry.key))
    .map((entry) => ({
      key: entry.key as string,
      title: isText(entry.title) ? entry.title : '',
      description: isText(entry.description) ? entry.description : '',
      link: isText(entry.link) ? entry.link : '#',
      badge: isText(entry.badge) ? entry.badge : '',
      svg: isText(entry.svg) ? entry.svg : '',
    }));
}

/** Fügt den Favoriten hinzu bzw. entfernt ihn (neue Liste, Reihenfolge bleibt). */
export function toggleFavorite(list: readonly FavoriteItem[], item: FavoriteItem): FavoriteItem[] {
  return list.some((f) => f.key === item.key)
    ? list.filter((f) => f.key !== item.key)
    : [...list, item];
}

export const serializeFavorites = (list: readonly FavoriteItem[]): string => JSON.stringify(list);
