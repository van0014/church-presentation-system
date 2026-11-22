/**
 * Intelligent line-break suggestions for song lyrics.
 *
 * Goals:
 * - Prefer natural singing / breathing pauses
 * - Avoid single-word lines and very long lines
 * - Keep existing punctuation and capitalization
 * - Produce a reasonable number of lines per slide (usually 2–4)
 */

export interface BreakSuggestion {
  lines: string[];
  /** Confidence 0–1 (higher = more confident in the break points) */
  confidence: number;
  notes?: string[];
}

/** Common words that often end a musical phrase */
const PHRASE_ENDERS = new Set([
  'and', 'but', 'or', 'yet', 'so', 'for', 'nor',
  'the', 'a', 'an', 'to', 'of', 'in', 'on', 'at',
  'my', 'your', 'his', 'her', 'our', 'their',
  'is', 'are', 'was', 'were', 'be', 'been',
  'i', 'you', 'he', 'she', 'we', 'they', 'it',
]);

/** Strong break indicators (punctuation or conjunctions that almost always end a line) */
const STRONG_BREAK = /[.!?;:—–]\s*$/;

/**
 * Split raw lyrics text into candidate lines.
 * Accepts either already-broken text or a single long paragraph.
 */
export function normalizeRawLyrics(raw: string): string[] {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

/**
 * Suggest better line breaks for a set of lines (or a single block).
 *
 * Strategy:
 * 1. If lines are already reasonably short → light cleanup only
 * 2. If many long lines → attempt to split on natural pauses
 * 3. Prefer even-ish distribution and avoid orphan words
 */
export function suggestLineBreaks(
  input: string | string[],
  options: {
    targetLinesPerSlide?: number;
    maxCharsPerLine?: number;
    preferEven?: boolean;
  } = {}
): BreakSuggestion {
  const {
    targetLinesPerSlide = 4,
    maxCharsPerLine = 42,
    preferEven = true,
  } = options;

  const rawLines = Array.isArray(input) ? input : normalizeRawLyrics(input);
  const notes: string[] = [];

  // Flatten everything into words while remembering original structure
  const allText = rawLines.join(' ').replace(/\s+/g, ' ').trim();
  if (!allText) {
    return { lines: [], confidence: 0, notes: ['Empty input'] };
  }

  // If the input already has short, sensible lines, keep most of them
  const avgLen = rawLines.reduce((s, l) => s + l.length, 0) / rawLines.length;
  if (rawLines.length >= 3 && avgLen <= maxCharsPerLine * 1.15) {
    // Minor cleanup only
    const cleaned = rawLines.map((l) => l.replace(/\s+/g, ' ').trim());
    return {
      lines: cleaned,
      confidence: 0.85,
      notes: ['Input already well-structured – light cleanup applied'],
    };
  }

  // Otherwise rebuild from words
  const words = allText.split(/\s+/);
  const result: string[] = [];
  let current = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const tentative = current ? `${current} ${word}` : word;

    const isStrong = STRONG_BREAK.test(word);
    const isPhraseEnd =
      PHRASE_ENDERS.has(word.toLowerCase().replace(/[^\w]/g, '')) &&
      current.length > 12;

    if (tentative.length > maxCharsPerLine && current) {
      // Force a break before this word
      result.push(current);
      current = word;
    } else if (isStrong && current.length > 8) {
      result.push(tentative);
      current = '';
    } else if (isPhraseEnd && current.length > 18) {
      // Soft break after a phrase-ending word when the line is already decent length
      result.push(tentative);
      current = '';
    } else {
      current = tentative;
    }
  }

  if (current) result.push(current);

  // Post-process: merge very short trailing lines
  const final: string[] = [];
  for (let i = 0; i < result.length; i++) {
    const line = result[i];
    if (
      line.split(/\s+/).length <= 2 &&
      final.length > 0 &&
      final[final.length - 1].length + line.length < maxCharsPerLine
    ) {
      final[final.length - 1] += ' ' + line;
    } else {
      final.push(line);
    }
  }

  // Optional: try to balance for target lines per slide
  if (preferEven && final.length > targetLinesPerSlide) {
    notes.push(
      `Produced ${final.length} lines (target ~${targetLinesPerSlide} per slide)`
    );
  }

  const confidence =
    final.length >= 2 && final.every((l) => l.length <= maxCharsPerLine * 1.3)
      ? 0.75
      : 0.55;

  return {
    lines: final,
    confidence,
    notes: notes.length ? notes : undefined,
  };
}

/**
 * Convert an array of plain strings into SongLine objects with stable ids.
 */
export function linesToSongLines(lines: string[]): { id: string; text: string }[] {
  return lines.map((text, i) => ({
    id: `line-${Date.now()}-${i}`,
    text,
  }));
}
