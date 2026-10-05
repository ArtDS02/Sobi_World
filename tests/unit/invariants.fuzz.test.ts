// Fuzz (spec §5.5): 1000 random actions with a fixed seed — including breeding and orders —
// interleaved with time jumps; after every step the save must pass the §5.5 schema.
import { describe, expect, it } from 'vitest';
import { breedPigs } from '../../src/areas/farm/logic/actions/breedPigs';
import { buyItem } from '../../src/areas/farm/logic/actions/buyItem';
import { buyPig } from '../../src/areas/farm/logic/actions/buyPig';
import { buySlot } from '../../src/areas/farm/logic/actions/buySlot';
import { cleanAll, cleanPig } from '../../src/areas/farm/logic/actions/cleanPig';
import { feedPig } from '../../src/areas/farm/logic/actions/feedPig';
import { fillTrough } from '../../src/areas/farm/logic/actions/fillTrough';
import { fulfillOrder, pigMeetsOrder } from '../../src/areas/farm/logic/actions/fulfillOrder';
import { renamePig } from '../../src/areas/farm/logic/actions/renamePig';
import { sellPig } from '../../src/areas/farm/logic/actions/sellPig';
import { treatPig } from '../../src/areas/farm/logic/actions/treatPig';
import { BALANCE } from '../../src/core/config/balance';
import { GENDER_VALUES, ITEM_ID_VALUES } from '../../src/core/config/ids';
import { ITEMS } from '../../src/core/config/items';
import { advanceWorld } from '../../src/areas/farm/logic/advanceWorld';
import { mulberry32, pick, type Rng } from '../../src/core/rng';
import { newGame } from '../../src/core/save/newGame';
import { saveGameSchema } from '../../src/core/save/schema';
import type { ActionContext, ActionResult, Pig, SaveGame } from '../../src/core/types';

const STEPS = 1000;
const MIDGAME_GOLD = 100_000;
const SEED = 20261001;
const SEC = 1000;
const MIN = 60 * SEC;
/** Time between steps: an active session, and now and then a long absence (catch-up). */
const SESSION_JUMPS = [0, 1 * SEC, MIN, 5 * MIN, 10 * MIN, 20 * MIN];
const ABSENCES = [60 * MIN, 4 * 60 * MIN, 12 * 60 * MIN, 3 * 24 * 60 * MIN];
const ABSENCE_CHANCE = 0.05;
const jump = (r: Rng) => pick(r, r.next() < ABSENCE_CHANCE ? ABSENCES : SESSION_JUMPS);

type Step = (s: SaveGame, c: ActionContext, r: Rng) => ActionResult;
const anyInt = (r: Rng, max: number) => Math.floor(r.next() * (max + 1));
const adults = (s: SaveGame) => s.pigs.filter((p) => p.growthProgress >= 100 && !p.pregnancy);

/**
 * Half the time an argument is drawn from the candidates that could succeed, otherwise from all
 * pigs (or a missing id), so both the accept and the reject paths keep getting hit.
 */
function target(s: SaveGame, r: Rng, good: Pig[] = s.pigs): string {
  if (good.length > 0 && r.next() < 0.5) return pick(r, good).id;
  return s.pigs.length > 0 && r.next() < 0.9 ? pick(r, s.pigs).id : 'missing';
}

function breed(s: SaveGame, c: ActionContext, r: Rng): ActionResult {
  const pool = adults(s).filter((p) => !p.isSick);
  const males = pool.filter((p) => p.gender === 'MALE');
  const females = pool.filter((p) => p.gender === 'FEMALE');
  return breedPigs(s, { pigAId: target(s, r, males), pigBId: target(s, r, females) }, c);
}

function fulfill(s: SaveGame, c: ActionContext, r: Rng): ActionResult {
  const open = s.orders.filter((o) => o.fulfilledAt === null);
  const order = open.length > 0 && r.next() < 0.8 ? pick(r, open) : null;
  const fits = order ? s.pigs.filter((p) => pigMeetsOrder(p, order)) : [];
  return fulfillOrder(s, { orderId: order?.id ?? 'none', pigId: target(s, r, fits) }, c);
}

