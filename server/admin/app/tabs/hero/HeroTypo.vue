<template>
  <div class="hd-typo" data-hd-typo>
    <div class="hd-line hd-end">
      <UiSelect
        :model-value="hd.titleFont"
        label="Überschriften-Schrift (Titel/Untertitel)"
        size="sm"
        :options="fontOptions(hd.titleFont)"
        data-hdfont="titleFont"
        @update:model-value="hd.titleFont = String($event)"
      />
      <ResetBtn field="titleFont" @reset="reset" />
    </div>
    <p class="hint hd-m0">
      Aus dem Ordner <code>/fonts</code> auf dem Server. Wirkt auf beide Modi. Auch ohne „Eigenes
      Hero-Design“ nutzbar. Schrift, Größe und Beschriftung der <strong>Buttons</strong> stehen in
      der Sektion „Buttons &amp; CTA“ weiter unten; Farben in den Seitenleisten.
    </p>

    <p class="hd-head">
      🌐 Globale Standard-Schrift der ganzen Seite <span class="lang-badge">gilt für DE + EN</span>
    </p>
    <p class="hint hd-m0">
      Eine Kachel aktivieren, um diese Schrift als Basis-Schrift der
      <strong>gesamten Website</strong> zu setzen (Navigation, Tool-Karten, Texte, Footer …). Wirkt
      sofort überall; einzelne Hero-Schriften oben überschreiben sie im Hero. „Standard (System)“
      setzt auf die Werksschrift zurück.
    </p>
    <div ref="galleryEl" class="hd-fonttiles">
      <button
        v-for="t in tiles"
        :key="t.file"
        type="button"
        :class="['hd-fonttile', { active: t.active }]"
        :data-hdglobalfont="t.file"
        title="Als globale Standard-Schrift der ganzen Seite aktivieren"
        :aria-pressed="t.active ? 'true' : 'false'"
        @click="setGlobal(t.file)"
      >
        <span class="hd-fonttile-sample" :style="t.family ? { fontFamily: t.family } : undefined">{{
          t.label
        }}</span>
        <span class="hd-fonttile-label">{{ t.label }}</span>
        <span v-if="t.active" class="hd-fonttile-badge">✓ Aktiv</span>
      </button>
    </div>

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
import { computed, onMounted, ref } from 'vue';
import { SliderControl, UiSelect } from '../../components/ui';
import ResetBtn from '../media/ResetBtn.vue';
import TcColor from '../toolcards/TcColor.vue';
import HdNum from './HdNum.vue';
import { clampTypo, type HeroDesign, type HeroTypoNum } from './heroData';
import { useHero } from './useHero';

/**
 * Sektion „Überschriften-Typografie & globale Schrift“ (wie `typoBody` in
 * `public/design.ts`): Überschriften-Schrift, Kachel-Galerie der globalen
 * Basis-Schrift (DE + EN), Buchstabenabstand, Kontur und Schriftgrößen.
 */
const { service, view, change, ff, fontOptions, toast } = useHero();
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

// ---- Globale Schrift ---------------------------------------------------------------------
const tiles = computed(() => {
  const active = view.value.globalFont;
  return [
    { file: '', label: 'Standard (System)', family: '', active: !active },
    ...service.fonts().map((f) => ({
      file: f.name,
      label: f.label || f.name,
      family: ff(f.name),
      active: f.name === active,
    })),
  ];
});
function setGlobal(file: string) {
  // Auch die Hero-Schriften (DE + EN) übernehmen, damit die Auswahl sichtbar bleibt.
  change(() => service.setGlobalFont(file));
  toast(file ? 'Globale Schrift aktiviert' : 'Globale Schrift auf Standard zurückgesetzt');
}
// Galerie beim Öffnen zur aktiven Schrift scrollen (nur innerhalb der Galerie).
const galleryEl = ref<HTMLElement | null>(null);
onMounted(() => {
  const g = galleryEl.value;
  const t = g?.querySelector<HTMLElement>('.hd-fonttile.active');
  if (!g || !t) return;
  const centered =
    t.getBoundingClientRect().top -
    g.getBoundingClientRect().top -
    (g.clientHeight - t.clientHeight) / 2;
  g.scrollTop = Math.max(0, g.scrollTop + centered);
});
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
