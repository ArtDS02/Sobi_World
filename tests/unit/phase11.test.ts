// GĐ11 — Adventure links the whole world: technologies, ancient materials, rations before a run, the zone chain, eggs, and the
// "no dead resource" audit.
import { describe, expect, it } from 'vitest';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { adventureArea } from '../../src/areas/adventure';
import { startRun } from '../../src/areas/adventure/logic/actions/run';
import { simulateRuns } from '../../src/areas/adventure/logic/battleSim';
import { AB, CLASS_LIST, ENEMIES, LOOT_TABLES, ZONES, ZONE_LIST, contentProblems } from '../../src/areas/adventure/logic/config/content';
import { energyOf, msToEnergy, withPrep } from '../../src/areas/adventure/logic/fighters';
import { adventureOf, withAdventure } from '../../src/areas/adventure/logic/save/lens';
import { campVm, zoneCards } from '../../src/areas/adventure/ui/campVm';
import { buildWorkshop, startCraft } from '../../src/areas/garden/logic/actions/buildings';
import { gardenArea } from '../../src/areas/garden';
import { gardenOf } from '../../src/areas/garden/logic/save/lens';
import { workshopVm } from '../../src/areas/garden/ui/gardenVm';
import { makePig } from './pigFactory';
import { hatchEgg } from '../../src/areas/farm/logic/actions/hatchEgg';
import { farmOf } from '../../src/areas/farm/logic/save/lens';
import type { RosterEntry } from '../../src/core/area-registry/registry';
import { RECIPES } from '../../src/core/config/recipes';
import { TECH_LIST, TECHS, techBonus } from '../../src/core/config/tech';
import { batchMs, sped } from '../../src/core/production/production';
import { mulberry32 } from '../../src/core/rng';
import type { WorldSave } from '../../src/core/save/world';
import { buyTech, nextTechLevel, recipeLocked, techLevel, techValue } from '../../src/core/tech/tech';
import type { ActionContext } from '../../src/core/types';
import { deriveStats, zeroStats } from '../../src/systems/combat/stats';
import { itemUses } from '../../scripts/audit/itemUses';
import { ITEM_IDS } from '../../src/core/config/items';

const H = 3_600_000;
const T0 = 20_000 * 86_400_000;
const ctxAt = (now: number, seed = 7): ActionContext => ({ now, rng: mulberry32(seed) });
const ok = <T extends { ok: boolean }>(r: T): Extract<T, { ok: true }> => {
  if (!r.ok) throw new Error(`action failed: ${(r as unknown as { error: string }).error}`);
  return r as Extract<T, { ok: true }>;
};
const err = (r: { ok: boolean; error?: string }): string | undefined => (r.ok ? undefined : r.error);

const withBag = (w: WorldSave, items: Record<string, number>, coins = 100_000): WorldSave => ({ ...w, wallet: { ...w.wallet, coins }, inventory: { items: { ...w.inventory.items, ...items } } });
const withTech = (w: WorldSave, levels: Record<string, number>): WorldSave => ({ ...w, progression: { ...w.progression, stats: { ...w.progression.stats, ...Object.fromEntries(Object.entries(levels).map(([id, n]) => [`tech.${id}`, n])) } } });
const fresh = (): WorldSave => SAVE_CODEC.newWorld(ctxAt(T0));
const gardenWorld = (): WorldSave => gardenArea.init(fresh(), ctxAt(T0));

