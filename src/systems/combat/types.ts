// Turn-based combat V2 (decision 037, spec `update_spec_sobi_adventure_gameplay_v1.md` §8–§15): the shapes of a battle. Everything
// here is plain data so a battle can be saved between two actions and replayed from its seed. The tables (element chart, statuses,
// reactions, numbers) come in as the `CombatContext`, never from here.

/** The nine elements (§9.1). Poison, Burn, Wet, Freeze are statuses, never elements (R4, R8). */
export const ELEMENTS = ['METAL', 'NATURE', 'WATER', 'FIRE', 'EARTH', 'LIGHTNING', 'DARK', 'LIGHT', 'VOID'] as const;
export type Element = (typeof ELEMENTS)[number];

/** How an element meets another (§9.2). */
export const INTERACTIONS = ['STRONG', 'NEUTRAL', 'WEAK', 'RESIST', 'IMMUNE'] as const;
export type Interaction = (typeof INTERACTIONS)[number];

/** Every status the framework knows (§10.2). Their numbers and rules are data (`StatusDef`). */
export const STATUS_IDS = [
  'poison', 'burn', 'wet', 'freeze', 'stun', 'disable', 'doom',
  'atkUp', 'atkDown', 'defUp', 'defDown', 'matkUp', 'matkDown', 'mdefUp', 'mdefDown',
  'accUp', 'accDown', 'evaUp', 'evaDown', 'spdUp', 'spdDown',
  'shield', 'taunt', 'regen', 'autoRevive',
] as const;
export type StatusId = (typeof STATUS_IDS)[number];

export const STAT_KEYS = ['hp', 'mp', 'atk', 'def', 'matk', 'mdef', 'spd', 'acc', 'eva', 'crit'] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

export type Side = 'ally' | 'enemy';

/** Who a skill reaches, from the actor's point of view. `all` = every combatant of both sides (Màn Hư Vô). */
export const TARGETS = ['enemy', 'allEnemies', 'randomEnemies', 'ally', 'allAllies', 'self', 'all'] as const;
export type Target = (typeof TARGETS)[number];

export const SKILL_TYPES = ['unique', 'class', 'ultimate', 'enemy'] as const;
export type SkillType = (typeof SKILL_TYPES)[number];

/** `hybrid` hits with the better of ATK / MATK (a Guardian line's own skills fit every class). */
export const CATEGORIES = ['physical', 'magical', 'hybrid', 'support'] as const;
export type Category = (typeof CATEGORIES)[number];

/** A skill's element: one of nine, `SELF` (the caster's own element), or null when it deals no damage. */
export type SkillElement = Element | 'SELF' | null;

/** Who an effect reaches: the skill's targets (default), the caster, every ally or every foe still standing. */
export type EffectTo = 'self' | 'allies' | 'foes';

/** What a skill does besides its damage, applied to each target (or to `to`). */
export type Effect =
  | { kind: 'heal'; pct: number; to?: EffectTo }
  | { kind: 'shield'; pct: number; to?: EffectTo }
  | { kind: 'status'; status: StatusId; turns?: number; chance?: number; to?: EffectTo }
  | { kind: 'cleanse'; count?: number; doom?: boolean; to?: EffectTo }
  | { kind: 'dispel'; count?: number; to?: EffectTo }
  | { kind: 'clearAll' }
  | { kind: 'mp'; amount: number; to?: EffectTo }
  | { kind: 'rage'; amount: number; to?: EffectTo }
  | { kind: 'revive'; pct: number };

/** What an upgrade level adds (§7.3), per level above 1. */
export interface PerLevel {
  /** Added to the power multiplier (0.08 = +8% power a level). */
  power?: number;
  /** Added to every heal / shield share. */
  heal?: number;
  /** Added to every status chance. */
  chance?: number;
  /** MP cost change a level (negative = cheaper). */
  mpCost?: number;
}

export interface SkillDef {
  id: string;
  type: SkillType;
  category: Category;
  element: SkillElement;
  target: Target;
  /** Damage as a multiple of the attacker's attack (ATK or MATK); 0 = no damage. */
  power: number;
  /** Hits per target (randomEnemies: hits drawn among the foes). */
  hits: number;
  /** Base hit chance, percent (support skills and skills on allies never miss). */
  accuracy: number;
  mpCost: number;
  /** Own turns before it can be used again. */
  cooldown: number;
  critBonus: number;
  effects: readonly Effect[];
  maxLevel: number;
  perLevel: PerLevel;
}

export interface BattleItemDef {
  itemId: string;
  target: 'ally' | 'allAllies';
  effects: readonly Effect[];
}

/** A status on a combatant. */
export interface Status {
  id: StatusId;
  turns: number;
  /** Shield: HP it still absorbs. */
  amount: number;
  stacks: number;
  /** The element of what caused it (Nhật Thực looks for a Dark source). */
  source: Element | null;
}

