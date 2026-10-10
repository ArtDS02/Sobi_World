// Sobi Aquarium (GĐ8): opening, the tank's numbers over time (the same in every slicing), the fish actions, the rod,
// eggs, prices and the links to the other Areas (feed from the Garden, scales for the sprinkler).
import { describe, expect, it } from 'vitest';
import { AREAS } from '../../src/app/areas';
import { SAVE_CODEC, parseWorldSave } from '../../src/app/saveCodec';
import { aquariumArea } from '../../src/areas/aquarium';
import { AB, AQUARIUM_AREA_ID, FISH, FISH_LIST, tankCapacity } from '../../src/areas/aquarium/logic/config/content';
import { castCooldownLeft, nextTankLevel, tankFree } from '../../src/areas/aquarium/logic/derived';
import { cast, catchOdds } from '../../src/areas/aquarium/logic/fishing';
import { fishQuote } from '../../src/areas/aquarium/logic/pricing';
import { aquariumOf, withAquarium } from '../../src/areas/aquarium/logic/save/lens';
import { simulateAquarium } from '../../src/areas/aquarium/logic/simulate';
import type { AquariumState, Fish } from '../../src/areas/aquarium/logic/state';
import { aquariumStateSchema } from '../../src/areas/aquarium/logic/state';
import { aquariumSuggestions } from '../../src/areas/aquarium/logic/suggest';
import { aquariumEventsToWorld } from '../../src/areas/aquarium/logic/worldEvents';
import { breedFish, pairError } from '../../src/areas/aquarium/logic/actions/breed';
import { cleanTank, feedFish, petFish, setFishPurpose, treatFish } from '../../src/areas/aquarium/logic/actions/care';
import { castLine, releaseFish } from '../../src/areas/aquarium/logic/actions/fishing';
import { collectScales, sellFish, upgradeTank } from '../../src/areas/aquarium/logic/actions/trade';
import { mulberry32, sequenceRng } from '../../src/core/rng';
import type { WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';

const H = 3_600_000;
const MIN = 60_000;
const T0 = 20_000 * 86_400_000; // local midnight (UTC) of a day: 0:00
const NOON = T0 + 12 * H;
const ctxAt = (now: number, seed = 7): ActionContext => ({ now, rng: mulberry32(seed) });
const ok = (r: { ok: boolean; state?: WorldSave; error?: string }): WorldSave => {
  if (!r.ok) throw new Error(`action failed: ${r.error}`);
  return r.state as WorldSave;
};
const fail = (r: { ok: boolean; error?: string }): string | undefined => (r.ok ? undefined : r.error);

const fish = (over: Partial<Fish> = {}): Fish => ({
  id: 'f1',
  breed: 'fish_goldfish',
  name: 'Bong Bóng',
  gender: 'MALE',
  growthProgress: 100,
  hunger: 100,
  cleanliness: 100,
  isSick: false,
  generation: 1,
  createdAt: T0,
  lastTickedAt: T0,
  ...over,
});

/** A world with the aquarium open at T0, the given fish, bag and coins. The world is old enough that new-world protection is over. */
function tankWorld(fishList: Fish[] = [fish()], bag: Record<string, number> = {}, coins = 100_000, tank: Partial<AquariumState['tank']> = {}): WorldSave {
  const fresh = SAVE_CODEC.newWorld(ctxAt(T0 - 30 * 86_400_000));
  const opened = aquariumArea.init(fresh, ctxAt(T0));
  const a = aquariumOf(opened);
  return withAquarium(
    { ...opened, wallet: { ...opened.wallet, coins }, inventory: { items: { ...bag } }, meta: { ...opened.meta, createdAt: T0 - 30 * 86_400_000 } },
    { ...a, fish: fishList, tank: { ...a.tank, ...tank }, lastTickedAt: T0 },
  );
}
const tank = (w: WorldSave) => aquariumOf(w);

describe('opening', () => {
  it('opens at world level 6 with the starter fish and a few meals, once', () => {
    const fresh = SAVE_CODEC.newWorld(ctxAt(T0));
    expect(AQUARIUM_AREA_ID in fresh.areas).toBe(false);
    const lvl = { ...fresh, progression: { ...fresh.progression, areas: { ...fresh.progression.areas, sobi_farm: { xp: 100_000 } } } };
    const r = AREAS.advance(lvl, T0 + H, mulberry32(3), 0);
    expect(r.state.world.unlockedAreas).toContain('sobi_aquarium');
    const a = aquariumOf(r.state);
    expect(a.fish).toHaveLength(1);
    expect(a.fish[0]!.breed).toBe(AB.start.fish);
    expect(r.state.inventory.items.FOOD_FISH).toBe(AB.start.feed);
    expect(a.tank.level).toBe(1);
  });

  it('its slice passes its own schema and the world codec', () => {
    const w = tankWorld();
    expect(aquariumStateSchema.safeParse(aquariumOf(w)).success).toBe(true);
    const back = parseWorldSave(JSON.stringify(w));
    expect(back.ok && back.save).toEqual(w);
    const bad = { ...w, areas: { ...w.areas, sobi_aquarium: { ...aquariumOf(w), fish: [{ ...fish(), breed: 'fish_unknown' }] } } };
    expect(parseWorldSave(JSON.stringify(bad)).ok).toBe(false); // a corrupt slice is refused, not played
  });
});

describe('the tank over time', () => {
  const run = (a: AquariumState, to: number, slices = 1, mode: 'online' | 'offline' = 'online') => {
    let s = a;
    const events: string[] = [];
    for (let i = 1; i <= slices; i += 1) {
      const r = simulateAquarium(s, a.lastTickedAt + ((to - a.lastTickedAt) * i) / slices, mode, 0, T0 - 30 * 86_400_000);
      s = r.state;
      events.push(...r.events.map((e) => e.type));
    }
    return { state: s, events };
  };

  it('fish get hungry at the rate of the spec (5 a hour) and the water clouds with the fish in it', () => {
    const w = tankWorld([fish({ growthProgress: 10 })]);
    const { state } = run(aquariumOf(w), T0 + 4 * H);
    expect(state.fish[0]!.hunger).toBeCloseTo(100 - 4 * AB.life.hungerPerHour, 5);
    const rate = AB.tank.waterPerHour + AB.tank.waterPerFishPerHour * 1;
    expect(state.tank.water).toBeCloseTo(100 - 4 * rate, 5);
    expect(state.fish[0]!.cleanliness).toBeCloseTo(state.tank.water, 5); // a fish has the water's cleanliness
  });

  it('a fish grows to full size in its species\' hours when fed, and not when hungry', () => {
    const sp = FISH.fish_goldfish!;
    const w = tankWorld([fish({ growthProgress: 0, hunger: 100 })]);
    // Feed stays above the growth threshold for the first hours only: look at a short span.
    const { state } = run(aquariumOf(w), T0 + sp.growHours * H * 0.1);
    expect(state.fish[0]!.growthProgress).toBeCloseTo(10, 1);
    const hungry = run(aquariumOf(tankWorld([fish({ growthProgress: 0, hunger: 10 })])), T0 + 5 * H);
    expect(hungry.state.fish[0]!.growthProgress).toBe(0);
  });

  it('is the same however the time is sliced (one jump, minutes, hours)', () => {
    const w = tankWorld([fish({ growthProgress: 20 }), fish({ id: 'f2', growthProgress: 100, gender: 'FEMALE' })]);
    const one = run(aquariumOf(w), T0 + 9 * H, 1).state;
    const many = run(aquariumOf(w), T0 + 9 * H, 540).state;
    const hours = run(aquariumOf(w), T0 + 9 * H, 9).state;
    for (const other of [many, hours]) {
      expect(other.tank.water).toBeCloseTo(one.tank.water, 6);
      expect(other.tank.scales).toBe(one.tank.scales);
      other.fish.forEach((f, i) => {
        expect(f.hunger).toBeCloseTo(one.fish[i]!.hunger, 6);
        expect(f.growthProgress).toBeCloseTo(one.fish[i]!.growthProgress, 6);
      });
    }
  });

  it('a grown fish sheds a scale every scaleHours; the tank holds a few', () => {
    const sp = FISH.fish_goldfish!;
    const w = tankWorld([fish()]);
    const { state, events } = run(aquariumOf(w), T0 + sp.scaleHours * H * 3 + MIN);
    expect(state.tank.scales).toBe(3);
    expect(events).toContain('AQUARIUM_SCALES_SHED');
    const cap = tankCapacity(1) * AB.tank.scalesPerSlot;
    const long = run(aquariumOf(tankWorld([fish({ hunger: 100 })])), T0 + 200 * H);
    expect(long.state.tank.scales).toBeLessThanOrEqual(cap);
  });

  it('a fish that is not fully grown sheds nothing', () => {
    const { state } = run(aquariumOf(tankWorld([fish({ growthProgress: 40 })])), T0 + 2 * H);
    expect(state.tank.scales).toBe(0);
  });

  it('neglect makes a fish ill, then critical, then — online only — it dies; offline only starts the grace period', () => {
    const w = tankWorld([fish({ hunger: 0, cleanliness: 0, growthProgress: 40 })], {}, 0, { water: 0 });
    const a = aquariumOf(w);
    const sick = run(a, T0 + 30 * H);
    expect(sick.state.fish[0]!.isSick).toBe(true);
    expect(sick.events).toContain('AQUARIUM_FISH_SICK');
    const dead = run(a, T0 + 30 * H + 100 * H);
    expect(dead.events).toContain('AQUARIUM_FISH_DIED');
    expect(dead.state.fish).toHaveLength(0);
    expect(dead.state.memorials[0]).toMatchObject({ breed: 'fish_goldfish' });
    const away = run(a, T0 + 130 * H, 1, 'offline');
    expect(away.state.fish).toHaveLength(1);
    expect(away.state.graceUntil).toBeGreaterThan(T0 + 130 * H);
  });

  it('eggs hatch at their time when there is room, and wait when the tank is full', () => {
    const egg = { id: 'e1', species: 'fish_goldfish', startedAt: T0, hatchAt: T0 + 6 * H, gender: 'FEMALE' as const, generation: 2, traits: ['trait_sweet'] };
    const a = { ...aquariumOf(tankWorld([fish()])), eggs: [egg] };
    const early = run(a, T0 + 5 * H);
    expect(early.state.eggs).toHaveLength(1);
    const done = run(a, T0 + 7 * H);
    expect(done.state.eggs).toHaveLength(0);
    expect(done.state.fish).toHaveLength(2);
    expect(done.state.fish[1]).toMatchObject({ id: 'fish-e1', gender: 'FEMALE', generation: 2, traits: ['trait_sweet'] });
    expect(done.state.fish[1]!.growthProgress).toBeCloseTo((100 * 1) / FISH.fish_goldfish!.growHours, 1); // hatched an hour before
    expect(done.events).toContain('AQUARIUM_EGG_HATCHED');
    const crowd = Array.from({ length: tankCapacity(1) }, (_, i) => fish({ id: `c${i}` }));
    const full = run({ ...aquariumOf(tankWorld(crowd)), eggs: [egg] }, T0 + 7 * H);
    expect(full.state.eggs).toHaveLength(1); // no room: the egg waits
    expect(full.state.fish).toHaveLength(tankCapacity(1));
  });

  it('never goes backwards', () => {
    const a = aquariumOf(tankWorld());
    expect(simulateAquarium(a, T0 - H, 'online', 0, 0).state).toBe(a);
  });
});

describe('care', () => {
  it('feeds the hungry with fish feed, as many as the bag allows; a full tank of fish refuses', () => {
    const w = tankWorld([fish({ hunger: 20 }), fish({ id: 'f2', hunger: 30 }), fish({ id: 'f3', hunger: 40 })], { FOOD_FISH: 2 });
    const fed = ok(feedFish(w, { fishIds: ['f1', 'f2', 'f3'] }, ctxAt(T0)));
    expect(fed.inventory.items.FOOD_FISH).toBe(0);
    expect(tank(fed).fish.map((f) => f.hunger)).toEqual([70, 80, 40]);
    expect(fail(feedFish(fed, { fishIds: ['f3'] }, ctxAt(T0)))).toBe('INSUFFICIENT_ITEM');
    expect(fail(feedFish(tankWorld([fish()], { FOOD_FISH: 3 }), { fishIds: ['f1'] }, ctxAt(T0)))).toBe('ALREADY_FULL');
    expect(fail(feedFish(w, { fishIds: ['nope'] }, ctxAt(T0)))).toBe('FISH_NOT_FOUND');
    expect(fail(feedFish(w, { fishIds: ['f1'], itemId: 'FOOD_BASIC' }, ctxAt(T0)))).toBe('INVALID_REQUEST'); // pig feed is not fish feed
  });

  it('changes the water: the tank and every fish back to clean; refuses when it is clear', () => {
    const w = tankWorld([fish({ cleanliness: 30 })], {}, 0, { water: 30 });
    const clean = ok(cleanTank(w, {}, ctxAt(T0)));
    expect(tank(clean).tank.water).toBe(100);
    expect(tank(clean).fish[0]!.cleanliness).toBe(100);
    expect(fail(cleanTank(clean, {}, ctxAt(T0)))).toBe('WATER_CLEAN');
  });

  it('petting adds Bond twice a day; the third time says no', () => {
    let w = tankWorld();
    w = ok(petFish(w, { fishId: 'f1' }, ctxAt(T0 + MIN)));
    w = ok(petFish(w, { fishId: 'f1' }, ctxAt(T0 + 2 * MIN)));
    expect(tank(w).fish[0]!.bond).toBe(6);
    expect(fail(petFish(w, { fishId: 'f1' }, ctxAt(T0 + 3 * MIN)))).toBe('PET_LIMIT_REACHED');
    expect(tank(ok(petFish(w, { fishId: 'f1' }, ctxAt(T0 + 24 * H)))).fish[0]!.bond).toBe(9); // a new day, two more
  });

  it('medicine cures an ill fish and refuses a healthy one', () => {
    const ill = tankWorld([fish({ isSick: true, lastSickAt: T0 })], { MEDICINE_COMMON: 1 });
    const cured = ok(treatFish(ill, { fishId: 'f1' }, ctxAt(T0 + H)));
    expect(tank(cured).fish[0]!.isSick).toBe(false);
    expect(cured.inventory.items.MEDICINE_COMMON).toBe(0);
    expect(fail(treatFish(cured, { fishId: 'f1' }, ctxAt(T0 + 2 * H)))).toBe('FISH_NOT_SICK');
    expect(fail(treatFish(tankWorld([fish({ isSick: true })], {}), { fishId: 'f1' }, ctxAt(T0)))).toBe('INSUFFICIENT_ITEM');
  });

  it('a pet is not sold and not bred', () => {
    let w = tankWorld([fish()], {}, 0);
    w = ok(setFishPurpose(w, { fishId: 'f1', purpose: 'PET' }, ctxAt(T0)));
    expect(fail(sellFish(w, { fishId: 'f1' }, ctxAt(T0)))).toBe('FISH_IS_PET');
    expect(fail(setFishPurpose(w, { fishId: 'f1', purpose: 'ADVENTURE' }, ctxAt(T0)))).toBe('PURPOSE_LOCKED');
    expect(fail(setFishPurpose(tankWorld([fish({ growthProgress: 10 })]), { fishId: 'f1', purpose: 'SHIP' }, ctxAt(T0)))).toBe('FISH_NOT_MATURE');
  });
});

describe('the rod', () => {
  it('a score under the line loses the fish; a good one brings a catch into the bag; the rod then rests', () => {
    const w = tankWorld([fish()], {});
    const miss = ok(castLine(w, { score: 0.1 }, ctxAt(NOON)));
    expect(Object.values(miss.inventory.items).reduce((n, v) => n + v, 0)).toBe(0);
    const left = castCooldownLeft(tank(miss), NOON);
    expect(left).toBeCloseTo(AB.fishing.cooldownSec * AB.fishing.missCooldownShare * 1000, 0);
    const got = ok(castLine(w, { score: 0.9 }, ctxAt(NOON)));
    const caught = Object.entries(got.inventory.items).filter(([, n]) => n > 0);
    expect(caught).toHaveLength(1);
    expect(castCooldownLeft(tank(got), NOON)).toBe(AB.fishing.cooldownSec * 1000);
    expect(fail(castLine(got, { score: 0.9 }, ctxAt(NOON + 60_000)))).toBe('FISHING_COOLDOWN');
    expect(ok(castLine(got, { score: 0.9 }, ctxAt(NOON + AB.fishing.cooldownSec * 1000))).meta.updatedAt).toBe(NOON + AB.fishing.cooldownSec * 1000);
    expect(fail(castLine(w, { score: 2 }, ctxAt(NOON)))).toBe('INVALID_REQUEST');
  });

  it('night fish bite only at night; a better score favours rarer fish', () => {
    const day = new Set(catchOdds(0.5, false).flatMap((o) => (o.species ? [o.species.id] : [])));
    const night = new Set(catchOdds(0.5, true).flatMap((o) => (o.species ? [o.species.id] : [])));
    for (const f of FISH_LIST.filter((x) => x.nightOnly)) {
      expect(day.has(f.id)).toBe(false);
      expect(night.has(f.id)).toBe(true);
    }
    const share = (score: number, rarity: string) =>
      catchOdds(score, false).filter((o) => o.species?.rarity === rarity).reduce((n, o) => n + o.share, 0);
    expect(share(1, 'RARE')).toBeGreaterThan(share(0.3, 'RARE'));
    expect(share(1, 'COMMON')).toBeLessThan(share(0.3, 'COMMON'));
    expect(catchOdds(0.5, true).reduce((n, o) => n + o.share, 0)).toBeCloseTo(1, 9);
  });

  it('is deterministic for a seed, and the draw follows the table', () => {
    const rng = (v: number) => sequenceRng([v]);
    expect(cast(rng(0), 0.2, false).kind).toBe('miss');
    const first = cast(rng(0), 0.5, false);
    expect(first).toMatchObject({ kind: 'fish' });
    expect(cast(rng(0.999999), 0.5, false)).toMatchObject({ kind: 'oyster' });
  });

  it('every species can be caught or bred, and has at least two uses', () => {
    expect(FISH_LIST.length).toBeGreaterThanOrEqual(10);
    const rarities = new Set(FISH_LIST.map((f) => f.rarity));
    expect(rarities).toEqual(new Set(['COMMON', 'UNCOMMON', 'RARE', 'EPIC']));
    for (const f of FISH_LIST) {
      expect(f.catchWeight).toBeGreaterThan(0); // bites the rod (Codex, orders)
      expect(f.tankGold).toBeGreaterThan(0); // raised and sold
      expect(f.scaleHours).toBeGreaterThan(0); // sheds scales
    }
    expect(FISH_LIST.filter((f) => f.nightOnly).length).toBeGreaterThanOrEqual(2);
  });

  it('a catch can be put in the tank to grow, if there is room', () => {
    const w = tankWorld([fish()], { item_fish_betta: 1 });
    const r = ok(releaseFish(w, { itemId: 'item_fish_betta' }, ctxAt(T0)));
    expect(tank(r).fish).toHaveLength(2);
    expect(tank(r).fish[1]).toMatchObject({ breed: 'fish_betta', growthProgress: AB.life.caughtProgress });
    expect(r.inventory.items.item_fish_betta).toBe(0);
    const crowd = Array.from({ length: tankCapacity(1) }, (_, i) => fish({ id: `c${i}` }));
    expect(fail(releaseFish(tankWorld(crowd, { item_fish_betta: 1 }), { itemId: 'item_fish_betta' }, ctxAt(T0)))).toBe('TANK_FULL');
    expect(fail(releaseFish(tankWorld([fish()], {}), { itemId: 'item_fish_betta' }, ctxAt(T0)))).toBe('INSUFFICIENT_ITEM');
    expect(fail(releaseFish(w, { itemId: 'item_scale' }, ctxAt(T0)))).toBe('INVALID_REQUEST');
  });

  it('a full bag stops a cast before it spends the rod', () => {
    const full: Record<string, number> = {};
    for (let i = 0; i < 40; i += 1) full[`junk_${i}`] = 99;
    const w = tankWorld([fish()], full);
    expect(fail(castLine(w, { score: 0.9 }, ctxAt(NOON)))).toBe('INVENTORY_FULL');
  });
});

describe('selling, scales and the tank upgrade', () => {
  it('a raised fish sells for more than a young one; quality, health and size are in the quote', () => {
    const grown = fishQuote(fish(), T0);
    const young = fishQuote(fish({ growthProgress: 50 }), T0);
    const ill = fishQuote(fish({ isSick: true, lastSickAt: T0 - 2 * 86_400_000 }), T0);
    expect(grown.price).toBeGreaterThan(young.price);
    expect(ill.price).toBeLessThan(grown.price);
    expect(grown.base).toBe(FISH.fish_goldfish!.tankGold);
    expect(young.growthFactor).toBeCloseTo(AB.sell.minShare, 9);
  });

  it('selling pays coins through the ledger and removes the fish; a baby cannot be sold', () => {
    const w = tankWorld([fish(), fish({ id: 'baby', growthProgress: 20 })], {}, 0);
    const price = fishQuote(fish(), T0).price;
    const sold = ok(sellFish(w, { fishId: 'f1' }, ctxAt(T0)));
    expect(sold.wallet.coins).toBe(price);
    expect(tank(sold).fish.map((f) => f.id)).toEqual(['baby']);
    expect(sold.transactions[0]).toMatchObject({ type: 'AQUARIUM_FISH_SELL', amount: price });
    expect(fail(sellFish(sold, { fishId: 'baby' }, ctxAt(T0)))).toBe('FISH_NOT_MATURE');
  });

  it('scales go to the bag as far as it has room; the rest stay in the tank', () => {
    const w = tankWorld([fish()], {}, 0, { scales: 5 });
    const got = ok(collectScales(w, {}, ctxAt(T0)));
    expect(got.inventory.items.item_scale).toBe(5);
    expect(tank(got).tank.scales).toBe(0);
    expect(fail(collectScales(got, {}, ctxAt(T0)))).toBe('NOTHING_TO_COLLECT');
  });

  it('upgrading costs coins and materials, widens the tank and slows the clouding', () => {
    const lvl2 = nextTankLevel(tank(tankWorld()))!;
    expect(lvl2).toMatchObject({ level: 2, capacity: AB.tank.levels[1]!.capacity });
    const w = ok(upgradeTank(tankWorld([fish()], {}, lvl2.price), {}, ctxAt(T0)));
    expect(tank(w).tank.level).toBe(2);
    expect(w.wallet.coins).toBe(0);
    expect(tankFree(tank(w))).toBe(lvl2.capacity - 1);
    expect(fail(upgradeTank(tankWorld([fish()], {}, 0), {}, ctxAt(T0)))).toBe('INSUFFICIENT_GOLD');
    // Level 3 asks for scales: coins alone are not enough.
    const lvl3 = AB.tank.levels[2]!;
    const needy = withAquarium(tankWorld([fish()], {}, lvl3.price), { ...tank(w), tank: { ...tank(w).tank, level: 2 } });
    expect(fail(upgradeTank(needy, {}, ctxAt(T0)))).toBe('INSUFFICIENT_ITEM');
    const rich = ok(upgradeTank({ ...needy, inventory: { items: { item_scale: 20 } } }, {}, ctxAt(T0)));
    expect(rich.inventory.items.item_scale).toBe(20 - (lvl3.materials.item_scale ?? 0));
    const top = withAquarium(tankWorld(), { ...tank(w), tank: { ...tank(w).tank, level: AB.tank.levels.length } });
    expect(fail(upgradeTank(top, {}, ctxAt(T0)))).toBe('TANK_MAX_LEVEL');
  });
});

describe('breeding fish', () => {
  const pair = () => [fish({ id: 'm', gender: 'MALE' }), fish({ id: 'f', gender: 'FEMALE', traits: ['trait_sweet'] })];

  it('lays an egg for a male and a female of one breedable species; the child is fixed on the egg', () => {
    const w = tankWorld(pair(), { FOOD_FISH: 5 });
    const bred = ok(breedFish(w, { fishAId: 'm', fishBId: 'f' }, ctxAt(T0)));
    const a = tank(bred);
    expect(a.eggs).toHaveLength(1);
    expect(a.eggs[0]).toMatchObject({ species: 'fish_goldfish', generation: 2 });
    expect(a.eggs[0]!.hatchAt).toBe(T0 + AB.breeding.eggHours * H);
    expect(a.eggs[0]!.lineage?.mother?.name).toBe('Bong Bóng');
    expect(bred.inventory.items.FOOD_FISH).toBe(5 - AB.breeding.feed);
    expect(a.fish.every((f) => (f.breedReadyAt ?? 0) > T0)).toBe(true);
    // The pair rests; another try fails.
    expect(fail(breedFish(bred, { fishAId: 'm', fishBId: 'f' }, ctxAt(T0 + H)))).toBe('FISH_RESTING');
    // Same seed, same child.
    const again = ok(breedFish(w, { fishAId: 'm', fishBId: 'f' }, ctxAt(T0)));
    expect(tank(again).eggs[0]).toEqual({ ...a.eggs[0] });
  });

  it('the rules, in order', () => {
    const w = tankWorld(pair(), { FOOD_FISH: 5 });
    const a = tank(w);
    const [m, f] = a.fish;
    expect(pairError(a, m, f, T0)).toBeNull();
    expect(pairError(a, m, m, T0)).toBe('NOT_A_PAIR');
    expect(pairError(a, m, { ...f!, gender: 'MALE' }, T0)).toBe('NOT_A_PAIR');
    expect(pairError(a, m, { ...f!, breed: 'fish_perch' }, T0)).toBe('NOT_A_PAIR');
    expect(pairError(a, { ...m!, breed: 'fish_perch' }, { ...f!, breed: 'fish_perch' }, T0)).toBe('NOT_A_PAIR'); // perch do not breed
    expect(pairError(a, m, { ...f!, purpose: 'PET' }, T0)).toBe('FISH_IS_PET');
    expect(pairError(a, m, { ...f!, growthProgress: 70 }, T0)).toBe('FISH_NOT_MATURE');
    expect(pairError(a, m, { ...f!, isSick: true }, T0)).toBe('FISH_IS_SICK');
    expect(pairError(a, m, { ...f!, hunger: 10 }, T0)).toBe('FISH_TOO_HUNGRY');
    expect(pairError({ ...a, eggs: [{ id: 'x', species: 'fish_goldfish', startedAt: T0, hatchAt: T0 + H, gender: 'MALE', generation: 2, traits: [] }, { id: 'y', species: 'fish_goldfish', startedAt: T0, hatchAt: T0 + H, gender: 'MALE', generation: 2, traits: [] }] }, m, f, T0)).toBe('TOO_MANY_EGGS');
    expect(fail(breedFish(tankWorld(pair(), {}), { fishAId: 'm', fishBId: 'f' }, ctxAt(T0)))).toBe('INSUFFICIENT_ITEM');
  });
});

describe('links with the rest of the world', () => {
  it('fish feed is made from Garden potatoes at the mill', async () => {
    const { RECIPES } = await import('../../src/core/config/recipes');
    expect(RECIPES.recipe_fish_feed).toMatchObject({ building: 'mill', inputs: { item_potato: 2 }, outputs: { FOOD_FISH: 4 } });
  });

  it('standard world events: a catch, a sale and a clean-up', () => {
    const w = tankWorld([fish()], {}, 0);
    const r = castLine(w, { score: 0.9 }, ctxAt(NOON));
    if (!r.ok) throw new Error(r.error);
    const events = aquariumEventsToWorld(r.events);
    expect(events.some((e) => e.type === 'item.added')).toBe(true);
    const sold = sellFish(w, { fishId: 'f1' }, ctxAt(T0));
    if (!sold.ok) throw new Error(sold.error);
    expect(aquariumEventsToWorld(sold.events).map((e) => e.type)).toEqual(['creature.sold', 'currency.changed']);
    const cleaned = cleanTank(tankWorld([fish()], {}, 0, { water: 10 }), {}, ctxAt(T0));
    if (!cleaned.ok) throw new Error(cleaned.error);
    expect(aquariumEventsToWorld(cleaned.events)).toEqual([{ type: 'tank.cleaned', area: AQUARIUM_AREA_ID }]);
  });

  it('suggestions: ill first, hungry, cloudy water, the rod', () => {
    const a = aquariumOf(tankWorld([fish({ hunger: 10, isSick: true, lastSickAt: T0 })], {}, 0, { water: 20, scales: 2 }));
    const keys = aquariumSuggestions(a, T0 + H).sort((x, y) => y.priority - x.priority).map((s) => s.key);
    expect(keys).toEqual(['suggest.aquarium.treat', 'suggest.aquarium.feed', 'suggest.aquarium.water', 'suggest.aquarium.scales', 'suggest.aquarium.fish']);
  });
});