describe('technologies (core/tech)', () => {
  it('the content has four technologies with rising levels and each effect given once', () => {
    expect(TECH_LIST.map((t) => t.effect).sort()).toEqual(['adventureEnergy', 'maxBatches', 'prepSlots', 'productionSpeed']);
    for (const t of TECH_LIST) {
      expect(t.levels.length).toBeGreaterThanOrEqual(3);
      t.levels.forEach((l, i) => i > 0 && expect(l.value).toBeGreaterThan(t.levels[i - 1]!.value));
    }
  });

  it('buying a level takes the coins and the materials, raises the level and tells the world', () => {
    const w = withBag(fresh(), { item_mountain_ore: 10 }, 2000);
    const r = ok(buyTech(w, { techId: 'tech_workshop' }, ctxAt(T0), TECH_LIST));
    expect(techLevel(r.state, 'tech_workshop')).toBe(1);
    expect(r.state.wallet.coins).toBe(2000 - 1500);
    expect(r.state.inventory.items.item_mountain_ore).toBe(2);
    expect(r.state.transactions[0]).toMatchObject({ type: 'TECH_UPGRADE', amount: -1500, refId: 'tech_workshop' });
    expect(r.events).toEqual([{ type: 'TECH_UPGRADED', techId: 'tech_workshop', level: 1, coins: 1500, items: { item_mountain_ore: 8 } }]);
    expect(techBonus(r.state, 'productionSpeed')).toBe(0.15);
    expect(techBonus(w, 'productionSpeed')).toBe(0);
  });

  it('refuses without coins or materials and changes nothing; refuses the top level and a stranger', () => {
    const poor = withBag(fresh(), { item_mountain_ore: 10 }, 100);
    expect(err(buyTech(poor, { techId: 'tech_workshop' }, ctxAt(T0), TECH_LIST))).toBe('INSUFFICIENT_GOLD');
    const bare = withBag(fresh(), {}, 100_000);
    expect(err(buyTech(bare, { techId: 'tech_workshop' }, ctxAt(T0), TECH_LIST))).toBe('INSUFFICIENT_ITEM');
    const top = withTech(withBag(fresh(), { item_ancient_cog: 99, item_ancient_rune: 9, item_mountain_ore: 99 }, 1e6), { tech_workshop: 3 });
    expect(err(buyTech(top, { techId: 'tech_workshop' }, ctxAt(T0), TECH_LIST))).toBe('TECH_MAX_LEVEL');
    expect(nextTechLevel(top, TECHS.tech_workshop!)).toBeNull();
    expect(err(buyTech(top, { techId: 'tech_nope' }, ctxAt(T0), TECH_LIST))).toBe('INVALID_REQUEST');
    expect(techValue(top, 'productionSpeed', TECH_LIST)).toBe(0.45);
  });

  it('a technology can be bought level by level up to its top', () => {
    let w = withBag(fresh(), { item_ancient_cog: 40, item_ancient_rune: 10, item_mountain_ore: 80, item_beast_fang: 40, item_forest_herb: 40 }, 1e6);
    for (const t of TECH_LIST) for (let i = 0; i < t.levels.length; i += 1) w = ok(buyTech(w, { techId: t.id }, ctxAt(T0), TECH_LIST)).state;
    for (const t of TECH_LIST) expect(techLevel(w, t.id)).toBe(t.levels.length);
  });
});

