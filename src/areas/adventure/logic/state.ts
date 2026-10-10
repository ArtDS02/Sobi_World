// The Adventure's slice of the world save (`areas.sobi_adventure`): its fighters (level, experience, equipment, energy), the
// run in progress and loot waiting for room in the bag. The creatures themselves stay in their own Areas; coins, items and
// XP are world fields.
import { z } from 'zod';
import type { Raw } from '../../../core/save/migrate';
import type { BattleState } from '../../../systems/combat/types';
import type { Loadout } from '../../../systems/equipment';
import { EQUIPMENT_SLOTS } from '../../../systems/equipment';
import { ELEMENT_VALUES, STATUS_VALUES } from '../../../../content/schemas/adventure/skills';

export const ADVENTURE_STATE_VERSION = 1;

const time = z.number().finite();
const nonNeg = z.number().finite().min(0);
const counts = z.record(z.string(), z.number().int().min(0));

const loadoutSchema = z.strictObject(Object.fromEntries(EQUIPMENT_SLOTS.map((s) => [s, z.string().optional()])) as Record<(typeof EQUIPMENT_SLOTS)[number], z.ZodOptional<z.ZodString>>);

const fighterSchema = z.strictObject({
  level: z.number().int().min(1),
  exp: nonNeg,
  loadout: loadoutSchema,
  /** Adventure energy at `energyAt`; it refills with time (derived.ts). */
  energy: nonNeg,
  energyAt: time,
  /** Exhausted (lost a run) until this time. */
  exhaustedUntil: time.nullable(),
});

const statsSchema = z.strictObject({ hp: nonNeg, atk: nonNeg, def: nonNeg, spd: nonNeg, crit: nonNeg });

const memberSchema = z.strictObject({
  key: z.string().min(1),
  name: z.string().min(1),
  /** The creature's picture (its own Area's art id). */
  art: z.string(),
  element: z.enum(ELEMENT_VALUES),
  stats: statsSchema,
  /** HP it carries from node to node. */
  hp: nonNeg,
  skills: z.array(z.string()),
});

const combatantSchema = z.strictObject({
  id: z.string(),
  side: z.enum(['ally', 'enemy']),
  name: z.string(),
  element: z.enum(ELEMENT_VALUES),
  maxHp: nonNeg,
  hp: nonNeg,
  atk: nonNeg,
  def: nonNeg,
  spd: nonNeg,
  crit: nonNeg,
  energy: nonNeg,
  skills: z.array(z.string()),
  cooldowns: z.record(z.string(), z.number()),
  statuses: z.array(z.strictObject({ id: z.enum(STATUS_VALUES), turns: z.number(), amount: z.number() })),
});

const battleSchema = z.strictObject({
  seed: z.number().int(),
  counter: z.number().int().min(0),
  round: z.number().int().min(0),
  order: z.array(z.string()),
  combatants: z.array(combatantSchema),
  outcome: z.enum(['win', 'lose']).nullable(),
});

const runSchema = z.strictObject({
  zoneId: z.string().min(1),
  seed: z.number().int(),
  /** The node the party stands before (or fights at). */
  nodeIndex: z.number().int().min(0),
  team: z.array(memberSchema).min(1),
  /** map = between nodes, battle = a fight is on, done = the run is over and its summary waits. */
  phase: z.enum(['map', 'battle', 'done']),
  battle: battleSchema.nullable(),
  /** Items found this run (they go to the pending loot when it ends), coins and gems already paid. */
  loot: counts,
  coins: nonNeg,
  gems: nonNeg,
  /** Experience each fighter of the team gained this run. */
  expGained: nonNeg,
  /** Fighters that rose a level this run (keys). */
  levelUps: z.array(z.string()),
  /** The small event that just happened at an event node (its id), for the screen. */
  lastEvent: z.string().nullable(),
  /** The events of the last step of the battle, for the screen to play. */
  log: z.array(z.looseObject({ type: z.string() })),
  result: z.enum(['win', 'lose', 'retreat']).nullable(),
  startedAt: time,
});

export const adventureStateSchema = z.strictObject({
  version: z.literal(ADVENTURE_STATE_VERSION),
  /** Fighters by roster key (`<areaId>:<creatureId>`); created the first time a creature goes on a run. */
  fighters: z.record(z.string(), fighterSchema),
  run: runSchema.nullable(),
  /** Loot that did not fit in the bag yet. */
  pending: counts,
  starterClaimed: z.boolean(),
  battlesWon: z.number().int().min(0),
  runsCleared: z.number().int().min(0),
  runsLost: z.number().int().min(0),
  /** Time the slice was simulated up to (epoch ms). */
  lastTickedAt: time,
});

export type AdventureState = z.infer<typeof adventureStateSchema>;
export type Fighter = z.infer<typeof fighterSchema> & { loadout: Loadout };
export type Run = Omit<z.infer<typeof runSchema>, 'battle' | 'log'> & { battle: BattleState | null; log: { type: string }[] };
export type RunMember = z.infer<typeof memberSchema>;

export const ADVENTURE_MIGRATIONS: Record<number, (slice: Raw) => Raw> = {};

export const initialAdventure = (now: number): AdventureState => ({
  version: ADVENTURE_STATE_VERSION,
  fighters: {},
  run: null,
  pending: {},
  starterClaimed: false,
  battlesWon: 0,
  runsCleared: 0,
  runsLost: 0,
  lastTickedAt: now,
});
