/**
 * KodiniTools Analytics - Google Tag Manager
 * Einbinden mit: <script src="https://kodinitools.com/analytics.js"></script>
 *
 * Für vollständige Funktionalität (inkl. noscript-Fallback) füge auch folgendes
 * direkt nach dem öffnenden <body>-Tag ein:
 * <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T7NS656K"
 * height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
 */
(function() {
    'use strict';

    // Bereits geladen? Nicht doppelt ausführen
    if (window.kodiniGTMLoaded) return;
    window.kodiniGTMLoaded = true;

    var GTM_ID = 'GTM-T7NS656K';

    // GTM initialisieren
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'gtm.start': new Date().getTime(),
        event: 'gtm.js'
    });

    // GTM Script laden
    var f = document.getElementsByTagName('script')[0];
    var j = document.createElement('script');
    j.async = true;
    j.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    f.parentNode.insertBefore(j, f);
})();
