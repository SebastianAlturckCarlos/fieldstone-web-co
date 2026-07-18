import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Served at the custom domain root (https://fieldstone-webco.com — CNAME in
// public/). The old github.io/fieldstone-web-co/ URLs 301-redirect here, so
// base stays '/' everywhere. Do NOT reintroduce a subpath base: it was the
// cause of the white-page bug when the custom domain went live.
export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    rollupOptions: {
      // Multi-page build: the homepage, the standalone /about/ page, and
      // unlisted client-demo routes (shared by link, noindexed).
      // Demo naming convention: /demo/tier<N>-<product>/ ↔ src/demos/Tier<N><Product>Demo.jsx
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        about: fileURLToPath(new URL('./about/index.html', import.meta.url)),
        demoIndex: fileURLToPath(new URL('./demo/index.html', import.meta.url)),
        demoTier1Wedge: fileURLToPath(new URL('./demo/tier1-wedge/index.html', import.meta.url)),
        demoTier2Crm: fileURLToPath(new URL('./demo/tier2-crm/index.html', import.meta.url)),
        demoTier3Enterprise: fileURLToPath(new URL('./demo/tier3-enterprise/index.html', import.meta.url)),
      },
    },
  },
}))
