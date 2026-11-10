<template>
  <details class="tx-fx" :open="open" data-tx-fx @toggle="onToggle">
    <summary :class="{ 'tx-fx__sum--on': active }">
      Effekte — Schatten, Umriss, Deckkraft, Animation{{ active ? ' •' : '' }}
    </summary>
    <div class="tx-row">
      <label class="tx-field">
        <span>Schatten</span>
        <span class="tx-inline tx-check">
          <input
            type="checkbox"
            :checked="st.shadow"
            :disabled="disabled"
            data-tx-fx-field="shadow"
            @change="emit('set', 'shadow', ($event.target as HTMLInputElement).checked)"
          />
          anzeigen
        </span>
      </label>
      <div class="tx-field">
        <span>Schattenfarbe</span>
        <ColorField
          :model-value="st.shadowColor || '#000000'"
          :disabled="disabled"
          :label="`${label}: Schattenfarbe`"
          @update:model-value="emit('set', 'shadowColor', $event)"
        />
      </div>
      <label v-for="n in SHADOW_NUMS" :key="n.field" class="tx-field">
        <span>{{ n.label }}</span>
        <input
          type="number"
          class="tx-num"
          :min="FX_LIMITS[n.field].min"
          :max="FX_LIMITS[n.field].max"
          :step="FX_LIMITS[n.field].step"
          :value="st[n.field]"
          :disabled="disabled"
          :data-tx-fx-field="n.field"
          @input="emit('setNum', n.field, ($event.target as HTMLInputElement).value)"
          @change="syncInput($event, st[n.field])"
        />
      </label>
    </div>
    <div class="tx-row">
      <div class="tx-field">
        <span>Umriss-Farbe</span>
        <ColorField
          :model-value="st.strokeColor || '#000000'"
          :disabled="disabled"
          :label="`${label}: Umriss-Farbe`"
          @update:model-value="emit('set', 'strokeColor', $event)"
        />
      </div>
      <label v-for="n in STROKE_NUMS" :key="n.field" class="tx-field">
        <span>{{ n.label }}</span>
        <input
          type="number"
          class="tx-num"
          :min="FX_LIMITS[n.field].min"
          :max="FX_LIMITS[n.field].max"
          :step="FX_LIMITS[n.field].step"
          :value="st[n.field]"
          :disabled="disabled"
          :data-tx-fx-field="n.field"
          @input="emit('setNum', n.field, ($event.target as HTMLInputElement).value)"
          @change="syncInput($event, st[n.field])"
        />
      </label>
    </div>
    <div class="tx-row">
      <label class="tx-field">
        <span>Animation</span>
        <select
          :value="st.anim"
          :disabled="disabled"
          data-tx-fx-field="anim"
          @change="emit('set', 'anim', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="o in ANIM_OPTIONS" :key="o.value" :value="o.value">
            {{ o.label }}
          </option>
        </select>
      </label>
      <label class="tx-field">
        <span>Intensität (1–10)</span>
        <input
          type="number"
          class="tx-num"
          min="1"
          max="10"
          step="1"
          :value="st.animIntensity"
          :disabled="disabled"
          data-tx-fx-field="animIntensity"
          @input="emit('setNum', 'animIntensity', ($event.target as HTMLInputElement).value)"
          @change="syncInput($event, st.animIntensity)"
        />
      </label>
      <label class="tx-field">
        <span>Geschwindigkeit</span>
        <select
          :value="st.animSpeed"
          :disabled="disabled"
          data-tx-fx-field="animSpeed"
          @change="emit('set', 'animSpeed', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="o in ANIM_SPEED_OPTIONS" :key="o.value" :value="o.value">
            {{ o.label }}
          </option>
        </select>
      </label>
      <div class="tx-field tx-field--end">
        <button
          type="button"
          class="hd-reset"
          :disabled="disabled"
          title="Effekte zurücksetzen"
          aria-label="Effekte zurücksetzen"
          data-tx-reset="fx"
          @click="emit('reset')"
        >
          ↺ Effekte
        </button>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ColorField } from '../../components/ui';
import {
  ANIM_OPTIONS,
  ANIM_SPEED_OPTIONS,
  FX_LIMITS,
  fxActive,
  type FxField,
  type FxNumField,
  type TextStyle,
} from './textStyle';

/**
 * Effekt-Felder eines Text-Slots (Schatten, Umriss, Deckkraft, Animation) als
 * aufklappbarer Bereich – gemeinsam genutzt von den Tabs „Texte“ und
 * „Hero-Design“ (Vanilla: `fxControls` in `public/textstyle.js`). Schreibt
 * nicht selbst, sondern meldet Änderungen; Zahlen kommen roh (`setNum`) und
 * werden vom Aufrufer mit `clampFx` begrenzt.
 */
const props = withDefaults(
  defineProps<{ st: TextStyle; label: string; open: boolean; disabled?: boolean }>(),
  { disabled: false },
);
const emit = defineEmits<{
  set: [field: FxField, value: string | boolean];
  setNum: [field: FxNumField, raw: string];
  reset: [];
  toggle: [open: boolean];
}>();

const SHADOW_NUMS: { field: FxNumField; label: string }[] = [
  { field: 'shadowX', label: 'Versatz X (px)' },
  { field: 'shadowY', label: 'Versatz Y (px)' },
  { field: 'shadowBlur', label: 'Weichzeichnung (px)' },
];
const STROKE_NUMS: { field: FxNumField; label: string }[] = [
  { field: 'strokeWidth', label: 'Umriss-Dicke (px, 0=aus)' },
  { field: 'opacity', label: 'Deckkraft (%)' },
];

const active = computed(() => fxActive(props.st));

/** Nach Verlassen eines Zahlenfelds den (begrenzten) gespeicherten Wert zeigen. */
function syncInput(e: Event, v: number) {
  (e.target as HTMLInputElement).value = String(v);
}
function onToggle(e: Event) {
  const open = (e.target as HTMLDetailsElement).open;
  if (open !== props.open) emit('toggle', open);
}
</script>

<style scoped>
.tx-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--ds-space-3);
  margin-top: var(--ds-space-2);
}
.tx-field {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  margin: 0;
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
}
.tx-field--end {
  justify-content: flex-end;
}
.tx-inline {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
}
.tx-check {
  min-height: 38px;
  color: var(--ds-text);
  cursor: pointer;
}
.tx-check input {
  width: auto;
  margin: 0;
}
.tx-num {
  width: 90px;
}
.tx-fx summary {
  cursor: pointer;
  color: var(--ds-text-3);
  font-size: var(--ds-text-sm);
  user-select: none;
}
.tx-fx summary.tx-fx__sum--on {
  color: var(--ds-accent);
}
</style>
