import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // `tsc` emits compiled tests to dist/; run the sources only.
    include: ['src/**/*.test.ts'],
  },
})
