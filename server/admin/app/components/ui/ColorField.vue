<template>
  <span
    ref="rootEl"
    class="color-field"
    :class="[$attrs.class, { 'color-field--open': open, 'color-field--disabled': disabled }]"
    :style="$attrs.style"
  >
    <button
      ref="triggerEl"
      type="button"
      class="color-field__swatch"
      v-bind="buttonAttrs($attrs)"
      :disabled="disabled"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="dialog"
      :title="($attrs.title as string | undefined) ?? currentHex"
      :style="{ backgroundColor: currentHex }"
      @click="toggle"
    >
      <span class="color-field__sr">{{ label || t('colorField.pickColor') }} {{ currentHex }}</span>
    </button>

    <Teleport :to="teleportTo">
      <div
        v-if="open"
        ref="panelEl"
        class="color-field__panel"
        role="dialog"
        :aria-label="label || t('colorField.pickColor')"
        :style="panelStyle"
        @keydown.esc.stop.prevent="close(true)"
      >
        <div v-for="ch in channels" :key="ch.key" class="color-field__row">
          <label class="color-field__label" :for="`${uid}-${ch.key}`" :title="t(ch.labelKey)">{{
            ch.short
          }}</label>
          <input
            type="range"
            class="color-field__range"
            :style="{ background: trackGradients[ch.key] }"
            :min="ch.min"
            :max="ch.max"
            :step="ch.step"
            :value="Math.round(hsl[ch.key])"
            :aria-label="t(ch.labelKey)"
            @pointerdown="beginInteraction"
            @input="onRangeInput(ch.key, $event)"
            @change="commitInteraction"
          />
          <input
            :id="`${uid}-${ch.key}`"
            type="number"
            class="color-field__num"
            inputmode="numeric"
            :min="ch.min"
            :max="ch.max"
            :step="ch.step"
            :value="Math.round(hsl[ch.key])"
            :aria-label="t(ch.labelKey)"
            @input="onNumberInput(ch.key, $event)"
            @change="commitInteraction"
            @blur="onNumberBlur(ch.key, $event)"
          />
          <span class="color-field__unit">{{ ch.unit }}</span>
        </div>

        <div class="color-field__row color-field__row--hex">
          <label class="color-field__label" :for="`${uid}-hex`" :title="t('colorField.hex')"
            >#</label
          >
          <input
            :id="`${uid}-hex`"
            type="text"
            class="color-field__hex"
            :class="{ 'color-field__hex--invalid': hexInvalid }"
            :value="hexDraft"
            maxlength="9"
            spellcheck="false"
            autocomplete="off"
            :aria-invalid="hexInvalid ? 'true' : 'false'"
            :title="hexInvalid ? t('colorField.invalidHex') : ''"
            @focus="hexFocused = true"
            @input="onHexInput"
            @blur="onHexBlur"
            @keydown.enter.prevent="onHexBlur"
          />
          <span class="color-field__preview" :style="{ backgroundColor: currentHex }"></span>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
/**
 * ColorField – Ersatz für `<input type="color">`.
 *
 * Ein Farbfeld (Swatch), das per Klick ein Panel aufklappt: drei Regler (Farbton,
 * Sättigung, Helligkeit) mit Zahlen-Spinner sowie ein Hex-Feld. Das Panel wird
 * nach `<body>` teleportiert, damit es nicht von scrollenden Seitenleisten
 * abgeschnitten wird.
 *
 * v-model: Hex-String `#rrggbb`. Ungültige Eingabewerte werden als Fallback
 * (schwarz) angezeigt, es wird aber nie ein ungültiger Wert emittiert.
 *
 * Events:
 * - `update:modelValue` (hex) – live bei jeder Änderung
 * - `start` (hex vor der Änderung) – Beginn einer Interaktion (für Undo-Snapshots)
 * - `change` (hex) – Abschluss einer Interaktion (Slider losgelassen, Feld verlassen)
 * - `open` / `close`
 *
 * Nicht-Prop-Attribute: `class`/`style` landen auf dem Wurzelelement (damit
 * bestehende Größen-Klassen der Eltern weiter greifen), alle anderen Attribute
 * (`title`, `aria-label`, …) auf dem Button.
 */
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import { useI18n } from '../../lib/i18n';
import {
  FALLBACK_HEX,
  HSL_RANGES,
  hexToHsl,
  hslToHex,
  hslTrackGradients,
  normalizeHex,
  setHslChannel,
  type Hsl,
  type HslChannel,
} from '../../lib/color';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    disabled?: boolean;
    /** Zugänglicher Name des Feldes; Default: i18n `colorField.pickColor`. */
    label?: string;
    /**
     * Ziel des Panels. In der App `appPortalTarget()` (#app) übergeben: Direkt
     * unter <body> setzen die SSI-Navigationsregeln aus main.css Hintergründe
     * transparent.
     */
    teleportTo?: string;
  }>(),
  { modelValue: FALLBACK_HEX, disabled: false, label: '', teleportTo: 'body' },
);

