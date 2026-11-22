/**
 * Intelligent line-break suggestions for song lyrics.
 *
 * Domain rules prioritise musical / phonetic phrase sense.
 * Confidence is intentionally conservative when uncertain.
 */

export type BreakDensity = 'sparse' | 'normal' | 'condensed';

export interface BreakSuggestion {
  lines: string[];
  confidence: number;
  notes?: string[];
  density: BreakDensity;
  warnings: string[];
}

/** Never end a line on these (function / connective words) */
const WEAK_ENDERS = new Set([
  'a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'by', 'with',
  'from', 'into', 'onto', 'upon', 'over', 'under', 'and', 'but', 'or',
  'nor', 'yet', 'so', 'as', 'if', 'when', 'while', 'than', 'that',
  'this', 'these', 'those', 'my', 'your', 'his', 'her', 'our', 'their',
  'i', 'you', 'he', 'she', 'we', 'they', 'it', 'is', 'are', 'was',
  'were', 'be', 'been', 'am', 'do', 'does', 'did', 'have', 'has', 'had',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might',
  'must', 'o', 'oh', 'all', 'its', 'let', 'not', 'no', 'nor',
]);

/** Prefer to end a line on these content / phrase-final words */
const STRONG_ENDERS = new Set([
  'god', 'lord', 'jesus', 'christ', 'father', 'spirit', 'king', 'saviour',
  'savior', 'wonder', 'thunder', 'grace', 'love', 'peace', 'joy', 'hope',
  'made', 'displayed', 'believed', 'relieved', 'found', 'see', 'seen',
  'thee', 'thou', 'art', 'me', 'him', 'us', 'them', 'more', 'adore',
  'praise', 'glory', 'holy', 'amen', 'forever', 'evermore', 'free',
  'saved', 'blood', 'cross', 'name', 'power', 'might', 'light', 'night',
  'day', 'way', 'soul', 'heart', 'voice', 'sing', 'sang', 'song',
]);

/** Prefer to start a new line with these (clause / phrase starts) */
const CLAUSE_STARTERS = new Set([
  'when', 'while', 'consider', 'then', 'and', 'but', 'for', 'that',
  'who', 'which', 'where', 'how', 'as', 'though', 'although', 'because',
  'until', 'unless', 'before', 'after', 'since', 'if',
  'i', 'we', 'he', 'she', 'they', 'you',
  'o', 'oh', 'come', 'sing', 'praise', 'bless', 'thank',
]);

const PUNCT_BREAK = /[.!?,;:—–]$/;

const DENSITY_CONFIG: Record<
  BreakDensity,
  { maxChars: number; preferMinChars: number }
> = {
  sparse: { maxChars: 46, preferMinChars: 20 },
  normal: { maxChars: 36, preferMinChars: 14 },
  condensed: { maxChars: 24, preferMinChars: 8 },
};

