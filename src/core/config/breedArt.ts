// Breed to artwork bridge (spec §6.6). The only place game rules touch the art catalogue.
import { BREEDS } from './breeds';
import type { BreedId } from './ids';

export interface BreedArt {
  defaultSkin: string;
  catalogueSection: string; // asset/animals/PIG_CATALOGUE.md
  conceptCell: string; // asset/reference/style_reference_pigs.png
}

export const BREED_ART: Record<BreedId, BreedArt> = {
  PIG_EARTH_PINK: {
    defaultSkin: BREEDS.PIG_EARTH_PINK.defaultSkin,
    catalogueSection: '§3 Base / Classic',
    conceptCell: 'row 1, col 1',
  },
  PIG_STRIPED_MELON: {
    defaultSkin: BREEDS.PIG_STRIPED_MELON.defaultSkin,
    catalogueSection: '§12 Food / Fun',
    conceptCell: 'row 1, col 2',
  },
  PIG_SUPERMAN: {
    defaultSkin: BREEDS.PIG_SUPERMAN.defaultSkin,
    catalogueSection: '§5 Job / Everyday',
    conceptCell: 'row 1, col 3',
  },
  PIG_MYTHICAL: {
    defaultSkin: BREEDS.PIG_MYTHICAL.defaultSkin,
    catalogueSection: '§22 Legendary / Mythic',
    conceptCell: 'row 1, col 4',
  },
};
