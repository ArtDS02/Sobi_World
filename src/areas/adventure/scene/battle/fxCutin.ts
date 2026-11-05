// An Ultimate's opening (ANIM-009, ANIM-112): a coloured sweep in one of four styles, the user's picture sliding in, the skill's name
// written in the band, the rest darkened. Each style moves differently so the twelve Ultimates do not open the same way: `slash` a slanted
// band across, `bars` two bands from opposite sides, `rise` a column climbing from the ground, `ring` a ring opening out of the user
// (an edge and a faint fill, so the stage stays visible through it).
import * as Phaser from 'phaser';
import type { CUTIN_STYLES } from '../../../../../content/schemas/adventure/battleScript';
import { AIR_DEPTH } from './fxBursts';
import type { FxAnchor, Timed } from './fxPlayer';

export type CutinStyle = (typeof CUTIN_STYLES)[number];
type AddTimed = (dur: number, step: Timed['step'], done?: () => void) => void;

const CUTIN_DEPTH = AIR_DEPTH + 20;
const easeIn = (t: number) => t * t;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const fadeIO = (t: number, inn: number, out: number) => (t < inn ? t / inn : t > 1 - out ? (1 - t) / out : 1);

export function playCutin(scene: Phaser.Scene, add: AddTimed, a: FxAnchor, color: number, dur: number, style: CutinStyle = 'slash', title: string | null = null) {
  const W = scene.scale.width;
  const H = scene.scale.height;
  const made: Phaser.GameObjects.GameObject[] = [];
  const rect = (x: number, y: number, w: number, h: number, c: number, depth: number) => {
    const r = scene.add.rectangle(x, y, w, h, c, 1).setDepth(depth);
    made.push(r);
    return r;
  };
  const shade = rect(W / 2, H / 2, W, H, 0x0e0a1e, CUTIN_DEPTH - 1).setAlpha(0);
  const key = a.picture?.texture.key;
  const face = key ? scene.add.image(0, H * 0.45, key).setDepth(CUTIN_DEPTH + 2) : null;
  if (face) {
    made.push(face);
    const h = H * 0.42;
    face.setDisplaySize(h * (face.width / Math.max(1, face.height)), h).setFlipX(a.side === 'enemy');
  }
  // The skill's name in the Baloo face of the DOM (it is already loaded), white with a dark edge so it reads on any band colour.
  const name = title
    ? scene.add.text(W / 2, H * 0.72, title, { fontFamily: "'Baloo 2', sans-serif", fontSize: `${Math.round(H * 0.085)}px`, fontStyle: 'bold', color: '#ffffff', stroke: '#1a1030', strokeThickness: Math.max(4, Math.round(H * 0.012)), align: 'center', wordWrap: { width: W * 0.8 } }).setOrigin(0.5).setDepth(CUTIN_DEPTH + 3).setAlpha(0)
    : null;
  if (name) made.push(name);
  const dir = a.side === 'ally' ? 1 : -1;
  const place = (t: number, x: number, y: number) => face?.setPosition(x, y + 6 * (1 - easeOut(Math.min(1, t / 0.35))));
  let step: (t: number) => void;
  if (style === 'bars') {
    const top = rect(W / 2, H * 0.3, W * 1.2, H * 0.14, color, CUTIN_DEPTH);
    const low = rect(W / 2, H * 0.62, W * 1.2, H * 0.14, color, CUTIN_DEPTH);
    step = (t) => {
      const inn = easeOut(Math.min(1, t / 0.25));
      const out = t > 0.8 ? easeIn((t - 0.8) / 0.2) : 0;
      top.setX(W / 2 + dir * (-W * (1 - inn) + W * out));
      low.setX(W / 2 - dir * (-W * (1 - inn) + W * out));
      place(t, W / 2 - dir * W * 0.05 + dir * W * out, H * 0.46);
    };
  } else if (style === 'rise') {
    const col = rect(W / 2, H * 1.5, W * 0.34, H * 1.2, color, CUTIN_DEPTH).setAlpha(0.9);
    step = (t) => {
      const inn = easeOut(Math.min(1, t / 0.3));
      const out = t > 0.8 ? easeIn((t - 0.8) / 0.2) : 0;
      col.setY(H * 0.5 + H * (1 - inn) - H * 1.2 * out);
      place(t, W / 2, H * 0.5 + H * (1 - inn) * 0.6 - H * out);
    };
  } else if (style === 'ring') {
    // A bright edge and a faint fill: the stage shows through, the picture and the name stay on top.
    const ring = scene.add.ellipse(a.feet.x, a.chest.y, 10, 10, color, 0.16).setStrokeStyle(Math.max(8, Math.round(H * 0.03)), color, 0.95).setDepth(CUTIN_DEPTH);
    const inner = scene.add.ellipse(W / 2, H * 0.45, 10, 10, color, 0.55).setDepth(CUTIN_DEPTH + 1);
    made.push(ring, inner);
    step = (t) => {
      const inn = easeOut(Math.min(1, t / 0.35));
      const out = t > 0.8 ? (t - 0.8) / 0.2 : 0;
      ring.setSize(W * 1.7 * inn, W * 1.7 * inn).setPosition(a.feet.x, a.chest.y).setAlpha(1 - out);
      inner.setSize(H * 0.95 * inn, H * 0.95 * inn).setAlpha(1 - out);
      place(t, W / 2, H * 0.45);
      face?.setAlpha(1 - out);
    };
  } else {
    const band = rect(W / 2, H * 0.45, W * 1.6, H * 0.26, color, CUTIN_DEPTH).setAngle(-8).setAlpha(0.9);
    const line = rect(W / 2, H * 0.45 - H * 0.13, W * 1.6, 6, 0xffffff, CUTIN_DEPTH + 1).setAngle(-8);
    step = (t) => {
      const inn = easeOut(Math.min(1, t / 0.25));
      const out = t > 0.8 ? easeIn((t - 0.8) / 0.2) : 0;
      const x = W / 2 + dir * (-W * (1 - inn) + W * out);
      band.setX(x);
      line.setX(x + dir * 30);
      place(t, W / 2 - dir * W * 0.22 + dir * (-W * 0.6 * (1 - easeOut(Math.min(1, t / 0.35))) + W * out), H * 0.45);
    };
  }
  add(dur, (t) => {
    shade.setAlpha(0.5 * fadeIO(t, 0.15, 0.2));
    step(t);
    name?.setAlpha(fadeIO(t, 0.3, 0.2)).setY(H * 0.72 + 14 * (1 - easeOut(Math.min(1, t / 0.4))));
  }, () => {
    for (const o of made) o.destroy();
  });
}
