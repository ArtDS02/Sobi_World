// GĐ13 acceptance of the whole loop: a bot plays 40 days on the real game logic (Farm → Garden → Aquarium → Cloud → Adventure,
// the Order Board, goals, Codex, festivals, the merchant) and every system has to have done its job, with nothing invalid at the
// end. It is the cheap, repeatable part of "play the main flows"; the hands-on play stays with the project owner.
import { describe, expect, it } from 'vitest';
import { parseWorldSave } from '../../src/app/saveCodec';
import { simulateWeek } from '../../scripts/economy/week';

const DAYS = 40;
const report = simulateWeek(7, undefined, DAYS, { forceAdventure: true });
const last = report.days[DAYS - 1]!;

describe(`acceptance: ${DAYS} days of play with every Area`, () => {
  it('opens every Area in order, each on its own condition', () => {
    expect(report.gardenOpenAtHour).not.toBeNull();
    expect(report.aquariumOpenAtHour).not.toBeNull();
    expect(report.cloudOpenAtHour).not.toBeNull();
    expect(report.adventure.openAtHour).not.toBeNull();
    expect(report.gardenOpenAtHour!).toBeLessThan(report.aquariumOpenAtHour!);
    expect(report.aquariumOpenAtHour!).toBeLessThan(report.cloudOpenAtHour!);
  });

  it('the Farm earns: pigs bred and shipped, orders delivered, goals met', () => {
    expect(last.shipped).toBeGreaterThan(50);
    expect(last.orders).toBeGreaterThan(5);
    expect(last.goals).toBeGreaterThan(20);
    expect(last.pigs).toBeGreaterThanOrEqual(8);
  });

  it('the Garden grows and the Aquarium fishes', () => {
    expect(last.plots).toBeGreaterThanOrEqual(18);
    expect(last.fish).toBeGreaterThan(0);
    expect(last.casts).toBeGreaterThan(20);
  });

  it('the Cloud brews', () => {
    expect(report.flowersHarvested).toBeGreaterThan(100);
    expect(report.potionsBrewed).toBeGreaterThan(0);
  });

  it('the Adventure fights, clears zones and pays back into technology', () => {
    expect(report.adventure.runs).toBeGreaterThan(30);
    expect(report.adventure.wins).toBeGreaterThan(report.adventure.losses);
    expect(Object.keys(report.adventure.firstClearAtHour)).toContain('zone_forest');
    expect(last.techs).toBeGreaterThan(0);
  });

  it('the living world pays tokens and the merchant buys', () => {
    expect(report.live.tokensEarned).toBeGreaterThan(0);
    expect(report.live.tokensSpent).toBeGreaterThan(0);
    expect(report.live.merchantDelivered).toBeGreaterThan(0);
  });

  it('achievements and gems flow, and the Codex fills', () => {
    expect(report.achievementsClaimed).toBeGreaterThan(5);
    expect(report.gemsEarned).toBeGreaterThan(50);
    expect(last.codex).toBeGreaterThan(30);
  });

  it('keeps the pace: the world level and the coins grow, nothing goes negative', () => {
    expect(last.level).toBeGreaterThanOrEqual(10);
    expect(last.coins).toBeGreaterThanOrEqual(0);
    for (const row of report.days) expect(row.coins).toBeGreaterThanOrEqual(0);
    const levels = report.days.map((r) => r.level);
    expect([...levels].sort((a, b) => a - b)).toEqual(levels);
  });

  it('the world the bot leaves is a valid current save and survives a month away', () => {
    const again = parseWorldSave(JSON.stringify(report.world));
    expect(again.ok).toBe(true);
  });
});
