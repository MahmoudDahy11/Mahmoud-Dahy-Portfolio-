import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
// Imported from vitest/config rather than vite so the `test` block below is typed.
// The config is a superset of Vite's, so the dev server and build are unaffected.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rolldownOptions: {
      output: {
        /**
         * Vendor splitting.
         *
         * Without this the whole app lands in one ~770 kB chunk: React plus the Supabase
         * client plus every UI primitive, all re-downloaded whenever any application code
         * changes. Splitting them means a content edit ships a small chunk and the heavy
         * dependencies stay cached between deploys.
         *
         * The groups are ordered by specificity so the catch-all "vendor" rule does not
         * swallow the more specific matches.
         */
        advancedChunks: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/ },
            { name: 'router', test: /node_modules[\\/]react-router|node_modules[\\/]@remix-run[\\/]/ },
            { name: 'forms', test: /node_modules[\\/](zod|@hookform|react-hook-form)[\\/]/ },
            { name: 'vendor', test: /node_modules[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
