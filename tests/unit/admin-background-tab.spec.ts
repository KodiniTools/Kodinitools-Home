// @vitest-environment happy-dom
/**
 * Tab „Hintergrund“ als Vue-Insel (server/admin/app/tabs/background): Lesen und
 * Schreiben über die normalisierenden Funktionen aus public/model-site.ts,
 * Anzeige-Regeln wie public/background.js.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import BackgroundTab from '../../server/admin/app/tabs/background/BackgroundTab.vue';
import { bgRev, bgUi } from '../../server/admin/app/tabs/background/bgUi';
import {
  BG_RESET,
  extrasNote,
  imageLayerStyle,
  noteFor,
  overlayLayerStyle,
  previewGap,
  previewStyle,
  sectionImgStyle,
  sectionNote,
  type BgService,
  type FxKey,
  type SiteBg,
  type SiteSectionKey,
} from '../../server/admin/app/tabs/background/bgData';
import { useToastStore } from '../../server/admin/app/stores/toast';
import {
  state,
  defaultMedia,
  getSiteBg,
  setSiteBg,
  getSiteFx,
  setSiteFx,
  SITE_FX,
  PAGE_BG_DEFAULT,
  siteBgLayerCss,
  siteBgSplit,
  siteBgImageLayer,
  SITE_GRADIENT_TYPES,
  SITE_PATTERNS,
  getSectionStyle,
  setSectionStyle,
  getSectionGap,
  setSectionGap,
  SECTION_GAP_MAX,
  getSiteSection,
  setSiteSection,
  defaultSectionSide,
} from '../../server/admin/public/model';

const resolveUrl = (v: string) => (v.startsWith('staged:') ? 'blob:' + v.slice(7) : v);

function makeService(picked: string | null = '/uploads/bg.webp') {
  return {
    bg: (m) => getSiteBg(m) as SiteBg,
    setBg: (m, p) => setSiteBg(m, p),
    layers: (m) => {
      const { ground, overlay } = siteBgSplit(m);
      return { full: siteBgLayerCss(m), ground, overlay, image: siteBgImageLayer(m, resolveUrl) };
    },
    fx: (k) => getSiteFx(k),
    setFx: (k, p) => setSiteFx(k, p),
    sectionStyle: getSectionStyle,
    setSectionStyle,
    sectionGap: getSectionGap,
    setSectionGap,
    section: (k, m) => getSiteSection(k, m),
    setSection: (k, m, p) => setSiteSection(k, m, p),
    resolveUrl,
    pick: vi.fn((_t: string, onPick: (u: string) => void) => {
      if (picked === null) return false;
      onPick(picked);
      return true;
    }),
    fxList: SITE_FX as { key: FxKey; label: string }[],
    patterns: SITE_PATTERNS,
    gradientTypes: SITE_GRADIENT_TYPES,
    gapMax: SECTION_GAP_MAX,
    pageBgDefault: PAGE_BG_DEFAULT,
    defaultSectionSide,
  } satisfies BgService;
}

beforeEach(() => {
  setActivePinia(createPinia());
  state.media = defaultMedia() as typeof state.media;
  bgUi.prevMode = 'light';
  bgRev.value = 0;
  document.body.innerHTML = '';
});

describe('bgData (Regeln wie public/background.js)', () => {
  it('Hinweise zu Farbe, Muster/Bild und Sektionen', () => {
    expect(noteFor(getSiteBg('light'), '#fafafa')).toContain('Standardfarbe (#fafafa)');
    setSiteBg('dark', { color: '#112233', gradient: true, color2: '#445566', opacity: 60 });
    expect(noteFor(getSiteBg('dark'), '#091428')).toBe(
      '✅ Eigener Hintergrund wird auf der Seite angewandt (linearer Verlauf, 180°; Deckkraft 60 % über der Standardfarbe #091428).',
    );
    expect(extrasNote(getSiteBg('light'))).toBe('Kein Muster und kein Hintergrundbild.');
    setSiteBg('light', { pattern: 'dots', image: 'staged:m1', imageFixed: false, imageBlur: 3 });
    expect(extrasNote(getSiteBg('light'))).toBe(
      '✅ Punktraster (24 px, 12 % Deckkraft) · Hintergrundbild (lokal, wird beim Veröffentlichen hochgeladen): scrollt mit, läuft nach unten aus, 3 px weich.',
    );
    setSiteSection('audio', 'dark', { color: '#e8a945', opacity: 8 });
    setSectionGap(30);
    expect(sectionNote((k, m) => getSiteSection(k, m), getSectionGap())).toBe(
      '✅ Abgesetzt: Audio-Tools (Dunkel: Tönung 8 %) · Abstand 30 px.',
    );
  });

  it('Vorschau-Ebenen: mit Bild Grund + Overlay getrennt, ohne Bild alles zusammen', () => {
    const svc = makeService();
    setSiteBg('light', { color: '#123456', opacity: 50 });
    let l = svc.layers('light');
    expect(previewStyle(l, 'light')).toBe(`background:${siteBgLayerCss('light')};color:#003971`);
    expect(imageLayerStyle(l)).toBe('display:none');
    expect(overlayLayerStyle(l)).toBe('display:none');
    setSiteBg('light', { image: '/uploads/x.webp', imageFixed: false, imageDarken: 50 });
    l = svc.layers('light');
    expect(previewStyle(l, 'light')).toBe('background:#fafafa;color:#003971');
    expect(imageLayerStyle(l)).toContain("url('/uploads/x.webp')");
    expect(imageLayerStyle(l)).toContain('brightness(0.500)');
    expect(imageLayerStyle(l)).toContain('mask-image');
    expect(overlayLayerStyle(l)).toContain('linear-gradient(');
    expect(
      sectionImgStyle({ ...defaultSectionSide(), image: 'staged:m9', imageBlur: 2 }, resolveUrl),
    ).toBe("background:url('blob:m9') center / cover no-repeat;filter:blur(2px);opacity:1");
    expect(previewGap(0)).toBe(1);
    expect(previewGap(160)).toBe(16);
  });
});

describe('BackgroundTab (Vue-Insel)', () => {
  const mountTab = (service = makeService()) =>
    mount(BackgroundTab, { attachTo: document.body, props: { service } });

  it('liest ohne zu schreiben; anderer Modus zugeklappt', () => {
    getSiteBg('light'); // sichert media.site (wie die Vanilla-Fassung beim Rendern)
    const before = JSON.stringify(state.media);
    const w = mountTab();
    expect(w.find('[data-bg-side="light"]').exists()).toBe(true);
    expect(w.find('[data-bg-showmode="dark"]').exists()).toBe(true);
    expect(JSON.stringify(state.media)).toBe(before);
    w.unmount();
  });

  it('eigene Farbe, Deckkraft und Verlauf; Vorschau folgt', async () => {
    const w = mountTab();
    await w.find('[data-bg-enable] button[role="switch"]').trigger('click');
    expect(getSiteBg('light').color).toBe('#fafafa');
    await w.find('input.bg-opacity').setValue('40');
    expect(getSiteBg('light').opacity).toBe(40);
    expect(w.find('[data-bg-preview]').attributes('style')).toContain('rgba(250, 250, 250, 0.4)');
    expect(w.find('[data-bg-note]').text()).toContain('Deckkraft 40 %');
    await w.find('[data-bg-gradient] button[role="switch"]').trigger('click');
    expect(getSiteBg('light').gradient).toBe(true);
    expect(getSiteBg('light').color2).toBe('#e3ecf6');
    await w.find('select[data-bg-type]').setValue('radial');
    expect(getSiteBg('light').type).toBe('radial');
    w.unmount();
  });

  it('Muster und Bild (Auswahl, ungültige URL, Entfernen), Reset des Modus', async () => {
    const service = makeService();
    const w = mountTab(service);
    await w.find('select[data-bg-patternsel]').setValue('grid');
    expect(getSiteBg('light').pattern).toBe('grid');
    await w.find('[data-bg-pick]').trigger('click');
    expect(getSiteBg('light').image).toBe('/uploads/bg.webp');
    expect(w.find('[data-bg-thumb] img').attributes('src')).toBe('/uploads/bg.webp');

    const url = w.find<HTMLInputElement>('input[data-bg-imageurl]');
    await url.setValue('javascript:alert(1)');
    expect(getSiteBg('light').image).toBe('');
    expect(useToastStore().toasts.at(-1)?.message).toContain('Ungültige Bild-URL');
    await url.setValue('/uploads/neu.webp');
    expect(getSiteBg('light').image).toBe('/uploads/neu.webp');
    await w.find('[data-bg-imgclear]').trigger('click');
    expect(getSiteBg('light').image).toBe('');

    await w.find('[data-bg-reset]').trigger('click');
    const s = getSiteBg('light');
    for (const [k, v] of Object.entries(BG_RESET))
      if (k !== 'patternColor') expect(s[k as keyof SiteBg]).toBe(v);
    w.unmount();
  });

  it('Moduswechsel: Dunkel bearbeitet die Dunkel-Felder', async () => {
    const w = mountTab();
    await w.find('[data-bg-showmode="dark"]').trigger('click');
    expect(bgUi.prevMode).toBe('dark');
    await w.find('[data-bg-enable] button[role="switch"]').trigger('click');
    expect(getSiteBg('dark').color).toBe('#091428');
    expect(getSiteBg('light').color).toBe('');
    w.unmount();
  });

  it('Sektionen: abwechselnd, Abstand, Tönung/Bild je Modus, Zurücksetzen mit Dialog', async () => {
    const w = mountTab();
    await w.find('[data-bg-secalt]').trigger('click');
    expect(getSiteSection('audio', 'dark').color).toBe('#e8a945');
    expect(getSiteSection('image', 'light').color).toBe('');
    expect(w.find('[data-secprev="audio"] .fx-prev-sec-tint').attributes('style')).toContain(
      'rgba(1, 79, 153, 0.08)',
    );
    await w.find('input.bg-gap').setValue('50');
    expect(getSectionGap()).toBe(50);
    await w.find('select[data-bg-secstyle]').setValue('card');
    expect(getSectionStyle()).toBe('card');

    const col = w.find('[data-bg-seccol="image"]');
    await col.find('[data-bg-secen] button[role="switch"]').trigger('click');
    expect(getSiteSection('image', 'light').color).toBe('#014f99');
    await col.find('[data-bg-secpick]').trigger('click');
    expect(getSiteSection('image', 'light').image).toBe('/uploads/bg.webp');
    expect(w.find('[data-bg-secnote]').text()).toContain('Bild-Tools (Hell: Tönung 8 % + Bild)');

    await w.find('[data-bg-secclear]').trigger('click');
    await flushPromises();
    expect(getSiteSection('audio', 'light').color).toBe('#014f99');
    document.querySelector<HTMLButtonElement>('[data-bg-confirm]')!.click();
    await flushPromises();
    for (const k of ['audio', 'image', 'diverse'] as SiteSectionKey[])
      for (const m of ['light', 'dark'] as const)
        expect(getSiteSection(k, m)).toEqual(defaultSectionSide());
    w.unmount();
  });

  it('Effekte: an/aus und Intensität wirken auf die Vorschau', async () => {
    const w = mountTab();
    const aurora = () => w.find('[data-fxlayer="aurora"]').attributes('style');
    expect(aurora()).toContain('opacity: 0');
    await w.find('[data-bg-fx="fxAurora"] [data-bg-fxon] button[role="switch"]').trigger('click');
    expect(getSiteFx('fxAurora').on).toBe(true);
    await w.find('input.bg-fxint-fxAurora').setValue('80');
    expect(getSiteFx('fxAurora').intensity).toBe(80);
    expect(aurora()).toContain('opacity: 0.8');
    w.unmount();
  });

  it('ohne Medien öffnet sich keine Auswahl', async () => {
    const w = mountTab(makeService(null));
    await w.find('[data-bg-pick]').trigger('click');
    expect(getSiteBg('light').image).toBe('');
    expect(useToastStore().toasts.at(-1)?.message).toContain('Keine Medien vorhanden');
    w.unmount();
  });
});
