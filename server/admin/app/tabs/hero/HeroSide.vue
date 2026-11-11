<template>
  <aside ref="asideEl" class="tc-side" :data-tcside="mode">
    <div :class="['tc-side-head', mode]">{{ dark ? '🌙 Dunkelmodus' : '☀️ Hellmodus' }}</div>
    <div class="hd-line hd-mt">
      <button
        type="button"
        class="hd-reset"
        title="Alle Farben dieses Modus (inkl. Hero-Text-Farben) in den anderen Modus übertragen"
        :data-hdcopyside="mode"
        @click="copyColors"
      >
        {{ dark ? '⬅️ Farben nach Hell kopieren' : '➡️ Farben nach Dunkel kopieren' }}
      </button>
    </div>

    <HdSec>
      <template #title>🅰️ Überschriften-Farbe</template>
      <TcColor
        field="titleTextColor"
        label="Textfarbe (Titel & Untertitel)"
        :value="s.titleTextColor"
        @update="setColor('titleTextColor', $event)"
        @reset="reset(['titleTextColor'])"
      />
      <p class="hint hd-m0">
        Allgemeine Farbe der Überschriften; eine Farbe unter „Hero-Texte“ unten geht je Text vor.
      </p>
    </HdSec>

    <HdSec>
      <template #title>🖼️ Rahmen &amp; Hintergrund</template>
      <TcColor
        field="borderColor"
        label="Rahmenfarbe"
        :value="s.borderColor"
        @update="setColor('borderColor', $event)"
        @reset="reset(['borderColor'])"
      />
      <SliderControl
        :model-value="s.borderWidth"
        label="Rahmenbreite"
        :max="8"
        :default-value="def.borderWidth"
        :value-text="`${s.borderWidth} px`"
        input-class="hd-borderWidth"
        @update:model-value="setNum('borderWidth', $event)"
      />
      <TcColor
        field="bgColor"
        label="Hintergrund"
        :value="s.bgColor"
        @update="setColor('bgColor', $event)"
        @reset="reset(['bgColor'])"
      />
      <SliderControl
        :model-value="s.bgOpacity"
        label="Hintergrund – Transparenz"
        :default-value="def.bgOpacity"
        :value-text="`${s.bgOpacity} %`"
        @update:model-value="setNum('bgOpacity', $event)"
      />
    </HdSec>

    <HdSec>
      <template #title>🏞️ Hintergrundbild</template>
      <div class="hd-line hd-start">
        <div class="bg-thumb" :data-hdimgthumb="mode">
          <img v-if="imgUrl" :src="imgUrl" alt="" />
          <span v-else class="hint hd-m0">Kein Bild</span>
        </div>
        <div class="hd-line">
          <UiButton size="sm" :data-hdimgpick="mode" @click="pickImage">📂 Mediathek</UiButton>
          <UiButton
            size="sm"
            variant="danger"
            :disabled="!s.bgImage"
            :data-hdimgclear="mode"
            @click="clearImage"
            >Entfernen</UiButton
          >
          <button
            type="button"
            class="hd-reset"
            title="Bild, Bearbeitung und Diashow auf Standard zurücksetzen"
            aria-label="Bild auf Standard zurücksetzen"
            data-hdimgreset
            @click="reset(imageKeys(service.imgFields))"
          >
            ↺
          </button>
        </div>
      </div>
      <label class="hd-flabel" :for="urlId"
        >Bild-URL <span class="hint hd-m0">(/uploads/… oder https://…)</span></label
      >
      <input
        :id="urlId"
        type="text"
        :value="staged ? '' : s.bgImage"
        :placeholder="
          staged ? 'Lokales Medium (wird beim Veröffentlichen hochgeladen)' : '/uploads/…'
        "
        :disabled="staged"
        :data-hdimgurl="mode"
        @change="setImageUrl($event)"
      />
      <div :class="['hd-col', { 'hd-dim': !s.bgImage }]" :data-hdimgrow="mode">
        <SliderControl
          v-for="(c, f) in service.imgFields"
          :key="f"
          :model-value="s[f]"
          :label="c.label"
          :min="c.min"
          :max="c.max"
          :default-value="c.def"
          :value-text="`${s[f]} ${c.unit}`"
          :input-class="`hd-${f}`"
          @update:model-value="setNum(f, $event)"
        />
      </div>
      <div class="hd-line">
        <button
          type="button"
          class="hd-reset"
          :disabled="!s.bgImage"
          :title="`Hintergrundbild, Bildbearbeitung und Diashow dieses Modus in den ${dark ? 'Hell' : 'Dunkel'}modus übernehmen`"
          :data-hdimgcopy="mode"
          @click="copyImageToOther"
        >
          {{
            dark ? '⬅️ Bild & Diashow nach Hell kopieren' : '➡️ Bild & Diashow nach Dunkel kopieren'
          }}
        </button>
      </div>
      <p class="hint hd-m0">
        Liegt hinter Titel, Buttons und Banner und wird auf den Hero-Kasten zugeschnitten (mittig).
        Wirkt auch ohne „Eigenes Hero-Design“. Empfehlung:
        <strong>1800 × 1000 px</strong> (Querformat, wichtiges Motiv in der Mitte – auf dem Handy
        wird links/rechts beschnitten), WebP Qualität 75–80 unter 250 KB, ruhiges Motiv ohne Text;
        Abdunkelung 30–50 % oder Weichzeichner 3–6 px für lesbaren Text.<strong v-if="staged">
          ● lokal – wird beim Veröffentlichen hochgeladen.</strong
        >
      </p>
      <HeroSlides v-if="s.bgImage" :mode="mode" @ask-clear="emit('askClearSlides', mode)" />
      <p v-else class="hint hd-m0">
        🎞️ Diashow: zuerst ein Hintergrundbild wählen, dann lassen sich weitere Bilder anhängen.
      </p>
    </HdSec>

    <HdSec sec="chips" :hl="hlSec === 'chips'">
      <template #title>🔘 Buttons (Feature-Chips)</template>
      <TcColor
        field="chipBgColor"
        label="Hintergrund"
        :value="s.chipBgColor"
        @update="setColor('chipBgColor', $event)"
        @reset="reset(['chipBgColor'])"
      />
      <SliderControl
        :model-value="s.chipBgOpacity"
        label="Hintergrund – Transparenz"
        :default-value="def.chipBgOpacity"
        :value-text="`${s.chipBgOpacity} %`"
        @update:model-value="setNum('chipBgOpacity', $event)"
      />
      <TcColor
        field="chipTextColor"
        label="Textfarbe"
        :value="s.chipTextColor"
        @update="setColor('chipTextColor', $event)"
        @reset="reset(['chipTextColor'])"
      />
      <TcColor
        field="chipBorderColor"
        label="Rahmenfarbe"
        :value="s.chipBorderColor"
        @update="setColor('chipBorderColor', $event)"
        @reset="reset(['chipBorderColor'])"
      />
      <SliderControl
        :model-value="s.chipBorderOpacity"
        label="Rahmenfarbe – Transparenz"
        :default-value="def.chipBorderOpacity"
        :value-text="`${s.chipBorderOpacity} %`"
        @update:model-value="setNum('chipBorderOpacity', $event)"
      />
      <p class="hint hd-m0">Hover (beim Überfahren):</p>
      <TcColor
        field="chipHoverBgColor"
        label="Hover-Hintergrund"
        :value="s.chipHoverBgColor"
        @update="setColor('chipHoverBgColor', $event)"
        @reset="reset(['chipHoverBgColor'])"
      />
      <TcColor
        field="chipHoverTextColor"
        label="Hover-Textfarbe"
        :value="s.chipHoverTextColor"
        @update="setColor('chipHoverTextColor', $event)"
        @reset="reset(['chipHoverTextColor'])"
      />
    </HdSec>

    <HdSec sec="cta" :hl="hlSec === 'cta'">
      <template #title>🚀 CTA-Button („Jetzt starten“)</template>
      <TcColor
        field="ctaBgColor"
        label="Hintergrund"
        :value="s.ctaBgColor"
        @update="setColor('ctaBgColor', $event)"
        @reset="reset(['ctaBgColor'])"
      />
      <SliderControl
        :model-value="s.ctaBgOpacity"
        label="Hintergrund – Transparenz"
        :default-value="def.ctaBgOpacity"
        :value-text="`${s.ctaBgOpacity} %`"
        @update:model-value="setNum('ctaBgOpacity', $event)"
      />
      <TcColor
        field="ctaTextColor"
        label="Textfarbe"
        :value="s.ctaTextColor"
        @update="setColor('ctaTextColor', $event)"
        @reset="reset(['ctaTextColor'])"
      />
      <TcColor
        field="ctaBorderColor"
        label="Rahmenfarbe"
        :value="s.ctaBorderColor"
        @update="setColor('ctaBorderColor', $event)"
        @reset="reset(['ctaBorderColor'])"
      />
      <SliderControl
        :model-value="s.ctaBorderOpacity"
        label="Rahmenfarbe – Transparenz"
        :default-value="def.ctaBorderOpacity"
        :value-text="`${s.ctaBorderOpacity} %`"
        @update:model-value="setNum('ctaBorderOpacity', $event)"
      />
      <p class="hint hd-m0">Rahmen-Transparenz 0 % = kein Rahmen.</p>
      <p class="hint hd-m0">Hover (beim Überfahren):</p>
      <TcColor
        field="ctaHoverBgColor"
        label="Hover-Hintergrund"
        :value="s.ctaHoverBgColor"
        @update="setColor('ctaHoverBgColor', $event)"
        @reset="reset(['ctaHoverBgColor'])"
      />
      <TcColor
        field="ctaHoverTextColor"
        label="Hover-Textfarbe"
        :value="s.ctaHoverTextColor"
        @update="setColor('ctaHoverTextColor', $event)"
        @reset="reset(['ctaHoverTextColor'])"
      />
    </HdSec>

    <HdSec sec="texts" :hl="hlSec === 'texts'">
      <template #title>✍️ Hero-Texte – Farbe je Text</template>
      <p class="hint hd-m0">Leer (↺) = allgemeine Überschriften- bzw. CTA-Textfarbe.</p>
      <div
        v-for="sl in service.textSlots"
        :key="sl.key"
        :class="['hd-txtside', { 'hd-sel': hlTxt === sl.key }]"
        :data-hdtxtside="sl.key"
      >
        <span class="hd-flabel">{{ sl.label }}</span>
        <div class="hd-prevbox" :style="{ background: PREVIEW_BG[mode] }">
          <div
            :class="slotAnimClass(style(sl.key))"
            :style="slotCss(sl.key)"
            :data-txtprev="sl.key"
            :data-mode="mode"
          >
            {{ slotText(sl.key) }}
          </div>
        </div>
        <TcColor
          :field="`txt:${sl.key}`"
          :label="`Textfarbe (${MODE_NAME[mode]})`"
          :value="style(sl.key)[colorField(mode)] || '#ffffff'"
          @update="editStyle(sl.key)[colorField(mode)] = $event"
          @reset="resetSlotColor(sl.key)"
        />
      </div>
    </HdSec>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, useId, watch } from 'vue';
