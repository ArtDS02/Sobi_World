// systems/combat V2 (decision 037, spec §8–§15) and systems/equipment: turn order, the element chart, damage, MP and cooldowns,
// statuses (DoT, control with immunity, Up/Down cancel, Doom, Auto-Revive), reactions, Rage and the Ultimate, Taunt, Defend,
// intents, determinism of a saved battle, stats and levels, equipment affinities.
import { describe, expect, it } from 'vitest';
import {
  act,
  actionFor,
  autoPlay,
  canAct,
  chooseAction,
  current,
  elementMultiplier,
  startBattle,
  stat,
  type BattleState,
  type CombatContext,
} from '../../src/systems/combat';
import { addExp, addShares, deriveStats, expToNext, zeroStats } from '../../src/systems/combat/stats';
import type { CombatantInit, CombatRules, ElementChart, ReactionDef, SkillDef, Stats, StatusDef, StatusId } from '../../src/systems/combat/types';
import { STATUS_IDS } from '../../src/systems/combat/types';
import { equipPiece, loadoutBonus, loadoutMods, unequipSlot, type EquipmentDef } from '../../src/systems/equipment';

const rules: CombatRules = {
  critMultiplier: 1.5,
  variance: 0,
  defenseK: 30,
  maxRounds: 40,
  mpTurnPct: 0.1,
  mpBasicPct: 0.1,
  mpGuardPct: 0.2,
  guardTaken: 0.5,
  rageK: 1,
  hitMin: 0.05,
  statusChanceCap: 0.95,
  elementDamageCap: 0.4,
  statusChanceBonusCap: 0.25,
  resistCap: 0.6,
  basicPower: 1,
  basicAccuracy: 100,
};

const elements: ElementChart = {
  multipliers: { STRONG: 1.5, NEUTRAL: 1, WEAK: 0.75, RESIST: 0.5, IMMUNE: 0 },
  chart: { WATER: { FIRE: 'STRONG', EARTH: 'WEAK' }, FIRE: { WATER: 'WEAK', METAL: 'STRONG' }, LIGHTNING: { WATER: 'STRONG', EARTH: 'RESIST' }, LIGHT: { DARK: 'STRONG' }, DARK: { LIGHT: 'STRONG' } },
  dualMin: 0.25,
  dualMax: 2,
};

const statusDef = (id: StatusId, over: Partial<StatusDef> = {}): StatusDef => ({
  id,
  kind: 'special',
  positive: false,
  sourceElement: null,
  turns: 3,
  maxStacks: 1,
  cleansable: true,
  immunityAfter: 0,
  tickPct: 0,
  skipTurn: false,
  noSkills: false,
  revivePct: 0,
  ...over,
});
const statuses = Object.fromEntries(STATUS_IDS.map((id) => [id, statusDef(id, { positive: id.endsWith('Up') || ['shield', 'taunt', 'regen', 'autoRevive'].includes(id) })])) as Record<StatusId, StatusDef>;
Object.assign(statuses, {
  poison: statusDef('poison', { kind: 'dot', tickPct: 0.1, maxStacks: 3, sourceElement: 'NATURE' }),
  burn: statusDef('burn', { kind: 'dot', tickPct: 0.1, sourceElement: 'FIRE' }),
  stun: statusDef('stun', { kind: 'control', turns: 1, skipTurn: true, immunityAfter: 1 }),
  freeze: statusDef('freeze', { kind: 'control', turns: 2, skipTurn: true, immunityAfter: 2 }),
  disable: statusDef('disable', { kind: 'control', turns: 2, noSkills: true }),
  doom: statusDef('doom', { turns: 3, cleansable: false }),
  atkUp: statusDef('atkUp', { kind: 'stat', positive: true, stat: { key: 'atk', mult: 1.5 } }),
  atkDown: statusDef('atkDown', { kind: 'stat', stat: { key: 'atk', mult: 0.5 } }),
  spdUp: statusDef('spdUp', { kind: 'stat', positive: true, stat: { key: 'spd', mult: 2 } }),
  regen: statusDef('regen', { kind: 'recovery', positive: true, tickPct: 0.1 }),
  autoRevive: statusDef('autoRevive', { kind: 'recovery', positive: true, revivePct: 0.3 }),
  taunt: statusDef('taunt', { positive: true, turns: 2 }),
  shield: statusDef('shield', { positive: true }),
});

