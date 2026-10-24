// content/adventure/engagement.json — what keeps an Adventure fresh (decision 039): the quick win over a weak group, the variants a
// normal group may wear on a trip, the Umbraflux Rift (floors, the rule of the day, the Nightmare bosses), the bonds between two
// Guardian lines in one team, the titles a fighter earns, what the creatures say, and the tip of each area the first time.
import { z } from 'zod';
import { assetId, nonNeg, posInt, range, text, unit } from '../fields';
import { CATEGORY_VALUES, ELEMENT_VALUES, STAT_VALUES, STATUS_VALUES, statusId } from './combat';
import { LINEAGE_ID_VALUES, lineageId } from './lineages';

const factor = z.number().finite().positive();
const share = z.number().finite().min(-1).max(1);

/** A status carried from the start of a battle; a Shield absorbs `amountPct` of max HP. */
const startStatus = z.strictObject({ status: statusId, turns: posInt, amountPct: unit.optional() });

/** Multipliers of some stats (1 = unchanged). */
const statMults = z.strictObject(Object.fromEntries(STAT_VALUES.map((k) => [k, factor.optional()])) as Record<(typeof STAT_VALUES)[number], z.ZodOptional<typeof factor>>);

const elementShares = z.partialRecord(z.enum(ELEMENT_VALUES), share);
const statusShares = z.partialRecord(z.enum(STATUS_VALUES), share);

/** Modifiers added to every fighter of a team (the same caps as gear apply in battle). */
const teamMods = z.strictObject({
  elementDamage: elementShares.optional(),
  elementResist: elementShares.optional(),
  statusChance: statusShares.optional(),
  statusResist: statusShares.optional(),
  categoryDamage: z.partialRecord(z.enum(CATEGORY_VALUES), share).optional(),
});

export const affixSchema = z.strictObject({
  id: z.string().regex(/^affix_[a-z0-9_]+$/),
  nameVi: text,
  descVi: text,
  /** Its badge over the group and in the battle. */
  art: assetId,
  /** Chance among the variants (by weight) once a group is drawn to wear one. */
  weight: posInt,
  stats: statMults,
  statuses: z.array(startStatus),
  /** Extra tags of every enemy of the group (`umbraflux` opens the Light reaction). */
  tags: z.array(z.string().regex(/^[a-z_]+$/)),
  /** Experience, coins and item chances of the group are multiplied by `reward` (`coins` and `exp` override it when given). */
  reward: factor,
  coins: factor.optional(),
  exp: factor.optional(),
  /** Chance of a gem draw [min, max] when the group is beaten. */
  gemChance: unit,
  gems: range,
  /** The group runs away after this many rounds if it is still standing (nothing is won). */
  escapeAfterRounds: posInt.nullable(),
});

export const riftRuleSchema = z.strictObject({
  id: z.string().regex(/^rift_[a-z0-9_]+$/),
  nameVi: text,
  descVi: text,
  ally: z.strictObject({ statuses: z.array(startStatus), mods: teamMods }),
  enemy: z.strictObject({ statuses: z.array(startStatus), mods: teamMods, stats: statMults }),
});

export const nightmareSchema = z.strictObject({
  /** The floor it guards. */
  floor: posInt,
  enemy: z.string().regex(/^enemy_[a-z0-9_]+$/),
  /** Its Nightmare name. */
  nameVi: text,
  /** Its company (normal enemies). */
  escort: z.array(z.string().regex(/^enemy_[a-z0-9_]+$/)),
  /** Gems for the first time it falls. */
  gems: range,
  /** Statuses it gains under 30% HP (its Nightmare phase). */
  rage: z.array(z.strictObject({ status: statusId, turns: posInt })),
});

export const synergySchema = z.strictObject({
  id: z.string().regex(/^synergy_[a-z0-9_]+$/),
  nameVi: text,
  descVi: text,
  /** Both lines must be in the team. */
  lineages: z.tuple([lineageId, lineageId]),
  mods: teamMods,
});

export const TITLE_KINDS = ['battles', 'bestHit', 'ultimates', 'boss', 'rift', 'nightmare'] as const;

