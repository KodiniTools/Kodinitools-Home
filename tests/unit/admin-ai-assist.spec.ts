// @vitest-environment happy-dom
/** KI-Hilfen in Tool-Karten, Laufband und Icons (API gemockt, nichts wird automatisch geändert). */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

const api = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock('../../server/admin/app/lib/api', () => api);

import AiCardAssist from '../../server/admin/app/tabs/toolcards/AiCardAssist.vue';
import AiTickerAssist from '../../server/admin/app/tabs/ticker/AiTickerAssist.vue';
import AiImagePanel from '../../server/admin/app/tabs/files/AiImagePanel.vue';
import AiDesignAssist from '../../server/admin/app/tabs/hero/AiDesignAssist.vue';
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

describe('AiDesignAssist', () => {
  it('sendet Bereich und Einstellungen, zeigt nur gültige Farben, ändert nichts', async () => {
    answer({
      summary: 'Ruhiger',
      suggestions: [{ title: 'Kontrast', why: 'zu schwach', how: 'Hero-Design → Farben' }],
      colors: [
        { name: 'Blau', hex: '#1166aa', use: 'Akzent' },
        { name: 'Böse', hex: 'red;background:url(x)', use: 'x' },
      ],
      imagePrompt: 'soft gradient',
    });
    const getCurrent = vi.fn(() => '{"x":1}');
    const w = mount(AiDesignAssist, { props: { area: 'background', getCurrent } });
    await w.get('[data-aids-toggle]').trigger('click');
    await flushPromises();
    await w.get('[data-aids-run]').trigger('click');
    await flushPromises();
    expect(api.apiPost.mock.calls[0]?.[1]).toMatchObject({
      task: 'design',
      input: { area: 'background', current: '{"x":1}' },
    });
    expect(w.findAll('[data-aids-suggestion]')).toHaveLength(1);
    expect(w.findAll('[data-aids-color]')).toHaveLength(1);
    expect(w.get('[data-aids-prompt]').text()).toContain('soft gradient');
  });
});

describe('AiImagePanel', () => {
  it('erzeugt erst auf Klick, zeigt Download und reicht die Originaldatei weiter', async () => {
    const png = btoa(String.fromCharCode(137, 80, 78, 71, 13, 10, 26, 10, 1, 2));
    api.apiGet.mockResolvedValue({
      ok: true,
      data: {
        configured: true,
        defaultModel: 'm1',
        aspectRatios: ['1:1', '16:9'],
        models: [{ id: 'm1', label: 'M1', hint: 'h', sizes: ['1K', '2K'], usd: { '1K': 0.067 } }],
      },
    });
    api.apiPost.mockResolvedValue({
      ok: true,
      data: { ok: true, model: 'm1', mime: 'image/png', data: png, bytes: 10 },
    });
    const add = vi.fn();
    const w = mount(AiImagePanel, { props: { add } });
    await w.get('[data-aiimg-toggle]').trigger('click');
    await flushPromises();
    expect(w.get('[data-aiimg-price]').text()).toContain('$');
    expect(w.get('[data-aiimg-run]').attributes('disabled')).toBeDefined();
    await w.get('textarea[data-aiimg-prompt]').setValue('Test');
    await w.get('[data-aiimg-run]').trigger('click');
    await flushPromises();
    expect(api.apiPost).toHaveBeenCalledTimes(1);
    expect(api.apiPost.mock.calls[0]?.[1]).toMatchObject({
      prompt: 'Test',
      model: 'm1',
      size: '1K',
    });
    expect(w.get('[data-aiimg-download]').attributes('download')).toMatch(/\.png$/);
    await w.get('[data-aiimg-use]').trigger('click');
    const file = add.mock.calls[0]?.[0]?.[0] as File;
    expect(file.type).toBe('image/png');
    expect(file.size).toBe(10);
  });
});

