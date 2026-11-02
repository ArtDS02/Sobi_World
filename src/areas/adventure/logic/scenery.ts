// The decorations placed on an area (decision 047, `maps.json` `scenery` over the `scenery.json` library), resolved: each one's
// picture, size, stance and the tiles its foot blocks, and how see-through a cover is with the party at a point. Pure.
import { DECOR, type AreaMap } from './config/content';

type Placement = NonNullable<AreaMap['scenery']>[number];
export type DecorMode = NonNullable<Placement['mode']>;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Decor {
  id: string;
  art: string;
  /** Its foot, tiles (the middle of its base). */
  x: number;
  y: number;
  /** Drawn width / height in tiles (height null = the picture's own shape). */
  w: number;
  h: number | null;
  anchorY: number;
  rotate: number;
  flip: boolean;
  mode: DecorMode;
  /** Blocked tiles, in the area's grid. */
  foot: Rect[];
  fade: Placement['fade'] | null;
}

/** The tile a decoration's foot stands in: the one just above its foot line. */
export const footTile = (x: number, y: number): { x: number; y: number } => ({ x: Math.floor(x), y: Math.ceil(y) - 1 });

/** Every decoration of an area with the library's defaults filled in (one whose asset is unknown is left out). */
export function decorOf(map: AreaMap): Decor[] {
  const out: Decor[] = [];
  for (const p of map.scenery ?? []) {
    const a = DECOR[p.asset];
    if (!a) continue;
    const at = footTile(p.x, p.y);
    out.push({
      id: p.id,
      art: a.art,
      x: p.x,
      y: p.y,
      w: p.w ?? a.w,
      h: p.h ?? null,
      anchorY: a.anchorY ?? 0,
      rotate: p.rotate ?? 0,
      flip: !!p.flip,
      mode: p.mode ?? a.mode,
      foot: (p.foot ?? a.foot).map((r) => ({ x: at.x + r.x, y: at.y + r.y, w: r.w, h: r.h })),
      fade: p.fade ?? null,
    });
  }
  return out;
}

/** The tiles the decorations of an area block. */
export const sceneryBlocks = (map: AreaMap): Rect[] => decorOf(map).flatMap((d) => d.foot);

/**
 * How see-through a decoration should be with the party at `p` (tiles): a cover fades (to its `fade.alpha`, else gone) while the party
 * is inside its fade area, or within its radius of its middle (default: half its width, around the middle of its picture); a
 * foreground piece only when it has a `fade`; the rest stay whole.
 */
export function decorAlpha(d: Decor, p: { x: number; y: number }): number {
  if (d.mode !== 'cover' && !(d.mode === 'foreground' && d.fade)) return 1;
  const to = d.fade?.alpha ?? 0;
  const area = d.fade?.area;
  if (area) return p.x >= area.x && p.y >= area.y && p.x < area.x + area.w && p.y < area.y + area.h ? to : 1;
  const radius = d.fade?.radius ?? d.w / 2;
  const cy = d.y - (d.h ?? d.w) / 2;
  return Math.hypot(p.x - d.x, p.y - cy) <= radius ? to : 1;
}
