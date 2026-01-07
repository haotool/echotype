/**
 * Unit tests for content/chatgpt/diff.ts
 * @module tests/unit/diff
 */

import { describe, it, expect } from 'vitest';
import {
  computeAddedText,
  hasAddedContent,
  getDiffSummary,
} from '@content/chatgpt/diff';

describe('computeAddedText', () => {
  describe('empty cases', () => {
    it('should return empty for empty final text', () => {
      expect(computeAddedText('baseline', '')).toBe('');
    });

    it('should return full text when baseline is empty', () => {
      expect(computeAddedText('', 'new text')).toBe('new text');
    });

    it('should return empty when both are empty', () => {
      expect(computeAddedText('', '')).toBe('');
    });
  });

  describe('case 1: final starts with baseline', () => {
    it('should extract added text when final starts with baseline', () => {
      expect(computeAddedText('Hello', 'Hello world')).toBe('world');
    });

    it('should handle whitespace correctly', () => {
      expect(computeAddedText('Hello', 'Hello  world')).toBe('world');
    });

    it('should handle multiline', () => {
      expect(computeAddedText('Line 1', 'Line 1\nLine 2')).toBe('Line 2');
    });
  });

  describe('case 2: baseline found in middle', () => {
    it('should extract text before and after baseline', () => {
      expect(computeAddedText('middle', 'start middle end')).toBe('start end');
    });
  });

  describe('case 3: common prefix fallback', () => {
    it('should use longest common prefix when no direct match', () => {
      // baseline="abc", final="abxyz" → common prefix "ab" → added="xyz"
      expect(computeAddedText('abc', 'abxyz')).toBe('xyz');
    });
  });

  describe('real-world scenarios', () => {
    it('should handle typical dictation append', () => {
      const baseline = 'Please help me with';
      const final = 'Please help me with the following task';
      expect(computeAddedText(baseline, final)).toBe('the following task');
    });

    it('should handle Chinese text', () => {
      const baseline = '你好';
      const final = '你好，世界';
      expect(computeAddedText(baseline, final)).toBe('，世界');
    });

    it('should handle punctuation', () => {
      const baseline = 'Hello';
      const final = 'Hello, how are you?';
      expect(computeAddedText(baseline, final)).toBe(', how are you?');
    });
  });
});

describe('hasAddedContent', () => {
  it('should return false when no added content', () => {
    expect(hasAddedContent('same', 'same')).toBe(false);
  });

  it('should return true when there is added content', () => {
    expect(hasAddedContent('Hello', 'Hello world')).toBe(true);
  });

  it('should handle empty baseline', () => {
    expect(hasAddedContent('', 'new')).toBe(true);
  });

  it('should handle empty final', () => {
    expect(hasAddedContent('old', '')).toBe(false);
  });
});

describe('getDiffSummary', () => {
  it('should return correct summary', () => {
    const summary = getDiffSummary('Hello', 'Hello world');
    expect(summary.baselineLength).toBe(5);
    expect(summary.finalLength).toBe(11);
    expect(summary.addedLength).toBe(5);
    expect(summary.addedText).toBe('world');
  });

  it('should handle empty strings', () => {
    const summary = getDiffSummary('', 'new text');
    expect(summary.baselineLength).toBe(0);
    expect(summary.addedText).toBe('new text');
  });
});
