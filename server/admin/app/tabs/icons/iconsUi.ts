import { reactive, shallowRef } from 'vue';
import type { ThemeMode } from '../../../types';
import { apiGet } from '../../lib/api';
import { normIconLists, type IconCat, type IconLists, type IconRef } from './iconsData';

/**
 * UI-Zustand des Tabs „Icons“ (nicht gespeichert), modulweit, damit Suche,
 * Auswahl und geladene Icon-Liste ein Neu-Mounten überstehen (wie die
 * Modul-Variablen in `public/icons.ts`).
 */
export const iconsUi = reactive<{
  q: string;
  cat: IconCat | '';
  sel: IconRef | null;
  link: string;
  target: string;
  tintMode: ThemeMode;
  openTint: Record<string, boolean>;
}>({
  q: '',
  cat: '',
  sel: null,
  link: '',
  target: 'banner',
  tintMode: 'light',
  openTint: {},
});

/** Geladene Icon-Listen (null = noch nicht geladen). */
export const iconLists = shallowRef<IconLists | null>(null);
export const iconsLoading = shallowRef(false);

/** Lädt die Icon-Liste einmalig (beim ersten Öffnen des Tabs). */
export async function ensureIconsLoaded(): Promise<void> {
  if (iconLists.value || iconsLoading.value) return;
  iconsLoading.value = true;
  const r = await apiGet('/fontawesome');
  iconLists.value = normIconLists(r.ok ? r.data : null);
  iconsLoading.value = false;
}

/** Nur für Tests: Modulzustand zurücksetzen. */
export function resetIconsUi(): void {
  Object.assign(iconsUi, {
    q: '',
    cat: '',
    sel: null,
    link: '',
    target: 'banner',
    tintMode: 'light',
    openTint: {},
  });
  iconLists.value = null;
  iconsLoading.value = false;
}
