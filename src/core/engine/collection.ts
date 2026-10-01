// Collection book discoveries (spec §8.15): append-only, bonus gold + XP on first sighting.
import { BALANCE } from '../config/balance';
import { BREEDS } from '../config/breeds';
import type { BreedId } from '../config/ids';
import type { GameEvent } from '../events';
import type { ActionContext, SaveGame } from '../types';
import { changeGold } from './gold';
import { addXP } from './xp';

type Discovered = { state: SaveGame; events: GameEvent[] };

/** Pays DISCOVERY_BONUS_GOLD + XP.DISCOVERY and emits DISCOVERY for an already-appended entry. */
function payBonus(
  state: SaveGame,
  kind: 'BREED' | 'SKIN',
  id: string,
  ctx: ActionContext,
): Discovered {
  const paid = changeGold(state, BALANCE.DISCOVERY_BONUS_GOLD, 'DISCOVERY_BONUS', ctx, {
    refId: id,
  });
  if (!paid.ok) throw new Error('a positive gold change cannot fail');
  const xp = addXP(paid.state, BALANCE.XP.DISCOVERY);
  return {
    state: xp.state,
    events: [{ type: 'DISCOVERY', kind, id, gold: BALANCE.DISCOVERY_BONUS_GOLD }, ...xp.events],
  };
}

/**
 * Records `breed` as discovered if new; otherwise returns the state unchanged. Its default skin
 * enters the book with it, without a second bonus (DECISIONS R07B-1, same as migrate v1→v2).
 */
export function discoverBreed(state: SaveGame, breed: BreedId, ctx: ActionContext): Discovered {
  const { discoveredBreeds, discoveredSkins } = state.collection;
  if (discoveredBreeds.includes(breed)) return { state, events: [] };
  const skin = BREEDS[breed].defaultSkin;
  const noted: SaveGame = {
    ...state,
    collection: {
      discoveredBreeds: [...discoveredBreeds, breed],
      discoveredSkins: discoveredSkins.includes(skin)
        ? discoveredSkins
        : [...discoveredSkins, skin],
    },
  };
  return payBonus(noted, 'BREED', breed, ctx);
}

/** Records a newly acquired skin (spec §8.13): bonus once per skin, never again. */
export function discoverSkin(state: SaveGame, skinId: string, ctx: ActionContext): Discovered {
  const { discoveredSkins } = state.collection;
  if (discoveredSkins.includes(skinId)) return { state, events: [] };
  const noted: SaveGame = {
    ...state,
    collection: { ...state.collection, discoveredSkins: [...discoveredSkins, skinId] },
  };
  return payBonus(noted, 'SKIN', skinId, ctx);
}

/** Entries in the book; the COLLECTION unlock counts these (spec §6.6). */
export const collectionCount = (state: SaveGame): number =>
  state.collection.discoveredBreeds.length + state.collection.discoveredSkins.length;
