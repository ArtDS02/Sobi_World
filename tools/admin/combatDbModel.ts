// Combat Database (Admin "Dữ liệu chiến đấu"): one read-only view of every combat animal, monster and skill of Sobi Adventure, built
// from the game's own tables (content/adventure/*.json through the Adventure's content module, the Farm species and Aquarium fish
// rows, the rigs, battle_fx.json) and the asset manifest. Nothing here is a second copy of combat data: every number is read from, or
// computed by, the game's own functions (deriveStats, withClass). Pure, no DOM (tests/scripts/adminCombatDb.test.ts).
import { FARM_CONTENT } from '../../src/areas/farm/logic/config/content';
import { FISH_LIST } from '../../src/areas/aquarium/logic/config/content';
import {
  AB,
  ADVENTURE_CONTENT,
  BATTLE_FX,
  CLASSES,
  CLASS_LIST,
  ELEMENT_CHART,
  ELEMENT_LIST,
  ENEMY_LIST,
  ENGAGEMENT,
  LINEAGES,
  LINEAGE_LIST,
  MAP_LIST,
  RIFT,
  SKILLS,
  SKILL_LIST,
  STAT_RULES,
  STATUSES,
  TREES,
  ZONES,
  identityOf,
  type ClassId,
  type Enemy,
  type Lineage,
  type SkillRow,
} from '../../src/areas/adventure/logic/config/content';
import { GUARDIAN_ART } from '../../src/areas/adventure/logic/art';
import { rarityMultiplier } from '../../src/areas/adventure/logic/fighters';
import { corruptionOf, foeClass, withClass, type FoeClass } from '../../src/areas/adventure/logic/foes';
import { enemyInits } from '../../src/areas/adventure/logic/encounter';
import { bodyOf } from '../../src/areas/adventure/ui/motionProfiles';
import { RIGS } from '../../src/systems/animation';
import { deriveStats } from '../../src/systems/combat/stats';
import { STAT_KEYS, type Element, type Stats, type StatusId } from '../../src/systems/combat/types';

// ---- Pictures ------------------------------------------------------------------------------------------------------------

/** A manifest row as the page knows it. */
export interface ManifestRow {
  id: string;
  status?: string;
  url: string | null;
}

export type ArtState = 'production' | 'placeholder' | 'missing';

/** A picture an entity or skill points at: its manifest id, where it is, and whether it is final art, a placeholder or absent. */
export interface ArtInfo {
  id: string;
  url: string | null;
  state: ArtState;
}

export type ArtLookup = (id: string) => ArtInfo;

/** A lookup over the manifest rows: a row without a picture counts as missing (never another entity's picture). */
export function artLookup(rows: readonly ManifestRow[]): ArtLookup {
  const byId = new Map(rows.map((r) => [r.id, r]));
  return (id) => {
    const r = byId.get(id);
    if (!r || !r.url) return { id, url: null, state: 'missing' };
    return { id, url: r.url, state: r.status === 'placeholder' ? 'placeholder' : 'production' };
  };
}

// ---- Shapes ---------------------------------------------------------------------------------------------------------------

export type DataStatus = 'complete' | 'incomplete' | 'placeholder';

/** One line of an entity's completeness checklist. `required` checks decide the status; the others are notes. */
export interface Check {
  key: string;
  label: string;
  ok: boolean;
  required: boolean;
  detail?: string;
}

/** How an entity holds a skill. */
export type SkillRole =
  | 'line' // a Unique skill of its Guardian line (every animal of the line shares it unless it carries its own in that slot)
  | 'own' // a Unique skill of its own species (overrides the line's in that slot)
  | 'ultimate-line'
  | 'ultimate-own'
  | 'class' // a Class skill of its default class's tree (every animal of the class can learn it)
  | 'enemy-own' // an enemy skill only this monster has
  | 'enemy-shared' // an enemy skill several monsters have
  | 'phase' // added when a boss phase starts
  | 'corruption'; // given to any monster above its class's corruption level

export interface SkillUse {
  skillId: string;
  role: SkillRole;
  /** Unique slot 0–3, and the level that opens it. */
  slot?: number;
  unlockLevel?: number;
  /** Class skills: where the node sits and what it costs (SP). */
  node?: { id: string; tier: number; branch: string; unlockCost: number; upgradeCost: readonly number[]; starter: boolean; requires: readonly string[] };
  /** Phase skills: the HP share under which the phase starts. */
  hpBelow?: number;
  /** Corruption skills: the corruption level that gives it. */
  corruption?: number;
}

