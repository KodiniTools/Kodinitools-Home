// @vitest-environment happy-dom
/** KI-Vorschläge im Hero-Design: Whitelist, Begrenzung, Anwenden in den Entwurf. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';

const api = vi.hoisted(() => ({ apiGet: vi.fn(), apiPost: vi.fn() }));
vi.mock('../../server/admin/app/lib/api', () => api);

import AiDesignAssist from '../../server/admin/app/tabs/hero/AiDesignAssist.vue';
import {
  applyResolved,
  describeCurrent,
  resolveChange,
} from '../../server/admin/app/tabs/hero/aiHero';
import type { HeroDesign } from '../../server/admin/app/tabs/hero/heroData';

const hd = () =>
  ({
    titleFontSize: 14,
    light: { titleTextColor: '#111111', bgOpacity: 80 },
    dark: { titleTextColor: '#eeeeee', bgOpacity: 60 },
  }) as unknown as HeroDesign;

describe('aiHero', () => {
  it('lehnt unbekannte Felder und ungültige Werte ab', () => {
    const c = (field: string, value: string, mode = 'light') => ({ field, value, mode, why: '' });
    expect(resolveChange(c('enabled', 'true'))).toBeNull();
    expect(resolveChange(c('titleTextColor', 'red;x'))).toBeNull();
    expect(resolveChange(c('titleTextColor', '#abc'))).toBeNull();
    expect(resolveChange(c('titleFontSize', 'abc', 'both'))).toBeNull();
    expect(resolveChange(c('bgOpacity', 'viel'))).toBeNull();
  });

  it('begrenzt Zahlen und normalisiert Farben', () => {
    const c = (field: string, value: string, mode: string) => ({ field, value, mode, why: '' });
    expect(resolveChange(c('titleFontSize', '500', 'both'))?.value).toBe(96);
    expect(resolveChange(c('bgOpacity', '140', 'dark'))?.value).toBe(100);
    expect(resolveChange(c('titleTextColor', '#AABBCC', 'light'))?.value).toBe('#aabbcc');
    expect(resolveChange(c('titleTextColor', '#aabbcc', 'both'))?.modes).toEqual(['light', 'dark']);
  });

  it('beschreibt den aktuellen Wert und schreibt nur das gewählte Feld/Modus', () => {
    const d = hd();
    const typo = resolveChange({ field: 'titleFontSize', mode: 'both', value: '24', why: '' })!;
    expect(describeCurrent(d, typo)).toBe('14');
    applyResolved(d, typo);
    expect(d.titleFontSize).toBe(24);
    const col = resolveChange({
      field: 'titleTextColor',
      mode: 'dark',
      value: '#ffffff',
      why: '',
    })!;
    applyResolved(d, col);
    expect(d.dark.titleTextColor).toBe('#ffffff');
    expect(d.light.titleTextColor).toBe('#111111');
  });
});

describe('AiDesignAssist: Anwenden', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    api.apiGet.mockResolvedValue({
      ok: true,
      data: { configured: true, defaultModel: 'm', maxBatchItems: 1, models: [], tasks: [] },
    });
    api.apiPost.mockResolvedValue({
      ok: true,
      data: {
        ok: true,
        data: {
          summary: 'x',
          suggestions: [],
          colors: [],
          imagePrompt: '',
          changes: [
            { field: 'titleFontSize', mode: 'both', value: '24', why: 'zu klein' },
            { field: 'evil', mode: 'both', value: '1', why: '' },
          ],
        },
      },
    });
  });

  it('wendet erst auf Klick an, jede Änderung nur einmal, ungültige werden gezählt', async () => {
    const d = hd();
    const w = mount(AiDesignAssist, {
      props: {
        area: 'hero',
        getCurrent: () => '{}',
        resolve: (c) => {
          const r = resolveChange(c);
          return r
            ? {
                label: r.label,
                current: describeCurrent(d, r),
                next: String(r.value),
                apply: () => applyResolved(d, r),
              }
            : null;
        },
      },
    });
    await w.get('[data-aids-toggle]').trigger('click');
    await flushPromises();
    await w.get('[data-aids-run]').trigger('click');
    await flushPromises();
    expect(d.titleFontSize).toBe(14);
    expect(w.findAll('[data-aids-change]')).toHaveLength(1);
    expect(w.get('[data-aids-changes]').text()).toContain('nicht anwendbar');
    await w.get('[data-aids-apply]').trigger('click');
    expect(d.titleFontSize).toBe(24);
    expect(w.get('[data-aids-apply]').attributes('disabled')).toBeDefined();
  });
});

import {
  applyLayoutChange,
  describeLayoutCurrent,
  resolveLayoutChange,
} from '../../server/admin/app/tabs/layout/aiLayout';
import { readBannerText } from '../../server/admin/app/tabs/layout/layoutData';

describe('aiLayout', () => {
  const c = (field: string, value: string) => ({ field, value, mode: 'both', why: '' });

  it('prüft Auswahlwerte, Zahlen und Farben', () => {
    expect(resolveLayoutChange(c('textAnim', 'spin'))).toBeNull();
    expect(resolveLayoutChange(c('textAnimSpeed', 'fast'))?.value).toBe('fast');
    expect(resolveLayoutChange(c('textAnimIntensity', '99'))?.value).toBe('10');
    expect(resolveLayoutChange(c('textColor', 'url(x)'))).toBeNull();
    expect(resolveLayoutChange(c('heroBannerText', 'Hallo'))).toBeNull();
  });

  it('schaltet die Animation ab und begrenzt die Stärke im Datenmodell', () => {
    const m: Record<string, unknown> = {
      heroBannerTextAnim: 'pulse',
      heroBannerTextAnimIntensity: 7,
    };
    const r = resolveLayoutChange(c('textAnim', 'none'))!;
    expect(describeLayoutCurrent(readBannerText(m), r)).toBe('pulse');
    applyLayoutChange(m, r);
    expect(m.heroBannerTextAnim).toBe('none');
    applyLayoutChange(m, resolveLayoutChange(c('textAnimIntensity', '2'))!);
    expect(m.heroBannerTextAnimIntensity).toBe(2);
  });
});
