<script setup lang="ts">
/**
 * Such-Overlay der Startseite (Strg/Cmd + K). Wird erst beim Öffnen geladen
 * (dynamischer Import in CommandPalette.vue).
 *
 * Die Tools kommen aus den server-gerenderten Karten der Seite (Titel,
 * Beschreibung, Link, Icon; im Admin ausgeblendete Karten fehlen dort), die
 * Suchbegriffe und Formate aus dem Tool-Katalog über die Props. Ohne Eingabe
 * zeigt das Overlay Favoriten, zuletzt Genutzte und alle Tools.
 */
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { parseFavoriteKeys, parseRecent, pushRecent, RECENT_KEY } from './recent';
import { searchTools, type SearchItem } from './search';

interface Entry {
  key: string;
  keywords: string[];
  formats: string[];
}
interface Texts {
  title: string;
  placeholder: string;
  noResults: string;
  favorites: string;
  recent: string;
  all: string;
  results: string;
  help: string;
  close: string;
}
interface Tool extends SearchItem {
  link: string;
  svg: string;
}

const props = defineProps<{
  lang: 'de' | 'en';
  entries: Entry[];
  texts: Texts;
}>();
const emit = defineEmits<{ close: [] }>();

const CARD_SELECTOR = '.svg-card-link[data-i18n-key]';

function readTools(): Tool[] {
  const byKey = new Map(props.entries.map((e) => [e.key, e]));
  const seen = new Set<string>();
  const tools: Tool[] = [];
  document.querySelectorAll<HTMLAnchorElement>(CARD_SELECTOR).forEach((card) => {
    const key = card.dataset.i18nKey ?? '';
    if (!key || seen.has(key) || card.closest('#favoritesSection')) return;
    seen.add(key);
    const entry = byKey.get(key);
    tools.push({
      key,
      title: card.dataset.title ?? '',
      description: card.dataset.description ?? '',
      keywords: entry?.keywords ?? [],
      formats: entry?.formats ?? [],
      link: card.getAttribute('href') ?? '#',
      svg: card.getAttribute(`data-svg-${props.lang}`) ?? '',
    });
  });
  return tools;
}

const tools = ref<Tool[]>([]);
const favoriteKeys = ref<string[]>([]);
const recentKeys = ref<string[]>([]);
const query = ref('');
const active = ref(0);
const input = ref<HTMLInputElement | null>(null);
const list = ref<HTMLElement | null>(null);

interface Group {
  label: string;
  items: Tool[];
}

const groups = computed<Group[]>(() => {
  if (query.value.trim()) {
    const hits = searchTools(tools.value, query.value);
    return hits.length ? [{ label: props.texts.results, items: hits }] : [];
  }
  const byKey = new Map(tools.value.map((t) => [t.key, t]));
  const pick = (keys: string[]) => keys.flatMap((k) => byKey.get(k) ?? []);
  const result: Group[] = [];
  const fav = pick(favoriteKeys.value);
  const rec = pick(recentKeys.value);
  if (fav.length) result.push({ label: props.texts.favorites, items: fav });
  if (rec.length) result.push({ label: props.texts.recent, items: rec });
  result.push({ label: props.texts.all, items: tools.value });
  return result;
});

/** Flache Reihenfolge für Pfeiltasten; id je Zeile für aria-activedescendant. */
const rows = computed(() =>
  groups.value.flatMap((g, gi) => g.items.map((tool, i) => ({ tool, id: `cmdk-opt-${gi}-${i}` }))),
);

watch(query, () => {
  active.value = 0;
});

const title = (t: Tool): string => t.title.split('\n')[0] ?? t.title;
const subtitle = (t: Tool): string => t.title.split('\n').slice(1).join(' ');

function scrollActive(): void {
  void nextTick(() =>
    document
      .getElementById(rows.value[active.value]?.id ?? '')
      ?.scrollIntoView({ block: 'nearest' }),
  );
}

