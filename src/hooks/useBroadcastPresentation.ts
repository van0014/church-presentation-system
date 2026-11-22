import { useEffect } from 'react';
import { usePresentation } from '../stores/PresentationContext';
import { broadcastPresentation } from '../components/output/OutputView';

/** Keeps output windows in sync with operator state */
export function useBroadcastPresentation() {
  const { state, getCurrentSong, getCurrentTheme } = usePresentation();

  useEffect(() => {
    const item = state.currentItem;
    const song = getCurrentSong();
    const scripture = item?.type === 'scripture' ? item.scripture || null : null;
    const theme = getCurrentTheme();

    broadcastPresentation({
      presentation: state.presentation,
      item,
      song,
      scripture,
      theme,
    });
  }, [
    state.presentation,
    state.currentItem,
    state.songs,
    getCurrentSong,
    getCurrentTheme,
  ]);
}
