// Button availability by dry-running the real action: the disabled reason always matches what
// dispatch would answer. Pure (no DOM), unit-tested.
import { buyDecor } from '../logic/actions/buyDecor';
import { buyPig } from '../logic/actions/buyPig';
import { buyProduct } from '../logic/actions/buyProduct';
import { buySlot } from '../logic/actions/buySlot';
import { cleanManure } from '../logic/actions/cleanManure';
import { upgradeTrough } from '../logic/actions/upgradeTrough';
import { nextTroughLevel, troughLevel } from '../logic/troughLevel';
import { cleanAll, cleanPig } from '../logic/actions/cleanPig';
import { feedPig } from '../logic/actions/feedPig';
import { petPig } from '../logic/actions/petPig';
import { pigFavorite } from '../logic/bond';
import { fillTrough } from '../logic/actions/fillTrough';
import { sellPig } from '../logic/actions/sellPig';
import { treatPig } from '../logic/actions/treatPig';
import { BREEDS } from '../logic/config/breeds';
import type { ErrorCode } from '../../../core/config/errors';
import { BALANCE } from '../logic/config/balance';
import { BREED_IDS } from '../logic/config/breeds';
import type { Gender } from '../../../core/config/ids';
import type { BreedId } from '../logic/config/ids';
import { levelFromXp, slotUnlock } from '../logic/config/levels';
import { rarityRank } from '../../../core/config/rarity';
import type { AssetRegistry } from '../../../core/assets/registry';
import { ITEMS } from '../../../core/config/items';
import { DECOR_IDS, DECORS } from '../logic/config/decor';
import { decorBonus } from '../logic/decor';
import { productById, shopProducts } from '../logic/shopProducts';
import { QUALITY_RULES } from '../../../systems/quality/quality';
import { CONTENT } from '../../../core/config/content';
import { mulberry32 } from '../../../core/rng';
import type { FarmGame } from '../logic/types';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import type { BoundAction } from '../store';

export interface ActionVm {
  label: string;
  /** Visible reason when the button is disabled, null when enabled. */
  reason: string | null;
  run: BoundAction;
}

const SHORT_REASON: Partial<Record<ErrorCode, string>> = {
  ALREADY_FULL: vi.disabled.notHungry,
  ALREADY_CLEAN: vi.disabled.notDirty,
  PIG_NOT_SICK: vi.disabled.notSick,
  PIG_NOT_MATURE: vi.disabled.notMature,
  PIG_IS_PREGNANT: vi.disabled.isPregnant,
  PIG_IS_SICK: vi.disabled.isSick,
  NO_PIG_SLOT: vi.disabled.noSlot,
  NURSERY_FULL: vi.disabled.nurseryFull,
  PET_LIMIT_REACHED: vi.disabled.petLimit,
};

/** Error code → short disabled reason; INSUFFICIENT_ITEM names the missing item. */
export function reasonFor(error: ErrorCode, missingItem?: string): string {
  if (error === 'INSUFFICIENT_ITEM' && missingItem) return missingItem;
  return SHORT_REASON[error] ?? vi.error[error];
}

/** Dry-runs `run` with a throwaway rng; the real dispatch uses the store's rng and clock. */
export function probe(save: FarmGame, run: BoundAction, now: number): ErrorCode | null {
  const r = run(save, { now, rng: mulberry32(0) });
  return r.ok ? null : r.error;
}

function vm(save: FarmGame, now: number, label: string, run: BoundAction, item?: string): ActionVm {
  const error = probe(save, run, now);
  return { label, run, reason: error ? reasonFor(error, item) : null };
}

