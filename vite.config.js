import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Base path is only needed on GitHub Pages (served from /fieldstone-web-co/);
// local dev stays at plain http://localhost:5173/.
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === 'build' ? '/fieldstone-web-co/' : '/',
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
      },
    },
  },
}))
