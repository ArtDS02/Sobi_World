// Collection book discoveries (spec §8.15): append-only, bonus gold + XP on first sighting.
import { BALANCE } from '../config/balance';
import type { BreedId } from '../config/ids';
import type { GameEvent } from '../events';
import type { ActionContext, SaveGame } from '../types';
import { changeGold } from './gold';
import { addXP } from './xp';

/** Records `breed` as discovered if new; otherwise returns the state unchanged. */
export function discoverBreed(
  state: SaveGame,
  breed: BreedId,
  ctx: ActionContext,
): { state: SaveGame; events: GameEvent[] } {
  if (state.collection.discoveredBreeds.includes(breed)) return { state, events: [] };
  const noted: SaveGame = {
    ...state,
    collection: {
      ...state.collection,
      discoveredBreeds: [...state.collection.discoveredBreeds, breed],
    },
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