export function normalizeRawLyrics(raw: string): string[] {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function wordKey(w: string): string {
  return w.toLowerCase().replace(/[^\w']/g, '');
}

function endsWeak(line: string): boolean {
  const last = wordKey(line.split(/\s+/).pop() || '');
  return WEAK_ENDERS.has(last);
}

function breakScore(
  words: string[],
  wordIndex: number,
  currentLineLen: number,
  cfg: { maxChars: number; preferMinChars: number }
): number {
  if (wordIndex < 0 || wordIndex >= words.length - 1) return -200;

  const word = words[wordIndex];
  const key = wordKey(word);
  const nextKey = wordKey(words[wordIndex + 1] || '');
  let score = 0;

  if (PUNCT_BREAK.test(word)) score += 60;
  if (STRONG_ENDERS.has(key)) score += 24;
  if (WEAK_ENDERS.has(key)) score -= 70; // almost never
  if (WEAK_ENDERS.has(nextKey)) score -= 12;
  if (CLAUSE_STARTERS.has(nextKey) && currentLineLen >= cfg.preferMinChars) {
    score += 20;
  }

  const ratio = currentLineLen / cfg.maxChars;
  if (ratio > 0.92) score += 28;
  else if (ratio > 0.72) score += 12;
  else if (ratio < 0.28) score -= 22;

  if (currentLineLen >= cfg.preferMinChars) score += 10;

  return score;
}

export function suggestLineBreaks(
  input: string | string[],
  options: { density?: BreakDensity; maxCharsPerLine?: number } = {}
): BreakSuggestion {
  const density: BreakDensity = options.density || 'normal';
  const cfg = { ...DENSITY_CONFIG[density] };
  if (options.maxCharsPerLine) cfg.maxChars = options.maxCharsPerLine;

  const rawLines = Array.isArray(input) ? input : normalizeRawLyrics(input);
  const notes: string[] = [];
  const warnings: string[] = [];

  const allText = rawLines.join(' ').replace(/\s+/g, ' ').trim();
  if (!allText) {
    return {
      lines: [],
      confidence: 0,
      notes: ['Empty input'],
      density,
      warnings: ['No text to process'],
    };
  }

  const words = allText.split(/\s+/);
  const lines: string[] = [];
  let start = 0;

  while (start < words.length) {
    let bestBreak = -1;
    let bestScore = -Infinity;
    let line = '';

    for (let i = start; i < words.length; i++) {
      const nextLine = line ? `${line} ${words[i]}` : words[i];
      if (nextLine.length > cfg.maxChars && line) {
        if (bestBreak < start) bestBreak = i - 1;
        break;
      }

      line = nextLine;
      const score = breakScore(words, i, line.length, cfg);

      if (i < words.length - 1 && score > bestScore) {
        bestScore = score;
        bestBreak = i;
      }

      // Hard stop on punctuation once we have a minimal phrase
      if (
        PUNCT_BREAK.test(words[i]) &&
        line.length >= Math.min(10, cfg.preferMinChars) &&
        i < words.length - 1
      ) {
        bestBreak = i;
        bestScore = score + 100;
        break;
      }

      if (
        line.length >= cfg.preferMinChars &&
        score >= 28 &&
        i < words.length - 1
      ) {
        bestBreak = i;
        bestScore = score;
        if (score >= 45) break;
      }
    }

    if (bestBreak < start) {
      lines.push(words.slice(start).join(' '));
      break;
    }

    // If chosen break ends weak, try to extend one word when possible
    let end = bestBreak;
    if (endsWeak(words.slice(start, end + 1).join(' ')) && end + 1 < words.length) {
      const extended = words.slice(start, end + 2).join(' ');
      if (extended.length <= cfg.maxChars + 8) {
        end = end + 1;
      }
    }

    lines.push(words.slice(start, end + 1).join(' '));
    start = end + 1;
  }

  // Merge tiny orphans
  const final: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const wc = line.split(/\s+/).length;
    if (
      wc <= 2 &&
      final.length > 0 &&
      final[final.length - 1].length + line.length + 1 <= cfg.maxChars + 8
    ) {
      final[final.length - 1] += ' ' + line;
    } else {
      final.push(line);
    }
  }

  // --- Conservative confidence + warnings ---
  let confidence = 0.55; // start modest
  const weakEnds = final.filter(endsWeak);
  const longLines = final.filter((l) => l.length > cfg.maxChars * 1.15);
  const shortLines = final.filter((l) => l.split(/\s+/).length <= 2);

  if (weakEnds.length === 0) confidence += 0.12;
  else {
    confidence -= 0.08 * weakEnds.length;
    warnings.push(
      `${weakEnds.length} line(s) end on a weak word — check rhythm`
    );
  }

  if (longLines.length) {
    confidence -= 0.06 * longLines.length;
    warnings.push(`${longLines.length} line(s) longer than target density`);
  }

  if (shortLines.length > 1) {
    confidence -= 0.04;
    warnings.push('Some very short lines — consider merging');
  }

  // If input already had sensible breaks, be less assertive
  const avgIn =
    rawLines.reduce((s, l) => s + l.length, 0) / Math.max(1, rawLines.length);
  if (rawLines.length >= 3 && avgIn <= cfg.maxChars * 1.1) {
    notes.push('Input already had structure — suggestion may be aggressive');
    confidence -= 0.08;
  }

  confidence = Math.max(0.25, Math.min(0.82, confidence));

  notes.push(`Density: ${density} (~${cfg.maxChars} chars/line)`);
  if (confidence < 0.5) {
    warnings.push('Low confidence — manual review strongly recommended');
  } else if (confidence < 0.65) {
    warnings.push('Medium confidence — please review before saving');
  }

  return {
    lines: final,
    confidence,
    notes,
    density,
    warnings,
  };
}

export function linesToSongLines(
  lines: string[]
): { id: string; text: string }[] {
  return lines.map((text, i) => ({
    id: `line-${Date.now()}-${i}`,
    text,
  }));
}
