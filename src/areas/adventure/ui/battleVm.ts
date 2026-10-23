// What the battle and the summary screens show, as plain data (no DOM, spec §15.4–15.5, §17): the units with HP / MP / Rage, statuses
// and the enemies' intents, the turn order, the actions the current ally may take (and why one is off), how well an action would land
// on each target (element chart, reactions), the battle log in words (battleLog.ts), the summary of a trip. Pure; unit-tested.
import { itemArtId } from '../../../core/config/assetIds';
import type { ItemId } from '../../../core/config/ids';
import type { WorldSave } from '../../../core/save/world';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { canAct, current, elementMultiplier, find, hasStatus, hitCategory, skillElement, skillMpCost, stat, ultimateReady } from '../../../systems/combat';
import type { BattleAction, BattleEvent, BattleState, Category, Combatant, Element, StatusId } from '../../../systems/combat/types';
import { AB, BATTLE_ITEMS, COMBAT_CONTEXT, ENEMIES, MAPS, REACTIONS, SKILLS } from '../logic/config/content';
import { enemyIdOf } from '../logic/encounter';
import { logLine } from './battleLog';
import type { Run } from '../logic/state';
import type { ClassId } from '../logic/config/content';
import { adventureOf } from '../logic/save/lens';
import { ACTION_ART, elementName, errorText, nameOfItem, skillArt, statusArt, statusDesc, statusName } from './vmKit';

export interface StatusVm {
  id: StatusId;
  /** Its badge; a raised / lowered stat shows the stat's badge and which way it went. */
  art: string;
  arrow: 'up' | 'down' | null;
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
  elements: Element[];
  /** Allies: their level and class (the banner and the team list). */
  level: number | null;
  classId: ClassId | null;
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
  /** What the enemy will do this round (§15.4), in words and as an icon (the skill's own icon for a skill). */
  intent: string | null;
  intentArt: string | null;
}

export interface BattleActionVm {
  kind: 'attack' | 'skill' | 'ultimate' | 'item' | 'guard' | 'flee';
  id: string;
  label: string;
  detail: string;
  /** Its icon: the skill's own, or the plain action's. */
  art: string;
  /** MP it costs (0 = free). */
  mp: number;
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
  order: { id: string; name: string; art: string; side: 'ally' | 'enemy'; next: boolean }[];
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

function intentArt(c: Combatant): string | null {
  const it = c.intent;
  if (!it || c.side !== 'enemy' || c.hp <= 0) return null;
  if (it.kind === 'skill') return skillArt(it.skillId);
  return it.kind === 'item' ? itemArtId('item_potion_battle') : ACTION_ART[it.kind];
}

function unitVm(battle: BattleState, c: Combatant, activeId: string | null, ally: { art: string; level: number | null; classId: ClassId | null } | undefined): UnitVm {
  const enemy = c.side === 'enemy' ? ENEMIES[enemyIdOf(c.id)] : undefined;
  return {
    id: c.id,
    side: c.side,
    name: c.name,
    art: enemy?.art ?? ally?.art ?? '',
    elements: [c.element, ...(c.element2 ? [c.element2] : [])],
    level: ally?.level ?? null,
    classId: ally?.classId ?? null,
    hpText: `${formatInt(c.hp)}/${formatInt(c.stats.hp)}`,
    hpPercent: pct(c.hp, c.stats.hp),
    mpText: `${formatInt(c.mp)}/${formatInt(c.stats.mp)}`,
    mpPercent: pct(c.mp, c.stats.mp),
    ragePercent: pct(c.rage, c.rageMax),
    rageFull: c.rageMax > 0 && c.rage >= c.rageMax && !c.ultimateUsed,
    statuses: c.statuses.map((s) => ({ id: s.id, ...statusArt(s.id), name: statusName(s.id), desc: statusDesc(s.id), turns: s.turns, stacks: s.stacks, good: COMBAT_CONTEXT.statuses[s.id]?.positive ?? false })),
    down: c.hp <= 0,
    active: c.id === activeId,
    boss: !!enemy?.boss,
    elite: !!enemy?.tags.includes('elite'),
    corrupted: c.tags.includes('umbraflux'),
    guarding: c.guarding,
    intent: intentText(battle, c),
    intentArt: intentArt(c),
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
  out.push({ kind: 'attack', id: 'attack', label: vi.adventure.battle.attack, detail: t(vi.adventure.battle.attackDetail, { element: elementName(cur.element) }), art: ACTION_ART.attack, mp: 0, aim: 'enemy', reason: null, element: cur.element, category: 'physical' });
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
      label: `${s.nameVi}${slot.level > 1 ? ` Lv.${slot.level}` : ''}`,
      detail: s.descVi,
      art: skillArt(s.id),
      mp,
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
    out.push({ kind: 'ultimate', id: u.id, label: u.nameVi, detail: u.descVi, art: skillArt(u.id), mp: 0, aim: TARGET_AIM[u.target] ?? null, reason, element: u.power > 0 ? element : null, category: hitCategory(cur, u, COMBAT_CONTEXT) });
  }
  out.push({ kind: 'guard', id: 'guard', label: vi.adventure.battle.guard, detail: vi.adventure.battle.guardDetail, art: ACTION_ART.guard, mp: 0, aim: null, reason: null, element: null, category: 'support' });
  for (const item of Object.values(BATTLE_ITEMS)) {
    const have = world.inventory.items[item.itemId] ?? 0;
    if (have === 0) continue;
    const detail = (vi.adventure.battle.itemDetail as Record<string, string>)[item.itemId] ?? '';
    out.push({ kind: 'item', id: item.itemId, label: `${nameOfItem(item.itemId)} (x${have})`, detail, art: itemArtId(item.itemId as ItemId), mp: 0, aim: item.target === 'ally' ? 'ally' : null, reason: null, element: null, category: 'support' });
  }
  out.push({ kind: 'flee', id: 'flee', label: vi.adventure.battle.flee, detail: '', art: ACTION_ART.flee, mp: 0, aim: null, reason: foughtKind(run) === 'normal' ? null : vi.adventure.battle.fleeOff, element: null, category: 'support' });
  return out;
}

export function battleVm(world: WorldSave, run: Run): BattleVm | null {
  const battle = run.battle;
  if (!battle) return null;
  const cur = current(battle);
  const fighters = adventureOf(world).fighters;
  const allies = new Map(run.team.map((m) => [m.key, { art: m.art, level: fighters[m.key]?.level ?? null, classId: m.classId }]));
  const units = battle.combatants.map((c) => unitVm(battle, c, cur?.id ?? null, allies.get(c.id)));
  const artOf = new Map(units.map((u) => [u.id, u.art]));
  const nameOf = (id: string) => battle.combatants.find((c) => c.id === id)?.name ?? id;
  const alive = battle.combatants.filter((c) => c.hp > 0);
  const nextRound = [...alive].sort((a, b) => stat(b, 'spd', COMBAT_CONTEXT) - stat(a, 'spd', COMBAT_CONTEXT));
  const order = [
    ...battle.order.map((id) => find(battle, id)).filter((c): c is Combatant => !!c && c.hp > 0).map((c) => ({ id: c.id, name: c.name, art: artOf.get(c.id) ?? '', side: c.side, next: false })),
    ...nextRound.map((c) => ({ id: c.id, name: c.name, art: artOf.get(c.id) ?? '', side: c.side, next: true })),
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

export { logLine };
