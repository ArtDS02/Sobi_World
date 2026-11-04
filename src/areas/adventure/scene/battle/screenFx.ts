// The screen effects of the battle stage in one place (ANIM-004): hit stop by tier, slow motion, a shake along a direction that dies
// away, the cinematic bars and a coloured vignette. Scripts reach them through the acts `stop` / `shake` / `slowmo` / `letterbox` /
// `vignette` (fxActs.ts). Everything runs on the page clock (performance.now) so slow motion never slows itself; `reset()` clears it
// all when the battle ends, the step changes or reduced motion turns on. Presentation only.
import * as Phaser from 'phaser';
import type { HIT_STOP_TIERS } from '../../../../../content/schemas/adventure/battleScript';
import { AIR_DEPTH } from './fxBursts';
import { VIGNETTE_KEY } from './fxTextures';

export type HitStopTier = (typeof HIT_STOP_TIERS)[number];

/** How long each tier of hit stop holds the stage (ms). Tune the feel here. */
export const HIT_STOP_MS: Readonly<Record<HitStopTier, number>> = { light: 50, medium: 80, heavy: 120, ultimate: 220 };
/** The cinematic bars: their height as a share of the screen. */
export const LETTERBOX_SHARE = 0.11;
const CINEMATIC_DEPTH = AIR_DEPTH + 30;

const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

interface Shake {
  start: number;
  ms: number;
  amount: number;
  dx: number;
  dy: number;
}

export class ScreenFx {
  private shakes: Shake[] = [];
  private shaken = { x: 0, y: 0 };
  private slow: { start: number; ms: number; scale: number } | null = null;
  private bars: { from: number; to: number; start: number; ms: number; cur: number };
  private top: Phaser.GameObjects.Rectangle;
  private bottom: Phaser.GameObjects.Rectangle;
  private vig: Phaser.GameObjects.Image;
  private vigState: { start: number; ms: number; alpha: number } | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly hold: (ms: number) => void,
  ) {
    this.bars = { from: 0, to: 0, start: 0, ms: 1, cur: 0 };
    this.top = scene.add.rectangle(0, 0, 10, 0, 0x000000, 1).setOrigin(0, 0).setDepth(CINEMATIC_DEPTH).setVisible(false);
    this.bottom = scene.add.rectangle(0, 0, 10, 0, 0x000000, 1).setOrigin(0, 1).setDepth(CINEMATIC_DEPTH).setVisible(false);
    this.vig = scene.add.image(0, 0, VIGNETTE_KEY).setOrigin(0).setDepth(CINEMATIC_DEPTH - 1).setAlpha(0).setVisible(false);
  }

  /** Holds the stage still: a tier (50 / 80 / 120 / 220 ms) or a number of ms. */
  hitStop(tier: HitStopTier | number) {
    this.hold(typeof tier === 'number' ? tier : HIT_STOP_MS[tier]);
  }

  /** The stage runs at `scale` of its speed, easing back to normal over `ms`. */
  slowMo(scale: number, ms: number, now = performance.now()) {
    this.slow = { start: now, ms: Math.max(1, ms), scale: Math.min(1, Math.max(0.1, scale)) };
  }

  /** A shake of `amount` px along `dir` (a unit vector; default: sideways) that dies away exponentially over `ms`. */
  shake(amount: number, ms: number, dir: readonly [number, number] = [1, 0.4], now = performance.now()) {
    const len = Math.hypot(dir[0], dir[1]) || 1;
    this.shakes.push({ start: now, ms: Math.max(1, ms), amount, dx: dir[0] / len, dy: dir[1] / len });
  }

  /** Two black bars close in (on) or open (off) over `ms`. */
  letterbox(on: boolean, ms: number, now = performance.now()) {
    this.bars = { from: this.bars.cur, to: on ? 1 : 0, start: now, ms: Math.max(1, ms), cur: this.bars.cur };
  }

  /** The screen edges darken in `color` and fade out over `ms`. */
  vignette(color: number, alpha: number, ms: number, now = performance.now()) {
    this.vig.setTint(color);
    this.vigState = { start: now, ms: Math.max(1, ms), alpha };
  }

  /** The speed of the stage now (1 = normal); the scene scales its effects' time by it. */
  timeScale(now: number): number {
    if (!this.slow) return 1;
    const k = clamp01((now - this.slow.start) / this.slow.ms);
    if (k >= 1) {
      this.slow = null;
      return 1;
    }
    return this.slow.scale + (1 - this.slow.scale) * easeOut(k);
  }

  /** Draws the effects at `now` (call once a frame, after the acts have moved the camera). */
  update(now: number) {
    const cam = this.scene.cameras.main;
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    // The shake is an offset added to the scroll and taken off again next frame, so it never fights the camera punch.
    let x = 0;
    let y = 0;
    this.shakes = this.shakes.filter((s) => now - s.start < s.ms);
    for (const s of this.shakes) {
      const k = (now - s.start) / s.ms;
      const power = s.amount * Math.exp(-5 * k) * Math.cos(((now - s.start) / 1000) * 70);
      x += s.dx * power;
      y += s.dy * power;
    }
    cam.scrollX += x - this.shaken.x;
    cam.scrollY += y - this.shaken.y;
    this.shaken = { x, y };
    const b = this.bars;
    b.cur = b.from + (b.to - b.from) * easeOut(clamp01((now - b.start) / b.ms));
    const h = H * LETTERBOX_SHARE * b.cur;
    this.top.setVisible(h > 0.5).setSize(W, h);
    this.bottom.setVisible(h > 0.5).setPosition(0, H).setSize(W, h);
    if (this.vigState) {
      const k = clamp01((now - this.vigState.start) / this.vigState.ms);
      this.vig.setVisible(k < 1).setDisplaySize(W, H).setAlpha(this.vigState.alpha * (1 - k));
      if (k >= 1) this.vigState = null;
    }
  }

  /** Back to a plain screen: the battle ended, the step changed, or reduced motion turned on. */
  reset() {
    const cam = this.scene.cameras.main;
    cam.scrollX -= this.shaken.x;
    cam.scrollY -= this.shaken.y;
    this.shaken = { x: 0, y: 0 };
    this.shakes = [];
    this.slow = null;
    this.bars = { from: 0, to: 0, start: 0, ms: 1, cur: 0 };
    this.top.setVisible(false);
    this.bottom.setVisible(false);
    this.vigState = null;
    this.vig.setVisible(false).setAlpha(0);
  }
}
