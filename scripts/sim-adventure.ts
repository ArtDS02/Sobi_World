// npm run sim:adventure (GĐ10 balance check): plays the Forest on the game's own combat rules for every archetype and team,
// so a balance edit shows its effect on archetype diversity. Usage: npm run sim:adventure [-- <samples> <seed>]
import { ARCHETYPES } from '../src/areas/adventure/logic/config/content';
import { simulateRuns, type GearTier } from '../src/areas/adventure/logic/battleSim';

const samples = Number(process.argv[2] ?? 300);
const seed = Number(process.argv[3] ?? 11);
const ids = Object.keys(ARCHETYPES);
const run = (team: string[], level: number, gear: GearTier) =>
  simulateRuns({ zoneId: 'zone_forest', level, team: team.map((archetypeId) => ({ archetypeId })), gear, samples, seed });

console.log('Win % of a full Forest run by team level (gear: common), team of 3 of the same style');
console.log('style'.padEnd(12), [1, 2, 3, 4, 5, 6, 8, 10].map((l) => `L${l}`.padStart(6)).join(''));
for (const id of ids) console.log(id.padEnd(12), [1, 2, 3, 4, 5, 6, 8, 10].map((l) => String(run([id, id, id], l, 'common').winPercent).padStart(6)).join(''));

for (const [level, gear] of [[3, 'none'], [4, 'common'], [6, 'common']] as const) {
  const rows = new Map<string, { sum: number; n: number; rounds: number; hp: number }>();
  let all = 0;
  let count = 0;
  let min = 101;
  let max = -1;
  for (let a = 0; a < ids.length; a += 1) for (let b = a + 1; b < ids.length; b += 1) for (let c = b + 1; c < ids.length; c += 1) {
    const r = run([ids[a]!, ids[b]!, ids[c]!], level, gear);
    all += r.winPercent; count += 1; min = Math.min(min, r.winPercent); max = Math.max(max, r.winPercent);
    for (const id of [ids[a]!, ids[b]!, ids[c]!]) {
      const row = rows.get(id) ?? { sum: 0, n: 0, rounds: 0, hp: 0 };
      row.sum += r.winPercent; row.n += 1; row.rounds += r.averageRounds; row.hp += r.averageHpLeft; rows.set(id, row);
    }
  }
  console.log(`\nAll ${count} teams of 3 distinct styles at level ${level}, gear ${gear}: mean win ${(all / count).toFixed(1)}%, worst ${min}%, best ${max}%`);
  for (const [id, r] of rows) console.log(`  ${id.padEnd(12)} in-team win ${(r.sum / r.n).toFixed(1).padStart(5)}%  rounds ${(r.rounds / r.n).toFixed(1)}  hp left ${(r.hp / r.n).toFixed(0)}%`);
}
