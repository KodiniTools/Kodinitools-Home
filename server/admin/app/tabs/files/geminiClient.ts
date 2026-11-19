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

export interface CompressResult {
  file: File;
  before: number;
  after: number;
  /** false = Original beibehalten (Browser kann es nicht, nicht kleiner, Fehler). */
  compressed: boolean;
}

/**
 * Verkleinert ein Bild im Browser: Breite auf `maxWidth` begrenzen (nie vergrößern),
 * als WebP neu kodieren (Transparenz bleibt erhalten). Ist das Ergebnis nicht kleiner
 * oder geht etwas schief, kommt das Original unverändert zurück.
 */
export async function compressImage(
  file: File,
  opts: { maxWidth?: number; quality?: number } = {},
): Promise<CompressResult> {
  const keep: CompressResult = { file, before: file.size, after: file.size, compressed: false };
  const maxWidth = opts.maxWidth ?? 1920;
  const quality = opts.quality ?? 0.82;
  try {
    const bmp = await createImageBitmap(file);
    try {
      const scale = Math.min(1, maxWidth / bmp.width);
      const w = Math.max(1, Math.round(bmp.width * scale));
      const h = Math.max(1, Math.round(bmp.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return keep;
      ctx.drawImage(bmp, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, 'image/webp', quality),
      );
      // Manche Browser liefern bei fehlender WebP-Unterstützung PNG zurück.
      if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return keep;
      const name = file.name.replace(/\.[a-z0-9]+$/i, '') + '.webp';
      return {
        file: new File([blob], name, { type: 'image/webp' }),
        before: file.size,
        after: blob.size,
        compressed: true,
      };
    } finally {
      bmp.close();
    }
  } catch {
    return keep;
  }
}
