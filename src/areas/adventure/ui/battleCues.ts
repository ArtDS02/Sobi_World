// The cues of a battle step on the stage (adventure-big-update-1 §5–§8): for every beat, the caster's magic circle with its
// chant, the wind-up, the shot that travels, what lands; for every reaction, the tears of a hit, the swish and afterimage of a miss,
// the arrows of a buff or a curse, the puff of a knock-out; a new battle's teleport lights; the sounds, one per kind and moment.
// Each cue fires once, at its time on the step's clock (battleStage.ts runs them).
import { ENTER_MS, type PlayingStep } from './battleFxView';
import type { MotionBeat, ReactionCue } from './battleMotion';
import { charge, magicCircle, teleportIn } from './fx/castFx';
import type { FxWorld, Pt } from './fx/fxEngine';
import { fromAbove, impact, slam } from './fx/impactFx';
import { lookOf } from './fx/looks';
import { aura, heal, koPuff, shield, statusArrows, stunStars, swish, tears } from './fx/supportFx';
import { projectile } from './fx/travelFx';
import { SKILL_MOTION } from './motionProfiles';

/** The sounds of a battle (manifest audio ids; a missing file is silence). */
export type BattleSound = 'adv_battle_start' | 'adv_cast' | 'adv_hit' | 'adv_crit' | 'adv_miss' | 'adv_heal' | 'adv_ko';

export interface Anchor {
  side: 'ally' | 'enemy';
  /** Feet, chest, eyes in canvas px; the body's layout height. */
  feet: Pt;
  chest: Pt;
  eyes: Pt;
  height: number;
  width: number;
  body: HTMLElement;
  img: HTMLImageElement | null;
  down: boolean;
}

export interface Cue {
  at: number;
  fire: () => void;
  done: boolean;
}


/** What the cues reach: the stage's world of effects, where each unit stands now, the sounds, reduced motion. */
export interface CueEnv {
  world(): FxWorld;
  anchors(): ReadonlyMap<string, Anchor>;
  sound?: ((key: BattleSound) => void) | undefined;
  reduceMotion(): boolean;
}

