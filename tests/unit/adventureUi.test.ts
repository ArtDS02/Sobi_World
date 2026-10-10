// The Adventure's links to the other Areas (roster, the starter pig, the purpose), its view-models and the Admin simulation.
import { describe, expect, it } from 'vitest';
import { AREAS } from '../../src/app/areas';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { adventureArea } from '../../src/areas/adventure';
import { claimStarter, collectLoot, starterGift } from '../../src/areas/adventure/logic/actions/camp';
import { battleAct, enterNode, startRun } from '../../src/areas/adventure/logic/actions/run';
import { simulateRuns, GEAR_TIERS } from '../../src/areas/adventure/logic/battleSim';
import { ARCHETYPE_LIST } from '../../src/areas/adventure/logic/config/content';
import { adventureOf, withAdventure } from '../../src/areas/adventure/logic/save/lens';
import { fighterCardVm, hubVm, startReason } from '../../src/areas/adventure/ui/adventureVm';
import { battleVm, logLine, mapVm, resultVm } from '../../src/areas/adventure/ui/battleVm';
import { setFishPurpose } from '../../src/areas/aquarium/logic/actions/care';
import { aquariumOf, withAquarium } from '../../src/areas/aquarium/logic/save/lens';
import type { Fish } from '../../src/areas/aquarium/logic/state';
import { setPurpose } from '../../src/areas/farm/logic/actions/setPurpose';
import { farmRoster } from '../../src/areas/farm/logic/roster';
import { farmOf, withFarm } from '../../src/areas/farm/logic/save/lens';
import { mulberry32 } from '../../src/core/rng';
import type { WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';
import { aquariumArea } from '../../src/areas/aquarium';
import { makePig } from './pigFactory';

const T0 = 20_000 * 86_400_000;
const ctxAt = (now: number, seed = 7): ActionContext => ({ now, rng: mulberry32(seed) });
const ok = (r: { ok: boolean; state?: WorldSave; error?: string }): WorldSave => {
  if (!r.ok) throw new Error(`action failed: ${r.error}`);
  return r.state as WorldSave;
};

/** A world where every Area is open (the farm at 100,000 XP opens them all in one step). */
function openWorld(): WorldSave {
  const fresh = SAVE_CODEC.newWorld(ctxAt(T0 - 40 * 86_400_000));
  const rich = { ...fresh, progression: { ...fresh.progression, areas: { ...fresh.progression.areas, sobi_farm: { xp: 100_000 } } } };
  const w = AREAS.advance(rich, T0, mulberry32(3), 0, 'online').state;
  return { ...w, wallet: { ...w.wallet, coins: 5000 } };
}

describe('the farm side', () => {
  it('lists its pigs for the world with their family, rarity, Bond and purpose', () => {
    const w = openWorld();
    const f = farmOf(w);
    const withPig = withFarm(w, { ...f, pigs: [makePig({ id: 'p1', breed: 'PIG_KNIGHT', growthProgress: 100, purpose: 'ADVENTURE', bond: 45 })] });
    const roster = AREAS.roster(withPig).filter((e) => e.areaId === 'sobi_farm');
    expect(roster).toEqual([
      expect.objectContaining({ key: 'sobi_farm:p1', kind: 'pig', speciesId: 'PIG_KNIGHT', family: 'ADVENTURE', rarity: 'COMMON', hearts: 2, adult: true, purpose: 'ADVENTURE', sick: false }),
    ]);
    expect(farmRoster(withPig)).toEqual(roster);
  });

  it('a pig may be raised for the Adventure only once the Adventure is open', () => {
    const w = openWorld();
    const f = withFarm(w, { ...farmOf(w), pigs: [makePig({ id: 'p1', growthProgress: 100, lastTickedAt: T0, createdAt: T0 })] });
    const set = (world: WorldSave) => setPurpose(farmOf(world), { pigId: 'p1', purpose: 'ADVENTURE' }, ctxAt(T0));
    expect(set(f)).toMatchObject({ ok: true });
    const closed = { ...f, world: { ...f.world, unlockedAreas: f.world.unlockedAreas.filter((a) => a !== 'sobi_adventure') } };
    expect(set(closed)).toEqual({ ok: false, error: 'PURPOSE_LOCKED' });
  });

  it('hands over the starter pig, grown and set to the Adventure; a full pen refuses and nothing changes', () => {
    const w = openWorld();
    const given = AREAS.give(w, starterGift(), ctxAt(T0));
    if (!given.ok) throw new Error(given.error);
    const pigs = farmOf(given.state).pigs;
    expect(pigs.at(-1)).toMatchObject({ breed: 'PIG_KNIGHT', growthProgress: 100, purpose: 'ADVENTURE' });
    expect(AREAS.give(w, { ...starterGift(), species: 'PIG_NOPE' }, ctxAt(T0))).toEqual({ ok: false, error: 'INVALID_REQUEST' });
    expect(AREAS.give(w, { ...starterGift(), area: 'sobi_nowhere' }, ctxAt(T0))).toEqual({ ok: false, error: 'INVALID_REQUEST' });
    const f = farmOf(w);
    const full = withFarm(w, { ...f, pigs: Array.from({ length: f.player.unlockedSlots }, (_, i) => makePig({ id: `x${i}`, slotIndex: i })) });
    expect(AREAS.give(full, starterGift(), ctxAt(T0))).toEqual({ ok: false, error: 'NO_PIG_SLOT' });
  });

  it('the quest end to end: claim, the pig appears in the roster, it goes on a run', () => {
    const w = openWorld();
    const r = ok(claimStarter(w, { give: (world, gift, ctx) => AREAS.give(world, gift, ctx) }, ctxAt(T0)));
    const roster = AREAS.roster(r);
    const knight = roster.find((e) => e.speciesId === 'PIG_KNIGHT')!;
    expect(knight.purpose).toBe('ADVENTURE');
    const run = ok(startRun(r, { zoneId: 'zone_forest', keys: [knight.key], roster }, ctxAt(T0)));
    expect(adventureOf(run).run!.team[0]!.name).toBe(knight.name);
    // the starter's equipment is in the bag, ready to put on
    expect(r.inventory.items.item_equip_wood_sword).toBe(1);
  });
});

describe('the Aquarium side', () => {
  const fish = (id: string, breed: string): Fish => ({ id, breed, name: id, gender: 'MALE', growthProgress: 100, hunger: 100, cleanliness: 100, isSick: false, generation: 1, createdAt: T0 - 40 * 86_400_000, lastTickedAt: T0 });

  it('only the fighting species can be raised for the Adventure, and only once it is open', () => {
    const w = openWorld();
    const a = aquariumOf(w);
    const world = withAquarium(w, { ...a, fish: [fish('b', 'fish_betta'), fish('g', 'fish_goldfish')], lastTickedAt: T0 });
    expect(ok(setFishPurpose(world, { fishId: 'b', purpose: 'ADVENTURE' }, ctxAt(T0))) && true).toBe(true);
    expect(setFishPurpose(world, { fishId: 'g', purpose: 'ADVENTURE' }, ctxAt(T0))).toEqual({ ok: false, error: 'PURPOSE_LOCKED' });
    const roster = AREAS.roster(world).filter((e) => e.kind === 'fish');
    expect(roster.map((e) => e.speciesId)).toEqual(['fish_betta']);
    const closed = { ...world, world: { ...world.world, unlockedAreas: world.world.unlockedAreas.filter((x) => x !== 'sobi_adventure') } };
    expect(setFishPurpose(closed, { fishId: 'b', purpose: 'ADVENTURE' }, ctxAt(T0))).toEqual({ ok: false, error: 'PURPOSE_LOCKED' });
    expect(aquariumArea.roster).toBeDefined();
  });
});

describe('view-models', () => {
  const entry = { key: 'sobi_farm:a', areaId: 'sobi_farm', id: 'a', kind: 'pig' as const, name: 'Mập', speciesId: 'PIG_KNIGHT', family: 'ADVENTURE', rarity: 'COMMON', hearts: 3, sick: false, adult: true, purpose: 'ADVENTURE', artId: 'pig_knight' };
  const world = () => adventureArea.init(openWorld(), ctxAt(T0));

  it('a fighter card shows level, bars, skills (two open, two locked), slots and why it cannot go', () => {
    const w = world();
    const card = fighterCardVm(w, entry, T0)!;
    expect(card).toMatchObject({ name: 'Mập', style: 'Chiến binh', element: 'FIRE', notReady: null, statusChip: null });
    expect(card.skills.map((s) => s.opensAt)).toEqual([null, null, 10, 20]);
    expect(card.slots.map((s) => s.itemId)).toEqual([null, null, null]);
    expect(card.stats.atk).toBeGreaterThan(20); // Bond hearts add a little
    expect(fighterCardVm(w, { ...entry, sick: true }, T0)!.notReady).toBeTruthy();
    expect(fighterCardVm(w, { ...entry, purpose: 'SHIP' }, T0)!.notReady).toBeTruthy();
    expect(fighterCardVm(w, { ...entry, kind: 'fish', speciesId: 'fish_goldfish', family: null }, T0)).toBeNull(); // cannot fight at all
  });

  it('the hub counts the creatures that could fight, offers the quest and the waiting loot with reasons', () => {
    const w = world();
    const waiting = [entry, { ...entry, key: 'sobi_farm:b', id: 'b', purpose: 'SHIP' }];
    const run = { starter: (ww: WorldSave, c: ActionContext) => claimStarter(ww, { give: (x, g, cc) => AREAS.give(x, g, cc) }, c), loot: (ww: WorldSave, c: ActionContext) => collectLoot(ww, c) };
    const hub = hubVm(w, waiting, T0, run);
    expect(hub.fighters).toHaveLength(1);
    expect(hub.waiting).toBe(1);
    expect(hub.starter).toMatchObject({ reason: null });
    expect(hub.loot).toBeNull();
    const pending = withAdventure(w, { ...adventureOf(w), starterClaimed: true, pending: { item_forest_herb: 4 } });
    const hub2 = hubVm(pending, waiting, T0, run);
    expect(hub2.starter).toBeNull();
    expect(hub2.loot).toMatchObject({ count: 4, reason: null });
  });

  it('says why a team cannot start: empty, unknown, exhausted, locked zone', () => {
    const w = world();
    expect(startReason(w, [entry], 'zone_forest', [], T0)).toBeTruthy();
    expect(startReason(w, [entry], 'zone_forest', [entry.key], T0)).toBeNull();
    expect(startReason(w, [entry], 'zone_forest', ['sobi_farm:ghost'], T0)).toBeTruthy();
    const low = { ...w, progression: { ...w.progression, areas: {} } };
    expect(startReason(low, [entry], 'zone_forest', [entry.key], T0)).toContain('cấp');
  });

  it('a battle shows the units, whose turn it is, the actions with reasons and the log in words', () => {
    let w = ok(startRun(world(), { zoneId: 'zone_forest', keys: [entry.key], roster: [entry] }, ctxAt(T0)));
    expect(mapVm(adventureOf(w).run!).nodes.map((n) => n.state)).toEqual(['now', 'next', 'next', 'next', 'next', 'next']);
    w = ok(enterNode(w, ctxAt(T0, 4)));
    const run = adventureOf(w).run!;
    expect(run.phase).toBe('battle');
    const vm = battleVm({ ...w, inventory: { items: { ...w.inventory.items, item_potion_healing: 1 } } }, run)!;
    expect(vm.units.some((u) => u.side === 'ally')).toBe(true);
    expect(vm.units.some((u) => u.side === 'enemy')).toBe(true);
    expect(vm.actor).toBeTruthy();
    const kinds = vm.actions.map((a) => a.kind);
    expect(kinds).toContain('attack');
    expect(kinds).toContain('skill');
    expect(kinds).toContain('item');
    expect(vm.actions.find((a) => a.id === 'skill_battle_cry')!.aim).toBeNull(); // all allies: no target to pick
    expect(vm.log.length).toBeGreaterThan(0);
    // a step of the fight leaves its words in the log
    const after = ok(battleAct(w, { action: 'auto' }, ctxAt(T0, 5)));
    const next = battleVm(after, adventureOf(after).run!);
    expect(next === null || next.log.length > 0).toBe(true);
    expect(logLine({ type: 'damage', actor: 'a', target: 'b', amount: 7, crit: true, mult: 1.5, skillId: null, absorbed: 0 }, (id) => id)).toContain('chí mạng');
  });

  it('the summary lists experience, coins, level-ups and the loot', () => {
    const w = world();
    const base = ok(startRun(w, { zoneId: 'zone_forest', keys: [entry.key], roster: [entry] }, ctxAt(T0)));
    const run = { ...adventureOf(base).run!, phase: 'done' as const, result: 'lose' as const, expGained: 30, coins: 100, gems: 2, levelUps: [entry.key], loot: { item_forest_herb: 3 } };
    const vm = resultVm(run, new Map([[entry.key, 'Mập']]))!;
    expect(vm.lines.join('|')).toContain('30');
    expect(vm.lines.join('|')).toContain('Mập');
    expect(vm.lines.join('|')).toContain('kiệt sức');
    expect(vm.loot).toEqual([expect.objectContaining({ itemId: 'item_forest_herb', count: 3 })]);
    expect(resultVm({ ...run, phase: 'map', result: null }, new Map())).toBeNull();
  });
});

describe('the Admin simulation', () => {
  const team = [
    { archetypeId: 'bruiser', rarity: 'COMMON', hearts: 0 },
    { archetypeId: 'guardian', rarity: 'COMMON', hearts: 0 },
    { archetypeId: 'mystic', rarity: 'COMMON', hearts: 0 },
  ];
  const sim = (level: number, gear: (typeof GEAR_TIERS)[number], samples = 60) => simulateRuns({ zoneId: 'zone_forest', level, team, gear, samples, seed: 11 });

  it('is deterministic for a seed and answers in whole runs', () => {
    expect(sim(5, 'none')).toEqual(sim(5, 'none'));
    const r = sim(5, 'none');
    expect(r.samples).toBe(60);
    expect(r.reachedPercent).toHaveLength(6);
    expect(r.reachedPercent[0]).toBe(100);
    expect(r.averageRounds).toBeGreaterThan(0);
  });

  it('a higher level and better gear win more, and a boss that is out of reach shows in the numbers', () => {
    expect(sim(1, 'none').winPercent).toBeLessThan(sim(8, 'none').winPercent);
    expect(sim(3, 'none').winPercent).toBeLessThanOrEqual(sim(3, 'rare').winPercent);
    expect(sim(1, 'none').reachedPercent.at(-1)!).toBeLessThan(100);
    expect(sim(12, 'uncommon').winPercent).toBeGreaterThan(90);
  });

  it('refuses an unknown zone or style', () => {
    expect(() => simulateRuns({ zoneId: 'zone_nope', level: 1, team, gear: 'none', samples: 1, seed: 1 })).toThrow();
    expect(() => simulateRuns({ zoneId: 'zone_forest', level: 1, team: [{ archetypeId: 'nope' }], gear: 'none', samples: 1, seed: 1 })).toThrow();
  });

});

describe('Adventure balance guard (GĐ10 playtest numbers)', () => {
  const run = (archetypeIds: string[], level: number, gear: (typeof GEAR_TIERS)[number] = 'common') =>
    simulateRuns({ zoneId: 'zone_forest', level, team: archetypeIds.map((archetypeId) => ({ archetypeId })), gear, samples: 80, seed: 21 });
  const classic = ['bruiser', 'guardian', 'mystic'];

  it('is out of reach at level 1, a fair fight in the middle and comfortable by level 8', () => {
    expect(run(classic, 1).winPercent).toBeLessThan(5);
    const mid = run(classic, 5).winPercent;
    expect(mid).toBeGreaterThan(40);
    expect(mid).toBeLessThan(95);
    expect(run(classic, 8).winPercent).toBeGreaterThan(90);
  });

  it('a lone level 1 fighter can still win the opening fight, so a first run is never wasted', () => {
    expect(run(['bruiser'], 1).reachedPercent[1]!).toBeGreaterThan(40);
  });

  it('no style carries and no style is dead weight: every one adds to a team within a band', () => {
    const ids = ARCHETYPE_LIST.map((a) => a.id);
    const mean = (id: string) => {
      const mates = ids.filter((x) => x !== id);
      const wins = [[0, 1], [2, 3], [4, 5], [1, 4]].map(([i, j]) => run([id, mates[i!]!, mates[j!]!], 4).winPercent);
      return wins.reduce((n, w) => n + w, 0) / wins.length;
    };
    const means = ids.map(mean);
    expect(Math.max(...means) - Math.min(...means)).toBeLessThan(30);
    expect(Math.min(...means)).toBeGreaterThan(15);
  });

  it('three of the same style is worse than a mixed team (compositions matter)', () => {
    expect(run(['trickster', 'trickster', 'trickster'], 5).winPercent).toBeLessThan(run(classic, 5).winPercent);
    expect(run(['stormcaller', 'stormcaller', 'stormcaller'], 5).winPercent).toBeLessThan(run(classic, 5).winPercent);
  });

  it('gear helps without replacing levels: a full rare set at level 1 does not clear the forest like level 6 does', () => {
    expect(run(classic, 1, 'rare').winPercent).toBeLessThan(run(classic, 6, 'common').winPercent);
    expect(run(classic, 3, 'uncommon').winPercent).toBeGreaterThan(run(classic, 3, 'none').winPercent);
  });
});
