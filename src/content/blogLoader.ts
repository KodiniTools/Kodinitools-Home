// Content-Layer-Loader für die Blog-Artikel (src/content/blog/<lang>/<slug>.html).
//
// Jede Datei besteht aus YAML-Frontmatter (Metadaten, siehe Schema in
// src/content.config.ts) und dem Artikel-Rumpf als HTML. HTML statt Markdown,
// weil die Artikel Tabellen, Figuren und Klassen nutzen, die 1:1 erhalten
// bleiben sollen. Eintrags-ID = "<lang>/<slug>", die Sprache kommt aus dem Ordner.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as parseYaml } from 'js-yaml';
import type { Loader, LoaderContext } from 'astro/loaders';

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const LANGS = ['de', 'en'] as const;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Zerlegt eine Artikeldatei in Frontmatter-Objekt und HTML-Rumpf. */
export function parseArticleFile(
  raw: string,
  file: string,
): { data: Record<string, unknown>; body: string } {
  const match = raw.match(FRONTMATTER);
  if (!match) throw new Error(`${file}: Frontmatter (--- … ---) fehlt`);
  const data = parseYaml(match[1] ?? '');
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error(`${file}: Frontmatter ist kein YAML-Objekt`);
  }
  return { data: data as Record<string, unknown>, body: raw.slice(match[0].length) };
}

export function htmlArticleLoader(directory: string): Loader {
  return {
    name: 'html-article-loader',
    load: async (context: LoaderContext) => {
      const { config, store, parseData, generateDigest, watcher, logger } = context;
      const root = fileURLToPath(new URL(directory.replace(/\/?$/, '/'), config.root));
      const rootPath = fileURLToPath(config.root);

      const sync = async () => {
        store.clear();
        for (const lang of LANGS) {
          const dir = join(root, lang);
          if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) continue;
          for (const name of readdirSync(dir).sort()) {
            if (!name.endsWith('.html')) continue;
            const slug = name.slice(0, -'.html'.length);
            const filePath = relative(rootPath, join(dir, name)).split(sep).join('/');
            if (!SLUG.test(slug))
              throw new Error(`${filePath}: ungültiger Slug „${slug}“ (nur a-z, 0-9, -)`);
            const raw = readFileSync(join(dir, name), 'utf-8');
            const { data, body } = parseArticleFile(raw, filePath);
            const id = `${lang}/${slug}`;
            const parsed = await parseData({ id, data: { ...data, lang }, filePath });
            store.set({ id, data: parsed, body, filePath, digest: generateDigest(raw) });
          }
        }
      };

      await sync();

      // Dev-Server: Änderungen an Artikeln ohne Neustart übernehmen.
      watcher?.add(root);
      const onChange = async (changed: string) => {
        if (!changed.startsWith(root) || !changed.endsWith('.html')) return;
        try {
          await sync();
          logger.info(`Blog neu geladen (${relative(root, changed)})`);
        } catch (error) {
          logger.error(error instanceof Error ? error.message : String(error));
        }
      };
      watcher?.on('change', onChange);
      watcher?.on('add', onChange);
      watcher?.on('unlink', onChange);
    },
  };
}