export interface Appearance {
  mapId: string;
  mapName: string;
  zoneId: string;
  zoneName: string;
  groupId: string;
  kind: FoeClass;
  corruption: number;
  sleep: boolean;
  when: string | null;
  disguise: string | null;
}

/** The monster as one group class / corruption level makes it in battle (the game's own withClass). */
export interface ScaledStats {
  kind: FoeClass;
  corruption: number;
  stats: Stats;
  element2: Element | null;
  extraSkills: string[];
  count: number;
}

export interface AnimationInfo {
  /** The puppet (content/anim/rigs) drawn in battle; null = key poses or the plain picture. */
  rig: string | null;
  body: string;
  /** The body plan is declared in battle_fx.json (else the game's default for its kind). */
  bodyDeclared: boolean;
  /** Old key-pose pictures `cb_<art>_<pose>` (combat sprites). */
  poses: ArtInfo[];
}

interface EntityBase {
  id: string;
  name: string;
  art: ArtInfo;
  element: Element;
  element2: Element | null;
  stats: Stats;
  animation: AnimationInfo;
  skills: SkillUse[];
  checks: Check[];
  status: DataStatus;
}

export interface CombatAnimal extends EntityBase {
  kind: 'animal';
  source: 'farm' | 'aquarium';
  rarity: string;
  rarityMult: number;
  family: string | null;
  lineage: { id: string; name: string; guardian: string; desc: string; art: ArtInfo };
  classId: ClassId;
  /** Line pairs that resonate when both are in the party (engagement.json → synergies). */
  synergies: { id: string; name: string; desc: string; lines: string[] }[];
  /** The skills: Unique slots (line or own), the Ultimate, the default class's tree. */
  unique: SkillUse[];
  ultimate: SkillUse;
  common: SkillUse[];
}

export interface Monster extends EntityBase {
  kind: 'monster';
  tags: string[];
  boss: boolean;
  /** The group classes it is met as (maps; `escort` = in a boss group without being the boss), plus `nightmare` for a Rift Nightmare boss. */
  types: string[];
  /** Its strongest type (FOE_TYPE_ORDER), '' = met nowhere. */
  mainType: string;
  /** Variants a normal group may roll (engagement.json → affixes); empty when it is never met as a normal group. */
  affixes: { id: string; name: string; desc: string }[];
  appearances: Appearance[];
  nightmareFloors: number[];
  escortFloors: number[];
  scaled: ScaledStats[];
  statusResist: Partial<Record<StatusId, number>>;
  statusImmune: StatusId[];
  elementOverrides: Partial<Record<Element, string>>;
  phases: Enemy['phases'];
  exp: number;
  coins: number;
  drops: Enemy['drops'];
}

export type Entity = CombatAnimal | Monster;

export interface SkillUser {
  kind: 'animal' | 'monster';
  id: string;
  name: string;
  role: SkillRole;
}

export type Sharing = 'own' | 'shared' | 'unused';

export interface SkillEntry {
  id: string;
  row: SkillRow;
  icon: ArtInfo;
  /** battle_fx.json → skills[id]: its own staged look (timing, 3D effects, sounds). */
  fx: { has: boolean; vfx3d: string[]; sounds: string[]; timing: { release: number; impact: number; end: number } | null; cues: number };
  statuses: StatusId[];
  users: SkillUser[];
  sharing: Sharing;
  /** Given by corruption (every monster above its class's level), whatever monsters list it. */
  corruptionLevel: number | null;
}

export interface CombatDb {
  animals: CombatAnimal[];
  monsters: Monster[];
  skills: SkillEntry[];
  /** Skill ids the game lists but no entity, tree or rule references. */
  unusedSkills: string[];
  /** Data that does not agree between files (reported, never fixed here). */
  inconsistencies: string[];
}

// ---- Labels from content --------------------------------------------------------------------------------------------------

export const elementName = (e: string | null | undefined): string =>
  !e ? 'Không hệ' : e === 'SELF' ? 'Theo hệ người dùng' : (ELEMENT_LIST.find((x) => x.id === e)?.nameVi ?? e);
/** The element's colour in battle (battle_fx.json → elements, stored as a number), as a CSS hex. */
export function elementColor(e: string | null | undefined): string | null {
  const n = e ? (BATTLE_FX.elements as Record<string, { color?: number } | undefined>)[e]?.color : undefined;
  return typeof n === 'number' ? `#${n.toString(16).padStart(6, '0')}` : null;
}
export const className = (c: string): string => (CLASSES as Record<string, { nameVi: string }>)[c]?.nameVi ?? c;
export const foeTypeName = (k: string): string =>
  k === 'nightmare' ? 'Trùm Ác Mộng (Vết Nứt)' : k === 'escort' ? 'Hộ tống trùm' : k === '' ? 'Chưa đặt trên map' : ((AB.foes.classes as Record<string, { nameVi: string }>)[k]?.nameVi ?? k);
