// The medicine shot every Area scene plays on a creature it cures (treat / treat all): a syringe pops in up-right of
// the creature, pokes it once, holds, then pulls back and fades. The picture is the manifest's `fx_syringe` when
// painted (drawn level, needle to the left), else a small syringe drawn here stands in. Presentation only.
import type * as Phaser from 'phaser';
import { textureKey } from './keys';

export const SYRINGE_ART = 'fx_syringe';
const STAND_IN = 'code_fx_syringe';

/** Timings (ms), sizes (design px) and the tilt of the shot. */
export const SYRINGE = {
  px: 72,
  /** How far up-right of the target it appears, and how deep it pokes in. */
  offsetPx: 30,
  pokePx: 22,
  /** Tilt in degrees: the needle points down-left at the target. */
  angle: -35,
  inMs: 160,
  pokeMs: 140,
  holdMs: 260,
  outMs: 220,
} as const;

/** When the shot is over, from its start: what plays after it (the happy hop, the sparkles) waits this long. */
export const SYRINGE_MS = SYRINGE.inMs + SYRINGE.pokeMs + SYRINGE.holdMs;

/** The stand-in: a pale barrel of green medicine (as on ui_btn_heal), a red band, the plunger right, the needle left. */
function ensureStandIn(scene: Phaser.Scene) {
  if (scene.textures.exists(STAND_IN)) return;
  const tex = scene.textures.createCanvas(STAND_IN, 128, 48)!;
  const c = tex.getContext();
  c.lineJoin = 'round';
  c.lineWidth = 3;
  c.strokeStyle = '#6b4226';
  // Needle and hub.
  c.fillStyle = '#d9dde3';
  c.fillRect(4, 22, 26, 4);
  c.strokeRect(4, 22, 26, 4);
  c.fillStyle = '#9fd3f0';
  c.fillRect(28, 17, 8, 14);
  c.strokeRect(28, 17, 8, 14);
  // Barrel with the medicine inside.
  c.fillStyle = '#f4fbff';
  c.fillRect(36, 12, 58, 24);
  c.fillStyle = '#8fd16a';
  c.fillRect(38, 20, 34, 14);
  c.fillStyle = '#e8615a';
  c.fillRect(52, 12, 8, 24);
  c.strokeRect(36, 12, 58, 24);
  // Plunger and its thumb rest.
  c.fillStyle = '#f2c46d';
  c.fillRect(94, 20, 18, 8);
  c.strokeRect(94, 20, 18, 8);
  c.fillRect(112, 10, 8, 28);
  c.strokeRect(112, 10, 8, 28);
  tex.refresh();
}

export interface SyringeShot {
  /** Where the needle goes in (design px); read again every frame when `follow` is given. */
  at: { x: number; y: number };
  /** The creature moves (a swimming fish): the shot keeps up with it; null once it is gone. */
  follow?: () => { x: number; y: number } | null;
  delayMs?: number;
  depth: number;
  /** Size in design px (the scene's creature scale). */
  px?: number;
}

/** Plays one shot; returns when it is over (ms from now) so the caller can chain the cure's joy after it. */
export function playSyringe(scene: Phaser.Scene, shot: SyringeShot): number {
  ensureStandIn(scene);
  const S = SYRINGE;
  const key = scene.textures.exists(textureKey(SYRINGE_ART)) ? textureKey(SYRINGE_ART) : STAND_IN;
  const rad = (S.angle * Math.PI) / 180;
  // Unit vector from the target out to where the syringe waits (up-right, opposite the needle).
  const out = { x: Math.cos(rad), y: Math.sin(rad) };
  const img = scene.add.image(0, 0, key).setDepth(shot.depth).setAngle(S.angle).setOrigin(0, 0.5).setAlpha(0);
  const scale = (shot.px ?? S.px) / Math.max(img.width, 1);
  img.setScale(0);
  const state = { dist: S.offsetPx, grow: 0 };
  const place = () => {
    const at = shot.follow?.() ?? shot.at;
    img.setPosition(at.x + out.x * state.dist, at.y + out.y * state.dist);
    img.setScale(scale * state.grow);
  };
  place();
  const delay = shot.delayMs ?? 0;
  scene.tweens.chain({
    targets: state,
    delay,
    tweens: [
      { grow: 1, duration: S.inMs, ease: 'Back.easeOut', onStart: () => img.setAlpha(1), onUpdate: place },
      { dist: S.offsetPx - S.pokePx, duration: S.pokeMs, ease: 'Quad.easeIn', onUpdate: place },
      { dist: S.offsetPx - S.pokePx, duration: S.holdMs, onUpdate: place },
      { dist: S.offsetPx + S.pokePx, duration: S.outMs, ease: 'Quad.easeOut', onStart: () => scene.tweens.add({ targets: img, alpha: 0, duration: S.outMs }), onUpdate: place },
    ],
    onComplete: () => img.destroy(),
  });
  return delay + SYRINGE_MS;
}
