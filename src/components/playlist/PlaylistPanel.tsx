import React from 'react';
import { usePresentation } from '../../stores/PresentationContext';
import type { PlaylistItem } from '../../types';
import './PlaylistPanel.css';

const typeIcons: Record<string, string> = {
  song: '🎵',
  scripture: '📖',
  image: '🖼️',
  video: '🎬',
  youtube: '▶',
  slideshow: '📑',
  empty: '⬜',
};

export function PlaylistPanel({ onAddItem }: { onAddItem?: () => void }) {
  const { state, setHighlight, presentHighlighted, goToItem } = usePresentation();
  const playlist = state.currentPlaylist;
  const { currentItemIndex, highlightedIndex } = state.presentation;

  if (!playlist) {
    return (
      <div className="playlist-empty">
        <p>No playlist loaded</p>
        <button className="btn btn-primary">Create Sunday Service</button>
      </div>
    );
  }

  return (
    <div className="playlist-panel-inner">
      <div className="panel-header playlist-header">
        <div>
          <h2>Playlist</h2>
          <div className="playlist-name">{playlist.name}</div>
          {playlist.date && (
            <div className="playlist-date text-xs text-muted">{playlist.date}</div>
          )}
        </div>
      </div>

      <div className="playlist-items">
        {playlist.items.map((item, index) => (
          <PlaylistItemRow
            key={item.id}
            item={item}
            index={index}
            isLive={index === currentItemIndex}
            isHighlighted={index === highlightedIndex}
            onHighlight={() => setHighlight(index)}
            onPresent={() => goToItem(index)}
          />
        ))}
      </div>

      <div className="playlist-footer">
        <button className="btn btn-ghost text-sm" onClick={onAddItem}>+ Add Item</button>
        <button className="btn btn-ghost text-sm">Template</button>
      </div>
    </div>
  );
}

function PlaylistItemRow({
  item,
  index,
  isLive,
  isHighlighted,
  onHighlight,
  onPresent,
}: {
  item: PlaylistItem;
  index: number;
  isLive: boolean;
  isHighlighted: boolean;
  onHighlight: () => void;
  onPresent: () => void;
}) {
  return (
    <button
      className={`playlist-item ${isHighlighted ? 'highlighted' : ''} ${isLive ? 'live' : ''}`}
      onClick={onHighlight}
      onDoubleClick={onPresent}
    >
      <span className="item-index">{index + 1}</span>
      <span className="item-icon">{typeIcons[item.type] || '•'}</span>
      <div className="item-info">
        <div className="item-title truncate">{item.title}</div>
        <div className="item-type text-xs text-muted">{item.type}</div>
      </div>
      {isLive && <span className="live-badge">LIVE</span>}
      {item.cues?.startCaptions && !isLive && (
        <span className="cue-badge" title="Triggers captions">C</span>
      )}
    </button>
  );
}
