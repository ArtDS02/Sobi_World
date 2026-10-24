// What the Adventure Shop and the Forge show (adventure-big-update-1 §17), as plain data: one shop card per line of workshop.json with
// buy buttons that dry-run the real purchase, one Forge card per recipe with what it takes (have / need for each), what it makes and
// why it cannot be made yet; the experience books a fighter can be given. Pure; unit-tested.
import type { RosterEntry } from '../../../core/area-registry/registry';
import { itemArtId } from '../../../core/config/assetIds';
import type { ErrorCode } from '../../../core/config/errors';
import type { ItemId } from '../../../core/config/ids';
import type { WorldSave } from '../../../core/save/world';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import type { ShopLineVm } from '../../../ui/components/shopGrid';
import { buyWorkshopItem, forge, missingFor, useTome } from '../logic/actions/workshop';
import { BATTLE_ITEMS, TOMES, WORKSHOP } from '../logic/config/content';
import { errorText, nameOfItem, probe, type ButtonVm } from './vmKit';

export const SHOP_COUNTS = [1, 5, 10] as const;

const W = () => vi.adventure.workshop;
const have = (w: WorldSave, id: string) => w.inventory.items[id] ?? 0;
const reasonOf = (e: ErrorCode | null) => (e === null ? null : e === 'INSUFFICIENT_GOLD' ? W().noGold : errorText(e));

/** What an item does, one short line (a book's experience, a potion's effect). */
function lineOf(itemId: string): string {
  if (TOMES[itemId]) return t(W().tomeLine, { exp: formatInt(TOMES[itemId]!) });
  if (BATTLE_ITEMS[itemId]) return (vi.adventure.battle.itemDetail as Record<string, string>)[itemId] ?? '';
  return '';
}

export function workshopShopVm(world: WorldSave, now: number): ShopLineVm[] {
  return WORKSHOP.shop.map((l) => ({
    itemId: l.itemId,
    name: nameOfItem(l.itemId),
    kind: BATTLE_ITEMS[l.itemId] ? 'medicine' : 'item',
    line: lineOf(l.itemId),
    art: itemArtId(l.itemId as ItemId),
    each: t(W().each, { gold: formatInt(l.price) }),
    owned: t(W().owned, { count: formatInt(have(world, l.itemId)) }),
    buys: SHOP_COUNTS.map((count) => ({
      count,
      label: t(W().buy, { count }),
      price: formatInt(l.price * count),
      reason: reasonOf(probe(world, (w, c) => buyWorkshopItem(w, { itemId: l.itemId, count }, c), now)),
    })),
  }));
}

export interface ForgeVm {
  id: string;
  /** What it makes (the first output names the card). */
  name: string;
  art: string;
  makes: string;
  inputs: { itemId: string; name: string; art: string; text: string; short: boolean }[];
  make: ButtonVm;
  /** Make it as many times as the bag allows (up to 10), when that is more than one. */
  makeMany: (ButtonVm & { times: number }) | null;
}

export function forgeVm(world: WorldSave, now: number): ForgeVm[] {
  return WORKSHOP.recipes.map((r) => {
    const [firstId] = Object.keys(r.outputs);
    const makes = Object.entries(r.outputs)
      .map(([id, n]) => `${n} ${nameOfItem(id)}`)
      .join(', ');
    let times = 0;
    while (times < 10 && Object.keys(missingFor(world, r.id, times + 1)).length === 0) times += 1;
    const missing = missingFor(world, r.id);
    const short = Object.entries(missing)
      .map(([id, n]) => `${n} ${nameOfItem(id)}`)
      .join(', ');
    const reason = short ? t(W().short, { items: short }) : reasonOf(probe(world, (w, c) => forge(w, { recipeId: r.id, times: 1 }, c), now));
    return {
      id: r.id,
      name: nameOfItem(firstId ?? ''),
      art: itemArtId((firstId ?? '') as ItemId),
      makes: t(W().makes, { items: makes }),
      inputs: Object.entries(r.inputs).map(([id, n]) => ({ itemId: id, name: nameOfItem(id), art: itemArtId(id as ItemId), text: t(W().have, { have: formatInt(have(world, id)), need: n ?? 0 }), short: have(world, id) < (n ?? 0) })),
      make: { label: W().make, reason },
      makeMany: times > 1 ? { label: t(W().makeN, { times }), reason: null, times } : null,
    };
  });
}

export interface TomeVm {
  itemId: string;
  label: string;
  art: string;
  use: ButtonVm;
  /** Use every book of this kind it holds (up to 10), when it holds more than one. */
  useMany: (ButtonVm & { count: number }) | null;
}

/** The experience books a fighter can be given now. */
export function tomesVm(world: WorldSave, key: string, roster: readonly RosterEntry[], now: number): TomeVm[] {
  return WORKSHOP.tomes
    .filter((tm) => have(world, tm.itemId) > 0)
    .map((tm) => {
      const n = have(world, tm.itemId);
      const reason = reasonOf(probe(world, (w, c) => useTome(w, { key, itemId: tm.itemId, count: 1, roster }, c), now));
      const many = Math.min(10, n);
      return {
        itemId: tm.itemId,
        label: t(vi.adventure.sheet.tome, { item: nameOfItem(tm.itemId), exp: formatInt(tm.exp), have: formatInt(n) }),
        art: itemArtId(tm.itemId as ItemId),
        use: { label: vi.adventure.sheet.use, reason },
        useMany: many > 1 && reason === null ? { label: t(vi.adventure.sheet.useAll, { count: many }), reason: null, count: many } : null,
      };
    });
}
