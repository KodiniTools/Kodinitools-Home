/*!
 * KodiniTools Heartbeat – misst die echte Verweildauer in einem Tool.
 *
 * Meldet sich alle 30 s mit einem leeren Aufruf auf /__kt_hb, aber NUR wenn
 *   - der Tab sichtbar ist UND der Nutzer in den letzten 2 Minuten aktiv war
 *     (Maus, Tastatur, Scrollen, Touch), ODER
 *   - im Tab gerade Audio/Video abgespielt wird (z. B. Musikplayer im Hintergrund).
 * Nach 4 h ohne Seitenwechsel ist Schluss (vergessene Tabs).
 *
 * Zusätzlich meldet es jede angesehene Seite einmal sofort (/__kt_hb?v=1):
 * beim Laden, bei Seitenwechseln ohne Neuladen (pushState) und beim Zurück-
 * Button aus dem Browser-Cache. Daraus zählt das Dashboard "Besucher (bestätigt)".
 *
 * Datenschutz: keine Cookies, kein Storage, keine IDs, keine Parameter ausser
 * einem Cache-Buster. Der Server sieht nur, was er ohnehin sieht (IP, User-Agent).
 *
 * Einbindung (vor </body>):
 *   <script src="/kt-heartbeat.js" defer></script>
 * Optional anpassen:
 *   <script src="/kt-heartbeat.js" data-interval="30" data-idle="120" defer></script>
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || window.__ktHeartbeat) return;
  window.__ktHeartbeat = true;

  var ENDPOINT = '/__kt_hb';
  var script = document.currentScript;
  var readNum = function (name, fallback) {
    var v = script && parseInt(script.getAttribute(name), 10);
    return v > 0 ? v : fallback;
  };

  var INTERVAL_MS = readNum('data-interval', 30) * 1000; // Heartbeat-Takt
  var IDLE_MS = readNum('data-idle', 120) * 1000;        // Inaktivität, ab der pausiert wird
  var MAX_MS = 4 * 60 * 60 * 1000;                       // Obergrenze pro Seitenaufruf

  var startedAt = Date.now();
  var lastActivity = startedAt;
  var timer = null;

  function markActive() { lastActivity = Date.now(); }

  function isMediaPlaying() {
    var media = document.querySelectorAll('audio, video');
    for (var i = 0; i < media.length; i++) {
      var m = media[i];
      if (!m.paused && !m.ended && m.readyState > 2) return true;
    }
    return false;
  }

  function shouldSend() {
    if (Date.now() - startedAt > MAX_MS) return false;
    if (isMediaPlaying()) return true;
    return document.visibilityState === 'visible' && Date.now() - lastActivity < IDLE_MS;
  }

  // isView: einmalige Ansichts-Meldung ("Seite angesehen") statt Heartbeat
  function send(useBeacon, isView) {
    var url = ENDPOINT + '?' + (isView ? 'v=1&' : '') + 't=' + Date.now();
    try {
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon(url);
        return;
      }
      if (window.fetch) {
        fetch(url, { method: 'GET', cache: 'no-store', credentials: 'omit', keepalive: true })
          .catch(function () { /* Heartbeat ist optional – Fehler ignorieren */ });
        return;
      }
      new Image().src = url;
    } catch { /* nie die Seite stören */ }
  }

  function tick() {
    if (Date.now() - startedAt > MAX_MS) { stop(); return; }
    if (shouldSend()) send(false);
  }

  function start() { if (!timer) timer = setInterval(tick, INTERVAL_MS); }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  ['pointerdown', 'pointermove', 'keydown', 'scroll', 'touchstart', 'wheel'].forEach(function (evt) {
    window.addEventListener(evt, markActive, { passive: true, capture: true });
  });

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') markActive();
  });

  // Letzter Heartbeat beim Verlassen, damit das Session-Ende genau ist
  window.addEventListener('pagehide', function () {
    if (Date.now() - lastActivity < IDLE_MS || isMediaPlaying()) send(true);
  });

  // --- Ansichts-Meldung -------------------------------------------------
  // Sofort beim Laden einmal melden, unabhängig von Aktivität/Verweildauer.
  // Zusätzlich bei Seitenwechseln ohne Neuladen (pushState/popstate, z. B. Vue
  // Router) und bei Rückkehr aus dem Browser-Cache (Zurück-Button, bfcache) –
  // beides erzeugt sonst keinen Eintrag im Access-Log.
  var lastPath = location.pathname;

  function newView() {
    startedAt = Date.now();
    markActive();
    send(true, true);
  }

  function onRouteChange() {
    if (location.pathname === lastPath) return; // nur Query/Hash geändert (z. B. ?lang=en)
    lastPath = location.pathname;
    newView();
    start(); // falls nach 4 h gestoppt
  }

  ['pushState', 'replaceState'].forEach(function (name) {
    var original = history[name];
    if (typeof original !== 'function') return;
    history[name] = function () {
      var result = original.apply(this, arguments);
      try { onRouteChange(); } catch { /* nie die Seite stören */ }
      return result;
    };
  });
  window.addEventListener('popstate', onRouteChange);

  window.addEventListener('pageshow', function (e) {
    if (e.persisted) { lastPath = location.pathname; newView(); start(); }
  });

  send(true, true);
  start();
})();
