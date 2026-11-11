<template>
  <div :class="['tc-layout', `bg-collapsed-${otherMode}`]" data-vue-tab="background">
    <template v-for="col in COLUMNS" :key="col">
      <div v-if="col === 'main'" class="tc-main">
        <!-- Sticky-Vorschau des bearbeiteten Modus -->
        <div class="tc-sticky">
          <div class="bg-prevhead">
            <span class="hint bg-m0">👁 Live-Vorschau:</span>
            <UiSegmentedControl
              v-model="prevMode"
              label="Vorschau und Seitenleiste im Hell- oder Dunkelmodus"
              size="sm"
              :options="MODE_OPTIONS"
              data-bg-prevmode
            />
            <span class="hint bg-m0"
              ><em
                >inkl. Effekte{{
                  anyFx
                    ? '; Maus über die Vorschau bewegen zeigt das Spotlight'
                    : ' – derzeit alle aus'
                }}</em
              >
              – der andere Modus ist seitlich zugeklappt.</span
            >
          </div>
          <div class="fx-prevs fx-prevs--single">
            <div
              class="fx-prev"
              :data-fxprev="prevMode"
              :style="previewStyle(layers, prevMode)"
              :title="fx('fxSpotlight').on ? 'Maus bewegen: Spotlight folgt dem Zeiger' : ''"
              data-bg-preview
              @mousemove="onSpot"
              @mouseleave="spot = ''"
            >
              <div
                class="fx-prev-layer"
                data-fxlayer="image"
                :style="imageLayerStyle(layers)"
              ></div>
              <div
                class="fx-prev-layer"
                data-fxlayer="overlay"
                :style="overlayLayerStyle(layers)"
              ></div>
              <div
                class="fx-prev-layer"
                data-fxlayer="aurora"
                :style="{
                  background: AURORA_BG[prevMode],
                  opacity: fx('fxAurora').on ? fx('fxAurora').intensity / 100 : 0,
                }"
              ></div>
              <div
                class="fx-prev-layer"
                data-fxlayer="noise"
                :style="{
                  opacity: fx('fxNoise').on ? (fx('fxNoise').intensity / 100) * FX_NOISE_MAX : 0,
                }"
              ></div>
              <div class="fx-prev-layer" data-fxlayer="spot" :style="{ background: spot }"></div>
              <div class="fx-prev-content">
                <span class="fx-prev-label">{{
                  prevMode === 'dark' ? 'Dunkel 🌙' : 'Hell ☀️'
                }}</span>
                <div class="fx-prev-title">Kostenlose Online-Tools</div>
                <div class="fx-prev-text">
                  Überschrift, Text und Karten liegen auf diesem Hintergrund.
                </div>
                <div :class="['fx-prev-card', prevMode]">
                  <span class="fx-prev-badge">Beispiel</span>
                  <div class="fx-prev-card-title">Tool-Karte</div>
                </div>
                <div
                  :class="['fx-prev-secs', sectionStyle]"
                  :style="{ gap: `${previewGap(sectionGap)}px` }"
                >
                  <div
                    v-for="k in SECTION_KEYS"
                    :key="k"
                    class="fx-prev-sec"
                    :data-secprev="k"
                    :data-mode="prevMode"
                  >
                    <div
                      class="fx-prev-sec-img"
                      :style="sectionImgStyle(section(k, prevMode), service.resolveUrl)"
                    ></div>
                    <div
                      class="fx-prev-sec-tint"
                      :style="{ background: sectionTint(section(k, prevMode)) }"
                    ></div>
                    <span>{{ SECTION_LABEL[k] }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="panel">
          <h2>Seiten-Hintergrund <span class="lang-badge">gilt für DE + EN</span></h2>
          <p class="hint bg-m0">
            Legt den <strong>Hintergrund der gesamten Website</strong> fest (beide Sprachen). Farbe,
            <strong>Deckkraft</strong>, <strong>Farbverlauf</strong>, <strong>Muster</strong> und
            <strong>Hintergrundbild</strong> stehen je Modus in den Seitenleisten: links
            <strong>Hell</strong>, rechts <strong>Dunkel</strong>. Darunter je Modus die abgesetzten
            Sektionen. Hier in der Mitte: Vorschau, allgemeine Sektions-Einstellungen und Effekte.
          </p>
        </div>

        <!-- Abgesetzte Sektionen (allgemein) -->
        <div class="panel" data-bg-sections>
          <h2>Abgesetzte Sektionen <span class="lang-badge">gilt für Hell + Dunkel</span></h2>
          <p class="hint bg-m0">
            <strong>Audio-, Bild- und Diverse-Tools</strong> abwechselnd mit leicht anderer
            <strong>Tönung</strong> oder einem <strong>Bild</strong> absetzen, damit die Startseite
            beim Scrollen Struktur bekommt. Je Sektion getrennt für Hell und Dunkel; ohne Tönung und
            Bild bleibt alles wie bisher. Wirkung oben in der Vorschau (drei Streifen).
          </p>
          <div class="bg-grid">
            <UiSelect
              :model-value="sectionStyle"
              label="Darstellung"
              :options="STYLE_OPTIONS"
              data-bg-secstyle
              @update:model-value="change(() => service.setSectionStyle(String($event)))"
            />
            <div>
              <SliderControl
                :model-value="sectionGap"
                label="Abstand zwischen den Sektionen"
                :max="service.gapMax"
                :default-value="0"
                :value-text="`${sectionGap} px`"
                input-class="bg-gap"
                @update:model-value="change(() => service.setSectionGap($event))"
              />
              <p class="hint bg-m0">(px Seitenhintergrund zwischen zwei Bändern)</p>
            </div>
          </div>
          <div class="bg-btns">
            <UiButton
              size="sm"
              variant="primary"
              title="Audio- und Diverse-Tools dezent tönen, Bild-Tools frei lassen (Hell + Dunkel)"
              data-bg-secalt
              @click="alternate"
              >✨ Abwechselnd anwenden</UiButton
            >
            <UiButton
              size="sm"
              title="Alle Sektionen auf Standard (keine Tönung, kein Bild)"
              data-bg-secclear
              @click="clearDialog = true"
              >↺ Alle zurücksetzen</UiButton
            >
          </div>
          <p class="hint bg-mt">
            Tönung und Bild je Sektion stehen links (Hell) und rechts (Dunkel) unter „Abgesetzte
            Sektionen“.
          </p>
          <p class="hint bg-mt" data-bg-secnote>{{ secNote }}</p>
        </div>

        <!-- Effekte -->
        <div class="panel" data-bg-effects>
          <h2>Effekte <span class="lang-badge">gilt für Hell + Dunkel</span></h2>
          <p class="hint bg-m0">
            Zuschaltbare Hintergrund-Effekte für die ganze Website. Jeder Effekt einzeln
            ein-/ausschaltbar mit eigener Intensität; die Farben passen sich dem Modus an. Alles aus
            = wie bisher. Wirkung oben in der Sticky-Vorschau.
          </p>
          <div v-for="f in service.fxList" :key="f.key" class="bg-fx" :data-bg-fx="f.key">
            <UiSwitch
              :model-value="fx(f.key).on"
              :label="f.label"
              data-bg-fxon
              @update:model-value="change(() => service.setFx(f.key, { on: $event }))"
            />
            <p class="hint bg-m0">{{ FX_DESC[f.key] }}</p>
            <SliderControl
              :model-value="fx(f.key).intensity"
              label="Intensität"
              :default-value="50"
              :disabled="!fx(f.key).on"
              :value-text="`${fx(f.key).intensity} %`"
              :input-class="`bg-fxint-${f.key}`"
              @update:model-value="change(() => service.setFx(f.key, { intensity: $event }))"
            />
          </div>
        </div>
      </div>

      <aside
        v-else-if="col !== prevMode"
        class="tc-side tc-side--collapsed"
        :data-tcside="col"
        :data-bg-showmode="col"
        role="button"
        tabindex="0"
        :title="`${col === 'dark' ? 'Dunkelmodus' : 'Hellmodus'} anzeigen und bearbeiten`"
        @click="prevMode = col"
        @keydown.enter.prevent="prevMode = col"
        @keydown.space.prevent="prevMode = col"
      >
        <span class="bg-icon" aria-hidden="true">{{ col === 'dark' ? '🌙' : '☀️' }}</span>
        <span class="tc-side-vlabel"
          >{{ col === 'dark' ? 'Dunkelmodus' : 'Hellmodus' }} – anklicken zum Bearbeiten</span
        >
      </aside>
      <BgSide v-else :mode="col" :service="service" />
    </template>

    <UiDialog
      :open="clearDialog"
      title="Alle Sektionen zurücksetzen?"
      description="Tönung und Bild aller drei Sektionen werden für Hell und Dunkel auf Standard gesetzt. Darstellung und Abstand bleiben."
      @close="clearDialog = false"
    >
      <template #footer>
        <UiButton variant="ghost" @click="clearDialog = false">Abbrechen</UiButton>
        <UiButton variant="danger" data-bg-confirm @click="clearSections">Zurücksetzen</UiButton>
      </template>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ThemeMode } from '../../../types';
