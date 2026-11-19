/** KI-Modul des Admins: Auswahl, Prompts, Kosten, Schutz – ohne Netzwerk. */
import { describe, expect, it, beforeEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { config } from '../../server/admin/src/config.js';
import {
  MODELS,
  buildRequestParams,
  buildUserPrompt,
  estimateCostUsd,
  isModelId,
} from '../../server/admin/src/aiTasks.js';
import {
  aiConfig,
  checkThrottle,
  parseMessage,
  parseSelection,
  resetThrottle,
  batchStatus,
  loadUploadImage,
  MAX_IMAGE_BYTES,
} from '../../server/admin/src/ai.js';

describe('aiTasks', () => {
  it('lässt nur Modelle der Allow-List zu', () => {
    expect(isModelId('claude-sonnet-5-5')).toBe(true);
    expect(isModelId('gpt-4')).toBe(false);
    expect(MODELS.map((m) => m.id)).toEqual([
      'claude-opus-5-5',
      'claude-sonnet-5-5',
      'claude-haiku-5-5',
    ]);
  });

  it('schätzt Kosten, Batch halbiert', () => {
    const usage = { input_tokens: 1_000_000, output_tokens: 1_000_000 };
    expect(estimateCostUsd('claude-opus-5-5', usage)).toBe(24);
    expect(estimateCostUsd('claude-opus-5-5', usage, true)).toBe(12);
    expect(estimateCostUsd('claude-sonnet-5-5', usage)).toBe(12);
    expect(estimateCostUsd('claude-opus-5-5', { cache_read_input_tokens: 1_000_000 })).toBe(0.2);
    expect(estimateCostUsd('claude-opus-5-5', { cache_creation_input_tokens: 1_000_000 })).toBe(5);
  });

  it('prüft Eingaben je Aufgabe', () => {
    expect(() => buildUserPrompt('seo', { lang: 'de', page: 'Start' })).toThrow(/text fehlt/);
    expect(() => buildUserPrompt('seo', { lang: 'fr', page: 'a', text: 'b' })).toThrow(/lang/);
    expect(() => buildUserPrompt('compare', { de: 'x' })).toThrow(/en fehlt/);
    expect(() => buildUserPrompt('blog', null)).toThrow(/input fehlt/);
    expect(buildUserPrompt('compare', { de: 'Hallo', en: 'Hello' })).toContain('Hello');
  });

  it('prüft Eingaben der Aufgaben Karte, Laufband, Icon', () => {
    expect(() => buildUserPrompt('card', { lang: 'de', title: 'A' })).toThrow(/description/);
    const c = buildUserPrompt('card', {
      lang: 'de',
      title: 'Alarm',
      description: 'Wecker',
      facts: 'Erzeugt Alarmtöne',
    });
    expect(c).toContain('verbindlich');
    expect(c).toContain('Badge: (keins)');
    expect(() => buildUserPrompt('ticker', { lang: 'de' })).toThrow(/hints oder current/);
    expect(buildUserPrompt('ticker', { lang: 'en', hints: 'x', count: 99 })).toContain(
      'Anzahl Vorschläge: 10',
    );
    expect(() => buildUserPrompt('icon', {})).toThrow(/title/);
    expect(buildUserPrompt('icon', { title: 'Cutter' })).toContain('Tool: Cutter');
    for (const t of ['card', 'ticker', 'icon'] as const)
      expect(
        buildRequestParams(t, 'claude-haiku-5-5', {
          lang: 'de',
          title: 'T',
          description: 'D',
          hints: 'h',
        }).output_config.format.type,
      ).toBe('json_schema');
  });

  it('prüft Eingaben der Design-Beratung', () => {
    expect(() => buildUserPrompt('design', { area: 'x', current: '{}' })).toThrow(/area/);
    expect(() => buildUserPrompt('design', { area: 'hero' })).toThrow(/current/);
    const p = buildUserPrompt('design', { area: 'layout', current: '{"a":1}' });
    expect(p).toContain('Bereich: layout');
    expect(p).toContain('Allgemein verbessern');
  });

  it('prüft Eingaben des Bild-Prompts', () => {
    expect(() => buildUserPrompt('imageprompt', {})).toThrow(/idea/);
    const p = buildUserPrompt('imageprompt', {
      idea: 'blaue Wellen',
      purpose: 'Hero-Banner',
      aspectRatio: '16:9',
    });
    expect(p).toContain('Idee: blaue Wellen');
    expect(p).toContain('Seitenverhältnis: 16:9');
  });

  it('baut Anfrage mit Modell, Aufwand und JSON-Schema, ohne Sampling-Parameter', () => {
    const p = buildRequestParams(
      'seo',
      'claude-haiku-5-5',
      { lang: 'en', page: 'P', text: 'T' },
      'low',
    );
    expect(p.model).toBe('claude-haiku-5-5');
    expect(p.output_config.effort).toBe('low');
    expect(p.output_config.format.type).toBe('json_schema');
    expect(p.system[0].cache_control.type).toBe('ephemeral');
    expect(p).not.toHaveProperty('temperature');
  });
});

describe('ai.ts', () => {
  beforeEach(() => resetThrottle());

  it('parseSelection: Default-Modell, Fehler bei Unbekanntem', () => {
    expect(parseSelection({ task: 'seo' }).model).toBe('claude-opus-5-5');
    expect(parseSelection({ task: 'seo', model: 'claude-haiku-5-5', effort: 'high' })).toEqual({
      task: 'seo',
      model: 'claude-haiku-5-5',
      effort: 'high',
    });
    expect(() => parseSelection({ task: 'x' })).toThrow(/Aufgabe/);
    expect(() => parseSelection({ task: 'seo', model: 'foo' })).toThrow(/Modell/);
    expect(() => parseSelection({ task: 'seo', effort: 'max' })).toThrow(/Aufwand/);
  });

  it('parseMessage: JSON, Abbruch, Ablehnung', () => {
    const usage = { input_tokens: 1000, output_tokens: 500 };
    const ok = parseMessage(
      { content: [{ type: 'text', text: '{"a":1}' }], stop_reason: 'end_turn', usage },
      'claude-sonnet-5-5',
      false,
    );
    expect(ok).toMatchObject({ ok: true, data: { a: 1 } });
    expect(ok.costUsd).toBeCloseTo(0.007, 6);
    expect(
      parseMessage({ content: [], stop_reason: 'max_tokens', usage }, 'claude-sonnet-5-5', false)
        .ok,
    ).toBe(false);
    expect(
      parseMessage({ content: [], stop_reason: 'refusal' }, 'claude-sonnet-5-5', false).error,
    ).toMatch(/abgelehnt/);
    expect(
      parseMessage({ content: [{ type: 'text', text: 'kein json' }] }, 'claude-sonnet-5-5', false)
        .error,
    ).toMatch(/JSON/);
  });

  it('Throttle: sperrt nach dem Limit, 0 = aus, Fenster läuft ab', () => {
    checkThrottle(2, 1000);
    checkThrottle(2, 1001);
    expect(() => checkThrottle(2, 1002)).toThrow(/Zu viele/);
    expect(() => checkThrottle(2, 62_000)).not.toThrow();
    for (let i = 0; i < 50; i++) checkThrottle(0);
  });

  it('aiConfig listet Modelle und Aufgaben; Batch-ID wird geprüft', async () => {
    const c = aiConfig();
    expect(c.models).toHaveLength(3);
    expect(c.tasks.map((t) => t.id)).toEqual([
      'seo',
      'compare',
      'blog',
      'alt',
      'card',
      'ticker',
      'icon',
      'design',
      'imageprompt',
    ]);
    await expect(batchStatus('../etc')).rejects.toThrow(/Batch-ID/);
  });
});

describe('Alt-Text (Vision)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kdt-uploads-'));
  mkdirSync(join(dir, 'de'));
  writeFileSync(join(dir, 'de', 'a.png'), Buffer.from([1, 2, 3]));
  writeFileSync(join(dir, 'de', 'v.svg'), '<svg/>');
  writeFileSync(join(dir, 'de', 'big.jpg'), Buffer.alloc(MAX_IMAGE_BYTES + 1));
  const old = config.uploadsDir;
  beforeEach(() => {
    config.uploadsDir = dir;
  });

  it('lädt Bilder nur aus dem Uploads-Ordner, nur Bildformate, mit Größenlimit', async () => {
    const img = await loadUploadImage('de/a.png');
    expect(img).toEqual({
      mediaType: 'image/png',
      data: Buffer.from([1, 2, 3]).toString('base64'),
    });
    await expect(loadUploadImage('../etc/passwd')).rejects.toThrow(/Ungültiger/);
    await expect(loadUploadImage('de/../a.png')).rejects.toThrow(/Ungültiger/);
    await expect(loadUploadImage('de/v.svg')).rejects.toThrow(/JPG, PNG/);
    await expect(loadUploadImage('de/big.jpg')).rejects.toThrow(/4,5 MB/);
    await expect(loadUploadImage('de/fehlt.png')).rejects.toThrow(/nicht gefunden/);
    await expect(loadUploadImage(undefined)).rejects.toThrow(/Ungültiger/);
    config.uploadsDir = old;
  });

  it('baut die Anfrage mit Bild-Block vor dem Text', () => {
    const p = buildRequestParams(
      'alt',
      'claude-haiku-5-5',
      { path: 'de/a.png', context: 'Hero-Banner' },
      undefined,
      { mediaType: 'image/png', data: 'AAAA' },
    );
    const content = p.messages[0]!.content as Array<{ type: string; text?: string }>;
    expect(content.map((c) => c.type)).toEqual(['image', 'text']);
    expect(content[1]!.text).toContain('Hero-Banner');
    expect(p.output_config.effort).toBe('low');
    expect(aiConfig().tasks.map((t) => t.id)).toContain('alt');
  });
});
