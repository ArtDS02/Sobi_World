// Turn-based combat (spec V2 §8.5, GAME_BALANCE §9): the shapes of a battle. Everything here is plain data so a battle can be
// saved between two actions and replayed from its seed. The numbers (energy, multipliers) come in as `CombatRules`.

/** Fire > Wind > Earth > Water > Fire (GAME_BALANCE §9). */
export const ELEMENTS = ['FIRE', 'WIND', 'EARTH', 'WATER'] as const;
export type Element = (typeof ELEMENTS)[number];

export const STATUS_IDS = ['atkUp', 'defUp', 'haste', 'slow', 'burn', 'stun', 'shield'] as const;
export type StatusId = (typeof STATUS_IDS)[number];

export type Side = 'ally' | 'enemy';

/** Who a skill or item reaches, from the actor's point of view. */
export type Target = 'enemy' | 'allEnemies' | 'ally' | 'allAllies' | 'self';

export interface Stats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
  /** Chance of a critical hit, percent. */
  crit: number;
}

export interface SkillStatus {
  status: StatusId;
  /** Turns of the target it lasts (counted at the start of each of its turns). */
  turns: number;
  /** 0..1, default 1. */
  chance?: number | undefined;
}

export interface SkillDef {
  id: string;
  element: Element;
  target: Target;
  /** Damage as a multiple of the attacker's attack; 0 = deals no damage. */
  power: number;
  /** Heal as a share of the target's max HP; 0 = heals nothing. */
  healPct: number;
  /** Battle energy it costs. */
  cost: number;
  /** Own turns before it can be used again. */
  cooldown: number;
  statuses: readonly SkillStatus[];
  /** Added to the attacker's crit chance for this skill, percent. */
  critBonus?: number | undefined;
}

export interface BattleItemDef {
  itemId: string;
  target: 'ally' | 'allAllies';
  /** Heal as a share of max HP (0 = none). */
  healPct: number;
  statuses: readonly SkillStatus[];
}

export interface Status {
  id: StatusId;
  turns: number;
  /** Shield: HP it still absorbs. */
  amount: number;
}

export interface Combatant {
  id: string;
  side: Side;
  name: string;
  element: Element;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  crit: number;
  energy: number;
  /** Skill ids it may use (already filtered by level). */
  skills: string[];
  /** Own turns left before each skill can be used again. */
  cooldowns: Record<string, number>;
  statuses: Status[];
}

export interface CombatantInit {
  id: string;
  side: Side;
  name: string;
  element: Element;
  stats: Stats;
  skills: readonly string[];
  /** HP it starts the battle with (a fighter keeps its HP across the nodes of a run); default max. */
  hp?: number | undefined;
}

export interface CombatRules {
  /** Damage multiplier of an element that beats the target's (1.5), and of one the target's beats (0.75). */
  counter: number;
  resisted: number;
  critMultiplier: number;
  /** ± share of random spread on damage. */
  variance: number;
  /** Damage = attack × power × K / (K + defence). */
  defenseK: number;
  energyStart: number;
  energyMax: number;
  energyPerTurn: number;
  /** Energy a basic attack gives back. */
  basicEnergyGain: number;
  burnPct: number;
  slowFactor: number;
  hasteFactor: number;
  atkUpFactor: number;
  defUpFactor: number;
  /** A shield absorbs this share of the target's max HP. */
  shieldPct: number;
  /** A battle not over after this many rounds is lost. */
  maxRounds: number;
}

export type BattleAction =
  | { kind: 'attack'; target: string }
  | { kind: 'skill'; skillId: string; target?: string | undefined }
  | { kind: 'item'; itemId: string; target?: string | undefined };

export type BattleEvent =
  | { type: 'round'; round: number }
  | { type: 'turn'; actor: string }
  | { type: 'damage'; actor: string; target: string; amount: number; crit: boolean; mult: number; skillId: string | null; absorbed: number }
  | { type: 'heal'; actor: string; target: string; amount: number; skillId: string | null }
  | { type: 'status'; actor: string; target: string; status: StatusId; skillId: string | null }
  | { type: 'burn'; target: string; amount: number }
  | { type: 'skip'; actor: string }
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
