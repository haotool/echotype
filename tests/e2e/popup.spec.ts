/**
 * E2E tests for Popup UI
 * @module tests/e2e/popup.spec
 *
 * Tests the extension's popup page functionality.
 * Updated: 2026-01-08T00:35:00+08:00
 */

import { test, expect, openPopupPage } from './fixtures';

test.describe('Popup UI', () => {
  test('should load popup page successfully', async ({ context, extensionId }) => {
    const page = await openPopupPage(context, extensionId);

    // Check page title
    await expect(page).toHaveTitle('EchoType');

    // Check brand text is visible
    await expect(page.locator('.brand-text')).toContainText('EchoType');
  });

  test('should display status section', async ({ context, extensionId }) => {
    const page = await openPopupPage(context, extensionId);

    // Check status card exists
    const statusCard = page.locator('.status-card');
    await expect(statusCard).toBeVisible();

    // Check status badge exists
    const statusBadge = page.locator('.status-badge');
    await expect(statusBadge).toBeVisible();
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

    // Check result card exists
    const resultCard = page.locator('.result-card');
    await expect(resultCard).toBeVisible();

    // Check result text area
    const resultContent = page.locator('.result-content');
    await expect(resultContent).toBeVisible();

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

  test('should have theme toggle button', async ({ context, extensionId }) => {
    const page = await openPopupPage(context, extensionId);

    // Check theme toggle button exists
    const themeBtn = page.locator('#btn-theme');
    await expect(themeBtn).toBeVisible();
    await expect(themeBtn).toBeEnabled();
  });

  test('should toggle theme when clicking theme button', async ({
    context,
    extensionId,
  }) => {
    const page = await openPopupPage(context, extensionId);

    // Get initial theme
    const body = page.locator('body');
    const initialTheme = await body.getAttribute('data-theme');

    // Click theme toggle
    await page.locator('#btn-theme').click();

    // Check theme changed
    const newTheme = await body.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
  });
});

test.describe('Popup Navigation', () => {
  test('should have settings button in header', async ({ context, extensionId }) => {
    const page = await openPopupPage(context, extensionId);

    const settingsBtn = page.locator('#btn-settings');
    await expect(settingsBtn).toBeVisible();
  });
});
