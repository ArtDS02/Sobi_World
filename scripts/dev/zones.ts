import { simulateRuns, type GearTier } from '../../src/areas/adventure/logic/battleSim';
const zone = process.argv[2] ?? 'zone_mountain';
const gear = (process.argv[3] ?? 'uncommon') as GearTier;
const prep = (process.argv[4] ?? '').split(',').filter(Boolean);
const samples = 120;
const teams: Record<string, string[]> = { classic: ['bruiser', 'guardian', 'mystic'], offense: ['pyromancer', 'skirmisher', 'stormcaller'], tank: ['guardian', 'brute', 'mystic'], mixed: ['trickster', 'brute', 'pyromancer'] };
const levels = [6, 8, 10, 12, 14, 16, 18, 20, 24];
console.log(zone, gear, prep.join('+'), '\n'.padEnd(1), 'team'.padEnd(9), levels.map((l) => `L${l}`.padStart(6)).join(''));
for (const [name, team] of Object.entries(teams)) {
  console.log(name.padEnd(10), levels.map((l) => String(simulateRuns({ zoneId: zone, level: l, team: team.map((archetypeId) => ({ archetypeId })), gear, prep, samples, seed: 9 }).winPercent).padStart(6)).join(''));
}
const r = simulateRuns({ zoneId: zone, level: 12, team: teams.classic!.map((archetypeId) => ({ archetypeId })), gear, prep, samples, seed: 9 });
console.log('classic L12 rounds', r.averageRounds, 'hpLeft', r.averageHpLeft, 'reached', r.reachedPercent.join('/'));
