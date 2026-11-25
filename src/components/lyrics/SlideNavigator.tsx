import React, { useEffect, useRef } from 'react';
import { usePresentation } from '../../stores/PresentationContext';
import type { Song, Scripture } from '../../types';
import { totalSlides } from '../../utils/songText';
import './SlideNavigator.css';

/**
 * Large file-manager style navigator.
 * - Single click → present (live)
 * - Arrow keys → spatial grid cursor (subtle), not list order
 */
export function SlideNavigator() {
  const { state, presentAt, registerSpatialCards, getCurrentSong } =
    usePresentation();
  const item = state.currentItem;
  const song = getCurrentSong();
  const { currentSlideIndex, cursorSlideIndex } = state.presentation;
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerSpatialCards(() => {
      if (!bodyRef.current) return [];
      return Array.from(bodyRef.current.querySelectorAll('.nav-card'));
    });
    return () => registerSpatialCards(null);
  }, [registerSpatialCards, item?.id, song?.id]);

  if (!item) {
    return (
      <div className="slide-nav empty">
        <p className="text-muted">Select an item from the playlist</p>
      </div>
    );
  }

  if (item.type === 'song' && song) {
    return (
      <div className="slide-nav" ref={bodyRef}>
        <SongSlideNavigator
          song={song}
          cursorIndex={cursorSlideIndex}
          presentedIndex={currentSlideIndex}
          onPresent={presentAt}
        />
      </div>
    );
  }

  if (item.type === 'scripture' && item.scripture) {
    return (
      <div className="slide-nav" ref={bodyRef}>
        <ScriptureSlideNavigator
          scripture={item.scripture}
          cursorIndex={cursorSlideIndex}
          presentedIndex={currentSlideIndex}
          onPresent={presentAt}
        />
      </div>
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
  onPresent,
}: {
  song: Song;
  cursorIndex: number;
  presentedIndex: number;
  onPresent: (i: number) => void;
}) {
  let running = 0;

  return (
    <>
      <div className="slide-nav-header">
        <h2 className="slide-nav-title">{song.title}</h2>
        <span className="slide-nav-meta text-muted text-sm">
          {song.sections.length} sections · {totalSlides(song.sections)} slides
          {!song.lineBreaksReviewed && (
            <span className="needs-review"> · needs review</span>
          )}
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
                      type="button"
                      className={`nav-card ${isCursor ? 'cursor' : ''} ${
                        isLive ? 'presented' : ''
                      }`}
                      onClick={() => onPresent(idx)}
                      title={isLive ? 'On screen' : 'Click to show'}
                    >
                      <div className="nav-card-index">{si + 1}</div>
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
    </>
  );
}

function ScriptureSlideNavigator({
  scripture,
  cursorIndex,
  presentedIndex,
  onPresent,
}: {
  scripture: Scripture;
  cursorIndex: number;
  presentedIndex: number;
  onPresent: (i: number) => void;
}) {
  return (
    <>
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
                  type="button"
                  className={`nav-card scripture-card ${isCursor ? 'cursor' : ''} ${
                    isLive ? 'presented' : ''
                  }`}
                  onClick={() => onPresent(i)}
                >
                  <div className="nav-card-index">{verse.number}</div>
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
    </>
  );
}
