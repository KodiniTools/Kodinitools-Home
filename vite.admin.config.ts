import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

/**
 * Build der Vue-Teile des Admins: `server/admin/app/main.ts` →
 * `server/admin/dist/main.js` + `main.css` (feste Namen, kein Hash: der
 * Admin-Dienst liefert sie mit `no-store` unter `/admin/app/` aus und
 * `public/index.html` bindet sie direkt ein). Die öffentliche Astro-Seite ist
 * davon nicht betroffen.
 */
export default defineConfig({
  plugins: [vue()],
  root: fileURLToPath(new URL('./server/admin/app', import.meta.url)),
  publicDir: false,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: fileURLToPath(new URL('./server/admin/dist', import.meta.url)),
    emptyOutDir: true,
    target: 'es2022',
    cssCodeSplit: false,
    sourcemap: true,
    rollupOptions: {
      input: fileURLToPath(new URL('./server/admin/app/main.ts', import.meta.url)),
      output: {
        format: 'es',
        entryFileNames: 'main.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (info) =>
          info.names?.some((n) => n.endsWith('.css'))
            ? 'main.css'
            : 'assets/[name]-[hash][extname]',
      },
    },
  },
});
