// Save document and domain types (spec §5). Derived values (§5.4) are never stored.
import type { ErrorCode } from './config/errors';
import type { BreedId, Gender, ItemId, TransactionType } from './config/ids';
import type { GameEvent } from './events';
import type { Rng } from './rng';

export type { BreedId, Gender, ItemId, TransactionType };
export type GrowthStage = 'BABY' | 'YOUNG' | 'ADULT'; // derived, never stored

export interface SaveGame {
  schemaVersion: 5;
  createdAt: number;
  updatedAt: number;
  player: {
    gold: number;
    xp: number;
    unlockedSlots: number;
  };
  pigs: Pig[];
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

// Action contract (spec §8).
export interface ActionContext {
  now: number;
  rng: Rng;
}

export type ActionResult =
  | { ok: true; state: SaveGame; events: GameEvent[] }
  | { ok: false; error: ErrorCode };
