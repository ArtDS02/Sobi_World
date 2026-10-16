// Decorative garden life (GĐ14, decision 029): a hen and a duck stroll along the dirt path around the field, stop to
// peck now and then, and turn to face where they go. Presentation only (no gameplay, no save); still when motion is
// reduced. Uses the Farm's animal sprites.
import * as Phaser from 'phaser';
import { FALLBACK_PROP_KEY, textureKey } from '../../../ui/world/keys';
import { GARDEN_VIEW } from './gardenView';

type Point = { x: number; y: number };

interface Critter {
  img: Phaser.GameObjects.Image;
  faceRight: boolean;
  speed: number;
  /** Where on the loop it is (0..1). */
  at: number;
}

/** A point `t` (0..1) of the way round the closed path. */
function along(path: readonly Point[], t: number): Point {
  const legs = path.map((p, i) => [p, path[(i + 1) % path.length]!] as const);
  const lengths = legs.map(([a, b]) => Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y));
  let d = (((t % 1) + 1) % 1) * lengths.reduce((s, n) => s + n, 0);
  for (let i = 0; i < legs.length; i += 1) {
    if (d <= lengths[i]!) {
      const [a, b] = legs[i]!;
      const k = lengths[i]! === 0 ? 0 : d / lengths[i]!;
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
    d -= lengths[i]!;
  }
  return path[0]!;
}

export class GardenLife {
  private readonly critters: Critter[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly reduceMotion: () => boolean,
  ) {
    const v = GARDEN_VIEW.life;
    v.critters.forEach((c, k) => {
      const at = c.start;
      const p = along(v.path, at);
      const key = scene.textures.exists(textureKey(c.art)) ? textureKey(c.art) : FALLBACK_PROP_KEY;
      const img = scene.add.image(p.x, p.y, key).setOrigin(0.5, 1);
      img.setScale(c.height / (img.height || c.height));
      this.critters.push({ img, faceRight: c.faceRight, speed: c.speed, at });
      this.place(this.critters[k]!);
      scene.time.delayedCall(Phaser.Math.Between(400, 2400), () => this.next(this.critters[k]!));
    });
  }

  /** Behind the field on the top path, in front of it elsewhere. */
  private place(c: Critter) {
    const v = GARDEN_VIEW;
    c.img.setDepth(c.img.y < v.life.behindBelowY ? v.depth.plot - 1 : v.depth.building + c.img.y * 0.01);
  }

  /** Walk a stretch of the path (either way), then peck or rest, then go on. */
  private next(c: Critter) {
    const v = GARDEN_VIEW.life;
    if (this.reduceMotion() || !this.scene.sys.isActive()) return void this.scene.time.delayedCall(2000, () => this.next(c));
    const step = Phaser.Math.FloatBetween(v.stretch[0], v.stretch[1]) * (Math.random() < 0.7 ? 1 : -1);
    const target = c.at + step;
    const from = along(v.path, c.at);
    const to = along(v.path, target);
    const ms = (Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y) / c.speed) * 1000 + 400;
    const state = { t: c.at };
    this.scene.tweens.add({
      targets: state,
      t: target,
      duration: ms,
      ease: 'Linear',
      onUpdate: () => {
        const prev = { x: c.img.x, y: c.img.y };
        const p = along(v.path, state.t);
        c.img.setPosition(p.x, p.y + Math.abs(Math.sin(state.t * 400)) * -2);
        if (Math.abs(p.x - prev.x) > 0.2) c.img.setFlipX(p.x > prev.x !== c.faceRight);
        this.place(c);
      },
      onComplete: () => {
        c.at = ((target % 1) + 1) % 1;
        if (Math.random() < v.peckChance) this.scene.tweens.add({ targets: c.img, angle: c.img.flipX ? 14 : -14, duration: 160, yoyo: true, repeat: 2 });
        this.scene.time.delayedCall(Phaser.Math.Between(v.restMs[0], v.restMs[1]), () => this.next(c));
      },
    });
  }
}
