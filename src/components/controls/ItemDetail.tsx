import React from 'react';
import { usePresentation } from '../../stores/PresentationContext';
import type { Song } from '../../types';
import './ItemDetail.css';

interface Props {
  onEditSong?: (song: Song) => void;
}

export function ItemDetail({ onEditSong }: Props) {
  const { state, getCurrentSong } = usePresentation();
  const item = state.currentItem;
  const song = getCurrentSong();

  if (!item) {
    return (
      <div className="item-detail">
        <div className="detail-empty text-muted">
          Select an item from the playlist
        </div>
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
            <span className="label">Sections</span>
            <span>{song.sections.map((s) => s.label).join(', ')}</span>
          </div>
          <div className="detail-row">
            <span className="label">Slides</span>
            <span>
              {song.sections.reduce((n, s) => n + s.slides.length, 0)}
            </span>
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
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary text-sm"
              onClick={() => onEditSong?.(song)}
            >
              {song.lineBreaksReviewed ? 'Edit Lyrics' : 'Review Line Breaks'}
            </button>
          </div>
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
          <div className="detail-row">
            <span className="label">Verses</span>
            <span>{item.scripture.verses.length}</span>
          </div>
          {item.scripture.secondaryTranslation && (
            <div className="detail-row">
              <span className="label">Secondary</span>
              <span>{item.scripture.secondaryTranslation.code}</span>
            </div>
          )}
        </div>
      )}

      {item.cues && (
        <div className="detail-cues">
          <div className="text-xs text-muted" style={{ marginBottom: 4 }}>
            Cues
          </div>
          {item.cues.startCaptions && (
            <span className="cue-tag">Captions</span>
          )}
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
