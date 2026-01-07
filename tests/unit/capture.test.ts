/**
 * Unit tests for content/chatgpt/capture.ts
 * @module tests/unit/capture
 * 
 * Note: Complex async capture tests are done via E2E testing.
 * Unit tests focus on synchronous helpers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the selectors module
vi.mock('@content/chatgpt/selectors', () => ({
  readComposerRawText: vi.fn(() => ''),
  detectStatus: vi.fn(() => 'idle'),
  getComposerElement: vi.fn(() => null),
}));

import { readComposerRawText } from '@content/chatgpt/selectors';
import {
  readComposerText,
  cancelCapture,
  DEFAULT_CAPTURE_CONFIG,
} from '@content/chatgpt/capture';

describe('readComposerText', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty string when composer is empty', () => {
    vi.mocked(readComposerRawText).mockReturnValue('');
    expect(readComposerText()).toBe('');
  });

  it('should normalize text from composer', () => {
    vi.mocked(readComposerRawText).mockReturnValue('  hello\u00A0world  ');
    expect(readComposerText()).toBe('hello world');
  });

  it('should handle newlines correctly', () => {
    vi.mocked(readComposerRawText).mockReturnValue('line1\n\n\n\nline2');
    expect(readComposerText()).toBe('line1\n\nline2');
  });

  it('should trim whitespace', () => {
    vi.mocked(readComposerRawText).mockReturnValue('   \n  hello  \n   ');
    expect(readComposerText()).toBe('hello');
  });
});

describe('cancelCapture', () => {
  it('should not throw when called', () => {
    expect(() => cancelCapture()).not.toThrow();
  });

  it('should be callable multiple times', () => {
    expect(() => {
      cancelCapture();
      cancelCapture();
      cancelCapture();
    }).not.toThrow();
  });
});

describe('DEFAULT_CAPTURE_CONFIG', () => {
  it('should have reasonable defaults', () => {
    expect(DEFAULT_CAPTURE_CONFIG.interval).toBe(80);
    expect(DEFAULT_CAPTURE_CONFIG.stableMs).toBe(520);
    expect(DEFAULT_CAPTURE_CONFIG.timeout).toBe(9000);
    expect(DEFAULT_CAPTURE_CONFIG.requireChange).toBe(true);
  });
});
