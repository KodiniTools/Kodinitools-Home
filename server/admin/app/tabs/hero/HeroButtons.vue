<template>
  <div class="hd-buttons" data-hd-buttons>
    <p class="hd-head">
      ✏️ Text der Buttons <span class="hint hd-normal">(gilt für beide Modi)</span>
    </p>
    <div class="hd-line hd-end">
      <UiSelect
        :model-value="hd.buttonFont"
        label="Schriftart (Chips + CTA-Button)"
        size="sm"
        :options="fontOptions(hd.buttonFont)"
        data-hdfont="buttonFont"
        @update:model-value="hd.buttonFont = String($event)"
      />
      <ResetBtn field="buttonFont" @reset="reset" />
    </div>
    <div class="hd-line hd-end">
      <label class="hd-field">
        <span>Schriftgröße Chips (px)</span>
        <span class="hd-line">
          <HdNum
            class="hd-num"
            :value="hd.chipFontSize || ''"
            :min="8"
            :max="96"
            placeholder="≈ 15"
            data-hdtypo="chipFontSize"
            @input="setTypo('chipFontSize', $event)"
          />
          <ResetBtn field="chipFontSize" @reset="reset" />
        </span>
      </label>
      <label class="hd-field">
        <span>Schriftgröße CTA (px)</span>
        <span class="hd-line">
          <HdNum
            class="hd-num"
            :value="hd.ctaFontSize || ''"
            :min="8"
            :max="96"
            placeholder="≈ 17"
            data-hdtypo="ctaFontSize"
            @input="setTypo('ctaFontSize', $event)"
          />
          <ResetBtn field="ctaFontSize" @reset="reset" />
        </span>
      </label>
    </div>
    <SliderControl
      :model-value="hd.buttonLetterSpacing"
      label="Buchstabenabstand"
      :min="-5"
      :max="20"
      :step="0.5"
      :default-value="def.buttonLetterSpacing"
      :value-text="`${hd.buttonLetterSpacing} px`"
      @update:model-value="setTypo('buttonLetterSpacing', $event)"
    />
    <TcColor
      field="buttonStrokeColor"
      label="Kontur-Farbe"
      :value="hd.buttonStrokeColor"
      @update="hd.buttonStrokeColor = $event"
      @reset="reset('buttonStrokeColor')"
    />
    <SliderControl
      :model-value="hd.buttonStrokeWidth"
      label="Kontur-Breite"
      :min="0"
      :max="5"
      :step="0.5"
      :default-value="def.buttonStrokeWidth"
      :value-text="`${hd.buttonStrokeWidth} px`"
      @update:model-value="setTypo('buttonStrokeWidth', $event)"
    />
    <p class="hint hd-m0">
      Schriftart, Abstand und Kontur gelten für Chips <em>und</em> CTA-Button; Größe leer =
      Standard. Kontur-Breite 0 = keine Kontur. Farben der Chips und des CTA-Buttons stehen in den
      Seitenleisten.
    </p>

    <p class="hd-head">
      🏷️ Beschriftungen der Chips <span class="lang-badge">{{ LANG }}</span>
    </p>
    <p class="hint hd-m0">
      Leer lassen = Standardtext der Sprachdatei. Der CTA-Text steht unter „Hero-Texte“.
    </p>
    <div
      v-for="f in view.feats"
      :key="f.key"
      :class="['hd-featrow', { 'hd-sel': selChip === f.key }]"
      :data-hdfeatrow="f.key"
    >
      <label class="hd-flabel" :for="`${uid}-${f.key}`">Button „{{ f.def || f.key }}“</label>
      <div class="hd-line hd-nowrap">
        <TcDraftInput
          :id="`${uid}-${f.key}`"
          :value="labelOverride(f.key)"
          :placeholder="f.def"
          :data-feat="f.key"
          @input="setLabel(f.key, $event)"
        />
        <button
          type="button"
          class="hd-reset"
          title="Auf Standard zurücksetzen"
          aria-label="Beschriftung zurücksetzen"
          :data-featreset="f.key"
          @click="resetLabel(f.key)"
        >
          ↺
        </button>
      </div>
      <div class="hd-line">
        <span
          class="hint hd-m0"
          title="Verschiebung gegenüber der normalen Position – in der Vorschau ziehen, Pfeiltasten (Shift = 10 px) oder hier eintragen"
          >Verschiebung X / Y (px)</span
        >
        <HdNum
          class="hd-num hd-num--s"
          :value="offsetOf('chip', f.key).x"
          :min="-service.offsetMax.x"
          :max="service.offsetMax.x"
          title="Waagerecht: − nach links, + nach rechts"
          aria-label="Verschiebung X"
          :data-chipoff="`${f.key}:x`"
          @input="setOff(f.key, 'x', $event)"
        />
        <HdNum
          class="hd-num hd-num--s"
          :value="offsetOf('chip', f.key).y"
          :min="-service.offsetMax.y"
          :max="service.offsetMax.y"
          title="Senkrecht: − nach oben, + nach unten"
          aria-label="Verschiebung Y"
          :data-chipoff="`${f.key}:y`"
          @input="setOff(f.key, 'y', $event)"
        />
        <button
          type="button"
          class="hd-reset"
          title="Verschiebung zurücksetzen (0/0)"
          aria-label="Verschiebung zurücksetzen"
          :data-chipoffreset="f.key"
          @click="resetOff(f.key)"
        >
          ↺
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue';
import { delPath, getPath, setPath } from '../../../public/model-core.js';
import { SliderControl, UiSelect } from '../../components/ui';
import ResetBtn from '../media/ResetBtn.vue';
import TcColor from '../toolcards/TcColor.vue';
import TcDraftInput from '../toolcards/TcDraftInput.vue';
import HdNum from './HdNum.vue';
import { clampTypo, featPath, type HeroDesign, type HeroTypoNum } from './heroData';
import { hdUi } from './heroUi';
import { useHero } from './useHero';

