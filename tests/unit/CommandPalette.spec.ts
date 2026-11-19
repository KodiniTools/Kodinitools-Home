// @vitest-environment happy-dom
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CommandPalette from '../../src/islands/palette/CommandPalette.vue';
import { RECENT_KEY } from '../../src/islands/palette/recent';

const texts = {
  trigger: 'Tool finden',
  keyHint: 'Strg K',
  keyHintMac: '⌘ K',
  title: 'Tools durchsuchen',
  placeholder: 'Suchen',
  noResults: 'Nichts gefunden',
  favorites: 'Favoriten',
  recent: 'Zuletzt genutzt',
  all: 'Alle Tools',
  results: 'Treffer',
  help: 'Hilfe',
  close: 'Schließen',
};

const entries = [
  { key: 'tools.cutter', keywords: ['schneiden', 'kürzen'], formats: ['mp3', 'wav'] },
  { key: 'tools.normalizer', keywords: ['lauter machen'], formats: ['mp3'] },
  { key: 'imageTools.convert', keywords: ['bild umwandeln'], formats: ['heic', 'jpg'] },
];

function card(key: string, title: string, description: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = 'svg-card-link';
  a.href = `/${key}/`;
  a.dataset.i18nKey = key;
  a.dataset.title = title;
  a.dataset.description = description;
  a.setAttribute('data-svg-de', `/image/${key}.svg`);
  a.innerHTML =
    '<div class="tool-card"><button class="fav-btn"></button><span class="inner">x</span></div>';
  document.body.appendChild(a);
  return a;
}

/** Alle Wrapper eines Tests, damit afterEach sie aushängt (Tastenkürzel liegen auf window). */
const mounted: VueWrapper[] = [];
function mountPalette(attach = true) {
  const wrapper = mount(CommandPalette, {
    props: { lang: 'de', entries, texts },
    ...(attach ? { attachTo: document.body } : {}),
  });
  mounted.push(wrapper);
  return wrapper;
}

const ctrlK = (init: KeyboardEventInit = {}) =>
  window.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
      ...init,
    }),
  );

const rowsText = () =>
  [...document.querySelectorAll('.cmdk-item .cmdk-name')].map((n) => n.textContent);

/** Das Overlay lädt per dynamischem Import nach: warten, bis es im DOM steht. */
const dialogShown = () =>
  vi.waitUntil(() => document.querySelector('.cmdk-dialog'), { timeout: 3000 });

async function open() {
  mountPalette();
  ctrlK();
  await dialogShown();
}

describe('CommandPalette', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    card('tools.cutter', 'Audio-Schneider', 'Audio schneiden');
    card('tools.normalizer', 'Audio Normalizer\nlufs', 'Lautstärke angleichen');
    card('imageTools.convert', 'Bildkonverter', 'HEIC in JPG');
  });
  afterEach(() => {
    mounted.splice(0).forEach((w) => w.unmount());
    document.body.innerHTML = '';
    document.documentElement.classList.remove('cmdk-open');
  });

  it('zeigt nur die Schaltfläche, bis geöffnet wird', () => {
    const wrapper = mountPalette(false);
    expect(wrapper.find('.cmdk-trigger').text()).toContain('Tool finden');
    expect(wrapper.find('.cmdk-trigger').attributes('aria-haspopup')).toBe('dialog');
    expect(document.querySelector('.cmdk-dialog')).toBeNull();
  });

  it('Strg+K öffnet mit allen Karten, erneut schließt', async () => {
    await open();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(document.documentElement.classList.contains('cmdk-open')).toBe(true);
    expect(rowsText()).toEqual(['Audio-Schneider', 'Audio Normalizer', 'Bildkonverter']);
    ctrlK();
    await flushPromises();
    expect(document.querySelector('.cmdk-dialog')).toBeNull();
    expect(document.documentElement.classList.contains('cmdk-open')).toBe(false);
  });

  it('Cmd+K funktioniert wie Strg+K, Alt+Strg+K nicht', async () => {
    mountPalette();
    ctrlK({ altKey: true });
    await flushPromises();
    expect(document.querySelector('.cmdk-dialog')).toBeNull();
    ctrlK({ ctrlKey: false, metaKey: true });
    await dialogShown();
    expect(document.querySelector('.cmdk-dialog')).not.toBeNull();
  });

  it('filtert nach Aufgabe und Format, meldet leere Treffer', async () => {
    await open();
    const input = document.querySelector<HTMLInputElement>('.cmdk-input')!;
    input.value = 'lauter machen';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    expect(rowsText()).toEqual(['Audio Normalizer']);
    input.value = 'heic';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    expect(rowsText()).toEqual(['Bildkonverter']);
    input.value = 'gibtesnicht';
    input.dispatchEvent(new Event('input'));
    await flushPromises();
    expect(rowsText()).toEqual([]);
    expect(document.querySelector('.cmdk-empty')?.textContent).toBe('Nichts gefunden');
  });

  it('Pfeiltasten bewegen die Auswahl (aria-activedescendant), Esc schließt', async () => {
    await open();
    const dialog = document.querySelector<HTMLElement>('.cmdk-dialog')!;
    const input = document.querySelector<HTMLInputElement>('.cmdk-input')!;
    const active = () => document.querySelector('.cmdk-item.is-active .cmdk-name')?.textContent;
    expect(active()).toBe('Audio-Schneider');
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await flushPromises();
    expect(active()).toBe('Audio Normalizer');
    expect(input.getAttribute('aria-activedescendant')).toBe(
      document.querySelector('.cmdk-item.is-active')!.id,
    );
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await flushPromises();
    expect(active()).toBe('Bildkonverter'); // springt vom Anfang ans Ende
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await flushPromises();
    expect(document.querySelector('.cmdk-dialog')).toBeNull();
  });

  it('zeigt Favoriten und Zuletzt genutzt vor allen Tools', async () => {
    localStorage.setItem(
      'kdt-favorites',
      JSON.stringify([{ key: 'imageTools.convert', title: 'x' }]),
    );
    localStorage.setItem(RECENT_KEY, JSON.stringify(['tools.normalizer', 'unbekannt']));
    await open();
    const groups = [...document.querySelectorAll('.cmdk-group')].map((g) => g.textContent);
    expect(groups).toEqual(['Favoriten', 'Zuletzt genutzt', 'Alle Tools']);
    expect(rowsText().slice(0, 2)).toEqual(['Bildkonverter', 'Audio Normalizer']);
  });

  it('merkt Klicks auf Karten als zuletzt genutzt, nicht auf den Merk-Button', () => {
    mountPalette(false);
    const stop = (e: Event) => e.preventDefault(); // keine Navigation im Test
    document.addEventListener('click', stop);
    document
      .querySelector<HTMLElement>('.svg-card-link[data-i18n-key="tools.cutter"] .fav-btn')!
      .click();
    expect(localStorage.getItem(RECENT_KEY)).toBeNull();
    document
      .querySelector<HTMLElement>('.svg-card-link[data-i18n-key="tools.cutter"] .inner')!
      .click();
    document
      .querySelector<HTMLElement>('.svg-card-link[data-i18n-key="tools.normalizer"] .inner')!
      .click();
    expect(JSON.parse(localStorage.getItem(RECENT_KEY)!)).toEqual([
      'tools.normalizer',
      'tools.cutter',
    ]);
    document.removeEventListener('click', stop);
  });
});
