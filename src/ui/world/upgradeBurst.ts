// Draws the upgrade effect of a cloud tier / garden zone (systems/animation/upgradeFx.ts): rings spreading from the frame of the
// plots, the plots lighting up one after another (a small tinted glow each, never a wash over the field), petals / leaves /
// fireflies in the skin's colour rising and scattering, and a faint sweep of light across the sky. Generated textures and plain
// tweens only, so it works without WebGL; it blocks nothing and removes itself.
import * as Phaser from 'phaser';
import type { AreaVfx } from '../../core/events';
import { effectsWith, PLAIN_COLOURS, type EffectsMode } from '../../systems/animation/rankAtmosphere';
import { parseUpgradeVfx, upgradePlan, type UpgradePlan } from '../../systems/animation/upgradeFx';
import { ensureAtmosphereTextures, PETAL_TEXTURE, RAY_TEXTURE } from './rankAtmosphere';
import type { SceneryTheme } from './rankScenery';
import { SOFT_GLOW } from './softTextures';

const RING = 'fx_upgrade_ring';

export interface UpgradeBurstDeps {
  /** The rectangle around the plots, design px. */
  field: { x: number; y: number; width: number; height: number };
  /** Centres of the plots on screen, in the order they light up. */
  plots: readonly { x: number; y: number }[];
  area: keyof typeof PLAIN_COLOURS;
  /** The skin's mood (null = the plain colours of the Area). */
  theme: SceneryTheme | null;
  plan: UpgradePlan;
}

function ensureRing(scene: Phaser.Scene) {
  if (scene.textures.exists(RING)) return;
  const tex = scene.textures.createCanvas(RING, 256, 256)!;
  const c = tex.getContext();
  c.strokeStyle = 'rgba(255,255,255,0.95)';
  c.lineWidth = 6;
  c.beginPath();
  c.arc(128, 128, 120, 0, Math.PI * 2);
  c.stroke();
  tex.refresh();
}

/** Plays the sequence once on `scene`. Everything it adds is destroyed when its tween ends. */
export function playUpgradeBurst(scene: Phaser.Scene, d: UpgradeBurstDeps) {
  ensureAtmosphereTextures(scene);
  ensureRing(scene);
  const { field: f, plan } = d;
  const plain = PLAIN_COLOURS[d.area];
  const c = d.theme ? { light: d.theme.scenery, petal: d.theme.frame, spark: d.theme.frame } : plain;
  const cx = f.x + f.width / 2;
  const cy = f.y + f.height / 2;
  const T = plan.durationMs;
  const once = (img: Phaser.GameObjects.Image, props: Record<string, unknown>, duration: number, delay = 0, ease = 'Sine.easeOut') =>
    scene.tweens.add({ targets: img, ...props, duration, delay, ease, onComplete: () => img.destroy() });

  // 1. Rings from the frame of the plots (a thin tinted line, flattened like the ground).
  for (let i = 0; i < plan.rings; i += 1) {
    const ring = scene.add.image(cx, cy, RING).setDepth(3300).setTint(c.spark).setAlpha(0.7).setDisplaySize(f.width * 0.5, f.height * 0.5);
    once(ring, { displayWidth: f.width * 1.5, displayHeight: f.height * 1.6, alpha: 0 }, T * 0.55, i * 160);
  }
  // 2. The plots light up in turn: a small glow per plot in the mood's colour.
  d.plots.forEach((p, i) => {
    const glow = scene.add.image(p.x, p.y, SOFT_GLOW).setDepth(3301).setTint(c.light).setAlpha(0).setScale(0.55).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: glow, alpha: plan.plotGlow, scale: 0.9, duration: 180, delay: 120 + i * plan.plotStepMs, yoyo: true, ease: 'Sine.easeInOut', onComplete: () => glow.destroy() });
  });
  // 3. Petals / leaves / fireflies rise from the field and scatter (golden-ratio spread: no clumps, no randomness to seed).
  for (let i = 0; i < plan.particles; i += 1) {
    const u = (i * 0.618034) % 1;
    const v = (i * 0.381966 + 0.13) % 1;
    const firefly = i % 3 === 2;
    const img = scene.add.image(f.x + f.width * u, f.y + f.height * (0.35 + 0.6 * v), firefly ? SOFT_GLOW : PETAL_TEXTURE).setDepth(3302).setTint(firefly ? c.spark : c.petal).setAlpha(0).setScale(firefly ? 0.16 : 0.5);
    if (firefly) img.setBlendMode(Phaser.BlendModes.ADD);
    const rise = 120 + 140 * v;
    scene.tweens.add({ targets: img, alpha: 0.9, duration: 160, delay: 200 + (i % 9) * 40 });
    once(img, { x: img.x + (u - 0.5) * 220, y: img.y - rise, alpha: 0, rotation: (u - 0.5) * 5 }, T - 260, 260 + (i % 9) * 40, 'Quad.easeOut');
  }
  // 4. A faint sweep of light across the SKY only, behind the plots (depth 5 < plots at 10).
  if (plan.skySweep > 0) {
    const sky = Math.max(60, f.y + 10);
    const ray = scene.add.image(f.x - 60, -10, RAY_TEXTURE).setOrigin(0.5, 0).setDepth(5).setTint(c.light).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDisplaySize(plan.bigRay ? 190 : 90, sky).setRotation(-0.12);
    scene.tweens.add({ targets: ray, alpha: plan.bigRay ? plan.skySweep * 1.6 : plan.skySweep, duration: T * 0.25, yoyo: true, hold: T * 0.3 });
    once(ray, { x: f.x + f.width + 60, rotation: 0.12 }, T * 0.85, 0, 'Sine.easeInOut');
  }
}

/** What a scene tells about itself when the FeedbackDirector hands it an effect. */
export interface UpgradeStage {
  area: keyof typeof PLAIN_COLOURS;
  /** The tier / zone on screen (0-based); -1 while it is changing. */
  shown: number;
  field: UpgradeBurstDeps['field'];
  /** Centres of the owned plots on screen. */
  plots: readonly { x: number; y: number }[];
  theme: SceneryTheme | null;
  /** The effects intensity setting and "Giảm chuyển động". */
  mode: EffectsMode;
  still: boolean;
}

/**
 * Plays `vfx` when it is an upgrade effect of this Area for the tier / zone on screen and the settings allow a moving effect.
 * Anything else (another Area's effect, a tier that is not on screen, effects off, reduced motion) plays nothing: the toast and
 * the sound already told. Returns whether it played.
 */
export function playUpgradeVfx(scene: Phaser.Scene, vfx: AreaVfx, s: UpgradeStage): boolean {
  const target = parseUpgradeVfx(vfx);
  if (!target || target.area !== s.area || target.group !== s.shown) return false;
  const plan = upgradePlan(target.rank, effectsWith(s.mode, s.still));
  if (!plan) return false;
  playUpgradeBurst(scene, { field: s.field, plots: s.plots, area: s.area, theme: s.theme, plan });
  return true;
}
