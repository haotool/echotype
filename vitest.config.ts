import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/unit/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      // Exclude files that require Chrome API mocking (tested via E2E)
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/background/**',      // Requires Chrome API mocking
        'src/content/**',         // Requires DOM + Chrome API
        'src/offscreen/**',       // Requires Chrome API
        'src/options/**',         // UI files tested via E2E
        'src/popup/**',           // UI files tested via E2E
        'src/shared/icons.ts',    // Static SVG definitions
      ],
      thresholds: {
        // Only enforce thresholds on testable shared utilities
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@background': resolve(__dirname, 'src/background'),
      '@content': resolve(__dirname, 'src/content'),
    },
  },
});
