import { simulateRuns } from '../../src/areas/adventure/logic/battleSim';
const [zone, gear, lv, ...team] = process.argv.slice(2);
const r = simulateRuns({ zoneId: zone!, level: Number(lv), team: team.map((archetypeId) => ({ archetypeId })), gear: gear as 'rare', samples: 200, seed: 4 });
console.log(team.join('+'), 'L' + lv, 'win', r.winPercent, 'reached', r.reachedPercent.join('/'), 'rounds', r.averageRounds);
