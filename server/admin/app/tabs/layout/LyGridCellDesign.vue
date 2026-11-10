<template>
  <div
    :class="['panel', 'ly-cell', { 'ly-cell--inh': inh, 'ly-cell--active': active }]"
    :data-celleditor="i"
    @focusin="markCell(i)"
  >
    <div class="ly-line">
      <strong class="ly-title">Kachel {{ i + 1 }}{{ big ? ' (groß)' : '' }}</strong>
      <UiSwitch
        :model-value="isMaster"
        label="Standard für alle"
        :class="{ 'ly-accent': isMaster }"
        :data-cellmaster="i"
        @update:model-value="setMaster"
      />
      <button
        type="button"
        class="hd-reset ly-push"
        title="Ganze Kachel auf Standard zurücksetzen"
        aria-label="Ganze Kachel zurücksetzen"
        :data-cellresetall="i"
        @click="emit('askResetCell', i)"
      >
        ↺ Kachel
      </button>
    </div>
    <p v-if="inh" class="hint ly-note">
      ↳ Übernimmt Rahmen (Farbe &amp; Dicke), Hintergrund, Transparenz, Textgröße, -farbe und
      -position von Kachel {{ master + 1 }}.
    </p>

    <div class="ly-col">
      <TcColor
        field="borderColor"
        label="Rahmenfarbe"
        :value="s.borderColor"
        :disabled="inh"
        @update="set('borderColor', $event)"
        @reset="reset('borderColor')"
      />
      <label class="ly-field">
        <span>Rahmendicke (px)</span>
        <span class="ly-line">
          <HdNum
            class="ly-num"
            :value="s.borderWidth"
            :min="0"
            :max="20"
            :disabled="inh"
            :data-cellfield="`${i}:borderWidth`"
            @input="set('borderWidth', $event)"
          />
          <ResetBtn field="borderWidth" :disabled="inh" @reset="reset('borderWidth')" />
        </span>
      </label>
      <TcColor
        field="bgColor"
        label="Hintergrund"
        :value="s.bgColor"
        :disabled="inh"
        @update="set('bgColor', $event)"
        @reset="reset('bgColor')"
      />
      <SliderControl
        :model-value="s.bgOpacity"
        label="Hintergrund-Transparenz"
        :min="0"
        :max="100"
        :default-value="def.bgOpacity"
        :disabled="inh"
        :value-text="`${s.bgOpacity} %`"
        :input-class="`ly-cell-bgOpacity-${i}`"
        @update:model-value="set('bgOpacity', $event)"
      />
      <TcColor
        field="textColor"
        label="Textfarbe"
        :value="s.textColor || '#ffffff'"
        :disabled="inh"
        @update="set('textColor', $event)"
        @reset="reset('textColor')"
      />
      <label class="ly-field">
        <span>Textgröße (px, 0=auto)</span>
        <span class="ly-line">
          <HdNum
            class="ly-num"
            :value="s.textSize || 0"
            :min="0"
            :max="96"
            :disabled="inh"
            :data-cellfield="`${i}:textSize`"
            @input="set('textSize', $event)"
          />
          <ResetBtn field="textSize" :disabled="inh" @reset="reset('textSize')" />
        </span>
      </label>
      <div class="ly-field">
        <span
          >Textposition <span class="ly-muted">— in der Vorschau mit der Maus ziehen</span></span
        >
        <span class="ly-line">
          <button
            v-for="(lbl, p) in PRESETS"
            :key="p"
            type="button"
            class="hd-reset"
            :disabled="inh"
            :title="lbl.title"
            :aria-label="lbl.title"
            :data-cellpospreset="`${i}:${p}`"
            @click="preset(p)"
          >
            {{ lbl.icon }}
          </button>
          <span class="hint ly-m0" :data-cellposval="i">{{ s.textX }} / {{ s.textY }} %</span>
          <ResetBtn field="pos" :disabled="inh" @reset="reset('pos')" />
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { SliderControl, UiSwitch } from '../../components/ui';
import HdNum from '../hero/HdNum.vue';
import ResetBtn from '../media/ResetBtn.vue';
import TcColor from '../toolcards/TcColor.vue';
import { POS_PRESET_Y, type PosPreset } from './layoutData';
import { masterCell, resetCellField, setCellField, type CellField } from './gridData';
import { lyUi } from './layoutUi';
import { useLayout } from './useLayout';

/**
 * Rechte Seitenleiste im Raster-Modus: Design einer Kachel (wie
 * `cellDesignEditor` in `public/layout-grid.js`) – „Standard für alle“,
 * Rahmen, Hintergrund, Textfarbe, -größe und -position.
 */
const props = defineProps<{ i: number; big: boolean }>();
const emit = defineEmits<{ askResetCell: [i: number] }>();
const { view, service, cell, effCell, inherited, markCell, toast } = useLayout();

const s = computed(() => effCell(props.i));
const inh = computed(() => inherited(props.i));
const master = computed(() => masterCell(view.value.m) ?? 0);
const isMaster = computed(() => masterCell(view.value.m) === props.i);
const active = computed(() => lyUi.activeCell === props.i);
const def = service.cellDefault();
const PRESETS: Record<PosPreset, { icon: string; title: string }> = {
  top: { icon: '⤒', title: 'Oben' },
  center: { icon: '◎', title: 'Mitte' },
  bottom: { icon: '⤓', title: 'Unten' },
};

function setMaster(on: boolean) {
  const g = view.value.m;
  g.heroGridUniform = on;
  if (on) g.heroGridUniformCell = props.i;
  toast(
    on
      ? `Kachel ${props.i + 1} ist Standard für alle Kacheln`
      : 'Jede Kachel nutzt wieder ihre eigenen Einstellungen',
  );
}
function set(f: CellField, raw: number | string) {
  setCellField(cell(props.i), f, raw, service.imgFields);
}
function reset(f: CellField | 'pos') {
  resetCellField(cell(props.i), f, service.cellDefault());
  toast('Auf Standard zurückgesetzt');
}
function preset(p: PosPreset) {
  const c = cell(props.i);
  c.textX = 50;
  c.textY = POS_PRESET_Y[p];
}
</script>

<style scoped>
.ly-m0 {
  margin: 0;
}
.ly-cell {
  padding: 0.7rem 0.9rem;
  margin-bottom: 0.6rem;
  scroll-margin-top: 0.5rem;
}
.ly-cell--inh {
  opacity: 0.75;
}
.ly-cell--active {
  box-shadow: 0 0 0 2px var(--accent);
}
.ly-title {
  font-size: 0.85rem;
}
.ly-accent {
  color: var(--accent);
}
.ly-push {
  margin-left: auto;
}
.ly-note {
  margin: 0.3rem 0 0;
  color: var(--accent);
}
.ly-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.3rem 0.6rem;
}
.ly-col {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  margin-top: 0.4rem;
}
.ly-field {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  margin: 0;
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
}
.ly-muted {
  color: var(--muted);
  font-weight: 400;
}
.ly-num {
  width: 100px;
}
</style>
