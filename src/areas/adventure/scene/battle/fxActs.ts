// Plays the acts of the battle scripts (decision 044, ui/battleScript.ts) on the battle scene: a 4-frame strip (`fx_…`), a big object
// (`fxp_…`) travelling on its path, a burst, a beam, a tether, a cone, a mark on the ground, the shadow of something about to land, a
// trail of afterimages, the backdrop tinted, a camera punch, the hit stop, the colours split, the shake and flash, an Ultimate's cut-in.
// A picture whose file is missing is drawn with a glow of the look's colour instead, so a script always shows something.
import * as Phaser from 'phaser';
import type { Act, Spot } from '../../../../../content/schemas/adventure/battleScript';
import type { ScriptCue } from '../../ui/battleScript';
import { AIR_DEPTH, GROUND_DEPTH, type Bursts } from './fxBursts';
import { beam, cone, tether } from './fxLines';
import { playCutin } from './fxCutin';
import { ghostImages, type Ghost } from './fxGhosts';
import { playProp } from './fxProps';
import { playRibbon } from './fxRibbon';
import type { FxAnchor, Timed } from './fxPlayer';
import type { ScreenFx } from './screenFx';
import { SHADOW_KEY, VIGNETTE_KEY, decalKey, shapeKey } from './fxTextures';

type AddTimed = (dur: number, step: Timed['step'], done?: () => void) => void;
type Pt = { x: number; y: number };

/** What the act player needs from the scene around it. */
export interface ActHost {
  scene: Phaser.Scene;
  bursts: Bursts;
  add: AddTimed;
  flash(color: number, alpha: number, ms: number): void;
  /** Holds the stage still for `ms` (hit stop). */
  hold(ms: number): void;
  /** Hit stop tiers, slow motion, directional shake, letterbox, vignette (ANIM-004). */
  screen: ScreenFx;
  /** Every unit's ghost pictures now (the colour split copies them: pictures, or puppets' parts). */
  ghosts(): Ghost[];
}

const TINT_DEPTH = 5;

const easeIn = (t: number) => t * t;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);
const fadeIO = (t: number, inn = 0.12, out = 0.25) => (t < inn ? t / inn : t > 1 - out ? (1 - t) / out : 1);

export class ActPlayer {
  constructor(private readonly h: ActHost) {}

  private get scene() {
    return this.h.scene;
  }

  /** Where on a unit (or on the screen) an act plays. */
  private spot(a: FxAnchor | null, spot: Spot | undefined, fallback: Spot): Pt {
    const w = this.scene.scale.width;
    const hgt = this.scene.scale.height;
    const s = spot ?? fallback;
    if (!a) {
      const y = { sky: -40, above: 0.2, head: 0.28, chest: 0.5, middle: 0.62, feet: 0.84, front: 0.5, behind: 0.5, center: 0.5, mouth: 0.3, tail: 0.5 }[s];
      return { x: w / 2, y: s === 'sky' ? y : hgt * y };
    }
    const dir = a.side === 'ally' ? 1 : -1;
    switch (s) {
      case 'chest':
        return a.chest;
      case 'feet':
        return a.feet;
      case 'head':
        return a.head;
      // A puppet's own mouth / tail (decision 050); a picture's head / back.
      case 'mouth':
        return a.part?.('mouth') ?? a.head;
      case 'tail':
        return a.part?.('tail') ?? { x: a.chest.x - dir * a.width * 0.45, y: a.chest.y };
      case 'above':
        return { x: a.feet.x, y: a.feet.y - a.height * 1.08 };
      case 'front':
        return { x: a.chest.x + dir * a.width * 0.55, y: a.chest.y };
      case 'behind':
        return { x: a.chest.x - dir * a.width * 0.55, y: a.chest.y };
      case 'sky':
        return { x: a.feet.x, y: -40 };
      case 'middle':
        return { x: w / 2, y: a.feet.y };
      case 'center':
        return { x: w / 2, y: hgt * 0.5 };
    }
  }

