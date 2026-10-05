import { describe, expect, it } from 'vitest';
import { PIG_SLEEP } from '../../src/core/config/dayNight';
import { PIG_LIFE } from '../../src/core/config/pigLife';
import type { AiState, BrainCommand, BrainWorld, Point } from '../../src/areas/farm/scene/state/brainWorld';
import { PigBrain } from '../../src/areas/farm/scene/state/pigBrain';

const TROUGH: Point = { x: 260, y: 840 };
const BED: Point = { x: 560, y: 480 };

/** A tiny farm around one brain: walks arrive after `walkTicks` AI ticks. */
function farm(id = 'pig-1', opts: { night?: boolean; trough?: boolean; walkTicks?: number } = {}) {
  let now = 1_000_000;
  let night = opts.night ?? false;
  let walkLeft = 0;
  let reserved = 0;
  const log: BrainCommand[] = [];
  const care = { hunger: 80, cleanliness: 90, isSick: false, pregnant: false };
  const brain = new PigBrain(id, now, night, 3 * 3_600_000);
  let paused = false;
  let still = false;
  let friend: { id: string; at: Point } | null = null;
  const world = (): BrainWorld => ({
    now,
    night,
    sinceDayMs: Infinity,
    care,
    paused,
    still,
    walking: walkLeft > 0,
    pos: { x: 800, y: 600 },
    feedSpot: () => (opts.trough === false ? null : (reserved++, TROUGH)),
    releaseFeed: () => (reserved = Math.max(0, reserved - 1)),
    sleepSpot: () => BED,
    wanderTo: (step) => ({ x: 700 + step, y: 600 }),
    friend: () => friend,
  });
  const tick = (ms: number = PIG_LIFE.tickMs) => {
    now += ms;
    if (walkLeft > 0) walkLeft -= 1;
    const cmds = brain.tick(world());
    log.push(...cmds);
    if (cmds.some((c) => c.kind === 'walk')) walkLeft = opts.walkTicks ?? 2;
    return cmds;
  };
  /** Ticks until the brain reaches `state` (or fails after `max` ticks). */
  const until = (state: AiState, max = 400) => {
    for (let i = 0; i < max && brain.state !== state; i++) tick();
    return brain.state;
  };
  return {
    brain,
    care,
    log,
    tick,
    until,
    get now() {
      return now;
    },
    reservedCount: () => reserved,
    setNight: (v: boolean) => (night = v),
    setPaused: (v: boolean) => (paused = v),
    setStill: (v: boolean) => (still = v),
    setFriend: (f: typeof friend) => (friend = f),
    meal: (meals = 1, hungerBefore = 50) => brain.onMeal(meals, hungerBefore, now),
  };
}

const walkTo = (log: BrainCommand[], p: Point) =>
  log.some((c) => c.kind === 'walk' && c.to.x === p.x && c.to.y === p.y);

