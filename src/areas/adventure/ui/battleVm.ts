// What the battle and the summary screens show, as plain data (no DOM, spec §15.4–15.5, §17): the units with HP / MP / Rage, statuses
// and the enemies' intents, the turn order, the actions the current ally may take (and why one is off), how well an action would land
// on each target (element chart, reactions), the battle log in words, the summary of a trip. Pure; unit-tested.
import { itemArtId } from '../../../core/config/assetIds';
import type { ItemId } from '../../../core/config/ids';
import type { WorldSave } from '../../../core/save/world';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { canAct, current, elementMultiplier, find, hasStatus, hitCategory, skillElement, skillMpCost, stat, ultimateReady } from '../../../systems/combat';
import type { BattleAction, BattleEvent, BattleState, Category, Combatant, Element, StatusId } from '../../../systems/combat/types';
import { AB, BATTLE_ITEMS, COMBAT_CONTEXT, ENEMIES, MAPS, REACTIONS, SKILLS } from '../logic/config/content';
import { enemyIdOf } from '../logic/encounter';
import type { Run } from '../logic/state';
import { ELEMENT_ICON, STATUS_ICON, elementName, errorText, nameOfItem, statusDesc, statusName } from './vmKit';

export interface StatusVm {
  id: StatusId;
  icon: string;
  name: string;
  desc: string;
  turns: number;
  stacks: number;
  good: boolean;
}

export interface UnitVm {
  id: string;
  side: 'ally' | 'enemy';
  name: string;
  art: string;
  icons: string;
  hpText: string;
  hpPercent: number;
  mpText: string;
  mpPercent: number;
  ragePercent: number;
  rageFull: boolean;
  statuses: StatusVm[];
  down: boolean;
  active: boolean;
  boss: boolean;
  elite: boolean;
  corrupted: boolean;
  guarding: boolean;
  /** What the enemy will do this round (§15.4). */
  intent: string | null;
}

export interface BattleActionVm {
  kind: 'attack' | 'skill' | 'ultimate' | 'item' | 'guard' | 'flee';
  id: string;
  label: string;
  detail: string;
  /** Who it must be aimed at: an enemy, an ally, or nobody (all / self). */
  aim: 'enemy' | 'ally' | null;
  reason: string | null;
  /** The element and category it hits with (for the effectiveness labels). */
  element: Element | null;
  category: Category;
}

export interface EffectVm {
  label: string;
  tone: 'strong' | 'neutral' | 'weak' | 'resist' | 'immune';
  reaction: string | null;
}

export interface BattleVm {
  round: number;
  units: UnitVm[];
  order: { id: string; name: string; side: 'ally' | 'enemy'; next: boolean }[];
  actor: string | null;
  actions: BattleActionVm[];
  log: string[];
}

const pct = (a: number, b: number) => (b <= 0 ? 0 : Math.round((a / b) * 100));

function intentText(battle: BattleState, c: Combatant): string | null {
  const it = c.intent;
  if (!it || c.side !== 'enemy' || c.hp <= 0) return null;
  const target = 'target' in it && it.target ? find(battle, it.target)?.name : undefined;
  switch (it.kind) {
    case 'attack':
      return t(vi.adventure.battle.intent.attack, { target: target ?? '' });
    case 'skill': {
      const skill = SKILLS[it.skillId]?.nameVi ?? '';
      return target ? t(vi.adventure.battle.intent.skillOn, { skill, target }) : t(vi.adventure.battle.intent.skill, { skill });
    }
    case 'guard':
      return vi.adventure.battle.intent.guard;
    case 'ultimate':
      return vi.adventure.battle.intent.ultimate;
    case 'item':
      return vi.adventure.battle.intent.item;
  }
}

function unitVm(battle: BattleState, c: Combatant, activeId: string | null, art: string): UnitVm {
  const enemy = c.side === 'enemy' ? ENEMIES[enemyIdOf(c.id)] : undefined;
  return {
    id: c.id,
    side: c.side,
    name: c.name,
    art: enemy?.art ?? art,
    icons: [c.element, ...(c.element2 ? [c.element2] : [])].map((e) => ELEMENT_ICON[e]).join(''),
    hpText: `${formatInt(c.hp)}/${formatInt(c.stats.hp)}`,
    hpPercent: pct(c.hp, c.stats.hp),
    mpText: `${formatInt(c.mp)}/${formatInt(c.stats.mp)}`,
    mpPercent: pct(c.mp, c.stats.mp),
    ragePercent: pct(c.rage, c.rageMax),
    rageFull: c.rageMax > 0 && c.rage >= c.rageMax && !c.ultimateUsed,
    statuses: c.statuses.map((s) => ({ id: s.id, icon: STATUS_ICON[s.id], name: statusName(s.id), desc: statusDesc(s.id), turns: s.turns, stacks: s.stacks, good: COMBAT_CONTEXT.statuses[s.id]?.positive ?? false })),
    down: c.hp <= 0,
    active: c.id === activeId,
    boss: !!enemy?.boss,
    elite: !!enemy?.tags.includes('elite'),
    corrupted: c.tags.includes('umbraflux'),
    guarding: c.guarding,
    intent: intentText(battle, c),
  };
}

