import React from 'react';
import { usePresentation } from '../../stores/PresentationContext';
import './StatusBar.css';

export function StatusBar() {
  const { state } = usePresentation();
  const { isOnline, currentPlaylistId } = state.presentation;

  return (
    <div className="status-bar">
      <div className="status-left">
        <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
        <span className="text-xs">
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {currentPlaylistId && (
          <span className="text-xs text-muted" style={{ marginLeft: 12 }}>
            Playlist loaded
          </span>
        )}
      </div>
      <div className="status-right text-xs text-muted">
        Keyboard: Space = Next · ←→ = Slides · B = Black · C = Clear
      </div>
    </div>
  );
}
