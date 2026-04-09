import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: 'playground',
  base: '/coil-ide/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      'coil-ide': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  build: {
    outDir: '../dist-playground',
    emptyOutDir: true,
  },
})
