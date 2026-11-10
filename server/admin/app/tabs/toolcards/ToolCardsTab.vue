<template>
  <div :class="['tc-layout', `bg-collapsed-${otherMode}`]" data-vue-tab="toolcards">
    <template v-for="col in COLUMNS" :key="col">
      <div v-if="col === 'main'" class="tc-main">
        <!-- Sticky-Vorschau der bearbeiteten Karte -->
        <div class="tc-sticky">
          <div class="tc-line">
            <UiSelect
              :model-value="view.selected"
              label="Karte bearbeiten:"
              inline
              size="sm"
              :options="cardOptions"
              class="tc-grow"
              data-tcsel
              @update:model-value="selectCard(String($event))"
            />
            <template v-if="view.selCard">
              <UiButton
                size="sm"
                title="Kopie dieser Karte in DE + EN anlegen (Texte + Einzel-Design)"
                data-tcdup
                @click="duplicate"
                >⧉ Duplizieren</UiButton
              >
              <UiButton
                v-if="view.selCard.custom"
                size="sm"
                variant="danger"
                title="Im Admin angelegte Karte in DE + EN löschen"
                data-tcdel
                @click="askDelete"
                >🗑 Löschen</UiButton
              >
              <UiButton
                size="sm"
                :variant="view.selCard.hidden ? 'primary' : 'danger'"
                title="Gilt für DE + EN; jederzeit umkehrbar"
                data-tchide
                @click="toggleHidden"
                >{{
                  view.selCard.hidden ? '👁 Wieder einblenden' : '🙈 Von der Seite ausblenden'
                }}</UiButton
              >
            </template>
          </div>
          <div class="tc-line tc-prevhead">
            <span class="hint tc-m0">👁 Live-Vorschau der bearbeiteten Karte:</span>
            <UiSegmentedControl
              v-model="prevMode"
              label="Vorschau und Seitenleiste im Hell- oder Dunkelmodus"
              size="sm"
              :options="MODE_OPTIONS"
              data-tcprevmode
            />
            <span class="hint tc-m0"
              ><em>zum Testen des Hover-Effekts über die Karte fahren</em> – die Einstellungen
              dieses Modus stehen in der offenen Seitenleiste, der andere Modus ist
              zugeklappt.</span
            >
          </div>
          <div class="tc-previews tc-previews--single">
            <div class="tc-page" :data-tcprev="prevMode" :style="pageCss">
              <span class="tc-page-label">{{ THEME_LABEL[prevMode] }}</span>
              <TcCard
                :card="view.previewCard"
                :theme="prevMode"
                :side="view.style[prevMode]"
                :text="view.style.text"
                :show="view.style.show"
                :open="view.openLabel"
                :resolve-url="service.resolveUrl"
                :ensure-font-face="service.ensureFontFace"
              />
              <p v-if="view.selCard" class="hint tc-desc" :style="{ color: PAGE[prevMode].muted }">
                <span data-tcdesclabel>{{
                  show.popup === false ? 'Popup (ausgeblendet):' : 'Popup:'
                }}</span>
                <em :style="descCss" data-tcdesc>{{
                  view.selCard.description || '(keine Beschreibung)'
                }}</em>
              </p>
            </div>
          </div>
          <p class="hint tc-note" data-tcnote>{{ note }}</p>
        </div>

        <div class="panel">
          <h2>
            Tool-Karten <span class="lang-badge">{{ LANG }}</span>
          </h2>
          <p class="hint">
            Gestaltet Rahmen und Hintergrund der Tool-Karten auf der
            {{ service.lang === 'de' ? 'deutschen' : 'englischen' }} Startseite – ein Standard für
            alle Karten plus optionale Einzel-Designs je Karte, getrennt für Hell- und Dunkelmodus.
            Ausgeschaltet = Standard-Aussehen. Die Vorschau der bearbeiteten Karte bleibt beim
            Scrollen oben sichtbar.
          </p>
          <UiSwitch
            :model-value="view.tc.enabled"
            label="Eigenes Tool-Karten-Design verwenden"
            data-tcenabled
            @update:model-value="view.tc.enabled = $event"
          />
          <div class="tc-box">
            <UiButton
              size="sm"
              title="Standard + Einzel-Designs (Hell + Dunkel) und Typografie in die andere Sprache übernehmen – Karten-Texte bleiben je Sprache"
              class="tc-wrapbtn"
              data-tccopylang
              @click="askCopyLang"
              >📋 Tool-Karten-Design nach {{ OTHER_LANG_NAME }} übertragen</UiButton
            >
            <p class="hint tc-m0">
              Kopiert <strong>alle</strong> Design-Einstellungen (An-Schalter, Standard +
              Einzel-Designs, Hell + Dunkel, Typografie) von
              {{ service.lang === 'de' ? 'Deutsch nach English' : 'English nach Deutsch' }}.
              Karten-<em>Texte</em> (Titel, Badge, Beschreibung, Link) bleiben je Sprache.
            </p>
          </div>

          <!-- Neue Karte -->
          <div class="tc-box">
            <div class="tc-line tc-end">
              <UiSelect
                v-model="newSection"
                label="➕ Neue Karte in"
                size="sm"
                :options="sectionOptions"
                data-tcnewsec
              />
              <UiButton size="sm" data-tcnew @click="createCard">➕ Neue Karte anlegen</UiButton>
            </div>
            <p class="hint tc-m0">
              Legt eine leere Karte in <strong>DE + EN</strong> mit Standard-Design an. Sie bleibt
              ausgeblendet, bis du Titel und Link ausgefüllt und „Wieder einblenden“ geklickt hast;
              das Icon setzt du im Tab „Icons“. Eine bestehende Karte kopierst du oben mit „⧉
              Duplizieren“ (Texte DE + EN und Einzel-Design, Titel mit „(Kopie)“). Neue Karten
              stehen am Ende ihres Bereichs.
            </p>
          </div>

          <!-- Ausgeblendete Karten -->
          <TcDetails :open="hiddenIds.length > 0" data-tc-hidden>
            <template #title
              >🙈 Ausgeblendete Karten <span class="lang-badge">gilt für DE + EN</span
              ><span v-if="hiddenIds.length" class="hint tc-normal">
                ({{ hiddenIds.length }})</span
              ></template
            >
            <template v-if="hiddenIds.length">
              <div v-for="id in hiddenIds" :key="id" class="tc-hidden-row">
                <span
                  >🙈 {{ oneLine(titleOf(id)) }}
                  <span class="hint tc-m0"
                    >({{ SECTION_LABEL[id.split('.')[0]!] || id }})</span
                  ></span
                >
                <button
                  type="button"
                  class="hd-reset"
                  title="Karte wieder auf der Seite anzeigen"
                  :data-tcshow="id"
                  @click="unhide(id)"
                >
                  👁 Einblenden
                </button>
              </div>
              <div class="tc-line">
                <button type="button" class="hd-reset" data-tcshowall @click="unhideAll">
                  👁 Alle wieder einblenden
                </button>
                <span class="hint tc-m0"
                  >Ausgeblendete Karten fehlen auf der DE- und EN-Startseite (auch in Favoriten);
                  Einstellungen und Texte bleiben erhalten.</span
                >
              </div>
            </template>
            <p v-else class="hint tc-m0">
              Keine Karte ausgeblendet. Oben eine Karte wählen und „Von der Seite ausblenden“
              klicken – die Aktion lässt sich hier jederzeit rückgängig machen.
            </p>
          </TcDetails>

          <TcTexts :key="`tx-${view.selected}`" />

          <!-- Eigenes Design der Karte -->
          <div v-if="view.selCard" class="tc-box tc-line">
            <UiSwitch
              :model-value="!!view.tc.cards[view.selected]"
              :label="`Eigenes Design für „${oneLine(view.selCard.title)}“`"
              data-tcown
              @update:model-value="setOwn($event)"
            />
            <span class="hint tc-m0">{{
              view.tc.cards[view.selected]
                ? 'Aus = Karte nutzt wieder das Standard-Design.'
                : 'An = startet mit einer Kopie des Standard-Designs.'
            }}</span>
          </div>
          <template v-if="view.editsOwn">
            <TcDetails>
              <template #title
                >🔠 Typografie <span class="hint tc-normal">(Hell + Dunkel)</span></template
              >
              <TcTypo />
            </TcDetails>
            <TcDetails>
              <template #title
                >👁️ Elemente ein-/ausblenden
                <span class="hint tc-normal">(Hell + Dunkel)</span></template
              >
              <div class="tc-showgrid" data-tc-show>
                <UiSwitch
                  v-for="k in service.showKeys"
                  :key="k"
                  :model-value="show[k] !== false"
                  :label="SHOW_LABEL[k]"
                  :data-tcel="k"
                  @update:model-value="setShow(k, $event)"
                />
              </div>
              <div class="tc-line">
                <button
                  type="button"
                  class="hd-reset"
                  :title="view.selected ? 'Wie im Standard-Design' : 'Alle Elemente anzeigen'"
                  data-tcelall
                  @click="showAll"
                >
                  ↺ Alle anzeigen
                </button>
                <span class="hint tc-m0" data-tcshowinfo>{{
                  showInfoText(show, service.showKeys)
                }}</span>
              </div>
              <p class="hint tc-m0">
                Ausgeblendete Elemente sind unsichtbar und nicht bedienbar, ihr Platz bleibt frei –
                die Karte behält ihre Größe.
                {{
                  view.selected
                    ? 'Gilt nur für diese Karte.'
                    : 'Gilt für alle Karten ohne eigenes Design.'
                }}
              </p>
            </TcDetails>
            <TcDetails>
              <template #title
                >📋 Design übertragen <span class="hint tc-normal">(Hell + Dunkel)</span></template
              >
              <TcApply @as-default="askAsDefault" />
            </TcDetails>
          </template>
        </div>

        <TcOverview @pick="pickFromOverview" />
      </div>
      <aside
        v-else-if="col !== prevMode"
        class="tc-side tc-side--collapsed"
        :data-tcside="col"
        :data-tcshowmode="col"
        role="button"
        tabindex="0"
        :title="`${col === 'dark' ? 'Dunkelmodus' : 'Hellmodus'} anzeigen und bearbeiten`"
        @click="prevMode = col"
        @keydown.enter.prevent="prevMode = col"
        @keydown.space.prevent="prevMode = col"
      >
        <span class="tc-icon-lg" aria-hidden="true">{{ col === 'dark' ? '🌙' : '☀️' }}</span>
        <span class="tc-side-vlabel"
          >{{ col === 'dark' ? 'Dunkelmodus' : 'Hellmodus' }} – anklicken zum Bearbeiten</span
        >
      </aside>
      <TcSide v-else :mode="col" />
    </template>

    <UiDialog
      :open="!!pending"
      :title="pending?.title ?? ''"
      :description="pending?.description ?? ''"
      @close="pending = null"
    >
      <template #footer>
        <UiButton variant="ghost" @click="pending = null">Abbrechen</UiButton>
        <UiButton
          :variant="pending?.danger ? 'danger' : 'primary'"
          data-tc-confirm
          @click="confirmPending"
          >{{ pending?.confirmLabel }}</UiButton
        >
      </template>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import type { ThemeMode } from '../../../types';
