// Vue-Inseln der Tabs (app/tabs/…). Die Vue-Teile (`npm run build:admin` →
// server/admin/dist, ausgeliefert unter ./app/) lädt admin.ts parallel zum
// Start. Bis sie da sind, zeigt der Tab einen Ladehinweis; fehlen sie (nicht
// gebaut), einen Fehlerhinweis statt einer leeren Seite.

import type { VueTabName } from '../app/bridge';

export type Handle = { unmount: () => void };

let current: Handle | null = null;
/** Grund, falls die Vue-Teile nicht geladen werden konnten. */
let loadError = '';

/** Vue-Teile konnten nicht geladen werden (admin.ts, dynamischer Import). */
export function markVueMissing(err: unknown) {
  loadError = String((err as { message?: unknown } | null)?.message || err || 'unbekannt');
  console.error('[admin] Vue-Teile nicht geladen', err);
}

/** Hängt die aktuell gemountete Tab-Insel ab (vor jedem Tab-Wechsel/Neu-Rendern). */
export function unmountVueTab() {
  if (!current) return;
  try {
    current.unmount();
  } catch (e) {
    console.warn('[admin] Vue-Tab konnte nicht abgehängt werden', e);
  }
  current = null;
}

/** Lade- bzw. Fehlerhinweis anstelle des Tabs. */
function notice(el: Element, text: string, error = false) {
  const p = document.createElement('p');
  p.className = error ? 'err' : 'hint';
  p.setAttribute('role', error ? 'alert' : 'status');
  p.textContent = text;
  el.replaceChildren(p);
}

/**
 * Mountet den Tab als Vue-Insel in `el` (ersetzt dessen Inhalt). Rückgabe:
 * true bei Erfolg; false → Lade- oder Fehlerhinweis wird angezeigt (sind die
 * Vue-Teile später da, rendert admin.ts den Tab neu).
 */
export function mountVueTab(el: Element, name: string, props: Record<string, unknown>) {
  unmountVueTab();
  const vue = window.kodiniAdminVue;
  if (!vue) {
    if (loadError)
      notice(
        el,
        `Admin-Oberfläche nicht verfügbar: Die Vue-Teile fehlen (auf dem Server „npm run build:admin“ ausführen). Details: ${loadError}`,
        true,
      );
    else notice(el, 'Admin-Oberfläche wird geladen …');
    return false;
  }
  if (!vue.tabs.includes(name as VueTabName)) {
    notice(el, `Unbekannter Tab „${name}“.`, true);
    return false;
  }
  try {
    el.replaceChildren();
    current = vue.mountTab(el, name as VueTabName, props);
    return true;
  } catch (e) {
    console.error('[admin] Vue-Tab fehlgeschlagen', e);
    unmountVueTab();
    notice(el, 'Dieser Bereich konnte nicht geladen werden (Details in der Konsole).', true);
    return false;
  }
}
