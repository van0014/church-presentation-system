import React, { useState } from 'react';
import { usePresentation } from '../../stores/PresentationContext';
import './FitControls.css';

/** Readable fonts for projection — short labels, no CSS jargon */
export const PROJECTION_FONTS: { label: string; value: string }[] = [
  { label: 'Clean', value: 'Inter, system-ui, sans-serif' },
  { label: 'Classic', value: 'Georgia, "Times New Roman", serif' },
  { label: 'Modern', value: '"Segoe UI", system-ui, sans-serif' },
  { label: 'Soft', value: '"Nunito", "Segoe UI", sans-serif' },
  { label: 'Bold', value: '"Arial Black", Arial, sans-serif' },
  { label: 'Narrow', value: '"Arial Narrow", Arial, sans-serif' },
];

/** Map slider 0–100 → px (hidden from operator). Room for large projection. */
const FIT_MIN_PX = 24;
const FIT_MAX_PX = 120;

export function fitToPx(fit: number): number {
  // 0 = 24px, ~50 ≈ 72px, 100 = 120px
  const clamped = Math.max(0, Math.min(100, fit));
  return Math.round(FIT_MIN_PX + (clamped / 100) * (FIT_MAX_PX - FIT_MIN_PX));
}

export function pxToFit(px: number): number {
  const t = ((px - FIT_MIN_PX) / (FIT_MAX_PX - FIT_MIN_PX)) * 100;
  return Math.round(Math.max(0, Math.min(100, t)));
}

/**
 * Operator-facing type controls:
 * - Font (friendly names)
 * - Size as a "fit" slider — no px numbers
 * - Optional word / letter spacing behind "Spacing"
 */
export function FitControls() {
  const { getCurrentTheme, updateTheme } = usePresentation();
  const theme = getCurrentTheme();
  const [showSpacing, setShowSpacing] = useState(false);

  const fit = pxToFit(theme.fontSizeBase || 48);
  const letter = theme.letterSpacing ?? 0;
  const word = theme.wordSpacing ?? 0;

  const setFit = (v: number) => {
    updateTheme(theme.id, { fontSizeBase: fitToPx(v) });
  };

  const setFont = (value: string) => {
    updateTheme(theme.id, { fontFamily: value });
  };

  return (
    <div className="fit-controls">
      <div className="fit-row">
        <label className="fit-label" htmlFor="fit-font">
          Font
        </label>
        <select
          id="fit-font"
          className="fit-select"
          value={theme.fontFamily}
          onChange={(e) => setFont(e.target.value)}
        >
          {PROJECTION_FONTS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
          {/* Keep current if custom */}
          {!PROJECTION_FONTS.some((f) => f.value === theme.fontFamily) && (
            <option value={theme.fontFamily}>Custom</option>
          )}
        </select>
      </div>

      <div className="fit-row fit-slider-row">
        <label className="fit-label" htmlFor="fit-size">
          Text size
        </label>
        <div className="fit-slider-wrap">
          <span className="fit-end muted">Smaller</span>
          <input
            id="fit-size"
            type="range"
            min={0}
            max={100}
            step={1}
            value={fit}
            onChange={(e) => setFit(Number(e.target.value))}
            className="fit-slider"
          />
          <span className="fit-end muted">Larger</span>
        </div>
      </div>

      <button
        type="button"
        className="fit-spacing-toggle"
        onClick={() => setShowSpacing((s) => !s)}
      >
        {showSpacing ? 'Hide spacing' : 'Spacing…'}
      </button>

      {showSpacing && (
        <div className="fit-spacing">
          <div className="fit-row fit-slider-row">
            <label className="fit-label" htmlFor="fit-letter">
              Letter spacing
            </label>
            <div className="fit-slider-wrap">
              <span className="fit-end muted">Tight</span>
              <input
                id="fit-letter"
                type="range"
                min={-5}
                max={20}
                step={1}
                value={Math.round(letter * 100)}
                onChange={(e) =>
                  updateTheme(theme.id, {
                    letterSpacing: Number(e.target.value) / 100,
                  })
                }
                className="fit-slider"
              />
              <span className="fit-end muted">Wide</span>
            </div>
          </div>
          <div className="fit-row fit-slider-row">
            <label className="fit-label" htmlFor="fit-word">
              Word spacing
            </label>
            <div className="fit-slider-wrap">
              <span className="fit-end muted">Tight</span>
              <input
                id="fit-word"
                type="range"
                min={-5}
                max={40}
                step={1}
                value={Math.round(word * 100)}
                onChange={(e) =>
                  updateTheme(theme.id, {
                    wordSpacing: Number(e.target.value) / 100,
                  })
                }
                className="fit-slider"
              />
              <span className="fit-end muted">Wide</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
