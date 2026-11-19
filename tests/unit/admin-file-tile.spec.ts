// @vitest-environment happy-dom
/** Kachel im Tab „Dateien“: Download-Link auf die Originaldatei. */
import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import FileTile from '../../server/admin/app/tabs/files/FileTile.vue';
import type { ServerFileView } from '../../server/admin/app/tabs/files/filesData';

const FILE: ServerFileView = {
  kind: 'server',
  key: 'srv:de/logo.webp',
  name: 'logo.webp',
  src: '/uploads/de/logo.webp',
  path: 'de/logo.webp',
  bytes: 1234,
  ext: 'WEBP',
  isVid: false,
  usage: [],
};

describe('FileTile', () => {
  it('bietet den Download der Originaldatei an', () => {
    const w = mount(FileTile, { props: { file: FILE, mode: 'light' } });
    const a = w.get('[data-fl-download]');
    expect(a.attributes('href')).toBe('/uploads/de/logo.webp');
    expect(a.attributes('download')).toBe('logo.webp');
  });
});
