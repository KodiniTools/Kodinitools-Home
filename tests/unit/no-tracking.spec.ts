// KodiniTools setzt keine Analyse-, Marketing- oder Tracking-Dienste ein
// (Entscheidung Kodini, 20.11.2026): kein Google Tag Manager, kein gtag,
// kein Cookie-Banner. Einzige externe Google-Anbindung ist die Search Console.
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { describe, expect, it } from 'vitest';

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return p.includes(join('content', 'blog')) ? [] : files(p);
    return /\.(astro|ts|html|json)$/.test(p) ? [p] : [];
  });

const TRACKING = /googletagmanager|GTM-[A-Z0-9]|gtag\(|google-analytics|dataLayer|CookieConsent/;

describe('Kein Tracking', () => {
  it.each([...files(resolve('src')), ...files(resolve('public/partials'))])(
    '%s lädt keinen Tag Manager / kein gtag',
    (f) => {
      expect(readFileSync(f, 'utf-8')).not.toMatch(TRACKING);
    },
  );

  it('Partials bleiben als leere SSI-Ziele erhalten (kein Script, kein Include)', () => {
    for (const f of ['cookie-banner.html', 'consent-mode.html']) {
      const html = readFileSync(resolve('public/partials', f), 'utf-8');
      expect(html).not.toMatch(/<script|<div|#include/);
    }
  });
});
