// @vitest-environment happy-dom
/**
 * Tab „Tool-Karten“ als Vue-Insel (server/admin/app/tabs/toolcards): Lesen und
 * Schreiben über den Service aus public/toolcards.js (echte Modell-Funktionen),
 * Regeln wie die Vanilla-Fassung.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ToolCardsTab from '../../server/admin/app/tabs/toolcards/ToolCardsTab.vue';
import { tcRev, tcUi } from '../../server/admin/app/tabs/toolcards/tcUi';
import {
  cardStyle,
  setCardText,
  textStyles,
  type TcService,
  type TcSide,
} from '../../server/admin/app/tabs/toolcards/tcData';
import { useToastStore } from '../../server/admin/app/stores/toast';
import { tcService } from '../../server/admin/public/toolcards.js';
import {
  state,
  defaultMedia,
  getToolCards,
  toolCardSideLight,
  isCardHidden,
} from '../../server/admin/public/model';

const card = (title: string, link = '/x/') => ({
  title,
  badge: 'Neu',
  description: `${title} – Beschreibung`,
  link,
  svg: '/icons/a.svg',
});

function makeService(picked: string | null = '/uploads/de/card.webp'): TcService {
  const svc = tcService('de') as unknown as TcService;
  return {
    ...svc,
    pick: vi.fn((_t: string, onPick: (u: string) => void) => {
      if (picked === null) return false;
      onPick(picked);
      return true;
    }),
  };
}
const lastToast = () => useToastStore().toasts.at(-1)?.message ?? '';
const tc = () => getToolCards('de');

beforeEach(() => {
  setActivePinia(createPinia());
  state.media = defaultMedia() as typeof state.media;
  state.defaults = {
    de: {
      tool: { open: 'Öffnen' },
      tools: { mp3: card('MP3-Konverter'), cut: card('Audio-Cutter') },
      imageTools: { conv: card('Bildkonverter') },
      diverseTools: {},
    },
    en: {
      tool: { open: 'Open' },
      tools: { mp3: card('MP3 converter'), cut: card('Audio cutter') },
      imageTools: { conv: card('Image converter') },
      diverseTools: {},
    },
  } as typeof state.defaults;
  state.overrides = { de: {}, en: {} };
  Object.assign(tcUi, { prevMode: 'light', ovTheme: 'light', ovOpen: false, selected: '' });
  tcUi.targets.clear();
  tcRev.value = 0;
  document.body.innerHTML = '';
});

const mountTab = (service = makeService()) =>
  mount(ToolCardsTab, { attachTo: document.body, props: { service } });
const confirmDialog = async () => {
  await flushPromises();
  document.querySelector<HTMLButtonElement>('[data-tc-confirm]')!.click();
  await flushPromises();
};
async function selectCard(w: VueWrapper, id: string) {
  await w.find('select[data-tcsel]').setValue(id);
}

describe('tcData (Regeln wie public/toolcards.js)', () => {
  it('Karten-Stil inkl. Hover-Variablen und Text-Stile', () => {
    const s: TcSide = { ...toolCardSideLight(), borderWidth: 2, hoverBgOpacity: 50 };
    const st = cardStyle(s, 'light') as Record<string, string>;
    expect(st.border).toBe('2px solid rgba(229, 231, 235, 1)');
    expect(st['--tc-hbc']).toBe('rgba(1, 79, 153, 0.22)');
    expect(st['--tc-hbg']).toBe('rgba(255, 255, 255, 0.5)');
    const ts = textStyles(
      { ...s, titleColor: '#ff0000' },
      'dark',
      {
        ...tcService('de').textDefault(),
        titleSize: 20,
        align: 'center',
      },
      (f) => f,
    );
    expect(ts.title).toBe('color:#ff0000;font-size:20px;text-align:center;');
    expect(ts.alignSelf).toBe('align-self:center;');
  });

  it('setCardText: Link prüfen, Badge leer erlaubt, Titel max. 2 Zeilen', () => {
    const svc = makeService();
    expect(setCardText(svc, 'tools.mp3', 'link', 'javascript:alert(1)')).toBe(false);
    expect(state.overrides.de).toEqual({});
    setCardText(svc, 'tools.mp3', 'link', ' https://a.de ');
    setCardText(svc, 'tools.mp3', 'badge', '  ');
    setCardText(svc, 'tools.mp3', 'title', ' Eins \n\n Zwei \nDrei');
    expect(state.overrides.de).toEqual({
      tools: { mp3: { link: 'https://a.de', badge: '', title: 'Eins\nZwei' } },
    });
    setCardText(svc, 'tools.mp3', 'title', '   ');
    expect(svc.effText(['tools', 'mp3', 'title'])).toBe('MP3-Konverter');
  });
});

describe('ToolCardsTab (Vue-Insel)', () => {
  it('liest ohne zu schreiben; anderer Modus zugeklappt', () => {
    getToolCards('de');
    const before = JSON.stringify({ m: state.media, o: state.overrides });
    const w = mountTab();
    expect(w.find('[data-tcside="light"] .tc-side-head').exists()).toBe(true);
    expect(w.find('[data-tcshowmode="dark"]').exists()).toBe(true);
    expect(w.find('[data-tcprev="light"] .tc-card').exists()).toBe(true);
    expect(w.find('[data-tcnote]').text()).toContain('ist aus');
    expect(JSON.stringify({ m: state.media, o: state.overrides })).toBe(before);
    w.unmount();
  });

  it('Standard-Design bearbeiten schaltet das Design ein; Vorschau folgt', async () => {
    const w = mountTab();
    await w.find('input.tc-bw').setValue('3');
    expect(tc().default.light.borderWidth).toBe(3);
    expect(tc().enabled).toBe(true);
    expect(lastToast()).toContain('Tool-Karten-Design aktiviert');
    expect(w.find('[data-tcprev="light"] .tc-card').attributes('style')).toContain('3px solid');
    await w.find('[data-tc-gradient] button[role="switch"]').trigger('click');
    expect(tc().default.light.gradient).toBe(true);
    expect(w.find('[data-tcprev="light"] .tc-card').attributes('style')).toContain(
      'linear-gradient(135deg',
    );
    // Text-Farbe einschalten = Vorschlagsfarbe des Modus
    await w.find('[data-tc-color="titleColor"] [data-tcon] button[role="switch"]').trigger('click');
    expect(tc().default.light.titleColor).toBe('#003971');
    // Moduswechsel: Dunkel bearbeitet die Dunkel-Felder
    await w.find('[data-tcshowmode="dark"]').trigger('click');
    expect(tcUi.prevMode).toBe('dark');
    expect(tcUi.ovTheme).toBe('dark');
    await w.find('input.tc-bw').setValue('5');
    expect(tc().default.dark.borderWidth).toBe(5);
    expect(tc().default.light.borderWidth).toBe(3);
    w.unmount();
  });

  it('Einzel-Design: anlegen, bearbeiten, ↺ auf Standard, wieder entfernen', async () => {
    const w = mountTab();
    await selectCard(w, 'tools.cut');
    expect(w.find('[data-tc-sidestd]').exists()).toBe(true);
    await w.find('[data-tcown] button[role="switch"]').trigger('click');
    expect(tc().cards['tools.cut']).toEqual(tc().default);
    await w.find('input.tc-bw').setValue('6');
    expect(tc().cards['tools.cut']!.light.borderWidth).toBe(6);
    expect(tc().default.light.borderWidth).toBe(1);
    await w.find('[data-tc-color="borderColor"] [data-tc-colorreset]').trigger('click');
    expect(tc().cards['tools.cut']!.light.borderColor).toBe(tc().default.light.borderColor);
    expect(w.find('select[data-tcsel]').text()).toContain('Audio-Cutter ●');
    await w.find('[data-tcown] button[role="switch"]').trigger('click');
    expect(tc().cards['tools.cut']).toBeUndefined();
    w.unmount();
  });

  it('Texte: Entwurf beim Tippen, Override normalisiert, ungültiger Link, ↺', async () => {
    const w = mountTab();
    await selectCard(w, 'tools.mp3');
    const title = w.find<HTMLTextAreaElement>('textarea[data-tctx="title"]');
    title.element.value = 'Neu ';
    await title.trigger('input');
    expect(title.element.value).toBe('Neu ');
    expect(state.overrides.de).toEqual({ tools: { mp3: { title: 'Neu' } } });
    expect(w.find('[data-tcprev="light"] .tc-title').text()).toBe('Neu');
    const link = w.find<HTMLInputElement>('input[data-tctx="link"]');
    link.element.value = 'javascript:x';
    await link.trigger('input');
    await link.trigger('change');
    expect(link.classes()).toContain('tc-invalid');
    expect(lastToast()).toContain('Link nicht übernommen');
    expect(state.overrides.de).toEqual({ tools: { mp3: { title: 'Neu' } } });
    await w.find('[data-tctxreset="title"]').trigger('click');
    expect(state.overrides.de).toEqual({});
    // „Öffnen“-Beschriftung beim Standard
    await selectCard(w, '');
    const open = w.find<HTMLInputElement>('input[data-tctx="open"]');
    open.element.value = 'Starten';
    await open.trigger('input');
    expect(state.overrides.de.tool).toEqual({ open: 'Starten' });
    expect(w.find('[data-tcprev="light"] .tc-open').text()).toBe('Starten');
    w.unmount();
  });

  it('Karten duplizieren, anlegen, ausblenden und löschen (mit Rückfrage)', async () => {
    const w = mountTab();
    await selectCard(w, 'tools.mp3');
    await w.find('[data-tcdup]').trigger('click');
    expect(tcUi.selected).toBe('tools.mp3-kopie');
    expect(state.overrides.de.tools).toMatchObject({
      'mp3-kopie': { title: 'MP3-Konverter (Kopie)' },
    });
    expect(state.overrides.en.tools).toMatchObject({
      'mp3-kopie': { title: 'MP3 converter (Copy)' },
    });

    await w.find('[data-tchide]').trigger('click');
    expect(isCardHidden('tools.mp3-kopie')).toBe(true);
    expect(w.find('[data-tcshow="tools.mp3-kopie"]').exists()).toBe(true);
    await w.find('[data-tcshow="tools.mp3-kopie"]').trigger('click');
    expect(isCardHidden('tools.mp3-kopie')).toBe(false);

    await w.find('[data-tcdel]').trigger('click');
    await confirmDialog();
    expect(tcUi.selected).toBe('');
    expect(
      (state.overrides.de.tools as Record<string, unknown> | undefined)?.['mp3-kopie'],
    ).toBeUndefined();

    await w.find('select[data-tcnewsec]').setValue('imageTools');
    await w.find('[data-tcnew]').trigger('click');
    expect(tcUi.selected).toBe('imageTools.neue-karte');
    expect(isCardHidden('imageTools.neue-karte')).toBe(true);
    expect(w.find('[data-tcdel]').exists()).toBe(true);
    w.unmount();
  });

  it('Typografie und Sichtbarkeit wirken auf die Vorschau', async () => {
    const w = mountTab();
    await w.find('input.tct-titleSize').setValue('22');
    expect(tc().default.text!.titleSize).toBe(22);
    expect(w.find('[data-tcprev="light"] .tc-title').attributes('style')).toContain(
      'font-size: 22px',
    );
    await w.find('select[data-tct="titleWeight"]').setValue('800');
    expect(tc().default.text!.titleWeight).toBe('800');
    await w.find('[data-tcel="icon"] button[role="switch"]').trigger('click');
    expect(tc().default.show!.icon).toBe(false);
    expect(w.find('[data-tcshowinfo]').text()).toContain('1 Element(e) ausgeblendet');
    expect(w.find('[data-tcprev="light"] .tc-icon').attributes('style')).toContain(
      'visibility: hidden',
    );
    await w.find('[data-tcelall]').trigger('click');
    expect(tc().default.show!.icon).toBe(true);
    w.unmount();
  });

  it('Design übertragen und als Standard übernehmen', async () => {
    const w = mountTab();
    await selectCard(w, 'tools.mp3');
    await w.find('[data-tcown] button[role="switch"]').trigger('click');
    await w.find('input.tc-bw').setValue('4');
    await w.find('[data-tctarget="imageTools.conv"]').setValue(true);
    expect(w.find('[data-tcapply]').text()).toContain('auf 1 Karte(n)');
    await w.find('[data-tcapply]').trigger('click');
    expect(tc().cards['imageTools.conv']!.light.borderWidth).toBe(4);
    expect(tcUi.targets.size).toBe(0);

    await w.find('[data-tcasdefault]').trigger('click');
    await confirmDialog();
    expect(tc().default.light.borderWidth).toBe(4);
    expect(tc().cards['tools.mp3']).toBeUndefined();

    // Standard als Quelle: Ziele verlieren ihr eigenes Design
    await selectCard(w, '');
    await w.find('[data-tctargetsec="imageTools"]').trigger('click');
    await w.find('[data-tcapply]').trigger('click');
    expect(tc().cards['imageTools.conv']).toBeUndefined();
    w.unmount();
  });

  it('Bild aus der Mediathek, ungültige URL, keine Medien; Design nach EN', async () => {
    let w = mountTab();
    await w.find('[data-tcimgpick]').trigger('click');
    expect(tc().default.light.bgImage).toBe('/uploads/de/card.webp');
    expect(w.find('[data-tcprev="light"] .tc-img').attributes('style')).toContain(
      'url("/uploads/de/card.webp")',
    );
    const url = w.find<HTMLInputElement>('input[data-tc-imageurl]');
    await url.setValue('javascript:x');
    expect(tc().default.light.bgImage).toBe('');
    expect(lastToast()).toContain('Ungültige Bild-URL');

    await w.find('[data-tccopylang]').trigger('click');
    await confirmDialog();
    expect(state.media.en.toolCards).toEqual(tc());
    expect(state.media.en.toolCards).not.toBe(tc());
    w.unmount();

    w = mountTab(makeService(null));
    await w.find('[data-tcimgpick]').trigger('click');
    expect(lastToast()).toContain('Keine Medien vorhanden');
    w.unmount();
  });

  it('Übersicht: erst aufgeklappt gerendert, Klick wählt die Karte', async () => {
    const w = mountTab();
    expect(w.find('[data-tcpick]').exists()).toBe(false);
    const det = w.find<HTMLDetailsElement>('[data-tcovdetails]');
    det.element.open = true;
    await det.trigger('toggle');
    expect(w.findAll('[data-tcpick]')).toHaveLength(3);
    await w.find('[data-tcpick="imageTools.conv"]').trigger('click');
    expect(tcUi.selected).toBe('imageTools.conv');
    expect(w.find('[data-tcpick="imageTools.conv"]').classes()).toContain('active');
    w.unmount();
  });
});