import { UiButton, UiDialog, UiSegmentedControl, UiSelect, UiSwitch } from '../../components/ui';
import TcApply from './TcApply.vue';
import TcCard from './TcCard.vue';
import TcDetails from './TcDetails.vue';
import TcOverview from './TcOverview.vue';
import TcSide from './TcSide.vue';
import TcTexts from './TcTexts.vue';
import TcTypo from './TcTypo.vue';
import {
  MODE_LABEL,
  PAGE,
  SECTION_LABEL,
  SHOW_LABEL,
  THEME_LABEL,
  clone,
  fontCss,
  noteText,
  oneLine,
  showInfoText,
  textStyles,
  type TcSectionKey,
  type TcService,
} from './tcData';
import { tcUi } from './tcUi';
import { provideTc } from './useTc';

/**
 * Tab „Tool-Karten“ (je Sprache, Vue-Fassung von `renderToolCards` in
 * `public/toolcards.js`): Standard-Design aller Karten plus Einzel-Designs,
 * getrennt für Hell und Dunkel, mit Sticky-Vorschau, Karten-Texten,
 * Ausblenden/Duplizieren/Anlegen und Übersicht. Geschrieben wird direkt in
 * `media.<lang>.toolCards` bzw. die Overrides (über den Service), damit
 * Speichern, Autosave und Undo per Snapshot unverändert greifen.
 */
