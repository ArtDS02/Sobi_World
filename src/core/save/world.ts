// World save document v8 (ARCHITECTURE §9, AUDIT_AND_PLAN §d): world-level state shared by every Area,
// plus one opaque slice per Area under `areas` that the Area's own schema validates.
import { z } from 'zod';

export const WORLD_SAVE_VERSION = 8;

export const CURRENCY_VALUES = ['coins', 'gems', 'eventTokens'] as const;
export type Currency = (typeof CURRENCY_VALUES)[number];

export interface WorldTransaction {
  id: string;
  at: number;
  currency: Currency;
  /** Why the balance moved; each Area defines its own types (PIG_SELL, TROUGH_FILL…). */
  type: string;
  amount: number; // signed delta
  refId?: string;
  note?: string;
}

export interface WorldSettings {
  musicOn: boolean;
  sfxOn: boolean;
  reduceMotion: boolean;
  tutorialDone: boolean;
  lastExportAt: number | null;
}

export interface WorldSave {
  schemaVersion: typeof WORLD_SAVE_VERSION;
  meta: {
    createdAt: number;
    updatedAt: number;
    /** Last successful write: the start of the next offline catch-up (ARCHITECTURE §9). */
    lastSavedAt: number | null;
  };
  world: { currentArea: string; unlockedAreas: string[] };
  wallet: Record<Currency, number>;
  /** One shared bag; keys are item ids from content (an unknown id never breaks a save). */
  inventory: { items: Record<string, number> };
  transactions: WorldTransaction[]; // newest first, capped by SAVE.TRANSACTIONS_MAX
  progression: {
    areas: Record<string, { xp: number }>;
    stats: Record<string, number>; // stat id -> count, absent = 0
    claimed: Record<string, number>; // achievement id -> claimed at
    daily: { lastDay: number | null; streak: number };
  };
  /** Discovered ids per kind (`breed`, later `crop`, `fish`…). */
  collection: { discovered: Record<string, string[]> };
  settings: WorldSettings;
  /** Area id -> that Area's state; validated by the Area's save spec. */
  areas: Record<string, unknown>;
}

const time = z.number().finite();
const nonNeg = z.number().finite().min(0);

export const worldSaveSchema = z.object({
  schemaVersion: z.literal(WORLD_SAVE_VERSION),
  meta: z.object({ createdAt: time, updatedAt: time, lastSavedAt: time.nullable() }),
  world: z.object({ currentArea: z.string().min(1), unlockedAreas: z.array(z.string().min(1)) }),
  wallet: z.object({ coins: nonNeg, gems: nonNeg, eventTokens: nonNeg }),
  inventory: z.object({ items: z.record(z.string(), nonNeg) }),
  transactions: z.array(
    z.object({
      id: z.string(),
      at: time,
      currency: z.enum(CURRENCY_VALUES),
      type: z.string().min(1),
      amount: z.number().finite(),
      refId: z.string().optional(),
      note: z.string().optional(),
    }),
  ),
  progression: z.object({
    areas: z.record(z.string(), z.object({ xp: nonNeg })),
    stats: z.record(z.string(), nonNeg),
    claimed: z.record(z.string(), time),
    daily: z.object({ lastDay: z.number().int().nullable(), streak: z.number().int().min(0) }),
  }),
  collection: z.object({ discovered: z.record(z.string(), z.array(z.string())) }),
  settings: z.object({
    musicOn: z.boolean(),
    sfxOn: z.boolean(),
    reduceMotion: z.boolean(),
    tutorialDone: z.boolean(),
    lastExportAt: time.nullable(),
  }),
  areas: z.record(z.string(), z.unknown()),
});

/** A world with no Area state yet: each Area's init fills its slice and starter items. */
export function emptyWorld(now: number, settings: WorldSettings, firstArea: string): WorldSave {
  return {
    schemaVersion: WORLD_SAVE_VERSION,
    meta: { createdAt: now, updatedAt: now, lastSavedAt: null },
    world: { currentArea: firstArea, unlockedAreas: [firstArea] },
    wallet: { coins: 0, gems: 0, eventTokens: 0 },
    inventory: { items: {} },
    transactions: [],
    progression: { areas: {}, stats: {}, claimed: {}, daily: { lastDay: null, streak: 0 } },
    collection: { discovered: {} },
    settings,
    areas: {},
  };
}

/** Settings of a new world; `reduceMotion` = the OS preference at first launch (spec §11.3). */
export const defaultSettings = (opts: { reduceMotion?: boolean } = {}): WorldSettings => ({
  musicOn: true,
  sfxOn: true,
  reduceMotion: opts.reduceMotion ?? false,
  tutorialDone: false,
  lastExportAt: null,
});
