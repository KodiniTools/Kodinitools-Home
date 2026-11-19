// KI-Aufgaben des Admins: Modelle, Preise, Prompts, Ausgabe-Schemas und
// Kostenberechnung. Reine Funktionen ohne Netzwerk – gut testbar.

/** Modell-Kennungen, die der Admin anbietet (Allow-List). */
export type ModelId = 'claude-opus-5-5' | 'claude-sonnet-5-5' | 'claude-haiku-5-5';

export type ModelInfo = {
  id: ModelId;
  label: string;
  /** USD pro 1 Mio. Token */
  inputPerMTok: number;
  outputPerMTok: number;
  cacheReadPerMTok: number;
  /** Kurzer Hinweis für die Auswahl im Admin. */
  hint: string;
};

export const MODELS: ModelInfo[] = [
  {
    id: 'claude-opus-5-5',
    label: 'Opus 5.5',
    inputPerMTok: 4,
    outputPerMTok: 20,
    cacheReadPerMTok: 0.2,
    hint: 'Beste Textqualität, höchste Kosten',
  },
  {
    id: 'claude-sonnet-5-5',
    label: 'Sonnet 5.5',
    inputPerMTok: 2,
    outputPerMTok: 10,
    cacheReadPerMTok: 0.1,
    hint: 'Halbe Kosten, für die meisten Aufgaben ausreichend',
  },
  {
    id: 'claude-haiku-5-5',
    label: 'Haiku 5.5',
    inputPerMTok: 0.1,
    outputPerMTok: 0.5,
    cacheReadPerMTok: 0.01,
    hint: 'Sehr günstig, einfachere Texte',
  },
];

export const DEFAULT_MODEL: ModelId = 'claude-opus-5-5';

export function isModelId(v: unknown): v is ModelId {
  return typeof v === 'string' && MODELS.some((m) => m.id === v);
}

export type Effort = 'low' | 'medium' | 'high';
export function isEffort(v: unknown): v is Effort {
  return v === 'low' || v === 'medium' || v === 'high';
}

/** Token-Verbrauch einer Antwort (Teilmenge von `usage`). */
export type Usage = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
};

/**
 * Geschätzte Kosten in USD. Cache-Schreiben wird mit 1,25 × Input berechnet,
 * Batch-Aufrufe mit 50 %. Schätzung auf Basis der Listenpreise, keine Rechnung.
 */
export function estimateCostUsd(model: ModelId, usage: Usage, batch = false): number {
  const m = MODELS.find((x) => x.id === model);
  if (!m) return 0;
  const inTok = usage.input_tokens || 0;
  const outTok = usage.output_tokens || 0;
  const cacheRead = usage.cache_read_input_tokens || 0;
  const cacheWrite = usage.cache_creation_input_tokens || 0;
  const usd =
    (inTok * m.inputPerMTok +
      cacheWrite * m.inputPerMTok * 1.25 +
      cacheRead * m.cacheReadPerMTok +
      outTok * m.outputPerMTok) /
    1_000_000;
  return Math.round(usd * (batch ? 0.5 : 1) * 1e6) / 1e6;
}

export type TaskId = 'seo' | 'compare' | 'blog' | 'alt';

export type TaskDef = {
  id: TaskId;
  label: string;
  effort: Effort;
  maxTokens: number;
  system: string;
  schema: Record<string, unknown>;
};

const STR = { type: 'string' };
const SITE_CONTEXT =
  'Du arbeitest für kodinitools.com: kostenlose Browser-Tools für Audio, Bild und Video von KodiniTools. ' +
  'Die Seite ist zweisprachig (Deutsch/Englisch). Schreibe sachlich, konkret und ohne Marketing-Floskeln. ' +
  'Behaupte nichts, was aus dem gelieferten Text nicht hervorgeht (z. B. „ohne Upload“ nur, wenn der Text es sagt). ' +
  'Antworte ausschließlich im vorgegebenen JSON-Format.';

