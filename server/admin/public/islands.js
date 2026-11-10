// @ts-check
// Vue-Inseln der Tabs (app/tabs/…). Die Vue-Teile (`npm run build:admin` →
// server/admin/dist, ausgeliefert unter ./app/) lädt admin.js parallel zum
// Start. Bis sie da sind, zeigt der Tab einen Ladehinweis; fehlen sie (nicht
// gebaut), einen Fehlerhinweis statt einer leeren Seite.

/** @typedef {{ unmount: () => void }} Handle */

/** @type {Handle | null} */
let current = null;
/** Grund, falls die Vue-Teile nicht geladen werden konnten. */
let loadError = '';

/** Vue-Teile konnten nicht geladen werden (admin.js, dynamischer Import). */
export function markVueMissing(/** @type {unknown} */ err) {
  loadError = String((err && /** @type {any} */ (err).message) || err || 'unbekannt');
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
function notice(/** @type {Element} */ el, /** @type {string} */ text, error = false) {
  const p = document.createElement('p');
  p.className = error ? 'err' : 'hint';
  p.setAttribute('role', error ? 'alert' : 'status');
  p.textContent = text;
  el.replaceChildren(p);
}

/**
 * Mountet den Tab als Vue-Insel in `el` (ersetzt dessen Inhalt). Rückgabe:
 * true bei Erfolg; false → Lade- oder Fehlerhinweis wird angezeigt (sind die
 * Vue-Teile später da, rendert admin.js den Tab neu).
 * @param {Element} el
 * @param {string} name
 * @param {Record<string, unknown>} props
 */
export function mountVueTab(el, name, props) {
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
  if (!vue.tabs.includes(/** @type {any} */ (name))) {
    notice(el, `Unbekannter Tab „${name}“.`, true);
    return false;
  }
  try {
    el.replaceChildren();
    current = vue.mountTab(el, /** @type {any} */ (name), props);
    return true;
  } catch (e) {
    console.error('[admin] Vue-Tab fehlgeschlagen', e);
    unmountVueTab();
    notice(el, 'Dieser Bereich konnte nicht geladen werden (Details in der Konsole).', true);
    return false;
  }
}
