<template>
  <div class="panel" :data-md-slotpanel="slotKey">
    <h2 :class="{ 'md-h2sm': small }">{{ title }}</h2>
    <p class="hint"><slot name="hint" /></p>

    <template v-if="thumb && res">
      <video v-if="res.isVid" :src="res.src" muted preload="metadata" class="md-thumb"></video>
      <img
        v-else-if="!thumbBroken"
        :src="res.src"
        alt=""
        class="md-thumb"
        @error="thumbBroken = true"
      />
    </template>
    <p v-if="!val" class="hint md-st">Kein Medium gewählt.</p>
    <p v-else-if="!res" class="st md-st md-warn" data-md-status="missing-local">
      ⚠ Lokales Medium nicht gefunden – bitte neu zuweisen.
    </p>
    <p v-else-if="res.localName" class="st local md-st" data-md-status="local">
      ● {{ res.localName }} – lokal, wird beim Veröffentlichen hochgeladen.
    </p>
    <template v-else>
      <p class="st pub md-st" data-md-status="pub">● {{ val }}</p>
      <p v-if="missing" class="st md-warn" data-md-missing>
        ⚠ Datei fehlt auf dem Server – bitte über „📁 Aus Zwischenspeicher wählen“ neu zuweisen und
        veröffentlichen.
      </p>
    </template>

    <label class="md-label" :for="inputId">Pfad/URL</label>
    <input
      :id="inputId"
      :value="draft"
      :placeholder="placeholder"
      :disabled="staged"
      :title="staged ? 'Lokales Medium – wird beim Veröffentlichen hochgeladen' : undefined"
      data-md-slot
      @focus="editing = true"
      @input="onInput(($event.target as HTMLInputElement).value)"
      @change="onCommit"
    />
    <div class="md-row">
      <UiButton size="sm" data-md-pick @click="emit('pick')"
        >📁 Aus Zwischenspeicher wählen</UiButton
      >
      <UiButton size="sm" variant="ghost" data-md-reset @click="emit('reset')">{{
        resetLabel
      }}</UiButton>
    </div>

    <template v-if="withLink">
      <label class="md-label" :for="linkId"
        >🔗 Verlinkung (optional) — öffnet beim Klick auf das Medium</label
      >
      <input
        :id="linkId"
        :value="link"
        placeholder="https://… oder /faq/"
        data-md-link
        @input="emit('update:link', ($event.target as HTMLInputElement).value.trim())"
      />
      <p class="hint">
        Leer = nicht klickbar. Externe Links (http/https) öffnen in neuem Tab; interne Pfade (z.B.
        <code>/faq/</code>) im selben Tab.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useId, watch } from 'vue';
import { UiButton } from '../../components/ui';
import type { ResolvedMedia } from './mediaData';
import { useUploadCheck } from './useUploadCheck';

/**
 * Ein Medien-Platz (Sektions-Medium oder Hero-Kachel): Status, Pfad/URL,
 * Auswahl aus dem Zwischenspeicher, Zurücksetzen und optional Verlinkung.
 * Schreibt nichts selbst – meldet `update:val`, `pick`, `reset`, `update:link`.
 */
const props = withDefaults(
  defineProps<{
    slotKey: string;
    title: string;
    /** Aktueller Wert (Server-URL, Pfad oder `staged:<id>`). */
    val: string;
    res: ResolvedMedia | null;
    placeholder: string;
    /** Wert, der bei leerem Feld gespeichert wird (Standard bzw. ''). */
    emptyValue: string;
    resetLabel: string;
    withLink?: boolean;
    link?: string;
    /** Kleines Vorschaubild über dem Status (Hero-Kacheln). */
    thumb?: boolean;
    small?: boolean;
  }>(),
  { withLink: false, link: '', thumb: false, small: false },
);
const emit = defineEmits<{
  'update:val': [v: string];
  'update:link': [v: string];
  pick: [];
  reset: [];
}>();

const uid = useId();
const inputId = `md-slot-${uid}`;
const linkId = `md-link-${uid}`;
const staged = computed(() => props.val.startsWith('staged:'));
const shown = () => (staged.value ? '' : props.val);

// Eingabe-Puffer: beim Leeren bleibt das Feld leer (gespeichert wird der
// Standard), erst beim Verlassen zeigt es den gespeicherten Wert – wie Vanilla.
const draft = ref(shown());
const editing = ref(false);
watch(
  () => props.val,
  () => {
    if (!editing.value) draft.value = shown();
  },
);
function onInput(v: string) {
  draft.value = v;
  emit('update:val', v.trim() || props.emptyValue);
}
function onCommit() {
  editing.value = false;
  draft.value = shown();
}

const thumbBroken = ref(false);
watch(
  () => props.res?.src,
  () => (thumbBroken.value = false),
);
const pubUrl = computed(() => (props.res && !props.res.localName ? props.val : ''));
const { missing } = useUploadCheck(pubUrl);
</script>

<style scoped>
.md-h2sm {
  font-size: 1rem;
  margin: 0 0 var(--ds-space-1);
}
.md-st {
  margin: var(--ds-space-1) 0 var(--ds-space-2);
  overflow-wrap: anywhere;
}
.md-warn {
  color: #f87171; /* ds-content: Warnfarbe wie Vanilla-Hinweis */
  font-weight: 600;
}
.md-thumb {
  display: block;
  max-width: 220px;
  max-height: 160px;
  border-radius: 6px;
}
.md-label {
  display: block;
  margin-top: var(--ds-space-2);
}
.md-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-2);
}
</style>
