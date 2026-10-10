// Species rows as the admin dashboard edits them (DECISIONS A7-1; written to content/farm/species.json
// by contentFiles.ts) and the manifest rows of new pig art. Pure string functions (no fs), unit-tested.

/** One species row (absent = rarity tier default; colour as 0xRRGGBB). */
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
  /** Trait every pig of the species is born with, and its favourite food (GĐ7). */
  signatureTrait?: string;
  favorite?: string;
  artId: string;
  color: number;
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
