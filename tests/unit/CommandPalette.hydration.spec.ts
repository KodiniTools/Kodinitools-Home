// @vitest-environment happy-dom
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CommandPalette from '../../src/islands/palette/CommandPalette.vue';

/**
 * Regression 20.11.2026: Das Island wird per client:idle hydriert. Ein `<Teleport to="body">`
 * im SSR-Markup hydriert gegen das erste Kind von <body>; seit dort kein GTM-<noscript>
 * mehr steht, ist das der Seiten-Container #app – Vue meldete einen Mismatch und entfernte
 * ihn, die Startseite war leer.
 */
const props = {
  lang: 'de' as const,
  entries: [{ key: 'tools.cutter', keywords: ['schneiden'], formats: ['mp3'] }],
  texts: {
    trigger: 'Tool finden', keyHint: 'Strg K', keyHintMac: '⌘ K', title: 'Tools durchsuchen',
    placeholder: 'Suchen', noResults: 'Nichts gefunden', favorites: 'Favoriten',
    recent: 'Zuletzt genutzt', all: 'Alle Tools', results: 'Treffer', help: 'Hilfe', close: 'Schließen',
  },
};

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('CommandPalette – Hydration', () => {
  it('lässt den Seiteninhalt in <body> bei der Hydration unangetastet', async () => {
    const ssr = await renderToString(createSSRApp({ render: () => h(CommandPalette, props) }));
    document.body.innerHTML = `<div id="app"><p id="content">Inhalt</p><div id="island">${ssr}</div></div>`;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    createSSRApp({ render: () => h(CommandPalette, props) }).mount('#island');
    await Promise.resolve();

    expect(document.getElementById('app')).not.toBeNull();
    expect(document.getElementById('content')?.textContent).toBe('Inhalt');
    expect(document.querySelector('#island .cmdk-trigger')).not.toBeNull();
    const msgs = [...warn.mock.calls, ...error.mock.calls].map((c) => String(c[0]));
    expect(msgs.filter((m) => /mismatch/i.test(m))).toEqual([]);
  });
});
