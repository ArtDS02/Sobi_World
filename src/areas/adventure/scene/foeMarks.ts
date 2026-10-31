// The marks drawn over a group on the map (decision 045): the Zzz of a sleeping one and the corruption of a strong one, art from batch
// adventure-15-coast-foes laid over the group's own picture.
import * as Phaser from 'phaser';
import { textureKey } from '../../../ui/world/keys';

/** The Zzz over a sleeping group: its art (`fx_sleep_zzz`) when the manifest has it, else drawn letters. */
export function sleepMark(scene: Phaser.Scene, t: number): Phaser.GameObjects.Image | Phaser.GameObjects.Text {
  const k = textureKey('fx_sleep_zzz');
  if (scene.textures.exists(k)) return scene.add.image(0, 0, k).setOrigin(0.5, 1).setDisplaySize(t * 0.9, t * 0.8);
  return scene.add.text(0, 0, 'z Z', { fontSize: '18px', fontStyle: 'bold', color: '#e8f0ff', stroke: '#3a4a7a', strokeThickness: 4 }).setOrigin(0.5, 1);
}

export interface CorruptionMarks {
  veins: Phaser.GameObjects.Image | null;
  spikes: Phaser.GameObjects.Image[];
}
export const NO_MARKS: CorruptionMarks = { veins: null, spikes: [] };

/**
 * A group's corruption marks over its own picture (decision 045 §8): from 3 the violet veins spread on the ground under it, from 4 a
 * crystal cluster grows behind it, at 5 a second one in front. Missing art = no marks (the tint and the dark glow still tell).
 */
export function corruptionMarks(scene: Phaser.Scene, corruption: number, height: number, ratio: number): CorruptionMarks {
  const veinsKey = textureKey('fx_corrupt_veins');
  const spikesKey = textureKey('fx_corrupt_spikes');
  const veins = corruption >= 3 && scene.textures.exists(veinsKey) ? scene.add.image(0, 0, veinsKey).setDisplaySize(height * ratio * 1.25, height * 0.42).setAlpha(0.85) : null;
  const spikes: Phaser.GameObjects.Image[] = [];
  if (corruption >= 4 && scene.textures.exists(spikesKey)) {
    spikes.push(scene.add.image(0, 0, spikesKey).setOrigin(0.5, 1).setDisplaySize(height * 0.5, height * 0.5));
    if (corruption >= 5) spikes.push(scene.add.image(0, 0, spikesKey).setOrigin(0.5, 1).setDisplaySize(height * 0.32, height * 0.32).setFlipX(true));
  }
  return { veins, spikes };
}

/** Moves a group's marks with it: the veins pulse with its dark glow, the spikes stand behind its back (it looks left), the second at its front foot. */
export function placeMarks(marks: CorruptionMarks, at: { x: number; y: number }, width: number, pulse: number) {
  marks.veins?.setPosition(at.x, at.y + 4).setDepth(at.y - 1.5).setAlpha(0.7 + 0.15 * pulse);
  marks.spikes[0]?.setPosition(at.x + width * 0.36, at.y + 2).setDepth(at.y - 0.5);
  marks.spikes[1]?.setPosition(at.x - width * 0.32, at.y + 8).setDepth(at.y + 0.5);
}
