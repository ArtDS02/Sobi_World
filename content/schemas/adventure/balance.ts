// content/adventure/balance.json — the Adventure's numbers (decision 037, spec §1–§17): the battle rules, stats and levels, Rage, SP and
// the skill trees, the team, the energy of a trip, exhaustion, the exploration map, what the world gets, the starter kit, the rations
// and the items usable in a battle.
import { z } from 'zod';
import { itemId, nonNeg, posInt, text, unit } from '../fields';
import { RARITY_VALUES } from '../vocab';
import { effectSchema, element, partialStatsSchema, skillId } from './combat';
import { FOE_CLASSES } from './maps';

const factor = z.number().finite().positive();

/** One class of enemy group (decision 045). */
const foeClassSchema = z.strictObject({
  /** Its name, added after the enemy's own for the classes that change it (mutant, subboss, special). */
  nameVi: text,
  /** Height of the picture on the map, in tiles of the area (before the camera's zoom). */
  size: factor,
  /** Its corruption when the group does not say. */
  corruption: z.number().int().min(1).max(5),
  /** Stats multiplied for every enemy of the group (absent = ×1). */
  stats: partialStatsSchema,
  /** Experience and coins multiplied, and drop chances multiplied. */
  reward: factor,
  drops: factor,
});

export const adventureBalanceFileSchema = z.strictObject({
  combat: z.strictObject({
    critMultiplier: factor,
    variance: unit,
    defenseK: factor,
    maxRounds: posInt,
    /** MP regained at the start of an own turn / by a basic attack / by Defend, shares of max MP. */
    mpTurnPct: unit,
    mpBasicPct: unit,
    mpGuardPct: unit,
    /** Share of the damage taken while defending. */
    guardTaken: unit,
    /** Rage = rageMax × share of max HP lost × rageK. */
    rageK: factor,
    hitMin: unit,
    statusChanceCap: unit,
    elementDamageCap: unit,
    statusChanceBonusCap: unit,
    resistCap: unit,
    basicPower: factor,
    basicAccuracy: posInt,
  }),
  stats: z.strictObject({
    levelGrowth: nonNeg,
    bondPerHeart: nonNeg,
    /** Small on purpose: rarity is never a sure win (R1). */
    rarity: z.strictObject(Object.fromEntries(RARITY_VALUES.map((r) => [r, factor])) as Record<(typeof RARITY_VALUES)[number], typeof factor>),
  }),
  levels: z.strictObject({
    maxLevel: posInt,
    expBase: factor,
    expExponent: factor,
    /** The level at which each of a line's four Unique skills opens. */
    uniqueUnlockLevels: z.array(posInt).length(4),
  }),
  rage: z.strictObject({ max: posInt }),
  sp: z.strictObject({
    /** SP for each level gained. */
    perLevel: z.number().int().min(0),
    /** SP for every fighter present the first time it beats a zone boss. */
    bossFirstClear: z.number().int().min(0),
    /** SP a Skill Scroll gives. */
    scroll: z.number().int().min(0),
  }),
  tree: z.strictObject({ loadoutSlots: posInt }),
  temple: z.strictObject({
    /** Coins per level to change class (all SP back). */
    classChangePerLevel: z.number().int().min(0),
    /** Coins per level to reset the tree after the first, free reset. */
    respecPerLevel: z.number().int().min(0),
  }),
  team: z.strictObject({ max: posInt, formations: posInt }),
  run: z.strictObject({
    /** Adventure energy a fighter spends to enter a zone, its cap, what it regains an hour. */
    energyCost: posInt,
    energyMax: posInt,
    energyPerHour: nonNeg,
    /** A lost trip leaves its fighters exhausted for this many real hours. */
    exhaustHours: nonNeg,
  }),
  /** Quick trip through a cleared zone: share of the normal enemies' experience and loot. */
  sweep: z.strictObject({ share: unit }),
  explore: z.strictObject({
    /** Feet box of the walker against the tiles, design px. */
    feetHalfWidth: posInt,
    feetHalfHeight: posInt,
    speed: posInt,
    /** Distance (px) at which the walker touches an enemy group or reaches a thing to use. */
    touch: posInt,
    reach: posInt,
    /** Tiles at which a chest sparkles / a group shows its elements. */
    chestHint: posInt,
    foeInfo: posInt,
    /** After fleeing, nothing starts a battle for this long. */
    graceMs: z.number().int().min(0),
    /** A spring heals this share of max HP and MP, once per area per trip. */
    springPct: unit,
  }),
  /** The six classes of enemy group and the five levels of corruption (decision 045). */
  foes: z.strictObject({
    classes: z.strictObject(Object.fromEntries(FOE_CLASSES.map((k) => [k, foeClassSchema])) as Record<(typeof FOE_CLASSES)[number], typeof foeClassSchema>),
    /**
     * Levels 1–5, in order. Stats, rewards, `resist` (extra share of every element but Light resisted) and the dark `skill`s are
     * measured against the class's own level, so a class at its usual corruption stays as its enemies were made; `lightWeak` (extra
     * damage share taken from Light) counts in full. From `umbrafluxFrom` on the enemies carry the `umbraflux` tag (Light's Purify).
     */
    corruption: z
      .array(z.strictObject({ stats: factor, reward: factor, lightWeak: unit, resist: unit, skill: skillId.nullable() }))
      .length(5),
    umbrafluxFrom: z.number().int().min(1).max(5),
    /** The second element a mutant or a special grows, by its first element. */
    secondElement: z.partialRecord(element, element),
    /** A sleeping group is touched only this close (share of the usual touch distance): the party may tiptoe past. */
    sleepTouch: unit,
  }),
  /** Experience of the Area (it counts for the one Sobi World Level). */
  xp: z.strictObject({ battleWin: nonNeg, zoneClear: nonNeg }),
  starter: z.strictObject({ breed: z.string().regex(/^PIG_[A-Z0-9_]+$/), items: z.partialRecord(itemId, posInt) }),
  /** Rations a party carries into a trip (GĐ11): shares of stats and flat points for every fighter. */
  prep: z.array(z.strictObject({ itemId, shares: partialStatsSchema, flat: partialStatsSchema })),
  battleItems: z.array(z.strictObject({ itemId, target: z.enum(['ally', 'allAllies']), effects: z.array(effectSchema).min(1) })),
});
