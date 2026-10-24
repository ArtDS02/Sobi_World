// The Adventure's slice of the world save (`areas.sobi_adventure`, v2 since decision 037): its fighters (level, experience, class, SP and
// skill tree, class loadout, Rage, equipment, energy), the trip in progress (where the party stands on which area, what it beat and
// found, the battle on), what stays opened for good (treasure chests, gates, portals, lore), formations, the leader, loot waiting for
// room in the bag. The creatures themselves stay in their own Areas; coins, items and XP are world fields.
import { z } from 'zod';
import type { BattleState } from '../../../systems/combat/types';
import type { Loadout } from '../../../systems/equipment';
import { EQUIPMENT_SLOTS } from '../../../systems/equipment';
import { CATEGORY_VALUES, ELEMENT_VALUES, STATUS_VALUES, STAT_VALUES } from '../../../../content/schemas/adventure/combat';
import { CLASS_ID_VALUES } from '../../../../content/schemas/adventure/classes';
import { LINEAGE_ID_VALUES } from '../../../../content/schemas/adventure/lineages';

export const ADVENTURE_STATE_VERSION = 3;

const time = z.number().finite();
const nonNeg = z.number().finite().min(0);
const counts = z.record(z.string(), z.number().int().min(0));
const element = z.enum(ELEMENT_VALUES);
const share = z.record(z.string(), z.number().finite());

const loadoutSchema = z.strictObject(Object.fromEntries(EQUIPMENT_SLOTS.map((s) => [s, z.string().optional()])) as Record<(typeof EQUIPMENT_SLOTS)[number], z.ZodOptional<z.ZodString>>);

const fighterSchema = z.strictObject({
  level: z.number().int().min(1),
  exp: nonNeg,
  loadout: loadoutSchema,
  /** Adventure energy at `energyAt`; it refills with time (fighters.ts). */
  energy: nonNeg,
  energyAt: time,
  /** Exhausted (lost a trip) until this time. */
  exhaustedUntil: time.nullable(),
  /** The class chosen at the temple; null = the default class of its line. */
  classId: z.enum(CLASS_ID_VALUES).nullable(),
  /** Skill points not spent yet. */
  sp: z.number().int().min(0),
  /** Opened nodes of its class tree and their level (the starter node counts as level 1 even when absent). */
  tree: z.record(z.string(), z.number().int().min(1)),
  /** The class skills it carries into battle; null = the first opened ones. */
  skills: z.array(z.string()).nullable(),
  /** Rage kept between battles and trips (spec §8.3). */
  rage: nonNeg,
  /** Tree resets done (the first is free). */
  resets: z.number().int().min(0),
  /** Zones whose boss it helped beat (its first time gives SP). */
  bossClears: z.array(z.string()),
  /** What it has done, for its titles and memories (decision 039). */
  feats: z.strictObject({
    battles: z.number().int().min(0),
    bestHit: nonNeg,
    ultimates: z.number().int().min(0),
    /** Highest Rift floor cleared with it, and the Nightmare bosses (enemy ids) it helped beat. */
    rift: z.number().int().min(0),
    nightmares: z.array(z.string()),
  }),
});

const statsSchema = z.strictObject(Object.fromEntries(STAT_VALUES.map((k) => [k, nonNeg])) as Record<(typeof STAT_VALUES)[number], typeof nonNeg>);

const modsSchema = z.strictObject({
  elementDamage: share,
  elementResist: share,
  statusChance: share,
  statusResist: share,
  categoryDamage: share,
});

const memberSchema = z.strictObject({
  key: z.string().min(1),
  name: z.string().min(1),
  /** The creature's picture (its own Area's art id). */
  art: z.string(),
  lineage: z.enum(LINEAGE_ID_VALUES),
  classId: z.enum(CLASS_ID_VALUES),
  element,
  element2: element.nullable(),
  stats: statsSchema,
  /** HP / MP it carries from battle to battle. */
  hp: nonNeg,
  mp: nonNeg,
  rage: nonNeg,
  skills: z.array(z.strictObject({ id: z.string(), level: z.number().int().min(1) })),
  ultimate: z.string(),
  mods: modsSchema,
});

const statusSchema = z.strictObject({ id: z.enum(STATUS_VALUES), turns: z.number(), amount: z.number(), stacks: z.number().int(), source: element.nullable() });

const status = z.enum(STATUS_VALUES);
const actionSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('attack'), target: z.string() }),
  z.strictObject({ kind: z.literal('skill'), skillId: z.string(), target: z.string().optional() }),
  z.strictObject({ kind: z.literal('ultimate'), target: z.string().optional() }),
  z.strictObject({ kind: z.literal('item'), itemId: z.string(), target: z.string().optional() }),
  z.strictObject({ kind: z.literal('guard') }),
]);

