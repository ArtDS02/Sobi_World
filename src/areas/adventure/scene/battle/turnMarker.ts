// The "it is your turn" sign on the field (ANIM-011): a ring pulsing on the ground under the unit whose turn it is and an arrow bobbing
// over its head - gold for ours, violet-red for the enemy's. It goes the moment the unit starts to act (or falls). Drawn in code on one
// Graphics (art_inbox A07 can replace it); with reduced motion it stands still.
import type * as Phaser from 'phaser';
import { AIR_DEPTH } from './fxBursts';
import type { FxAnchor } from './fxPlayer';

/** The colours and sizes of the sign (tune here). */
export const TURN_MARKER = {
  ally: { fill: 0xffd23c, edge: 0xb8741a },
  enemy: { fill: 0xc86bff, edge: 0x6a1f8a },
  /** Arrow height as a share of the unit's height. */
  arrow: 0.16,
  bobPx: 6,
  bobHz: 1.6,
} as const;

export class TurnMarker {
  private g: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this.g = scene.add.graphics().setDepth(AIR_DEPTH - 6);
  }

  /** `unit` is the one whose turn it is (null: nobody, or a step is playing). */
  update(unit: { id: string; down: boolean } | null, anchors: ReadonlyMap<string, FxAnchor>, now: number, reduce: boolean) {
    this.g.clear();
    const a = unit && !unit.down ? anchors.get(unit.id) : undefined;
    if (!a) return;
    const c = TURN_MARKER[a.side];
    const pulse = reduce ? 0 : Math.sin(now / 260);
    // The ring on the ground.
    const rw = a.width * (0.78 + 0.05 * pulse);
    this.g.lineStyle(4, c.fill, 0.85).strokeEllipse(a.feet.x, a.feet.y, rw, rw * 0.3);
    this.g.lineStyle(2, 0xffffff, 0.7).strokeEllipse(a.feet.x, a.feet.y, rw * 0.9, rw * 0.27);
    // The arrow over the head, pointing down.
    const bob = reduce ? 0 : Math.sin((now / 1000) * TURN_MARKER.bobHz * Math.PI * 2) * TURN_MARKER.bobPx;
    const h = a.height * TURN_MARKER.arrow;
    const w = h * 0.9;
    const tipY = a.feet.y - a.height * 1.04 + bob;
    const x = a.head.x;
    this.g.fillStyle(c.fill, 1).lineStyle(3, c.edge, 1);
    this.g.beginPath().moveTo(x - w / 2, tipY - h).lineTo(x + w / 2, tipY - h).lineTo(x, tipY).closePath().fillPath().strokePath();
  }

  hide() {
    this.g.clear();
  }
}
