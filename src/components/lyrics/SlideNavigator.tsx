import React from 'react';
import { usePresentation } from '../../stores/PresentationContext';
import type { Song, Scripture } from '../../types';
import { totalSlides } from '../../utils/songText';
import './SlideNavigator.css';

/**
 * Large file-manager style navigator.
 * - Cursor (preview): where arrows point — guide only
 * - Presented (live): what Main/Stage show — set by Space
 * Click a card = move cursor only (does not take live until Space)
 */
export function SlideNavigator() {
  const { state, goToSlide, presentAt, getCurrentSong } = usePresentation();
  const item = state.currentItem;
  const song = getCurrentSong();
  const { currentSlideIndex, cursorSlideIndex } = state.presentation;

  if (!item) {
    return (
      <div className="slide-nav empty">
        <p className="text-muted">Select an item from the playlist</p>
      </div>
    );
  }

  if (item.type === 'song' && song) {
    return (
      <SongSlideNavigator
        song={song}
        cursorIndex={cursorSlideIndex}
        presentedIndex={currentSlideIndex}
        onCursor={goToSlide}
        onPresent={presentAt}
      />
    );
  }

  if (item.type === 'scripture' && item.scripture) {
    return (
      <ScriptureSlideNavigator
        scripture={item.scripture}
        cursorIndex={cursorSlideIndex}
        presentedIndex={currentSlideIndex}
        onCursor={goToSlide}
        onPresent={presentAt}
      />
    );
  }

  return (
    <div className="slide-nav generic">
      <div className="generic-card presented">
        <div className="generic-type">{item.type}</div>
        <div className="generic-title">{item.title}</div>
      </div>
    </div>
  );
}

function SongSlideNavigator({
  song,
  cursorIndex,
  presentedIndex,
  onCursor,
  onPresent,
}: {
  song: Song;
  cursorIndex: number;
  presentedIndex: number;
  onCursor: (i: number) => void;
  onPresent: (i: number) => void;
}) {
  let running = 0;

  return (
    <div className="slide-nav">
      <div className="slide-nav-header">
        <h2 className="slide-nav-title">{song.title}</h2>
        <span className="slide-nav-meta text-muted text-sm">
          {song.sections.length} sections · {totalSlides(song.sections)} slides
          {!song.lineBreaksReviewed && (
            <span className="needs-review"> · needs review</span>
          )}
          {' · '}
          <span className="legend-cursor">cursor</span>
          {' / '}
          <span className="legend-live">live</span>
        </span>
      </div>

      <div className="slide-nav-body">
        {song.sections.map((section) => {
          const start = running;
          running += section.slides.length;

          return (
            <div key={section.id} className="nav-section">
              <div className="nav-section-label">[{section.label}]</div>
              <div className="nav-cards">
                {section.slides.map((slide, si) => {
                  const idx = start + si;
                  const isCursor = idx === cursorIndex;
                  const isLive = idx === presentedIndex;
                  return (
                    <button
                      key={slide.id}
                      className={`nav-card ${isCursor ? 'cursor' : ''} ${
                        isLive ? 'presented' : ''
                      }`}
                      onClick={() => onCursor(idx)}
                      onDoubleClick={() => onPresent(idx)}
                      title={
                        isLive
                          ? 'Live on Main/Stage · click to set cursor'
                          : 'Click = cursor · double-click = present'
                      }
                    >
                      <div className="nav-card-index">
                        {si + 1}
                        {isLive && <span className="badge-live">live</span>}
                        {isCursor && !isLive && (
                          <span className="badge-cursor">cursor</span>
                        )}
                      </div>
                      <div className="nav-card-lines">
                        {slide.lines.length === 0 ? (
                          <span className="nav-empty">(empty)</span>
                        ) : (
                          slide.lines.map((line) => (
                            <div key={line.id} className="nav-line">
                              {line.text || '\u00A0'}
                            </div>
                          ))
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
    </div>
  );
}

function ScriptureSlideNavigator({
  scripture,
  cursorIndex,
  presentedIndex,
  onCursor,
  onPresent,
}: {
  scripture: Scripture;
  cursorIndex: number;
  presentedIndex: number;
  onCursor: (i: number) => void;
  onPresent: (i: number) => void;
}) {
  return (
    <div className="slide-nav">
      <div className="slide-nav-header">
        <h2 className="slide-nav-title">{scripture.reference}</h2>
        <span className="slide-nav-meta text-muted text-sm">
          {scripture.translation}
          {scripture.secondaryTranslation &&
            ` + ${scripture.secondaryTranslation.code}`}
          {' · '}
          {scripture.verses.length} verses
        </span>
      </div>

      <div className="slide-nav-body">
        <div className="nav-section">
          <div className="nav-cards">
            {scripture.verses.map((verse, i) => {
              const isCursor = i === cursorIndex;
              const isLive = i === presentedIndex;
              const secondary = scripture.secondaryTranslation?.verses[i];
              return (
                <button
                  key={verse.number}
                  className={`nav-card scripture-card ${isCursor ? 'cursor' : ''} ${
                    isLive ? 'presented' : ''
                  }`}
                  onClick={() => onCursor(i)}
                  onDoubleClick={() => onPresent(i)}
                >
                  <div className="nav-card-index">
                    {verse.number}
                    {isLive && <span className="badge-live">live</span>}
                    {isCursor && !isLive && (
                      <span className="badge-cursor">cursor</span>
                    )}
                  </div>
                  <div className="nav-card-lines">
                    <div className="nav-line">{verse.text}</div>
                    {secondary && (
                      <div className="nav-line secondary">{secondary.text}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
