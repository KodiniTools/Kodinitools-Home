// @vitest-environment happy-dom
/**
 * Tab „Icons“ als Vue-Insel (server/admin/app/tabs/icons): gleiche Regeln wie
 * die Vanilla-Fassung (public/icons.js, getIconTint/setIconTint) und Änderungen
 * landen direkt in den übergebenen state-Objekten (Autosave/Undo per Snapshot).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import IconsTab from '../../server/admin/app/tabs/icons/IconsTab.vue';
import { iconLists, iconsUi, resetIconsUi } from '../../server/admin/app/tabs/icons/iconsUi';
import {
  applyIconTarget,
  filterIcons,
  getTint,
  iconLabel,
  iconUrl,
  normIconLists,
  setTint,
  toolSvg,
  validLink,
  type IconLists,
  type ToolRef,
} from '../../server/admin/app/tabs/icons/iconsData';
import { useToastStore } from '../../server/admin/app/stores/toast';
import {
  state,
  defaultMedia,
  getIconTint,
  setIconTint,
  setPath,
} from '../../server/admin/public/model.js';
import type { Overrides } from '../../server/admin/types';

const LISTS: IconLists = {
  solid: ['star.svg', 'arrow-up.svg'],
  regular: ['star.svg'],
  brands: ['github.svg'],
  admin: ['logo kodini.svg'],
};

describe('iconsData (Regeln wie public/icons.js)', () => {
  it('URLs, Beschriftung, Antwort-Normalisierung', () => {
    expect(iconUrl('solid', 'star.svg')).toBe('/fontawesome/svgs/solid/star.svg');
    expect(iconUrl('admin', 'logo kodini.svg')).toBe('/fontawesome/admin-svgs/logo%20kodini.svg');
    expect(iconLabel('star.SVG')).toBe('star');
    expect(normIconLists({ icons: { solid: ['a.svg', 3], brands: 'x' } })).toEqual({
      solid: ['a.svg'],
      regular: [],
      brands: [],
      admin: [],
    });
    expect(normIconLists(null).solid).toEqual([]);
  });

  it('Filter nach Set und Suchbegriff', () => {
    expect(filterIcons(LISTS, 'STAR', '')).toEqual([
      { cat: 'solid', name: 'star.svg' },
      { cat: 'regular', name: 'star.svg' },
    ]);
    expect(filterIcons(LISTS, '', 'brands')).toEqual([{ cat: 'brands', name: 'github.svg' }]);
    expect(filterIcons(LISTS, 'svg', '')).toEqual([]); // Endung zählt nicht
    expect(filterIcons(null, '', '')).toEqual([]);
  });

  it('Links wie Server-Validierung', () => {
    expect(validLink('')).toBe(true);
    expect(validLink('/faq/')).toBe(true);
    expect(validLink('https://x.de')).toBe(true);
    expect(validLink('javascript:alert(1)')).toBe(false);
    expect(validLink('www.x.de')).toBe(false);
  });

  it('toolSvg: Override (auch leer) vor Standard', () => {
    const t: ToolRef = { section: 'tools', key: 'a', title: 'A' };
    const defs = { tools: { a: { svg: '/d.svg' } } };
    expect(toolSvg({}, defs, t)).toBe('/d.svg');
    expect(toolSvg({ tools: { a: { svg: '' } } }, defs, t)).toBe('');
    expect(toolSvg({ tools: { a: { svg: '/o.svg' } } }, defs, t)).toBe('/o.svg');
  });

  it('getTint/setTint identisch zu getIconTint/setIconTint', () => {
    state.media = defaultMedia();
    const host = { iconTint: {} as Record<string, Record<string, string>> };
    const steps: Array<[string, Record<string, string>]> = [
      ['tools.a', { light: '#123456' }],
      ['tools.a', { bg: 'kaputt' }],
      ['imageTools.b-2', { dark: '#abc', bgDark: '#ffffff' }],
      ['tools.a', { light: '' }],
      ['ungültig', { light: '#000000' }],
      ['imageTools.b-2', { dark: '', bgDark: '' }],
    ];
    for (const [id, patch] of steps) {
      setIconTint('de', id, patch);
      setTint(host, id, patch);
      expect(host.iconTint).toEqual(state.media.de.iconTint);
      expect(getTint(host, id)).toEqual(getIconTint('de', id));
    }
  });

  it('applyIconTarget: Banner, Kachel, Tool-Icon', () => {
    const media: Record<string, unknown> = {};
    const ov: Overrides = {};
    expect(applyIconTarget(media, ov, 'en', 'banner', '/u.svg', '/x', setPath)).toBe(
      'Icon als Einzel-Banner (EN) gesetzt + Link',
    );
    expect(media).toMatchObject({ heroBanner: '/u.svg', heroBannerLink: '/x', heroMode: 'banner' });
    applyIconTarget(media, ov, 'de', 'grid3', '/g.svg', '', setPath);
    expect(media.heroGrid).toEqual(['', '', '', '/g.svg', '', '']);
    expect(media.heroGridLinks).toEqual(['', '', '', '', '', '']);
    expect(media.heroMode).toBe('grid');
    expect(applyIconTarget(media, ov, 'de', 'tool:tools:a:b', '/t.svg', '', setPath)).toBe(
      'Tool-Icon „a:b“ (DE) gesetzt',
    );
    expect(ov).toEqual({ tools: { 'a:b': { svg: '/t.svg' } } });
    expect(applyIconTarget(media, ov, 'de', 'grid9', '/t.svg', '', setPath)).toBeNull();
  });
});

describe('IconsTab (Vue-Insel)', () => {
  const tools: ToolRef[] = [
    { section: 'tools', key: 'cutter', title: 'Audio Cutter' },
    { section: 'imageTools', key: 'conv', title: 'Bildkonverter' },
  ];
  let overrides: { de: Overrides; en: Overrides };
  let defaults: { de: Overrides; en: Overrides };
  let media: ReturnType<typeof defaultMedia>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setActivePinia(createPinia());
    resetIconsUi();
    overrides = { de: {}, en: {} };
    defaults = {
      de: { tools: { cutter: { svg: '/fontawesome/svgs/solid/cut.svg' } } },
      en: { tools: { cutter: { svg: '/fontawesome/svgs/solid/cut.svg' } } },
    };
    media = defaultMedia();
    fetchMock = vi.fn(async () => new Response(JSON.stringify({ icons: LISTS }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    document.body.innerHTML = '';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  function mountTab(lang: 'de' | 'en' = 'de') {
    return mount(IconsTab, {
      attachTo: document.body,
      props: { lang, overrides, defaults, media, tools },
    });
  }

  it('lädt die Icons einmal, zeigt Treffer, ohne den Zustand zu verändern', async () => {
    const before = JSON.stringify({ overrides, media });
    const w = mountTab();
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]![0])).toMatch(/api\/fontawesome$/);
    expect(w.findAll('[data-ic-icon]')).toHaveLength(5);
    expect(w.find('[data-ic-count]').text()).toBe('5 Treffer');
    expect(JSON.stringify({ overrides, media })).toBe(before);
    w.unmount();
    mountTab().unmount();
    await flushPromises();
    expect(fetchMock).toHaveBeenCalledTimes(1); // Cache über Neu-Mounts
  });

  it('Suche (verzögert) und Set-Filter', async () => {
    vi.useFakeTimers();
    const w = mountTab();
    await flushPromises();
    await w.find('[data-ic-search]').setValue('git');
    expect(w.findAll('[data-ic-icon]')).toHaveLength(5);
    vi.advanceTimersByTime(150);
    await flushPromises();
    expect(w.findAll('[data-ic-icon]')).toHaveLength(1);
    await w.find('[data-ic-search]').setValue('');
    vi.advanceTimersByTime(150);
    await w.find('select[data-ic-cat]').setValue('regular');
    expect(w.findAll('[data-ic-icon]').map((b) => b.attributes('data-ic-icon'))).toEqual([
      'regular/star.svg',
    ]);
    w.unmount();
  });

  it('Icon wählen und als Kachel bzw. Tool-Icon hinzufügen; ungültiger Link wird abgelehnt', async () => {
    const w = mountTab();
    await flushPromises();
    await w.find('[data-ic-icon="brands/github.svg"]').trigger('click');
    expect(iconsUi.sel).toEqual({ cat: 'brands', name: 'github.svg' });
    const url = '/fontawesome/svgs/brands/github.svg';
    expect((w.find('input[data-ic-url]').element as HTMLInputElement).value).toBe(url);

    await w.find('input[data-ic-link]').setValue('ftp://x');
    await w.find('[data-ic-add]').trigger('click');
    expect(media.de.heroBanner).not.toBe(url);
    expect(useToastStore().toasts.at(-1)?.type).toBe('warning');

    await w.find('input[data-ic-link]').setValue('/faq/');
    await w.find('select[data-ic-target]').setValue('grid1');
    await w.find('select[data-ic-lang]').setValue('en');
    await w.find('[data-ic-add]').trigger('click');
    expect(media.en.heroGrid[1]).toBe(url);
    expect(media.en.heroGridLinks[1]).toBe('/faq/');
    expect(media.en.heroMode).toBe('grid');

    await w.find('select[data-ic-target]').setValue('tool:imageTools:conv');
    expect(w.find('[data-ic-toolprev]').text()).toContain('Bildkonverter');
    await w.find('[data-ic-add]').trigger('click');
    expect(overrides.en).toEqual({ imageTools: { conv: { svg: url } } });
    w.unmount();
  });

  it('Tool-Karten-Icons: Zuweisen, Entfernen, Standard', async () => {
    const w = mountTab();
    await flushPromises();
    const row = () => w.find('[data-ic-tool="tools.cutter"]');
    await row().find('[data-ic-tooladd]').trigger('click');
    expect(overrides.de).toEqual({});
    expect(useToastStore().toasts.at(-1)?.message).toContain('Zuerst oben');
    await w.find('[data-ic-icon="solid/star.svg"]').trigger('click');
    await row().find('[data-ic-tooladd]').trigger('click');
    expect(overrides.de).toEqual({
      tools: { cutter: { svg: '/fontawesome/svgs/solid/star.svg' } },
    });
    await row().find('[data-ic-toolremove]').trigger('click');
    expect(overrides.de).toEqual({ tools: { cutter: { svg: '' } } });
    expect(row().find('[data-ic-toolremove]').attributes('disabled')).toBeDefined();
    await row().find('[data-ic-toolreset]').trigger('click');
    expect(overrides.de).toEqual({});
    expect(row().find('img').attributes('src')).toBe('/fontawesome/svgs/solid/cut.svg');
    w.unmount();
  });

  it('Icon-Färbung je Modus: an/aus, Zurücksetzen, anderer Modus zugeklappt', async () => {
    const w = mountTab();
    await flushPromises();
    const row = () => w.find('[data-ic-tool="tools.cutter"]');
    await row().find('[data-ic-tinttoggle]').trigger('click');
    expect(row().find('[data-ic-tintbox]').exists()).toBe(true);
    await row().find('[data-ic-tinton="light"]').setValue(true);
    expect(media.de.iconTint['tools.cutter']).toEqual({
      light: '#014f99',
      dark: '',
      bg: '',
      bgDark: '',
    });
    expect(row().find('.ic-tprev__mask').exists()).toBe(true);
    expect(row().find('[data-ic-tinttoggle]').text()).toContain('●');

    await row().find('[data-ic-tintshowmode="dark"]').trigger('click');
    expect(iconsUi.tintMode).toBe('dark');
    expect(row().find('[data-ic-tinton="bgDark"]').exists()).toBe(true);
    await row().find('[data-ic-tinton="bgDark"]').setValue(true);
    expect(media.de.iconTint['tools.cutter']!.bgDark).toBe('#eef1f5');

    await row().find('[data-ic-tintreset]').trigger('click');
    expect(media.de.iconTint['tools.cutter']).toBeUndefined();
    w.unmount();
  });

  it('ohne Icons auf dem Server: Hinweis statt Bibliothek', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }));
    const w = mountTab();
    await flushPromises();
    expect(iconLists.value).not.toBeNull();
    expect(w.find('[data-ic-grid]').text()).toContain('Keine Icons gefunden');
    w.unmount();
  });
});
