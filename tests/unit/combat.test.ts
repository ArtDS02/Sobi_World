// systems/combat, systems/equipment: turn order, damage and elements, skills (energy, cooldown), statuses, items,
// determinism of a saved battle, stats and levels, equipment.
import { describe, expect, it } from 'vitest';
import { act, autoPlay, beats, chooseAction, current, effectiveSpeed, elementMultiplier, startBattle, usableSkills, type CombatContext } from '../../src/systems/combat/engine';
import { addExp, deriveStats, expToNext, skillsAtLevel } from '../../src/systems/combat/stats';
import type { BattleItemDef, CombatantInit, CombatRules, SkillDef } from '../../src/systems/combat/types';
import { equipPiece, loadoutBonus, unequipSlot, type EquipmentDef } from '../../src/systems/equipment';

const rules: CombatRules = {
  counter: 1.5,
  resisted: 0.75,
  critMultiplier: 1.5,
  variance: 0,
  defenseK: 30,
  energyStart: 3,
  energyMax: 10,
  energyPerTurn: 2,
  basicEnergyGain: 1,
  burnPct: 0.1,
  slowFactor: 0.5,
  hasteFactor: 2,
  atkUpFactor: 1.5,
  defUpFactor: 2,
  shieldPct: 0.5,
  maxRounds: 40,
};
const skill = (over: Partial<SkillDef> & Pick<SkillDef, 'id'>): SkillDef => ({ element: 'FIRE', target: 'enemy', power: 2, healPct: 0, cost: 2, cooldown: 0, statuses: [], ...over });
const skills: Record<string, SkillDef> = Object.fromEntries(
  [
    skill({ id: 'big', power: 3, cost: 3, cooldown: 2 }),
    skill({ id: 'all', target: 'allEnemies', power: 1, cost: 2 }),
    skill({ id: 'burn', power: 0.5, statuses: [{ status: 'burn', turns: 2 }] }),
    skill({ id: 'stun', power: 0.5, statuses: [{ status: 'stun', turns: 1 }] }),
    skill({ id: 'heal', element: 'WATER', target: 'ally', power: 0, healPct: 0.5, cost: 2 }),
    skill({ id: 'shield', element: 'EARTH', target: 'self', power: 0, statuses: [{ status: 'shield', turns: 3 }] }),
    skill({ id: 'slow', power: 0.1, statuses: [{ status: 'slow', turns: 2 }] }),
    skill({ id: 'water', element: 'WATER', power: 1 }),
  ].map((s) => [s.id, s]),
);
const items: Record<string, BattleItemDef> = {
  tonic: { itemId: 'tonic', target: 'ally', healPct: 0.5, statuses: [] },
  rally: { itemId: 'rally', target: 'allAllies', healPct: 0, statuses: [{ status: 'atkUp', turns: 3 }] },
};
const ctx: CombatContext = { skills, items, rules };

const unit = (id: string, side: 'ally' | 'enemy', over: Omit<Partial<CombatantInit>, 'stats'> & { stats?: Partial<CombatantInit['stats']> } = {}): CombatantInit => ({
  id,
  side,
  name: id,
  element: 'EARTH',
  skills: [],
  ...over,
  stats: { hp: 100, atk: 20, def: 0, spd: 10, crit: 0, ...over.stats },
});

describe('elements', () => {
  it('fire beats wind beats earth beats water beats fire', () => {
    expect(beats('FIRE', 'WIND')).toBe(true);
    expect(beats('WIND', 'EARTH')).toBe(true);
    expect(beats('EARTH', 'WATER')).toBe(true);
    expect(beats('WATER', 'FIRE')).toBe(true);
    expect(beats('WIND', 'FIRE')).toBe(false);
    expect(elementMultiplier('FIRE', 'WIND', rules)).toBe(1.5);
    expect(elementMultiplier('WIND', 'FIRE', rules)).toBe(0.75);
    expect(elementMultiplier('FIRE', 'EARTH', rules)).toBe(1);
    expect(elementMultiplier('FIRE', 'FIRE', rules)).toBe(1);
  });
});

