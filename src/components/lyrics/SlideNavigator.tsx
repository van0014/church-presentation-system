import React from 'react';
import { usePresentation } from '../../stores/PresentationContext';
import type { Song, Scripture, PlaylistItem } from '../../types';
import { getSlideAt, totalSlides } from '../../utils/songText';
import './SlideNavigator.css';

/**
 * Large file-manager style navigator.
 * Sections are groups; slides are big readable cards.
 * This is the primary operator surface — no duplicate of the audience screen.
 */
export function SlideNavigator() {
  const { state, goToSlide, getCurrentSong } = usePresentation();
  const item = state.currentItem;
  const song = getCurrentSong();
  const currentSlide = state.presentation.currentSlideIndex;

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
        currentSlideIndex={currentSlide}
        onSelect={goToSlide}
      />
    );
  }

  if (item.type === 'scripture' && item.scripture) {
    return (
      <ScriptureSlideNavigator
        scripture={item.scripture}
        currentSlideIndex={currentSlide}
        onSelect={goToSlide}
      />
    );
  }

  // Generic media item
  return (
    <div className="slide-nav generic">
      <div className="generic-card active">
        <div className="generic-type">{item.type}</div>
        <div className="generic-title">{item.title}</div>
      </div>
    </div>
  );
}

function SongSlideNavigator({
  song,
  currentSlideIndex,
  onSelect,
}: {
  song: Song;
  currentSlideIndex: number;
  onSelect: (i: number) => void;
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
                  const active = idx === currentSlideIndex;
                  return (
                    <button
                      key={slide.id}
                      className={`nav-card ${active ? 'active' : ''}`}
                      onClick={() => onSelect(idx)}
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
    </div>
  );
}

function ScriptureSlideNavigator({
  scripture,
  currentSlideIndex,
  onSelect,
}: {
  scripture: Scripture;
  currentSlideIndex: number;
  onSelect: (i: number) => void;
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
              const active = i === currentSlideIndex;
              const secondary = scripture.secondaryTranslation?.verses[i];
              return (
                <button
                  key={verse.number}
                  className={`nav-card scripture-card ${active ? 'active' : ''}`}
                  onClick={() => onSelect(i)}
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
    </div>
  );
}