import type { ThemeMode } from '../../../types';
import { normSiteMediaUrl } from '../../../public/model-core';
import { SliderControl, UiButton } from '../../components/ui';
import { colorField, slotAnimClass, slotPreviewStyle } from '../texts/textStyle';
import TcColor from '../toolcards/TcColor.vue';
import HdSec from './HdSec.vue';
import HeroSlides from './HeroSlides.vue';
import {
  MODE_NAME,
  PREVIEW_BG,
  clampSideNum,
  copyImage,
  copySideColors,
  imageKeys,
  type HeroColorField,
  type HeroNumField,
  type HeroSide,
  type HeroSlotKey,
} from './heroData';
import { hdUi } from './heroUi';
import { useHero } from './useHero';

/**
 * Seitenleiste eines Modus im Tab „Hero-Design“ (wie `sidePanel` in
 * `public/design.ts`): alle Farben des Modus – Überschriften, Rahmen und
 * Hintergrund, Hintergrundbild samt Diashow, Chips, CTA und die Textfarbe je
 * Hero-Text mit Vorschau.
 */
const props = defineProps<{ mode: ThemeMode }>();
const emit = defineEmits<{ askClearSlides: [mode: ThemeMode] }>();
const { service, view, side, style, editStyle, slotText, toast } = useHero();
const dark = computed(() => props.mode === 'dark');
const urlId = `hd-url-${useId()}`;

