// Area registry (ARCHITECTURE §5 Area Contract): every Area registers a module (manifest + hooks); the
// world store and the save format are built from the registry, so adding an Area touches no world
// code. Pure: time, randomness and the day offset come in as arguments.
import type { AreaManifest } from '../../../content/schemas/area';
import type { TimeRules } from '../clock';
import type { EventBase, WorldEvent } from '../events';
import { simulateWorld, type SimMode, type SimulationResult } from '../simulation/simulate';
import { unlockGaps, worldDevelopment, type UnlockGap, type WorldDevelopmentRules } from '../progression/levels';
import type { Rng } from '../rng';
import type { AreaSaveSpec, LegacyResult, Raw, SaveCodec } from '../save/migrate';
import { emptyWorld, type WorldSave, type WorldSettings } from '../save/world';
import type { ActionContext } from '../types';

export type { AreaManifest };

export type { SimMode };

export interface AreaModule {
  manifest: AreaManifest;
  /** Schema and migrations of its slice `areas[manifest.id]`. */
  save: AreaSaveSpec;
  /** First state of the Area: its slice and anything it gives the world (starter items, coins). */
  init(world: WorldSave, ctx: ActionContext): WorldSave;
  /** Numbers over time up to `now` — the same call for every mode (pure, deterministic per rng). */
  simulate(world: WorldSave, now: number, rng: Rng, dayOffsetMs: number, mode: SimMode): { state: WorldSave; events: EventBase[] };
  /** Time the Area was last simulated up to. */
  simulatedAt(world: WorldSave): number;
  /** Moves its time stamps to `to` without simulating: the part of a long absence past the offline cap is skipped. */
  rebase(world: WorldSave, to: number): WorldSave;
  /** The Area's level (its XP in progression.areas, its own level table). */
  level(world: WorldSave): number;
  /** Its events as standard world events (ARCHITECTURE §7); [] for events that are not its own. */
  toWorldEvents(events: readonly EventBase[]): WorldEvent[];
  /** Lines for the "while you were away" screen (spec §5): what happened (the events) and what needs the player now (the world), as string-table keys with parameters. */
  getSummary?(events: readonly EventBase[], world: WorldSave, now: number): SummaryLine[];
  /** Presentation hooks (scene, AI, animation) for the Area on screen; GĐ3 drives them. */
  onEnter?(): void;
  onExit?(): void;
  updateActive?(dtMs: number): void;
}

/** An Area just opened (its conditions were met): the world's own event, not an Area's. */
export interface AreaUnlockedEvent extends EventBase {
  type: 'AREA_UNLOCKED';
  areaId: string;
}

export interface SummaryLine {
  key: string;
  params?: Readonly<Record<string, string | number>>;
  /** `alert` = needs the player now and is urgent, `warn` = needs care soon. */
  tone?: 'warn' | 'alert';
  /** Where a button on the line leads; the Area's own UI interprets it. */
  goto?: { target: string; id?: string };
}

export interface AreaInfo {
  manifest: AreaManifest;
  /** Its code is not written yet (a later phase): shown in the plaza, closed, with the conditions. */
  planned: boolean;
  unlocked: boolean;
  level: number;
  /** What it still needs to open (empty when unlocked or open from the start). */
  gaps: UnlockGap[];
}

