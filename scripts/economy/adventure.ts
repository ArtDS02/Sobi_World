// What the balance bot does in Sobi Adventure (GĐ11): a casual player takes the knight's pig, raises up to three pigs for the
// Adventure, wears the best equipment the bag has, carries rations when the field kitchen is bought, runs the farthest zone its
// fighters are fit for as long as they have energy, plays every battle on auto, brings the loot home, hatches eggs, and spends
// coins and materials on technologies in a fixed order. It never uses potions in a battle, so the numbers it prints are a floor.
// Imports only src/.
import { claimStarter, collectLoot, equipItem } from '../../src/areas/adventure/logic/actions/camp';
import { closeRun, startRun } from '../../src/areas/adventure/logic/actions/run';
import { spendSp, walkTrip } from './adventureTrip';
import { EQUIPMENT_DEFS, PREP_ITEMS, ZONE_LIST } from '../../src/areas/adventure/logic/config/content';
import { adventureOf, hasAdventure } from '../../src/areas/adventure/logic/save/lens';
import { hatchEgg } from '../../src/areas/farm/logic/actions/hatchEgg';
import { sellItem } from '../../src/areas/farm/logic/actions/sellItem';
import { setPurpose } from '../../src/areas/farm/logic/actions/setPurpose';
import { buyPig } from '../../src/areas/farm/logic/actions/buyPig';
import { BREEDS, BREED_IDS } from '../../src/areas/farm/logic/config/breeds';
import { liftFarmAction } from '../../src/areas/farm/logic/world';
import { collectCraft, startCraft } from '../../src/areas/garden/logic/actions/buildings';
import { gardenOf, hasGarden } from '../../src/areas/garden/logic/save/lens';
import { AREAS } from '../../src/app/areas';
import { WORLD_LEVELS } from '../../src/core/config/progression';
import { levelFromXp, worldXp } from '../../src/core/progression/levels';
import { ITEMS } from '../../src/core/config/items';
import type { ItemId } from '../../src/core/config/ids';
import { TECH_LIST } from '../../src/core/config/tech';
import { buyTech, techLevel } from '../../src/core/tech/tech';
import { EQUIPMENT_SLOTS } from '../../src/systems/equipment';
import type { Bot } from './week';

const RESERVE = 400;
/** Fighters the bot raises: three pigs, the size of a full party. */
const PARTY = 3;
/** The order the bot buys technologies in (a player first wants the kitchen, then rest, then the workshop). */
const TECH_ORDER: readonly [string, number][] = [
  ['tech_kitchen', 1], ['tech_camp', 1], ['tech_workshop', 1], ['tech_batch', 1],
  ['tech_kitchen', 2], ['tech_camp', 2], ['tech_workshop', 2], ['tech_kitchen', 3], ['tech_batch', 2], ['tech_camp', 3], ['tech_workshop', 3], ['tech_batch', 3],
];
/** The zones in the order of the chain, with the average level at which the bot dares to enter. */
const DARE_LEVEL: Record<string, number> = { zone_forest: 1, zone_mountain: 9, zone_ruins: 15 };

export interface AdventureStats {
  openAtHour: number | null;
  runs: number;
  wins: number;
  losses: number;
  /** Boss kills by zone id. */
  clears: Record<string, number>;
  /** Hours since the start at which each zone's boss first fell. */
  firstClearAtHour: Record<string, number>;
  eggsHatched: number;
  rationsEaten: number;
  /** Hours since the start at which each technology level was bought ("tech_x:2" → hour). */
  techAtHour: Record<string, number>;
  /** Coins taken from the Adventure's loot (battle and chest). */
  gems: number;
}

export const newAdventureStats = (): AdventureStats => ({ openAtHour: null, runs: 0, wins: 0, losses: 0, clears: {}, firstClearAtHour: {}, eggsHatched: 0, rationsEaten: 0, techAtHour: {}, gems: 0 });

const stat = (_b: Bot, item: string, slot: (typeof EQUIPMENT_SLOTS)[number]): number => {
  const d = EQUIPMENT_DEFS[item];
  return d && d.slot === slot ? Object.values(d.stats).reduce((n, v) => n + (v ?? 0), 0) : -1;
};