describe('what technologies do', () => {
  it('Workshop and Big Oven: a job started after the purchase is faster and may be longer; the job keeps its own time', () => {
    const recipe = RECIPES.recipe_pig_feed!;
    let w = withBag(gardenWorld(), { item_corn: 400, item_wheat: 200 });
    w = ok(buildWorkshop(w, { building: 'mill' }, ctxAt(T0))).state;
    expect(err(startCraft(w, { building: 'mill', recipeId: recipe.id, batches: 11 }, ctxAt(T0)))).toBe('INVALID_REQUEST');
    const slow = ok(startCraft(w, { building: 'mill', recipeId: recipe.id, batches: 2 }, ctxAt(T0))).state;
    expect(batchMs(gardenOf(slow).jobs.mill!, recipe)).toBe(recipe.durationMs);

    const quick = withTech(w, { tech_workshop: 2, tech_batch: 1 });
    const job = gardenOf(ok(startCraft(quick, { building: 'mill', recipeId: recipe.id, batches: 15 }, ctxAt(T0))).state).jobs.mill!;
    expect(job.batches).toBe(15);
    expect(job.durationMs).toBe(sped(recipe, 0.3));
    expect(job.durationMs!).toBeLessThan(recipe.durationMs);
    expect(workshopVm(quick, 'mill', T0).recipes[0]!.maxBatches).toBe(15);
    // The speed is in the job, so a technology bought later does not move a job in progress.
    const later = withTech(slow, { tech_workshop: 3 });
    expect(batchMs(gardenOf(later).jobs.mill!, recipe)).toBe(recipe.durationMs);
  });

  it('a field-kitchen recipe is locked until its level, then it works (and the Garden screen says why)', () => {
    const recipe = RECIPES.recipe_ration_hearty!;
    expect(recipe.requires).toEqual({ tech: 'tech_kitchen', level: 1 });
    let w = withBag(gardenWorld(), { item_potato: 10, item_forest_herb: 10 });
    w = ok(buildWorkshop(w, { building: 'mill' }, ctxAt(T0))).state;
    expect(recipeLocked(w, recipe)).toBe(true);
    expect(err(startCraft(w, { building: 'mill', recipeId: recipe.id, batches: 1 }, ctxAt(T0)))).toBe('RECIPE_LOCKED');
    const row = workshopVm(w, 'mill', T0).recipes.find((r) => r.recipe.id === recipe.id)!;
    expect(row.locked).toContain('Bếp Dã Chiến');
    const open = withTech(w, { tech_kitchen: 1 });
    expect(workshopVm(open, 'mill', T0).recipes.find((r) => r.recipe.id === recipe.id)!.locked).toBeNull();
    const made = ok(startCraft(open, { building: 'mill', recipeId: recipe.id, batches: 2 }, ctxAt(T0))).state;
    expect(made.inventory.items.item_potato).toBe(6);
    expect(recipeLocked(withTech(w, { tech_kitchen: 3 }), RECIPES.recipe_ration_swift!)).toBe(false);
    expect(recipeLocked(withTech(w, { tech_kitchen: 1 }), RECIPES.recipe_ration_swift!)).toBe(true);
  });

  it('Camp: adventure energy refills faster by the bought share', () => {
    const f = { energy: 10, energyAt: T0 };
    expect(energyOf(f, T0 + 2 * H)).toBe(10 + 2 * AB.run.energyPerHour);
    expect(energyOf(f, T0 + 2 * H, 0.5)).toBe(10 + 3 * AB.run.energyPerHour);
    expect(msToEnergy(f, T0, 30, 1)).toBe(Math.ceil((20 / (AB.run.energyPerHour * 2)) * H));
  });
});

// ---- the adventure side ----------------------------------------------------------------------------------------------

const entry = (id: string): RosterEntry => ({ key: `sobi_farm:${id}`, areaId: 'sobi_farm', id, kind: 'pig', name: id, speciesId: 'PIG_KNIGHT', family: 'ADVENTURE', rarity: 'COMMON', hearts: 0, sick: false, adult: true, purpose: 'ADVENTURE', artId: 'pig_knight' });
const squad = [entry('a'), entry('b'), entry('c')];

function adventureWorld(bag: Record<string, number> = {}): WorldSave {
  const f = fresh();
  const rich = { ...f, progression: { ...f.progression, areas: { ...f.progression.areas, sobi_farm: { xp: 1_000_000 } } } };
  const opened = adventureArea.init(rich, ctxAt(T0));
  return { ...opened, wallet: { ...opened.wallet, coins: 1000 }, inventory: { items: { ...bag } } };
}

