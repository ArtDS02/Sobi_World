// The Adventure's content files (content/adventure/*.json), validated once when first imported (ARCHITECTURE §8, core/content), and
// the tables built from them: the combat context (skills, statuses, reactions, element chart, rules), classes and skill trees, the nine
// Guardian lines, enemies, zones and their areas, props, equipment.
import areaRaw from '../../../../../content/adventure/area.json';
import balanceRaw from '../../../../../content/adventure/balance.json';
import classesRaw from '../../../../../content/adventure/classes.json';
import elementsRaw from '../../../../../content/adventure/elements.json';
import engagementRaw from '../../../../../content/adventure/engagement.json';
import enemiesRaw from '../../../../../content/adventure/enemies.json';
import equipmentRaw from '../../../../../content/adventure/equipment.json';
import lineagesRaw from '../../../../../content/adventure/lineages.json';
import mapsRaw from '../../../../../content/adventure/maps.json';
import propsRaw from '../../../../../content/adventure/props.json';
import reactionsRaw from '../../../../../content/adventure/reactions.json';
import skillsRaw from '../../../../../content/adventure/skills.json';
import statusesRaw from '../../../../../content/adventure/statuses.json';
import workshopRaw from '../../../../../content/adventure/workshop.json';
import zonesRaw from '../../../../../content/adventure/zones.json';
import { areaManifestSchema } from '../../../../../content/schemas/area';
import { adventureBalanceFileSchema } from '../../../../../content/schemas/adventure/balance';
import { classesFileSchema } from '../../../../../content/schemas/adventure/classes';
import { enemiesFileSchema } from '../../../../../content/schemas/adventure/enemies';
import { engagementFileSchema } from '../../../../../content/schemas/adventure/engagement';
import { equipmentFileSchema } from '../../../../../content/schemas/adventure/equipment';
import { lineagesFileSchema } from '../../../../../content/schemas/adventure/lineages';
import { mapsFileSchema, propsFileSchema } from '../../../../../content/schemas/adventure/maps';
import { elementsFileSchema, reactionsFileSchema, statusesFileSchema } from '../../../../../content/schemas/adventure/rules';
import { skillsFileSchema } from '../../../../../content/schemas/adventure/skills';
import { workshopFileSchema } from '../../../../../content/schemas/adventure/workshop';
import { zonesFileSchema } from '../../../../../content/schemas/adventure/zones';
import { loadContent } from '../../../../core/content/load';
import type { RosterEntry } from '../../../../core/area-registry/registry';
import { ITEMS } from '../../../../core/config/items';
import type { ItemId } from '../../../../core/config/ids';
import type { CombatContext } from '../../../../systems/combat';
import type { LevelRules, StatRules } from '../../../../systems/combat/stats';
import type { BattleItemDef, CombatRules, Element, ElementChart, Interaction, ReactionDef, SkillDef, StatusDef, StatusId } from '../../../../systems/combat/types';
import type { EquipmentDef } from '../../../../systems/equipment';

export const ADVENTURE_CONTENT = {
  area: loadContent('adventure/area.json', areaManifestSchema, areaRaw),
  balance: loadContent('adventure/balance.json', adventureBalanceFileSchema, balanceRaw),
  skills: loadContent('adventure/skills.json', skillsFileSchema, skillsRaw),
  elements: loadContent('adventure/elements.json', elementsFileSchema, elementsRaw),
  statuses: loadContent('adventure/statuses.json', statusesFileSchema, statusesRaw),
  reactions: loadContent('adventure/reactions.json', reactionsFileSchema, reactionsRaw),
  classes: loadContent('adventure/classes.json', classesFileSchema, classesRaw),
  lineages: loadContent('adventure/lineages.json', lineagesFileSchema, lineagesRaw),
  enemies: loadContent('adventure/enemies.json', enemiesFileSchema, enemiesRaw),
  zones: loadContent('adventure/zones.json', zonesFileSchema, zonesRaw),
  maps: loadContent('adventure/maps.json', mapsFileSchema, mapsRaw),
  props: loadContent('adventure/props.json', propsFileSchema, propsRaw),
  equipment: loadContent('adventure/equipment.json', equipmentFileSchema, equipmentRaw),
  engagement: loadContent('adventure/engagement.json', engagementFileSchema, engagementRaw),
  workshop: loadContent('adventure/workshop.json', workshopFileSchema, workshopRaw),
};

/** Experience books, the Adventure Shop and the Forge (adventure-big-update-1 §17). */
export const WORKSHOP = ADVENTURE_CONTENT.workshop;
export const TOMES: Readonly<Record<string, number>> = Object.fromEntries(WORKSHOP.tomes.map((t) => [t.itemId, t.exp]));

