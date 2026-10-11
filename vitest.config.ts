import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['tests/**/*.spec.ts'],
    // Standard: Node. Komponententests setzen `// @vitest-environment happy-dom`.
    environment: 'node',
  },
});