export const statusName = (s: string): string => (STATUSES as Record<string, { nameVi: string }>)[s]?.nameVi ?? s;

/** Strongest first: what a monster "is" when it is met as several classes. */
export const FOE_TYPE_ORDER: readonly string[] = ['boss', 'subboss', 'special', 'elite', 'mutant', 'normal', 'escort', 'nightmare', ''];

export const STAT_ORDER = STAT_KEYS;

// ---- Effects in words -----------------------------------------------------------------------------------------------------

const pct = (n: number) => `${Math.round(n * 1000) / 10}%`;
const toWho = (to: string | undefined) => (to === 'self' ? ' (bản thân)' : to === 'allies' ? ' (cả đội)' : to === 'foes' ? ' (phe địch)' : '');

/** One effect of a skill in plain words (the engine's own meaning: resolve.ts). */
export function effectText(e: SkillRow['effects'][number]): string {
  switch (e.kind) {
    case 'heal':
      return `Hồi ${pct(e.pct)} máu tối đa của mục tiêu${toWho(e.to)}`;
    case 'shield':
      return `Khiên bằng ${pct(e.pct)} máu tối đa người dùng${toWho(e.to)}`;
    case 'status':
      return `${statusName(e.status)}${e.turns ? ` ${e.turns} lượt` : ''}${e.chance !== undefined ? ` (tỉ lệ ${pct(e.chance)})` : ''}${toWho(e.to)}`;
    case 'cleanse':
      return `Xoá ${e.count ? `${e.count}` : 'mọi'} trạng thái xấu${e.doom ? ', cả Diệt Vong' : ''}${toWho(e.to)}`;
    case 'dispel':
      return `Gỡ ${e.count ? `${e.count}` : 'mọi'} hiệu ứng tốt${toWho(e.to)}`;
    case 'clearAll':
      return 'Xoá mọi trạng thái trên sân';
    case 'mp':
      return `${e.amount >= 0 ? '+' : ''}${e.amount} MP${toWho(e.to)}`;
    case 'rage':
      return `${e.amount >= 0 ? '+' : ''}${e.amount} Nộ${toWho(e.to)}`;
    case 'revive':
      return `Hồi sinh với ${pct(e.pct)} máu`;
  }
}

/** What the skill mainly does: damage, healing, a shield, statuses, or a mix. */
export function skillEffectKind(s: SkillRow): string[] {
  const out: string[] = [];
  if (s.power > 0) out.push('damage');
  for (const e of s.effects) {
    const k = e.kind === 'status' ? (STATUSES[e.status]?.positive ? 'buff' : 'debuff') : e.kind === 'shield' ? 'shield' : e.kind === 'heal' || e.kind === 'revive' ? 'heal' : 'utility';
    if (!out.includes(k)) out.push(k);
  }
  return out;
}

export const EFFECT_KIND_LABEL: Record<string, string> = { damage: 'Sát thương', heal: 'Hồi máu', shield: 'Khiên', buff: 'Tăng sức', debuff: 'Gây hiệu ứng xấu', utility: 'Tiện ích' };

// ---- Building ---------------------------------------------------------------------------------------------------------------

function animationOf(art: string, look: ArtLookup, poseIds: readonly string[]): AnimationInfo {
  const rig = RIGS.has(art) ? art : null;
  const prefix = `cb_${art}_`;
  return {
    rig,
    body: bodyOf(art),
    bodyDeclared: !!(BATTLE_FX.creatures as Record<string, unknown>)[art],
    poses: poseIds.filter((id) => id.startsWith(prefix)).map(look),
  };
}

function statusOf(art: ArtInfo, checks: readonly Check[]): DataStatus {
  if (art.state !== 'production') return 'placeholder';
  return checks.every((c) => c.ok || !c.required) ? 'complete' : 'incomplete';
}

