<template>
  <div
    v-if="!current"
    class="panel tc-mode-collapsed"
    :data-bannerdesign="mode"
    :data-bannershowmode="mode"
    role="button"
    tabindex="0"
    :title="`${MODE_LABEL[mode]}-Modus anzeigen und bearbeiten`"
    @click="show"
    @keydown.enter.prevent="show"
    @keydown.space.prevent="show"
  >
    <span class="ly-icon" aria-hidden="true">{{ mode === 'dark' ? '🌙' : '☀️' }}</span>
    <span>{{ MODE_NAME[mode] }} – anklicken zum Bearbeiten</span>
  </div>
  <div v-else class="panel" :data-bannerdesign="mode">
    <div class="ly-head">
      <strong class="ly-modehead" :data-bannershowmode="mode"
        >{{ MODE_LABEL[mode] }} <span class="hint ly-m0 ly-normal">👁</span></strong
      >
      <span class="ly-inline">
        <button
          type="button"
          class="hd-reset"
          :title="`Diese Werte in den ${MODE_LABEL[other]}-Modus kopieren`"
          :data-bannercopyside="mode"
          @click="copySide"
        >
          → {{ other === 'dark' ? 'Dunkel' : 'Hell' }} kopieren
        </button>
        <button
          type="button"
          class="hd-reset"
          title="Banner-Design dieses Modus auf Standard zurücksetzen"
          :data-bannerstyleresetall="mode"
          @click="emit('askResetAll', mode)"
        >
          ↺ Alles
        </button>
      </span>
    </div>

    <TcColor
      field="borderColor"
      label="Rahmenfarbe"
      :value="s.borderColor"
      @update="s.borderColor = $event"
      @reset="reset('borderColor')"
    />
    <SliderControl
      v-for="f in ['borderWidth', 'borderRadius'] as const"
      :key="f"
      :model-value="s[f]"
      :label="NUM_LABEL[f]"
      :min="lim[f].min"
      :max="lim[f].max"
      :default-value="def[f]"
      :value-text="`${s[f]} ${NUM_UNIT[f]}`"
      :input-class="`ly-bs-${f}`"
      @update:model-value="setNum(f, $event)"
    />

    <div class="ly-sep"></div>
    <UiSwitch
      :model-value="s.shadow"
      label="Schatten anzeigen"
      :data-bannerstyle="`${mode}:shadow`"
      @update:model-value="s.shadow = $event"
    />
    <TcColor
      field="shadowColor"
      label="Schattenfarbe"
      :value="s.shadowColor"
      @update="s.shadowColor = $event"
      @reset="reset('shadowColor')"
    />
    <div class="ly-inline ly-end">
      <label v-for="f in ['shadowX', 'shadowY'] as const" :key="f" class="ly-field">
        <span>{{ NUM_LABEL[f] }}</span>
        <span class="ly-inline">
          <HdNum
            class="ly-num"
            :value="s[f]"
            :min="lim[f].min"
            :max="lim[f].max"
            :data-bannerstyle="`${mode}:${f}`"
            @input="setNum(f, $event)"
          />
          <ResetBtn :field="f" @reset="reset(f)" />
        </span>
      </label>
    </div>
    <SliderControl
      v-for="f in ['shadowBlur', 'shadowOpacity'] as const"
      :key="f"
      :model-value="s[f]"
      :label="NUM_LABEL[f]"
      :min="lim[f].min"
      :max="lim[f].max"
      :default-value="def[f]"
      :value-text="`${s[f]} ${NUM_UNIT[f]}`"
      :input-class="`ly-bs-${f}`"
      @update:model-value="setNum(f, $event)"
    />

    <div class="ly-sep"></div>
    <SliderControl
      v-for="f in ['opacity', 'darken'] as const"
      :key="f"
      :model-value="s[f]"
      :label="NUM_LABEL[f]"
      :min="lim[f].min"
      :max="lim[f].max"
      :default-value="def[f]"
      :value-text="`${s[f]} ${NUM_UNIT[f]}`"
      :input-class="`ly-bs-${f}`"
      @update:model-value="setNum(f, $event)"
    />

    <div class="ly-sep"></div>
    <TcColor
      field="bgColor"
      label="Tönung – Hintergrund des Kastens, nur bei Banner ohne Bild (Nur-Text)"
      :value="s.bgColor"
      @update="s.bgColor = $event"
      @reset="reset('bgColor')"
    />
    <SliderControl
      :model-value="s.bgOpacity"
      :label="NUM_LABEL.bgOpacity"
      :min="lim.bgOpacity.min"
      :max="lim.bgOpacity.max"
      :default-value="def.bgOpacity"
      :value-text="`${s.bgOpacity} %`"
      input-class="ly-bs-bgOpacity"
      @update:model-value="setNum('bgOpacity', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ThemeMode } from '../../../types';
