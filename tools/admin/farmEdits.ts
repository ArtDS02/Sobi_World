// Farm edits of a player's save (decisions AD-1, 036): pure functions on the Farm's view (FarmGame) of the world —
// slots, the trough, pigs, the nursery, decorations, orders and gift boxes, and the Farm's part of time travel.
// worldEdits.ts runs them on the world (onFarm) and checks the result with the game's save schemas.
import { BALANCE } from '../../src/areas/farm/logic/config/balance';
import { BREEDS } from '../../src/areas/farm/logic/config/breeds';
import { DECORS } from '../../src/areas/farm/logic/config/decor';
import type { Gender } from '../../src/core/config/ids';
import type { BreedId, DecorId } from '../../src/areas/farm/logic/config/ids';
import type { Pig, FarmGame } from '../../src/areas/farm/logic/types';

export type Edit = (s: FarmGame) => FarmGame;

const int = (n: number, min: number, max = Number.MAX_SAFE_INTEGER) => {
  if (!Number.isFinite(n)) throw new Error('Giá trị không phải số');
  return Math.min(max, Math.max(min, Math.round(n)));
};

/** Progress: unlocked slots, never below the pigs + pregnancies they hold or a used slot index. */
export const setSlots = (n: number): Edit => (s) => {
  const need = Math.max(
    s.pigs.length + s.pigs.filter((p) => p.pregnancy).length,
    ...s.pigs.map((p) => p.slotIndex + 1),
    1,
  );
  const v = int(n, 1, BALANCE.MAX_SLOTS);
  if (v < need) throw new Error(`Cần ít nhất ${need} chuồng cho số heo hiện có`);
  return { ...s, player: { ...s.player, unlockedSlots: v } };
};

export const setTroughFood = (food: number): Edit => (s) => ({
  ...s,
  trough: { ...s.trough, food: int(food, 0, s.trough.capacity) },
});

/** Pigs: the editable fields of one pig (name 1–16 chars, stats 0–100). `purpose: null` = not chosen yet. */
export type PigPatch = Partial<Pick<Pig, 'name' | 'breed' | 'gender' | 'growthProgress' | 'hunger' | 'cleanliness' | 'energy' | 'bond' | 'isSick' | 'generation'>> & {
  purpose?: Pig['purpose'] | null;
};

/** `now` dates a new illness (its critical / death clock starts then) and ends a cured one. */
export const patchPig = (id: string, patch: PigPatch, now = 0): Edit => (s) => {
  if (!s.pigs.some((p) => p.id === id)) throw new Error('Không tìm thấy heo');
  if (patch.name !== undefined && !(patch.name.trim().length >= 1 && patch.name.trim().length <= 16))
    throw new Error('Tên heo 1–16 ký tự');
  if (patch.breed !== undefined && !BREEDS[patch.breed]) throw new Error('Giống không tồn tại');
  const pct = (v: number | undefined) => (v === undefined ? undefined : int(v, 0, 100));
  return {
    ...s,
    pigs: s.pigs.map((p) => {
      if (p.id !== id) return p;
      const { purpose, ...rest } = patch;
      const next: Pig = { ...p, ...rest };
      if (patch.name !== undefined) next.name = patch.name.trim();
      for (const k of ['growthProgress', 'hunger', 'cleanliness', 'energy', 'bond'] as const) if (patch[k] !== undefined) next[k] = pct(patch[k])!;
      if (patch.generation !== undefined) next.generation = int(patch.generation, 1, 999);
      if (purpose === null) delete next.purpose;
      else if (purpose !== undefined) next.purpose = purpose;
      if (patch.isSick === true && !p.isSick) Object.assign(next, { lastSickAt: now, illRisk: 0 });
      if (patch.isSick === false && p.isSick) next.recoveringUntil = now;
      // A father cannot be pregnant: switching gender drops the pregnancy.
      if (patch.gender === 'MALE') next.pregnancy = null;
      return next;
    }),
  };
};

/** Pigs: removed (dangerous — confirmed in the UI); a pregnancy it fathered keeps its record. */
export const removePig = (id: string): Edit => (s) => ({ ...s, pigs: s.pigs.filter((p) => p.id !== id) });

