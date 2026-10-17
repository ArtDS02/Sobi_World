// What a companion's card and profile show, as plain data (no DOM): level, experience, energy, Rage, SP; stats; its line's Unique skills
// and Ultimate; the class tree (open, upgradable, locked and why) and the loadout; its gear; the temple. Availability comes from
// dry-running the real action, so a disabled reason is always what dispatch would answer. Pure.
import type { RosterEntry } from '../../../core/area-registry/registry';
import type { ErrorCode } from '../../../core/config/errors';
import { techBonus } from '../../../core/config/tech';
import type { WorldSave } from '../../../core/save/world';
import { formatDuration, formatInt, t } from '../../../i18n/format';
import { vi } from '../../../i18n/vi';
import type { Element, SkillSlot, StatKey, Stats } from '../../../systems/combat/types';
import { EQUIPMENT_SLOTS, type EquipmentSlot } from '../../../systems/equipment';
import { fighterOf } from '../logic/actions/camp';
import { GUARDIAN_ART } from '../logic/art';
import { changeClass, classChangeCost, resetCost, resetTree, setLoadout, stepNode, useScroll } from '../logic/actions/growth';
import { AB, CLASS_LIST, EQUIPMENT_DEFS, NODES, SKILL_SCROLL, SKILLS, TREES, identityOf, type ClassId, type Identity } from '../logic/config/content';
import { classOf, energyOf, exhaustedLeft, expNeeded, fighterSkills, fighterStats, msToEnergy, whyNotReady } from '../logic/fighters';
import { adventureOf } from '../logic/save/lens';
import type { Fighter } from '../logic/state';
import { classLoadout, nodeLevel, stepCost } from '../logic/tree';
import { CLASS_ICON, ELEMENT_ICON, STAT_ORDER, bonusText, className, elementLabel, errorText, lineageName, nameOfItem, pct, probe, statName, statusName, type AdventureRun, type ButtonVm } from './vmKit';

export interface SkillVm {
  id: string;
  name: string;
  desc: string;
  element: Element | null;
  icon: string;
  cost: string;
  level: number;
  maxLevel: number;
  /** The level at which it opens; null when it is open. */
  opensAt: number | null;
}

export function skillVm(id: string, level = 1, opensAt: number | null = null, owner?: Element): SkillVm {
  const s = SKILLS[id]!;
  const element = s.element === 'SELF' ? (owner ?? null) : s.element;
  const mp = Math.max(0, Math.round(s.mpCost + (s.perLevel.mpCost ?? 0) * (level - 1)));
  return {
    id,
    name: s.nameVi,
    desc: s.descVi,
    element,
    icon: element ? ELEMENT_ICON[element] : '✧',
    cost: s.type === 'ultimate' ? '' : mp > 0 ? t(vi.adventure.sheet.skillLine, { mp, cooldown: s.cooldown }) : t(vi.adventure.sheet.skillFree, { cooldown: s.cooldown }),
    level,
    maxLevel: s.maxLevel,
    opensAt,
  };
}

export interface FighterCardVm {
  key: string;
  name: string;
  art: string;
  classId: ClassId;
  classLabel: string;
  lineLabel: string;
  elements: string;
  elementList: Element[];
  level: string;
  expPercent: number;
  expText: string;
  energyPercent: number;
  energyText: string;
  rageText: string;
  sp: number;
  /** Hearts of Bond as text. */
  hearts: string;
  /** Why it cannot go now; null = ready. */
  notReady: string | null;
  statusChip: string | null;
  /** Does it heal / is it a tank (team warnings). */
  heals: boolean;
  tank: boolean;
  cleansesDoom: boolean;
}

function reasonText(error: ErrorCode, entry: RosterEntry, f: Fighter, now: number, boost: number): string {
  if (error === 'FIGHTER_EXHAUSTED') return t(vi.adventure.card.exhaustedFor, { time: formatDuration(exhaustedLeft(f, now)) });
  if (error === 'NO_ADVENTURE_ENERGY') return t(vi.adventure.card.energyIn, { time: formatDuration(msToEnergy(f, now, AB.run.energyCost, boost)) });
  if (error === 'NOT_A_FIGHTER') return entry.adult ? vi.adventure.card.notAdventure : vi.adventure.card.notGrown;
  return vi.error[error];
}

const healsBy = (skills: readonly SkillSlot[]) => skills.some((s) => SKILLS[s.id]?.effects.some((e) => e.kind === 'heal' && !('to' in e && e.to === 'self')));
const cleansesDoomBy = (skills: readonly SkillSlot[]) => skills.some((s) => SKILLS[s.id]?.effects.some((e) => e.kind === 'cleanse' && e.doom));

