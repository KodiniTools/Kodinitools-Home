// Erzeugt src/styles/parts/tokens.css aus src/styles/tokens.json.
//
//   npm run tokens          Datei neu schreiben
//   npm run tokens -- --check   nur prüfen, ob die Datei aktuell ist (Exit 1, wenn nicht)
//
// Ein Token-Wert ist ein String (gilt in allen Themes) oder { light?, dark? }.
// Fehlt "light", wird der Token nur im dunklen Modus gesetzt.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../', import.meta.url);
export const TOKENS_JSON = fileURLToPath(new URL('src/styles/tokens.json', ROOT));
export const TOKENS_CSS = fileURLToPath(new URL('src/styles/parts/tokens.css', ROOT));

const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UNSAFE = /[;{}<>]|\/\*/;

/** Prüft die Token-Datei und liefert eine verständliche Fehlermeldung. */
export function validateTokens(data) {
  const themes = Object.keys(data.themes ?? {});
  if (themes[0] !== 'light' || !themes.includes('dark')) {
    throw new Error('tokens.json: themes muss mit "light" beginnen und "dark" enthalten');
  }
  const seen = new Set();
  for (const group of data.groups ?? []) {
    for (const token of group.tokens ?? []) {
      const where = `tokens.json › ${group.name} › ${token.name}`;
      if (!NAME.test(token.name ?? '')) throw new Error(`${where}: ungültiger Name`);
      if (seen.has(token.name)) throw new Error(`${where}: Name doppelt`);
      seen.add(token.name);
      const values =
        typeof token.value === 'string' ? [token.value] : Object.values(token.value ?? {});
      if (values.length === 0) throw new Error(`${where}: kein Wert`);
      for (const [theme] of typeof token.value === 'string' ? [] : Object.entries(token.value)) {
        if (!themes.includes(theme)) throw new Error(`${where}: unbekanntes Theme "${theme}"`);
      }
      for (const value of values) {
        if (typeof value !== 'string' || !value.trim() || UNSAFE.test(value)) {
          throw new Error(`${where}: ungültiger Wert ${JSON.stringify(value)}`);
        }
      }
      if (!token.usage) throw new Error(`${where}: usage fehlt`);
    }
  }
  return data;
}

/** Wert eines Tokens in einem Theme (oder undefined, wenn dort nicht gesetzt). */
export function valueIn(token, theme) {
  return typeof token.value === 'string'
    ? theme === 'light'
      ? token.value
      : undefined
    : token.value[theme];
}

/** Rendert die CSS-Datei (deterministisch, Reihenfolge wie in tokens.json). */
export function renderTokensCss(data) {
  validateTokens(data);
  const out = [
    '/*',
    ' * Design-Tokens – GENERIERT aus src/styles/tokens.json (npm run tokens).',
    ' * Nicht von Hand bearbeiten; Änderungen in tokens.json vornehmen.',
    ' */',
  ];
  for (const [theme, selector] of Object.entries(data.themes)) {
    const lines = [];
    for (const group of data.groups) {
      const decls = group.tokens
        .map((token) => [token.name, valueIn(token, theme)])
        .filter(([, value]) => value !== undefined)
        .map(([name, value]) => `  --${name}: ${value};`);
      if (decls.length) lines.push(`  /* ${group.name} */`, ...decls);
    }
    if (lines.length) out.push('', `${selector} {`, ...lines, '}');
  }
  return out.join('\n') + '\n';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const css = renderTokensCss(JSON.parse(readFileSync(TOKENS_JSON, 'utf-8')));
  if (process.argv.includes('--check')) {
    const current = readFileSync(TOKENS_CSS, 'utf-8');
    if (current !== css) {
      console.error('tokens.css ist nicht aktuell – `npm run tokens` ausführen.');
      process.exit(1);
    }
    console.log('tokens.css ist aktuell.');
  } else {
    writeFileSync(TOKENS_CSS, css);
    console.log(`tokens.css geschrieben (${TOKENS_CSS}).`);
  }
}
