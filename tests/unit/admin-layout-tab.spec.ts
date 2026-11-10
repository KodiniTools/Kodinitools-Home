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
  POS_PRESET_Y,
  readBannerText,
  resetBannerText,
  setBannerText,
  type BannerHost,
  type LayoutService,
  type PickTarget,
} from '../../server/admin/app/tabs/layout/layoutData';
import {
  copyGridDesign,
  effectiveCell,
  previewLayout,
  reflowCols,
  setCellField,
  type GridHost,
} from '../../server/admin/app/tabs/layout/gridData';
import { useToastStore } from '../../server/admin/app/stores/toast';
import { layoutService } from '../../server/admin/public/layout.js';
import { overlayStyle } from '../../server/admin/public/layout-shared.js';
import { state, defaultMedia, rgbaFromHex } from '../../server/admin/public/model.js';

function makeService(picked: string | null = '/uploads/de/banner.webp') {
  const svc = layoutService('de') as unknown as LayoutService;
  const service: LayoutService = {
    ...svc,
    ensureFontFace: (f: string) => `fam-${f}`,
    pick: vi.fn((_k: PickTarget, _t: string, onPick: (u: string) => void) => {
      if (picked === null) return false;
      onPick(picked);
      return true;
    }),
    paste: vi.fn(),
    bindCells: vi.fn(() => () => {}),
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
  Object.assign(lyUi, { prevMode: 'light', slideIdx: 0, activeCell: null, selSeq: 0, gridTick: 0 });
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
    expect(state.media.de.heroMode).toBe('grid');
    await flushPromises();
    expect(w.findAll('[data-celleditor]').length).toBeGreaterThan(0);
    expect(w.find('[data-bannerpick]').exists()).toBe(false);
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
    svc.ensure('en');
    expect(state.media.en.heroBannerSlides).toEqual([]);
  });
});

const g = () => state.media.de as unknown as GridHost;
const gridSvc = (picked: string | null = '/uploads/de/k.webp') => {
  const svc = makeService(picked);
  state.media.de.heroMode = 'grid';
  svc.ensure('de');
  return svc;
};

