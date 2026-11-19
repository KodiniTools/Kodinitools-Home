// „Zuletzt genutzt“ der Startseite: die zuletzt geöffneten Tool-Karten, gespeichert in
// localStorage. Reine Funktionen ohne DOM, damit sie ohne Browser getestet werden können.

export const RECENT_KEY = 'kdt-recent';
export const RECENT_MAX = 5;

/** Liest die Schlüssel; ungültige Einträge und doppelte fallen heraus. */
export function parseRecent(raw: string | null): string[] {
  let data: unknown;
  try {
    data = JSON.parse(raw ?? '[]');
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const keys = data.filter((k): k is string => typeof k === 'string' && k !== '');
  return [...new Set(keys)].slice(0, RECENT_MAX);
}

/** Schlüssel der Favoriten aus dem gespeicherten JSON (Format siehe favorites/favorites.ts). */
export function parseFavoriteKeys(raw: string | null): string[] {
  try {
    const data: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(data)) return [];
    return data.flatMap((e: unknown) =>
      e &&
      typeof e === 'object' &&
      typeof (e as { key?: unknown }).key === 'string' &&
      (e as { key: string }).key
        ? [(e as { key: string }).key]
        : [],
    );
  } catch {
    return [];
  }
}

/** Setzt den Schlüssel an den Anfang (ohne Doppelte), höchstens RECENT_MAX Einträge. */
export function pushRecent(list: readonly string[], key: string): string[] {
  return [key, ...list.filter((k) => k !== key)].slice(0, RECENT_MAX);
}
