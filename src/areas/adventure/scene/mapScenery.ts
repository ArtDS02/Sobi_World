// The hand-placed decorations of an area (decision 047, `logic/scenery.ts`): each picture stands on its foot, as wide as placed, turned
// and mirrored as placed; `normal` lies on the ground under everything, `occluder` sorts with the walkers by its foot, `foreground`
// and `cover` stand over the party — a cover (or a foreground piece with a fade) fades while the party is near or inside it. Phaser.
import type * as Phaser from 'phaser';
import { textureKey } from '../../../ui/world/keys';
import type { AreaMap } from '../logic/config/content';
import { decorAlpha, decorOf, type Decor } from '../logic/scenery';

/** Depth of what stands over the party (the covers' own). */
const OVER = 990_000;
/** How fast a decoration fades (ms to close ~63 % of the way), like the covers. */
const FADE_MS = 140;

export type SceneryFades = Map<string, { img: Phaser.GameObjects.Image; d: Decor }>;

/** Lays the decorations of `map` into `layer`; returns the ones that fade. A picture not loaded yet is left out. */
export function layScenery(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, map: AreaMap): SceneryFades {
  const t = map.tile;
  const fades: SceneryFades = new Map();
  for (const d of decorOf(map)) {
    const k = textureKey(d.art);
    if (!scene.textures.exists(k)) continue;
    const img = scene.add.image(d.x * t, d.y * t, k).setOrigin(0.5, 1 - d.anchorY).setFlipX(d.flip).setAngle(d.rotate);
    const w = d.w * t;
    img.setDisplaySize(w, d.h !== null ? d.h * t : (w * img.height) / Math.max(1, img.width));
    img.setDepth(d.mode === 'normal' ? -8 : d.mode === 'occluder' ? d.y * t : OVER);
    layer.add(img);
    if (d.mode === 'cover' || (d.mode === 'foreground' && d.fade)) fades.set(d.id, { img, d });
  }
  return fades;
}

/** Moves each fading decoration toward its alpha for the party at `pos` (design px). */
export function fadeScenery(map: AreaMap, fades: SceneryFades, pos: { x: number; y: number }, delta: number, still: boolean) {
  if (fades.size === 0) return;
  const p = { x: pos.x / map.tile, y: pos.y / map.tile };
  const k = still ? 1 : 1 - Math.exp(-delta / FADE_MS);
  for (const { img, d } of fades.values()) img.setAlpha(img.alpha + (decorAlpha(d, p) - img.alpha) * k);
}
