// The Aquarium's side of the world's creature roster (GĐ10): the fish the other Areas may use (Adventure's fighters).
import type { RosterEntry } from '../../../core/area-registry/registry';
import type { WorldSave } from '../../../core/save/world';
import { AQUARIUM_AREA_ID, FISH } from './config/content';
import { fishHearts, isAdult } from './fishLife';
import { aquariumOf } from './save/lens';

export function aquariumRoster(world: WorldSave): RosterEntry[] {
  return aquariumOf(world)
    .fish.filter((f) => FISH[f.breed]?.fighter)
    .map((f) => ({
      key: `${AQUARIUM_AREA_ID}:${f.id}`,
      areaId: AQUARIUM_AREA_ID,
      id: f.id,
      kind: 'fish' as const,
      name: f.name,
      speciesId: f.breed,
      family: null,
      rarity: FISH[f.breed]!.rarity,
      hearts: fishHearts(f),
      sick: f.isSick,
      adult: isAdult(f),
      purpose: f.purpose ?? null,
      artId: FISH[f.breed]!.art,
    }));
}
