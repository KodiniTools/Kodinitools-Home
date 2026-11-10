<template>
  <!-- Standard gewählt: nur die Beschriftung „Öffnen“ (gilt für alle Karten) -->
  <TcDetails v-if="!card" :open="false" data-tc-texts>
    <template #title
      >📝 Texte <span class="lang-badge">{{ LANG }}</span></template
    >
    <p class="hint tc-m0">
      Eine Karte oben auswählen, um <strong>Titel, Badge, Beschreibung und Link</strong> dieser
      Karte zu bearbeiten. Hier nur die Beschriftung, die auf allen Karten gleich ist:
    </p>
    <label class="tc-flabel" :for="`${uid}-open`"
      >Beschriftung „{{ service.defText(OPEN) || view.openLabel }}“ (Link auf allen Karten)<span
        v-if="openOv"
        class="lang-badge tc-ml"
        >geändert</span
      ></label
    >
    <div class="tc-line">
      <TcDraftInput
        :id="`${uid}-open`"
        :value="view.openLabel"
        :placeholder="service.defText(OPEN)"
        data-tctx="open"
        @input="setOpen"
      />
      <button
        type="button"
        class="hd-reset"
        title="Auf Standard zurücksetzen"
        aria-label="Auf Standard zurücksetzen"
        :disabled="!openOv"
        data-tctxreset="open"
        @click="resetOpen"
      >
        ↺
      </button>
    </div>
  </TcDetails>

  <TcDetails v-else data-tc-texts>
    <template #title
      >📝 Texte der Karte „{{ oneLine(card.title) }}“
      <span class="lang-badge">{{ LANG }}</span></template
    >
    <p class="hint tc-m0">
      Änderungen wirken sofort in Vorschau und Übersicht und werden als Text-Override der Sprache
      <strong>{{ LANG }}</strong> gespeichert (wie im Tab „Texte“).<template v-if="card.custom">
        Im Admin angelegte Karte – die Texte der anderen Sprache bearbeitest du im Sprach-Tab
        {{ service.lang === 'de' ? 'English' : 'Deutsch' }}.</template
      >
    </p>
    <div v-for="f in CARD_TEXT_FIELDS" :key="f.key" class="tc-field">
      <label class="tc-flabel" :for="`${uid}-${f.key}`"
        >{{ f.label }}<span v-if="ov(f.key)" class="lang-badge tc-ml">geändert</span></label
      >
      <div class="tc-line tc-start">
        <TcDraftInput
          :id="`${uid}-${f.key}`"
          :value="service.effText(path(f.key))"
          :multiline="!!f.multiline"
          :rows="f.rows ?? 3"
          :placeholder="card.custom ? f.label : service.defText(path(f.key))"
          :invalid="invalid === f.key"
          :data-tctx="f.key"
          @input="setText(f.key, $event)"
          @commit="commit(f.key)"
        />
        <button
          v-if="!card.custom"
          type="button"
          class="hd-reset"
          title="Auf Standardtext zurücksetzen"
          aria-label="Zurücksetzen"
          :disabled="!ov(f.key)"
          :data-tctxreset="f.key"
          @click="resetText(f.key)"
        >
          ↺
        </button>
      </div>
      <p class="hint tc-m0">{{ card.custom ? f.customHint : f.hint }}</p>
    </div>
  </TcDetails>
</template>

<script setup lang="ts">
import { computed, ref, useId } from 'vue';
import TcDetails from './TcDetails.vue';
import TcDraftInput from './TcDraftInput.vue';
import { CARD_TEXT_FIELDS, oneLine, setCardText, type CardTextKey } from './tcData';
import { useTc } from './useTc';

/**
 * Texte der gewählten Karte (Overrides der Sprachdatei: Titel, Badge,
 * Beschreibung, Link) bzw. beim Standard die „Öffnen“-Beschriftung – wie
 * `textsBlock` in `public/toolcards.js`.
 */
const { service, view, change, toast } = useTc();
const uid = `tc-tx-${useId()}`;
const LANG = service.lang.toUpperCase();
const OPEN = ['tool', 'open'];

const card = computed(() => view.value.selCard);
const path = (key: CardTextKey) => [...view.value.selected.split('.'), key];
const ov = (key: CardTextKey) => {
  void view.value; // hängt am Änderungszähler
  return !card.value?.custom && service.hasOverride(path(key));
};
const openOv = computed(() => (view.value, service.hasOverride(OPEN)));

/** Feld mit ungültiger Eingabe (rot umrandet, nicht übernommen). */
const invalid = ref<CardTextKey | ''>('');

function setOpen(v: string) {
  change(() => {
    if (v.trim() === '') service.delOverride(OPEN);
    else service.setOverride(OPEN, v.trim());
  });
}
function resetOpen() {
  change(() => service.delOverride(OPEN));
  toast('Auf Standardtext zurückgesetzt');
}
function setText(key: CardTextKey, v: string) {
  let ok = true;
  change(() => {
    ok = setCardText(service, view.value.selected, key, v);
  });
  invalid.value = ok ? '' : key;
}
function commit(key: CardTextKey) {
  if (invalid.value === key)
    toast('Link nicht übernommen – erlaubt sind https://…, /pfad/ oder #', { type: 'warning' });
}
function resetText(key: CardTextKey) {
  change(() => service.delOverride(path(key)));
  invalid.value = '';
  toast('Auf Standardtext zurückgesetzt');
}
</script>

<style scoped>
.tc-m0 {
  margin: 0;
}
.tc-ml {
  margin-left: var(--ds-space-1);
}
.tc-flabel {
  display: block;
  font-size: 0.8rem;
  color: var(--ds-text-2);
}
.tc-field {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
}
.tc-line {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
}
.tc-start {
  align-items: flex-start;
}
.tc-line > :deep(input),
.tc-line > :deep(textarea) {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
