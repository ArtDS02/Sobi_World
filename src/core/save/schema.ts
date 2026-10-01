// zod schema for SaveGame (spec §5.1) plus the §5.5 invariants (orders cap per DECISIONS C1).
import { z } from 'zod';
import { BALANCE } from '../config/balance';
import {
  BREED_ID_VALUES,
  COSMETIC_SLOT_VALUES,
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
});

const pigSchema = z.object({
  id: z.string().min(1),
  slotIndex: z.number().int().min(0),
  breed: breedId,
  skinId: z.string().min(1),
  cosmetics: z.partialRecord(z.enum(COSMETIC_SLOT_VALUES), z.string()),
  name: z.string().min(1).max(16),
  gender,
  growthProgress: pct,
  hunger: pct,
  cleanliness: pct,
  isSick: z.boolean(),
  pregnancy: pregnancySchema.nullable(),
  lastTickedAt: time,
  createdAt: time,
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
  bornAt: time.nullable(),
});

const shapeSchema = z.object({
  schemaVersion: z.literal(SAVE.SCHEMA_VERSION),
  createdAt: time,
  updatedAt: time,
  player: z.object({
    gold: nonNeg,
    xp: nonNeg,
    unlockedSlots: z.number().int().min(1).max(BALANCE.MAX_SLOTS),
    ownedSkins: z.array(z.string()),
  }),
  pigs: z.array(pigSchema),
  trough: z.object({ food: nonNeg, capacity: nonNeg, lastResolvedAt: time }),
  inventory: z.record(z.enum(ITEM_ID_VALUES), nonNeg),
  orders: z.array(orderSchema),
  collection: z.object({
    discoveredBreeds: z.array(breedId),
    discoveredSkins: z.array(z.string()),
  }),
  transactions: z.array(transactionSchema),
  breedingRecords: z.array(breedingRecordSchema),
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
  const pregnant = s.pigs.filter((p) => p.pregnancy !== null).length;
  if (s.pigs.length + pregnant > s.player.unlockedSlots) issue('pigs + pregnancies exceed slots');
  const owned = new Set(s.player.ownedSkins);
  if (s.pigs.some((p) => !owned.has(p.skinId))) issue('pig skinId must be owned');
  if (s.orders.length > BALANCE.ORDER_MAX_ACTIVE) issue('too many orders');
});

export type SaveGameParsed = z.infer<typeof saveGameSchema>;
