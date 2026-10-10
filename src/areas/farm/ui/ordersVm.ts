// Orders view-model (spec §8.14, §10.1): one card per live order with its requirements, reward,
// time left and the pigs that can fill it. Pure, so it is unit-tested directly.
import { penMood } from '../logic/decor';
import { fulfillOrder, pigMeetsOrder } from '../logic/actions/fulfillOrder';
import { BREEDS } from '../logic/config/breeds';
import { happiness } from '../logic/happiness';
import type { FarmGame } from '../logic/types';
import { formatDuration, formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import type { ActionVm } from './actionsVm';

export interface OrderCardVm {
  id: string;
  /** Art of the wanted species (manifest id). */
  artId: string;
  want: string;
  gender: string;
  minHappiness: string;
  reward: string;
  expiresIn: string;
  fulfilled: boolean;
  /** The "Giao đơn" button; disabled with a reason when no pig fits. */
  button: Pick<ActionVm, 'label' | 'reason'>;
  /** Pigs that meet the order, each with the bound fulfillOrder action. */
  choices: ActionVm[];
}

export function ordersVm(save: FarmGame, now: number): OrderCardVm[] {
  const bonus = penMood(save);
  return [...save.orders]
    .filter((o) => o.expiresAt > now)
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
    .map((o) => {
      const choices: ActionVm[] =
        o.fulfilledAt !== null
          ? []
          : save.pigs
              .filter((p) => pigMeetsOrder(p, o, bonus))
              .map((p) => ({
                label: t(vi.order.pigChoice, { name: p.name, happiness: happiness(p, bonus) }),
                reason: null,
                run: (s, c) => fulfillOrder(s, { orderId: o.id, pigId: p.id }, c),
              }));
      return {
        id: o.id,
        artId: BREEDS[o.wantBreed].artId,
        want: t(vi.order.want, { breed: BREEDS[o.wantBreed].nameVi }),
        gender: t(vi.order.wantGender, { gender: vi.gender[o.wantGender ?? 'any'] }),
        minHappiness: t(vi.order.minHappiness, { value: o.minHappiness }),
        reward: t(vi.order.reward, { gold: formatInt(o.rewardGold), xp: o.rewardXp }),
        expiresIn: t(vi.order.expiresIn, { time: formatDuration(o.expiresAt - now) }),
        fulfilled: o.fulfilledAt !== null,
        button: {
          label: vi.action.fulfillOrder,
          reason: choices.length > 0 ? null : vi.order.noMatchingPig,
        },
        choices,
      };
    });
}
