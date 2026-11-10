// The "harvest hand" pointer (decision 057, B3): over a flower (Cloud) or a crop (Garden) that can be picked now — ripe, or
// wilted — the pointer becomes a small picking hand; anywhere else it is whatever it was. It never shows while a dialog or panel
// covers the world or while the tier / zone is changing. The picture is an inline SVG (a data URI: no file, no network), so it
// works the same in Electron and in the browser; final art is listed in docs/ASSET_TODO.md.
import type * as Phaser from 'phaser';

/** A crop can be picked when it is ripe, and still when it has wilted (it gives less). */
export const canHarvest = (stage: string | null | undefined): boolean => stage === 'ripe' || stage === 'wilted';

/** The hand shows only over something to pick, with the pointer on the scene, and nothing in the way. */
export const harvestHandShown = (v: { over: boolean; blocked: boolean }): boolean => v.over && !v.blocked;

export const HARVEST_CURSOR_SIZE = 32;
/** The point of the picture that picks: between the thumb and the forefinger. */
export const HARVEST_CURSOR_HOTSPOT = { x: 10, y: 5 } as const;

// An open hand reaching up, with a small leaf between thumb and forefinger. Original drawing; brown outline like the game's art.
const SVG = [
  `<svg xmlns="http://www.w3.org/2000/svg" width="${HARVEST_CURSOR_SIZE}" height="${HARVEST_CURSOR_SIZE}" viewBox="0 0 32 32">`,
  '<path d="M10 4c2 0 3 1.4 3 3.2V14l1-8.5C14.2 3.8 15.3 3 16.6 3s2.400 1 2.400 2.600V14l1.200-6.500c.3-1.400 1.300-2.200 2.500-2s2 1.300 1.800 2.800L23.400 16l1.700-3.500c.6-1.200 1.800-1.700 2.900-1.200s1.500 1.800 1 3.100L25.600 23c-1.300 4-4.300 6.500-8.800 6.500-5 0-8.300-2.800-9.300-7.200L5.300 12.400c-.3-1.500.4-2.700 1.700-3s2.500.4 3 1.800L11 14V7.200" fill="#ffe6c8" stroke="#6b4226" stroke-width="1.600" stroke-linejoin="round" stroke-linecap="round"/>',
  '<path d="M10 5c-3.500-3-7-2-8 1 3 2.500 6 2 8-1z" fill="#7ac74f" stroke="#3d6b1f" stroke-width="1.200" stroke-linejoin="round"/>',
  '</svg>',
].join('');

/** A CSS `cursor` value: the picture with its hotspot, and the plain pointer for a browser that refuses it. */
export const HARVEST_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(SVG)}") ${HARVEST_CURSOR_HOTSPOT.x} ${HARVEST_CURSOR_HOTSPOT.y}, pointer`;

type Img = Phaser.GameObjects.Image;

export interface HarvestCursorDeps {
  /** A dialog or panel covers the world, or the tier / zone is changing. */
  blocked: () => boolean;
  /** The pictures (bed and plant) of every plot that can be picked now. */
  targets: () => readonly Img[];
}

/** Watches the pointer every frame of `scene` and swaps the canvas pointer; puts the old one back as soon as it leaves. */
export function watchHarvestCursor(scene: Phaser.Scene, d: HarvestCursorDeps) {
  let on = false;
  const canvas = () => scene.input.manager.canvas;
  /** What the pointer would be without the hand: the pointer of the object under it (Phaser's own rule), else the default. */
  const plain = (): string => {
    const hit = scene.input.hitTestPointer(scene.input.activePointer) as Phaser.GameObjects.GameObject[];
    const own = hit.find((o) => o.input?.cursor)?.input?.cursor;
    return typeof own === 'string' ? own : (scene.input.manager.defaultCursor ?? '');
  };
  const check = () => {
    const p = scene.input.activePointer;
    const at = p.positionToCamera(scene.cameras.main) as Phaser.Math.Vector2;
    const over = scene.input.manager.isOver && d.targets().some((img) => img.visible && img.getBounds().contains(at.x, at.y));
    const show = harvestHandShown({ over, blocked: d.blocked() });
    if (show) {
      // Phaser sets its own pointer on every "over" event, so the hand is put back each frame it should show.
      if (canvas().style.cursor !== HARVEST_CURSOR) canvas().style.cursor = HARVEST_CURSOR;
      on = true;
    } else if (on) {
      canvas().style.cursor = plain();
      on = false;
    }
  };
  scene.events.on('update', check);
  scene.events.once('shutdown', () => scene.events.off('update', check));
  scene.events.on('sleep', () => {
    if (on) canvas().style.cursor = scene.input.manager.defaultCursor ?? '';
    on = false;
  });
}
