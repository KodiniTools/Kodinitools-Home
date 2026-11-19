/**
 * Workflow-Ketten der Startseite: Auflösung gegen die sichtbaren Karten (ausgeblendete
 * Schritte entfallen, Ketten unter zwei Schritten ebenfalls) mit den echten Karten
 * beider Sprachen.
 */
import { describe, expect, it } from 'vitest';
import { getContent } from '../../src/content/content';
import { resolveWorkflows, TOOL_WORKFLOWS, type WorkflowTool } from '../../src/content/toolCatalog';

const SECTIONS = ['tools', 'imageTools', 'diverseTools'] as const;

function cards(lang: 'de' | 'en'): Map<string, WorkflowTool> {
  const content = (lang === 'en' ? getContent('en') : getContent('de')) as unknown as Record<
    string,
    Record<string, { title?: string; link?: string; svg?: string }>
  >;
  const map = new Map<string, WorkflowTool>();
  for (const section of SECTIONS) {
    for (const [k, v] of Object.entries(content[section] ?? {})) {
      if (v && typeof v === 'object' && 'link' in v) {
        map.set(`${section}.${k}`, { title: v.title ?? '', link: v.link ?? '', svg: v.svg ?? '' });
      }
    }
  }
  return map;
}

describe.each(['de', 'en'] as const)('resolveWorkflows (%s)', (lang) => {
  it('liefert alle Ketten mit vollständigen Schritten und Texten', () => {
    const resolved = resolveWorkflows(cards(lang), lang);
    expect(resolved.map((w) => w.id)).toEqual(TOOL_WORKFLOWS.map((w) => w.id));
    for (const wf of resolved) {
      expect(wf.title && wf.description, wf.id).toBeTruthy();
      expect(wf.steps.length, wf.id).toBeGreaterThanOrEqual(2);
      for (const step of wf.steps) {
        expect(step.link, step.key).toMatch(/^https:\/\/kodinitools\.com\//);
        expect(step.title, step.key).not.toContain('\n');
        expect(step.title, step.key).not.toBe('');
      }
    }
  });
});

describe('resolveWorkflows – ausgeblendete Karten', () => {
  it('lässt ausgeblendete Schritte weg und behält die Kette ab zwei Schritten', () => {
    const tools = cards('de');
    tools.delete('tools.audioVisualizer');
    const podcast = resolveWorkflows(tools, 'de').find((w) => w.id === 'podcast');
    expect(podcast?.steps.map((s) => s.key)).toEqual([
      'tools.audioConverter',
      'tools.audioNormalizer',
    ]);
  });

  it('entfernt eine Kette, wenn weniger als zwei Schritte bleiben', () => {
    const tools = cards('de');
    tools.delete('diverseTools.colorExtractor');
    const ids = resolveWorkflows(tools, 'de').map((w) => w.id);
    expect(ids).not.toContain('palette');
    expect(ids).toContain('images');
  });

  it('ohne Karten gibt es keine Ketten', () => {
    expect(resolveWorkflows(new Map(), 'en')).toEqual([]);
  });
});
