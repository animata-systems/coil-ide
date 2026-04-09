import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'

// Library build for the `coil-ide` package.
//
// Produces two ESM entry points:
//   - dist/index.js     — full API (React components + headless pipeline)
//   - dist/headless.js  — headless pipeline only, no React/Monaco
//
// Type declarations are emitted via `tsc -p tsconfig.lib.build.json` as a
// separate step (see package.json `build:lib` script).

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        headless: resolve(__dirname, 'src/headless.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        'react-dom/client',
        '@monaco-editor/react',
        'monaco-editor',
        'coil-runtime',
        'coil-runtime/browser',
      ],
      output: {
        preserveModules: false,
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
  },
})