describe('rations before a run', () => {
  const go = (w: WorldSave, prep?: string[], keys = [squad[0]!.key]) => startRun(w, { zoneId: 'zone_forest', keys, roster: squad, ...(prep ? { prep } : {}) }, ctxAt(T0));

  it('no field kitchen means no rations; with it, rations leave the bag and lift every fighter for the run', () => {
    const w = adventureWorld({ item_ration_hearty: 2, item_ration_spicy: 1 });
    expect(err(go(w, ['item_ration_hearty']))).toBe('PREP_INVALID');
    const kitchen = withTech(w, { tech_kitchen: 2 });
    const plain = ok(go(kitchen)).state;
    const fed = ok(go(kitchen, ['item_ration_hearty', 'item_ration_spicy'])).state;
    expect(fed.inventory.items.item_ration_hearty).toBe(1);
    expect(fed.inventory.items.item_ration_spicy).toBe(0);
    const a = adventureOf(plain).run!.team[0]!;
    const b = adventureOf(fed).run!.team[0]!;
    expect(b.stats.hp).toBe(Math.round(a.stats.hp * 1.15));
    expect(b.stats.atk).toBe(Math.round(a.stats.atk * 1.12));
    expect(b.stats.matk).toBe(Math.round(a.stats.matk * 1.12));
    expect(b.hp).toBe(b.stats.hp);
    expect(adventureOf(fed).run!.prep).toEqual(['item_ration_hearty', 'item_ration_spicy']);
  });

  it('refuses more rations than slots, the same ration twice, one not in the bag and one that is not a ration', () => {
    const w = withTech(adventureWorld({ item_ration_hearty: 3, item_ration_spicy: 3, item_ration_swift: 3, item_beast_fang: 3 }), { tech_kitchen: 1 });
    expect(err(go(w, ['item_ration_hearty', 'item_ration_spicy']))).toBe('PREP_INVALID'); // one slot
    const two = withTech(w, { tech_kitchen: 2 });
    expect(err(go(two, ['item_ration_hearty', 'item_ration_hearty']))).toBe('PREP_INVALID');
    expect(err(go(two, ['item_beast_fang']))).toBe('PREP_INVALID');
    expect(err(go(withTech(adventureWorld(), { tech_kitchen: 1 }), ['item_ration_spicy']))).toBe('PREP_INVALID');
  });

  it('a failed start spends no ration and no energy', () => {
    const w = withTech(adventureWorld({ item_ration_hearty: 1 }), { tech_kitchen: 1 });
    expect(err(go(w, ['item_ration_hearty'], ['sobi_farm:ghost']))).toBe('TEAM_INVALID');
    expect(w.inventory.items.item_ration_hearty).toBe(1);
  });

  it('the swift ration adds speed and crit by flat numbers; unknown ids add nothing', () => {
    const base = { ...zeroStats(), hp: 100, atk: 20, def: 6, spd: 10, crit: 8 };
    expect(withPrep(base, ['item_ration_swift'])).toEqual({ ...base, spd: 12, crit: 11 });
    expect(withPrep(base, ['nonsense'])).toEqual(base);
  });

  it('the hub lists the rations, how many are in the bag and the slots the kitchen gives', () => {
    const w = withTech(adventureWorld({ item_ration_hearty: 2 }), { tech_kitchen: 2 });
    const hub = campVm(w, squad, T0, { starter: (x) => ({ ok: true, state: x, events: [] }), loot: (x) => ({ ok: true, state: x, events: [] }) });
    expect(hub.prepSlots).toBe(2);
    expect(hub.prep.find((p) => p.itemId === 'item_ration_hearty')).toMatchObject({ have: 2, effect: '+15% Máu' });
    expect(campVm(adventureWorld(), squad, T0, { starter: (x) => ({ ok: true, state: x, events: [] }), loot: (x) => ({ ok: true, state: x, events: [] }) }).prepSlots).toBe(0);
  });
});

describe('Bond lifts the stats more (GĐ11)', () => {
  it('five hearts add a quarter of the stats', () => {
    const base = { ...zeroStats(), hp: 100, atk: 20, def: 6, spd: 10, crit: 8 };
    const none = deriveStats(base, { level: 1, rarityMult: 1, hearts: 0 }, { levelGrowth: AB.stats.levelGrowth, bondPerHeart: AB.stats.bondPerHeart });
    const full = deriveStats(base, { level: 1, rarityMult: 1, hearts: 5 }, { levelGrowth: AB.stats.levelGrowth, bondPerHeart: AB.stats.bondPerHeart });
    expect(AB.stats.bondPerHeart).toBe(0.05);
    expect(full.atk).toBe(Math.round(none.atk * 1.25));
    expect(full.hp).toBe(125);
  });
});