  play(cue: ScriptCue, anchors: ReadonlyMap<string, FxAnchor>) {
    const a = cue.unit ? (anchors.get(cue.unit) ?? null) : null;
    if (cue.unit && !a) return;
    const from = cue.from ? (anchors.get(cue.from) ?? null) : null;
    const act = cue.act;
    const mirror = (from ?? a)?.side === 'enemy';
    switch (act.do) {
      case 'burst': {
        const at = act.spot ? this.spot(a, act.spot, 'chest') : null;
        const tint = (act.tint as number[] | undefined) ?? null;
        if (act.ref.startsWith('fx_')) return this.strip({ do: 'strip', at: 0, who: 'actor', img: act.ref }, a, cue.look.glow, mirror);
        if (act.ref.startsWith('fxs_')) return this.sprite(act.ref, at ?? this.spot(a, undefined, 'chest'), a?.width ?? 120, tint?.[0] ?? null);
        this.h.bursts.play(act.ref, at ?? a ?? this.spot(null, 'center', 'center'), { mirror, tint, more: act.more ?? 1 });
        return;
      }
      case 'strip':
        return this.strip(act, a, cue.look.glow, mirror);
      case 'prop':
        return playProp(this.h, (x, sp, fb) => this.spot(x, sp, fb), act, a, from, cue.look.glow);
      case 'beam':
        if (from && a) beam(this.h, from, a, act.color as number, act.width ?? 26, act.dur, !!act.through);
        return;
      case 'ribbon':
        return playRibbon(this.h, act, a, from);
      case 'tether':
        if (from && a) tether(this.h, from, a, act.color as number, act.wave ?? 14, act.dur, act.ref ?? null);
        return;
      case 'cone':
        if (from && a) cone(this.h, from, a, act.color as number, act.width ?? 150, act.dur, act.ref ?? null);
        return;
      case 'decal':
        return this.decal(act, a);
      case 'marker': {
        const p = this.spot(a, 'feet', 'feet');
        const size = (a?.width ?? 140) * (act.size ?? 1.1);
        const img = this.scene.add.image(p.x, p.y, SHADOW_KEY).setDepth(GROUND_DEPTH).setTint(0x1a1020);
        this.h.add(act.dur, (t) => img.setDisplaySize(size * (0.3 + 0.7 * easeOut(t)), size * 0.32 * (0.3 + 0.7 * easeOut(t))).setAlpha(0.55 * Math.min(1, t * 3)), () => img.destroy());
        return;
      }
      case 'trail': {
        const ghostsOf = a?.ghosts;
        if (!ghostsOf) return;
        const every = (act.every ?? 50) / 1000;
        let since = every;
        const color = (act.color as number | undefined) ?? null;
        this.h.add(act.dur, (_t, _g, dt) => {
          since += dt;
          if (since < every) return;
          since = 0;
          const made = ghostImages(this.scene, ghostsOf()).map((g) => g.setAlpha(0.42));
          if (color !== null) for (const g of made) g.setTintFill(color).setBlendMode(Phaser.BlendModes.ADD);
          if (made.length > 0) this.h.add(320, (t) => made.forEach((g) => g.setAlpha(0.42 * (1 - t))), () => made.forEach((g) => g.destroy()));
        });
        return;
      }
      case 'tint':
        return this.tint(act, a);
      case 'punch': {
        const cam = this.scene.cameras.main;
        const p = this.spot(a, 'chest', 'center');
        const w = this.scene.scale.width;
        const hgt = this.scene.scale.height;
        this.h.add(act.dur, (t) => {
          const u = t < 0.3 ? easeOut(t / 0.3) : 1 - easeIn((t - 0.3) / 0.7);
          cam.setZoom(1 + (act.zoom - 1) * u);
          cam.centerOn(w / 2 + (p.x - w / 2) * 0.35 * u, hgt / 2 + (p.y - hgt / 2) * 0.35 * u);
        }, () => {
          cam.setZoom(1);
          cam.centerOn(w / 2, hgt / 2);
        });
        return;
      }
      case 'stop':
        this.h.screen.hitStop(act.tier ?? act.dur);
        return;
      case 'slowmo':
        this.h.screen.slowMo(act.scale, act.dur);
        return;
      case 'letterbox':
        this.h.screen.letterbox(act.on, act.dur);
        return;
      case 'vignette':
        this.h.screen.vignette(act.color as number, act.alpha, act.dur);
        return;
      case 'split': {
        const field = this.h.ghosts();
        for (const [dx, color] of [[-5, 0xff3a6a], [5, 0x3ae0ff]] as const) {
          const made = ghostImages(this.scene, field, dx, 0.2).map((g) => g.setBlendMode(Phaser.BlendModes.ADD).setTintFill(color).setAlpha(0.5));
          if (made.length > 0) this.h.add(act.dur, (t) => made.forEach((g) => g.setAlpha(0.5 * (1 - t))), () => made.forEach((g) => g.destroy()));
        }
        return;
      }
      case 'shake':
        if (act.dir) {
          this.h.screen.shake(act.amount, act.dur, act.dir);
          return;
        }
        this.scene.cameras.main.shake(act.dur, act.amount / Math.max(1, this.scene.scale.width));
        return;
      case 'flash':
        this.h.flash(act.color as number, act.alpha, act.dur);
        return;
      case 'cutin':
        if (from ?? a) playCutin(this.scene, this.h.add, (from ?? a)!, act.color as number, act.dur, act.style, cue.title ?? null);
        return;
      case 'sound':
      case 'move':
      case 'pose':
      case 'glow':
        return;
    }
  }

  /** A single sprite of the manifest popping and fading (an `fxs_…` used on its own). */
  private sprite(key: string, p: Pt, size: number, tint: number | null) {
    const img = this.scene.add.image(p.x, p.y, this.scene.textures.exists(key) ? key : shapeKey('star')).setDepth(AIR_DEPTH);
    if (tint !== null) img.setTint(tint);
    const s = size * 0.4;
    this.h.add(520, (t) => img.setDisplaySize(s * (0.4 + 0.8 * easeOut(Math.min(1, t * 3))), s * (0.4 + 0.8 * easeOut(Math.min(1, t * 3)))).setAlpha(fadeIO(t, 0.1, 0.4)).setY(p.y - 30 * t), () => img.destroy());
  }

