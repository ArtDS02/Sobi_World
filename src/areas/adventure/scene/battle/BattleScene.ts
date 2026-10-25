// The battle stage (decision 042): a Phaser scene drawn over the Adventure's scene (which paints the zone behind) and under the DOM of
// the battle (nameplates, turn bar, dock, target markers, numbers). It draws the fighters where the DOM laid them out, moves them by
// their poses and plays the effects of the step on screen, all on the GPU; nothing of it lives in the DOM, so a redraw of the DOM never
// restarts anything. It reads a plain state from the Adventure's UI every frame (ui/adventureUi.ts `battleStage`) and never reaches
// the store. Its clock is the page clock (performance.now), the one the step's clock reads.
import * as Phaser from 'phaser';
import type { AssetRegistry } from '../../../../core/assets/registry';
import type { PlayingStep } from '../../ui/battleFxView';
import { stepPlan, type BattleSound, type FxCue } from '../../ui/battlePlan';
import { poseOf, type PoseAnchor } from '../../ui/battlePose';
import { BattleUnits, type StageUnit } from './battleUnits';
import { FxPlayer, type FxAnchor } from './fxPlayer';
import { ensureFxTextures } from './fxTextures';

export const BATTLE_SCENE_KEY = 'adventure-battle';

/** What the battle's UI tells the stage every frame. */
export interface BattleStageState {
  /** A battle (or the replay of its last blow) is on screen. */
  active: boolean;
  /** The fighters, their feet in page px (client coordinates). */
  units: readonly StageUnit[];
  step: Readonly<PlayingStep>;
  reduce: boolean;
  sound?: ((key: BattleSound) => void) | undefined;
}

/** A manifest image: its url and, for a strip, its frames. */
export interface StageImage {
  url: string;
  frames?: { width: number; height: number; count: number; fps: number } | undefined;
}

/** The images of the manifest, as the stage asks for them (a strip of the fx section comes with its frames). */
export const manifestImages =
  (registry: AssetRegistry) =>
  (id: string): StageImage | null => {
    const url = registry.url(id);
    return url ? { url, frames: registry.manifest.fx.find((r) => r.id === id)?.frames } : null;
  };

export interface BattleSceneDeps {
  read(): BattleStageState | null;
  image(id: string): StageImage | null;
}

export class BattleScene extends Phaser.Scene {
  private units!: BattleUnits;
  private fx!: FxPlayer;
  private key = '';
  private cues: (FxCue & { done: boolean })[] = [];
  private asked = new Set<string>();
  private last = 0;

  constructor(private readonly deps: BattleSceneDeps) {
    super(BATTLE_SCENE_KEY);
  }

  create() {
    ensureFxTextures(this);
    this.units = new BattleUnits(this, (id) => this.want(id));
    this.fx = new FxPlayer(this);
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.load.on(Phaser.Loader.Events.FILE_COMPLETE, (key: string) => {
      const img = this.deps.image(key);
      if (img?.frames && !this.anims.exists(key)) this.anims.create({ key, frames: this.anims.generateFrameNumbers(key, { start: 0, end: img.frames.count - 1 }), frameRate: img.frames.fps, repeat: 0 });
    });
  }

  /** Loads a manifest image the first time it is wanted (one that has no file is asked once and never again). */
  private want(id: string) {
    if (this.asked.has(id) || this.textures.exists(id)) return;
    this.asked.add(id);
    const img = this.deps.image(id);
    if (!img) return;
    if (img.frames) this.load.spritesheet(id, img.url, { frameWidth: img.frames.width, frameHeight: img.frames.height });
    else this.load.image(id, img.url);
    if (!this.load.isLoading()) this.load.start();
  }

  override update() {
    const now = performance.now();
    const dt = Math.min(0.05, this.last ? (now - this.last) / 1000 : 0.016);
    this.last = now;
    const s = this.deps.read();
    if (!s || !s.active) {
      if (this.key) {
        this.key = '';
        this.cues = [];
        this.fx.clear();
      }
      this.units.hideAll();
      return;
    }
    const base = this.game.canvas.getBoundingClientRect();
    const units = s.units.map((u) => ({ ...u, feet: { x: u.feet.x - base.left, y: u.feet.y - base.top } }));
    this.units.sync(units);
    const p = s.step;
    if (p.key !== this.key) {
      this.key = p.key;
      const sides = new Map(units.map((u) => [u.id, u.side] as const));
      this.cues = stepPlan(p, sides, s.reduce).map((c) => ({ ...c, done: false }));
      // A step already under way when it first shows (a reload) skips what is long past.
      const into = now - p.at;
      for (const c of this.cues) if (c.at < into - 250) c.done = true;
    }
    const t = now - p.at;
    const poseAnchors = new Map<string, PoseAnchor>(units.map((u) => [u.id, { side: u.side, art: u.art, feet: u.feet, width: u.width }]));
    for (const u of units) {
      for (const id of [`cb_${u.art}_idle`, u.art]) this.want(id);
      this.units.apply(u, s.reduce ? null : poseOf(u.id, poseAnchors.get(u.id)!, poseAnchors, p, t, now), now);
    }
    const fxAnchors = new Map<string, FxAnchor>(
      units.map((u) => [
        u.id,
        {
          side: u.side,
          width: u.width,
          height: u.height,
          feet: u.feet,
          chest: { x: u.feet.x, y: u.feet.y - u.height * 0.45 },
          head: { x: u.feet.x + (u.side === 'ally' ? 1 : -1) * u.width * 0.16, y: u.feet.y - u.height * 0.58 },
          picture: this.units.picture(u.id),
        },
      ]),
    );
    for (const c of this.cues) {
      if (c.done || c.at > t) continue;
      c.done = true;
      if (c.kind === 'sound') s.sound?.(c.sound);
      else if (!s.reduce) this.fx.play(c, fxAnchors);
    }
    this.fx.update(dt, this.scale.width, this.scale.height);
  }
}
