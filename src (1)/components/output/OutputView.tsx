import React, { useEffect, useState } from 'react';
import type { PlaylistItem, Song, Scripture, Theme, PresentationState } from '../../types';
import { SongPreview } from '../lyrics/SongPreview';
import { ScripturePreview } from '../scripture/ScripturePreview';
import './OutputView.css';

export type OutputRole = 'main' | 'stage';

interface OutputPayload {
  presentation: PresentationState;
  item: PlaylistItem | null;
  song: Song | null;
  scripture: Scripture | null;
  theme: Theme;
  role: OutputRole;
}

const CHANNEL = 'church-presenter-output';

export function OutputView({ role }: { role: OutputRole }) {
  const [payload, setPayload] = useState<OutputPayload | null>(null);

  useEffect(() => {
    const bc = new BroadcastChannel(CHANNEL);
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === 'PRESENTATION') {
        setPayload({ ...ev.data.payload, role });
      }
    };
    bc.addEventListener('message', onMsg);

    // Request current state
    bc.postMessage({ type: 'REQUEST_STATE' });

    // Also listen via localStorage as fallback
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'church-presenter-live' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          setPayload({ ...data, role });
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorage);

    // Try reading current
    try {
      const raw = localStorage.getItem('church-presenter-live');
      if (raw) setPayload({ ...JSON.parse(raw), role });
    } catch { /* ignore */ }

    return () => {
      bc.removeEventListener('message', onMsg);
      bc.close();
      window.removeEventListener('storage', onStorage);
    };
  }, [role]);

  if (!payload) {
    return (
      <div className="output-view waiting">
        <div>Waiting for presentation…</div>
        <div className="text-muted text-sm">Open the operator window and present an item</div>
      </div>
    );
  }

  const { presentation, item, song, scripture, theme } = payload;
  const { isBlack, isClear, currentSlideIndex } = presentation;

  const isStage = role === 'stage';

  return (
    <div
      className={`output-view ${role}`}
      style={{
        backgroundColor: isBlack ? '#000' : theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily,
      }}
    >
      {isBlack && <div className="output-black" />}
      {isClear && !isBlack && <div className="output-clear" />}

      {!isBlack && !isClear && item && (
        <>
          {item.type === 'song' && song && (
            <SongPreview
              song={song}
              slideIndex={currentSlideIndex}
              theme={theme}
              showTranslation={!isStage || true}
            />
          )}
          {item.type === 'scripture' && (scripture || item.scripture) && (
            <ScripturePreview
              scripture={scripture || item.scripture!}
              slideIndex={currentSlideIndex}
              theme={theme}
            />
          )}
          {item.type === 'image' && (
            item.source ? (
              <img
                src={item.source}
                alt={item.title}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div className="output-placeholder">
                <div className="ph-icon">🖼️</div>
                <div>{item.title}</div>
              </div>
            )
          )}
          {item.type === 'empty' && <div className="output-placeholder muted" />}
          {(item.type === 'video' || item.type === 'youtube') && (
            <div className="output-placeholder">
              <div className="ph-icon">▶</div>
              <div>{item.title}</div>
            </div>
          )}
        </>
      )}

      {isStage && !isBlack && (
        <div className="stage-chrome">
          <div className="stage-timer">{formatTime()}</div>
          <div className="stage-next">
            {item ? `Live: ${item.title}` : '—'}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Call from operator to push state to output windows */
export function broadcastPresentation(payload: Omit<OutputPayload, 'role'>) {
  const data = { ...payload };
  try {
    localStorage.setItem('church-presenter-live', JSON.stringify(data));
  } catch { /* ignore */ }
  try {
    const bc = new BroadcastChannel(CHANNEL);
    bc.postMessage({ type: 'PRESENTATION', payload: data });
    bc.close();
  } catch { /* ignore */ }
}
