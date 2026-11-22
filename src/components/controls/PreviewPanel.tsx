import React from 'react';
import { usePresentation } from '../../stores/PresentationContext';
import { SongPreview } from '../lyrics/SongPreview';
import { ScripturePreview } from '../scripture/ScripturePreview';
import './PreviewPanel.css';

export function PreviewPanel() {
  const { state, getCurrentSong, getCurrentTheme } = usePresentation();
  const item = state.currentItem;
  const theme = getCurrentTheme();
  const song = getCurrentSong();
  const { isBlack, isClear, currentSlideIndex } = state.presentation;

  return (
    <div className="preview-panel">
      <div className="preview-label">Live Preview (Main)</div>
      <div
        className="preview-stage"
        style={{
          backgroundColor: isBlack ? '#000' : theme.backgroundColor,
          color: theme.textColor,
          fontFamily: theme.fontFamily,
        }}
      >
        {isBlack && <div className="preview-overlay black">BLACK</div>}
        {isClear && !isBlack && <div className="preview-overlay clear">CLEAR</div>}

        {!isBlack && !isClear && item && (
          <>
            {item.type === 'song' && song && (
              <SongPreview
                song={song}
                slideIndex={currentSlideIndex}
                theme={theme}
              />
            )}
            {item.type === 'scripture' && item.scripture && (
              <ScripturePreview
                scripture={item.scripture}
                slideIndex={currentSlideIndex}
                theme={theme}
              />
            )}
            {item.type === 'image' && (
              item.source ? (
                <img
                  src={item.source}
                  alt={item.title}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              ) : (
                <div className="preview-placeholder">
                  <div className="placeholder-icon">🖼️</div>
                  <div>{item.title}</div>
                  <div className="text-xs text-muted" style={{ marginTop: 8 }}>
                    No image uploaded
                  </div>
                </div>
              )
            )}
            {item.type === 'empty' && (
              <div className="preview-placeholder muted">
                <div>Blank</div>
              </div>
            )}
            {(item.type === 'video' || item.type === 'youtube') && (
              <div className="preview-placeholder">
                <div className="placeholder-icon">▶</div>
                <div>{item.title}</div>
              </div>
            )}
          </>
        )}

        {!item && !isBlack && (
          <div className="preview-placeholder muted">No item selected</div>
        )}
      </div>
    </div>
  );
}
