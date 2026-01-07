/**
 * Playwright fixtures for Chrome Extension E2E testing
 * @module tests/e2e/fixtures
 * 
 * Sets up browser context with extension loaded and provides
 * extensionId for accessing extension pages.
 * 
 * @see https://playwright.dev/docs/chrome-extensions
 * Updated: 2026-01-07T22:24:00+08:00 [context7:/ruifigueira/playwright-crx]
 */

import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';

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
      headless: false, // Extensions require headed mode
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
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
      serviceWorker = await context.waitForEvent('serviceworker');
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
  await page.goto(`chrome-extension://${extensionId}/src/options/index.html`);
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
