// User (save) edits of the admin dashboard (DECISIONS AD-1), grouped like the editor tabs: profile,
// currency, inventory, pigs, progress, game state. Pure functions on a FarmGame: gold only moves
// through core's changeGold (an ADMIN_ADJUST transaction), XP keeps the trough capacity rule, and
// every result is checked with the game's own save schema before it can be written.
import { levelFromXp } from '../../src/areas/farm/logic/config/levels';
import { BALANCE } from '../../src/areas/farm/logic/config/balance';
import { BREEDS } from '../../src/areas/farm/logic/config/breeds';
import { DECORS } from '../../src/areas/farm/logic/config/decor';
import type { Gender, ItemId } from '../../src/core/config/ids';
import type { BreedId, DecorId, StatId } from '../../src/areas/farm/logic/config/ids';
import { happiness } from '../../src/areas/farm/logic/happiness';
import { changeGold } from '../../src/areas/farm/logic/gold';
import { farmGameSchema } from '../../src/areas/farm/logic/save/farmSchema';
import { newGame } from '../../src/areas/farm/logic/save/newFarm';
import type { Rng } from '../../src/core/rng';
import type { Pig, FarmGame } from '../../src/areas/farm/logic/types';

export type Edit = (s: FarmGame) => FarmGame;

/** Problems the game's save parser would reject, as readable lines (empty = writable). */
export function saveProblems(s: FarmGame): string[] {
  const r = farmGameSchema.safeParse(s);
  if (r.success) return [];
  return r.error.issues.map((i) => `${i.path.join('.') || 'save'}: ${i.message}`);
}

