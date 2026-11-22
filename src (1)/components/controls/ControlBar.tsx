import React, { useEffect, useCallback } from 'react';
import { usePresentation } from '../../stores/PresentationContext';
import './ControlBar.css';

export function ControlBar() {
  const {
    state,
    presentHighlighted,
    nextItem,
    prevItem,
    nextSlide,
    prevSlide,
    setBlack,
    setClear,
    goToItem,
    setHighlight,
  } = usePresentation();

  const { isBlack, isClear, currentItemIndex, highlightedIndex } =
    state.presentation;
  const total = state.currentPlaylist?.items.length ?? 0;

  // Keyboard model (final):
  // - Playlist selection: mouse click (or number keys 1-9)
  // - Space: present highlighted, or next slide if already live
  // - All arrows: slide navigation within the live item
  // - B / C: black / clear
  // - Optional: PageUp/PageDown or dedicated buttons for next/prev item
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
          if (highlightedIndex === currentItemIndex) {
            nextSlide();
          } else {
            presentHighlighted();
          }
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
        case 'PageDown':
          e.preventDefault();
          nextItem();
          break;
        case 'PageUp':
          e.preventDefault();
          prevItem();
          break;
        default:
          if (e.code.startsWith('Digit')) {
            const num = parseInt(e.code.replace('Digit', ''), 10);
            if (num >= 1 && num <= 9) {
              const idx = num - 1;
              if (idx < total) {
                setHighlight(idx);
                if (e.shiftKey) {
                  goToItem(idx);
                }
              }
            }
          }
      }
    },
    [
      presentHighlighted,
      nextSlide,
      prevSlide,
      nextItem,
      prevItem,
      setBlack,
      setClear,
      isBlack,
      isClear,
      highlightedIndex,
      currentItemIndex,
      goToItem,
      setHighlight,
      total,
    ]
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
          title="Previous item (PageUp)"
        >
          ⏮ Item
        </button>
        <button
          className="ctrl-btn primary"
          onClick={() => presentHighlighted()}
          title="Present highlighted (Space)"
        >
          Present
        </button>
        <button
          className="ctrl-btn"
          onClick={nextItem}
          title="Next item (PageDown)"
        >
          Item ⏭
        </button>
      </div>

      <div className="control-group">
        <button
          className="ctrl-btn"
          onClick={prevSlide}
          title="Previous slide (← / ↑)"
        >
          ◀ Slide
        </button>
        <button
          className="ctrl-btn"
          onClick={nextSlide}
          title="Next slide (→ / ↓)"
        >
          Slide ▶
        </button>
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

      <div className="control-info text-sm text-muted">
        Live {currentItemIndex + 1} · Sel {highlightedIndex + 1} / {total}
      </div>
    </div>
  );
}
