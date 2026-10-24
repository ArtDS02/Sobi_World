import { describe, expect, it } from 'vitest';
import { deliveryOf, stepMotion } from '../../src/areas/adventure/ui/battleMotion';
import { BODY, CIRCLE_MS, ENEMY_BODY, FAST_SHARE, STEP_MAX_MS, TIMING, bodyOf, vfxArt } from '../../src/areas/adventure/ui/motionProfiles';
import { ENEMY_LIST } from '../../src/areas/adventure/logic/config/content';
import type { BattleEvent, BattleState } from '../../src/systems/combat/types';

const ally = 'sobi_farm:p1';
const foe = 'enemy_mossling#1';
const battle = { combatants: [{ id: ally, side: 'ally' }, { id: foe, side: 'enemy' }] } as unknown as BattleState;
const hit = (actor: string, target: string, extra: Partial<Extract<BattleEvent, { type: 'damage' }>> = {}): BattleEvent => ({ type: 'damage', actor, target, amount: 50, crit: false, mult: 1, skillId: null, absorbed: 0, element: 'NATURE', ...extra });

describe('battle motion (GĐ14 vertical slice)', () => {
  it('a skill moves its user by category and target count; the slice skill has its own', () => {
    expect(deliveryOf(null, false)).toEqual({ pose: 'attack', delivery: 'melee' });
    expect(deliveryOf('skill_mm_poison_thorn', false)).toEqual({ pose: 'cast', delivery: 'projectile' });
    expect(deliveryOf('skill_mm_binding_roots', false)).toEqual({ pose: 'cast', delivery: 'burst' });
    expect(deliveryOf('skill_mm_sprout', false)).toEqual({ pose: 'support', delivery: 'aura' });
    expect(deliveryOf('skill_e_seal_quake', false)).toEqual({ pose: 'attack', delivery: 'slam' });
    expect(deliveryOf('skill_ult_nh', true).pose).toBe('ultimate');
    expect(deliveryOf('no_such_skill', false)).toEqual({ pose: 'cast', delivery: 'burst' });
  });

  it('one beat per turn, played in order; the numbers land on the impact, not before', () => {
    const log: BattleEvent[] = [
      { type: 'turn', actor: ally },
      { type: 'use', actor: ally, skillId: 'skill_mm_poison_thorn', ultimate: false },
      hit(ally, foe, { skillId: 'skill_mm_poison_thorn' }),
      { type: 'status', actor: ally, target: foe, status: 'poison', skillId: 'skill_mm_poison_thorn' },
      { type: 'turn', actor: foe },
      { type: 'use', actor: foe, skillId: null, ultimate: false },
      hit(foe, ally, { crit: true }),
    ];
    const m = stepMotion(battle, log);
    expect(m.beats.map((b) => [b.actor, b.pose, b.delivery, b.element])).toEqual([
      [ally, 'cast', 'projectile', 'NATURE'],
      [foe, 'attack', 'melee', 'NATURE'],
    ]);
    const [a, b] = m.beats;
    // A skill is cast inside its magic circle first; the plain attack has none (adventure-big-update-1 §6).
    expect(a!.circle).toBe(true);
    expect(a!.cast - a!.start).toBe(CIRCLE_MS.skill);
    expect(b!.circle).toBe(false);
    expect(b!.cast).toBe(b!.start);
    expect(a!.impact).toBe(TIMING.projectile.impact + CIRCLE_MS.skill);
    expect(b!.start).toBeGreaterThan(a!.end);
    expect(m.eventAt[2]).toBe(a!.impact);
    expect(m.eventAt[1]).toBe(a!.start);
    expect(m.eventAt[6]).toBe(b!.impact);
    expect(m.reactions).toEqual([
      { unit: foe, kind: 'hit', at: a!.impact },
      { unit: foe, kind: 'debuff', at: a!.impact },
      { unit: ally, kind: 'hit-heavy', at: b!.impact },
    ]);
    expect(m.total).toBe(b!.end);
  });

  it('a knock-out follows its blow; guard and a lost turn are beats with no effect', () => {
    const m = stepMotion(battle, [
      { type: 'turn', actor: ally },
      { type: 'guard', actor: ally },
      { type: 'turn', actor: foe },
      { type: 'skip', actor: foe, reason: 'stun' },
    ] as BattleEvent[]);
    expect(m.beats.map((b) => b.pose)).toEqual(['guard', 'stunned']);
    expect(m.beats.every((b) => b.delivery === null)).toBe(true);
    const blow: BattleEvent[] = [{ type: 'turn', actor: ally }, { type: 'use', actor: ally, skillId: null, ultimate: false }, hit(ally, foe), { type: 'defeat', target: foe }];
    const ko = stepMotion(battle, blow);
    const r = ko.reactions.find((x) => x.kind === 'ko')!;
    expect(r.at).toBeGreaterThan(ko.beats[0]!.impact);
  });

  it('an item is a support beat; damage over time alone is a quiet beat', () => {
    const potion: BattleEvent[] = [{ type: 'turn', actor: ally }, { type: 'heal', actor: ally, target: ally, amount: 30, skillId: null }];
    const item = stepMotion(battle, potion);
    expect(item.beats[0]).toMatchObject({ pose: 'support', delivery: 'aura', targets: [ally] });
    const dot: BattleEvent[] = [{ type: 'tick', target: foe, status: 'poison', amount: 9 }];
    const tick = stepMotion(battle, dot);
    expect(tick.beats[0]).toMatchObject({ actor: null, pose: null, delivery: null });
    expect(tick.reactions).toEqual([{ unit: foe, kind: 'hit', at: 0 }]);
  });

  it('a long step is squeezed under the cap, x2 plays faster, nothing plays with no battle', () => {
    const many: BattleEvent[] = Array.from({ length: 8 }, (_, i): BattleEvent[] => [
      { type: 'turn', actor: i % 2 ? foe : ally },
      { type: 'use', actor: i % 2 ? foe : ally, skillId: 'skill_mm_poison_thorn', ultimate: false },
      hit(i % 2 ? foe : ally, i % 2 ? ally : foe),
    ]).flat();
    const slow = stepMotion(battle, many);
    expect(slow.beats).toHaveLength(8);
    expect(slow.total).toBeLessThanOrEqual(STEP_MAX_MS + 1e-6);
    expect(stepMotion(battle, many, true).total).toBeCloseTo(slow.total * FAST_SHARE);
    expect(stepMotion(null, many).beats).toEqual([]);
    expect(stepMotion(battle, []).total).toBe(0);
  });

  it('every enemy has a body plan; fish swim; effect art falls back from the skill to the element', () => {
    for (const e of ENEMY_LIST) expect(ENEMY_BODY[e.id], e.id).toBeDefined();
    expect(bodyOf('sobi_aquarium:f1')).toBe('aquatic');
    expect(bodyOf(ally)).toBe('quadruped');
    expect(bodyOf('enemy_cliff_hawk#2')).toBe('flyer');
    expect(BODY[bodyOf('enemy_unknown#1')]).toBe(BODY.quadruped);
    expect(vfxArt('skill_mm_poison_thorn', 'NATURE', 'projectile')).toEqual(['fx_skill_mm_poison_thorn_projectile', 'fx_adv_nature_projectile']);
    expect(vfxArt(null, null, 'impact')).toEqual([]);
  });
});