export function summary(s: FarmGame) {
  const level = levelFromXp(s.player.xp);
  const nextXp = BALANCE.LEVEL_XP[level] ?? null;
  return {
    gold: s.player.gold,
    xp: s.player.xp,
    level,
    nextXp,
    pigs: s.pigs.length,
    pregnant: s.pigs.filter((p) => p.pregnancy).length,
    sick: s.pigs.filter((p) => p.isSick).length,
    slots: s.player.unlockedSlots,
    discovered: s.collection.discoveredBreeds.length,
    orders: s.orders.length,
    gifts: s.gifts.boxes.length,
    avgHappiness: s.pigs.length ? Math.round(s.pigs.reduce((t, p) => t + happiness(p), 0) / s.pigs.length) : null,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

const int = (n: number, min: number, max = Number.MAX_SAFE_INTEGER) => {
  if (!Number.isFinite(n)) throw new Error('Giá trị không phải số');
  return Math.min(max, Math.max(min, Math.round(n)));
};

/** Currency: gold set to `target` through one ADMIN_ADJUST transaction (the delta). */
export const setGold = (target: number, now: number, rng: Rng): Edit => (s) => {
  const delta = int(target, 0) - s.player.gold;
  if (delta === 0) return s;
  const r = changeGold(s, delta, 'ADMIN_ADJUST', { now, rng }, { note: 'admin' });
  if (!r.ok) throw new Error(r.error);
  return r.state;
};

/** Progress: XP (the level follows). The trough has its own levels and is not touched. */
export const setXp = (xp: number): Edit => (s) => ({ ...s, player: { ...s.player, xp: int(xp, 0) } });

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

export const setDiscovered = (breeds: readonly BreedId[]): Edit => (s) => ({
  ...s,
  collection: { discoveredBreeds: [...new Set(breeds)] },
});

/** Inventory: item counts (whole, ≥ 0). */
export const setInventory = (counts: Partial<Record<ItemId, number>>): Edit => (s) => {
  const inventory = { ...s.inventory };
  for (const [k, v] of Object.entries(counts) as [ItemId, number][]) inventory[k] = int(v, 0, 1_000_000);
  return { ...s, inventory };
};

export const setTroughFood = (food: number): Edit => (s) => ({
  ...s,
  trough: { ...s.trough, food: int(food, 0, s.trough.capacity) },
});

/** Pigs: the editable fields of one pig (name 1–16 chars, stats 0–100). */
export type PigPatch = Partial<Pick<Pig, 'name' | 'breed' | 'gender' | 'growthProgress' | 'hunger' | 'cleanliness' | 'isSick' | 'generation'>>;

export const patchPig = (id: string, patch: PigPatch): Edit => (s) => {
  if (!s.pigs.some((p) => p.id === id)) throw new Error('Không tìm thấy heo');
  if (patch.name !== undefined && !(patch.name.trim().length >= 1 && patch.name.trim().length <= 16))
    throw new Error('Tên heo 1–16 ký tự');
  if (patch.breed !== undefined && !BREEDS[patch.breed]) throw new Error('Giống không tồn tại');
  const pct = (v: number | undefined) => (v === undefined ? undefined : int(v, 0, 100));
  return {
    ...s,
    pigs: s.pigs.map((p) => {
      if (p.id !== id) return p;
      const next = { ...p, ...patch };
      if (patch.name !== undefined) next.name = patch.name.trim();
      for (const k of ['growthProgress', 'hunger', 'cleanliness'] as const) if (patch[k] !== undefined) next[k] = pct(patch[k])!;
      if (patch.generation !== undefined) next.generation = int(patch.generation, 1, 999);
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

/** Achievements claimed (PG-2): kept ones keep their time, new ones are stamped `now`. */
export const setClaimed = (ids: readonly string[], now: number): Edit => (s) => ({
  ...s,
  progress: { ...s.progress, claimed: Object.fromEntries(ids.map((id) => [id, s.progress.claimed[id] ?? now])) },
});

/** Progress counters (achievement metrics). */
export const setStats = (stats: Partial<Record<StatId, number>>): Edit => (s) => {
  const next = { ...s.progress.stats };
  for (const [k, v] of Object.entries(stats)) next[k] = int(v, 0);
  return { ...s, progress: { ...s.progress, stats: next } };
};

/** Daily gift streak; `claimedToday` false clears lastDay so today's gift can be claimed again. */
export const setDaily = (streak: number, lastDay: number | null): Edit => (s) => ({
  ...s,
  progress: { ...s.progress, daily: { streak: int(streak, 0, 10_000), lastDay } },
});

/** Profile / settings switches. */
export const setSettings = (patch: Partial<FarmGame['settings']>): Edit => (s) => ({ ...s, settings: { ...s.settings, ...patch } });

/** Game state: open orders / gift boxes cleared (the game spawns new ones on schedule). */
export const clearOrders: Edit = (s) => ({ ...s, orders: [] });
export const clearGifts: Edit = (s) => ({ ...s, gifts: { nextAt: null, boxes: [] } });

/** Game state: a brand-new farm (dangerous — confirmed in the UI; the old save goes to backups). */
export const resetSave = (now: number, rng: Rng): Edit => (s) => newGame({ now, rng }, { reduceMotion: s.settings.reduceMotion });

/** Applies an edit and refuses results the game could not load. */
export function apply(s: FarmGame, edit: Edit): FarmGame {
  const next = edit(s);
  const problems = saveProblems(next);
  if (problems.length) throw new Error(problems.slice(0, 3).join('\n'));
  return next;
}

const DAY = 86_400_000;

/**
 * Time travel (GĐ2): the save looks as if the player left `ms` ago. Every moment in it moves back by
 * `ms` (pigs' clocks, the trough, pregnancies, orders, gifts, history, the game day counters), so the
 * game catches up the missed time the next time it opens — the same as really leaving it closed.
 */
export const rewind = (ms: number): RewindEdit => Object.assign(rewindFarm(ms), { rewindMs: int(ms, 0) });

/** An edit that also moves the other Areas' clocks (the Garden): the dashboard adds `rewindMs` when it writes the world. */
export type RewindEdit = Edit & { rewindMs: number };

const rewindFarm = (ms: number): Edit => (s) => {
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
