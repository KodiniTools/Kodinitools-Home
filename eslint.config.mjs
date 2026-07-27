import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import pluginAstro from 'eslint-plugin-astro';
import configPrettier from 'eslint-config-prettier';

export default tseslint.config(
  // Base JS rules
  js.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // Vue 3 rules
  ...pluginVue.configs['flat/recommended'],

  // Astro rules
  ...pluginAstro.configs.recommended,

  // Disable ESLint formatting rules that conflict with Prettier
  configPrettier,

  {
    files: ['**/*.{ts,tsx,vue,astro}'],
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Vue
      'vue/multi-word-component-names': 'off',
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    },
  },

  // Node-Server (Admin-Dienst) — Node-Built-in-Globals bereitstellen
  {
    files: ['server/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
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
