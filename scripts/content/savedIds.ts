// npx tsx scripts/content/savedIds.ts: writes tests/fixtures/adventure-saved-ids.json — every Adventure id a save may hold as the
// content stands (decision 047: areas, zones, chests, gates, exits, covers, puzzles, lore, the groups beaten for good). The test
// tests/unit/adventureBuilderSaves.test.ts keeps the content a superset of it. Run it again only to add ids, never to drop one.
import { readFileSync, writeFileSync } from 'node:fs';
import { savedMapIds } from '../admin/mapIds';
import { contentJson } from './format';

const FILE = 'tests/fixtures/adventure-saved-ids.json';
const maps = [...savedMapIds(JSON.parse(readFileSync('content/adventure/maps.json', 'utf8')))];
const zones = (JSON.parse(readFileSync('content/adventure/zones.json', 'utf8')) as { zones: { id: string }[] }).zones.map((z) => z.id);
let before: { maps: string[]; zones: string[] } = { maps: [], zones: [] };
try {
  before = JSON.parse(readFileSync(FILE, 'utf8')) as typeof before;
} catch {
  // First run.
}
const merge = (a: string[], b: string[]) => [...new Set([...a, ...b])].sort();
writeFileSync(
  FILE,
  contentJson({
    note: 'Ids a save may hold (decision 047, Map Builder GĐ8). The content may add ids, never drop one: tests/unit/adventureBuilderSaves.test.ts. Regenerate with scripts/content/savedIds.ts (it only adds).',
    maps: merge(before.maps, maps),
    zones: merge(before.zones, zones),
  }),
);
console.log(`${FILE}: ${maps.length} area ids, ${zones.length} zones`);