function move(delta: number): void {
  const n = rows.value.length;
  if (!n) return;
  active.value = (active.value + delta + n) % n;
  scrollActive();
}

/** „Zuletzt genutzt“ auch bei Auswahl im Overlay fortschreiben (Klick auf die Karte zählt dort). */
function remember(key: string): void {
  try {
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(pushRecent(parseRecent(localStorage.getItem(RECENT_KEY)), key)),
    );
  } catch {
    /* localStorage gesperrt – nur die Auswahl entfällt */
  }
}

function onKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      move(1);
      break;
    case 'ArrowUp':
      event.preventDefault();
      move(-1);
      break;
    case 'Home':
      if (rows.value.length) {
        event.preventDefault();
        active.value = 0;
        scrollActive();
      }
      break;
    case 'End':
      if (rows.value.length) {
        event.preventDefault();
        active.value = rows.value.length - 1;
        scrollActive();
      }
      break;
    case 'Enter': {
      const row = rows.value[active.value];
      if (!row) return;
      event.preventDefault();
      remember(row.tool.key);
      window.location.assign(row.tool.link);
      break;
    }
    case 'Tab':
      event.preventDefault(); // Fokus bleibt im Eingabefeld (Auswahl per Pfeiltasten)
      break;
    case 'Escape':
      event.preventDefault();
      emit('close');
      break;
  }
}

onMounted(() => {
  tools.value = readTools();
  try {
    favoriteKeys.value = parseFavoriteKeys(localStorage.getItem('kdt-favorites'));
    recentKeys.value = parseRecent(localStorage.getItem(RECENT_KEY));
  } catch {
    /* localStorage gesperrt (z. B. privater Modus) */
  }
  input.value?.focus();
});
</script>

<template>
  <div class="cmdk-backdrop" @mousedown.self="emit('close')">
    <div
      class="cmdk-dialog"
      role="dialog"
      aria-modal="true"
      :aria-label="texts.title"
      @keydown="onKeydown"
    >
      <div class="cmdk-search">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          ref="input"
          v-model="query"
          class="cmdk-input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="cmdk-list"
          :aria-activedescendant="rows[active]?.id"
          aria-autocomplete="list"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          enterkeyhint="go"
          :placeholder="texts.placeholder"
          :aria-label="texts.placeholder"
        />
        <button type="button" class="cmdk-close" :aria-label="texts.close" @click="emit('close')">
          Esc
        </button>
      </div>
      <div id="cmdk-list" ref="list" class="cmdk-list" role="listbox" :aria-label="texts.title">
        <p v-if="!rows.length" class="cmdk-empty" role="status">{{ texts.noResults }}</p>
        <template v-for="(group, gi) in groups" :key="group.label">
          <div class="cmdk-group" role="presentation">{{ group.label }}</div>
          <a
            v-for="(tool, i) in group.items"
            :id="`cmdk-opt-${gi}-${i}`"
            :key="tool.key"
            :href="tool.link"
            class="cmdk-item"
            :class="{ 'is-active': rows[active]?.id === `cmdk-opt-${gi}-${i}` }"
            role="option"
            :aria-selected="rows[active]?.id === `cmdk-opt-${gi}-${i}`"
            tabindex="-1"
            @click="remember(tool.key)"
            @mousemove="active = rows.findIndex((r) => r.id === `cmdk-opt-${gi}-${i}`)"
          >
            <img
              v-if="tool.svg"
              :src="tool.svg"
              alt=""
              width="36"
              height="36"
              loading="lazy"
              decoding="async"
            />
            <span class="cmdk-text">
              <span class="cmdk-name">{{ title(tool) }}</span>
              <span v-if="subtitle(tool)" class="cmdk-sub">{{ subtitle(tool) }}</span>
              <span class="cmdk-desc">{{ tool.description }}</span>
            </span>
          </a>
        </template>
      </div>
      <p class="cmdk-help">{{ texts.help }}</p>
    </div>
  </div>
</template>
