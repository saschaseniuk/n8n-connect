import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['src/**/*.test.ts'],
    // Use jsdom for tests that need browser APIs
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