import { SliderControl, UiSwitch } from '../../components/ui';
import HdNum from '../hero/HdNum.vue';
import ResetBtn from '../media/ResetBtn.vue';
import TcColor from '../toolcards/TcColor.vue';
import {
  MODE_LABEL,
  MODE_NAME,
  clampStyleNum,
  copyStyleSide,
  type BannerNumField,
  type BannerStyleField,
} from './layoutData';
import { lyUi } from './layoutUi';
import { useLayout } from './useLayout';

/**
 * Banner-Design eines Modus in der linken Seitenleiste (wie
 * `bannerDesignSection` in `public/layout-banner.js`). Der nicht gewählte Modus
 * ist zu einer klickbaren Leiste zugeklappt.
 */
const props = defineProps<{ mode: ThemeMode }>();
const emit = defineEmits<{ askResetAll: [mode: ThemeMode] }>();
const { service, style, styles, toast } = useLayout();

const current = computed(() => lyUi.prevMode === props.mode);
const other = computed<ThemeMode>(() => (props.mode === 'light' ? 'dark' : 'light'));
const s = computed(() => style(props.mode));
const def = service.styleDefault();
const lim = service.styleLimits;

const NUM_LABEL: Record<BannerNumField, string> = {
  borderWidth: 'Rahmendicke (0 = kein Rahmen)',
  borderRadius: 'Eckenradius',
  shadowX: 'Versatz X (px)',
  shadowY: 'Versatz Y (px)',
  shadowBlur: 'Weichzeichnung',
  shadowOpacity: 'Schatten-Deckkraft',
  opacity: 'Deckkraft',
  darken: 'Verdunkelung',
  bgOpacity: 'Tönung-Deckkraft (0 = keine Tönung)',
};
const NUM_UNIT: Record<BannerNumField, string> = {
  borderWidth: 'px',
  borderRadius: 'px',
  shadowX: 'px',
  shadowY: 'px',
  shadowBlur: 'px',
  shadowOpacity: '%',
  opacity: '%',
  darken: '%',
  bgOpacity: '%',
};

function show() {
  lyUi.prevMode = props.mode;
}
function setNum(f: BannerNumField, raw: unknown) {
  s.value[f] = clampStyleNum(f, raw, lim, def);
}
function reset(f: BannerStyleField) {
  (s.value as unknown as Record<string, unknown>)[f] = service.styleDefault()[f];
  toast('Auf Standard zurückgesetzt');
}
function copySide() {
  const to = copyStyleSide(styles(), props.mode);
  lyUi.prevMode = to;
  toast(`Banner-Design nach ${MODE_LABEL[to]} kopiert`);
}
</script>

<style scoped>
.ly-m0 {
  margin: 0;
}
.ly-normal {
  font-weight: 400;
}
.ly-icon {
  font-size: 1.2rem;
}
.ly-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.4rem;
}
.ly-modehead {
  outline: 2px solid var(--accent);
  padding: 0.1rem 0.4rem;
  border-radius: 6px;
}
.ly-inline {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.ly-end {
  display: flex;
  align-items: flex-end;
  gap: var(--ds-space-3);
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
.ly-num {
  width: 100px;
}
.ly-sep {
  border-top: 1px solid var(--border);
  margin: 0.7rem 0 0.5rem;
}
.panel:not(.tc-mode-collapsed) {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
</style>
