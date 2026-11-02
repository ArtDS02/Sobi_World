// Checks the live areas of content/adventure/maps.json with the game's own map rules after an import (import_v3.py): mapProblems
// on each named area (all areas when none is named) and the map graph of the whole world. Reads only.
// Usage: npx tsx scripts/art/map_v3/check_live.ts [map_mountain_foot ...]
import { MAP_LIST } from '../../../src/areas/adventure/logic/config/content';
import { mapGraphProblems } from '../../../src/areas/adventure/logic/mapGraph';
import { mapProblems } from '../../../src/areas/adventure/logic/maps';

const ids = process.argv.slice(2);
let bad = 0;
for (const map of MAP_LIST) {
  if (ids.length > 0 && !ids.includes(map.id)) continue;
  const problems = mapProblems(map);
  bad += problems.length;
  console.log(map.id, problems.length === 0 ? 'clean' : '');
  for (const p of problems) console.log('  !', JSON.stringify(p));
}
const graph = mapGraphProblems();
bad += graph.length;
console.log('map graph', graph.length === 0 ? 'clean' : '');
for (const p of graph) console.log('  !', JSON.stringify(p));
process.exitCode = bad > 0 ? 1 : 0;