function commonChecks(art: ArtInfo, animation: AnimationInfo, skillIds: readonly string[], look: ArtLookup): Check[] {
  const unknown = skillIds.filter((id) => !SKILLS[id]);
  const noFx = skillIds.filter((id) => SKILLS[id] && !BATTLE_FX.skills[id]);
  const noIcon = skillIds.filter((id) => look(`ui_${id}`).state === 'missing');
  return [
    { key: 'art', label: 'Ảnh đại diện (manifest)', ok: art.state === 'production', required: true, detail: art.state === 'missing' ? `Thiếu ${art.id}` : art.state === 'placeholder' ? `${art.id} là placeholder` : undefined },
    {
      key: 'motion',
      label: 'Rig hoặc key pose trận',
      ok: !!animation.rig || animation.poses.some((p) => p.state !== 'missing'),
      required: true,
      detail: !animation.rig && animation.poses.length === 0 ? 'Chưa có rig (content/anim/rigs) và chưa có key pose cb_*: trận dùng ảnh tĩnh' : undefined,
    },
    { key: 'skills', label: 'Mọi skill có trong skills.json', ok: unknown.length === 0, required: true, detail: unknown.length ? unknown.join(', ') : undefined },
    { key: 'fx', label: 'Mọi skill có animation riêng (battle_fx.json)', ok: noFx.length === 0, required: true, detail: noFx.length ? noFx.join(', ') : undefined },
    { key: 'icons', label: 'Mọi skill có icon riêng (ui_<skill>)', ok: noIcon.length === 0, required: false, detail: noIcon.length ? `${noIcon.length} skill dùng icon nguyên tố thay thế: ${noIcon.join(', ')}` : undefined },
  ];
}

function buildAnimals(look: ArtLookup, poseIds: readonly string[], problems: string[]): CombatAnimal[] {
  const file = ADVENTURE_CONTENT.lineages;
  const out: CombatAnimal[] = [];
  const farm = new Map<string, (typeof FARM_CONTENT.species.species)[number]>(FARM_CONTENT.species.species.map((s) => [s.id, s]));
  const fish = new Map(FISH_LIST.map((f) => [f.id, f]));
  const rows: { id: string; kind: 'pig' | 'fish' }[] = [...Object.keys(file.species).map((id) => ({ id, kind: 'pig' as const })), ...Object.keys(file.fish).map((id) => ({ id, kind: 'fish' as const }))];
  for (const { id, kind } of rows) {
    const src = kind === 'pig' ? farm.get(id) : fish.get(id);
    if (!src) {
      problems.push(`lineages.json lists ${id}, which is not a ${kind === 'pig' ? 'Farm species' : 'Aquarium fish'}`);
      continue;
    }
    if (!src.fighter) problems.push(`${id} is in lineages.json but its ${kind === 'pig' ? 'species.json' : 'fish.json'} row has no fighter flag`);
    const artId = 'artId' in src ? src.artId : src.art;
    const identity = identityOf({ kind: kind === 'pig' ? 'pig' : 'fish', speciesId: id, family: 'family' in src ? src.family : 'WATER' } as Parameters<typeof identityOf>[0]);
    if (!identity) continue;
    const own = kind === 'pig' ? file.species[id]! : file.fish[id]!;
    const rarityMult = rarityMultiplier(src.rarity);
    const stats = deriveStats(CLASSES[identity.classId].stats, { level: 1, rarityMult, hearts: 0 }, STAT_RULES);
    const unique: SkillUse[] = identity.unique.map((skillId, slot) => ({
      skillId,
      role: own.unique?.[slot] ? 'own' : 'line',
      slot,
      unlockLevel: AB.levels.uniqueUnlockLevels[slot],
    }));
    const ultimate: SkillUse = { skillId: identity.ultimate, role: own.ultimate ? 'ultimate-own' : 'ultimate-line' };
    const common: SkillUse[] = (TREES[identity.classId] ?? []).map((n) => ({
      skillId: n.skill,
      role: 'class',
      node: { id: n.id, tier: n.tier, branch: n.branch, unlockCost: n.unlockCost, upgradeCost: n.upgradeCost, starter: n.starter, requires: n.requires.map((r) => `${r.node} Lv${r.level}`) },
    }));
    const art = look(artId);
    const animation = animationOf(artId, look, poseIds);
    const skills = [...unique, ultimate, ...common];
    const checks = commonChecks(art, animation, skills.map((s) => s.skillId), look);
    out.push({
      kind: 'animal',
      id,
      name: src.nameVi,
      source: kind === 'pig' ? 'farm' : 'aquarium',
      rarity: src.rarity,
      rarityMult,
      family: 'family' in src ? src.family : null,
      art,
      lineage: { id: identity.lineage.id, name: identity.lineage.nameVi, guardian: identity.lineage.guardianVi, desc: identity.lineage.descVi, art: look(GUARDIAN_ART[identity.lineage.id]) },
      classId: identity.classId,
      synergies: ENGAGEMENT.synergies.filter((x) => x.lineages.includes(identity.lineage.id)).map((x) => ({ id: x.id, name: x.nameVi, desc: x.descVi, lines: [...x.lineages] })),
      element: identity.element,
      element2: identity.element2,
      stats,
      animation,
      unique,
      ultimate,
      common,
      skills,
      checks,
      status: statusOf(art, checks),
    });
  }
  // A body plan written under an id no creature draws with (e.g. a species id where the game looks up its art id).
  const arts = new Set([...out.map((a) => a.art.id), ...ENEMY_LIST.map((e) => e.art)]);
  for (const key of Object.keys(BATTLE_FX.creatures)) if (!arts.has(key)) problems.push(`battle_fx.json creatures.${key}: no combat animal or monster draws with this art id (its body plan is never used)`);
  return out;
}

