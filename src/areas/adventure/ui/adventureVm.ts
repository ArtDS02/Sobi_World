// What the Adventure's screens show, as plain data (no DOM): the hub (zone, fighters, the starter quest, the loot waiting), the
// map of a run, a battle and its actions, the summary. Availability comes from dry-running the real action, so a disabled
// reason is always what dispatch would answer. Pure; unit-tested.
import type { RosterEntry } from '../../../core/area-registry/registry';
import type { ErrorCode } from '../../../core/config/errors';
import { WORLD_LEVELS } from '../../../core/config/progression';
import { levelProgress, worldLevel, worldXp } from '../../../core/progression/levels';
import type { WorldSave } from '../../../core/save/world';
import { formatDuration, formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import type { Element, Stats } from '../../../systems/combat/types';
import { EQUIPMENT_SLOTS, type EquipmentSlot } from '../../../systems/equipment';
import { startRun } from '../logic/actions/run';
import { AB, EQUIPMENT_DEFS, SKILLS, ZONE_LIST, ZONES, archetypeOf, type Archetype } from '../logic/config/content';
import { energyOf, exhaustedLeft, expNeeded, fighterStats, msToEnergy, newFighter, whyNotReady } from '../logic/fighters';
import { adventureOf } from '../logic/save/lens';
import { nodeIcons } from './battleVm';
import { ELEMENT_ICON, nameOfItem, probe, type AdventureRun, type ButtonVm } from './vmKit';

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

export { ELEMENT_ICON, probe, type AdventureRun, type ButtonVm };
