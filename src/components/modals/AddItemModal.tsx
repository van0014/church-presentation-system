import React, { useState } from 'react';
import { usePresentation } from '../../stores/PresentationContext';
import { linesToSongLines, normalizeRawLyrics, suggestLineBreaks } from '../../utils/lineBreaks';
import type { Song, PlaylistItem, Scripture } from '../../types';
import './AddItemModal.css';

type Tab = 'song' | 'scripture' | 'empty' | 'image';

interface Props {
  onClose: () => void;
}

export function AddItemModal({ onClose }: Props) {
  const { state, dispatch } = usePresentation();
  const [tab, setTab] = useState<Tab>('song');

  // Song form
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songLyrics, setSongLyrics] = useState('');
  const [autoBreak, setAutoBreak] = useState(true);

  // Scripture form
  const [refText, setRefText] = useState('');
  const [translation, setTranslation] = useState('NIV');
  const [verseText, setVerseText] = useState('');
  const [secondaryCode, setSecondaryCode] = useState('CUV');
  const [secondaryText, setSecondaryText] = useState('');

  const addSong = () => {
    if (!songTitle.trim() || !songLyrics.trim()) return;

    let lines = normalizeRawLyrics(songLyrics);
    if (autoBreak) {
      const suggestion = suggestLineBreaks(lines, {
        targetLinesPerSlide: 4,
        maxCharsPerLine: 40,
      });
      lines = suggestion.lines;
    }

    const song: Song = {
      id: `song-${Date.now()}`,
      title: songTitle.trim(),
      artist: songArtist.trim() || undefined,
      lines: linesToSongLines(lines),
      translations: [],
      lineBreaksReviewed: autoBreak, // if we auto-broke, mark as reviewed for now
    };

    dispatch({ type: 'ADD_SONG', song });

    const item: PlaylistItem = {
      id: `item-${Date.now()}`,
      type: 'song',
      title: song.title,
      songId: song.id,
      order: state.currentPlaylist?.items.length ?? 0,
    };

    if (state.currentPlaylist) {
      dispatch({
        type: 'UPDATE_PLAYLIST',
        id: state.currentPlaylist.id,
        updates: {
          items: [...state.currentPlaylist.items, item],
        },
      });
    }

    onClose();
  };

  const addScripture = () => {
    if (!refText.trim() || !verseText.trim()) return;

    // Simple verse splitting: lines starting with a number, or blank-line separated
    const raw = verseText.trim();
    const verses: { number: number; text: string }[] = [];

    // Try "1 Text" / "1. Text" patterns first
    const numbered = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    let autoNum = 1;
    for (const line of numbered) {
      const m = line.match(/^(\d+)[.\):\s]+(.+)$/);
      if (m) {
        verses.push({ number: parseInt(m[1], 10), text: m[2].trim() });
        autoNum = parseInt(m[1], 10) + 1;
      } else {
        verses.push({ number: autoNum, text: line });
        autoNum++;
      }
    }

    // Secondary translation (optional)
    let secondary: Scripture['secondaryTranslation'] | undefined;
    if (secondaryText.trim()) {
      const secVerses: { number: number; text: string }[] = [];
      let n = 1;
      for (const line of secondaryText.trim().split(/\n+/).map((l) => l.trim()).filter(Boolean)) {
        const m = line.match(/^(\d+)[.\):\s]+(.+)$/);
        if (m) {
          secVerses.push({ number: parseInt(m[1], 10), text: m[2].trim() });
          n = parseInt(m[1], 10) + 1;
        } else {
          secVerses.push({ number: n, text: line });
          n++;
        }
      }
      secondary = { code: secondaryCode || 'SEC', verses: secVerses };
    }

    const scripture: Scripture = {
      id: `scr-${Date.now()}`,
      reference: refText.trim(),
      translation: translation || 'NIV',
      verses,
      secondaryTranslation: secondary,
    };

    const item: PlaylistItem = {
      id: `item-${Date.now()}`,
      type: 'scripture',
      title: scripture.reference,
      scripture,
      order: state.currentPlaylist?.items.length ?? 0,
    };

    if (state.currentPlaylist) {
      dispatch({
        type: 'UPDATE_PLAYLIST',
        id: state.currentPlaylist.id,
        updates: {
          items: [...state.currentPlaylist.items, item],
        },
      });
    }

    onClose();
  };

  const addEmpty = () => {
    const item: PlaylistItem = {
      id: `item-${Date.now()}`,
      type: 'empty',
      title: 'Blank',
      order: state.currentPlaylist?.items.length ?? 0,
    };
    if (state.currentPlaylist) {
      dispatch({
        type: 'UPDATE_PLAYLIST',
        id: state.currentPlaylist.id,
        updates: {
          items: [...state.currentPlaylist.items, item],
        },
      });
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>Add Item</h2>
          <button className="btn btn-ghost" onClick={onClose}>✕</button>
        </header>

        <div className="modal-tabs">
          {(['song', 'scripture', 'empty'] as Tab[]).map((t) => (
            <button
              key={t}
              className={`tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'song' ? 'Song' : t === 'scripture' ? 'Scripture' : 'Blank'}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {tab === 'song' && (
            <div className="form">
              <label>
                Title
                <input
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="Song title"
                  autoFocus
                />
              </label>
              <label>
                Artist (optional)
                <input
                  value={songArtist}
                  onChange={(e) => setSongArtist(e.target.value)}
                  placeholder="Artist / writer"
                />
              </label>
              <label>
                Lyrics (paste or type)
                <textarea
                  value={songLyrics}
                  onChange={(e) => setSongLyrics(e.target.value)}
                  placeholder={"Amazing grace, how sweet the sound\nThat saved a wretch like me\n..."}
                  rows={10}
                />
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={autoBreak}
                  onChange={(e) => setAutoBreak(e.target.checked)}
                />
                Auto-suggest line breaks on import
              </label>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={addSong}>
                  Add Song to Playlist
                </button>
              </div>
            </div>
          )}

          {tab === 'scripture' && (
            <div className="form">
              <label>
                Reference
                <input
                  value={refText}
                  onChange={(e) => setRefText(e.target.value)}
                  placeholder="e.g. John 3:16-17"
                  autoFocus
                />
              </label>
              <div className="row-2">
                <label>
                  Translation
                  <select
                    value={translation}
                    onChange={(e) => setTranslation(e.target.value)}
                  >
                    {['NIV', 'ESV', 'KJV', 'NLT', 'CSB', 'CUV'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Secondary (optional)
                  <select
                    value={secondaryCode}
                    onChange={(e) => setSecondaryCode(e.target.value)}
                  >
                    {['CUV', 'NIV', 'ESV', 'KJV', 'None'].map((t) => (
                      <option key={t} value={t === 'None' ? '' : t}>{t}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Verses (one per line; optional leading numbers)
                <textarea
                  value={verseText}
                  onChange={(e) => setVerseText(e.target.value)}
                  placeholder={"16 For God so loved the world...\n17 For God did not send his Son..."}
                  rows={6}
                />
              </label>
              {secondaryCode && (
                <label>
                  Secondary text ({secondaryCode})
                  <textarea
                    value={secondaryText}
                    onChange={(e) => setSecondaryText(e.target.value)}
                    placeholder="Paste secondary translation verses here"
                    rows={4}
                  />
                </label>
              )}
              <div className="form-actions">
                <button className="btn btn-primary" onClick={addScripture}>
                  Add Scripture to Playlist
                </button>
              </div>
            </div>
          )}

          {tab === 'empty' && (
            <div className="form">
              <p className="text-muted">
                Adds a blank slide (useful for announcements, transitions, or black moments).
              </p>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={addEmpty}>
                  Add Blank Slide
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
