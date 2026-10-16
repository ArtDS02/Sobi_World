// Small moving touches of the Garden scene (GĐ14): the sprinkler's spray and its mist over watered plots, and the name
// bubble over a hovered building. Drawn in code (no art files); nothing here runs when motion is reduced.
import * as Phaser from 'phaser';
import { GARDEN_VIEW } from './gardenView';

const DROP = 'fx_garden_drop';

function ensureDrop(scene: Phaser.Scene) {
  if (scene.textures.exists(DROP)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x8fd3f4, 1).fillCircle(6, 8, 5).fillTriangle(2, 7, 10, 7, 6, 0);
  g.fillStyle(0xffffff, 0.9).fillCircle(4.5, 7, 1.6);
  g.generateTexture(DROP, 12, 14);
  g.destroy();
}

/** A burst of drops thrown from the sprinkler's head in a turning fan, falling back in arcs. */
export function sprayBurst(scene: Phaser.Scene, x: number, y: number, turn: number) {
  ensureDrop(scene);
  const s = GARDEN_VIEW.spray;
  for (let k = 0; k < s.drops; k += 1) {
    const side = k % 2 === 0 ? -1 : 1;
    const reach = Phaser.Math.Between(s.reach[0], s.reach[1]) * side * (0.6 + 0.4 * Math.abs(Math.sin(turn + k)));
    const d = scene.add.image(x, y, DROP).setDepth(GARDEN_VIEW.depth.fx).setScale(Phaser.Math.FloatBetween(0.55, 0.85)).setAlpha(0.95);
    scene.tweens.add({ targets: d, x: x + reach, duration: 760, delay: k * 40, ease: 'Linear' });
    scene.tweens.add({
      targets: d,
      y: y - Phaser.Math.Between(26, 52),
      duration: 300,
      delay: k * 40,
      ease: 'Quad.easeOut',
      onComplete: () => scene.tweens.add({ targets: d, y: y + Phaser.Math.Between(50, 90), alpha: 0, duration: 460, ease: 'Quad.easeIn', onComplete: () => d.destroy() }),
    });
  }
}

/** A light mist of drops settles on a plot the sprinkler waters. */
export function mist(scene: Phaser.Scene, x: number, y: number) {
  ensureDrop(scene);
  for (let k = 0; k < 5; k += 1) {
    const d = scene.add
      .image(x + Phaser.Math.Between(-36, 36), y - Phaser.Math.Between(40, 70), DROP)
      .setDepth(GARDEN_VIEW.depth.fx)
      .setScale(0.45)
      .setAlpha(0);
    scene.tweens.add({ targets: d, y: d.y + Phaser.Math.Between(34, 50), alpha: { from: 0.85, to: 0 }, duration: 620, delay: k * 70, ease: 'Quad.easeIn', onComplete: () => d.destroy() });
  }
}

/** The name bubble over a hovered building. */
export class NameTip {
  private readonly box: Phaser.GameObjects.Graphics;
  private readonly text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    const t = GARDEN_VIEW.tip;
    this.box = scene.add.graphics().setDepth(GARDEN_VIEW.depth.badge - 2).setVisible(false);
    this.text = scene.add
      .text(0, 0, '', { fontFamily: GARDEN_VIEW.label.fontFamily, fontSize: `${t.fontPx}px`, fontStyle: 'bold', color: t.color })
      .setOrigin(0.5)
      .setDepth(GARDEN_VIEW.depth.badge - 1)
      .setVisible(false);
  }

  /** Shows `name` centred over (x, top). */
  show(name: string, x: number, top: number) {
    const t = GARDEN_VIEW.tip;
    this.text.setText(name).setPosition(x, top - t.gap - t.fontPx / 2 - t.padY).setVisible(true);
    const w = this.text.width + t.padX * 2;
    const h = this.text.height + t.padY * 2;
    this.box
      .clear()
      .fillStyle(t.border, 1)
      .fillRoundedRect(x - w / 2 - 2, this.text.y - h / 2 - 2, w + 4, h + 4, (h + 4) / 2)
      .fillStyle(t.background, 1)
      .fillRoundedRect(x - w / 2, this.text.y - h / 2, w, h, h / 2)
      .setVisible(true);
  }

  hide() {
    this.text.setVisible(false);
    this.box.setVisible(false);
  }
}
