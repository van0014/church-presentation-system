import React, { useState, useEffect, useCallback } from 'react';
import type { Song, SongSection } from '../../types';
import {
  parseSongText,
  serializeSongText,
  suggestLineBreaks,
  totalSlides,
} from '../../utils/songText';
import './SongEditor.css';

interface Props {
  song: Song;
  onSave: (updated: Song) => void;
  onCancel: () => void;
}

/**
 * Lyrics editor that follows SongSelect .txt conventions:
 *
 *   [Section Name]     → creates a section group (shown in thumbnail/file manager)
 *   blank line         → starts a new slide inside the current section
 *   ordinary lines     → lyric text belonging to the current slide
 */
export function SongEditor({ song, onSave, onCancel }: Props) {
  const [rawText, setRawText] = useState(
    song.rawSource ?? serializeSongText(song.sections)
  );
  const [sections, setSections] = useState<SongSection[]>(song.sections);
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist ?? '');
  const [dirty, setDirty] = useState(false);

  // Re-parse whenever the raw text changes
  useEffect(() => {
    try {
      const parsed = parseSongText(rawText);
      setSections(parsed);
    } catch {
      // keep previous sections on parse error
    }
  }, [rawText]);

  const handleTextChange = (value: string) => {
    setRawText(value);
    setDirty(true);
  };

  const handleSuggestBreaks = () => {
    const suggested = suggestLineBreaks(rawText);
    setRawText(suggested);
    setDirty(true);
  };

  const handleSave = useCallback(() => {
    const updated: Song = {
      ...song,
      title: title.trim() || song.title,
      artist: artist.trim() || undefined,
      sections,
      rawSource: rawText,
      lineBreaksReviewed: true,
    };
    onSave(updated);
  }, [song, title, artist, sections, rawText, onSave]);

  const slideCount = totalSlides(sections);

  return (
    <div className="song-editor">
      <header className="editor-header">
        <div className="editor-title-area">
          <input
            className="title-input"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
            placeholder="Song title"
          />
          <input
            className="artist-input"
            value={artist}
            onChange={(e) => {
              setArtist(e.target.value);
              setDirty(true);
            }}
            placeholder="Artist / writer"
          />
        </div>
        <div className="editor-actions">
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!dirty}
          >
            Save as Canonical
          </button>
        </div>
      </header>

      <div className="editor-body">
        {/* Left: raw text editor */}
        <div className="editor-text-pane">
          <div className="pane-toolbar">
            <span className="pane-label">Source text (SongSelect style)</span>
            <button
              className="btn btn-ghost text-sm"
              onClick={handleSuggestBreaks}
              title="Auto-suggest line breaks on long lines"
            >
              Suggest breaks
            </button>
          </div>
          <textarea
            className="lyrics-textarea"
            value={rawText}
            onChange={(e) => handleTextChange(e.target.value)}
            spellCheck={false}
            placeholder={`[Verse 1]
First line
Second line

Third line (new slide because of blank line above)
Fourth line

[Chorus]
...`}
          />
          <div className="editor-hint text-xs text-muted">
            <strong>[Section]</strong> creates a group ·{' '}
            <strong>blank line</strong> starts a new slide · ordinary lines are
            lyrics
          </div>
        </div>

        {/* Right: live structure preview (thumbnail / file-manager style) */}
        <div className="editor-structure-pane">
          <div className="pane-toolbar">
            <span className="pane-label">
              Structure · {sections.length} sections · {slideCount} slides
            </span>
          </div>
          <div className="structure-list">
            {sections.map((section) => (
              <div key={section.id} className="structure-section">
                <div className="structure-section-header">
                  <span className="section-badge">[{section.label}]</span>
                  <span className="text-xs text-muted">
                    {section.slides.length} slide
                    {section.slides.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="structure-slides">
                  {section.slides.map((slide, si) => (
                    <div key={slide.id} className="structure-slide">
                      <div className="slide-index">{si + 1}</div>
                      <div className="slide-lines">
                        {slide.lines.length === 0 ? (
                          <span className="text-muted text-xs">(empty)</span>
                        ) : (
                          slide.lines.map((line) => (
                            <div key={line.id} className="slide-line truncate">
                              {line.text || ' '}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {sections.length === 0 && (
              <div className="text-muted text-sm" style={{ padding: 16 }}>
                Start typing or paste SongSelect-style text…
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
