// Plays the cues of a battle step (ui/battlePlan.ts) in the battle scene (decision 042): the magic circle laid under a caster, power
// gathering, the shot flying in its element's look, what lands (the look's bursts, its stroke — slash, bolt, beam of light, swirl,
// vines —, a ring on the ground, the flash and the shake), the bursts of the reactions, the teleport lights and the screen dimming for
// an Ultimate. Pictures are the textures of fxTextures.ts or manifest images; strokes are drawn on one additive Graphics each frame.
import * as Phaser from 'phaser';
import type { BattleLook, ReactionFx } from '../../../../../content/schemas/adventure/battleFx';
import { BATTLE_FX } from '../../logic/config/content';
import type { FxCue } from '../../ui/battlePlan';
import { AIR_DEPTH, Bursts, type BurstSpot } from './fxBursts';
import { playStroke } from './fxStrokes';
import { CIRCLE_KEY, PILLAR_KEY, shapeKey } from './fxTextures';

/** A unit as the effects see it (game px). */
export interface FxAnchor extends BurstSpot {
  side: 'ally' | 'enemy';
  width: number;
  height: number;
  /** The unit's picture now (for its afterimage). */
  picture: Phaser.GameObjects.Image | null;
}

export interface Timed {
  age: number;
  dur: number;
  /** t ∈ [0, 1]; `g` is the stroke layer, cleared every frame. */
  step(t: number, g: Phaser.GameObjects.Graphics, dt: number): void;
  done?(): void;
}

const isShape = (ref: string) => !ref.startsWith('fx_');

export class FxPlayer {
  readonly bursts: Bursts;
  private timed: Timed[] = [];
  private strokes: Phaser.GameObjects.Graphics;
  private dim: Phaser.GameObjects.Rectangle;
  private flashRect: Phaser.GameObjects.Rectangle;
  private dimTo = 0;

  constructor(private readonly scene: Phaser.Scene) {
    this.bursts = new Bursts(scene);
    this.strokes = scene.add.graphics().setDepth(AIR_DEPTH + 1).setBlendMode(Phaser.BlendModes.ADD);
    this.dim = scene.add.rectangle(0, 0, 10, 10, 0x0e0a1e, 1).setOrigin(0).setDepth(AIR_DEPTH - 10).setAlpha(0);
    this.flashRect = scene.add.rectangle(0, 0, 10, 10, 0xffffff, 1).setOrigin(0).setDepth(AIR_DEPTH + 10).setAlpha(0);
  }

  /** Something is still on screen (the scene keeps drawing while it is). */
  busy(): boolean {
    return this.timed.length > 0 || this.bursts.alive() > 0 || this.dim.alpha > 0.01 || this.flashRect.alpha > 0.01;
  }

  clear() {
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
        const c = this.scene.add.image(a.feet.x, a.feet.y, CIRCLE_KEY).setDepth(10).setBlendMode(Phaser.BlendModes.ADD).setTint(cue.look.color);
        const size = a.width * (cue.big ? 2.1 : 1.6);
        this.add(cue.dur, (t, _g, dt) => {
          c.setDisplaySize(size * (0.6 + 0.4 * Math.min(1, t * 3)), size * 0.38 * (0.6 + 0.4 * Math.min(1, t * 3)));
          c.rotation += dt * (cue.big ? 2.4 : 1.6);
          c.setAlpha(t < 0.15 ? t / 0.15 : t > 0.8 ? (1 - t) / 0.2 : 1);
        }, () => c.destroy());
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
      case 'afterimage': {
        const a = unitOf(cue.unit);
        const src = a?.picture;
        if (!src) return;
        const ghost = this.scene.add.image(src.x, src.y, src.texture.key).setOrigin(src.originX, src.originY).setScale(src.scaleX, src.scaleY).setFlipX(src.flipX).setDepth(src.depth - 1).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.45);
        this.add(380, (t) => ghost.setAlpha(0.45 * (1 - t)), () => ghost.destroy());
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
    let since = 0;
    this.add(dur, (t, _g, dt) => {
      const x = Phaser.Math.Linear(from.chest.x, to.chest.x, t);
      const y = Phaser.Math.Linear(from.chest.y, to.chest.y, t) - Math.sin(t * Math.PI) * p.arc;
      core.setPosition(x, y).setRotation(Math.atan2(y - last.y, x - last.x) + (to.chest.x < from.chest.x && !isShape(p.core) ? Math.PI : 0));
      halo.setPosition(x, y);
      since += dt;
      // The trail: one burst of the look's trail every 16 ms of flight.
      while (p.trail && since >= 0.016) {
        since -= 0.016;
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
