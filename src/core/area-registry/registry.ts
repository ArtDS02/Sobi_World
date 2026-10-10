// Area registry (ARCHITECTURE §5 Area Contract): every Area registers a module (manifest + hooks); the
// world store and the save format are built from the registry, so adding an Area touches no world
// code. Pure: time, randomness and the day offset come in as arguments.
import type { AreaManifest } from '../../../content/schemas/area';
import type { TimeRules } from '../clock';
import type { ErrorCode } from '../config/errors';
import type { CodexKind } from '../collection/codex';
import type { EventBase, WorldEvent } from '../events';
import { simulateWorld, type SimMode, type SimulationResult } from '../simulation/simulate';
import { unlockGaps, worldDevelopment, worldLevel, type LevelTable, type UnlockGap, type WorldDevelopmentRules } from '../progression/levels';
import type { Rng } from '../rng';
import type { AreaSaveSpec, LegacyResult, Raw, SaveCodec } from '../save/migrate';
import { emptyWorld, type WorldSave, type WorldSettings } from '../save/world';
import type { ActionContext } from '../types';

export type { AreaManifest };

export type { SimMode };

/** One creature an Area lets another Area use (Adventure picks its fighters from every Area's roster; ARCHITECTURE: Areas never import each other). */
export interface RosterEntry {
  /** `<areaId>:<creatureId>`, unique in the world. */
  key: string;
  areaId: string;
  id: string;
  kind: 'pig' | 'fish';
  name: string;
  /** Breed id (pig) or fish species id. */
  speciesId: string;
  /** The pig's family; null for a fish. */
  family: string | null;
  rarity: string;
  /** Whole hearts of Bond. */
  hearts: number;
  sick: boolean;
  /** Grown enough to be given a purpose. */
  adult: boolean;
  /** Why it is raised; null = not chosen yet. */
  purpose: string | null;
  artId: string;
}

/** What one Area gives to another: a creature of a species, raised for a purpose. */
export interface CreatureGift {
  kind: 'creature';
  area: string;
  species: string;
  purpose: string;
}

export type GiftResult = { ok: true; state: WorldSave } | { ok: false; error: ErrorCode };

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
  /** What it adds to the Codex (its breeds, its crops…): every entry the player can discover. */
  codex?(): readonly CodexKind[];
  /** How many entries its 'ALL' achievements ask for besides the Codex's (the farm: its decorations). */
  totals?(): Readonly<Record<string, number>>;
  /** What the player could do in it now, most urgent first or not (the registry sorts). */
  suggest?(world: WorldSave, now: number, dayOffsetMs: number): Suggestion[];
  /** The creatures it lets the other Areas use (Adventure's fighters). */
  roster?(world: WorldSave): RosterEntry[];
  /** Takes a gift from another Area (a creature); an error when it cannot. */
  receiveGift?(world: WorldSave, gift: CreatureGift, ctx: ActionContext): GiftResult;
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

/** One thing the player could do now, from an Area (the "next step" chip, spec V2 §13: always know what to do next). */
export interface Suggestion {
  /** String-table key `suggest.<area>.<what>` and its parameters. */
  key: string;
  params?: Readonly<Record<string, string | number>>;
  /** 0-100: how urgent (≥ 80 = care that cannot wait). */
  priority: number;
  tone?: 'warn' | 'alert';
  /** Where doing it leads: a panel of the shell, a pig, or a place. */
  goto?: { target: string; id?: string };
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
  /** What it still needs to open (empty when unlocked or open from the start). */
  gaps: UnlockGap[];
}

/** `planned`: manifests of Areas that are not built yet; they take no part in the simulation or the save. */
/** The one level table and the World Development weights (decision 007, 013). */
export interface ProgressionRules {
  levels: LevelTable;
  development: WorldDevelopmentRules;
}

export function createAreaRegistry(
  modules: readonly AreaModule[],
  rules: ProgressionRules,
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
  const opensAtStart = (m: AreaModule) => m.manifest.unlock.worldLevel === undefined && m.manifest.unlock.worldDevelopment === undefined;

  const levelOf = (world: WorldSave): number => worldLevel(world, rules.levels);
  const codexOf = (world: WorldSave): number => Object.values(world.collection.discovered).reduce((n, ids) => n + ids.length, 0);
  /** World Development: the level + Codex entries + buildings Lv3+ (no building reports its level yet). */
  const developmentOf = (world: WorldSave, codexEntries = codexOf(world), buildingsLv3 = 0): number =>
    worldDevelopment({ worldLevel: levelOf(world), codexEntries, buildingsLv3 }, rules.development);
  const gapsOf = (world: WorldSave, m: AreaManifest) => unlockGaps(m.unlock, { worldLevel: levelOf(world), worldDevelopment: developmentOf(world) });

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
    let state = world;
    const events: AreaUnlockedEvent[] = [];
    for (const m of modules) {
      const id = m.manifest.id;
      if (state.world.unlockedAreas.includes(id) || gapsOf(state, m.manifest).length > 0) continue;
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

    /** What the player could do now across the open Areas, most urgent first. */
    suggest: (world: WorldSave, now: number, dayOffsetMs = 0): Suggestion[] =>
      modules
        .filter((m) => m.manifest.id in world.areas)
        .flatMap((m) => m.suggest?.(world, now, dayOffsetMs) ?? [])
        .sort((a, b) => b.priority - a.priority),

    /** Every creature the open Areas let others use. */
    roster: (world: WorldSave): RosterEntry[] => modules.filter((m) => m.manifest.id in world.areas).flatMap((m) => m.roster?.(world) ?? []),

    /** A gift to the Area it names. */
    give(world: WorldSave, gift: CreatureGift, ctx: ActionContext): GiftResult {
      const to = byId.get(gift.area);
      if (!to?.receiveGift || !(gift.area in world.areas)) return { ok: false, error: 'INVALID_REQUEST' };
      return to.receiveGift(world, gift, ctx);
    },

    /** Every Codex kind the Areas offer (the world's own kinds are added by the app). */
    codexKinds: (): CodexKind[] => modules.flatMap((m) => m.codex?.() ?? []),

    /** Totals the Areas add for the 'ALL' achievements. */
    extraTotals: (): Record<string, number> => Object.assign({}, ...modules.map((m) => m.totals?.() ?? {})),

    /** The one Sobi World Level of this world. */
    worldLevel: levelOf,

    worldDevelopment: developmentOf,

    /** Every Area, built or planned, with its lock state (the plaza shows locked ones with their conditions). */
    areas(world: WorldSave): AreaInfo[] {
      const built = modules.map((m): AreaInfo => {
        const unlocked = world.world.unlockedAreas.includes(m.manifest.id);
        return {
          manifest: m.manifest,
          planned: false,
          unlocked,
          gaps: unlocked ? [] : gapsOf(world, m.manifest),
        };
      });
      // A planned Area cannot be open, whatever its conditions: there is nothing to enter yet.
      const soon = planned.map(
        (manifest): AreaInfo => ({ manifest, planned: true, unlocked: false, gaps: gapsOf(world, manifest) }),
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
