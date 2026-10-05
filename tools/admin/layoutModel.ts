// Farm layout editing as pure list operations (DECISIONS AD-1), unit-tested. Placements are the
// manifest `layout.placements` rows (x, y normalised to the 1600×900 design frame); the editor UI
// (layout.ts) only calls these and keeps an undo history of whole lists.
import type { Placement } from '../../src/core/assets/manifestSchema';
import { FARM_VIEW } from '../../src/core/config/farmView';
import { placementDepth } from '../../src/areas/farm/scene/view/sceneLayout';

export type { Placement };

export interface Design {
  width: number;
  height: number;
}

const round4 = (n: number) => Math.round(n * 10000) / 10000;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Box of a placement in design px (before rotation): the art size `nat` scaled like the game does. */
export function boxOf(p: Placement, nat: { w: number; h: number }, d: Design) {
  const sy = p.height ? p.height / nat.h : null;
  const sx = p.width ? p.width / nat.w : (sy ?? 1);
  const w = nat.w * sx;
  const h = nat.h * (sy ?? sx);
  const ox = p.originX ?? FARM_VIEW.PLACEMENT_ORIGIN.x;
  const oy = p.originY ?? FARM_VIEW.PLACEMENT_ORIGIN.y;
  return { left: p.x * d.width - w * ox, top: p.y * d.height - h * oy, w, h, ox, oy };
}

/** Drawing order (back → front) exactly as the scene sorts depths. */
export function drawOrder(list: readonly Placement[], d: Design): number[] {
  const layout = { designSize: d } as Parameters<typeof placementDepth>[2];
  return list
    .map((p, i) => ({ i, depth: placementDepth(p, i, layout) }))
    .sort((a, b) => a.depth - b.depth || a.i - b.i)
    .map((x) => x.i);
}

export const moveTo = (list: readonly Placement[], i: number, xPx: number, yPx: number, d: Design): Placement[] =>
  list.map((p, k) => (k === i ? { ...p, x: round4(clamp(xPx / d.width, -0.25, 1.25)), y: round4(clamp(yPx / d.height, -0.25, 1.25)) } : p));

export const patch = (list: readonly Placement[], i: number, next: Partial<Placement>): Placement[] =>
  list.map((p, k) => {
    if (k !== i) return p;
    const out: Record<string, unknown> = { ...p, ...next };
    // Unset optionals instead of writing nulls/defaults into the manifest.
    for (const [key, v] of Object.entries(out)) if (v === undefined || v === '' || v === null) delete out[key];
    if (out.rotation === 0) delete out.rotation;
    if (out.flipX === false) delete out.flipX;
    if (out.visible === true) delete out.visible;
    if (out.locked === false) delete out.locked;
    if (out.signed === false) delete out.signed;
    return out as Placement;
  });

/** New placement of `id` at a design-px point (dropped from the library). */
export function add(list: readonly Placement[], id: string, xPx: number, yPx: number, d: Design, layer = 4, width?: number): Placement[] {
  const p: Placement = { id, layer, x: round4(xPx / d.width), y: round4(yPx / d.height), ...(width ? { width: Math.round(width) } : {}) };
  return [...list, p];
}

/** Copy next to the original. Unique roles (trough, order board) and the badge are not copied. */
export function duplicate(list: readonly Placement[], i: number): Placement[] {
  const src = list[i];
  if (!src) return [...list];
  const copy: Placement = { ...src, x: round4(src.x + 0.02), y: round4(src.y + 0.02) };
  delete copy.role;
  delete copy.badge;
  delete copy.locked;
  return [...list.slice(0, i + 1), copy, ...list.slice(i + 1)];
}

export const remove = (list: readonly Placement[], i: number): Placement[] => list.filter((_, k) => k !== i);

/**
 * Stacking inside the same layer (layers 0–3 and 5 draw in list order; layer 4 sorts by Y in game,
 * so order only breaks ties there). Returns the list and the item's new index.
 */
export function reorder(list: readonly Placement[], i: number, dir: 'up' | 'down' | 'front' | 'back'): { list: Placement[]; index: number } {
  const layer = list[i]?.layer;
  const same = list.map((p, k) => (p.layer === layer ? k : -1)).filter((k) => k >= 0);
  const pos = same.indexOf(i);
  const target =
    dir === 'up' ? same[pos + 1] : dir === 'down' ? same[pos - 1] : dir === 'front' ? same[same.length - 1] : same[0];
  if (target === undefined || target === i) return { list: [...list], index: i };
  const out = [...list];
  const [item] = out.splice(i, 1);
  out.splice(target, 0, item!);
  return { list: out, index: target };
}

/** Undo / redo of whole lists (cheap: a layout is ~20 small objects). */
export class History {
  private past: Placement[][] = [];
  private future: Placement[][] = [];
  constructor(private readonly limit = 100) {}
  push(before: readonly Placement[]) {
    this.past.push([...before]);
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }
  undo(current: readonly Placement[]): Placement[] | null {
    const prev = this.past.pop();
    if (!prev) return null;
    this.future.push([...current]);
    return prev;
  }
  redo(current: readonly Placement[]): Placement[] | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push([...current]);
    return next;
  }
  get canUndo() {
    return this.past.length > 0;
  }
  get canRedo() {
    return this.future.length > 0;
  }
  clear() {
    this.past = [];
    this.future = [];
  }
}
