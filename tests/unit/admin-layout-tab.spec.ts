// @vitest-environment happy-dom
/**
 * Tab „Layout“ (Einzel-Banner) als Vue-Insel (server/admin/app/tabs/layout):
 * Lesen und Schreiben über den Service aus public/layout.js (echte
 * Modell-Funktionen), Regeln wie die Vanilla-Fassung in public/layout-banner.js.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import LayoutTab from '../../server/admin/app/tabs/layout/LayoutTab.vue';
import { lyRev, lyUi } from '../../server/admin/app/tabs/layout/layoutUi';
import {
  bannerDesignCss,
  bannerTextStyle,
  clampStyleNum,
  copyTextDesign,
  moveSlide,
  readBannerText,
  resetBannerText,
  setBannerText,
  type BannerHost,
  type LayoutService,
} from '../../server/admin/app/tabs/layout/layoutData';
import { useToastStore } from '../../server/admin/app/stores/toast';
import { layoutService } from '../../server/admin/public/layout.js';
import { overlayStyle } from '../../server/admin/public/layout-shared.js';
import { state, defaultMedia, rgbaFromHex } from '../../server/admin/public/model.js';

function makeService(picked: string | null = '/uploads/de/banner.webp') {
  const svc = layoutService('de') as unknown as LayoutService;
  const service: LayoutService = {
    ...svc,
    ensureFontFace: (f: string) => `fam-${f}`,
    pick: vi.fn((_k: 'banner' | 'slide', _t: string, onPick: (u: string) => void) => {
      if (picked === null) return false;
      onPick(picked);
      return true;
    }),
    paste: vi.fn(),
    setHeroMode: vi.fn(),
    fullPage: { draw: vi.fn(), refreshBanner: vi.fn() },
  };
  return service;
}
const lastToast = () => useToastStore().toasts.at(-1)?.message ?? '';
const m = () => state.media.de as unknown as BannerHost;

beforeEach(() => {
  setActivePinia(createPinia());
  state.media = defaultMedia() as typeof state.media;
  state.fonts = [{ name: 'Inter.woff2', label: 'Inter', url: '/fonts/Inter.woff2', bytes: 1 }];
  state.stagedItems = [];
  Object.assign(lyUi, { prevMode: 'light', slideIdx: 0 });
  lyRev.value = 0;
  document.body.innerHTML = '';
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true })),
  );
});

const mountTab = (service = makeService()) =>
  mount(LayoutTab, { attachTo: document.body, props: { service } });
const confirmDialog = async () => {
  await flushPromises();
  document.querySelector<HTMLButtonElement>('[data-ly-confirm]')!.click();
  await flushPromises();
};

describe('layoutData (Regeln wie public/layout-banner.js)', () => {
  it('Banner-Text: Begrenzungen und Zurücksetzen', () => {
    const b: BannerHost = {};
    setBannerText(b, 'textSize', '200');
    setBannerText(b, 'textStrokeWidth', '2.3');
    setBannerText(b, 'textShadowX', '-80');
    setBannerText(b, 'textAnim', 'boing');
    setBannerText(b, 'textAnimIntensity', '');
    setBannerText(b, 'textShadow', false);
    expect(b).toMatchObject({
      heroBannerTextSize: 96,
      heroBannerTextStrokeWidth: 2.5,
      heroBannerTextShadowX: -50,
      heroBannerTextAnim: 'none',
      heroBannerTextAnimIntensity: 5,
      heroBannerTextShadow: false,
    });
    b.heroBannerTextX = 10;
    resetBannerText(b, 'pos');
    resetBannerText(b, 'textSize');
    resetBannerText(b, 'textShadow');
    expect(b).toMatchObject({
      heroBannerTextX: 50,
      heroBannerTextY: 50,
      heroBannerTextSize: 0,
      heroBannerTextShadow: true,
    });
  });

  it('Text-Overlay und Banner-Design wie die Vanilla-Fassung', () => {
    const b: BannerHost = { ...(defaultMedia().de as unknown as BannerHost) };
    expect(bannerTextStyle(readBannerText(b), () => '')).toBe('');
    b.heroBannerText = 'Hallo';
    b.heroBannerTextStrokeWidth = 1;
    b.heroBannerTextOpacity = 80;
    b.heroBannerTextAnim = 'pulse';
    const t = readBannerText(b);
    expect(bannerTextStyle(t, () => '')).toBe(
      overlayStyle(
        '#ffffff',
        0,
        50,
        50,
        '',
        '1.3rem',
        `0px 2px 6px ${rgbaFromHex('#000000', 60)}`,
        ';-webkit-text-stroke:1px #000000;opacity:0.8;--anim-dur:1.8s;--anim-scale:1.100',
      ),
    );
    const s = makeService().styleDefault();
    expect(bannerDesignCss(s)).toBe(
      'border-radius:14px;border:0;box-shadow:none;opacity:1.00;filter:none',
    );
    expect(bannerDesignCss({ ...s, borderWidth: 2, shadow: true, darken: 25 })).toBe(
      'border-radius:14px;border:2px solid #014f99;box-shadow:0px 8px 24px rgba(0, 0, 0, 0.4);opacity:1.00;filter:brightness(0.75)',
    );
    const svc = makeService();
    expect(clampStyleNum('borderWidth', '99', svc.styleLimits, s)).toBe(20);
    expect(clampStyleNum('shadowX', 'x', svc.styleLimits, s)).toBe(0);
  });

  it('Text-Design kopieren lässt den Text; Diashow verschieben', () => {
    const src: BannerHost = { heroBannerText: 'A', heroBannerTextColor: '#123456' };
    const dst: BannerHost = { heroBannerText: 'B' };
    copyTextDesign(src, dst);
    expect(dst).toMatchObject({ heroBannerText: 'B', heroBannerTextColor: '#123456' });
    const list = ['a', 'b', 'c'];
    expect(moveSlide(list, 0, -1)).toBe(false);
    expect(moveSlide(list, 0, 1)).toBe(true);
    expect(list).toEqual(['b', 'a', 'c']);
  });
});

describe('LayoutTab (Vue-Insel, Einzel-Banner)', () => {
  it('liest ohne zu schreiben; Hell offen, Dunkel zugeklappt; Ganzseiten-Vorschau gezeichnet', () => {
    const before = JSON.stringify(state.media);
    const svc = makeService();
    const w = mountTab(svc);
    expect(w.find('[data-bannermediablock]').exists()).toBe(true);
    expect(w.find('[data-bannerdesign="light"] [data-bannercopyside="light"]').exists()).toBe(true);
    expect(w.find('[data-bannerdesign="dark"].tc-mode-collapsed').exists()).toBe(true);
    expect(w.find('[data-bannermedia="box"]').exists()).toBe(true);
    expect(svc.fullPage.draw).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(state.media)).toBe(before);
    w.unmount();
  });

  it('Banner-Text: Eingabe, Größe begrenzt, Position, Zurücksetzen', async () => {
    const w = mountTab();
    await w.find('textarea[data-bannerfield="text"]').setValue('Willkommen');
    expect(m().heroBannerText).toBe('Willkommen');
    expect(w.find('[data-bannertext]').text()).toBe('Willkommen');
    expect(w.find('[data-bannertext]').attributes('style')).toContain('left: 50%');
    await w.find('input[data-bannerfield="textSize"]').setValue('300');
    expect(m().heroBannerTextSize).toBe(96);
    await w.find('[data-bannerpospreset="top"]').trigger('click');
    expect(m().heroBannerTextY).toBe(10);
    expect(w.find('[data-bannerposval]').text()).toBe('50 / 10 %');
    await w.find('[data-bannerfield="textAnim"]').setValue('glow');
    expect(w.find('[data-bannertext]').classes()).toContain('kt-glow');
    const posRow = w.find('[data-bannerposval]').element.parentElement!;
    await (posRow.querySelector('[data-md-textreset="pos"]') as HTMLButtonElement).click();
    await flushPromises();
    expect(m().heroBannerTextY).toBe(50);
    expect(lastToast()).toBe('Auf Standard zurückgesetzt');
    w.unmount();
  });

  it('Banner-Design: Felder, Modus wechseln, kopieren, alles zurücksetzen', async () => {
    const svc = makeService();
    const w = mountTab(svc);
    const light = () => state.media.de.heroBannerStyle.light;
    const dark = () => state.media.de.heroBannerStyle.dark;
    await w.find('input[data-bannerstyle="light:shadowX"]').setValue('70');
    expect(light().shadowX).toBe(50);
    await w.find('[data-bannerstyle="light:shadow"] button').trigger('click');
    expect(light().shadow).toBe(true);
    await flushPromises();
    expect(svc.fullPage.refreshBanner).toHaveBeenCalled();
    await w.find('[data-bannercopyside="light"]').trigger('click');
    expect(dark()).toEqual(light());
    expect(dark()).not.toBe(light());
    expect(lyUi.prevMode).toBe('dark');
    await flushPromises();
    expect(w.find('[data-bannerdesign="light"].tc-mode-collapsed').exists()).toBe(true);
    await w.find('[data-bannerstyleresetall="dark"]').trigger('click');
    await confirmDialog();
    expect(dark()).toEqual(svc.styleDefault());
    await w.find('[data-bannerdesign="light"]').trigger('click');
    expect(lyUi.prevMode).toBe('light');
    w.unmount();
  });

  it('Design und Text-Design in die andere Sprache übertragen (Text bleibt)', async () => {
    m().heroBannerText = 'DE-Text';
    m().heroBannerTextColor = '#ff0000';
    state.media.en.heroBannerText = 'EN-Text';
    const w = mountTab();
    state.media.de.heroBannerStyle.light.borderWidth = 7;
    await w.find('[data-bannercopylang="en"]').trigger('click');
    await confirmDialog();
    expect(state.media.en.heroBannerStyle.light.borderWidth).toBe(7);
    expect(state.media.en.heroBannerStyle.light).not.toBe(state.media.de.heroBannerStyle.light);
    await w.find('[data-bannertextcopylang="en"]').trigger('click');
    await confirmDialog();
    expect(state.media.en.heroBannerTextColor).toBe('#ff0000');
    expect(state.media.en.heroBannerText).toBe('EN-Text');
    w.unmount();
  });

  it('Banner-Medium: Mediathek, Pfad, Entfernen, Ein-/Ausblenden', async () => {
    const svc = makeService();
    const w = mountTab(svc);
    await w.find('[data-bannerpick]').trigger('click');
    expect(m().heroBanner).toBe('/uploads/de/banner.webp');
    expect(lastToast()).toBe('Banner zugewiesen');
    await flushPromises();
    expect(w.find('img[data-bannermedia="media"]').exists()).toBe(true);
    expect(svc.fullPage.draw).toHaveBeenCalledTimes(2);
    await w.find('input[data-bannerslot]').setValue('  /uploads/x.mp4 ');
    expect(m().heroBanner).toBe('/uploads/x.mp4');
    expect(w.find('video[data-bannermedia="media"]').exists()).toBe(true);
    await w.find('[data-bannerclear]').trigger('click');
    expect(m().heroBanner).toBe('');
    await w.find('[data-bannershow] button').trigger('click');
    expect(m().heroBannerShow).toBe(false);
    expect(w.find('[data-bannerhiddeninfo]').exists()).toBe(true);
    await w.find('[data-bannerpaste]').trigger('click');
    expect(svc.paste).toHaveBeenCalledWith('banner');
    w.unmount();
  });

  it('Diashow: anhängen, ordnen, entfernen, leeren, Einstellungen', async () => {
    const w = mountTab(makeService('/uploads/de/s1.webp'));
    await w.find('[data-slideadd]').trigger('click');
    state.media.de.heroBannerSlides.push('/uploads/de/s2.webp');
    lyRev.value++;
    await flushPromises();
    expect(w.findAll('[data-sliderow]')).toHaveLength(2);
    await w.find('[data-slidedown="0"]').trigger('click');
    expect(state.media.de.heroBannerSlides).toEqual(['/uploads/de/s2.webp', '/uploads/de/s1.webp']);
    await w.find('[data-slideremove="1"]').trigger('click');
    expect(state.media.de.heroBannerSlides).toEqual(['/uploads/de/s2.webp']);
    await w.find('[data-slideshow="dots"] button').trigger('click');
    expect(state.media.de.heroBannerSlideshow.dots).toBe(false);
    await w.find('[data-slideshow="transition"]').setValue('zoom');
    expect(state.media.de.heroBannerSlideshow.transition).toBe('zoom');
    await w.find('[data-slideclear]').trigger('click');
    await confirmDialog();
    expect(state.media.de.heroBannerSlides).toEqual([]);
    expect(lastToast()).toBe('Diashow geleert');
    w.unmount();
  });

  it('Seiten-Layout (global) und Hero-Modus', async () => {
    const svc = makeService();
    const w = mountTab(svc);
    expect(w.find('select[data-cardform]').attributes('disabled')).toBeDefined();
    await w.find('[data-homelayout] [data-value="compact"]').trigger('click');
    expect(state.media.site.homeLayout).toBe('compact');
    expect(lastToast()).toBe('Kompakt-Layout gewählt');
    await flushPromises();
    expect(w.find('select[data-cardform]').attributes('disabled')).toBeUndefined();
    await w.find('select[data-cardwidth]').setValue('wide');
    expect(state.media.site.cardWidth).toBe('wide');
    await w.find('[data-catbar] button').trigger('click');
    expect(state.media.site.catBar).toBe(false);
    await flushPromises();
    expect(w.find('[data-catsearch] button').attributes('disabled')).toBeDefined();
    await w.find('[data-heromode] [data-value="grid"]').trigger('click');
    expect(svc.setHeroMode).toHaveBeenCalledWith('grid');
    w.unmount();
  });
});

describe('layoutService (public/layout.js)', () => {
  it('Medien auflösen, Seiten-Einstellungen, Strukturen sichern', () => {
    const svc = layoutService('de') as unknown as LayoutService;
    expect(svc.resolve('')).toBeNull();
    expect(svc.resolve('staged:nope')).toBeNull();
    expect(svc.resolve('/uploads/a.webm')).toMatchObject({ isVid: true, localName: '' });
    svc.setPage('mediaPosDesktop', 'bottom');
    expect(svc.page().mediaPosDesktop).toBe('bottom');
    delete (state.media.en as Partial<typeof state.media.en>).heroBannerSlides;
    svc.ensureBanner('en');
    expect(state.media.en.heroBannerSlides).toEqual([]);
  });
});
