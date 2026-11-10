<template>
  <div class="panel ic-tab" data-vue-tab="icons">
    <h2>Icons <span class="lang-badge">Font Awesome</span></h2>
    <p class="hint">
      Icons aus dem Serverordner <code>/fontawesome</code>: Font Awesome (Solid, Regular, Brands)
      sowie eigene SVGs aus <code>/fontawesome/admin-svgs</code> (Set „Eigene“). Icon anklicken für
      die Vorschau, dann als Banner, Raster-Kachel oder Tool-Icon setzen bzw. die URL kopieren.
    </p>

    <!-- Suche + Set -->
    <div class="ic-row">
      <UiTextField
        :model-value="qInput"
        class="ic-search"
        type="search"
        label="Suche"
        placeholder="z. B. star, arrow, github"
        data-ic-search
        @update:model-value="onSearch"
      />
      <UiSelect v-model="cat" label="Set" :options="CAT_OPTIONS" data-ic-cat />
      <span class="hint ic-m0" data-ic-count>{{ countText }}</span>
    </div>

    <!-- Bibliothek -->
    <div class="ic-grid" data-ic-grid>
      <p v-if="loading" class="hint">Icons werden geladen …</p>
      <p v-else-if="!total" class="hint">
        Keine Icons gefunden. Erwartet werden SVG-Dateien im Serverordner
        <code>/fontawesome/svgs/{solid,regular,brands}</code>.
      </p>
      <p v-else-if="!items.length" class="hint">Keine Treffer.</p>
      <template v-else>
        <button
          v-for="it in items"
          :key="`${it.cat}/${it.name}`"
          type="button"
          :class="['ic-tile', { 'ic-tile--sel': isSel(it) }]"
          :title="`${iconLabel(it.name)} (${CAT_LABEL[it.cat]})`"
          :aria-pressed="isSel(it)"
          :data-ic-icon="`${it.cat}/${it.name}`"
          @click="select(it)"
        >
          <img :src="iconUrl(it.cat, it.name)" alt="" loading="lazy" width="26" height="26" />
          <span>{{ iconLabel(it.name) }}</span>
        </button>
      </template>
    </div>

    <!-- Vorschau & Hinzufügen -->
    <section ref="detailEl" class="ic-section" data-ic-detail>
      <h3 class="ic-h3">Vorschau &amp; Hinzufügen</h3>
      <p v-if="!sel" class="hint ic-m0">
        Kein Icon gewählt — oben in der Bibliothek ein Icon anklicken.
      </p>
      <div v-else class="ic-detail">
        <div class="ic-detail__big">
          <img :src="selUrl" :alt="iconLabel(sel.name)" />
        </div>
        <div class="ic-detail__body">
          <strong
            >{{ iconLabel(sel.name) }}
            <span class="hint ic-normal">({{ CAT_LABEL[sel.cat] }})</span></strong
          >
          <UiTextField
            ref="urlField"
            :model-value="selUrl"
            label="URL"
            label-hidden
            readonly
            data-ic-url
          />
          <UiTextField
            v-model="link"
            label="Link (optional) — für Banner/Kachel"
            placeholder="/pfad oder https://… (leer = kein Link)"
            :error="
              linkOk
                ? undefined
                : 'Ungültiger Link: bitte / (interner Pfad) oder https://… verwenden'
            "
            data-ic-link
          />
          <div class="ic-row">
            <UiSelect v-model="targetLang" label="Sprache" :options="LANG_OPTIONS" data-ic-lang />
            <UiSelect
              v-model="target"
              class="ic-target"
              label="Ziel"
              :options="targetOptions"
              data-ic-target
            />
            <UiButton variant="primary" data-ic-add @click="addIcon">➕ Hinzufügen</UiButton>
            <UiButton data-ic-copy @click="copyUrl">🔗 URL kopieren</UiButton>
          </div>
          <p class="hint ic-m0">
            Banner/Kachel stellen den Hero-Modus passend um und weisen das Icon als Bild zu.
            „Tool-Karten-Icon“ ersetzt das Icon der gewählten Tool-Karte. Wirkt nach dem
            Speichern/Veröffentlichen.
          </p>
          <div v-if="targetTool" data-ic-toolprev>
            <span class="hint ic-block">Vorschau Tool-Karte (vor dem Veröffentlichen):</span>
            <div class="ic-cardprev">
              <span class="ic-cardprev__icon"><img :src="selUrl" alt="" /></span>
              <strong>{{ targetTool.title }}</strong>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Tool-Karten-Icons verwalten -->
    <section class="ic-section" data-ic-tools>
      <h3 class="ic-h3">
        Tool-Karten-Icons verwalten <span class="lang-badge">{{ lang.toUpperCase() }}</span>
      </h3>
      <p class="hint ic-m0">
        Icon einer Karte <strong>entfernen</strong> (kein Icon), auf
        <strong>Standard</strong> zurücksetzen oder das oben in der Bibliothek gewählte Icon
        <strong>zuweisen</strong>. Gilt für die Sprache des aktuellen Bereichs.
      </p>
      <div class="ic-row ic-row--center">
        <UiSegmentedControl
          v-model="tintMode"
          label="👁 Icon-Farben & Vorschau für:"
          size="sm"
          :options="MODE_OPTIONS"
          data-ic-tintmode
        />
        <span class="hint ic-m0"
          >– die Vorschau in der Liste zeigt diesen Modus; der andere ist je Karte zugeklappt.</span
        >
      </div>

      <ul class="ic-tools">
        <li v-for="t in tools" :key="cardId(t)" class="ic-toolrow" :data-ic-tool="cardId(t)">
          <div class="ic-toolrow__main">
            <span
              v-if="svgOf(t)"
              class="ic-tprev ic-tprev--sm"
              :style="tintBoxStyle(t, tintMode)"
              :data-ic-tintprev="`${cardId(t)}:${tintMode}`"
            >
              <span
                v-if="tintOf(t)[tintMode === 'dark' ? 'dark' : 'light']"
                class="ic-tprev__mask"
                :style="maskStyle(t, tintMode)"
              ></span>
              <img v-else :src="svgOf(t)" alt="" />
            </span>
            <span v-else class="ic-tprev ic-tprev--sm ic-tprev--none" aria-hidden="true">—</span>
            <span class="ic-toolrow__title">
              <strong>{{ t.title }}</strong>
              <span class="hint ic-m0">{{ SECTION_LABEL[t.section] || t.section }}</span>
            </span>
            <span class="ic-toolrow__btns">
              <button
                type="button"
                class="hd-reset"
                title="Oben gewähltes Icon dieser Karte zuweisen"
                data-ic-tooladd
                @click="toolAssign(t)"
              >
                ➕ Zuweisen
              </button>
              <button
                type="button"
                class="hd-reset"
                title="Icon dieser Karte entfernen (kein Icon)"
                :disabled="!svgOf(t)"
                data-ic-toolremove
                @click="toolRemove(t)"
              >
                ✕ Entfernen
              </button>
              <button
                type="button"
                class="hd-reset"
                title="Auf Standard-Icon zurücksetzen"
                data-ic-toolreset
                @click="toolReset(t)"
              >
                ↺ Standard
              </button>
              <button
                type="button"
                :class="['hd-reset', { active: isOpen(t) }]"
                title="Icon-Farbe und Kasten-Hintergrund (Hell/Dunkel)"
                :aria-expanded="isOpen(t)"
                data-ic-tinttoggle
                @click="toggleOpen(t)"
              >
                🎨 Farben{{ tintActive(tintOf(t)) ? ' ●' : '' }}
              </button>
            </span>
          </div>

          <!-- Farbbereich der Karte -->
          <div v-if="isOpen(t)" class="ic-tintbox" :data-ic-tintbox="cardId(t)">
            <div class="ic-row">
              <div class="ic-field">
                <span>Vorschau {{ MODE_LABEL[tintMode] }}</span>
                <span class="ic-tprev" :style="tintBoxStyle(t, tintMode)">
                  <span
                    v-if="svgOf(t) && tintOf(t)[tintMode === 'dark' ? 'dark' : 'light']"
                    class="ic-tprev__mask"
                    :style="maskStyle(t, tintMode)"
                  ></span>
                  <img v-else-if="svgOf(t)" :src="svgOf(t)" alt="" />
                </span>
              </div>
              <div v-for="f in TINT_MODE_FIELDS[tintMode]" :key="f" class="ic-field">
                <label class="ic-check">
                  <input
                    type="checkbox"
                    :checked="tintOf(t)[f] !== ''"
                    :data-ic-tinton="f"
                    @change="toggleTint(t, f, ($event.target as HTMLInputElement).checked)"
                  />
                  {{ TINT_LABEL[f] }}
                </label>
                <ColorField
                  :model-value="tintOf(t)[f] || draftTint(t, f)"
                  :disabled="tintOf(t)[f] === ''"
                  :label="`${t.title}: ${TINT_LABEL[f]}`"
                  :data-ic-tint="f"
                  @update:model-value="setTintField(t, f, $event)"
                />
              </div>
              <div class="ic-field ic-field--end">
                <button
                  type="button"
                  class="hd-reset"
                  title="Alle Farben dieser Karte (Hell + Dunkel) zurücksetzen"
                  data-ic-tintreset
                  @click="resetTint(t)"
                >
                  ↺ Alle
                </button>
              </div>
            </div>
            <div
              class="panel tc-mode-collapsed ic-collapsed"
              role="button"
              tabindex="0"
              :data-ic-tintshowmode="otherMode"
              :title="`${MODE_LABEL[otherMode]}-Modus anzeigen und bearbeiten`"
              @click="tintMode = otherMode"
              @keydown.enter.prevent="tintMode = otherMode"
              @keydown.space.prevent="tintMode = otherMode"
            >
              <span aria-hidden="true">{{ otherMode === 'dark' ? '🌙' : '☀️' }}</span>
              <span
                >{{ otherMode === 'dark' ? 'Dunkelmodus' : 'Hellmodus' }} – anklicken zum
                Bearbeiten</span
              >
            </div>
            <p class="hint ic-m0">
              Icon-Farbe färbt das SVG <strong>einfarbig</strong> ein (CSS-Maske, geeignet für
              einfarbige Icons wie Font Awesome; mehrfarbige Illustrationen werden zur Silhouette).
              Ohne Häkchen bleiben Originalfarben bzw. der Standard-Kasten.
            </p>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, useTemplateRef } from 'vue';
