// Plays the cues of a battle step (ui/battlePlan.ts) in the battle scene (decision 042): the magic circle laid under a caster, power
// gathering, the shot flying in its element's look, what lands (the look's bursts, its stroke — slash, bolt, beam of light, swirl,
// vines —, a ring on the ground, the flash and the shake), the bursts of the reactions, the teleport lights and the screen dimming for
// an Ultimate. Pictures are the textures of fxTextures.ts or manifest images; strokes are drawn on one additive Graphics each frame.
import * as Phaser from 'phaser';
import type { BattleLook, ReactionFx } from '../../../../../content/schemas/adventure/battleFx';
import { BATTLE_FX } from '../../logic/config/content';
import type { FxCue } from '../../ui/battlePlan';
import { ActPlayer } from './fxActs';
import { ghostImages, type Ghost } from './fxGhosts';
import { AIR_DEPTH, GROUND_DEPTH, Bursts, type BurstSpot } from './fxBursts';
import { playStroke } from './fxStrokes';
import { ScreenFx } from './screenFx';
import { CIRCLE_KEY, PILLAR_KEY, shapeKey } from './fxTextures';

/** A unit as the effects see it (game px). */
export interface FxAnchor extends BurstSpot {
  side: 'ally' | 'enemy';
  width: number;
  height: number;
  /** The unit's picture now (the cut-in portrait). */
  picture: Phaser.GameObjects.Image | null;
  /** What a ghost of it copies now (its picture, or its puppet's parts: decision 050). */
  ghosts?: () => Ghost[];
  /** Where a named part of its puppet is now (`mouth`, `tail`: the rig's anchors), null when it has none. */
  part?: (name: string) => { x: number; y: number } | null;
}

export interface Timed {
  age: number;
  dur: number;
  /** t ∈ [0, 1]; `g` is the stroke layer, cleared every frame. */
  step(t: number, g: Phaser.GameObjects.Graphics, dt: number): void;
  done?(): void;
}

const isShape = (ref: string) => !ref.startsWith('fx_');
/** A shot lays one burst of its trail every this many pixels it flies. */
const TRAIL_STEP_PX = 9;

/** What the effects ask of the scene: to hold the stage still (hit stop), every fighter's ghost pictures (a colour split). */
export interface FxHooks {
  hold(ms: number): void;
  ghosts(): Ghost[];
}

