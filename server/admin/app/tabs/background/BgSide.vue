<template>
  <aside class="tc-side" :data-tcside="mode" :data-bg-side="mode">
    <div :class="['tc-side-head', mode]">{{ dark ? '🌙 Dunkelmodus' : '☀️ Hellmodus' }}</div>

    <!-- Farbe, Deckkraft, Verlauf -->
    <div class="bg-box" :data-bg-mode="mode">
      <div class="bg-line">
        <UiSwitch
          :model-value="s.color !== ''"
          :label="`Eigene Hintergrundfarbe für den ${dark ? 'Dunkelmodus' : 'Hellmodus'} verwenden`"
          class="bg-grow"
          data-bg-enable
          @update:model-value="enableColor($event)"
        />
        <button
          type="button"
          class="hd-reset"
          title="Diesen Modus auf Standard zurücksetzen (Farbe, Muster, Bild)"
          :disabled="!anySet"
          data-bg-reset
          @click="resetMode"
        >
          ↺ Standard
        </button>
      </div>
      <div class="bg-field">
        <span class="bg-flabel">{{ s.gradient ? 'Startfarbe' : 'Farbe' }}</span>
        <ColorField
          :model-value="s.color || service.pageBgDefault[mode]"
          :disabled="!on"
          :label="s.gradient ? 'Startfarbe' : 'Farbe'"
          data-bg-color
          @update:model-value="set({ color: $event })"
        />
      </div>
      <SliderControl
        :model-value="s.opacity"
        label="Deckkraft"
        :default-value="100"
        :disabled="!on"
        :value-text="`${s.opacity} %`"
        input-class="bg-opacity"
        @update:model-value="set({ opacity: $event })"
      />
      <p class="hint bg-m0">(mischt mit der Standardfarbe {{ service.pageBgDefault[mode] }})</p>
      <UiSwitch
        :model-value="s.gradient"
        label="Farbverlauf"
        :disabled="!on"
        class="bg-mt"
        data-bg-gradient
        @update:model-value="toggleGradient($event)"
      />
      <div :class="['bg-grad', { 'bg-dim': !(on && s.gradient) }]">
        <div class="bg-field">
          <span class="bg-flabel">Endfarbe</span>
          <ColorField
            :model-value="s.color2 || GRADIENT_END_DEFAULT[mode]"
            :disabled="!(on && s.gradient)"
            label="Endfarbe"
            @update:model-value="set({ color2: $event })"
          />
        </div>
        <UiSelect
          :model-value="s.type"
          label="Art"
          size="sm"
          :disabled="!(on && s.gradient)"
          :options="gradientOptions"
          data-bg-type
          @update:model-value="set({ type: String($event) })"
        />
        <SliderControl
          :model-value="s.angle"
          label="Richtung"
          :min="0"
          :max="360"
          :default-value="180"
          :disabled="!(on && s.gradient) || s.type === 'radial'"
          :value-text="`${s.angle}°`"
          @update:model-value="set({ angle: $event })"
        />
        <p class="hint bg-m0">(0° = von unten nach oben, 180° = von oben nach unten)</p>
      </div>
      <p class="hint bg-mt" data-bg-note>{{ noteFor(s, service.pageBgDefault[mode]) }}</p>

      <!-- Muster -->
      <div class="bg-sub" data-bg-pattern>
        <div class="bg-sub-title">
          Muster
          <span class="hint bg-m0 bg-normal"
            >– Punkte, Gitter, Linien, Wellen u. a. (reines CSS, liegt über Farbe und
            Hintergrundbild)</span
          >
        </div>
        <UiSelect
          :model-value="s.pattern"
          label="Art"
          size="sm"
          :options="patternOptions"
          data-bg-patternsel
          @update:model-value="set({ pattern: String($event) })"
        />
        <div class="bg-field">
          <span class="bg-flabel">Farbe</span>
          <ColorField
            :model-value="s.patternColor"
            :disabled="!patternOn"
            label="Musterfarbe"
            @update:model-value="set({ patternColor: $event })"
          />
        </div>
        <SliderControl
          :model-value="s.patternSpacing"
          label="Abstand"
          :min="4"
          :max="200"
          :default-value="24"
          :disabled="!patternOn"
          :value-text="`${s.patternSpacing} px`"
          @update:model-value="set({ patternSpacing: $event })"
        />
        <SliderControl
          :model-value="s.patternThickness"
          label="Stärke"
          :min="1"
          :max="6"
          :default-value="1"
          :disabled="!patternOn"
          :value-text="`${s.patternThickness} px`"
          @update:model-value="set({ patternThickness: $event })"
        />
        <SliderControl
          :model-value="s.patternOpacity"
          label="Deckkraft"
          :default-value="12"
          :disabled="!patternOn"
          :value-text="`${s.patternOpacity} %`"
          @update:model-value="set({ patternOpacity: $event })"
        />
      </div>

      <!-- Hintergrundbild -->
      <div class="bg-sub" data-bg-image>
        <div class="bg-sub-title">
          Hintergrundbild
          <span class="hint bg-m0 bg-normal"
            >– aus der Mediathek, liegt unter Farbe/Muster und Effekten</span
          >
        </div>
        <div class="bg-line bg-start">
          <div class="bg-thumb" data-bg-thumb>
            <img v-if="imgUrl" :src="imgUrl" alt="" />
            <span v-else class="hint bg-m0">Kein Bild</span>
          </div>
          <div class="bg-btns">
            <UiButton size="sm" data-bg-pick @click="pickImage">📂 Aus Mediathek wählen</UiButton>
            <UiButton
              size="sm"
              variant="danger"
              :disabled="!s.image"
              data-bg-imgclear
              @click="set({ image: '' })"
              >Entfernen</UiButton
            >
          </div>
        </div>
        <label class="bg-flabel bg-mt" :for="urlId"
          >Bild-URL <span class="hint bg-m0">(z.B. /uploads/… oder https://…)</span></label
        >
        <input
          :id="urlId"
          type="text"
          :value="staged ? '' : s.image"
          :placeholder="
            staged ? 'Lokales Medium (wird beim Veröffentlichen hochgeladen)' : '/uploads/…'
          "
          data-bg-imageurl
          @change="setImageUrl($event)"
        />
        <div :class="{ 'bg-dim': !s.image }">
          <SliderControl
            :model-value="s.imageDarken"
            label="Abdunkelung"
            :default-value="0"
            :disabled="!s.image"
            :value-text="`${s.imageDarken} %`"
            @update:model-value="set({ imageDarken: $event })"
          />
          <SliderControl
            :model-value="s.imageBlur"
            label="Weichzeichner"
            :max="40"
            :default-value="0"
            :disabled="!s.image"
            :value-text="`${s.imageBlur} px`"
            @update:model-value="set({ imageBlur: $event })"
          />
          <SliderControl
            :model-value="s.imageOpacity"
            label="Deckkraft"
            :default-value="100"
            :disabled="!s.image"
            :value-text="`${s.imageOpacity} %`"
            @update:model-value="set({ imageOpacity: $event })"
          />
          <UiSwitch
            :model-value="s.imageFixed"
            label="Fixiert beim Scrollen"
            :disabled="!s.image"
            class="bg-mt"
            @update:model-value="set({ imageFixed: $event })"
          />
        </div>
        <p class="hint bg-mt" data-bg-xnote>{{ extrasNote(s) }}</p>
      </div>
    </div>

    <!-- Abgesetzte Sektionen dieses Modus -->
    <div class="bg-sub bg-secs">
      <div class="bg-sub-title">Abgesetzte Sektionen ({{ dark ? 'Dunkel' : 'Hell' }})</div>
      <p class="hint bg-m0">
        Tönung und/oder Bild je Sektion; Darstellung und Abstand in der Mitte.
      </p>
      <div v-for="k in SECTION_KEYS" :key="k" class="sec-box">
        <div class="sec-col" :data-bg-seccol="k">
          <div class="sec-col-title">{{ SECTION_LABEL[k] }}</div>
          <UiSwitch
            :model-value="sec(k).color !== ''"
            label="Tönung"
            data-bg-secen
            @update:model-value="setSec(k, { color: $event ? SECTION_TINT_DEFAULT[mode] : '' })"
          />
          <div class="bg-field">
            <ColorField
              :model-value="sec(k).color || SECTION_TINT_DEFAULT[mode]"
              :disabled="!sec(k).color"
              :label="`${SECTION_LABEL[k]}: Tönung`"
              @update:model-value="setSec(k, { color: $event })"
            />
          </div>
          <SliderControl
            :model-value="sec(k).opacity"
            label="Deckkraft"
            :default-value="8"
            :disabled="!sec(k).color"
            :value-text="`${sec(k).opacity} %`"
            @update:model-value="setSec(k, { opacity: $event })"
          />
          <div class="bg-line bg-mt">
            <div class="bg-thumb sm">
              <img v-if="secUrl(k)" :src="secUrl(k)" alt="" />
              <span v-else class="hint bg-m0">Kein Bild</span>
            </div>
            <UiButton size="sm" data-bg-secpick @click="pickSection(k)">📂 Bild</UiButton>
            <UiIconButton
              v-if="sec(k).image"
              label="Bild entfernen"
              size="sm"
              data-bg-secimgclear
              @click="setSec(k, { image: '' })"
              >✕</UiIconButton
            >
          </div>
          <template v-if="sec(k).image">
            <SliderControl
              :model-value="sec(k).imageDarken"
              label="Dunkler"
              :default-value="0"
              :value-text="`${sec(k).imageDarken} %`"
              @update:model-value="setSec(k, { imageDarken: $event })"
            />
            <SliderControl
              :model-value="sec(k).imageBlur"
              label="Weich"
              :max="40"
              :default-value="0"
              :value-text="`${sec(k).imageBlur} px`"
              @update:model-value="setSec(k, { imageBlur: $event })"
            />
            <SliderControl
              :model-value="sec(k).imageOpacity"
              label="Deckkraft"
              :default-value="100"
              :value-text="`${sec(k).imageOpacity} %`"
              @update:model-value="setSec(k, { imageOpacity: $event })"
            />
          </template>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';
import type { ThemeMode } from '../../../types';
import {
  ColorField,
  SliderControl,
  UiButton,
  UiIconButton,
  UiSelect,
  UiSwitch,
} from '../../components/ui';
import { useToastStore } from '../../stores/toast';
import {
  BG_RESET,
  GRADIENT_END_DEFAULT,
  GRADIENT_TYPE_LABEL,
  PATTERN_LABEL,
  SECTION_KEYS,
  SECTION_LABEL,
  SECTION_TINT_DEFAULT,
  extrasNote,
  noteFor,
  type BgService,
  type SiteBg,
  type SiteSectionKey,
  type SiteSectionSide,
} from './bgData';
import { bgRev } from './bgUi';

/**
 * Seitenleiste eines Modus im Tab „Hintergrund“: Farbe/Deckkraft/Verlauf,
 * Muster, Hintergrundbild und die abgesetzten Sektionen (wie `sideHtml` in
 * `public/background.ts`).
 */
const props = defineProps<{ mode: ThemeMode; service: BgService }>();
const toasts = useToastStore();
const dark = computed(() => props.mode === 'dark');
const urlId = `bg-url-${useId()}`;

const s = computed<SiteBg>(() => (bgRev.value, props.service.bg(props.mode)));
const on = computed(() => s.value.color !== '');
const patternOn = computed(() => s.value.pattern !== 'none');
const anySet = computed(() => on.value || patternOn.value || s.value.image !== '');
const staged = computed(() => s.value.image.startsWith('staged:'));
const imgUrl = computed(() => (s.value.image ? props.service.resolveUrl(s.value.image) : ''));

const gradientOptions = props.service.gradientTypes.map((t) => ({
  value: t,
  label: GRADIENT_TYPE_LABEL[t] ?? t,
}));
const patternOptions = props.service.patterns.map((t) => ({
  value: t,
  label: PATTERN_LABEL[t] ?? t,
}));

function set(patch: Partial<SiteBg>) {
  props.service.setBg(props.mode, patch);
  bgRev.value++;
}
function enableColor(v: boolean) {
  // Einschalten übernimmt die angezeigte Farbe (Standard des Modus).
  set({ color: v ? props.service.pageBgDefault[props.mode] : '' });
}
function toggleGradient(v: boolean) {
  const patch: Partial<SiteBg> = { gradient: v };
  if (v && !s.value.color2) patch.color2 = GRADIENT_END_DEFAULT[props.mode];
  set(patch);
}
function resetMode() {
  set({ ...BG_RESET });
  toasts.addToast(`${dark.value ? 'Dunkelmodus' : 'Hellmodus'} auf Standard zurückgesetzt`, {
    type: 'success',
  });
}
function setImageUrl(e: Event) {
  const input = e.target as HTMLInputElement;
  const v = input.value.trim();
  set({ image: v });
  if (v && !s.value.image)
    toasts.addToast('Ungültige Bild-URL – erlaubt sind /pfad oder https://…', { type: 'warning' });
  input.value = staged.value ? '' : s.value.image;
}
function pickImage() {
  const ok = props.service.pick(
    `Hintergrundbild (${dark.value ? 'Dunkelmodus' : 'Hellmodus'}) wählen`,
    (url) => set({ image: url }),
  );
  if (!ok)
    toasts.addToast('Keine Medien vorhanden — zuerst im Tab „Dateien“ eine Datei hinzufügen.', {
      type: 'info',
    });
}

// ---- Abgesetzte Sektionen ---------------------------------------------------------
const secs = computed(() => {
  void bgRev.value;
  return Object.fromEntries(
    SECTION_KEYS.map((k) => [k, props.service.section(k, props.mode)]),
  ) as Record<SiteSectionKey, SiteSectionSide>;
});
const sec = (k: SiteSectionKey) => secs.value[k];
const secUrl = (k: SiteSectionKey) => (sec(k).image ? props.service.resolveUrl(sec(k).image) : '');
function setSec(k: SiteSectionKey, patch: Partial<SiteSectionSide>) {
  props.service.setSection(k, props.mode, patch);
  bgRev.value++;
}
function pickSection(k: SiteSectionKey) {
  const ok = props.service.pick(
    `Bild für ${SECTION_LABEL[k]} (${dark.value ? 'Dunkelmodus' : 'Hellmodus'}) wählen`,
    (url) => setSec(k, { image: url }),
  );
  if (!ok)
    toasts.addToast('Keine Medien vorhanden — zuerst im Tab „Dateien“ eine Datei hinzufügen.', {
      type: 'info',
    });
}
</script>

<style scoped>
.bg-m0 {
  margin: 0;
}
.bg-mt {
  margin-top: var(--ds-space-2);
}
.bg-normal {
  font-weight: 400;
}
.bg-box {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: 8px;
  padding: var(--ds-space-3);
  margin-top: var(--ds-space-2);
}
.bg-line {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
}
.bg-start {
  align-items: flex-start;
}
.bg-grow {
  flex: 1 1 auto;
}
.bg-btns {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
}
.bg-field {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
}
.bg-flabel {
  display: block;
  font-size: 0.8rem;
  color: var(--ds-text-2);
}
.bg-grad {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
.bg-dim {
  opacity: 0.45;
}
.bg-secs {
  margin-top: var(--ds-space-4);
}
.sec-col {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
</style>
