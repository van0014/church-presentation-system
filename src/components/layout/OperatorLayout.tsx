import React, { useState, useRef } from 'react';
import { usePresentation } from '../../stores/PresentationContext';
import { PlaylistPanel } from '../playlist/PlaylistPanel';
import { ControlBar } from '../controls/ControlBar';
import { StatusBar } from '../controls/StatusBar';
import { SlideNavigator } from '../lyrics/SlideNavigator';
import { LineBreakEditor } from '../lyrics/LineBreakEditor';
import { importSongsFromFiles } from '../../utils/importSong';
import type { Song } from '../../types';
import './OperatorLayout.css';

type ViewMode = 'operator' | 'line-break-editor';

export function OperatorLayout() {
  const { state, dispatch, getCurrentSong } = usePresentation();
  const [viewMode, setViewMode] = useState<ViewMode>('operator');
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSong = getCurrentSong();
  const item = state.currentItem;

  const openEditor = (song: Song) => {
    setEditingSong(song);
    setViewMode('line-break-editor');
  };

  const closeEditor = () => {
    setEditingSong(null);
    setViewMode('operator');
  };

  const handleSaveSong = (updated: Song) => {
    dispatch({ type: 'UPDATE_SONG', id: updated.id, updates: updated });
    closeEditor();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const songs = await importSongsFromFiles(files);
      for (const song of songs) {
        dispatch({ type: 'ADD_SONG', song });
      }
      if (songs.length > 0) {
        openEditor(songs[0]);
      }
    } catch (err) {
      console.error('Import failed', err);
    }
    e.target.value = '';
  };

  if (viewMode === 'line-break-editor' && editingSong) {
    return (
      <div className="operator-layout">
        <LineBreakEditor
          song={editingSong}
          onSave={handleSaveSong}
          onCancel={closeEditor}
        />
      </div>
    );
  }

  return (
    <div className="operator-layout">
      {!state.presentation.isOnline && (
        <div className="offline-banner">
          ⚠ Offline mode — using cached content. Changes will sync when connection
          returns.
        </div>
      )}

      <header className="operator-header">
        <div className="logo">
          <span className="logo-mark">✝</span>
          <span className="logo-text">Church Presenter</span>
        </div>
        <div className="header-actions">
          {item?.type === 'song' && currentSong && (
            <button
              className="btn btn-secondary"
              onClick={() => openEditor(currentSong)}
              title="Edit line breaks"
            >
              {currentSong.lineBreaksReviewed ? 'Edit breaks' : 'Review breaks'}
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={handleImportClick}
            title="Import SongSelect .txt"
          >
            Import .txt
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,text/plain"
            multiple
            style={{ display: 'none' }}
            onChange={handleFilesSelected}
          />
          <button className="btn btn-ghost" title="Settings">
            ⚙
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
        {/* Left: Playlist only */}
        <aside className="panel playlist-panel">
          <PlaylistPanel />
        </aside>

        {/* Center: large slide navigator (file-manager style) — primary surface */}
        <main className="panel center-panel">
          <SlideNavigator />
        </main>

        {/* Right: compact library */}
        <aside className="panel library-panel">
          <div className="panel-header library-header">
            <h2>Library</h2>
            <button
              className="btn btn-ghost text-xs"
              onClick={handleImportClick}
            >
              + Import
            </button>
          </div>
          <div className="library-songs library-songs-full">
            {state.songs.length === 0 && (
              <p
                className="text-muted text-sm"
                style={{ padding: '12px 14px' }}
              >
                No songs yet. Import a SongSelect .txt file.
              </p>
            )}
            {state.songs.map((song) => (
              <button
                key={song.id}
                className={`library-song-item ${
                  currentSong?.id === song.id ? 'active' : ''
                }`}
                onClick={() => openEditor(song)}
                title="Edit line breaks"
              >
                <div className="library-song-title truncate">{song.title}</div>
                <div className="library-song-meta text-xs text-muted">
                  {song.sections.length} sec ·{' '}
                  {song.sections.reduce((n, s) => n + s.slides.length, 0)} slides
                  {!song.lineBreaksReviewed && (
                    <span className="needs-review"> · needs review</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <ControlBar />
      <StatusBar />
    </div>
  );
}
