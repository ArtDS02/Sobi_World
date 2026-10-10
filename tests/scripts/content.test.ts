// Content files (ARCHITECTURE §8): stable layout (a dashboard save without changes is a no-op diff),
// generated ids in sync, readable errors for a bad file, ids never removed.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contentJson, hexColor } from '../../scripts/content/format';
import { IDS_FILE, idsText, listIn } from '../../scripts/content/ids';
import { speciesFileSchema } from '../../content/schemas/farm/species';
import { ContentError, loadContent } from '../../src/core/content/load';
import { CONTENT } from '../../src/core/config/content';
import { PLANNED_AREAS } from '../../src/core/config/plannedAreas';
import { FARM_CONTENT } from '../../src/areas/farm/logic/config/content';
import { AQUARIUM_CONTENT } from '../../src/areas/aquarium/logic/config/content';
import { GARDEN_CONTENT } from '../../src/areas/garden/logic/config/content';
import { PLAZA_LAYOUT } from '../../src/areas/plaza/logic/config/content';

const files = ['shared', 'breeding', 'farm', 'plaza', 'garden', 'aquarium', 'cloud', 'adventure'].flatMap((dir) =>
  readdirSync(`content/${dir}`)
    .filter((f) => f.endsWith('.json'))
    .map((f) => `content/${dir}/${f}`),
);

describe('content files', () => {
  it.each(files)('%s is in the stable layout', (file) => {
    const text = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    expect(contentJson(JSON.parse(text))).toBe(text);
  });

  it('every file loads (the game validates them at start)', () => {
    expect(Object.keys(CONTENT).length + Object.keys(FARM_CONTENT).length + Object.keys(GARDEN_CONTENT).length + Object.keys(AQUARIUM_CONTENT).length + [PLAZA_LAYOUT].length + PLANNED_AREAS.length).toBe(files.length);
  });

  it('ids.generated.ts is up to date (npm run content:ids)', () => {
    expect(readFileSync(IDS_FILE, 'utf8').replace(/\r\n/g, '\n')).toBe(idsText());
  });

  it('a removed id is refused; a new one is appended after the shipped ones', () => {
    const current = readFileSync(IDS_FILE, 'utf8');
    const extra = current.replace("export const ITEM_ID_VALUES = [\n", "export const ITEM_ID_VALUES = [\n  'ITEM_GONE',\n");
    expect(() => idsText(extra)).toThrow(/ITEM_GONE removed/);
    const shorter = current.replace("  'PIG_THOR',\n", '');
    expect(listIn(idsText(shorter), 'BREED_ID_VALUES').at(-1)).toBe('PIG_THOR');
  });

  it('a bad file names the file and the field', () => {
    const species = JSON.parse(readFileSync('content/farm/species.json', 'utf8')) as { species: { color: string }[] };
    species.species[0]!.color = 'pink';
    expect(() => loadContent('farm/species.json', speciesFileSchema, species)).toThrow(ContentError);
    try {
      loadContent('farm/species.json', speciesFileSchema, species);
    } catch (e) {
      expect((e as Error).message).toMatch(/content\/farm\/species\.json:\n {2}- species\.0\.color: colour/);
    }
  });

  it('colours are hex strings in the file and numbers in the game', () => {
    expect(hexColor(0xf7a8b8)).toBe('#f7a8b8');
    expect(FARM_CONTENT.species.species[0]!.color).toBe(0xf7a8b8);
  });
});
