/**
 * Playwright fixtures for Chrome Extension E2E testing
 * @module tests/e2e/fixtures
 * 
 * Sets up browser context with extension loaded and provides
 * extensionId for accessing extension pages.
 * 
 * Supports headless mode with --headless=new for Chrome 109+
 * 
 * @see https://playwright.dev/docs/chrome-extensions
 * Updated: 2026-01-20T22:18:00+08:00
 */

import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check for headless mode from environment (default: true for CI)
const isHeadless = process.env.HEADLESS !== 'false';

/**
 * Extended Playwright test with Chrome extension fixtures
 */
export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // Override context to load extension
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, '../../dist');
    
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      headless: false, // Extensions always require headed mode (--headless=new handled via args)
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // Enable headless mode for Chrome extensions (Chrome 109+)
        ...(isHeadless ? ['--headless=new'] : []),
      ],
    });
    
    await use(context);
    await context.close();
  },

  // Get extension ID from service worker (MV3)
  extensionId: async ({ context }, use) => {
    // Wait for service worker to be available (MV3)
    let [serviceWorker] = context.serviceWorkers();
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker', { timeout: 30000 });
    }

    // Extract extension ID from service worker URL
    // Format: chrome-extension://<extensionId>/...
    const extensionId = serviceWorker.url().split('/')[2];
    await use(extensionId);
  },
});

export const expect = test.expect;

/**
 * Helper to navigate to extension popup page
 */
export async function openPopupPage(context: BrowserContext, extensionId: string) {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/popup/index.html`);
  return page;
}

/**
 * Helper to navigate to extension options page
 */
export async function openOptionsPage(context: BrowserContext, extensionId: string) {
  const page = await context.newPage();
  try {
    await page.goto(`chrome-extension://${extensionId}/src/options/index.html`, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });
  } catch {
    // Chrome may redirect to chrome://extensions/?options=... in some cases
    // Wait and try to navigate again
    await page.waitForTimeout(500);
    if (!page.url().includes(extensionId)) {
      await page.goto(`chrome-extension://${extensionId}/src/options/index.html`, {
        waitUntil: 'domcontentloaded',
      });
    }
  }
  return page;
}

/**
 * Helper to navigate to extension offscreen page
 */
export async function openOffscreenPage(context: BrowserContext, extensionId: string) {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/src/offscreen/index.html`);
  return page;
}
