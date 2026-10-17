// Simulation of whole trips on the game's own rules (the Admin "Mô phỏng trận", `npm run sim:adventure`, the balance bot): a party of
// given lines and classes at a level and a tier of gear walks a zone N times — every group of its three areas in order, a spring when
// it is hurt, the guardians, then the boss — with the AI choosing for both sides. Nothing is saved. Pure, seeded: the same input always
// gives the same rates, so a balance edit shows its effect.
import { hashSeed, mulberry32 } from '../../../core/rng';
import { act, actionFor, startBattle } from '../../../systems/combat';
import { deriveStats } from '../../../systems/combat/stats';
import type { BattleState } from '../../../systems/combat/types';
import { loadoutBonus, loadoutMods, type Loadout } from '../../../systems/equipment';
import { AB, CLASSES, COMBAT_CONTEXT, EQUIPMENT_DEFS, LINEAGES, MAPS, SKILLS, STAT_RULES, TREES, ZONES, type ClassId, type Identity, type LineageId } from './config/content';
import { enemyInits, pickGroup } from './encounter';
import { allyInit, rarityMultiplier, uniqueSkills, withPrep } from './fighters';
import type { Fighter, RunMember } from './state';
import { classLoadout, nodeLevel, stepCost, whyNotStep } from './tree';

export const GEAR_TIERS = ['none', 'common', 'uncommon', 'rare', 'epic'] as const;
export type GearTier = (typeof GEAR_TIERS)[number];

export const GEAR: Record<GearTier, Loadout> = {
  none: {},
  common: { weapon: 'item_equip_wood_sword', armor: 'item_equip_leaf_vest', charm: 'item_equip_lucky_clover' },
  uncommon: { weapon: 'item_equip_iron_sword', armor: 'item_equip_bark_armor', charm: 'item_equip_wind_feather' },
  rare: { weapon: 'item_equip_flame_blade', armor: 'item_equip_moss_plate', charm: 'item_equip_sun_amulet' },
  epic: { weapon: 'item_equip_rune_blade', armor: 'item_equip_golem_plate', charm: 'item_equip_rune_charm' },
};

export interface SimMember {
  lineage: LineageId;
  classId: ClassId;
  rarity?: string;
  hearts?: number;
}

export interface SimInput {
  zoneId: string;
  level: number;
  team: readonly SimMember[];
  gear: GearTier;
  /** Rations carried (item ids of the field kitchen), GĐ11. */
  prep?: readonly string[];
  samples: number;
  seed: number;
}

export interface SimResult {
  samples: number;
  /** Trips that beat the boss, percent. */
  winPercent: number;
  /** Percent of trips that reached each area (the first is always 100), and the boss. */
  reachedPercent: number[];
  bossPercent: number;
  /** Average rounds of a battle fought. */
  averageRounds: number;
  /** Battles fought on an average trip. */
  averageBattles: number;
  /** Average share of its max HP the party has left at the end of a won trip, percent. */
  averageHpLeft: number;
  /** How often each skill was used per trip (id → uses). */
  skillUse: Record<string, number>;
  /** How often each reaction happened per trip. */
  reactions: Record<string, number>;
}

/** The SP a fighter of `level` has (levels and the zone bosses before the given zone), spent along the tree in order. */
export function autoTree(classId: ClassId, sp: number): Pick<Fighter, 'tree' | 'sp' | 'skills'> {
  const f = { tree: {} as Record<string, number>, sp, skills: null as string[] | null };
  const order = [...TREES[classId]].sort((a, b) => a.tier - b.tier || (a.branch === 'right' ? 1 : 0) - (b.branch === 'right' ? 1 : 0));
  const opened: string[] = [];
  for (let pass = 0; pass < 3; pass += 1) {
    for (const n of order) {
      if (nodeLevel(f, n) > 0) continue;
      if (whyNotStep(f, classId, n.id) === null) {
        f.sp -= stepCost(f, n)!;
        f.tree[n.id] = 1;
        opened.push(n.skill);
      }
    }
  }
  for (let guard = 0; guard < 40; guard += 1) {
    const n = order.filter((x) => nodeLevel(f, x) > 0 && whyNotStep(f, classId, x.id) === null).sort((a, b) => b.tier - a.tier)[0];
    if (!n) break;
    f.sp -= stepCost(f, n)!;
    f.tree[n.id] = nodeLevel(f, n) + 1;
  }
  // The loadout a sensible player would carry: the strongest openers, heals, shields and a taunt for a tanker.
  const worth = (id: string): number => {
    const s = SKILLS[id]!;
    const area = s.target === 'allEnemies' || s.target === 'allAllies' ? 1.5 : 1;
    const effects = s.effects.reduce((n, e) => n + (e.kind === 'heal' ? 3 : e.kind === 'shield' ? 1.5 : e.kind === 'cleanse' ? 1.2 : e.kind === 'status' ? (e.status === 'taunt' ? 1.6 : e.status === 'autoRevive' ? 2.5 : 0.6) : 0), 0);
    return (s.power * s.hits + effects) * area;
  };
  const open = TREES[classId].filter((n) => nodeLevel(f, n) > 0).map((n) => n.skill);
  f.skills = [...open].sort((a, b) => worth(b) - worth(a)).slice(0, AB.tree.loadoutSlots);
  return f;
}

