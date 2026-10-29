// The battle stage (decision 042): a Phaser scene drawn over the Adventure's scene (which paints the zone behind) and under the DOM of
// the battle (nameplates, turn bar, dock, target markers, numbers). It draws the fighters where the DOM laid them out, moves them by
// their poses and plays the effects of the step on screen, all on the GPU; nothing of it lives in the DOM, so a redraw of the DOM never
// restarts anything. It reads a plain state from the Adventure's UI every frame (ui/adventureUi.ts `battleStage`) and never reaches
// the store. Its clock is the page clock (performance.now), the one the step's clock reads. A hit stop (decision 044) holds the stage
// still for a moment: the bodies keep their pose, particles and effects wait, sounds (and the DOM's numbers) go on.
import * as Phaser from 'phaser';
import type { AssetRegistry } from '../../../../core/assets/registry';
import type { PlayingStep } from '../../ui/battleFxView';
import { actImages } from '../../../../../content/schemas/adventure/battleScript';
import { BATTLE_FX } from '../../logic/config/content';
import { stepPlan, type CueSound, type FxCue } from '../../ui/battlePlan';
import { poseOf, type BodyPose, type PoseAnchor } from '../../ui/battlePose';
import { BattleUnits, type StageUnit } from './battleUnits';
import { FxPlayer, type FxAnchor } from './fxPlayer';
import { ensureFxTextures } from './fxTextures';
import { StatusBadges } from './statusBadges';

export const BATTLE_SCENE_KEY = 'adventure-battle';

/** What the battle's UI tells the stage every frame. */
export interface BattleStageState {
  /** A battle (or the replay of its last blow) is on screen. */
  active: boolean;
  /** The fighters, their feet in page px (client coordinates). */
  units: readonly StageUnit[];
  step: Readonly<PlayingStep>;
  reduce: boolean;
  sound?: ((key: CueSound) => void) | undefined;
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
  private badges!: StatusBadges;
  /** The stage holds still until then (hit stop, performance.now ms). */
  private holdUntil = 0;
  private held = new Map<string, BodyPose | null>();
  private loops: { at: number; cue: Extract<FxCue, { kind: 'act' }>['cue'] }[] = [];

  constructor(private readonly deps: BattleSceneDeps) {
    super(BATTLE_SCENE_KEY);
  }

  create() {
    ensureFxTextures(this);
    this.units = new BattleUnits(this, (id) => this.want(id));
    this.fx = new FxPlayer(this, { hold: (ms) => (this.holdUntil = Math.max(this.holdUntil, performance.now() + ms)), pictures: () => this.units.pictures() });
    this.badges = new StatusBadges(this, (id) => this.want(id));
    // The sprites of the particles and the status badges are small: loaded up front so a burst never starts with the drawn shape.
    for (const b of Object.values(BATTLE_FX.particles)) if (b.art) this.want(b.art);
    for (const st of Object.values(BATTLE_FX.statuses)) if (st) this.want(st.icon);
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
      this.badges.hideAll();
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
      // The pictures its scripts name are asked for now, so they are there when their act plays.
      for (const c of this.cues) if (c.kind === 'act') for (const id of actImages(c.cue.act)) this.want(id);
      this.holdUntil = 0;
    }
    const t = now - p.at;
    // Hit stop: the bodies keep the pose they had, the effects and particles wait.
    const holding = !s.reduce && now < this.holdUntil;
    this.tweens.timeScale = holding ? 0 : 1;
    this.time.timeScale = holding ? 0 : 1;
    this.fx.bursts.pause(holding);
    const poseAnchors = new Map<string, PoseAnchor>(units.map((u) => [u.id, { side: u.side, art: u.art, feet: u.feet, width: u.width }]));
    for (const u of units) {
      for (const id of [`cb_${u.art}_idle`, u.art]) this.want(id);
      const pose = s.reduce ? null : holding && this.held.has(u.id) ? this.held.get(u.id)! : poseOf(u.id, poseAnchors.get(u.id)!, poseAnchors, p, t, now);
      if (!holding) this.held.set(u.id, pose);
      this.units.apply(u, pose, now, this.badges.tintOf(u.statuses));
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
      if (c.kind !== 'sound' && holding) continue;
      c.done = true;
      if (c.kind === 'sound') s.sound?.(c.sound);
      else if (!s.reduce) this.fx.play(c, fxAnchors);
    }
    // The statuses: badges by the head, and the little loops they play while they last.
    for (const cue of this.badges.update(units, fxAnchors, now, s.reduce)) this.loops.push({ at: now + cue.at, cue });
    if (!holding) {
      const due = this.loops.filter((l) => l.at <= now);
      this.loops = this.loops.filter((l) => l.at > now);
      for (const l of due) this.fx.play({ at: 0, kind: 'act', cue: l.cue }, fxAnchors);
    }
    this.fx.update(holding ? 0 : dt, this.scale.width, this.scale.height);
  }
}
