// The Adventure's links to the other Areas (roster, the starter pig, the purpose), its view-models and the Admin simulation.
import { describe, expect, it } from 'vitest';
import { AREAS } from '../../src/app/areas';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { adventureArea } from '../../src/areas/adventure';
import { claimStarter, collectLoot, starterGift } from '../../src/areas/adventure/logic/actions/camp';
import { battleAct, engage, startRun } from '../../src/areas/adventure/logic/actions/run';
import { simulateRuns, GEAR_TIERS } from '../../src/areas/adventure/logic/battleSim';
import { MAPS } from '../../src/areas/adventure/logic/config/content';
import { tileCenter } from '../../src/areas/adventure/logic/maps';
import { adventureOf } from '../../src/areas/adventure/logic/save/lens';
import { battleVm, effectOn, logLine } from '../../src/areas/adventure/ui/battleVm';
import { resultVm } from '../../src/areas/adventure/ui/tripResultVm';
import { campVm, startReason, teamWarnings, zoneCards } from '../../src/areas/adventure/ui/campVm';
import { exploreVm, minimapVm } from '../../src/areas/adventure/ui/exploreVm';
import { fighterCardVm, sheetVm } from '../../src/areas/adventure/ui/fighterVm';
import { sceneVm } from '../../src/areas/adventure/ui/sceneVm';
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
    const f = withFarm(w, { ...farmOf(w), pigs: [makePig({ id: 'p1', breed: 'PIG_KNIGHT', growthProgress: 100, lastTickedAt: T0, createdAt: T0 }), makePig({ id: 'p2', growthProgress: 100, lastTickedAt: T0, createdAt: T0 })] });
    const set = (world: WorldSave, pigId = 'p1') => setPurpose(farmOf(world), { pigId, purpose: 'ADVENTURE' }, ctxAt(T0));
    expect(set(f)).toMatchObject({ ok: true });
    // A plain farm pig is not a combat animal (adventure-big-update-1 §14).
    expect(set(f, 'p2')).toEqual({ ok: false, error: 'NOT_A_FIGHTER' });
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
  const sheep = { ...entry, key: 'sobi_farm:b', id: 'b', name: 'Bông', speciesId: 'PIG_SUNFLOWER', family: 'MEADOW' };
  const world = () => adventureArea.init(openWorld(), ctxAt(T0));
  const run = { starter: (ww: WorldSave, c: ActionContext) => claimStarter(ww, { give: (x, g, cc) => AREAS.give(x, g, cc) }, c), loot: (ww: WorldSave, c: ActionContext) => collectLoot(ww, c) };

  it('a card shows class, line, elements, bars and why it cannot go; a fish that cannot fight has none', () => {
    const w = world();
    const card = fighterCardVm(w, entry, T0)!;
    expect(card).toMatchObject({ name: 'Mập', classId: 'striker', notReady: null, tank: false, heals: false });
    expect(card.elements).toContain('Kim loại');
    expect(fighterCardVm(w, sheep, T0)!.heals).toBe(true);
    expect(fighterCardVm(w, { ...entry, sick: true }, T0)!.notReady).toBeTruthy();
    expect(fighterCardVm(w, { ...entry, kind: 'fish', speciesId: 'fish_goldfish', family: null }, T0)).toBeNull();
  });

  it('the profile: stats, four Unique skills (two locked), the Ultimate, the tree with costs and reasons, the temple', () => {
    const v = sheetVm(world(), entry, T0, [entry])!;
    expect(v.unique.map((s) => s.opensAt)).toEqual([null, null, 10, 20]);
    expect(v.ultimate.name).toBe('Đoàn Kỵ Thép');
    expect(v.nodes.find((n) => n.id === 'node_st_power_strike')).toMatchObject({ level: 1, carried: true });
    const locked = v.nodes.find((n) => n.id === 'node_st_finisher')!;
    expect(locked.step!.reason).toBeTruthy();
    expect(locked.needs).toContain('Liên Hoàn');
    expect(v.temple.classes).toHaveLength(3);
    expect(v.temple.reset.reason).toBeTruthy(); // nothing to reset yet
  });

  it('the camp: zones with their gate and discovery, the warnings of a team, why it cannot start', () => {
    const w = world();
    const camp = campVm(w, [entry, sheep], T0, run);
    expect(camp.fighters).toHaveLength(2);
    expect(camp.zones[0]!.starts.map((s) => s.mapId)).toEqual(['map_forest_edge']);
    expect(zoneCards(w).find((z) => z.id === 'zone_mountain')!.locked).toBeTruthy();
    expect(teamWarnings([camp.fighters[0]!], camp.zones[0]).some((x) => x.includes('hồi máu'))).toBe(true);
    expect(teamWarnings(camp.fighters, camp.zones[0]).some((x) => x.includes('hồi máu'))).toBe(false);
    expect(startReason(w, [entry], 'zone_forest', undefined, [], T0)).toBeTruthy();
    expect(startReason(w, [entry], 'zone_forest', undefined, [entry.key], T0)).toBeNull();
  });

  it('on the map: the prompt says what Space does or why not; the small map; the scene state', () => {
    const w = ok(startRun(world(), { zoneId: 'zone_forest', keys: [entry.key], roster: [entry] }, ctxAt(T0)));
    const r = adventureOf(w).run!;
    const v = exploreVm(w, r, 'gate_f1_bramble')!;
    expect(v.prompt!.reason).toContain('Lửa');
    expect(exploreVm(w, r, 'map_forest_edge')!.prompt!.reason).toBeNull(); // the entrance portal is lit
    expect(v.portal.destinations.map((d) => d.mapId)).toEqual(['camp']);
    expect(minimapVm(w, r)!.tiles).toHaveLength(MAPS.map_forest_edge!.rows);
    const scene = sceneVm(w, T0, false, 'zone_forest')!;
    expect(scene).toMatchObject({ mode: 'explore', mapId: 'map_forest_edge', portalLit: true });
    expect(scene.groups.length).toBe(MAPS.map_forest_edge!.groups.length);
    expect(sceneVm(world(), T0, false, 'zone_forest')!.mode).toBe('camp');
  });

  it('a battle shows the units with intents, the turn order, actions with reasons, effect labels and the log', () => {
    const F1 = MAPS.map_forest_edge!;
    const g = F1.groups.find((x) => x.kind === 'normal')!;
    let w = ok(startRun(world(), { zoneId: 'zone_forest', keys: [entry.key], roster: [entry] }, ctxAt(T0)));
    w = ok(engage(w, { ...tileCenter(F1, g.x, g.y), groupId: g.id }, ctxAt(T0)));
    const r = adventureOf(w).run!;
    const vm = battleVm({ ...w, inventory: { items: { ...w.inventory.items, item_potion_healing: 1 } } }, r)!;
    expect(vm.units.some((u) => u.side === 'enemy' && u.intent)).toBe(true);
    expect(vm.order.length).toBeGreaterThan(1);
    expect(vm.actions.map((a) => a.kind)).toEqual(expect.arrayContaining(['attack', 'skill', 'ultimate', 'guard', 'item', 'flee']));
    expect(vm.actions.find((a) => a.kind === 'ultimate')!.reason).toBeTruthy(); // Rage not full
    expect(vm.actions.find((a) => a.kind === 'flee')!.reason).toBeNull();
    const enemy = r.battle!.combatants.find((c) => c.side === 'enemy')!;
    expect(effectOn(r.battle!, entry.key, 'METAL', 'physical', enemy.id)).toBeTruthy();
    const after = ok(battleAct(w, { action: 'auto' }, ctxAt(T0, 5)));
    const next = adventureOf(after).run!;
    expect(next.phase === 'battle' ? battleVm(after, next)!.log.length : 1).toBeGreaterThan(0);
    expect(logLine({ type: 'damage', actor: 'a', target: 'b', amount: 7, crit: true, mult: 1.5, skillId: null, absorbed: 0, element: 'FIRE' }, (id) => id)).toContain('chí mạng');
  });

  it('the summary lists experience, SP, coins, level-ups and the loot', () => {
    const base = ok(startRun(world(), { zoneId: 'zone_forest', keys: [entry.key], roster: [entry] }, ctxAt(T0)));
    const r = { ...adventureOf(base).run!, phase: 'done' as const, result: 'lose' as const, expGained: 30, spGained: 3, coins: 100, gems: 2, levelUps: [entry.key], loot: { item_forest_herb: 3 } };
    const vm = resultVm(r, new Map([[entry.key, 'Mập']]))!;
    expect(vm.lines.join('|')).toContain('30');
    expect(vm.lines.join('|')).toContain('SP');
    expect(vm.lines.join('|')).toContain('kiệt sức');
    expect(vm.loot).toEqual([expect.objectContaining({ itemId: 'item_forest_herb', count: 3 })]);
  });
});