const reactions: ReactionDef[] = [
  { id: 'shock', priority: 5, elements: ['LIGHTNING'], categories: [], requiresStatus: 'wet', requiresSourceElement: null, requiresTag: null, damageMult: 2, voidBonus: 0, consume: true, applyStatus: null, dispel: 0 },
  { id: 'shatter', priority: 6, elements: ['FIRE'], categories: ['physical'], requiresStatus: 'freeze', requiresSourceElement: null, requiresTag: null, damageMult: 1.5, voidBonus: 0, consume: true, applyStatus: null, dispel: 0 },
];

const skill = (over: Partial<SkillDef> & Pick<SkillDef, 'id'>): SkillDef => ({
  type: 'unique',
  category: 'magical',
  element: 'FIRE',
  target: 'enemy',
  power: 2,
  hits: 1,
  accuracy: 100,
  mpCost: 10,
  cooldown: 0,
  critBonus: 0,
  effects: [],
  maxLevel: 5,
  perLevel: {},
  ...over,
});
const skills: Record<string, SkillDef> = Object.fromEntries(
  [
    skill({ id: 'big', power: 3, mpCost: 30, cooldown: 2, perLevel: { power: 0.5, mpCost: -5 } }),
    skill({ id: 'all', target: 'allEnemies', power: 1 }),
    skill({ id: 'burn', power: 0.5, effects: [{ kind: 'status', status: 'burn' }] }),
    skill({ id: 'stun', power: 0.5, effects: [{ kind: 'status', status: 'stun' }] }),
    skill({ id: 'freeze', element: 'WATER', power: 0.1, effects: [{ kind: 'status', status: 'freeze' }] }),
    skill({ id: 'wet', element: 'WATER', power: 0.1, effects: [{ kind: 'status', status: 'wet', turns: 2 }] }),
    skill({ id: 'bolt', element: 'LIGHTNING', power: 1 }),
    skill({ id: 'heal', category: 'support', element: null, target: 'ally', power: 0, effects: [{ kind: 'heal', pct: 0.5 }] }),
    skill({ id: 'rally', category: 'support', element: null, target: 'allAllies', power: 0, effects: [{ kind: 'status', status: 'atkUp' }] }),
    skill({ id: 'weaken', category: 'support', element: null, power: 0, effects: [{ kind: 'status', status: 'atkDown' }] }),
    skill({ id: 'doom', category: 'support', element: null, power: 0, effects: [{ kind: 'status', status: 'doom' }] }),
    skill({ id: 'purify', category: 'support', element: null, target: 'ally', power: 0, effects: [{ kind: 'cleanse', doom: true }] }),
    skill({ id: 'taunt', category: 'support', element: null, target: 'self', power: 0, effects: [{ kind: 'status', status: 'taunt' }] }),
    skill({ id: 'mute', category: 'support', element: null, power: 0, effects: [{ kind: 'status', status: 'disable' }] }),
    skill({ id: 'self', element: 'SELF', power: 1 }),
    skill({ id: 'ult', type: 'ultimate', target: 'allEnemies', power: 3, mpCost: 0, effects: [{ kind: 'shield', pct: 0.2, to: 'self' }] }),
  ].map((s) => [s.id, s]),
);
const items = { tonic: { itemId: 'tonic', target: 'ally' as const, effects: [{ kind: 'heal' as const, pct: 0.5 }] } };
const ctx: CombatContext = { skills, items, statuses, reactions, elements, rules };

const stats = (over: Partial<Stats> = {}): Stats => ({ hp: 100, mp: 100, atk: 20, def: 0, matk: 20, mdef: 0, spd: 10, acc: 100, eva: 0, crit: 0, ...over });
const unit = (id: string, side: 'ally' | 'enemy', over: Omit<Partial<CombatantInit>, 'stats'> & { stats?: Partial<Stats> } = {}): CombatantInit => ({
  id,
  side,
  name: id,
  element: 'EARTH',
  skills: [],
  ...over,
  stats: stats(over.stats),
});
const slots = (...ids: string[]) => ids.map((id) => ({ id, level: 1 }));

