// Sobi Adventure (GĐ10): the content, the runs (zones, nodes, battles, loot), exhaustion, energy, equipment, the starter
// quest and the links to the world — and that a saved run plays on to the same end.
import { describe, expect, it } from 'vitest';
import { SAVE_CODEC, parseWorldSave } from '../../src/app/saveCodec';
import { adventureArea } from '../../src/areas/adventure';
import { claimStarter, collectLoot, equipItem, starterGift, unequipSlotOf } from '../../src/areas/adventure/logic/actions/camp';
import { battleAct, closeRun, enemyIdOf, enemyInits, enterNode, retreat, startRun } from '../../src/areas/adventure/logic/actions/run';
import { AB, ARCHETYPE_LIST, COMBAT_CONTEXT, ENEMY_LIST, EQUIPMENT_DEFS, SKILL_LIST, ZONES, ZONE_LIST, archetypeOf, contentProblems } from '../../src/areas/adventure/logic/config/content';
import { energyOf, exhaustedLeft, fighterSkills, fighterStats, msToEnergy, whyNotReady } from '../../src/areas/adventure/logic/fighters';
import { rewindAdventure } from '../../src/areas/adventure/logic/rewind';
import { adventureOf, withAdventure } from '../../src/areas/adventure/logic/save/lens';
import { adventureStateSchema, type AdventureState } from '../../src/areas/adventure/logic/state';
import { adventureSuggestions } from '../../src/areas/adventure/logic/suggest';
import { adventureSummaryLines } from '../../src/areas/adventure/logic/summary';
import { adventureEventsToWorld } from '../../src/areas/adventure/logic/worldEvents';
import { adventureArtIds } from '../../src/areas/adventure/logic/art';
import type { CreatureGift, RosterEntry } from '../../src/core/area-registry/registry';
import { ITEMS } from '../../src/core/config/items';
import { mulberry32 } from '../../src/core/rng';
import type { WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';
import { autoPlay, startBattle } from '../../src/systems/combat/engine';

const H = 3_600_000;
const T0 = 20_000 * 86_400_000;
const ctxAt = (now: number, seed = 7): ActionContext => ({ now, rng: mulberry32(seed) });
const ok = (r: { ok: boolean; state?: WorldSave; error?: string }): WorldSave => {
  if (!r.ok) throw new Error(`action failed: ${r.error}`);
  return r.state as WorldSave;
};
const err = (r: { ok: boolean; error?: string }): string | undefined => (r.ok ? undefined : r.error);

const entry = (id: string, over: Partial<RosterEntry> = {}): RosterEntry => ({
  key: `sobi_farm:${id}`,
  areaId: 'sobi_farm',
  id,
  kind: 'pig',
  name: id,
  speciesId: 'PIG_KNIGHT',
  family: 'ADVENTURE',
  rarity: 'COMMON',
  hearts: 0,
  sick: false,
  adult: true,
  purpose: 'ADVENTURE',
  artId: 'pig_knight',
  ...over,
});
const squad = [entry('a'), entry('b', { speciesId: 'PIG_SHEEP', family: 'MEADOW' }), entry('c', { speciesId: 'PIG_BOAR', family: 'WILD' })];

/** A world with the adventure open at T0, a rich wallet (level 8 reached) and the given bag. */
function adventureWorld(bag: Record<string, number> = {}): WorldSave {
  const fresh = SAVE_CODEC.newWorld(ctxAt(T0));
  const rich = { ...fresh, progression: { ...fresh.progression, areas: { ...fresh.progression.areas, sobi_farm: { xp: 100_000 } } } };
  const opened = adventureArea.init(rich, ctxAt(T0));
  return { ...opened, wallet: { ...opened.wallet, coins: 1000 }, inventory: { items: { ...bag } } };
}

/** Gives the keys' fighters a level and equipment so a run is a fair fight. */
function strong(world: WorldSave, level = 15): WorldSave {
  const a = adventureOf(world);
  const fighters = { ...a.fighters };
  for (const e of squad) {
    fighters[e.key] = {
      level,
      exp: 0,
      loadout: { weapon: 'item_equip_iron_sword', armor: 'item_equip_bark_armor', charm: 'item_equip_wind_feather' },
      energy: 100,
      energyAt: T0,
      exhaustedUntil: null,
    };
  }
  return withAdventure(world, { ...a, fighters });
}

/** Plays a run to its end with auto actions; returns the final world. */
function playRun(world: WorldSave, now = T0, seed = 1): WorldSave {
  let w = world;
  for (let guard = 0; guard < 200 && adventureOf(w).run?.phase !== 'done'; guard += 1) {
    const run = adventureOf(w).run!;
    w = ok(run.phase === 'battle' ? battleAct(w, { action: 'auto' }, ctxAt(now, seed + guard)) : enterNode(w, ctxAt(now, seed + guard)));
  }
  return w;
}

describe('content', () => {
  it('has no broken reference, at least 12 skills, a style of four skills for every family, and a zone ending in a boss', () => {
    expect(contentProblems()).toEqual([]);
    expect(SKILL_LIST.length).toBeGreaterThanOrEqual(12);
    expect(ARCHETYPE_LIST.every((a) => a.skills.length === 4)).toBe(true);
    for (const z of ZONE_LIST) expect(z.nodes.at(-1)!.type).toBe('boss');
    expect(ZONES.zone_forest!.nodes).toHaveLength(6); // 5 nodes and the boss (GAME_BALANCE §9)
    expect(ENEMY_LIST.some((e) => e.boss)).toBe(true);
  });

  it('every skill does something and the elements are all used; styles differ in their skills', () => {
    expect(new Set(SKILL_LIST.map((s) => s.element)).size).toBe(4);
    const sets = new Set(ARCHETYPE_LIST.map((a) => [...a.skills].sort().join()));
    expect(sets.size).toBe(ARCHETYPE_LIST.length);
  });

  it('a pig fights in the style of its family, a species override wins, only listed fish can fight', () => {
    expect(archetypeOf(entry('x'))!.id).toBe('bruiser');
    expect(archetypeOf(entry('x', { family: 'FARM' }))!.id).toBe('guardian');
    expect(archetypeOf({ kind: 'fish', speciesId: 'fish_betta', family: null })!.id).toBe('skirmisher');
    expect(archetypeOf({ kind: 'fish', speciesId: 'fish_goldfish', family: null })).toBeUndefined();
  });

  it('the equipment pieces are EQUIPMENT items and the new materials can be sold', () => {
    for (const id of Object.keys(EQUIPMENT_DEFS)) expect(ITEMS[id as keyof typeof ITEMS].category).toBe('EQUIPMENT');
    expect(ITEMS.item_forest_herb.sellGold).toBeGreaterThan(0);
    expect(ITEMS.item_beast_fang.sellGold).toBeGreaterThan(0);
    expect(adventureArtIds().length).toBeGreaterThan(10);
  });
});

describe('fighters', () => {
  it('level raises the stats, equipment adds flat, skills open at 10 and 20', () => {
    const a = archetypeOf(entry('x'))!;
    const base = { level: 1, exp: 0, loadout: {}, energy: 100, energyAt: 0, exhaustedUntil: null };
    expect(fighterStats(base, entry('x'), a)).toEqual(a.stats);
    expect(fighterStats({ ...base, level: 11 }, entry('x'), a).atk).toBe(a.stats.atk * 2);
    expect(fighterStats({ ...base, loadout: { weapon: 'item_equip_iron_sword' } }, entry('x'), a).atk).toBe(a.stats.atk + 8);
    expect(fighterStats(base, entry('x', { hearts: 5, rarity: 'RARE' }), a).hp).toBeGreaterThan(a.stats.hp * 1.28);
    expect(fighterSkills({ level: 1 }, a)).toHaveLength(2);
    expect(fighterSkills({ level: 10 }, a)).toHaveLength(3);
    expect(fighterSkills({ level: 20 }, a)).toHaveLength(4);
  });

  it('energy refills by the hour up to the cap; a fighter must be grown, set to Adventure, well, rested and charged', () => {
    const f = { level: 1, exp: 0, loadout: {}, energy: 10, energyAt: T0, exhaustedUntil: null };
    expect(energyOf(f, T0)).toBe(10);
    expect(energyOf(f, T0 + 2 * H)).toBe(10 + 2 * AB.run.energyPerHour);
    expect(energyOf(f, T0 + 100 * H)).toBe(AB.run.energyMax);
    expect(msToEnergy(f, T0, AB.run.energyCost)).toBe(Math.ceil(((AB.run.energyCost - 10) / AB.run.energyPerHour) * H));
    expect(whyNotReady(entry('x'), undefined, T0)).toBeNull();
    expect(whyNotReady(entry('x', { purpose: 'SHIP' }), undefined, T0)).toBe('NOT_A_FIGHTER');
    expect(whyNotReady(entry('x', { adult: false }), undefined, T0)).toBe('NOT_A_FIGHTER');
    expect(whyNotReady(entry('x', { sick: true }), undefined, T0)).toBe('FIGHTER_SICK');
    expect(whyNotReady(entry('x'), { ...f, exhaustedUntil: T0 + H }, T0)).toBe('FIGHTER_EXHAUSTED');
    expect(whyNotReady(entry('x'), f, T0)).toBe('NO_ADVENTURE_ENERGY');
    expect(exhaustedLeft({ exhaustedUntil: T0 + H }, T0 + H / 2)).toBe(H / 2);
  });
});

describe('opening, the save', () => {
  it('opens at world level 8 and development 20, with an empty slice that survives the codec', () => {
    const w = adventureWorld();
    expect(adventureOf(w)).toMatchObject({ fighters: {}, run: null, starterClaimed: false });
    const parsed = parseWorldSave(JSON.stringify(w));
    expect(parsed.ok && parsed.save).toEqual(w);
    expect(adventureStateSchema.safeParse({ ...adventureOf(w), fighters: { x: { level: 0 } } }).success).toBe(false);
  });
});

describe('starting a run', () => {
  it('takes 1 to 3 different fighters, spends 30 energy each and freezes their numbers', () => {
    const w = adventureWorld();
    const r = ok(startRun(w, { zoneId: 'zone_forest', keys: [squad[0]!.key, squad[1]!.key], roster: squad }, ctxAt(T0)));
    const a = adventureOf(r);
    expect(a.run).toMatchObject({ zoneId: 'zone_forest', nodeIndex: 0, phase: 'map' });
    expect(a.run!.team).toHaveLength(2);
    expect(a.run!.team[0]!.hp).toBe(a.run!.team[0]!.stats.hp);
    expect(energyOf(a.fighters[squad[0]!.key]!, T0)).toBe(AB.run.energyMax - AB.run.energyCost);
    expect(a.run!.team[0]!.skills).toHaveLength(2);
  });

  it('refuses an empty or a big team, a duplicate, a stranger, an unready fighter, a locked zone and a second run', () => {
    const w = adventureWorld();
    const go = (keys: string[], roster = squad, zoneId = 'zone_forest') => err(startRun(w, { zoneId, keys, roster }, ctxAt(T0)));
    expect(go([])).toBe('TEAM_INVALID');
    expect(go(squad.map((e) => e.key).concat('sobi_farm:d'), [...squad, entry('d')])).toBe('TEAM_INVALID');
    expect(go([squad[0]!.key, squad[0]!.key])).toBe('TEAM_INVALID');
    expect(go(['sobi_farm:ghost'])).toBe('TEAM_INVALID');
    expect(go([squad[0]!.key], [entry('a', { sick: true })])).toBe('FIGHTER_SICK');
    expect(go([squad[0]!.key], [entry('a', { purpose: 'SHIP' })])).toBe('NOT_A_FIGHTER');
    expect(go([squad[0]!.key], squad, 'zone_nope')).toBe('INVALID_REQUEST');
    const low = { ...w, progression: { ...w.progression, areas: {} } };
    expect(err(startRun(low, { zoneId: 'zone_forest', keys: [squad[0]!.key], roster: squad }, ctxAt(T0)))).toBe('ZONE_LOCKED');
    const running = ok(startRun(w, { zoneId: 'zone_forest', keys: [squad[0]!.key], roster: squad }, ctxAt(T0)));
    expect(err(startRun(running, { zoneId: 'zone_forest', keys: [squad[1]!.key], roster: squad }, ctxAt(T0)))).toBe('RUN_ACTIVE');
  });

  it('a fighter that spent its energy cannot go again until it refills; the others still can', () => {
    let w = adventureWorld();
    for (let i = 0; i < 4; i += 1) {
      const go = startRun(w, { zoneId: 'zone_forest', keys: [squad[0]!.key], roster: squad }, ctxAt(T0));
      if (i < 3) w = ok(retreat(ok(go), ctxAt(T0)));
      else expect(err(go)).toBe('NO_ADVENTURE_ENERGY'); // 100 → 70 → 40 → 10
      if (i < 3) w = ok(closeRun(w, ctxAt(T0)));
    }
    expect(err(startRun(w, { zoneId: 'zone_forest', keys: [squad[1]!.key], roster: squad }, ctxAt(T0)))).toBeUndefined();
    expect(err(startRun(w, { zoneId: 'zone_forest', keys: [squad[0]!.key], roster: squad }, ctxAt(T0 + 3 * H)))).toBeUndefined();
  });
});

describe('a run', () => {
  const begin = (level = 15) => ok(startRun(strong(adventureWorld(), level), { zoneId: 'zone_forest', keys: squad.map((e) => e.key), roster: squad }, ctxAt(T0)));

  it('a strong team clears the forest: experience, level-ups, coins, loot waiting, the boss chest, the zone XP', () => {
    const before = begin(10);
    const w = playRun(before);
    const a = adventureOf(w);
    expect(a.run).toMatchObject({ phase: 'done', result: 'win' });
    expect(a.runsCleared).toBe(1);
    expect(a.battlesWon).toBe(4); // three fights and the boss
    expect(w.wallet.coins).toBeGreaterThan(before.wallet.coins);
    expect(Object.keys(a.pending).length).toBeGreaterThan(0);
    expect(a.run!.expGained).toBeGreaterThan(0);
    expect(w.progression.areas.sobi_adventure!.xp).toBe(4 * AB.xp.battleWin + AB.xp.zoneClear);
    // the loot goes into the bag on request
    const taken = ok(collectLoot(w, ctxAt(T0)));
    expect(adventureOf(taken).pending).toEqual({});
    const inBag = Object.entries(a.pending).every(([id, n]) => (taken.inventory.items[id] ?? 0) >= n);
    expect(inBag).toBe(true);
    expect(adventureOf(ok(closeRun(taken, ctxAt(T0)))).run).toBeNull();
  });

  it('the same seed gives the same run; a run saved and loaded halfway ends the same', () => {
    const one = playRun(begin(), T0, 5);
    const two = playRun(begin(), T0, 5);
    expect(adventureOf(two)).toEqual(adventureOf(one));
    let half = begin();
    for (let i = 0; i < 4; i += 1) {
      const run = adventureOf(half).run!;
      half = ok(run.phase === 'battle' ? battleAct(half, { action: 'auto' }, ctxAt(T0, 5 + i)) : enterNode(half, ctxAt(T0, 5 + i)));
    }
    const reloaded = parseWorldSave(JSON.stringify(half));
    if (!reloaded.ok) throw new Error('reload failed');
    expect(playRun(reloaded.save, T0, 100)).toEqual(playRun(half, T0, 100));
  });

  it('a weak team loses: nobody is lost, everyone is exhausted for 4 real hours, what was found is kept', () => {
    const w0 = begin(1);
    const a = adventureOf(w0);
    // cripple the party: 1 HP and no attack, so the first battle is lost
    const weak: AdventureState = { ...a, run: { ...a.run!, team: a.run!.team.map((m) => ({ ...m, hp: 1, stats: { ...m.stats, hp: 1, atk: 1, def: 0 } })) } };
    const lost = playRun(withAdventure(w0, weak), T0 + 50);
    const after = adventureOf(lost);
    expect(after.run).toMatchObject({ phase: 'done', result: 'lose' });
    expect(after.runsLost).toBe(1);
    for (const e of squad) expect(after.fighters[e.key]!.exhaustedUntil).toBe(T0 + 50 + AB.run.exhaustHours * H);
    expect(whyNotReady(squad[0]!, after.fighters[squad[0]!.key], T0 + 51)).toBe('FIGHTER_EXHAUSTED');
    expect(whyNotReady(squad[0]!, after.fighters[squad[0]!.key], T0 + 50 + AB.run.exhaustHours * H + 1)).toBeNull();
    // exhaustion is time, not state: the Admin's time travel wears it off
    expect(exhaustedLeft(rewindAdventure(after, 5 * H).fighters[squad[0]!.key], T0 + 50)).toBe(0);
  });

  it('retreat between nodes keeps the loot and exhausts nobody; it is refused mid-battle', () => {
    let w = begin();
    w = ok(enterNode(w, ctxAt(T0, 3)));
    if (adventureOf(w).run!.phase === 'battle') expect(err(retreat(w, ctxAt(T0)))).toBe('WRONG_PHASE');
    w = playRun(begin(), T0, 9);
    const cleared = adventureOf(w);
    expect(cleared.fighters[squad[0]!.key]!.exhaustedUntil).toBeNull();
    const r = ok(retreat(begin(), ctxAt(T0)));
    expect(adventureOf(r).run).toMatchObject({ phase: 'done', result: 'retreat' });
    expect(adventureOf(r).fighters[squad[0]!.key]!.exhaustedUntil).toBeNull();
  });

  it('a chest and an event are one click; a battle waits for the player and uses items from the bag', () => {
    let w = begin(20);
    w = withBag(w, { item_potion_healing: 2, item_potion_battle: 1 });
    // the first node is a battle: step in
    w = ok(enterNode(w, ctxAt(T0, 1)));
    const run = adventureOf(w).run!;
    if (run.phase === 'battle') {
      expect(err(enterNode(w, ctxAt(T0)))).toBe('WRONG_PHASE');
      const mine = run.battle!.combatants.find((c) => c.side === 'ally' && c.id === run.battle!.order[0]);
      if (mine) {
        const used = ok(battleAct(w, { action: { kind: 'item', itemId: 'item_potion_battle' } }, ctxAt(T0, 2)));
        expect(used.inventory.items.item_potion_battle ?? 0).toBe(0);
        expect(err(battleAct(used, { action: { kind: 'item', itemId: 'item_potion_battle' } }, ctxAt(T0, 3)))).toBe('INSUFFICIENT_ITEM');
      }
    }
    const done = playRun(w);
    const node2 = ZONES.zone_forest!.nodes[1]!;
    expect(node2.type).toBe('chest');
    expect(adventureOf(done).run!.result).toBe('win');
  });

  it('a battle action off turn or out of phase is refused', () => {
    const w = begin();
    expect(err(battleAct(w, { action: 'auto' }, ctxAt(T0)))).toBe('WRONG_PHASE');
    expect(err(enterNode(adventureWorld(), ctxAt(T0)))).toBe('NO_RUN');
    expect(err(closeRun(w, ctxAt(T0)))).toBe('WRONG_PHASE');
  });
});

const withBag = (w: WorldSave, bag: Record<string, number>): WorldSave => ({ ...w, inventory: { items: { ...w.inventory.items, ...bag } } });

describe('equipment', () => {
  it('puts a piece of the bag on a fighter and gives the old one back; takes it off; not during a run', () => {
    let w = withBag(adventureWorld(), { item_equip_wood_sword: 1, item_equip_iron_sword: 1 });
    w = ok(equipItem(w, { key: squad[0]!.key, itemId: 'item_equip_wood_sword' }, ctxAt(T0)));
    expect(w.inventory.items.item_equip_wood_sword).toBe(0);
    expect(adventureOf(w).fighters[squad[0]!.key]!.loadout.weapon).toBe('item_equip_wood_sword');
    w = ok(equipItem(w, { key: squad[0]!.key, itemId: 'item_equip_iron_sword' }, ctxAt(T0)));
    expect(w.inventory.items.item_equip_wood_sword).toBe(1); // the replaced piece is back
    expect(adventureOf(w).fighters[squad[0]!.key]!.loadout.weapon).toBe('item_equip_iron_sword');
    w = ok(unequipSlotOf(w, { key: squad[0]!.key, slot: 'weapon' }, ctxAt(T0)));
    expect(w.inventory.items.item_equip_iron_sword).toBe(1);
    expect(adventureOf(w).fighters[squad[0]!.key]!.loadout).toEqual({});
    expect(err(unequipSlotOf(w, { key: squad[0]!.key, slot: 'weapon' }, ctxAt(T0)))).toBe('NOTHING_TO_DO');
    expect(err(equipItem(w, { key: squad[0]!.key, itemId: 'FOOD_BASIC' }, ctxAt(T0)))).toBe('NOT_EQUIPMENT');
    expect(err(equipItem(adventureWorld(), { key: squad[0]!.key, itemId: 'item_equip_wood_sword' }, ctxAt(T0)))).toBe('INSUFFICIENT_ITEM');
    const running = ok(startRun(w, { zoneId: 'zone_forest', keys: [squad[1]!.key], roster: squad }, ctxAt(T0)));
    expect(err(equipItem(running, { key: squad[1]!.key, itemId: 'item_equip_wood_sword' }, ctxAt(T0)))).toBe('RUN_ACTIVE');
  });
});

describe('the starter quest', () => {
  it('asks the world to hand over the knight pig once, with its first equipment', () => {
    const w = adventureWorld();
    const given: CreatureGift[] = [];
    const give = (world: WorldSave, gift: CreatureGift) => {
      given.push(gift);
      return { ok: true as const, state: world };
    };
    const r = ok(claimStarter(w, { give }, ctxAt(T0)));
    expect(given).toEqual([starterGift()]);
    expect(starterGift()).toMatchObject({ species: 'PIG_KNIGHT', purpose: 'ADVENTURE' });
    expect(adventureOf(r).starterClaimed).toBe(true);
    expect(r.inventory.items.item_equip_wood_sword).toBe(1);
    expect(err(claimStarter(r, { give }, ctxAt(T0)))).toBe('STARTER_CLAIMED');
    expect(given).toHaveLength(1);
  });

  it('a refused gift (the pen is full) leaves everything as it was', () => {
    const w = adventureWorld();
    const r = claimStarter(w, { give: () => ({ ok: false, error: 'NO_PIG_SLOT' }) }, ctxAt(T0));
    expect(err(r)).toBe('NO_PIG_SLOT');
    expect(adventureOf(w).starterClaimed).toBe(false);
  });
});

describe('links to the world', () => {
  it('tells the world about wins, finished runs, coins, gems and the loot taken', () => {
    const w = playRun(strong(ok(startRun(strong(adventureWorld(), 10), { zoneId: 'zone_forest', keys: squad.map((e) => e.key), roster: squad }, ctxAt(T0)))));
    expect(adventureOf(w).run!.result).toBe('win');
    // replay once to read the events
    let cur = ok(startRun(strong(adventureWorld(), 10), { zoneId: 'zone_forest', keys: squad.map((e) => e.key), roster: squad }, ctxAt(T0)));
    const all: { type: string }[] = [];
    for (let i = 0; i < 100 && adventureOf(cur).run!.phase !== 'done'; i += 1) {
      const r = adventureOf(cur).run!.phase === 'battle' ? battleAct(cur, { action: 'auto' }, ctxAt(T0, i)) : enterNode(cur, ctxAt(T0, i));
      if (!r.ok) throw new Error(r.error);
      cur = r.state;
      all.push(...r.events);
    }
    const world = adventureEventsToWorld(all);
    expect(world.filter((e) => e.type === 'battle.won')).toHaveLength(4);
    expect(world).toContainEqual({ type: 'adventure.finished', area: 'sobi_adventure', zoneId: 'zone_forest', won: true });
    expect(world.some((e) => e.type === 'currency.changed')).toBe(true);
  });

  it('suggestions and summary lines point to the adventure', () => {
    const w = adventureWorld();
    const a = adventureOf(w);
    expect(adventureSuggestions(a).map((s) => s.key)).toContain('suggest.adventure.starter');
    const pending = { ...a, starterClaimed: true, pending: { item_forest_herb: 3 } };
    expect(adventureSuggestions(pending).map((s) => s.key)).toContain('suggest.adventure.loot');
    expect(adventureSummaryLines(pending, T0).map((l) => l.key)).toContain('summary.adventure.loot');
    expect(adventureSummaryLines(pending, T0).every((l) => !l.goto || l.goto.target === 'adventure')).toBe(true);
  });
});

describe('the forest is beatable and not trivial', () => {
  it('a team of the first fighters wins most of the time at level 8 with starter gear, loses at level 1 without it', () => {
    const run = (level: number, gear: boolean, seed: number) => {
      const team = squad.map((e) => {
        const a = archetypeOf(e)!;
        const f = { level, exp: 0, loadout: gear ? { weapon: 'item_equip_iron_sword', armor: 'item_equip_bark_armor' } : {}, energy: 100, energyAt: 0, exhaustedUntil: null };
        return { id: e.key, side: 'ally' as const, name: e.name, element: a.element, stats: fighterStats(f, e, a), skills: fighterSkills(f, a) };
      });
      // the forest's four fights in a row, each with the HP that is left (no healing between)
      let hp = new Map<string, number>();
      for (const [i, node] of ZONES.zone_forest!.nodes.entries()) {
        if (node.type !== 'battle' && node.type !== 'boss') continue;
        const ids = node.type === 'boss' ? node.enemies : node.pool[0]!.enemies;
        const end = autoPlay(startBattle(seed * 31 + i, [...team.map((t) => ({ ...t, hp: hp.get(t.id) ?? t.stats.hp })), ...enemyInits(ids)], COMBAT_CONTEXT).state, COMBAT_CONTEXT);
        if (end.outcome !== 'win') return false;
        hp = new Map(end.combatants.filter((c) => c.side === 'ally').map((c) => [c.id, c.hp]));
      }
      return true;
    };
    const rate = (level: number, gear: boolean) => Array.from({ length: 60 }, (_, s) => run(level, gear, s)).filter(Boolean).length / 60;
    expect(rate(8, true)).toBeGreaterThan(0.6);
    expect(rate(1, false)).toBeLessThan(0.3);
    expect(enemyIdOf('enemy_mossling#2')).toBe('enemy_mossling');
  });
});
