// Farm domain types (spec §5). FarmGame is the farm's working state: the Sobi Farm v7 save shape every
// farm rule is written against; the world save v8 stores it split (save/lens.ts maps both ways).
// Derived values (§5.4) are never stored.
import type { BreedId, DecorId, Gender, ItemId, StatId, TransactionType } from '../../../core/config/ids';
import type { Currency } from '../../../core/save/world';
import type { ActionResultOf } from '../../../core/types';

export type { BreedId, DecorId, Gender, ItemId, StatId, TransactionType };
export type GrowthStage = 'BABY' | 'YOUNG' | 'ADULT'; // derived, never stored

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
  settings: {
    musicOn: boolean;
    sfxOn: boolean;
    reduceMotion: boolean;
    tutorialDone: boolean;
    lastExportAt: number | null;
  };
}

export interface Pregnancy {
  startedAt: number;
  endsAt: number;
  fatherId: string;
  childBreed: BreedId; // decided at breeding time
  childGender: Gender; // decided at breeding time
  childGeneration?: number; // parents' highest generation + 1 (PS-2); absent in old saves = 2
}

export interface Pig {
  id: string;
  slotIndex: number; // unique, 0 <= slotIndex < unlockedSlots
  breed: BreedId; // species; its look is BREEDS[breed].artId
  name: string; // 1-16 chars
  gender: Gender;
  growthProgress: number; // 0-100
  hunger: number; // 0-100, float internally
  cleanliness: number; // 0-100
  isSick: boolean;
  pregnancy: Pregnancy | null;
  lastTickedAt: number;
  createdAt: number;
  /** 1 = bought / starter, n + 1 = child of a generation-n parent (PS-2). Absent = 1. */
  generation?: number;
  /** Who bred it (BR-1); absent for shop pigs and pigs born before save v7. */
  parents?: PigParents;
  // NH-1 care & disease history. All optional: absent = never happened (older saves).
  lastFedAt?: number; // last manual feed
  lastCleanedAt?: number;
  lastSickAt?: number; // start of the latest disease episode
  /** Game day of lastSickAt and the episodes started on it (per-day limit). */
  sickDay?: number;
  sickEpisodes?: number;
  /** After medicine: no new episode before this time (Recovering). */
  recoveringUntil?: number;
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
  bornAt: number | null; // null until birth
}

// Action contract (spec §8): the shared one, on the farm's working state.
export type { ActionContext } from '../../../core/types';
export type ActionResult = ActionResultOf<FarmGame>;
