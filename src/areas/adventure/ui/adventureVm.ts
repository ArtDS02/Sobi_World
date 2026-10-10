// What the Adventure's screens show, as plain data (no DOM): the hub (zone, fighters, the starter quest, the loot waiting), the
// map of a run, a battle and its actions, the summary. Availability comes from dry-running the real action, so a disabled
// reason is always what dispatch would answer. Pure; unit-tested.
import type { RosterEntry } from '../../../core/area-registry/registry';
import type { ErrorCode } from '../../../core/config/errors';
import { itemArtId } from '../../../core/config/assetIds';
import type { ItemId } from '../../../core/config/ids';
import { WORLD_LEVELS } from '../../../core/config/progression';
import { levelProgress, worldLevel, worldXp } from '../../../core/progression/levels';
import { mulberry32 } from '../../../core/rng';
import type { WorldSave } from '../../../core/save/world';
import type { ActionContext, ActionResultOf } from '../../../core/types';
import { formatDuration, formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { current, usableSkills } from '../../../systems/combat/engine';
import type { BattleEvent, Combatant, Element, Stats, StatusId } from '../../../systems/combat/types';
import { EQUIPMENT_SLOTS, type EquipmentSlot } from '../../../systems/equipment';
import { enemyIdOf, startRun } from '../logic/actions/run';
import {
  AB,
  BATTLE_ITEMS,
  COMBAT_CONTEXT,
  ENEMIES,
  EQUIPMENT_DEFS,
  EVENTS,
  SKILLS,
  ZONE_LIST,
  ZONES,
  archetypeOf,
  type Archetype,
  type Zone,
} from '../logic/config/content';
import { energyOf, exhaustedLeft, expNeeded, fighterStats, msToEnergy, newFighter, whyNotReady } from '../logic/fighters';
import { adventureOf } from '../logic/save/lens';
import type { Run } from '../logic/state';

export type AdventureRun = (world: WorldSave, ctx: ActionContext) => ActionResultOf<WorldSave>;

export interface ButtonVm {
  label: string;
  /** Visible reason when the button is off, null when it works. */
  reason: string | null;
}

/** Dry-runs an action with a throwaway rng. */
export function probe(world: WorldSave, run: AdventureRun, now: number): ErrorCode | null {
  const r = run(world, { now, rng: mulberry32(0) });
  return r.ok ? null : r.error;
}

export const ELEMENT_ICON: Record<Element, string> = { FIRE: '🔥', WIND: '🌪️', EARTH: '⛰️', WATER: '💧' };
export const STATUS_ICON: Record<StatusId, string> = { atkUp: '⚔️', defUp: '🛡️', haste: '💨', slow: '🐌', burn: '🔥', stun: '💫', shield: '🔰' };

const nameOfItem = (id: string) => vi.shop[id as ItemId] ?? id;

export interface HudVm {
  coins: string;
  level: string;
  xp: string;
  xpProgress: number;
}

export function hudVm(world: WorldSave): HudVm {
  const xp = worldXp(world);
  const { level, next, percent } = levelProgress(xp, WORLD_LEVELS);
  return {
    coins: formatInt(world.wallet.coins),
    level: t(vi.adventure.level, { level }),
    xp: next === null ? vi.adventure.xpMax : t(vi.adventure.xp, { current: formatInt(xp), next: formatInt(next) }),
    xpProgress: percent,
  };
}

// ---- The hub ------------------------------------------------------------------------------------------------------

export interface SkillLineVm {
  id: string;
  name: string;
  desc: string;
  element: Element;
  /** "Kỹ năng · 3 năng lượng · hồi 2 lượt". */
  cost: string;
  /** The level at which it opens; null when it is open. */
  opensAt: number | null;
}

export interface SlotVm {
  slot: EquipmentSlot;
  label: string;
  itemId: string | null;
  name: string | null;
  bonus: string | null;
}

export interface FighterCardVm {
  key: string;
  name: string;
  art: string;
  style: string;
  element: Element;
  level: string;
  expPercent: number;
  expText: string;
  energyPercent: number;
  energyText: string;
  /** Hearts of Bond shown as text. */
  hearts: string;
  stats: Stats;
  skills: SkillLineVm[];
  slots: SlotVm[];
  /** Why it cannot go now; null = ready. */
  notReady: string | null;
  /** The reason as a short chip ("Kiệt sức 3 giờ"). */
  statusChip: string | null;
}

const bonusText = (stats: Partial<Stats>): string =>
  (['hp', 'atk', 'def', 'spd', 'crit'] as const)
    .filter((k) => (stats[k] ?? 0) > 0)
    .map((k) => `+${stats[k]} ${vi.adventure.stat[k]}`)
    .join(', ');

export function slotVms(loadout: Partial<Record<EquipmentSlot, string>>): SlotVm[] {
  return EQUIPMENT_SLOTS.map((slot) => {
    const itemId = loadout[slot] ?? null;
    const def = itemId ? EQUIPMENT_DEFS[itemId] : undefined;
    return { slot, label: vi.adventure.slot[slot], itemId, name: itemId ? nameOfItem(itemId) : null, bonus: def ? bonusText(def.stats) : null };
  });
}

function skillLines(archetype: Archetype, level: number): SkillLineVm[] {
  return archetype.skills.map((id, i) => {
    const s = SKILLS[id]!;
    const opens = AB.levels.skillUnlockLevels[i] ?? 1;
    return {
      id,
      name: s.nameVi,
      desc: s.descVi,
      element: s.element,
      cost: t(vi.adventure.skillCost, { cost: s.cost, cooldown: s.cooldown }),
      opensAt: level >= opens ? null : opens,
    };
  });
}

function reasonText(error: ErrorCode, entry: RosterEntry, f: ReturnType<typeof newFighter>, now: number): string {
  if (error === 'FIGHTER_EXHAUSTED') return t(vi.adventure.exhaustedFor, { time: formatDuration(exhaustedLeft(f, now)) });
  if (error === 'NO_ADVENTURE_ENERGY') return t(vi.adventure.energyIn, { time: formatDuration(msToEnergy(f, now, AB.run.energyCost)) });
  if (error === 'NOT_A_FIGHTER') return entry.adult ? vi.adventure.notAdventure : vi.adventure.notGrown;
  return vi.error[error];
}

export function fighterCardVm(world: WorldSave, entry: RosterEntry, now: number): FighterCardVm | null {
  const archetype = archetypeOf(entry);
  if (!archetype) return null;
  const a = adventureOf(world);
  const fighter = a.fighters[entry.key] ?? newFighter(now);
  const need = expNeeded(fighter);
  const energy = energyOf(fighter, now);
  const error = whyNotReady(entry, a.fighters[entry.key], now);
  return {
    key: entry.key,
    name: entry.name,
    art: entry.artId,
    style: archetype.nameVi,
    element: archetype.element,
    level: t(vi.adventure.fighterLevel, { level: fighter.level }),
    expPercent: Number.isFinite(need) ? Math.min(100, Math.round((fighter.exp / need) * 100)) : 100,
    expText: Number.isFinite(need) ? t(vi.adventure.exp, { current: Math.floor(fighter.exp), next: need }) : vi.adventure.expMax,
    energyPercent: Math.round((energy / AB.run.energyMax) * 100),
    energyText: t(vi.adventure.energy, { current: Math.floor(energy), max: AB.run.energyMax }),
    hearts: '♥'.repeat(entry.hearts) + '♡'.repeat(Math.max(0, 5 - entry.hearts)),
    stats: fighterStats(fighter, entry, archetype),
    skills: skillLines(archetype, fighter.level),
    slots: slotVms(fighter.loadout),
    notReady: error ? reasonText(error, entry, fighter, now) : null,
    statusChip: error === 'FIGHTER_EXHAUSTED' || error === 'FIGHTER_SICK' || error === 'NO_ADVENTURE_ENERGY' ? reasonText(error, entry, fighter, now) : null,
  };
}

export interface ZoneCardVm {
  id: string;
  name: string;
  desc: string;
  locked: string | null;
  nodes: string;
}

export function zoneCards(world: WorldSave): ZoneCardVm[] {
  const level = worldLevel(world, WORLD_LEVELS);
  return ZONE_LIST.map((z) => ({
    id: z.id,
    name: z.nameVi,
    desc: z.descVi,
    locked: level < z.fromWorldLevel ? t(vi.adventure.zoneLocked, { level: z.fromWorldLevel }) : null,
    nodes: nodeIcons(z).join(' '),
  }));
}

export interface HubVm {
  zones: ZoneCardVm[];
  fighters: FighterCardVm[];
  /** Pigs and fish that could fight but are not raised for the Adventure yet. */
  waiting: number;
  starter: ButtonVm | null;
  loot: (ButtonVm & { count: number }) | null;
}

export function hubVm(world: WorldSave, roster: readonly RosterEntry[], now: number, run: { starter: AdventureRun; loot: AdventureRun }): HubVm {
  const a = adventureOf(world);
  const fighters = roster.filter((e) => e.purpose === 'ADVENTURE').flatMap((e) => fighterCardVm(world, e, now) ?? []);
  const waiting = roster.filter((e) => e.purpose !== 'ADVENTURE' && e.adult && archetypeOf(e)).length;
  const starterError = a.starterClaimed ? null : probe(world, run.starter, now);
  const lootCount = Object.values(a.pending).reduce((n, v) => n + v, 0);
  const lootError = lootCount > 0 ? probe(world, run.loot, now) : null;
  return {
    zones: zoneCards(world),
    fighters,
    waiting,
    starter: a.starterClaimed ? null : { label: vi.adventure.claimStarter, reason: starterError ? vi.error[starterError] : null },
    loot: lootCount > 0 ? { label: t(vi.adventure.collectLoot, { count: lootCount }), reason: lootError ? vi.error[lootError] : null, count: lootCount } : null,
  };
}

/** Why this team cannot start the zone, or null. */
export function startReason(world: WorldSave, roster: readonly RosterEntry[], zoneId: string, keys: string[], now: number): string | null {
  if (keys.length === 0) return vi.adventure.pickTeam;
  const error = probe(world, (w, c) => startRun(w, { zoneId, keys, roster }, c), now);
  if (!error) return null;
  if (error === 'ZONE_LOCKED') return t(vi.adventure.zoneLocked, { level: ZONES[zoneId]?.fromWorldLevel ?? 0 });
  return vi.error[error];
}

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