const props = defineProps<{ service: TcService }>();
const api = provideTc(props.service);
const { view, change, toast, show, showResetSource, setShow, ensureEnabled, select } = api;
const service = props.service;
const LANG = service.lang.toUpperCase();
const OTHER_LANG_NAME = service.lang === 'de' ? 'English' : 'Deutsch';

// Gewählte Karte muss in dieser Sprache existieren (sonst Standard).
if (tcUi.selected && !view.value.selCard) tcUi.selected = '';

type Column = ThemeMode | 'main';
const COLUMNS: Column[] = ['light', 'main', 'dark'];
const MODE_OPTIONS = (['light', 'dark'] as const).map((m) => ({ value: m, label: MODE_LABEL[m] }));

/** Hell/Dunkel: Vorschau + Seitenleiste; die Übersicht folgt dem Modus. */
const prevMode = computed<ThemeMode>({
  get: () => tcUi.prevMode,
  set: (m) => {
    tcUi.prevMode = m === 'dark' ? 'dark' : 'light';
    tcUi.ovTheme = tcUi.prevMode;
  },
});
const otherMode = computed<ThemeMode>(() => (prevMode.value === 'light' ? 'dark' : 'light'));

const sectionOptions = service.sections.map((s) => ({ value: s, label: SECTION_LABEL[s] ?? s }));
const cardOptions = computed(() => [
  { value: '', label: '★ Standard (alle Karten)' },
  ...service.sections
    .map((sec) => ({
      label: SECTION_LABEL[sec] ?? sec,
      options: view.value.cards
        .filter((c) => c.section === sec)
        .map((c) => ({
          value: c.id,
          label: `${c.hidden ? '🙈 ' : ''}${oneLine(c.title)}${view.value.tc.cards[c.id] ? ' ●' : ''}`,
        })),
    }))
    .filter((g) => g.options.length),
]);
const pageCss = computed(() => {
  void view.value;
  return `background:${service.pageBg(prevMode.value)};${fontCss(service.globalFont(), service.ensureFontFace)}`;
});
const descCss = computed(() => {
  const st = view.value.style;
  const m = prevMode.value;
  const hidden = show.value.popup === false ? 'text-decoration:line-through;opacity:.45;' : '';
  return textStyles(st[m], m, st.text, service.ensureFontFace).desc + hidden;
});
const note = computed(() =>
  noteText(view.value.tc, view.value.selected, !!view.value.selCard?.hidden),
);
const hiddenIds = computed(() => (view.value, service.hiddenIds()));
const titleOf = (id: string) => view.value.cards.find((c) => c.id === id)?.title ?? id;

