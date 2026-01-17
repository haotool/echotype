/**
 * E2E tests for Options page
 * @module tests/e2e/options.spec
 * 
 * Tests the extension's options/settings page functionality.
 * Updated: 2026-01-08T00:35:00+08:00
 */

import { test, expect, openOptionsPage } from './fixtures';

test.describe('Options Page', () => {
  test('should load options page successfully', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);
    
    // Check page title
    await expect(page).toHaveTitle('EchoType Settings');
    
    // Check main heading
    await expect(page.locator('.brand-text')).toContainText('EchoType');
  });

  test('should display all settings toggles', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);
    
    // Check for auto-copy toggle (via parent toggle element)
    const autoCopyToggle = page.locator('.toggle').filter({ has: page.locator('#autoCopyToClipboard') });
    await expect(autoCopyToggle).toBeVisible();
    
    // Check for auto-paste toggle
    const autoPasteToggle = page.locator('.toggle').filter({ has: page.locator('#autoPasteToActiveTab') });
    await expect(autoPasteToggle).toBeVisible();
    
    // Check for return focus toggle
    const returnFocusToggle = page.locator('.toggle').filter({ has: page.locator('#returnFocusAfterStart') });
    await expect(returnFocusToggle).toBeVisible();
  });

  test('should toggle autoCopyToClipboard setting', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);
    
    // Click the toggle slider instead of the hidden checkbox
    const autoCopyToggle = page.locator('.toggle').filter({ has: page.locator('#autoCopyToClipboard') }).locator('.toggle-slider');
    const autoCopyCheckbox = page.locator('#autoCopyToClipboard');
    
    // Get initial state
    const initialChecked = await autoCopyCheckbox.isChecked();
    
    // Toggle using the visible slider
    await autoCopyToggle.click();
    
    // Verify state changed
    const newChecked = await autoCopyCheckbox.isChecked();
    expect(newChecked).toBe(!initialChecked);
    
    // Wait for save
    await page.waitForTimeout(200);
    
    // Reload page to verify persistence
    await page.reload();
    
    // Verify persisted state
    const persistedChecked = await autoCopyCheckbox.isChecked();
    expect(persistedChecked).toBe(!initialChecked);
  });

  test('should toggle autoPasteToActiveTab setting', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);
    
    // Click the toggle slider instead of the hidden checkbox
    const autoPasteToggle = page.locator('.toggle').filter({ has: page.locator('#autoPasteToActiveTab') }).locator('.toggle-slider');
    const autoPasteCheckbox = page.locator('#autoPasteToActiveTab');
    
    // Get initial state
    const initialChecked = await autoPasteCheckbox.isChecked();
    
    // Toggle using the visible slider
    await autoPasteToggle.click();
    
    // Verify state changed
    const newChecked = await autoPasteCheckbox.isChecked();
    expect(newChecked).toBe(!initialChecked);
  });

  test('should show keyboard shortcuts section', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);

    const shortcutsContainer = page.locator('#shortcutsContainer');
    await expect(shortcutsContainer).toBeVisible();

    const shortcutItems = shortcutsContainer.locator('.shortcut-item');
    await expect(shortcutItems).toHaveCount(3);
  });

  test('should show customize shortcuts button', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);

    // Check customize button exists (but don't click - it navigates away)
    const customizeBtn = page.locator('#customizeShortcuts');
    await expect(customizeBtn).toBeVisible();
    await expect(customizeBtn).toBeEnabled();
    
    await expect(customizeBtn).toHaveAttribute('data-i18n', 'customizeShortcuts');
    
    // Clean up page before next test
    await page.close();
  });

  test('should display history section', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);

    // Check history section exists
    const historyList = page.locator('#historyList');
    await expect(historyList).toBeVisible();

    // Check clear button exists
    const clearBtn = page.locator('#clearHistory');
    await expect(clearBtn).toBeVisible();
  });

  test('should display version number', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);
    const runtimeVersion = await page.evaluate(() => chrome.runtime.getManifest().version);
    const footerVersion = page.locator('#footerVersion');
    await expect(footerVersion).toBeVisible();
    await expect(footerVersion).toHaveText(`v${runtimeVersion}`);
  });

  test('should have developer mode toggle', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);

    // Scroll to dev mode toggle
    const devModeToggle = page.locator('.toggle').filter({ has: page.locator('#devMode') });
    await devModeToggle.scrollIntoViewIfNeeded();
    await expect(devModeToggle).toBeVisible();
  });

  test('should show dev section when dev mode enabled', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);

    // Initially dev section should be hidden
    const devSection = page.locator('#devSection');
    await expect(devSection).not.toBeVisible();

    // Scroll to and click dev mode toggle
    const devModeToggle = page.locator('.toggle').filter({ has: page.locator('#devMode') }).locator('.toggle-slider');
    await devModeToggle.scrollIntoViewIfNeeded();
    await devModeToggle.click();

    // Dev section should now be visible
    await expect(devSection).toBeVisible();
  });

  test('should run Inspect DOM via dev bridge', async ({ context, extensionId }) => {
    const chatgptPage = await context.newPage();
    await chatgptPage.goto('https://chatgpt.com/?temporary-chat=true');
    await chatgptPage.waitForLoadState('domcontentloaded');

    const page = await openOptionsPage(context, extensionId);

    const devModeToggle = page
      .locator('.toggle')
      .filter({ has: page.locator('#devMode') })
      .locator('.toggle-slider');
    await devModeToggle.scrollIntoViewIfNeeded();
    await devModeToggle.click();
    await page.waitForTimeout(200);

    const inspectButton = page.locator('#btn-inspect-dom');
    await expect(inspectButton).toBeVisible();
    await inspectButton.click();

    const toastMessage = page.locator('#toastMessage');
    await expect(toastMessage).toContainText('Check ChatGPT console');
  });
});