export const TASKS: Record<TaskId, TaskDef> = {
  seo: {
    id: 'seo',
    label: 'SEO-Vorschlag für eine Seite',
    effort: 'medium',
    maxTokens: 4000,
    system:
      SITE_CONTEXT +
      ' Aufgabe: Schlage Seitentitel (max. 60 Zeichen), Meta-Beschreibung (max. 155 Zeichen) und H1 vor, ' +
      'in der angegebenen Sprache. Ein Hauptkeyword pro Seite. Begründe kurz.',
    schema: {
      type: 'object',
      properties: {
        title: STR,
        description: STR,
        h1: STR,
        keywords: { type: 'array', items: STR },
        reasoning: STR,
      },
      required: ['title', 'description', 'h1', 'keywords', 'reasoning'],
      additionalProperties: false,
    },
  },
  compare: {
    id: 'compare',
    label: 'Vergleich Deutsch ↔ Englisch',
    effort: 'medium',
    maxTokens: 6000,
    system:
      SITE_CONTEXT +
      ' Aufgabe: Vergleiche den deutschen und den englischen Text. Finde inhaltliche Abweichungen, ' +
      'Übersetzungsfehler und unnatürliche Formulierungen. Gib je Fund einen Verbesserungsvorschlag.',
    schema: {
      type: 'object',
      properties: {
        verdict: STR,
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: { de: STR, en: STR, problem: STR, suggestion: STR },
            required: ['de', 'en', 'problem', 'suggestion'],
            additionalProperties: false,
          },
        },
      },
      required: ['verdict', 'issues'],
      additionalProperties: false,
    },
  },
  blog: {
    id: 'blog',
    label: 'Blog-Entwurf',
    effort: 'medium',
    maxTokens: 16000,
    system:
      SITE_CONTEXT +
      ' Aufgabe: Schreibe einen Blog-Entwurf (Markdown, mit Zwischenüberschriften) zum angegebenen Thema ' +
      'in der angegebenen Sprache. Der Entwurf wird vor Veröffentlichung von einem Menschen geprüft.',
    schema: {
      type: 'object',
      properties: { title: STR, summary: STR, markdown: STR },
      required: ['title', 'summary', 'markdown'],
      additionalProperties: false,
    },
  },
  alt: {
    id: 'alt',
    label: 'Alt-Text für ein Bild',
    effort: 'low',
    maxTokens: 2000,
    system:
      SITE_CONTEXT +
      ' Aufgabe: Schreibe Alt-Texte für das Bild, auf Deutsch und Englisch. Je maximal 125 Zeichen, ' +
      'beschreibe, was zu sehen ist und welche Funktion das Bild hat, ohne „Bild von“ oder „Foto von“. ' +
      'Ist das Bild rein dekorativ, setze decorative auf true. Schlage zusätzlich einen sprechenden ' +
      'Dateinamen vor (Kleinbuchstaben, Bindestriche, ohne Endung, max. 50 Zeichen).',
    schema: {
      type: 'object',
      properties: {
        decorative: { type: 'boolean' },
        altDe: STR,
        altEn: STR,
        filename: STR,
      },
      required: ['decorative', 'altDe', 'altEn', 'filename'],
      additionalProperties: false,
    },
  },
};

export function isTaskId(v: unknown): v is TaskId {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(TASKS, v);
}

/** Fehler mit HTTP-Status für die Routen. */
export function inputError(msg: string): Error & { statusCode: number } {
  return Object.assign(new Error(msg), { statusCode: 400 });
}

const MAX_TEXT = 30_000;

function text(v: unknown, name: string, required = true): string {
  if (v === undefined || v === null || v === '') {
    if (required) throw inputError(`${name} fehlt`);
    return '';
  }
  if (typeof v !== 'string') throw inputError(`${name} muss Text sein`);
  if (v.length > MAX_TEXT) throw inputError(`${name} ist zu lang (max. ${MAX_TEXT} Zeichen)`);
  return v;
}

function lang(v: unknown): 'de' | 'en' {
  if (v === 'de' || v === 'en') return v;
  throw inputError('lang muss "de" oder "en" sein');
}

/** Baut die Nutzer-Nachricht aus der Eingabe; wirft bei ungültigen Feldern (400). */
export function buildUserPrompt(task: TaskId, input: unknown): string {
  if (!input || typeof input !== 'object') throw inputError('input fehlt');
  const i = input as Record<string, unknown>;
  switch (task) {
    case 'seo': {
      const parts = [
        `Sprache: ${lang(i.lang)}`,
        `Seite: ${text(i.page, 'page')}`,
        i.keywords ? `Bevorzugte Keywords: ${text(i.keywords, 'keywords')}` : '',
        i.current ? `Aktuell: ${text(i.current, 'current')}` : '',
        `Seiteninhalt:\n${text(i.text, 'text')}`,
      ];
      return parts.filter(Boolean).join('\n');
    }
    case 'compare':
      return `Deutscher Text:\n${text(i.de, 'de')}\n\nEnglischer Text:\n${text(i.en, 'en')}`;
    case 'alt':
      return i.context
        ? `Verwendung des Bildes: ${text(i.context, 'context')}`
        : 'Beschreibe das Bild für einen Alt-Text.';
    case 'blog': {
      const parts = [
        `Sprache: ${lang(i.lang)}`,
        `Thema: ${text(i.topic, 'topic')}`,
        i.notes ? `Hinweise:\n${text(i.notes, 'notes', false)}` : '',
      ];
      return parts.filter(Boolean).join('\n');
    }
  }
}

/** Bild für Vision-Aufgaben (Base64). */
export type ImageData = {
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
  data: string;
};

/** Parameter einer Messages-Anfrage für eine Aufgabe (gleich für Sofort und Batch). */
export function buildRequestParams(
  task: TaskId,
  model: ModelId,
  input: unknown,
  effort?: Effort,
  image?: ImageData,
) {
  const def = TASKS[task];
  const prompt = buildUserPrompt(task, input);
  return {
    model,
    max_tokens: def.maxTokens,
    // Der feste Teil steht im System-Prompt und wird per Caching günstig wiederverwendet.
    system: [
      { type: 'text' as const, text: def.system, cache_control: { type: 'ephemeral' as const } },
    ],
    messages: [
      {
        role: 'user' as const,
        content: image
          ? [
              {
                type: 'image' as const,
                source: { type: 'base64' as const, media_type: image.mediaType, data: image.data },
              },
              { type: 'text' as const, text: prompt },
            ]
          : prompt,
      },
    ],
    output_config: {
      effort: effort ?? def.effort,
      format: { type: 'json_schema' as const, schema: def.schema },
    },
  };
}
