/**
 * Dictionary Management Module
 * Handles dictionary data structure and text replacement logic
 */

export interface DictionaryEntry {
  from: string;   // Original text to replace
  to: string;     // Replacement text
}

export type Dictionary = DictionaryEntry[];

/**
 * Applies dictionary replacements to text
 * Longer strings are matched first to prevent partial replacements
 *
 * @param text - The text to apply replacements to
 * @param dictionary - Array of replacement rules
 * @returns Text with all replacements applied
 *
 * @example
 * const dict = [
 *   { from: "東京都", to: "とうきょうと" },
 *   { from: "東京", to: "とうきょう" }
 * ];
 * applyDictionary("東京都と東京", dict); // "とうきょうとととうきょう"
 */
export function applyDictionary(text: string, dictionary: Dictionary): string {
  if (!dictionary || dictionary.length === 0) {
    return text;
  }

  // Sort by length (longest first) to prevent partial replacements
  const sorted = [...dictionary].sort((a, b) => b.from.length - a.from.length);

  let result = text;
  let replacementCount = 0;

  for (const entry of sorted) {
    if (!entry.from) continue; // Skip empty entries

    // Count occurrences before replacement
    const occurrences = result.split(entry.from).length - 1;

    if (occurrences > 0) {
      // Global replacement using split/join (safer than regex with special chars)
      result = result.split(entry.from).join(entry.to);
      replacementCount += occurrences;
    }
  }

  return result;
}

/**
 * Counts how many replacements would be made without actually applying them
 * Useful for preview functionality
 *
 * @param text - The text to check
 * @param dictionary - Array of replacement rules
 * @returns Number of replacements that would be made
 */
export function countReplacements(text: string, dictionary: Dictionary): number {
  if (!dictionary || dictionary.length === 0) {
    return 0;
  }

  const sorted = [...dictionary].sort((a, b) => b.from.length - a.from.length);
  let result = text;
  let totalCount = 0;

  for (const entry of sorted) {
    if (!entry.from) continue;

    const occurrences = result.split(entry.from).length - 1;
    totalCount += occurrences;

    // Apply replacement to avoid double-counting
    result = result.split(entry.from).join(entry.to);
  }

  return totalCount;
}

/**
 * Validates dictionary data structure
 *
 * @param data - Data to validate
 * @returns true if valid dictionary format
 */
export function isValidDictionary(data: unknown): data is Dictionary {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.every(entry =>
    typeof entry === 'object' &&
    entry !== null &&
    'from' in entry &&
    'to' in entry &&
    typeof entry.from === 'string' &&
    typeof entry.to === 'string'
  );
}

/**
 * Creates a sample dictionary for testing
 */
export function createSampleDictionary(): Dictionary {
  return [
    { from: "專門", to: "専門" },
    { from: "國語", to: "国語" },
    { from: "東京都", to: "とうきょうと" },
    { from: "東京", to: "とうきょう" }
  ];
}