export class FxPlayer {
  readonly bursts: Bursts;
  readonly screen: ScreenFx;
  private acts: ActPlayer;
  private timed: Timed[] = [];
  private strokes: Phaser.GameObjects.Graphics;
  private dim: Phaser.GameObjects.Rectangle;
  private flashRect: Phaser.GameObjects.Rectangle;
  private dimTo = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    hooks: FxHooks,
  ) {
    this.bursts = new Bursts(scene);
    this.screen = new ScreenFx(scene, hooks.hold);
    this.acts = new ActPlayer({ scene, bursts: this.bursts, screen: this.screen, add: (dur, step, done) => this.add(dur, step, done), flash: (c, a, ms) => this.flash(c, a, ms), hold: hooks.hold, ghosts: hooks.ghosts });
    this.strokes = scene.add.graphics().setDepth(AIR_DEPTH + 1).setBlendMode(Phaser.BlendModes.ADD);
    this.dim = scene.add.rectangle(0, 0, 10, 10, 0x0e0a1e, 1).setOrigin(0).setDepth(AIR_DEPTH - 10).setAlpha(0);
    this.flashRect = scene.add.rectangle(0, 0, 10, 10, 0xffffff, 1).setOrigin(0).setDepth(AIR_DEPTH + 10).setAlpha(0);
  }

  /** Something is still on screen (the scene keeps drawing while it is). */
  busy(): boolean {
    return this.timed.length > 0 || this.bursts.alive() > 0 || this.dim.alpha > 0.01 || this.flashRect.alpha > 0.01;
  }

  clear() {
    this.screen.reset();
    for (const x of this.timed) x.done?.();
    this.timed = [];
    this.bursts.clear();
    this.strokes.clear();
    this.dimTo = 0;
    this.dim.setAlpha(0);
    this.flashRect.setAlpha(0);
  }

  private add(dur: number, step: Timed['step'], done?: () => void) {
    this.timed.push({ age: 0, dur, step, ...(done ? { done } : {}) });
  }

  /** A picture that lives for `dur` ms: a shape texture tinted, or a manifest image (played as a strip when it was loaded as one). */
  private picture(ref: string, x: number, y: number, tint: number | null): Phaser.GameObjects.Sprite {
    const key = isShape(ref) ? shapeKey(ref as never) : ref;
    const s = this.scene.add.sprite(x, y, this.scene.textures.exists(key) ? key : shapeKey('glow')).setDepth(AIR_DEPTH);
    if (isShape(ref)) s.setBlendMode(Phaser.BlendModes.ADD);
    if (tint !== null && isShape(ref)) s.setTint(tint);
    if (this.scene.anims.exists(key)) s.play(key);
    return s;
  }

  private flash(color: number, alpha: number, ms: number) {
    if (this.flashRect.alpha > alpha) return;
    this.flashRect.setFillStyle(color, 1).setAlpha(alpha);
    this.scene.tweens.add({ targets: this.flashRect, alpha: 0, duration: ms, ease: 'Quad.easeOut' });
  }

  play(cue: FxCue, anchors: ReadonlyMap<string, FxAnchor>) {
    const unitOf = (id: string) => anchors.get(id);
    switch (cue.kind) {
      case 'sound':
        return;
      case 'dim':
        this.dimTo = cue.to;
        return;
      case 'teleport': {
        const a = unitOf(cue.unit);
        if (!a) return;
        const color = a.side === 'ally' ? 0x9ae6ff : 0xd9b8ff;
        this.scene.time.delayedCall(cue.delay, () => {
          const p = this.scene.add.image(a.feet.x, a.feet.y, PILLAR_KEY).setOrigin(0.5, 1).setDepth(AIR_DEPTH).setBlendMode(Phaser.BlendModes.ADD).setTint(color);
          p.setDisplaySize(a.width * 0.9, a.height * 2.2);
          this.add(700, (t) => p.setAlpha(Math.sin(Math.PI * Math.min(1, t * 1.2))), () => p.destroy());
          this.reaction('teleport', a, [0xffffff, color]);
        });
        return;
      }
      case 'circle': {
        const a = unitOf(cue.unit);
        if (!a) return;
        // Three layers (ANIM-022): the outer ring turning one way, a smaller ring the other, the element's glyph at the heart beating, and
        // a column of light when the spell is let go. Over the ground marks, under the bodies.
        const add = (key: string, tint: number) => this.scene.add.image(a.feet.x, a.feet.y, key).setDepth(GROUND_DEPTH + 3).setBlendMode(Phaser.BlendModes.ADD).setTint(tint);
        const outer = add(CIRCLE_KEY, cue.look.color);
        const mid = add(CIRCLE_KEY, cue.look.glow);
        const glyph = add(shapeKey(cue.look.glyph ?? 'rune'), cue.look.glow);
        const pillar = this.scene.add.image(a.feet.x, a.feet.y, PILLAR_KEY).setOrigin(0.5, 1).setDepth(GROUND_DEPTH + 3).setBlendMode(Phaser.BlendModes.ADD).setTint(cue.look.glow).setAlpha(0);
        const size = a.width * (cue.big ? 2.1 : 1.6);
        let age = 0;
        this.add(cue.dur, (t, _g, dt) => {
          age += dt;
          const grow = 0.4 + 0.6 * Math.min(1, t * 3);
          const fade = t < 0.15 ? t / 0.15 : t > 0.8 ? (1 - t) / 0.2 : 1;
          outer.setDisplaySize(size * grow, size * 0.38 * grow).setAlpha(fade);
          outer.rotation += dt * 1.2 * (cue.big ? 1.5 : 1);
          mid.setDisplaySize(size * 0.68 * grow, size * 0.26 * grow).setAlpha(0.8 * fade);
          mid.rotation -= dt * 1.8 * (cue.big ? 1.5 : 1);
          const beat = 0.975 + 0.075 * Math.sin(age * Math.PI * 2 * 3);
          glyph.setDisplaySize(size * 0.3 * beat * grow, size * 0.3 * 0.38 * beat * grow).setAlpha(0.9 * fade);
          pillar.setDisplaySize(a.width * (cue.big ? 1.1 : 0.8), a.height * 2).setAlpha(t > 0.7 ? 0.35 * fade : 0);
        }, () => {
          outer.destroy();
          mid.destroy();
          glyph.destroy();
          pillar.destroy();
        });
        return;
      }
      case 'still': {
        // Reduced motion (ANIM-111): a steady ring on the ground, fading in and out, no turning, flashing or shaking.
        const a = unitOf(cue.unit);
        if (!a) return;
        const ring = this.scene.add.image(a.feet.x, a.feet.y, CIRCLE_KEY).setDepth(GROUND_DEPTH + 3).setBlendMode(Phaser.BlendModes.ADD).setTint(cue.role === 'actor' ? cue.look.glow : cue.look.color);
        const size = a.width * (cue.role === 'actor' ? 1.3 : 1.5);
        ring.setDisplaySize(size, size * 0.38);
        this.add(cue.dur, (t) => ring.setAlpha(0.85 * (t < 0.2 ? t / 0.2 : t > 0.7 ? (1 - t) / 0.3 : 1)), () => ring.destroy());
        return;
      }
      case 'charge': {
        const a = unitOf(cue.unit);
        if (!a) return;
        const orb = this.scene.add.image(a.chest.x, a.chest.y, shapeKey('glow')).setDepth(AIR_DEPTH).setBlendMode(Phaser.BlendModes.ADD).setTint(cue.look.glow);
        const r = a.width * (cue.big ? 0.9 : 0.55);
        this.add(cue.dur + 120, (t) => orb.setDisplaySize(r * t, r * t).setAlpha(t < 0.85 ? 0.9 : (1 - t) * 6), () => orb.destroy());
        this.reaction('charge', a, [cue.look.glow, cue.look.color], cue.big ? 1.6 : 1);
        return;
      }
      case 'shot': {
        const from = unitOf(cue.from);
        const to = unitOf(cue.to);
        if (!from || !to) return;
        this.shot(from, to, cue.look, cue.dur);
        return;
      }
      case 'land': {
        const a = unitOf(cue.unit);
        if (a) this.land(a, cue.look, cue.heavy, cue.big, cue.slam);
        return;
      }
      case 'fx': {
        const a = unitOf(cue.unit);
        if (!a) return;
        for (const ref of cue.refs) this.bursts.play(ref, a, { mirror: a.side === 'enemy', tint: cue.tint });
        return;
      }
      case 'act':
        this.acts.play(cue.cue, anchors);
        return;
      case 'afterimage': {
        const a = unitOf(cue.unit);
        const made = ghostImages(this.scene, a?.ghosts?.() ?? []).map((g) => g.setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.45));
        if (made.length === 0) return;
        this.add(380, (t) => made.forEach((g) => g.setAlpha(0.45 * (1 - t))), () => made.forEach((g) => g.destroy()));
        return;
      }
    }
  }

  /** The bursts of one reaction of battle_fx.json (`charge`, `slam`…) on a unit. */
  private reaction(kind: ReactionFx, a: FxAnchor, tint: readonly number[] | null, more = 1) {
    for (const ref of BATTLE_FX.reactions[kind] ?? []) this.bursts.play(ref, a, { mirror: a.side === 'enemy', tint, more });
  }

  private shot(from: FxAnchor, to: FxAnchor, look: BattleLook, dur: number) {
    const p = look.projectile;
    const core = this.picture(p.core, from.chest.x, from.chest.y, look.color);
    const halo = this.scene.add.image(from.chest.x, from.chest.y, shapeKey('glow')).setDepth(AIR_DEPTH - 1).setBlendMode(Phaser.BlendModes.ADD).setTint(look.glow);
    const size = p.size * 1.5;
    if (isShape(p.core)) core.setDisplaySize(size, size);
    halo.setDisplaySize(size * 2.4, size * 2.4).setAlpha(0.7);
    let last = { x: from.chest.x, y: from.chest.y };
    let travelled = 0;
    this.add(dur, (t, _g, dt) => {
      // It sets off slowly and speeds up (smoothstep, ANIM-042), the core and its halo beat, and the trail is laid by distance
      // flown rather than by time, so it stays even at x2 and over a hit stop.
      const e = t * t * (3 - 2 * t);
      const x = Phaser.Math.Linear(from.chest.x, to.chest.x, e);
      const y = Phaser.Math.Linear(from.chest.y, to.chest.y, e) - Math.sin(e * Math.PI) * p.arc;
      core.setPosition(x, y).setRotation(Math.atan2(y - last.y, x - last.x) + (to.chest.x < from.chest.x && !isShape(p.core) ? Math.PI : 0));
      if (isShape(p.core)) {
        const beat = 1 + 0.08 * Math.sin(t * dur * 0.001 * Math.PI * 2 * 8);
        core.setDisplaySize(size * beat, size * beat);
      }
      halo.setPosition(x, y).setDisplaySize(size * 2.4 * (1 + 0.2 * Math.sin(t * dur * 0.001 * Math.PI * 2 * 5)), size * 2.4 * (1 + 0.2 * Math.sin(t * dur * 0.001 * Math.PI * 2 * 5)));
      if (dt > 0) travelled += Math.hypot(x - last.x, y - last.y);
      while (p.trail && travelled >= TRAIL_STEP_PX) {
        travelled -= TRAIL_STEP_PX;
        this.bursts.play(p.trail, { x, y }, { mirror: from.side === 'enemy' });
      }
      last = { x, y };
    }, () => {
      core.destroy();
      halo.destroy();
    });
  }

  private land(a: FxAnchor, look: BattleLook, heavy: boolean, big: boolean, slam: boolean) {
    const k = (heavy ? 1.35 : 1) * (big ? 1.5 : 1);
    for (const ref of look.impact) {
      if (ref.startsWith('fx_')) this.image(ref, a, k);
      else this.bursts.play(ref, a, { mirror: a.side === 'enemy', more: k });
    }
    if (slam) this.reaction('slam', a, null, k);
    if (look.ring !== null) this.ring(a, look.ring, a.width * 1.4 * k);
    playStroke(this.scene, (dur, step, done) => this.add(dur, step, done), look, a, heavy || big);
    if (look.flash !== null) this.flash(look.flash, heavy || big ? 0.35 : 0.16, 260);
    const shake = look.shake * (heavy || big ? 1.8 : 1);
    if (shake > 0) this.scene.cameras.main.shake(260, shake / Math.max(1, this.scene.scale.width));
  }

  /** A manifest image (`fx_…`) played where it lands; nothing while its file is missing. */
  private image(ref: string, a: FxAnchor, k: number) {
    if (!this.scene.textures.exists(ref)) return;
    const s = this.picture(ref, a.chest.x, a.chest.y, null);
    const w = a.width * 1.3 * k;
    s.setDisplaySize(w, w * (s.height / Math.max(1, s.width))).setFlipX(a.side === 'enemy');
    const anim = this.scene.anims.get(ref);
    const ms = anim ? (anim.frames.length / Math.max(1, anim.frameRate)) * 1000 : 450;
    this.add(ms, (t) => s.setAlpha(t > 0.7 ? (1 - t) / 0.3 : 1), () => s.destroy());
  }

  private ring(a: FxAnchor, color: number, size: number) {
    this.add(450, (t, g) => {
      g.lineStyle(Math.max(1, 6 * (1 - t)), color, 1 - t);
      g.strokeEllipse(a.feet.x, a.feet.y, size * (0.2 + t), size * 0.42 * (0.2 + t));
    });
  }

  /** Moves every timed effect on by `dt` seconds; `w × h` is the screen (the dim and the flash cover it). */
  update(dt: number, w: number, h: number) {
    this.dim.setSize(w, h);
    this.flashRect.setSize(w, h);
    this.dim.setAlpha(this.dim.alpha + (this.dimTo * 0.85 - this.dim.alpha) * Math.min(1, dt * 6));
    this.strokes.clear();
    const keep: Timed[] = [];
    for (const x of this.timed) {
      x.age += dt * 1000;
      const t = Math.min(1, x.age / Math.max(1, x.dur));
      x.step(t, this.strokes, dt);
      if (t < 1) keep.push(x);
      else x.done?.();
    }
    this.timed = keep;
  }
}