  /** A strip `fx_…` played on a unit (a frame range, the last frame held); a soft glow while its file is missing. */
  private strip(act: Extract<Act, { do: 'strip' }>, a: FxAnchor | null, glow: number, mirror: boolean) {
    const p = this.spot(a, act.spot, 'chest');
    const width = (a?.width ?? this.scene.scale.height * 0.4) * (act.size ?? 1.3);
    // `stand`: the strip's bottom edge on the unit's ground line (a wave rising from the ground), not its centre on the spot.
    const y = (act.stand && a ? a.feet.y : p.y) + (act.y ?? 0);
    const depth = act.under ? GROUND_DEPTH + 1 : AIR_DEPTH;
    const alpha = act.alpha ?? 1;
    if (!this.scene.textures.exists(act.img)) {
      const g = this.scene.add.image(p.x, y, shapeKey('glow')).setDepth(depth).setBlendMode(Phaser.BlendModes.ADD).setTint((act.tint as number | undefined) ?? glow);
      this.h.add((act.dur ?? 330) + (act.hold ?? 0), (t) => g.setDisplaySize(width * (0.4 + 0.6 * t), width * (0.4 + 0.6 * t)).setAlpha(alpha * (1 - t)), () => g.destroy());
      return;
    }
    const frames = this.scene.textures.get(act.img).frameTotal - 1;
    const [f0, f1] = act.frames ? [Math.min(act.frames[0], frames - 1), Math.min(act.frames[1], frames - 1)] : [0, Math.max(0, frames - 1)];
    const playMs = act.dur ?? (f1 - f0 + 1) * 85;
    const s = this.scene.add.sprite(p.x, y, act.img, f0).setDepth(depth).setAlpha(alpha).setOrigin(0.5, act.stand ? 1 : 0.5);
    s.setDisplaySize(width, width * (s.height / Math.max(1, s.width)));
    if (act.tint !== undefined) s.setTint(act.tint as number);
    s.setFlipX(mirror !== !!act.flip);
    const hold = act.hold ?? 0;
    const total = playMs + hold;
    const count = f1 - f0 + 1;
    this.h.add(total, (t) => {
      const ms = t * total;
      s.setFrame(f0 + Math.min(count - 1, Math.floor((ms / Math.max(1, playMs)) * count)));
      // Fades over the end of the hold (or of the play, without one).
      const fadeFrom = hold > 0 ? playMs + hold * 0.6 : playMs * 0.7;
      s.setAlpha(ms > fadeFrom ? alpha * (1 - (ms - fadeFrom) / Math.max(1, total - fadeFrom)) : alpha);
    }, () => s.destroy());
  }

  private decal(act: Extract<Act, { do: 'decal' }>, a: FxAnchor | null) {
    const p = this.spot(a, 'feet', 'feet');
    const size = (a?.width ?? this.scene.scale.width * 0.3) * (act.size ?? 1.4);
    const fromStrip = act.img && this.scene.textures.exists(act.img);
    const img = fromStrip
      ? this.scene.add.image(p.x, p.y, act.img!, Math.min(act.frame ?? 2, this.scene.textures.get(act.img!).frameTotal - 2))
      : this.scene.add.image(p.x, p.y, decalKey(act.kind ?? 'puddle'));
    img.setDepth(GROUND_DEPTH);
    if (act.color !== undefined) img.setTint(act.color as number);
    else if (!fromStrip) img.setTint(act.kind === 'scorch' ? 0x2a1a12 : act.kind === 'crack' ? 0x5a3e28 : 0x8fd8ff);
    const flat = fromStrip ? 0.55 : 0.36;
    this.h.add(act.dur, (t) => img.setDisplaySize(size * (0.6 + 0.4 * easeOut(Math.min(1, t * 4))), size * flat * (0.6 + 0.4 * easeOut(Math.min(1, t * 4)))).setAlpha(fadeIO(t, 0.08, 0.45) * 0.85), () => img.destroy());
  }

  private tint(act: Extract<Act, { do: 'tint' }>, a: FxAnchor | null) {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const color = act.color as number;
    const fade = Math.min(0.45, (act.fade ?? 200) / Math.max(1, act.dur));
    const obj: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle = act.focus && a
      ? this.scene.add.image(a.chest.x, a.chest.y, VIGNETTE_KEY).setDisplaySize(W * 2.4, W * 2.4).setTint(color)
      : this.scene.add.rectangle(0, 0, W, H, color, 1).setOrigin(0);
    obj.setDepth(act.focus ? AIR_DEPTH - 20 : TINT_DEPTH).setAlpha(0);
    this.h.add(act.dur, (t) => obj.setAlpha(act.alpha * fadeIO(t, fade, fade)), () => obj.destroy());
  }
}
