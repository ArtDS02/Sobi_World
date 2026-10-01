// Sequential vN -> vN+1 save migrations, then schema validation (spec §9.2).
import { BREEDS } from '../config/breeds';
import type { ErrorCode } from '../config/errors';
import type { BreedId } from '../config/ids';
import { levelFromXp, troughCapacityForLevel } from '../config/levels';
import { SAVE } from '../config/save';
import { STARTER_SKINS } from '../config/skins';
import type { SaveGame } from '../types';
import { saveGameSchema } from './schema';

export type MigrateResult =
  | { ok: true; save: SaveGame }
  | { ok: false; error: Extract<ErrorCode, 'SAVE_CORRUPT' | 'SAVE_TOO_NEW'> };

type Raw = Record<string, unknown>;

const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const asArray = (v: unknown): Raw[] => (Array.isArray(v) ? v.filter(isObject) : []);
const asObject = (v: unknown): Raw => (isObject(v) ? v : {});

/** v1 (v3 spec save) -> v2: trough, orders, collection, ownedSkins, reduceMotion, skins on pigs. */
function v1ToV2(raw: Raw): Raw {
  const player = asObject(raw.player);
  const pigs = asArray(raw.pigs).map((p): Raw => {
    const breed = BREEDS[p.breed as BreedId];
    return { ...p, skinId: breed?.defaultSkin, cosmetics: {} };
  });
  const seen = new Set<BreedId>();
  const records = asArray(raw.breedingRecords);
  const breeds = [
    ...pigs.map((p) => p.breed),
    ...records.flatMap((r) => [r.motherBreed, r.fatherBreed, r.childBreed]),
  ];
  for (const b of breeds) if (typeof b === 'string' && b in BREEDS) seen.add(b as BreedId);
  const xp = typeof player.xp === 'number' ? player.xp : 0;
  return {
    ...raw,
    schemaVersion: 2,
    player: { ...player, ownedSkins: [...STARTER_SKINS] },
    pigs,
    trough: {
      food: 0,
      capacity: troughCapacityForLevel(levelFromXp(xp)),
      lastResolvedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
    },
    orders: [],
    collection: {
      discoveredBreeds: [...seen],
      discoveredSkins: [...seen].map((b) => BREEDS[b].defaultSkin),
    },
    settings: { ...asObject(raw.settings), reduceMotion: false },
  };
}

/** MIGRATIONS[n] upgrades a save from version n to n+1. */
const MIGRATIONS: Record<number, (raw: Raw) => Raw> = { 1: v1ToV2 };

export function migrate(input: unknown): MigrateResult {
  if (!isObject(input)) return { ok: false, error: 'SAVE_CORRUPT' };
  let version = input.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return { ok: false, error: 'SAVE_CORRUPT' };
  }
  if (version > SAVE.SCHEMA_VERSION) return { ok: false, error: 'SAVE_TOO_NEW' };

  let raw: Raw = input;
  while (version < SAVE.SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) return { ok: false, error: 'SAVE_CORRUPT' };
    raw = step(raw);
    version += 1;
  }
  const parsed = saveGameSchema.safeParse(raw);
  return parsed.success ? { ok: true, save: parsed.data } : { ok: false, error: 'SAVE_CORRUPT' };
}

/** Parse a JSON string and migrate it. */
export function parseSave(json: string): MigrateResult {
  try {
    return migrate(JSON.parse(json));
  } catch {
    return { ok: false, error: 'SAVE_CORRUPT' };
  }
}
