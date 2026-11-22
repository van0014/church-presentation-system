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
  flatIndex: number;
}

/**
 * Line-break + slide-break editor.
 *
 * Interaction (minimal UI):
 * - Caret snaps to nearest word edge
 * - Click word edge → SPLIT line
 * - Click line start/end → JOIN with prev/next line
 * - Shift+click line start/end → SLIDE BREAK (instead of join)
 * - Click the gap BETWEEN two lines in the same slide → SLIDE BREAK there
 * - Click an existing “slide break” separator → remove it (merge slides, keep lines)
 */
export function LineBreakEditor({ song, onSave, onCancel }: Props) {
  const [sections, setSections] = useState<SongSection[]>(
    structuredClone(song.sections)
  );
  const [title] = useState(song.title);
  const [hover, setHover] = useState<{
    flatIndex: number;
    offset: number;
    mode: 'split' | 'join-prev' | 'join-next' | 'slide-break';
  } | null>(null);
  const [gapHover, setGapHover] = useState<string | null>(null); // "si-sli-afterLi"

  const containerRef = useRef<HTMLDivElement>(null);

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
    if (clamped === 0 || clamped === text.length) return clamped;
    if (text[clamped] === ' ' || text[clamped - 1] === ' ') return clamped;

    let left = clamped;
    while (left > 0 && text[left - 1] !== ' ') left--;
    let right = clamped;
    while (right < text.length && text[right] !== ' ') right++;

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
        setHover({
          flatIndex,
          offset: 0,
          mode: e.shiftKey ? 'slide-break' : 'join-prev',
        });
        return;
      }

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

      let mode: 'split' | 'join-prev' | 'join-next' | 'slide-break' = 'split';
      if (snapped === 0 || snapped === text.length) {
        if (e.shiftKey) {
          mode = 'slide-break';
        } else {
          mode = snapped === 0 ? 'join-prev' : 'join-next';
        }
      }

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
          const prevLine = slide.lines[fl.lineIndex - 1];
          const curr = slide.lines[fl.lineIndex];
          prevLine.text = `${prevLine.text} ${curr.text}`.replace(/\s+/g, ' ').trim();
          slide.lines.splice(fl.lineIndex, 1);
        } else if (fl.slideIndex > 0) {
          const prevSlide = section.slides[fl.slideIndex - 1];
          const last = prevSlide.lines[prevSlide.lines.length - 1];
          const curr = slide.lines[0];
          if (last && curr) {
            last.text = `${last.text} ${curr.text}`.replace(/\s+/g, ' ').trim();
            slide.lines.shift();
            prevSlide.lines.push(...slide.lines);
            section.slides.splice(fl.slideIndex, 1);
          }
        }
      } else {
        if (fl.lineIndex < slide.lines.length - 1) {
          const curr = slide.lines[fl.lineIndex];
          const nextLine = slide.lines[fl.lineIndex + 1];
          curr.text = `${curr.text} ${nextLine.text}`.replace(/\s+/g, ' ').trim();
          slide.lines.splice(fl.lineIndex + 1, 1);
        } else if (fl.slideIndex < section.slides.length - 1) {
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

  /**
   * Insert a slide break AFTER the given line within its slide.
   * Lines after that index move into a new following slide.
   */
  const applySlideBreakAfter = (
    sectionIndex: number,
    slideIndex: number,
    lineIndex: number
  ) => {
    setSections((prev) => {
      const next = structuredClone(prev);
      const section = next[sectionIndex];
      const slide = section.slides[slideIndex];
      if (lineIndex < 0 || lineIndex >= slide.lines.length - 1) {
        // Nothing after this line in the slide — no-op (or break before next slide only)
        return prev;
      }
      const remaining = slide.lines.splice(lineIndex + 1);
      const newSlide: SongSlide = {
        id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        lines: remaining,
      };
      section.slides.splice(slideIndex + 1, 0, newSlide);
      return next;
    });
    setHover(null);
    setGapHover(null);
  };

  /** Shift+click at line end → slide break after this line; at start → after previous line */
  const applySlideBreakFromEdge = (flatIndex: number, atStart: boolean) => {
    const fl = flatLines[flatIndex];
    if (!fl) return;
    if (atStart) {
      if (fl.lineIndex > 0) {
        applySlideBreakAfter(fl.sectionIndex, fl.slideIndex, fl.lineIndex - 1);
      }
      // at first line of slide: already at slide boundary
    } else {
      applySlideBreakAfter(fl.sectionIndex, fl.slideIndex, fl.lineIndex);
    }
  };

  /** Merge two adjacent slides (remove slide break, keep all lines separate) */
  const removeSlideBreak = (sectionIndex: number, afterSlideIndex: number) => {
    setSections((prev) => {
      const next = structuredClone(prev);
      const section = next[sectionIndex];
      if (afterSlideIndex < 0 || afterSlideIndex >= section.slides.length - 1) {
        return prev;
      }
      const current = section.slides[afterSlideIndex];
      const following = section.slides[afterSlideIndex + 1];
      current.lines.push(...following.lines);
      section.slides.splice(afterSlideIndex + 1, 1);
      return next;
    });
  };

  const handleClick = (e: React.MouseEvent, flatIndex: number) => {
    if (!hover || hover.flatIndex !== flatIndex) return;

    if (hover.mode === 'split') {
      applySplit(flatIndex, hover.offset);
      return;
    }

    if (hover.mode === 'slide-break' || e.shiftKey) {
      const atStart = hover.offset === 0;
      applySlideBreakFromEdge(flatIndex, atStart);
      return;
    }

    if (hover.mode === 'join-prev') {
      applyJoin(flatIndex, 'prev');
    } else if (hover.mode === 'join-next') {
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

  // Recompute hover mode when Shift is held while already hovering
  useEffect(() => {
    const onKeyChange = (e: KeyboardEvent) => {
      if (e.key !== 'Shift' || !hover) return;
      const fl = flatLines[hover.flatIndex];
      if (!fl) return;
      const atEdge =
        hover.offset === 0 || hover.offset === (fl.text?.length ?? 0);
      if (!atEdge) return;
      setHover((h) =>
        h
          ? {
              ...h,
              mode: e.type === 'keydown' ? 'slide-break' : hover.offset === 0 ? 'join-prev' : 'join-next',
            }
          : null
      );
    };
    window.addEventListener('keydown', onKeyChange);
    window.addEventListener('keyup', onKeyChange);
    return () => {
      window.removeEventListener('keydown', onKeyChange);
      window.removeEventListener('keyup', onKeyChange);
    };
  }, [hover, flatLines]);

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
            Click word edge → split · line edge → join · gap or Shift+edge →
            slide break · Esc cancel · ⌘S save
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
                  const flatIndex = flatIndexMap.get(`${si}-${sli}-${li}`) ?? 0;
                  const isHovered = hover?.flatIndex === flatIndex;
                  const caretOffset = isHovered ? hover!.offset : -1;
                  const mode = isHovered ? hover!.mode : null;
                  const gapKey = `${si}-${sli}-${li}`;
                  const showGapAfter = li < slide.lines.length - 1;

                  return (
                    <React.Fragment key={line.id}>
                      <div
                        className={`lb-line ${isHovered ? 'hovered' : ''} ${
                          mode ? `mode-${mode}` : ''
                        }`}
                        onMouseMove={(e) => handleMouseMove(e, flatIndex)}
                        onMouseLeave={handleMouseLeave}
                        onClick={(e) => handleClick(e, flatIndex)}
                      >
                        <LineWithCaret
                          text={line.text}
                          caretOffset={caretOffset}
                          mode={mode}
                        />
                      </div>

                      {/* Inter-line gap: click to insert slide break */}
                      {showGapAfter && (
                        <div
                          className={`lb-inter-gap ${
                            gapHover === gapKey ? 'hot' : ''
                          }`}
                          onMouseEnter={() => setGapHover(gapKey)}
                          onMouseLeave={() => setGapHover(null)}
                          onClick={() =>
                            applySlideBreakAfter(si, sli, li)
                          }
                          title="Click to insert slide break"
                        >
                          <span className="lb-inter-gap-label">
                            {gapHover === gapKey ? 'slide break' : ''}
                          </span>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Existing slide break between slides — click to remove */}
                {sli < section.slides.length - 1 && (
                  <div
                    className="lb-slide-gap removable"
                    title="Click to remove slide break (merge slides)"
                    onClick={() => removeSlideBreak(si, sli)}
                  >
                    <span>slide break · click to merge</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <footer className="lb-footer">
        <span className="text-muted text-xs">
          Esc cancel · ⌘S / Ctrl+S save
        </span>
        <button className="btn btn-primary text-sm" onClick={handleSave}>
          Save
        </button>
      </footer>
    </div>
  );
}

function LineWithCaret({
  text,
  caretOffset,
  mode,
}: {
  text: string;
  caretOffset: number;
  mode: 'split' | 'join-prev' | 'join-next' | 'slide-break' | null;
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
            : mode === 'slide-break'
            ? 'Click to insert slide break'
            : mode === 'join-prev'
            ? 'Click to join with previous · Shift+click for slide break'
            : 'Click to join with next · Shift+click for slide break'
        }
      />
      {after}
    </span>
  );
}