const mapName = (id: string) => MAP_LIST.find((m) => m.id === id)?.nameVi ?? id;

function buildMonsters(look: ArtLookup, poseIds: readonly string[]): Monster[] {
  const appear = new Map<string, Appearance[]>();
  for (const m of MAP_LIST) {
    for (const g of m.groups) {
      const enemies = new Set(g.pool.flatMap((p) => p.enemies));
      for (const e of enemies) {
        const list = appear.get(e) ?? [];
        list.push({
          mapId: m.id,
          mapName: m.nameVi,
          zoneId: m.zoneId,
          zoneName: ZONES[m.zoneId]?.nameVi ?? m.zoneId,
          groupId: g.id,
          kind: g.kind,
          corruption: corruptionOf(g),
          sleep: !!g.sleep,
          when: g.when ?? null,
          disguise: g.disguise ?? null,
        });
        appear.set(e, list);
      }
    }
  }
  const enemyCount = new Map<string, number>();
  for (const e of ENEMY_LIST) for (const s of new Set([...e.skills, ...e.phases.flatMap((p) => p.addSkills)])) enemyCount.set(s, (enemyCount.get(s) ?? 0) + 1);
  return ENEMY_LIST.map((e) => {
    const appearances = appear.get(e.id) ?? [];
    const nightmareFloors = RIFT.nightmares.filter((n) => n.enemy === e.id).map((n) => n.floor);
    const escortFloors = RIFT.nightmares.filter((n) => n.escort.includes(e.id)).map((n) => n.floor);
    // A boss group's pool also fields escorts: a monster without the boss flag met in a boss group is an escort (it still gets the boss
    // class's numbers in battle, see `scaled`).
    const typeOf = (k: string) => (k === 'boss' && !e.boss ? 'escort' : k);
    const types = [...new Set([...appearances.map((a) => typeOf(a.kind)), ...(nightmareFloors.length ? ['nightmare'] : [])])].sort((a, b) => FOE_TYPE_ORDER.indexOf(a) - FOE_TYPE_ORDER.indexOf(b));
    // The battle stats of each group class / corruption it is met as: the game's own withClass on the game's own enemy row.
    const seen = new Map<string, ScaledStats>();
    for (const a of appearances) {
      const key = `${a.kind}|${a.corruption}`;
      const hit = seen.get(key);
      if (hit) {
        hit.count += 1;
        continue;
      }
      const group = { kind: a.kind, corruption: a.corruption };
      const [init] = withClass(enemyInits([e.id]), group);
      seen.set(key, { kind: a.kind, corruption: a.corruption, stats: init!.stats, element2: init!.element2 ?? null, extraSkills: (init!.skills ?? []).map((s) => s.id).filter((id) => !e.skills.includes(id)), count: 1 });
    }
    const corruptionSkills = new Set<string>();
    for (const s of seen.values()) for (const id of s.extraSkills) corruptionSkills.add(id);
    const skills: SkillUse[] = [
      ...e.skills.map((skillId) => ({ skillId, role: ((enemyCount.get(skillId) ?? 0) > 1 ? 'enemy-shared' : 'enemy-own') as SkillRole })),
      ...e.phases.flatMap((p) => p.addSkills.map((skillId) => ({ skillId, role: 'phase' as const, hpBelow: p.hpBelow }))),
      ...[...corruptionSkills].map((skillId) => ({ skillId, role: 'corruption' as const, corruption: AB.foes.corruption.findIndex((l) => l.skill === skillId) + 1 })),
    ];
    const art = look(e.art);
    const animation = animationOf(e.art, look, poseIds);
    const checks = commonChecks(art, animation, skills.map((s) => s.skillId), look);
    checks.push({
      key: 'placed',
      label: 'Được đặt trên map hoặc Vết Nứt',
      ok: appearances.length > 0 || nightmareFloors.length > 0 || escortFloors.length > 0,
      required: true,
      detail: appearances.length || nightmareFloors.length || escortFloors.length ? undefined : 'Chỉ khai báo trong enemies.json, chưa nhóm quái nào dùng',
    });
    return {
      kind: 'monster' as const,
      id: e.id,
      name: e.nameVi,
      art,
      element: e.element,
      element2: e.element2 ?? null,
      tags: [...e.tags],
      boss: !!e.boss,
      types,
      mainType: types[0] ?? '',
      affixes: types.includes('normal') ? ENGAGEMENT.affixes.map((a) => ({ id: a.id, name: a.nameVi, desc: a.descVi })) : [],
      appearances,
      nightmareFloors,
      escortFloors,
      scaled: [...seen.values()].sort((a, b) => FOE_TYPE_ORDER.indexOf(a.kind) - FOE_TYPE_ORDER.indexOf(b.kind) || a.corruption - b.corruption),
      stats: e.stats,
      animation,
      skills,
      statusResist: e.statusResist,
      statusImmune: [...e.statusImmune],
      elementOverrides: e.elementOverrides,
      phases: e.phases,
      exp: e.exp,
      coins: e.coins,
      drops: e.drops,
      checks,
      status: statusOf(art, checks),
    };
  });
}

