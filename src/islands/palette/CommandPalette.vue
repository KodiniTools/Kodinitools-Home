<script setup lang="ts">
/**
 * Such-Schaltfläche und Tastenkürzel der Startseite (Vue-Island, client:idle).
 *
 * - Server-gerendert wird nur die Schaltfläche; das Overlay (PaletteDialog.vue)
 *   lädt erst beim Öffnen per dynamischem Import.
 * - Strg/Cmd + K öffnet bzw. schließt, Esc schließt; der Fokus kehrt zurück.
 * - Klicks auf Tool-Karten werden als „Zuletzt genutzt“ gemerkt (localStorage).
 */
import { defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue';
import { parseRecent, pushRecent, RECENT_KEY } from './recent';

interface Texts {
  trigger: string;
  keyHint: string;
  keyHintMac: string;
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

defineProps<{
  lang: 'de' | 'en';
  entries: { key: string; keywords: string[]; formats: string[] }[];
  texts: Texts;
}>();

const PaletteDialog = defineAsyncComponent(() => import('./PaletteDialog.vue'));

const open = ref(false);
const isMac = ref(false);
let lastFocus: HTMLElement | null = null;

function show(): void {
  lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  open.value = true;
  document.documentElement.classList.add('cmdk-open');
}

function hide(): void {
  open.value = false;
  document.documentElement.classList.remove('cmdk-open');
  lastFocus?.focus();
  lastFocus = null;
}

function onKey(event: KeyboardEvent): void {
  if (event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey) && !event.altKey) {
    event.preventDefault();
    if (open.value) hide();
    else show();
  }
}

/** Klick auf eine Tool-Karte (nicht auf den Merk-Button) -> zuletzt genutzt. */
function onCardClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element) || target.closest('.fav-btn')) return;
  const key = target.closest<HTMLElement>('.svg-card-link[data-i18n-key]')?.dataset.i18nKey;
  if (!key) return;
  try {
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(pushRecent(parseRecent(localStorage.getItem(RECENT_KEY)), key)),
    );
  } catch {
    /* localStorage gesperrt – dann gibt es kein „Zuletzt genutzt“ */
  }
}

onMounted(() => {
  isMac.value = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
  window.addEventListener('keydown', onKey);
  document.addEventListener('click', onCardClick);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  document.removeEventListener('click', onCardClick);
  document.documentElement.classList.remove('cmdk-open');
});
</script>

<template>
  <div class="cmdk-bar">
    <button
      type="button"
      class="cmdk-trigger"
      aria-haspopup="dialog"
      aria-keyshortcuts="Control+K Meta+K"
      @click="show"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <span class="cmdk-trigger-label">{{ texts.trigger }}</span>
      <kbd class="cmdk-kbd">{{ isMac ? texts.keyHintMac : texts.keyHint }}</kbd>
    </button>
    <Teleport to="body">
      <PaletteDialog v-if="open" :lang="lang" :entries="entries" :texts="texts" @close="hide" />
    </Teleport>
  </div>
</template>
