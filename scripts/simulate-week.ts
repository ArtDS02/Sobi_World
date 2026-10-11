// npm run sim:week (GĐ6 step 9): a bot plays a week on the real game logic; the report says how fast coins and levels come
// and when the Garden opens, so a balance edit shows its effect on the pace. Usage: npm run sim:week [-- <seed> <days> [adventure]] ("adventure" opens the Adventure at Sobi World level 8, skipping World Development 20)
import { simulateWeek } from './economy/week';

const seed = Number(process.argv[2] ?? 7);
const days = Number(process.argv[3] ?? 7);
const n0 = (v: number) => Math.round(v).toLocaleString('en-US');
const h1 = (v: number | null | undefined) => (v === null || v === undefined ? 'never' : `${v.toFixed(1)} h (day ${(v / 24 + 1).toFixed(1)})`);

const forceAdventure = process.argv[4] === 'adventure';
const r = simulateWeek(seed, undefined, days, { forceAdventure });
console.log(`A bot plays ${days} days (3 sessions a day), seed ${seed}\n`);
console.log('day | coins    | gems | level | xp      | pigs/slots | shipped | board orders | daily goals | plots | fish | casts | fish sold | fighter lv | runs | techs | cogs | runes');
console.log('----|----------|------|-------|---------|------------|---------|--------------|-------------|-------|------|-------|-----------|------------|------|-------|------|------');
for (const d of r.days) {
  console.log(
    `${String(d.day).padStart(3)} | ${n0(d.coins).padStart(8)} | ${String(d.gems).padStart(4)} | ${String(d.level).padStart(5)} | ${n0(d.xp).padStart(7)} | ${`${d.pigs}/${d.slots}`.padStart(10)} | ${String(d.shipped).padStart(7)} | ${String(d.orders).padStart(12)} | ${String(d.goals).padStart(11)} | ${String(d.plots).padStart(5)} | ${String(d.fish).padStart(4)} | ${String(d.casts).padStart(5)} | ${String(d.fishSold).padStart(9)} | ${String(d.advLevel).padStart(10)} | ${String(d.advRuns).padStart(4)} | ${String(d.techs).padStart(5)} | ${String(d.cogs).padStart(4)} | ${String(d.runes).padStart(5)}`,
  );
}
console.log('\nTime to each world level');
for (const [level, hour] of Object.entries(r.levelAtHour)) console.log(`  level ${level.padStart(2)}: ${h1(hour)}`);
console.log(`\nSobi Garden opens: ${h1(r.gardenOpenAtHour)}`);
console.log(`Sobi Aquarium opens: ${h1(r.aquariumOpenAtHour)}; fish illnesses ${r.fishSick}, fish lost ${r.fishDied}`);
console.log(`Sobi Cloud opens: ${h1(r.cloudOpenAtHour)}; flowers picked ${r.flowersHarvested}, potions brewed ${r.potionsBrewed}`);
const adv = r.adventure;
console.log(`Sobi Adventure opens: ${h1(adv.openAtHour)}; ${adv.runs} runs (${adv.wins} cleared, ${adv.losses} lost), boss kills ${JSON.stringify(adv.clears)}, eggs hatched ${adv.eggsHatched}, rations eaten ${adv.rationsEaten}`);
console.log(`First boss kills: ${Object.entries(adv.firstClearAtHour).map(([z, h]) => `${z} @ day ${(h / 24 + 1).toFixed(1)}`).join(', ') || 'none'}`);
console.log(`Technologies: ${Object.entries(adv.techAtHour).map(([k, h]) => `${k} @ day ${(h / 24 + 1).toFixed(1)}`).join(', ') || 'none'}`);
console.log('Bag at the end:', Object.entries(r.bag).filter(([, n]) => n > 0).map(([k, n]) => `${k.replace('item_', '')} ${n}`).join(', '));
if (Object.keys(r.pendingLoot).length > 0) console.log('Loot still waiting:', JSON.stringify(r.pendingLoot));
console.log('\nCoins by activity (+ in, - out)');
for (const [label, v] of Object.entries(r.ledger).sort((a, b) => b[1] - a[1])) console.log(`  ${label.padEnd(18)} ${n0(v).padStart(10)}`);
console.log(`\nAchievements claimed: ${r.achievementsClaimed}; Gems earned: ${r.gemsEarned}`);
