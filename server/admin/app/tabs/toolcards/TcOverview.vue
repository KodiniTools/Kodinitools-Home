<template>
  <div class="panel">
    <details class="tc-ovdetails" :open="tcUi.ovOpen" data-tcovdetails @toggle="onToggle">
      <summary>
        <h2 class="tc-m0">
          Alle Karten – Vorschau <span class="lang-badge">{{ THEME_LABEL[theme] }}</span>
        </h2>
        <span class="hint tc-auto">{{ tcUi.ovOpen ? 'zuklappen' : 'aufklappen' }}</span>
      </summary>
      <template v-if="tcUi.ovOpen">
        <div class="tc-line tc-mt">
          <UiSegmentedControl
            v-model="theme"
            label="Übersicht im Hell- oder Dunkelmodus anzeigen"
            size="sm"
            :options="THEME_OPTIONS"
            data-tcovmode
          />
        </div>
        <p class="hint">
          So sehen die Tool-Karten nach dem Veröffentlichen aus (Standard-Design; ● = Karte mit
          eigenem Design). Karte anklicken, um sie zu bearbeiten.
        </p>
        <div class="tc-ovpage" :style="pageCss" data-tcoverview>
          <template v-for="g in groups" :key="g.section">
            <p class="hint tc-ovsec">{{ SECTION_LABEL[g.section] }}</p>
            <div class="tc-grid">
              <div
                v-for="c in g.cards"
                :key="c.id"
                :class="['tc-pick', { active: c.id === view.selected, 'tc-hidden': c.hidden }]"
                :title="`${c.hidden ? 'Ausgeblendet – erscheint nicht auf der Seite. ' : ''}Klicken, um diese Karte zu bearbeiten`"
                :data-tcpick="c.id"
                @click="emit('pick', c.id)"
              >
                <span v-if="view.tc.cards[c.id]" class="tc-own" title="Eigenes Design">●</span>
                <span v-if="c.hidden" class="tc-hidden-badge">ausgeblendet</span>
                <TcCard
                  :card="c"
                  :theme="theme"
                  :side="styleOf(c.id)[theme]"
                  :text="styleOf(c.id).text"
                  :show="styleOf(c.id).show"
                  :open="view.openLabel"
                  :resolve-url="service.resolveUrl"
                  :ensure-font-face="service.ensureFontFace"
                  :data-tcov="c.id"
                />
              </div>
            </div>
          </template>
        </div>
      </template>
    </details>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ThemeMode } from '../../../types';
import { UiSegmentedControl } from '../../components/ui';
import TcCard from './TcCard.vue';
import { MODE_LABEL, SECTION_LABEL, THEME_LABEL, fontCss } from './tcData';
import { tcUi } from './tcUi';
import { useTc } from './useTc';

/**
 * Übersicht „Alle Karten“ mit effektivem Design (wie `overviewBlock`). Die
 * Karten werden nur bei aufgeklappter Übersicht gerendert (spart DOM).
 */
const emit = defineEmits<{ pick: [id: string] }>();
const { service, view, styleOf } = useTc();

const THEME_OPTIONS = (['light', 'dark'] as const).map((m) => ({ value: m, label: MODE_LABEL[m] }));
const theme = computed<ThemeMode>({
  get: () => tcUi.ovTheme,
  set: (m) => (tcUi.ovTheme = m === 'dark' ? 'dark' : 'light'),
});
const groups = computed(() =>
  service.sections
    .map((section) => ({ section, cards: view.value.cards.filter((c) => c.section === section) }))
    .filter((g) => g.cards.length),
);
const pageCss = computed(() => {
  void view.value;
  return `background:${service.pageBg(theme.value)};${fontCss(service.globalFont(), service.ensureFontFace)}`;
});
function onToggle(e: Event) {
  tcUi.ovOpen = (e.target as HTMLDetailsElement).open;
}
</script>

<style scoped>
.tc-m0 {
  margin: 0;
}
.tc-mt {
  margin-top: var(--ds-space-2);
}
.tc-auto {
  margin: 0 0 0 auto;
}
.tc-line {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
}
.tc-ovpage {
  border-radius: 10px;
  padding: 0.6rem 0.8rem 0.9rem;
  margin-top: var(--ds-space-2);
}
.tc-ovsec {
  margin: 0.7rem 0 0.3rem;
  font-weight: 600;
  color: var(--text);
}
</style>
