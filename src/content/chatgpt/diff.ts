/**
 * EchoType - Baseline Diff Algorithm
 * @module content/chatgpt/diff
 *
 * Computes the "added text" by comparing the final transcription
 * with the baseline (text that was in the composer before dictation).
 */

import { normalizeText } from '@shared/utils';

// ============================================================================
// Core Diff Function
// ============================================================================

/**
 * Compute the text that was added relative to the baseline.
 *
 * This handles several cases:
 * 1. Final text starts with baseline → added = final - baseline
 * 2. Baseline is found somewhere in final → added = parts before + after baseline
 * 3. Neither → fallback to longest common prefix removal
 *
 * @param baseline - The text before dictation started
 * @param finalText - The text after dictation completed
 * @returns The added text only
 *
 * @example
 * computeAddedText("Hello", "Hello world") // "world"
 * computeAddedText("", "New text") // "New text"
 * computeAddedText("Old", "NewOldMore") // "NewMore"
 */
export function computeAddedText(baseline: string, finalText: string): string {
  const b = normalizeText(baseline);
  const f = normalizeText(finalText);

  // Empty final → nothing added
  if (!f) return '';

  // Empty baseline → everything is new
  if (!b) return f;

  // Case 1: Final starts with baseline (most common)
  // e.g., baseline="Hello", final="Hello world" → added="world"
  if (f.startsWith(b)) {
    return normalizeText(f.slice(b.length)).replace(/^\s+/, '');
  }

  // Case 2: Baseline found somewhere in final
  // e.g., baseline="middle", final="start middle end" → added="start end"
  const idx = f.indexOf(b);
  if (idx >= 0) {
    const before = f.slice(0, idx);
    const after = f.slice(idx + b.length);
    // Collapse multiple spaces to single space when joining
    const joined = (before + after).replace(/\s+/g, ' ').trim();
    return normalizeText(joined);
  }

  // Case 3: Fallback - find longest common prefix and return remainder
  // This handles cases where transcription slightly modified the baseline
  const minLen = Math.min(b.length, f.length);
  let commonPrefixLen = 0;
  while (commonPrefixLen < minLen && b[commonPrefixLen] === f[commonPrefixLen]) {
    commonPrefixLen++;
  }

  return normalizeText(f.slice(commonPrefixLen)).replace(/^\s+/, '');
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if there's any meaningful difference between baseline and final.
 *
 * @param baseline - The baseline text
 * @param finalText - The final text
 * @returns True if there's meaningful added content
 */
export function hasAddedContent(baseline: string, finalText: string): boolean {
  const added = computeAddedText(baseline, finalText);
  return added.length > 0;
}

/**
 * Get a summary of the diff operation.
 *
 * @param baseline - The baseline text
 * @param finalText - The final text
 * @returns Summary object
 */
export function getDiffSummary(
  baseline: string,
  finalText: string
): {
  baselineLength: number;
  finalLength: number;
  addedLength: number;
  addedText: string;
} {
  const b = normalizeText(baseline);
  const f = normalizeText(finalText);
  const added = computeAddedText(baseline, finalText);

  return {
    baselineLength: b.length,
    finalLength: f.length,
    addedLength: added.length,
    addedText: added,
  };
}