/** Panel buttons for one pig (§10.2). Breeding and orders arrive in later phases. */
export function pigActions(save: FarmGame, pigId: string, now: number) {
  const args = { pigId };
  return {
    feed: vm(save, now, vi.action.feed, (s, c) => feedPig(s, args, c), vi.disabled.noFood),
    /** The Garden's foods, offered only while the bag holds some. */
    feedPremium: save.inventory.FOOD_PREMIUM > 0 ? vm(save, now, t(vi.action.feedPremium, { count: save.inventory.FOOD_PREMIUM }), (s, c) => feedPig(s, { ...args, itemId: 'FOOD_PREMIUM' }, c)) : null,
    feedGrass: save.inventory.item_grass > 0 ? vm(save, now, t(vi.action.feedGrass, { count: save.inventory.item_grass }), (s, c) => feedPig(s, { ...args, itemId: 'item_grass' }, c)) : null,
    pet: vm(save, now, vi.action.pet, (s, c) => petPig(s, args, c)),
    /** Its favourite crop, offered only while the bag holds one. */
    feedFavorite: (() => {
      const pig = save.pigs.find((p) => p.id === pigId);
      const item = pig ? pigFavorite(pig) : null;
      return item && save.inventory[item] > 0
        ? vm(save, now, t(vi.action.feedFavorite, { item: vi.shop[item], count: save.inventory[item] }), (s, c) => feedPig(s, { ...args, itemId: item }, c))
        : null;
    })(),
    clean: vm(save, now, vi.action.clean, (s, c) => cleanPig(s, args, c)),
    treat: vm(save, now, vi.action.treat, (s, c) => treatPig(s, args, c), vi.disabled.noMedicine),
    sell: vm(save, now, vi.action.sell, (s, c) => sellPig(s, args, c)),
  };
}

/** Farm toolbar: bathe all, rake the pen. Buying moved to the shop (R03). */
export function farmActions(save: FarmGame, now: number) {
  return {
    cleanAll: vm(save, now, vi.action.cleanAll, (s, c) => cleanAll(s, c)),
    cleanManure: vm(save, now, vi.action.cleanManure, (s, c) => cleanManure(s, c)),
  };
}

const goldText = (amount: number) => t(vi.hud.gold, { amount: formatInt(amount) });

/**
 * Shop pigs tab: every species with a shop price, commonest first (stable in config order), one
 * button per gender. The level lock reads better than "not enough gold" when both fail.
 */
export function shopPigs(save: FarmGame, now: number, assets: AssetRegistry | null = null) {
  const buyable = BREED_IDS.filter((id) => BREEDS[id].buyGold !== null && BREEDS[id].enabled).sort(
    (a, b) => rarityRank(BREEDS[a].rarity) - rarityRank(BREEDS[b].rarity),
  );
  const level = levelFromXp(save.player.xp);
  return buyable.map((breed: BreedId) => {
    const def = BREEDS[breed];
    const lock = level < def.unlockLevel ? t(vi.shop.slotLocked, { level: def.unlockLevel }) : null;
    const buy = (gender: Gender): ActionVm => {
      const b = vm(save, now, vi.gender[gender], (s, c) => buyPig(s, { breed, gender }, c));
      return lock ? { ...b, reason: lock } : b;
    };
    return {
      breed,
      rarity: def.rarity,
      name: def.nameVi,
      thumb: assets?.url(def.artId) ?? null,
      price: goldText(def.buyGold ?? 0),
      sell: t(vi.shop.sellUpTo, {
        gold: formatInt(Math.floor(def.sellGold * QUALITY_RULES.priceFactor.PERFECT * Math.max(...CONTENT.valuation.market.map((m) => m.factor)))),
      }),
      male: buy('MALE'),
      female: buy('FEMALE'),
    };
  });
}

/** Shop items tab rows; the quantity is chosen in the buy dialog (itemPurchase). */
/** Shop item tab: the active products (DECISIONS AD-1), in their admin order. */
export function shopItems(save: FarmGame) {
  return shopProducts().map((p) => ({
    id: p.id,
    icon: p.icon,
    name: p.nameVi,
    desc: p.descVi,
    price: goldText(p.priceGold),
    owned: save.inventory[p.itemId],
  }));
}