/** Weighted so the farm grows: care actions often, rare systems regularly. */
const ACTIONS: [string, number, Step][] = [
  [
    'buyPig',
    3,
    (s, c, r) => buyPig(s, { breed: 'PIG_EARTH_PINK', gender: pick(r, GENDER_VALUES) }, c),
  ],
  ['feedPig', 3, (s, c, r) => feedPig(s, { pigId: target(s, r) }, c)],
  ['cleanPig', 2, (s, c, r) => cleanPig(s, { pigId: target(s, r) }, c)],
  ['cleanAll', 3, (s, c) => cleanAll(s, c)],
  [
    'treatPig',
    2,
    (s, c, r) =>
      treatPig(
        s,
        {
          pigId: target(
            s,
            r,
            s.pigs.filter((p) => p.isSick),
          ),
        },
        c,
      ),
  ],
  ['fillTrough', 3, (s, c, r) => fillTrough(s, { units: anyInt(r, 30) - 2 }, c)],
  [
    'buyItem',
    2,
    (s, c, r) => buyItem(s, { itemId: pick(r, ITEM_ID_VALUES), quantity: anyInt(r, 6) - 1 }, c),
  ],
  ['sellPig', 3, (s, c, r) => sellPig(s, { pigId: target(s, r, adults(s)) }, c)],
  [
    'renamePig',
    1,
    (s, c, r) =>
      renamePig(s, { pigId: target(s, r), name: pick(r, ['Ủn', '', ' x ', 'A'.repeat(40)]) }, c),
  ],
  ['buySlot', 1, (s, c) => buySlot(s, {}, c)],
  ['breedPigs', 4, breed],
  ['fulfillOrder', 4, fulfill],
];
const TOTAL_WEIGHT = ACTIONS.reduce((n, [, w]) => n + w, 0);

function pickAction(r: Rng): [string, Step] {
  let roll = r.next() * TOTAL_WEIGHT;
  for (const [name, w, run] of ACTIONS) {
    roll -= w;
    if (roll < 0) return [name, run];
  }
  const [name, , run] = ACTIONS[ACTIONS.length - 1]!;
  return [name, run];
}

/**
 * A player who spends everything ends with unfed or sick pigs stalled forever (empty trough, no
 * gold: a real soft-lock, see PROJECT_STATUS) and stops reaching breeding and orders. This one
 * keeps food money and a free slot, and sometimes looks after the farm; the rest stays random.
 */
const GOLD_RESERVE = 500;
const SPEND: Record<string, number> = { buyPig: 500, buySkin: 2000, buySlot: 2000, buyItem: 300 };

/** Treat a sick pig (buying medicine if needed), else top up the trough with what gold allows. */
const care: Step = (s, c) => {
  const sick = s.pigs.find((p) => p.isSick);
  if (sick && s.inventory.MEDICINE_COMMON > 0) return treatPig(s, { pigId: sick.id }, c);
  if (sick && s.player.gold >= ITEMS.MEDICINE_COMMON.priceGold) {
    return buyItem(s, { itemId: 'MEDICINE_COMMON', quantity: 1 }, c);
  }
  const affordable =
    s.inventory.FOOD_BASIC + Math.floor(s.player.gold / ITEMS.FOOD_BASIC.priceGold);
  return fillTrough(s, { units: Math.min(s.trough.capacity - s.trough.food, affordable) }, c);
};

function choose(s: SaveGame, r: Rng): [string, Step] {
  const [name, run] = pickAction(r);
  const needsCare =
    (s.trough.food < s.trough.capacity / 2 || s.pigs.some((p) => p.isSick)) && r.next() < 0.5;
  const broke = name in SPEND && s.player.gold - SPEND[name]! < GOLD_RESERVE;
  // Keep a slot free for a litter, or breeding is never possible (D8 reserves the child's slot).
  const pregnant = s.pigs.filter((p) => p.pregnancy).length;
  const crowded = name === 'buyPig' && s.pigs.length + pregnant >= s.player.unlockedSlots - 1;
  return needsCare || broke || crowded ? ['care', care] : [name, run];
}

function expectValid(s: SaveGame, step: number, what: string) {
  const r = saveGameSchema.safeParse(s);
  if (!r.success) throw new Error(`step ${step} (${what}): ${r.error.message}`);
}

describe('§5.5 invariants under random play (fuzz)', () => {
  it(`${STEPS} seeded actions keep the save valid after every step`, () => {
    const pickRng = mulberry32(SEED);
    const gameRng = mulberry32(SEED + 1);
    let now = 1_790_000_000_000;
    // A mid-game farm: a random player loses money, so a starter farm goes broke before it
    // ever breeds. Everything after this point happens only through actions.
    const start = newGame({ now, rng: gameRng });
    let state: SaveGame = {
      ...start,
      player: { ...start.player, gold: MIDGAME_GOLD, xp: BALANCE.LEVEL_XP[4]! },
    };
    const ok = new Map<string, number>();
    expectValid(state, 0, 'newGame');

    for (let i = 1; i <= STEPS; i += 1) {
      now += jump(pickRng);
      // The store ticks the world while time passes (§7.1).
      state = advanceWorld(state, now, gameRng).state;
      expectValid(state, i, 'tick');
      const [name, run] = choose(state, pickRng);
      const before = structuredClone(state);
      const result = run(state, { now, rng: gameRng }, pickRng);
      if (result.ok) {
        state = result.state;
        ok.set(name, (ok.get(name) ?? 0) + 1);
      } else {
        expect(state).toEqual(before); // a rejected action never mutates
      }
      expectValid(state, i, name);
    }

    // The run must actually exercise the rare systems, or it proves little.
    for (const name of ['buyPig', 'sellPig', 'breedPigs', 'fulfillOrder']) {
      expect(ok.get(name) ?? 0, name).toBeGreaterThan(0);
    }
  });
});
