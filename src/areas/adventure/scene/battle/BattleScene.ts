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
import { rigOf } from '../../../../systems/animation';
import { perfOf } from '../../ui/battlePerf';
import { poseOf, type BodyPose, type PoseAnchor } from '../../ui/battlePose';
import { BattleUnits, type StageUnit } from './battleUnits';
import { FxPlayer, type FxAnchor } from './fxPlayer';
import { ensureFxTextures } from './fxTextures';
import { StatusBadges } from './statusBadges';
import { TurnMarker } from './turnMarker';

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
  private turn!: TurnMarker;
  /** The stage holds still until then (hit stop, performance.now ms). */
  private holdUntil = 0;
  /** Real ms the stage has lost to slow motion so far; the step's clock is `now - lost` (ANIM-004, one clock for cues and poses). */
  private lost = 0;
  private lostAtStep = 0;
  private stageLast = 0;
  private held = new Map<string, BodyPose | null>();
  private poseAnchors = new Map<string, PoseAnchor>();
  private poseSides = new Map<string, 'ally' | 'enemy'>();
  private loops: { at: number; cue: Extract<FxCue, { kind: 'act' }>['cue'] }[] = [];

  constructor(private readonly deps: BattleSceneDeps) {
    super(BATTLE_SCENE_KEY);
  }

  create() {
    ensureFxTextures(this);
    this.units = new BattleUnits(this, (id) => this.want(id));
    this.fx = new FxPlayer(this, { hold: (ms) => (this.holdUntil = Math.max(this.holdUntil, performance.now() + ms)), ghosts: () => this.units.allGhosts() });
    this.badges = new StatusBadges(this, (id) => this.want(id));
    this.turn = new TurnMarker(this);
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

  /** Drops what earlier steps left on the stage (effects still playing, statuses, their pending loops) without playing their expiry. */
  private restart() {
    this.fx.clear();
    this.loops = [];
    this.held.clear();
    // Forgetting the statuses seen makes the next frame a first sight: no expire script for the statuses of the previous step.
    this.badges.hideAll();
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
      this.turn.hide();
      return;
    }
    const base = this.game.canvas.getBoundingClientRect();
    const units = s.units.map((u) => ({ ...u, feet: { x: u.feet.x - base.left, y: u.feet.y - base.top } }));
    this.units.sync(units);
    const p = s.step;
    if (p.key !== this.key) {
      this.key = p.key;
      this.lostAtStep = this.lost;
      this.fx.screen.reset();
      if (p.fresh) this.restart();
      const sides = new Map(units.map((u) => [u.id, u.side] as const));
      this.cues = stepPlan(p, sides, s.reduce).map((c) => ({ ...c, done: false }));
      // A step already under way when it first shows (a reload) skips what is long past.
      const into = now - p.at;
      for (const c of this.cues) if (c.at < into - 250) c.done = true;
      // The pictures its scripts name are asked for now, so they are there when their act plays.
      for (const c of this.cues) if (c.kind === 'act') for (const id of actImages(c.cue.act)) this.want(id);
      this.holdUntil = 0;
    }
    // Slow motion (screenFx.slowMo) stretches the stage's clock: cues, poses, tweens, particles all read it; reduced motion has none.
    const scale = s.reduce ? 1 : this.fx.screen.timeScale(now);
    this.lost += Math.min(50, now - (this.stageLast || now)) * (1 - scale);
    this.stageLast = now;
    const t = now - this.lost - (p.at - this.lostAtStep);
    // Hit stop: the bodies keep the pose they had, the effects and particles wait.
    const holding = !s.reduce && now < this.holdUntil;
    this.tweens.timeScale = holding ? 0 : scale;
    this.time.timeScale = holding ? 0 : scale;
    this.fx.bursts.pause(holding);
    // The puppets' clock (decision 050) holds with the hit stop and slows with slow motion.
    this.units.puppets.tick(dt * 1000, holding ? 0 : scale);
    // Maps reused between frames (ANIM-107): cleared and refilled instead of allocated per frame.
    const poseAnchors = this.poseAnchors;
    const poseSides = this.poseSides;
    poseAnchors.clear();
    poseSides.clear();
    for (const u of units) {
      poseAnchors.set(u.id, { side: u.side, art: u.art, feet: u.feet, width: u.width, frozen: !u.down && this.badges.frozenBody(u.statuses), swaying: !u.down && this.badges.swaying(u.statuses), low: u.low === true && !u.down, boss: u.boss === true, rigged: rigOf(u.art) !== null });
      poseSides.set(u.id, u.side);
    }
    for (const u of units) {
      this.want(`cb_${u.art}_idle`);
      this.want(u.art);
      const pose = s.reduce ? null : holding && this.held.has(u.id) ? this.held.get(u.id)! : poseOf(u.id, poseAnchors.get(u.id)!, poseAnchors, p, t, now, poseSides);
      if (!holding) this.held.set(u.id, pose);
      this.units.apply(u, pose, now, this.badges.tintOf(u.statuses), perfOf(u.id, p, t, pose?.posture ?? 'idle', u.down));
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
          // A puppet's head is where its eyes are now (it ducks, rears, is knocked back); a picture's is guessed from its box.
          head: this.units.puppets.head(u.id) ?? { x: u.feet.x + (u.side === 'ally' ? 1 : -1) * u.width * 0.16, y: u.feet.y - u.height * 0.58 },
          picture: this.units.picture(u.id),
          ghosts: () => this.units.ghosts(u.id),
          part: (name: string) => this.units.puppets.anchor(u.id, name),
        },
      ]),
    );
    // The middle of each side, for the acts over a whole row (decision 044 `allyside` / `foeside`).
    for (const side of ['ally', 'enemy'] as const) {
      const row = units.filter((u) => u.side === side);
      if (row.length === 0) continue;
      const x = row.reduce((sum, u) => sum + u.feet.x, 0) / row.length;
      const y = Math.max(...row.map((u) => u.feet.y));
      // As wide as one unit, a little more for a longer row (an effect over a whole row is sized like one on a big unit).
      const span = Math.max(...row.map((u) => u.feet.x + u.width / 2)) - Math.min(...row.map((u) => u.feet.x - u.width / 2));
      const width = Math.max(row.reduce((sum, u) => sum + u.width, 0) / row.length, span * 0.6);
      const height = row.reduce((sum, u) => sum + u.height, 0) / row.length;
      const midY = row.reduce((sum, u) => sum + u.feet.y, 0) / row.length;
      fxAnchors.set(`@${side}`, { side, width, height, feet: { x, y }, mid: { x, y: midY }, chest: { x, y: y - height * 0.45 }, head: { x, y: y - height * 0.58 }, picture: null });
    }
    for (const c of this.cues) {
      if (c.done || c.at > t) continue;
      if (c.kind !== 'sound' && holding) continue;
      c.done = true;
      if (c.kind === 'sound') s.sound?.(c.sound);
      else if (!s.reduce || c.kind === 'still') this.fx.play(c, fxAnchors);
    }
    // The statuses: badges by the head, and the little loops they play while they last.
    for (const cue of this.badges.update(units, fxAnchors, now, s.reduce)) this.loops.push({ at: now + cue.at, cue });
    if (!holding) {
      const due = this.loops.filter((l) => l.at <= now);
      this.loops = this.loops.filter((l) => l.at > now);
      for (const l of due) this.fx.play({ at: 0, kind: 'act', cue: l.cue }, fxAnchors);
    }
    this.fx.update(holding ? 0 : dt * scale, this.scale.width, this.scale.height);
    this.fx.screen.update(now);
    // Whose turn it is, until a step starts playing (ANIM-011).
    const playing = t >= 0 && t <= p.motion.total + 200;
    this.turn.update(playing ? null : (units.find((u) => u.active) ?? null), fxAnchors, now, s.reduce);
  }
}
