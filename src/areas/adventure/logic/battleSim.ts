// Simulation of whole runs on the game's own rules (the Admin "Mô phỏng trận", GĐ10 step 9): a party of given styles at a
// level and a tier of gear plays a zone N times with the AI choosing for it. Nothing is saved. Pure, seeded: the same input
// always gives the same rates, so a balance edit shows its effect.
import { hashSeed, mulberry32 } from '../../../core/rng';
import { autoPlay, startBattle } from '../../../systems/combat';
import { deriveStats, skillsAtLevel } from '../../../systems/combat/stats';
import type { CombatantInit } from '../../../systems/combat/types';
import { loadoutBonus, type Loadout } from '../../../systems/equipment';
import { AB, ARCHETYPES, COMBAT_CONTEXT, ENEMIES, EQUIPMENT_DEFS, EVENTS, STAT_RULES, ZONES } from './config/content';
import { rarityMultiplier } from './fighters';
import { enemyInits } from './encounter';

export const GEAR_TIERS = ['none', 'common', 'uncommon', 'rare'] as const;
export type GearTier = (typeof GEAR_TIERS)[number];

const GEAR: Record<GearTier, Loadout> = {
  none: {},
  common: { weapon: 'item_equip_wood_sword', armor: 'item_equip_leaf_vest', charm: 'item_equip_lucky_clover' },
  uncommon: { weapon: 'item_equip_iron_sword', armor: 'item_equip_bark_armor', charm: 'item_equip_wind_feather' },
  rare: { weapon: 'item_equip_flame_blade', armor: 'item_equip_moss_plate', charm: 'item_equip_sun_amulet' },
};

export interface SimMember {
  archetypeId: string;
  rarity?: string;
  hearts?: number;
}

export interface SimInput {
  zoneId: string;
  level: number;
  team: readonly SimMember[];
  gear: GearTier;
  samples: number;
  seed: number;
}

export interface SimResult {
  samples: number;
  /** Runs that beat the boss, percent. */
  winPercent: number;
  /** Percent of runs that reached each node (the first is always 100). */
  reachedPercent: number[];
  /** Average rounds of a battle fought. */
  averageRounds: number;
  /** Average share of its max HP the party has left at the end of a won run, percent. */
  averageHpLeft: number;
}

export function simulateRuns(input: SimInput): SimResult {
  const zone = ZONES[input.zoneId];
  if (!zone) throw new Error(`unknown zone ${input.zoneId}`);
  const bonus = loadoutBonus(GEAR[input.gear], EQUIPMENT_DEFS);
  const members = input.team.map((m, i): CombatantInit => {
    const a = ARCHETYPES[m.archetypeId];
    if (!a) throw new Error(`unknown archetype ${m.archetypeId}`);
    const stats = deriveStats(a.stats, { level: input.level, rarityMult: rarityMultiplier(m.rarity ?? 'COMMON'), hearts: m.hearts ?? 0 }, STAT_RULES, bonus);
    return { id: `ally${i}`, side: 'ally', name: `${a.nameVi} ${i + 1}`, element: a.element, stats, skills: skillsAtLevel(a.skills, AB.levels.skillUnlockLevels, input.level) };
  });
  const reached = zone.nodes.map(() => 0);
  let wins = 0;
  let rounds = 0;
  let battles = 0;
  let hpLeft = 0;
  for (let s = 0; s < input.samples; s += 1) {
    const rng = mulberry32(hashSeed('sim', input.seed, s));
    let hp = new Map(members.map((m) => [m.id, m.stats.hp]));
    let alive = true;
    for (const [i, node] of zone.nodes.entries()) {
      if (!alive) break;
      reached[i]! += 1;
      if (node.type === 'event') {
        const event = EVENTS[node.events[Math.floor(rng.next() * node.events.length)]!]!;
        hp = new Map(members.map((m) => {
          const cur = hp.get(m.id)!;
          if (cur <= 0) return [m.id, cur];
          const healed = Math.min(m.stats.hp, cur + Math.round(m.stats.hp * event.healPct));
          return [m.id, event.damagePct > 0 ? Math.max(1, healed - Math.round(m.stats.hp * event.damagePct)) : healed];
        }));
      } else if (node.type === 'battle' || node.type === 'boss') {
        const ids = node.type === 'boss' ? node.enemies : pickGroup(rng.next(), node.pool);
        const start = startBattle(hashSeed('sim-battle', input.seed, s, i), [...members.map((m) => ({ ...m, hp: hp.get(m.id) })), ...enemyInits(ids)], COMBAT_CONTEXT);
        const end = autoPlay(start.state, COMBAT_CONTEXT);
        battles += 1;
        rounds += end.round;
        if (end.outcome !== 'win') alive = false;
        else hp = new Map(end.combatants.filter((c) => c.side === 'ally').map((c) => [c.id, c.hp]));
      }
    }
    if (alive) {
      wins += 1;
      hpLeft += (members.reduce((n, m) => n + (hp.get(m.id) ?? 0), 0) / members.reduce((n, m) => n + m.stats.hp, 0)) * 100;
    }
  }
  const pct = (n: number) => (input.samples > 0 ? Math.round((n / input.samples) * 1000) / 10 : 0);
  return {
    samples: input.samples,
    winPercent: pct(wins),
    reachedPercent: reached.map(pct),
    averageRounds: battles > 0 ? Math.round((rounds / battles) * 10) / 10 : 0,
    averageHpLeft: wins > 0 ? Math.round((hpLeft / wins) * 10) / 10 : 0,
  };
}

function pickGroup(roll: number, pool: readonly { weight: number; enemies: readonly string[] }[]): readonly string[] {
  const total = pool.reduce((n, p) => n + p.weight, 0);
  let r = roll * total;
  return (pool.find((p) => (r -= p.weight) < 0) ?? pool.at(-1)!).enemies;
}

/** The names the Admin shows for a zone's enemies. */
export const enemyName = (id: string): string => ENEMIES[id]?.nameVi ?? id;