const emit = defineEmits<{
  'update:modelValue': [hex: string];
  start: [hex: string];
  change: [hex: string];
  open: [];
  close: [];
}>();

const { t } = useI18n();
const uid = useId();

const channels: Array<{
  key: HslChannel;
  short: string;
  labelKey: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}> = [
  { key: 'h', short: 'H', labelKey: 'colorField.hue', ...HSL_RANGES.h },
  { key: 's', short: 'S', labelKey: 'colorField.saturation', ...HSL_RANGES.s },
  { key: 'l', short: 'L', labelKey: 'colorField.lightness', ...HSL_RANGES.l },
];

/** FALLBACK_HEX ist gültig, hexToHsl liefert dafür immer einen Wert. */
const toHsl = (hex: unknown): Hsl =>
  hexToHsl(hex) ?? hexToHsl(FALLBACK_HEX) ?? { h: 0, s: 0, l: 0 };

// ── Zustand ────────────────────────────────────────────────────────────────
const rootEl = ref<HTMLElement | null>(null);
const triggerEl = ref<HTMLButtonElement | null>(null);
const panelEl = ref<HTMLElement | null>(null);

const open = ref(false);
const panelStyle = ref<Record<string, string>>({});

const hsl = ref<Hsl>(toHsl(props.modelValue));
const currentHex = computed(() => hslToHex(hsl.value.h, hsl.value.s, hsl.value.l));
const trackGradients = computed(() => hslTrackGradients(hsl.value));

const hexDraft = ref(currentHex.value);
const hexFocused = ref(false);
const hexInvalid = ref(false);

// Externe Änderungen übernehmen. Ergibt der interne HSL-Zustand bereits denselben
// Hex-Wert, bleibt er unangetastet – so gehen Farbton/Sättigung bei Grau nicht
// verloren und der Slider springt beim Live-Update nicht durch Rundung.
watch(
  () => props.modelValue,
  (value) => {
    const normalized = normalizeHex(value) ?? FALLBACK_HEX;
    if (normalized !== currentHex.value) {
      hsl.value = toHsl(normalized);
    }
    if (!hexFocused.value) {
      hexDraft.value = normalized;
      hexInvalid.value = false;
    }
  },
);

// ── Interaktion (start/change für Undo-Gruppierung) ────────────────────────
let interacting = false;
let hexBeforeInteraction: string | null = null;

function beginInteraction() {
  if (interacting) return;
  interacting = true;
  hexBeforeInteraction = currentHex.value;
  emit('start', hexBeforeInteraction);
}

function commitInteraction() {
  if (!interacting) return;
  interacting = false;
  const hex = currentHex.value;
  if (hex !== hexBeforeInteraction) emit('change', hex);
  hexBeforeInteraction = null;
}

function applyHsl(next: Hsl) {
  hsl.value = next;
  const hex = currentHex.value;
  if (!hexFocused.value) {
    hexDraft.value = hex;
    hexInvalid.value = false;
  }
  emit('update:modelValue', hex);
}