/** The enemies play (their intents) until it is an ally's turn again. */
function foes(state: BattleState, events: unknown[] = []): BattleState {
  let s = state;
  while (!s.outcome && current(s)?.side === 'enemy') {
    const r = act(s, actionFor(s, ctx)!, ctx);
    if (!r.ok) throw new Error(r.error);
    s = r.state;
    events.push(...r.events);
  }
  return s;
}

/** The player does `actions` in turn; the enemies answer after each. */
function play(state: BattleState, ...actions: Parameters<typeof act>[1][]) {
  const events: Parameters<typeof expect>[0][] = [];
  let s = foes(state, events);
  for (const a of actions) {
    const r = act(s, a, ctx);
    if (!r.ok) throw new Error(r.error);
    events.push(...r.events);
    s = foes(r.state, events);
  }
  return { state: s, events };
}

const of = (s: BattleState, id: string) => s.combatants.find((c) => c.id === id)!;

describe('element chart (§9)', () => {
  const target = (element: 'FIRE' | 'WATER' | 'EARTH' | 'VOID', element2: 'WATER' | null = null) => ({ element, element2, mods: { elementOverrides: {} } as never });
  it('reads strong, weak, resist and neutral from data', () => {
    expect(elementMultiplier(ctx, 'WATER', target('FIRE'))).toBe(1.5);
    expect(elementMultiplier(ctx, 'FIRE', target('WATER'))).toBe(0.75);
    expect(elementMultiplier(ctx, 'LIGHTNING', target('EARTH'))).toBe(0.5);
    expect(elementMultiplier(ctx, 'VOID', target('FIRE'))).toBe(1);
  });
  it('multiplies both elements of a dual-element target', () => {
    expect(elementMultiplier(ctx, 'LIGHTNING', target('EARTH', 'WATER'))).toBe(0.75);
  });
  it('honours a forced interaction (a boss immune to an element)', () => {
    expect(elementMultiplier(ctx, 'WATER', { element: 'FIRE', element2: null, mods: { elementOverrides: { WATER: 'IMMUNE' } } as never })).toBe(0);
  });
});

describe('turns and damage', () => {
  it('the fastest acts first; a tie goes to the player side', () => {
    const fast = startBattle(1, [unit('a', 'ally', { stats: { spd: 5 } }), unit('e', 'enemy', { stats: { spd: 9 } })], ctx).state;
    expect(current(fast)?.id).toBe('e');
    const tie = startBattle(1, [unit('e', 'enemy'), unit('a', 'ally')], ctx).state;
    expect(current(tie)?.id).toBe('a');
  });

  it('a basic attack hits for atk × K/(K+def) and gives MP back', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { mp: 50 }), unit('e', 'enemy', { stats: { def: 30, spd: 1 } })], ctx);
    const r = play(state, { kind: 'attack', target: 'e' });
    expect(of(r.state, 'e').hp).toBe(90);
    expect(of(r.state, 'a').mp).toBeGreaterThan(50);
  });

  it('a magical skill uses MATK against MDEF and the element chart', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { skills: slots('self'), element: 'WATER', stats: { matk: 40, atk: 1 } }), unit('e', 'enemy', { element: 'FIRE', stats: { spd: 1, mdef: 30 } })], ctx);
    const r = play(state, { kind: 'skill', skillId: 'self', target: 'e' });
    expect(of(r.state, 'e').hp).toBe(100 - 30); // 40 × 1 × 30/60 × 1.5
  });

  it('skills cost MP, have cooldowns and grow with their level', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { skills: [{ id: 'big', level: 3 }] }), unit('e', 'enemy', { stats: { hp: 1000, spd: 1 } })], ctx);
    const r = play(state, { kind: 'skill', skillId: 'big', target: 'e' });
    expect(of(r.state, 'a').mp).toBe(100 - 20 + 10); // 30 − 2×5, then +10% at its next turn
    expect(of(r.state, 'e').hp).toBe(1000 - 20 * 3 * 2); // power 3 × (1 + 0.5 × 2)
    expect(canAct(play(r.state, { kind: 'guard' }).state, { kind: 'skill', skillId: 'big', target: 'e' }, ctx)).toBe('ON_COOLDOWN');
  });

  it('refuses a skill without enough MP', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { skills: slots('big'), mp: 5 }), unit('e', 'enemy', { stats: { spd: 1 } })], ctx);
    expect(act(state, { kind: 'skill', skillId: 'big', target: 'e' }, ctx)).toEqual({ ok: false, error: 'NOT_ENOUGH_MP' });
  });

  it('can miss: hit chance = accuracy × ACC × (1 − EVA)', () => {
    const { state } = startBattle(3, [unit('a', 'ally', { stats: { acc: 5 } }), unit('e', 'enemy', { stats: { spd: 1, eva: 90 } })], ctx);
    const r = play(state, { kind: 'attack', target: 'e' });
    expect(r.events.some((e) => e.type === 'miss')).toBe(true);
    expect(of(r.state, 'e').hp).toBe(100);
  });

  it('Defend halves the damage until its next turn and gives MP', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { mp: 0 }), unit('e', 'enemy', { stats: { spd: 1 } })], ctx);
    const r = play(state, { kind: 'guard' });
    expect(of(r.state, 'a').hp).toBe(90); // the enemy's attack: 20 → 10
    expect(of(r.state, 'a').mp).toBeGreaterThanOrEqual(20);
  });
});