const TARGET_AIM: Record<string, 'enemy' | 'ally' | null> = { enemy: 'enemy', ally: 'ally', allEnemies: null, randomEnemies: null, allAllies: null, self: null, all: null };

/** How an attack of `element` would land on `target` (§15.5): the chart label and the reaction it would set off. */
export function effectOn(battle: BattleState, actorId: string, element: Element | null, category: string, targetId: string): EffectVm | null {
  const target = find(battle, targetId);
  if (!target || element === null) return null;
  const mult = elementMultiplier(COMBAT_CONTEXT, element, target);
  const tone: EffectVm['tone'] = mult === 0 ? 'immune' : mult > 1 ? 'strong' : mult <= 0.5 ? 'resist' : mult < 1 ? 'weak' : 'neutral';
  const key = ({ strong: 'STRONG', neutral: 'NEUTRAL', weak: 'WEAK', resist: 'RESIST', immune: 'IMMUNE' } as const)[tone];
  const reaction = COMBAT_CONTEXT.reactions.find(
    (r) =>
      (r.elements.includes(element) || r.categories.includes(category as never)) &&
      (!r.requiresStatus || hasStatus(target, r.requiresStatus)) &&
      (!r.requiresTag || target.tags.includes(r.requiresTag)) &&
      (!r.requiresSourceElement || target.statuses.some((s) => s.source === r.requiresSourceElement)) &&
      (r.requiresStatus || r.requiresTag || r.requiresSourceElement),
  );
  void actorId;
  return { label: vi.adventure.battle.eff[key], tone, reaction: reaction ? (REACTIONS[reaction.id]?.nameVi ?? reaction.id) : null };
}

/** A line of the battle log in words. */
export function logLine(e: BattleEvent, nameOf: (id: string) => string): string | null {
  const L = vi.adventure.battle.log;
  switch (e.type) {
    case 'round':
      return t(L.round, { round: e.round });
    case 'use':
      return e.skillId ? t(e.ultimate ? L.ultimate : L.use, { actor: nameOf(e.actor), skill: SKILLS[e.skillId]?.nameVi ?? '' }) : t(L.use, { actor: nameOf(e.actor), skill: L.attack });
    case 'damage': {
      const how = e.mult > 1 ? ` ${L.strong}` : e.mult < 1 ? ` ${L.weak}` : '';
      return t(e.crit ? L.crit : L.damage, { target: nameOf(e.target), amount: formatInt(e.amount) }) + how;
    }
    case 'miss':
      return t(L.miss, { actor: nameOf(e.actor), target: nameOf(e.target) });
    case 'heal':
      return t(L.heal, { target: nameOf(e.target), amount: formatInt(e.amount) });
    case 'status':
      return t(COMBAT_CONTEXT.statuses[e.status]?.positive ? L.buff : L.status, { target: nameOf(e.target), status: statusName(e.status) });
    case 'resist':
      return t(L.resist, { target: nameOf(e.target), status: statusName(e.status) });
    case 'cleanse':
      return t(L.cleanse, { target: nameOf(e.target), statuses: e.statuses.map(statusName).join(', ') });
    case 'tick':
      return t(L.tick, { target: nameOf(e.target), status: statusName(e.status), amount: e.status === 'regen' ? `+${e.amount}` : e.status === 'doom' ? String(e.amount) : `-${e.amount}` });
    case 'reaction':
      return t(L.reaction, { reaction: REACTIONS[e.reaction]?.nameVi ?? e.reaction, target: nameOf(e.target) });
    case 'guard':
      return t(L.guard, { actor: nameOf(e.actor) });
    case 'skip':
      return t(L.skip, { actor: nameOf(e.actor), reason: statusName(e.reason) });
    case 'revive':
      return t(L.revive, { target: nameOf(e.target), amount: formatInt(e.amount) });
    case 'phase':
      return t(L.phase, { target: nameOf(e.target) });
    case 'ready':
      return t(L.ready, { actor: nameOf(e.actor) });
    case 'defeat':
      return t(L.defeat, { target: nameOf(e.target) });
    case 'end':
      return e.outcome === 'win' ? L.win : L.lose;
    default:
      return null;
  }
}

/** The group being fought, from the trip. */
export function foughtKind(run: Run): 'normal' | 'elite' | 'boss' {
  const [mapId, groupId] = (run.fighting ?? '/').split('/');
  return MAPS[mapId ?? '']?.groups.find((g) => g.id === groupId)?.kind ?? 'normal';
}

