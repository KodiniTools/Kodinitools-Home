<script setup lang="ts">
/**
 * Favoriten-Sektion der Startseite (Vue-Island, client:idle).
 *
 * - Liest/schreibt die Favoriten in localStorage (FAV_KEY) und rendert sie als
 *   Karten im selben Markup wie die übrigen Tool-Karten.
 * - Die Merk-Buttons der server-gerenderten Karten bleiben statisches HTML; die
 *   Island hört per Event-Delegation auf deren Klicks und setzt ihren Zustand
 *   (.is-active). So muss nicht jede Karte einzeln hydriert werden.
 * Server-seitig ist die Liste leer -> Sektion versteckt (wie bisher).
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  FAV_KEY,
  parseFavorites,
  serializeFavorites,
  toggleFavorite,
  type FavoriteItem,
} from './favorites';

interface Texts {
  title: string;
  clearAll: string;
  favRemove: string;
  favTitle: string;
  open: string;
}

const props = defineProps<{
  /** Seitensprache: bestimmt, welches Icon-Attribut (data-svg-<lang>) gelesen wird. */
  lang: 'de' | 'en';
  /** Im Admin ausgeblendete Karten (i18n-Schlüssel). */
  hiddenKeys: string[];
  texts: Texts;
  /** Kompakt-Layout mit Listenkarten: Beschreibung in der Karte zeigen. */
  showDesc?: boolean;
  /**
   * Modernes Design: Favoriten als Kopie der Tool-Karte aus dem Raster (#mh-grid) zeigen,
   * damit sie genau so aussehen wie dort (Icon, Untertitel, Plaketten, Pfeil).
   */
  modern?: boolean;
}>();

const favorites = ref<FavoriteItem[]>([]);
const hidden = new Set(props.hiddenKeys);
const CARD_SELECTOR = '.svg-card-link[data-i18n-key]';

function load(): void {
  try {
    favorites.value = parseFavorites(localStorage.getItem(FAV_KEY), hidden);
  } catch {
    favorites.value = []; // localStorage gesperrt (z. B. privater Modus)
  }
}

function save(list: FavoriteItem[]): void {
  favorites.value = list;
  try {
    localStorage.setItem(FAV_KEY, serializeFavorites(list));
  } catch {
    /* Speichern nicht möglich – Zustand gilt nur für diese Seite */
  }
}

/** Favoriten-Eintrag aus einer server-gerenderten Karte. */
function itemFromCard(card: HTMLElement): FavoriteItem {
  return {
    key: card.dataset.i18nKey ?? '',
    title: card.dataset.title ?? '',
    description: card.dataset.description ?? '',
    link: card.getAttribute('href') ?? '#',
    badge: card.querySelector('.tool-card-badge')?.textContent ?? '',
    svg: card.getAttribute(`data-svg-${props.lang}`) ?? '',
  };
}

function pop(button: Element): void {
  button.classList.add('pop');
  button.addEventListener('animationend', () => button.classList.remove('pop'), { once: true });
}

function remove(key: string, event: MouseEvent): void {
  if (event.currentTarget instanceof Element) pop(event.currentTarget);
  save(favorites.value.filter((f) => f.key !== key));
}

/** Modernes Design: Container der Favoriten-Karten und Zahl der gezeigten Karten. */
const modernGrid = ref<HTMLElement | null>(null);
const modernCount = ref(0);

/**
 * Modernes Design: Favoriten als Kopien der Tool-Karten aus dem Raster (#mh-grid) zeigen,
 * damit sie genau so aussehen (Icon, Untertitel, Plaketten, Pfeil). Merk-Button aktiv
 * („Entfernen“). Favoriten ohne Karte im Raster (Tool nicht mehr auf der Seite) entfallen.
 */
