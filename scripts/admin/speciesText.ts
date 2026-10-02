// Text generators for the species data the admin dashboard edits (DECISIONS A7-1). The output is
// the source the game imports, so it is formatted by hand: one row per line, fixed key order.
// Pure string functions (no fs) so they are unit-tested and shared by the dev API and seeding.

/** One species row as stored in src/core/config/speciesTable.ts (absent = rarity tier default). */
export interface SpeciesRowData {
  id: string;
  nameVi: string;
  rarity: string;
  family: string;
  buyGold?: number | null;
  unlockLevel?: number;
  sellGold?: number;
  growthSec?: number;
  pregnancySec?: number | null;
  maxWeight?: number;
  breedable?: boolean;
  enabled?: boolean;
  artId: string;
  color: number;
}

const OPTIONAL = [
  'buyGold',
  'unlockLevel',
  'sellGold',
  'growthSec',
  'pregnancySec',
  'maxWeight',
  'breedable',
  'enabled',
] as const;

const hex = (n: number) => `0x${n.toString(16).padStart(6, '0')}`;

/** `{ id: "X", nameVi: "…", … }` with optional fields only when set. */
export function speciesRowText(r: SpeciesRowData): string {
  const parts = [
    `id: ${JSON.stringify(r.id)}`,
    `nameVi: ${JSON.stringify(r.nameVi)}`,
    `rarity: ${JSON.stringify(r.rarity)}`,
    `family: ${JSON.stringify(r.family)}`,
  ];
  for (const key of OPTIONAL) {
    const v = r[key];
    if (v !== undefined) parts.push(`${key}: ${JSON.stringify(v)}`);
  }
  parts.push(`artId: ${JSON.stringify(r.artId)}`, `color: ${hex(r.color)}`);
  return `{ ${parts.join(', ')} }`;
}

/** The whole src/core/config/speciesTable.ts file. */
export function speciesTableText(rows: readonly SpeciesRowData[]): string {
  const lines = rows.map((r) => `  ${speciesRowText(r)},`);
  return [
    '// Species rows (UN_IN_PIG_CATALOGUE.md). Written by the admin dashboard (`npm run admin`,',
    '// DECISIONS A7-1); hand edits are fine if they keep one row per line. A missing stat = rarity tier.',
    "import type { SpeciesRow } from './breeds';",
    '',
    'export const SPECIES_ROWS: readonly SpeciesRow[] = [',
    ...lines,
    '];',
    '',
  ].join('\n');
}

/** Adds ids to the BREED_ID_VALUES list of src/core/config/ids.ts (ids already there are skipped). */
export function addBreedIdsText(text: string, ids: readonly string[]): string {
  const start = text.indexOf('export const BREED_ID_VALUES = [');
  if (start < 0) throw new Error('ids.ts: BREED_ID_VALUES not found');
  const end = text.indexOf('] as const;', start);
  const list = text.slice(start, end);
  const fresh = ids.filter((id) => !list.includes(`'${id}'`));
  if (fresh.length === 0) return text;
  const added = fresh.map((id) => `  '${id}',\n`).join('');
  return text.slice(0, end) + added + text.slice(end);
}

export interface PigManifestRow {
  id: string;
  nameVi: string;
  asset: string;
  tags: readonly string[];
}

/** Appends rows to the end of the manifest `pigs` array, in the file's own formatting. */
export function appendPigRowsText(text: string, rows: readonly PigManifestRow[]): string {
  if (rows.length === 0) return text;
  const start = text.indexOf('"pigs": [');
  if (start < 0) throw new Error('manifest: pigs section not found');
  const end = text.indexOf('\n  ],', start);
  const body = rows
    .map((r) =>
      [
        '    {',
        `      "id": ${JSON.stringify(r.id)},`,
        '      "status": "production",',
        `      "nameVi": ${JSON.stringify(r.nameVi)},`,
        '      "collection": "species",',
        `      "asset": ${JSON.stringify(r.asset)},`,
        '      "sleepAsset": null,',
        `      "tags": ${JSON.stringify(r.tags).replace(/","/g, '", "')}`,
        '    }',
      ].join('\n'),
    )
    .join(',\n');
  return `${text.slice(0, end)},\n${body}${text.slice(end)}`;
}
