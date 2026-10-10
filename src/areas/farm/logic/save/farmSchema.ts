// zod schemas of the farm (spec §5.1) plus the §5.5 invariants (orders cap per DECISIONS C1):
// farmGameSchema = a whole Sobi Farm v7 save (legacy import, admin checks of the farm view),
// farmAreaSchema = the farm's slice of the world save v8 (`areas.sobi_farm`).
import { z } from 'zod';
import { PURPOSE_VALUES } from '../../../../../content/schemas/vocab';
import { BOND } from '../../../../core/config/bond';
import type { Ancestor } from '../../../../systems/breeding/types';
import { CURRENCY_VALUES } from '../../../../core/save/world';
import { BALANCE } from '../config/balance';
import { GIFTS } from '../config/gifts';
import { GENDER_VALUES, ITEM_ID_VALUES } from '../../../../core/config/ids';
import { BREED_ID_VALUES, DECOR_ID_VALUES, TRANSACTION_TYPE_VALUES } from '../config/ids';
import { FARM_DOC_VERSION } from './legacyConfig';

const breedId = z.enum(BREED_ID_VALUES);
const gender = z.enum(GENDER_VALUES);
const time = z.number().finite();
const nonNeg = z.number().finite().min(0);
const pct = z.number().finite().min(0).max(100);

const withEveryItem = (v: unknown): unknown =>
  v && typeof v === 'object' ? { ...Object.fromEntries(ITEM_ID_VALUES.map((id) => [id, 0])), ...v } : v;

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

const pregnancySchema = z.object({
  startedAt: time,
  endsAt: time,
  fatherId: z.string(),
  childBreed: breedId,
  childGender: gender,
  childGeneration: z.number().int().min(1).optional(),
  childTraits: z.array(z.string()).optional(),
  childHidden: z.string().optional(),
  childMutated: z.boolean().optional(),
  childLineage: lineageSchema.optional(),
});

const parentsSchema = z.object({
  motherId: z.string(),
  fatherId: z.string(),
  motherBreed: breedId,
  fatherBreed: breedId,
});

const nurseryPigSchema = z.object({
  id: z.string().min(1),
  breed: breedId,
  name: z.string().min(1).max(16),
  gender,
  generation: z.number().int().min(1),
  bornAt: time,
  parents: parentsSchema,
  traits: z.array(z.string()).optional(),
  hiddenTrait: z.string().optional(),
  lineage: lineageSchema.optional(),
});

const pigSchema = z.object({
  id: z.string().min(1),
  slotIndex: z.number().int().min(0),
  breed: breedId,
  name: z.string().min(1).max(16),
  gender,
  growthProgress: pct,
  hunger: pct,
  cleanliness: pct,
  isSick: z.boolean(),
  energy: pct.optional(),
  poopProgress: nonNeg.optional(),
  illRisk: nonNeg.optional(),
  moodAvg: pct.optional(),
  moodSec: nonNeg.optional(),
  pregnancy: pregnancySchema.nullable(),
  lastTickedAt: time,
  createdAt: time,
  generation: z.number().int().min(1).optional(),
  parents: parentsSchema.optional(),
  traits: z.array(z.string()).optional(),
  hiddenTrait: z.string().optional(),
  lineage: lineageSchema.optional(),
  lastFedAt: time.optional(),
  lastCleanedAt: time.optional(),
  lastSickAt: time.optional(),
  sickDay: z.number().int().optional(),
  sickEpisodes: z.number().int().min(0).optional(),
  recoveringUntil: time.optional(),
  purpose: z.enum(PURPOSE_VALUES).optional(),
  bond: z.number().finite().min(0).max(BOND.maxBond).optional(),
  petDay: z.number().int().optional(),
  petCount: z.number().int().min(0).optional(),
  moodBoost: z.object({ amount: nonNeg, until: time }).optional(),
});

const orderSchema = z.object({
  id: z.string(),
  createdAt: time,
  expiresAt: time,
  wantBreed: breedId,
  wantGender: gender.nullable(),
  minHappiness: z.number(),
  rewardGold: nonNeg,
  rewardXp: nonNeg,
  fulfilledAt: time.nullable(),
});

const transactionSchema = z.object({
  id: z.string(),
  currency: z.enum(CURRENCY_VALUES).optional(), // the farm view of a world save (v8)
  at: time,
  type: z.enum(TRANSACTION_TYPE_VALUES),
  amount: z.number().finite(),
  refId: z.string().optional(),
  note: z.string().optional(),
});

const breedingRecordSchema = z.object({
  id: z.string(),
  at: time,
  motherId: z.string(),
  fatherId: z.string(),
  motherBreed: breedId,
  fatherBreed: breedId,
  childBreed: breedId,
  childGender: gender,
  childGeneration: z.number().int().min(1).optional(),
  mutated: z.boolean().optional(),
  bornAt: time.nullable(),
});

