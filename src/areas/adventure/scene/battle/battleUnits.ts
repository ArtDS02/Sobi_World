// The fighters on the battle stage (decision 042): each one a picture standing on the feet the DOM laid out for it, looking at the other
// side (mirrored when its art says so), showing its key pose (`cb_<art>_<pose>` in the manifest; the picture itself while it has none),
// moved every frame by its pose (ui/battlePose.ts). Brightness is a copy of the picture added on top, a glow a tinted copy under it,
// both drawn by the GPU — no CSS filter. Pictures still missing are loaded the first time they are asked for.
import * as Phaser from 'phaser';
import type { PoseArt } from '../../../../../content/schemas/adventure/battleFx';
import type { BodyPose } from '../../ui/battlePose';
import { poseArts } from '../../ui/motionProfiles';
import { VEINS_TINT } from '../foeMarks';

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
  /** The statuses it carries now (decision 044 status_overlay). */
  statuses: readonly string[];
  /** An enemy's corruption 1–5 (decision 045), 0 when none. */
  corruption: number;
}

interface Body {
  art: string;
  main: Phaser.GameObjects.Image;
  light: Phaser.GameObjects.Image;
  glow: Phaser.GameObjects.Image;
  /** Corruption marks (decision 045): violet veins on the ground from 3, a crystal cluster behind it from 4. */
  veins: Phaser.GameObjects.Image;
  spikes: Phaser.GameObjects.Image;
}

const VEINS = 'fx_corrupt_veins';
const SPIKES = 'fx_corrupt_spikes';

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

  /** Every fighter's picture (the colour split of a script copies them). */
  pictures(): Phaser.GameObjects.Image[] {
    return [...this.bodies.values()].map((b) => b.main);
  }

  private texture(art: string, pose: PoseArt): string | null {
    for (const id of poseArts(art, pose)) {
      if (this.scene.textures.exists(id)) return id;
      this.want(id);
    }
    return null;
  }

  /** A manifest image by its id, asked for the first time it is missing. */
  private image(id: string): string | null {
    if (this.scene.textures.exists(id)) return id;
    this.want(id);
    return null;
  }

  /** Keeps one body per unit on the field (new ones made, gone ones removed). */
  sync(units: readonly StageUnit[]) {
    const ids = new Set(units.map((u) => u.id));
    for (const [id, b] of this.bodies) {
      if (ids.has(id)) continue;
      for (const img of [b.main, b.light, b.glow, b.veins, b.spikes]) img.destroy();
      this.bodies.delete(id);
    }
    for (const u of units) {
      if (this.bodies.has(u.id)) continue;
      const make = () => this.scene.add.image(0, 0, '__MISSING').setOrigin(0.5, 1).setVisible(false);
      const b: Body = { art: u.art, main: make(), light: make().setBlendMode(Phaser.BlendModes.ADD), glow: make().setBlendMode(Phaser.BlendModes.ADD), veins: make().setOrigin(0.5), spikes: make() };
      this.bodies.set(u.id, b);
    }
  }

  /**
   * Draws a unit at its pose (`pose` null: standing still, reduced motion). `now` drives the pulse of a unit that can be aimed at;
   * `statusTint` colours the body while a status says so (a pose's own tint wins).
   */
  apply(u: StageUnit, pose: BodyPose | null, now: number, statusTint: number | null = null) {
    const b = this.bodies.get(u.id);
    if (!b) return;
    const posture: PoseArt = u.down ? 'ko' : (pose?.posture ?? 'idle');
    const key = this.texture(u.art, posture);
    if (!key) {
      for (const img of [b.main, b.light, b.glow, b.veins, b.spikes]) img.setVisible(false);
      return;
    }
    for (const img of [b.main, b.light, b.glow]) if (img.texture.key !== key) img.setTexture(key);
    const tw = b.main.width || 1;
    const th = b.main.height || 1;
    // Fitted into the box the DOM gave it, standing on its feet (object-fit: contain, bottom).
    const fit = Math.min(u.width / tw, u.height / th);
    const p = pose ?? { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, bright: 1, gray: 0, opacity: 1, glow: null, tint: null, posture };
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
    const tint = p.tint ?? statusTint;
    if (gray > 0.01) b.main.setTint(grey(gray));
    else if (tint !== null) b.main.setTint(tint);
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
    this.marks(u, b, fit, p.dx, opacity, depth);
  }

  /** The veins under a corrupted enemy's feet and the spikes at its back (it looks at the other side); they stay when it moves. */
  private marks(u: StageUnit, b: Body, fit: number, dx: number, opacity: number, depth: number) {
    const w = b.main.width * fit;
    const h = b.main.height * fit;
    const veins = u.corruption >= 3 && !u.down ? this.image(VEINS) : null;
    b.veins.setVisible(veins !== null);
    if (veins) {
      if (b.veins.texture.key !== veins) b.veins.setTexture(veins);
      b.veins.setPosition(u.feet.x + dx * 0.3, u.feet.y - h * 0.03).setDisplaySize(w * 1.2, h * 0.3).setDepth(depth - 0.2).setTint(VEINS_TINT).setAlpha(0.9 * opacity);
    }
    const spikes = u.corruption >= 4 && !u.down ? this.image(SPIKES) : null;
    b.spikes.setVisible(spikes !== null);
    if (spikes) {
      if (b.spikes.texture.key !== spikes) b.spikes.setTexture(spikes);
      const back = u.side === 'enemy' ? 1 : -1;
      const size = h * (u.corruption >= 5 ? 0.6 : 0.48);
      b.spikes.setPosition(u.feet.x + dx + back * w * 0.46, u.feet.y).setDisplaySize(size, size).setFlipX(back < 0).setDepth(depth - 0.15).setAlpha(opacity);
    }
  }

  hideAll() {
    for (const b of this.bodies.values()) for (const img of [b.main, b.light, b.glow, b.veins, b.spikes]) img.setVisible(false);
  }
}
