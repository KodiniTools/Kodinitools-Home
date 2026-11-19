<template>
  <div class="panel pm" data-page-meta>
    <h2>
      Seiten-Meta (SEO) <span class="lang-badge">{{ lang.toUpperCase() }}</span>
    </h2>
    <p class="hint pm-m0">
      Seitentitel, Meta-Beschreibung und Überschrift (H1) je Seite. Leer = Standard aus dem Code.
      Titel und Beschreibung gelten auch für die Vorschau beim Teilen (Open Graph). Änderungen
      landen im <strong>Entwurf</strong> (Strg+Z, Vorschau, live erst mit „Veröffentlichen“).
    </p>
    <UiSelect v-model="page" label="Seite" :options="PAGE_OPTIONS" data-pm-page />
    <div v-for="f in fields" :key="`${page}-${f.key}`" class="pm-field" :data-pm-field="f.key">
      <UiTextField
        :model-value="value(f.key)"
        :label="f.label"
        placeholder="Standard der Seite"
        :hint="`${value(f.key).length} Zeichen – empfohlen bis ${f.best}, höchstens ${PAGE_META_MAX[f.key]}`"
        @update:model-value="set(f.key, $event)"
      />
    </div>
    <p v-if="page === 'home'" class="hint pm-m0">
      Die Überschrift (H1) der Startseite ist der Hero-Titel im Tab „Hero-Design“.
    </p>
    <UiButton v-if="hasAny" size="sm" variant="ghost" data-pm-reset @click="reset"
      >↺ Diese Seite auf Standard zurücksetzen</UiButton
    >
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { UiButton, UiSelect, UiTextField } from '../../components/ui';
import {
  PAGE_META_KEYS,
  PAGE_META_MAX,
  pageMetaHas,
  setPageMeta,
  type PageMetaField,
  type PageMetaKey,
  type PageMetaMap,
} from '../../../public/model-media';
import { PAGE_META_LABEL } from './pageMeta';

/**
 * Seiten-Meta einer Sprache (`media.<lang>.pageMeta`). Schreibt direkt in das
 * übergebene Roh-Objekt, damit Speichern, Autosave und Undo per Snapshot greifen.
 */
const props = defineProps<{ lang: 'de' | 'en'; media: { pageMeta?: PageMetaMap } }>();
const media = reactive(props.media);

const PAGE_OPTIONS = PAGE_META_KEYS.map((k) => ({ value: k, label: PAGE_META_LABEL[k] }));
const FIELDS: { key: PageMetaField; label: string; best: number }[] = [
  { key: 'title', label: 'Seitentitel (<title>)', best: 60 },
  { key: 'description', label: 'Meta-Beschreibung', best: 155 },
  { key: 'h1', label: 'Überschrift (H1)', best: 70 },
];
const page = ref<PageMetaKey>('home');
const fields = computed(() => FIELDS.filter((f) => pageMetaHas(page.value, f.key)));

// Eingabe-Puffer: zeigt z. B. ein Leerzeichen am Ende, obwohl getrimmt gespeichert wird.
const drafts = reactive<Record<string, string>>({});
const value = (f: PageMetaField) =>
  drafts[`${page.value}.${f}`] ?? media.pageMeta?.[page.value]?.[f] ?? '';
function set(f: PageMetaField, v: string) {
  drafts[`${page.value}.${f}`] = v.slice(0, PAGE_META_MAX[f]);
  setPageMeta(media, page.value, f, v);
}
const hasAny = computed(() => Boolean(media.pageMeta?.[page.value]));
function reset() {
  for (const f of FIELDS) {
    delete drafts[`${page.value}.${f.key}`];
    setPageMeta(media, page.value, f.key, '');
  }
}
/** Nach „Übernehmen“ von außen (KI): Puffer verwerfen, damit die neuen Werte erscheinen. */
function refresh() {
  for (const k of Object.keys(drafts)) delete drafts[k];
}
defineExpose({ refresh });
</script>

<style scoped>
.pm {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
.pm-m0 {
  margin: 0;
}
.pm-field {
  width: 100%;
}
</style>