const giftSchema = z.object({
  id: z.string().min(1),
  spawnedAt: time,
  seed: z.number().int().min(0),
  gold: nonNeg,
  xp: nonNeg,
});

const decorPlanSchema = z.partialRecord(z.enum(DECOR_ID_VALUES), z.object({ spot: z.number().int().min(0), stored: z.boolean() }));

const shapeSchema = z.object({
  schemaVersion: z.literal(FARM_DOC_VERSION),
  createdAt: time,
  updatedAt: time,
  player: z.object({
    gold: nonNeg,
    xp: nonNeg,
    // No upper bound: MAX_SLOTS is tunable data, lowering it must never make a save unreadable.
    unlockedSlots: z.number().int().min(1),
  }),
  pigs: z.array(pigSchema),
  nursery: z.array(nurseryPigSchema),
  trough: z.object({ food: nonNeg, capacity: nonNeg, level: z.number().int().min(1).optional(), lastResolvedAt: time }),
  // Items added after a save was written are missing from it: they count as none.
  inventory: z.preprocess(withEveryItem, z.record(z.enum(ITEM_ID_VALUES), nonNeg)),
  orders: z.array(orderSchema),
  collection: z.object({
    discoveredBreeds: z.array(breedId),
  }),
  transactions: z.array(transactionSchema),
  breedingRecords: z.array(breedingRecordSchema),
  gifts: z.object({ nextAt: time.nullable(), boxes: z.array(giftSchema) }),
  // String keys, not enums: a stat or achievement dropped from config never breaks a save.
  progress: z.object({
    stats: z.record(z.string(), nonNeg),
    claimed: z.record(z.string(), time),
    daily: z.object({ lastDay: z.number().int().nullable(), streak: z.number().int().min(0) }),
  }),
  decor: z.array(z.enum(DECOR_ID_VALUES)),
  decorPlan: decorPlanSchema.optional(),
  settings: z.object({
    musicOn: z.boolean(),
    sfxOn: z.boolean(),
    reduceMotion: z.boolean(),
    tutorialDone: z.boolean(),
    lastExportAt: time.nullable(),
  }),
});

type FarmFields = Pick<FarmArea, 'unlockedSlots' | 'pigs' | 'nursery' | 'trough' | 'orders' | 'gifts'>;

/** Cross-field invariants of §5.5 (field ranges are enforced by the shapes). */
function farmInvariants(s: FarmFields, ctx: z.core.$RefinementCtx): void {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  const slots = s.pigs.map((p) => p.slotIndex);
  if (new Set(slots).size !== slots.length) issue('slotIndex must be unique');
  if (slots.some((i) => i >= s.unlockedSlots)) issue('slotIndex must be < unlockedSlots');
  if (s.trough.food > s.trough.capacity) issue('trough.food must be <= trough.capacity');
  // BR-1: a pregnancy no longer holds a pen slot (the child waits in the nursery).
  if (s.pigs.length > s.unlockedSlots) issue('pigs exceed slots');
  const ids = [...s.pigs, ...s.nursery].map((p) => p.id);
  if (new Set(ids).size !== ids.length) issue('pig ids must be unique (farm + nursery)');
  if (s.orders.length > BALANCE.ORDER_MAX_ACTIVE) issue('too many orders');
  if (s.gifts.boxes.length > GIFTS.MAX_ON_FARM) issue('too many gift boxes');
}

export const farmGameSchema = shapeSchema.superRefine((s, ctx) =>
  farmInvariants({ ...s, unlockedSlots: s.player.unlockedSlots }, ctx),
);

export type FarmGameParsed = z.infer<typeof farmGameSchema>;

/** The farm's slice of the world save (v8): its own state; money, items, xp… are world fields. */
const farmAreaShape = z.object({
  unlockedSlots: z.number().int().min(1),
  pigs: z.array(pigSchema),
  nursery: z.array(nurseryPigSchema),
  trough: z.object({ food: nonNeg, capacity: nonNeg, level: z.number().int().min(1).optional(), lastResolvedAt: time }),
  orders: z.array(orderSchema),
  gifts: z.object({ nextAt: time.nullable(), boxes: z.array(giftSchema) }),
  decor: z.array(z.enum(DECOR_ID_VALUES)),
  decorPlan: decorPlanSchema.optional(),
  breedingRecords: z.array(breedingRecordSchema),
  /** Piles of manure lying in the pen (absent = none; GĐ2). */
  manure: z.number().int().min(0).optional(),
  /** No pig dies before this time (a catch-up skipped a death, decision 004). */
  graceUntil: time.optional(),
  memorials: z.array(z.object({ id: z.string(), name: z.string(), breed: breedId, diedAt: time })).optional(),
  /** Pity of the breeding station (GĐ7); absent = 0. */
  breedingPity: z.number().finite().min(0).optional(),
});

export const farmAreaSchema = farmAreaShape.superRefine(farmInvariants);

export type FarmArea = z.infer<typeof farmAreaShape>;
