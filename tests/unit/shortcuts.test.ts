/**
 * Unit tests for shared/shortcuts.ts
 * @module tests/unit/shortcuts
 */

import { describe, it, expect } from 'vitest';
import { detectOS, formatShortcut, getSuggestedShortcut } from '@shared/shortcuts';

describe('detectOS', () => {
  it('should detect mac from platform', () => {
    const os = detectOS({ platform: 'MacIntel' });
    expect(os).toBe('mac');
  });

  it('should detect windows from user agent', () => {
    const os = detectOS({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' });
    expect(os).toBe('windows');
  });

  it('should default to linux when unknown', () => {
    const os = detectOS({ platform: 'X11' });
    expect(os).toBe('linux');
  });
});

describe('formatShortcut', () => {
  it('should format mac shortcuts with symbols', () => {
    const formatted = formatShortcut('Alt+Shift+D', 'mac');
    expect(formatted).toBe('⌥⇧D');
  });

  it('should keep text shortcuts for windows', () => {
    const formatted = formatShortcut('Alt+Shift+D', 'windows');
    expect(formatted).toBe('Alt+Shift+D');
  });
});

describe('getSuggestedShortcut', () => {
  const manifest: Partial<chrome.runtime.Manifest> = {
    commands: {
      'toggle-dictation': {
        suggested_key: {
          default: 'Alt+Shift+D',
          mac: 'Alt+Shift+D',
        },
      },
    },
  };

  it('should return OS-specific suggestion when present', () => {
    const shortcut = getSuggestedShortcut('toggle-dictation', 'mac', manifest);
    expect(shortcut).toBe('Alt+Shift+D');
  });

  it('should fall back to default suggestion', () => {
    const shortcut = getSuggestedShortcut('toggle-dictation', 'windows', manifest);
    expect(shortcut).toBe('Alt+Shift+D');
  });

  it('should return null for unknown command', () => {
    const shortcut = getSuggestedShortcut('missing', 'windows', manifest);
    expect(shortcut).toBeNull();
  });
});
