import { ref } from 'vue';
import {
  fetchAiConfig,
  runAi,
  type AiConfig,
  type AiEffort,
  type AiInput,
  type AiResult,
  type AiTask,
} from '../tabs/texts/aiClient';

/**
 * Gemeinsamer Ablauf der kleinen KI-Hilfen in den Tabs (Tool-Karten, Laufband,
 * Icons): Konfiguration erst beim Öffnen laden, Modell/Aufwand wählen, EINE
 * Aufgabe sofort ausführen. Ergebnisse ändern nichts; die Tabs übernehmen sie
 * selbst in den Entwurf.
 */
export function useAiAssist(task: AiTask, defaultEffort: AiEffort = 'medium') {
  const open = ref(false);
  const config = ref<AiConfig | null>(null);
  const loadError = ref('');
  const error = ref('');
  const busy = ref(false);
  const model = ref('');
  const effort = ref<AiEffort>(defaultEffort);
  const data = ref<Record<string, unknown> | null>(null);
  const costUsd = ref<number | undefined>(undefined);

  async function toggle() {
    open.value = !open.value;
    if (!open.value || config.value) return;
    const r = await fetchAiConfig();
    if (!r.ok) {
      loadError.value = r.error;
      return;
    }
    config.value = r.data;
    model.value = r.data.defaultModel;
  }

  /** Führt die Aufgabe aus; liefert das Ergebnis oder null (Fehler steht in `error`). */
  async function run(input: AiInput): Promise<AiResult | null> {
    error.value = '';
    busy.value = true;
    try {
      const r = await runAi({ task, model: model.value, effort: effort.value }, input);
      if (!r.ok) {
        error.value = r.error;
        return null;
      }
      if (!r.data.ok) {
        error.value = r.data.error || 'Unbekannter Fehler';
        return null;
      }
      data.value = r.data.data ?? null;
      costUsd.value = r.data.costUsd;
      return r.data;
    } finally {
      busy.value = false;
    }
  }

  return { open, config, loadError, error, busy, model, effort, data, costUsd, toggle, run };
}
