// The Aquarium's slice of the world save (`areas.sobi_aquarium`): the tank, its fish and eggs, the rod. Coins, items
// and XP are world fields (core/economy, core/inventory, core/progression).
import { z } from 'zod';
import { PURPOSE_VALUES } from '../../../../content/schemas/vocab';
import { GENDER_VALUES } from '../../../core/config/ids';
import type { Raw } from '../../../core/save/migrate';
import type { Ancestor } from '../../../systems/breeding/types';
import type { Creature } from '../../../systems/creature/types';
import { AB, FISH, MAX_TANK_LEVEL } from './config/content';

export const AQUARIUM_STATE_VERSION = 1;

const time = z.number().finite();
const nonNeg = z.number().finite().min(0);
const pct = z.number().finite().min(0).max(100);
const gender = z.enum(GENDER_VALUES);

const ancestorSchema: z.ZodType<Ancestor> = z.lazy(() =>
  z.object({
    name: z.string(),
    breed: z.string(),
    gender,
    generation: z.number().int().min(1),
    traits: z.array(z.string()).optional(),
    mother: ancestorSchema.optional(),
    father: ancestorSchema.optional(),
  }),
);
const lineageSchema = z.object({ mother: ancestorSchema.optional(), father: ancestorSchema.optional() });
const speciesId = z.string().refine((id) => id in FISH, 'unknown fish species');

const fishSchema = z.strictObject({
  id: z.string().min(1),
  /** Species id (content/aquarium/fish.json). */
  breed: speciesId,
  name: z.string().min(1).max(AB.life.nameMax),
  gender,
  growthProgress: pct,
  hunger: pct,
  cleanliness: pct,
  isSick: z.boolean(),
  energy: pct.optional(),
  /** Scales shed so far (the integer part is the scales dropped); same bookkeeping as a pig's manure. */
  poopProgress: nonNeg.optional(),
  illRisk: nonNeg.optional(),
  moodAvg: pct.optional(),
  moodSec: nonNeg.optional(),
  purpose: z.enum(PURPOSE_VALUES).optional(),
  bond: z.number().finite().min(0).max(100).optional(),
  petDay: z.number().int().optional(),
  petCount: z.number().int().min(0).optional(),
  moodBoost: z.strictObject({ amount: nonNeg, until: time }).optional(),
  traits: z.array(z.string()).optional(),
  hiddenTrait: z.string().optional(),
  lineage: lineageSchema.optional(),
  lastTickedAt: time,
  createdAt: time,
  generation: z.number().int().min(1).optional(),
  lastFedAt: time.optional(),
  lastCleanedAt: time.optional(),
  lastSickAt: time.optional(),
  sickDay: z.number().int().optional(),
  sickEpisodes: z.number().int().min(0).optional(),
  recoveringUntil: time.optional(),
  /** A pair that bred cannot do it again before this time. */
  breedReadyAt: time.optional(),
});

const eggSchema = z.strictObject({
  id: z.string().min(1),
  species: speciesId,
  startedAt: time,
  hatchAt: time,
  gender,
  generation: z.number().int().min(1),
  traits: z.array(z.string()),
  hiddenTrait: z.string().optional(),
  mutated: z.boolean().optional(),
  lineage: lineageSchema.optional(),
});

const memorialSchema = z.strictObject({ id: z.string(), name: z.string(), breed: speciesId, diedAt: time });

export const aquariumStateSchema = z.strictObject({
  version: z.literal(AQUARIUM_STATE_VERSION),
  tank: z.strictObject({
    level: z.number().int().min(1).max(MAX_TANK_LEVEL),
    /** Water clarity 0-100: it clouds with time and with fish; changing the water restores it. */
    water: pct,
    /** Scales waiting to be collected. */
    scales: z.number().int().min(0),
  }),
  fish: z.array(fishSchema),
  eggs: z.array(eggSchema),
  /** When the rod was last cast (epoch ms); null = never. */
  lastCastAt: time.nullable(),
  /** No fish dies before this time: set after a catch-up that skipped a death (decision 004). */
  graceUntil: time.optional(),
  memorials: z.array(memorialSchema),
  /** Time the slice was simulated up to (epoch ms). */
  lastTickedAt: time,
});

export type AquariumState = z.infer<typeof aquariumStateSchema>;
export type Fish = Creature & { breedReadyAt?: number | undefined };
export type FishEgg = z.infer<typeof eggSchema>;

export const AQUARIUM_MIGRATIONS: Record<number, (slice: Raw) => Raw> = {};

/** The first state of the tank: the starter fish (grown a bit) and nothing else. */
export function initialAquarium(now: number, starter: Fish): AquariumState {
  return {
    version: AQUARIUM_STATE_VERSION,
    tank: { level: 1, water: 100, scales: 0 },
    fish: [starter],
    eggs: [],
    lastCastAt: null,
    memorials: [],
    lastTickedAt: now,
  };
}
