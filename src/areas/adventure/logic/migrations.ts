// The Adventure slice's migrations (`areas.sobi_adventure`): v1 → v2 (decision 037, Combat V2 and the exploration map), v2 → v3
// (decision 039, feats, tips and the Rift), v3 → v4 (adventure-big-update-1: guardians beaten for good, the battle board), v4 → v5
// (decision 043: shortcut exits), v5 → v6 (decision 045: hidden places) and v6 → v7 (decision 045: puzzles, the explored ground).
import type { Raw } from '../../../core/save/migrate';
import { AB, MAPS, ZONES } from './config/content';
import { newFeats, newFighterFields } from './state';

/**
 * v1 → v2 (decision 037): fighters keep level, experience, gear and energy, gain the SP of the levels they already have; a trip of the
 * old node chain is closed safely (its loot waits in the pile, the energy is given back); every portal of a cleared zone is lit. The
 * map / zone ids are read from the save itself, so the migration does not depend on today's content.
 */
export function migrateAdventure1to2(slice: Raw, ctx: { energyCost: number; portalsOf: (zoneId: string) => string[] }): Raw {
  const fighters = Object.fromEntries(
    Object.entries((slice.fighters ?? {}) as Record<string, Raw>).map(([key, f]) => [key, { ...f, ...newFighterFields(), sp: 2 * Math.max(0, Number(f.level ?? 1) - 1) }]),
  ) as Record<string, Raw>;
  const pending = { ...((slice.pending ?? {}) as Record<string, number>) };
  const run = slice.run as Raw | null | undefined;
  if (run) {
    if (run.phase !== 'done') {
      for (const [id, n] of Object.entries((run.loot ?? {}) as Record<string, number>)) pending[id] = (pending[id] ?? 0) + n;
      for (const m of (run.team ?? []) as Raw[]) {
        const f = fighters[m.key as string];
        if (f) fighters[m.key as string] = { ...f, energy: Number(f.energy ?? 0) + ctx.energyCost };
      }
    }
  }
  const cleared = (slice.cleared ?? {}) as Record<string, number>;
  return {
    ...slice,
    version: 2,
    fighters,
    run: null,
    pending,
    cleared,
    openedChests: [],
    openedGates: [],
    activePortals: Object.keys(cleared).flatMap((z) => ctx.portalsOf(z)),
    loreFound: [],
    formations: [],
    leader: 'so',
  };
}

/** v2 → v3 (decision 039): fighters start their feats (the bosses they already beat count through `bossClears`); tips and the Rift begin empty; a trip on its way is a zone trip. */
export function migrateAdventure2to3(slice: Raw): Raw {
  const fighters = Object.fromEntries(Object.entries((slice.fighters ?? {}) as Record<string, Raw>).map(([key, f]) => [key, { ...f, feats: newFeats() }]));
  const run = slice.run as Raw | null | undefined;
  return {
    ...slice,
    version: 3,
    fighters,
    run: run ? { ...run, rift: null } : null,
    tipsSeen: [],
    rift: { best: 0, day: -1, dayBest: 0, nightmares: [] },
  };
}

/**
 * v3 → v4 (adventure-big-update-1): a guardian or a zone boss beaten before stays beaten — the areas whose portal it lit and the zones
 * cleared say which (`guardiansOf` gives an area's guardian group keys); a trip on its way has no battle board yet.
 */
export function migrateAdventure3to4(slice: Raw, ctx: { guardiansOf: (mapId: string) => string[]; bossOf: (zoneId: string) => string[] }): Raw {
  const lit = (slice.activePortals ?? []) as string[];
  const cleared = Object.keys((slice.cleared ?? {}) as Record<string, number>);
  const beaten = [...new Set([...lit.flatMap((m) => ctx.guardiansOf(m)), ...cleared.flatMap((z) => ctx.bossOf(z))])];
  const run = slice.run as Raw | null | undefined;
  return { ...slice, version: 4, beaten, run: run ? { ...run, report: null } : null };
}

/** v4 → v5 (decision 043): no shortcut has been opened yet. */
export function migrateAdventure4to5(slice: Raw): Raw {
  return { ...slice, version: 5, openedExits: [] };
}

/** v5 → v6 (decision 045): no hidden place has been found yet. */
export function migrateAdventure5to6(slice: Raw): Raw {
  return { ...slice, version: 6, foundSecrets: [] };
}

/** v6 → v7 (decision 045): no puzzle lit, no ground seen yet (the map shows around the party at once). */
export function migrateAdventure6to7(slice: Raw): Raw {
  return { ...slice, version: 7, litPuzzles: [], explored: {} };
}

// The guardians and bosses of v3 (decision 045's other classes did not exist then and stay out).
const guardiansOf = (mapId: string): string[] => (MAPS[mapId]?.groups ?? []).filter((g) => g.kind === 'elite' || g.kind === 'boss').map((g) => `${mapId}/${g.id}`);

export const ADVENTURE_MIGRATIONS: Record<number, (slice: Raw) => Raw> = {
  1: (slice) => migrateAdventure1to2(slice, { energyCost: AB.run.energyCost, portalsOf: (zoneId) => ZONES[zoneId]?.maps ?? [] }),
  2: migrateAdventure2to3,
  3: (slice) => migrateAdventure3to4(slice, { guardiansOf, bossOf: (zoneId) => (ZONES[zoneId]?.maps ?? []).flatMap((m) => guardiansOf(m).filter((k) => MAPS[m]?.groups.find((g) => `${m}/${g.id}` === k)?.kind === 'boss')) }),
  4: migrateAdventure4to5,
  5: migrateAdventure5to6,
  6: migrateAdventure6to7,
};
