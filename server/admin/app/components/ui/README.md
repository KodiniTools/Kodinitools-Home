# UI-Komponenten

Bausteine des Design-Systems v2 für die Vue-Teile des Admins, unverändert übernommen aus dem
Modernen Musikplayer (`KodiniTools/Moderner-Musikplayer`, `src/components/ui/`, Stand `b094e52`;
dort aus dem Visualizer, Collage Maker und Playlist Generator). Tests: `tests/unit/admin-ui/`.
Templates und Styles sind unverändert. `<script setup>` ist hier **TypeScript** (`lang="ts"`,
strict); Props sind typbasiert (`defineProps<…>()` mit `withDefaults`), die erlaubten Werte
prüft der Compiler statt eines Laufzeit-`validator`.

Alle Komponenten:

- `<script setup lang="ts">` mit `defineProps`/`defineModel`/`useId` (Vue 3.5).
- Styling ausschließlich über `--ds-*` Tokens aus `src/design-system/tokens-v2.css`, scoped CSS.
- Native Elemente (`<button>`, `<input>`, `<label>`, `<section>`), Fokus-Ring statt Glow.
- Icons kommen über Slots als Inline-SVG (Lucide-Stil, Stroke 1.75).
- Je ein Vitest unter `tests/ui/`.

```ts
import { UiButton, UiPanel, UiTextField } from '@/components/ui';
```

| Komponente           | Zweck                                      | Wichtige Props / Events                                                                                                                                       |
| -------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `UiButton`           | Textbutton; `href` = a                     | `variant` primary · secondary · ghost · danger, `size` sm · md · lg, `block`, Slot `icon`                                                                     |
| `UiIconButton`       | Quadratischer Icon-Button                  | `label` (Pflicht, wird aria-label und title), `variant` ghost · secondary · primary, `size` sm · md, `round`, `pressed`                                       |
| `UiPanel`            | Flache Fläche mit Kopfzeile                | `title`, `headingLevel` 2 · 3, `count`, `padded`, Slot `actions`                                                                                              |
| `UiCallout`          | Ruhiger Hinweis im Textfluss               | `type` info · success · warning · danger, `title`, Slot default                                                                                               |
| `UiEmptyState`       | Leerzustand                                | `title`, `text`, Slots `icon` · `action`                                                                                                                      |
| `UiSegmentedControl` | Eine Option aus wenigen, Radiogroup-Muster | `v-model` (string), `options` `{ value, label, disabled? }`, `label`, `size`, `wrap`; Pfeiltasten wechseln                                                    |
| `UiSelect`           | Natives Select im System-Look              | `v-model` (string · number), `options` (Eintrag mit `options` → `<optgroup>`), `label` (Pflicht), `inline`, `labelHidden`, `size`, `disabled`; Attrs → select |
| `UiSwitch`           | Schiebeschalter An/Aus, `role="switch"`    | `v-model` (boolean), `label` (Pflicht; sichtbar rechts oder `labelHidden`), `disabled`                                                                        |
| `UiTextField`        | Einzeiliges Textfeld mit Label             | `v-model`, `label`, `hint`, `error` (aria-invalid, role=alert), `required`, `disabled`, Attrs → input                                                         |
| `UiTextArea`         | Mehrzeiliges Textfeld                      | `v-model`, `label`, `rows`, `placeholder`, `hint`, `disabled`, Attrs → textarea                                                                               |
| `UiDialog`           | Modaler Dialog (Teleport nach `body`)      | `open`, `title`, `description`, `closeLabel`, `size` md · lg, `teleportTo`, `id`, Slots default · `footer`; Event `close`                                     |
| `UiToast`            | Benachrichtigung                           | `message`, `type` success · error · warning · info, `actionLabel`, `dismissLabel`, `dismissOnClick`; Events `action`, `dismiss`                               |
| `SliderField`        | Ersatz für `<input type="range">`          | `v-model` (number), `min`, `max`, `step`, `defaultValue` (Reset-Button), `disabled`; Events `start`, `change`, `reset`; Attrs → range                         |
| `SliderControl`      | Regler-Zeile: Label · SliderField · Wert   | wie `SliderField`, dazu `label` (Pflicht), `valueText`, `inputClass`                                                                                          |
| `ColorField`         | Ersatz für `<input type="color">`          | `v-model` (Hex `#rrggbb`), `label`, `disabled`; Events `start`, `change`, `open`, `close`; `class` → Wurzel, übrige Attrs → Button                            |

## Abweichungen zum Visualizer

- `UiButton` kennt kein `to`/RouterLink: Der Musikplayer hat keinen Router. `href` bleibt.
- i18n läuft über den Adapter `src/lib/i18n.ts` (`useI18n()` → Pinia-Store `stores/i18n.ts`).
  Die Schlüssel sind flach mit Punkt (`"common.close"`, `"colorField.*"`, `"sliderField.*"`) in
  `src/locales/de.json` und `en.json`. Komponenten mit Texten brauchen daher eine aktive Pinia.
- Farb-Hilfen (`ColorField`, `SliderField`) kommen aus `src/lib/color.ts`.

## Fallstricke

- `UiSelect`, `UiTextField`, `UiTextArea`, `SliderField`: `inheritAttrs: false`, `class` landet
  am nativen Element. Für scoped Styles dort `:deep(.ui-select__native.…)` nutzen.
- `ColorField`: `class` an der Wurzel, alle übrigen Attribute am Button. Im Test den Wert per
  `findAllComponents(ColorField)[i].vm.$emit('update:modelValue', hex)` setzen.
- `v-model` plus `@update:model-value`: Zuerst läuft das v-model-Update, dann der Handler.
- Ein nackter `SliderField` braucht `<style scoped src="…/ui/slider-control.css">`.

## Regeln

- Keine Gradients, kein Glow, keine Scale-Hover. Hover ändert nur Farbe, 150 ms.
- Ein Rahmen (1 px), drei Radien (`--ds-radius-sm | -md | -lg`), Schatten nur in Toast, Dialog, Popover.
- Primär ist die einzige Goldfläche pro Ansicht; Umschalter zeigen „an“ als primär.
- Gold ist im Light Theme nie Textfarbe (Kontrast): Text auf Gold läuft über `--ds-on-accent`.
- Danger ist textbasiert (`variant="danger"`), Vollfläche nie.
