import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild'
  },
  server: {
    port: 5173,
    host: true
  },
  define: {
    __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false),
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  ssr: {
    noExternal: ['vue-i18n']
  },
  ssgOptions: {
    script: 'async',
    formatting: 'minify'
  }
})
