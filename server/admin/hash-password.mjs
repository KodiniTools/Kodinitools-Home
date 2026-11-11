#!/usr/bin/env node
// Erzeugt einen scrypt-Passwort-Hash für ADMIN_PASSWORD_HASH.
//   node server/admin/hash-password.mjs 'MEIN-PASSWORT'
//   node server/admin/hash-password.mjs        # fragt interaktiv (versteckt)
// Der Code liegt in src/hash-password.ts (siehe index.mjs zum Build).
import { ensureServerBuild } from './build-server.mjs';

await ensureServerBuild();
await import('./build/hash-password.js');
