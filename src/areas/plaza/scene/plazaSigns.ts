// The name planks of the plaza's doors (decision 024): the door's name written on the plank art, the area icon beside
// it once that art is in, and a gentle sway about the foot of the post (a bigger bounce when the character comes close).
import * as Phaser from 'phaser';
import { PLAZA_AMBIENT } from './ambientConfig';
import type { AmbientDeps, DrawnPlacement } from './PlazaAmbient';

export interface Sign {
  portal: string;
  box: Phaser.GameObjects.Container;
  sway: Phaser.Tweens.Tween;
}

export function makeSign(scene: Phaser.Scene, d: DrawnPlacement, deps: AmbientDeps, random: () => number): Sign {
  const S = PLAZA_AMBIENT.signs;
  const board = S.boards[d.art] ?? S.boards.prop_signboard!;
  const name = deps.nameOf(d.p.sign!);
  const box = scene.add.container(d.img.x, d.img.y).setDepth(d.img.depth);
  const height = d.img.displayHeight;
  const width = d.img.displayWidth;
  d.img.setPosition(0, 0);
  box.add(d.img);
  box.setSize(width, height);
  const y = -height * (1 - board.centre);
  const icon = board.icon ? deps.iconOf(d.p.sign!) : null;
  let room = width * board.width;
  if (board.icon && icon) {
    const size = width * board.icon.size;
    box.add(scene.add.image(width * board.icon.at, y, icon).setDisplaySize(size, size));
    room -= size * 0.6;
  }
  if (name) {
    const [first, ...rest] = name.split(' ');
    const text = scene.add
      .text(icon ? -width * 0.04 : 0, y, rest.length > 0 ? `${first}\n${rest.join(' ')}` : name, {
        color: S.color,
        fontSize: `${board.fontPx}px`,
        fontFamily: S.fontFamily,
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: -6,
      })
      .setOrigin(0.5);
    const fit = room / Math.max(text.width, 1);
    if (fit < 1) text.setScale(fit);
    box.add(text);
  }
  const sway = scene.tweens.add({
    targets: box,
    angle: { from: -S.swayDeg, to: S.swayDeg },
    duration: S.swayMs,
    delay: random() * S.swayMs,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
  return { portal: d.p.sign!, box, sway };
}
