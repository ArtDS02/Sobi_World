// What the Adventure's map, battle and summary screens show, as plain data (no DOM): the nodes of a run, the units of a battle
// with the actions the current ally may take (and why one is off), the battle log in words, the summary. Pure; unit-tested.
import { itemArtId } from '../../../core/config/assetIds';
import type { ItemId } from '../../../core/config/ids';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { current, usableSkills } from '../../../systems/combat';
import type { BattleEvent, Combatant, Element, StatusId } from '../../../systems/combat/types';
import type { WorldSave } from '../../../core/save/world';
import { AB, BATTLE_ITEMS, COMBAT_CONTEXT, ENEMIES, EVENTS, SKILLS, ZONES, type Zone } from '../logic/config/content';
import { enemyIdOf } from '../logic/encounter';
import type { Run } from '../logic/state';
import { ELEMENT_ICON, STATUS_ICON, nameOfItem } from './vmKit';

// ---- The run ------------------------------------------------------------------------------------------------------

const NODE_ICON = { battle: '⚔️', chest: '🎁', event: '❓', boss: '👑' } as const;
export const nodeIcons = (zone: Zone): string[] => zone.nodes.map((n) => NODE_ICON[n.type]);

export interface MapVm {
  zone: string;
  nodes: { icon: string; state: 'done' | 'now' | 'next'; label: string }[];
  team: { key: string; name: string; art: string; hpText: string; hpPercent: number; down: boolean }[];
  /** The small event that just happened, in words. */
  event: { name: string; text: string } | null;
}

export function mapVm(run: Run): MapVm {
  const zone = ZONES[run.zoneId]!;
  return {
    zone: zone.nameVi,
    nodes: zone.nodes.map((n, i) => ({ icon: NODE_ICON[n.type], state: i < run.nodeIndex ? 'done' : i === run.nodeIndex ? 'now' : 'next', label: vi.adventure.node[n.type] })),
    team: run.team.map((m) => ({ key: m.key, name: m.name, art: m.art, hpText: `${m.hp}/${m.stats.hp}`, hpPercent: Math.round((m.hp / m.stats.hp) * 100), down: m.hp <= 0 })),
    event: run.lastEvent && EVENTS[run.lastEvent] ? { name: EVENTS[run.lastEvent]!.nameVi, text: EVENTS[run.lastEvent]!.textVi } : null,
  };
}

export interface UnitVm {
  id: string;
  side: 'ally' | 'enemy';
  name: string;
  art: string;
  element: Element;
  hpText: string;
  hpPercent: number;
  energy: number;
  statuses: { id: StatusId; icon: string; turns: number }[];
  down: boolean;
  active: boolean;
  boss: boolean;
}

export interface BattleActionVm {
  kind: 'attack' | 'skill' | 'item';
  id: string;
  label: string;
  detail: string;
  /** Who it must be aimed at: an enemy, an ally, or nobody (all / self). */
  aim: 'enemy' | 'ally' | null;
  reason: string | null;
}

export interface BattleVm {
  round: number;
  units: UnitVm[];
  /** The actor whose turn it is (an ally while the player is to choose). */
  actor: string | null;
  actions: BattleActionVm[];
  log: string[];
}

const TARGET_AIM: Record<string, 'enemy' | 'ally' | null> = { enemy: 'enemy', ally: 'ally', allEnemies: null, allAllies: null, self: null };

/** A line of the battle log in words. */
export function logLine(e: BattleEvent, nameOf: (id: string) => string): string | null {
  switch (e.type) {
    case 'round':
      return t(vi.adventure.log.round, { round: e.round });
    case 'damage': {
      const how = e.mult > 1 ? ` ${vi.adventure.log.strong}` : e.mult < 1 ? ` ${vi.adventure.log.weak}` : '';
      const skill = e.skillId ? (SKILLS[e.skillId]?.nameVi ?? '') : vi.adventure.log.attack;
      return t(e.crit ? vi.adventure.log.damageCrit : vi.adventure.log.damage, { actor: nameOf(e.actor), skill, target: nameOf(e.target), amount: e.amount }) + how;
    }
    case 'heal':
      return t(vi.adventure.log.heal, { actor: nameOf(e.actor), target: nameOf(e.target), amount: e.amount });
    case 'status':
      return t(vi.adventure.log.status, { target: nameOf(e.target), status: vi.adventure.status[e.status] });
    case 'burn':
      return t(vi.adventure.log.burn, { target: nameOf(e.target), amount: e.amount });
    case 'skip':
      return t(vi.adventure.log.skip, { actor: nameOf(e.actor) });
    case 'defeat':
      return t(vi.adventure.log.defeat, { target: nameOf(e.target) });
    case 'end':
      return e.outcome === 'win' ? vi.adventure.log.win : vi.adventure.log.lose;
    default:
      return null;
  }
}

