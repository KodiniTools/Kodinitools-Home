<template>
  <div
    ref="rootEl"
    class="tc-layout"
    data-vue-tab="layout"
    :data-lymode="modern ? 'modern' : grid ? 'grid' : 'banner'"
    :style="modern ? { gridTemplateColumns: 'minmax(0, 1200px)' } : undefined"
  >
    <template v-if="modern" />
    <aside v-else-if="grid" class="tc-side" data-tcside="left">
      <div class="tc-side-head left">🖼️ Kachel-Inhalte</div>
      <p class="hint">
        Pro Kachel: <strong>Bild</strong> (aus der Zwischenablage oder Mediathek) mit
        Bildbearbeitung (Deckkraft, Abdunkelung, Weichzeichner, Sättigung) sowie optionaler
        <strong>Text</strong> (Schrift: Arial Bold). Kachel in der Vorschau anklicken springt zur
        passenden Kachel.
      </p>
      <LyGridCellContent v-for="i in cells" :key="i" :i="i" :big="isMosaic && i === 0" />
    </aside>
    <aside v-else class="tc-side" data-tcside="left">
      <div class="tc-side-head left">🖼️ Banner-Design</div>
      <p class="hint">
        Rahmen, Ecken, Schatten, Deckkraft und Verdunkelung des Banner-Bildes/-Videos – getrennt für
        <strong>Hell</strong> und <strong>Dunkel</strong>. Der Umschalter über der Vorschau (oder
        die zugeklappte Leiste hier) wählt den bearbeiteten Modus; der andere ist zugeklappt. Das
        Banner-Bild/-Video weist du in der Mitte unter der Vorschau zu.
      </p>
      <div class="panel ly-copybox">
        <button
          type="button"
          class="hd-reset ly-wrapbtn"
          title="Banner-Design (Hell + Dunkel) in die andere Sprache übernehmen – Text bleibt je Sprache"
          :data-bannercopylang="OTHER"
          @click="askCopyDesign"
        >
          📋 Banner-Design nach {{ OTHER_NAME }} übertragen<br /><span class="hint ly-m0"
            >(Hell + Dunkel; Text bleibt je Sprache)</span
          >
        </button>
      </div>
      <LyBannerDesign mode="light" @ask-reset-all="askResetAll" />
      <LyBannerDesign mode="dark" @ask-reset-all="askResetAll" />
    </aside>

    <div class="tc-main">
      <LyPagePanel />
      <ModernHeroPreview
        v-if="modern"
        :data="modernData"
        note="Banner, Kacheln, Banner-Text und die Ganzseiten-Vorschau gehören zum klassischen Design und sind ausgeblendet, solange „Modernes Design“ an ist; ihre Einstellungen bleiben erhalten."
      />
      <template v-else>
        <LyModePanel />
        <div class="panel">
          <AiDesignAssist
            area="layout"
            :lang="service.lang"
            :get-current="aiCurrent"
            :resolve="aiResolve"
            :apply-note="
              text.text.trim()
                ? ''
                : 'Hinweis: Der Banner-Text ist leer. Animation, Größe, Farbe und Deckkraft des Banner-Texts wirken auf der Seite erst, wenn ein Banner-Text eingetragen ist.'
            "
          />
          <AiImagePanel
            v-if="service.stageImage && !grid"
            :on-use="useAiBanner"
            use-label="Als Banner verwenden"
            default-purpose="Hero-Banner oben auf der Startseite"
            default-aspect="21:9"
          />
        </div>
        <template v-if="grid">
          <LyGridPreview />
          <LyGridSettings />
          <div class="panel">
            <p class="hint ly-m0">
              Links die <strong>Inhalte</strong> der Kacheln (Bild, Text, Schrift), rechts ihr
              <strong>Design</strong> (Rahmen, Hintergrund, Textfarbe/-position). Die Vorschau
              bleibt beim Scrollen oben sichtbar; Texte darin mit der Maus verschieben.
            </p>
          </div>
        </template>
        <template v-else>
          <LyBannerPreview />
          <LyBannerMedia />
          <LyBannerSlides @ask-clear="askClearSlides" />
          <div class="panel">
            <p class="hint ly-m0">
              Links das <strong>Banner-Design</strong> (Rahmen, Schatten, Deckkraft, Verdunkelung),
              rechts der <strong>Banner-Text</strong> mit allen Effekten. Die Vorschau bleibt beim
              Scrollen oben sichtbar; den Text in der Vorschau mit der Maus verschieben.
            </p>
          </div>
        </template>
        <LyFullPage />
      </template>
    </div>

    <template v-if="modern" />
    <aside v-else-if="grid" class="tc-side" data-tcside="right">
      <div class="tc-side-head right">🎨 Kachel-Design</div>
      <p class="hint">
        Pro Kachel: Rahmenfarbe &amp; -dicke, Hintergrundfarbe &amp; -transparenz, Textfarbe, -größe
        und -position. Rahmendicke 0 = kein Rahmen. „Standard für alle“ macht eine Kachel zur
        Vorlage der übrigen.
      </p>
      <div class="panel ly-copybox">
        <button
          type="button"
          class="hd-reset ly-wrapbtn"
          title="Anordnung, Form und Design aller Kacheln in die andere Sprache übernehmen – Texte und Bilder bleiben je Sprache"
          :data-gridcopylang="OTHER"
          @click="askCopyGrid"
        >
          📋 Kachel-Design nach {{ OTHER_NAME }} übertragen<br /><span class="hint ly-m0"
            >(Anordnung, Form, Rahmen, Hintergrund, Schrift, Textfarbe/-größe/-position,
            Bildbearbeitung, „Standard für alle“ – Texte und Bilder bleiben je Sprache)</span
          >
        </button>
      </div>
      <LyGridCellDesign
        v-for="i in cells"
        :key="i"
        :i="i"
        :big="isMosaic && i === 0"
        @ask-reset-cell="askResetCell"
      />
    </aside>
    <LyBannerText v-else @ask-copy-text="askCopyText" />

    <UiDialog
      :open="!!pending"
      :title="pending?.title ?? ''"
      :description="pending?.description ?? ''"
      @close="pending = null"
    >
      <template #footer>
        <UiButton variant="ghost" @click="pending = null">Abbrechen</UiButton>
        <UiButton variant="danger" data-ly-confirm @click="confirmPending">{{
          pending?.confirmLabel
        }}</UiButton>
      </template>
    </UiDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import type { ThemeMode } from '../../../types';
