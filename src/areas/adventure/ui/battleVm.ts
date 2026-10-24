// What the battle and the summary screens show, as plain data (no DOM, spec §15.4–15.5, §17): the units with HP / MP / Rage, statuses
// and the enemies' intents, the turn order, the actions the current ally may take (and why one is off), how well an action would land
// on each target (element chart, reactions), the battle log in words (battleLog.ts), the summary of a trip; the ally's title, the Rift's
// floor and a golden group's countdown (decision 039). Pure; unit-tested.
import { itemArtId } from '../../../core/config/assetIds';
import type { ItemId } from '../../../core/config/ids';
import type { WorldSave } from '../../../core/save/world';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { canAct, current, elementMultiplier, find, hasStatus, hitCategory, skillElement, skillMpCost, stat, ultimateReady } from '../../../systems/combat';
import type { BattleAction, BattleEvent, BattleState, Category, Combatant, Element, StatusId } from '../../../systems/combat/types';
import { battleAffix } from '../logic/actions/battle';
import { titleOf } from '../logic/bonds';
import { BATTLE_ITEMS, COMBAT_CONTEXT, ENEMIES, MAPS, REACTIONS, SKILLS } from '../logic/config/content';
import { enemyIdOf } from '../logic/encounter';
import { expShare } from '../logic/fighters';
import { escapeIn } from './battleFloaters';
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
  /** Allies: their level, the share of the way to the next one, class and title (the nameplate and the team list). */
  level: number | null;
  expPercent: number | null;
  classId: ClassId | null;
  honor: string | null;
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

/**
 * Who an action is aimed at: one enemy / one ally (a marker on each), a whole side (one big marker over it), the actor itself, everyone,
 * or nobody (guard, flee: it runs at once).
 */
export type AimVm = 'enemy' | 'ally' | 'enemies' | 'allies' | 'self' | 'all' | null;

/** The tab of the command dock an action sits in: the main skills (its line's own + the Ultimate), the class skills, the items. */
export type ActionTab = 'main' | 'sub' | 'item' | 'basic';

export interface BattleActionVm {
  kind: 'attack' | 'skill' | 'ultimate' | 'item' | 'guard' | 'flee';
  tab: ActionTab;
  id: string;
  label: string;
  detail: string;
  /** Its icon: the skill's own, or the plain action's. */
  art: string;
  /** MP it costs (0 = free). */
  mp: number;
  aim: AimVm;
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
  /** The Rift floor being fought, or null on a zone trip. */
  riftFloor: number | null;
  /** The variant the enemies wear, and the rounds left before a golden group runs away. */
  affix: { name: string; art: string } | null;
  escapeIn: number | null;
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

interface AllyInfo {
  art: string;
  level: number | null;
  expPercent: number | null;
  classId: ClassId | null;
  honor: string | null;
}

function unitVm(battle: BattleState, c: Combatant, activeId: string | null, ally: AllyInfo | undefined): UnitVm {
  const enemy = c.side === 'enemy' ? ENEMIES[enemyIdOf(c.id)] : undefined;
  return {
    id: c.id,
    side: c.side,
    name: c.name,
    art: enemy?.art ?? ally?.art ?? '',
    elements: [c.element, ...(c.element2 ? [c.element2] : [])],
    level: ally?.level ?? null,
    expPercent: ally?.expPercent ?? null,
    classId: ally?.classId ?? null,
    honor: ally?.honor ?? null,
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

const TARGET_AIM: Record<string, AimVm> = { enemy: 'enemy', ally: 'ally', allEnemies: 'enemies', randomEnemies: 'enemies', allAllies: 'allies', self: 'self', all: 'all' };

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
  out.push({ kind: 'attack', tab: 'basic', id: 'attack', label: vi.adventure.battle.attack, detail: t(vi.adventure.battle.attackDetail, { element: elementName(cur.element) }), art: ACTION_ART.attack, mp: 0, aim: 'enemy', reason: null, element: cur.element, category: 'physical' });
  for (const slot of cur.skills) {
    const s = SKILLS[slot.id];
    if (!s) continue;
    const cooldown = cur.cooldowns[s.id] ?? 0;
    const mp = skillMpCost(s, slot.level);
    const reason = cooldown > 0 ? t(vi.adventure.battle.cooldown, { turns: cooldown }) : why({ kind: 'skill', skillId: s.id, target: undefined });
    const element = skillElement(s, cur);
    out.push({
      kind: 'skill',
      tab: s.type === 'unique' ? 'main' : 'sub',
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
    out.push({ kind: 'ultimate', tab: 'main', id: u.id, label: u.nameVi, detail: u.descVi, art: skillArt(u.id), mp: 0, aim: TARGET_AIM[u.target] ?? null, reason, element: u.power > 0 ? element : null, category: hitCategory(cur, u, COMBAT_CONTEXT) });
  }
  out.push({ kind: 'guard', tab: 'basic', id: 'guard', label: vi.adventure.battle.guard, detail: vi.adventure.battle.guardDetail, art: ACTION_ART.guard, mp: 0, aim: null, reason: null, element: null, category: 'support' });
  for (const item of Object.values(BATTLE_ITEMS)) {
    const have = world.inventory.items[item.itemId] ?? 0;
    if (have === 0) continue;
    const detail = (vi.adventure.battle.itemDetail as Record<string, string>)[item.itemId] ?? '';
    out.push({ kind: 'item', tab: 'item', id: item.itemId, label: `${nameOfItem(item.itemId)} (x${have})`, detail, art: itemArtId(item.itemId as ItemId), mp: 0, aim: TARGET_AIM[item.target] ?? 'self', reason: null, element: null, category: 'support' });
  }
  out.push({ kind: 'flee', tab: 'basic', id: 'flee', label: vi.adventure.battle.flee, detail: '', art: ACTION_ART.flee, mp: 0, aim: null, reason: !run.rift && foughtKind(run) === 'normal' ? null : vi.adventure.battle.fleeOff, element: null, category: 'support' });
  return out;
}

export function battleVm(world: WorldSave, run: Run): BattleVm | null {
  const battle = run.battle;
  if (!battle) return null;
  const cur = current(battle);
  const fighters = adventureOf(world).fighters;
  const affix = battleAffix(battle);
  const allies = new Map(
    run.team.map((m): [string, AllyInfo] => {
      const f = fighters[m.key];
      return [m.key, { art: m.art, level: f?.level ?? null, expPercent: f ? expShare(f) : null, classId: m.classId, honor: titleOf(f)?.nameVi ?? null }];
    }),
  );
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
    riftFloor: run.rift ? run.rift.floor + 1 : null,
    affix: affix ? { name: affix.nameVi, art: affix.art } : null,
    escapeIn: escapeIn(battle, affix?.escapeAfterRounds ?? null),
  };
}

export { logLine };
