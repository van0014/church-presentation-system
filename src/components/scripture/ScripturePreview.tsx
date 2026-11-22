import React from 'react';
import type { Scripture, Theme } from '../../types';
import './ScripturePreview.css';

interface Props {
  scripture: Scripture;
  slideIndex: number;
  theme: Theme;
}

export function ScripturePreview({ scripture, slideIndex, theme }: Props) {
  // For demo: one verse per slide (or whole if short)
  const verse = scripture.verses[slideIndex];
  const secondary = scripture.secondaryTranslation?.verses[slideIndex];

  if (!verse) {
    return (
      <div className="scripture-preview empty">
        <div className="ref">{scripture.reference}</div>
        <div className="text-muted">End of passage</div>
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
    <div className="scripture-preview" style={{ color: theme.textColor }}>
      <div className="ref" style={{ color: theme.secondaryTextColor }}>
        {scripture.reference} ({scripture.translation})
      </div>

      <div className="verse-block" style={textBoxStyle}>
        <span className="verse-num">{verse.number}</span>
        <span
          className="verse-text"
          style={{ fontSize: theme.fontSizeBase * 0.5 }}
        >
          {verse.text}
        </span>
      </div>

      {secondary && (
        <div
          className="secondary-block"
          style={{
            ...textBoxStyle,
            marginTop: 14,
            color: theme.secondaryTextColor,
            fontSize: theme.fontSizeBase * 0.38,
          }}
        >
          <span className="verse-num">{secondary.number}</span>
          <span className="verse-text">{secondary.text}</span>
        </div>
      )}

      <div className="slide-indicator">
        {slideIndex + 1} / {scripture.verses.length}
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
