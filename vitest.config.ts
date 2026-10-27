import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    setupFiles: [resolve(__dirname, 'test/setup.ts')],
    include: ['test/**/*.spec.ts'],
  },
})
