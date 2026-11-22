import React, { useState } from 'react';
import { usePresentation } from '../../stores/PresentationContext';
import { useBroadcastPresentation } from '../../hooks/useBroadcastPresentation';
import { PlaylistPanel } from '../playlist/PlaylistPanel';
import { PreviewPanel } from '../controls/PreviewPanel';
import { ControlBar } from '../controls/ControlBar';
import { StatusBar } from '../controls/StatusBar';
import { ItemDetail } from '../controls/ItemDetail';
import { LineBreakEditor } from '../lyrics/LineBreakEditor';
import { AddItemModal } from '../modals/AddItemModal';
import type { SongLine } from '../../types';
import './OperatorLayout.css';

function openOutput(role: 'main' | 'stage') {
  const url = `${window.location.origin}${window.location.pathname}#/${role}`;
  const features =
    role === 'main'
      ? 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no'
      : 'width=960,height=540,menubar=no,toolbar=no,location=no,status=no';
  window.open(url, `church-presenter-${role}`, features);
}

export function OperatorLayout() {
  const { state, dispatch } = usePresentation();
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);

  // Keep output windows in sync
  useBroadcastPresentation();

  const editingSong = editingSongId
    ? state.songs.find((s) => s.id === editingSongId) || null
    : null;

  const handleSaveLineBreaks = (updatedLines: SongLine[]) => {
    if (!editingSongId) return;
    dispatch({
      type: 'UPDATE_SONG',
      id: editingSongId,
      updates: {
        lines: updatedLines,
        lineBreaksReviewed: true,
      },
    });
    setEditingSongId(null);
  };

  return (
    <div className="operator-layout">
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
          <button
            className="btn btn-primary"
            title="Open Main audience output"
            onClick={() => openOutput('main')}
          >
            Open Main
          </button>
          <button
            className="btn btn-secondary"
            title="Open Stage monitor"
            onClick={() => openOutput('stage')}
          >
            Open Stage
          </button>
        </div>
      </header>

      <div className="operator-body">
        <aside className="panel playlist-panel">
          <PlaylistPanel onAddItem={() => setShowAddItem(true)} />
        </aside>

        <main className="panel center-panel">
          <PreviewPanel />
          <ItemDetail onReviewLineBreaks={(id) => setEditingSongId(id)} />
        </main>

        <aside className="panel library-panel">
          <div className="panel-header">
            <h2>Library</h2>
          </div>
          <div className="library-placeholder">
            <p className="text-muted text-sm">
              Song library, images, videos and scriptures will appear here.
            </p>
            <p className="text-muted text-xs" style={{ marginTop: 8 }}>
              Use + Add Item to add songs or scriptures to the playlist.
            </p>
          </div>
        </aside>
      </div>

      <ControlBar />
      <StatusBar />

      {editingSong && (
        <LineBreakEditor
          song={editingSong}
          onSave={handleSaveLineBreaks}
          onCancel={() => setEditingSongId(null)}
        />
      )}

      {showAddItem && (
        <AddItemModal onClose={() => setShowAddItem(false)} />
      )}
    </div>
  );
}
