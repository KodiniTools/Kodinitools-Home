// @vitest-environment happy-dom
/**
 * Tab „Hero-Design“ als Vue-Insel (server/admin/app/tabs/hero): Lesen und
 * Schreiben über den Service aus public/design.js (echte Modell-Funktionen),
 * Regeln wie die Vanilla-Fassung.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import HeroTab from '../../server/admin/app/tabs/hero/HeroTab.vue';
import { hdRev, hdUi } from '../../server/admin/app/tabs/hero/heroUi';
import {
  chipExtraCss,
  clampOffset,
  clampSideNum,
  clampTypo,
  copySideColors,
  imageKeys,
  imageStyle,
  slotOverrideCss,
  type HeroService,
} from '../../server/admin/app/tabs/hero/heroData';
import { readTextStyle } from '../../server/admin/app/tabs/texts/textStyle';
import { useToastStore } from '../../server/admin/app/stores/toast';
import { heroService } from '../../server/admin/public/design.js';
import { state, defaultMedia } from '../../server/admin/public/model.js';

function makeService(picked: string | null = '/uploads/de/hero.webp'): HeroService {
  const svc = heroService('de') as unknown as HeroService;
  return {
    ...svc,
    ensureFontFace: (f: string) => `fam-${f}`,
    pick: vi.fn((_k: string, _t: string, onPick: (u: string) => void) => {
      if (picked === null) return false;
      onPick(picked);
      return true;
    }),
  };
}
const lastToast = () => useToastStore().toasts.at(-1)?.message ?? '';
const hd = () => state.media.de.heroDesign;
const ts = (k: string) => (state.media.de.textStyles as Record<string, Record<string, unknown>>)[k];

beforeEach(() => {
  setActivePinia(createPinia());
  state.media = defaultMedia() as typeof state.media;
  state.defaults = {
    de: {
      hero: {
        title: 'Kostenlose Tools',
        subtitle: 'Im Browser',
        cta: 'Los',
        features: { free: 'Gratis', privacy: 'Privat', noInstall: 'Ohne Installation' },
      },
    },
    en: { hero: { title: 'Free tools', features: { free: 'Free' } } },
  } as typeof state.defaults;
  state.overrides = { de: {}, en: {} };
  state.fonts = [{ name: 'Inter.woff2', label: 'Inter', url: '/fonts/Inter.woff2', bytes: 1 }];
  Object.assign(hdUi, { prevMode: 'light', selected: null, selSeq: 0, slideIdx: 0 });
  hdRev.value = 0;
  document.body.innerHTML = '';
});

const mountTab = (service = makeService()) =>
  mount(HeroTab, { attachTo: document.body, props: { service } });
const confirmDialog = async () => {
  await flushPromises();
  document.querySelector<HTMLButtonElement>('[data-hd-confirm]')!.click();
  await flushPromises();
};

describe('heroData (Regeln wie public/design.js)', () => {
  it('Begrenzungen', () => {
    expect(clampTypo('titleFontSize', '5')).toBe(8);
    expect(clampTypo('titleFontSize', '')).toBe(0);
    expect(clampTypo('chipFontSize', '200')).toBe(96);
    expect(clampTypo('titleLetterSpacing', '1.3')).toBe(1.5);
    expect(clampTypo('buttonStrokeWidth', '9')).toBe(5);
    const imgFields = makeService().imgFields;
    expect(clampSideNum('borderWidth', '12', imgFields)).toBe(8);
    expect(clampSideNum('chipBgOpacity', '-3', imgFields)).toBe(0);
    expect(clampSideNum('bgImageSaturate', '500', imgFields)).toBe(200);
    expect(clampOffset(2000.4, 1200)).toBe(1200);
    expect(clampOffset('-7.6', 1200)).toBe(-8);
  });

  it('Vorschau-Stile wie die Vanilla-Fassung', () => {
    const d = makeService().designDefault();
    d.chipOffsets = { free: { x: 5, y: 0 } };
    d.hiddenChips = ['free'];
    expect(chipExtraCss(d, 'free')).toBe(
      ';cursor:move;touch-action:none;user-select:none;position:relative;left:5px;top:0px;visibility:hidden',
    );
    const st = readTextStyle(
      { textStyles: { k: { size: 30, colorDark: '#ff0000', offsetX: 4, opacity: 50 } } },
      'k',
    );
    expect(slotOverrideCss(st, 'dark', () => '')).toBe(
      'font-size:30px;color:#ff0000;position:relative;left:4px;top:0px;opacity:0.5',
    );
    const side = { ...d.light, bgImageBlur: 2, bgImageDarken: 50 };
    expect(imageStyle(side, "/a'b.webp")).toContain(
      "inset:-4px;z-index:-1;pointer-events:none;border-radius:inherit;background:url('/ab.webp')",
    );
    expect(imageStyle(side, '')).toBe('');
  });

  it('Farben kopieren behält das Bild des Ziel-Modus und kopiert Text-Farben', () => {
    const d = makeService().designDefault();
    d.light.chipBgColor = '#123456';
    d.dark.bgImage = '/uploads/dark.webp';
    const media = { textStyles: { 'hero.title': { colorLight: '#abcdef' } } };
    const svc = makeService();
    const to = copySideColors(d, media, 'light', imageKeys(svc.imgFields), svc.textSlots);
    expect(to).toBe('dark');
    expect(d.dark.chipBgColor).toBe('#123456');
    expect(d.dark.bgImage).toBe('/uploads/dark.webp');
    expect(media.textStyles['hero.title']).toMatchObject({ colorDark: '#abcdef' });
  });
});

describe('HeroTab (Vue-Insel)', () => {
  it('liest ohne zu schreiben; Vorschau zeigt alle Feature-Buttons', () => {
    hd();
    const before = JSON.stringify({ m: state.media, o: state.overrides });
    const w = mountTab();
    expect(w.findAll('[data-hdprev="light"] [data-hdchip]')).toHaveLength(3);
    expect(w.find('[data-hdtitle]').text()).toBe('Kostenlose Tools');
    expect(w.find('[data-hdshowmode="dark"]').exists()).toBe(true);
    expect(w.find('[data-hdnote]').text()).toContain('ist aus');
    expect(JSON.stringify({ m: state.media, o: state.overrides })).toBe(before);
    w.unmount();
  });

  it('Texte als Override, Schriftgröße mit Entwurf, Effekte', async () => {
    const w = mountTab();
    await w.find('textarea[data-hdtxt="hero.title"]').setValue('Neu');
    expect(state.overrides.de).toEqual({ hero: { title: 'Neu' } });
    expect(w.find('[data-hdtitle]').text()).toBe('Neu');
    await w.find('textarea[data-hdtxt="hero.title"]').setValue('  ');
    expect(state.overrides.de).toEqual({});

    const size = w.find('input[data-hdtypo="titleFontSize"]');
    await size.setValue('5');
    expect(hd().titleFontSize).toBe(8);
    expect((size.element as HTMLInputElement).value).toBe('5'); // Entwurf bleibt beim Tippen
    await size.setValue('50');
    expect(hd().titleFontSize).toBe(50);
    expect(w.find('[data-hdtitle]').attributes('style')).toContain('font-size: 50px');

    await w.find('[data-hdtxtrow="hero.cta"] [data-tx-fx-field="anim"]').setValue('pulse');
    expect(ts('hero.cta')).toMatchObject({ anim: 'pulse' });
    expect(w.find('[data-hdcta]').classes()).toContain('kt-pulse');
    w.unmount();
  });

  it('Klick wählt aus und markiert; Pfeiltasten verschieben', async () => {
    const w = mountTab();
    const chip = w.find('[data-hdchip="privacy"]');
    await chip.trigger('click');
    expect(hdUi.selected).toEqual({ kind: 'chip', key: 'privacy' });
    expect(w.find('[data-hdfeatrow="privacy"]').classes()).toContain('hd-sel');
    expect(w.find('[data-hdshowrow="chip:privacy"]').classes()).toContain('hd-sel');
    expect(w.find('aside [data-hdsection="chips"]').classes()).toContain('hd-sec--hl');
    await chip.trigger('keydown', { key: 'ArrowRight', shiftKey: true });
    await chip.trigger('keydown', { key: 'ArrowUp' });
    expect(hd().chipOffsets).toEqual({ privacy: { x: 10, y: -1 } });
    expect((w.find('input[data-chipoff="privacy:x"]').element as HTMLInputElement).value).toBe(
      '10',
    );
    await w.find('[data-chipoffreset="privacy"]').trigger('click');
    expect(hd().chipOffsets).toEqual({});

    await w.find('[data-hdtitle]').trigger('keydown', { key: 'ArrowDown' });
    expect(ts('hero.title')).toMatchObject({ offsetX: 0, offsetY: 1 });
    w.unmount();
  });

  it('Sichtbarkeit, Seitenleiste, Zurücksetzen', async () => {
    const w = mountTab();
    await w.find('[data-hdchipshow="free"] button[role="switch"]').trigger('click');
    expect(hd().hiddenChips).toEqual(['free']);
    expect(w.find('[data-hdchip="free"]').attributes('style')).toContain('visibility: hidden');
    await w.find('[data-hdshow="showCta"] button[role="switch"]').trigger('click');
    expect(hd().showCta).toBe(false);

    const bw = w.find('input.hd-borderWidth');
    await bw.setValue('20');
    expect(hd().light.borderWidth).toBe(8);
    await w.find('[data-hdenabled] button[role="switch"]').trigger('click');
    expect(hd().enabled).toBe(true);
    expect(w.find('[data-hdnote]').text()).toContain('wird auf der Seite angewandt');
    await w.find('[data-hdenabledreset]').trigger('click');
    expect(hd().enabled).toBe(false);
    expect(lastToast()).toBe('Auf Standard zurückgesetzt');
    w.unmount();
  });

  it('Hintergrundbild, Diashow, Bild in anderen Modus kopieren', async () => {
    const svc = makeService();
    const w = mountTab(svc);
    await w.find('[data-hdimgpick="light"]').trigger('click');
    expect(hd().light.bgImage).toBe('/uploads/de/hero.webp');
    expect(w.find('[data-hdimg]').exists()).toBe(true);
    await w.find('[data-hdslideadd]').trigger('click');
    await w.find('[data-hdslideadd]').trigger('click');
    expect(hd().light.bgSlides).toHaveLength(2);
    await w.find('[data-hdimgcopy="light"]').trigger('click');
    expect(hd().dark.bgImage).toBe('/uploads/de/hero.webp');
    expect(hd().dark.bgSlides).toHaveLength(2);
    expect(hdUi.prevMode).toBe('dark');
    await flushPromises();
    await w.find('[data-hdslideclear]').trigger('click');
    await confirmDialog();
    expect(hd().dark.bgSlides).toEqual([]);
    expect(hd().light.bgSlides).toHaveLength(2);

    const url = w.find('input[data-hdimgurl="dark"]');
    await url.setValue('javascript:alert(1)');
    await url.trigger('change');
    expect(hd().dark.bgImage).toBe('');
    expect(lastToast()).toContain('Ungültige Bild-URL');
    w.unmount();

    const none = mountTab(makeService(null));
    await none.find('[data-hdimgpick="dark"]').trigger('click');
    expect(lastToast()).toContain('Keine Medien vorhanden');
    none.unmount();
  });

  it('Globale Schrift setzt Hero-Schriften in DE + EN; Übertragen nach EN', async () => {
    const w = mountTab();
    await w.find('[data-hdglobalfont="Inter.woff2"]').trigger('click');
    expect(state.media.site.globalFont).toBe('Inter.woff2');
    expect(state.media.de.heroDesign.titleFont).toBe('Inter.woff2');
    expect(state.media.en.heroDesign.buttonFont).toBe('Inter.woff2');
    expect(w.find('[data-hdglobalfont="Inter.woff2"]').classes()).toContain('active');

    hd().light.chipBgColor = '#010203';
    await w.find('[data-hdtxtrow="hero.title"] [data-tx-fx-field="opacity"]').setValue('40');
    await w.find('[data-hdcopy="en"]').trigger('click');
    await confirmDialog();
    expect(state.media.en.heroDesign.light.chipBgColor).toBe('#010203');
    expect(
      (state.media.en.textStyles as Record<string, Record<string, unknown>>)['hero.title'],
    ).toMatchObject({ opacity: 40 });
    expect(state.overrides.en).toEqual({});
    w.unmount();
  });
});