function selectCard(id: string) {
  select(id);
}
function pickFromOverview(id: string) {
  select(id);
  toast('Karte ausgewählt – Einstellungen links (Hell) und rechts (Dunkel), Vorschau oben', {
    type: 'info',
  });
}

// ---- Karten anlegen/duplizieren/ausblenden ------------------------------------------
const newSection = ref<TcSectionKey>(
  (view.value.selCard?.section as TcSectionKey) || service.sections[0] || 'tools',
);
function duplicate() {
  const src = view.value.selCard;
  if (!src) return;
  let id: string | null = null;
  change(() => (id = service.duplicate(src.id)));
  if (!id) return;
  select(id);
  toast(`Kopie von „${oneLine(src.title)}“ angelegt (DE + EN) und ausgewählt`);
}
function createCard() {
  let id: string | null = null;
  change(() => (id = service.create(newSection.value)));
  if (!id) return;
  select(id);
  toast('Neue Karte angelegt (DE + EN) – Titel und Link ausfüllen, dann „Wieder einblenden“');
}
function toggleHidden() {
  const c = view.value.selCard;
  if (!c) return;
  const hide = !c.hidden;
  change(() => service.setHidden(c.id, hide));
  toast(
    hide
      ? 'Karte ausgeblendet – unter „Ausgeblendete Karten“ jederzeit wieder einblendbar'
      : 'Karte wird wieder auf der Seite angezeigt',
  );
}
function unhide(id: string) {
  change(() => service.setHidden(id, false));
  toast('Karte wird wieder auf der Seite angezeigt');
}
function unhideAll() {
  change(() => {
    for (const id of service.hiddenIds()) service.setHidden(id, false);
  });
  toast('Alle Karten werden wieder angezeigt');
}

