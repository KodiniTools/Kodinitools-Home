// @vitest-environment happy-dom
/**
 * Laufband-Tab als Vue-Insel (server/admin/app/tabs/ticker): gleiche Regeln wie
 * die Vanilla-Fassung (public/ticker.js) und Änderungen landen direkt im
 * übergebenen state.ticker-Objekt (Autosave/Undo erkennen sie per Snapshot).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TickerTab from '../../server/admin/app/tabs/ticker/TickerTab.vue';
import { tickerUi } from '../../server/admin/app/tabs/ticker/tickerUi';
import {
  clampFontSize,
  clampOpacity,
  insertInlineLink,
  oneLine,
  parseTickerText,
  tickerPreviewNote,
  tickerPreviewStyle,
} from '../../server/admin/app/tabs/ticker/tickerText';
import { useToastStore } from '../../server/admin/app/stores/toast';
import { emptyTicker, normTicker } from '../../server/admin/public/model-ticker.js';
import type { TickerConfig, TickerItem } from '../../server/admin/types';

describe('tickerText (Regeln wie public/ticker.js)', () => {
  it('oneLine macht aus Zeilenumbrüchen Leerzeichen', () => {
    expect(oneLine('a\n b\r\n\nc')).toBe('a b c');
    expect(oneLine(undefined)).toBe('');
  });

  it('parseTickerText erkennt gültige Links und lässt ungültige wörtlich stehen', () => {
    expect(parseTickerText('Neu: [FAQ](/faq/) und [x](javascript:alert(1)) <b>')).toEqual([
      { kind: 'text', text: 'Neu: ' },
      { kind: 'link', text: 'FAQ', url: '/faq/' },
      { kind: 'text', text: ' und [x](javascript:alert(1)) <b>' },
    ]);
    expect(parseTickerText('[Ext](https://a.de)')).toEqual([
      { kind: 'link', text: 'Ext', url: 'https://a.de' },
    ]);
    expect(parseTickerText('')).toEqual([]);
  });

  it('insertInlineLink ersetzt das erste Vorkommen, sonst anhängen; prüft Eingaben', () => {
    const it1: TickerItem = { id: '1', text: 'Jetzt aktuell und aktuell', link: '' };
    expect(insertInlineLink(it1, 'aktuell', '/neu/')).toEqual({ ok: true });
    expect(it1.text).toBe('Jetzt [aktuell](/neu/) und aktuell');
    const it2: TickerItem = { id: '2', text: 'Hallo', link: '' };
    insertInlineLink(it2, 'Welt', 'https://x.de');
    expect(it2.text).toBe('Hallo [Welt](https://x.de)');
    const it3: TickerItem = { id: '3', text: '', link: '' };
    insertInlineLink(it3, 'A', '/a');
    expect(it3.text).toBe('[A](/a)');
    expect(insertInlineLink(it3, '', '/a')).toEqual({
      ok: false,
      msg: 'Bitte Wort und Link ausfüllen.',
    });
    expect(insertInlineLink(it3, 'A', 'ftp://x').ok).toBe(false);
  });

  it('Vorschau-Stil, Hinweis und Begrenzungen', () => {
    const s = emptyTicker().style;
    s.dark.bgColor = '#000000';
    s.dark.bgOpacity = 50;
    const st = tickerPreviewStyle(s, 'dark', 'kodini-font-x');
    expect(st.background).toBe('rgba(0, 0, 0, 0.5)');
    expect(st.fontSize).toBe('14px');
    expect(st.fontFamily).toBe('"kodini-font-x", system-ui, sans-serif');
    expect(tickerPreviewStyle(s, 'light', '').fontFamily).toBeUndefined();
    expect(tickerPreviewNote(s)).toMatch(/^⚠️/);
    s.enabled = true;
    expect(tickerPreviewNote(s)).toMatch(/^✅/);
    expect([clampFontSize('99'), clampFontSize('x'), clampFontSize('3')]).toEqual([48, 14, 8]);
    expect([clampOpacity('120'), clampOpacity('-3'), clampOpacity('x')]).toEqual([100, 0, 0]);
  });
});

describe('TickerTab.vue', () => {
  let ticker: TickerConfig;
  const mk = () =>
    mount(TickerTab, {
      props: {
        ticker,
        lang: 'de',
        fonts: [{ name: 'A.woff2', label: 'A', url: '/fonts/A.woff2', bytes: 1 }],
        pageBg: { light: '#fafafa', dark: '#091428' },
        ensureFontFace: (f: string) => (f ? `kodini-font-${f}` : ''),
      },
      attachTo: document.body,
    });

  beforeEach(() => {
    setActivePinia(createPinia());
    tickerUi.editMode = 'light';
    tickerUi.designOpen = false;
    ticker = normTicker({
      enabled: true,
      speed: 'normal',
      items: [
        { id: 'a', text: 'Erster [Link](/faq/)', link: '' },
        { id: 'b', text: 'Zweiter', link: '/x/' },
      ],
    });
  });

  it('zeigt Einträge mit Vorschau (Links escaped als <a>)', () => {
    const w = mk();
    expect(w.findAll('[data-tk-item]')).toHaveLength(2);
    const prev = w.findAll('[data-tk-preview-text]');
    expect(prev[0]!.find('a').attributes('href')).toBe('/faq/');
    expect(prev[0]!.text()).toBe('Erster Link');
    w.unmount();
  });

  it('schreibt Änderungen direkt in das state-Objekt', async () => {
    const w = mk();
    await w.findAll('textarea')[1]!.setValue('Neu\nzweizeilig');
    expect(ticker.items[1]!.text).toBe('Neu\nzweizeilig');
    expect(w.findAll('[data-tk-preview-text]')[1]!.text()).toBe('Neu zweizeilig');
    await w.find('select').setValue('fast');
    expect(ticker.speed).toBe('fast');
    w.unmount();
  });

  it('hinzufügen, verschieben, löschen', async () => {
    const w = mk();
    await w.find('[data-tk-add]').trigger('click');
    expect(ticker.items).toHaveLength(3);
    await w.findAll('[data-tk-down]')[0]!.trigger('click');
    expect(ticker.items.map((i) => i.id)).toEqual(['b', 'a', expect.any(String)]);
    await w.findAll('[data-tk-up]')[1]!.trigger('click');
    expect(ticker.items.map((i) => i.id).slice(0, 2)).toEqual(['a', 'b']);
    await w.findAll('[data-tk-del]')[0]!.trigger('click');
    expect(ticker.items.map((i) => i.id).slice(0, 1)).toEqual(['b']);
    expect(w.findAll('[data-tk-up]')[0]!.attributes('disabled')).toBeDefined();
    w.unmount();
  });

  it('Wort verlinken: Erfolg und Fehler als Toast', async () => {
    const w = mk();
    const toasts = useToastStore();
    const inputs = w.findAll('[data-tk-item]')[1]!.findAll('input');
    await inputs[0]!.setValue('Zweiter');
    await inputs[1]!.setValue('/faq/');
    await w.findAll('[data-tk-linkword]')[1]!.trigger('click');
    expect(ticker.items[1]!.text).toBe('[Zweiter](/faq/)');
    expect(toasts.toasts.at(-1)).toMatchObject({ type: 'success' });
    await w.findAll('[data-tk-linkword]')[0]!.trigger('click');
    expect(toasts.toasts.at(-1)).toMatchObject({
      type: 'warning',
      message: 'Bitte Wort und Link ausfüllen.',
    });
    w.unmount();
  });

  it('Design: Typografie begrenzt, Modus-Umschaltung über die zugeklappte Leiste', async () => {
    const w = mk();
    await w.find('[data-tk-fontsize]').setValue('99');
    expect(ticker.style.fontSize).toBe(48);
    await w.find('[data-tk-spacing]').setValue('3.3');
    expect(ticker.style.letterSpacing).toBe(3.5);
    await w.find('[data-tk-font]').setValue('A.woff2');
    expect(ticker.style.fontFamily).toBe('A.woff2');
    expect(w.find('[data-tk-preview]').attributes('style')).toContain('kodini-font-A.woff2');
    expect(w.find('[data-tk-mode="light"]').exists()).toBe(true);
    await w.find('[data-tk-showmode="dark"]').trigger('keydown', { key: 'Enter' });
    expect(tickerUi.editMode).toBe('dark');
    expect(w.find('[data-tk-mode="dark"]').exists()).toBe(true);
    expect(w.find('[data-tk-showmode="light"]').exists()).toBe(true);
    expect(w.find('[data-tk-note]').text()).toMatch(/^⚠️/);
    w.unmount();
  });

  it('unbekannte gespeicherte Schrift bleibt auswählbar („nicht gefunden“)', () => {
    ticker.style.fontFamily = 'Weg.woff2';
    const w = mk();
    const opts = w.findAll('[data-tk-font] option').map((o) => o.text());
    expect(opts).toEqual(['Standard (System)', 'Weg.woff2 (nicht gefunden)', 'A']);
    w.unmount();
  });
});