describe('AiImagePanel: direkt verwenden', () => {
  it('ruft onUse mit Datei und Ziel auf, ohne add', async () => {
    const png = btoa(String.fromCharCode(137, 80, 78, 71, 13, 10, 26, 10, 1, 2));
    api.apiGet.mockResolvedValue({
      ok: true,
      data: {
        configured: true,
        defaultModel: 'm1',
        aspectRatios: ['16:9', '21:9'],
        models: [{ id: 'm1', label: 'M1', hint: 'h', sizes: ['1K'], usd: { '1K': 0.067 } }],
      },
    });
    api.apiPost.mockResolvedValue({
      ok: true,
      data: { ok: true, model: 'm1', mime: 'image/png', data: png, bytes: 10 },
    });
    const onUse = vi.fn();
    const w = mount(AiImagePanel, {
      props: {
        onUse,
        useLabel: 'Als Banner verwenden',
        defaultAspect: '21:9',
        targets: [
          { value: 'both', label: 'Beide' },
          { value: 'dark', label: 'Dunkel' },
        ],
      },
    });
    await w.get('[data-aiimg-toggle]').trigger('click');
    await flushPromises();
    await w.get('textarea[data-aiimg-prompt]').setValue('Test');
    await w.get('[data-aiimg-run]').trigger('click');
    await flushPromises();
    expect(api.apiPost.mock.calls[0]?.[1]).toMatchObject({ aspectRatio: '21:9' });
    expect(w.get('[data-aiimg-use]').text()).toBe('Als Banner verwenden');
    await w.get('[data-aiimg-use]').trigger('click');
    await flushPromises();
    expect(onUse).toHaveBeenCalledTimes(1);
    expect(onUse.mock.calls[0]?.[0]).toBeInstanceOf(File);
    expect(onUse.mock.calls[0]?.[1]).toBe('both');
  });
});

describe('AiImagePanel: Prompt-Hilfe', () => {
  it('ersetzt den Prompt per Claude und stellt ihn auf Wunsch wieder her', async () => {
    api.apiGet.mockImplementation(async (path: string) =>
      path.startsWith('/gemini')
        ? {
            ok: true,
            data: {
              configured: true,
              defaultModel: 'm1',
              aspectRatios: ['1:1'],
              models: [{ id: 'm1', label: 'M1', hint: 'h', sizes: ['1K'] }],
            },
          }
        : { ok: true, data: CONFIG },
    );
    api.apiPost.mockResolvedValue({
      ok: true,
      data: { ok: true, data: { prompt: 'A calm blue wave, soft light.', notes: 'Licht ergänzt' } },
    });
    const w = mount(AiImagePanel, { props: { add: vi.fn() } });
    await w.get('[data-aiimg-toggle]').trigger('click');
    await flushPromises();
    const ta = w.get('textarea[data-aiimg-prompt]');
    await ta.setValue('blaue Wellen');
    await w.get('[data-aiimg-improve]').trigger('click');
    await flushPromises();
    expect(api.apiPost.mock.calls[0]?.[1]).toMatchObject({
      task: 'imageprompt',
      input: { idea: 'blaue Wellen' },
    });
    expect((ta.element as HTMLTextAreaElement).value).toBe('A calm blue wave, soft light.');
    expect(w.get('[data-aiimg-notes]').text()).toContain('Licht ergänzt');
    await w.get('[data-aiimg-undo]').trigger('click');
    expect((ta.element as HTMLTextAreaElement).value).toBe('blaue Wellen');
    expect(w.find('[data-aiimg-undo]').exists()).toBe(false);
  });
});

describe('compressImage', () => {
  it('liefert das Original, wenn der Browser nicht kodieren kann', async () => {
    const { compressImage } = await import('../../server/admin/app/tabs/files/geminiClient');
    const f = new File([new Uint8Array(10)], 'a.png', { type: 'image/png' });
    const r = await compressImage(f);
    expect(r.compressed).toBe(false);
    expect(r.file).toBe(f);
  });
  it('skaliert, kodiert als WebP und nimmt nur ein kleineres Ergebnis', async () => {
    const { compressImage } = await import('../../server/admin/app/tabs/files/geminiClient');
    const draw = vi.fn();
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 4000, height: 2000, close: vi.fn() })),
    );
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ({ drawImage: draw }),
      toBlob: (cb: (b: Blob | null) => void, type: string) =>
        cb(new Blob([new Uint8Array(100)], { type })),
    };
    const spy = vi.spyOn(document, 'createElement').mockReturnValue(canvas as never);
    try {
      const f = new File([new Uint8Array(5000)], 'x.png', { type: 'image/png' });
      const r = await compressImage(f, { maxWidth: 1000 });
      expect(r.compressed).toBe(true);
      expect(r.file.name).toBe('x.webp');
      expect(r.file.type).toBe('image/webp');
      expect(canvas.width).toBe(1000);
      expect(canvas.height).toBe(500);
      const big = new File([new Uint8Array(50)], 'y.png', { type: 'image/png' });
      expect((await compressImage(big)).compressed).toBe(false);
    } finally {
      spy.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
