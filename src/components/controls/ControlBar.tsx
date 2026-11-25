import React, { useEffect, useCallback } from 'react';
import { usePresentation } from '../../stores/PresentationContext';
import './ControlBar.css';

export function ControlBar() {
  const {
    state,
    nextItem,
    prevItem,
    nextSlide,
    prevSlide,
    presentCursor,
    setBlack,
    setClear,
  } = usePresentation();

  const { isBlack, isClear, currentItemIndex, cursorSlideIndex, currentSlideIndex } =
    state.presentation;
  const total = state.currentPlaylist?.items.length ?? 0;

  /**
   * Keyboard model (within current playlist item):
   * - ← → : move cursor (preview) only — does not change Main/Stage
   * - Space : present cursor (show on output). If already presented, advance + present
   * - Arrows do NOT change playlist selection
   * - B / C / Esc : black / clear
   */
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          presentCursor();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          prevSlide();
          break;
        case 'KeyB':
          e.preventDefault();
          setBlack(!isBlack);
          break;
        case 'KeyC':
          e.preventDefault();
          setClear(!isClear);
          break;
        case 'Escape':
          setBlack(false);
          setClear(false);
          break;
        default:
          break;
      }
    },
    [presentCursor, nextSlide, prevSlide, setBlack, setClear, isBlack, isClear]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div className="control-bar">
      <div className="control-group">
        <button
          className="ctrl-btn"
          onClick={prevItem}
          title="Previous playlist item"
          disabled={currentItemIndex <= 0}
        >
          ⏮ Item
        </button>
        <button
          className="ctrl-btn"
          onClick={nextItem}
          title="Next playlist item"
          disabled={total === 0 || currentItemIndex >= total - 1}
        >
          Item ⏭
        </button>
      </div>

      <div className="control-group">
        <button
          className="ctrl-btn"
          onClick={prevSlide}
          title="Move cursor back (←)"
        >
          ◀ Cursor
        </button>
        <button
          className="ctrl-btn primary"
          onClick={presentCursor}
          title="Present cursor slide (Space)"
        >
          Present ⏎
        </button>
        <button
          className="ctrl-btn"
          onClick={nextSlide}
          title="Move cursor forward (→)"
        >
          Cursor ▶
        </button>
      </div>

      <div className="control-group text-xs text-muted" style={{ gap: 8 }}>
        <span>
          Cursor {cursorSlideIndex + 1}
          {cursorSlideIndex !== currentSlideIndex && (
            <span> · Live {currentSlideIndex + 1}</span>
          )}
        </span>
      </div>

      <div className="control-group">
        <button
          className={`ctrl-btn ${isBlack ? 'active danger' : ''}`}
          onClick={() => setBlack(!isBlack)}
          title="Black (B)"
        >
          Black
        </button>
        <button
          className={`ctrl-btn ${isClear ? 'active' : ''}`}
          onClick={() => setClear(!isClear)}
          title="Clear (C)"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
