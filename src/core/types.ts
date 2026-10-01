// Save document and domain types (spec §5). Derived values (§5.4) are never stored.
import type { ErrorCode } from './config/errors';
import type { BreedId, CosmeticSlot, Gender, ItemId, TransactionType } from './config/ids';
import type { GameEvent } from './events';
import type { Rng } from './rng';

export type { BreedId, CosmeticSlot, Gender, ItemId, TransactionType };
export type GrowthStage = 'BABY' | 'YOUNG' | 'ADULT'; // derived, never stored

export interface SaveGame {
  schemaVersion: 2;
  createdAt: number;
  updatedAt: number;
  player: {
    gold: number;
    xp: number;
    unlockedSlots: number;
    ownedSkins: string[]; // always contains the 4 breed defaults
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
    discoveredSkins: string[];
  };
  transactions: Transaction[]; // newest first, max 200
  breedingRecords: BreedingRecord[]; // newest first, max 100
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
}

export interface Pig {
  id: string;
  slotIndex: number; // unique, 0 <= slotIndex < unlockedSlots
  breed: BreedId; // economy axis
  skinId: string; // visual axis
  cosmetics: Partial<Record<CosmeticSlot, string>>; // always empty in MVP (DECISIONS C3)
  name: string; // 1-16 chars
  gender: Gender;
  growthProgress: number; // 0-100
  hunger: number; // 0-100, float internally
  cleanliness: number; // 0-100
  isSick: boolean;
  pregnancy: Pregnancy | null;
  lastTickedAt: number;
  createdAt: number;
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
