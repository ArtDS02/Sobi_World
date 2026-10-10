// npm run sim:week (GĐ6 step 9): a bot plays a week on the real game logic; the report says how fast coins and levels come
// and when the Garden opens, so a balance edit shows its effect on the pace. Usage: npm run sim:week [-- <seed> <days>]
import { simulateWeek } from './economy/week';

const seed = Number(process.argv[2] ?? 7);
const days = Number(process.argv[3] ?? 7);
const n0 = (v: number) => Math.round(v).toLocaleString('en-US');
const h1 = (v: number | null | undefined) => (v === null || v === undefined ? 'never' : `${v.toFixed(1)} h (day ${(v / 24 + 1).toFixed(1)})`);

const r = simulateWeek(seed, undefined, days);
console.log(`A bot plays ${days} days (3 sessions a day), seed ${seed}\n`);
console.log('day | coins    | gems | level | xp      | pigs/slots | shipped | board orders | daily goals | plots');
console.log('----|----------|------|-------|---------|------------|---------|--------------|-------------|------');
for (const d of r.days) {
  console.log(
    `${String(d.day).padStart(3)} | ${n0(d.coins).padStart(8)} | ${String(d.gems).padStart(4)} | ${String(d.level).padStart(5)} | ${n0(d.xp).padStart(7)} | ${`${d.pigs}/${d.slots}`.padStart(10)} | ${String(d.shipped).padStart(7)} | ${String(d.orders).padStart(12)} | ${String(d.goals).padStart(11)} | ${d.plots}`,
  );
}
console.log('\nTime to each world level');
for (const [level, hour] of Object.entries(r.levelAtHour)) console.log(`  level ${level.padStart(2)}: ${h1(hour)}`);
console.log(`\nSobi Garden opens: ${h1(r.gardenOpenAtHour)}`);
console.log('\nCoins by activity (+ in, - out)');
for (const [label, v] of Object.entries(r.ledger).sort((a, b) => b[1] - a[1])) console.log(`  ${label.padEnd(18)} ${n0(v).padStart(10)}`);
console.log(`\nAchievements claimed: ${r.achievementsClaimed}; Gems earned: ${r.gemsEarned}`);
