// @vitest-environment happy-dom
/** KI-Assistent im Tab „Texte“: Batch-Parser, Ergebnistext und Panel-Ablauf (API gemockt). */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

const api = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock('../../server/admin/app/lib/api', () => api);

import AiPanel from '../../server/admin/app/tabs/texts/AiPanel.vue';
import {
  formatUsd,
  parseBatchBlocks,
  resultToText,
} from '../../server/admin/app/tabs/texts/aiClient';

const CONFIG = {
  configured: true,
  defaultModel: 'claude-opus-5-5',
  maxBatchItems: 100,
  models: [
    { id: 'claude-opus-5-5', label: 'Opus 5.5', hint: 'Beste Qualität' },
    { id: 'claude-haiku-5-5', label: 'Haiku 5.5', hint: 'Günstig' },
  ],
  tasks: [
    { id: 'seo', label: 'SEO-Vorschlag', effort: 'medium' },
    { id: 'compare', label: 'Vergleich', effort: 'medium' },
    { id: 'blog', label: 'Blog', effort: 'medium' },
  ],
};

describe('aiClient', () => {
  it('parseBatchBlocks: SEO, Vergleich, Blog, Fehler', () => {
    expect(parseBatchBlocks('seo', 'de', 'Start\nText A\n---\nTools\nText B')).toEqual([
      { lang: 'de', page: 'Start', text: 'Text A' },
      { lang: 'de', page: 'Tools', text: 'Text B' },
    ]);
    expect(parseBatchBlocks('compare', 'de', 'Hallo\n===\nHello')).toEqual([
      { de: 'Hallo', en: 'Hello' },
    ]);
    expect(parseBatchBlocks('blog', 'en', 'Thema 1\n---\n\n---\nThema 2')).toEqual([
      { lang: 'en', topic: 'Thema 1' },
      { lang: 'en', topic: 'Thema 2' },
    ]);
    expect(() => parseBatchBlocks('seo', 'de', 'nur Name')).toThrow(/Eintrag 1/);
    expect(() => parseBatchBlocks('compare', 'de', 'ohne Trenner')).toThrow(/===/);
  });

  it('formatUsd und resultToText', () => {
    expect(formatUsd(undefined)).toBe('–');
    expect(formatUsd(0.004)).toBe('< 0,01 $');
    expect(formatUsd(1.5)).toBe('1,50 $');
    expect(
      resultToText('seo', {
        title: 'T',
        description: 'D',
        h1: 'H',
        keywords: ['a', 'b'],
        reasoning: 'R',
      }),
    ).toBe('Titel: T\nBeschreibung: D\nH1: H\nKeywords: a, b\nBegründung: R');
    expect(resultToText('seo', undefined)).toBe('');
  });
});

