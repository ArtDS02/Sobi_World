// What the Aquarium's screens show, as plain data (no DOM): the HUD, the bar's buttons, the tank, the bag of fish and
// breeding. The fish card is fishCardVm.ts, the dock dockVm.ts. Availability is found by dry-running the real action, like
// the Garden's gardenVm, so a disabled reason is always what dispatch would answer. Pure; unit-tested.
import { itemArtId } from '../../../core/config/assetIds';
import type { ItemId } from '../../../core/config/ids';
import { ITEMS } from '../../../core/config/items';
import { WORLD_LEVELS } from '../../../core/config/progression';
import { levelProgress, worldXp } from '../../../core/progression/levels';
import type { WorldSave } from '../../../core/save/world';
import { formatDuration, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { TRAITS } from '../../../systems/breeding';
import { breedFish, pairError } from '../logic/actions/breed';
import { cleanTank, feedFish } from '../logic/actions/care';
import { upgradeTank } from '../logic/actions/trade';
import { AB, FEED_ITEM, FISH, FISH_LIST, fishOfItem, tankCapacity } from '../logic/config/content';
import { castCooldownLeft, nextTankLevel, tankFree } from '../logic/derived';
import { itemSalePrice } from '../../../systems/valuation/itemPrice';
import { aquariumOf } from '../logic/save/lens';
import { scalesCap } from '../logic/simulate';
import { button, gold, nameOfItem, probe, reasonFor, type AquariumRun, type ButtonVm } from './vmKit';

export { probe, reasonFor, type AquariumRun, type ButtonVm } from './vmKit';

// ---- HUD ---------------------------------------------------------------------------------------------------------

export interface HudVm {
  coins: string;
  level: string;
  xp: string;
  /** 0..100 */
  xpProgress: number;
}

export function hudVm(world: WorldSave): HudVm {
  const xp = worldXp(world);
  const { level, next, percent } = levelProgress(xp, WORLD_LEVELS);
  return {
    coins: gold(world.wallet.coins),
    level: t(vi.aquarium.level, { level }),
    xp: next === null ? vi.aquarium.xpMax : t(vi.aquarium.xp, { current: gold(xp), next: gold(next) }),
    xpProgress: percent,
  };
}

// ---- The bar under the scene -------------------------------------------------------------------------------------

/** What the bar's feed-all button runs: every fish that is not full. */
export const feedAllRun = (world: WorldSave): AquariumRun => (w, c) =>
  feedFish(w, { fishIds: aquariumOf(world).fish.filter((f) => f.hunger < 100).map((f) => f.id) }, c);

export interface BarVm {
  fish: ButtonVm;
  feedAll: ButtonVm;
  water: ButtonVm;
  scales: ButtonVm;
  bag: ButtonVm;
  tank: ButtonVm;
  breed: ButtonVm;
}

export const bagFish = (world: WorldSave): { itemId: string; count: number }[] =>
  [...FISH_LIST.map((f) => f.item), AB.fishing.oyster.item]
    .map((itemId) => ({ itemId, count: world.inventory.items[itemId] ?? 0 }))
    .filter((r) => r.count > 0);

export function barVm(world: WorldSave, now: number, dayOffsetMs: number): BarVm {
  const a = aquariumOf(world);
  const hungry = a.fish.filter((f) => f.hunger < 100).length;
  const feed = world.inventory.items[FEED_ITEM] ?? 0;
  const caught = bagFish(world).reduce((n, r) => n + r.count, 0);
  const cool = castCooldownLeft(a, now);
  return {
    fish: { label: vi.aquarium.bar.fish, reason: cool > 0 ? t(vi.aquarium.fishing.rest, { time: formatDuration(cool) }) : null },
    feedAll: {
      label: vi.aquarium.bar.feedAll,
      reason: a.fish.length === 0 ? vi.aquarium.noFish : hungry === 0 ? vi.aquarium.allFull : feed === 0 && world.wallet.coins < ITEMS.FOOD_FISH.priceGold ? vi.aquarium.noFeed : null,
    },
    water: button(vi.aquarium.bar.water, probe(world, (w, c) => cleanTank(w, {}, c), now, dayOffsetMs), { WATER_CLEAN: vi.aquarium.waterClear }),
    scales: { label: t(vi.aquarium.bar.scales, { count: a.tank.scales }), reason: a.tank.scales === 0 ? vi.aquarium.noScales : null },
    bag: { label: t(vi.aquarium.bar.bag, { count: caught }), reason: caught === 0 ? vi.aquarium.bagEmpty : null },
    tank: { label: vi.aquarium.bar.tank, reason: null },
    breed: { label: vi.aquarium.bar.breed, reason: breedablePairs(world, now).length === 0 ? vi.aquarium.breedNone : null },
  };
}

// ---- The tank ----------------------------------------------------------------------------------------------------

export interface TankVm {
  levelText: string;
  waterText: string;
  waterState: string;
  waterPercent: number;
  scalesText: string;
  eggs: string[];
  upgrade: ButtonVm | null;
  upgradeNeeds: { name: string; have: number; need: number }[];
  maxText: string | null;
}

export function tankVm(world: WorldSave, now: number, dayOffsetMs: number): TankVm {
  const a = aquariumOf(world);
  const next = nextTankLevel(a);
  const water = Math.round(a.tank.water);
  const needs = next
    ? Object.entries(next.materials)
        .filter(([, n]) => (n ?? 0) > 0)
        .map(([id, n]) => ({ name: nameOfItem(id), have: world.inventory.items[id] ?? 0, need: n ?? 0 }))
    : [];
  const matText = needs.map((m) => ` + ${m.need} ${m.name}`).join('');
  const error = next ? probe(world, (w, c) => upgradeTank(w, {}, c), now, dayOffsetMs) : null;
  const lack = needs.find((m) => m.have < m.need);
  return {
    levelText: t(vi.aquarium.tankLevel, { level: a.tank.level, capacity: tankCapacity(a.tank.level), count: a.fish.length }),
    waterText: t(vi.aquarium.water, { percent: water }),
    waterState: water >= 70 ? vi.aquarium.waterState.clear : water >= 35 ? vi.aquarium.waterState.ok : vi.aquarium.waterState.dirty,
    waterPercent: water,
    scalesText: t(vi.aquarium.scalesLine, { count: a.tank.scales, cap: scalesCap(a.tank.level) }),
    eggs: a.eggs.map((e) =>
      e.hatchAt > now
        ? t(vi.aquarium.eggLine, { name: FISH[e.species]?.nameVi ?? e.species, time: formatDuration(e.hatchAt - now) })
        : t(vi.aquarium.eggWaits, { name: FISH[e.species]?.nameVi ?? e.species }),
    ),
    upgrade: next
      ? {
          label: t(vi.aquarium.upgrade, { level: next.level, capacity: next.capacity, price: `${gold(next.price)}${matText}` }),
          reason: error === 'INSUFFICIENT_GOLD' ? vi.aquarium.noGold : lack ? t(vi.aquarium.noMaterial, { name: lack.name }) : error ? reasonFor(error) : null,
        }
      : null,
    upgradeNeeds: needs,
    maxText: next ? null : vi.aquarium.upgradeMax,
  };
}

// ---- Fish in the bag ---------------------------------------------------------------------------------------------

export interface BagFishRow {
  itemId: string;
  name: string;
  art: string;
  count: number;
  /** Fish only: it can go into the tank. */
  release: ButtonVm | null;
  sellOne: ButtonVm;
  sellAll: ButtonVm;
}

export function bagVm(world: WorldSave, now = 0, dayOffsetMs = 0): BagFishRow[] {
  const a = aquariumOf(world);
  return bagFish(world).map((r) => {
    const item = ITEMS[r.itemId as ItemId];
    const isFish = fishOfItem(r.itemId) !== undefined;
    return {
      itemId: r.itemId,
      name: nameOfItem(r.itemId),
      art: itemArtId(r.itemId),
      count: r.count,
      release: isFish ? { label: vi.aquarium.release, reason: tankFree(a) <= 0 ? vi.aquarium.tankFull : null } : null,
      sellOne: { label: t(vi.aquarium.sellOne, { gold: gold(itemSalePrice(item, 1, now, dayOffsetMs)) }), reason: null },
      sellAll: { label: t(vi.aquarium.sellAll, { gold: gold(itemSalePrice(item, r.count, now, dayOffsetMs)) }), reason: null },
    };
  });
}

// ---- Breeding ----------------------------------------------------------------------------------------------------

export interface PairVm {
  aId: string;
  bId: string;
  speciesName: string;
  art: string;
  label: string;
  /** The traits the pair can pass on, names only. */
  traitNames: string[];
}

/** Every male–female pair of one breedable species that the rules allow right now. */
export function breedablePairs(world: WorldSave, now: number): PairVm[] {
  const a = aquariumOf(world);
  const out: PairVm[] = [];
  const males = a.fish.filter((f) => f.gender === 'MALE');
  const females = a.fish.filter((f) => f.gender === 'FEMALE');
  for (const m of males) {
    for (const f of females) {
      if (pairError(a, m, f, now) !== null) continue;
      const species = FISH[m.breed]!;
      const names = [...new Set([...(m.traits ?? []), ...(f.traits ?? [])])].map((id) => TRAITS.get(id)?.nameVi ?? id);
      out.push({ aId: m.id, bId: f.id, speciesName: species.nameVi, art: species.art, label: t(vi.aquarium.breedNote, { a: m.name, b: f.name }), traitNames: names });
    }
  }
  return out;
}

/** Why the pair button is off (null = it works). */
export function breedReason(world: WorldSave, pair: PairVm, now: number, dayOffsetMs: number): string | null {
  const error = probe(world, (w, c) => breedFish(w, { fishAId: pair.aId, fishBId: pair.bId }, c), now, dayOffsetMs);
  return error === 'INSUFFICIENT_ITEM' ? vi.aquarium.breedReasonNoFeed : error ? reasonFor(error) : null;
}

