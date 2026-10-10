// The farm's working state (FarmGame, the Sobi Farm v7 shape every farm rule is written against) and
// the world save v8 it lives in. farmOf reads the farm view out of a world; withFarm writes a changed
// view back: farm-only fields go to `areas.sobi_farm`, money / items / xp / achievements / collection /
// settings to their world fields. Untouched world data (other Areas, other items, gems) is kept.
import { ITEM_ID_VALUES } from '../../../../core/config/ids';
import { areaXp, worldXp } from '../../../../core/progression/levels';
import { FARM_DOC_VERSION } from './legacyConfig';
import type { WorldSave } from '../../../../core/save/world';
import type { FarmGame } from '../types';
import type { FarmArea } from './farmSchema';

export const FARM_AREA_ID = 'sobi_farm';

/** Farm view of a world, cached per world object so readers get stable references. */
const views = new WeakMap<WorldSave, FarmGame>();

export function farmArea(world: WorldSave): FarmArea {
  const area = world.areas[FARM_AREA_ID];
  if (!area) throw new Error('the farm has no state in this world (init not run)');
  return area as FarmArea;
}

export function farmOf(world: WorldSave): FarmGame {
  const cached = views.get(world);
  if (cached) return cached;
  const area = farmArea(world);
  const { items } = world.inventory;
  const farm: FarmGame = {
    schemaVersion: FARM_DOC_VERSION,
    createdAt: world.meta.createdAt,
    updatedAt: world.meta.updatedAt,
    player: {
      gold: world.wallet.coins,
      xp: worldXp(world), // the one Sobi World XP (decision 007): every Area's XP added up
      unlockedSlots: area.unlockedSlots,
    },
    pigs: area.pigs,
    nursery: area.nursery,
    trough: area.trough,
    inventory: Object.fromEntries(ITEM_ID_VALUES.map((id) => [id, items[id] ?? 0])) as FarmGame['inventory'],
    orders: area.orders,
    collection: { discoveredBreeds: (world.collection.discovered.breed ?? []) as FarmGame['collection']['discoveredBreeds'] },
    transactions: world.transactions as FarmGame['transactions'],
    breedingRecords: area.breedingRecords,
    gifts: area.gifts,
    progress: {
      stats: world.progression.stats,
      claimed: world.progression.claimed,
      daily: world.progression.daily,
    },
    decor: area.decor,
    ...(area.decorPlan === undefined ? {} : { decorPlan: area.decorPlan }),
    ...(area.manure === undefined ? {} : { manure: area.manure }),
    ...(area.graceUntil === undefined ? {} : { graceUntil: area.graceUntil }),
    ...(area.memorials === undefined ? {} : { memorials: area.memorials }),
    ...(area.breedingPity === undefined ? {} : { breedingPity: area.breedingPity }),
    settings: world.settings,
  };
  views.set(world, farm);
  return farm;
}

/** `world` with the farm view `farm` written back; `world` itself when nothing changed. */
export function withFarm(world: WorldSave, farm: FarmGame): WorldSave {
  if (views.get(world) === farm) return world;
  const area: FarmArea = {
    unlockedSlots: farm.player.unlockedSlots,
    pigs: farm.pigs,
    nursery: farm.nursery,
    trough: farm.trough,
    orders: farm.orders,
    gifts: farm.gifts,
    decor: farm.decor,
    ...(farm.decorPlan === undefined ? {} : { decorPlan: farm.decorPlan }),
    breedingRecords: farm.breedingRecords,
    ...(farm.manure === undefined ? {} : { manure: farm.manure }),
    ...(farm.graceUntil === undefined ? {} : { graceUntil: farm.graceUntil }),
    ...(farm.memorials === undefined ? {} : { memorials: farm.memorials }),
    ...(farm.breedingPity === undefined ? {} : { breedingPity: farm.breedingPity }),
  };
  const next: WorldSave = {
    ...world,
    meta: { ...world.meta, createdAt: farm.createdAt, updatedAt: farm.updatedAt },
    wallet: { ...world.wallet, coins: farm.player.gold },
    inventory: { items: { ...world.inventory.items, ...farm.inventory } },
    // A farm transaction without a currency moved coins (the farm's only money).
    transactions: farm.transactions.map((t) => ({ ...t, currency: t.currency ?? 'coins' })),
    progression: {
      ...world.progression,
      // The farm sees the world's XP: what it gained goes to its own entry, the other Areas keep theirs.
      areas: { ...world.progression.areas, [FARM_AREA_ID]: { xp: Math.max(0, farm.player.xp - (worldXp(world) - areaXp(world, FARM_AREA_ID))) } },
      stats: farm.progress.stats,
      claimed: farm.progress.claimed,
      daily: farm.progress.daily,
    },
    collection: { ...world.collection, discovered: { ...world.collection.discovered, breed: farm.collection.discoveredBreeds } },
    settings: farm.settings,
    areas: { ...world.areas, [FARM_AREA_ID]: area },
  };
  return next; // its farm view is rebuilt on demand (transactions now carry their currency)
}
