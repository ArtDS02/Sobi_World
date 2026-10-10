// Farm domain types (spec §5). FarmGame is the farm's working state: the Sobi Farm v7 save shape every
// farm rule is written against; the world save v8 stores it split (save/lens.ts maps both ways).
// Derived values (§5.4) are never stored.
import type { Gender, ItemId } from '../../../core/config/ids';
import type { BreedId, DecorId, StatId, TransactionType } from './config/ids';
import type { Currency } from '../../../core/save/world';
import type { ActionResultOf } from '../../../core/types';
import type { Ancestor } from '../../../systems/breeding/types';
import type { Creature } from '../../../systems/creature/types';
import type { GameEvent } from './events';

export type { BreedId, DecorId, Gender, ItemId, StatId, TransactionType };
export type { GrowthStage } from '../../../systems/creature/types';

export interface FarmGame {
  schemaVersion: 7;
  createdAt: number;
  updatedAt: number;
  player: {
    gold: number;
    xp: number;
    unlockedSlots: number;
  };
  pigs: Pig[];
  /** Newborns waiting in the inventory until the player raises them (save v7, DECISIONS BR-1). */
  nursery: NurseryPig[];
  trough: {
    food: number;
    capacity: number;
    /** 1..TROUGH_LEVELS.length; absent in older saves (derived from the capacity, trough.ts). */
    level?: number | undefined;
    lastResolvedAt: number;
  };
  inventory: Record<ItemId, number>;
  orders: Order[]; // at most BALANCE.ORDER_MAX_ACTIVE (DECISIONS C1)
  collection: {
    discoveredBreeds: BreedId[];
  };
  transactions: Transaction[]; // newest first, max 200
  breedingRecords: BreedingRecord[]; // newest first, max 100
  gifts: {
    nextAt: number | null; // next spawn; null while the farm has no pigs (U06)
    boxes: GiftBox[]; // at most GIFTS.MAX_ON_FARM
  };
  /** Achievements and the daily reward (save v6, DECISIONS PG-2). */
  progress: {
    stats: Record<string, number>; // StatId -> count, absent = 0
    claimed: Record<string, number>; // achievement id -> claimed at
    daily: {
      lastDay: number | null; // local day number of the last claim (ui/time.ts localDay)
      streak: number; // consecutive days up to lastDay
    };
  };
  decor: DecorId[]; // owned farm decorations (save v6, PG-3)
  /** Where each owned decoration stands (GĐ6); absent = on its first spot, placed. */
  decorPlan?: Partial<Record<DecorId, DecorPlan>> | undefined;
  /** Piles of manure in the pen (GAME_BALANCE §2.2); absent = none. */
  manure?: number | undefined;
  /** No pig dies before this time: set after a catch-up that skipped a death (decision 004). */
  graceUntil?: number | undefined;
  /** Pity of the breeding station (systems/breeding/pity): percentage points added to the Rare+ chance; absent = 0. */
  breedingPity?: number | undefined;
  /** Pigs that died, newest first (the Codex keeps a line of memory for each). */
  memorials?: Memorial[] | undefined;
  settings: {
    musicOn: boolean;
    sfxOn: boolean;
    reduceMotion: boolean;
    tutorialDone: boolean;
    lastExportAt: number | null;
  };
}

/** One decoration's place: the spot it stands on, or in storage (no bonus, not drawn). */
export interface DecorPlan {
  spot: number;
  stored: boolean;
}

/** A line of memory for a pig that died. */
export interface Memorial {
  id: string;
  name: string;
  breed: BreedId;
  diedAt: number;
}

export interface Pregnancy {
  startedAt: number;
  endsAt: number;
  fatherId: string;
  childBreed: BreedId; // decided at breeding time
  childGender: Gender; // decided at breeding time
  childGeneration?: number; // parents' highest generation + 1 (PS-2); absent in old saves = 2
  /** Traits and family tree drawn at breeding time with the species (GĐ7); absent = none. */
  childTraits?: string[] | undefined;
  childHidden?: string | undefined;
  childMutated?: boolean | undefined;
  childLineage?: { mother?: Ancestor | undefined; father?: Ancestor | undefined } | undefined;
}

/** A pig: the shared creature model (systems/creature, species = pig) plus its pen slot and litter. */
export interface Pig extends Creature {
  breed: BreedId; // its look is BREEDS[breed].artId
  slotIndex: number; // unique, 0 <= slotIndex < unlockedSlots
  pregnancy: Pregnancy | null;
  /** Who bred it (BR-1); absent for shop pigs and pigs born before save v7. */
  parents?: PigParents;
}

/** Genealogy of a bred pig: ids (the parents may be sold later) and their species. */
export interface PigParents {
  motherId: string;
  fatherId: string;
  motherBreed: BreedId;
  fatherBreed: BreedId;
}

/** A newborn in the inventory nursery: its own pig instance, not on the farm yet (BR-1). */
export interface NurseryPig {
  id: string; // becomes the farm pig's id when raised
  breed: BreedId;
  name: string;
  gender: Gender;
  generation: number;
  bornAt: number;
  parents: PigParents;
  traits?: string[] | undefined;
  hiddenTrait?: string | undefined;
  lineage?: { mother?: Ancestor | undefined; father?: Ancestor | undefined } | undefined;
}

/** A gift lying on the farm. Its reward is fixed when it spawns; `seed` places it (view only). */
export interface GiftBox {
  id: string; // `${spawnedAt}:${index}`
  spawnedAt: number;
  seed: number;
  gold: number;
  xp: number;
}

export interface Order {
  id: string; // `${windowIndex}:${slot}`
  createdAt: number; // start of the window
  expiresAt: number; // createdAt + ORDER_TTL_MS
  wantBreed: BreedId;
  wantGender: Gender | null; // null = any
  minHappiness: number; // 0, 50 or 75
  rewardGold: number;
  rewardXp: number;
  fulfilledAt: number | null;
}

export interface Transaction {
  id: string;
  /** World save v8: absent = coins (every farm transaction). */
  currency?: Currency;
  at: number;
  type: TransactionType;
  amount: number; // signed gold delta
  refId?: string;
  note?: string;
}

export interface BreedingRecord {
  id: string;
  at: number;
  motherId: string;
  fatherId: string;
  motherBreed: BreedId;
  fatherBreed: BreedId;
  childBreed: BreedId;
  childGender: Gender;
  childGeneration?: number; // PS-2, absent in old saves
  /** A mutation gave the child a rare trait (GĐ7). */
  mutated?: boolean | undefined;
  bornAt: number | null; // null until birth
}

// Action contract (spec §8): the shared one, on the farm's working state.
export type { ActionContext } from '../../../core/types';
export type ActionResult = ActionResultOf<FarmGame, GameEvent>;
