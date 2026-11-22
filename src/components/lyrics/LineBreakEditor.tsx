import React, { useState, useEffect, useCallback } from 'react';
import type { Song, SongLine } from '../../types';
import { suggestLineBreaks, linesToSongLines, normalizeRawLyrics } from '../../utils/lineBreaks';
import './LineBreakEditor.css';

interface Props {
  song: Song;
  onSave: (updatedLines: SongLine[]) => void;
  onCancel: () => void;
}

export function LineBreakEditor({ song, onSave, onCancel }: Props) {
  const [draftLines, setDraftLines] = useState<string[]>([]);
  const [rawMode, setRawMode] = useState(false);
  const [rawText, setRawText] = useState('');
  const [suggestionNotes, setSuggestionNotes] = useState<string[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Initialise from song. If the song still needs review, run auto-suggest immediately.
  useEffect(() => {
    const texts = song.lines.map((l) => l.text);
    setDraftLines(texts);
    setRawText(texts.join('\n'));
    setConfidence(null);
    setSuggestionNotes([]);
    setSelectedIndex(null);

    // Auto-run suggestion for songs that have not been reviewed yet
    if (!song.lineBreaksReviewed) {
      const result = suggestLineBreaks(texts, {
        targetLinesPerSlide: 4,
        maxCharsPerLine: 40,
      });
      setDraftLines(result.lines);
      setRawText(result.lines.join('\n'));
      setConfidence(result.confidence);
      setSuggestionNotes([
        'Auto-suggestion applied (song needs review). Adjust as needed, then Save.',
        ...(result.notes || []),
      ]);
    }
  }, [song]);

  const applySuggestion = useCallback(() => {
    const source = rawMode ? rawText : draftLines.join('\n');
    const result = suggestLineBreaks(source, {
      targetLinesPerSlide: 4,
      maxCharsPerLine: 40,
    });
    setDraftLines(result.lines);
    setRawText(result.lines.join('\n'));
    setConfidence(result.confidence);
    setSuggestionNotes(result.notes || ['Suggestion re-applied']);
    setSelectedIndex(null);
  }, [rawMode, rawText, draftLines]);

  const updateLine = (index: number, value: string) => {
    const next = [...draftLines];
    next[index] = value;
    setDraftLines(next);
    setRawText(next.join('\n'));
  };

  const splitLine = (index: number) => {
    const line = draftLines[index];
    // Split roughly in the middle at a space
    const mid = Math.floor(line.length / 2);
    let splitAt = line.lastIndexOf(' ', mid);
    if (splitAt < 8) splitAt = line.indexOf(' ', mid);
    if (splitAt === -1) return;

    const left = line.slice(0, splitAt).trim();
    const right = line.slice(splitAt).trim();
    const next = [
      ...draftLines.slice(0, index),
      left,
      right,
      ...draftLines.slice(index + 1),
    ];
    setDraftLines(next);
    setRawText(next.join('\n'));
  };

  const mergeWithNext = (index: number) => {
    if (index >= draftLines.length - 1) return;
    const next = [...draftLines];
    next[index] = `${next[index]} ${next[index + 1]}`.trim();
    next.splice(index + 1, 1);
    setDraftLines(next);
    setRawText(next.join('\n'));
    setSelectedIndex(null);
  };

  const addLineAfter = (index: number) => {
    const next = [
      ...draftLines.slice(0, index + 1),
      '',
      ...draftLines.slice(index + 1),
    ];
    setDraftLines(next);
    setRawText(next.join('\n'));
    setSelectedIndex(index + 1);
  };

  const removeLine = (index: number) => {
    if (draftLines.length <= 1) return;
    const next = draftLines.filter((_, i) => i !== index);
    setDraftLines(next);
    setRawText(next.join('\n'));
    setSelectedIndex(null);
  };

  const handleRawChange = (value: string) => {
    setRawText(value);
    setDraftLines(normalizeRawLyrics(value));
  };

  const handleSave = () => {
    const cleaned = draftLines
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    if (cleaned.length === 0) return;
    onSave(linesToSongLines(cleaned));
  };

  // Keyboard helpers inside the editor
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="line-break-editor">
      <header className="lbe-header">
        <div>
          <h2>Line Break Review</h2>
          <div className="lbe-song-title">{song.title}</div>
          {song.artist && (
            <div className="lbe-artist text-sm text-muted">{song.artist}</div>
          )}
        </div>
        <div className="lbe-actions">
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Save as Canonical
          </button>
        </div>
      </header>

      <div className="lbe-toolbar">
        <button className="btn btn-secondary" onClick={applySuggestion} title="Re-run intelligent line-break suggestions">
          {confidence !== null ? 'Re-run Auto-suggest' : 'Auto-suggest breaks'}
        </button>
        <button
          className={`btn btn-ghost ${rawMode ? 'active' : ''}`}
          onClick={() => setRawMode(!rawMode)}
        >
          {rawMode ? 'Line mode' : 'Raw text mode'}
        </button>
        {confidence !== null && (
          <span className="confidence text-sm">
            Confidence: {Math.round(confidence * 100)}%
          </span>
        )}
      </div>

      {suggestionNotes.length > 0 && (
        <div className="lbe-notes">
          {suggestionNotes.map((n, i) => (
            <div key={i} className="note">
              {n}
            </div>
          ))}
        </div>
      )}

      <div className="lbe-body">
        {rawMode ? (
          <textarea
            className="raw-textarea"
            value={rawText}
            onChange={(e) => handleRawChange(e.target.value)}
            placeholder="Paste or edit raw lyrics here…"
            spellCheck={false}
          />
        ) : (
          <div className="lines-list">
            {draftLines.map((line, index) => (
              <div
                key={index}
                className={`line-row ${selectedIndex === index ? 'selected' : ''}`}
                onClick={() => setSelectedIndex(index)}
              >
                <span className="line-num">{index + 1}</span>
                <input
                  className="line-input"
                  value={line}
                  onChange={(e) => updateLine(index, e.target.value)}
                  onFocus={() => setSelectedIndex(index)}
                />
                <div className="line-ops">
                  <button
                    title="Split line"
                    onClick={(e) => {
                      e.stopPropagation();
                      splitLine(index);
                    }}
                  >
                    ✂️
                  </button>
                  <button
                    title="Merge with next"
                    onClick={(e) => {
                      e.stopPropagation();
                      mergeWithNext(index);
                    }}
                    disabled={index >= draftLines.length - 1}
                  >
                    🔗
                  </button>
                  <button
                    title="Add empty line after"
                    onClick={(e) => {
                      e.stopPropagation();
                      addLineAfter(index);
                    }}
                  >
                    ➕
                  </button>
                  <button
                    title="Remove line"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLine(index);
                    }}
                    disabled={draftLines.length <= 1}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Live preview of how it will look on screen */}
        <div className="lbe-preview">
          <div className="preview-label">Slide preview (approx)</div>
          <div className="preview-slides">
            {chunk(draftLines, 4).map((group, gi) => (
              <div key={gi} className="preview-slide">
                <div className="slide-num">Slide {gi + 1}</div>
                {group.map((l, li) => (
                  <div key={li} className="preview-line">
                    {l || <em className="empty">(empty)</em>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="lbe-footer text-sm text-muted">
        Tip: Use Auto-suggest, then fine-tune. Ctrl/Cmd+S to save · Esc to cancel
      </footer>
    </div>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
