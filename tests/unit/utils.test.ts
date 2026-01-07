/**
 * Unit tests for shared/utils.ts
 * @module tests/unit/utils
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeText,
  isEmptyText,
  escapeHTML,
  nowTimestamp,
  generateId,
  sleep,
  throttle,
  debounce,
  isNonEmptyString,
  assert,
} from '@shared/utils';

describe('normalizeText', () => {
  it('should handle null and undefined', () => {
    expect(normalizeText(null)).toBe('');
    expect(normalizeText(undefined)).toBe('');
  });

  it('should trim whitespace', () => {
    expect(normalizeText('  hello  ')).toBe('hello');
  });

  it('should convert non-breaking spaces to regular spaces', () => {
    expect(normalizeText('hello\u00A0world')).toBe('hello world');
  });

  it('should remove carriage returns', () => {
    expect(normalizeText('hello\r\nworld')).toBe('hello\nworld');
  });

  it('should remove trailing whitespace before newlines', () => {
    expect(normalizeText('hello   \nworld')).toBe('hello\nworld');
  });

  it('should collapse multiple newlines to maximum 2', () => {
    expect(normalizeText('hello\n\n\n\nworld')).toBe('hello\n\nworld');
  });

  it('should handle mixed cases', () => {
    const input = '  hello\u00A0  \n\n\n\nworld\r\n  ';
    const expected = 'hello\n\nworld';
    expect(normalizeText(input)).toBe(expected);
  });
});

describe('isEmptyText', () => {
  it('should return true for null and undefined', () => {
    expect(isEmptyText(null)).toBe(true);
    expect(isEmptyText(undefined)).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(isEmptyText('')).toBe(true);
  });

  it('should return true for whitespace only', () => {
    expect(isEmptyText('   ')).toBe(true);
    expect(isEmptyText('\n\n')).toBe(true);
    expect(isEmptyText('\t\t')).toBe(true);
  });

  it('should return false for non-empty text', () => {
    expect(isEmptyText('hello')).toBe(false);
    expect(isEmptyText('  hello  ')).toBe(false);
  });
});

describe('escapeHTML', () => {
  it('should escape ampersand', () => {
    expect(escapeHTML('a & b')).toBe('a &amp; b');
  });

  it('should escape angle brackets', () => {
    expect(escapeHTML('<script>')).toBe('&lt;script&gt;');
  });

  it('should escape quotes', () => {
    expect(escapeHTML('"hello"')).toBe('&quot;hello&quot;');
    expect(escapeHTML("'hello'")).toBe('&#039;hello&#039;');
  });

  it('should handle all cases together', () => {
    expect(escapeHTML('<a href="test">Tom & Jerry\'s</a>')).toBe(
      '&lt;a href=&quot;test&quot;&gt;Tom &amp; Jerry&#039;s&lt;/a&gt;'
    );
  });
});

describe('nowTimestamp', () => {
  it('should return time in HH:MM:SS format', () => {
    const result = nowTimestamp();
    expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });
});

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should include timestamp', () => {
    const before = Date.now();
    const id = generateId();
    const after = Date.now();
    const timestamp = parseInt(id.split('-')[0], 10);
    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
  });
});

describe('sleep', () => {
  it('should resolve after specified time', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45); // Allow some tolerance
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should throttle function calls', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce function calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should reset timer on each call', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('isNonEmptyString', () => {
  it('should return false for non-strings', () => {
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
    expect(isNonEmptyString(123)).toBe(false);
    expect(isNonEmptyString({})).toBe(false);
  });

  it('should return false for empty strings', () => {
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString('   ')).toBe(false);
  });

  it('should return true for non-empty strings', () => {
    expect(isNonEmptyString('hello')).toBe(true);
    expect(isNonEmptyString('  hello  ')).toBe(true);
  });
});

describe('assert', () => {
  it('should not throw for true condition', () => {
    expect(() => assert(true, 'test')).not.toThrow();
  });

  it('should throw for false condition', () => {
    expect(() => assert(false, 'test message')).toThrow(
      'Assertion failed: test message'
    );
  });
});