import { UiButton, UiDialog } from '../../components/ui';
import LyBannerDesign from './LyBannerDesign.vue';
import LyBannerMedia from './LyBannerMedia.vue';
import LyBannerPreview from './LyBannerPreview.vue';
import LyBannerSlides from './LyBannerSlides.vue';
import LyBannerText from './LyBannerText.vue';
import LyFullPage from './LyFullPage.vue';
import LyGridCellContent from './LyGridCellContent.vue';
import LyGridCellDesign from './LyGridCellDesign.vue';
import LyGridPreview from './LyGridPreview.vue';
import LyGridSettings from './LyGridSettings.vue';
import LyModePanel from './LyModePanel.vue';
import LyPagePanel from './LyPagePanel.vue';
import ModernHeroPreview from '../../components/modern/ModernHeroPreview.vue';
import { modernHeroData } from '../../components/modern/modernHero';
import {
  LANG_LABEL,
  MODE_LABEL,
  copyBannerDesign,
  copyTextDesign,
  otherLang,
  type LayoutService,
} from './layoutData';
import { copyGridDesign, layoutCells, normLayout } from './gridData';
import { lyUi } from './layoutUi';
import { provideLayout } from './useLayout';
import AiImagePanel from '../files/AiImagePanel.vue';
import AiDesignAssist, { type Applicable } from '../hero/AiDesignAssist.vue';
import type { AiChange } from '../hero/aiHero';
import { applyLayoutChange, describeLayoutCurrent, resolveLayoutChange } from './aiLayout';

/**
 * Tab „Layout“ (Vue-Fassung von `renderLayout`, `public/layout-banner.js` und
 * `public/layout-grid.js`). Einzel-Banner: links Banner-Design je Hell/Dunkel,
 * rechts Banner-Text. Bild-Raster: links Kachel-Inhalte, rechts Kachel-Design.
 * In der Mitte Seiten-Layout, Hero-Modus, Sticky-Vorschau, Einstellungen und
 * die Ganzseiten-Vorschau (noch Vanilla). Geschrieben wird direkt in
 * `media.<lang>` bzw. über die Setter des Services, damit Speichern, Autosave
 * und Undo per Snapshot unverändert greifen.
 */
const props = defineProps<{ service: LayoutService }>();
const { view, change, toast, text, styles, slideshow, slides, cell, markCell } = provideLayout(
  props.service,
);
const service = props.service;
const aiCurrent = () => JSON.stringify(view.value.m);
/** KI-Bild als Banner dieser Sprache (Entwurf, Strg+Z, Vorschau; Upload erst beim Veröffentlichen). */
async function useAiBanner(file: File) {
  const url = await service.stageImage?.(file);
  if (!url) return;
  change(() => {
    view.value.m.heroBanner = url;
  });
  toast('Als Banner gesetzt (Entwurf) – mit Strg+Z rückgängig, in der Vorschau prüfen', {
    type: 'success',
  });
}
function aiResolve(c: AiChange): Applicable | null {
  const r = resolveLayoutChange(c);
  if (!r) return null;
  return {
    label: r.label,
    current: describeLayoutCurrent(text.value, r, view.value.m),
    next: r.value,
    apply: () => applyLayoutChange(view.value.m, r),
  };
}
const OTHER = otherLang(service.lang);
const OTHER_NAME = LANG_LABEL[OTHER];

