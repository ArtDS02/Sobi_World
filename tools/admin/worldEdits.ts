// Edits of a player's world save in the admin dashboard (decisions AD-1, 036): pure functions WorldSave → WorldSave,
// grouped like the editor's tabs. Money only moves through core's changeCurrency (an ADMIN_ADJUST transaction per
// currency); the Farm's own edits run on its view (farmEdits.ts, lensed with farmOf / withFarm); every result is
// checked with the world schema and each Area's own save schema before it can be written.
import { AREAS } from '../../src/app/areas';
import { parseWorldSave } from '../../src/app/saveCodec';
import { GOALS } from '../../src/app/goals';
import { farmOf, withFarm } from '../../src/areas/farm/logic/save/lens';
import { rewindAdventureInWorld } from '../../src/areas/adventure/logic/rewind';
import { rewindAquariumInWorld } from '../../src/areas/aquarium/logic/rewind';
import { rewindCloudInWorld } from '../../src/areas/cloud/logic/rewind';
import { rewindGardenInWorld } from '../../src/areas/garden/logic/rewind';
import type { FarmGame } from '../../src/areas/farm/logic/types';
import { INVENTORY } from '../../src/core/config/inventory';
import { WORLD_LEVELS } from '../../src/core/config/progression';
import { changeCurrency } from '../../src/core/economy/ledger';
import { usedSlots } from '../../src/core/inventory/bag';
import { areaXp, levelProgress, worldXp } from '../../src/core/progression/levels';
import type { Rng } from '../../src/core/rng';
import { worldSaveSchema, type Currency, type WorldSave } from '../../src/core/save/world';
import { rewindFarm } from './farmEdits';

export type Edit = (w: WorldSave) => WorldSave;

const lines = (issues: readonly { path: PropertyKey[]; message: string }[], prefix: string) =>
  issues.map((i) => `${[prefix, ...i.path.map(String)].filter(Boolean).join(' › ') || 'save'}: ${i.message}`);

/** Problems the game's save reader would refuse, as readable lines (empty = the game loads it). */
export function saveProblems(w: WorldSave): string[] {
  const world = worldSaveSchema.safeParse(w);
  const out = world.success ? [] : lines(world.error.issues, '');
  for (const m of AREAS.modules) {
    const id = m.manifest.id;
    if (!(id in w.areas)) continue;
    const r = m.save.schema.safeParse(w.areas[id]);
    if (!r.success) out.push(...lines(r.error.issues, `areas › ${id}`));
  }
  if (out.length === 0) {
    const r = parseWorldSave(JSON.stringify(w));
    if (!r.ok) out.push(`Game không đọc được save: ${r.error}`);
  }
  return out;
}

/** Applies an edit and refuses results the game could not load. */
export function apply(w: WorldSave, edit: Edit): WorldSave {
  const next = edit(w);
  const problems = saveProblems(next);
  if (problems.length) throw new Error(problems.slice(0, 4).join('\n'));
  return next;
}

export function summary(w: WorldSave) {
  const xp = worldXp(w);
  const lv = levelProgress(xp, WORLD_LEVELS);
  const farm = AREAS.get('sobi_farm') && 'sobi_farm' in w.areas ? farmOf(w) : null;
  const codex = Object.values(w.collection.discovered).reduce((n, ids) => n + ids.length, 0);
  return {
    xp,
    level: lv.level,
    nextXp: lv.next,
    percent: lv.percent,
    coins: w.wallet.coins,
    gems: w.wallet.gems,
    tokens: w.wallet.eventTokens,
    areas: w.world.unlockedAreas.length,
    pigs: farm?.pigs.length ?? 0,
    slots: farm?.player.unlockedSlots ?? 0,
    sick: farm?.pigs.filter((p) => p.isSick).length ?? 0,
    bagSlots: usedSlots(w.inventory.items, INVENTORY),
    codex,
  };
}

const int = (n: number, min: number, max = Number.MAX_SAFE_INTEGER) => {
  if (!Number.isFinite(n)) throw new Error('Giá trị không phải số');
  return Math.min(max, Math.max(min, Math.round(n)));
};

/** A currency set to `target` through one ADMIN_ADJUST transaction (the difference). */
export const setCurrency = (currency: Currency, target: number, now: number, rng: Rng): Edit => (w) => {
  const delta = int(target, 0) - w.wallet[currency];
  if (delta === 0) return w;
  const r = changeCurrency(w, currency, delta, { type: 'ADMIN_ADJUST', note: 'admin' }, { now, rng });
  if (!r.ok) throw new Error('Số dư không được âm');
  return r.state;
};

/** Bag counts (whole, ≥ 0); 0 removes the entry. */
export const setItems = (counts: Readonly<Record<string, number>>): Edit => (w) => {
  const items = { ...w.inventory.items };
  for (const [id, n] of Object.entries(counts)) {
    const v = int(n, 0, 1_000_000);
    if (v === 0) delete items[id];
    else items[id] = v;
  }
  return { ...w, inventory: { items } };
};

/** One Area's share of the world XP (the world level is their sum). */
export const setAreaXp = (areaId: string, xp: number): Edit => (w) => ({
  ...w,
  progression: { ...w.progression, areas: { ...w.progression.areas, [areaId]: { xp: int(xp, 0) } } },
});