describe('the Admin simulation', () => {
  const team = [
    { lineage: 'thiet_giap' as const, classId: 'tanker' as const },
    { lineage: 'hoa_giai' as const, classId: 'striker' as const },
    { lineage: 'quang_tru' as const, classId: 'support' as const },
  ];
  const sim = (level: number, gear: (typeof GEAR_TIERS)[number], samples = 30) => simulateRuns({ zoneId: 'zone_forest', level, team, gear, samples, seed: 11 });

  it('is deterministic for a seed and answers in whole trips', () => {
    expect(sim(5, 'common')).toEqual(sim(5, 'common'));
    const r = sim(5, 'common');
    expect(r.reachedPercent).toHaveLength(3);
    expect(r.reachedPercent[0]).toBe(100);
    expect(r.averageRounds).toBeGreaterThan(3);
    expect(r.averageBattles).toBeGreaterThan(8);
  });

  it('a higher level wins more; a lone level 1 fighter still wins its first fights', () => {
    expect(sim(1, 'common').winPercent).toBeLessThan(sim(8, 'common').winPercent);
    const lone = simulateRuns({ zoneId: 'zone_forest', level: 1, team: [{ lineage: 'thiet_giap', classId: 'striker' }], gear: 'common', samples: 30, seed: 3 });
    expect(lone.averageBattles).toBeGreaterThan(1);
  });

  it('refuses an unknown zone or line', () => {
    expect(() => simulateRuns({ zoneId: 'zone_nope', level: 1, team, gear: 'none', samples: 1, seed: 1 })).toThrow();
    expect(() => simulateRuns({ zoneId: 'zone_forest', level: 1, team: [{ lineage: 'nope' as never, classId: 'mage' }], gear: 'none', samples: 1, seed: 1 })).toThrow();
  });
});
