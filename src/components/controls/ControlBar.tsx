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
    setBlack,
    setClear,
  } = usePresentation();

  const { isBlack, isClear, currentItemIndex } = state.presentation;
  const total = state.currentPlaylist?.items.length ?? 0;

  // Keyboard shortcuts
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          nextItem();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          prevSlide();
          break;
        case 'ArrowDown':
          e.preventDefault();
          nextItem();
          break;
        case 'ArrowUp':
          e.preventDefault();
          prevItem();
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
          // Number keys for quick jump (1-9)
          if (e.code.startsWith('Digit')) {
            const num = parseInt(e.code.replace('Digit', ''), 10);
            if (num >= 1 && num <= 9) {
              // Future: support modifier for +9
              // For now just go to index num-1
            }
          }
      }
    },
    [nextItem, prevItem, nextSlide, prevSlide, setBlack, setClear, isBlack, isClear]
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
          title="Previous item (↑)"
          disabled={currentItemIndex <= 0}
        >
          ⏮ Prev
        </button>
        <button
          className="ctrl-btn primary"
          onClick={nextItem}
          title="Next item (Space / ↓)"
        >
          Next ⏭
        </button>
      </div>

      <div className="control-group">
        <button
          className="ctrl-btn"
          onClick={prevSlide}
          title="Previous slide (←)"
        >
          ◀ Slide
        </button>
        <button
          className="ctrl-btn"
          onClick={nextSlide}
          title="Next slide (→)"
        >
          Slide ▶
        </button>
      </div>

      <div className="control-group">
        <button
          className={`ctrl-btn ${isBlack ? 'active danger' : ''}`}
          onClick={() => setBlack(!isBlack)}
          title="Black screen (B)"
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

      <div className="control-info text-sm text-muted">
        Item {currentItemIndex + 1} / {total}
      </div>
    </div>
  );
}
