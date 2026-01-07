/**
 * Unit tests for content/chatgpt/clear.ts
 * @module tests/unit/clear
 * 
 * Note: Complex async clear tests are done via E2E testing.
 * Unit tests focus on synchronous helpers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the selectors module
vi.mock('@content/chatgpt/selectors', () => ({
  getComposerElement: vi.fn(() => null),
  readComposerRawText: vi.fn(() => ''),
}));

import { getComposerElement, readComposerRawText } from '@content/chatgpt/selectors';
import {
  isComposerEmpty,
  focusComposer,
  DEFAULT_CLEAR_CONFIG,
} from '@content/chatgpt/clear';

describe('isComposerEmpty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when composer is empty', () => {
    vi.mocked(readComposerRawText).mockReturnValue('');
    expect(isComposerEmpty()).toBe(true);
  });

  it('should return true for whitespace only', () => {
    vi.mocked(readComposerRawText).mockReturnValue('   \n\n  ');
    expect(isComposerEmpty()).toBe(true);
  });

  it('should return false when composer has content', () => {
    vi.mocked(readComposerRawText).mockReturnValue('hello');
    expect(isComposerEmpty()).toBe(false);
  });

  it('should handle ProseMirror empty state', () => {
    // ProseMirror often leaves just a newline
    vi.mocked(readComposerRawText).mockReturnValue('\n');
    expect(isComposerEmpty()).toBe(true);
  });
});

describe('focusComposer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return false when no composer element', () => {
    vi.mocked(getComposerElement).mockReturnValue(null);
    expect(focusComposer()).toBe(false);
  });

  it('should call focus on element when exists', () => {
    const mockElement = document.createElement('div');
    const focusSpy = vi.spyOn(mockElement, 'focus');
    vi.mocked(getComposerElement).mockReturnValue(mockElement);
    
    focusComposer();
    
    expect(focusSpy).toHaveBeenCalled();
  });
});

describe('DEFAULT_CLEAR_CONFIG', () => {
  it('should have reasonable defaults', () => {
    expect(DEFAULT_CLEAR_CONFIG.attempts).toBe(4);
    expect(DEFAULT_CLEAR_CONFIG.timeoutPerAttempt).toBe(1800);
    expect(DEFAULT_CLEAR_CONFIG.verifyDuration).toBe(320);
  });
});
