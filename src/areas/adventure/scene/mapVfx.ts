// One-shot pictures on the map that the FeedbackDirector asks for (decision 045: `fx_secret_found` when a hidden place is found).
import * as Phaser from 'phaser';
import type { AreaVfx } from '../../../core/events';
import { textureKey } from '../../../ui/world/keys';
import type { AreaMap } from '../logic/config/content';

/**
 * Plays `vfx` on the false wall it names, else over the party at `party`: it swells and turns as it fades; with reduced motion (`still`)
 * it only fades in and out where it stands. Missing art = nothing (the toast and the sound still tell).
 */
export function playMapVfx(scene: Phaser.Scene, map: AreaMap, party: { x: number; y: number }, vfx: AreaVfx, still: boolean) {
  const k = textureKey(vfx.fx);
  if (!scene.textures.exists(k)) return;
  const t = map.tile;
  const wall = map.gates.find((g) => g.id === vfx.at);
  const at = wall ? { x: (wall.x + wall.w / 2) * t, y: (wall.y + wall.h / 2) * t } : { x: party.x, y: party.y - t * 0.8 };
  const img = scene.add.image(at.x, at.y, k).setDepth(99998).setDisplaySize(t * 3, t * 3);
  const size = img.scale;
  if (still) {
    img.setAlpha(0);
    scene.tweens.chain({ targets: img, tweens: [{ alpha: 1, duration: 300 }, { alpha: 0, duration: 600, delay: 400 }], onComplete: () => img.destroy() });
    return;
  }
  img.setScale(size * 0.4);
  scene.tweens.add({ targets: img, scale: size * 1.15, angle: 40, alpha: { from: 1, to: 0 }, ease: 'Cubic.easeOut', duration: 1100, onComplete: () => img.destroy() });
}
