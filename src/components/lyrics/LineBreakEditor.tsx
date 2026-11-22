import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Song, SongSection, SongSlide, SongLine } from '../../types';
import { serializeSongText, totalSlides } from '../../utils/songText';
import './LineBreakEditor.css';

interface Props {
  song: Song;
  onSave: (updated: Song) => void;
  onCancel: () => void;
}

interface FlatLine {
  sectionIndex: number;
  slideIndex: number;
  lineIndex: number;
  sectionLabel: string;
  text: string;
  /** Global visual index for keyboard / focus */
  flatIndex: number;
}

/**
 * Revolutionary line-break editor.
 *
 * Interaction model (no buttons needed):
 * - Accent caret magnetically snaps to the nearest word boundary
 * - Click on a word boundary → SPLIT the line there
 * - Click at the very start or end of a line → JOIN with previous / next line
 * - Blank lines (slide breaks) are preserved as visual separators
 */
export function LineBreakEditor({ song, onSave, onCancel }: Props) {
  const [sections, setSections] = useState<SongSection[]>(
    structuredClone(song.sections)
  );
  const [title] = useState(song.title);
  const [hover, setHover] = useState<{
    flatIndex: number;
    /** Character offset that the caret is snapped to */
    offset: number;
    /** 'split' | 'join-prev' | 'join-next' */
    mode: 'split' | 'join-prev' | 'join-next';
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Flatten all lines for easier hit-testing, keeping section/slide identity
  const flatLines: FlatLine[] = [];
  sections.forEach((section, si) => {
    section.slides.forEach((slide, sli) => {
      slide.lines.forEach((line, li) => {
        flatLines.push({
          sectionIndex: si,
          slideIndex: sli,
          lineIndex: li,
          sectionLabel: section.label,
          text: line.text,
          flatIndex: flatLines.length,
        });
      });
    });
  });

  const snapToWordBoundary = (text: string, rawOffset: number): number => {
    if (text.length === 0) return 0;
    const clamped = Math.max(0, Math.min(text.length, rawOffset));

    // Already at a boundary?
    if (clamped === 0 || clamped === text.length) return clamped;
    if (text[clamped] === ' ' || text[clamped - 1] === ' ') return clamped;

    // Find nearest space (or start/end)
    let left = clamped;
    while (left > 0 && text[left - 1] !== ' ') left--;
    let right = clamped;
    while (right < text.length && text[right] !== ' ') right++;

    // Prefer the closer boundary; ties go to the right (after the word)
    if (clamped - left <= right - clamped) return left;
    return right;
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, flatIndex: number) => {
      const el = e.currentTarget as HTMLElement;
      const textEl = el.querySelector('.line-text') as HTMLElement | null;
      if (!textEl) return;

      const text = flatLines[flatIndex]?.text ?? '';
      if (!text) {
        setHover({ flatIndex, offset: 0, mode: 'join-prev' });
        return;
      }

      // Approximate character offset from mouse X using canvas metrics
      const rect = textEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const style = window.getComputedStyle(textEl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

      let offset = text.length;
      let bestDist = Infinity;
      for (let i = 0; i <= text.length; i++) {
        const w = ctx.measureText(text.slice(0, i)).width;
        const dist = Math.abs(w - x);
        if (dist < bestDist) {
          bestDist = dist;
          offset = i;
        }
      }

      const snapped = snapToWordBoundary(text, offset);

      let mode: 'split' | 'join-prev' | 'join-next' = 'split';
      if (snapped === 0) mode = 'join-prev';
      else if (snapped === text.length) mode = 'join-next';

      setHover({ flatIndex, offset: snapped, mode });
    },
    [flatLines]
  );

  const handleMouseLeave = () => setHover(null);

  const applySplit = (flatIndex: number, offset: number) => {
    const fl = flatLines[flatIndex];
    if (!fl) return;
    const text = fl.text;
    if (offset <= 0 || offset >= text.length) return;

    const left = text.slice(0, offset).trimEnd();
    const right = text.slice(offset).trimStart();
    if (!left || !right) return;

    setSections((prev) => {
      const next = structuredClone(prev);
      const slide = next[fl.sectionIndex].slides[fl.slideIndex];
      const newLine: SongLine = {
        id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: right,
      };
      slide.lines[fl.lineIndex].text = left;
      slide.lines.splice(fl.lineIndex + 1, 0, newLine);
      return next;
    });
    setHover(null);
  };

  const applyJoin = (flatIndex: number, direction: 'prev' | 'next') => {
    const fl = flatLines[flatIndex];
    if (!fl) return;

    setSections((prev) => {
      const next = structuredClone(prev);
      const section = next[fl.sectionIndex];
      const slide = section.slides[fl.slideIndex];

      if (direction === 'prev') {
        if (fl.lineIndex > 0) {
          // Join with previous line in same slide
          const prevLine = slide.lines[fl.lineIndex - 1];
          const curr = slide.lines[fl.lineIndex];
          prevLine.text = `${prevLine.text} ${curr.text}`.replace(/\s+/g, ' ').trim();
          slide.lines.splice(fl.lineIndex, 1);
        } else if (fl.slideIndex > 0) {
          // First line of slide → join with last line of previous slide
          // (this also removes a slide break)
          const prevSlide = section.slides[fl.slideIndex - 1];
          const last = prevSlide.lines[prevSlide.lines.length - 1];
          const curr = slide.lines[0];
          if (last && curr) {
            last.text = `${last.text} ${curr.text}`.replace(/\s+/g, ' ').trim();
            slide.lines.shift();
            // Move remaining lines of this slide into previous, then remove empty slide
            prevSlide.lines.push(...slide.lines);
            section.slides.splice(fl.slideIndex, 1);
          }
        }
      } else {
        // join-next
        if (fl.lineIndex < slide.lines.length - 1) {
          const curr = slide.lines[fl.lineIndex];
          const nextLine = slide.lines[fl.lineIndex + 1];
          curr.text = `${curr.text} ${nextLine.text}`.replace(/\s+/g, ' ').trim();
          slide.lines.splice(fl.lineIndex + 1, 1);
        } else if (fl.slideIndex < section.slides.length - 1) {
          // Last line of slide → join with first line of next slide
          const nextSlide = section.slides[fl.slideIndex + 1];
          const curr = slide.lines[fl.lineIndex];
          const first = nextSlide.lines[0];
          if (curr && first) {
            curr.text = `${curr.text} ${first.text}`.replace(/\s+/g, ' ').trim();
            nextSlide.lines.shift();
            slide.lines.push(...nextSlide.lines);
            section.slides.splice(fl.slideIndex + 1, 1);
          }
        }
      }
      return next;
    });
    setHover(null);
  };

  const handleClick = (flatIndex: number) => {
    if (!hover || hover.flatIndex !== flatIndex) return;
    if (hover.mode === 'split') {
      applySplit(flatIndex, hover.offset);
    } else if (hover.mode === 'join-prev') {
      applyJoin(flatIndex, 'prev');
    } else {
      applyJoin(flatIndex, 'next');
    }
  };

  const handleSave = () => {
    const updated: Song = {
      ...song,
      sections,
      rawSource: serializeSongText(sections),
      lineBreaksReviewed: true,
    };
    onSave(updated);
  };

  // Keyboard: Esc cancel, Enter/Cmd+S save
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Map from (section, slide, line) → flatIndex for stable lookup during render
  const flatIndexMap = new Map<string, number>();
  flatLines.forEach((fl) => {
    flatIndexMap.set(
      `${fl.sectionIndex}-${fl.slideIndex}-${fl.lineIndex}`,
      fl.flatIndex
    );
  });

  return (
    <div className="linebreak-editor" ref={containerRef}>
      <header className="lb-header">
        <div className="lb-title">
          <span className="lb-song-title">{title}</span>
          <span className="lb-hint">
            Click word edge to split · Click line edge to join · Esc cancel · ⌘S
            save
          </span>
        </div>
        <div className="lb-meta">
          {sections.length} sections · {totalSlides(sections)} slides
        </div>
      </header>

      <div className="lb-body">
        {sections.map((section, si) => (
          <div key={section.id} className="lb-section">
            <div className="lb-section-label">[{section.label}]</div>

            {section.slides.map((slide, sli) => (
              <div key={slide.id} className="lb-slide">
                {slide.lines.map((line, li) => {
                  const flatIndex =
                    flatIndexMap.get(`${si}-${sli}-${li}`) ?? 0;
                  const isHovered = hover?.flatIndex === flatIndex;
                  const caretOffset = isHovered ? hover!.offset : -1;
                  const mode = isHovered ? hover!.mode : null;

                  return (
                    <div
                      key={line.id}
                      className={`lb-line ${isHovered ? 'hovered' : ''} ${
                        mode ? `mode-${mode}` : ''
                      }`}
                      onMouseMove={(e) => handleMouseMove(e, flatIndex)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleClick(flatIndex)}
                    >
                      <LineWithCaret
                        text={line.text}
                        caretOffset={caretOffset}
                        mode={mode}
                      />
                    </div>
                  );
                })}

                {sli < section.slides.length - 1 && (
                  <div className="lb-slide-gap" title="Slide break">
                    <span>slide break</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <footer className="lb-footer">
        <span className="text-muted text-xs">
          Esc to cancel · ⌘S / Ctrl+S to save
        </span>
        <button className="btn btn-primary text-sm" onClick={handleSave}>
          Save
        </button>
      </footer>
    </div>
  );
}

/** Renders a line of text with an accent caret at the snapped offset */
function LineWithCaret({
  text,
  caretOffset,
  mode,
}: {
  text: string;
  caretOffset: number;
  mode: 'split' | 'join-prev' | 'join-next' | null;
}) {
  if (caretOffset < 0 || !mode) {
    return <span className="line-text">{text || '\u00A0'}</span>;
  }

  const before = text.slice(0, caretOffset);
  const after = text.slice(caretOffset);

  return (
    <span className="line-text">
      {before}
      <span
        className={`accent-caret ${mode}`}
        data-mode={mode}
        title={
          mode === 'split'
            ? 'Click to split here'
            : mode === 'join-prev'
            ? 'Click to join with previous line'
            : 'Click to join with next line'
        }
      />
      {after}
    </span>
  );
}
