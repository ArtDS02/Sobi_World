// Toast text per event (spec §10.2, §11.3). Pure; the FeedbackDirector decides when it shows.
import { BREEDS } from '../../core/config/breeds';
import type { GameEvent } from '../../core/events';
import type { Pig, SaveGame } from '../../core/types';
import { formatDuration, formatInt, t } from '../../i18n/format';
import { vi } from '../../i18n/vi';

/** When the mother's pregnancy started (the dispatch time), so the toast shows the full length. */
const pregnancyStart = (s: SaveGame, motherId: string): number =>
  s.pigs.find((p) => p.id === motherId)?.pregnancy?.startedAt ?? 0;

/**
 * Toast text for an event, or null when it has none. `before` is the state before the dispatch
 * so a sold pig can still be named. `skinName` resolves a skin id to its manifest name.
 */
export function toastText(
  event: GameEvent,
  after: SaveGame,
  before: SaveGame,
  skinName: (skinId: string) => string = (id) => id,
): string | null {
  const nameOf = (id: string) =>
    (after.pigs.find((p) => p.id === id) ?? before.pigs.find((p) => p.id === id))?.name ?? '';
  switch (event.type) {
    case 'PIG_BECAME_SICK':
      return t(vi.event.becameSick, { name: nameOf(event.pigId) });
    case 'PIG_BECAME_ADULT':
      return t(vi.event.becameAdult, { name: nameOf(event.pigId) });
    case 'PIG_HUNGRY_ZERO':
      return event.stalled ? t(vi.event.hungryZero, { name: nameOf(event.pigId) }) : null;
    case 'BIRTH':
      return t(vi.event.birth, { mother: nameOf(event.motherId), child: nameOf(event.childId) });
    case 'TROUGH_EMPTY':
      return vi.event.troughEmpty;
    case 'LEVEL_UP':
      return t(vi.event.levelUp, { level: event.level });
    case 'DISCOVERY': {
      const name =
        event.kind === 'BREED' ? BREEDS[event.id as Pig['breed']].nameVi : skinName(event.id);
      return t(vi.event.discovery, { name, gold: formatInt(event.gold) });
    }
    case 'ORDER_NEW':
      return vi.event.orderNew;
    case 'ORDER_EXPIRED':
      return vi.event.orderExpired;
    case 'PIG_SOLD':
      return t(vi.event.sold, { name: nameOf(event.pigId), gold: formatInt(event.gold) });
    case 'ORDER_FULFILLED':
      return t(vi.event.orderFulfilled, { gold: formatInt(event.gold) });
    case 'PIG_BOUGHT':
      return t(vi.event.bought, { name: nameOf(event.pigId) });
    case 'PIG_TREATED':
      return t(vi.event.treated, { name: nameOf(event.pigId) });
    case 'ITEM_BOUGHT':
      return t(vi.event.itemBought, { quantity: event.quantity, item: vi.shop[event.itemId] });
    case 'PIG_RENAMED':
      return t(vi.event.renamed, { name: nameOf(event.pigId) });
    case 'BREEDING_STARTED':
      return t(vi.event.breedingStarted, {
        name: nameOf(event.motherId),
        time: formatDuration(Math.max(0, event.endsAt - pregnancyStart(after, event.motherId))),
      });
    case 'SLOT_BOUGHT':
      return t(vi.event.slotBought, { slots: event.slots });
    case 'SKIN_BOUGHT':
      return t(vi.event.skinBought, { name: skinName(event.skinId) });
    case 'SKIN_EQUIPPED':
    case 'PIG_FED':
    case 'PIG_CLEANED':
    case 'TROUGH_FILLED':
      return null; // §11.3: no toast (the trough gauge updates itself)
  }
}
