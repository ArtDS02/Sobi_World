// The shared creature model (spec §7): what every living thing of every Area has. A species is data
// (the farm's pigs: content/farm/species.json); an Area extends the model with its own fields (the
// farm: pen slot, pregnancy). Fields of later phases (bond, traits, combat…) are added when used.
import type { Gender } from '../../core/config/ids';

export interface Creature {
  id: string;
  /** Breed (species variant) id from the Area's content. */
  breed: string;
  /** 1-16 chars, chosen by the player or drawn from the Area's name pool. */
  name: string;
  gender: Gender;
  /** 0 = newborn … 100 = grown (stage thresholds: growthStage). */
  growthProgress: number;
  /** Needs, 0-100 (float internally). */
  hunger: number;
  cleanliness: number;
  isSick: boolean;
  /** Time the numbers were last simulated up to (epoch ms). */
  lastTickedAt: number;
  createdAt: number;
  /** 1 = bought / starter, n + 1 = child of a generation-n parent (PS-2). Absent = 1. */
  generation?: number;
  // Care & disease history (NH-1). All optional: absent = never happened (older saves).
  lastFedAt?: number;
  lastCleanedAt?: number;
  /** Start of the latest disease episode. */
  lastSickAt?: number;
  /** Game day of lastSickAt and the episodes started on it (per-day limit). */
  sickDay?: number;
  sickEpisodes?: number;
  /** After medicine: no new episode before this time (recovering). */
  recoveringUntil?: number;
}

/** What care-based mood and value read. */
export type CreatureCare = Pick<Creature, 'hunger' | 'cleanliness' | 'isSick'>;

export type GrowthStage = 'BABY' | 'YOUNG' | 'ADULT'; // derived, never stored