import type { ByLang, Lang, Overrides, ThemeMode } from '../../../types';
import { delPath, setPath } from '../../../public/model-core.js';
import {
  ColorField,
  UiButton,
  UiSegmentedControl,
  UiSelect,
  UiTextField,
} from '../../components/ui';
import { useToastStore } from '../../stores/toast';
import {
  CAT_LABEL,
  HERO_CELLS,
  ICON_CATS,
  SECTION_LABEL,
  TINT_LABEL,
  TINT_MODE_FIELDS,
  TINT_SUGGEST,
  applyIconTarget,
  filterIcons,
  getTint,
  iconLabel,
  iconTotal,
  iconUrl,
  setTint,
  tintActive,
  toolSvg,
  validLink,
  type HeroMediaHost,
  type IconCat,
  type IconRef,
  type IconTint,
  type TintField,
  type TintHost,
  type ToolRef,
} from './iconsData';
import { ensureIconsLoaded, iconLists, iconsLoading, iconsUi } from './iconsUi';

/**
 * Tab „Icons“ (Vue-Fassung von `public/icons.js`). Bearbeitet die übergebenen
 * Objekte `state.overrides` und `state.media` direkt (Autosave/Undo per
 * Snapshot); nach Undo/Redo wird der Tab neu gemountet.
 */
