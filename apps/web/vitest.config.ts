import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Por defecto entorno node: la lógica no necesita navegador. Los componentes
// piden jsdom fichero a fichero con `// @vitest-environment jsdom`.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      '@edumind-hilo/nucleo': resolve(import.meta.dirname, '../../packages/nucleo/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./src/pruebas/preparar.ts'],
  },
})
