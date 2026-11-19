// KI-Zugang des Admins (Anthropic). Sofort-Aufrufe und Batch-Betrieb (50 %
// günstiger, Ergebnis nach Minuten bis Stunden). Der API-Schlüssel kommt nur
// aus der Umgebung (ANTHROPIC_API_KEY), nie aus dem Repo oder dem Browser.

import Anthropic from '@anthropic-ai/sdk';
import { config } from './config.js';
import {
  DEFAULT_MODEL,
  MODELS,
  TASKS,
  buildRequestParams,
  estimateCostUsd,
  inputError,
  isEffort,
  isModelId,
  isTaskId,
  type Effort,
  type ModelId,
  type TaskId,
  type Usage,
} from './aiTasks.js';

export const MAX_BATCH_ITEMS = 100;
const BATCH_ID = /^msgbatch_[A-Za-z0-9]+$/;

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!config.anthropicApiKey) {
    throw Object.assign(new Error('ANTHROPIC_API_KEY ist nicht gesetzt.'), { statusCode: 503 });
  }
  client ??= new Anthropic({ apiKey: config.anthropicApiKey });
  return client;
}

// --- Schutz gegen Endlosschleifen (kein Budgetlimit) ---
const calls: number[] = [];
/** Wirft 429, wenn mehr als `limit` Aufrufe pro Minute eingehen (0 = aus). */
export function checkThrottle(limit = config.aiMaxPerMinute, now = Date.now()): void {
  if (limit <= 0) return;
  while (calls.length && now - calls[0] > 60_000) calls.shift();
  if (calls.length >= limit) {
    throw Object.assign(new Error(`Zu viele KI-Aufrufe (max. ${limit} pro Minute).`), {
      statusCode: 429,
    });
  }
  calls.push(now);
}
/** Nur für Tests. */
export function resetThrottle(): void {
  calls.length = 0;
}

type Selection = { task: TaskId; model: ModelId; effort?: Effort };

/** Prüft Aufgabe, Modell und Aufwand aus dem Request-Body. */
export function parseSelection(body: Record<string, unknown>): Selection {
  if (!isTaskId(body.task)) throw inputError('Unbekannte Aufgabe');
  const model = body.model === undefined ? DEFAULT_MODEL : body.model;
  if (!isModelId(model)) throw inputError('Unbekanntes Modell');
  if (body.effort !== undefined && !isEffort(body.effort)) throw inputError('Ungültiger Aufwand');
  return { task: body.task, model, effort: body.effort as Effort | undefined };
}

/** Konfiguration für das Admin-UI: Modelle, Aufgaben, Schlüssel vorhanden? */
export function aiConfig() {
  return {
    configured: Boolean(config.anthropicApiKey),
    defaultModel: DEFAULT_MODEL,
    maxBatchItems: MAX_BATCH_ITEMS,
    models: MODELS,
    tasks: Object.values(TASKS).map((t) => ({ id: t.id, label: t.label, effort: t.effort })),
  };
}

export type AiResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
  usage?: Usage;
  costUsd?: number;
};

/** Liest die JSON-Antwort der ersten Text-Blöcke. */
export function parseMessage(
  message: {
    content: Array<{ type: string; text?: string }>;
    stop_reason?: string | null;
    usage?: Usage;
  },
  model: ModelId,
  batch: boolean,
): AiResult {
  const usage = message.usage;
  const costUsd = usage ? estimateCostUsd(model, usage, batch) : undefined;
  if (message.stop_reason === 'refusal') {
    return { ok: false, error: 'Das Modell hat die Antwort abgelehnt.', usage, costUsd };
  }
  if (message.stop_reason === 'max_tokens') {
    return { ok: false, error: 'Antwort wurde abgeschnitten (max_tokens).', usage, costUsd };
  }
  const raw = message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text || '')
    .join('');
  try {
    return { ok: true, data: JSON.parse(raw), usage, costUsd };
  } catch {
    return { ok: false, error: 'Antwort war kein gültiges JSON.', usage, costUsd };
  }
}

/** Sofort-Aufruf: eine Aufgabe, ein Ergebnis. */
export async function runNow(body: Record<string, unknown>): Promise<AiResult & Selection> {
  const sel = parseSelection(body);
  const params = buildRequestParams(sel.task, sel.model, body.input, sel.effort);
  const c = getClient();
  checkThrottle();
  const message = await c.messages.stream(params).finalMessage();
  return { ...sel, ...parseMessage(message, sel.model, false) };
}

/** Batch anlegen: viele Eingaben, ein Modell, 50 % Rabatt. */
export async function createBatch(body: Record<string, unknown>) {
  const sel = parseSelection(body);
  const items = body.items;
  if (!Array.isArray(items) || items.length === 0) throw inputError('items fehlt');
  if (items.length > MAX_BATCH_ITEMS) {
    throw inputError(`Zu viele Einträge (max. ${MAX_BATCH_ITEMS})`);
  }
  const requests = items.map((input, idx) => ({
    custom_id: `${sel.task}-${idx}`,
    params: buildRequestParams(sel.task, sel.model, input, sel.effort),
  }));
  const c = getClient();
  checkThrottle();
  const batch = await c.messages.batches.create({ requests });
  return { ...sel, id: batch.id, count: requests.length, status: batch.processing_status };
}

function checkBatchId(id: unknown): string {
  if (typeof id !== 'string' || !BATCH_ID.test(id)) throw inputError('Ungültige Batch-ID');
  return id;
}

/** Status eines Batches (Fortschritt in `counts`). */
export async function batchStatus(id: unknown) {
  const batchId = checkBatchId(id);
  const b = await getClient().messages.batches.retrieve(batchId);
  return { id: b.id, status: b.processing_status, counts: b.request_counts };
}

/** Ergebnisse eines beendeten Batches, je Eintrag mit Kostenschätzung. */
export async function batchResults(id: unknown, model: unknown) {
  if (!isModelId(model)) throw inputError('Unbekanntes Modell');
  const batchId = checkBatchId(id);
  const c = getClient();
  const out: Array<AiResult & { customId: string }> = [];
  let total = 0;
  for await (const line of await c.messages.batches.results(batchId)) {
    if (line.result.type === 'succeeded') {
      const r = parseMessage(line.result.message, model, true);
      total += r.costUsd || 0;
      out.push({ customId: line.custom_id, ...r });
    } else {
      out.push({
        customId: line.custom_id,
        ok: false,
        error: `Batch-Ergebnis: ${line.result.type}`,
      });
    }
  }
  return { id: batchId, results: out, totalCostUsd: Math.round(total * 1e6) / 1e6 };
}

/** Batch abbrechen. */
export async function cancelBatch(id: unknown) {
  const batchId = checkBatchId(id);
  const b = await getClient().messages.batches.cancel(batchId);
  return { id: b.id, status: b.processing_status };
}