/** `planned`: manifests of Areas that are not built yet; they take no part in the simulation or the save. */
export function createAreaRegistry(
  modules: readonly AreaModule[],
  rules: WorldDevelopmentRules,
  time: TimeRules,
  planned: readonly AreaManifest[] = [],
) {
  const ids = [...modules.map((m) => m.manifest.id), ...planned.map((m) => m.id)];
  const dup = ids.find((id, i) => ids.indexOf(id) !== i);
  if (dup) throw new Error(`area ${dup} registered twice`);
  if (modules.length === 0) throw new Error('no area registered');
  const byId = new Map(modules.map((m) => [m.manifest.id, m]));
  /** Areas with state in this world, in registration order. */
  const present = (world: WorldSave) => modules.filter((m) => m.manifest.id in world.areas);
  const opensAtStart = (m: AreaModule) => !m.manifest.unlock.areaLevels && m.manifest.unlock.worldDevelopment === undefined;

  const levels = (world: WorldSave): Record<string, number> =>
    Object.fromEntries(present(world).map((m) => [m.manifest.id, m.level(world)]));

  /** A new world: every Area open from the start initialised in order; the first is current. */
  function newWorld(ctx: ActionContext, settings: WorldSettings): WorldSave {
    const starting = modules.filter(opensAtStart);
    const first = starting[0] ?? modules[0]!;
    const shell = emptyWorld(ctx.now, settings, first.manifest.id);
    const world = starting.reduce((w, m) => m.init(w, ctx), shell);
    return { ...world, world: { ...world.world, unlockedAreas: starting.map((m) => m.manifest.id) } };
  }

  /** Opens every built Area that is closed and meets its conditions: its first state, its id in `unlockedAreas`. */
  function unlockReady(world: WorldSave, ctx: ActionContext): { state: WorldSave; events: AreaUnlockedEvent[] } {
    const codex = Object.values(world.collection.discovered).reduce((n, ids) => n + ids.length, 0);
    const wd = worldDevelopment({ areaLevels: levels(world), codexEntries: codex, buildingsLv3: 0 }, rules);
    let state = world;
    const events: AreaUnlockedEvent[] = [];
    for (const m of modules) {
      const id = m.manifest.id;
      if (state.world.unlockedAreas.includes(id) || unlockGaps(m.manifest.unlock, levels(state), wd).length > 0) continue;
      const created = id in state.areas ? state : m.init(state, ctx);
      state = { ...created, world: { ...created.world, unlockedAreas: [...created.world.unlockedAreas, id] } };
      events.push({ type: 'AREA_UNLOCKED', areaId: id });
    }
    return { state, events };
  }

  return {
    modules,
    get: (id: string): AreaModule | undefined => byId.get(id),
    newWorld,

    /**
     * Every Area with state catches up to `now`, slice by slice (core/simulation; ARCHITECTURE §6); then any
     * Area whose conditions are met opens (its state is created, `AREA_UNLOCKED` is reported).
     */
    advance(world: WorldSave, now: number, rng: Rng, dayOffsetMs: number, mode: SimMode = 'online'): SimulationResult {
      const r = simulateWorld(present(world), world, now, rng, dayOffsetMs, mode, time);
      if (r.rewound) return r;
      const opened = unlockReady(r.state, { now, rng, dayOffsetMs });
      return opened.events.length === 0 ? r : { ...r, state: opened.state, events: [...r.events, ...opened.events] };
    },

    unlockReady,

    /** The world was simulated up to the earliest of its Areas. */
    simulatedAt: (world: WorldSave): number => Math.min(...present(world).map((m) => m.simulatedAt(world))),

    toWorldEvents: (events: readonly EventBase[]): WorldEvent[] => [
      ...events.filter((e): e is AreaUnlockedEvent => e.type === 'AREA_UNLOCKED').map((e): WorldEvent => ({ type: 'area.unlocked', area: e.areaId })),
      ...modules.flatMap((m) => m.toWorldEvents(events)),
    ],

    summary: (events: readonly EventBase[], world: WorldSave, now: number): SummaryLine[] =>
      modules.flatMap((m) => (m.manifest.id in world.areas ? (m.getSummary?.(events, world, now) ?? []) : [])),

    levels,

    worldDevelopment: (world: WorldSave, codexEntries: number, buildingsLv3 = 0): number =>
      worldDevelopment({ areaLevels: levels(world), codexEntries, buildingsLv3 }, rules),

    /** Every Area, built or planned, with its lock state (the plaza shows locked ones with their conditions). */
    areas(world: WorldSave, codexEntries = 0): AreaInfo[] {
      const lv = levels(world);
      const wd = worldDevelopment({ areaLevels: lv, codexEntries, buildingsLv3: 0 }, rules);
      const built = modules.map((m): AreaInfo => {
        const unlocked = world.world.unlockedAreas.includes(m.manifest.id);
        return {
          manifest: m.manifest,
          planned: false,
          unlocked,
          level: lv[m.manifest.id] ?? 0,
          gaps: unlocked ? [] : unlockGaps(m.manifest.unlock, lv, wd),
        };
      });
      // A planned Area cannot be open, whatever its conditions: there is nothing to enter yet.
      const soon = planned.map(
        (manifest): AreaInfo => ({ manifest, planned: true, unlocked: false, level: 0, gaps: unlockGaps(manifest.unlock, lv, wd) }),
      );
      return [...built, ...soon];
    },

    /** The save format of this build: Sobi Farm import + one slice spec per Area. */
    codec(legacy: (input: Raw) => LegacyResult, settings: (opts: { reduceMotion?: boolean }) => WorldSettings): SaveCodec {
      return {
        legacy,
        areas: Object.fromEntries(modules.map((m) => [m.manifest.id, m.save])),
        newWorld: (ctx, opts = {}) => newWorld(ctx, settings(opts)),
      };
    },
  };
}

export type AreaRegistry = ReturnType<typeof createAreaRegistry>;
