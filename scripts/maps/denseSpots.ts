// The spots of an area where the party stands deepest in the woods (most forest in the rows in front of it): the places to check
// that the diorama never hides the party. Prints `x,y;x,y…` tiles (one line per map with `--map all`, as `<mapId> <spots>`). Tooling only.
// Usage: npx tsx scripts/maps/denseSpots.ts [--map <mapId>|all] [--count 8]      (default map: map_forest_edge)
import { MAPS } from '../../src/areas/adventure/logic/config/content';
import { walkableOf } from '../../src/areas/adventure/logic/maps';
import { CONTRACT_IDS } from '../../src/areas/adventure/scene/diorama/contracts';
import { gridOf, weightsAt } from '../../src/areas/adventure/scene/diorama/field';
import { canStand } from '../../src/systems/character';

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1]! : fallback;
};
const which = arg('map', 'map_forest_edge');
const count = Number(arg('count', '8'));

function spotsOf(mapId: string): string {
  const map = MAPS[mapId]!;
  const g = gridOf(map);
  const walk = walkableOf(map);
  const spots: { x: number; y: number; score: number }[] = [];
  for (let y = 1; y < map.rows - 1; y += 1)
    for (let x = 1; x < map.cols - 1; x += 1) {
      if (!canStand({ x: (x + 0.5) * map.tile, y: (y + 0.5) * map.tile }, walk)) continue;
      let score = 0;
      for (let dz = 0.5; dz <= 3; dz += 0.5) for (let dx = -1.5; dx <= 1.5; dx += 0.5) score += weightsAt(g, x + 0.5 + dx, y + 0.5 + dz)[1];
      spots.push({ x, y, score });
    }
  spots.sort((a, b) => b.score - a.score);
  const picked: typeof spots = [];
  for (const s of spots) if (picked.length < count && picked.every((p) => Math.hypot(p.x - s.x, p.y - s.y) > 7)) picked.push(s);
  return picked.map((p) => `${p.x},${p.y}`).join(';');
}

if (which === 'all') for (const id of CONTRACT_IDS) console.log(`${id} ${spotsOf(id)}`);
else console.log(spotsOf(which));