export const titleSchema = z.strictObject({
  id: z.string().regex(/^title_[a-z0-9_]+$/),
  nameVi: text,
  descVi: text,
  /** What earns it: a count reached, or a zone boss / Nightmare boss beaten (`target` = the zone or enemy id). */
  kind: z.enum(TITLE_KINDS),
  value: nonNeg,
  target: z.string().nullable(),
  /** The highest rank earned is the one shown. */
  rank: posInt,
});

export const QUIP_TRIGGERS = ['winVi', 'bossVi', 'chestVi', 'lowVi', 'levelUpVi'] as const;
const quipLines = z.strictObject(Object.fromEntries(QUIP_TRIGGERS.map((k) => [k, z.array(text).min(1)])) as Record<(typeof QUIP_TRIGGERS)[number], z.ZodArray<typeof text>>);

export const tipSchema = z.strictObject({
  id: z.string().regex(/^tip_[a-z0-9_]+$/),
  /** The area whose first visit shows it. */
  mapId: z.string().regex(/^map_[a-z0-9_]+$/),
  titleVi: text,
  textVi: text,
});

export const engagementFileSchema = z
  .strictObject({
    quickWin: z.strictObject({
      /** A normal group is beaten at once only when the team's average level is this far above the top of its zone's range... */
      levelsAbove: z.number().int().min(0),
      /** ...and the team's strength (HP × best attack, as it stands) is at least this many times the group's. */
      powerRatio: factor,
      /** Share of the rewards of a quick win. */
      share: unit,
    }),
    /** Chance that a normal group wears a variant on a trip. */
    affixChance: unit,
    affixes: z.array(affixSchema).min(1),
    rift: z.strictObject({
      /** The zone whose boss opens the Rift. */
      requiresCleared: z.string().regex(/^zone_[a-z0-9_]+$/),
      backdrop: assetId,
      /** Enemy strength grows by this share a floor; enemies of easier zones are scaled up by their zone's factor. */
      perFloor: nonNeg,
      zoneScale: z.record(z.string().regex(/^zone_[a-z0-9_]+$/), factor),
      /** Enemies a floor [from floor 1, from `bigFrom`]. */
      groupSize: z.tuple([posInt, posInt]),
      bigFrom: posInt,
      /** Share of max HP and MP the team gets back between two floors. */
      restPct: unit,
      /** Coins and experience of floor 1, and how much more each next floor gives. */
      coins: posInt,
      exp: nonNeg,
      growth: nonNeg,
      /** Every `chestEvery` floors a chest of `table` (zones.json). */
      chestEvery: posInt,
      table: z.string(),
      /** Nightmare bosses are this much stronger than their floor. */
      nightmare: factor,
      nightmares: z.array(nightmareSchema),
      rules: z.array(riftRuleSchema).min(1),
    }),
    synergies: z.array(synergySchema),
    titles: z.array(titleSchema),
    quips: z.strictObject(Object.fromEntries(LINEAGE_ID_VALUES.map((l) => [l, quipLines])) as Record<(typeof LINEAGE_ID_VALUES)[number], typeof quipLines>),
    /** Chance that a normal win makes a fighter speak (boss, chest, level-up, low HP always do). */
    quipChance: unit,
    tips: z.array(tipSchema),
  })
  .superRefine((f, ctx) => {
    const unique = (what: string, ids: string[]) => {
      const seen = new Set<string>();
      for (const id of ids) {
        if (seen.has(id)) ctx.addIssue({ code: 'custom', message: `${what}: duplicate ${id}` });
        seen.add(id);
      }
    };
    unique('affixes', f.affixes.map((a) => a.id));
    unique('rift rules', f.rift.rules.map((r) => r.id));
    unique('synergies', f.synergies.map((s) => s.id));
    unique('titles', f.titles.map((t) => t.id));
    unique('tips', f.tips.map((t) => t.id));
    unique('tip areas', f.tips.map((t) => t.mapId));
    unique('nightmare floors', f.rift.nightmares.map((n) => String(n.floor)));
    for (const s of f.synergies) if (s.lineages[0] === s.lineages[1]) ctx.addIssue({ code: 'custom', message: `${s.id}: two different lines` });
    for (const t of f.titles) if ((t.kind === 'boss' || t.kind === 'nightmare') !== (t.target !== null)) ctx.addIssue({ code: 'custom', message: `${t.id}: target only for boss / nightmare` });
  });

export type EngagementFile = z.infer<typeof engagementFileSchema>;