function buildSkills(animals: readonly CombatAnimal[], monsters: readonly Monster[], look: ArtLookup): SkillEntry[] {
  const users = new Map<string, SkillUser[]>();
  const add = (skillId: string, u: SkillUser) => {
    const list = users.get(skillId) ?? [];
    if (!list.some((x) => x.kind === u.kind && x.id === u.id && x.role === u.role)) list.push(u);
    users.set(skillId, list);
  };
  for (const a of animals) for (const s of a.skills) add(s.skillId, { kind: 'animal', id: a.id, name: a.name, role: s.role });
  for (const m of monsters) for (const s of m.skills) if (s.role !== 'corruption') add(s.skillId, { kind: 'monster', id: m.id, name: m.name, role: s.role });
  for (const m of monsters) for (const s of m.skills) if (s.role === 'corruption') add(s.skillId, { kind: 'monster', id: m.id, name: m.name, role: 'corruption' });
  return SKILL_LIST.map((row) => {
    const own = (BATTLE_FX.skills as Record<string, { timing?: { release: number; impact: number; end: number }; script?: { do: string; fx?: string; sound?: string }[] }>)[row.id];
    const script = own?.script ?? [];
    const list = users.get(row.id) ?? [];
    const corruption = AB.foes.corruption.findIndex((l) => l.skill === row.id);
    const distinct = new Set(list.map((u) => `${u.kind}:${u.id}`)).size;
    return {
      id: row.id,
      row,
      icon: look(`ui_${row.id}`),
      fx: {
        has: !!own,
        vfx3d: [...new Set(script.filter((c) => c.do === 'vfx3d' && c.fx).map((c) => c.fx!))],
        sounds: [...new Set(script.filter((c) => c.do === 'sound' && c.sound).map((c) => c.sound!))],
        timing: own?.timing ?? null,
        cues: script.length,
      },
      statuses: [...new Set(row.effects.flatMap((e) => (e.kind === 'status' ? [e.status] : [])))],
      users: list,
      sharing: distinct === 0 && corruption < 0 ? 'unused' : distinct === 1 && corruption < 0 ? 'own' : 'shared',
      corruptionLevel: corruption >= 0 ? corruption + 1 : null,
    } satisfies SkillEntry;
  });
}

/** The whole database from the game's tables and the manifest rows (`poseIds`: every manifest id, for the `cb_<art>_<pose>` key poses). */
export function buildCombatDb(rows: readonly ManifestRow[]): CombatDb {
  const look = artLookup(rows);
  const poseIds = rows.map((r) => r.id).filter((id) => id.startsWith('cb_'));
  const inconsistencies: string[] = [];
  const animals = buildAnimals(look, poseIds, inconsistencies);
  const monsters = buildMonsters(look, poseIds);
  const skills = buildSkills(animals, monsters, look);
  // Farm / Aquarium rows flagged as fighters that no line takes.
  const listed = new Set([...Object.keys(ADVENTURE_CONTENT.lineages.species), ...Object.keys(ADVENTURE_CONTENT.lineages.fish)]);
  for (const s of FARM_CONTENT.species.species) if (s.fighter && !listed.has(s.id)) inconsistencies.push(`${s.id} has the fighter flag but no line in lineages.json`);
  for (const f of FISH_LIST) if (f.fighter && !listed.has(f.id)) inconsistencies.push(`${f.id} has the fighter flag but no line in lineages.json`);
  // Rigs that no combat creature draws with.
  const drawn = new Set([...animals.map((a) => a.art.id), ...monsters.map((m) => m.art.id)]);
  for (const id of RIGS.keys()) if (!drawn.has(id)) inconsistencies.push(`rig ${id}: no combat animal or monster has this art id (not used in battle)`);
  const unusedSkills = skills.filter((s) => s.sharing === 'unused').map((s) => s.id);
  for (const id of unusedSkills) inconsistencies.push(`${id} (${SKILLS[id]!.type}) is declared in skills.json but no entity, tree or corruption level uses it`);
  return { animals, monsters, skills, unusedSkills, inconsistencies };
}