function renderModern(list: FavoriteItem[]): void {
  if (!props.modern || !modernGrid.value) return;
  const source = new Map(
    Array.from(document.querySelectorAll<HTMLElement>('#mh-grid .mh-card[data-i18n-key]')).map(
      (c) => [c.dataset.i18nKey, c],
    ),
  );
  const cards = list.flatMap((f) => {
    const src = source.get(f.key);
    if (!src) return [];
    const card = src.cloneNode(true) as HTMLElement;
    card.classList.remove('is-extra', 'is-hit');
    const btn = card.querySelector('.fav-btn');
    btn?.classList.remove('pop');
    btn?.classList.add('is-active');
    btn?.setAttribute('aria-label', props.texts.favRemove);
    return [card];
  });
  modernGrid.value.replaceChildren(...cards);
  modernCount.value = cards.length;
}

/** Modernes Design: Klick auf den Merk-Button einer kopierten Karte entfernt den Favoriten. */
function onModernGridClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest('.fav-btn');
  const key = button?.closest<HTMLElement>(CARD_SELECTOR)?.dataset.i18nKey;
  if (!button || !key) return;
  event.preventDefault(); // Button liegt im Karten-Link: nicht navigieren
  event.stopPropagation();
  pop(button);
  save(favorites.value.filter((f) => f.key !== key));
}

/** Klicks auf Merk-Buttons der statischen Karten (nicht in der Favoriten-Sektion). */
function onDocumentClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest('.fav-btn');
  const card = button?.closest<HTMLElement>(CARD_SELECTOR);
  if (!button || !card || card.closest('#favoritesSection')) return;
  event.preventDefault(); // Button liegt im Karten-Link: nicht navigieren
  event.stopPropagation();
  pop(button);
  save(toggleFavorite(favorites.value, itemFromCard(card)));
}

/** Zustand der statischen Merk-Buttons an die Liste angleichen. */
function syncStaticButtons(list: FavoriteItem[]): void {
  const keys = new Set(list.map((f) => f.key));
  document.querySelectorAll<HTMLElement>(CARD_SELECTOR).forEach((card) => {
    if (card.closest('#favoritesSection')) return;
    card
      .querySelector('.fav-btn')
      ?.classList.toggle('is-active', keys.has(card.dataset.i18nKey ?? ''));
  });
}

/** Änderungen aus anderen Tabs übernehmen. */
function onStorage(event: StorageEvent): void {
  if (event.key === FAV_KEY) load();
}

watch(favorites, (list) => {
  syncStaticButtons(list);
  renderModern(list);
});

onMounted(() => {
  load();
  syncStaticButtons(favorites.value);
  renderModern(favorites.value);
  document.addEventListener('click', onDocumentClick);
  window.addEventListener('storage', onStorage);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
  window.removeEventListener('storage', onStorage);
});
</script>

<template>
  <section
    id="favoritesSection"
    class="tools-section favorites-section"
    :style="{ display: (modern ? modernCount : favorites.length) ? 'block' : 'none' }"
  >
    <div class="section-header">
      <h2>{{ texts.title }}</h2>
      <button id="favClearAll" type="button" class="fav-clear-btn" @click="save([])">
        {{ texts.clearAll }}
      </button>
    </div>
    <div
      v-if="modern"
      id="favoritesGrid"
      ref="modernGrid"
      class="mh-grid mh-fav-grid"
      @click="onModernGridClick"
    />
    <div v-else id="favoritesGrid" class="svg-card-grid">
      <a
        v-for="item in favorites"
        :key="item.key"
        :href="item.link"
        class="svg-card-link"
        :data-i18n-key="item.key"
        :data-title="item.title"
        :data-description="item.description"
      >
        <div class="tool-card">
          <div v-if="item.svg" class="tool-card-icon">
            <img :src="item.svg" :alt="item.title" loading="lazy" />
          </div>
          <span v-if="item.badge" class="tool-card-badge">{{ item.badge }}</span>
          <h3 class="tool-card-title">{{ item.title }}</h3>
          <p v-if="showDesc && item.description" class="tool-card-desc">{{ item.description }}</p>
          <div class="tool-card-footer">
            <button
              type="button"
              class="fav-btn is-active"
              :aria-label="texts.favRemove"
              :title="texts.favTitle"
              @click.prevent.stop="remove(item.key, $event)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
            <span class="tool-card-open">
              {{ texts.open }}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
        <div class="tool-popup" role="tooltip">
          <p class="tool-popup-desc">{{ item.description }}</p>
        </div>
      </a>
    </div>
  </section>
</template>
