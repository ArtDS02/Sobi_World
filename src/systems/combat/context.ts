// The tables a battle reads (spec §9–§11, decision 037): the data of a status, of a reaction, the element chart, the numbers, and the whole
// context the engine is handed. Content builds them (src/areas/adventure/logic/config/content.ts); the engine never hard-codes them.
import type { BattleItemDef, Category, Element, Interaction, SkillDef, StatKey, StatusId } from './types';

/** The data of a status (§10.1). */
export interface StatusDef {
  id: StatusId;
  kind: 'dot' | 'control' | 'stat' | 'recovery' | 'special';
  /** true = good for its bearer (a buff: dispellable); false = bad (cleansable unless `cleansable: false`). */
  positive: boolean;
  sourceElement: Element | null;
  turns: number;
  maxStacks: number;
  cleansable: boolean;
  /** Turns of immunity once it ends (control statuses). */
  immunityAfter: number;
  /** Share of the bearer's max HP lost (dot) or regained (regen) at the start of its turn, per stack. */
  tickPct: number;
  /** A stat it changes: multiply (atk ×1.3) or add points (acc +20). */
  stat?: { key: StatKey; mult?: number | undefined; add?: number | undefined } | undefined;
  /** Loses its turn (stun, freeze). */
  skipTurn: boolean;
  /** Cannot use unique / class skills (disable). */
  noSkills: boolean;
  /** Share of max HP an Auto-Revive brings back. */
  revivePct: number;
}

/** A reaction (§11): incoming element / category meets a status or tag on the target. */
export interface ReactionDef {
  id: string;
  priority: number;
  elements: readonly Element[];
  categories: readonly Category[];
  requiresStatus: StatusId | null;
  requiresSourceElement: Element | null;
  requiresTag: string | null;
  damageMult: number;
  /** Extra Void damage as a share of the hit. */
  voidBonus: number;
  consume: boolean;
  applyStatus: { status: StatusId; turns: number; chance: number; allFoes: boolean } | null;
  dispel: number;
}

export interface ElementChart {
  multipliers: Record<Interaction, number>;
  /** attacker → defender → interaction; absent = NEUTRAL. */
  chart: Partial<Record<Element, Partial<Record<Element, Interaction>>>>;
  /** Product of two elements stays within these bounds. */
  dualMin: number;
  dualMax: number;
}

export interface CombatRules {
  critMultiplier: number;
  /** ± share of random spread on damage. */
  variance: number;
  /** Damage = attack × power × K / (K + defence). */
  defenseK: number;
  /** A battle not over after this many rounds is lost. */
  maxRounds: number;
  /** MP regained at the start of an own turn / by a basic attack / by Defend, shares of max MP. */
  mpTurnPct: number;
  mpBasicPct: number;
  mpGuardPct: number;
  /** Damage kept while guarding (0.5 = halved). */
  guardTaken: number;
  /** Rage = rageMax × share of max HP lost × rageK. */
  rageK: number;
  /** Hit chance bounds. */
  hitMin: number;
  /** Status chance cap (a skill chance ≥ 1 is sure and skips it). */
  statusChanceCap: number;
  /** Caps of the gear modifiers (§13). */
  elementDamageCap: number;
  statusChanceBonusCap: number;
  resistCap: number;
  basicPower: number;
  basicAccuracy: number;
}

export interface CombatContext {
  skills: Readonly<Record<string, SkillDef>>;
  items: Readonly<Record<string, BattleItemDef>>;
  statuses: Readonly<Record<StatusId, StatusDef>>;
  reactions: readonly ReactionDef[];
  elements: ElementChart;
  rules: CombatRules;
}

