// The farm's art lookups on top of the shared asset registry: a pig is drawn with its species' art
// row (BREEDS[breed].artId), the trough with the state matching its food.
import type { AssetRegistry, ArtTexture } from '../../../../core/assets/registry';
import { TROUGH_PROP_ID, type TroughState } from '../../../../core/config/assetIds';
import { BREEDS } from '../../../../core/config/breeds';
import type { BreedId } from '../../../../core/config/ids';

export const pigArtId = (breed: BreedId): string => BREEDS[breed].artId;

/** Species texture; missing row → url null (flat fill); no sleep frame → idle + fx_zzz overlay. */
export const pigTexture = (assets: Pick<AssetRegistry, 'artTexture'>, breed: BreedId, sleeping = false): ArtTexture =>
  assets.artTexture(pigArtId(breed), sleeping);

/** URL of a species frame (`sleep` / `wake`); null when its art row has none. */
export const pigFrame = (assets: Pick<AssetRegistry, 'artFrame'>, breed: BreedId, frame: 'sleep' | 'wake'): string | null =>
  assets.artFrame(pigArtId(breed), frame);

/** food == 0 → empty, ≤ half → half, otherwise full (environment catalogue §1). */
export function troughState(food: number, capacity: number): TroughState {
  if (food <= 0) return 'empty';
  return food <= capacity / 2 ? 'half' : 'full';
}

export const troughUrl = (assets: Pick<AssetRegistry, 'url'>, food: number, capacity: number): string | null =>
  assets.url(TROUGH_PROP_ID, troughState(food, capacity));