export function simMember(m: SimMember, i: number, level: number, gear: Loadout, prep: readonly string[], spBonus: number): RunMember {
  const lineage = LINEAGES[m.lineage];
  if (!lineage) throw new Error(`unknown line ${m.lineage}`);
  const identity: Identity = { lineage, classId: m.classId, element: lineage.element, element2: null, unique: lineage.unique, ultimate: lineage.ultimate };
  const tree = autoTree(m.classId, AB.sp.perLevel * (level - 1) + spBonus);
  const f = { level, ...tree } as Fighter;
  const stats = withPrep(deriveStats(CLASSES[m.classId].stats, { level, rarityMult: rarityMultiplier(m.rarity ?? 'COMMON'), hearts: m.hearts ?? 0 }, STAT_RULES, loadoutBonus(gear, EQUIPMENT_DEFS)), prep);
  const mods = loadoutMods(gear, EQUIPMENT_DEFS);
  return {
    key: `sim${i}`,
    name: `${lineage.id}/${m.classId}`,
    art: '',
    lineage: lineage.id,
    classId: m.classId,
    element: lineage.element,
    element2: null,
    stats,
    hp: stats.hp,
    mp: stats.mp,
    rage: 0,
    skills: [...uniqueSkills(f, identity), ...classLoadout(f, m.classId)],
    ultimate: lineage.ultimate,
    mods: { elementDamage: { ...mods.elementDamage }, elementResist: { ...mods.elementResist }, statusChance: { ...mods.statusChance }, statusResist: { ...mods.statusResist }, categoryDamage: { ...mods.categoryDamage } },
  };
}

function count(into: Record<string, number>, key: string) {
  into[key] = (into[key] ?? 0) + 1;
}

export function simulateRuns(input: SimInput): SimResult {
  const zone = ZONES[input.zoneId];
  if (!zone) throw new Error(`unknown zone ${input.zoneId}`);
  const zoneIndex = Object.keys(ZONES).indexOf(zone.id);
  const gear = GEAR[input.gear];
  const reached = zone.maps.map(() => 0);
  let wins = 0;
  let bossReached = 0;
  let rounds = 0;
  let battles = 0;
  let hpLeft = 0;
  const skillUse: Record<string, number> = {};
  const reactions: Record<string, number> = {};
  for (let s = 0; s < input.samples; s += 1) {
    const rng = mulberry32(hashSeed('sim', input.seed, s));
    const team = input.team.map((m, i) => simMember(m, i, input.level, gear, input.prep ?? [], AB.sp.bossFirstClear * zoneIndex));
    let alive = true;
    for (let mi = 0; mi < zone.maps.length && alive; mi += 1) {
      reached[mi]! += 1;
      const map = MAPS[zone.maps[mi]!]!;
      let springUsed = false;
      const order = [...map.groups].sort((a, b) => ({ normal: 0, elite: 1, boss: 2 })[a.kind] - ({ normal: 0, elite: 1, boss: 2 })[b.kind]);
      for (const g of order) {
        if (g.kind === 'boss') bossReached += 1;
        const hurt = team.reduce((n, m) => n + m.hp, 0) / team.reduce((n, m) => n + m.stats.hp, 0);
        if (!springUsed && (hurt < 0.55 || g.kind !== 'normal')) {
          springUsed = true;
          for (const m of team) {
            m.hp = Math.min(m.stats.hp, m.hp + Math.round(m.stats.hp * AB.explore.springPct));
            m.mp = Math.min(m.stats.mp, m.mp + Math.round(m.stats.mp * AB.explore.springPct));
          }
        }
        const ids = pickGroup(rng, g.pool);
        const start = startBattle(Math.floor(rng.next() * 2 ** 31), [...team.map((m) => allyInit(m)), ...enemyInits(ids)], COMBAT_CONTEXT);
        let end: BattleState = start.state;
        for (let i = 0; i < 600 && !end.outcome; i += 1) {
          const action = actionFor(end, COMBAT_CONTEXT);
          const r = action ? act(end, action, COMBAT_CONTEXT) : act(end, { kind: 'guard' }, COMBAT_CONTEXT);
          const step = r.ok ? r : act(end, { kind: 'guard' }, COMBAT_CONTEXT);
          if (!step.ok) break;
          for (const e of step.events) {
            if (e.type === 'use' && e.skillId && end.combatants.find((c) => c.id === e.actor)?.side === 'ally') count(skillUse, e.skillId);
            if (e.type === 'reaction') count(reactions, e.reaction);
          }
          end = step.state;
        }
        battles += 1;
        rounds += end.round;
        for (const m of team) {
          const c = end.combatants.find((x) => x.id === m.key)!;
          m.hp = c.hp;
          m.mp = c.mp;
          m.rage = c.rage;
        }
        if (end.outcome !== 'win') {
          alive = false;
          break;
        }
        if (g.kind === 'boss') {
          wins += 1;
          hpLeft += (team.reduce((n, m) => n + m.hp, 0) / team.reduce((n, m) => n + m.stats.hp, 0)) * 100;
        }
      }
    }
  }
  const n = Math.max(1, input.samples);
  const round1 = (v: number) => Math.round(v * 10) / 10;
  return {
    samples: input.samples,
    winPercent: round1((wins / n) * 100),
    reachedPercent: reached.map((r) => round1((r / n) * 100)),
    bossPercent: round1((bossReached / n) * 100),
    averageRounds: battles > 0 ? round1(rounds / battles) : 0,
    averageBattles: round1(battles / n),
    averageHpLeft: wins > 0 ? Math.round(hpLeft / wins) : 0,
    skillUse: Object.fromEntries(Object.entries(skillUse).map(([k, v]) => [k, round1(v / n)])),
    reactions: Object.fromEntries(Object.entries(reactions).map(([k, v]) => [k, round1(v / n)])),
  };
}
