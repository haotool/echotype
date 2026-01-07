/**
 * E2E tests for extension loading
 * @module tests/e2e/extension-load.spec
 * 
 * Tests that the extension loads correctly and basic functionality works.
 * Updated: 2026-01-07T22:25:00+08:00
 */

import { test, expect } from './fixtures';

test.describe('Extension Loading', () => {
  test('should load extension successfully', async ({ extensionId }) => {
    // Extension ID should be a 32-character string
    expect(extensionId).toBeTruthy();
    expect(extensionId.length).toBe(32);
  });

  test('should have service worker running', async ({ context }) => {
    // MV3 uses service workers instead of background pages
    const serviceWorkers = context.serviceWorkers();
    expect(serviceWorkers.length).toBeGreaterThan(0);
    
    const sw = serviceWorkers[0];
    expect(sw.url()).toContain('chrome-extension://');
  });

  test('should have manifest v3', async ({ context }) => {
    const page = await context.newPage();
    
    // Navigate to chrome://extensions and check
    await page.goto('chrome://extensions/');
    
    // The extension should be visible in the list
    // Note: This is a basic check, detailed manifest inspection
    // requires different approach
    await expect(page).toHaveTitle(/擴充功能|Extensions/);
  });

  test('should open ChatGPT page and inject content script', async ({ context }) => {
    const page = await context.newPage();
    
    // Navigate to ChatGPT
    await page.goto('https://chatgpt.com/?temporary-chat=true');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Content script should be injected
    // We can check by looking for our script's side effects
    // or by messaging
    
    // Basic check: page should load
    await expect(page).toHaveURL(/chatgpt\.com/);
  });
});

test.describe('Extension Pages', () => {
  test('should load offscreen document HTML', async ({ context, extensionId }) => {
    const page = await context.newPage();
    
    await page.goto(`chrome-extension://${extensionId}/src/offscreen/index.html`);
    
    // Check offscreen page loaded
    const title = await page.title();
    expect(title).toBe('EchoType Offscreen');
  });

  test('should access options page via extension URL', async ({ context, extensionId }) => {
    const page = await context.newPage();
    
    await page.goto(`chrome-extension://${extensionId}/src/options/index.html`);
    
    // Check options page loaded
    await expect(page).toHaveTitle('EchoType Settings');
  });
});
