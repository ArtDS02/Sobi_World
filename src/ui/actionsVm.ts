// Button availability by dry-running the real action: the disabled reason always matches what
// dispatch would answer. Pure (no DOM), unit-tested.
import { buyItem } from '../core/actions/buyItem';
import { buyPig } from '../core/actions/buyPig';
import { buySlot } from '../core/actions/buySlot';
import { cleanAll, cleanPig } from '../core/actions/cleanPig';
import { feedPig } from '../core/actions/feedPig';
import { fillTrough } from '../core/actions/fillTrough';
import { sellPig } from '../core/actions/sellPig';
import { treatPig } from '../core/actions/treatPig';
import { BREEDS } from '../core/config/breeds';
import type { ErrorCode } from '../core/config/errors';
import { BALANCE } from '../core/config/balance';
import { BREED_IDS } from '../core/config/breeds';
import type { BreedId, Gender, ItemId } from '../core/config/ids';
import { slotUnlock } from '../core/config/levels';
import { ITEM_IDS, ITEMS } from '../core/config/items';
import { mulberry32 } from '../core/rng';
import type { SaveGame } from '../core/types';
import { formatInt, t } from '../i18n/format';
import { vi } from '../i18n/vi';
import type { BoundAction } from '../store/gameStore';

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
};

/** Error code → short disabled reason; INSUFFICIENT_ITEM names the missing item. */
export function reasonFor(error: ErrorCode, missingItem?: string): string {
  if (error === 'INSUFFICIENT_ITEM' && missingItem) return missingItem;
  return SHORT_REASON[error] ?? vi.error[error];
}

/** Dry-runs `run` with a throwaway rng; the real dispatch uses the store's rng and clock. */
export function probe(save: SaveGame, run: BoundAction, now: number): ErrorCode | null {
  const r = run(save, { now, rng: mulberry32(0) });
  return r.ok ? null : r.error;
}

function vm(save: SaveGame, now: number, label: string, run: BoundAction, item?: string): ActionVm {
  const error = probe(save, run, now);
  return { label, run, reason: error ? reasonFor(error, item) : null };
}

/** Panel buttons for one pig (§10.2). Breeding and orders arrive in later phases. */
export function pigActions(save: SaveGame, pigId: string, now: number) {
  const args = { pigId };
  return {
    feed: vm(save, now, vi.action.feed, (s, c) => feedPig(s, args, c), vi.disabled.noFood),
    clean: vm(save, now, vi.action.clean, (s, c) => cleanPig(s, args, c)),
    treat: vm(save, now, vi.action.treat, (s, c) => treatPig(s, args, c), vi.disabled.noMedicine),
    sell: vm(save, now, vi.action.sell, (s, c) => sellPig(s, args, c)),
  };
}

/** Farm toolbar: clean all. Buying moved to the shop (R03). */
export function farmActions(save: SaveGame, now: number) {
  return { cleanAll: vm(save, now, vi.action.cleanAll, (s, c) => cleanAll(s, c)) };
}

const goldText = (amount: number) => t(vi.hud.gold, { amount: formatInt(amount) });

/** Shop pigs tab: every breed with a shop price (D6), one button per gender. */
export function shopPigs(save: SaveGame, now: number) {
  const buyable = BREED_IDS.filter((id) => BREEDS[id].buyGold !== null);
  return buyable.map((breed: BreedId) => {
    const buy = (gender: Gender) =>
      vm(save, now, vi.gender[gender], (s, c) => buyPig(s, { breed, gender }, c));
    return {
      breed,
      name: BREEDS[breed].nameVi,
      price: goldText(BREEDS[breed].buyGold ?? 0),
      male: buy('MALE'),
      female: buy('FEMALE'),
    };
  });
}

/** Shop items tab rows; the quantity is chosen in the buy dialog (itemPurchase). */
export function shopItems(save: SaveGame) {
  return ITEM_IDS.map((id: ItemId) => ({
    id,
    name: vi.shop[id],
    desc: vi.shop[`${id}_desc`],
    price: goldText(ITEMS[id].priceGold),
    owned: save.inventory[id],
  }));
}

/** Buy dialog for `quantity` of one item (§8.10). */
export function itemPurchase(save: SaveGame, itemId: ItemId, quantity: number, now: number) {
  return {
    total: t(vi.shop.total, { gold: formatInt(ITEMS[itemId].priceGold * Math.max(0, quantity)) }),
    confirm: vm(save, now, vi.action.buy, (s, c) => buyItem(s, { itemId, quantity }, c)),
    max: BALANCE.SHOP_MAX_QUANTITY,
  };
}

/** Shop slots tab: the next slot, its price and level gate (§8.11); null when all are open. */
export function shopSlot(save: SaveGame, now: number) {
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

/** Fill dialog breakdown and confirm button for `units` (§8.6). */
export function troughFill(save: SaveGame, units: number, now: number) {
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

/** Free space in the trough: the default amount the fill dialog offers. */
export const troughSpace = (save: SaveGame): number =>
  Math.max(0, save.trough.capacity - save.trough.food);
