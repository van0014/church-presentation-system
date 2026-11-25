/**
 * Spatial (visual grid) navigation for slide cards.
 * Uses on-screen positions so Down goes to the card below, not "next in list".
 */

export type SpatialDir = 'up' | 'down' | 'left' | 'right';

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
}

function toRect(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return {
    left: r.left,
    top: r.top,
    right: r.right,
    bottom: r.bottom,
    width: r.width,
    height: r.height,
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
  };
}

/**
 * Given card elements in DOM order (index === slide index) and a direction,
 * return the index of the most intuitive neighbour.
 */
export function spatialNeighbour(
  cards: Element[],
  fromIndex: number,
  dir: SpatialDir
): number {
  if (cards.length === 0) return 0;
  const from = Math.max(0, Math.min(fromIndex, cards.length - 1));
  const origin = toRect(cards[from]);
  const candidates: { i: number; score: number }[] = [];

  for (let i = 0; i < cards.length; i++) {
    if (i === from) continue;
    const r = toRect(cards[i]);
    let ok = false;
    let primary = 0;
    let secondary = 0;

    if (dir === 'right') {
      ok = r.left >= origin.left + origin.width * 0.4;
      primary = r.left - origin.right;
      secondary = Math.abs(r.cy - origin.cy);
    } else if (dir === 'left') {
      ok = r.right <= origin.right - origin.width * 0.4;
      primary = origin.left - r.right;
      secondary = Math.abs(r.cy - origin.cy);
    } else if (dir === 'down') {
      ok = r.top >= origin.top + origin.height * 0.4;
      primary = r.top - origin.bottom;
      secondary = Math.abs(r.cx - origin.cx);
    } else if (dir === 'up') {
      ok = r.bottom <= origin.bottom - origin.height * 0.4;
      primary = origin.top - r.bottom;
      secondary = Math.abs(r.cx - origin.cx);
    }

    if (!ok) continue;
    // Prefer closer in movement direction, then better alignment on the cross axis
    const score = primary + secondary * 2;
    candidates.push({ i, score });
  }

  if (candidates.length === 0) return from;
  candidates.sort((a, b) => a.score - b.score);
  return candidates[0].i;
}
