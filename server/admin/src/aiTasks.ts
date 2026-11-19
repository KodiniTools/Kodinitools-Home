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

export type TaskId =
  | 'seo'
  | 'compare'
  | 'blog'
  | 'alt'
  | 'card'
  | 'ticker'
  | 'icon'
  | 'design'
  | 'imageprompt'
  | 'slottext';

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
  card: {
    id: 'card',
    label: 'Text einer Tool-Karte verbessern',
    effort: 'medium',
    maxTokens: 3000,
    system:
      SITE_CONTEXT +
      ' Aufgabe: Verbessere Titel, Badge und Beschreibung einer Tool-Karte auf der Startseite. ' +
      'Titel: kurz, höchstens zwei Zeilen. Badge: ein kurzes Etikett (höchstens 14 Zeichen) oder leer. ' +
      'Beschreibung: ein bis zwei Sätze, höchstens 170 Zeichen, sagt was das Tool tut. ' +
      'Verwende nur Fakten aus der bisherigen Karte und den „Fakten zum Tool“ (diese sind verbindlich). ' +
      'Widerspricht die bisherige Karte den Fakten, korrigiere sie und nenne das in notes. ' +
      'Ohne Fakten verbesserst du nur Stil und Länge und erfindest nichts.',
    schema: {
      type: 'object',
      properties: { title: STR, badge: STR, description: STR, notes: STR },
      required: ['title', 'badge', 'description', 'notes'],
      additionalProperties: false,
    },
  },
  ticker: {
    id: 'ticker',
    label: 'Laufband-Meldungen vorschlagen',
    effort: 'low',
    maxTokens: 3000,
    system:
      SITE_CONTEXT +
      ' Aufgabe: Schlage Meldungen für das Laufband auf der Startseite vor (einzeilig, jeweils höchstens ' +
      '140 Zeichen, in der angegebenen Sprache). Erfinde keine Neuigkeiten, Preise, Zahlen oder Funktionen: ' +
      'verwende nur das, was in den Hinweisen oder den bisherigen Meldungen steht. Ohne Hinweise formuliere ' +
      'nur die bisherigen Meldungen besser. Nenne Unsicherheiten in notes.',
    schema: {
      type: 'object',
      properties: { items: { type: 'array', items: STR }, notes: STR },
      required: ['items', 'notes'],
      additionalProperties: false,
    },
  },
  icon: {
    id: 'icon',
    label: 'Icon-Suchbegriffe für ein Tool',
    effort: 'low',
    maxTokens: 1500,
    system:
      SITE_CONTEXT +
      ' Aufgabe: Nenne sechs englische Suchbegriffe für passende Font-Awesome-Icons zum Tool ' +
      '(einzelne Wörter, Kleinbuchstaben, ggf. mit Bindestrich wie „file-audio“; nach Passung geordnet).',
    schema: {
      type: 'object',
      properties: { terms: { type: 'array', items: STR }, reasoning: STR },
      required: ['terms', 'reasoning'],
      additionalProperties: false,
    },
  },
  design: {
    id: 'design',
    label: 'Design-Beratung (Hero, Hintergrund, Layout, Tool-Karten)',
    effort: 'medium',
    maxTokens: 5000,
    system:
      SITE_CONTEXT +
      ' Aufgabe: Berate zum Design eines Bereichs der Startseite (Hero-Design, Seiten-Hintergrund, Hero-Layout oder Tool-Karten-Design). ' +
      'Du bekommst die aktuellen Einstellungen als JSON und ein Ziel. Gib 3 bis 5 konkrete Vorschläge, jeweils mit Begründung ' +
      'und einem Hinweis, welche Einstellung im Admin zu ändern ist. Beachte Lesbarkeit (Kontrast WCAG AA), ' +
      'Mobil-Performance (keine schweren Bilder, keine Animationen über dem Falz, kein Einblenden der ganzen Seite) und ' +
      'Hell/Dunkel-Modus. Farben als Hex-Werte (#rrggbb). imagePrompt nur, wenn ein Bild sinnvoll ist: englischer ' +
      'Prompt für einen Bildgenerator, ohne Text im Bild, sonst leerer String. Erfinde keine Einstellungen, die es nicht gibt. ' +
      'changes: nur bei Bereich hero, layout, toolcards oder background konkrete, direkt anwendbare Änderungen, höchstens 8. ' +
      'Layout, nur diese Felder (mode „both“): ' +
      'text (Banner-Text, höchstens 120 Zeichen, ohne HTML, in der Sprache des Tabs; nur wenn heroBannerText leer ist und eine kurze Aussage sinnvoll ist; erfinde keine Fakten), ' +
      'bannerLink (interner Pfad wie /de/… bzw. /en/… oder https-Adresse, nur wenn du das Ziel aus den Einstellungen sicher kennst, sonst als Vorschlag ohne change), ' +
      'textAnim (none, pulse, float, shake, wobble, glow), textAnimSpeed (slow, normal, fast), textAnimIntensity (1 bis 10), textSize (px, 0 bis 96, 0 = automatisch), textOpacity (0 bis 100), textColor (#rrggbb). ' +
      'Banner-Text-Stilfelder wirken nur, wenn heroBannerText nicht leer ist. ' +
      'Hero, nur diese Felder: ' +
      'Schriftgrößen in px (8 bis 96, „0“ = Standard), mode „both“: titleFontSize, subtitleFontSize, chipFontSize, ctaFontSize; ' +
      'Anzeigen mit value „true“ oder „false“, mode „both“: showTitle, showSubtitle, showChips, showCta, und „chip:<Schlüssel>“ (Schlüssel aus hiddenChips, blendet einen einzelnen Chip ein oder aus); ' +
      'Farben als #rrggbb mit mode „light“ oder „dark“: titleTextColor, chipTextColor, chipBgColor, ctaTextColor, ctaBgColor, bgColor, borderColor; ' +
      'Prozent 0 bis 100 mit mode „light“ oder „dark“: bgOpacity, bgImageDarken. value immer als Text. ' +
      'Tool-Karten (toolcards; JSON = gerade bearbeitetes Karten-Design mit light/dark/text/show; ändert nur dieses Design), nur diese Felder: ' +
      'Farben als #rrggbb mit mode „light“ oder „dark“: borderColor, bgColor, titleColor, badgeColor, badgeBgColor, openColor, descColor; ' +
      'Prozent 0 bis 100 mit mode „light“ oder „dark“: bgOpacity, borderOpacity; mode „light“ oder „dark“: borderWidth (px 0 bis 8), borderRadius (px 0 bis 40); ' +
      'Schriftgrößen in px, mode „both“: titleSize (0 bis 40), descSize (0 bis 24), badgeSize (0 bis 20), openSize (0 bis 20), „0“ = Standard. Beachte Kontrast zwischen Text- und Hintergrundfarbe der Karte. ' +
      'Hintergrund (background; JSON = light/dark Seiten-Hintergrund, sectionStyle, sectionGap, fx), nur diese Felder: ' +
      'je mode „light“ oder „dark“: color, color2, patternColor (#rrggbb), opacity, patternOpacity, imageDarken, imageOpacity (0 bis 100), angle (0 bis 360), patternSpacing (4 bis 200), patternThickness (1 bis 6), imageBlur (0 bis 40), gradient (true/false), type (linear, radial), pattern (none, dots, grid, cross, diagonal, diamond, triangles, waves, blueprint); ' +
      'mode „both“: sectionStyle (band, card), sectionGap (px 0 bis 160), fxAurora, fxNoise, fxSpotlight (true/false), fxAuroraIntensity, fxNoiseIntensity, fxSpotlightIntensity (0 bis 100). ' +
      'Bilder wählst du nie aus. Die Seite soll mobil leicht bleiben: wenig Effekte, kein starkes Muster. ' +
      'Alt-Texte (imageAlt) setzt du nicht per change: verweise darauf, dass sie im Tab Dateien mit der KI-Alt-Text-Hilfe entstehen. ' +
      'Schlage nur Änderungen vor, die aus den gelieferten Einstellungen begründet sind; why: ein kurzer deutscher Satz.',
    schema: {
      type: 'object',
      properties: {
        summary: STR,
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: { title: STR, why: STR, how: STR },
            required: ['title', 'why', 'how'],
            additionalProperties: false,
          },
        },
        colors: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: STR, hex: STR, use: STR },
            required: ['name', 'hex', 'use'],
            additionalProperties: false,
          },
        },
        imagePrompt: STR,
        changes: {
          type: 'array',
          items: {
            type: 'object',
            properties: { field: STR, mode: STR, value: STR, why: STR },
            required: ['field', 'mode', 'value', 'why'],
            additionalProperties: false,
          },
        },
      },
      required: ['summary', 'suggestions', 'colors', 'imagePrompt', 'changes'],
      additionalProperties: false,
    },
  },
  imageprompt: {
    id: 'imageprompt',
    label: 'Bild-Prompt für Gemini',
    effort: 'low',
    maxTokens: 1500,
    system:
      SITE_CONTEXT +
      ' Aufgabe: Mache aus einer groben Idee einen guten Prompt für einen Bildgenerator (Google Gemini). ' +
      'Der Prompt ist englisch, konkret und beschreibend (Motiv, Stil, Licht, Farben, Perspektive, Stimmung), ' +
      'in ganzen Sätzen statt Stichwortlisten. Das Bild enthält keinen Text und keine Logos oder Markennamen. ' +
      'Beachte den Verwendungszweck (z. B. Hero-Banner: ruhige Fläche für Text, wenig Details am Rand; ' +
      'Hintergrund: dezent, kachelbar nicht nötig, geringer Kontrast) und das Seitenverhältnis. ' +
      'Erfinde keine Motive, die der Idee widersprechen. notes: ein deutscher Satz, was du ergänzt hast.',
    schema: {
      type: 'object',
      properties: { prompt: STR, notes: STR },
      required: ['prompt', 'notes'],
      additionalProperties: false,
    },
  },
  slottext: {
    id: 'slottext',
    label: 'Abschnitts-Titel der Startseite verbessern',
    effort: 'low',
    maxTokens: 2000,
    system:
      SITE_CONTEXT +
      ' Aufgabe: Verbessere die Titel der Abschnitte auf der Startseite (z. B. „Audio-Tools“). ' +
      'Du bekommst je Abschnitt Schlüssel, Bezeichnung und den aktuellen Titel. Gib je Schlüssel genau einen Titel zurück: ' +
      'kurz (höchstens 40 Zeichen), klar, ohne HTML und ohne Anführungszeichen, in der angegebenen Sprache, ' +
      'im gleichen Stil für alle Abschnitte. Ist ein Titel schon gut, gib ihn unverändert zurück. ' +
      'Erfinde keine Funktionen. Nenne Besonderheiten in notes.',
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: { key: STR, text: STR },
            required: ['key', 'text'],
            additionalProperties: false,
          },
        },
        notes: STR,
      },
      required: ['items', 'notes'],
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
    case 'card':
      return [
        `Sprache: ${lang(i.lang)}`,
        `Titel: ${text(i.title, 'title')}`,
        i.badge ? `Badge: ${text(i.badge, 'badge', false)}` : 'Badge: (keins)',
        `Beschreibung: ${text(i.description, 'description')}`,
        i.facts ? `Fakten zum Tool (verbindlich):\n${text(i.facts, 'facts', false)}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    case 'ticker': {
      if (!i.hints && !i.current) throw inputError('hints oder current fehlt');
      return [
        `Sprache: ${lang(i.lang)}`,
        `Anzahl Vorschläge: ${Math.max(1, Math.min(10, Number(i.count) || 3))}`,
        i.hints ? `Hinweise:\n${text(i.hints, 'hints', false)}` : '',
        i.current ? `Bisherige Meldungen:\n${text(i.current, 'current', false)}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }
    case 'icon':
      return [
        `Tool: ${text(i.title, 'title')}`,
        i.description ? `Beschreibung: ${text(i.description, 'description', false)}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    case 'design': {
      const area = String(i.area ?? '');
      if (!['hero', 'background', 'layout', 'toolcards'].includes(area))
        throw inputError('area ungültig');
      return [
        `Bereich: ${area}`,
        i.lang === 'de' || i.lang === 'en' ? `Sprache des Tabs: ${i.lang}` : '',
        `Ziel: ${text(i.goal, 'goal', false) || 'Allgemein verbessern'}`,
        `Aktuelle Einstellungen (JSON):\n${text(i.current, 'current')}`,
      ]
        .filter(Boolean)
        .join('\n');
    }
    case 'slottext': {
      let slots: unknown;
      try {
        slots = JSON.parse(text(i.slots, 'slots'));
      } catch (e) {
        if ((e as { statusCode?: number }).statusCode) throw e;
        throw inputError('slots ungültig');
      }
      if (!Array.isArray(slots)) throw inputError('slots ungültig');
      if (!slots.length || slots.length > 10) throw inputError('slots ungültig');
      const lines = slots.map((x) => {
        const o = (x ?? {}) as Record<string, unknown>;
        const one = (v: unknown, n: string) => {
          if (typeof v !== 'string' || v.length > 300) throw inputError(`${n} ungültig`);
          return v.replace(/\s+/g, ' ').trim();
        };
        return `- Schlüssel ${one(o.key, 'key')} | ${one(o.label, 'label')} | aktuell: „${one(o.current, 'current')}“`;
      });
      return [
        `Sprache: ${lang(i.lang)}`,
        `Abschnitte:\n${lines.join('\n')}`,
        i.hints ? `Hinweise:\n${text(i.hints, 'hints', false)}` : '',
      ]
        .filter(Boolean)
        .join('\n');
    }
    case 'imageprompt':
      return [
        `Idee: ${text(i.idea, 'idea')}`,
        i.purpose ? `Verwendungszweck: ${text(i.purpose, 'purpose', false)}` : '',
        i.aspectRatio ? `Seitenverhältnis: ${text(i.aspectRatio, 'aspectRatio', false)}` : '',
      ]
        .filter(Boolean)
        .join('\n');
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
