import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginAstro from 'eslint-plugin-astro';
import configPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Base JS rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // Astro rules
  ...pluginAstro.configs.recommended,

  // Disable ESLint formatting rules that conflict with Prettier
  configPrettier,

  {
    files: ['**/*.{ts,tsx,astro}'],
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Astro-Seiten: der Client-`<script>`-Teil läuft im Browser, der Frontmatter-
  // Teil zur Build-Zeit in Node. Beide Global-Sets bereitstellen.
  // Hinweis: Das offizielle Google-gtag-Snippet nutzt bewusst das
  // `arguments`-Objekt (`function gtag(){dataLayer.push(arguments);}`). Eine
  // Umschreibung auf Rest-Parameter würde das an den Tag Manager übergebene
  // Objekt verändern; die Regel `prefer-rest-params` wird deshalb direkt an
  // diesen Stellen per Inline-Kommentar deaktiviert (ein Datei-Override greift
  // hier nicht, da eslint-plugin-astro die <script>-Blöcke als virtuelle
  // Dateien ohne .astro-Endung lintet).
  {
    files: ['**/*.astro'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },

  // Build-/Hilfsskripte laufen in Node.
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Node-Server (Admin-Dienst) + Build-Config — Node-Built-in-Globals bereitstellen
  {
    files: ['server/**/*.mjs', 'astro.config.mjs', 'single-sitemap.mjs'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Admin-Frontend (Browser-JavaScript) — Browser-Globals bereitstellen
  {
    files: ['server/admin/public/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'public/fontawesome/**',
      'public/fonts/**',
    ],
  },
);
