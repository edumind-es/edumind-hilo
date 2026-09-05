import { defineConfig } from 'vitest/config'

// Todo el núcleo es lógica pura: entorno node, sin navegador. Instantáneo.
export default defineConfig({
  test: { environment: 'node', globals: true, include: ['src/**/*.test.ts'] },
})