const props = defineProps<{
  /** Sprache des aktuellen Bereichs (Icon-Verwaltung, Vorauswahl „Sprache“). */
  lang: Lang;
  /** `state.overrides` (beide Sprachen; „Hinzufügen“ kann die andere Sprache treffen). */
  overrides: ByLang<Overrides>;
  /** `state.defaults` */
  defaults: ByLang<Overrides>;
  /** `state.media` (nur `de`/`en` werden genutzt). */
  media: ByLang<HeroMediaHost & TintHost>;
  /** Alle Tool-Karten (Sprachdateien + im Admin angelegte), Titel aus DE. */
  tools: ToolRef[];
}>();

const overrides = reactive(props.overrides);
const media = reactive(props.media);
const toasts = useToastStore();

const MODE_LABEL: Record<ThemeMode, string> = { light: '☀️ Hell', dark: '🌙 Dunkel' };
const MODE_OPTIONS = [
  { value: 'light', label: MODE_LABEL.light },
  { value: 'dark', label: MODE_LABEL.dark },
];
const CAT_OPTIONS = [
  { value: '', label: 'Alle Sets' },
  ...ICON_CATS.map((c) => ({ value: c, label: CAT_LABEL[c] })),
];
const LANG_OPTIONS = [
  { value: 'de', label: 'Deutsch' },
  { value: 'en', label: 'Englisch' },
];

