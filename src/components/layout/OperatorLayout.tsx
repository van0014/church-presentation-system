import React from 'react';
import { usePresentation } from '../../stores/PresentationContext';
import { PlaylistPanel } from '../playlist/PlaylistPanel';
import { PreviewPanel } from '../controls/PreviewPanel';
import { ControlBar } from '../controls/ControlBar';
import { StatusBar } from '../controls/StatusBar';
import { ItemDetail } from '../controls/ItemDetail';
import './OperatorLayout.css';

export function OperatorLayout() {
  const { state } = usePresentation();

  return (
    <div className="operator-layout">
      {/* Offline banner */}
      {!state.presentation.isOnline && (
        <div className="offline-banner">
          ⚠ Offline mode — using cached content. Changes will sync when connection returns.
        </div>
      )}

      <header className="operator-header">
        <div className="logo">
          <span className="logo-mark">✝</span>
          <span className="logo-text">Church Presenter</span>
        </div>
        <div className="header-actions">
          <button className="btn btn-ghost" title="Settings">
            ⚙ Settings
          </button>
          <button className="btn btn-primary" title="Open Main Output">
            Open Main
          </button>
          <button className="btn btn-secondary" title="Open Stage Monitor">
            Open Stage
          </button>
        </div>
      </header>

      <div className="operator-body">
        {/* Left: Playlist */}
        <aside className="panel playlist-panel">
          <PlaylistPanel />
        </aside>

        {/* Center: Preview + Detail */}
        <main className="panel center-panel">
          <PreviewPanel />
          <ItemDetail />
        </main>

        {/* Right: Future – song library / media browser */}
        <aside className="panel library-panel">
          <div className="panel-header">
            <h2>Library</h2>
          </div>
          <div className="library-placeholder">
            <p className="text-muted text-sm">
              Song library, images, videos and scriptures will appear here.
            </p>
            <p className="text-muted text-xs" style={{ marginTop: 8 }}>
              Google Drive sync + offline cache coming next.
            </p>
          </div>
        </aside>
      </div>

      <ControlBar />
      <StatusBar />
    </div>
  );
}
