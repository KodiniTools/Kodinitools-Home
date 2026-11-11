<template>
  <div ref="rootEl" :class="['tc-layout', `bg-collapsed-${otherMode}`]" data-vue-tab="hero">
    <template v-for="col in COLUMNS" :key="col">
      <div v-if="col === 'main'" class="tc-main">
        <HeroPreview />

        <div class="panel">
          <h2>
            Hero-Design <span class="lang-badge">{{ LANG }}</span>
          </h2>
          <p class="hint">
            Gestaltet den Hero-Bereich oben auf der
            {{ service.lang === 'de' ? 'deutschen' : 'englischen' }} Startseite. Hier in der Mitte:
            Texte, Schriften und Typografie (gelten für beide Modi). Alle <strong>Farben</strong> je
            Modus stehen links (Hell) und rechts (Dunkel). Ausgeschaltet = Standard-Design.
          </p>
          <div class="hd-line">
            <UiSwitch
              :model-value="view.hd.enabled"
              label="Eigenes Hero-Design verwenden"
              data-hdenabled
              @update:model-value="view.hd.enabled = $event"
            />
            <button
              type="button"
              class="hd-reset"
              title="Auf Standard zurücksetzen"
              aria-label="Auf Standard zurücksetzen"
              data-hdenabledreset
              @click="resetEnabled"
            >
              ↺
            </button>
          </div>

          <div class="hd-box">
            <UiButton
              size="sm"
              class="hd-wrapbtn"
              title="Alle Hero-Design-Einstellungen (Hell + Dunkel) und die Feinabstimmung der Hero-Texte in die andere Sprache übernehmen – Texte und Beschriftungen bleiben je Sprache"
              :data-hdcopy="OTHER"
              @click="askCopyLang"
              >📋 Hero-Design nach {{ OTHER_NAME }} übertragen</UiButton
            >
            <p class="hint hd-m0">
              Kopiert <strong>alle</strong> Hero-Design-Einstellungen (Hell + Dunkel: Schriften,
              Typografie, Farben, Transparenzen) sowie die Feinabstimmung der Hero-Texte (Schrift,
              Größe, Farbe Hell + Dunkel, Effekte) von {{ LANG_NAME }} nach {{ OTHER_NAME }}. Die
              <em>Texte</em> und Button-<em>Beschriftungen</em> bleiben je Sprache erhalten.
            </p>
          </div>

          <HdSec sec="textsc">
            <template #title>✍️ Hero-Texte – Titel, Untertitel, Button-Text</template>
            <HeroTexts />
          </HdSec>
          <HdSec>
            <template #title
              >🔤 Überschriften-Typografie &amp; globale Schrift
              <span class="hint hd-normal">(für beide Modi)</span></template
            >
            <HeroTypo />
          </HdSec>
          <HdSec sec="show">
            <template #title>👁️ Texte &amp; Buttons ein-/ausblenden</template>
            <div :class="['hd-showrow', { 'hd-sel': selKind === 'title' }]" data-hdshowrow="title">
              <UiSwitch
                :model-value="view.hd.showTitle !== false"
                label="Titel anzeigen"
                data-hdshow="showTitle"
                @update:model-value="view.hd.showTitle = $event"
              />
            </div>
            <div
              :class="['hd-showrow', { 'hd-sel': selKind === 'subtitle' }]"
              data-hdshowrow="subtitle"
            >
              <UiSwitch
                :model-value="view.hd.showSubtitle !== false"
                label="Untertitel anzeigen"
                data-hdshow="showSubtitle"
                @update:model-value="view.hd.showSubtitle = $event"
              />
            </div>
            <div class="hd-showrow">
              <UiSwitch
                :model-value="view.hd.showChips !== false"
                label="Feature-Buttons (Chips) anzeigen"
                data-hdshow="showChips"
                @update:model-value="view.hd.showChips = $event"
              />
            </div>
            <div class="hd-chiprows" data-hdchiprows>
              <div
                v-for="f in view.feats"
                :key="f.key"
                :class="['hd-showrow', { 'hd-sel': selKind === 'chip' && selKey === f.key }]"
                :data-hdshowrow="`chip:${f.key}`"
              >
                <UiSwitch
                  :model-value="!chipHidden(view.hd, f.key)"
                  :label="featLabel(view.ov, f)"
                  :disabled="view.hd.showChips === false"
                  :data-hdchipshow="f.key"
                  @update:model-value="setChipShown(view.hd, f.key, $event)"
                />
              </div>
            </div>
            <div :class="['hd-showrow', { 'hd-sel': selKind === 'cta' }]" data-hdshowrow="cta">
              <UiSwitch
                :model-value="view.hd.showCta !== false"
                label="CTA-Button („Jetzt starten“) anzeigen"
                data-hdshow="showCta"
                @update:model-value="view.hd.showCta = $event"
              />
            </div>
            <p class="hint hd-m0">
              Titel und Untertitel lassen sich ausblenden; jeder Button lässt sich einzeln
              ausblenden, der Schalter „Feature-Buttons anzeigen“ blendet alle Chips auf einmal aus.
              Ausgeblendete Texte und Buttons sind auf der Seite unsichtbar und nicht anklickbar;
              ihr Platz bleibt erhalten, der Hero behält seine Höhe (Vorschau oben folgt sofort).
              Ein Klick auf einen Text oder Button in der Vorschau springt zu seinen Einstellungen.
              Gilt für Hell und Dunkel und unabhängig von „Eigenes Hero-Design“.
            </p>
          </HdSec>
          <HdSec sec="buttons">
            <template #title>🔘 Buttons &amp; CTA – Text, Größen, Beschriftungen</template>
            <HeroButtons />
          </HdSec>
        </div>
      </div>
      <aside
        v-else-if="col !== prevMode"
        class="tc-side tc-side--collapsed"
        :data-tcside="col"
        :data-hdshowmode="col"
        role="button"
        tabindex="0"
        :title="`${col === 'dark' ? 'Dunkelmodus' : 'Hellmodus'} anzeigen und bearbeiten`"
        @click="prevMode = col"
        @keydown.enter.prevent="prevMode = col"
        @keydown.space.prevent="prevMode = col"
      >
        <span class="hd-icon-lg" aria-hidden="true">{{ col === 'dark' ? '🌙' : '☀️' }}</span>
        <span class="tc-side-vlabel"
          >{{ col === 'dark' ? 'Dunkelmodus' : 'Hellmodus' }} – anklicken zum Bearbeiten</span
        >
      </aside>
      <HeroSide v-else :mode="col" @ask-clear-slides="askClearSlides" />
    </template>

    <UiDialog
      :open="!!pending"
      :title="pending?.title ?? ''"
      :description="pending?.description ?? ''"
      @close="pending = null"
    >
      <template #footer>
        <UiButton variant="ghost" @click="pending = null">Abbrechen</UiButton>
        <UiButton variant="danger" data-hd-confirm @click="confirmPending">{{
          pending?.confirmLabel
        }}</UiButton>
      </template>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue';