export function fighterCardVm(world: WorldSave, entry: RosterEntry, now: number): FighterCardVm | null {
  const identity = identityOf(entry);
  if (!identity) return null;
  const a = adventureOf(world);
  const f = fighterOf(a, entry.key, now);
  const need = expNeeded(f);
  const boost = techBonus(world, 'adventureEnergy');
  const energy = energyOf(f, now, boost);
  const error = whyNotReady(entry, a.fighters[entry.key], now, boost);
  const classId = classOf(f, identity);
  const elementList = [identity.element, ...(identity.element2 ? [identity.element2] : [])];
  const skills = fighterSkills(f, identity);
  return {
    key: entry.key,
    name: entry.name,
    art: entry.artId,
    classId,
    classLabel: `${CLASS_ICON[classId]} ${className(classId)}`,
    lineLabel: lineageName(identity.lineage.id),
    elements: elementList.map(elementLabel).join(' · '),
    elementList,
    level: t(vi.adventure.card.level, { level: f.level }),
    expPercent: Number.isFinite(need) ? Math.min(100, Math.round((f.exp / need) * 100)) : 100,
    expText: Number.isFinite(need) ? t(vi.adventure.card.exp, { current: Math.floor(f.exp), next: need }) : vi.adventure.card.expMax,
    energyPercent: Math.round((energy / AB.run.energyMax) * 100),
    energyText: t(vi.adventure.card.energy, { current: Math.floor(energy), max: AB.run.energyMax }),
    rageText: t(vi.adventure.card.rage, { current: Math.round(f.rage), max: AB.rage.max }),
    sp: f.sp,
    hearts: '♥'.repeat(entry.hearts) + '♡'.repeat(Math.max(0, 5 - entry.hearts)),
    notReady: error ? reasonText(error, entry, f, now, boost) : null,
    statusChip: error === 'FIGHTER_EXHAUSTED' || error === 'FIGHTER_SICK' || error === 'NO_ADVENTURE_ENERGY' ? reasonText(error, entry, f, now, boost) : null,
    heals: healsBy(skills),
    tank: classId === 'tanker',
    cleansesDoom: cleansesDoomBy(skills),
  };
}

// ---- The profile -----------------------------------------------------------------------------------------------------

export interface NodeVm {
  id: string;
  tier: number;
  branch: 'core' | 'left' | 'right';
  skill: SkillVm;
  level: number;
  /** "Mở (2 SP)" / "Nâng cấp (1 SP)"; null when at the top. */
  step: ButtonVm | null;
  /** Names of the nodes it waits for (when closed and locked). */
  needs: string | null;
  carried: boolean;
  carry: ButtonVm | null;
}

export interface SlotVm {
  slot: EquipmentSlot;
  label: string;
  itemId: string | null;
  name: string | null;
  bonus: string | null;
}

export interface SheetVm {
  key: string;
  title: string;
  art: string;
  guardian: string;
  /** The portrait of the lineage's First Guardian. */
  guardianArt: string;
  elements: string;
  classId: ClassId;
  level: number;
  stats: { key: StatKey; name: string; value: number }[];
  unique: SkillVm[];
  ultimate: SkillVm;
  sp: number;
  spText: string;
  loadoutTitle: string;
  nodes: NodeVm[];
  slots: SlotVm[];
  scroll: ButtonVm | null;
  temple: { blocked: string | null; classes: (ButtonVm & { classId: ClassId })[]; reset: ButtonVm };
}

export function slotVms(loadout: Partial<Record<EquipmentSlot, string>>): SlotVm[] {
  return EQUIPMENT_SLOTS.map((slot) => {
    const itemId = loadout[slot] ?? null;
    const def = itemId ? EQUIPMENT_DEFS[itemId] : undefined;
    return { slot, label: vi.adventure.slot[slot], itemId, name: itemId ? nameOfItem(itemId) : null, bonus: def ? equipmentText(itemId!) : null };
  });
}

/** "+6 Công phép · Lửa +15% · Bỏng +5%" for a piece of equipment. */
export function equipmentText(itemId: string): string {
  const def = EQUIPMENT_DEFS[itemId];
  if (!def) return '';
  const parts = [bonusText(def.stats)];
  if (def.elementAffinity) parts.push(t(vi.adventure.affinity, { element: elementLabel(def.elementAffinity.element), pct: pct(def.elementAffinity.damagePct) }));
  if (def.statusAffinity) parts.push(`${statusName(def.statusAffinity.status)} +${pct(def.statusAffinity.chancePct)}%`);
  return parts.filter(Boolean).join(' · ');
}

