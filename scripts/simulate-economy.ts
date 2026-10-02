// npm run sim:economy (spec §14.7): per-breed economy table, unlock affordability, and the
// build gate "net gold per hour at happiness 100 >= 2x at happiness 0". Imports only src/core.
import { BALANCE } from '../src/core/config/balance';
import { ACHIEVEMENTS } from '../src/core/config/achievements';
import { DAILY } from '../src/core/config/daily';
import { DECORS } from '../src/core/config/decor';
import { BREED_ID_VALUES } from '../src/core/config/ids';
import { ITEMS } from '../src/core/config/items';
import {
  CARE_RATIO_MIN,
  breedEconomy,
  gateFailures,
  hoursToAfford,
  stallGrowth,
} from './economy/model';

const n0 = (v: number) => Math.round(v).toLocaleString('en-US');
const n1 = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : '∞');

function table(head: string[], rows: string[][]): string {
  const widths = head.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i]!.length)));
  const line = (cells: string[]) => cells.map((c, i) => c.padStart(widths[i]!)).join(' | ');
  return [line(head), widths.map((w) => '-'.repeat(w)).join('-|-'), ...rows.map(line)].join('\n');
}

const rows = BREED_ID_VALUES.map(breedEconomy);
console.log('Breeds (net gold/h per slot = (sell - acquire - food) / growth hours)\n');
console.log(
  table(
    ['breed', 'sell', 'growth h', 'food', 'food $', 'acquire', 'h=0', 'h=50', 'h=100', 'x', 'gate'],
    rows.map((r) => [
      r.breed,
      n0(r.sellGold),
      n1(r.growthHours),
      String(r.food),
      n0(r.foodCost),
      n0(r.acquire),
      n0(r.perHour[0]),
      n0(r.perHour[50]),
      n0(r.perHour[100]),
      r.careRatio.toFixed(2),
      r.gated ? 'yes' : 'info',
    ]),
  ),
);
console.log(`\nPINK empty-trough stall: ${stallGrowth('PIG_EARTH_PINK').toFixed(2)}% growth`);

console.log('\nSlot unlocks (hours of PINK at happiness 100 on the slots already open)\n');
console.log(
  table(
    ['slot', 'level', 'cost', 'hours'],
    Object.entries(BALANCE.SLOT_UNLOCKS).map(([slot, u]) => [
      slot,
      String(u.level),
      n0(u.cost),
      n1(hoursToAfford(u.cost, Number(slot) - 1)),
    ]),
  ),
);


// PG-2 / PG-3: free gold (daily, achievements) against the gold sink (decorations).
const food = ITEMS.FOOD_BASIC.priceGold;
const dailyWeek = DAILY.REWARDS.reduce(
  (n, r) => n + r.gold + r.food * food + r.medicine * ITEMS.MEDICINE_COMMON.priceGold,
  0,
);
const achievementGold = ACHIEVEMENTS.reduce((n, a) => n + a.gold, 0);
const decors = Object.values(DECORS);
const decorCost = decors.reduce((n, d) => n + d.priceGold, 0);
const decorBonus = decors.reduce((n, d) => n + d.happyBonus, 0);
console.log('\nFree gold and sinks (DECISIONS PG-2, PG-3)\n');
console.log(
  table(
    ['source', 'gold', 'PINK hours (1 slot, h=100)'],
    [
      ['daily, 7-day cycle (items at shop price)', n0(dailyWeek), n1(hoursToAfford(dailyWeek, 1))],
      ['all achievements, once', n0(achievementGold), n1(hoursToAfford(achievementGold, 1))],
      [`all decorations (+${decorBonus} happiness)`, n0(-decorCost), n1(hoursToAfford(decorCost, 1))],
    ],
  ),
);

const failed = gateFailures(rows);
if (failed.length > 0) {
  for (const r of failed) {
    console.error(
      `\nFAIL ${r.breed}: ${n0(r.perHour[100])}/h at happiness 100 < ${CARE_RATIO_MIN}x ${n0(r.perHour[0])}/h at 0`,
    );
  }
  process.exit(1);
}
console.log(`\nsim:economy OK — care ratio >= ${CARE_RATIO_MIN}x for every shop breed`);