// ---- Bibliothek -------------------------------------------------------------
const loading = computed(() => iconsLoading.value);
const total = computed(() => iconTotal(iconLists.value));
const cat = computed<string>({
  get: () => iconsUi.cat,
  set: (v) => (iconsUi.cat = (ICON_CATS as readonly string[]).includes(v) ? (v as IconCat) : ''),
});
// Suche verzögert anwenden (entlastet das Tippen bei vielen Icons).
const qInput = ref(iconsUi.q);
let searchTimer: ReturnType<typeof setTimeout> | undefined;
function onSearch(v: string) {
  qInput.value = v;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => (iconsUi.q = v), 120);
}
const items = computed(() => filterIcons(iconLists.value, iconsUi.q, iconsUi.cat));
const countText = computed(() =>
  !loading.value && total.value ? `${items.value.length} Treffer` : '',
);

const sel = computed(() => iconsUi.sel);
const selUrl = computed(() => (sel.value ? iconUrl(sel.value.cat, sel.value.name) : ''));
const isSel = (it: IconRef) =>
  !!sel.value && sel.value.cat === it.cat && sel.value.name === it.name;
const detailEl = useTemplateRef<HTMLElement>('detailEl');
function select(it: IconRef) {
  iconsUi.sel = { cat: it.cat, name: it.name };
  detailEl.value?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
}

onMounted(() => void ensureIconsLoaded());
onBeforeUnmount(() => {
  // Ausstehende Suche sofort übernehmen, damit sie das Neu-Mounten übersteht.
  if (searchTimer) {
    clearTimeout(searchTimer);
    iconsUi.q = qInput.value;
  }
});

// ---- Hinzufügen -------------------------------------------------------------
const link = computed({ get: () => iconsUi.link, set: (v: string) => (iconsUi.link = v) });
const linkOk = computed(() => validLink(iconsUi.link.trim()));
const targetLang = ref<Lang>(props.lang);
const target = computed({ get: () => iconsUi.target, set: (v: string) => (iconsUi.target = v) });

const cardId = (t: ToolRef) => `${t.section}.${t.key}`;
const targetOptions = computed(() => [
  { label: 'Banner', options: [{ value: 'banner', label: 'Einzel-Banner' }] },
  {
    label: 'Raster-Kacheln',
    options: Array.from({ length: HERO_CELLS }, (_, i) => ({
      value: `grid${i}`,
      label: `Kachel ${i + 1}`,
    })),
  },
  ...(props.tools.length
    ? [
        {
          label: 'Tool-Karten-Icon',
          options: props.tools.map((t) => ({
            value: `tool:${t.section}:${t.key}`,
            label: `${SECTION_LABEL[t.section] || t.section} – ${t.title}`,
          })),
        },
      ]
    : []),
]);
const targetTool = computed(() => {
  if (!sel.value || !iconsUi.target.startsWith('tool:')) return null;
  const parts = iconsUi.target.split(':');
  const key = parts.slice(2).join(':');
  return (
    props.tools.find((t) => t.section === parts[1] && t.key === key) ?? {
      section: parts[1] as ToolRef['section'],
      key,
      title: key,
    }
  );
});

function addIcon() {
  if (!sel.value) return;
  const l = iconsUi.link.trim();
  if (!validLink(l)) {
    toasts.addToast('Ungültiger Link: bitte / (interner Pfad) oder https://… verwenden', {
      type: 'warning',
    });
    return;
  }
  const lang: Lang = targetLang.value === 'en' ? 'en' : 'de';
  const msg = applyIconTarget(
    media[lang],
    overrides[lang],
    lang,
    iconsUi.target,
    selUrl.value,
    l,
    setPath,
  );
  if (msg) toasts.addToast(msg, { type: 'success' });
}