import {
  SliderControl,
  UiButton,
  UiDialog,
  UiSegmentedControl,
  UiSelect,
  UiSwitch,
} from '../../components/ui';
import { useToastStore } from '../../stores/toast';
import BgSide from './BgSide.vue';
import {
  AURORA_BG,
  FX_DESC,
  FX_NOISE_MAX,
  MODE_LABEL,
  SECTION_KEYS,
  SECTION_LABEL,
  SECTION_STYLE_LABEL,
  SECTION_TINT_DEFAULT,
  imageLayerStyle,
  overlayLayerStyle,
  previewGap,
  previewStyle,
  sectionImgStyle,
  sectionNote,
  sectionTint,
  spotlight,
  type BgService,
  type FxKey,
  type SiteSectionKey,
} from './bgData';
import { bgRev, bgUi } from './bgUi';

/**
 * Tab „Hintergrund“ (global, Vue-Fassung von `renderBackground` in
 * `public/background.ts`): Seiten-Hintergrund je Modus, abgesetzte Sektionen
 * und Effekte mit Sticky-Vorschau. Gelesen/geschrieben wird über die
 * normalisierenden Funktionen aus `public/model-site.ts` (als `service`), damit
 * Speichern, Autosave und Undo per Snapshot unverändert greifen.
 */