function onRangeInput(channel: HslChannel, event: Event) {
  beginInteraction();
  applyHsl(setHslChannel(hsl.value, channel, (event.target as HTMLInputElement).value));
}

function onNumberInput(channel: HslChannel, event: Event) {
  const raw = (event.target as HTMLInputElement).value;
  if (raw === '' || raw === '-') return; // Nutzer tippt noch
  const n = Number(raw);
  if (!Number.isFinite(n)) return;
  beginInteraction();
  applyHsl(setHslChannel(hsl.value, channel, n));
}

function onNumberBlur(channel: HslChannel, event: Event) {
  // Leeres/ungültiges Feld auf den aktuellen Wert zurücksetzen.
  (event.target as HTMLInputElement).value = String(Math.round(hsl.value[channel]));
  commitInteraction();
}

function onHexInput(event: Event) {
  hexDraft.value = (event.target as HTMLInputElement).value;
  const normalized = normalizeHex(hexDraft.value);
  hexInvalid.value = normalized === null;
  if (!normalized) return;
  beginInteraction();
  if (normalized !== currentHex.value) {
    hsl.value = toHsl(normalized);
    emit('update:modelValue', normalized);
  }
}

function onHexBlur() {
  hexFocused.value = false;
  hexDraft.value = currentHex.value;
  hexInvalid.value = false;
  commitInteraction();
}

// ── Öffnen/Schließen & Positionierung ──────────────────────────────────────
const VIEWPORT_MARGIN = 8;
const PANEL_GAP = 6;

function updatePosition() {
  if (!open.value || !rootEl.value || !panelEl.value) return;
  const anchor = rootEl.value.getBoundingClientRect();
  const panel = panelEl.value.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = anchor.bottom + PANEL_GAP;
  if (top + panel.height + VIEWPORT_MARGIN > vh) {
    const above = anchor.top - PANEL_GAP - panel.height;
    top =
      above >= VIEWPORT_MARGIN
        ? above
        : Math.max(VIEWPORT_MARGIN, vh - panel.height - VIEWPORT_MARGIN);
  }

  let left = anchor.left;
  if (left + panel.width + VIEWPORT_MARGIN > vw) left = vw - panel.width - VIEWPORT_MARGIN;
  if (left < VIEWPORT_MARGIN) left = VIEWPORT_MARGIN;

  panelStyle.value = { top: `${Math.round(top)}px`, left: `${Math.round(left)}px` };
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null;
  if (rootEl.value?.contains(target) || panelEl.value?.contains(target)) return;
  close(false);
}

function onDocumentKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close(true);
}

function addGlobalListeners() {
  document.addEventListener('pointerdown', onDocumentPointerDown, true);
  document.addEventListener('keydown', onDocumentKeydown);
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition, true);
}

function removeGlobalListeners() {
  document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  document.removeEventListener('keydown', onDocumentKeydown);
  window.removeEventListener('resize', updatePosition);
  window.removeEventListener('scroll', updatePosition, true);
}

async function openPanel(viaKeyboard = false) {
  if (open.value || props.disabled) return;
  open.value = true;
  hexDraft.value = currentHex.value;
  hexInvalid.value = false;
  emit('open');
  await nextTick();
  updatePosition();
  addGlobalListeners();
  if (viaKeyboard) panelEl.value?.querySelector('input')?.focus();
}

function close(restoreFocus = false) {
  if (!open.value) return;
  // Laufende Interaktion sauber abschließen (z. B. Hex-Feld noch fokussiert).
  hexFocused.value = false;
  commitInteraction();
  open.value = false;
  removeGlobalListeners();
  emit('close');
  if (restoreFocus) triggerEl.value?.focus();
}

function toggle(event?: MouseEvent) {
  if (open.value) close(false);
  else openPanel(event?.detail === 0);
}

onBeforeUnmount(() => {
  removeGlobalListeners();
});

/** Alle Attribute außer class/style gehen an den Button. */
function buttonAttrs(attrs: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(attrs).filter(([key]) => key !== 'class' && key !== 'style'),
  );
}

defineExpose({ open: openPanel, close, isOpen: () => open.value });
</script>

