import { apiGet, apiPost } from '../../lib/api';

/** Antwort von GET /api/ai/config. */
export interface AiConfig {
  configured: boolean;
  defaultModel: string;
  maxBatchItems: number;
  models: { id: string; label: string; hint: string }[];
  tasks: { id: AiTask; label: string; effort: string }[];
}

export type AiTask = 'seo' | 'compare' | 'blog' | 'alt' | 'card' | 'ticker' | 'icon';

/** Aufgaben, die das Panel im Tab „Texte“ anbietet (die übrigen haben eigene Stellen). */
export const PANEL_TASKS: readonly AiTask[] = ['seo', 'compare', 'blog'];
export type AiEffort = 'low' | 'medium' | 'high';

/** Ein Ergebnis (Sofort-Aufruf oder Eintrag eines Batches). */
export interface AiResult {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: string;
  costUsd?: number;
  customId?: string;
}

export const BLOCK_SEPARATOR = /^\s*---\s*$/m;
const PAIR_SEPARATOR = /^\s*===\s*$/m;

/** Aufgaben-Eingabe wie vom Server erwartet (`input`). */
export type AiInput = Record<string, string>;

/**
 * Zerlegt die Batch-Eingabe in einzelne Aufgaben. Einträge trennt eine Zeile
 * `---`. SEO: erste Zeile = Seitenname, Rest = Seitentext. Vergleich: deutscher
 * und englischer Text getrennt durch eine Zeile `===`. Blog: ein Thema je Eintrag.
 * Leere Einträge entfallen; ein Fehler nennt die laufende Nummer.
 */
export function parseBatchBlocks(task: AiTask, lang: 'de' | 'en', raw: string): AiInput[] {
  const blocks = raw
    .split(BLOCK_SEPARATOR)
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks.map((block, i): AiInput => {
    const n = i + 1;
    if (task === 'seo') {
      const nl = block.indexOf('\n');
      const page = (nl < 0 ? block : block.slice(0, nl)).trim();
      const text = nl < 0 ? '' : block.slice(nl + 1).trim();
      if (!page || !text) throw new Error(`Eintrag ${n}: Zeile 1 = Seitenname, danach der Text`);
      return { lang, page, text };
    }
    if (task === 'compare') {
      const parts = block.split(PAIR_SEPARATOR).map((p) => p.trim());
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error(`Eintrag ${n}: deutscher und englischer Text mit einer Zeile === trennen`);
      }
      return { de: parts[0], en: parts[1] };
    }
    if (task === 'alt') return { path: block };
    if (task !== 'blog') throw new Error('Batch wird für diese Aufgabe nicht angeboten');
    return { lang, topic: block };
  });
}

/** Kosten als kurzer Text, z. B. „0,05 $“ oder „< 0,01 $“. */
export function formatUsd(v: number | undefined): string {
  if (v === undefined) return '–';
  if (v > 0 && v < 0.01) return '< 0,01 $';
  return `${v.toFixed(2).replace('.', ',')} $`;
}

/** Ergebnis als kopierbarer Text. */
export function resultToText(task: AiTask, data: Record<string, unknown> | undefined): string {
  if (!data) return '';
  const s = (k: string) => String(data[k] ?? '');
  if (task === 'seo') {
    const kw = Array.isArray(data.keywords) ? data.keywords.join(', ') : '';
    return `Titel: ${s('title')}\nBeschreibung: ${s('description')}\nH1: ${s('h1')}\nKeywords: ${kw}\nBegründung: ${s('reasoning')}`;
  }
  if (task === 'compare') {
    const issues = Array.isArray(data.issues) ? (data.issues as Record<string, string>[]) : [];
    const list = issues
      .map(
        (x, i) =>
          `${i + 1}. DE: ${x.de}\n   EN: ${x.en}\n   Problem: ${x.problem}\n   Vorschlag: ${x.suggestion}`,
      )
      .join('\n');
    return `${s('verdict')}\n${list}`.trim();
  }
  if (task === 'card') {
    return `Titel: ${s('title')}\nBadge: ${s('badge')}\nBeschreibung: ${s('description')}\nHinweise: ${s('notes')}`;
  }
  if (task === 'ticker') {
    const items = Array.isArray(data.items) ? (data.items as string[]) : [];
    return `${items.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n${s('notes')}`.trim();
  }
  if (task === 'icon') {
    const terms = Array.isArray(data.terms) ? (data.terms as string[]) : [];
    return `${terms.join(', ')}\n${s('reasoning')}`.trim();
  }
  if (task === 'alt') {
    return `Alt DE: ${s('altDe')}\nAlt EN: ${s('altEn')}\nDateiname: ${s('filename')}${data.decorative ? '\n(dekorativ)' : ''}`;
  }
  return `# ${s('title')}\n\n${s('summary')}\n\n${s('markdown')}`;
}

const errText = (data: unknown, status: number): string =>
  (data && typeof data === 'object' && 'error' in data
    ? String((data as { error: unknown }).error)
    : '') || (status === 0 ? 'Server nicht erreichbar' : `Fehler ${status}`);

type Call<T> = { ok: true; data: T } | { ok: false; error: string };

async function wrap<T>(
  p: Promise<{ ok: boolean; status: number; data: unknown }>,
): Promise<Call<T>> {
  const r = await p;
  return r.ok ? { ok: true, data: r.data as T } : { ok: false, error: errText(r.data, r.status) };
}

export interface Selection {
  task: AiTask;
  model: string;
  effort: AiEffort;
}

export const fetchAiConfig = () => wrap<AiConfig>(apiGet('/ai/config'));
export const runAi = (sel: Selection, input: AiInput) =>
  wrap<AiResult & Selection>(apiPost('/ai/run', { ...sel, input }));
export const createAiBatch = (sel: Selection, items: AiInput[]) =>
  wrap<{ id: string; count: number; status: string }>(apiPost('/ai/batch', { ...sel, items }));
export const getAiBatch = (id: string) =>
  wrap<{
    id: string;
    status: 'in_progress' | 'canceling' | 'ended';
    counts: Record<string, number>;
  }>(apiGet(`/ai/batch?id=${encodeURIComponent(id)}`));
export const getAiBatchResults = (id: string, model: string) =>
  wrap<{ id: string; results: AiResult[]; totalCostUsd: number }>(
    apiGet(`/ai/batch/results?id=${encodeURIComponent(id)}&model=${encodeURIComponent(model)}`),
  );
export const cancelAiBatch = (id: string) =>
  wrap<{ id: string; status: string }>(apiPost('/ai/batch/cancel', { id }));