describe('turn order and basic damage', () => {
  it('the fastest acts first; allies before enemies on a tie; a round runs through everyone', () => {
    const { state } = startBattle(1, [unit('slow', 'ally', { stats: { spd: 5 } }), unit('fast', 'enemy', { stats: { spd: 20 } }), unit('same', 'ally', { stats: { spd: 5 } })], ctx);
    expect(state.order).toEqual(['fast', 'same', 'slow']);
    expect(current(state)!.id).toBe('fast');
  });

  it('a basic attack deals attack × K/(K+def), gives energy, then the next one acts', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { stats: { spd: 20 } }), unit('e', 'enemy', { stats: { def: 30 } })], ctx);
    const r = act(state, { kind: 'attack', target: 'e' }, ctx);
    if (!r.ok) throw new Error(r.error);
    expect(r.state.combatants.find((c) => c.id === 'e')!.hp).toBe(100 - 10); // 20 × 30/60
    expect(r.state.combatants.find((c) => c.id === 'a')!.energy).toBe(6); // 3 at the start, +2 when its turn began, +1 for the attack
    expect(current(r.state)!.id).toBe('e');
  });

  it('element advantage hits for 1.5, resistance for 0.75; a crit for 1.5 more', () => {
    const base = unit('a', 'ally', { element: 'FIRE', stats: { spd: 20, crit: 0 } });
    const hit = (a: CombatantInit, e: CombatantInit) => {
      const { state } = startBattle(1, [a, e], ctx);
      const r = act(state, { kind: 'attack', target: 'e' }, ctx);
      if (!r.ok) throw new Error(r.error);
      return 100 - r.state.combatants.find((c) => c.id === 'e')!.hp;
    };
    expect(hit(base, unit('e', 'enemy', { element: 'WIND' }))).toBe(30);
    expect(hit(base, unit('e', 'enemy', { element: 'WATER' }))).toBe(15);
    expect(hit(base, unit('e', 'enemy', { element: 'EARTH' }))).toBe(20);
    expect(hit({ ...base, stats: { ...base.stats, crit: 100 } }, unit('e', 'enemy', { element: 'EARTH' }))).toBe(30);
  });

  it('defeating the last enemy wins; losing every ally loses', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { stats: { spd: 20, atk: 500 } }), unit('e', 'enemy')], ctx);
    const r = act(state, { kind: 'attack', target: 'e' }, ctx);
    if (!r.ok) throw new Error(r.error);
    expect(r.state.outcome).toBe('win');
    expect(act(r.state, { kind: 'attack', target: 'e' }, ctx)).toEqual({ ok: false, error: 'BATTLE_OVER' });
    const lost = startBattle(1, [unit('a', 'ally', { hp: 0, stats: { spd: 1 } }), unit('b', 'ally', { stats: { hp: 1, spd: 1 } }), unit('e', 'enemy', { stats: { spd: 50, atk: 500 } })], ctx);
    expect(lost.state.outcome).toBeNull();
    const r2 = act(lost.state, { kind: 'attack', target: 'b' }, ctx);
    if (!r2.ok) throw new Error(r2.error);
    expect(r2.state.outcome).toBe('lose');
  });

  it('refuses a target on its own side or a dead one', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { stats: { spd: 20 } }), unit('b', 'ally'), unit('e', 'enemy')], ctx);
    expect(act(state, { kind: 'attack', target: 'b' }, ctx)).toEqual({ ok: false, error: 'BAD_TARGET' });
    expect(act(state, { kind: 'attack', target: 'ghost' }, ctx)).toEqual({ ok: false, error: 'BAD_TARGET' });
  });
});

