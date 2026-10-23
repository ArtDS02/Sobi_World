// What the camp shows, as plain data (no DOM): the HUD pills, the zones (gate, discovery, where a trip may start, the quick trip), the
// rations, the companions and the chosen team with its warnings, the formations, the leader, the starter quest and the loot waiting.
// Availability comes from dry-running the real action, so a disabled reason is always what dispatch would answer. Pure.
import type { RosterEntry } from '../../../core/area-registry/registry';
import { WORLD_LEVELS } from '../../../core/config/progression';
import { techBonus } from '../../../core/config/tech';
import { levelProgress, worldLevel, worldXp } from '../../../core/progression/levels';
import type { WorldSave } from '../../../core/save/world';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import type { Element } from '../../../systems/combat/types';
import { startRun } from '../logic/actions/start';
import { sweepZone } from '../logic/actions/sweep';
import { portalLit } from '../logic/actions/trip';
import { AB, ELEMENT_CHART, ENEMIES, MAPS, PREP_ITEMS, SKILLS, ZONE_LIST, ZONES, identityOf } from '../logic/config/content';
import { zoneDiscovery } from '../logic/progress';
import { adventureOf } from '../logic/save/lens';
import { fighterCardVm, type FighterCardVm } from './fighterVm';
import { bonusText, elementLabel, errorText, nameOfItem, pct, probe, type AdventureRun, type ButtonVm } from './vmKit';

export interface HudVm {
  coins: string;
  level: string;
  levelNumber: number;
  xp: string;
  xpProgress: number;
}

export function hudVm(world: WorldSave): HudVm {
  const xp = worldXp(world);
  const { level, next, percent } = levelProgress(xp, WORLD_LEVELS);
  return {
    coins: formatInt(world.wallet.coins),
    level: t(vi.adventure.level, { level }),
    levelNumber: level,
    xp: next === null ? vi.adventure.xpMax : t(vi.adventure.xp, { current: formatInt(xp), next: formatInt(next) }),
    xpProgress: percent,
  };
}

export interface StartPointVm {
  mapId: string;
  label: string;
}

export interface ZoneCardVm {
  id: string;
  name: string;
  desc: string;
  backdrop: string;
  locked: string | null;
  explored: string;
  /** Discovery in percent (the bar on the card). */
  explorePct: number;
  cleared: string | null;
  foes: string;
  /** The elements of its enemies (for the team warning). */
  foeElements: Element[];
  starts: StartPointVm[];
  hasDoom: boolean;
}

const enemiesOfZone = (zoneId: string) =>
  [...new Set((ZONES[zoneId]?.maps ?? []).flatMap((m) => MAPS[m]?.groups.flatMap((g) => g.pool.flatMap((p) => p.enemies)) ?? []))].map((id) => ENEMIES[id]!).filter(Boolean);

export function zoneCards(world: WorldSave): ZoneCardVm[] {
  const level = worldLevel(world, WORLD_LEVELS);
  const a = adventureOf(world);
  return ZONE_LIST.map((z) => {
    const enemies = enemiesOfZone(z.id);
    const foeElements = [...new Set(enemies.map((e) => e.element))];
    return {
      id: z.id,
      name: z.nameVi,
      desc: z.descVi,
      backdrop: z.backdrop,
      locked:
        level < z.fromWorldLevel
          ? t(vi.adventure.camp.zoneLocked, { level: z.fromWorldLevel })
          : z.requiresCleared && !a.cleared[z.requiresCleared]
            ? t(vi.adventure.camp.zoneNotCleared, { zone: ZONES[z.requiresCleared]?.nameVi ?? '' })
            : null,
      explored: t(vi.adventure.camp.explored, { pct: zoneDiscovery(a, z.id).percent }),
      explorePct: zoneDiscovery(a, z.id).percent,
      cleared: a.cleared[z.id] ? t(vi.adventure.camp.cleared, { count: a.cleared[z.id]! }) : null,
      foes: t(vi.adventure.camp.foes, { elements: foeElements.map(elementLabel).join(' ') }),
      foeElements,
      starts: z.maps
        .filter((m) => portalLit(world, a, m))
        .map((m, i) => ({ mapId: m, label: t(i === 0 && m === z.maps[0] ? vi.adventure.camp.entrance : vi.adventure.camp.portal, { map: MAPS[m]!.nameVi }) })),
      hasDoom: enemies.some((e) => [...e.skills, ...e.phases.flatMap((p) => p.addSkills)].some((s) => SKILLS[s]?.effects.some((x) => x.kind === 'status' && x.status === 'doom'))),
    };
  });
}

export interface PrepVm {
  itemId: string;
  name: string;
  effect: string;
  have: number;
}

