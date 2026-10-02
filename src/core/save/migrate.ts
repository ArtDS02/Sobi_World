// Sequential vN -> vN+1 save migrations, then schema validation (spec §9.2).
import { BREEDS } from '../config/breeds';
import type { ErrorCode } from '../config/errors';
import type { BreedId } from '../config/ids';
import { levelFromXp, troughCapacityForLevel } from '../config/levels';
import {
  SAVE,
  V3_SKIN_REFUND_GOLD,
  V3_SPECIES_SKINS,
  V5_BODY_OUTFITS,
  V5_OUTFIT_PRICES,
} from '../config/save';
import { changeGold } from '../engine/gold';
import { mulberry32 } from '../rng';
import type { SaveGame } from '../types';
import { saveGameSchema } from './schema';

export type MigrateResult =
  | { ok: true; save: SaveGame }
  | { ok: false; error: Extract<ErrorCode, 'SAVE_CORRUPT' | 'SAVE_TOO_NEW'> };

type Raw = Record<string, unknown>;

const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const asArray = (v: unknown): Raw[] => (Array.isArray(v) ? v.filter(isObject) : []);
const asObject = (v: unknown): Raw => (isObject(v) ? v : {});

/** What every v2 save owned from the start: the four v1 breed artworks (frozen history). */
const V2_STARTER_SKINS = ['pig_classic', 'pig_watermelon', 'pig_superhero', 'pig_thienlong'];

/** v1 (v3 spec save) -> v2: trough, orders, collection, ownedSkins, reduceMotion, skins on pigs. */
function v1ToV2(raw: Raw): Raw {
  const player = asObject(raw.player);
  const pigs = asArray(raw.pigs).map((p): Raw => {
    const breed = BREEDS[p.breed as BreedId];
    return { ...p, skinId: breed?.artId };
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
    player: { ...player, ownedSkins: [...V2_STARTER_SKINS] },
    pigs,
    trough: {
      food: 0,
      capacity: troughCapacityForLevel(levelFromXp(xp)),
      lastResolvedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
    },
    orders: [],
    collection: {
      discoveredBreeds: [...seen],
    },
    settings: { ...asObject(raw.settings), reduceMotion: false },
  };
}

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];

/**
 * v2 -> v3 (DECISIONS U00-1 D3): species replace the species-looking skins. A pink pig wearing
 * one becomes that species; every species artwork becomes owned; owned species are discovered.
 * Refunds for unworn ones need a Transaction, so they run after validation (v3Refunds).
 */
function v2ToV3(raw: Raw): Raw {
  const player = asObject(raw.player);
  const collection = asObject(raw.collection);
  const pigs = asArray(raw.pigs).map((p): Raw => {
    const species = V3_SPECIES_SKINS[p.skinId as string];
    return species && p.breed === 'PIG_EARTH_PINK' ? { ...p, breed: species } : p;
  });
  const owned = strings(player.ownedSkins);
  const seen = new Set([
    ...strings(collection.discoveredBreeds),
    ...pigs.map((p) => p.breed as string),
    ...owned.flatMap((id) => (V3_SPECIES_SKINS[id] ? [V3_SPECIES_SKINS[id]] : [])),
  ]);
  return {
    ...raw,
    schemaVersion: 3,
    player: { ...player, ownedSkins: owned },
    pigs,
    collection: { ...collection, discoveredBreeds: [...seen].filter((b) => b in BREEDS) },
  };
}

/** A skin refunded after migration (needs a Transaction, so it runs on the validated save). */
interface Refund {
  id: string;
  gold: number;
}

/** Species skins a v2 save owned but no pig wore: refunded after the v2 -> v3 step. */
function v3Refunds(v2: Raw): Refund[] {
  const worn = new Set(asArray(v2.pigs).map((p) => p.skinId));
  return strings(asObject(v2.player).ownedSkins)
    .filter((id) => id in V3_SPECIES_SKINS && !worn.has(id))
    .map((id) => ({ id, gold: V3_SKIN_REFUND_GOLD }));
}