import type { Lang, ThemeMode } from '../../../types';
import { UiButton, UiDialog, UiSwitch } from '../../components/ui';
import HdSec from './HdSec.vue';
import HeroButtons from './HeroButtons.vue';
import HeroPreview from './HeroPreview.vue';
import HeroSide from './HeroSide.vue';
import HeroTexts from './HeroTexts.vue';
import HeroTypo from './HeroTypo.vue';
import {
  MODE_NAME,
  chipHidden,
  copyDesignToLang,
  featLabel,
  setChipShown,
  slidesOf,
  type HeroService,
} from './heroData';
import { hdUi } from './heroUi';
import { provideHero } from './useHero';

/**
 * Tab „Hero-Design“ (je Sprache, Vue-Fassung von `renderHeroDesign` in
 * `public/design.ts`): Rahmen, Hintergrund(-bild/-diashow), Chips und CTA je
 * Hell/Dunkel in den Seitenleisten; Texte, Schriften, Typografie,
 * Sichtbarkeit und Beschriftungen in der Mitte; Sticky-Vorschau in
 * Originalgröße mit Ziehen/Anspringen. Geschrieben wird direkt in
 * `media.<lang>.heroDesign`, `textStyles["hero.*"]` und die Overrides, damit
 * Speichern, Autosave und Undo per Snapshot unverändert greifen.
 */