export function prepVms(world: WorldSave): PrepVm[] {
  return Object.values(PREP_ITEMS).map((p) => ({
    itemId: p.itemId,
    name: nameOfItem(p.itemId),
    effect: [
      ...Object.entries(p.shares).map(([k, v]) => `+${pct(v ?? 0)}% ${vi.adventure.stat[k as keyof typeof vi.adventure.stat]}`),
      bonusText(p.flat),
    ]
      .filter(Boolean)
      .join(', '),
    have: world.inventory.items[p.itemId] ?? 0,
  }));
}

export interface FormationVm {
  index: number;
  label: string;
  names: string;
  keys: string[];
  usable: boolean;
}

export interface CampVm {
  zones: ZoneCardVm[];
  prep: PrepVm[];
  prepSlots: number;
  fighters: FighterCardVm[];
  waiting: number;
  starter: ButtonVm | null;
  loot: (ButtonVm & { count: number }) | null;
  formations: FormationVm[];
  leader: 'so' | 'bi';
}

export function campVm(world: WorldSave, roster: readonly RosterEntry[], now: number, run: { starter: AdventureRun; loot: AdventureRun }): CampVm {
  const a = adventureOf(world);
  const fighters = roster.filter((e) => e.purpose === 'ADVENTURE').flatMap((e) => fighterCardVm(world, e, now) ?? []);
  const waiting = roster.filter((e) => e.purpose !== 'ADVENTURE' && e.adult && identityOf(e)).length;
  const lootCount = Object.values(a.pending).reduce((n, v) => n + v, 0);
  const names = new Map(roster.map((r) => [r.key, r.name]));
  return {
    zones: zoneCards(world),
    prep: prepVms(world),
    prepSlots: techBonus(world, 'prepSlots'),
    fighters,
    waiting,
    starter: a.starterClaimed ? null : { label: vi.adventure.camp.claimStarter, reason: errorText(probe(world, run.starter, now)) },
    loot: lootCount > 0 ? { label: t(vi.adventure.camp.collectLoot, { count: lootCount }), reason: errorText(probe(world, run.loot, now)), count: lootCount } : null,
    formations: Array.from({ length: AB.team.formations }, (_, i) => {
      const keys = (a.formations[i]?.keys ?? []).filter((k) => fighters.some((f) => f.key === k));
      return { index: i, label: t(vi.adventure.camp.formationN, { n: i + 1 }), names: keys.length > 0 ? keys.map((k) => names.get(k) ?? k).join(', ') : vi.adventure.camp.formationEmpty, keys, usable: keys.length > 0 };
    }),
    leader: a.leader,
  };
}

/** What the chosen team should know before it sets off into a zone (§ proposal: team analysis). */
export function teamWarnings(team: readonly FighterCardVm[], zone: ZoneCardVm | undefined): string[] {
  if (team.length === 0 || !zone) return [];
  const out: string[] = [];
  if (!team.some((m) => m.heals)) out.push(vi.adventure.camp.warnNoHeal);
  if (team.length === 3 && !team.some((m) => m.tank)) out.push(vi.adventure.camp.warnNoTank);
  if (zone.hasDoom && !team.some((m) => m.cleansesDoom)) out.push(vi.adventure.camp.warnDoom);
  const mine = [...new Set(team.flatMap((m) => m.elementList))];
  const weak = mine.filter((el) => {
    const bad = zone.foeElements.filter((foe) => ['WEAK', 'RESIST', 'IMMUNE'].includes(ELEMENT_CHART.chart[el]?.[foe] ?? 'NEUTRAL')).length;
    return bad * 2 > zone.foeElements.length;
  });
  if (weak.length > 0 && weak.length === mine.length) out.push(t(vi.adventure.camp.warnWeak, { elements: weak.map(elementLabel).join(', ') }));
  return out;
}

/** Why this team cannot start the zone from `mapId`, or null. */
export function startReason(world: WorldSave, roster: readonly RosterEntry[], zoneId: string, mapId: string | undefined, keys: string[], now: number, prep: string[] = []): string | null {
  if (keys.length === 0) return vi.adventure.camp.pickTeam;
  return errorText(probe(world, (w, c) => startRun(w, { zoneId, mapId, keys, roster, prep }, c), now));
}

export function sweepReason(world: WorldSave, roster: readonly RosterEntry[], zoneId: string, keys: string[], now: number, prep: string[] = []): string | null {
  if (!adventureOf(world).cleared[zoneId]) return vi.adventure.camp.sweepLocked;
  if (keys.length === 0) return vi.adventure.camp.pickTeam;
  return errorText(probe(world, (w, c) => sweepZone(w, { zoneId, keys, roster, prep }, c), now));
}
