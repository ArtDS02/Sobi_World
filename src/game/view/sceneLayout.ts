// Manifest layout → design-pixel positions and depth bands for the farm scene (spec §11.1). Pure.
import type { Placement } from '../../core/assets/manifestSchema';
import { FARM_FALLBACK, FARM_VIEW } from '../../core/config/farmView';
import type { FarmLayout } from './pigView';

export const ACTOR_LAYER = 4;
export const OVERLAY_LAYER = 5;

export interface PlacementView {
  x: number;
  y: number;
  originX: number;
  originY: number;
  depth: number;
}

/**
 * Layers 0–3 stack in manifest order below every actor; layer 4 is Y-sorted with the pigs
 * (depth = y px); layer 5 sits above everything.
 */
export function placementDepth(p: Placement, index: number, layout: FarmLayout): number {
  if (p.layer === ACTOR_LAYER) return p.y * layout.designSize.height;
  if (p.layer === OVERLAY_LAYER) return FARM_VIEW.OVERLAY_DEPTH + index;
  return FARM_VIEW.BACK_LAYER_DEPTH + p.layer * FARM_VIEW.BACK_LAYER_STEP + index;
}

export function placementView(p: Placement, index: number, layout: FarmLayout): PlacementView {
  return {
    x: p.x * layout.designSize.width,
    y: p.y * layout.designSize.height,
    originX: p.originX ?? FARM_VIEW.PLACEMENT_ORIGIN.x,
    originY: p.originY ?? FARM_VIEW.PLACEMENT_ORIGIN.y,
    depth: placementDepth(p, index, layout),
  };
}

/** Ground line (px) for the flat-colour backdrop: the first layer-2 placement, else the default. */
export function groundLineY(layout: FarmLayout, isEnvironment: (id: string) => boolean): number {
  const ground = layout.placements.find((p) => p.layer === 2 && isEnvironment(p.id));
  return (ground?.y ?? FARM_FALLBACK.GROUND_Y) * layout.designSize.height;
}
