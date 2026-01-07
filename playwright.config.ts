/**
 * Playwright configuration for EchoType Chrome Extension E2E testing
 * @module playwright.config
 * 
 * @see https://playwright.dev/docs/chrome-extensions
 * Updated: 2026-01-07T22:24:00+08:00 [context7:/ruifigueira/playwright-crx]
 */

import { defineConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 0,
  workers: 1, // Extensions require sequential testing
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],
  use: {
    headless: false, // Extensions require headed mode
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-extension',
      use: {
        browserName: 'chromium',
      },
    },
  ],
  // Extension-specific: path to built extension
  metadata: {
    extensionPath: path.join(__dirname, 'dist'),
  },
});
