import React from 'react';
import type { Song, Theme } from '../../types';
import './SongPreview.css';

interface Props {
  song: Song;
  slideIndex: number;
  theme: Theme;
  /** When true, show translation block below */
  showTranslation?: boolean;
}

export function SongPreview({
  song,
  slideIndex,
  theme,
  showTranslation = true,
}: Props) {
  const linesPerSlide = theme.maxLinesPerSlide || 4;
  const start = slideIndex * linesPerSlide;
  const visibleLines = song.lines.slice(start, start + linesPerSlide);
  const translation = song.translations[0]; // first translation for now

  if (visibleLines.length === 0) {
    return (
      <div className="song-preview empty">
        <div className="song-title">{song.title}</div>
        <div className="text-muted">End of song</div>
      </div>
    );
  }

  const textBoxStyle: React.CSSProperties = theme.textBoxEnabled
    ? {
        backgroundColor: hexToRgba(theme.textBoxColor, theme.textBoxOpacity),
        padding: theme.textBoxPadding,
        borderRadius: theme.textBoxBorderRadius,
      }
    : {};

  return (
    <div className="song-preview" style={{ color: theme.textColor }}>
      <div className="song-title" style={{ color: theme.secondaryTextColor }}>
        {song.title}
      </div>

      <div className="lyrics-block" style={textBoxStyle}>
        {visibleLines.map((line) => (
          <div
            key={line.id}
            className="lyric-line"
            style={{ fontSize: theme.fontSizeBase * 0.55 }} // scaled for preview
          >
            {line.text}
          </div>
        ))}
      </div>

      {showTranslation && translation && translation.displayMode === 'block' && (
        <div
          className="translation-block"
          style={{
            ...textBoxStyle,
            marginTop: 16,
            color: theme.secondaryTextColor,
            fontSize: theme.fontSizeBase * 0.4,
          }}
        >
          {translation.lines
            .slice(start, start + linesPerSlide)
            .map((line) => (
              <div key={line.id} className="lyric-line">
                {line.text}
              </div>
            ))}
        </div>
      )}

      <div className="slide-indicator">
        Slide {slideIndex + 1} / {Math.ceil(song.lines.length / linesPerSlide)}
      </div>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