export const ADVENTURE_AREA_ID = ADVENTURE_CONTENT.area.id;
export const AB = ADVENTURE_CONTENT.balance;
export const HOUR_MS = 3_600_000;

// ---- Skills, statuses, elements -------------------------------------------------------------------------------------

export type SkillRow = (typeof ADVENTURE_CONTENT.skills.skills)[number];
export const SKILL_LIST: readonly SkillRow[] = ADVENTURE_CONTENT.skills.skills;
export const SKILLS: Readonly<Record<string, SkillDef & { nameVi: string; descVi: string }>> = Object.fromEntries(SKILL_LIST.map((s) => [s.id, s as SkillDef & { nameVi: string; descVi: string }]));

export const STATUS_LIST = ADVENTURE_CONTENT.statuses.statuses;
export const STATUSES = Object.fromEntries(STATUS_LIST.map((s) => [s.id, s])) as Record<StatusId, StatusDef & { nameVi: string; descVi: string }>;

export const REACTION_LIST = ADVENTURE_CONTENT.reactions.reactions;
export const REACTIONS = Object.fromEntries(REACTION_LIST.map((r) => [r.id, r]));

export const ELEMENT_LIST = ADVENTURE_CONTENT.elements.elements;
export const ELEMENT_NAMES = Object.fromEntries(ELEMENT_LIST.map((e) => [e.id, e])) as Record<Element, (typeof ELEMENT_LIST)[number]>;

const chart: ElementChart['chart'] = {};
for (const c of ADVENTURE_CONTENT.elements.chart) (chart[c.attacker] ??= {})[c.defender] = c.interaction as Interaction;
export const ELEMENT_CHART: ElementChart = {
  multipliers: ADVENTURE_CONTENT.elements.multipliers,
  chart,
  dualMin: ADVENTURE_CONTENT.elements.dualMin,
  dualMax: ADVENTURE_CONTENT.elements.dualMax,
};

export const COMBAT_RULES: CombatRules = AB.combat;
export const STAT_RULES: StatRules = { levelGrowth: AB.stats.levelGrowth, bondPerHeart: AB.stats.bondPerHeart };
export const LEVEL_RULES: LevelRules = { maxLevel: AB.levels.maxLevel, expBase: AB.levels.expBase, expExponent: AB.levels.expExponent };

export const BATTLE_ITEMS: Readonly<Record<string, BattleItemDef>> = Object.fromEntries(AB.battleItems.map((i) => [i.itemId, i]));

/** Everything the combat engine reads. */
export const COMBAT_CONTEXT: CombatContext = {
  skills: SKILLS,
  items: BATTLE_ITEMS,
  statuses: STATUSES,
  reactions: REACTION_LIST as readonly ReactionDef[],
  elements: ELEMENT_CHART,
  rules: COMBAT_RULES,
};

// ---- Classes, trees, lines ------------------------------------------------------------------------------------------

export const CLASS_LIST = ADVENTURE_CONTENT.classes.classes;
export type ClassId = (typeof CLASS_LIST)[number]['id'];
export type ClassRow = (typeof CLASS_LIST)[number];
export const CLASSES = Object.fromEntries(CLASS_LIST.map((c) => [c.id, c])) as Record<ClassId, ClassRow>;

export type TreeNode = (typeof ADVENTURE_CONTENT.classes.trees)[number]['nodes'][number];
export const TREES = Object.fromEntries(ADVENTURE_CONTENT.classes.trees.map((t) => [t.classId, t.nodes])) as unknown as Record<ClassId, readonly TreeNode[]>;
export const NODES: Readonly<Record<string, TreeNode & { classId: ClassId }>> = Object.fromEntries(
  ADVENTURE_CONTENT.classes.trees.flatMap((t) => t.nodes.map((n) => [n.id, { ...n, classId: t.classId }])),
);

export const LINEAGE_LIST = ADVENTURE_CONTENT.lineages.lineages;
export type LineageId = (typeof LINEAGE_LIST)[number]['id'];
export type Lineage = (typeof LINEAGE_LIST)[number];
export const LINEAGES = Object.fromEntries(LINEAGE_LIST.map((l) => [l.id, l])) as Record<LineageId, Lineage>;

/** What a creature of the roster is in a battle: its line, default class, elements, Unique skills and Ultimate. */
export interface Identity {
  lineage: Lineage;
  classId: ClassId;
  element: Element;
  element2: Element | null;
  unique: readonly string[];
  ultimate: string;
}