/** Pigs: a newborn of `breed` in the lowest free slot (no gold moves: admin gift). */
export const addPig = (breed: BreedId, gender: Gender, name: string, now: number, id: string): Edit => (s) => {
  const used = new Set(s.pigs.map((p) => p.slotIndex));
  let slot = 0;
  while (used.has(slot)) slot++;
  if (s.pigs.length + s.pigs.filter((p) => p.pregnancy).length >= s.player.unlockedSlots) throw new Error('Hết chuồng trống');
  const pig: Pig = {
    id, slotIndex: slot, breed, name: name.trim().slice(0, 16) || 'Heo', gender, growthProgress: 0,
    hunger: BALANCE.HUNGER_MAX, cleanliness: BALANCE.CLEAN_MAX, isSick: false, pregnancy: null, lastTickedAt: now, createdAt: now,
  };
  const discovered = s.collection.discoveredBreeds.includes(breed) ? s.collection.discoveredBreeds : [...s.collection.discoveredBreeds, breed];
  return { ...s, pigs: [...s.pigs, pig], collection: { discoveredBreeds: discovered } };
};

/** Nursery (heo con chờ nhận, BR-1): rename or remove a waiting piglet. */
export const patchNursery = (id: string, name: string): Edit => (s) => {
  if (!(name.trim().length >= 1 && name.trim().length <= 16)) throw new Error('Tên heo 1–16 ký tự');
  return { ...s, nursery: s.nursery.map((p) => (p.id === id ? { ...p, name: name.trim() } : p)) };
};
export const removeNursery = (id: string): Edit => (s) => ({ ...s, nursery: s.nursery.filter((p) => p.id !== id) });

/** Decorations owned (PG-3): the happiness bonus follows the set. Kept in config order. */
export const setDecor = (ids: readonly DecorId[]): Edit => (s) => ({
  ...s,
  decor: (Object.keys(DECORS) as DecorId[]).filter((d) => ids.includes(d)),
});

/** Game state: open orders / gift boxes cleared (the game spawns new ones on schedule). */
export const clearOrders: Edit = (s) => ({ ...s, orders: [] });
export const clearGifts: Edit = (s) => ({ ...s, gifts: { nextAt: null, boxes: [] } });

const DAY = 86_400_000;

/**
 * The Farm's part of time travel (GĐ2): every moment of the farm moves back by `ms` (pigs' clocks, the trough,
 * pregnancies, orders, gifts, history, the game day counters), so the game catches up the missed time the next
 * time it opens — the same as really leaving it closed. worldEdits.rewind moves the other Areas with it.
 */
export const rewindFarm = (ms: number): Edit => (s) => {
  const back = int(ms, 0);
  const days = Math.round(back / DAY);
  const t = <T extends number | null | undefined>(v: T): T => (typeof v === 'number' ? ((v - back) as T) : v);
  const day = <T extends number | null | undefined>(v: T): T => (typeof v === 'number' ? ((v - days) as T) : v);
  /** Shifts only the keys that exist: an absent field stays absent. */
  const shift = <O extends object>(o: O, time: readonly (keyof O)[], dayKeys: readonly (keyof O)[] = []): O => {
    const out = { ...o };
    for (const k of time) if (out[k] !== undefined) out[k] = t(out[k] as number | null | undefined) as O[keyof O];
    for (const k of dayKeys) if (out[k] !== undefined) out[k] = day(out[k] as number | null | undefined) as O[keyof O];
    return out;
  };
  return {
    ...s,
    createdAt: t(s.createdAt),
    updatedAt: t(s.updatedAt),
    pigs: s.pigs.map((p) => ({
      ...shift(p, ['lastTickedAt', 'createdAt', 'lastFedAt', 'lastCleanedAt', 'lastSickAt', 'recoveringUntil'], ['sickDay']),
      ...(p.pregnancy ? { pregnancy: shift(p.pregnancy, ['startedAt', 'endsAt']) } : {}),
    })),
    nursery: s.nursery.map((n) => shift(n, ['bornAt'])),
    trough: shift(s.trough, ['lastResolvedAt']),
    orders: s.orders.map((o) => shift(o, ['createdAt', 'expiresAt', 'fulfilledAt'])),
    gifts: { nextAt: t(s.gifts.nextAt), boxes: s.gifts.boxes.map((b) => shift(b, ['spawnedAt'])) },
    transactions: s.transactions.map((x) => shift(x, ['at'])),
    breedingRecords: s.breedingRecords.map((r) => shift(r, ['at', 'bornAt'])),
    progress: {
      ...s.progress,
      claimed: Object.fromEntries(Object.entries(s.progress.claimed).map(([k, v]) => [k, t(v)])),
      daily: { ...s.progress.daily, lastDay: day(s.progress.daily.lastDay) },
    },
    ...(s.graceUntil !== undefined ? { graceUntil: t(s.graceUntil) } : {}),
    ...(s.memorials ? { memorials: s.memorials.map((m) => shift(m, ['diedAt'])) } : {}),
  };
};
