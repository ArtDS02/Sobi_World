// A soft contact shadow under a plot bed (owner review 2026-11-16): the beds sit on the backdrop instead of looking pasted
// on it. One generated texture (a white ellipse fading out at its rim, tinted per Area), no art file, works without WebGL.
import * as Phaser from 'phaser';

export const PLOT_SHADOW_KEY = 'fx_plot_shadow';
const W = 128;
const H = 64;

/** How an Area draws the shadow. Sizes and the offset are in plot-art px (the bed's canvas) and scale with the bed. */
export interface PlotShadowLook {
  color: number;
  alpha: number;
  width: number;
  height: number;
  /** Below the bed's centre: the shadow sits under the bed's foot, peeking out a little in front. */
  dy: number;
}

export function ensurePlotShadow(scene: Phaser.Scene) {
  if (scene.textures.exists(PLOT_SHADOW_KEY)) return;
  const tex = scene.textures.createCanvas(PLOT_SHADOW_KEY, W, H);
  if (!tex) return;
  const c = tex.getContext();
  c.save();
  c.translate(W / 2, H / 2);
  c.scale(1, H / W);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, W / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(0, 0, W / 2, 0, Math.PI * 2);
  c.fill();
  c.restore();
  tex.refresh();
}

/** The shadow of a bed centred on (x, y) drawn at `scale`. The caller adds it to its container below the bed. */
export function makePlotShadow(scene: Phaser.Scene, x: number, y: number, scale: number, look: PlotShadowLook): Phaser.GameObjects.Image {
  ensurePlotShadow(scene);
  return scene.add
    .image(x, y + look.dy * scale, PLOT_SHADOW_KEY)
    .setDisplaySize(look.width * scale, look.height * scale)
    .setTint(look.color)
    .setAlpha(look.alpha);
}
