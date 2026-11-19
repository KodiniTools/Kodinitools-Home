import { apiGet, apiPost } from '../../lib/api';

export interface GeminiModel {
  id: string;
  label: string;
  hint: string;
  sizes: string[];
  usd?: Record<string, number>;
}
export interface GeminiConfig {
  configured: boolean;
  defaultModel: string;
  models: GeminiModel[];
  aspectRatios: string[];
}
export interface GeminiImage {
  ok: true;
  model: string;
  mime: string;
  /** Base64 der Originalbytes (keine Neukodierung). */
  data: string;
  bytes: number;
  costUsd?: number;
}
type Call<T> = { ok: true; data: T } | { ok: false; error: string };

const errText = (data: unknown, status: number): string =>
  (data && typeof data === 'object' && 'error' in data
    ? String((data as { error: unknown }).error)
    : '') || (status === 0 ? 'Server nicht erreichbar' : `Fehler ${status}`);

export async function fetchGeminiConfig(): Promise<Call<GeminiConfig>> {
  const r = await apiGet('/gemini/config');
  return r.ok
    ? { ok: true, data: r.data as GeminiConfig }
    : { ok: false, error: errText(r.data, r.status) };
}

export async function generateGeminiImage(req: {
  prompt: string;
  model: string;
  aspectRatio: string;
  size: string;
}): Promise<Call<GeminiImage>> {
  const r = await apiPost('/gemini/image', req);
  return r.ok
    ? { ok: true, data: r.data as GeminiImage }
    : { ok: false, error: errText(r.data, r.status) };
}

const EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

/** Originalbytes des Ergebnisses als Datei (für Download und „Zum Entwurf hinzufügen“). */
export function imageToFile(img: GeminiImage, stem = 'ki-bild'): File {
  const bin = atob(img.data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ext = EXT[img.mime] ?? 'png';
  return new File([bytes], `${stem}-${Date.now()}.${ext}`, { type: img.mime });
}