describe('AiPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    api.apiGet.mockReset();
    api.apiPost.mockReset();
    try {
      localStorage.clear();
    } catch {
      /* egal */
    }
  });

  it('lädt erst nach dem Öffnen, zeigt Modelle', async () => {
    api.apiGet.mockResolvedValue({ ok: true, status: 200, data: CONFIG });
    const w = mount(AiPanel);
    expect(api.apiGet).not.toHaveBeenCalled();
    await w.get('[data-ai-toggle]').trigger('click');
    await flushPromises();
    expect(api.apiGet).toHaveBeenCalledWith('/ai/config');
    const options = w
      .get('[data-ai-model]')
      .findAll('option')
      .map((o) => o.text());
    expect(options).toEqual(['Opus 5.5', 'Haiku 5.5']);
  });

  it('warnt ohne Schlüssel und sperrt den Start', async () => {
    api.apiGet.mockResolvedValue({ ok: true, status: 200, data: { ...CONFIG, configured: false } });
    const w = mount(AiPanel);
    await w.get('[data-ai-toggle]').trigger('click');
    await flushPromises();
    expect(w.find('[data-ai-unconfigured]').exists()).toBe(true);
    expect(w.get('[data-ai-run]').attributes('disabled')).toBeDefined();
  });

  it('zeigt Ladefehler', async () => {
    api.apiGet.mockResolvedValue({ ok: false, status: 401, data: { error: 'Nicht angemeldet' } });
    const w = mount(AiPanel);
    await w.get('[data-ai-toggle]').trigger('click');
    await flushPromises();
    expect(w.get('[data-ai-error]').text()).toContain('Nicht angemeldet');
  });

  it('Sofort: sendet Modell/Aufwand/Eingabe und zeigt Ergebnis mit Kosten', async () => {
    api.apiGet.mockResolvedValue({ ok: true, status: 200, data: CONFIG });
    api.apiPost.mockResolvedValue({
      ok: true,
      status: 200,
      data: {
        ok: true,
        costUsd: 0.05,
        data: { title: 'T', description: 'D', h1: 'H', keywords: ['k'], reasoning: 'R' },
      },
    });
    const w = mount(AiPanel);
    await w.get('[data-ai-toggle]').trigger('click');
    await flushPromises();
    await w.get('[data-ai-model]').setValue('claude-haiku-5-5');
    await w.get('[data-ai-seo-page]').setValue('Start');
    await w.get('[data-ai-seo-text]').setValue('Inhalt');
    await w.get('[data-ai-run]').trigger('click');
    await flushPromises();
    expect(api.apiPost).toHaveBeenCalledWith('/ai/run', {
      task: 'seo',
      model: 'claude-haiku-5-5',
      effort: 'medium',
      input: { lang: 'de', page: 'Start', text: 'Inhalt' },
    });
    expect(w.get('[data-ai-result]').text()).toContain('Titel: T');
    expect(w.get('[data-ai-total]').text()).toContain('0,05 $');
  });

  it('Batch: Eingabefehler lokal, sonst Start, Status und Ergebnisse', async () => {
    api.apiGet.mockImplementation(async (path: string) => {
      if (path === '/ai/config') return { ok: true, status: 200, data: CONFIG };
      if (path.startsWith('/ai/batch/results')) {
        return {
          ok: true,
          status: 200,
          data: {
            id: 'msgbatch_1',
            totalCostUsd: 0.02,
            results: [
              {
                ok: true,
                customId: 'seo-0',
                data: { title: 'X', description: 'Y', h1: 'Z', keywords: [], reasoning: '' },
              },
            ],
          },
        };
      }
      return {
        ok: true,
        status: 200,
        data: { id: 'msgbatch_1', status: 'ended', counts: { succeeded: 1 } },
      };
    });
    api.apiPost.mockResolvedValue({
      ok: true,
      status: 202,
      data: { id: 'msgbatch_1', count: 1, status: 'in_progress' },
    });
    const w = mount(AiPanel);
    await w.get('[data-ai-toggle]').trigger('click');
    await flushPromises();
    await w.get('[data-ai-mode]').findAll('button')[1]!.trigger('click');
    await w.get('[data-ai-batch-raw]').setValue('nur Name');
    await w.get('[data-ai-run]').trigger('click');
    await flushPromises();
    expect(w.get('[data-ai-form-error]').text()).toContain('Eintrag 1');
    expect(api.apiPost).not.toHaveBeenCalled();

    await w.get('[data-ai-batch-raw]').setValue('Start\nText');
    await w.get('[data-ai-run]').trigger('click');
    await flushPromises();
    expect(api.apiPost).toHaveBeenCalledWith('/ai/batch', {
      task: 'seo',
      model: 'claude-opus-5-5',
      effort: 'medium',
      items: [{ lang: 'de', page: 'Start', text: 'Text' }],
    });
    await w.get('[data-ai-job-check]').trigger('click');
    await flushPromises();
    expect(api.apiGet).toHaveBeenCalledWith(
      '/ai/batch/results?id=msgbatch_1&model=claude-opus-5-5',
    );
    expect(w.get('[data-ai-job-status]').text()).toContain('Fertig');
    expect(w.get('[data-ai-result]').text()).toContain('Titel: X');
    w.unmount();
  });
});