describe('the zone chain: Forest → Mountain → Ruins', () => {
  const mountain = (w: WorldSave) => startRun(w, { zoneId: 'zone_mountain', keys: [squad[0]!.key], roster: squad }, ctxAt(T0));

  it('the content has three zones that each end in a boss, with new enemies, art and a link back to the one before', () => {
    expect(contentProblems()).toEqual([]);
    expect(ZONE_LIST.map((z) => z.id)).toEqual(['zone_forest', 'zone_mountain', 'zone_ruins']);
    expect(ZONES.zone_mountain!.requiresCleared).toBe('zone_forest');
    expect(ZONES.zone_ruins!.requiresCleared).toBe('zone_mountain');
    expect(ZONES.zone_ruins!.fromWorldLevel).toBeGreaterThan(ZONES.zone_mountain!.fromWorldLevel);
    for (const z of ZONE_LIST) expect(z.maps).toHaveLength(3);
    expect(Object.values(ENEMIES).filter((e) => e.boss)).toHaveLength(3);
  });

  it('a zone opens only after the boss of the zone before it fell', () => {
    const w = adventureWorld();
    expect(err(mountain(w))).toBe('ZONE_NOT_CLEARED');
    expect(zoneCards(w).find((z) => z.id === 'zone_mountain')!.locked).toContain('Rừng Thì Thầm');
    const cleared = withAdventure(w, { ...adventureOf(w), cleared: { zone_forest: 1 } });
    expect(err(mountain(cleared))).toBeUndefined();
    expect(zoneCards(cleared).find((z) => z.id === 'zone_mountain')!.locked).toBeNull();
    expect(err(startRun(cleared, { zoneId: 'zone_ruins', keys: [squad[0]!.key], roster: squad }, ctxAt(T0)))).toBe('ZONE_NOT_CLEARED');
  });

  it('a low world level still keeps the zone shut (the level check comes first)', () => {
    const low = withAdventure(fresh(), adventureOf(adventureArea.init(fresh(), ctxAt(T0))));
    expect(err(mountain(low))).toBe('ZONE_LOCKED');
  });

  it('the loot flows back: ancient materials, rare seeds, rare fish, eggs and a few Gems', () => {
    const ids = (t: string) => LOOT_TABLES[t]!.entries.map((e) => e.itemId);
    expect(ids('boss_mountain')).toEqual(expect.arrayContaining(['item_ancient_cog', 'item_mountain_ore', 'item_pig_egg_wild', 'item_seed_star_orchid', 'item_fish_seahorse']));
    expect(ids('treasure_mountain')).toEqual(expect.arrayContaining(['item_seed_rainbow_rose', 'item_skill_scroll']));
    expect(ids('boss_ruins')).toEqual(expect.arrayContaining(['item_ancient_rune', 'item_pig_egg_wild', 'item_fish_dragon_koi']));
    for (const t of ['boss_mountain', 'boss_ruins']) {
      expect(LOOT_TABLES[t]!.gemChance).toBeGreaterThan(0.02);
      expect(LOOT_TABLES[t]!.gemChance).toBeLessThanOrEqual(0.15); // Gems stay rare (GAME_BALANCE §8)
    }
    // Treasure chests open once per save: richer in Gems, still at most 3 a chest.
    for (const t of ['treasure_forest', 'treasure_mountain', 'treasure_ruins']) expect(LOOT_TABLES[t]!.gems[1]).toBeLessThanOrEqual(3);
    expect(ids('treasure_forest')).not.toContain('item_ancient_rune');
    expect(ids('treasure_mountain')).not.toContain('item_ancient_rune');
  });

  it('balance guard (decision 037): a balanced team needs levels in each zone, and gear helps', () => {
    const team = [
      { lineage: 'thiet_giap' as const, classId: 'tanker' as const },
      { lineage: 'hoa_giai' as const, classId: 'striker' as const },
      { lineage: 'quang_tru' as const, classId: 'support' as const },
    ];
    const win = (zoneId: string, level: number, gear: 'common' | 'uncommon' | 'rare' | 'epic') => simulateRuns({ zoneId, level, team, gear, samples: 40, seed: 5 }).winPercent;
    expect(win('zone_forest', 1, 'common')).toBeLessThan(15);
    expect(win('zone_forest', 8, 'common')).toBeGreaterThan(80);
    expect(win('zone_mountain', 6, 'uncommon')).toBeLessThan(20);
    expect(win('zone_mountain', 16, 'uncommon')).toBeGreaterThan(80);
    expect(win('zone_ruins', 8, 'rare')).toBeLessThan(10);
    expect(win('zone_ruins', 22, 'epic')).toBeGreaterThan(70);
  });

  it('every class fights somewhere: none is dead weight in the Mountain beside a tank and a healer', () => {
    for (const c of CLASS_LIST) {
      const r = simulateRuns({ zoneId: 'zone_mountain', level: 16, team: [{ lineage: 'loi_duong', classId: c.id }, { lineage: 'quy_son', classId: 'tanker' }, { lineage: 'quang_tru', classId: 'support' }], gear: 'rare', samples: 30, seed: 6 });
      expect(r.winPercent, c.id).toBeGreaterThan(30);
    }
  });
});