function actionsOf(world: WorldSave, run: Run, battle: BattleState, cur: Combatant): BattleActionVm[] {
  const out: BattleActionVm[] = [];
  const why = (a: BattleAction): string | null => {
    const e = canAct(battle, a, COMBAT_CONTEXT);
    if (!e || e === 'BAD_TARGET') return null;
    return errorText(e === 'NOT_ENOUGH_MP' || e === 'ON_COOLDOWN' || e === 'SKILL_DISABLED' || e === 'ULTIMATE_NOT_READY' ? e : 'SKILL_UNAVAILABLE');
  };
  out.push({ kind: 'attack', id: 'attack', label: vi.adventure.battle.attack, detail: t(vi.adventure.battle.attackDetail, { element: elementName(cur.element) }), aim: 'enemy', reason: null, element: cur.element, category: 'physical' });
  for (const slot of cur.skills) {
    const s = SKILLS[slot.id];
    if (!s) continue;
    const cooldown = cur.cooldowns[s.id] ?? 0;
    const mp = skillMpCost(s, slot.level);
    const reason = cooldown > 0 ? t(vi.adventure.battle.cooldown, { turns: cooldown }) : why({ kind: 'skill', skillId: s.id, target: undefined });
    const element = skillElement(s, cur);
    out.push({
      kind: 'skill',
      id: s.id,
      label: `${element ? ELEMENT_ICON[element] : '✧'} ${s.nameVi}${slot.level > 1 ? ` Lv.${slot.level}` : ''}`,
      detail: `${mp > 0 ? `${mp} MP · ` : ''}${s.descVi}`,
      aim: TARGET_AIM[s.target] ?? null,
      reason,
      element: s.power > 0 ? element : null,
      category: hitCategory(cur, s, COMBAT_CONTEXT),
    });
  }
  if (cur.ultimate && SKILLS[cur.ultimate]) {
    const u = SKILLS[cur.ultimate]!;
    const reason = cur.ultimateUsed ? vi.adventure.battle.ultimateUsed : ultimateReady(cur) ? null : t(vi.adventure.battle.ultimateWait, { rage: Math.round(cur.rage), max: cur.rageMax });
    const element = skillElement(u, cur);
    out.push({ kind: 'ultimate', id: u.id, label: `★ ${u.nameVi}`, detail: u.descVi, aim: TARGET_AIM[u.target] ?? null, reason, element: u.power > 0 ? element : null, category: hitCategory(cur, u, COMBAT_CONTEXT) });
  }
  out.push({ kind: 'guard', id: 'guard', label: vi.adventure.battle.guard, detail: vi.adventure.battle.guardDetail, aim: null, reason: null, element: null, category: 'support' });
  for (const item of Object.values(BATTLE_ITEMS)) {
    const have = world.inventory.items[item.itemId] ?? 0;
    if (have === 0) continue;
    const detail = (vi.adventure.battle.itemDetail as Record<string, string>)[item.itemId] ?? '';
    out.push({ kind: 'item', id: item.itemId, label: `${nameOfItem(item.itemId)} (x${have})`, detail, aim: item.target === 'ally' ? 'ally' : null, reason: null, element: null, category: 'support' });
  }
  out.push({ kind: 'flee', id: 'flee', label: vi.adventure.battle.flee, detail: '', aim: null, reason: foughtKind(run) === 'normal' ? null : vi.adventure.battle.fleeOff, element: null, category: 'support' });
  return out;
}

export function battleVm(world: WorldSave, run: Run): BattleVm | null {
  const battle = run.battle;
  if (!battle) return null;
  const cur = current(battle);
  const arts = new Map(run.team.map((m) => [m.key, m.art]));
  const units = battle.combatants.map((c) => unitVm(battle, c, cur?.id ?? null, arts.get(c.id) ?? ''));
  const nameOf = (id: string) => battle.combatants.find((c) => c.id === id)?.name ?? id;
  const alive = battle.combatants.filter((c) => c.hp > 0);
  const nextRound = [...alive].sort((a, b) => stat(b, 'spd', COMBAT_CONTEXT) - stat(a, 'spd', COMBAT_CONTEXT));
  const order = [
    ...battle.order.map((id) => find(battle, id)).filter((c): c is Combatant => !!c && c.hp > 0).map((c) => ({ id: c.id, name: c.name, side: c.side, next: false })),
    ...nextRound.map((c) => ({ id: c.id, name: c.name, side: c.side, next: true })),
  ].slice(0, 9);
  return {
    round: battle.round,
    units,
    order,
    actor: cur?.id ?? null,
    actions: cur && cur.side === 'ally' ? actionsOf(world, run, battle, cur) : [],
    log: run.log.map((e) => logLine(e as BattleEvent, nameOf)).filter((l): l is string => l !== null),
  };
}

// ---- The summary ------------------------------------------------------------------------------------------------

export interface ResultVm {
  result: 'win' | 'lose' | 'retreat' | 'sweep';
  title: string;
  body: string;
  lines: string[];
  loot: { itemId: string; name: string; count: number; art: string }[];
}

export function resultVm(run: Run, names: ReadonlyMap<string, string>): ResultVm | null {
  if (run.phase !== 'done' || !run.result) return null;
  const lines = [t(vi.adventure.resultExp, { exp: formatInt(run.expGained) }), t(vi.adventure.resultCoins, { coins: formatInt(run.coins) })];
  if (run.spGained > 0) lines.push(t(vi.adventure.resultSp, { sp: run.spGained }));
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
