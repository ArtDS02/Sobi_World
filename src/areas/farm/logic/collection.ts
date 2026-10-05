// Collection book discoveries (spec §8.15): append-only, bonus gold + XP on first sighting.
import { BALANCE } from '../../../core/config/balance';
import type { BreedId } from '../../../core/config/ids';
import type { GameEvent } from '../../../core/events';
import type { ActionContext, FarmGame } from './types';
import { changeGold } from './gold';
import { addXP } from './xp';

type Discovered = { state: FarmGame; events: GameEvent[] };

/** Records `breed` as discovered if new (bonus gold + XP once); otherwise returns the state unchanged. */
export function discoverBreed(state: FarmGame, breed: BreedId, ctx: ActionContext): Discovered {
  const { discoveredBreeds } = state.collection;
  if (discoveredBreeds.includes(breed)) return { state, events: [] };
  const noted: FarmGame = {
    ...state,
    collection: { ...state.collection, discoveredBreeds: [...discoveredBreeds, breed] },
  };
  const paid = changeGold(noted, BALANCE.DISCOVERY_BONUS_GOLD, 'DISCOVERY_BONUS', ctx, {
    refId: breed,
  });
  if (!paid.ok) throw new Error('a positive gold change cannot fail');
  const xp = addXP(paid.state, BALANCE.XP.DISCOVERY);
  return {
    state: xp.state,
    events: [
      { type: 'DISCOVERY', kind: 'BREED', id: breed, gold: BALANCE.DISCOVERY_BONUS_GOLD },
      ...xp.events,
    ],
  };
}
