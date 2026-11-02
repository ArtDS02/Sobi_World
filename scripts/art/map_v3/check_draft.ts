// Checks v3 layout drafts (docs/maps/v3/<code>_layout_draft.json, from scripts/art/map_v3/*.py) with the game's own map rules, all at
// once since the drafts of a zone lead into each other: every draft in place of its live area, the live neighbours' arrivals moved to
// where the drafts say they land, then mapProblems on each draft and the map graph of the whole world. Reads only; maps.json is not
// touched. Usage: npx tsx scripts/art/map_v3/check_draft.ts M1 M3 N1 ...   (default M2)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MAP_LIST, MAPS, type AreaMap } from '../../../src/areas/adventure/logic/config/content';
import { mapGraphProblems } from '../../../src/areas/adventure/logic/mapGraph';
import { mapProblems } from '../../../src/areas/adventure/logic/maps';

const codes = process.argv.slice(2).length > 0 ? process.argv.slice(2) : ['M2'];
const drafts = codes.map((code) => ({
  code,
  ...(JSON.parse(readFileSync(join(process.cwd(), 'docs', 'maps', 'v3', `${code}_layout_draft.json`), 'utf8')) as {
    map: AreaMap;
    arrivals: Record<string, [number, number]>;
  }),
}));

for (const d of drafts) MAPS[d.map.id] = d.map;
// The live neighbours as they will be once their arrivals follow the drafts (MAPS is what mapProblems reads them from).
for (const d of drafts) {
  for (const [key, [x, y]] of Object.entries(d.arrivals)) {
    const [mapId, exitId] = key.split('/') as [string, string];
    const map = MAPS[mapId]!;
    MAPS[mapId] = {
      ...map,
      exits: map.exits.map((e) => (e.id === exitId ? { ...e, arriveX: x, arriveY: y } : e)),
    };
  }
}

let bad = 0;
for (const d of drafts) {
  const problems = mapProblems(d.map);
  let walk = 0;
  for (const row of d.map.terrain) walk += [...row].filter((c) => '.,=^sc'.includes(c)).length;
  const pct = Math.round((walk / (d.map.cols * d.map.rows)) * 100);
  console.log(`${d.code} ${d.map.id}: ${walk} walkable tiles (${pct} %)${problems.length === 0 ? ', clean' : ''}`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  bad += problems.length;
}
const graph = mapGraphProblems(MAP_LIST.map((m) => MAPS[m.id]!));
console.log(graph.length === 0 ? 'mapGraph: clean' : graph.map((p) => `  ✗ ${p}`).join('\n'));
process.exitCode = bad + graph.length === 0 ? 0 : 1;