// ---- Eigenes Design / Sichtbarkeit -------------------------------------------------
function setOwn(on: boolean) {
  const v = view.value;
  if (!v.selected) return;
  if (on) {
    ensureEnabled();
    v.tc.cards[v.selected] = clone(v.tc.default);
  } else delete v.tc.cards[v.selected];
  toast(on ? 'Eigenes Design für die Karte angelegt' : 'Karte nutzt wieder das Standard-Design');
}
function showAll() {
  const src = showResetSource();
  for (const k of service.showKeys) setShow(k, src[k] !== false);
  toast(view.value.selected ? 'Sichtbarkeit wie im Standard-Design' : 'Alle Elemente sichtbar');
}

// ---- Rückfragen (statt confirm()) ------------------------------------------------------
interface Pending {
  title: string;
  description: string;
  confirmLabel: string;
  danger: boolean;
  action: () => void;
}
const pending = shallowRef<Pending | null>(null);
function confirmPending() {
  const p = pending.value;
  pending.value = null;
  p?.action();
}
function askCopyLang() {
  pending.value = {
    title: `Tool-Karten-Design nach ${OTHER_LANG_NAME} übertragen?`,
    description: `Alle Tool-Karten-Design-Einstellungen für ${OTHER_LANG_NAME} werden ersetzt (Standard + Einzel-Designs, Hell + Dunkel, Typografie). Karten-Texte bleiben.`,
    confirmLabel: 'Übertragen',
    danger: true,
    action: () => {
      service.copyToOtherLang();
      toast(`Tool-Karten-Design nach ${OTHER_LANG_NAME} übertragen`);
    },
  };
}
function askAsDefault() {
  const c = view.value.selCard;
  if (!c) return;
  const name = oneLine(c.title);
  pending.value = {
    title: 'Als Standard übernehmen?',
    description: `Das Design von „${name}“ wird zum Standard für alle Karten ohne eigenes Design (Hell + Dunkel).`,
    confirmLabel: 'Übernehmen',
    danger: false,
    action: () => {
      const v = view.value;
      if (v.selected !== c.id) return;
      ensureEnabled();
      v.tc.default = clone(v.style);
      // Die Quelle entspricht jetzt dem Standard → eigenes Design überflüssig.
      delete v.tc.cards[c.id];
      toast(`Design von „${name}“ ist jetzt der Standard`);
    },
  };
}
function askDelete() {
  const c = view.value.selCard;
  if (!c) return;
  const name = oneLine(c.title);
  pending.value = {
    title: 'Karte löschen?',
    description: `Karte „${name}“ in DE + EN löschen? (Rückgängig mit ↶ möglich)`,
    confirmLabel: 'Löschen',
    danger: true,
    action: () => {
      let ok = false;
      change(() => (ok = service.remove(c.id)));
      if (!ok) return;
      select('');
      toast(`Karte „${name}“ gelöscht`);
    },
  };
}
</script>

<style scoped>
.tc-m0 {
  margin: 0;
}
.tc-normal {
  font-weight: 400;
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
.tc-grow {
  flex: 1 1 220px;
  min-width: 0;
}
.tc-prevhead {
  margin: var(--ds-space-2) 0;
}
.tc-desc {
  margin: var(--ds-space-2) 0 0;
}
.tc-note {
  margin: var(--ds-space-2) 0 0;
}
.tc-box {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  margin: var(--ds-space-3) 0 var(--ds-space-1);
  padding: var(--ds-space-2) var(--ds-space-3);
  border: 1px dashed var(--border);
  border-radius: 8px;
}
.tc-box.tc-line {
  flex-direction: row;
}
.tc-showgrid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2) var(--ds-space-5);
}
.tc-icon-lg {
  font-size: 1.3rem;
}
.tc-wrapbtn.tc-wrapbtn {
  white-space: normal;
  height: auto;
  min-height: var(--ds-control-sm);
  max-width: 100%;
  line-height: 1.25;
  padding-block: 4px;
  text-align: left;
}
</style>
