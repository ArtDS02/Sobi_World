// The Adventure's content files (content/adventure/*.json), validated once when first imported (ARCHITECTURE §8,
// core/content), and the tables built from them.
import areaRaw from '../../../../../content/adventure/area.json';
import archetypesRaw from '../../../../../content/adventure/archetypes.json';
import balanceRaw from '../../../../../content/adventure/balance.json';
import enemiesRaw from '../../../../../content/adventure/enemies.json';
import equipmentRaw from '../../../../../content/adventure/equipment.json';
import skillsRaw from '../../../../../content/adventure/skills.json';
import zonesRaw from '../../../../../content/adventure/zones.json';
import { areaManifestSchema } from '../../../../../content/schemas/area';
import { archetypesFileSchema } from '../../../../../content/schemas/adventure/archetypes';
import { adventureBalanceFileSchema } from '../../../../../content/schemas/adventure/balance';
import { enemiesFileSchema } from '../../../../../content/schemas/adventure/enemies';
import { equipmentFileSchema } from '../../../../../content/schemas/adventure/equipment';
import { skillsFileSchema } from '../../../../../content/schemas/adventure/skills';
import { zonesFileSchema } from '../../../../../content/schemas/adventure/zones';
import { loadContent } from '../../../../core/content/load';
import type { RosterEntry } from '../../../../core/area-registry/registry';
import { ITEMS } from '../../../../core/config/items';
import type { ItemId } from '../../../../core/config/ids';
import type { BattleItemDef, CombatRules, SkillDef } from '../../../../systems/combat/types';
import type { CombatContext } from '../../../../systems/combat';
import type { LevelRules, StatRules } from '../../../../systems/combat/stats';
import type { EquipmentDef } from '../../../../systems/equipment';

export const ADVENTURE_CONTENT = {
  area: loadContent('adventure/area.json', areaManifestSchema, areaRaw),
  balance: loadContent('adventure/balance.json', adventureBalanceFileSchema, balanceRaw),
  skills: loadContent('adventure/skills.json', skillsFileSchema, skillsRaw),
  archetypes: loadContent('adventure/archetypes.json', archetypesFileSchema, archetypesRaw),
  enemies: loadContent('adventure/enemies.json', enemiesFileSchema, enemiesRaw),
  zones: loadContent('adventure/zones.json', zonesFileSchema, zonesRaw),
  equipment: loadContent('adventure/equipment.json', equipmentFileSchema, equipmentRaw),
};

export const ADVENTURE_AREA_ID = ADVENTURE_CONTENT.area.id;
export const AB = ADVENTURE_CONTENT.balance;
export const HOUR_MS = 3_600_000;

export const SKILL_LIST: readonly SkillDef[] = ADVENTURE_CONTENT.skills.skills;
export const SKILLS: Readonly<Record<string, SkillDef & { nameVi: string; descVi: string }>> = Object.fromEntries(ADVENTURE_CONTENT.skills.skills.map((s) => [s.id, s]));

export const ARCHETYPE_LIST = ADVENTURE_CONTENT.archetypes.archetypes;
export const ARCHETYPES = Object.fromEntries(ARCHETYPE_LIST.map((a) => [a.id, a]));
export type Archetype = (typeof ARCHETYPE_LIST)[number];

export const ENEMY_LIST = ADVENTURE_CONTENT.enemies.enemies;
export const ENEMIES = Object.fromEntries(ENEMY_LIST.map((e) => [e.id, e]));
export type Enemy = (typeof ENEMY_LIST)[number];

export const ZONE_LIST = ADVENTURE_CONTENT.zones.zones;
export const ZONES = Object.fromEntries(ZONE_LIST.map((z) => [z.id, z]));
export type Zone = (typeof ZONE_LIST)[number];
export type ZoneNode = Zone['nodes'][number];
export const LOOT_TABLES = ADVENTURE_CONTENT.zones.tables;
export const EVENTS = Object.fromEntries(ADVENTURE_CONTENT.zones.events.map((e) => [e.id, e]));

export const COMBAT_RULES: CombatRules = AB.combat;
export const STAT_RULES: StatRules = { levelGrowth: AB.stats.levelGrowth, bondPerHeart: AB.stats.bondPerHeart };
export const LEVEL_RULES: LevelRules = { maxLevel: AB.levels.maxLevel, expBase: AB.levels.expBase, expExponent: AB.levels.expExponent };

/** The equipment pieces: their slot and stats from content, their rarity from their item. */
export const EQUIPMENT_DEFS: Readonly<Record<string, EquipmentDef>> = Object.fromEntries(
  ADVENTURE_CONTENT.equipment.equipment.map((e) => [e.id, { id: e.id, slot: e.slot, rarity: ITEMS[e.id as ItemId].rarity, stats: e.stats }]),
);

export const BATTLE_ITEMS: Readonly<Record<string, BattleItemDef>> = Object.fromEntries(AB.battleItems.map((i) => [i.itemId, i]));

/** Everything the combat engine reads. */
export const COMBAT_CONTEXT: CombatContext = { skills: SKILLS, items: BATTLE_ITEMS, rules: COMBAT_RULES };

/** The fighting style of a creature of the roster, or undefined when it cannot fight (a species with no style). */
export function archetypeOf(entry: Pick<RosterEntry, 'kind' | 'speciesId' | 'family'>): Archetype | undefined {
  const file = ADVENTURE_CONTENT.archetypes;
  const id = entry.kind === 'fish' ? file.fish[entry.speciesId] : (file.species[entry.speciesId] ?? (entry.family ? (file.families as Record<string, string>)[entry.family] : undefined));
  return id ? ARCHETYPES[id] : undefined;
}

/** Cross-file references that the schemas cannot check: every skill an archetype or enemy uses exists, every enemy of a zone exists. */
export function contentProblems(): string[] {
  const problems: string[] = [];
  const need = (what: string, id: string, table: Record<string, unknown>) => {
    if (!table[id]) problems.push(`${what}: unknown ${id}`);
  };
  for (const a of ARCHETYPE_LIST) for (const s of a.skills) need(`archetype ${a.id}`, s, SKILLS);
  for (const e of ENEMY_LIST) for (const s of e.skills) need(`enemy ${e.id}`, s, SKILLS);
  for (const z of ZONE_LIST) {
    for (const n of z.nodes) {
      if (n.type === 'battle') for (const p of n.pool) for (const e of p.enemies) need(`zone ${z.id}`, e, ENEMIES);
      if (n.type === 'boss') for (const e of n.enemies) need(`zone ${z.id}`, e, ENEMIES);
    }
  }
  for (const i of AB.battleItems) need('battle item', i.itemId, ITEMS);
  for (const e of ADVENTURE_CONTENT.equipment.equipment) if (ITEMS[e.id as ItemId].category !== 'EQUIPMENT') problems.push(`${e.id} is not an EQUIPMENT item`);
  return problems;
}
