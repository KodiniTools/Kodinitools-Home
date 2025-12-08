/**
 * KodiniTools Analytics - Externe Datei für alle Seiten
 * Einbinden mit: <script src="https://kodinitools.com/analytics.js"></script>
 * WICHTIG: Im <head> einbinden, so früh wie möglich!
 */
(function() {
    'use strict';

    // Konfiguration
    var CONFIG = {
        cookieYesId: 'c3b1b93b905c8f6eb636babb',
        gtmId: 'GTM-T7NS656K',
        ga4Id: 'G-XRB3KB1549'
    };

    // Bereits geladen? Nicht doppelt ausführen
    if (window.kodiniAnalyticsLoaded) return;
    window.kodiniAnalyticsLoaded = true;

    // 1. DataLayer initialisieren
    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;

    // 2. Google Consent Mode v2 - Defaults setzen (DSGVO)
    gtag('consent', 'default', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
        ad_personalization: 'denied',
        ad_user_data: 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted'
    });

    // 3. CookieYes laden
    var ckyScript = document.createElement('script');
    ckyScript.id = 'cookieyes';
    ckyScript.src = 'https://cdn-cookieyes.com/client_data/' + CONFIG.cookieYesId + '/script.js';
    ckyScript.async = true;
    document.head.appendChild(ckyScript);

    // 4. Google Tag Manager laden
    (function(w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
        var f = d.getElementsByTagName(s)[0],
            j = d.createElement(s),
            dl = l != 'dataLayer' ? '&l=' + l : '';
        j.async = true;
        j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
        f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', CONFIG.gtmId);

    // 5. GTM noscript fallback einfügen (für SEO)
    document.addEventListener('DOMContentLoaded', function() {
        if (!document.querySelector('noscript[data-gtm]')) {
            var noscript = document.createElement('noscript');
            noscript.setAttribute('data-gtm', 'true');
            var iframe = document.createElement('iframe');
            iframe.src = 'https://www.googletagmanager.com/ns.html?id=' + CONFIG.gtmId;
            iframe.height = '0';
            iframe.width = '0';
            iframe.style.display = 'none';
            iframe.style.visibility = 'hidden';
            noscript.appendChild(iframe);
            document.body.insertBefore(noscript, document.body.firstChild);
        }
    });

    // 6. GA4 laden (nur nach Consent)
    function loadGA4() {
        if (window.ga4Loaded) return;
        window.ga4Loaded = true;

        var script = document.createElement('script');
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + CONFIG.ga4Id;
        script.async = true;
        document.head.appendChild(script);

        script.onload = function() {
            gtag('js', new Date());
            gtag('config', CONFIG.ga4Id);
            console.log('[KodiniTools] GA4 geladen');
        };
    }

    // 7. CookieYes Consent Event Listener
    document.addEventListener('cookieyes_consent_update', function(event) {
        var consent = event.detail;
        if (consent && consent.accepted && consent.accepted.includes('analytics')) {
            gtag('consent', 'update', {
                analytics_storage: 'granted'
            });
            loadGA4();
        }
    });

    // 8. Prüfen ob bereits Consent gegeben wurde (wiederkehrende Besucher)
    function checkExistingConsent() {
        var ckyConsent = document.cookie.match(/cookieyes-consent=([^;]+)/);
        if (ckyConsent) {
            try {
                var consent = decodeURIComponent(ckyConsent[1]);
                if (consent.includes('analytics:yes')) {
                    gtag('consent', 'update', {
                        analytics_storage: 'granted'
                    });
                    loadGA4();
                }
            } catch (e) {
                console.warn('[KodiniTools] Consent cookie parse error:', e);
            }
        }
    }

    // Bei DOM ready prüfen
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkExistingConsent);
    } else {
        checkExistingConsent();
    }

    console.log('[KodiniTools] Analytics initialisiert');
})();