function raiseParty(b: Bot) {
  const have = b.farm().pigs.filter((p) => p.purpose === 'ADVENTURE').length;
  let need = PARTY - have;
  // Only combat animals fight (adventure-big-update-1 §14): the bot raises the ones it has, and buys the cheapest one it can.
  for (const p of b.farm().pigs) {
    if (need <= 0) break;
    if (p.purpose === 'ADVENTURE' || p.pregnancy !== null || p.growthProgress < 50 || !BREEDS[p.breed]?.fighter) continue;
    if (b.act('adventure', liftFarmAction((s, c) => setPurpose(s, { pigId: p.id, purpose: 'ADVENTURE' }, c)))) need -= 1;
  }
  const waiting = b.farm().pigs.filter((p) => p.purpose !== 'ADVENTURE' && BREEDS[p.breed]?.fighter).length;
  if (need > 0 && waiting === 0) {
    // A mixed team fares better: the cheapest breed it does not have yet first.
    const owned = new Set(b.farm().pigs.map((p) => p.breed));
    const buyable = BREED_IDS.filter((id) => BREEDS[id].fighter && BREEDS[id].buyGold !== null && BREEDS[id].enabled).sort((x, y) => Number(owned.has(x)) - Number(owned.has(y)) || BREEDS[x].buyGold! - BREEDS[y].buyGold!);
    for (const breed of buyable) {
      if (b.coins() < RESERVE + BREEDS[breed].buyGold!) continue;
      if (b.act('pigs bought', liftFarmAction((s, c) => buyPig(s, { breed, gender: 'MALE' }, c)))) break;
    }
  }
}

function dressParty(b: Bot, keys: string[]) {
  for (const slot of EQUIPMENT_SLOTS) {
    for (const key of keys) {
      const worn = adventureOf(b.world).fighters[key]?.loadout[slot];
      const best = Object.keys(b.world.inventory.items)
        .filter((id) => (b.world.inventory.items[id] ?? 0) > 0 && stat(b, id, slot) > (worn ? stat(b, worn, slot) : 0))
        .sort((a, c) => stat(b, c, slot) - stat(b, a, slot))[0];
      if (best) b.act('adventure', (w, c) => equipItem(w, { key, itemId: best }, c));
    }
  }
}

function buyTechs(b: Bot) {
  for (const [id, level] of TECH_ORDER) {
    if (techLevel(b.world, id) >= level) continue;
    if (b.coins() < RESERVE) return;
    const def = TECH_LIST.find((t) => t.id === id)!;
    const next = def.levels[level - 1];
    if (!next || techLevel(b.world, id) !== level - 1) continue;
    if (b.coins() < RESERVE + next.coins) return; // save up for the next one in order
    if (b.act('technology', (w, c) => buyTech(w, { techId: id }, c, TECH_LIST))) b.adv.techAtHour[`${id}:${level}`] = (b.now - b.start) / 3_600_000;
    else return; // missing materials: wait for the next loot
  }
}

/** Rations: made at the mill whenever the field kitchen is bought and the stock runs low. */
function kitchen(b: Bot) {
  if (!hasGarden(b.world) || !gardenOf(b.world).built.mill || techLevel(b.world, 'tech_kitchen') < 1) return;
  b.act('garden', (w, c) => collectCraft(w, { building: 'mill' }, c));
  const recipes: [string, string][] = [['item_ration_hearty', 'recipe_ration_hearty'], ['item_ration_spicy', 'recipe_ration_spicy'], ['item_ration_swift', 'recipe_ration_swift']];
  for (const [item, recipeId] of recipes) {
    if (b.bag(item) >= 4 || gardenOf(b.world).jobs.mill) continue;
    for (const n of [4, 3, 2, 1]) if (b.act('garden', (w, c) => startCraft(w, { building: 'mill', recipeId, batches: n }, c))) break;
  }
}

function prepFor(b: Bot): string[] {
  const slots = TECH_LIST.find((t) => t.effect === 'prepSlots')!.levels[techLevel(b.world, 'tech_kitchen') - 1]?.value ?? 0;
  return Object.keys(PREP_ITEMS).filter((id) => b.bag(id) > 0).slice(0, slots);
}

