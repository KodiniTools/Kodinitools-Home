// @vitest-environment happy-dom
/**
 * Tab „Texte“ als Vue-Insel (server/admin/app/tabs/texts): gleiche Regeln wie
 * die frühere Vanilla-Fassung (model-hero.ts) und Änderungen
 * landen direkt in den übergebenen state-Objekten (Autosave/Undo per Snapshot).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TextsTab from '../../server/admin/app/tabs/texts/TextsTab.vue';
import { textsUi } from '../../server/admin/app/tabs/texts/textsUi';
import {
  TEXT_FIELDS,
  UNIFORM_TEXT_KEYS,
  clampFx,
  clampTextSize,
  copyColors,
  copyStylesDeToEn,
  effectiveTextStyle,
  ensureTextStyle,
  fxActive,
  previewText,
  readTextStyle,
  slotPreviewStyle,
  type TextStyleHost,
} from '../../server/admin/app/tabs/texts/textStyle';
import { useToastStore } from '../../server/admin/app/stores/toast';
import {
  state,
  defaultMedia,
  getTextStyle,
  getEffectiveTextStyle,
  UNIFORM_TEXT_KEYS as VANILLA_KEYS,
} from '../../server/admin/public/model';
import type { Overrides } from '../../server/admin/types';

const clone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T;

describe('textStyle (Regeln wie model-hero.ts / textstyle.js)', () => {
  it('Slots entsprechen UNIFORM_TEXT_KEYS der Vanilla-Fassung', () => {
    expect([...UNIFORM_TEXT_KEYS]).toEqual(VANILLA_KEYS);
    expect(TEXT_FIELDS.map((f) => f.path.join('.'))).toEqual(VANILLA_KEYS);
  });

  it('ensureTextStyle legt an und migriert wie getTextStyle', () => {
    state.media = defaultMedia();
    state.media.de.textStyles = { 'tools.sectionTitle': { size: 30, color: '#123456' } } as never;
    const host = clone(state.media.de) as TextStyleHost;
    const a = getTextStyle('de', 'tools.sectionTitle');
    const b = ensureTextStyle(host, 'tools.sectionTitle');
    expect(b).toEqual(a);
    expect(b.colorLight).toBe('#123456');
    expect('color' in b).toBe(false);
    expect(ensureTextStyle(host, 'imageTools.sectionTitle')).toEqual(
      getTextStyle('de', 'imageTools.sectionTitle'),
    );
  });

  it('readTextStyle/effectiveTextStyle verändern den Zustand nicht', () => {
    const host: TextStyleHost = { textStyles: {}, textStyleUniform: false };
    const before = clone(host);
    readTextStyle(host, 'tools.sectionTitle');
    effectiveTextStyle(host, 'imageTools.sectionTitle');
    expect(host).toEqual(before);
  });

  it('effectiveTextStyle nutzt bei „Standard für alle Slots“ den Master (wie Vanilla)', () => {
    state.media = defaultMedia();
    const m = state.media.de;
    m.textStyles = {
      'tools.sectionTitle': { size: 10, colorLight: '#111111', colorDark: '', font: '' },
      'imageTools.sectionTitle': { size: 50, colorLight: '#222222', colorDark: '', font: '' },
    } as never;
    m.textStyleUniform = true;
    m.textStyleUniformKey = 'imageTools.sectionTitle';
    const host = clone(m) as TextStyleHost;
    for (const k of UNIFORM_TEXT_KEYS) {
      expect(effectiveTextStyle(host, k)).toEqual(getEffectiveTextStyle('de', k));
      expect(effectiveTextStyle(host, k).size).toBe(50);
    }
    host.textStyleUniform = false;
    expect(effectiveTextStyle(host, 'tools.sectionTitle').size).toBe(10);
  });

  it('Vorschau-Stil wie die frühere Vanilla-Fassung (ohne eigene Schrift)', () => {
    // Erwartete Werte stammen aus dem Paritätstest gegen public/textstyle.js
    // (bis zur Entfernung der Vanilla-Tabs).
    const base =
      'line-height:1.25;font-weight:700;display:inline-block;max-width:100%;white-space:pre-line;word-break:break-word';
    const light = 'color:#013f7a;-webkit-text-fill-color:#013f7a';
    const dark = 'color:#f9f2d5;-webkit-text-fill-color:#f9f2d5';
    const cases: [Record<string, unknown>, string, string][] = [
      [{}, `font-size:22px;${base}`, ''],
      [
        { size: 5, shadow: true, shadowColor: '#abc', shadowX: 3, shadowY: -4, shadowBlur: 9 },
        `font-size:12px;${base}`,
        ';text-shadow:3px -4px 9px rgba(170, 187, 204, 0.6)',
      ],
      [
        { strokeWidth: 1.5, strokeColor: '#ffffff', opacity: 40 },
        `font-size:22px;${base}`,
        ';opacity:0.4;-webkit-text-stroke:1.5px #ffffff',
      ],
      [
        { anim: 'pulse', animIntensity: 7, animSpeed: 'fast' },
        `font-size:22px;${base}`,
        ';--anim-dur:1s;--anim-scale:1.140',
      ],
    ];
    for (const [v, head, fx] of cases) {
      const host: TextStyleHost = { textStyles: { k: v as never } };
      const st = readTextStyle(host, 'k');
      expect(slotPreviewStyle(st, 'light', '')).toBe(`${head};${light}${fx}`);
      expect(slotPreviewStyle(st, 'dark', '')).toBe(`${head};${dark}${fx}`);
    }
  });

  it('Begrenzungen wie applyFxField und Textgröße 0–120', () => {
    expect(clampTextSize('500')).toBe(120);
    expect(clampTextSize('-3')).toBe(0);
    expect(clampTextSize('x')).toBe(0);
    expect(clampFx('shadowX', '-99')).toBe(-50);
    expect(clampFx('shadowY', 'x')).toBe(2);
    expect(clampFx('shadowBlur', '99')).toBe(40);
    expect(clampFx('strokeWidth', '1.3')).toBe(1.5);
    expect(clampFx('opacity', '')).toBe(100);
    expect(clampFx('animIntensity', '0')).toBe(1);
  });

  it('fxActive, previewText, Farben kopieren, DE → EN', () => {
    expect(fxActive(readTextStyle({}, 'x'))).toBe(false);
    expect(fxActive(readTextStyle({ textStyles: { x: { opacity: 90 } } }, 'x'))).toBe(true);
    expect(previewText('  ', 'Standard', 'Label')).toBe('Standard');
    expect(previewText(undefined, undefined, 'Label')).toBe('Label');
    expect(previewText('Eigen', 'Standard', 'Label')).toBe('Eigen');

    const m: TextStyleHost = {
      textStyles: { 'tools.sectionTitle': { colorLight: '#aaaaaa', colorDark: '' } },
    };
    expect(copyColors(m, 'light')).toBe('dark');
    expect(m.textStyles!['tools.sectionTitle']!.colorDark).toBe('#aaaaaa');

    const de: TextStyleHost = {
      textStyles: { 'tools.sectionTitle': { size: 33 }, 'hero.title': { size: 5 } },
      textStyleUniform: true,
      textStyleUniformKey: 'tools.sectionTitle',
    };
    const en: TextStyleHost = {
      textStyles: { 'imageTools.sectionTitle': { size: 9 }, 'hero.title': { size: 77 } },
    };
    copyStylesDeToEn(de, en);
    expect(en.textStyles).toEqual({
      'tools.sectionTitle': { size: 33 },
      'hero.title': { size: 77 },
    });
    expect(en.textStyleUniform).toBe(true);
    expect(en.textStyleUniformKey).toBe('tools.sectionTitle');
  });
});

describe('TextsTab (Vue-Insel)', () => {
  let overrides: Overrides;
  let media: ReturnType<typeof defaultMedia>;
  let gotoCalls: number;

  beforeEach(() => {
    setActivePinia(createPinia());
    textsUi.prevMode = 'light';
    textsUi.fxOpen = {};
    overrides = { tools: { sectionTitle: 'Audio' } };
    media = defaultMedia();
    gotoCalls = 0;
    document.body.innerHTML = '';
  });

  function mountTab(lang: 'de' | 'en' = 'de') {
    return mount(TextsTab, {
      attachTo: document.body,
      props: {
        lang,
        overrides,
        defaults: { tools: { sectionTitle: 'Audio-Tools' }, imageTools: { sectionTitle: 'Bild' } },
        media: media[lang] as TextStyleHost,
        mediaDe: media.de as TextStyleHost,
        mediaEn: media.en as TextStyleHost,
        fonts: [{ name: 'Inter.woff2', label: 'Inter', url: '/fonts/Inter.woff2', bytes: 1 }],
        ensureFontFace: (f: string) => `kf-${f}`,
        gotoDesign: () => gotoCalls++,
      },
    });
  }

  it('Öffnen allein verändert den Zustand nicht', () => {
    const before = JSON.stringify({ overrides, media });
    const w = mountTab();
    expect(w.findAll('[data-tx-slot]')).toHaveLength(3);
    expect(JSON.stringify({ overrides, media })).toBe(before);
    w.unmount();
  });

  it('Text schreibt Override; leer entfernt ihn; Vorschau folgt', async () => {
    const w = mountTab();
    const tas = w.findAll('textarea[data-tx-text]');
    expect((tas[0]!.element as HTMLTextAreaElement).value).toBe('Audio');
    expect(tas[1]!.attributes('placeholder')).toBe('Bild');
    await tas[1]!.setValue('Bilder\nneu');
    expect(overrides.imageTools).toEqual({ sectionTitle: 'Bilder\nneu' });
    expect(w.findAll('[data-tx-preview="light"]')[1]!.text()).toBe('Bilder\nneu');
    await tas[0]!.setValue('   ');
    expect(overrides.tools).toBeUndefined();
    expect(w.findAll('[data-tx-preview="light"]')[0]!.text()).toBe('Audio-Tools');
    w.unmount();
  });

  it('Größe, Schrift und Effekte schreiben in media.textStyles (begrenzt)', async () => {
    const w = mountTab();
    const slot = w.findAll('[data-tx-slot]')[0]!;
    await slot.find('[data-tx-size]').setValue('300');
    expect(media.de.textStyles['tools.sectionTitle']!.size).toBe(120);
    await slot.find('[data-tx-font]').setValue('Inter.woff2');
    expect(media.de.textStyles['tools.sectionTitle']!.font).toBe('Inter.woff2');
    await slot.find('[data-tx-fx-field="opacity"]').setValue('40');
    await slot.find('[data-tx-fx-field="anim"]').setValue('pulse');
    const s = media.de.textStyles['tools.sectionTitle']!;
    expect(s.opacity).toBe(40);
    expect(s.anim).toBe('pulse');
    const prev = w.find('[data-tx-preview="light"]');
    expect(prev.classes()).toContain('kt-pulse');
    expect(prev.attributes('style')).toContain('opacity: 0.4');
    await slot.find('[data-tx-reset="fx"]').trigger('click');
    expect(s.opacity).toBe(100);
    expect(s.anim).toBe('none');
    expect(useToastStore().toasts.at(-1)?.message).toBe('Auf Standard zurückgesetzt');
    w.unmount();
  });

  it('„Standard für alle Slots“ sperrt die übrigen Slots und zeigt Master-Werte', async () => {
    const w = mountTab();
    const slots = () => w.findAll('[data-tx-slot]');
    await slots()[0]!.find('[data-tx-size]').setValue('44');
    await slots()[1]!.find('[data-tx-master]').setValue(true);
    expect(media.de.textStyleUniform).toBe(true);
    expect(media.de.textStyleUniformKey).toBe('imageTools.sectionTitle');
    expect(slots()[0]!.find('[data-tx-size]').attributes('disabled')).toBeDefined();
    expect(slots()[1]!.find('[data-tx-size]').attributes('disabled')).toBeUndefined();
    // Gesperrter Slot zeigt Master-Wert (0), eigener Wert 44 bleibt erhalten.
    expect((slots()[0]!.find('[data-tx-size]').element as HTMLInputElement).value).toBe('0');
    expect(media.de.textStyles['tools.sectionTitle']!.size).toBe(44);
    await slots()[1]!.find('[data-tx-master]').setValue(false);
    expect(media.de.textStyleUniform).toBe(false);
    expect((slots()[0]!.find('[data-tx-size]').element as HTMLInputElement).value).toBe('44');
    w.unmount();
  });

  it('Hell/Dunkel: andere Seitenleiste zugeklappt, Umschalten per Klick', async () => {
    const w = mountTab();
    expect(w.find('[data-tx-side="light"]').exists()).toBe(true);
    expect(w.find('[data-tx-side="dark"]').exists()).toBe(false);
    await w.find('[data-tx-showmode="dark"]').trigger('click');
    expect(textsUi.prevMode).toBe('dark');
    expect(w.find('[data-tx-side="dark"]').exists()).toBe(true);
    expect(w.find('[data-tx-showmode="light"]').exists()).toBe(true);
    w.unmount();
  });

  it('Farben kopieren, DE → EN mit Bestätigung, Wechsel zu Hero-Design', async () => {
    media.de.textStyles = {
      'tools.sectionTitle': { size: 0, colorLight: '#abcdef', colorDark: '', font: '' },
    } as never;
    const w = mountTab();
    await w.find('[data-tx-copymode="light"]').trigger('click');
    expect(media.de.textStyles['tools.sectionTitle']!.colorDark).toBe('#abcdef');

    await w.find('[data-tx-copy]').trigger('click');
    await flushPromises();
    const confirmBtn = document.querySelector<HTMLButtonElement>('[data-tx-copy-confirm]');
    expect(confirmBtn).not.toBeNull();
    confirmBtn!.click();
    await flushPromises();
    expect(media.en.textStyles['tools.sectionTitle']).toEqual(
      media.de.textStyles['tools.sectionTitle'],
    );
    expect(media.en.textStyles['tools.sectionTitle']).not.toBe(
      media.de.textStyles['tools.sectionTitle'],
    );

    await w.find('[data-tx-gotodesign]').trigger('click');
    expect(gotoCalls).toBe(1);
    w.unmount();
  });
});
