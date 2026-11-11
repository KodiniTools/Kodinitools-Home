// Starter des Admin-Dienstes (systemd: ExecStart=node server/admin/index.mjs).
// Der Server-Code liegt als TypeScript in src/ und läuft übersetzt aus build/;
// fehlt der Build oder ist er veraltet, wird er hier zuerst erzeugt.
import { ensureServerBuild } from './build-server.mjs';

await ensureServerBuild();
await import('./build/index.js');
