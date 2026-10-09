// Save loading (spec §9.2, ARCHITECTURE §9): version check, migration chain, then validation of the
// world fields and of every Area slice. Pure; what is game-specific comes in through the SaveCodec.
import type { z } from 'zod';
import type { ErrorCode } from '../config/errors';
import type { ActionContext } from '../types';
import { newPlayer } from '../player/player';
import { WORLD_SAVE_VERSION, worldSaveSchema, type WorldSave } from './world';

export type Raw = Record<string, unknown>;
export type SaveError = Extract<ErrorCode, 'SAVE_CORRUPT' | 'SAVE_TOO_NEW'>;

export type MigrateResult =
  | { ok: true; save: WorldSave; /** Version read from the input (< current = it was migrated). */ fromVersion: number }
  | { ok: false; error: SaveError };

export type LegacyResult = { ok: true; raw: Raw } | { ok: false; error: SaveError };

/** What one Area contributes to the save: its slice schema and its own slice migrations. */
export interface AreaSaveSpec {
  /** Validates (and may normalise) `areas[id]`. */
  schema: z.ZodType;
  /** MIGRATIONS[n] upgrades the slice from its version n to n + 1 (`version` field of the slice). */
  migrations?: Record<number, (slice: Raw) => Raw>;
  version?: number;
}

export interface SaveCodec {
  /** Upgrades a save written before the world format (Sobi Farm v1–v7) to a world document (v8 or later; later steps follow). */
  legacy(input: Raw): LegacyResult;
  areas: Record<string, AreaSaveSpec>;
  /** A fresh world (first launch, "play again"). */
  newWorld(ctx: ActionContext, opts?: { reduceMotion?: boolean }): WorldSave;
}

/** WORLD_MIGRATIONS[n] upgrades a world document from version n to n + 1 (n >= 8). */
const WORLD_MIGRATIONS: Record<number, (raw: Raw) => Raw> = {
  // v9: the character. Everyone starts in the plaza at its entrance (GĐ3).
  8: (raw) => ({ ...raw, schemaVersion: 9, player: raw.player ?? newPlayer() }),
};

const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);

function migrateArea(slice: unknown, spec: AreaSaveSpec): unknown {
  if (!isObject(slice) || !spec.version) return slice;
  let raw = slice;
  let v = typeof raw.version === 'number' ? raw.version : 1;
  while (v < spec.version) {
    const step = spec.migrations?.[v];
    if (!step) break;
    raw = { ...step(raw), version: v + 1 };
    v += 1;
  }
  return raw;
}

export function migrate(input: unknown, codec: SaveCodec): MigrateResult {
  if (!isObject(input)) return { ok: false, error: 'SAVE_CORRUPT' };
  const fromVersion = input.schemaVersion;
  if (typeof fromVersion !== 'number' || !Number.isInteger(fromVersion) || fromVersion < 1) {
    return { ok: false, error: 'SAVE_CORRUPT' };
  }
  if (fromVersion > WORLD_SAVE_VERSION) return { ok: false, error: 'SAVE_TOO_NEW' };

  let raw: Raw = input;
  let version = fromVersion;
  if (version < WORLD_SAVE_VERSION) {
    const up = fromVersion < 8 ? codec.legacy(input) : null;
    if (up && !up.ok) return up;
    if (up) {
      raw = up.raw;
      version = 8;
    }
    while (version < WORLD_SAVE_VERSION) {
      const step = WORLD_MIGRATIONS[version];
      if (!step) return { ok: false, error: 'SAVE_CORRUPT' };
      raw = step(raw);
      version += 1;
    }
  }

  const world = worldSaveSchema.safeParse(raw);
  if (!world.success) return { ok: false, error: 'SAVE_CORRUPT' };
  const areas: Raw = { ...world.data.areas };
  for (const [id, spec] of Object.entries(codec.areas)) {
    if (!(id in areas)) continue; // an Area not started yet: its init() creates it
    const parsed = spec.schema.safeParse(migrateArea(areas[id], spec));
    if (!parsed.success) return { ok: false, error: 'SAVE_CORRUPT' };
    areas[id] = parsed.data;
  }
  return { ok: true, save: { ...(world.data as WorldSave), areas }, fromVersion };
}

/** Parse a JSON string and migrate it. */
export function parseSave(json: string, codec: SaveCodec): MigrateResult {
  try {
    return migrate(JSON.parse(json), codec);
  } catch {
    return { ok: false, error: 'SAVE_CORRUPT' };
  }
}