<style scoped>
/* Wurzel: übernimmt die Größen-/Rahmen-Klassen der Elternkomponente. */
.color-field {
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  width: 32px;
  height: 24px;
  vertical-align: middle;
  line-height: 0;
}
.color-field--disabled {
  opacity: 0.45;
  pointer-events: none;
}

.color-field__swatch {
  display: block;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: inherit;
  cursor: pointer;
  background-clip: padding-box;
  transition: box-shadow var(--ds-duration) var(--ds-ease);
}
.color-field__swatch:focus-visible,
.color-field--open .color-field__swatch {
  outline: none;
  box-shadow: var(--ds-focus-ring);
}

.color-field__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

/* Panel (nach <body> teleportiert): Overlay-Rezept wie UiDialog/UiToast */
.color-field__panel {
  position: fixed;
  z-index: var(--ds-z-toast);
  box-sizing: border-box;
  width: 260px;
  padding: var(--ds-space-3);
  display: grid;
  gap: var(--ds-space-2);
  background: var(--ds-surface-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  box-shadow: var(--ds-shadow-overlay);
  color: var(--ds-text);
  font-size: var(--ds-text-xs);
  line-height: var(--ds-leading-tight);
}

.color-field__row {
  display: grid;
  grid-template-columns: 16px 1fr 56px 12px;
  gap: var(--ds-space-2);
  align-items: center;
}
.color-field__row--hex {
  grid-template-columns: 16px 1fr var(--ds-control-sm);
}

.color-field__label {
  color: var(--ds-text-2);
  font-size: var(--ds-text-xs);
  font-weight: var(--ds-weight-semibold);
  text-transform: uppercase;
  cursor: help;
}

/* Die Spur zeigt den Farbverlauf des Kanals (inline gesetzt) */
.color-field__range {
  width: 100%;
  height: 8px;
  margin: 0;
  border-radius: var(--ds-radius-full);
  border: var(--ds-border-width) solid var(--ds-border);
  outline: none;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}
.color-field__range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: var(--ds-radius-full);
  background: var(--ds-surface-1);
  border: 2px solid var(--ds-accent);
  cursor: pointer;
}
.color-field__range::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: var(--ds-radius-full);
  background: var(--ds-surface-1);
  border: 2px solid var(--ds-accent);
  cursor: pointer;
}
.color-field__range:focus-visible {
  box-shadow: var(--ds-focus-ring);
}

.color-field__num,
.color-field__hex {
  box-sizing: border-box;
  width: 100%;
  height: var(--ds-control-sm);
  padding: 0 var(--ds-space-1) 0 var(--ds-space-2);
  background: var(--ds-surface-2);
  border: var(--ds-border-width) solid var(--ds-border-strong);
  border-radius: var(--ds-radius-sm);
  color: var(--ds-text);
  font-family: var(--ds-font-mono);
  font-size: var(--ds-text-xs);
  font-variant-numeric: tabular-nums;
  transition:
    border-color var(--ds-duration) var(--ds-ease),
    box-shadow var(--ds-duration) var(--ds-ease);
}
.color-field__num:focus-visible,
.color-field__hex:focus-visible {
  outline: none;
  border-color: var(--ds-accent);
  box-shadow: var(--ds-focus-ring);
}
.color-field__hex--invalid,
.color-field__hex--invalid:focus-visible {
  border-color: var(--ds-danger);
  color: var(--ds-danger);
}

.color-field__unit {
  color: var(--ds-text-2);
  font-size: var(--ds-text-xs);
}

.color-field__preview {
  display: block;
  width: var(--ds-control-sm);
  height: var(--ds-control-sm);
  border-radius: var(--ds-radius-sm);
  border: var(--ds-border-width) solid var(--ds-border-strong);
}

@media (max-width: 768px) {
  .color-field__panel {
    width: min(300px, calc(100vw - 16px));
  }
  .color-field__range::-webkit-slider-thumb,
  .color-field__range::-moz-range-thumb {
    width: 18px;
    height: 18px;
  }
}
</style>