/**
 * Sektion „Buttons & CTA“ (wie `buttonsBody`/`featureLabelsBody` in
 * `public/design.js`): Schrift, Größen, Abstand und Kontur der Buttons (beide
 * Modi) sowie Beschriftung (Override) und Verschiebung je Feature-Button.
 */
const { service, view, offsetOf, setOffset, fontOptions, toast } = useHero();
const uid = `hd-ft-${useId()}`;
const LANG = service.lang.toUpperCase();
const hd = computed(() => view.value.hd);
const def = service.designDefault();
const selChip = computed(() =>
  hdUi.selected?.kind === 'chip' ? hdUi.selected.key : (null as string | null),
);

function setTypo(field: HeroTypoNum, v: unknown) {
  hd.value[field] = clampTypo(field, v);
}
function reset(field: string) {
  const f = field as keyof HeroDesign;
  if (f in def) (hd.value as unknown as Record<string, unknown>)[f] = def[f];
  toast('Auf Standard zurückgesetzt');
}

function labelOverride(key: string): string {
  const cur = getPath(view.value.ov, featPath(key));
  return cur != null ? String(cur) : '';
}
function setLabel(key: string, v: string) {
  if (v.trim() === '') delPath(view.value.ov, featPath(key));
  else setPath(view.value.ov, featPath(key), v);
}
function resetLabel(key: string) {
  delPath(view.value.ov, featPath(key));
  toast('Auf Standard zurückgesetzt');
}
function setOff(key: string, axis: 'x' | 'y', raw: string) {
  const n = parseInt(raw, 10);
  const o = offsetOf('chip', key);
  o[axis] = Number.isFinite(n) ? n : 0;
  setOffset('chip', key, o.x, o.y);
}
function resetOff(key: string) {
  setOffset('chip', key, 0, 0);
  toast('Auf Standard zurückgesetzt');
}
</script>

<style scoped>
.hd-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
.hd-m0 {
  margin: 0;
}
.hd-normal {
  font-weight: 400;
}
.hd-head {
  margin: var(--ds-space-2) 0 0;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text);
}
.hd-line {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
}
.hd-nowrap {
  flex-wrap: nowrap;
}
.hd-nowrap > :deep(input) {
  flex: 1 1 auto;
  min-width: 0;
}
.hd-end {
  align-items: flex-end;
}
.hd-field {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  margin: 0;
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
}
.hd-flabel {
  font-size: 0.8rem;
  color: var(--ds-text-2);
}
.hd-featrow {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  padding: var(--ds-space-1);
  border-radius: 6px;
}
.hd-sel {
  outline: 2px solid var(--accent);
}
.hd-num {
  width: 110px;
}
.hd-num--s {
  width: 80px;
}
</style>
