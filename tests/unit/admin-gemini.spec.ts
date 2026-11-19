/** Gemini-Bilder: Eingabeprüfung, Antwort-Auslesen, Aufruf (fetch gemockt). */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { config } from '../../server/admin/src/config.js';
import { resetThrottle } from '../../server/admin/src/ai.js';
import {
  DEFAULT_IMAGE_MODEL,
  extractImage,
  generateImage,
  geminiConfig,
  parseImageRequest,
  sniffMime,
} from '../../server/admin/src/gemini.js';

const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

describe('gemini', () => {
  beforeEach(() => {
    resetThrottle();
    config.geminiApiKey = 'test-key';
  });
  afterEach(() => {
    config.geminiApiKey = '';
    vi.unstubAllGlobals();
  });

  it('prüft Eingaben gegen Allow-Lists', () => {
    expect(() => parseImageRequest({})).toThrow(/prompt fehlt/);
    expect(() => parseImageRequest({ prompt: 'x', model: 'foo' })).toThrow(/Modell/);
    expect(() => parseImageRequest({ prompt: 'x', aspectRatio: '7:3' })).toThrow(/Seitenverh/);
    expect(() =>
      parseImageRequest({ prompt: 'x', model: 'gemini-3.1-flash-lite-image', size: '4K' }),
    ).toThrow(/Größe/);
    expect(() => parseImageRequest({ prompt: 'x'.repeat(5000) })).toThrow(/zu lang/);
    expect(parseImageRequest({ prompt: ' Hallo ' })).toEqual({
      prompt: 'Hallo',
      model: DEFAULT_IMAGE_MODEL,
      aspectRatio: '1:1',
      size: '1K',
    });
  });

  it('liest Bilddaten aus output_image oder steps und erkennt den Typ', () => {
    expect(extractImage({ output_image: { data: 'AAA' } })).toBe('AAA');
    expect(
      extractImage({ steps: [{ content: [{ type: 'text' }, { type: 'image', data: 'BBB' }] }] }),
    ).toBe('BBB');
    expect(extractImage({ output_text: 'nur Text' })).toBeNull();
    expect(sniffMime(PNG)).toBe('image/png');
    expect(sniffMime(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(sniffMime(Buffer.from('nope'))).toBeNull();
  });

  it('config nennt Modelle, Schlüssel-Status ohne den Schlüssel', () => {
    const c = geminiConfig();
    expect(c.configured).toBe(true);
    expect(JSON.stringify(c)).not.toContain('test-key');
    expect(c.models.length).toBeGreaterThan(1);
  });

  it('ruft die API mit Schlüssel-Header auf und liefert Bild + bekannte Kosten', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ output_image: { data: PNG.toString('base64') } }),
    }));
    vi.stubGlobal('fetch', fetchMock);
    const r = await generateImage({
      prompt: 'Test',
      model: 'gemini-3.1-flash-image',
      aspectRatio: '16:9',
      size: '2K',
    });
    expect(r).toMatchObject({ ok: true, mime: 'image/png', costUsd: 0.101 });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain('/v1beta/interactions');
    expect((init.headers as Record<string, string>)['x-goog-api-key']).toBe('test-key');
    expect(JSON.parse(String(init.body)).response_format).toEqual({
      type: 'image',
      aspect_ratio: '16:9',
      image_size: '2K',
    });
  });

  it('Fehlerfälle: kein Schlüssel, API-Fehler, keine Bilddaten', async () => {
    config.geminiApiKey = '';
    await expect(generateImage({ prompt: 'x' })).rejects.toThrow(/GEMINI_API_KEY/);
    config.geminiApiKey = 'k';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'bad' } }),
      })),
    );
    await expect(generateImage({ prompt: 'x' })).rejects.toThrow(/Gemini-Fehler 400: bad/);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ output_text: 'nein' }) })),
    );
    await expect(generateImage({ prompt: 'x' })).rejects.toThrow(/kein Bild/);
  });
});
