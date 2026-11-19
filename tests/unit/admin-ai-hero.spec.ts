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

describe('erweitertes Anwenden (Chips, Anzeigen, Link, Text)', () => {
  const c = (field: string, value: string) => ({ field, value, mode: 'both', why: '' });
  const chipDesign = () =>
    ({
      titleFontSize: 14,
      showChips: true,
      hiddenChips: ['free', 'privacy'],
      light: {},
      dark: {},
    }) as unknown as HeroDesign;

  it('blendet einzelne Chips ein/aus, nur für vorhandene Schlüssel', () => {
    const keys = ['free', 'privacy', 'noInstall'];
    expect(resolveChange(c('chip:unbekannt', 'true'), keys)).toBeNull();
    expect(resolveChange(c('chip:free', 'vielleicht'), keys)).toBeNull();
    const d = chipDesign();
    const show = resolveChange(c('chip:free', 'true'), keys)!;
    expect(describeCurrent(d, show)).toBe('ausgeblendet');
    applyResolved(d, show);
    expect(d.hiddenChips).toEqual(['privacy']);
    applyResolved(d, resolveChange(c('chip:noInstall', 'false'), keys)!);
    expect(d.hiddenChips).toEqual(['privacy', 'noInstall']);
  });

  it('Anzeigen-Schalter und Schriftgröße „0“ = Standard', () => {
    const d = chipDesign();
    applyResolved(d, resolveChange(c('showChips', 'false'))!);
    expect(d.showChips).toBe(false);
    const std = resolveChange(c('titleFontSize', '0'))!;
    expect(std.value).toBe(0);
    applyResolved(d, std);
    expect(d.titleFontSize).toBe(0);
    expect(describeCurrent(d, std)).toBe('Standard');
    expect(resolveChange(c('showChips', 'x'))).toBeNull();
  });

  it('Layout: Link nur intern oder https, Text ohne HTML', () => {
    expect(resolveLayoutChange(c('bannerLink', '/de/audiokonverter/'))?.value).toBe(
      '/de/audiokonverter/',
    );
    expect(resolveLayoutChange(c('bannerLink', 'https://kodinitools.com/'))).not.toBeNull();
    expect(resolveLayoutChange(c('bannerLink', '//evil.example'))).toBeNull();
    expect(resolveLayoutChange(c('bannerLink', 'javascript:alert(1)'))).toBeNull();
    expect(resolveLayoutChange(c('bannerLink', 'http://x.de'))).toBeNull();
    expect(resolveLayoutChange(c('text', '<b>Hi</b>'))).toBeNull();
    expect(resolveLayoutChange(c('text', 'x'.repeat(200)))).toBeNull();
    const m: Record<string, unknown> = {};
    applyLayoutChange(m, resolveLayoutChange(c('bannerLink', '/en/tools/'))!);
    expect(m.heroBannerLink).toBe('/en/tools/');
    applyLayoutChange(m, resolveLayoutChange(c('text', 'Kostenlose Browser-Tools'))!);
    expect(m.heroBannerText).toBe('Kostenlose Browser-Tools');
  });
});

describe('aiToolcards', () => {
  const c = (field: string, mode: string, value: string) => ({ field, mode, value, why: '' });
  it('prüft Farben, Modi und begrenzt Zahlen', async () => {
    const { resolveTcChange } = await import('../../server/admin/app/tabs/toolcards/aiToolcards');
    expect(resolveTcChange(c('bgColor', 'dark', '#112233'))?.value).toBe('#112233');
    expect(resolveTcChange(c('bgColor', 'both', '#112233'))).toBeNull();
    expect(resolveTcChange(c('bgColor', 'light', 'red'))).toBeNull();
    expect(resolveTcChange(c('borderRadius', 'light', '99'))?.value).toBe(40);
    expect(resolveTcChange(c('titleSize', 'both', '99'))?.value).toBe(40);
    expect(resolveTcChange(c('titleSize', 'light', '20'))?.mode).toBe('both');
    expect(resolveTcChange(c('evil', 'light', '1'))).toBeNull();
  });
  it('schreibt über setSide/setText', async () => {
    const { resolveTcChange, applyTcChange } =
      await import('../../server/admin/app/tabs/toolcards/aiToolcards');
    const setSide = vi.fn();
    const setText = vi.fn();
    applyTcChange({ setSide, setText } as never, resolveTcChange(c('borderWidth', 'dark', '3'))!);
    applyTcChange({ setSide, setText } as never, resolveTcChange(c('descSize', 'both', '14'))!);
    expect(setSide).toHaveBeenCalledWith('dark', { borderWidth: 3 });
    expect(setText).toHaveBeenCalledWith('descSize', 14);
  });
});

describe('aiBackground', () => {
  const c = (field: string, mode: string, value: string) => ({ field, mode, value, why: '' });
  function svc() {
    return {
      bg: vi.fn(() => ({ color: '#ffffff', gradient: false, type: 'linear', pattern: 'none' })),
      setBg: vi.fn(),
      fx: vi.fn(() => ({ on: false, intensity: 50 })),
      setFx: vi.fn(),
      sectionStyle: () => 'band',
      setSectionStyle: vi.fn(),
      sectionGap: () => 0,
      setSectionGap: vi.fn(),
      gapMax: 160,
      gradientTypes: ['linear', 'radial'],
      patterns: ['none', 'dots'],
    } as never;
  }
  it('prüft Werte und Modi', async () => {
    const { resolveBgChange } = await import('../../server/admin/app/tabs/background/aiBackground');
    const s = svc();
    expect(resolveBgChange(c('color', 'dark', '#ABCDEF'), s)?.next).toBe('#abcdef');
    expect(resolveBgChange(c('color', 'both', '#abcdef'), s)).toBeNull();
    expect(resolveBgChange(c('color', 'light', 'blue'), s)).toBeNull();
    expect(resolveBgChange(c('imageBlur', 'light', '99'), s)?.next).toBe('40');
    expect(resolveBgChange(c('pattern', 'light', 'evil'), s)).toBeNull();
    expect(resolveBgChange(c('type', 'light', 'radial'), s)?.next).toBe('radial');
    expect(resolveBgChange(c('sectionGap', 'both', '500'), s)?.next).toBe('160');
    expect(resolveBgChange(c('sectionStyle', 'both', 'x'), s)).toBeNull();
    expect(resolveBgChange(c('image', 'light', '/x.png'), s)).toBeNull();
  });
  it('schreibt über die Service-Setter', async () => {
    const { resolveBgChange } = await import('../../server/admin/app/tabs/background/aiBackground');
    const s = svc() as unknown as {
      setBg: ReturnType<typeof vi.fn>;
      setFx: ReturnType<typeof vi.fn>;
    };
    resolveBgChange(c('opacity', 'dark', '40'), s as never)!.apply();
    resolveBgChange(c('fxNoiseIntensity', 'both', '30'), s as never)!.apply();
    resolveBgChange(c('fxAurora', 'both', 'true'), s as never)!.apply();
    expect(s.setBg).toHaveBeenCalledWith('dark', { opacity: 40 });
    expect(s.setFx).toHaveBeenCalledWith('fxNoise', { intensity: 30 });
    expect(s.setFx).toHaveBeenCalledWith('fxAurora', { on: true });
  });
});
