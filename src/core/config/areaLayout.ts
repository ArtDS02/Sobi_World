// The scene layouts of the Areas (content/<area>/layout.json, decision 057 B5) under their game names, and the small readers the
// scenes' view files use to take a spot in the shape they draw with.
import type { AreaLayoutFile, LayoutSpot } from '../../../content/schemas/shared/areaLayout';
import { CONTENT } from './content';

export type { AreaLayoutFile, LayoutSpot };

export const CLOUD_LAYOUT: AreaLayoutFile = CONTENT.cloudLayout;
export const GARDEN_LAYOUT: AreaLayoutFile = CONTENT.gardenLayout;
export const AQUARIUM_LAYOUT: AreaLayoutFile = CONTENT.aquariumLayout;

type Spots = Readonly<Record<string, LayoutSpot | undefined>>;

/** The spots of view `index`; a view past the list reads the last one. */
export const spotsOf = (layout: AreaLayoutFile, index = 0): Spots => layout.views[Math.min(Math.max(index, 0), layout.views.length - 1)]!.spots;

/** A spot the scene cannot draw without (the file's schema lists the ones every view has). */
export function need(spots: Spots, key: string): LayoutSpot {
  const spot = spots[key];
  if (!spot) throw new Error(`layout: missing spot "${key}"`);
  return spot;
}

export const at = (s: LayoutSpot) => ({ x: s.x, y: s.y });
export const scaled = (s: LayoutSpot) => ({ x: s.x, y: s.y, scale: s.scale ?? 1 });
export const grid = (s: LayoutSpot) => ({ x: s.x, y: s.y, stepX: s.stepX ?? 0, stepY: s.stepY ?? 0 });
export const boxed = (s: LayoutSpot) => ({ x: s.x, y: s.y, width: s.width ?? 0, height: s.height ?? 0 });
