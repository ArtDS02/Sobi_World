// The fertiliser drone (GĐ14, decision 028), shared by the Garden and the Cloud: when plots get fertiliser, a little drone
// flies from its start over each of them, hovers, drops a puff of fertiliser, and leaves. Presentation only: the plots are
// already fertilised in the save; `onVisit` lets the scene show each plot's new look as the drone reaches it.
// Until the drone has painted art, a small one is drawn in code (`droneKey`).
import * as Phaser from 'phaser';
import { textureKey } from './keys';

type Point = { x: number; y: number };

export interface DroneFlight {
  /** Asset id of the drone's art (prop_drone_*); the code drone stands in while it is missing. */
  art: string;
  from: Point;
  /** Plot centres, in visiting order. */
  stops: readonly Point[];
  exit: Point;
  /** How high over a plot it hovers, its speed (design px per second), the drop time, its drawn width. */
  hoverY: number;
  speed: number;
  dropMs: number;
  size: number;
  depth: number;
  /** Colours of the fertiliser puff. */
  puff?: readonly number[];
  onVisit: (k: number) => void;
  done: () => void;
}

const CODE_DRONE = 'fx_drone_code';
const PUFF = 'fx_drone_puff';

/** The drone's texture: its art when loaded, else the code drone. */
export function droneKey(scene: Phaser.Scene, art: string): string {
  if (scene.textures.exists(textureKey(art))) return textureKey(art);
  if (!scene.textures.exists(CODE_DRONE)) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    // Two rotor arms with spinning-disc rotors, a round cream body with a window, a little sack hanging under it.
    g.fillStyle(0x6b4423, 1).fillRect(14, 22, 100, 6);
    g.fillStyle(0xcfe9f7, 0.85).fillEllipse(20, 16, 34, 9).fillEllipse(108, 16, 34, 9);
    g.lineStyle(3, 0x6b4423, 1).strokeEllipse(20, 16, 34, 9).strokeEllipse(108, 16, 34, 9);
    g.fillStyle(0x6b4423, 1).fillRect(18, 16, 4, 10).fillRect(106, 16, 4, 10);
    g.fillStyle(0xfff3dc, 1).fillEllipse(64, 40, 64, 40);
    g.lineStyle(3, 0x6b4423, 1).strokeEllipse(64, 40, 64, 40);
    g.fillStyle(0x8fd3f4, 1).fillEllipse(64, 36, 30, 16);
    g.lineStyle(2, 0x6b4423, 1).strokeEllipse(64, 36, 30, 16);
    g.fillStyle(0xb98a55, 1).fillRoundedRect(54, 58, 20, 18, 5);
    g.lineStyle(2, 0x6b4423, 1).strokeRoundedRect(54, 58, 20, 18, 5);
    g.fillStyle(0x7cc46a, 1).fillCircle(64, 58, 4);
    g.generateTexture(CODE_DRONE, 128, 80);
    g.destroy();
  }
  return CODE_DRONE;
}

function ensurePuff(scene: Phaser.Scene) {
  if (scene.textures.exists(PUFF)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffffff, 1).fillCircle(5, 5, 5);
  g.generateTexture(PUFF, 10, 10);
  g.destroy();
}

/** A few fertiliser specks fall from (x, y) onto the plot at `groundY`. */
function puff(scene: Phaser.Scene, x: number, y: number, groundY: number, depth: number, colours: readonly number[]) {
  ensurePuff(scene);
  for (let k = 0; k < 9; k += 1) {
    const dot = scene.add
      .image(x + Phaser.Math.Between(-10, 10), y, PUFF)
      .setDepth(depth - 1)
      .setScale(Phaser.Math.FloatBetween(0.35, 0.7))
      .setTint(colours[k % colours.length]!);
    scene.tweens.add({
      targets: dot,
      x: dot.x + Phaser.Math.Between(-26, 26),
      y: groundY + Phaser.Math.Between(-8, 6),
      alpha: 0.2,
      duration: Phaser.Math.Between(360, 520),
      delay: k * 18,
      ease: 'Quad.easeIn',
      onComplete: () => dot.destroy(),
    });
  }
}

/** Flies one drone over `stops`; returns a stop function (the drone leaves at once, every stop counts as visited). */
export function flyDrone(scene: Phaser.Scene, f: DroneFlight): () => void {
  const img = scene.add.image(f.from.x, f.from.y, droneKey(scene, f.art)).setDepth(f.depth);
  img.setScale(f.size / (img.width || f.size));
  const colours = f.puff ?? [0x7a5230, 0x9b6b3d, 0x7cc46a];
  const wobble = scene.tweens.add({ targets: img, angle: { from: -3, to: 3 }, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  let k = 0;
  let stopped = false;
  const travel = (to: Point) => Math.max(180, (Phaser.Math.Distance.Between(img.x, img.y, to.x, to.y) / f.speed) * 1000);
  let ended = false;
  const finish = () => {
    if (ended) return;
    ended = true;
    stopped = true;
    wobble.remove();
    img.destroy();
    f.done();
  };
  const leave = () => scene.tweens.add({ targets: img, x: f.exit.x, y: f.exit.y, duration: travel(f.exit), ease: 'Sine.easeIn', onComplete: finish });
  const next = () => {
    if (stopped) return;
    if (k >= f.stops.length) return void leave();
    const stop = f.stops[k]!;
    const at = { x: stop.x, y: stop.y - f.hoverY };
    scene.tweens.add({
      targets: img,
      x: at.x,
      y: at.y,
      duration: travel(at),
      ease: 'Sine.easeInOut',
      onComplete: () => {
        puff(scene, at.x, at.y + img.displayHeight * 0.35, stop.y, f.depth, colours);
        f.onVisit(k);
        k += 1;
        scene.time.delayedCall(f.dropMs, next);
      },
    });
  };
  next();
  return () => {
    if (ended) return;
    stopped = true;
    for (; k < f.stops.length; k += 1) f.onVisit(k);
    scene.tweens.killTweensOf(img);
    finish();
  };
}
