// What the Rift shows (decision 039 §3), as plain data: its card at the camp (the rule of the day, the record, why it is closed) and,
// between two floors, the floors cleared, the next one (a Nightmare waiting on it), the team's bars and the way out. Pure.
import type { RosterEntry } from '../../../core/area-registry/registry';
import type { WorldSave } from '../../../core/save/world';
import { formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import { AB, ENEMIES, ENEMY_LIST, ENEMY_ZONE, RIFT, RIFT_RULES, SKILLS, ZONES } from '../logic/config/content';
import { startRift } from '../logic/actions/rift';
import { nightmareAt, riftDay, riftOpen, ruleOfDay } from '../logic/rift';
import { adventureOf } from '../logic/save/lens';
import type { Run } from '../logic/state';
import type { ZoneCardVm } from './campVm';
import { errorText, pct, probe } from './vmKit';

/** The id the Rift's card takes among the zone cards. */
export const RIFT_CARD = 'rift';

const pctOf = (a: number, b: number) => (b <= 0 ? 0 : Math.round((a / b) * 100));

const riftEnemies = ENEMY_LIST.filter((e) => ENEMY_ZONE[e.id]);
const hasDoom = riftEnemies.some((e) => [...e.skills, ...e.phases.flatMap((p) => p.addSkills)].some((s) => SKILLS[s]?.effects.some((x) => x.kind === 'status' && x.status === 'doom')));

/** The Rift as a card among the zones: today's rule, the record, or what opens it. */
export function riftCard(world: WorldSave, now: number, dayOffsetMs = 0): ZoneCardVm {
  const a = adventureOf(world);
  const day = riftDay(now, dayOffsetMs);
  const rule = ruleOfDay(day);
  const top = RIFT.nightmares.at(-1)?.floor ?? 30;
  return {
    id: RIFT_CARD,
    name: vi.adventure.engage.rift.name,
    desc: t(vi.adventure.engage.rift.desc, { rule: rule.nameVi, desc: rule.descVi }),
    backdrop: RIFT.backdrop,
    locked: riftOpen(a) ? null : t(vi.adventure.engage.rift.locked, { zone: ZONES[RIFT.requiresCleared]?.nameVi ?? '' }),
    explored: t(vi.adventure.engage.rift.best, { floor: a.rift.best }),
    explorePct: Math.min(100, pctOf(a.rift.best, top)),
    cleared: a.rift.day === day && a.rift.dayBest > 0 ? t(vi.adventure.engage.rift.today, { floor: a.rift.dayBest }) : null,
    foes: '',
    foeElements: [...new Set(riftEnemies.filter((e) => !e.tags.includes('boss')).map((e) => e.element))],
    starts: [],
    hasDoom,
  };
}

/** Why this team cannot enter the Rift now, or null. */
export function riftReason(world: WorldSave, roster: readonly RosterEntry[], keys: string[], now: number, prep: string[] = []): string | null {
  if (!riftOpen(adventureOf(world))) return t(vi.adventure.engage.rift.locked, { zone: ZONES[RIFT.requiresCleared]?.nameVi ?? '' });
  if (keys.length === 0) return vi.adventure.camp.pickTeam;
  return errorText(probe(world, (w, c) => startRift(w, { keys, roster, prep }, c), now));
}

export interface RiftVm {
  title: string;
  cleared: string;
  rule: { name: string; desc: string };
  next: { label: string; nightmare: string | null; reason: string | null };
  hint: string;
  record: string;
  team: { key: string; name: string; art: string; hpText: string; hpPercent: number; mpPercent: number; ragePercent: number; down: boolean }[];
}

export function riftVm(world: WorldSave, run: Run): RiftVm | null {
  if (!run.rift) return null;
  const a = adventureOf(world);
  const rule = RIFT_RULES[run.rift.ruleId];
  const floor = run.rift.floor + 1;
  const nightmare = nightmareAt(floor);
  const standing = run.team.some((m) => m.hp > 0);
  return {
    title: vi.adventure.engage.rift.name,
    cleared: t(vi.adventure.engage.rift.cleared, { floor: run.rift.floor }),
    rule: { name: rule?.nameVi ?? '', desc: rule?.descVi ?? '' },
    next: {
      label: t(vi.adventure.engage.rift.next, { floor }),
      nightmare: nightmare ? t(vi.adventure.engage.rift.nightmare, { floor, name: nightmare.nameVi || (ENEMIES[nightmare.enemy]?.nameVi ?? '') }) : null,
      reason: standing ? null : vi.adventure.engage.rift.teamDown,
    },
    hint: t(vi.adventure.engage.rift.hint, { pct: pct(RIFT.restPct), every: RIFT.chestEvery }),
    record: t(vi.adventure.engage.rift.best, { floor: a.rift.best }),
    team: run.team.map((m) => ({
      key: m.key,
      name: m.name,
      art: m.art,
      hpText: `${formatInt(m.hp)}/${formatInt(m.stats.hp)}`,
      hpPercent: pctOf(m.hp, m.stats.hp),
      mpPercent: pctOf(m.mp, m.stats.mp),
      ragePercent: pctOf(m.rage, AB.rage.max),
      down: m.hp <= 0,
    })),
  };
}