// ---- Element chart ------------------------------------------------------------------------------------------------------------

export interface Affinity {
  element: Element;
  interaction: string;
  mult: number;
}

const interactionOf = (attacker: string, defender: string): string => ELEMENT_CHART.chart[attacker as Element]?.[defender as Element] ?? 'NEUTRAL';

/** What an element does attacking each element, and what each element does to it (only the rows that are not neutral). */
export function affinities(el: Element, overrides: Partial<Record<Element, string>> = {}): { attack: Affinity[]; defend: Affinity[] } {
  const ids = ELEMENT_LIST.map((e) => e.id as Element);
  const mult = (i: string) => (ELEMENT_CHART.multipliers as Record<string, number>)[i] ?? 1;
  const attack = ids.map((d) => ({ element: d, interaction: interactionOf(el, d), mult: mult(interactionOf(el, d)) })).filter((a) => a.interaction !== 'NEUTRAL');
  const defend = ids
    .map((a) => {
      const i = overrides[a] ?? interactionOf(a, el);
      return { element: a, interaction: i, mult: mult(i) };
    })
    .filter((a) => a.interaction !== 'NEUTRAL');
  return { attack, defend };
}

/** Level-N stats of an animal (no gear, no Bond): the game's own formula. */
export const animalStatsAt = (a: Pick<CombatAnimal, 'classId' | 'rarityMult'>, level: number, classId: ClassId = a.classId): Stats =>
  deriveStats(CLASSES[classId].stats, { level, rarityMult: a.rarityMult, hearts: 0 }, STAT_RULES);

export const MAX_LEVEL = AB.levels.maxLevel;
export const CLASS_IDS: readonly ClassId[] = CLASS_LIST.map((c) => c.id);
export const LINE_LIST: readonly Lineage[] = LINEAGE_LIST;
export const lineName = (id: string): string => (LINEAGES as Record<string, Lineage>)[id]?.nameVi ?? id;
export const mapLabel = mapName;
export { foeClass };

// ---- Filtering and sorting ------------------------------------------------------------------------------------------------------

export interface EntityQuery {
  q: string;
  classId: string;
  element: string;
  lineage: string;
  rarity: string;
  type: string;
  zone: string;
  tag: string;
  status: string;
  skill: string;
  skillType: string;
  sort: string;
  desc: boolean;
}

export const emptyEntityQuery = (): EntityQuery => ({ q: '', classId: '', element: '', lineage: '', rarity: '', type: '', zone: '', tag: '', status: '', skill: '', skillType: '', sort: 'name', desc: false });

const RARITY_ORDER = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];
const matches = (q: string, ...fields: readonly (string | undefined)[]) => {
  const t = q.trim().toLowerCase();
  return !t || fields.some((f) => (f ?? '').toLowerCase().includes(t));
};

/** Every filter at once (an empty field = no filter on it). */
export function entityPasses(e: Entity, f: EntityQuery): boolean {
  if (!matches(f.q, e.name, e.id, e.art.id)) return false;
  if (f.element && e.element !== f.element && e.element2 !== f.element) return false;
  if (f.status && e.status !== f.status) return false;
  if (f.skill && !e.skills.some((s) => s.skillId === f.skill)) return false;
  if (f.skillType && !e.skills.some((s) => SKILLS[s.skillId]?.type === f.skillType)) return false;
  if (e.kind === 'animal') {
    if (f.classId && e.classId !== f.classId) return false;
    if (f.lineage && e.lineage.id !== f.lineage) return false;
    if (f.rarity && e.rarity !== f.rarity) return false;
  } else {
    if (f.type && !(f.type === 'none' ? e.types.length === 0 : e.types.includes(f.type))) return false;
    if (f.zone && !e.appearances.some((a) => a.zoneId === f.zone)) return false;
    if (f.tag && !e.tags.includes(f.tag)) return false;
  }
  return true;
}

const elementRank = (e: string) => ELEMENT_LIST.findIndex((x) => x.id === e);

