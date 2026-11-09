// Decision 056: World Level 100 — the long table, the once-only rewards and the v12 → v13 save migration.
import { describe, expect, it } from 'vitest';
import { CONTENT } from '../../src/core/config/content';
import { WORLD_LEVELS } from '../../src/core/config/progression';
import { levelFromXp, levelProgress, levelRewardsBetween } from '../../src/core/progression/levels';
import { payLevelRewards } from '../../src/core/progression/xp';
import { emptyWorld } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';
import { mulberry32 } from '../../src/core/rng';
import { defaultSettings } from '../../src/core/save/world';
import { progressionFileSchema } from '../../content/schemas/shared/progression';

const ctx = (): ActionContext => ({ now: 1_000, rng: mulberry32(1) });
const worldAt = (xp: number) => {
  const w = emptyWorld(0, defaultSettings(), 'sobi_farm');
  return { ...w, progression: { ...w.progression, areas: { world: { xp } } } };
};

describe('level table 1..100', () => {
  const xp = WORLD_LEVELS.xp;
  it('keeps the first 20 levels and ends at 1,335,135 XP for level 100', () => {
    expect(WORLD_LEVELS.maxLevel).toBe(100);
    expect(xp).toHaveLength(100);
    expect(xp[19]).toBe(67_135);
    expect(xp[99]).toBe(1_335_135);
  });
  it('uses 4000 + 300 x (n - 21) XP per level above 20', () => {
    for (let n = 21; n <= 100; n++) expect(xp[n - 1]! - xp[n - 2]!).toBe(4000 + 300 * (n - 21));
  });
  it('levelFromXp reads the long table and caps at 100', () => {
    expect(levelFromXp(67_134, WORLD_LEVELS)).toBe(19);
    expect(levelFromXp(67_135, WORLD_LEVELS)).toBe(20);
    expect(levelFromXp(71_135, WORLD_LEVELS)).toBe(21);
    expect(levelFromXp(114_848, WORLD_LEVELS)).toBe(29);
    expect(levelFromXp(9_999_999, WORLD_LEVELS)).toBe(100);
    expect(levelProgress(9_999_999, WORLD_LEVELS)).toMatchObject({ level: 100, next: null, percent: 100 });
  });
  it('the schema rejects rewards past the cap or out of order', () => {
    const base = structuredClone(CONTENT.progression);
    expect(progressionFileSchema.safeParse(base).success).toBe(true);
    const bad = structuredClone(base);
    bad.worldLevel.rewards = [{ level: 101, coins: 1, gems: 0 }];
    expect(progressionFileSchema.safeParse(bad).success).toBe(false);
  });
});

describe('level rewards', () => {
  it('pays 1000 + 100 x (n - 21) coins and 1 Gem per level above 20', () => {
    expect(levelRewardsBetween(20, 21, WORLD_LEVELS)).toEqual({ coins: 1000, gems: 1 });
    expect(levelRewardsBetween(20, 22, WORLD_LEVELS)).toEqual({ coins: 2100, gems: 2 });
    expect(levelRewardsBetween(1, 20, WORLD_LEVELS)).toEqual({ coins: 0, gems: 0 });
    expect(levelRewardsBetween(20, 100, WORLD_LEVELS).gems).toBe(80);
  });
  it('an old save past level 20 gets ONE summary event, the sum through the ledger, and nothing on the second run', () => {
    const old = { ...worldAt(114_848), progression: { ...worldAt(0).progression, areas: { world: { xp: 114_848 } }, levelRewardsPaid: 20 } };
    const r = payLevelRewards(old, WORLD_LEVELS, ctx());
    expect(r.events).toEqual([{ type: 'WORLD_LEVEL_REWARD', fromLevel: 21, toLevel: 29, coins: 12_600, gems: 9 }]);
    expect(r.state.wallet.coins).toBe(12_600);
    expect(r.state.wallet.gems).toBe(9);
    expect(r.state.transactions.map((t) => [t.currency, t.type])).toEqual([['gems', 'WORLD_LEVEL_REWARD'], ['coins', 'WORLD_LEVEL_REWARD']]);
    expect(r.state.progression.levelRewardsPaid).toBe(29);
    const again = payLevelRewards(r.state, WORLD_LEVELS, ctx());
    expect(again.events).toEqual([]);
    expect(again.state).toBe(r.state);
  });
  it('pays nothing and changes nothing when no new level is reached', () => {
    const w = worldAt(10);
    expect(payLevelRewards(w, WORLD_LEVELS, ctx())).toEqual({ state: w, events: [] });
  });
});