function unitVm(c: Combatant, activeId: string | null): UnitVm {
  const isEnemy = c.side === 'enemy';
  const enemy = isEnemy ? ENEMIES[enemyIdOf(c.id)] : undefined;
  return {
    id: c.id,
    side: c.side,
    name: c.name,
    art: enemy?.art ?? '',
    element: c.element,
    hpText: `${c.hp}/${c.maxHp}`,
    hpPercent: Math.round((c.hp / c.maxHp) * 100),
    energy: c.energy,
    statuses: c.statuses.map((s) => ({ id: s.id, icon: STATUS_ICON[s.id], turns: s.turns })),
    down: c.hp <= 0,
    active: c.id === activeId,
    boss: !!enemy?.boss,
  };
}

export function battleVm(world: WorldSave, run: Run): BattleVm | null {
  const battle = run.battle;
  if (!battle) return null;
  const cur = current(battle);
  const arts = new Map(run.team.map((m) => [m.key, m.art]));
  const units = battle.combatants.map((c) => {
    const u = unitVm(c, cur?.id ?? null);
    return c.side === 'ally' ? { ...u, art: arts.get(c.id) ?? '' } : u;
  });
  const nameOf = (id: string) => battle.combatants.find((c) => c.id === id)?.name ?? id;
  const actions: BattleActionVm[] = [];
  if (cur && cur.side === 'ally') {
    actions.push({ kind: 'attack', id: 'attack', label: vi.adventure.attack, detail: t(vi.adventure.attackDetail, { gain: COMBAT_CONTEXT.rules.basicEnergyGain }), aim: 'enemy', reason: null });
    const usable = new Set(usableSkills(cur, COMBAT_CONTEXT).map((s) => s.id));
    for (const id of cur.skills) {
      const s = SKILLS[id]!;
      const cooldown = cur.cooldowns[id] ?? 0;
      const reason = cooldown > 0 ? t(vi.adventure.cooldown, { turns: cooldown }) : cur.energy < s.cost ? vi.error.NOT_ENOUGH_ENERGY : usable.has(id) ? null : vi.error.SKILL_UNAVAILABLE;
      actions.push({ kind: 'skill', id, label: `${ELEMENT_ICON[s.element]} ${s.nameVi}`, detail: `${t(vi.adventure.skillCost, { cost: s.cost, cooldown: s.cooldown })} · ${s.descVi}`, aim: TARGET_AIM[s.target] ?? null, reason });
    }
    for (const item of Object.values(BATTLE_ITEMS)) {
      const have = world.inventory.items[item.itemId] ?? 0;
      if (have === 0) continue;
      actions.push({ kind: 'item', id: item.itemId, label: `${nameOfItem(item.itemId)} (x${have})`, detail: vi.adventure.itemDetail[item.itemId as keyof typeof vi.adventure.itemDetail] ?? '', aim: item.target === 'ally' ? 'ally' : null, reason: null });
    }
  }
  return { round: battle.round, units, actor: cur?.id ?? null, actions, log: run.log.map((e) => logLine(e as BattleEvent, nameOf)).filter((l): l is string => l !== null) };
}

// ---- The summary ------------------------------------------------------------------------------------------------

export interface ResultVm {
  result: 'win' | 'lose' | 'retreat';
  title: string;
  body: string;
  lines: string[];
  loot: { itemId: string; name: string; count: number; art: string }[];
}

export function resultVm(run: Run, names: ReadonlyMap<string, string>): ResultVm | null {
  if (run.phase !== 'done' || !run.result) return null;
  const lines = [t(vi.adventure.resultExp, { exp: run.expGained }), t(vi.adventure.resultCoins, { coins: formatInt(run.coins) })];
  if (run.gems > 0) lines.push(t(vi.adventure.resultGems, { gems: run.gems }));
  for (const key of run.levelUps) lines.push(t(vi.adventure.resultLevelUp, { name: names.get(key) ?? key }));
  if (run.result === 'lose') lines.push(t(vi.adventure.resultExhausted, { hours: AB.run.exhaustHours }));
  return {
    result: run.result,
    title: vi.adventure.result[run.result].title,
    body: vi.adventure.result[run.result].body,
    lines,
    loot: Object.entries(run.loot).map(([itemId, count]) => ({ itemId, name: nameOfItem(itemId), count, art: itemArtId(itemId as ItemId) })),
  };
}
