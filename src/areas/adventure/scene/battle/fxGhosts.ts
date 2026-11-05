// Ghosts of a fighter (an afterimage, a trail, a colour split): copies of the pictures it is drawn with now — its one picture, or every
// part of its puppet (decision 050) as it stands in the world.
import * as Phaser from 'phaser';
import type { PartCopy } from '../../../../ui/puppet/puppet';

/** One picture a ghost copies, where and how it stands. */
export type Ghost = PartCopy & { flipX: boolean };

/** Lays a copy of each ghost picture, `dx` aside and `dDepth` from it; the caller fades and destroys them. */
export function ghostImages(scene: Phaser.Scene, ghosts: readonly Ghost[], dx = 0, dDepth = -1): Phaser.GameObjects.Image[] {
  return ghosts.map((g) => scene.add.image(g.x + dx, g.y, g.key).setOrigin(g.originX, g.originY).setScale(g.scaleX, g.scaleY).setRotation(g.rotation).setFlipX(g.flipX).setDepth(g.depth + dDepth));
}
