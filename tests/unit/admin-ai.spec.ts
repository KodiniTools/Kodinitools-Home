/** KI-Modul des Admins: Auswahl, Prompts, Kosten, Schutz – ohne Netzwerk. */
import { describe, expect, it, beforeEach } from 'vitest';
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
    expect(c.tasks.map((t) => t.id)).toEqual(['seo', 'compare', 'blog']);
    await expect(batchStatus('../etc')).rejects.toThrow(/Batch-ID/);
  });
});
