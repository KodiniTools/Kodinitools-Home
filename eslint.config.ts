import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginAstro from 'eslint-plugin-astro';
import pluginVue from 'eslint-plugin-vue';
import configPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Base JS rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // Astro rules
  ...pluginAstro.configs.recommended,

  // Vue-Islands (src/islands/**/*.vue): empfohlene Regeln, TypeScript im <script setup>
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: { parser: tseslint.parser },
      globals: { ...globals.browser },
    },
  },

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
  {
    files: ['**/*.astro'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },

  // Build-/Hilfsskripte laufen in Node.
  {
    files: ['scripts/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Node-Server (Admin-Dienst) + Build-Config — Node-Built-in-Globals bereitstellen
  {
    files: [
      'server/**/*.mjs',
      'server/admin/src/**/*.ts',
      'astro.config.ts',
      'single-sitemap.ts',
      'rsz-integration.ts',
      'eslint.config.ts',
    ],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Browser-Code (Admin-Frontend, public/) — Browser-Globals bereitstellen
  {
    files: ['server/admin/public/**/*.js', 'server/admin/public/**/*.ts', 'public/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },

  {
    ignores: [
      'dist/**',
      'server/admin/dist/**',
      'server/admin/build/**',
      '.astro/**',
      'node_modules/**',
      'public/fontawesome/**',
      'public/fonts/**',
    ],
  },
);