const s = computed<HeroSide>(() => side(props.mode));
const def = computed<HeroSide>(() => service.sideDefault(props.mode));
const staged = computed(() => s.value.bgImage.startsWith('staged:'));
const imgUrl = computed(() => service.resolveUrl(s.value.bgImage));

function setColor(field: HeroColorField, v: string) {
  (s.value as unknown as Record<string, unknown>)[field] = v;
}
function setNum(field: HeroNumField, v: unknown) {
  s.value[field] = clampSideNum(field, v, service.imgFields);
}
/** Felder auf den Werkswert des Modus zurücksetzen (Farbe + Transparenz gemeinsam). */
function reset(fields: readonly (keyof HeroSide)[]) {
  const d = service.sideDefault(props.mode);
  const t = s.value as unknown as Record<string, unknown>;
  for (const f of fields) if (f in d) t[f] = d[f];
  toast('Auf Standard zurückgesetzt');
}

// ---- Hintergrundbild -----------------------------------------------------------------
function setImageUrl(e: Event) {
  const input = e.target as HTMLInputElement;
  const v = normSiteMediaUrl(input.value);
  s.value.bgImage = v;
  if (input.value.trim() && !v)
    toast('Ungültige Bild-URL – erlaubt sind /pfad oder https://…', { type: 'warning' });
  input.value = staged.value ? '' : s.value.bgImage;
}
function pickImage() {
  const ok = service.pick(
    'heroimg',
    `Hintergrundbild des Hero (${MODE_NAME[props.mode]}) wählen`,
    (url) => {
      side(props.mode).bgImage = url;
      toast('Hintergrundbild zugewiesen');
    },
  );
  if (!ok)
    toast('Keine Medien vorhanden — zuerst im Tab „Dateien“ eine Datei hinzufügen.', {
      type: 'info',
    });
}
function clearImage() {
  s.value.bgImage = '';
  toast('Hintergrundbild entfernt');
}
function copyImageToOther() {
  const to = copyImage(view.value.hd, props.mode, service.imgFields, service.slideshowDefault);
  hdUi.prevMode = to;
  toast(`Hintergrundbild & Diashow nach ${MODE_NAME[to]} kopiert`);
}
function copyColors() {
  const to = copySideColors(
    view.value.hd,
    view.value.media,
    props.mode,
    imageKeys(service.imgFields),
    service.textSlots,
  );
  toast(`Farben nach ${MODE_NAME[to]} kopiert`);
}

