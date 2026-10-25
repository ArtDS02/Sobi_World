// The named bursts of battle_fx.json played as Phaser particles (decision 042): one emitter per burst (and per variant: mirrored for a
// unit on the right, tinted in a skill's colours), made the first time it is needed and reused; playing a burst only explodes it at a
// point. The particles are drawn by the GPU in batches, so a big skill costs little.
import * as Phaser from 'phaser';
import type { BattleBurst } from '../../../../../content/schemas/adventure/battleFx';
import { BATTLE_FX } from '../../logic/config/content';
import { SHAPE_PX, shapeKey } from './fxTextures';

/** Where a burst may start on a unit. */
export interface BurstSpot {
  chest: { x: number; y: number };
  feet: { x: number; y: number };
  head: { x: number; y: number };
}

export interface BurstOptions {
  /** Played on a unit on the right: its directions are mirrored (bursts are written for a unit on the left, looking right). */
  mirror?: boolean;
  /** Drawn in these colours instead of the burst's own. */
  tint?: readonly number[] | null;
  /** More particles (a critical blow, an Ultimate). */
  more?: number;
}

type Spun = Phaser.GameObjects.Particles.Particle & { s0?: number; r0?: number; turn?: number };

export const AIR_DEPTH = 5000;

export class Bursts {
  private emitters = new Map<string, Phaser.GameObjects.Particles.ParticleEmitter>();

  constructor(private readonly scene: Phaser.Scene) {}

  private emitter(id: string, b: BattleBurst, mirror: boolean, tint: readonly number[] | null) {
    const key = `${id}|${mirror ? 'm' : ''}|${tint?.join(',') ?? ''}`;
    const have = this.emitters.get(key);
    if (have) return have;
    const k = BATTLE_FX.scale;
    const base = b.angle ?? 0;
    const angle = mirror ? 180 - base : base;
    const cone = b.cone ?? 180;
    const shrink = b.shrink ?? 0.2;
    const ring = b.shape === 'ring';
    const turnsWithFlight = b.shape === 'spark' || b.shape === 'drop' || b.shape === 'shard';
    const spread = (b.spread ?? 0) * k;
    const size = (p: Spun, t: number) => (p.s0 ?? 1) * (1 + (shrink - 1) * t);
    const em = this.scene.add.particles(0, 0, shapeKey(b.shape), {
      emitting: false,
      lifespan: { min: b.life[0], max: b.life[1] },
      speed: { min: b.speed[0] * k, max: b.speed[1] * k },
      angle: { min: angle - cone, max: angle + cone },
      gravityY: (b.gravity ?? 0) * k,
      tint: [...(tint ?? b.colors)],
      alpha: { start: b.alpha ?? 1, end: 0, ease: 'Quad.easeIn' },
      blendMode: b.add === false ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD,
      scaleX: {
        onEmit: (p?: Spun) => {
          const s = (Phaser.Math.FloatBetween(b.size[0], b.size[1]) * k * 2) / SHAPE_PX;
          if (p) p.s0 = s;
          return s;
        },
        onUpdate: (p: Spun, _k: string, t: number) => size(p, t),
      },
      scaleY: { onEmit: (p?: Spun) => (p?.s0 ?? 1) * (ring ? 0.45 : 1), onUpdate: (p: Spun, _k: string, t: number) => size(p, t) * (ring ? 0.45 : 1) },
      rotate: {
        onEmit: (p?: Spun) => {
          if (!p) return 0;
          p.r0 = turnsWithFlight ? Phaser.Math.RadToDeg(Math.atan2(p.velocityY, p.velocityX)) : ring ? 0 : Phaser.Math.Between(0, 359);
          p.turn = (Phaser.Math.FloatBetween(-1, 1) * (b.spin ?? 0) * 360 * p.life) / 1000;
          return p.r0;
        },
        onUpdate: (p: Spun, _k: string, t: number) => (p.r0 ?? 0) + (p.turn ?? 0) * t,
      },
      ...(spread > 0 ? { emitZone: { type: 'random' as const, source: new Phaser.Geom.Ellipse(0, 0, spread * 2, spread * 2 * (b.flat ?? 1)), quantity: 1 } } : {}),
    });
    em.setDepth(AIR_DEPTH);
    this.emitters.set(key, em);
    return em;
  }

  /** Plays the burst `id` (a key of battle_fx.json `particles`) at a point, or at the spot of a unit it names. */
  play(id: string, at: BurstSpot | { x: number; y: number }, o: BurstOptions = {}) {
    const b = BATTLE_FX.particles[id];
    if (!b) return false;
    const spot = 'chest' in at ? at[b.at ?? 'chest'] : at;
    const fire = () => this.emitter(id, b, !!o.mirror, o.tint ?? null).explode(Math.max(1, Math.round(b.count * (o.more ?? 1))), spot.x, spot.y);
    if (b.wait) this.scene.time.delayedCall(b.wait, fire);
    else fire();
    return true;
  }

  /** Every particle still flying, for "is something still playing". */
  alive(): number {
    let n = 0;
    for (const em of this.emitters.values()) n += em.getAliveParticleCount();
    return n;
  }

  clear() {
    for (const em of this.emitters.values()) em.killAll();
  }
}
