// Toast text per event (spec §10.2, §11.3). Pure; the FeedbackDirector decides when it shows.
import { BREEDS } from '../../../../core/config/breeds';
import type { DecorId } from '../../../../core/config/ids';
import type { GameEvent } from '../../logic/events';
import type { Pig, FarmGame } from '../../logic/types';
import { formatDuration, formatInt, rewardText, t } from '../../../../i18n/format';
import { vi } from '../../../../i18n/vi';

/** When the mother's pregnancy started (the dispatch time), so the toast shows the full length. */
const pregnancyStart = (s: FarmGame, motherId: string): number =>
  s.pigs.find((p) => p.id === motherId)?.pregnancy?.startedAt ?? 0;

const achievementName = (id: string): string =>
  (vi.achievements as Record<string, string>)[id] ?? id;

/**
 * Toast text for an event, or null when it has none. `before` is the state before the dispatch
 * so a sold pig can still be named.
 */
export function toastText(
  event: GameEvent,
  after: FarmGame,
  before: FarmGame,
): string | null {
  const nameOf = (id: string) =>
    [...after.pigs, ...after.nursery, ...before.pigs, ...before.nursery].find((p) => p.id === id)
      ?.name ?? '';
  switch (event.type) {
    case 'PIG_BECAME_SICK':
      return t(vi.event.becameSick, { name: nameOf(event.pigId) });
    case 'PIG_BECAME_ADULT':
      return t(vi.event.becameAdult, { name: nameOf(event.pigId) });
    case 'PIG_NEED_DROPPED':
      return t(vi.event.needDropped[event.need][event.level], { name: nameOf(event.pigId) });
    case 'PIG_HUNGRY_ZERO':
      return event.stalled ? t(vi.event.hungryZero, { name: nameOf(event.pigId) }) : null;
    case 'BIRTH':
      return t(vi.event.birth, { mother: nameOf(event.motherId), child: nameOf(event.childId) });
    case 'TROUGH_EMPTY':
      return vi.event.troughEmpty;
    case 'LEVEL_UP':
      return t(vi.event.levelUp, { level: event.level });
    case 'DISCOVERY':
      return t(vi.event.discovery, {
        name: BREEDS[event.id as Pig['breed']].nameVi,
        gold: formatInt(event.gold),
      });
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
    case 'PIG_ADOPTED':
      return t(vi.event.adopted, { name: nameOf(event.pigId) });
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
    case 'GIFT_OPENED':
      return t(vi.event.giftOpened, { gold: formatInt(event.gold), xp: formatInt(event.xp) });
    case 'RELIEF_CLAIMED':
      return t(vi.event.reliefClaimed, { what: rewardText(event) });
    case 'DAILY_CLAIMED':
      return t(vi.event.dailyClaimed, { streak: event.streak, what: rewardText(event) });
    case 'ACHIEVEMENT_REACHED':
      return t(vi.event.achievementReached, { name: achievementName(event.id) });
    case 'ACHIEVEMENT_CLAIMED':
      return t(vi.event.achievementClaimed, {
        name: achievementName(event.id),
        gold: formatInt(event.gold),
      });
    case 'DECOR_BOUGHT':
      return t(vi.event.decorBought, { name: vi.decor[event.decorId as DecorId] });
    case 'GIFT_SPAWNED': // the box itself appears on the farm
    case 'SETTING_CHANGED':
    case 'PIG_FED':
    case 'PIG_CLEANED':
    case 'TROUGH_FILLED':
    case 'PIG_ATE_FROM_TROUGH':
      return null; // §11.3: no toast (the trough gauge updates itself)
  }
}
