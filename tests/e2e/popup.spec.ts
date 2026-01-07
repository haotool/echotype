/**
 * E2E tests for Popup UI
 * @module tests/e2e/popup.spec
 *
 * Tests the extension's popup page functionality.
 * Updated: 2026-01-07T22:54:00+08:00
 */

import { test, expect, openPopupPage } from './fixtures';

test.describe('Popup UI', () => {
  test('should load popup page successfully', async ({ context, extensionId }) => {
    const page = await openPopupPage(context, extensionId);

    // Check page title
    await expect(page).toHaveTitle('EchoType');

    // Check logo is visible
    await expect(page.locator('.logo-text')).toContainText('EchoType');
  });

  test('should display status badge', async ({ context, extensionId }) => {
    const page = await openPopupPage(context, extensionId);

    // Check status badge exists
    const statusBadge = page.locator('.status-badge');
    await expect(statusBadge).toBeVisible();

    // Check initial status is "Ready" or equivalent
    const statusText = page.locator('#status-text');
    await expect(statusText).toBeVisible();
  });

  test('should display action buttons', async ({ context, extensionId }) => {
    const page = await openPopupPage(context, extensionId);

    // Check Start button
    const startBtn = page.locator('#btn-start');
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toBeEnabled();

    // Check Stop button (should be disabled initially)
    const stopBtn = page.locator('#btn-stop');
    await expect(stopBtn).toBeVisible();
    await expect(stopBtn).toBeDisabled();

    // Check Submit button
    const submitBtn = page.locator('#btn-submit');
    await expect(submitBtn).toBeVisible();
  });

  test('should display result section', async ({ context, extensionId }) => {
    const page = await openPopupPage(context, extensionId);

    // Check result section exists
    const resultSection = page.locator('.result-section');
    await expect(resultSection).toBeVisible();

    // Check result text area
    const resultText = page.locator('#result-text');
    await expect(resultText).toBeVisible();

    // Check copy button
    const copyBtn = page.locator('#btn-copy');
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toBeDisabled(); // Disabled when no result
  });

  test('should display keyboard shortcuts reference', async ({
    context,
    extensionId,
  }) => {
    const page = await openPopupPage(context, extensionId);

    // Check shortcuts section exists
    const shortcuts = page.locator('.shortcuts');
    await expect(shortcuts).toBeVisible();

    // Check shortcut keys are displayed
    await expect(page.locator('.shortcut-key').first()).toBeVisible();
  });

  test('should display footer links', async ({ context, extensionId }) => {
    const page = await openPopupPage(context, extensionId);

    // Check Settings link
    const settingsLink = page.locator('#link-options');
    await expect(settingsLink).toBeVisible();

    // Check History link
    const historyLink = page.locator('#link-history');
    await expect(historyLink).toBeVisible();
  });

  test('should open options page when clicking settings link', async ({
    context,
    extensionId,
  }) => {
    const page = await openPopupPage(context, extensionId);

    // Click settings link
    const settingsLink = page.locator('#link-options');

    // Wait for new page to open
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      settingsLink.click(),
    ]);

    // Check new page is options page
    await newPage.waitForLoadState();
    expect(newPage.url()).toContain('options');
  });

  test('should have proper styling (dark theme)', async ({
    context,
    extensionId,
  }) => {
    const page = await openPopupPage(context, extensionId);

    // Check body has dark background
    const body = page.locator('body');
    const backgroundColor = await body.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should be a dark color (check if it's not white/light)
    expect(backgroundColor).not.toBe('rgb(255, 255, 255)');
  });
});

test.describe('Popup i18n', () => {
  test('should display localized text', async ({ context, extensionId }) => {
    const page = await openPopupPage(context, extensionId);

    // Check that i18n elements have text (not empty)
    const i18nElements = page.locator('[data-i18n]');
    const count = await i18nElements.count();

    expect(count).toBeGreaterThan(0);

    // Each i18n element should have non-empty text
    for (let i = 0; i < Math.min(count, 5); i++) {
      const element = i18nElements.nth(i);
      const text = await element.textContent();
      expect(text?.trim()).not.toBe('');
    }
  });
});
