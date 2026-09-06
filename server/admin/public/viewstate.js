// Sichtzustand eines Tabs über ein Neu-Rendern (pane.innerHTML = …) hinweg
// erhalten: Scroll-Position der Seite, Scroll-Position der Seitenleisten
// (Hell/Dunkel, eigener Scrollbereich) und Auf-/Zu-Zustand der <details>-
// Abschnitte. Ohne das springt die Ansicht bei jedem Schalter/Klick, der den
// Tab neu zeichnet, nach oben bzw. die Seitenleiste an den Anfang.

// Schlüssel eines <details>: Text der Summary + laufende Nummer bei Dopplungen.
function detailsKeys(pane) {
  const seen = new Map();
  return [...pane.querySelectorAll('details')].map((d) => {
    const base = (d.querySelector(':scope > summary')?.textContent || '').trim();
    const n = seen.get(base) || 0;
    seen.set(base, n + 1);
    return { el: d, key: `${base}#${n}` };
  });
}

/** Zustand vor dem Neu-Rendern erfassen. */
export function captureView(pane) {
  const sides = {};
  pane.querySelectorAll('[data-tcside]').forEach((el) => {
    sides[el.dataset.tcside] = el.scrollTop;
  });
  const details = {};
  for (const { el, key } of detailsKeys(pane)) details[key] = el.open;
  return { scrollY: window.scrollY, sides, details };
}

/** Zustand nach dem Neu-Rendern wiederherstellen (nur bekannte Elemente). */
export function restoreView(pane, snap) {
  if (!snap) return;
  for (const { el, key } of detailsKeys(pane)) {
    if (key in snap.details) el.open = snap.details[key];
  }
  pane.querySelectorAll('[data-tcside]').forEach((el) => {
    const top = snap.sides[el.dataset.tcside];
    if (typeof top === 'number') el.scrollTop = top;
  });
  // Seite: gleiche Position wie vorher (falls der Inhalt kürzer wurde, so weit wie möglich).
  window.scrollTo(0, snap.scrollY);
}

/** Bequemer Wrapper: `render()` zeichnet den Tab neu; Sichtzustand bleibt erhalten. */
export function withView(pane, render) {
  const snap = captureView(pane);
  render();
  restoreView(pane, snap);
}
