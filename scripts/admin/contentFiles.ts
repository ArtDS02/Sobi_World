// Content files the admin dashboard edits (ARCHITECTURE §8, §10): read, validated with the game's own
// schema (content/schemas, loaded through Vite at request time), written in the stable layout of
// scripts/content/format.ts so a dashboard save is a minimal diff. The game imports the same files.
import { readFileSync } from 'node:fs';
import { contentJson, hexColor } from '../content/format';
import { IDS_FILE, idsText, listIn } from '../content/ids';
import { writeText } from './artFiles';
import type { SpeciesRowData } from './speciesText';

export const CONTENT_FILE = {
  species: 'farm/species.json',
  breeding: 'farm/breeding.json',
  seasonFx: 'farm/season-fx.json',
  layout: 'farm/layout.json',
  shop: 'shared/shop.json',
  dayNight: 'shared/daynight.json',
} as const;

type Mod = Record<string, unknown>;
type Schema = { safeParse(v: unknown): { success: true } | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } } };

export const readContent = <T = Record<string, unknown>>(file: string): T =>
  JSON.parse(readFileSync(`content/${file}`, 'utf8')) as T;

/** Problems the game's schema finds in `value` for content/`file` (empty = valid). */
export function schemaProblems(schema: unknown, value: unknown): string[] {
  const r = (schema as Schema).safeParse(value);
  return r.success ? [] : r.error.issues.map((i) => `${i.path.join('.') || 'file'}: ${i.message}`);
}

/** Validates with `schemaPath`'s `exportName` (through `load`), then writes; the problems when invalid. */
export async function writeContent(
  load: (p: string) => Promise<Mod>,
  file: string,
  schemaPath: string,
  exportName: string,
  value: unknown,
): Promise<string[]> {
  const mod = await load(schemaPath);
  const problems = schemaProblems(mod[exportName], value);
  if (problems.length === 0) writeText(`content/${file}`, contentJson(value));
  return problems;
}

/** Ids saves may hold: the generated breed id list (release order, nothing ever removed). */
export const savedBreedIds = (): string[] => listIn(readFileSync(IDS_FILE, 'utf8'), 'BREED_ID_VALUES');

/** Regenerates content/schemas/ids.generated.ts after a species save (new ids appended). */
export const regenerateIds = () => writeText(IDS_FILE, idsText());
export const readIds = () => readFileSync(IDS_FILE, 'utf8');
export const writeIds = (text: string) => writeText(IDS_FILE, text);

const OPTIONAL = ['buyGold', 'unlockLevel', 'sellGold', 'growthSec', 'pregnancySec', 'maxWeight', 'breedable', 'enabled'] as const;

interface SpeciesFile {
  tiers: unknown;
  species: (Record<string, unknown> & { id: string; traits?: string[] })[];
}

/** species.json with `rows` (fixed key order), keeping the tiers and each species' traits. */
export function speciesFileValue(rows: readonly SpeciesRowData[], previous: SpeciesFile): SpeciesFile {
  const traits = new Map(previous.species.map((s) => [s.id, s.traits ?? []]));
  return {
    tiers: previous.tiers,
    species: rows.map((r) => {
      const row: Record<string, unknown> = { id: r.id, nameVi: r.nameVi, rarity: r.rarity, family: r.family };
      for (const k of OPTIONAL) if (r[k] !== undefined) row[k] = r[k];
      return { ...row, id: r.id, artId: r.artId, color: hexColor(r.color), traits: traits.get(r.id) ?? [] };
    }),
  };
}