const urlField = useTemplateRef<{ $el: HTMLElement }>('urlField');
function selectUrlInput() {
  const inp = urlField.value?.$el?.querySelector?.('input');
  if (inp) {
    inp.focus();
    inp.select();
  }
}
async function copyUrl() {
  if (!selUrl.value) return;
  try {
    await navigator.clipboard.writeText(selUrl.value);
    toasts.addToast('URL kopiert', { type: 'success' });
  } catch {
    // Kein Zugriff auf die Zwischenablage: Feld markieren zum manuellen Kopieren.
    selectUrlInput();
    toasts.addToast('URL markiert – mit Strg/Cmd+C kopieren');
  }
}

// ---- Tool-Karten-Icons verwalten -------------------------------------------
const svgOf = (t: ToolRef) => toolSvg(overrides[props.lang], props.defaults[props.lang], t);
function toolAssign(t: ToolRef) {
  if (!sel.value) {
    toasts.addToast('Zuerst oben in der Bibliothek ein Icon auswählen', { type: 'warning' });
    return;
  }
  setPath(overrides[props.lang], [t.section, t.key, 'svg'], selUrl.value);
  toasts.addToast(`Icon der Karte „${t.key}“ (${props.lang.toUpperCase()}) zugewiesen`, {
    type: 'success',
  });
}
function toolRemove(t: ToolRef) {
  setPath(overrides[props.lang], [t.section, t.key, 'svg'], '');
  toasts.addToast(`Icon der Karte „${t.key}“ (${props.lang.toUpperCase()}) entfernt`);
}
function toolReset(t: ToolRef) {
  delPath(overrides[props.lang], [t.section, t.key, 'svg']);
  toasts.addToast(`Karte „${t.key}“ (${props.lang.toUpperCase()}) auf Standard-Icon zurückgesetzt`);
}

