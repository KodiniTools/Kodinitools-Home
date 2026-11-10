// @vitest-environment happy-dom
/**
 * Tab „Medien“ als Vue-Insel (server/admin/app/tabs/media): gleiche Regeln wie
 * die Vanilla-Fassung (public/media.js + public/sectionmedia.js); Änderungen
 * landen direkt in `state.media[lang]` bzw. `sectionMedia[key]`
 * (Autosave/Undo per Snapshot).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import MediaTab from '../../server/admin/app/tabs/media/MediaTab.vue';
import { mediaUi } from '../../server/admin/app/tabs/media/mediaUi';
import {
  clampSide,
  clampSlideshow,
  clampText,
  copySectionDesign,
  designCss,
  getHeroLink,
  getSlotVal,
  moveSlide,
  setHeroLink,
  setSlotVal,
  slideSources,
  textOverlayStyle,
  type MediaHost,
  type MediaService,
  type ResolvedMedia,
  type SectionMediaCfg,
} from '../../server/admin/app/tabs/media/mediaData';
import { useToastStore } from '../../server/admin/app/stores/toast';
import {
  state,
  defaultMedia,
  getSectionMedia,
  defaultSectionMediaSide,
  defaultSectionMediaText,
  defaultBannerSlideshow,
  getMediaVal,
  defMediaVal,
  heroLayoutCells,
  BANNER_SLIDES_MAX,
  BANNER_TRANSITIONS,
} from '../../server/admin/public/model.js';
import {
  designCss as vanillaDesignCss,
  textStyle as vanillaTextStyle,
} from '../../server/admin/public/sectionmedia.js';

const resolve = (val: string): ResolvedMedia | null => {
  if (!val) return null;
  if (val.startsWith('staged:'))
    return val === 'staged:m1' ? { src: 'blob:m1', isVid: false, localName: 'lokal.png' } : null;
  return { src: val, isVid: /\.(mp4|webm)$/i.test(val), localName: null };
};

function makeService(picked: string | null = '/uploads/de/neu.webp') {
  return {
    sectionMedia: (l, k) => getSectionMedia(l, k) as unknown as SectionMediaCfg,
    resolve,
    pick: vi.fn((_opts: { title: string; imagesOnly?: boolean }, onPick: (u: string) => void) => {
      if (picked === null) return false;
      onPick(picked);
      return true;
    }),
    defaultVal: (k) => defMediaVal(k),
    defaultSide: defaultSectionMediaSide,
    defaultText: defaultSectionMediaText,
    defaultSlideshow: defaultBannerSlideshow,
    heroCells: (l: string) => heroLayoutCells(l),
    slidesMax: BANNER_SLIDES_MAX,
    transitions: BANNER_TRANSITIONS,
  } satisfies MediaService;
}

beforeEach(() => {
  setActivePinia(createPinia());
  state.media = defaultMedia() as typeof state.media;
  mediaUi.section = 'audio';
  mediaUi.prevMode = 'light';
  document.body.innerHTML = '';
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true })),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('mediaData (Regeln wie public/sectionmedia.js)', () => {
  it('designCss und Text-Overlay identisch zur Vanilla-Fassung', () => {
    const cfg = getSectionMedia('de', 'image');
    cfg.style.dark = {
      customBorder: true,
      borderColor: '#ff0000',
      borderWidth: 3,
      borderRadius: 20,
      opacity: 80,
      darken: 25,
    };
    for (const mode of ['light', 'dark'] as const)
      expect(designCss(cfg.style[mode])).toEqual(vanillaDesignCss('de', 'image', mode));
    cfg.style.light.customBorder = true;
    cfg.style.light.borderWidth = 0;
    expect(designCss(cfg.style.light).wrap).toContain('border:0;');

    const t = {
      ...defaultSectionMediaText(),
      text: 'Hallo',
      size: 30,
      x: 20,
      y: 80,
      opacity: 50,
      strokeWidth: 1.5,
      shadowColor: '#112233',
    };
    expect(textOverlayStyle(t, '')).toBe(vanillaTextStyle(t));
    expect(textOverlayStyle({ ...t, shadow: false, opacity: 100, strokeWidth: 0 }, '')).toBe(
      vanillaTextStyle({ ...t, shadow: false, opacity: 100, strokeWidth: 0 }),
    );
    expect(textOverlayStyle(t, 'KtFont')).toContain("font-family:'KtFont'");
  });

  it('Slot-Werte und Verlinkung (alle sechs Kacheln)', () => {
    const m = state.media.de as unknown as MediaHost;
    setSlotVal(m, 'audio', '/uploads/de/a.mp4');
    setSlotVal(m, 'grid5', '/uploads/de/k6.webp');
    setSlotVal(m, 'heroBanner', '/uploads/de/b.webp');
    expect(getSlotVal(m, 'audio')).toBe(getMediaVal('de', 'audio'));
    expect(getSlotVal(m, 'grid5')).toBe(getMediaVal('de', 'grid5'));
    expect(getSlotVal(m, 'heroBanner')).toBe('/uploads/de/b.webp');
    setHeroLink(m, 'grid5', '/faq/');
    setHeroLink(m, 'heroBanner', 'https://x.de');
    expect(state.media.de.heroGridLinks[5]).toBe('/faq/');
    expect(getHeroLink(m, 'grid5')).toBe('/faq/');
    expect(state.media.de.heroBannerLink).toBe('https://x.de');
    expect(getHeroLink(m, 'audio')).toBe('');
  });

  it('Begrenzungen wie die Vanilla-Bindings', () => {
    expect(clampSide('borderWidth', '99')).toBe(20);
    expect(clampSide('borderRadius', 'x')).toBe(0);
    expect(clampSide('darken', 55)).toBe(55);
    expect(clampText('size', 120)).toBe(96);
    expect(clampText('shadowX', -80)).toBe(-50);
    expect(clampText('strokeWidth', '1.3')).toBe(1.5);
    expect(clampSlideshow('interval', 'abc')).toBe(5);
    expect(clampSlideshow('interval', 0)).toBe(1);
    expect(clampSlideshow('duration', 9000)).toBe(5000);
  });

  it('Design übertragen, Bilder tauschen, Diashow-Quellen', () => {
    const src = getSectionMedia('de', 'audio') as unknown as SectionMediaCfg;
    const dst = getSectionMedia('en', 'audio') as unknown as SectionMediaCfg;
    src.style.light.borderRadius = 40;
    src.slideshow.interval = 9;
    src.text = { ...src.text, text: 'DE-Text', color: '#00ff00' };
    dst.text.text = 'EN-Text';
    copySectionDesign(src, dst);
    expect(dst.style.light.borderRadius).toBe(40);
    expect(dst.style.light).not.toBe(src.style.light);
    expect(dst.slideshow.interval).toBe(9);
    expect(dst.text.color).toBe('#00ff00');
    expect(dst.text.text).toBe('EN-Text');

    const s = ['a', 'b', 'c'];
    expect(moveSlide(s, 0, -1)).toBe(false);
    expect(moveSlide(s, 0, 1)).toBe(true);
    expect(s).toEqual(['b', 'a', 'c']);

    const main = resolve('/uploads/x.webp');
    expect(slideSources(main, ['staged:m1', 'staged:weg', ''], resolve)).toEqual([
      '/uploads/x.webp',
      'blob:m1',
    ]);
    expect(slideSources(resolve('/v.mp4'), ['staged:m1'], resolve)).toEqual([]);
  });
});

describe('MediaTab (Vue-Insel)', () => {
  const mountTab = (service = makeService(), lang: 'de' | 'en' = 'de') =>
    mount(MediaTab, {
      attachTo: document.body,
      props: {
        lang,
        media: state.media[lang] as unknown as MediaHost,
        service,
        pageBg: { light: '#fafafa', dark: '#091428' },
        fonts: [],
        ensureFontFace: (f: string) => 'kt-' + f,
        gotoLayout: vi.fn(),
      },
    });

  it('zeigt Sektion, Vorschau und zugeklappten Gegenmodus; liest ohne zu schreiben', () => {
    const before = JSON.stringify(state.media);
    const w = mountTab();
    expect(w.find('[data-md-section] select, select[data-md-section]').exists()).toBe(true);
    expect(w.find('[data-md-design="light"] [data-md-applyall]').exists()).toBe(true);
    expect(w.find('[data-md-showmode="dark"]').exists()).toBe(true);
    expect(w.find('[data-md-wrap]').exists()).toBe(true);
    expect(JSON.stringify(state.media)).toBe(before);
    w.unmount();
  });

  it('Sektionswechsel und Moduswechsel bleiben über Neu-Mounts erhalten', async () => {
    let w = mountTab();
    await w.find('select[data-md-section]').setValue('image');
    expect(mediaUi.section).toBe('image');
    await w.find('[data-md-showmode="dark"]').trigger('click');
    expect(mediaUi.prevMode).toBe('dark');
    w.unmount();
    w = mountTab();
    expect((w.find('select[data-md-section]').element as HTMLSelectElement).value).toBe('image');
    expect(w.find('[data-md-showmode="light"]').exists()).toBe(true);
    w.unmount();
  });

  it('Design-Regler schreiben in den state; Rahmenfarbe nur mit eigenem Umriss', async () => {
    const w = mountTab();
    const cfg = getSectionMedia('de', 'audio');
    const range = w.find<HTMLInputElement>('input.md-side-borderRadius');
    await range.setValue('33');
    expect(cfg.style.light.borderRadius).toBe(33);
    expect(w.find('[data-md-wrap]').attributes('style')).toContain('border-radius: 33px');
    expect(w.find('input.md-side-borderWidth').attributes('disabled')).toBeDefined();
    await w.find('[data-md-customborder] button[role="switch"]').trigger('click');
    expect(cfg.style.light.customBorder).toBe(true);
    expect(w.find('input.md-side-borderWidth').attributes('disabled')).toBeUndefined();
    await w.find('[data-md-copyside="light"]').trigger('click');
    expect(cfg.style.dark.borderRadius).toBe(33);
    expect(mediaUi.prevMode).toBe('dark');
    w.unmount();
  });

  it('„Für alle Sektionen“ und „↺ Alles“ fragen per Dialog nach', async () => {
    const w = mountTab();
    const cfg = getSectionMedia('de', 'audio');
    cfg.style.light.opacity = 40;
    await w.find('[data-md-applyall="light"]').trigger('click');
    await flushPromises();
    expect(document.body.textContent).toContain('für alle Sektionen übernehmen?');
    expect(getSectionMedia('de', 'image').style.light.opacity).toBe(100);
    document.querySelector<HTMLButtonElement>('[data-md-confirm]')!.click();
    await flushPromises();
    expect(getSectionMedia('de', 'image').style.light.opacity).toBe(40);
    expect(getSectionMedia('de', 'diverse').style.light.opacity).toBe(40);

    await w.find('[data-md-resetall="light"]').trigger('click');
    await flushPromises();
    document.querySelector<HTMLButtonElement>('[data-md-confirm]')!.click();
    await flushPromises();
    expect(getSectionMedia('de', 'audio').style.light).toEqual(defaultSectionMediaSide());
    expect(useToastStore().toasts.at(-1)?.message).toBe('Design zurückgesetzt');
    w.unmount();
  });

  it('Sektions-Design in die andere Sprache übertragen (Text bleibt)', async () => {
    getSectionMedia('en', 'audio').text.text = 'Hello';
    const w = mountTab();
    getSectionMedia('de', 'audio').text.color = '#123456';
    await w.find('[data-md-copylang="en"]').trigger('click');
    await flushPromises();
    document.querySelector<HTMLButtonElement>('[data-md-confirm]')!.click();
    await flushPromises();
    expect(getSectionMedia('en', 'audio').text.color).toBe('#123456');
    expect(getSectionMedia('en', 'audio').text.text).toBe('Hello');
    w.unmount();
  });

  it('Medium wählen, leeren (= Standard) und zurücksetzen', async () => {
    const service = makeService();
    const w = mountTab(service);
    const slot = w.find('[data-md-sectionslot]');
    await slot.find('[data-md-pick]').trigger('click');
    expect(service.pick).toHaveBeenCalledTimes(1);
    expect(getMediaVal('de', 'audio')).toBe('/uploads/de/neu.webp');
    expect(useToastStore().toasts.at(-1)?.message).toBe('Medium zugewiesen');

    const input = slot.find<HTMLInputElement>('input[data-md-slot]');
    await input.trigger('focus');
    // Tippen (nur input-Event; setValue löst zusätzlich change aus)
    input.element.value = '';
    await input.trigger('input');
    expect(getMediaVal('de', 'audio')).toBe(defMediaVal('audio'));
    expect(input.element.value).toBe(''); // beim Tippen bleibt das Feld leer
    await input.trigger('change');
    expect(input.element.value).toBe(defMediaVal('audio'));

    await input.setValue('/uploads/de/x.webp');
    await slot.find('[data-md-reset]').trigger('click');
    expect(getMediaVal('de', 'audio')).toBe(defMediaVal('audio'));
    w.unmount();
  });

  it('ohne Medien öffnet sich keine Auswahl, sondern ein Hinweis', async () => {
    const w = mountTab(makeService(null));
    const before = getMediaVal('de', 'audio');
    await w.find('[data-md-sectionslot] [data-md-pick]').trigger('click');
    expect(getMediaVal('de', 'audio')).toBe(before);
    expect(useToastStore().toasts.at(-1)?.message).toContain('Keine Medien vorhanden');
    w.unmount();
  });

  it('lokales Medium: Feld gesperrt, Status „lokal“; fehlende Server-Datei wird gemeldet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false })),
    );
    state.media.de.sectionVideos.audio = 'staged:m1';
    state.media.de.sectionVideos.image = '/uploads/de/weg.webp';
    const w = mountTab();
    expect(
      w.find('[data-md-sectionslot] input[data-md-slot]').attributes('disabled'),
    ).toBeDefined();
    expect(w.find('[data-md-status="local"]').text()).toContain('lokal.png');
    await w.find('select[data-md-section]').setValue('image');
    await flushPromises();
    expect(w.find('[data-md-missing]').exists()).toBe(true);
    w.unmount();
  });

  it('Diashow: anhängen (nur Bilder), sortieren, entfernen, leeren; Vorschau wechselt im Takt', async () => {
    vi.useFakeTimers();
    state.media.de.sectionVideos.audio = '/uploads/de/main.webp';
    const service = makeService('staged:m1');
    const w = mountTab(service);
    const cfg = getSectionMedia('de', 'audio');
    await w.find('[data-md-slideadd]').trigger('click');
    expect(service.pick.mock.calls[0]![0].imagesOnly).toBe(true);
    expect(cfg.slides).toEqual(['staged:m1']);
    service.pick.mockImplementationOnce((_o, onPick) => {
      onPick('/uploads/de/zwei.webp');
      return true;
    });
    await w.find('[data-md-slideadd]').trigger('click');
    expect(w.findAll('[data-md-sliderow]')).toHaveLength(2);
    await w.findAll('[data-md-slidedown]')[0]!.trigger('click');
    expect(cfg.slides).toEqual(['/uploads/de/zwei.webp', 'staged:m1']);

    const img = () => w.find('img[data-md-media]').attributes('src');
    expect(img()).toBe('/uploads/de/main.webp');
    vi.advanceTimersByTime(cfg.slideshow.interval * 1000);
    await flushPromises();
    expect(img()).toBe('/uploads/de/zwei.webp');

    await w.findAll('[data-md-slideremove]')[1]!.trigger('click');
    expect(cfg.slides).toEqual(['/uploads/de/zwei.webp']);
    await w.find('[data-md-slideclear]').trigger('click');
    await flushPromises();
    document.querySelector<HTMLButtonElement>('[data-md-confirm]')!.click();
    await flushPromises();
    expect(cfg.slides).toEqual([]);
    w.unmount();
  });

  it('Text-Overlay: Eingabe, Begrenzung, Position und Reset', async () => {
    const w = mountTab();
    const t = getSectionMedia('de', 'audio').text;
    await w.find('input[data-md-text]').setValue('Neu!');
    expect(t.text).toBe('Neu!');
    expect(w.find('[data-md-overlay]').text()).toBe('Neu!');
    const size = w.find<HTMLInputElement>('input[data-md-num="size"]');
    await size.setValue('500');
    expect(t.size).toBe(96);
    await size.trigger('change');
    expect(size.element.value).toBe('96');
    await w.find('[data-md-pos="top"]').trigger('click');
    expect([t.x, t.y]).toEqual([50, 10]);
    expect(w.find('[data-md-posval]').text()).toBe('50 / 10 %');
    await w.find('[data-md-textreset="pos"]').trigger('click');
    expect(t.y).toBe(50);
    await w.find('[data-md-textreset="size"]').trigger('click');
    expect(t.size).toBe(0);
    await w.find('[data-md-textreset="text"]').trigger('click');
    expect(t.text).toBe('');
    expect(w.find('[data-md-overlay]').exists()).toBe(false);
    w.unmount();
  });

  it('Hero: Kacheln je Layout inkl. Verlinkung; Banner-Modus führt zum Layout-Tab', async () => {
    state.media.de.heroMode = 'grid';
    state.media.de.heroLayout = 'grid6';
    let w = mountTab();
    const cells = w.findAll('[data-md-slotpanel^="grid"]');
    expect(cells).toHaveLength(6);
    await cells[5]!.find('input[data-md-link]').setValue('/faq/');
    expect(state.media.de.heroGridLinks[5]).toBe('/faq/');
    await cells[5]!.find('[data-md-pick]').trigger('click');
    expect(state.media.de.heroGrid[5]).toBe('/uploads/de/neu.webp');
    await cells[5]!.find('[data-md-reset]').trigger('click');
    expect(state.media.de.heroGrid[5]).toBe('');
    w.unmount();

    state.media.de.heroMode = 'banner';
    w = mountTab();
    expect(w.find('[data-md-banner]').exists()).toBe(true);
    await w.find('[data-md-gotolayout]').trigger('click');
    expect(w.props('gotoLayout')).toHaveBeenCalled();
    w.unmount();
  });
});