export function sheetVm(world: WorldSave, entry: RosterEntry, now: number, roster: readonly RosterEntry[]): SheetVm | null {
  const identity: Identity | undefined = identityOf(entry);
  if (!identity) return null;
  const a = adventureOf(world);
  const f = fighterOf(a, entry.key, now);
  const classId = classOf(f, identity);
  const stats: Stats = fighterStats(f, entry, identity);
  const carried = new Set(classLoadout(f, classId).map((s) => s.id));
  const run = (r: AdventureRun) => errorText(probe(world, r, now));
  const nodes: NodeVm[] = TREES[classId].map((n) => {
    const level = nodeLevel(f, n);
    const cost = stepCost(f, n);
    const step: ButtonVm | null = cost === null ? null : { label: t(level === 0 ? vi.adventure.sheet.open : vi.adventure.sheet.upgrade, { cost }), reason: run((w, c) => stepNode(w, { key: entry.key, nodeId: n.id, roster }, c)) };
    const needs = level === 0 && n.requires.length > 0 ? n.requires.map((r) => `${SKILLS[NODES[r.node]!.skill]!.nameVi} ${r.level > 1 ? t(vi.adventure.sheet.nodeLevel, { level: r.level, max: SKILLS[NODES[r.node]!.skill]!.maxLevel }) : ''}`.trim()).join(' + ') : null;
    const isCarried = carried.has(n.skill);
    const next = isCarried ? [...carried].filter((id) => id !== n.skill) : [...carried, n.skill];
    const carry: ButtonVm | null = level === 0 ? null : { label: isCarried ? vi.adventure.sheet.drop : vi.adventure.sheet.carry, reason: run((w, c) => setLoadout(w, { key: entry.key, skills: next, roster }, c)) };
    return { id: n.id, tier: n.tier, branch: n.branch, skill: skillVm(n.skill, Math.max(1, level), null, identity.element), level, step, needs, carried: isCarried, carry };
  });
  const scrolls = world.inventory.items[SKILL_SCROLL] ?? 0;
  const blocked = a.run ? vi.adventure.sheet.templeRun : null;
  return {
    key: entry.key,
    title: t(vi.adventure.sheet.title, { name: entry.name, line: lineageName(identity.lineage.id), class: className(classId) }),
    art: entry.artId,
    guardian: t(vi.adventure.sheet.guardian, { guardian: identity.lineage.guardianVi }),
    guardianArt: GUARDIAN_ART[identity.lineage.id],
    elements: t(vi.adventure.sheet.elements, { elements: [identity.element, ...(identity.element2 ? [identity.element2] : [])].map(elementLabel).join(' · ') }),
    classId,
    level: f.level,
    stats: STAT_ORDER.map((k) => ({ key: k, name: statName(k), value: stats[k] })),
    unique: identity.unique.map((id, i) => skillVm(id, 1, f.level >= (AB.levels.uniqueUnlockLevels[i] ?? 99) ? null : (AB.levels.uniqueUnlockLevels[i] ?? 99), identity.element)),
    ultimate: skillVm(identity.ultimate, 1, null, identity.element),
    sp: f.sp,
    spText: t(vi.adventure.sheet.spLeft, { sp: f.sp }),
    loadoutTitle: t(vi.adventure.sheet.loadout, { count: carried.size, max: AB.tree.loadoutSlots }),
    nodes,
    slots: slotVms(f.loadout),
    scroll: scrolls > 0 ? { label: t(vi.adventure.sheet.scroll, { sp: AB.sp.scroll, have: scrolls }), reason: run((w, c) => useScroll(w, { key: entry.key, roster }, c)) } : null,
    temple: {
      blocked,
      classes: CLASS_LIST.filter((c) => c.id !== classId).map((c) => ({
        classId: c.id,
        label: t(vi.adventure.sheet.changeClass, { class: className(c.id), cost: formatInt(classChangeCost(f)) }),
        reason: run((w, ctx) => changeClass(w, { key: entry.key, classId: c.id, roster }, ctx)),
      })),
      reset: { label: resetCost(f) === 0 ? vi.adventure.sheet.resetFree : t(vi.adventure.sheet.reset, { cost: formatInt(resetCost(f)) }), reason: run((w, c) => resetTree(w, { key: entry.key, roster }, c)) },
    },
  };
}