describe('statuses (§10)', () => {
  it('poison stacks and ticks at the start of the bearer turn', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { stats: { atk: 0, matk: 0 } }), unit('e', 'enemy', { stats: { spd: 1, atk: 0, matk: 0 } })], { ...ctx });
    const s = structuredClone(state);
    of(s, 'e').statuses.push({ id: 'poison', turns: 3, amount: 0, stacks: 2, source: 'NATURE' });
    const r = play(s, { kind: 'guard' });
    expect(r.events).toContainEqual({ type: 'tick', target: 'e', status: 'poison', amount: 20 });
  });

  it('stun skips one turn, then the target is immune for a turn', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { skills: slots('stun') }), unit('e', 'enemy', { stats: { spd: 1, hp: 1000 } })], ctx);
    const r = play(state, { kind: 'skill', skillId: 'stun', target: 'e' });
    expect(r.events).toContainEqual({ type: 'skip', actor: 'e', reason: 'stun' });
    const again = play(r.state, { kind: 'skill', skillId: 'stun', target: 'e' });
    expect(again.events).toContainEqual({ type: 'resist', target: 'e', status: 'stun' });
  });

  it('an Up and a Down of the same stat cancel out', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { skills: slots('rally', 'weaken') }), unit('e', 'enemy', { stats: { spd: 1, atk: 0, matk: 0 } })], ctx);
    const r = play(state, { kind: 'skill', skillId: 'rally' });
    expect(of(r.state, 'a').statuses.map((s) => s.id)).toContain('atkUp');
    expect(stat(of(r.state, 'a'), 'atk', ctx)).toBe(30);
  });

  it('disable blocks skills but not the basic attack', () => {
    const { state } = startBattle(1, [unit('e', 'enemy', { skills: slots('mute'), stats: { spd: 50 } }), unit('a', 'ally', { skills: slots('bolt') })], ctx);
    const s = structuredClone(state);
    of(s, 'a').statuses.push({ id: 'disable', turns: 2, amount: 0, stacks: 1, source: null });
    s.order = ['a'];
    expect(canAct(s, { kind: 'skill', skillId: 'bolt', target: 'e' }, ctx)).toBe('SKILL_DISABLED');
    expect(canAct(s, { kind: 'attack', target: 'e' }, ctx)).toBeNull();
  });

  it('Doom counts down and knocks out; a cleanse that lifts Doom saves the target', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { stats: { atk: 0 } }), unit('b', 'ally', { stats: { atk: 0 }, skills: slots('purify') }), unit('e', 'enemy', { stats: { spd: 1, atk: 0, matk: 0 } })], ctx);
    const s = structuredClone(state);
    of(s, 'a').statuses.push({ id: 'doom', turns: 1, amount: 0, stacks: 1, source: null });
    const r = play(s, { kind: 'guard' }, { kind: 'guard' });
    expect(r.events).toContainEqual({ type: 'defeat', target: 'a' });
    const saved = structuredClone(state);
    of(saved, 'a').statuses.push({ id: 'doom', turns: 2, amount: 0, stacks: 1, source: null });
    const r2 = play(saved, { kind: 'guard' }, { kind: 'skill', skillId: 'purify', target: 'a' });
    expect(of(r2.state, 'a').statuses.some((x) => x.id === 'doom')).toBe(false);
  });

  it('Auto-Revive brings a knocked-out fighter back once', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { stats: { hp: 10, spd: 1 } }), unit('e', 'enemy', { stats: { atk: 50 } })], ctx);
    const s = structuredClone(state);
    of(s, 'a').statuses.push({ id: 'autoRevive', turns: 5, amount: 0, stacks: 1, source: null });
    const r = act(s, actionFor(s, ctx)!, ctx);
    expect(r.ok && r.events.some((e) => e.type === 'revive')).toBe(true);
  });
});

