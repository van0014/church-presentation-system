import React from 'react';
import { usePresentation } from '../../stores/PresentationContext';
import { SongPreview } from '../lyrics/SongPreview';
import { ScripturePreview } from '../scripture/ScripturePreview';
import './OutputWindow.css';

type Mode = 'main' | 'stage';

/**
 * Audience (main) or stage monitor window.
 * State is shared via the same PresentationProvider + localStorage persistence.
 * Open with ?view=main or ?view=stage
 */
export function OutputWindow({ mode }: { mode: Mode }) {
  const { state, getCurrentSong, getCurrentTheme } = usePresentation();
  const theme = getCurrentTheme();
  const item = state.currentItem;
  const song = getCurrentSong();
  const { isBlack, isClear, currentSlideIndex } = state.presentation;

  const isStage = mode === 'stage';

  return (
    <div
      className={`output-window ${mode}`}
      style={{
        backgroundColor: isBlack ? '#000' : theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
        letterSpacing: theme.letterSpacing != null ? `${theme.letterSpacing}em` : undefined,
        wordSpacing: theme.wordSpacing != null ? `${theme.wordSpacing}em` : undefined,
      }}
    >
      {isBlack && <div className="output-overlay">BLACK</div>}
      {isClear && !isBlack && <div className="output-overlay clear" />}

      {!isBlack && !isClear && item && (
        <>
          {item.type === 'song' && song && (
            <SongPreview
              song={song}
              slideIndex={currentSlideIndex}
              theme={theme}
              showTranslation={!isStage}
            />
          )}
          {item.type === 'scripture' && item.scripture && (
            <ScripturePreview
              scripture={item.scripture}
              slideIndex={currentSlideIndex}
              theme={theme}
            />
          )}
          {(item.type === 'image' || item.type === 'video' || item.type === 'youtube') && (
            <div className="output-placeholder">{item.title}</div>
          )}
          {item.type === 'empty' && <div className="output-placeholder muted" />}
        </>
      )}

      {isStage && (
        <div className="stage-chrome">
          <span className="stage-item">{item?.title ?? '—'}</span>
          <span className="stage-slide">Slide {currentSlideIndex + 1}</span>
        </div>
      )}
    </div>
  );
}
