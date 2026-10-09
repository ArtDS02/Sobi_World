// Living things of the plaza: butterflies over the garden and the idle moves of the animals. Butterflies
// wander with a heading that turns smoothly (never a straight line, never out of their patch); animals are
// looping tweens with their own random pauses. Decoration only: no gameplay.
import * as Phaser from 'phaser';
import type { Rect } from '../../../systems/character';
import { textureKey } from '../../../ui/world/keys';
import { PLAZA_AMBIENT } from './ambientConfig';

interface Butterfly {
  img: Phaser.GameObjects.Image;
  heading: number;
  turnTo: number;
  changeIn: number;
  speed: number;
  phase: number;
  baseScale: number;
}

export class Butterflies {
  private readonly list: Butterfly[] = [];
  private readonly area: Rect;

  /** `patch` = the art they flutter over (the garden); `random` gives 0..1. */
  constructor(scene: Phaser.Scene, patch: Rect, depth: number, random: () => number) {
    const b = PLAZA_AMBIENT.butterflies;
    this.area = { x: patch.x - b.marginPx, y: patch.y - b.marginPx, width: patch.width + b.marginPx * 2, height: patch.height + b.marginPx * 2 };
    for (let i = 0; i < b.count; i++) {
      const key = textureKey(b.ids[i % b.ids.length]!);
      if (!scene.textures.exists(key)) continue;
      const img = scene.add
        .image(this.area.x + random() * this.area.width, this.area.y + random() * this.area.height, key)
        .setDepth(depth);
      const baseScale = b.width / img.width;
      img.setScale(baseScale);
      const heading = random() * Math.PI * 2;
      this.list.push({
        img,
        heading,
        turnTo: heading,
        changeIn: 0,
        speed: b.speed[0] + random() * (b.speed[1] - b.speed[0]),
        phase: random() * Math.PI * 2,
        baseScale,
      });
    }
  }

  update(dtMs: number, random: () => number) {
    const b = PLAZA_AMBIENT.butterflies;
    const dt = dtMs / 1000;
    for (const f of this.list) {
      f.changeIn -= dtMs;
      if (f.changeIn <= 0) {
        f.changeIn = b.headingMs[0] + random() * (b.headingMs[1] - b.headingMs[0]);
        f.turnTo = f.heading + (random() - 0.5) * Math.PI * 1.1;
        f.speed = b.speed[0] + random() * (b.speed[1] - b.speed[0]);
      }
      // Steer back towards the patch's middle when near its edge.
      const { x, y } = f.img;
      const a = this.area;
      const margin = 30;
      if (x < a.x + margin || x > a.x + a.width - margin || y < a.y + margin || y > a.y + a.height - margin) {
        f.turnTo = Math.atan2(a.y + a.height / 2 - y, a.x + a.width / 2 - x);
      }
      let diff = Phaser.Math.Angle.Wrap(f.turnTo - f.heading);
      diff = Phaser.Math.Clamp(diff, -b.turnRate * dt, b.turnRate * dt);
      f.heading += diff;
      // A lazy rise and fall of the speed gives the fluttering rhythm.
      const pace = f.speed * (0.65 + 0.35 * Math.sin(f.phase * 0.7));
      f.img.x += Math.cos(f.heading) * pace * dt;
      f.img.y += Math.sin(f.heading) * pace * dt + Math.sin(f.phase) * 12 * dt;
      f.phase += b.flapHz * dt;
      f.img.setScale(f.baseScale * (0.55 + 0.45 * Math.abs(Math.cos(f.phase))), f.baseScale);
      f.img.setFlipX(Math.cos(f.heading) < 0);
    }
  }

  setVisible(visible: boolean) {
    for (const f of this.list) f.img.setVisible(visible);
  }

  destroy() {
    for (const f of this.list) f.img.destroy();
    this.list.length = 0;
  }
}

export type IdleMove = 'breathe' | 'peck' | 'hop' | 'sway';

/** Starts the idle move of one animal image (origin at its feet). Returns the tween so the scene can stop it. */
export function idleAnimal(scene: Phaser.Scene, img: Phaser.GameObjects.Image, move: IdleMove, random: () => number): Phaser.Tweens.Tween {
  const a = PLAZA_AMBIENT.animals;
  const start = random() * 1600;
  const sx = img.scaleX;
  const sy = img.scaleY;
  switch (move) {
    case 'breathe':
      return scene.tweens.add({ targets: img, scaleY: sy * (1 + a.breathe.scale), scaleX: sx * (1 - a.breathe.scale / 2), duration: a.breathe.ms, delay: start, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    case 'peck':
      return scene.tweens.add({ targets: img, angle: (img.flipX ? -1 : 1) * Phaser.Math.RadToDeg(a.peck.angle), duration: a.peck.ms / 2, delay: start, yoyo: true, repeat: -1, repeatDelay: a.peck.everyMs[0] + random() * (a.peck.everyMs[1] - a.peck.everyMs[0]), ease: 'Quad.easeIn' });
    case 'hop':
      return scene.tweens.add({ targets: img, y: img.y - a.hop.height, duration: a.hop.ms, delay: start, yoyo: true, repeat: -1, repeatDelay: a.hop.everyMs[0] + random() * (a.hop.everyMs[1] - a.hop.everyMs[0]), ease: 'Quad.easeOut' });
    case 'sway':
      return scene.tweens.add({ targets: img, angle: { from: -Phaser.Math.RadToDeg(a.sway.angle), to: Phaser.Math.RadToDeg(a.sway.angle) }, duration: a.sway.ms, delay: start, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