const combatantSchema = z.strictObject({
  id: z.string(),
  side: z.enum(['ally', 'enemy']),
  name: z.string(),
  element,
  element2: element.nullable(),
  tags: z.array(z.string()),
  stats: statsSchema,
  hp: nonNeg,
  mp: nonNeg,
  rage: nonNeg,
  rageMax: nonNeg,
  skills: z.array(z.strictObject({ id: z.string(), level: z.number().int().min(1) })),
  ultimate: z.string().nullable(),
  ultimateUsed: z.boolean(),
  cooldowns: z.record(z.string(), z.number()),
  statuses: z.array(statusSchema),
  immune: z.partialRecord(status, z.number()),
  guarding: z.boolean(),
  mods: z.strictObject({
    elementDamage: z.partialRecord(element, z.number()),
    elementResist: z.partialRecord(element, z.number()),
    statusChance: z.partialRecord(status, z.number()),
    statusResist: z.partialRecord(status, z.number()),
    statusImmune: z.array(status),
    categoryDamage: z.partialRecord(z.enum(CATEGORY_VALUES), z.number()),
    damage: z.number(),
    elementOverrides: z.partialRecord(element, z.enum(['STRONG', 'NEUTRAL', 'WEAK', 'RESIST', 'IMMUNE'])),
  }),
  phases: z.array(z.strictObject({ hpBelow: z.number(), addSkills: z.array(z.string()), statuses: z.array(z.strictObject({ status, turns: z.number().int() })), element: element.optional() })),
  phase: z.number().int().min(0),
  intent: actionSchema.nullable(),
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
  /** The area the party walks now, and where it stands (design px, the walker's feet). */
  mapId: z.string().min(1),
  x: z.number().finite(),
  y: z.number().finite(),
  facing: z.enum(['up', 'down', 'left', 'right']),
  seed: z.number().int(),
  team: z.array(memberSchema).min(1),
  /** explore = walking, battle = a fight is on, done = the trip is over and its summary waits. */
  phase: z.enum(['explore', 'battle', 'done']),
  battle: battleSchema.nullable(),
  /** The group fought (`<mapId>/<groupId>`). */
  fighting: z.string().nullable(),
  /** Battles started this trip (each one draws from its own seed). */
  encounters: z.number().int().min(0),
  /** Groups beaten, resource spots used, springs drunk this trip (they come back on the next trip). */
  defeated: z.array(z.string()),
  harvested: z.array(z.string()),
  springs: z.array(z.string()),
  /** Guardian shrine blessings of this trip: extra damage share by element. */
  blessings: share,
  /** No battle starts before this time (after fleeing). */
  graceUntil: time.nullable(),
  /** Items found this trip (they go to the pending loot when it ends), coins and gems already paid. */
  loot: counts,
  coins: nonNeg,
  gems: nonNeg,
  /** Experience each fighter of the team gained, SP from boss firsts and scrolls. */
  expGained: nonNeg,
  spGained: nonNeg,
  /** Fighters that rose a level this trip (keys). */
  levelUps: z.array(z.string()),
  /** The rations carried into this trip (item ids, GĐ11). */
  prep: z.array(z.string()),
  /** The last thing that happened on the map (a traveller, a lore stone, a shrine), for the screen. */
  lastEvent: z.strictObject({ kind: z.enum(['npc', 'lore', 'shrine', 'chest', 'node', 'gate', 'spring', 'portal', 'boss', 'elite']), id: z.string() }).nullable(),
  /** The events of the last step of the battle, for the screen to play. */
  log: z.array(z.looseObject({ type: z.string() })),
  bossBeaten: z.boolean(),
  /** A trip into the Umbraflux Rift (decision 039): floors cleared so far and the rule of the day it started on; null = a zone trip. */
  rift: z.strictObject({ floor: z.number().int().min(0), ruleId: z.string() }).nullable(),
  result: z.enum(['win', 'lose', 'retreat', 'sweep']).nullable(),
  startedAt: time,
});

const formationSchema = z.strictObject({ keys: z.array(z.string()).max(3) });

export const adventureStateSchema = z.strictObject({
  version: z.literal(ADVENTURE_STATE_VERSION),
  /** Fighters by roster key (`<areaId>:<creatureId>`); created the first time a creature is looked at. */
  fighters: z.record(z.string(), fighterSchema),
  run: runSchema.nullable(),
  /** Loot that did not fit in the bag yet. */
  pending: counts,
  starterClaimed: z.boolean(),
  /** Times the boss of each zone has been beaten (GĐ11: a zone opens after the one before it). */
  cleared: z.record(z.string(), z.number().int().min(1)),
  /** Opened for good (spec §3.5–3.7): treasure chests, element gates, portals (area ids), lore stones read. */
  openedChests: z.array(z.string()),
  openedGates: z.array(z.string()),
  activePortals: z.array(z.string()),
  loreFound: z.array(z.string()),
  formations: z.array(formationSchema),
  /** Who leads the party on the map. */
  leader: z.enum(['so', 'bi']),
  /** Area tips already shown (decision 039). */
  tipsSeen: z.array(z.string()),
  /** The Rift: best floor ever, the day (game days since epoch) of `dayBest`, the Nightmare bosses beaten. */
  rift: z.strictObject({ best: z.number().int().min(0), day: z.number().int(), dayBest: z.number().int().min(0), nightmares: z.array(z.string()) }),
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
export type MemberMods = RunMember['mods'];
export const CATEGORIES = CATEGORY_VALUES;

export const newFighterFields = (): Omit<Fighter, 'level' | 'exp' | 'loadout' | 'energy' | 'energyAt' | 'exhaustedUntil'> => ({
  classId: null,
  sp: 0,
  tree: {},
  skills: null,
  rage: 0,
  resets: 0,
  bossClears: [],
  feats: newFeats(),
});

export const newFeats = (): Fighter['feats'] => ({ battles: 0, bestHit: 0, ultimates: 0, rift: 0, nightmares: [] });

export const initialAdventure = (now: number): AdventureState => ({
  version: ADVENTURE_STATE_VERSION,
  fighters: {},
  run: null,
  pending: {},
  starterClaimed: false,
  cleared: {},
  openedChests: [],
  openedGates: [],
  activePortals: [],
  loreFound: [],
  formations: [],
  leader: 'so',
  tipsSeen: [],
  rift: { best: 0, day: -1, dayBest: 0, nightmares: [] },
  battlesWon: 0,
  runsCleared: 0,
  runsLost: 0,
  lastTickedAt: now,
});