function goOut(b: Bot) {
  const roster = AREAS.roster(b.world);
  for (let round = 0; round < 6; round += 1) {
    if (adventureOf(b.world).run) return;
    const fit = roster.filter((e) => e.purpose === 'ADVENTURE');
    const levelOf = (key: string) => adventureOf(b.world).fighters[key]?.level ?? 1;
    let started = false;
    for (const zone of [...ZONE_LIST].reverse()) {
      const sorted = [...fit].sort((a, c) => levelOf(c.key) - levelOf(a.key));
      for (let size = Math.min(PARTY, sorted.length); size >= 1 && !started; size -= 1) {
        const keys = sorted.slice(0, size).map((e) => e.key);
        const avg = keys.reduce((n, k) => n + levelOf(k), 0) / keys.length;
        if (avg < (DARE_LEVEL[zone.id] ?? 1) || size < Math.min(2, sorted.length)) continue;
        const prep = prepFor(b);
        dressParty(b, keys);
        // The party must all be fit: ask the real action.
        if (b.act('adventure', (w, c) => startRun(w, { zoneId: zone.id, keys, roster, prep }, c))) {
          started = true;
          b.adv.runs += 1;
          b.adv.rationsEaten += prep.length;
        }
      }
      if (started) break;
    }
    if (!started) return;
    walkTrip(b);
    const run = adventureOf(b.world).run;
    if (run?.result === 'win') {
      b.adv.wins += 1;
      b.adv.clears[run.zoneId] = (b.adv.clears[run.zoneId] ?? 0) + 1;
      b.adv.firstClearAtHour[run.zoneId] ??= (b.now - b.start) / 3_600_000;
    } else if (run) b.adv.losses += 1;
    b.act('adventure', (w, c) => collectLoot(w, c));
    b.act('adventure', (w, c) => closeRun(w, c));
  }
}

export function adventureRoutine(b: Bot) {
  if (!hasAdventure(b.world) && b.forceAdventure && levelFromXp(worldXp(b.world), { xp: WORLD_LEVELS.xp, maxLevel: WORLD_LEVELS.maxLevel }) >= 8) {
    const opened = AREAS.get('sobi_adventure')!.init(b.world, { now: b.now, rng: b.rng, dayOffsetMs: 0 });
    b.world = { ...opened, world: { ...opened.world, unlockedAreas: [...opened.world.unlockedAreas, 'sobi_adventure'] } };
  }
  if (!hasAdventure(b.world)) return;
  b.adv.openAtHour ??= (b.now - b.start) / 3_600_000;
  if (!adventureOf(b.world).starterClaimed) b.act('adventure', (w, c) => claimStarter(w, { give: (x, g, cc) => AREAS.give(x, g, cc) }, c));
  b.act('adventure', (w, c) => collectLoot(w, c));
  raiseParty(b);
  spendSp(b);
  buyTechs(b);
  kitchen(b);
  goOut(b);
  // Hatch the eggs while there is room, then keep the bag tidy so the loot always finds room.
  while (b.bag('item_pig_egg_wild') > 0 && b.act('adventure', liftFarmAction((s, c) => hatchEgg(s, { itemId: 'item_pig_egg_wild' as ItemId }, c)))) b.adv.eggsHatched += 1;
  declutter(b);
  b.act('adventure', (w, c) => collectLoot(w, c));
}

/** What a tidy player keeps of each item; the rest of what can be sold is sold (a bag of 40 slots is for what is used). */
const KEEP: Record<string, number> = { item_ancient_cog: 40, item_ancient_rune: 12, item_mountain_ore: 40, item_forest_herb: 40, item_beast_fang: 40, item_pure_water: 12, item_flower_rainbow_rose: 6, item_potion_battle: 3, item_potion_healing: 3, item_potion_mood: 3 };

function declutter(b: Bot) {
  for (const [id, item] of Object.entries(ITEMS)) {
    if (item.sellGold === undefined || b.bag(id) <= 0) continue;
    const keep = item.category === 'EQUIPMENT' ? 0 : item.category === 'FISH' || item.category === 'SEED' ? 2 : (KEEP[id] ?? (item.category === 'MATERIAL' ? 30 : 60));
    const quantity = b.bag(id) - keep;
    if (quantity > 0 && id !== 'item_pig_egg_wild' && !PREP_ITEMS[id]) b.act(`sold ${id.replace('item_', '')}`, liftFarmAction((s, c) => sellItem(s, { itemId: id as ItemId, quantity }, c)));
  }
}
