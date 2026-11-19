// @vitest-environment happy-dom
/** KI liest Seiten per URL: URL-Prüfung, HTML-Auswertung, Abruf (gemockt), Panel sendet die URL. */
import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

const api = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock('../../server/admin/app/lib/api', () => api);

import { extractPage, fetchPage, parseSiteUrl } from '../../server/admin/src/pageFetch';
import { withPages } from '../../server/admin/src/ai';
import { buildUserPrompt } from '../../server/admin/src/aiTasks';
import AiPanel from '../../server/admin/app/tabs/texts/AiPanel.vue';
import { parseBatchBlocks } from '../../server/admin/app/tabs/texts/aiClient';

const HTML = `<!doctype html><html lang="de"><head><title>Alt &amp; Titel</title>
<meta content="Alte Beschreibung" name="description"><style>p{}</style></head>
<body><nav>Menü</nav><script>var x = "<h1>nein</h1>"</script>
<h1>Über&shy;schrift <span>eins</span></h1><p>Erster Absatz mit genug Text für die Auswertung.</p>
<footer>Fuß</footer></body></html>`;
const res = (body: string, init: ResponseInit = {}) =>
  new Response(body, { headers: { 'content-type': 'text/html; charset=utf-8' }, ...init });

describe('parseSiteUrl', () => {
  it('lässt nur https auf der eigenen Domain zu', () => {
    expect(parseSiteUrl(' https://kodinitools.com/faq/#x ').href).toBe(
      'https://kodinitools.com/faq/',
    );
    for (const bad of [
      'http://kodinitools.com/',
      'https://evil.example/',
      'https://kodinitools.com.evil.example/',
      'https://kodinitools.com:8443/',
      'https://user@kodinitools.com/',
      'https://127.0.0.1/',
      'file:///etc/passwd',
      '',
      5,
    ])
      expect(() => parseSiteUrl(bad)).toThrow();
  });
});

describe('extractPage', () => {
  it('liest Titel, Beschreibung, H1 und Text ohne Skripte/Navigation', () => {
    const p = extractPage(HTML, 'https://kodinitools.com/');
    expect(p.title).toBe('Alt & Titel');
    expect(p.description).toBe('Alte Beschreibung');
    expect(p.lang).toBe('de');
    expect(p.h1).toHaveLength(1);
    expect(p.h1[0]).toContain('eins');
    expect(p.text).toContain('Erster Absatz');
    expect(p.text).not.toMatch(/Menü|Fuß|nein|var x/);
  });
  it('wertet die gebaute Startseite aus, falls vorhanden', () => {
    let html: string;
    try {
      html = readFileSync('dist/index.html', 'utf8');
    } catch {
      return;
    }
    const p = extractPage(html, 'https://kodinitools.com/');
    expect(p.title).toContain('KodiniTools');
    expect(p.description.length).toBeGreaterThan(50);
    expect(p.text.length).toBeGreaterThan(500);
  });
});

describe('fetchPage', () => {
  it('holt die Seite und folgt Weiterleitungen nur innerhalb der Domain', async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: '/faq/' } }))
      .mockResolvedValueOnce(res(HTML));
    const p = await fetchPage('https://kodinitools.com/faq', f as never);
    expect(p.url).toBe('https://kodinitools.com/faq/');
    expect(f.mock.calls[0]?.[1]).toMatchObject({ redirect: 'manual' });
    const evil = vi
      .fn()
      .mockResolvedValue(
        new Response(null, { status: 302, headers: { location: 'https://evil.example/' } }),
      );
    await expect(fetchPage('https://kodinitools.com/', evil as never)).rejects.toThrow(
      /kodinitools/,
    );
  });
  it('meldet Fehlerstatus, Nicht-HTML und leere Seiten', async () => {
    const f = (r: Response) => vi.fn().mockResolvedValue(r) as never;
    await expect(
      fetchPage('https://kodinitools.com/x', f(res('', { status: 404 }))),
    ).rejects.toThrow(/404/);
    await expect(
      fetchPage(
        'https://kodinitools.com/x',
        f(new Response('{}', { headers: { 'content-type': 'application/json' } })),
      ),
    ).rejects.toThrow(/HTML/);
    await expect(
      fetchPage('https://kodinitools.com/x', f(res('<html><body><div id="app"></div></body>'))),
    ).rejects.toThrow(/kaum lesbarer Text/);
  });
});

describe('withPages', () => {
  const page = extractPage(HTML, 'https://kodinitools.com/faq/');
  it('SEO: füllt Text und aktuellen Stand aus der URL; eigener Text hat Vorrang', async () => {
    const load = vi.fn().mockResolvedValue(page);
    const i = (await withPages(
      'seo',
      { lang: 'de', url: 'https://kodinitools.com/faq/' },
      load,
    )) as Record<string, string>;
    expect(i.text).toContain('Erster Absatz');
    expect(i.current).toContain('Titel: Alt & Titel');
    expect(buildUserPrompt('seo', i)).toContain('Aktuell: Titel: Alt & Titel');
    await withPages('seo', { lang: 'de', url: 'https://x', page: 'P', text: 'T' }, load);
    expect(load).toHaveBeenCalledTimes(1);
  });
  it('Vergleich: lädt DE und EN', async () => {
    const load = vi.fn().mockResolvedValue(page);
    const i = (await withPages('compare', { deUrl: 'a', enUrl: 'b' }, load)) as Record<
      string,
      string
    >;
    expect(load).toHaveBeenCalledTimes(2);
    expect(buildUserPrompt('compare', i)).toContain('Erster Absatz');
  });
});

describe('Panel und Batch', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    api.apiGet.mockReset();
    api.apiPost.mockReset();
  });
  it('Seitenwahl füllt die URL, gesendet wird nur die URL', async () => {
    api.apiGet.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        configured: true,
        defaultModel: 'm',
        maxBatchItems: 100,
        models: [{ id: 'm', label: 'M', hint: '' }],
        tasks: [{ id: 'seo', label: 'SEO', effort: 'medium' }],
      },
    });
    api.apiPost.mockResolvedValue({ ok: true, status: 200, data: { ok: true, data: {} } });
    const w = mount(AiPanel);
    await w.get('[data-ai-toggle]').trigger('click');
    await flushPromises();
    await w.get('[data-ai-run]').trigger('click');
    expect(w.get('[data-ai-form-error]').text()).toContain('Seite wählen');
    expect(api.apiPost).not.toHaveBeenCalled();
    await w.get('[data-ai-seo-pick]').setValue('donate');
    await w.get('[data-ai-lang]').setValue('en');
    await flushPromises();
    await w.get('[data-ai-run]').trigger('click');
    await flushPromises();
    expect(api.apiPost.mock.calls[0]?.[1]).toMatchObject({
      task: 'seo',
      input: { lang: 'en', url: 'https://kodinitools.com/en/donate/' },
    });
  });
  it('Batch: eine Adresse je Eintrag', () => {
    expect(parseBatchBlocks('seo', 'de', 'https://kodinitools.com/faq/\n---\nName\nText')).toEqual([
      { lang: 'de', url: 'https://kodinitools.com/faq/' },
      { lang: 'de', page: 'Name', text: 'Text' },
    ]);
    expect(parseBatchBlocks('compare', 'de', 'https://a/\n===\nEnglish text')).toEqual([
      { deUrl: 'https://a/', en: 'English text' },
    ]);
  });
});