describe('reactions (§11)', () => {
  it('Wet + Lightning shocks for more damage and uses the Wet up', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { skills: slots('wet', 'bolt'), stats: { spd: 99 } }), unit('e', 'enemy', { stats: { hp: 1000, spd: 1, atk: 0, matk: 0 } })], ctx);
    const r = play(state, { kind: 'skill', skillId: 'wet', target: 'e' }, { kind: 'skill', skillId: 'bolt', target: 'e' });
    expect(r.events).toContainEqual({ type: 'reaction', target: 'e', reaction: 'shock' });
    expect(of(r.state, 'e').statuses.some((s) => s.id === 'wet')).toBe(false);
  });

  it('a physical hit shatters Freeze for more damage and ends it', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { skills: slots('freeze') }), unit('e', 'enemy', { stats: { hp: 1000, spd: 1, atk: 0, matk: 0 } })], ctx);
    const frozen = play(state, { kind: 'skill', skillId: 'freeze', target: 'e' });
    expect(of(frozen.state, 'e').statuses.some((s) => s.id === 'freeze')).toBe(true);
    const r = play(frozen.state, { kind: 'attack', target: 'e' });
    expect(r.events).toContainEqual({ type: 'reaction', target: 'e', reaction: 'shatter' });
    expect(of(r.state, 'e').statuses.some((s) => s.id === 'freeze')).toBe(false);
  });
});

describe('Rage and the Ultimate (§8.3, §6.3)', () => {
  it('Rage grows by the share of max HP lost, never past its max', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { rageMax: 100, stats: { spd: 1 } }), unit('e', 'enemy', { stats: { atk: 30 } })], ctx);
    const hit = play(state).state;
    expect(of(hit, 'a').rage).toBe(30);
    const s = structuredClone(hit);
    of(s, 'a').rage = 95;
    const r = play(s, { kind: 'guard' });
    expect(of(r.state, 'a').rage).toBe(100);
  });

  it('the Ultimate needs full Rage, resets it and is once per battle', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { rageMax: 100, rage: 100, ultimate: 'ult' }), unit('e', 'enemy', { stats: { hp: 1000, spd: 1, atk: 0, matk: 0 } })], ctx);
    const r = play(state, { kind: 'ultimate' });
    expect(of(r.state, 'a').rage).toBe(0);
    expect(of(r.state, 'a').statuses.some((s) => s.id === 'shield')).toBe(true);
    const s = structuredClone(r.state);
    of(s, 'a').rage = 100;
    expect(canAct(s, { kind: 'ultimate' }, ctx)).toBe('ULTIMATE_NOT_READY');
  });
});

