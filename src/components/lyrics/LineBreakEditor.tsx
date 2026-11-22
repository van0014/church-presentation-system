import React, { useState, useEffect, useCallback } from 'react';
import type { Song, SongLine } from '../../types';
import { suggestLineBreaks, linesToSongLines, normalizeRawLyrics, type BreakDensity } from '../../utils/lineBreaks';
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
  const [density, setDensity] = useState<BreakDensity>('normal');
  const [warnings, setWarnings] = useState<string[]>([]);

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
        density: 'normal',
      });
      setDraftLines(result.lines);
      setRawText(result.lines.join('\n'));
      setConfidence(result.confidence);
      setSuggestionNotes([
        'Auto-suggestion applied (song needs review). Adjust as needed, then Save.',
        ...(result.notes || []),
      ]);
      setWarnings(result.warnings || []);
    }
  }, [song]);

  const applySuggestion = useCallback((d?: BreakDensity) => {
    const useDensity = d || density;
    const source = rawMode ? rawText : draftLines.join('\n');
    const result = suggestLineBreaks(source, { density: useDensity });
    setDraftLines(result.lines);
    setRawText(result.lines.join('\n'));
    setConfidence(result.confidence);
    setSuggestionNotes(result.notes || ['Suggestion applied']);
    setWarnings(result.warnings || []);
    setSelectedIndex(null);
    if (d) setDensity(d);
  }, [rawMode, rawText, draftLines, density]);

  const updateLine = (index: number, value: string) => {
    const next = [...draftLines];
    next[index] = value;
    setDraftLines(next);
    setRawText(next.join('\n'));
  };

  /** Split at the actual text cursor position in the focused input */
  const splitLineAtCursor = (index: number, caret: number) => {
    const line = draftLines[index];
    if (caret <= 0 || caret >= line.length) return;

    // Prefer splitting on a nearby space so we don't cut a word in half
    let splitAt = caret;
    if (line[caret] !== ' ' && line[caret - 1] !== ' ') {
      const before = line.lastIndexOf(' ', caret);
      const after = line.indexOf(' ', caret);
      if (before >= 0 && (after < 0 || caret - before <= after - caret)) {
        splitAt = before;
      } else if (after >= 0) {
        splitAt = after;
      }
    }

    const left = line.slice(0, splitAt).trim();
    const right = line.slice(splitAt).trim();
    if (!left && !right) return;

    const next = [
      ...draftLines.slice(0, index),
      ...(left ? [left] : []),
      ...(right ? [right] : []),
      ...draftLines.slice(index + 1),
    ];
    setDraftLines(next);
    setRawText(next.join('\n'));
    setSelectedIndex(left ? index + 1 : index);
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
        <button
          className="btn btn-secondary"
          onClick={() => applySuggestion()}
          title="Re-run intelligent line-break suggestions"
        >
          {confidence !== null ? 'Re-run Auto-suggest' : 'Auto-suggest breaks'}
        </button>

        <div className="density-group">
          <span className="density-label">Density</span>
          {(['sparse', 'normal', 'condensed'] as BreakDensity[]).map((d) => (
            <button
              key={d}
              className={`btn btn-ghost density-btn ${density === d ? 'active' : ''}`}
              onClick={() => applySuggestion(d)}
              title={
                d === 'sparse'
                  ? 'Longer lines, fewer breaks'
                  : d === 'condensed'
                    ? 'Shorter lines, more breaks'
                    : 'Balanced phrase breaks'
              }
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

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
      {warnings.length > 0 && (
        <div className="lbe-warnings">
          {warnings.map((w, i) => (
            <div key={i} className="warning">
              ⚠ {w}
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
                  onKeyDown={(e) => {
                    // Enter = split at cursor
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const caret = (e.target as HTMLInputElement).selectionStart ?? line.length;
                      splitLineAtCursor(index, caret);
                    }
                  }}
                />
                <div className="line-ops">
                  <button
                    title="Split at cursor (or press Enter)"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Find the input in this row and read its caret
                      const row = (e.currentTarget as HTMLElement).closest('.line-row');
                      const input = row?.querySelector('input.line-input') as HTMLInputElement | null;
                      const caret = input?.selectionStart ?? Math.floor(line.length / 2);
                      splitLineAtCursor(index, caret);
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
        Tip: Place cursor then Enter (or ✂️) to split there · Auto-suggest is optional · Ctrl/Cmd+S save · Esc cancel
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
