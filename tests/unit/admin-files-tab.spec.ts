// @vitest-environment happy-dom
/**
 * Tab „Dateien“ als Vue-Insel (server/admin/app/tabs/files): Anzeige-Regeln
 * wie public/media.js; Daten und Aktionen kommen als Service von der
 * Vanilla-Seite, nach jeder Aktion wird der Schnappschuss neu geholt.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import FilesTab from '../../server/admin/app/tabs/files/FilesTab.vue';
import { filesUi } from '../../server/admin/app/tabs/files/filesUi';
import {
  deleteServerQuestion,
  fmtBytes,
  modeEntries,
  modeMark,
  moveTargets,
  type FilesService,
  type FilesSnapshot,
  type ServerFileView,
  type StagedFileView,
} from '../../server/admin/app/tabs/files/filesData';
import { fmtBytes as vanillaFmtBytes } from '../../server/admin/public/core.js';
import { useToastStore } from '../../server/admin/app/stores/toast';

const srv = (path: string, usage: ServerFileView['usage'] = []): ServerFileView => ({
  kind: 'server',
  key: 'srv:' + path,
  name: path.split('/').pop()!,
  src: '/uploads/' + path,
  path,
  bytes: 2048,
  ext: 'WEBP',
  isVid: false,
  usage,
});
const stg = (id: string, usage: StagedFileView['usage'] = []): StagedFileView => ({
  kind: 'staged',
  key: 'stg:' + id,
  id,
  name: id + '.png',
  src: 'blob:x',
  bytes: 10,
  ext: 'PNG',
  isVid: false,
  published: false,
  usage,
});

describe('filesData (Regeln wie public/media.js)', () => {
  it('fmtBytes identisch zu core.js', () => {
    for (const n of [0, 5, 1023, 1024, 50_000, 5 * 1024 * 1024, null, undefined])
      expect(fmtBytes(n)).toBe(vanillaFmtBytes(n as number));
  });

  it('Verschiebe-Ziele je Ordner', () => {
    expect(moveTargets('de')).toEqual(['en', '']);
    expect(moveTargets('en')).toEqual(['de', '']);
    expect(moveTargets('')).toEqual(['de', 'en']);
  });

  it('Modus-Markierung und -Übersicht', () => {
    const both = [{ label: 'DE · Hero-Banner', mode: 'both' as const }];
    const dark = [{ label: 'Hintergrund Dunkel', mode: 'dark' as const }];
    expect(modeMark(both, 'light')).toBe('☀️ Hell ✓');
    expect(modeMark(dark, 'dark')).toBe('🌙 Dunkel (nur dieser Modus) ✓');
    expect(modeMark(dark, 'light')).toBeNull();
    const snap: FilesSnapshot = {
      server: [srv('de/a.webp', both), srv('de/b.webp')],
      shared: [srv('c.webp', dark)],
      staged: [stg('m1', dark)],
    };
    expect(modeEntries(snap, 'de', 'light').map((e) => [e.file.name, e.where])).toEqual([
      ['a.webp', 'DE'],
    ]);
    expect(modeEntries(snap, 'de', 'dark').map((e) => e.where)).toEqual([
      'DE',
      'Gemeinsam',
      'Zwischenspeicher',
    ]);
  });

  it('Rückfrage nennt die Plätze', () => {
    expect(deleteServerQuestion(srv('de/a.webp'))).toBe('Datei „de/a.webp“ vom Server löschen?');
    expect(deleteServerQuestion(srv('de/a.webp', [{ label: 'X', mode: 'both' }]))).toContain(
      'verwendet in: X',
    );
  });
});

describe('FilesTab (Vue-Insel)', () => {
  let snap: FilesSnapshot;
  let service: FilesService & Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    setActivePinia(createPinia());
    filesUi.mode = 'light';
    document.body.innerHTML = '';
    snap = {
      server: [srv('de/a.webp', [{ label: 'DE · Hero-Banner', mode: 'both' }]), srv('de/b.webp')],
      shared: [],
      staged: [stg('m1')],
    };
    service = {
      snapshot: vi.fn(() => snap),
      deleteServer: vi.fn(async (path: string) => {
        snap = { ...snap, server: snap.server.filter((f) => f.path !== path) };
        return { ok: true };
      }),
      moveServer: vi.fn(async () => ({ ok: false, error: 'kaputt' })),
      deleteStaged: vi.fn(async (id: string) => {
        snap = { ...snap, staged: snap.staged.filter((f) => f.id !== id) };
        return { ok: true };
      }),
      addFiles: vi.fn(async (files: FileList | File[]) => {
        const list = Array.from(files);
        snap = { ...snap, staged: [...snap.staged, ...list.map((f) => stg(f.name))] };
        return { ok: true, added: list.length, tooBig: [] };
      }),
    } as never;
  });

  const mountTab = () =>
    mount(FilesTab, { attachTo: document.body, props: { lang: 'de', service } });

  it('zeigt Server-Dateien, Zwischenspeicher und die Modus-Übersicht', () => {
    const w = mountTab();
    expect(w.findAll('[data-fl-server] [data-fl-tile]')).toHaveLength(2);
    expect(w.findAll('[data-fl-staged] [data-fl-tile]')).toHaveLength(1);
    expect(w.find('[data-fl-shared]').exists()).toBe(false);
    expect(w.findAll('[data-fl-moderow]')).toHaveLength(1);
    expect(w.find('[data-fl-tile="srv:de/a.webp"]').attributes('data-inmode')).toBe('1');
    expect(w.find('[data-fl-showmode="dark"]').exists()).toBe(true);
    expect(
      w
        .findAll('[data-fl-server] [data-fl-tile]')[0]!
        .findAll('[data-fl-move]')
        .map((b) => b.text()),
    ).toEqual(['→ EN', '→ Gemeinsam']);
    w.unmount();
  });

  it('Löschen fragt per Dialog nach und lädt danach neu', async () => {
    const w = mountTab();
    await w.find('[data-fl-tile="srv:de/a.webp"] [data-fl-delserver]').trigger('click');
    await flushPromises();
    expect(document.body.textContent).toContain('verwendet in: DE · Hero-Banner');
    expect(service.deleteServer).not.toHaveBeenCalled();
    document.querySelector<HTMLButtonElement>('[data-fl-confirm]')!.click();
    await flushPromises();
    expect(service.deleteServer).toHaveBeenCalledWith('de/a.webp');
    expect(w.findAll('[data-fl-server] [data-fl-tile]')).toHaveLength(1);
    expect(useToastStore().toasts.at(-1)?.message).toContain('Gelöscht');
    w.unmount();
  });

  it('Fehler beim Verschieben erscheint als Fehler-Toast', async () => {
    const w = mountTab();
    await w.find('[data-fl-tile="srv:de/b.webp"] [data-fl-move=""]').trigger('click');
    await flushPromises();
    expect(service.moveServer).toHaveBeenCalledWith('de/b.webp', '');
    const t = useToastStore().toasts.at(-1);
    expect(t?.type).toBe('error');
    expect(t?.message).toBe('Verschieben fehlgeschlagen: kaputt');
    w.unmount();
  });

  it('Zwischenspeicher: unbenutzte Datei ohne Rückfrage entfernen, Dateien hinzufügen', async () => {
    const w = mountTab();
    await w.find('[data-fl-delstaged]').trigger('click');
    await flushPromises();
    expect(service.deleteStaged).toHaveBeenCalledWith('m1');
    expect(w.findAll('[data-fl-staged] [data-fl-tile]')).toHaveLength(0);

    const file = new File(['x'], 'neu.png', { type: 'image/png' });
    const input = w.find('input[data-fl-input]');
    Object.defineProperty(input.element, 'files', { value: [file] });
    await input.trigger('change');
    await flushPromises();
    expect(service.addFiles).toHaveBeenCalledTimes(1);
    expect(w.findAll('[data-fl-staged] [data-fl-tile]')).toHaveLength(1);
    expect(useToastStore().toasts.at(-1)?.message).toBe('1 Datei(en) im Zwischenspeicher');
    w.unmount();
  });

  it('Moduswechsel per zugeklappter Leiste', async () => {
    const w = mountTab();
    await w.find('[data-fl-showmode="dark"]').trigger('click');
    expect(filesUi.mode).toBe('dark');
    expect(w.find('[data-fl-showmode="light"]').exists()).toBe(true);
    expect(w.find('[data-fl-modepanel="dark"] [data-fl-modecount]').text()).toContain(
      '1 Datei(en) erscheinen im Dunkelmodus',
    );
    w.unmount();
  });
});