const grid = computed(() => view.value.m.heroMode === 'grid');
/** Modernes Design (Kompakt + Schalter): klassische Banner-/Kachel-Editoren ausblenden. */
const modern = computed(
  () => view.value.page.homeLayout === 'compact' && view.value.page.modernDesign === true,
);
const modernData = computed(
  () =>
    service.modernHero?.() ??
    modernHeroData({
      lang: service.lang,
      title: '',
      subtitle: '',
      cta: '',
      features: [],
      design: {},
    }),
);
const layout = computed(() => normLayout(service.layouts, view.value.m.heroLayout));
const isMosaic = computed(() => layout.value === 'mosaic');
const cells = computed(() =>
  Array.from({ length: layoutCells(service.layouts, layout.value) }, (_, i) => i),
);

// Klick auf eine Vorschau-Kachel: Editoren in beiden Seitenleisten nach oben scrollen
// (nur innerhalb der Seitenleiste – die Seite selbst bleibt stehen).
const rootEl = ref<HTMLElement | null>(null);
watch(
  () => lyUi.selSeq,
  async () => {
    await nextTick();
    const i = lyUi.activeCell;
    if (i === null) return;
    rootEl.value?.querySelectorAll<HTMLElement>(`[data-celleditor="${i}"]`).forEach((ed) => {
      const side = ed.closest<HTMLElement>('.tc-side');
      if (!side) return;
      const top =
        ed.getBoundingClientRect().top - side.getBoundingClientRect().top + side.scrollTop;
      side.scrollTo?.({ top: Math.max(0, top - 8), behavior: 'smooth' });
    });
  },
);
// Strg/Cmd+V (public/layout-paste.ts) markiert über die Vue-Auswahl.
let unbind: (() => void) | null = null;
onMounted(() => {
  unbind = service.bindCells({ mark: (i) => markCell(i), active: () => lyUi.activeCell });
});
onBeforeUnmount(() => unbind?.());

// ---- Rückfragen (statt confirm()) --------------------------------------------------------
interface Pending {
  title: string;
  description: string;
  confirmLabel: string;
  action: () => void;
}
const pending = shallowRef<Pending | null>(null);
function confirmPending() {
  const p = pending.value;
  pending.value = null;
  p?.action();
}
function askCopyDesign() {
  pending.value = {
    title: `Banner-Design nach ${OTHER_NAME} übertragen?`,
    description: `Banner-Design (Hell + Dunkel) und Diashow-Einstellungen für ${OTHER_NAME} werden ersetzt. Der Text bleibt je Sprache.`,
    confirmLabel: 'Übertragen',
    action: () => {
      change(() => {
        service.ensure(OTHER);
        copyBannerDesign(styles(), slideshow(), service.mediaOf(OTHER));
      });
      toast(`Banner-Design nach ${OTHER_NAME} übertragen`);
    },
  };
}
function askCopyText() {
  pending.value = {
    title: `Text-Design nach ${OTHER_NAME} übertragen?`,
    description:
      'Schrift, Farbe, Größe, Position und Effekte werden ersetzt. Der Text selbst bleibt unverändert.',
    confirmLabel: 'Übertragen',
    action: () => {
      change(() => copyTextDesign(service.media(), service.mediaOf(OTHER)));
      toast(`Text-Design nach ${OTHER_NAME} übertragen`);
    },
  };
}
function askResetAll(mode: ThemeMode) {
  pending.value = {
    title: `Banner-Design (${MODE_LABEL[mode]}) zurücksetzen?`,
    description: 'Alle Werte dieses Modus werden auf Standard gesetzt.',
    confirmLabel: 'Zurücksetzen',
    action: () => {
      styles()[mode] = service.styleDefault();
      lyUi.prevMode = mode;
      toast('Banner-Design zurückgesetzt');
    },
  };
}
function askCopyGrid() {
  pending.value = {
    title: `Kachel-Design nach ${OTHER_NAME} übertragen?`,
    description:
      'Anordnung, Form und Design aller Kacheln werden dort ersetzt; Texte und Bilder bleiben.',
    confirmLabel: 'Übertragen',
    action: () => {
      change(() => {
        service.ensure(OTHER);
        copyGridDesign(service.media(), service.mediaOf(OTHER), service.cellDefault);
      });
      toast(`Kachel-Design nach ${OTHER_NAME} übertragen`);
    },
  };
}
function askResetCell(i: number) {
  pending.value = {
    title: `Kachel ${i + 1} zurücksetzen?`,
    description: `Alle Einstellungen von Kachel ${i + 1} (inkl. Text) werden auf Standard gesetzt.`,
    confirmLabel: 'Zurücksetzen',
    action: () => {
      Object.assign(cell(i), service.cellDefault());
      toast(`Kachel ${i + 1} zurückgesetzt`);
    },
  };
}
function askClearSlides() {
  pending.value = {
    title: 'Diashow leeren?',
    description: 'Alle weiteren Bilder aus der Diashow entfernen? Das Banner selbst bleibt.',
    confirmLabel: 'Alle entfernen',
    action: () => {
      slides().length = 0;
      toast('Diashow geleert');
    },
  };
}
</script>

<style scoped>
.ly-m0 {
  margin: 0;
}
.ly-copybox {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-1);
  align-items: center;
}
.ly-wrapbtn {
  white-space: normal;
  text-align: left;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 100%;
}
</style>