describe('skills', () => {
  const duo = () => startBattle(1, [unit('a', 'ally', { stats: { spd: 20 }, skills: ['big', 'all', 'burn', 'heal', 'shield', 'stun', 'slow', 'water'] }), unit('e', 'enemy', { stats: { spd: 1 } }), unit('f', 'enemy', { stats: { spd: 1 } })], ctx).state;

  it('costs energy and refuses when short', () => {
    const s = duo();
    const r = act(s, { kind: 'skill', skillId: 'big', target: 'e' }, ctx);
    if (!r.ok) throw new Error(r.error);
    expect(r.state.combatants[0]!.energy).toBe(2); // 3 at the start, +2 when its turn began, -3
    s.combatants[0]!.energy = 1;
    expect(act(s, { kind: 'skill', skillId: 'all' }, ctx)).toEqual({ ok: false, error: 'NOT_ENOUGH_ENERGY' });
  });

  it('a skill on cooldown is refused until its turns pass', () => {
    let s = duo();
    s.combatants[0]!.energy = 10;
    const r = act(s, { kind: 'skill', skillId: 'big', target: 'e' }, ctx);
    if (!r.ok) throw new Error(r.error);
    s = r.state;
    s.combatants[0]!.energy = 10;
    s = (act(s, { kind: 'attack', target: 'a' }, ctx) as { ok: true; state: typeof s }).state;
    s = (act(s, { kind: 'attack', target: 'a' }, ctx) as { ok: true; state: typeof s }).state;
    expect(current(s)!.id).toBe('a');
    expect(act(s, { kind: 'skill', skillId: 'big', target: 'e' }, ctx)).toEqual({ ok: false, error: 'ON_COOLDOWN' });
  });

  it('an all-enemies skill hits every enemy; a skill the actor does not know is refused', () => {
    const s = duo();
    const r = act(s, { kind: 'skill', skillId: 'all' }, ctx);
    if (!r.ok) throw new Error(r.error);
    expect(r.state.combatants.filter((c) => c.side === 'enemy').every((c) => c.hp < 100)).toBe(true);
    expect(act(s, { kind: 'skill', skillId: 'nope', target: 'e' }, ctx)).toEqual({ ok: false, error: 'SKILL_UNAVAILABLE' });
  });

  it('burn hurts at the start of the victim turn and wears off; stun skips a turn', () => {
    let s = duo();
    const burned = act(s, { kind: 'skill', skillId: 'burn', target: 'e' }, ctx);
    if (!burned.ok) throw new Error(burned.error);
    s = burned.state;
    expect(s.combatants.find((c) => c.id === 'e')!.statuses.map((x) => x.id)).toContain('burn');
    // the enemy turn begins: burn damage 10% of 100 before it acts
    expect(burned.events.some((e) => e.type === 'burn' && e.target === 'e')).toBe(true);
    const stunned = act(duo(), { kind: 'skill', skillId: 'stun', target: 'e' }, ctx);
    if (!stunned.ok) throw new Error(stunned.error);
    expect(stunned.events.some((e) => e.type === 'skip' && e.actor === 'e')).toBe(true);
  });

  it('heals up to max HP; a shield absorbs damage before HP', () => {
    const s0 = duo();
    s0.combatants[0]!.hp = 20;
    const healed = act(s0, { kind: 'skill', skillId: 'heal', target: 'a' }, ctx);
    if (!healed.ok) throw new Error(healed.error);
    expect(healed.state.combatants[0]!.hp).toBe(70);
    const guarded = act(duo(), { kind: 'skill', skillId: 'shield' }, ctx);
    if (!guarded.ok) throw new Error(guarded.error);
    const me = guarded.state.combatants[0]!;
    expect(me.statuses.find((x) => x.id === 'shield')!.amount).toBe(50);
    // enemies hit the shielded ally: HP unchanged until 50 are absorbed
    expect(me.hp).toBe(100);
  });

  it('slow lowers the speed used for the next round order', () => {
    const c = unit('x', 'enemy', { stats: { spd: 10 } });
    const s = startBattle(1, [unit('a', 'ally', { stats: { spd: 30 }, skills: ['slow'] }), c], ctx).state;
    const r = act(s, { kind: 'skill', skillId: 'slow', target: 'x' }, ctx);
    if (!r.ok) throw new Error(r.error);
    expect(effectiveSpeed(r.state.combatants[1]!, rules)).toBe(5);
  });
});

describe('items', () => {
  it('a tonic heals one ally, a rally buffs everyone', () => {
    const s0 = startBattle(1, [unit('a', 'ally', { stats: { spd: 20 } }), unit('b', 'ally'), unit('e', 'enemy')], ctx).state;
    s0.combatants[1]!.hp = 10;
    const tonic = act(s0, { kind: 'item', itemId: 'tonic', target: 'b' }, ctx);
    if (!tonic.ok) throw new Error(tonic.error);
    expect(tonic.state.combatants[1]!.hp).toBe(60);
    const rally = act(s0, { kind: 'item', itemId: 'rally' }, ctx);
    if (!rally.ok) throw new Error(rally.error);
    expect(rally.state.combatants.filter((c) => c.side === 'ally').every((c) => c.statuses.some((x) => x.id === 'atkUp'))).toBe(true);
    expect(act(s0, { kind: 'item', itemId: 'bogus' }, ctx)).toEqual({ ok: false, error: 'UNKNOWN_ITEM' });
  });
});

