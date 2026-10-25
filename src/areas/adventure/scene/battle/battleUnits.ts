// The fighters on the battle stage (decision 042): each one a picture standing on the feet the DOM laid out for it, looking at the other
// side (mirrored when its art says so), showing its key pose (`cb_<art>_<pose>` in the manifest; the picture itself while it has none),
// moved every frame by its pose (ui/battlePose.ts). Brightness is a copy of the picture added on top, a glow a tinted copy under it,
// both drawn by the GPU — no CSS filter. Pictures still missing are loaded the first time they are asked for.
import * as Phaser from 'phaser';
import type { PoseArt } from '../../../../../content/schemas/adventure/battleFx';
import type { BodyPose } from '../../ui/battlePose';
import { poseArts } from '../../ui/motionProfiles';

/** One fighter as the DOM laid it out (game px). */
export interface StageUnit {
  id: string;
  side: 'ally' | 'enemy';
  art: string;
  mirrored: boolean;
  feet: { x: number; y: number };
  width: number;
  height: number;
  down: boolean;
  aimable: boolean;
}

interface Body {
  art: string;
  main: Phaser.GameObjects.Image;
  light: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
}

const grey = (k: number) => {
  const c = Math.round(255 - k * 120);
  return (c << 16) | (c << 8) | c;
};

export class BattleUnits {
  private bodies = new Map<string, Body>();

  constructor(
    private readonly scene: Phaser.Scene,
    /** Asks for a manifest image the scene does not have yet (it arrives later). */
    private readonly want: (id: string) => void,
  ) {}

  picture(id: string): Phaser.GameObjects.Image | null {
    return this.bodies.get(id)?.main ?? null;
  }

  private texture(art: string, pose: PoseArt): string | null {
    for (const id of poseArts(art, pose)) {
      if (this.scene.textures.exists(id)) return id;
      this.want(id);
    }
    return null;
  }

  /** Keeps one body per unit on the field (new ones made, gone ones removed). */
  sync(units: readonly StageUnit[]) {
    const ids = new Set(units.map((u) => u.id));
    for (const [id, b] of this.bodies) {
      if (ids.has(id)) continue;
      b.main.destroy();
      b.light.destroy();
      b.glow.destroy();
      this.bodies.delete(id);
    }
    for (const u of units) {
      if (this.bodies.has(u.id)) continue;
      const make = () => this.scene.add.image(0, 0, '__MISSING').setOrigin(0.5, 1).setVisible(false);
      const b: Body = { art: u.art, main: make(), light: make().setBlendMode(Phaser.BlendModes.ADD), glow: make().setBlendMode(Phaser.BlendModes.ADD) };
      this.bodies.set(u.id, b);
    }
  }

  /** Draws a unit at its pose (`pose` null: standing still, reduced motion). `now` drives the pulse of a unit that can be aimed at. */
  apply(u: StageUnit, pose: BodyPose | null, now: number) {
    const b = this.bodies.get(u.id);
    if (!b) return;
    const posture: PoseArt = u.down ? 'ko' : (pose?.posture ?? 'idle');
    const key = this.texture(u.art, posture);
    if (!key) {
      for (const img of [b.main, b.light, b.glow]) img.setVisible(false);
      return;
    }
    for (const img of [b.main, b.light, b.glow]) if (img.texture.key !== key) img.setTexture(key);
    const tw = b.main.width || 1;
    const th = b.main.height || 1;
    // Fitted into the box the DOM gave it, standing on its feet (object-fit: contain, bottom).
    const fit = Math.min(u.width / tw, u.height / th);
    const p = pose ?? { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, bright: 1, gray: 0, opacity: 1, glow: null, posture };
    const gray = u.down ? 1 : p.gray;
    const opacity = u.down ? 0.4 : p.opacity;
    const depth = 1000 + u.feet.y;
    for (const img of [b.main, b.light, b.glow]) {
      img
        .setVisible(true)
        .setPosition(u.feet.x + p.dx, u.feet.y + p.dy)
        .setAngle(p.rot)
        .setScale(fit * p.sx, fit * p.sy)
        .setFlipX(u.mirrored);
    }
    b.main.setDepth(depth).setAlpha(opacity);
    if (gray > 0.01) b.main.setTint(grey(gray));
    else b.main.clearTint();
    const light = Math.min(1, Math.max(0, (p.bright - 1) / 1.2));
    b.light.setDepth(depth + 0.1).setAlpha(light * opacity).setVisible(light > 0.01);
    // A glow under the body: the pose's (a cast, a heal), or a soft white pulse on a unit that can be aimed at.
    const glow = p.glow ?? (u.aimable ? 0xffffff : null);
    const glowAlpha = p.glow !== null ? 0.6 : u.aimable ? 0.35 + 0.2 * Math.sin(now / 160) : 0;
    b.glow
      .setDepth(depth - 0.1)
      .setVisible(glow !== null && glowAlpha > 0.01)
      .setScale(fit * p.sx * 1.08, fit * p.sy * 1.05)
      .setTintFill(glow ?? 0xffffff)
      .setAlpha(glowAlpha * opacity);
  }

  hideAll() {
    for (const b of this.bodies.values()) for (const img of [b.main, b.light, b.glow]) img.setVisible(false);
  }
}