describe('eggs from the Adventure', () => {
  const farmWithEgg = (eggs = 1) => ({ ...farmOf(fresh()), inventory: { ...farmOf(fresh()).inventory, item_pig_egg_wild: eggs } });

  it('hatches into a rare pig, in a free slot, discovered in the Codex, and the egg is gone', () => {
    const r = ok(hatchEgg(farmWithEgg(2), { itemId: 'item_pig_egg_wild' }, ctxAt(T0)));
    const pig = r.state.pigs.at(-1)!;
    expect(r.state.inventory.item_pig_egg_wild).toBe(1);
    expect(r.state.pigs.length).toBe(farmOf(fresh()).pigs.length + 1);
    expect(pig.growthProgress).toBe(0);
    expect(r.events[0]).toMatchObject({ type: 'PIG_HATCHED', pigId: pig.id, itemId: 'item_pig_egg_wild' });
  });

  it('is the same pig for the same seed, refuses a full pen, a missing egg and a non-egg without taking the egg', () => {
    const a = ok(hatchEgg(farmWithEgg(), { itemId: 'item_pig_egg_wild' }, ctxAt(T0, 3)));
    const b = ok(hatchEgg(farmWithEgg(), { itemId: 'item_pig_egg_wild' }, ctxAt(T0, 3)));
    expect(a.state.pigs.at(-1)!.breed).toBe(b.state.pigs.at(-1)!.breed);
    expect(err(hatchEgg(farmWithEgg(0), { itemId: 'item_pig_egg_wild' }, ctxAt(T0)))).toBe('INSUFFICIENT_ITEM');
    expect(err(hatchEgg(farmWithEgg(), { itemId: 'item_beast_fang' }, ctxAt(T0)))).toBe('NOT_AN_EGG');
    const full = farmWithEgg();
    const crowded = { ...full, pigs: Array.from({ length: full.player.unlockedSlots }, (_, i) => makePig({ id: `x${i}`, slotIndex: i })) };
    expect(err(hatchEgg(crowded, { itemId: 'item_pig_egg_wild' }, ctxAt(T0)))).toBe('NO_PIG_SLOT');
  });
});

describe('no dead resource (spec §13 rule 2)', () => {
  it('every item of the bag has at least two kinds of use', () => {
    const uses = itemUses();
    const dead = ITEM_IDS.filter((id) => uses[id].length < 2);
    expect(dead).toEqual([]);
  });

  it('the Adventure materials are sinks: ore and cogs and runes go into technologies and upgrades, not only the shop', () => {
    const uses = itemUses();
    expect(uses.item_ancient_cog).toEqual(expect.arrayContaining(['upgrade', 'technology']));
    expect(uses.item_ancient_rune).toEqual(expect.arrayContaining(['upgrade', 'technology']));
    expect(uses.item_mountain_ore).toContain('technology');
    expect(uses.item_ration_hearty).toContain('ration');
    expect(uses.item_pig_egg_wild).toContain('hatch');
  });
});
