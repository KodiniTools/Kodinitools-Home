/**
 * KodiniTools Analytics - GA4 Integration für alle Seiten
 *
 * WICHTIG: Diese Datei enthält NUR den GA4-Teil!
 * CookieYes + GTM müssen DIREKT im HTML stehen (siehe unten).
 *
 * Fügen Sie diesen Code in jede Seite ein:
 *
 * IM <head> (ganz oben):
 * ========================
 * <script id="cookieyes" src="https://cdn-cookieyes.com/client_data/c3b1b93b905c8f6eb636babb/script.js"></script>
 * <script>
 *   window.dataLayer = window.dataLayer || [];
 *   function gtag(){dataLayer.push(arguments);}
 *   gtag('consent','default',{
 *     ad_storage:'denied', analytics_storage:'denied',
 *     ad_personalization:'denied', ad_user_data:'denied',
 *     functionality_storage:'granted', security_storage:'granted'
 *   });
 * </script>
 * <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
 *   new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
 *   j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
 *   'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
 * })(window,document,'script','dataLayer','GTM-T7NS656K');</script>
 *
 * NACH <body>:
 * ========================
 * <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-T7NS656K"
 *   height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
 * <script src="https://kodinitools.com/analytics.js"></script>
 */
(function() {
    'use strict';

    // Bereits geladen? Nicht doppelt ausführen
    if (window.kodiniGA4Loaded) return;
    window.kodiniGA4Loaded = true;

    var GA4_ID = 'G-XRB3KB1549';

    // GA4 laden
    function loadGA4() {
        if (window.ga4Loaded) return;
        window.ga4Loaded = true;

        var script = document.createElement('script');
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
        script.async = true;
        document.head.appendChild(script);

        script.onload = function() {
            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', GA4_ID);
        };
    }

    // CookieYes Consent Event
    document.addEventListener('cookieyes_consent_update', function(event) {
        var consent = event.detail;
        if (consent && consent.accepted && consent.accepted.includes('analytics')) {
            if (window.gtag) {
                gtag('consent', 'update', { analytics_storage: 'granted' });
            }
            loadGA4();
        }
    });

    // Prüfen ob bereits Consent gegeben wurde
    function checkExistingConsent() {
        var ckyConsent = document.cookie.match(/cookieyes-consent=([^;]+)/);
        if (ckyConsent) {
            try {
                var consent = decodeURIComponent(ckyConsent[1]);
                if (consent.includes('analytics:yes')) {
                    loadGA4();
                }
            } catch (e) {}
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkExistingConsent);
    } else {
        checkExistingConsent();
    }
})();
