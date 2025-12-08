/**
 * KodiniTools Analytics - Google Analytics 4
 * Einbinden mit: <script src="https://kodinitools.com/analytics.js"></script>
 */
(function() {
    'use strict';

    // Bereits geladen? Nicht doppelt ausführen
    if (window.kodiniGA4Loaded) return;
    window.kodiniGA4Loaded = true;

    var GA4_ID = 'G-XRB3KB1549';

    // GA4 Script laden
    var script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    script.async = true;
    document.head.appendChild(script);

    // gtag initialisieren
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA4_ID);
})();
