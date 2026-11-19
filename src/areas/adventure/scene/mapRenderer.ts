// How an Adventure map is drawn (forest-diorama design A4): AdventureScene keeps the rules (the walk, touching foes, what is in reach,
// exits, saving) and asks one MapRenderer to draw the area. ClassicRenderer is the 2D drawing; a diorama renderer can stand in for it.
import type { AreaMap } from '../logic/config/content';
import type { AdventureSceneState } from './sceneState';
import type { Walker } from './walker';

export interface MapRenderer {
  /** Builds the drawing of `map` for the state `s`; the previous one is left first. A renderer that kept the very same map (see `hide`) shows it again. */
  enter(map: AreaMap, s: AdventureSceneState): void;
  /** True once the drawing is built and may be shown; until then the party stands still. */
  ready(): boolean;
  /** One frame of an exploring trip: drawing follows `s` and the walker (camera, things, groups, covers, the party's look). */
  frame(s: AdventureSceneState, walker: Walker, time: number, delta: number): void;
  /** Shows the hint of a chest at strength `k` (0 = none, 1 = full): the party is near an unopened chest. */
  chestHint(id: string, k: number): void;
  /** The party dissolving into (or coming out of) a teleport gate's light: 0 = solid, 1 = gone. */
  warp(k: number): void;
  /** Where a point of the area (design px) is drawn, in the scene's own coordinates (for labels and one-shot effects over the map). */
  screenOf(px: { x: number; y: number }): { x: number; y: number };
  /** The size of things drawn over the map at `screenOf` points (they are fixed on the screen then); null: they live in the map's own world. */
  overlayScale(): number | null;
  /** The camera jumps to the party on the next frame (they were put somewhere else). */
  snapCamera(): void;
  /** The map is left for the camp or a battle: stops drawing it; a renderer may keep what it built for `enter` to show again. */
  hide(): void;
  /** The scene goes to sleep (the Adventure is left): frees what must not stay on the GPU. True when the map must be entered again on waking. */
  suspend(): boolean;
  /** Drops the drawing of the current map (another area, or the area must be built again). */
  leave(): void;
  /** The scene is over: frees everything. */
  dispose(): void;
}