/** A v4 pig that becomes a species because it wore a body outfit (A2-1). */
const bodySpecies = (p: Raw): BreedId | undefined =>
  p.breed === 'PIG_EARTH_PINK' ? V5_BODY_OUTFITS[p.skinId as string] : undefined;

/** Outfits a v4 save owned, minus body outfits a pink pig wore (that pig became the species). */
function v5Refunds(v4: Raw): Refund[] {
  const kept = new Set(asArray(v4.pigs).filter((p) => bodySpecies(p)).map((p) => p.skinId));
  return strings(asObject(v4.player).ownedSkins)
    .filter((id) => id in V5_OUTFIT_PRICES && !kept.has(id))
    .map((id) => ({ id, gold: V5_OUTFIT_PRICES[id]! }));
}

function refund(save: SaveGame, refunds: readonly Refund[]): SaveGame {
  const ctx = { now: save.updatedAt, rng: mulberry32(save.createdAt) };
  return refunds.reduce((s, { id, gold }) => {
    const r = changeGold(s, gold, 'SKIN_REFUND', ctx, { refId: id });
    return r.ok ? r.state : s;
  }, save);
}

/** v3 -> v4 (U06): no gifts yet; the timer starts with the first tick that sees a pig. */
const v3ToV4 = (raw: Raw): Raw => ({
  ...raw,
  schemaVersion: 4,
  gifts: { nextAt: null, boxes: [] },
});

/**
 * v4 -> v5 (DECISIONS A2-1): outfits removed. A pig's look is its species; skin and cosmetic
 * fields go. Body outfits worn by a pink pig turn it into that species (discovered, no bonus).
 */
function v4ToV5(raw: Raw): Raw {
  const player = asObject(raw.player);
  const collection = asObject(raw.collection);
  const pigs = asArray(raw.pigs).map((p): Raw => {
    const rest = { ...p };
    delete rest.skinId;
    delete rest.cosmetics;
    const species = bodySpecies(p);
    return species ? { ...rest, breed: species } : rest;
  });
  const keptPlayer = { ...player };
  delete keptPlayer.ownedSkins;
  const seen = new Set([
    ...strings(collection.discoveredBreeds),
    ...pigs.map((p) => p.breed as string),
  ]);
  return {
    ...raw,
    schemaVersion: 5,
    player: keptPlayer,
    pigs,
    collection: { discoveredBreeds: [...seen].filter((b) => b in BREEDS) },
  };
}

/** MIGRATIONS[n] upgrades a save from version n to n+1. */
const MIGRATIONS: Record<number, (raw: Raw) => Raw> = {
  1: v1ToV2,
  2: v2ToV3,
  3: v3ToV4,
  4: v4ToV5,
};
/** REFUNDS[n] lists what the n -> n+1 step refunds, read from the save before that step. */
const REFUNDS: Record<number, (raw: Raw) => Refund[]> = { 2: v3Refunds, 4: v5Refunds };

export function migrate(input: unknown): MigrateResult {
  if (!isObject(input)) return { ok: false, error: 'SAVE_CORRUPT' };
  let version = input.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return { ok: false, error: 'SAVE_CORRUPT' };
  }
  if (version > SAVE.SCHEMA_VERSION) return { ok: false, error: 'SAVE_TOO_NEW' };

  let raw: Raw = input;
  const refunds: Refund[] = [];
  while (version < SAVE.SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) return { ok: false, error: 'SAVE_CORRUPT' };
    refunds.push(...(REFUNDS[version]?.(raw) ?? []));
    raw = step(raw);
    version += 1;
  }
  const parsed = saveGameSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: 'SAVE_CORRUPT' };
  return { ok: true, save: refund(parsed.data, refunds) };
}

/** Parse a JSON string and migrate it. */
export function parseSave(json: string): MigrateResult {
  try {
    return migrate(JSON.parse(json));
  } catch {
    return { ok: false, error: 'SAVE_CORRUPT' };
  }
}
