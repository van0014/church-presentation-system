import React from 'react';
import type { Song, Theme } from '../../types';
import { getSlideAt, totalSlides } from '../../utils/songText';
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
  const result = getSlideAt(song.sections, slideIndex);
  const translation = song.translations[0];
  const total = totalSlides(song.sections);

  if (!result) {
    return (
      <div className="song-preview empty">
        <div className="song-title">{song.title}</div>
        <div className="text-muted">End of song</div>
      </div>
    );
  }

  const { section, slide } = result;

  // Matching translation slide (same global index) if available
  const transResult =
    translation && showTranslation
      ? getSlideAt(translation.sections, slideIndex)
      : null;

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
        <span className="section-label"> · {section.label}</span>
      </div>

      <div className="lyrics-block" style={textBoxStyle}>
        {slide.lines.map((line) => (
          <div
            key={line.id}
            className="lyric-line"
            style={{ fontSize: theme.fontSizeBase * 0.55 }}
          >
            {line.text}
          </div>
        ))}
      </div>

      {transResult && translation?.displayMode === 'block' && (
        <div
          className="translation-block"
          style={{
            ...textBoxStyle,
            marginTop: 16,
            color: theme.secondaryTextColor,
            fontSize: theme.fontSizeBase * 0.4,
          }}
        >
          {transResult.slide.lines.map((line) => (
            <div key={line.id} className="lyric-line">
              {line.text}
            </div>
          ))}
        </div>
      )}

      <div className="slide-indicator">
        {section.label} · Slide {slideIndex + 1} / {total}
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
