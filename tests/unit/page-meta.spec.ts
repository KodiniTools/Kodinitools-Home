// @vitest-environment happy-dom
/** Seiten-Meta (Titel, Beschreibung, H1 je Seite): Seite, Admin-Modell, Server-Prüfung, Panel, KI-Übernahme. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

const api = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock('../../server/admin/app/lib/api', () => api);

import { getMedia, pageMetaFor, PAGE_META_KEYS } from '../../src/content/content';
import { PAGE_META_KEYS as SERVER_KEYS, validateMedia } from '../../server/admin/src/content';
import {
  normPageMeta,
  PAGE_META_KEYS as ADMIN_KEYS,
  setPageMeta,
  type PageMetaMap,
} from '../../server/admin/public/model-media';
import AiPanel from '../../server/admin/app/tabs/texts/AiPanel.vue';
import PageMetaPanel from '../../server/admin/app/tabs/texts/PageMetaPanel.vue';

describe('Seite', () => {
  it('Standard: keine Seiten-Meta, pageMetaFor liefert leere Werte', () => {
    for (const l of ['de', 'en'] as const)
      for (const p of PAGE_META_KEYS)
        expect(pageMetaFor(l, p)).toEqual({ title: '', description: '', h1: '' });
  });
  it('Seiten-Liste ist in Seite, Server und Admin gleich', () => {
    expect([...SERVER_KEYS]).toEqual([...PAGE_META_KEYS]);
    expect([...ADMIN_KEYS]).toEqual([...PAGE_META_KEYS]);
    expect(getMedia('de').pageMeta).toBeTypeOf('object');
  });
});

describe('Admin-Modell', () => {
  it('normPageMeta: nur bekannte Seiten/Felder, einzeilig, gekürzt', () => {
    expect(
      normPageMeta({
        home: { title: ' A\n B ', h1: 'nicht auf Start', description: '' },
        faq: { h1: 'x'.repeat(300) },
        evil: { title: 'x' },
        blog: 'nein',
      }),
    ).toEqual({ home: { title: 'A B' }, faq: { h1: 'x'.repeat(120) } });
    expect(normPageMeta(null)).toEqual({});
  });
  it('setPageMeta: setzt, leer entfernt Feld und Seite', () => {
    const host: { pageMeta?: PageMetaMap } = {};
    setPageMeta(host, 'faq', 'title', ' FAQ ');
    setPageMeta(host, 'home', 'h1', 'x');
    expect(host.pageMeta).toEqual({ faq: { title: 'FAQ' } });
    setPageMeta(host, 'faq', 'title', '');
    expect(host.pageMeta).toEqual({});
  });
});

describe('Server-Prüfung (validateMedia)', () => {
  it('normalisiert, verwirft leere und unbekannte, lehnt zu lange ab', () => {
    const m = validateMedia({
      de: { pageMeta: { faq: { title: ' T ', description: ' ' }, x: { title: 'a' } } },
      en: {},
    });
    expect(m.de.pageMeta).toEqual({ faq: { title: 'T' } });
    expect(m.en.pageMeta).toEqual({});
    expect(() => validateMedia({ de: { pageMeta: { faq: { title: 'x'.repeat(71) } } } })).toThrow(
      /zu lang/,
    );
    expect(() => validateMedia({ de: { pageMeta: 'x' } })).toThrow(/Objekt/);
  });
});

describe('PageMetaPanel', () => {
  beforeEach(() => setActivePinia(createPinia()));
  it('schreibt in das Medien-Objekt, Startseite ohne H1, Zurücksetzen leert', async () => {
    const media: { pageMeta?: PageMetaMap } = {};
    const w = mount(PageMetaPanel, { props: { lang: 'de', media } });
    expect(w.findAll('[data-pm-field]')).toHaveLength(2);
    await w.get('[data-pm-field="title"] input').setValue('Neuer Titel');
    expect(media.pageMeta).toEqual({ home: { title: 'Neuer Titel' } });
    await w.get('[data-pm-page]').setValue('faq');
    expect(w.findAll('[data-pm-field]')).toHaveLength(3);
    await w.get('[data-pm-page]').setValue('home');
    await w.get('[data-pm-reset]').trigger('click');
    expect(media.pageMeta).toEqual({});
  });
});

describe('AiPanel: SEO-Vorschlag übernehmen', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    api.apiGet.mockReset();
    api.apiPost.mockReset();
  });
  it('gibt Sprache, Seite und Werte an den Tab', async () => {
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
    api.apiPost.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        data: { title: 'T', description: 'D', h1: 'H', keywords: [], reasoning: '' },
      },
    });
    const onApplySeo = vi.fn();
    const w = mount(AiPanel, { props: { onApplySeo } });
    await w.get('[data-ai-toggle]').trigger('click');
    await flushPromises();
    await w.get('[data-ai-lang]').setValue('en');
    await w.get('[data-ai-seo-page]').setValue('FAQ');
    await w.get('[data-ai-seo-text]').setValue('Text');
    await w.get('[data-ai-run]').trigger('click');
    await flushPromises();
    await w.get('[data-ai-seo-target]').setValue('faq');
    await w.get('[data-ai-seo-use]').trigger('click');
    expect(onApplySeo).toHaveBeenCalledWith('en', 'faq', { title: 'T', description: 'D', h1: 'H' });
  });
});
