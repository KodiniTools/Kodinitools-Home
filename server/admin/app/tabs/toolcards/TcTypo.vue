<template>
  <div class="tc-typo" data-tc-typo>
    <p class="tc-head">Ausrichtung</p>
    <div class="tc-line tc-end">
      <UiSelect
        :model-value="t.align"
        label="Icon, Badge, Titel und Popup-Text"
        size="sm"
        :options="opts(service.aligns, ALIGN_LABEL)"
        data-tct="align"
        @update:model-value="set('align', $event)"
      />
      <ResetBtn field="align" @reset="reset" />
    </div>

    <p class="tc-head">Titel</p>
    <div class="tc-line tc-end">
      <UiSelect
        :model-value="t.titleFont"
        label="Schriftart"
        size="sm"
        :options="fontOptions(t.titleFont)"
        data-tct="titleFont"
        @update:model-value="set('titleFont', $event)"
      />
      <ResetBtn field="titleFont" @reset="reset" />
    </div>
    <SliderControl
      :model-value="t.titleSize"
      label="Größe (0 = Standard)"
      :max="40"
      :default-value="src.titleSize"
      :value-text="`${t.titleSize} px`"
      input-class="tct-titleSize"
      @update:model-value="set('titleSize', $event)"
    />
    <div class="tc-line tc-end">
      <UiSelect
        :model-value="t.titleWeight"
        label="Gewicht"
        size="sm"
        :options="opts(service.weights, WEIGHT_LABEL)"
        data-tct="titleWeight"
        @update:model-value="set('titleWeight', $event)"
      />
      <ResetBtn field="titleWeight" @reset="reset" />
      <UiSelect
        :model-value="t.titleTransform"
        label="Schreibweise"
        size="sm"
        :options="opts(service.transforms, TRANSFORM_LABEL)"
        data-tct="titleTransform"
        @update:model-value="set('titleTransform', $event)"
      />
      <ResetBtn field="titleTransform" @reset="reset" />
    </div>
    <SliderControl
      :model-value="t.titleSpacing"
      label="Buchstabenabstand (0 = Standard)"
      :min="-2"
      :max="5"
      :step="0.5"
      :default-value="src.titleSpacing"
      :value-text="`${t.titleSpacing} px`"
      @update:model-value="set('titleSpacing', $event)"
    />

    <p class="tc-head">Badge</p>
    <SliderControl
      :model-value="t.badgeSize"
      label="Größe (0 = Standard)"
      :max="20"
      :default-value="src.badgeSize"
      :value-text="`${t.badgeSize} px`"
      @update:model-value="set('badgeSize', $event)"
    />
    <div class="tc-line tc-end">
      <UiSelect
        :model-value="t.badgeWeight"
        label="Gewicht"
        size="sm"
        :options="opts(service.weights, WEIGHT_LABEL)"
        data-tct="badgeWeight"
        @update:model-value="set('badgeWeight', $event)"
      />
      <ResetBtn field="badgeWeight" @reset="reset" />
      <UiSelect
        :model-value="t.badgeTransform"
        label="Schreibweise"
        size="sm"
        :options="opts(service.transforms, TRANSFORM_LABEL)"
        data-tct="badgeTransform"
        @update:model-value="set('badgeTransform', $event)"
      />
      <ResetBtn field="badgeTransform" @reset="reset" />
    </div>

    <p class="tc-head">„Öffnen“-Link</p>
    <SliderControl
      :model-value="t.openSize"
      label="Größe (0 = Standard)"
      :max="20"
      :default-value="src.openSize"
      :value-text="`${t.openSize} px`"
      @update:model-value="set('openSize', $event)"
    />
    <div class="tc-line tc-end">
      <UiSelect
        :model-value="t.openWeight"
        label="Gewicht"
        size="sm"
        :options="opts(service.weights, WEIGHT_LABEL)"
        data-tct="openWeight"
        @update:model-value="set('openWeight', $event)"
      />
      <ResetBtn field="openWeight" @reset="reset" />
    </div>

    <p class="tc-head">Popup-Beschreibung &amp; Text-Schriftart</p>
    <div class="tc-line tc-end">
      <UiSelect
        :model-value="t.textFont"
        label="Schriftart (Badge, „Öffnen“, Popup)"
        size="sm"
        :options="fontOptions(t.textFont)"
        data-tct="textFont"
        @update:model-value="set('textFont', $event)"
      />
      <ResetBtn field="textFont" @reset="reset" />
    </div>
    <SliderControl
      :model-value="t.descSize"
      label="Popup-Textgröße (0 = Standard)"
      :max="24"
      :default-value="src.descSize"
      :value-text="`${t.descSize} px`"
      @update:model-value="set('descSize', $event)"
    />
    <p class="hint tc-m0">
      Typografie gilt für Hell und Dunkel gemeinsam; 0 bzw. „Standard“ = Wert der Seite. Schriften
      aus dem Ordner <code>/fonts</code>.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { normFontFile } from '../../../public/model-core.js';
import { SliderControl, UiSelect } from '../../components/ui';
import ResetBtn from '../media/ResetBtn.vue';
import { ALIGN_LABEL, TRANSFORM_LABEL, WEIGHT_LABEL, normTextField, type TcText } from './tcData';
import { useTc } from './useTc';

/** Typografie des bearbeiteten Designs (Hell + Dunkel), wie `typoBody`. */
const { service, text: t, textResetSource, setText, toast } = useTc();
const src = computed(() => textResetSource());

const opts = (values: readonly string[], labels: Record<string, string>) =>
  values.map((v) => ({ value: v, label: labels[v] ?? v }));
/** Schriften des Servers, jede in ihrer eigenen Schrift; fehlende bleibt wählbar. */
function fontOptions(cur: string) {
  const list = service.fonts().slice();
  if (cur && !list.some((f) => f.name === cur))
    list.unshift({ name: cur, label: `${cur} (nicht gefunden)`, url: '', bytes: 0 });
  return [
    { value: '', label: 'Standard (System)' },
    ...list.map((f) => {
      const fam = service.ensureFontFace(f.name);
      return {
        value: f.name,
        label: f.label || f.name,
        style: fam ? { fontFamily: `'${fam}', system-ui, sans-serif` } : undefined,
      };
    }),
  ];
}
function set(field: keyof TcText, v: unknown) {
  setText(field, normTextField(field, v, service, normFontFile) as never);
}
function reset(field: string) {
  const f = field as keyof TcText;
  setText(f, textResetSource()[f] as never);
  toast('Auf Standard zurückgesetzt');
}
</script>

<style scoped>
.tc-typo {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
.tc-head {
  margin: var(--ds-space-2) 0 0;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text);
}
.tc-m0 {
  margin: 0;
}
.tc-line {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
}
.tc-end {
  align-items: flex-end;
}
</style>