function sortKey(e: Entity, key: string): number | string {
  if (STAT_KEYS.includes(key as keyof Stats)) return e.stats[key as keyof Stats];
  switch (key) {
    case 'element':
      return elementRank(e.element);
    case 'class':
      return e.kind === 'animal' ? CLASS_IDS.indexOf(e.classId) : FOE_TYPE_ORDER.indexOf(e.mainType);
    case 'type':
      return e.kind === 'monster' ? FOE_TYPE_ORDER.indexOf(e.mainType) : 0;
    case 'rarity':
      return e.kind === 'animal' ? RARITY_ORDER.indexOf(e.rarity) : 0;
    case 'skills':
      return e.skills.length;
    case 'id':
      return e.id;
    default:
      return e.name;
  }
}

/** Filtered then sorted; ties break by name, so the order is always the same. */
export function queryEntities<T extends Entity>(list: readonly T[], f: EntityQuery): T[] {
  const dir = f.desc ? -1 : 1;
  return list
    .filter((e) => entityPasses(e, f))
    .sort((a, b) => {
      const x = sortKey(a, f.sort);
      const y = sortKey(b, f.sort);
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'vi');
      return c * dir || a.name.localeCompare(b.name, 'vi') || a.id.localeCompare(b.id);
    });
}

export interface SkillQuery {
  q: string;
  type: string;
  element: string;
  category: string;
  target: string;
  sharing: string;
  status: string;
  effect: string;
  fx: string;
  icon: string;
  sort: string;
  desc: boolean;
}

export const emptySkillQuery = (): SkillQuery => ({ q: '', type: '', element: '', category: '', target: '', sharing: '', status: '', effect: '', fx: '', icon: '', sort: 'name', desc: false });

export function skillPasses(s: SkillEntry, f: SkillQuery): boolean {
  if (!matches(f.q, s.row.nameVi, s.id, s.row.descVi)) return false;
  if (f.type && s.row.type !== f.type) return false;
  if (f.element && (s.row.element ?? 'NONE') !== f.element) return false;
  if (f.category && s.row.category !== f.category) return false;
  if (f.target && s.row.target !== f.target) return false;
  if (f.sharing && s.sharing !== f.sharing) return false;
  if (f.status && !s.statuses.includes(f.status as StatusId)) return false;
  if (f.effect && !skillEffectKind(s.row).includes(f.effect)) return false;
  if (f.fx === 'yes' && !s.fx.has) return false;
  if (f.fx === 'no' && s.fx.has) return false;
  if (f.icon === 'yes' && s.icon.state === 'missing') return false;
  if (f.icon === 'no' && s.icon.state !== 'missing') return false;
  return true;
}

const TYPE_ORDER = ['unique', 'ultimate', 'class', 'enemy'];

export function querySkills(list: readonly SkillEntry[], f: SkillQuery): SkillEntry[] {
  const dir = f.desc ? -1 : 1;
  const key = (s: SkillEntry): number | string => {
    switch (f.sort) {
      case 'type':
        return TYPE_ORDER.indexOf(s.row.type);
      case 'element':
        return s.row.element ? elementRank(s.row.element) : 99;
      case 'power':
        return s.row.power * s.row.hits;
      case 'mp':
        return s.row.mpCost;
      case 'cooldown':
        return s.row.cooldown;
      case 'users':
        return s.users.length;
      case 'id':
        return s.id;
      default:
        return s.row.nameVi;
    }
  };
  return list
    .filter((s) => skillPasses(s, f))
    .sort((a, b) => {
      const x = key(a);
      const y = key(b);
      const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'vi');
      return c * dir || a.row.nameVi.localeCompare(b.row.nameVi, 'vi') || a.id.localeCompare(b.id);
    });
}

// ---- Dashboard ------------------------------------------------------------------------------------------------------------------

export interface DbSummary {
  animals: number;
  monsters: number;
  skills: number;
  skillsByType: Record<string, number>;
  classes: number;
  elements: number;
  lines: number;
  statuses: number;
  incomplete: number;
  placeholder: number;
  missingArt: number;
}

export function summarize(db: CombatDb): DbSummary {
  const all: Entity[] = [...db.animals, ...db.monsters];
  const skillsByType: Record<string, number> = {};
  for (const s of db.skills) skillsByType[s.row.type] = (skillsByType[s.row.type] ?? 0) + 1;
  return {
    animals: db.animals.length,
    monsters: db.monsters.length,
    skills: db.skills.length,
    skillsByType,
    classes: CLASS_LIST.length,
    elements: ELEMENT_LIST.length,
    lines: LINEAGE_LIST.length,
    statuses: Object.keys(STATUSES).length,
    incomplete: all.filter((e) => e.status !== 'complete').length,
    placeholder: all.filter((e) => e.status === 'placeholder').length,
    missingArt: all.filter((e) => e.art.state === 'missing').length,
  };
}
