// Small farm icons of the loading screen (DECISIONS AM-2), drawn with shapes centred on (0, 0) at
// size ~1 = 40 px: carrot, corn, tomato, cabbage, leaf, flower, sparkle, butterfly wing. Shared by the
// scenery (crop beds), the progress bar ornaments and the swirl particles.
import type * as Phaser from 'phaser';
import { LOADING_SCREEN } from '../../../../core/config/loadingScreen';

type G = Phaser.GameObjects.Graphics;
const C = LOADING_SCREEN.icons;

export function carrot(g: G, x: number, y: number, s = 1, angle = 0.5) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const p = (dx: number, dy: number) => [x + (dx * cos - dy * sin) * s, y + (dx * sin + dy * cos) * s] as const;
  g.fillStyle(C.carrotDark, 1).fillTriangle(...p(-9, -8), ...p(9, -8), ...p(1, 22));
  g.fillStyle(C.carrot, 1).fillTriangle(...p(-8, -9), ...p(8, -9), ...p(0, 20));
  g.lineStyle(1.5 * s, C.carrotDark, 1).lineBetween(...p(-4, 0), ...p(1, 0)).lineBetween(...p(-2, 8), ...p(2, 8));
  g.fillStyle(C.leaf, 1).fillEllipse(...p(-4, -15), 5 * s, 13 * s).fillEllipse(...p(4, -15), 5 * s, 13 * s).fillEllipse(...p(0, -17), 5 * s, 15 * s);
}

export function corn(g: G, x: number, y: number, s = 1) {
  g.fillStyle(C.leafDark, 1).fillTriangle(x - 12 * s, y + 18 * s, x - 2 * s, y + 18 * s, x - 9 * s, y - 6 * s);
  g.fillStyle(C.leaf, 1).fillTriangle(x + 12 * s, y + 18 * s, x + 2 * s, y + 18 * s, x + 9 * s, y - 4 * s);
  g.fillStyle(C.cornDark, 1).fillEllipse(x, y, 13 * s, 30 * s);
  g.fillStyle(C.corn, 1).fillEllipse(x - 1 * s, y - 1 * s, 10 * s, 27 * s);
  g.fillStyle(C.cornDark, 0.5);
  for (let i = -2; i <= 2; i++) g.fillCircle(x - 1 * s, y + i * 5 * s, 1.4 * s);
}

export function tomato(g: G, x: number, y: number, s = 1) {
  g.fillStyle(C.tomatoDark, 1).fillCircle(x, y + 1 * s, 11 * s);
  g.fillStyle(C.tomato, 1).fillCircle(x - 1 * s, y, 10 * s);
  g.fillStyle(0xffffff, 0.45).fillEllipse(x - 4 * s, y - 4 * s, 5 * s, 3 * s);
  g.fillStyle(C.leaf, 1).fillTriangle(x - 6 * s, y - 9 * s, x + 6 * s, y - 9 * s, x, y - 13 * s);
}

export function cabbage(g: G, x: number, y: number, s = 1) {
  g.fillStyle(C.leafDark, 1).fillCircle(x, y + 2 * s, 15 * s);
  g.fillStyle(C.leaf, 1).fillCircle(x - 6 * s, y - 2 * s, 10 * s).fillCircle(x + 6 * s, y - 2 * s, 10 * s).fillCircle(x, y + 5 * s, 9 * s);
  g.fillStyle(C.leafLight, 1).fillCircle(x, y - 3 * s, 6 * s);
}

export function leaf(g: G, x: number, y: number, s = 1, color: number = C.leaf) {
  g.fillStyle(color, 1).fillEllipse(x, y, 20 * s, 9 * s);
  g.lineStyle(1.2 * s, C.leafDark, 0.8).lineBetween(x - 9 * s, y, x + 9 * s, y);
}

export function flower(g: G, x: number, y: number, s = 1, color: number = C.flower) {
  g.fillStyle(color, 1);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.fillCircle(x + Math.cos(a) * 5 * s, y + Math.sin(a) * 5 * s, 4 * s);
  }
  g.fillStyle(C.flowerCenter, 1).fillCircle(x, y, 3.2 * s);
}

/** Four-point star. */
export function sparkle(g: G, x: number, y: number, s = 1, color: number = C.sparkle) {
  g.fillStyle(color, 1)
    .fillTriangle(x - 3 * s, y, x + 3 * s, y, x, y - 12 * s)
    .fillTriangle(x - 3 * s, y, x + 3 * s, y, x, y + 12 * s)
    .fillTriangle(x, y - 3 * s, x, y + 3 * s, x - 12 * s, y)
    .fillTriangle(x, y - 3 * s, x, y + 3 * s, x + 12 * s, y);
  g.fillStyle(0xffffff, 0.9).fillCircle(x, y, 2.2 * s);
}

/** One butterfly wing pair (the container flaps it by scaleX). */
export function butterfly(g: G, color: number, edge: number) {
  for (const side of [-1, 1]) {
    g.fillStyle(edge, 1).fillEllipse(side * 9, -5, 18, 16).fillEllipse(side * 7, 7, 12, 11);
    g.fillStyle(color, 1).fillEllipse(side * 9, -5, 14, 12).fillEllipse(side * 7, 7, 8, 8);
  }
  g.fillStyle(edge, 1).fillEllipse(0, 1, 4, 18);
}