/** Buy dialog for `count` packs of one product (§8.10). */
export function productPurchase(save: FarmGame, productId: string, count: number, now: number) {
  const p = productById(productId);
  return {
    name: p?.nameVi ?? productId,
    desc: p?.descVi ?? '',
    total: t(vi.shop.total, { gold: formatInt((p?.priceGold ?? 0) * Math.max(0, count)) }),
    confirm: vm(save, now, vi.action.buy, (s, c) => buyProduct(s, { productId, count }, c)),
    max: BALANCE.SHOP_MAX_QUANTITY,
  };
}

/** Shop slots tab: the next slot, its price and level gate (§8.11); null when all are open. */
export function shopSlot(save: FarmGame, now: number) {
  const n = save.player.unlockedSlots + 1;
  const unlock = slotUnlock(n);
  if (!unlock) return null;
  const run: BoundAction = (s, c) => buySlot(s, {}, c);
  const error = probe(save, run, now);
  const reason =
    error === 'LEVEL_TOO_LOW'
      ? t(vi.shop.slotLocked, { level: unlock.level })
      : error
        ? reasonFor(error)
        : null;
  return {
    title: t(vi.shop.slotNext, { n }),
    price: goldText(unlock.cost),
    buy: { label: vi.action.buy, reason, run } satisfies ActionVm,
  };
}

/** Shop decorations tab (PG-3): every decoration, owned ones marked; total bonus on top. */
export function shopDecor(save: FarmGame, now: number) {
  const items = DECOR_IDS.map((id) => {
    const def = DECORS[id];
    const run: BoundAction = (s, c) => buyDecor(s, { decorId: id }, c);
    const error = probe(save, run, now);
    const reason =
      error === 'LEVEL_TOO_LOW'
        ? t(vi.shop.slotLocked, { level: def.unlockLevel })
        : error === 'ALREADY_OWNED'
          ? vi.decor.owned
          : error
            ? reasonFor(error)
            : null;
    return {
      id,
      artId: def.artId,
      name: vi.decor[id],
      bonus: t(vi.decor.bonus, { n: def.happyBonus }),
      price: goldText(def.priceGold),
      owned: save.decor.includes(id),
      buy: { label: vi.action.buy, reason, run } satisfies ActionVm,
    };
  });
  return { total: t(vi.decor.total, { n: decorBonus(save) }), items };
}

/** Fill dialog breakdown and confirm button for `units` (§8.6). */
export function troughFill(save: FarmGame, units: number, now: number) {
  const fromInventory = Math.min(save.inventory.FOOD_BASIC, Math.max(0, units));
  const toBuy = Math.max(0, units - fromInventory);
  return {
    current: t(vi.trough.current, save.trough),
    fromInventory: t(vi.trough.fromInventory, { n: fromInventory }),
    toBuy: t(vi.trough.toBuy, {
      n: toBuy,
      gold: formatInt(toBuy * ITEMS.FOOD_BASIC.priceGold),
    }),
    confirm: vm(save, now, t(vi.trough.fill, { n: units }), (s, c) => fillTrough(s, { units }, c)),
  };
}

/** The trough's level line and its upgrade button (GAME_BALANCE §2.6); null upgrade at the top level. */
export function troughUpgrade(save: FarmGame, now: number) {
  const next = nextTroughLevel(save.trough);
  return {
    level: t(vi.trough.level, { level: troughLevel(save.trough), capacity: save.trough.capacity }),
    upgrade: next
      ? vm(save, now, t(vi.trough.upgrade, { level: next.level, capacity: next.capacity, gold: formatInt(next.cost) }), (s, c) => upgradeTrough(s, c))
      : null,
  };
}

/** Free space in the trough: the default amount the fill dialog offers. */
export const troughSpace = (save: FarmGame): number =>
  Math.max(0, save.trough.capacity - save.trough.food);