const props = defineProps<{ service: HeroService }>();
const { view, change, toast } = provideHero(props.service);
const service = props.service;
const LANG = service.lang.toUpperCase();
const LANG_NAME = service.lang === 'de' ? 'Deutsch' : 'English';
const OTHER: Lang = service.lang === 'de' ? 'en' : 'de';
const OTHER_NAME = OTHER === 'de' ? 'Deutsch' : 'English';

type Column = ThemeMode | 'main';
const COLUMNS: Column[] = ['light', 'main', 'dark'];
const prevMode = computed<ThemeMode>({
  get: () => hdUi.prevMode,
  set: (m) => (hdUi.prevMode = m === 'dark' ? 'dark' : 'light'),
});
const otherMode = computed<ThemeMode>(() => (prevMode.value === 'light' ? 'dark' : 'light'));

const selKind = computed(() => hdUi.selected?.kind ?? '');
const selKey = computed(() => hdUi.selected?.key ?? '');

function resetEnabled() {
  view.value.hd.enabled = service.designDefault().enabled;
  toast('Auf Standard zurückgesetzt');
}

// Auswahl eines Textes in der Vorschau klappt „Hero-Texte“ in der Mitte auf.
const rootEl = ref<HTMLElement | null>(null);
watch(
  () => hdUi.selSeq,
  async () => {
    if (!hdUi.selected || hdUi.selected.kind === 'chip') return;
    await nextTick();
    const det = rootEl.value?.querySelector<HTMLDetailsElement>('[data-hdsection="textsc"]');
    if (det) det.open = true;
  },
);

// ---- Rückfragen (statt confirm()) --------------------------------------------------------
interface Pending {
  title: string;
  description: string;
  confirmLabel: string;
  action: () => void;
}
const pending = shallowRef<Pending | null>(null);
function confirmPending() {
  const p = pending.value;
  pending.value = null;
  p?.action();
}
function askCopyLang() {
  pending.value = {
    title: `Hero-Design nach ${OTHER_NAME} übertragen?`,
    description: `Alle Hero-Design-Einstellungen für ${OTHER_NAME} werden ersetzt (Hell + Dunkel, inkl. Feinabstimmung der Hero-Texte). Die Texte selbst bleiben.`,
    confirmLabel: 'Übertragen',
    action: () => {
      change(() =>
        copyDesignToLang(
          service.media(),
          service.design(),
          service.mediaOf(OTHER),
          service.textSlots,
        ),
      );
      toast(`Hero-Design nach ${OTHER_NAME} übertragen (Hell + Dunkel)`);
    },
  };
}
function askClearSlides(mode: ThemeMode) {
  pending.value = {
    title: 'Diashow leeren?',
    description: `Alle weiteren Bilder aus der Hero-Diashow (${MODE_NAME[mode]}) entfernen? Das Hintergrundbild bleibt.`,
    confirmLabel: 'Alle entfernen',
    action: () => {
      slidesOf(view.value.hd[mode]).length = 0;
      toast('Diashow geleert');
    },
  };
}
</script>

<style scoped>
.hd-m0 {
  margin: 0;
}
.hd-normal {
  font-weight: 400;
}
.hd-line {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
  margin-top: var(--ds-space-2);
}
.hd-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ds-space-2);
  margin: var(--ds-space-3) 0 var(--ds-space-1);
  padding: var(--ds-space-2) var(--ds-space-3);
  border: 1px dashed var(--border);
  border-radius: 8px;
}
.hd-showrow {
  padding: 2px var(--ds-space-1);
  border-radius: 6px;
}
.hd-chiprows {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-1) var(--ds-space-4);
  margin-left: 1.4rem;
}
.hd-sel {
  outline: 2px solid var(--accent);
}
.hd-icon-lg {
  font-size: 1.3rem;
}
.hd-wrapbtn.hd-wrapbtn {
  white-space: normal;
  height: auto;
  min-height: var(--ds-control-sm);
  max-width: 100%;
  line-height: 1.25;
  padding-block: 4px;
  text-align: left;
}
</style>
