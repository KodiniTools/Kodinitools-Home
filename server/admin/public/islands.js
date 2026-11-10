// @ts-check
// Vue-Inseln für einzelne Tabs (Schritt für Schritt migriert, siehe app/).
// Ein Tab nutzt seine Vue-Fassung, wenn die Vue-Teile geladen sind und den Tab
// anbieten; sonst rendert er wie bisher in Vanilla-JS. Notbremse: im Browser
// `localStorage.kodiniAdminLegacy = '1'` erzwingt überall die Vanilla-Fassung.

/** @typedef {{ unmount: () => void }} Handle */

/** @type {Handle | null} */
let current = null;

/** Vanilla-Fassung erzwungen? */
export function legacyForced() {
  try {
    return window.localStorage.getItem('kodiniAdminLegacy') === '1';
  } catch {
    return false;
  }
}

/** Gibt es für den Tab eine Vue-Fassung (und ist sie nicht abgeschaltet)? */
export function hasVueTab(/** @type {string} */ name) {
  const vue = window.kodiniAdminVue;
  return (
    !!vue &&
    Array.isArray(vue.tabs) &&
    vue.tabs.includes(/** @type {any} */ (name)) &&
    !legacyForced()
  );
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

/**
 * Mountet den Tab als Vue-Insel in `el` (ersetzt dessen Inhalt). Rückgabe:
 * true bei Erfolg; false → der Aufrufer rendert die Vanilla-Fassung.
 * @param {Element} el
 * @param {string} name
 * @param {Record<string, unknown>} props
 */
export function mountVueTab(el, name, props) {
  unmountVueTab();
  if (!hasVueTab(name)) return false;
  try {
    el.innerHTML = '';
    current = /** @type {any} */ (window.kodiniAdminVue).mountTab(el, name, props);
    return true;
  } catch (e) {
    console.error('[admin] Vue-Tab fehlgeschlagen, nutze Vanilla-Fassung', e);
    unmountVueTab();
    return false;
  }
}
