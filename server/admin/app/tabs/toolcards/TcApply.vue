<template>
  <div class="tc-apply" data-tc-apply>
    <p class="hint tc-m0">
      Quelle: <strong class="tc-strong">{{ srcLabel }}</strong> – Rahmen, Hintergrund und Hover
      (Hell + Dunkel) werden auf die angehakten Karten übertragen; sie erhalten damit ein eigenes
      Design (●).<template v-if="!view.selCard">
        Beim Standard als Quelle wird das eigene Design der angehakten Karten entfernt.</template
      >
    </p>
    <div v-for="g in groups" :key="g.section" class="tc-target-group">
      <div class="tc-target-head">
        <strong>{{ SECTION_LABEL[g.section] }}</strong>
        <button
          type="button"
          class="hd-reset"
          title="Alle Karten dieses Bereichs auswählen/abwählen"
          :data-tctargetsec="g.section"
          @click="toggleSection(g.section)"
        >
          Alle
        </button>
      </div>
      <div class="tc-targets">
        <label
          v-for="c in g.cards"
          :key="c.id"
          :class="['tc-target', { src: c.id === view.selected }]"
          :title="
            c.id === view.selected
              ? 'Quelle (kann nicht Ziel sein)'
              : view.tc.cards[c.id]
                ? 'Hat eigenes Design – wird ersetzt'
                : 'Nutzt Standard-Design'
          "
        >
          <input
            type="checkbox"
            :checked="tcUi.targets.has(c.id)"
            :disabled="c.id === view.selected"
            :data-tctarget="c.id"
            @change="toggle(c.id, ($event.target as HTMLInputElement).checked)"
          />
          <span
            >{{ c.hidden ? '🙈 ' : '' }}{{ oneLine(c.title) }}{{ view.tc.cards[c.id] ? ' ●' : ''
            }}{{ c.id === view.selected ? ' (Quelle)' : '' }}</span
          >
        </label>
      </div>
    </div>
    <div class="tc-line">
      <UiButton size="sm" variant="ghost" data-tctargetall="1" @click="selectAll(true)"
        >Alle auswählen</UiButton
      >
      <UiButton size="sm" variant="ghost" data-tctargetall="0" @click="selectAll(false)"
        >Auswahl leeren</UiButton
      >
      <UiButton
        size="sm"
        variant="primary"
        class="tc-wrapbtn"
        :disabled="!count"
        data-tcapply
        @click="apply"
      >
        <template v-if="view.selCard"
          >➡️ Design von {{ srcLabel }} auf {{ count }} Karte(n) anwenden</template
        >
        <template v-else>↺ {{ count }} Karte(n) auf das Standard-Design zurücksetzen</template>
      </UiButton>
    </div>
    <div v-if="view.selCard" class="tc-line">
      <UiButton size="sm" class="tc-wrapbtn" data-tcasdefault @click="emit('asDefault')"
        >★ Design von {{ srcLabel }} als Standard für alle Karten übernehmen</UiButton
      >
      <span class="hint tc-m0">Karten mit eigenem Design (●) behalten ihres.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { UiButton } from '../../components/ui';
import { SECTION_LABEL, clone, oneLine, type CardInfo, type TcSectionKey } from './tcData';
import { tcUi } from './tcUi';
import { useTc } from './useTc';

/**
 * „Design übertragen“ (wie `applyBody`): Design der Quelle (gewählte Karte oder
 * Standard) auf angehakte Zielkarten anwenden. Quelle = Standard entfernt das
 * eigene Design der Ziele.
 */
const emit = defineEmits<{ asDefault: [] }>();
const { service, view, ensureEnabled, toast } = useTc();

const srcLabel = computed(() =>
  view.value.selCard ? `„${oneLine(view.value.selCard.title)}“` : 'Standard (alle Karten)',
);
const groups = computed(() =>
  service.sections
    .map((section) => ({
      section,
      cards: view.value.cards.filter((c: CardInfo) => c.section === section),
    }))
    .filter((g) => g.cards.length),
);
const count = computed(() => [...tcUi.targets].filter((id) => id !== view.value.selected).length);

function toggle(id: string, on: boolean) {
  if (on) tcUi.targets.add(id);
  else tcUi.targets.delete(id);
}
function toggleSection(section: TcSectionKey) {
  const ids = view.value.cards
    .filter((c) => c.section === section && c.id !== view.value.selected)
    .map((c) => c.id);
  const allOn = ids.every((id) => tcUi.targets.has(id));
  for (const id of ids) toggle(id, !allOn);
}
function selectAll(on: boolean) {
  tcUi.targets.clear();
  if (on) for (const c of view.value.cards) if (c.id !== view.value.selected) toggle(c.id, true);
}
function apply() {
  const v = view.value;
  const valid = new Set(v.cards.map((c) => c.id));
  const ids = [...tcUi.targets].filter((id) => id !== v.selected && valid.has(id));
  if (!ids.length) return;
  ensureEnabled();
  if (v.selected) for (const id of ids) v.tc.cards[id] = clone(v.style);
  else for (const id of ids) delete v.tc.cards[id];
  tcUi.targets.clear();
  toast(
    v.selected
      ? `Design auf ${ids.length} Karte(n) angewendet`
      : `${ids.length} Karte(n) auf Standard-Design zurückgesetzt`,
  );
}
</script>

<style scoped>
.tc-apply {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
.tc-m0 {
  margin: 0;
}
.tc-strong {
  color: var(--text);
}
.tc-line {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
}
.tc-wrapbtn.tc-wrapbtn {
  white-space: normal;
  height: auto;
  min-height: var(--ds-control-sm);
  max-width: 100%;
  line-height: 1.25;
  padding-block: 4px;
  text-align: left;
}
</style>