describe('gridData (Regeln wie public/layout-grid.js)', () => {
  it('Neuaufteilung wie heroGridReflowCols; Vorschau ohne ausgeblendete Kacheln', async () => {
    const { heroGridReflowCols } = await import('../../server/admin/public/model-grid.js');
    const svc = gridSvc();
    for (const layout of Object.keys(svc.layouts))
      for (let n = 0; n <= 6; n++)
        expect(reflowCols(svc.layoutCols, layout, n)).toBe(heroGridReflowCols(layout, n));
    g().heroLayout = 'grid6';
    let pv = previewLayout(g(), svc.layouts, svc.layoutCols, svc.syncProps);
    expect(pv.cells.map((c) => c.i)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(pv.reflow).toBe(0);
    expect(pv.container).toContain('grid-template-columns:repeat(3, 1fr)');
    g().heroGridHidden![1] = true;
    g().heroGridHidden![4] = true;
    pv = previewLayout(g(), svc.layouts, svc.layoutCols, svc.syncProps);
    expect(pv.cells.map((c) => c.i)).toEqual([0, 2, 3, 5]);
    expect(pv.reflow).toBe(2);
    expect(pv.container).toContain('display:flex');
  });

  it('Feldgrenzen, Master-Kachel, Design übertragen (Text bleibt, keine geteilten Objekte)', () => {
    const svc = gridSvc();
    const s = g().heroGridStyles![0]!;
    setCellField(s, 'borderWidth', '99', svc.imgFields);
    setCellField(s, 'textSize', -4, svc.imgFields);
    setCellField(s, 'bgOpacity', 'abc', svc.imgFields);
    setCellField(s, 'imgBlur', 999, svc.imgFields);
    setCellField(s, 'bgColor', '#123456', svc.imgFields);
    expect([s.borderWidth, s.textSize, s.bgOpacity, s.bgColor]).toEqual([20, 0, 0, '#123456']);
    expect(s.imgBlur).toBe(svc.imgFields.imgBlur.max);
    g().heroGridStyles![1]!.text = 'Eins';
    g().heroGridUniform = true;
    g().heroGridUniformCell = 0;
    const eff = effectiveCell(g(), 1, svc.syncProps);
    expect(eff.bgColor).toBe('#123456');
    expect(eff.text).toBe('Eins');
    svc.ensure('en');
    const en = state.media.en as unknown as GridHost;
    en.heroGridStyles![0]!.text = 'EN';
    copyGridDesign(g(), en, svc.cellDefault);
    expect(en.heroGridStyles![0]!.bgColor).toBe('#123456');
    expect(en.heroGridStyles![0]!.text).toBe('EN');
    expect(en.heroGridUniform).toBe(true);
    expect(en.heroGridSlideshow).not.toBe(g().heroGridSlideshow);
    expect(en.heroGridSlideshow).toEqual(g().heroGridSlideshow);
  });
});

describe('LayoutTab (Vue-Insel, Bild-Raster)', () => {
  it('Kacheln je Layout, Bild wählen/entfernen, Ausblenden in der Vorschau', async () => {
    const svc = gridSvc();
    const w = mountTab(svc);
    expect(svc.bindCells).toHaveBeenCalled();
    await w.find('select[data-herolayout]').setValue('grid4');
    expect(g().heroLayout).toBe('grid4');
    await flushPromises();
    expect(w.findAll('[data-celleditor]').length).toBe(8); // Inhalt + Design je Kachel
    expect(w.findAll('[data-prevcell]').length).toBe(4);
    await w.find('[data-cellimgpick="2"]').trigger('click');
    expect(svc.pick).toHaveBeenCalledWith({ cell: 2 }, expect.any(String), expect.any(Function));
    expect(g().heroGrid![2]).toBe('/uploads/de/k.webp');
    await flushPromises();
    expect(w.find('[data-prevmedia="2"] img').attributes('src')).toBe('/uploads/de/k.webp');
    await w.find('[data-cellimgclear="2"]').trigger('click');
    expect(g().heroGrid![2]).toBe('');
    expect(lastToast()).toBe('Bild aus Kachel 3 entfernt');
    await w.find('[data-cellshow="1"] button').trigger('click');
    expect(g().heroGridHidden![1]).toBe(true);
    await flushPromises();
    expect(w.findAll('[data-prevcell]').map((c) => c.attributes('data-prevcell'))).toEqual([
      '0',
      '2',
      '3',
    ]);
    await w.find('[data-cellshowbtn="1"]').trigger('click');
    expect(g().heroGridHidden![1]).toBe(false);
    expect(lastToast()).toBe('Kachel 2 eingeblendet');
    w.unmount();
  });

  it('Standard für alle sperrt die übrigen Kacheln; Design-Felder; Kachel zurücksetzen', async () => {
    const svc = gridSvc();
    const w = mountTab(svc);
    await w.find('[data-cellfield="1:borderWidth"]').setValue('7');
    await w.find('[data-cellfield="1:borderWidth"]').trigger('input');
    expect(g().heroGridStyles![1]!.borderWidth).toBe(7);
    await w.find('[data-cellpospreset="1:top"]').trigger('click');
    expect(g().heroGridStyles![1]!.textY).toBe(POS_PRESET_Y.top);
    await w.find('[data-cellmaster="0"] button').trigger('click');
    expect(g().heroGridUniform).toBe(true);
    expect(g().heroGridUniformCell).toBe(0);
    expect(lastToast()).toBe('Kachel 1 ist Standard für alle Kacheln');
    await flushPromises();
    expect(w.find('[data-cellfield="1:borderWidth"]').attributes('disabled')).toBeDefined();
    expect(w.find('[data-cellfield="0:borderWidth"]').attributes('disabled')).toBeUndefined();
    await w.find('[data-cellmaster="0"] button').trigger('click');
    expect(g().heroGridUniform).toBe(false);
    await w.find('[data-cellresetall="1"]').trigger('click');
    await confirmDialog();
    expect(g().heroGridStyles![1]!.borderWidth).toBe(svc.cellDefault().borderWidth);
    expect(lastToast()).toBe('Kachel 2 zurückgesetzt');
    w.unmount();
  });

  it('Kachel-Text, Diashow je Kachel, Design in die andere Sprache', async () => {
    const svc = gridSvc('/uploads/de/s.webp');
    const w = mountTab(svc);
    await w.find('[data-cellfield="0:text"]').setValue('Hallo');
    expect(g().heroGridStyles![0]!.text).toBe('Hallo');
    await flushPromises();
    expect(w.find('[data-prevtext="0"]').text()).toBe('Hallo');
    expect(w.find('[data-gridslideshowblock] input').attributes('disabled')).toBeDefined();
    await w.find('[data-cellslideadd="0"]').trigger('click');
    await w.find('[data-cellslideadd="0"]').trigger('click');
    expect(svc.pick).toHaveBeenCalledWith(
      { cellSlide: 0 },
      expect.any(String),
      expect.any(Function),
    );
    g().heroGridSlides![0]![1] = '/uploads/de/t.webp';
    lyRev.value++;
    await flushPromises();
    expect(w.findAll('[data-cellsliderow^="0:"]').length).toBe(2);
    expect(w.find('[data-gridslideshowblock] input').attributes('disabled')).toBeUndefined();
    await w.find('[data-cellslideup="0:1"]').trigger('click');
    expect(g().heroGridSlides![0]).toEqual(['/uploads/de/t.webp', '/uploads/de/s.webp']);
    await w.find('[data-cellslideremove="0:0"]').trigger('click');
    expect(g().heroGridSlides![0]).toEqual(['/uploads/de/s.webp']);
    await w.find('[data-cellslidepaste="0"]').trigger('click');
    expect(svc.paste).toHaveBeenCalledWith('cellslide:0');
    g().heroGridStyles![0]!.bgColor = '#abcdef';
    await w.find('[data-gridcopylang]').trigger('click');
    await confirmDialog();
    const en = state.media.en as unknown as GridHost;
    expect(en.heroGridStyles![0]!.bgColor).toBe('#abcdef');
    expect(en.heroGridStyles![0]!.text).not.toBe('Hallo');
    w.unmount();
  });

  it('Einfügen aus der Zwischenablage markiert die Kachel über den Service-Hook', async () => {
    const svc = gridSvc();
    const w = mountTab(svc);
    const hooks = (svc.bindCells as ReturnType<typeof vi.fn>).mock.calls[0]![0] as {
      mark: (i: number) => void;
      active: () => number | null;
    };
    expect(hooks.active()).toBeNull();
    hooks.mark(2);
    await flushPromises();
    expect(hooks.active()).toBe(2);
    expect(w.find('[data-prevcell="2"]').classes()).toContain('ly-active');
    await w.find('[data-cellpaste="1"]').trigger('click');
    expect(svc.paste).toHaveBeenCalledWith(1);
    expect(hooks.active()).toBe(1);
    w.unmount();
  });
});
