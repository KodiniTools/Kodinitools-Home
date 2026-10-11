// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import FavoritesSection from '../../src/islands/favorites/FavoritesSection.vue';
import { FAV_KEY } from '../../src/islands/favorites/favorites';

const texts = {
  title: 'Meine Favoriten',
  clearAll: 'Alle entfernen',
  favRemove: 'Aus Favoriten entfernen',
  favTitle: 'Favorit',
  open: 'Öffnen',
};

/** Server-gerenderte Karte wie auf der Startseite. */
function staticCard(key: string, lang = 'de'): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = 'svg-card-link';
  a.href = `/${key}/`;
  a.dataset.i18nKey = key;
  a.dataset.title = `Titel ${key}`;
  a.dataset.description = `Beschreibung ${key}`;
  a.setAttribute(`data-svg-${lang}`, `/image/${key}.svg`);
  a.innerHTML =
    '<div class="tool-card"><span class="tool-card-badge">Pro</span><button class="fav-btn"></button></div>';
  document.body.appendChild(a);
  return a;
}

const stored = () =>
  JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]') as { key: string; svg: string }[];

describe('FavoritesSection', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('ist ohne Favoriten versteckt', () => {
    const wrapper = mount(FavoritesSection, { props: { lang: 'de', hiddenKeys: [], texts } });
    expect(wrapper.get('#favoritesSection').attributes('style')).toContain('display: none');
  });

  it('merkt eine statische Karte per Klick, ohne zu navigieren', async () => {
    const card = staticCard('tools.a', 'en');
    const wrapper = mount(FavoritesSection, {
      props: { lang: 'en', hiddenKeys: [], texts },
      attachTo: document.body,
    });
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    card.querySelector('.fav-btn')!.dispatchEvent(event);
    await nextTick();

    expect(event.defaultPrevented).toBe(true);
    expect(stored()).toEqual([
      expect.objectContaining({ key: 'tools.a', svg: '/image/tools.a.svg' }),
    ]);
    expect(card.querySelector('.fav-btn')!.classList.contains('is-active')).toBe(true);
    expect(wrapper.get('#favoritesSection').attributes('style')).toContain('display: block');
    expect(wrapper.findAll('#favoritesGrid .svg-card-link')).toHaveLength(1);
    expect(wrapper.get('#favoritesGrid .tool-card-badge').text()).toBe('Pro');
    wrapper.unmount();
  });

  it('lädt gespeicherte Favoriten und blendet Admin-versteckte aus', async () => {
    localStorage.setItem(
      FAV_KEY,
      JSON.stringify([
        { key: 'tools.a', title: 'A', link: '/a/' },
        { key: 'tools.b', title: 'B', link: '/b/' },
      ]),
    );
    const wrapper = mount(FavoritesSection, {
      props: { lang: 'de', hiddenKeys: ['tools.b'], texts },
    });
    await nextTick();
    expect(wrapper.findAll('.tool-card-title').map((h) => h.text())).toEqual(['A']);
  });

  it('entfernt einzeln und „Alle entfernen“ leert die Liste', async () => {
    localStorage.setItem(
      FAV_KEY,
      JSON.stringify([
        { key: 'tools.a', title: 'A', link: '/a/' },
        { key: 'tools.b', title: 'B', link: '/b/' },
      ]),
    );
    const card = staticCard('tools.a');
    const wrapper = mount(FavoritesSection, {
      props: { lang: 'de', hiddenKeys: [], texts },
      attachTo: document.body,
    });
    await nextTick();
    expect(card.querySelector('.fav-btn')!.classList.contains('is-active')).toBe(true);

    await wrapper.get('#favoritesGrid .fav-btn').trigger('click');
    expect(stored().map((f) => f.key)).toEqual(['tools.b']);
    expect(card.querySelector('.fav-btn')!.classList.contains('is-active')).toBe(false);

    await wrapper.get('#favClearAll').trigger('click');
    expect(stored()).toEqual([]);
    expect(wrapper.get('#favoritesSection').attributes('style')).toContain('display: none');
    wrapper.unmount();
  });
});
