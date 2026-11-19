// @vitest-environment happy-dom
/** KI-Hilfen in Tool-Karten, Laufband und Icons (API gemockt, nichts wird automatisch geändert). */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

const api = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock('../../server/admin/app/lib/api', () => api);

import AiCardAssist from '../../server/admin/app/tabs/toolcards/AiCardAssist.vue';
import AiTickerAssist from '../../server/admin/app/tabs/ticker/AiTickerAssist.vue';
import AiIconAssist from '../../server/admin/app/tabs/icons/AiIconAssist.vue';

const CONFIG = {
  configured: true,
  defaultModel: 'claude-opus-5-5',
  maxBatchItems: 100,
  models: [{ id: 'claude-opus-5-5', label: 'Opus 5.5', hint: 'Beste Qualität' }],
  tasks: [],
};

function answer(data: Record<string, unknown>) {
  api.apiGet.mockResolvedValue({ ok: true, data: CONFIG });
  api.apiPost.mockResolvedValue({ ok: true, data: { ok: true, data, costUsd: 0.01 } });
}

beforeEach(() => {
  setActivePinia(createPinia());
  api.apiGet.mockReset();
  api.apiPost.mockReset();
});

describe('AiTickerAssist', () => {
  it('liefert Vorschläge, fügt erst auf Klick hinzu', async () => {
    answer({ items: ['Neu: A', 'Neu: B'], notes: '' });
    const add = vi.fn();
    const w = mount(AiTickerAssist, { props: { lang: 'de', current: ['alt'], onAdd: add } });
    await w.get('[data-aitk-toggle]').trigger('click');
    await flushPromises();
    await w.get('[data-aitk-run]').trigger('click');
    await flushPromises();
    expect(api.apiPost.mock.calls[0]?.[1]).toMatchObject({ task: 'ticker' });
    expect(add).not.toHaveBeenCalled();
    expect(w.findAll('[data-aitk-item]')).toHaveLength(2);
    await w.get('[data-aitk-add]').trigger('click');
    expect(add).toHaveBeenCalledWith('Neu: A');
  });
});

describe('AiCardAssist', () => {
  it('übernimmt nur auf Klick einzelne Felder', async () => {
    answer({ title: 'T2', badge: 'B2', description: 'D2', notes: 'prüfen' });
    const apply = vi.fn();
    const w = mount(AiCardAssist, {
      props: { lang: 'de', current: { title: 'T', badge: '', description: 'D' }, onApply: apply },
    });
    await w.get('[data-aicard-toggle]').trigger('click');
    await flushPromises();
    await w.get('[data-aicard-run]').trigger('click');
    await flushPromises();
    expect(api.apiPost.mock.calls[0]?.[1]).toMatchObject({ task: 'card' });
    expect(apply).not.toHaveBeenCalled();
    expect(w.find('[data-aicard-result]').exists()).toBe(true);
    await w.get('[data-aicard-apply]').trigger('click');
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply.mock.calls[0]?.[0]).toBe('title');
    expect(apply.mock.calls[0]?.[1]).toBe('T2');
  });
});

describe('AiIconAssist', () => {
  it('zeigt Suchbegriffe, Klick ruft die Suche auf', async () => {
    answer({ terms: ['scissors', 'cut'], reasoning: 'Schneiden' });
    const search = vi.fn();
    const w = mount(AiIconAssist, {
      props: { tools: [{ key: 'tools.cutter', title: 'Cutter' }], search, hits: () => 3 },
    });
    await w.get('[data-aiic-toggle]').trigger('click');
    await flushPromises();
    await w.get('select[data-aiic-tool]').setValue('tools.cutter');
    await w.get('[data-aiic-run]').trigger('click');
    await flushPromises();
    expect(api.apiPost.mock.calls[0]?.[1]).toMatchObject({ task: 'icon' });
    const chips = w.findAll('[data-aiic-term]');
    expect(chips).toHaveLength(2);
    await chips[0]!.trigger('click');
    expect(search).toHaveBeenCalledWith('scissors');
  });
});