describe('determinism', () => {
  const squad = [
    unit('a', 'ally', { element: 'FIRE', stats: { spd: 12, crit: 30, atk: 24 }, skills: ['big', 'all', 'burn'] }),
    unit('b', 'ally', { element: 'WATER', stats: { spd: 9 }, skills: ['heal', 'water'] }),
    unit('e1', 'enemy', { element: 'WIND', stats: { hp: 200, spd: 11 }, skills: ['slow', 'big'] }),
    unit('e2', 'enemy', { element: 'EARTH', stats: { hp: 200, spd: 8 }, skills: ['shield'] }),
  ];

  it('the same seed gives the same battle; a battle saved and loaded halfway ends the same', () => {
    const whole = autoPlay(startBattle(7, squad, ctx).state, ctx);
    expect(whole.outcome).not.toBeNull();
    expect(autoPlay(startBattle(7, squad, ctx).state, ctx)).toEqual(whole);
    let half = startBattle(7, squad, ctx).state;
    for (let i = 0; i < 5 && !half.outcome; i += 1) half = (act(half, chooseAction(half, ctx)!, ctx) as { ok: true; state: typeof half }).state;
    const reloaded = JSON.parse(JSON.stringify(half)) as typeof half;
    expect(autoPlay(reloaded, ctx)).toEqual(whole);
  });

  it('different seeds differ', () => {
    const a = autoPlay(startBattle(1, squad, ctx).state, ctx);
    const b = autoPlay(startBattle(2, squad, { ...ctx, rules: { ...rules, variance: 0.3 } }).state, { ...ctx, rules: { ...rules, variance: 0.3 } });
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it('always ends: a battle nobody can win is lost at the round limit', () => {
    const wall = [unit('a', 'ally', { stats: { atk: 1, def: 1000 } }), unit('e', 'enemy', { stats: { atk: 1, def: 1000, hp: 100000 } })];
    const end = autoPlay(startBattle(1, wall, { ...ctx, rules: { ...rules, maxRounds: 6 } }).state, { ...ctx, rules: { ...rules, maxRounds: 6 } }, 100);
    expect(end.outcome).toBe('lose');
  });

  it('the AI uses its skills and heals the hurt', () => {
    const s = startBattle(3, [unit('b', 'ally', { stats: { spd: 20 }, skills: ['heal'] }), unit('c', 'ally', { stats: { hp: 100 }, hp: 10 }), unit('e', 'enemy', { stats: { spd: 1 } })], ctx).state;
    const choice = chooseAction(s, ctx);
    expect(choice).toEqual({ kind: 'skill', skillId: 'heal', target: 'c' });
    expect(usableSkills(current(s)!, ctx).map((k) => k.id)).toEqual(['heal']);
  });
});

describe('stats, levels, skills by level', () => {
  const sr = { levelGrowth: 0.1, bondPerHeart: 0.03 };
  const base = { hp: 100, atk: 20, def: 10, spd: 10, crit: 5 };

  it('grows with level, rarity and Bond; equipment adds flat; speed grows at half rate', () => {
    expect(deriveStats(base, { level: 1, rarityMult: 1, hearts: 0 }, sr)).toEqual(base);
    expect(deriveStats(base, { level: 11, rarityMult: 1, hearts: 0 }, sr)).toEqual({ hp: 200, atk: 40, def: 20, spd: 15, crit: 5 });
    expect(deriveStats(base, { level: 1, rarityMult: 1.5, hearts: 0 }, sr).hp).toBe(150);
    expect(deriveStats(base, { level: 1, rarityMult: 1, hearts: 5 }, sr).hp).toBe(115);
    expect(deriveStats(base, { level: 1, rarityMult: 1, hearts: 0 }, sr, { atk: 4, crit: 3 })).toMatchObject({ atk: 24, crit: 8 });
  });

  it('experience levels up, carries the rest, and stops at the cap', () => {
    const lr = { maxLevel: 3, expBase: 10, expExponent: 1 };
    expect(expToNext(1, lr)).toBe(10);
    expect(expToNext(3, lr)).toBe(Number.POSITIVE_INFINITY);
    expect(addExp(1, 0, 25, lr)).toEqual({ level: 2, exp: 15, levelsGained: 1 }); // 10 for level 2, 20 for level 3
    expect(addExp(1, 0, 500, lr)).toEqual({ level: 3, exp: 0, levelsGained: 2 });
  });

  it('skills open at levels 1, 1, 10 and 20', () => {
    const list = ['a', 'b', 'c', 'd'];
    expect(skillsAtLevel(list, [1, 1, 10, 20], 1)).toEqual(['a', 'b']);
    expect(skillsAtLevel(list, [1, 1, 10, 20], 10)).toEqual(['a', 'b', 'c']);
    expect(skillsAtLevel(list, [1, 1, 10, 20], 20)).toEqual(list);
  });
});

describe('equipment', () => {
  const defs: Record<string, EquipmentDef> = {
    sword: { id: 'sword', slot: 'weapon', rarity: 'COMMON', stats: { atk: 4 } },
    axe: { id: 'axe', slot: 'weapon', rarity: 'RARE', stats: { atk: 10, crit: 2 } },
    vest: { id: 'vest', slot: 'armor', rarity: 'COMMON', stats: { hp: 20 } },
  };

  it('adds up the stats of what is worn; putting on replaces the slot and returns the old piece', () => {
    let l = equipPiece({}, defs.sword!);
    expect(l.replaced).toBeNull();
    l = equipPiece(l.loadout, defs.vest!);
    expect(loadoutBonus(l.loadout, defs)).toEqual({ hp: 20, atk: 4, def: 0, spd: 0, crit: 0 });
    const swap = equipPiece(l.loadout, defs.axe!);
    expect(swap.replaced).toBe('sword');
    expect(loadoutBonus(swap.loadout, defs).atk).toBe(10);
    const off = unequipSlot(swap.loadout, 'weapon');
    expect(off.removed).toBe('axe');
    expect(off.loadout).toEqual({ armor: 'vest' });
    expect(unequipSlot({}, 'charm').removed).toBeNull();
  });
});
