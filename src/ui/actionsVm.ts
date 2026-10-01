// Button availability by dry-running the real action: the disabled reason always matches what
// dispatch would answer. Pure (no DOM), unit-tested.
import { buyPig } from '../core/actions/buyPig';
import { cleanAll, cleanPig } from '../core/actions/cleanPig';
import { feedPig } from '../core/actions/feedPig';
import { fillTrough } from '../core/actions/fillTrough';
import { sellPig } from '../core/actions/sellPig';
import { treatPig } from '../core/actions/treatPig';
import { BREEDS } from '../core/config/breeds';
import type { ErrorCode } from '../core/config/errors';
import type { Gender } from '../core/config/ids';
import { ITEMS } from '../core/config/items';
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

/** Farm toolbar: buy a PINK pig per gender (D6), clean all. */
export function farmActions(save: SaveGame, now: number) {
  const buy = (gender: Gender) =>
    vm(save, now, vi.gender[gender], (s, c) => buyPig(s, { breed: 'PIG_EARTH_PINK', gender }, c));
  return {
    buyTitle: `${vi.action.buy} ${BREEDS.PIG_EARTH_PINK.nameVi} · ${t(vi.hud.gold, {
      amount: formatInt(BREEDS.PIG_EARTH_PINK.buyGold ?? 0),
    })}`,
    buyMale: buy('MALE'),
    buyFemale: buy('FEMALE'),
    cleanAll: vm(save, now, vi.action.cleanAll, (s, c) => cleanAll(s, c)),
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
