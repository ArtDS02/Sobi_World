// npm run perf:catchup (GĐ13): how long the world takes to catch up, on a late-game world a bot has built. Prints the
// time of one online step (the 1-second tick), of an offline catch-up of 1 / 7 / 30 days, the save size and the time
// to write and read it. Budgets: an online step under 5 ms, 30 days away under 3 s. Exits 1 when a budget is broken.
// Usage: npx tsx scripts/perf/catchup.ts [seed] [days of play]
import { performance } from 'node:perf_hooks';
import { AREAS } from '../../src/app/areas';
import { parseWorldSave } from '../../src/app/saveCodec';
import { mulberry32 } from '../../src/core/rng';
import { simulateWeek } from '../economy/week';

const DAY = 86_400_000;
const seed = Number(process.argv[2] ?? 7);
const days = Number(process.argv[3] ?? 45);
const BUDGET = { stepMs: 5, offline30Ms: 3000 };

const r = simulateWeek(seed, undefined, days, { forceAdventure: true });
const world = r.world;
const ms = (fn: () => void, times = 1): number => {
  let best = Infinity;
  for (let i = 0; i < times; i += 1) {
    const t0 = performance.now();
    fn();
    best = Math.min(best, performance.now() - t0);
  }
  return best;
};

const areas = Object.keys(world.areas).join(', ');
console.log(`World after ${days} days of play (seed ${seed}): level ${r.days.at(-1)?.level}, Areas: ${areas}`);

// One online step: the world advances by one second, as the store's tick does.
let state = world;
let now = r.end;
const rng = mulberry32(3);
const steps = 300;
const t0 = performance.now();
for (let i = 0; i < steps; i += 1) {
  now += 1000;
  state = AREAS.advance(state, now, rng, 0, 'online').state;
}
const step = (performance.now() - t0) / steps;
console.log(`online step (1 s of game time): ${step.toFixed(2)} ms average over ${steps} steps`);

const offline = (spanDays: number) => ms(() => void AREAS.advance(world, r.end + spanDays * DAY, mulberry32(5), 0, 'offline'), 3);
const o1 = offline(1);
const o7 = offline(7);
const o30 = offline(30);
console.log(`offline catch-up: 1 day ${o1.toFixed(0)} ms, 7 days ${o7.toFixed(0)} ms, 30 days ${o30.toFixed(0)} ms`);

const json = JSON.stringify(world);
const write = ms(() => void JSON.stringify(world), 5);
const read = ms(() => void parseWorldSave(json), 5);
console.log(`save: ${(json.length / 1024).toFixed(0)} KB; write ${write.toFixed(1)} ms, read + check ${read.toFixed(1)} ms`);

const broken: string[] = [];
if (step > BUDGET.stepMs) broken.push(`online step ${step.toFixed(2)} ms > ${BUDGET.stepMs} ms`);
if (o30 > BUDGET.offline30Ms) broken.push(`30 days away ${o30.toFixed(0)} ms > ${BUDGET.offline30Ms} ms`);
if (broken.length > 0) {
  console.error(`BUDGET BROKEN: ${broken.join('; ')}`);
  process.exit(1);
}
console.log('within budget');