describe('PL-1 auto feeding (cases A–D)', () => {
  it('A: a meal → walk to the trough → eat → stop → back to free time', () => {
    const f = farm();
    f.meal(1, 50);
    expect(f.until('SEEK_FOOD')).toBe('SEEK_FOOD');
    expect(walkTo(f.log, TROUGH)).toBe(true);
    expect(f.until('EATING')).toBe('EATING');
    expect(f.log.some((c) => c.kind === 'eat')).toBe(true);
    const done = f.until('WANDER');
    expect(done).toBe('WANDER'); // leaves the trough
    expect(f.brain.meal).toBeNull();
    expect(f.reservedCount()).toBe(0);
  });

  it('B: hungry with an empty trough (no meal): never walks to the trough', () => {
    const f = farm();
    f.care.hunger = 25;
    for (let i = 0; i < 200; i++) f.tick();
    expect(walkTo(f.log, TROUGH)).toBe(false);
    expect(f.brain.state).not.toBe('SEEK_FOOD');
  });

  it('no trough on the farm: the meal is dropped, the pig goes on (fallback)', () => {
    const f = farm('pig-1', { trough: false });
    f.meal();
    for (let i = 0; i < 20; i++) f.tick();
    expect(f.brain.meal).toBeNull();
    expect(f.brain.state).not.toBe('SEEK_FOOD');
  });

  it('eating lasts eatMsPerMeal per meal (capped) and cannot be interrupted', () => {
    const f = farm();
    f.meal(2, 50);
    f.until('EATING');
    const start = f.now;
    f.setNight(true); // even a night switch does not cut the meal short
    while (f.brain.state === 'EATING') f.tick();
    expect(f.now - start).toBeGreaterThanOrEqual(2 * PIG_LIFE.feed.eatMsPerMeal);
    expect(f.now - start).toBeLessThan(PIG_LIFE.feed.maxEatMs + 2 * PIG_LIFE.tickMs);
  });

  it('a walk that never arrives gives up after maxSeekMs and eats where it stands', () => {
    const f = farm('pig-1', { walkTicks: 1_000_000 });
    f.meal();
    f.until('SEEK_FOOD');
    f.tick(PIG_LIFE.feed.maxSeekMs);
    expect(f.brain.state).toBe('EATING');
  });

  it('no flicker: one meal → exactly one walk to the trough', () => {
    const f = farm();
    f.meal();
    for (let i = 0; i < 100; i++) f.tick();
    expect(f.log.filter((c) => c.kind === 'walk' && c.to === TROUGH)).toHaveLength(1);
  });

  it('foodDrive: reaction delay ≤ maxReactMs', () => {
    const f = farm();
    f.meal();
    f.tick(PIG_LIFE.feed.maxReactMs);
    f.tick();
    expect(['SEEK_FOOD', 'EATING']).toContain(f.brain.state);
  });
});

describe('PL-1 sleep and day / night', () => {
  it('at night a sleepy pig walks to its bed, falls asleep, sleeps; in the morning it wakes', () => {
    const f = farm();
    f.setNight(true);
    expect(f.until('GO_TO_SLEEP')).toBe('GO_TO_SLEEP');
    expect(walkTo(f.log, BED)).toBe(true);
    expect(f.until('SLEEPING')).toBe('SLEEPING');
    expect(f.log).toContainEqual({ kind: 'rest', rest: 'FALLING_ASLEEP' });
    for (let i = 0; i < 50; i++) f.tick();
    expect(f.brain.state).toBe('SLEEPING'); // sleeps through the night
    f.setNight(false);
    f.tick(PIG_LIFE.sleep.wakeSpreadMs + 60 * 60_000); // after the morning delay, rested
    expect(f.until('IDLE', 20)).toBe('IDLE');
    expect(f.log).toContainEqual({ kind: 'rest', rest: 'WAKING_UP' });
    expect(f.log).toContainEqual({ kind: 'rest', rest: 'IDLE' });
  });

  it('a pig that appears at night is already asleep', () => {
    const f = farm('pig-1', { night: true });
    expect(f.brain.state).toBe('SLEEPING');
    expect(f.brain.restPose()).toBe('SLEEPING');
    expect(farm('pig-1').brain.restPose()).toBe('IDLE');
  });

  it('by day a pig is not sleepy enough to nap right away', () => {
    const f = farm();
    for (let i = 0; i < 100; i++) f.tick();
    expect(['FALLING_ASLEEP', 'SLEEPING', 'GO_TO_SLEEP']).not.toContain(f.brain.state);
  });

  it('a normal meal at night waits for the morning; a critical one wakes the pig to eat', () => {
    const f = farm('pig-1', { night: true });
    f.meal(1, 50);
    for (let i = 0; i < 20; i++) f.tick();
    expect(f.brain.state).toBe('SLEEPING');
    f.meal(1, 5); // the trough was empty and has just been refilled
    for (let i = 0; i < 6; i++) f.tick();
    expect(f.until('EATING')).toBe('EATING');
    expect(f.log).toContainEqual({ kind: 'rest', rest: 'WAKING_UP' });
    expect(f.until('GO_TO_SLEEP')).toBe('GO_TO_SLEEP'); // back to bed afterwards
  });

  it('pigs do not fall asleep at the same moment', () => {
    const asleepAt = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => {
      const f = farm(id);
      f.setNight(true);
      let t = 0;
      while (f.brain.state !== 'GO_TO_SLEEP' && t < 2000) {
        f.tick();
        t++;
      }
      return t;
    });
    expect(new Set(asleepAt).size).toBeGreaterThan(3);
    expect(Math.max(...asleepAt)).toBeLessThan(2000);
  });

  it('reduceMotion: sleeps and eats in place, never walks', () => {
    const f = farm();
    f.setStill(true);
    f.meal();
    f.until('EATING');
    f.setNight(true);
    f.until('SLEEPING');
    expect(f.log.some((c) => c.kind === 'walk')).toBe(false);
  });
});

