<template>
  <div class="hd-typo" data-hd-typo>
    <p class="hint hd-m0">
      Schrift der ganzen Website ist <strong>Arial Bold</strong> (fest, nicht wählbar). Wirkt auf
      beide Modi. Größe und Beschriftung der <strong>Buttons</strong> stehen in der Sektion „Buttons
      &amp; CTA“ weiter unten; Farben in den Seitenleisten.
    </p>

    <p class="hd-head">✏️ Überschriften – Buchstabenabstand &amp; Kontur (Rahmen)</p>
    <SliderControl
      :model-value="hd.titleLetterSpacing"
      label="Abstand"
      :min="-5"
      :max="20"
      :step="0.5"
      :default-value="def.titleLetterSpacing"
      :value-text="`${hd.titleLetterSpacing} px`"
      input-class="hd-titleLetterSpacing"
      @update:model-value="setTypo('titleLetterSpacing', $event)"
    />
    <TcColor
      field="titleStrokeColor"
      label="Kontur-Farbe"
      :value="hd.titleStrokeColor"
      @update="hd.titleStrokeColor = $event"
      @reset="reset('titleStrokeColor')"
    />
    <SliderControl
      :model-value="hd.titleStrokeWidth"
      label="Kontur-Breite"
      :min="0"
      :max="5"
      :step="0.5"
      :default-value="def.titleStrokeWidth"
      :value-text="`${hd.titleStrokeWidth} px`"
      @update:model-value="setTypo('titleStrokeWidth', $event)"
    />
    <p class="hint hd-m0">Kontur-Breite 0 = keine Kontur. Buchstabenabstand 0 = normal.</p>

    <p class="hint hd-m0">
      🔠 Schriftgröße der Überschriften in px – leer = Standard. Eine Feinabstimmung unter
      „Hero-Texte“ geht für den jeweiligen Text vor.
    </p>
    <div class="hd-line hd-end">
      <label class="hd-field">
        <span>Titel</span>
        <span class="hd-line">
          <HdNum
            class="hd-num"
            :value="hd.titleFontSize || ''"
            :min="8"
            :max="96"
            placeholder="Standard ≈ 40"
            data-hdtypo="titleFontSize"
            @input="setTypo('titleFontSize', $event)"
          />
          <ResetBtn field="titleFontSize" @reset="reset" />
        </span>
      </label>
      <label class="hd-field">
        <span>Untertitel</span>
        <span class="hd-line">
          <HdNum
            class="hd-num"
            :value="hd.subtitleFontSize || ''"
            :min="8"
            :max="96"
            placeholder="≈ 18"
            data-hdtypo="subtitleFontSize"
            @input="setTypo('subtitleFontSize', $event)"
          />
          <ResetBtn field="subtitleFontSize" @reset="reset" />
        </span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { SliderControl } from '../../components/ui';
import ResetBtn from '../media/ResetBtn.vue';
import TcColor from '../toolcards/TcColor.vue';
import HdNum from './HdNum.vue';
import { clampTypo, type HeroDesign, type HeroTypoNum } from './heroData';
import { useHero } from './useHero';

/**
 * Sektion „Überschriften-Typografie“ (wie `typoBody` in `public/design.ts`):
 * Buchstabenabstand, Kontur und Schriftgrößen. Schrift ist überall Arial Bold.
 */
const { service, view, toast } = useHero();
const hd = computed(() => view.value.hd);
const def = service.designDefault();

function setTypo(field: HeroTypoNum, v: unknown) {
  hd.value[field] = clampTypo(field, v);
}
function reset(field: string) {
  const f = field as keyof HeroDesign;
  if (f in def) (hd.value as unknown as Record<string, unknown>)[f] = def[f];
  toast('Auf Standard zurückgesetzt');
}
</script>

<style scoped>
.hd-typo {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
.hd-m0 {
  margin: 0;
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
.hd-num {
  width: 120px;
}
</style>