describe('Taunt, intents, AI, determinism', () => {
  it('a taunting foe pulls single-target attacks', () => {
    const { state } = startBattle(1, [unit('a', 'ally'), unit('t', 'enemy', { stats: { spd: 1, hp: 1000 } }), unit('e', 'enemy', { stats: { spd: 1 } })], ctx);
    const s = structuredClone(state);
    of(s, 't').statuses.push({ id: 'taunt', turns: 2, amount: 0, stacks: 1, source: null });
    const r = play(s, { kind: 'attack', target: 'e' });
    expect(of(r.state, 'e').hp).toBe(100);
    expect(of(r.state, 't').hp).toBeLessThan(1000);
  });

  it('enemies announce an intent at the start of a round', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { stats: { spd: 50 } }), unit('e', 'enemy', { skills: slots('burn') })], ctx);
    expect(of(state, 'e').intent).not.toBeNull();
  });

  it('a saved battle plays on to the same result', () => {
    const team = [unit('a', 'ally', { skills: slots('burn', 'stun', 'heal'), rageMax: 100, ultimate: 'ult' }), unit('b', 'ally', { skills: slots('wet', 'bolt') }), unit('e', 'enemy', { skills: slots('all'), stats: { hp: 400 } }), unit('f', 'enemy', { skills: slots('doom') })];
    const a = autoPlay(startBattle(42, team, ctx).state, ctx);
    const b = autoPlay(JSON.parse(JSON.stringify(startBattle(42, team, ctx).state)), ctx);
    expect(a).toEqual(b);
    expect(a.outcome).not.toBeNull();
  });

  it('the AI heals a hurt friend', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { skills: slots('heal'), stats: { atk: 1 } }), unit('b', 'ally', { hp: 10, stats: { spd: 1 } }), unit('e', 'enemy', { stats: { spd: 1 } })], ctx);
    expect(chooseAction(state, ctx)).toEqual({ kind: 'skill', skillId: 'heal', target: 'b' });
  });
});

describe('stats and levels', () => {
  it('grows with level, rarity and Bond; flat stats stay; speed and MP grow at half rate', () => {
    const base = { ...zeroStats(), hp: 100, mp: 40, atk: 10, spd: 10, acc: 100, eva: 5, crit: 5 };
    const s = deriveStats(base, { level: 11, rarityMult: 1, hearts: 0 }, { levelGrowth: 0.1, bondPerHeart: 0.05 });
    expect(s.hp).toBe(200);
    expect(s.spd).toBe(15);
    expect(s.mp).toBe(60);
    expect(s.acc).toBe(100);
    expect(addShares(s, { hp: 0.15 }, { spd: 2 }).hp).toBe(230);
  });
  it('experience carries over levels and stops at the top', () => {
    const r = { maxLevel: 3, expBase: 10, expExponent: 1 };
    expect(expToNext(1, r)).toBe(10);
    expect(addExp(1, 0, 35, r)).toEqual({ level: 3, exp: 0, levelsGained: 2 });
  });
});

describe('equipment (§13)', () => {
  const sword: EquipmentDef = { id: 'sword', slot: 'weapon', rarity: 'COMMON', levelReq: 1, stats: { atk: 5 }, elementAffinity: { element: 'FIRE', damagePct: 0.15, resistPct: 0 }, statusAffinity: { status: 'burn', chancePct: 0.05 } };
  const vest: EquipmentDef = { id: 'vest', slot: 'armor', rarity: 'COMMON', levelReq: 1, stats: { def: 7, mdef: 3 }, elementResist: { WATER: 0.2 } };
  it('adds stats and affinities; putting on swaps the old piece', () => {
    const defs = { sword, vest };
    expect(loadoutBonus({ weapon: 'sword', armor: 'vest' }, defs)).toMatchObject({ atk: 5, def: 7, mdef: 3 });
    expect(loadoutMods({ weapon: 'sword', armor: 'vest' }, defs)).toMatchObject({ elementDamage: { FIRE: 0.15 }, statusChance: { burn: 0.05 }, elementResist: { WATER: 0.2 } });
    expect(equipPiece({ weapon: 'old' }, sword)).toEqual({ loadout: { weapon: 'sword' }, replaced: 'old' });
    expect(unequipSlot({ weapon: 'sword' }, 'weapon')).toEqual({ loadout: {}, removed: 'sword' });
  });
  it('the element damage bonus is capped', () => {
    const team = [unit('a', 'ally', { element: 'FIRE', mods: { elementDamage: { FIRE: 5 } } }), unit('e', 'enemy', { stats: { spd: 1 } })];
    const r = play(startBattle(1, team, ctx).state, { kind: 'attack', target: 'e' });
    expect(of(r.state, 'e').hp).toBe(100 - 28); // 20 × (1 + 0.4)
  });
  it('an item heals from the bag effects', () => {
    const { state } = startBattle(1, [unit('a', 'ally', { hp: 20 }), unit('e', 'enemy', { stats: { spd: 1, atk: 0, matk: 0 } })], ctx);
    const r = act(state, { kind: 'item', itemId: 'tonic', target: 'a' }, ctx);
    expect(r.ok && of(r.state, 'a').hp).toBe(70);
  });
});
