import React from 'react';
import type { Song } from '../../types';
import './SongThumbnailStrip.css';

interface Props {
  song: Song;
  currentSlideIndex: number;
  onSelectSlide: (globalIndex: number) => void;
  /** Compact mode for stage / side panels */
  compact?: boolean;
}

/**
 * Thumbnail / file-manager style view of a song.
 * Each [Section] is a labelled group; slides within it appear as cards.
 * Click a card to jump to that slide.
 *
 * Blank lines in the source text create separate slides.
 * [Section] headers create the groups shown here.
 */
export function SongThumbnailStrip({
  song,
  currentSlideIndex,
  onSelectSlide,
  compact = false,
}: Props) {
  let runningIndex = 0;

  return (
    <div className={`thumbnail-strip ${compact ? 'compact' : ''}`}>
      {song.sections.map((section) => {
        const startIndex = runningIndex;
        runningIndex += section.slides.length;

        return (
          <div key={section.id} className="thumb-section">
            <div className="thumb-section-label">[{section.label}]</div>
            <div className="thumb-slides">
              {section.slides.map((slide, si) => {
                const idx = startIndex + si;
                const isActive = idx === currentSlideIndex;
                return (
                  <button
                    key={slide.id}
                    className={`thumb-card ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectSlide(idx)}
                    title={`${section.label} · slide ${si + 1}`}
                  >
                    <div className="thumb-card-index">{si + 1}</div>
                    <div className="thumb-card-lines">
                      {slide.lines.length === 0 ? (
                        <span className="thumb-empty">(empty)</span>
                      ) : (
                        slide.lines
                          .slice(0, compact ? 2 : 4)
                          .map((line) => (
                            <div key={line.id} className="thumb-line truncate">
                              {line.text || ' '}
                            </div>
                          ))
                      )}
                      {slide.lines.length > (compact ? 2 : 4) && (
                        <div className="thumb-more">…</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
