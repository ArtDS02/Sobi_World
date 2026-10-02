// zod schema for SaveGame (spec §5.1) plus the §5.5 invariants (orders cap per DECISIONS C1).
import { z } from 'zod';
import { BALANCE } from '../config/balance';
import { GIFTS } from '../config/gifts';
import {
  BREED_ID_VALUES,
  DECOR_ID_VALUES,
  GENDER_VALUES,
  ITEM_ID_VALUES,
  TRANSACTION_TYPE_VALUES,
} from '../config/ids';
import { SAVE } from '../config/save';

const breedId = z.enum(BREED_ID_VALUES);
const gender = z.enum(GENDER_VALUES);
const time = z.number().finite();
const nonNeg = z.number().finite().min(0);
const pct = z.number().finite().min(0).max(100);

const pregnancySchema = z.object({
  startedAt: time,
  endsAt: time,
  fatherId: z.string(),
  childBreed: breedId,
  childGender: gender,
  childGeneration: z.number().int().min(1).optional(),
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
  pregnancy: pregnancySchema.nullable(),
  lastTickedAt: time,
  createdAt: time,
  generation: z.number().int().min(1).optional(),
  parents: parentsSchema.optional(),
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
  bornAt: time.nullable(),
});

const giftSchema = z.object({
  id: z.string().min(1),
  spawnedAt: time,
  seed: z.number().int().min(0),
  gold: nonNeg,
  xp: nonNeg,
});

const shapeSchema = z.object({
  schemaVersion: z.literal(SAVE.SCHEMA_VERSION),
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
  trough: z.object({ food: nonNeg, capacity: nonNeg, lastResolvedAt: time }),
  inventory: z.record(z.enum(ITEM_ID_VALUES), nonNeg),
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
  settings: z.object({
    musicOn: z.boolean(),
    sfxOn: z.boolean(),
    reduceMotion: z.boolean(),
    tutorialDone: z.boolean(),
    lastExportAt: time.nullable(),
  }),
});

/** Cross-field invariants of §5.5 (field ranges are enforced by the shape above). */
export const saveGameSchema = shapeSchema.superRefine((s, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  const slots = s.pigs.map((p) => p.slotIndex);
  if (new Set(slots).size !== slots.length) issue('slotIndex must be unique');
  if (slots.some((i) => i >= s.player.unlockedSlots)) issue('slotIndex must be < unlockedSlots');
  if (s.trough.food > s.trough.capacity) issue('trough.food must be <= trough.capacity');
  // BR-1: a pregnancy no longer holds a pen slot (the child waits in the nursery).
  if (s.pigs.length > s.player.unlockedSlots) issue('pigs exceed slots');
  const ids = [...s.pigs, ...s.nursery].map((p) => p.id);
  if (new Set(ids).size !== ids.length) issue('pig ids must be unique (farm + nursery)');
  if (s.orders.length > BALANCE.ORDER_MAX_ACTIVE) issue('too many orders');
  if (s.gifts.boxes.length > GIFTS.MAX_ON_FARM) issue('too many gift boxes');
});

export type SaveGameParsed = z.infer<typeof saveGameSchema>;
