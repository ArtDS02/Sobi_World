// The spots of an area where the party stands deepest in the woods (most forest in the rows in front of it): the places to check
// that the diorama never hides the party. Prints `x,y` tiles. Tooling only.
// Usage: npx tsx scripts/maps/denseSpots.ts [mapId] [count]
import { MAPS } from '../../src/areas/adventure/logic/config/content';
import { canStand } from '../../src/systems/character';
import { decksOf, gridOf, weightsAt } from '../../tools/admin/diorama/field';
import { walkOf } from '../../tools/admin/diorama/walk';

const map = MAPS[process.argv[2] ?? 'map_forest_edge']!;
const count = Number(process.argv[3] ?? 8);
const g = gridOf(map);
const walk = walkOf(map, g, decksOf(g));
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
console.log(picked.map((p) => `${p.x},${p.y}`).join(';'));