// ---- Hero-Texte ------------------------------------------------------------------------
function slotCss(key: HeroSlotKey) {
  const st = style(key);
  return slotPreviewStyle(st, props.mode, st.font ? service.ensureFontFace(st.font) : '');
}
function resetSlotColor(key: HeroSlotKey) {
  editStyle(key)[colorField(props.mode)] = '';
  toast('Auf Standard zurückgesetzt');
}

// ---- Auswahl aus der Vorschau: Sektion aufklappen, hervorheben, hinscrollen -----------
const SECTION_OF = { chip: 'chips', cta: 'cta', title: 'texts', subtitle: 'texts' } as const;
const TXT_OF = { cta: 'hero.cta', title: 'hero.title', subtitle: 'hero.subtitle' } as const;
const hlSec = computed(() => (hdUi.selected ? SECTION_OF[hdUi.selected.kind] : ''));
const hlTxt = computed(() => {
  const k = hdUi.selected?.kind;
  return k && k !== 'chip' ? TXT_OF[k] : '';
});
const asideEl = ref<HTMLElement | null>(null);
watch(
  () => hdUi.selSeq,
  async () => {
    await nextTick();
    const aside = asideEl.value;
    if (!aside || !hlSec.value) return;
    const det = aside.querySelector<HTMLDetailsElement>(`[data-hdsection="${hlSec.value}"]`);
    if (!det) return;
    det.open = true;
    const target =
      (hlTxt.value && det.querySelector<HTMLElement>(`[data-hdtxtside="${hlTxt.value}"]`)) || det;
    const top =
      target.getBoundingClientRect().top - aside.getBoundingClientRect().top + aside.scrollTop;
    aside.scrollTo?.({ top: Math.max(0, top - 8), behavior: 'smooth' });
  },
);
</script>

<style scoped>
.hd-m0 {
  margin: 0;
}
.hd-mt {
  margin-top: var(--ds-space-2);
}
.hd-line {
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
}
.hd-start {
  align-items: flex-start;
}
.hd-col {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
.hd-dim {
  opacity: 0.45;
}
.hd-flabel {
  display: block;
  font-size: 0.8rem;
  color: var(--ds-text-2);
}
.hd-txtside {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  margin-top: var(--ds-space-2);
  padding: var(--ds-space-2) var(--ds-space-1) 0;
  border-top: 1px dashed var(--border);
  border-radius: 6px;
}
.hd-sel {
  outline: 2px solid var(--accent);
}
.hd-prevbox {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: var(--ds-space-2) var(--ds-space-3);
  overflow: hidden;
}
</style>