const props = defineProps<{ service: BgService }>();
const toasts = useToastStore();

type Column = ThemeMode | 'main';
const COLUMNS: Column[] = ['light', 'main', 'dark'];
const MODE_OPTIONS = (['light', 'dark'] as const).map((m) => ({ value: m, label: MODE_LABEL[m] }));
const STYLE_OPTIONS = Object.entries(SECTION_STYLE_LABEL).map(([value, label]) => ({
  value,
  label,
}));

const prevMode = computed<ThemeMode>({
  get: () => bgUi.prevMode,
  set: (m) => (bgUi.prevMode = m === 'dark' ? 'dark' : 'light'),
});
const otherMode = computed<ThemeMode>(() => (prevMode.value === 'light' ? 'dark' : 'light'));

/** Schreibt über den Service und stößt die Neuberechnung aller Anzeigen an. */
function change(fn: () => void) {
  fn();
  bgRev.value++;
}

// Gelesene Werte hängen vom Änderungszähler ab.
const layers = computed(() => (bgRev.value, props.service.layers(prevMode.value)));
const fxAll = computed(() => {
  void bgRev.value;
  return Object.fromEntries(props.service.fxList.map((f) => [f.key, props.service.fx(f.key)]));
});
const fx = (k: FxKey) => fxAll.value[k] ?? { on: false, intensity: 50 };
const anyFx = computed(() => props.service.fxList.some((f) => fx(f.key).on));
const sectionStyle = computed(() => (bgRev.value, props.service.sectionStyle()));
const sectionGap = computed(() => (bgRev.value, props.service.sectionGap()));
const sectionsAll = computed(() => {
  void bgRev.value;
  return Object.fromEntries(
    (['light', 'dark'] as const).map((m) => [
      m,
      Object.fromEntries(SECTION_KEYS.map((k) => [k, props.service.section(k, m)])),
    ]),
  );
});
const section = (k: SiteSectionKey, m: ThemeMode) => sectionsAll.value[m]![k]!;
const secNote = computed(() => sectionNote(section, sectionGap.value));

// Spotlight folgt der Maus in der Vorschau.
const spot = ref('');
function onSpot(e: MouseEvent) {
  const s = fx('fxSpotlight');
  if (!s.on) return;
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
  if (!r.width || !r.height) return;
  spot.value = spotlight(
    prevMode.value,
    s.intensity,
    ((e.clientX - r.left) / r.width) * 100,
    ((e.clientY - r.top) / r.height) * 100,
  );
}

function alternate() {
  change(() => {
    for (const m of ['light', 'dark'] as const) {
      props.service.setSection('audio', m, { color: SECTION_TINT_DEFAULT[m], opacity: 8 });
      props.service.setSection('image', m, { color: '' });
      props.service.setSection('diverse', m, { color: SECTION_TINT_DEFAULT[m], opacity: 8 });
    }
  });
  toasts.addToast('Abwechselnde Tönung angewandt (Audio + Diverse)', { type: 'success' });
}
const clearDialog = ref(false);
function clearSections() {
  clearDialog.value = false;
  change(() => {
    for (const k of SECTION_KEYS)
      for (const m of ['light', 'dark'] as const)
        props.service.setSection(k, m, props.service.defaultSectionSide());
  });
  toasts.addToast('Alle Sektionen zurückgesetzt', { type: 'success' });
}
</script>

<style scoped>
.bg-m0 {
  margin: 0;
}
.bg-mt {
  margin-top: var(--ds-space-2);
}
.bg-icon {
  font-size: 1.3rem;
}
.bg-prevhead {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  margin-bottom: var(--ds-space-2);
}
.bg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--ds-space-3);
  align-items: end;
  margin-top: var(--ds-space-3);
}
.bg-btns {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-3);
}
.bg-fx {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: 8px;
  padding: var(--ds-space-3);
  margin-top: var(--ds-space-2);
}
</style>