// ---- Icon-Färbung -------------------------------------------------------------
const tintMode = computed<ThemeMode>({
  get: () => iconsUi.tintMode,
  set: (m) => (iconsUi.tintMode = m === 'dark' ? 'dark' : 'light'),
});
const otherMode = computed<ThemeMode>(() => (tintMode.value === 'light' ? 'dark' : 'light'));
const isOpen = (t: ToolRef) => !!iconsUi.openTint[cardId(t)];
function toggleOpen(t: ToolRef) {
  iconsUi.openTint[cardId(t)] = !isOpen(t);
}
const tintOf = (t: ToolRef): IconTint => getTint(media[props.lang], cardId(t));
// Zuletzt gewählte Farbe eines ausgeschalteten Feldes (wie der Wert des
// gesperrten Farbwählers in der Vanilla-Fassung) – sonst der Vorschlag.
const tintDrafts = reactive<Record<string, string>>({});
const draftTint = (t: ToolRef, f: TintField) => tintDrafts[`${cardId(t)}:${f}`] || TINT_SUGGEST[f];
function setTintField(t: ToolRef, f: TintField, hex: string) {
  tintDrafts[`${cardId(t)}:${f}`] = hex;
  setTint(media[props.lang], cardId(t), { [f]: hex });
}
function toggleTint(t: ToolRef, f: TintField, on: boolean) {
  setTint(media[props.lang], cardId(t), { [f]: on ? draftTint(t, f) : '' });
}
function resetTint(t: ToolRef) {
  setTint(media[props.lang], cardId(t), { light: '', dark: '', bg: '', bgDark: '' });
  toasts.addToast('Icon-Farben zurückgesetzt', { type: 'success' });
}
function tintBoxStyle(t: ToolRef, mode: ThemeMode) {
  const tint = tintOf(t);
  const bg =
    (mode === 'dark' ? tint.bgDark : tint.bg) || TINT_SUGGEST[mode === 'dark' ? 'bgDark' : 'bg'];
  return { background: bg };
}
function maskStyle(t: ToolRef, mode: ThemeMode) {
  const tint = tintOf(t);
  const svg = svgOf(t).replace(/['"()\\]/g, '');
  const m = `url('${svg}') center / contain no-repeat`;
  return { background: mode === 'dark' ? tint.dark : tint.light, WebkitMask: m, mask: m };
}
</script>

<style scoped>
.ic-m0 {
  margin: 0;
}
.ic-block {
  display: block;
  margin: var(--ds-space-1) 0;
}
.ic-normal {
  font-weight: 400;
}
.ic-h3 {
  margin: 0 0 var(--ds-space-2);
  font-size: var(--ds-text-md);
}
.ic-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--ds-space-3);
  margin: var(--ds-space-2) 0;
}
.ic-row--center {
  align-items: center;
}
.ic-search {
  flex: 2 1 240px;
}
.ic-target {
  flex: 1 1 220px;
  min-width: 0;
}
.ic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
  gap: var(--ds-space-2);
  margin-top: var(--ds-space-3);
  max-height: 52vh;
  overflow-y: auto;
  padding: var(--ds-space-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
}
.ic-grid > .hint {
  grid-column: 1 / -1;
}
/* Kacheln auf Weiß: Font-Awesome-SVGs sind schwarz (Inhalt, nicht Oberfläche) */
.ic-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ds-space-1);
  padding: var(--ds-space-2) var(--ds-space-1);
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  background: #fff; /* ds-content */
  cursor: pointer;
  min-width: 0;
}
.ic-tile img {
  width: 26px;
  height: 26px;
  object-fit: contain;
}
.ic-tile span {
  font-size: 0.62rem;
  color: #333; /* ds-content */
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ic-tile--sel {
  border-color: var(--ds-accent);
  outline: 2px solid var(--ds-accent);
  outline-offset: -1px;
}
.ic-section {
  border-top: var(--ds-border-width) solid var(--ds-border);
  margin-top: var(--ds-space-4);
  padding-top: var(--ds-space-3);
}
.ic-detail {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-4);
  align-items: flex-start;
}
.ic-detail__big {
  flex: 0 0 auto;
  width: 96px;
  height: 96px;
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-md);
  background: #fff; /* ds-content */
  display: flex;
  align-items: center;
  justify-content: center;
}
.ic-detail__big img {
  width: 64px;
  height: 64px;
  object-fit: contain;
}
.ic-detail__body {
  flex: 1 1 260px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
}
.ic-cardprev {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-3);
  background: var(--ds-surface-2, var(--ds-surface));
  border: var(--ds-border-width) solid var(--ds-border);
  border-radius: var(--ds-radius-lg, 12px);
  padding: var(--ds-space-3) var(--ds-space-4);
  max-width: 340px;
}
.ic-cardprev__icon {
  width: 44px;
  height: 44px;
  border-radius: 0.6rem;
  background: #fff; /* ds-content */
  padding: 5px;
  box-sizing: border-box;
  display: flex;
  flex-shrink: 0;
}
.ic-cardprev__icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.ic-tools {
  list-style: none;
  margin: 0;
  padding: 0;
}
.ic-toolrow {
  border-top: var(--ds-border-width) solid var(--ds-border);
}
.ic-toolrow__main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--ds-space-2) var(--ds-space-3);
  padding: var(--ds-space-2) 0;
}
.ic-toolrow__title {
  flex: 1 1 180px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ic-toolrow__title .hint {
  margin-left: var(--ds-space-1);
}
.ic-toolrow__btns {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-1);
}
.ic-tprev {
  width: 44px;
  height: 44px;
  padding: 5px;
  border-radius: 0.6rem;
  box-sizing: border-box;
  display: inline-flex;
  flex-shrink: 0;
  border: var(--ds-border-width) solid var(--ds-border);
}
.ic-tprev--sm {
  width: 34px;
  height: 34px;
  padding: 3px;
}
.ic-tprev--none {
  align-items: center;
  justify-content: center;
  border-style: dashed;
  color: var(--ds-text-3);
  font-size: var(--ds-text-xs);
}
.ic-tprev img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.ic-tprev__mask {
  display: block;
  width: 100%;
  height: 100%;
}
.ic-tintbox {
  padding: var(--ds-space-2) var(--ds-space-2) var(--ds-space-3) 2.6rem;
  border-top: var(--ds-border-width) dashed var(--ds-border);
}
.ic-field {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  color: var(--ds-text-2);
  font-size: var(--ds-text-sm);
}
.ic-field--end {
  justify-content: flex-end;
}
.ic-check {
  display: flex;
  align-items: center;
  gap: var(--ds-space-1);
  margin: 0;
  color: var(--ds-text);
  cursor: pointer;
}
.ic-check input {
  width: auto;
  margin: 0;
}
.ic-collapsed {
  margin: var(--ds-space-2) 0;
}
@media (max-width: 600px) {
  .ic-tintbox {
    padding-left: var(--ds-space-2);
  }
}
</style>