/** World XP set to `target`: the difference goes to (or comes from) the Farm's share, never below 0. */
export const setWorldXp = (target: number): Edit => (w) => {
  const others = worldXp(w) - areaXp(w, 'sobi_farm');
  if (int(target, 0) < others) throw new Error(`Các khu khác đã có ${others} KN: giảm KN của từng khu ở bảng bên dưới`);
  return setAreaXp('sobi_farm', int(target, 0) - others)(w);
};

/**
 * The Areas the player can enter. A newly opened Area gets its starting state (its init); a closed one keeps its
 * state (re-opening it later finds it as it was). The current Area stays open.
 */
export const setUnlockedAreas = (ids: readonly string[], now: number, rng: Rng): Edit => (w) => {
  const known = AREAS.modules.map((m) => m.manifest.id);
  const keep = known.filter((id) => ids.includes(id));
  if (keep.length === 0) throw new Error('Phải mở ít nhất một khu');
  let next = w;
  for (const id of keep) if (!(id in next.areas)) next = AREAS.get(id)!.init(next, { now, rng, dayOffsetMs: 0 });
  const current = keep.includes(next.world.currentArea) ? next.world.currentArea : keep[0]!;
  return { ...next, world: { currentArea: current, unlockedAreas: keep } };
};

export const setStats = (stats: Readonly<Record<string, number>>): Edit => (w) => {
  const next = { ...w.progression.stats };
  for (const [k, v] of Object.entries(stats)) {
    const n = int(v, 0);
    if (n === 0) delete next[k];
    else next[k] = n;
  }
  return { ...w, progression: { ...w.progression, stats: next } };
};

/** Achievements claimed: kept ones keep their time, new ones are stamped `now`. */
export const setClaimed = (ids: readonly string[], now: number): Edit => (w) => ({
  ...w,
  progression: { ...w.progression, claimed: Object.fromEntries(ids.map((id) => [id, w.progression.claimed[id] ?? now])) },
});

/** Daily gift streak; `lastDay` null = today's gift can be claimed again. */
export const setDaily = (streak: number, lastDay: number | null): Edit => (w) => ({
  ...w,
  progression: { ...w.progression, daily: { streak: int(streak, 0, 10_000), lastDay } },
});

/** Codex: the discovered ids of one kind (breed, crop, fish, flower, item…). */
export const setDiscovered = (kind: string, ids: readonly string[]): Edit => (w) => ({
  ...w,
  collection: { ...w.collection, discovered: { ...w.collection.discovered, [kind]: [...new Set(ids)] } },
});

export const setCodexClaimed = (ids: readonly string[]): Edit => (w) => ({ ...w, collection: { ...w.collection, claimed: [...new Set(ids)] } });

export const setSettings = (patch: Partial<WorldSave['settings']>): Edit => (w) => ({ ...w, settings: { ...w.settings, ...patch } });

/** A part of the save replaced as a whole (an Area's state, the goals, the living world) — the generic editors. */
export const setPart = (path: readonly string[], value: unknown): Edit => (w) => {
  const copy = { ...w } as Record<string, unknown>;
  let at = copy;
  for (const k of path.slice(0, -1)) {
    at[k] = { ...(at[k] as Record<string, unknown>) };
    at = at[k] as Record<string, unknown>;
  }
  at[path[path.length - 1]!] = structuredClone(value);
  return copy as unknown as WorldSave;
};

/** The whole save from a JSON text (the advanced editor); older versions migrate like the game does. */
export const replaceAll = (json: string): Edit => () => {
  const r = parseWorldSave(json);
  if (!r.ok) throw new Error(`JSON không phải save hợp lệ: ${r.error}`);
  return r.save;
};

/** A Farm edit on the world (the Farm's view written back). */
export const onFarm = (edit: (s: FarmGame) => FarmGame): Edit => (w) => withFarm(w, edit(farmOf(w)));

/** A brand-new world (the old save goes to backups when written). */
export const resetWorld = (now: number, rng: Rng): Edit => (w) =>
  AREAS.newWorld({ now, rng, dayOffsetMs: 0 }, { ...w.settings, tutorialDone: false, lastExportAt: w.settings.lastExportAt });

const shift = (v: number | null, back: number) => (v === null ? null : v - back);

/**
 * Time travel: the save looks as if the player left `ms` ago — every Area's clocks, the Order Board and the history
 * move back, so the next start catches up exactly that much (the same as really leaving the game closed).
 */
export const rewind = (ms: number): Edit => (w) => {
  const back = int(ms, 0);
  let next = 'sobi_farm' in w.areas ? withFarm(w, rewindFarm(back)(farmOf(w))) : w;
  next = rewindAdventureInWorld(rewindCloudInWorld(rewindAquariumInWorld(rewindGardenInWorld(next, back), back), back), back);
  const board = next.goals.board;
  return {
    ...next,
    goals: {
      ...next.goals,
      board: { ...board, nextAt: shift(board.nextAt, back), slots: board.slots.map((o) => (o ? { ...o, createdAt: o.createdAt - back } : o)) },
    },
  };
};

/** Every kind of the Codex with its entries (the Areas' and the items'). */
export const codexKinds = () => GOALS.codexKinds();