/** The cues of the step `p`, in time order. */
export function stepCues(p: Readonly<PlayingStep>, env: CueEnv): Cue[] {
  const play = (s: BattleSound) => env.sound?.(s);

  /** The cues of a step: circles, chants, wind-ups, travels, impacts and reactions, each at its time on the step's clock. */
  function cuesOf(p: Readonly<PlayingStep>): Cue[] {
    const out: Cue[] = [];
    const at = (t: number, fire: () => void) => out.push({ at: t, fire, done: false });
    const reduce = env.reduceMotion();
    if (p.enter) {
      at(-ENTER_MS, () => play('adv_battle_start'));
      if (!reduce) {
        at(-ENTER_MS, () => {
          let i = 0;
          for (const [, a] of env.anchors()) {
            teleportIn(env.world(), a.feet, a.height, a.side === 'ally' ? '#9ae6ff' : '#d9b8ff', (a.side === 'ally' ? 0 : 0.25) + (i++ % 4) * 0.08);
          }
        });
      }
    }
    for (const b of p.motion.beats) {
      if (!b.actor) continue;
      const actor = b.actor;
      const look = lookOf(b.element);
      const ult = b.pose === 'ultimate';
      if (b.circle) {
        at(b.start, () => play('adv_cast'));
        if (!reduce)
          at(b.start, () => {
            const a = env.anchors().get(actor);
            if (a) magicCircle(env.world(), a.feet, a.height, look, (b.cast - b.start) / 1000 + 0.25, ult);
            if (ult) env.world().dimTo = 0.45;
          });
      }
      if (reduce) continue;
      if (b.pose === 'cast' || b.pose === 'support' || b.pose === 'ultimate')
        at(b.cast, () => {
          const a = env.anchors().get(actor);
          if (a) charge(env.world(), a.chest, look, Math.max(0.12, (b.release - b.cast) / 1000), ult);
        });
      if (b.pose === 'guard')
        at(b.start, () => {
          const a = env.anchors().get(actor);
          if (a) shield(env.world(), a.chest, a.height, a.side === 'ally' ? 1 : -1, Math.max(0.4, (b.end - b.start) / 1000 + 0.3));
        });
      if (b.pose === 'stunned')
        at(b.start, () => {
          const a = env.anchors().get(actor);
          if (a) stunStars(env.world(), { x: a.feet.x, y: a.feet.y - a.height * 0.95 }, Math.max(0.5, (b.end - b.start) / 1000));
        });
      if (b.delivery === 'projectile')
        at(b.release, () => {
          const a = env.anchors().get(actor);
          for (const t of b.targets) {
            const to = env.anchors().get(t);
            if (a && to) projectile(env.world(), a.chest, to.chest, Math.max(0.12, (b.impact - b.release) / 1000), b.element, b.skillId ? (SKILL_MOTION[b.skillId]?.shape ?? null) : null);
          }
        });
      at(b.impact, () => land(b));
      if (ult) at(b.end, () => (env.world().dimTo = 0));
    }
    for (const r of p.motion.reactions) at(r.at, () => react(r));
    // One sound per kind and moment: a blow that reaches three units hits once.
    const heard = new Set<string>();
    for (const r of p.motion.reactions) {
      const s: BattleSound | null = r.kind === 'hit' ? 'adv_hit' : r.kind === 'hit-heavy' ? 'adv_crit' : r.kind === 'miss' ? 'adv_miss' : r.kind === 'heal' ? 'adv_heal' : r.kind === 'ko' ? 'adv_ko' : null;
      const k = `${s}:${Math.round(r.at / 40)}`;
      if (!s || heard.has(k)) continue;
      heard.add(k);
      at(r.at, () => play(s));
    }
    return out.sort((x, y) => x.at - y.at);
  }

  /** What the beat's effect does where it lands. */
  function land(b: MotionBeat) {
    const big = b.pose === 'ultimate';
    const own = b.skillId ? (SKILL_MOTION[b.skillId]?.shape ?? null) : null;
    const reactions = p.motion.reactions;
    b.targets.forEach((t, i) => {
      const a = env.anchors().get(t);
      if (!a) return;
      const heavy = reactions.some((r) => r.unit === t && r.kind === 'hit-heavy' && Math.abs(r.at - b.impact) < 5);
      const missed = reactions.some((r) => r.unit === t && r.kind === 'miss' && Math.abs(r.at - b.impact) < 5);
      const friend = env.anchors().get(b.actor ?? '')?.side === a.side;
      if (friend || b.pose === 'support') {
        const healed = reactions.some((r) => r.unit === t && r.kind === 'heal' && Math.abs(r.at - b.impact) < 5);
        if (healed) heal(env.world(), a.feet, a.height);
        else aura(env.world(), a.feet, a.height, b.element ? lookOf(b.element) : lookOf(null));
        return;
      }
      if (missed) return;
      if (b.delivery === 'slam') slam(env.world(), a.feet, b.element);
      if (b.delivery === 'burst' && b.targets.length > 1) fromAbove(env.world(), a.feet, a.height, b.element, i * 0.05);
      impact(env.world(), a.chest, a.feet, b.element, heavy, big, own);
    });
  }

  function react(r: ReactionCue) {
    const a = env.anchors().get(r.unit);
    if (!a || env.reduceMotion()) return;
    const facing = a.side === 'ally' ? 1 : -1;
    switch (r.kind) {
      case 'hit':
      case 'hit-heavy':
        tears(env.world(), a.eyes, facing, r.kind === 'hit-heavy');
        break;
      case 'miss':
        swish(env.world(), a.chest, facing);
        afterimage(a);
        break;
      case 'buff':
      case 'debuff':
        statusArrows(env.world(), a.feet, a.height, r.kind === 'buff');
        break;
      case 'ko':
        koPuff(env.world(), a.feet, a.height);
        break;
      default:
        break;
    }
  }

  /** A pale copy of the picture left where a unit stood when it dodged. */
  function afterimage(a: Anchor) {
    const img = a.img;
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const w = a.width;
    const h = a.height;
    const x = a.feet.x - w / 2;
    const y = a.feet.y - h;
    const flip = a.side === 'ally';
    env.world().shapes.push({
      wait: 0,
      dur: 0.38,
      age: 0,
      add: false,
      draw(c, t) {
        c.globalAlpha = 0.45 * (1 - t);
        c.translate(x + w / 2, y);
        if (flip) c.scale(-1, 1);
        c.filter = 'brightness(1.8) saturate(0.4)';
        try {
          c.drawImage(img, -w / 2, 0, w, h);
        } catch {
          // A picture that cannot be drawn leaves no afterimage.
        }
        c.filter = 'none';
      },
    });
  }
  return cuesOf(p);
}
