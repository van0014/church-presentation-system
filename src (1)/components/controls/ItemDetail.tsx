import React from 'react';
import { usePresentation } from '../../stores/PresentationContext';
import './ItemDetail.css';

interface Props {
  onReviewLineBreaks?: (songId: string) => void;
}

export function ItemDetail({ onReviewLineBreaks }: Props) {
  const { state, getCurrentSong, setSlide } = usePresentation();
  const item = state.currentItem;
  const song = getCurrentSong();
  const { currentSlideIndex } = state.presentation;

  if (!item) {
    return (
      <div className="item-detail">
        <div className="detail-empty text-muted">Select an item from the playlist</div>
      </div>
    );
  }

  return (
    <div className="item-detail">
      <div className="detail-header">
        <span className="detail-type">{item.type.toUpperCase()}</span>
        <h3 className="detail-title">{item.title}</h3>
      </div>

      {item.type === 'song' && song && (
        <div className="detail-body">
          <div className="detail-row">
            <span className="label">Artist</span>
            <span>{song.artist || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Lines</span>
            <span>{song.lines.length}</span>
          </div>
          <div className="detail-row">
            <span className="label">Line breaks</span>
            <span className={song.lineBreaksReviewed ? 'ok' : 'warn'}>
              {song.lineBreaksReviewed ? 'Reviewed ✓' : 'Needs review'}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Translations</span>
            <span>
              {song.translations.length
                ? song.translations.map((t) => t.languageName).join(', ')
                : 'None'}
            </span>
          </div>
          <button
            className="btn btn-secondary text-sm"
            style={{ marginTop: 12 }}
            onClick={() => onReviewLineBreaks?.(song.id)}
          >
            {song.lineBreaksReviewed ? 'Edit Line Breaks' : 'Review Line Breaks'}
          </button>
        </div>
      )}

      {item.type === 'scripture' && item.scripture && (
        <div className="detail-body">
          <div className="detail-row">
            <span className="label">Reference</span>
            <span>{item.scripture.reference}</span>
          </div>
          <div className="detail-row">
            <span className="label">Translation</span>
            <span>{item.scripture.translation}</span>
          </div>
          {item.scripture.secondaryTranslation && (
            <div className="detail-row">
              <span className="label">Secondary</span>
              <span>{item.scripture.secondaryTranslation.code}</span>
            </div>
          )}

          <div className="verse-lineup">
            <div className="verse-lineup-label">
              Verse line-up · click to jump
            </div>
            <div className="verse-grid">
              {item.scripture.verses.map((v, i) => {
                const isActive = i === currentSlideIndex;
                return (
                  <button
                    key={v.number}
                    className={`verse-chip ${isActive ? 'active' : ''}`}
                    onClick={() => setSlide(i)}
                    title={v.text}
                  >
                    <span className="verse-chip-num">{v.number}</span>
                    <span className="verse-chip-preview">
                      {v.text.slice(0, 48)}
                      {v.text.length > 48 ? '…' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {item.type === 'image' && (
        <div className="detail-body">
          {item.source ? (
            <div className="image-thumb-wrap">
              <img src={item.source} alt={item.title} className="image-thumb" />
            </div>
          ) : (
            <div className="text-muted text-sm">
              No image loaded — use + Add Item → Image to upload.
            </div>
          )}
          {item.cues?.startCaptions && (
            <div className="detail-cues" style={{ marginTop: 10 }}>
              <span className="cue-tag">Captions cue</span>
            </div>
          )}
        </div>
      )}

      {item.cues && item.type !== 'image' && (
        <div className="detail-cues">
          <div className="text-xs text-muted" style={{ marginBottom: 4 }}>
            Cues
          </div>
          {item.cues.startCaptions && <span className="cue-tag">Captions</span>}
          {item.cues.streamDeckAction && (
            <span className="cue-tag">
              Stream Deck: {item.cues.streamDeckAction}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
