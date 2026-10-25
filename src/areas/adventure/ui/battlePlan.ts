// What a battle step shows, in time (decision 042): for every beat the caster's magic circle and chant, the gathering of power, the
// shot that travels, what lands where it lands; for every reaction what plays on the unit (tears and stars of a hit, the swish and
// afterimage of a miss, the arrows of a buff or a curse, the puff of a knock-out); a new battle's teleport lights; the sounds, one per
// kind and moment. Each cue is plain data with its time on the step's clock: the battle scene (scene/battle/) plays it, battle_fx.json
// says what each looks like. Presentation only. Pure.
import type { BattleLook, ReactionFx } from '../../../../content/schemas/adventure/battleFx';
import { BATTLE_FX } from '../logic/config/content';
import { ENTER_MS, type PlayingStep } from './battleFxView';
import { lookOf } from './motionProfiles';

/** The sounds of a battle (manifest audio ids; a missing file is silence). */
export type BattleSound = 'adv_battle_start' | 'adv_cast' | 'adv_hit' | 'adv_crit' | 'adv_miss' | 'adv_heal' | 'adv_ko';

export type FxCue = { at: number } & (
  | { kind: 'sound'; sound: BattleSound }
  /** A fighter comes in out of a column of light, `delay` ms after the cue. */
  | { kind: 'teleport'; unit: string; delay: number }
  /** The magic circle under a caster for `dur` ms. */
  | { kind: 'circle'; unit: string; look: BattleLook; dur: number; big: boolean }
  /** The screen dims to `to` (an Ultimate) or back. */
  | { kind: 'dim'; to: number }
  /** Power gathering on a caster for `dur` ms. */
  | { kind: 'charge'; unit: string; look: BattleLook; dur: number; big: boolean }
  /** A shot flying from one unit to another in `dur` ms. */
  | { kind: 'shot'; from: string; to: string; look: BattleLook; dur: number }
  /** What lands on a unit: the look's bursts, stroke, ring, flash and shake (`slam`: the ground shakes under it too). */
  | { kind: 'land'; unit: string; look: BattleLook; heavy: boolean; big: boolean; slam: boolean }
  /** Named bursts played on a unit (`tint`: drawn in these colours instead of their own). */
  | { kind: 'fx'; unit: string; refs: readonly string[]; tint: readonly number[] | null }
  /** A pale copy of the unit left where it stood (it dodged). */
  | { kind: 'afterimage'; unit: string }
);

const reactionFx = (r: ReactionFx) => BATTLE_FX.reactions[r] ?? [];

/** The cues of the step `p` in time order; `sides` says on which side each unit stands, `reduce` keeps only the sounds. */
export function stepPlan(p: Readonly<PlayingStep>, sides: ReadonlyMap<string, 'ally' | 'enemy'>, reduce: boolean): FxCue[] {
  const out: FxCue[] = [];
  const add = (c: FxCue) => out.push(c);
  const sound = (at: number, s: BattleSound) => add({ at, kind: 'sound', sound: s });
  if (p.enter) {
    sound(-ENTER_MS, 'adv_battle_start');
    if (!reduce) {
      let i = 0;
      for (const [unit, side] of sides) add({ at: -ENTER_MS, kind: 'teleport', unit, delay: (side === 'ally' ? 0 : 250) + (i++ % 4) * 80 });
    }
  }
  const reactions = p.motion.reactions;
  const near = (unit: string, kind: string, t: number) => reactions.some((r) => r.unit === unit && r.kind === kind && Math.abs(r.at - t) < 5);
  for (const b of p.motion.beats) {
    if (!b.actor) continue;
    const actor = b.actor;
    const look = lookOf(b.element, b.skillId);
    const big = b.pose === 'ultimate';
    if (b.circle) {
      sound(b.start, 'adv_cast');
      if (!reduce) add({ at: b.start, kind: 'circle', unit: actor, look, dur: b.cast - b.start + 250, big });
    }
    if (reduce) continue;
    if (big) {
      add({ at: b.start, kind: 'dim', to: 0.45 });
      add({ at: b.end, kind: 'dim', to: 0 });
    }
    if (b.pose === 'cast' || b.pose === 'support' || b.pose === 'ultimate') add({ at: b.cast, kind: 'charge', unit: actor, look, dur: Math.max(120, b.release - b.cast), big });
    if (b.pose === 'guard') add({ at: b.start, kind: 'fx', unit: actor, refs: reactionFx('guard'), tint: null });
    if (b.pose === 'stunned') add({ at: b.start, kind: 'fx', unit: actor, refs: reactionFx('stun'), tint: null });
    if (b.delivery === 'projectile') for (const to of b.targets) add({ at: b.release, kind: 'shot', from: actor, to, look, dur: Math.max(120, b.impact - b.release) });
    for (const unit of b.targets) {
      const friend = sides.get(actor) === sides.get(unit);
      if (friend || b.pose === 'support') {
        const healed = near(unit, 'heal', b.impact);
        add({ at: b.impact, kind: 'fx', unit, refs: reactionFx(healed ? 'heal' : 'aura'), tint: healed ? null : [look.glow, look.color] });
        continue;
      }
      if (near(unit, 'miss', b.impact)) continue;
      add({ at: b.impact, kind: 'land', unit, look, heavy: near(unit, 'hit-heavy', b.impact), big, slam: b.delivery === 'slam' });
    }
  }
  if (!reduce) {
    for (const r of reactions) {
      switch (r.kind) {
        case 'hit':
        case 'hit-heavy':
          add({ at: r.at, kind: 'fx', unit: r.unit, refs: [...reactionFx(r.kind === 'hit' ? 'hit' : 'heavy'), ...reactionFx('tears')], tint: null });
          break;
        case 'miss':
          add({ at: r.at, kind: 'fx', unit: r.unit, refs: reactionFx('miss'), tint: null });
          add({ at: r.at, kind: 'afterimage', unit: r.unit });
          break;
        case 'buff':
        case 'debuff':
          add({ at: r.at, kind: 'fx', unit: r.unit, refs: reactionFx(r.kind), tint: null });
          break;
        case 'ko':
          add({ at: r.at, kind: 'fx', unit: r.unit, refs: reactionFx('ko'), tint: null });
          break;
        default:
          break;
      }
    }
  }
  // One sound per kind and moment: a blow that reaches three units hits once.
  const heard = new Set<string>();
  for (const r of reactions) {
    const s: BattleSound | null = r.kind === 'hit' ? 'adv_hit' : r.kind === 'hit-heavy' ? 'adv_crit' : r.kind === 'miss' ? 'adv_miss' : r.kind === 'heal' ? 'adv_heal' : r.kind === 'ko' ? 'adv_ko' : null;
    const k = `${s}:${Math.round(r.at / 40)}`;
    if (!s || heard.has(k)) continue;
    heard.add(k);
    sound(r.at, s);
  }
  return out.sort((x, y) => x.at - y.at);
}
