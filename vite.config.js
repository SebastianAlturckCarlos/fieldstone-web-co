import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Base path is only needed on GitHub Pages (served from /fieldstone-web-co/);
// local dev stays at plain http://localhost:5173/.
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === 'build' ? '/fieldstone-web-co/' : '/',
}))
