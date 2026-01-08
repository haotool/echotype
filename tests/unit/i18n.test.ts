/**
 * EchoType - i18n Utility Tests
 * @module tests/unit/i18n
 *
 * Unit tests for internationalization utilities.
 * Updated: 2026-01-08T00:30:00+08:00
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMessage, getUILanguage, formatRelativeTime, applyI18n } from '../../src/shared/i18n';

describe('i18n utilities', () => {
  describe('getMessage', () => {
    beforeEach(() => {
      // Mock chrome.i18n.getMessage
      vi.stubGlobal('chrome', {
        i18n: {
          getMessage: vi.fn((key: string, substitutions?: string | string[]) => {
            const messages: Record<string, string> = {
              btnStart: 'Start',
              btnPause: 'Pause',
              statusReady: 'Ready',
              minutesAgo: `${substitutions} minutes ago`,
            };
            return messages[key] || '';
          }),
          getUILanguage: vi.fn(() => 'en'),
        },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should return translated message for valid key', () => {
      const result = getMessage('btnStart');
      expect(result).toBe('Start');
    });

    it('should return key as fallback when message not found', () => {
      const result = getMessage('nonExistentKey');
      expect(result).toBe('nonExistentKey');
    });

    it('should handle substitutions', () => {
      const result = getMessage('minutesAgo', '5');
      expect(result).toBe('5 minutes ago');
    });

    it('should return key when chrome.i18n is not available', () => {
      vi.stubGlobal('chrome', undefined);
      const result = getMessage('btnStart');
      expect(result).toBe('btnStart');
    });
  });

  describe('getUILanguage', () => {
    beforeEach(() => {
      vi.stubGlobal('chrome', {
        i18n: {
          getUILanguage: vi.fn(() => 'zh-TW'),
        },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should return UI language', () => {
      const result = getUILanguage();
      expect(result).toBe('zh-TW');
    });

    it('should return "en" as fallback when chrome.i18n is not available', () => {
      vi.stubGlobal('chrome', undefined);
      const result = getUILanguage();
      expect(result).toBe('en');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.stubGlobal('chrome', {
        i18n: {
          getMessage: vi.fn((key: string, substitutions?: string | string[]) => {
            const messages: Record<string, string> = {
              justNow: 'Just now',
              minutesAgo: `${substitutions} minutes ago`,
              yesterday: 'Yesterday',
            };
            return messages[key] || key;
          }),
        },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should return "Just now" for recent timestamps', () => {
      const now = Date.now();
      const result = formatRelativeTime(now - 30 * 1000); // 30 seconds ago
      expect(result).toBe('Just now');
    });

    it('should return minutes ago for timestamps within an hour', () => {
      const now = Date.now();
      const result = formatRelativeTime(now - 5 * 60 * 1000); // 5 minutes ago
      expect(result).toBe('5 minutes ago');
    });

    it('should return hours ago for timestamps within a day', () => {
      const now = Date.now();
      const result = formatRelativeTime(now - 3 * 60 * 60 * 1000); // 3 hours ago
      expect(result).toBe('3h ago');
    });

    it('should return "Yesterday" for timestamps from yesterday', () => {
      const now = Date.now();
      const result = formatRelativeTime(now - 24 * 60 * 60 * 1000); // 24 hours ago
      expect(result).toBe('Yesterday');
    });

    it('should return days ago for older timestamps', () => {
      const now = Date.now();
      const result = formatRelativeTime(now - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      expect(result).toBe('3d ago');
    });
  });

  describe('applyI18n', () => {
    beforeEach(() => {
      vi.stubGlobal('chrome', {
        i18n: {
          getMessage: vi.fn((key: string) => {
            const messages: Record<string, string> = {
              btnStart: 'Start Recording',
              btnPause: 'Stop Recording',
              placeholder: 'Enter text here',
              tooltip: 'Click to start',
            };
            return messages[key] || key;
          }),
        },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      document.body.innerHTML = '';
    });

    it('should apply i18n to elements with data-i18n attribute', () => {
      document.body.innerHTML = `
        <span data-i18n="btnStart">Default</span>
        <button data-i18n="btnPause">Default</button>
      `;

      applyI18n();

      expect(document.querySelector('[data-i18n="btnStart"]')?.textContent).toBe('Start Recording');
      expect(document.querySelector('[data-i18n="btnPause"]')?.textContent).toBe('Stop Recording');
    });

    it('should apply i18n to placeholder attributes', () => {
      document.body.innerHTML = `
        <input type="text" data-i18n-placeholder="placeholder" placeholder="Default">
      `;

      applyI18n();

      const input = document.querySelector('input') as HTMLInputElement;
      expect(input.placeholder).toBe('Enter text here');
    });

    it('should apply i18n to title attributes', () => {
      document.body.innerHTML = `
        <button data-i18n-title="tooltip" title="Default">Button</button>
      `;

      applyI18n();

      const button = document.querySelector('button');
      expect(button?.getAttribute('title')).toBe('Click to start');
    });

    it('should handle non-input elements for placeholder gracefully', () => {
      document.body.innerHTML = `
        <div data-i18n-placeholder="placeholder">Not an input</div>
      `;

      // Should not throw
      expect(() => applyI18n()).not.toThrow();
    });
  });
});