/** The identity of a creature of the roster, or undefined when it cannot fight (a fish species with no line). */
export function identityOf(entry: Pick<RosterEntry, 'kind' | 'speciesId' | 'family'>): Identity | undefined {
  const file = ADVENTURE_CONTENT.lineages;
  const own = entry.kind === 'fish' ? file.fish[entry.speciesId] : file.species[entry.speciesId];
  const family = entry.kind === 'pig' && entry.family ? (file.families as Record<string, { lineage: LineageId; classId: ClassId }>)[entry.family] : undefined;
  const lineageId = own?.lineage ?? family?.lineage;
  const classId = own?.classId ?? family?.classId;
  if (!lineageId || !classId) return undefined;
  const lineage = LINEAGES[lineageId];
  const unique = lineage.unique.map((id, i) => own?.unique?.[i] ?? id);
  return { lineage, classId, element: lineage.element, element2: own?.element2 ?? null, unique, ultimate: own?.ultimate ?? lineage.ultimate };
}

// ---- Enemies, zones, areas, props -------------------------------------------------------------------------------------

export const ENEMY_LIST = ADVENTURE_CONTENT.enemies.enemies;
export const ENEMIES = Object.fromEntries(ENEMY_LIST.map((e) => [e.id, e]));
export type Enemy = (typeof ENEMY_LIST)[number];

export const ZONE_LIST = ADVENTURE_CONTENT.zones.zones;
export const ZONES = Object.fromEntries(ZONE_LIST.map((z) => [z.id, z]));
export type Zone = (typeof ZONE_LIST)[number];
export const LOOT_TABLES = ADVENTURE_CONTENT.zones.tables;
export const EVENTS = Object.fromEntries(ADVENTURE_CONTENT.zones.events.map((e) => [e.id, e]));

export const MAP_LIST = ADVENTURE_CONTENT.maps.maps;
export type AreaMap = (typeof MAP_LIST)[number];
export type MapGroup = AreaMap['groups'][number];
export const MAPS = Object.fromEntries(MAP_LIST.map((m) => [m.id, m])) as Record<string, AreaMap>;

export const PROP_LIST = ADVENTURE_CONTENT.props.props;
export type PropRow = (typeof PROP_LIST)[number];
export const PROPS = Object.fromEntries(PROP_LIST.map((p) => [p.id, p])) as Record<string, PropRow>;

/** The zone an area belongs to. */
export const zoneOfMap = (mapId: string): Zone | undefined => ZONES[MAPS[mapId]?.zoneId ?? ''];

// ---- Equipment, rations ------------------------------------------------------------------------------------------

/** The equipment pieces: their slot, stats and affinities from content, their rarity from their item. */
export const EQUIPMENT_DEFS: Readonly<Record<string, EquipmentDef>> = Object.fromEntries(
  ADVENTURE_CONTENT.equipment.equipment.map((e) => [e.id, { ...e, rarity: ITEMS[e.id as ItemId].rarity } as EquipmentDef]),
);

/** The rations a party may carry, by item id (GĐ11). */
export const PREP_ITEMS: Readonly<Record<string, (typeof AB.prep)[number]>> = Object.fromEntries(AB.prep.map((p) => [p.itemId, p]));

export const SKILL_SCROLL = 'item_skill_scroll';

// ---- Engagement (decision 039) ------------------------------------------------------------------------------------------

export const ENGAGEMENT = ADVENTURE_CONTENT.engagement;
export type Affix = (typeof ENGAGEMENT.affixes)[number];
export const AFFIXES: Readonly<Record<string, Affix>> = Object.fromEntries(ENGAGEMENT.affixes.map((a) => [a.id, a]));
export const RIFT = ENGAGEMENT.rift;
export type RiftRule = (typeof RIFT.rules)[number];
export const RIFT_RULES: Readonly<Record<string, RiftRule>> = Object.fromEntries(RIFT.rules.map((r) => [r.id, r]));
export type Synergy = (typeof ENGAGEMENT.synergies)[number];
export type Title = (typeof ENGAGEMENT.titles)[number];
export const TITLES: Readonly<Record<string, Title>> = Object.fromEntries(ENGAGEMENT.titles.map((t) => [t.id, t]));
export type Tip = (typeof ENGAGEMENT.tips)[number];
export const TIP_OF_MAP: Readonly<Record<string, Tip>> = Object.fromEntries(ENGAGEMENT.tips.map((t) => [t.mapId, t]));

/** The zone each enemy is met in (the first area whose groups field it), for the Rift's scaling. */
export const ENEMY_ZONE: Readonly<Record<string, string>> = (() => {
  const out: Record<string, string> = {};
  for (const z of ZONE_LIST) for (const m of z.maps) for (const g of MAPS[m]?.groups ?? []) for (const p of g.pool) for (const e of p.enemies) out[e] ??= z.id;
  return out;
})();

// ---- Cross-file checks ------------------------------------------------------------------------------------------------

