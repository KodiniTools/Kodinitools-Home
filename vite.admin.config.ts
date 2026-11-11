import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

/**
 * Build des Admin-Frontends: Einstieg `server/admin/public/admin.js` (Vanilla-
 * Teil samt Datenmodell `model*.ts`) → `server/admin/dist/admin.js`; die
 * Vue-Teile (`app/main.ts`) lädt admin.js dynamisch nach (eigener Chunk unter
 * `chunks/`), gemeinsame Module wie das Datenmodell liegen nur einmal im Bundle.
 * CSS landet gesammelt in `main.css`. Feste Namen für Einstieg und CSS, kein
 * Hash: der Admin-Dienst liefert sie mit `no-store` unter `/admin/app/` aus und
 * `public/index.html` bindet sie direkt ein. Die öffentliche Astro-Seite ist
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
      input: fileURLToPath(new URL('./server/admin/public/admin.js', import.meta.url)),
      output: {
        format: 'es',
        entryFileNames: 'admin.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (info) =>
          info.names?.some((n) => n.endsWith('.css'))
            ? 'main.css'
            : 'assets/[name]-[hash][extname]',
      },
    },
  },
});
