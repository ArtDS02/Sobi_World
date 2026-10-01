// Pig anchors (art standard §5): parse an `*.anchors.json`, fall back per anchor to the defaults,
// and mirror on flip (x' = 1 - x).
import { z } from 'zod';
import { ANCHOR_NAMES, DEFAULT_ANCHORS, PIG_FEET_Y, type AnchorName } from '../config/assetIds';

export interface AnchorPoint {
  x: number;
  y: number;
}
export type Anchors = Record<AnchorName, AnchorPoint>;

const point = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) });

/** Any JSON (or nothing) → a full anchor set. Invalid or missing anchors take the default; feet.y is fixed. */
export function parseAnchors(raw: unknown): Anchors {
  const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const out = {} as Anchors;
  for (const name of ANCHOR_NAMES) {
    const r = point.safeParse(src[name]);
    out[name] = r.success ? { x: r.data.x, y: r.data.y } : { ...DEFAULT_ANCHORS[name] };
  }
  out.feet = { x: out.feet.x, y: PIG_FEET_Y };
  return out;
}

/** Anchor in canvas-normalised coordinates, mirrored when the sprite is flipped. */
export function anchorPoint(anchors: Anchors, name: AnchorName, flipX: boolean): AnchorPoint {
  const a = anchors[name];
  return { x: flipX ? 1 - a.x : a.x, y: a.y };
}

/**
 * Offset in display pixels from the sprite origin (feet: x 0.5, y PIG_FEET_Y) to an anchor,
 * for a sprite drawn `width` × `height` on screen.
 */
export function anchorOffset(
  anchors: Anchors,
  name: AnchorName,
  flipX: boolean,
  width: number,
  height: number,
): AnchorPoint {
  const a = anchorPoint(anchors, name, flipX);
  return { x: (a.x - 0.5) * width, y: (a.y - PIG_FEET_Y) * height };
}
