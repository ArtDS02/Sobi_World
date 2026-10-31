// The Umbraflux on an area (decision 045): a violet veil over the ground, deeper on the corrupted tiles, the kit's corrupted dressing
// (sludge, cracks, crystals, sick plants: decals.ts) and violet dust rising, all as strong as the area's corruption now (it drops a step
// once the zone's boss has fallen). The veil and the dressing go into the area's layer (under the things), the dust over the party.
// Phaser.
import * as Phaser from 'phaser';
import { textureKey } from '../../../ui/world/keys';
import type { AreaMap } from '../logic/config/content';
import { corruptionDecalsOf } from './decals';

const VEIL = 0x4a1a66;
/** The veil's alpha at 100 % corruption, and on a corrupted tile (`c`) on top of it. */
const VEIL_MAX = 0.3;
const TILE_MORE = 0.22;

/** Lays the veil and starts the dust; both are destroyed with the layer. `motion` = false: no dust. */
export function dressCorruption(scene: Phaser.Scene, layer: Phaser.GameObjects.Container, map: AreaMap, pct: number, motion: boolean) {
  const t = map.tile;
  const share = Math.max(0, Math.min(100, pct)) / 100;
  const veil = scene.add.graphics();
  if (share > 0) veil.fillStyle(VEIL, VEIL_MAX * share).fillRect(0, 0, map.cols * t, map.rows * t);
  map.terrain.forEach((row, y) => [...row].forEach((c, x) => c === 'c' && veil.fillStyle(VEIL, TILE_MORE).fillRect(x * t, y * t, t, t)));
  layer.add(veil);
  for (const d of corruptionDecalsOf(map, map.zoneId.replace(/^zone_/, ''), pct)) {
    const k = textureKey(d.art);
    if (!scene.textures.exists(k)) continue;
    // Flat marks lie on the ground; upright pieces stand and sort with the walker.
    const img = scene.add.image(d.x, d.y, k).setOrigin(0.5, d.flat ? 0.5 : 1).setFlipX(d.flip).setDepth(d.flat ? -9 : d.y);
    img.setDisplaySize(d.size, (d.size * img.height) / Math.max(1, img.width)).setAlpha(d.flat ? 0.85 : 1);
    layer.add(img);
  }
  if (!motion || share <= 0) return;
  const dust = scene.add.particles(0, 0, 'adv-fx-dot', {
    x: { min: 0, max: map.cols * t },
    y: { min: 0, max: map.rows * t },
    lifespan: { min: 2600, max: 4200 },
    speedX: { min: -6, max: 6 },
    speedY: { min: -26, max: -10 },
    scale: { start: 0.3, end: 0.05 },
    alpha: { start: 0.75, end: 0 },
    tint: [0x9b4dff, 0xc77dff, 0x5a1a8a],
    // Denser the more corrupted, and with the size of the area.
    frequency: Math.max(18, 900 / (share * Math.max(1, (map.cols * map.rows) / 600))),
  });
  dust.setDepth(995_000);
  layer.once(Phaser.GameObjects.Events.DESTROY, () => dust.destroy());
}