/** Cross-file references the schemas cannot check: skills of lines, trees and enemies, enemies of the areas, loot tables, events. */
export function contentProblems(): string[] {
  const problems: string[] = [];
  const need = (what: string, id: string, table: Record<string, unknown>) => {
    if (!table[id]) problems.push(`${what}: unknown ${id}`);
  };
  const skillOfType = (what: string, id: string, type: SkillDef['type']) => {
    need(what, id, SKILLS);
    if (SKILLS[id] && SKILLS[id]!.type !== type) problems.push(`${what}: ${id} is a ${SKILLS[id]!.type} skill, expected ${type}`);
  };
  for (const l of LINEAGE_LIST) {
    for (const s of l.unique) skillOfType(`line ${l.id}`, s, 'unique');
    skillOfType(`line ${l.id}`, l.ultimate, 'ultimate');
  }
  for (const [sp, row] of [...Object.entries(ADVENTURE_CONTENT.lineages.species), ...Object.entries(ADVENTURE_CONTENT.lineages.fish)]) {
    for (const s of row.unique ?? []) if (s) skillOfType(`species ${sp}`, s, 'unique');
    if (row.ultimate) skillOfType(`species ${sp}`, row.ultimate, 'ultimate');
  }
  for (const [classId, nodes] of Object.entries(TREES)) {
    for (const n of nodes) {
      skillOfType(`tree ${classId}`, n.skill, 'class');
      const max = SKILLS[n.skill]?.maxLevel ?? 1;
      if (n.upgradeCost.length !== max - 1) problems.push(`${n.id}: ${n.upgradeCost.length} upgrade costs for a skill of ${max} levels`);
    }
  }
  for (const e of ENEMY_LIST) {
    for (const s of e.skills) skillOfType(`enemy ${e.id}`, s, 'enemy');
    for (const p of e.phases) for (const s of p.addSkills) skillOfType(`enemy ${e.id}`, s, 'enemy');
  }
  for (const z of ZONE_LIST) for (const m of z.maps) {
    need(`zone ${z.id}`, m, MAPS);
    if (MAPS[m] && MAPS[m]!.zoneId !== z.id) problems.push(`${m} belongs to ${MAPS[m]!.zoneId}, listed in ${z.id}`);
  }
  for (const m of MAP_LIST) {
    need(`map ${m.id}`, m.zoneId, ZONES);
    for (const g of m.groups) {
      for (const p of g.pool) for (const e of p.enemies) need(`map ${m.id} group ${g.id}`, e, ENEMIES);
      if (g.table) need(`map ${m.id} group ${g.id}`, g.table, LOOT_TABLES);
    }
    for (const c of m.chests) need(`map ${m.id}`, c.table, LOOT_TABLES);
    for (const n of m.nodes) need(`map ${m.id}`, n.table, LOOT_TABLES);
    for (const n of m.npcs) need(`map ${m.id}`, n.event, EVENTS);
    for (const p of m.props) need(`map ${m.id}`, p.prop, PROPS);
    if (m.groups.filter((g) => g.kind === 'boss').length > 1) problems.push(`${m.id}: more than one boss`);
  }
  for (const z of ZONE_LIST) {
    const last = MAPS[z.maps.at(-1)!];
    if (last && !last.groups.some((g) => g.kind === 'boss')) problems.push(`${z.id}: its last area has no boss`);
  }
  for (const i of AB.battleItems) need('battle item', i.itemId, ITEMS);
  for (const e of ADVENTURE_CONTENT.equipment.equipment) if (ITEMS[e.id as ItemId].category !== 'EQUIPMENT') problems.push(`${e.id} is not an EQUIPMENT item`);
  need('skill scroll', SKILL_SCROLL, ITEMS);
  need('rift', RIFT.requiresCleared, ZONES);
  need('rift', RIFT.table, LOOT_TABLES);
  for (const z of ZONE_LIST) if (!RIFT.zoneScale[z.id]) problems.push(`rift: no zoneScale for ${z.id}`);
  for (const n of RIFT.nightmares) for (const e of [n.enemy, ...n.escort]) need(`rift floor ${n.floor}`, e, ENEMIES);
  for (const n of RIFT.nightmares) if (!ENEMY_ZONE[n.enemy]) problems.push(`rift floor ${n.floor}: ${n.enemy} is met in no zone`);
  for (const t of ENGAGEMENT.titles) {
    if (t.kind === 'boss' && t.target) need(`title ${t.id}`, t.target, ZONES);
    if (t.kind === 'nightmare' && t.target && !RIFT.nightmares.some((n) => n.enemy === t.target)) problems.push(`title ${t.id}: ${t.target} is no Nightmare boss`);
  }
  for (const t of ENGAGEMENT.tips) need(`tip ${t.id}`, t.mapId, MAPS);
  return problems;
}