describe('PL-1 free time, social, safety', () => {
  it('idles, wanders and looks around; personality varies the mix between pigs', () => {
    const mixes = ['a', 'b', 'c', 'd'].map((id) => {
      const f = farm(id);
      const seen = new Map<string, number>();
      for (let i = 0; i < 2000; i++) {
        f.tick();
        seen.set(f.brain.state, (seen.get(f.brain.state) ?? 0) + 1);
      }
      expect(seen.get('WANDER') ?? 0).toBeGreaterThan(0);
      expect(seen.get('IDLE') ?? 0).toBeGreaterThan(0);
      return seen.get('WANDER') ?? 0;
    });
    expect(new Set(mixes).size).toBeGreaterThan(1);
  });

  it('a sick or pregnant pig rests in place (no wandering), but still eats', () => {
    const f = farm();
    f.care.isSick = true;
    for (let i = 0; i < 200; i++) f.tick();
    expect(f.log.some((c) => c.kind === 'walk')).toBe(false);
    f.meal();
    expect(f.until('EATING')).toBe('EATING');
  });

  it('visits a friend once, then cools down (no endless following)', () => {
    let social = 'a';
    for (const id of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) {
      if (PIG_LIFE.social.chance * farm(id).brain.personality.social > 0.25) social = id;
    }
    const f = farm(social);
    f.setFriend({ id: 'friend', at: { x: 900, y: 600 } });
    for (let i = 0; i < 600; i++) f.tick();
    const visits = f.log.filter((c) => c.kind === 'callFriend').length;
    const cooldownTicks = PIG_LIFE.social.cooldownMs / PIG_LIFE.tickMs;
    expect(visits).toBeLessThanOrEqual(Math.ceil(600 / cooldownTicks) + 1);
  });

  it('a needed meal interrupts a visit or a stroll', () => {
    const f = farm();
    f.until('WANDER');
    f.meal();
    f.tick(PIG_LIFE.feed.maxReactMs);
    f.tick();
    expect(f.brain.state).toBe('SEEK_FOOD');
  });

  it('held by the player: nothing changes, timers freeze', () => {
    const f = farm();
    f.meal();
    f.until('EATING');
    f.setPaused(true);
    const before = f.log.length;
    for (let i = 0; i < 100; i++) f.tick();
    expect(f.log.length).toBe(before);
    expect(f.brain.state).toBe('EATING');
    f.setPaused(false);
    expect(f.until('WANDER')).toBe('WANDER');
  });

  it('never stuck: from any start, 24 h of ticks keep cycling through states', () => {
    const f = farm('pig-stuck');
    const states = new Set<string>();
    for (let h = 0; h < 24; h++) {
      f.setNight(h >= 20 || h < 5);
      if (h % 3 === 0) f.meal(1, h % 6 === 0 ? 5 : 50);
      for (let i = 0; i < 300; i++) {
        f.tick(12_000);
        states.add(f.brain.state);
      }
    }
    expect(states).toContain('SLEEPING');
    expect(states).toContain('EATING');
    expect(states).toContain('IDLE');
    expect(f.brain.state).not.toBe('WAKING_UP');
    expect(PIG_SLEEP.wakeUpMs).toBeGreaterThan(0);
  });

  it('performance: 100 brains × 1 h of AI ticks stays cheap', () => {
    const farms = Array.from({ length: 100 }, (_, i) => farm(`pig-${i}`));
    const t0 = performance.now();
    for (let i = 0; i < 7200; i++) for (const f of farms) f.tick();
    const ms = performance.now() - t0;
    // 720k brain ticks; well under a frame budget per AI tick (100 pigs).
    expect(ms / 7200).toBeLessThan(2);
  });
});