/** A modifier from gear / rations / shrines (§13): extra share of damage, resistance, status chance. Capped by the rules. */
export interface Mods {
  elementDamage: Partial<Record<Element, number>>;
  elementResist: Partial<Record<Element, number>>;
  statusChance: Partial<Record<StatusId, number>>;
  statusResist: Partial<Record<StatusId, number>>;
  statusImmune: StatusId[];
  /** Extra share of the damage of skills of a category. */
  categoryDamage: Partial<Record<Category, number>>;
  /** Extra share of all damage dealt (shrine, ration). */
  damage: number;
  /** Interactions forced for an attacking element (a boss immune to one element). */
  elementOverrides: Partial<Record<Element, Interaction>>;
}

/** A boss phase (§14): when its HP falls under `hpBelow`, it gains skills / statuses / a new element. */
export interface Phase {
  hpBelow: number;
  addSkills: string[];
  statuses: { status: StatusId; turns: number }[];
  element?: Element | undefined;
}

export interface SkillSlot {
  id: string;
  level: number;
}

export interface Combatant {
  id: string;
  side: Side;
  name: string;
  element: Element;
  element2: Element | null;
  /** Tags such as `umbraflux`, `boss`. */
  tags: string[];
  stats: Stats;
  hp: number;
  mp: number;
  rage: number;
  rageMax: number;
  skills: SkillSlot[];
  ultimate: string | null;
  ultimateUsed: boolean;
  cooldowns: Record<string, number>;
  statuses: Status[];
  /** Turns of immunity left after a control status ended (§10.2). */
  immune: Partial<Record<StatusId, number>>;
  guarding: boolean;
  mods: Mods;
  phases: Phase[];
  phase: number;
  /** What it will do this round (enemies, §15.4). */
  intent: BattleAction | null;
}

export interface CombatantInit {
  id: string;
  side: Side;
  name: string;
  element: Element;
  element2?: Element | null | undefined;
  tags?: readonly string[] | undefined;
  stats: Stats;
  skills: readonly SkillSlot[];
  ultimate?: string | null | undefined;
  /** HP / MP it starts with (a fighter keeps them across the battles of a trip); default max. */
  hp?: number | undefined;
  mp?: number | undefined;
  rage?: number | undefined;
  /** 0 = it has no Ultimate (enemies). */
  rageMax?: number | undefined;
  mods?: Partial<Mods> | undefined;
  phases?: readonly Phase[] | undefined;
  /** Statuses it already carries when the battle starts (an enemy variant, a Rift rule); a Shield absorbs `amountPct` of its max HP. */
  statuses?: readonly { status: StatusId; turns: number; amountPct?: number | undefined }[] | undefined;
}

export type { CombatContext, CombatRules, ElementChart, ReactionDef, StatusDef } from './context';

export type BattleAction =
  | { kind: 'attack'; target: string }
  | { kind: 'skill'; skillId: string; target?: string | undefined }
  | { kind: 'ultimate'; target?: string | undefined }
  | { kind: 'item'; itemId: string; target?: string | undefined }
  | { kind: 'guard' };

export type SkipReason = 'stun' | 'freeze';

export type BattleEvent =
  | { type: 'round'; round: number }
  | { type: 'turn'; actor: string }
  | { type: 'use'; actor: string; skillId: string | null; ultimate: boolean }
  | { type: 'damage'; actor: string; target: string; amount: number; crit: boolean; mult: number; skillId: string | null; absorbed: number; element: Element | null }
  | { type: 'miss'; actor: string; target: string; skillId: string | null }
  | { type: 'heal'; actor: string; target: string; amount: number; skillId: string | null }
  | { type: 'status'; actor: string; target: string; status: StatusId; skillId: string | null }
  | { type: 'resist'; target: string; status: StatusId }
  | { type: 'cleanse'; target: string; statuses: StatusId[] }
  | { type: 'tick'; target: string; status: StatusId; amount: number }
  | { type: 'reaction'; target: string; reaction: string }
  | { type: 'guard'; actor: string }
  | { type: 'skip'; actor: string; reason: SkipReason }
  | { type: 'revive'; target: string; amount: number }
  | { type: 'phase'; target: string; phase: number }
  | { type: 'ready'; actor: string }
  | { type: 'defeat'; target: string }
  | { type: 'end'; outcome: 'win' | 'lose' };

export interface BattleState {
  /** Draws are derived from (seed, counter): a saved battle replays to the same result. */
  seed: number;
  /** Actions taken so far. */
  counter: number;
  round: number;
  /** Ids still to act this round; the first one is the current actor. */
  order: string[];
  combatants: Combatant[];
  outcome: 'win' | 'lose' | null;
}
