/**
 * E2E tests for Options page
 * @module tests/e2e/options.spec
 * 
 * Tests the extension's options/settings page functionality.
 * Updated: 2026-01-07T22:24:00+08:00
 */

import { test, expect, openOptionsPage } from './fixtures';

test.describe('Options Page', () => {
  test('should load options page successfully', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);
    
    // Check page title
    await expect(page).toHaveTitle('EchoType Settings');
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('EchoType Settings');
  });

  test('should display all settings toggles', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);
    
    // Check for auto-copy toggle
    const autoCopyLabel = page.locator('label[for="autoCopyToClipboard"]');
    await expect(autoCopyLabel).toBeVisible();
    
    // Check for auto-paste toggle
    const autoPasteLabel = page.locator('label[for="autoPasteToActiveTab"]');
    await expect(autoPasteLabel).toBeVisible();
    
    // Check for return focus toggle
    const returnFocusLabel = page.locator('label[for="returnFocusAfterStart"]');
    await expect(returnFocusLabel).toBeVisible();
  });

  test('should toggle autoCopyToClipboard setting', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);
    
    const autoCopyCheckbox = page.locator('#autoCopyToClipboard');
    
    // Get initial state
    const initialChecked = await autoCopyCheckbox.isChecked();
    
    // Toggle
    await autoCopyCheckbox.click();
    
    // Verify state changed
    const newChecked = await autoCopyCheckbox.isChecked();
    expect(newChecked).toBe(!initialChecked);
    
    // Wait for save
    await page.waitForTimeout(100);
    
    // Reload page to verify persistence
    await page.reload();
    
    // Verify persisted state
    const persistedChecked = await autoCopyCheckbox.isChecked();
    expect(persistedChecked).toBe(!initialChecked);
  });

  test('should toggle autoPasteToActiveTab setting', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);
    
    const autoPasteCheckbox = page.locator('#autoPasteToActiveTab');
    
    // Get initial state
    const initialChecked = await autoPasteCheckbox.isChecked();
    
    // Toggle
    await autoPasteCheckbox.click();
    
    // Verify state changed
    const newChecked = await autoPasteCheckbox.isChecked();
    expect(newChecked).toBe(!initialChecked);
  });

  test('should show keyboard shortcuts section', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);

    // Check shortcuts section exists
    const shortcutsSection = page.locator('.card-title:has-text("Keyboard")');
    await expect(shortcutsSection).toBeVisible();

    // Check shortcut items are displayed
    const shortcutItems = page.locator('.shortcut-item');
    await expect(shortcutItems).toHaveCount(4);

    // Check individual shortcuts labels
    await expect(page.locator('[data-i18n="shortcutStart"]')).toBeVisible();
    await expect(page.locator('[data-i18n="shortcutPause"]')).toBeVisible();
    await expect(page.locator('[data-i18n="shortcutSubmit"]')).toBeVisible();
    await expect(page.locator('[data-i18n="shortcutPaste"]')).toBeVisible();
  });

  test('should show customize shortcuts button', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);

    // Check customize button exists
    const customizeBtn = page.locator('#customizeShortcuts');
    await expect(customizeBtn).toBeVisible();
    await expect(customizeBtn).toBeEnabled();
  });

  test('should display history section', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);

    // Check history section exists
    const historySection = page.locator('#historyList');
    await expect(historySection).toBeVisible();

    // Check clear button exists
    const clearBtn = page.locator('#clearHistory');
    await expect(clearBtn).toBeVisible();
  });

  test('should display version number', async ({ context, extensionId }) => {
    const page = await openOptionsPage(context, extensionId);

    // Check version is displayed
    const versionText = page.locator('.version');
    await expect(versionText).toBeVisible();
    await expect(versionText).toContainText('v0.3.0');
  });
});
