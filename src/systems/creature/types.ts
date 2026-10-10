// The shared creature model (spec §7): what every living thing of every Area has. A species is data
// (the farm's pigs: content/farm/species.json); an Area extends the model with its own fields (the
// farm: pen slot, pregnancy). Fields of later phases (bond, traits, combat…) are added when used.
import type { Gender } from '../../core/config/ids';
import type { Purpose } from '../../../content/schemas/vocab';
import type { Ancestor } from '../breeding/types';

export type { Purpose };

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
  /** 0-100; falls awake, recovers asleep (GAME_BALANCE §2.2). Absent = full (older saves). */
  energy?: number;
  /** Hours-worth of manure made so far, in pile units: its integer part is the piles dropped (monotonic). */
  poopProgress?: number;
  /** Illness hazard accumulated towards the next episode (systems/health/risk); resets when one starts. */
  illRisk?: number;
  /** Mood averaged over the creature's life, weighted by time (it decides its Quality), and the seconds counted. */
  moodAvg?: number;
  moodSec?: number;
  /** Why it is raised; absent = not chosen yet (shipping and breeding both work). Chosen from Adult on. */
  purpose?: Purpose;
  /** Bond 0-100 (5 hearts, systems/bond); absent = 0. */
  bond?: number;
  /** Game day of the last pets and how many that day (a creature can be petted twice a day). */
  petDay?: number;
  petCount?: number;
  /** Mood a snack lifts until `until` (epoch ms): premium feed, grass. */
  moodBoost?: { amount: number; until: number };
  /** Inherited traits (systems/breeding): the visible ones, the hidden one (open from 5 hearts of Bond), and the frozen family tree. */
  traits?: string[] | undefined;
  hiddenTrait?: string | undefined;
  lineage?: { mother?: Ancestor | undefined; father?: Ancestor | undefined } | undefined;
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

/** BABY → YOUNG → ADULT (can be shipped out) → MATURE (can breed); derived, never stored. */
export type GrowthStage = 'BABY' | 'YOUNG' | 'ADULT' | 'MATURE';
