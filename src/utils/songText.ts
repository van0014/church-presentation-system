/**
 * SongSelect-style / church lyrics text format
 *
 * Rules:
 * - Lines starting with [Something] are section headers → become SongSection groups
 * - A blank line inside a section starts a new slide
 * - Non-blank lines are lyric lines belonging to the current slide
 *
 * Example:
 *
 *   [Intro]
 *   Line one of intro
 *   Line two of intro
 *
 *   [Verse 1]
 *   First line of verse
 *   Second line of verse
 *
 *   Third line (new slide because of blank line above)
 *   Fourth line
 *
 *   [Chorus]
 *   ...
 */

import type { SongSection, SongSlide, SongLine } from '../types';

let _idCounter = 0;
function uid(prefix = 'id'): string {
  _idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${_idCounter}`;
}

/** Parse SongSelect-style plain text into structured sections → slides → lines */
export function parseSongText(raw: string): SongSection[] {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  const sections: SongSection[] = [];
  let currentSection: SongSection | null = null;
  let currentSlideLines: SongLine[] = [];
  let pendingBlank = false;

  function flushSlide() {
    if (currentSlideLines.length === 0) return;
    if (!currentSection) {
      // Lyrics before any [Section] → put into an implicit "Song" section
      currentSection = {
        id: uid('sec'),
        label: 'Song',
        slides: [],
      };
      sections.push(currentSection);
    }
    const slide: SongSlide = {
      id: uid('slide'),
      lines: currentSlideLines,
    };
    currentSection.slides.push(slide);
    currentSlideLines = [];
  }

  function flushSection() {
    flushSlide();
    currentSection = null;
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd(); // keep leading spaces if any, but trim trailing
    const trimmed = line.trim();

    // Section header: [Verse 1], [Chorus], [Intro], etc.
    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      flushSection();
      currentSection = {
        id: uid('sec'),
        label: sectionMatch[1].trim(),
        slides: [],
      };
      sections.push(currentSection);
      pendingBlank = false;
      continue;
    }

    // Blank line → end current slide
    if (trimmed === '') {
      if (currentSlideLines.length > 0) {
        flushSlide();
      }
      pendingBlank = true;
      continue;
    }

    // Normal lyric line
    currentSlideLines.push({
      id: uid('line'),
      text: line, // preserve original indentation if present
    });
    pendingBlank = false;
  }

  flushSection();

  // Ensure at least one empty section so the editor has something to show
  if (sections.length === 0) {
    sections.push({
      id: uid('sec'),
      label: 'Verse 1',
      slides: [{ id: uid('slide'), lines: [] }],
    });
  }

  return sections;
}

/** Serialize structured sections back to SongSelect-style text */
export function serializeSongText(sections: SongSection[]): string {
  const parts: string[] = [];

  for (const section of sections) {
    parts.push(`[${section.label}]`);

    section.slides.forEach((slide, slideIndex) => {
      if (slideIndex > 0) {
        parts.push(''); // blank line between slides
      }
      for (const line of slide.lines) {
        parts.push(line.text);
      }
    });

    // Blank line after a section (before the next [Header]) looks clean
    parts.push('');
  }

  // Remove trailing blank lines
  while (parts.length > 0 && parts[parts.length - 1] === '') {
    parts.pop();
  }

  return parts.join('\n');
}

/** Flatten all slides into a linear list of slides (for presentation playback) */
export function flattenSlides(sections: SongSection[]): SongSlide[] {
  return sections.flatMap((s) => s.slides);
}

/** Count total slides across all sections */
export function totalSlides(sections: SongSection[]): number {
  return sections.reduce((sum, s) => sum + s.slides.length, 0);
}

/** Get the slide at a global index (for presentation navigation) */
export function getSlideAt(
  sections: SongSection[],
  globalIndex: number
): { section: SongSection; slide: SongSlide; sectionIndex: number; slideIndex: number } | null {
  let remaining = globalIndex;
  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];
    if (remaining < section.slides.length) {
      return {
        section,
        slide: section.slides[remaining],
        sectionIndex: si,
        slideIndex: remaining,
      };
    }
    remaining -= section.slides.length;
  }
  return null;
}

/** Simple auto-suggest for line breaks: split long lines on common singing pauses */
export function suggestLineBreaks(text: string, maxChars = 42): string {
  // Very lightweight heuristic – real phonetic logic can come later
  const lines = text.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    if (line.trim() === '' || line.trim().startsWith('[')) {
      result.push(line);
      continue;
    }
    if (line.length <= maxChars) {
      result.push(line);
      continue;
    }

    // Try to break on punctuation or common conjunctions / pauses
    const breakPoints = [', ', '; ', ' – ', ' — ', ' and ', ' but ', ' that ', ' which '];
    let remaining = line;
    while (remaining.length > maxChars) {
      let best = -1;
      for (const bp of breakPoints) {
        const idx = remaining.lastIndexOf(bp, maxChars);
        if (idx > best && idx > maxChars * 0.4) best = idx + bp.length - 1;
      }
      if (best === -1) {
        // Fall back to last space before limit
        best = remaining.lastIndexOf(' ', maxChars);
      }
      if (best === -1 || best < 10) {
        result.push(remaining);
        remaining = '';
        break;
      }
      result.push(remaining.slice(0, best + 1).trimEnd());
      remaining = remaining.slice(best + 1).trimStart();
    }
    if (remaining) result.push(remaining);
  }

  return result.join('\n');
}
