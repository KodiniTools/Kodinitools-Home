/**
 * Bilder per Google Gemini API (Nano-Banana-Modelle). Schlüssel nur per Umgebung
 * (`GEMINI_API_KEY`). Anfrage nach ai.google.dev/gemini-api/docs/image-generation
 * (Stand 19.11.2026): POST /v1beta/interactions, Header `x-goog-api-key`, Body
 * `{ model, input:[{type:'text',text}], response_format:{type:'image', aspect_ratio, image_size} }`,
 * Antwort `output_image.data` (Base64) bzw. Bild-Block in `steps`.
 * Die Antwortform ist in der Doku nur als Code-Beispiel belegt, daher liest `extractImage`
 * tolerant und erkennt den Bildtyp an den Magic Bytes.
 * Prompts und Bilder gehen an Google (USA).
 */
import { config } from './config.js';
import { checkThrottle } from './ai.js';

export const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
export const GEMINI_TIMEOUT_MS = 120_000;
export const MAX_PROMPT = 4000;

export interface ImageModel {
  id: string;
  label: string;
  hint: string;
  sizes: readonly string[];
  /** Preis pro Bild in USD je Größe laut Google-Preisseite; fehlt = nicht belegt. */
  usd?: Record<string, number>;
}

export const IMAGE_MODELS: readonly ImageModel[] = [
  {
    id: 'gemini-nano-banana-2.1',
    label: 'Nano Banana 2.1',
    hint: 'Standard, laut Google empfohlen für neue Projekte',
    sizes: ['1K', '2K', '4K'],
  },
  {
    id: 'gemini-3.1-flash-lite-image',
    label: 'Nano Banana 2 Lite',
    hint: 'Schnellstes und günstigstes Modell, nur 1K',
    sizes: ['1K'],
  },
  {
    id: 'gemini-3.1-flash-image',
    label: 'Nano Banana 2',
    hint: 'Vorgängergeneration',
    sizes: ['1K', '2K', '4K'],
    usd: { '1K': 0.067, '2K': 0.101, '4K': 0.151 },
  },
  {
    id: 'gemini-3-pro-image',
    label: 'Nano Banana Pro',
    hint: 'Premium für komplexe Motive',
    sizes: ['1K', '2K', '4K'],
    usd: { '1K': 0.134, '2K': 0.134, '4K': 0.24 },
  },
];
export const DEFAULT_IMAGE_MODEL = IMAGE_MODELS[0]!.id;
export const ASPECT_RATIOS = [
  '1:1',
  '3:2',
  '2:3',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '9:16',
  '16:9',
  '21:9',
] as const;

export function geminiConfig() {
  return {
    configured: Boolean(config.geminiApiKey),
    defaultModel: DEFAULT_IMAGE_MODEL,
    models: IMAGE_MODELS,
    aspectRatios: ASPECT_RATIOS,
  };
}

const err = (msg: string, statusCode: number) => Object.assign(new Error(msg), { statusCode });

export interface ImageRequest {
  prompt: string;
  model: string;
  aspectRatio: string;
  size: string;
}

/** Prüft die Eingabe gegen die Allow-Lists (Fehler 400). */
export function parseImageRequest(body: unknown): ImageRequest {
  if (!body || typeof body !== 'object') throw err('Ungültiger Body', 400);
  const b = body as Record<string, unknown>;
  const prompt = typeof b.prompt === 'string' ? b.prompt.trim() : '';
  if (!prompt) throw err('prompt fehlt', 400);
  if (prompt.length > MAX_PROMPT) throw err(`prompt ist zu lang (max. ${MAX_PROMPT} Zeichen)`, 400);
  const model = typeof b.model === 'string' && b.model ? b.model : DEFAULT_IMAGE_MODEL;
  const def = IMAGE_MODELS.find((m) => m.id === model);
  if (!def) throw err('Unbekanntes Bild-Modell', 400);
  const aspectRatio = typeof b.aspectRatio === 'string' && b.aspectRatio ? b.aspectRatio : '1:1';
  if (!(ASPECT_RATIOS as readonly string[]).includes(aspectRatio))
    throw err('Ungültiges Seitenverhältnis', 400);
  const size = typeof b.size === 'string' && b.size ? b.size : '1K';
  if (!def.sizes.includes(size)) throw err(`Größe ${size} gibt es für dieses Modell nicht`, 400);
  return { prompt, model, aspectRatio, size };
}

/** Bildtyp aus den ersten Bytes (die Doku nennt in der Antwort keinen MIME-Typ). */
export function sniffMime(buf: Buffer): string | null {
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return 'image/png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (
    buf.length > 12 &&
    buf.subarray(0, 4).toString('latin1') === 'RIFF' &&
    buf.subarray(8, 12).toString('latin1') === 'WEBP'
  )
    return 'image/webp';
  return null;
}

/** Sucht Base64-Bilddaten in der Antwort: `output_image.data` oder Bild-Block in `steps`. */
export function extractImage(json: unknown): string | null {
  if (!json || typeof json !== 'object') return null;
  const j = json as Record<string, unknown>;
  const direct = (j.output_image as { data?: unknown } | undefined)?.data;
  if (typeof direct === 'string' && direct) return direct;
  const steps = Array.isArray(j.steps) ? j.steps : [];
  for (const s of steps) {
    const content = (s as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const c of content) {
      const cc = c as { type?: unknown; data?: unknown };
      if (cc?.type === 'image' && typeof cc.data === 'string' && cc.data) return cc.data;
    }
  }
  return null;
}

export interface ImageResult {
  ok: true;
  model: string;
  mime: string;
  data: string;
  bytes: number;
  costUsd?: number;
}

/** Erzeugt ein Bild (kostet Geld: ein Aufruf = ein Bild). */
export async function generateImage(body: unknown): Promise<ImageResult> {
  if (!config.geminiApiKey) throw err('Auf dem Server fehlt GEMINI_API_KEY', 503);
  const req = parseImageRequest(body);
  checkThrottle();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), GEMINI_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'x-goog-api-key': config.geminiApiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: req.model,
        input: [{ type: 'text', text: req.prompt }],
        response_format: {
          type: 'image',
          aspect_ratio: req.aspectRatio,
          image_size: req.size,
        },
      }),
      signal: ctrl.signal,
    });
  } catch (e) {
    throw err(
      e instanceof Error && e.name === 'AbortError'
        ? 'Gemini antwortet nicht (Zeitüberschreitung)'
        : 'Gemini nicht erreichbar',
      504,
    );
  } finally {
    clearTimeout(timer);
  }
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* Fehlerantwort ohne JSON */
  }
  if (!res.ok) {
    const m = (json as { error?: { message?: unknown } } | null)?.error?.message;
    throw err(
      `Gemini-Fehler ${res.status}${typeof m === 'string' ? `: ${m.slice(0, 300)}` : ''}`,
      502,
    );
  }
  const b64 = extractImage(json);
  if (!b64) {
    throw err('Gemini lieferte kein Bild (Prompt evtl. abgelehnt oder Antwortform geändert)', 502);
  }
  const buf = Buffer.from(b64, 'base64');
  const mime = sniffMime(buf);
  if (!mime) throw err('Unbekanntes Bildformat in der Gemini-Antwort', 502);
  const costUsd = IMAGE_MODELS.find((m) => m.id === req.model)?.usd?.[req.size];
  return {
    ok: true,
    model: req.model,
    mime,
    data: buf.toString('base64'),
    bytes: buf.length,
    costUsd,
  };
}
