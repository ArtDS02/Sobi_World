// systems/plants: one plot over real time (GAME_BALANCE §5). Closed form: any way of cutting the time
// into slices gives the same plot, which is what makes online, background and offline agree.
import { describe, expect, it } from 'vitest';
import {
  advancePlot,
  emptyPlot,
  growthShare,
  harvestYield,
  plotStage,
  requiredMs,
  settlePlot,
  sow,
  type CropRule,
  type PlotRules,
  type PlotState,
} from '../../src/systems/plants/plot';

const H = 3_600_000;
const rules: PlotRules = { dryRate: 0.5, fertilizerFactor: 0.75, fertilizerBonusYield: 1, witherAfterMs: 48 * H, witherYieldFactor: 0.5 };
const corn: CropRule = { growMs: 4 * H, yield: 3 };
const T0 = 1_000_000;

const run = (plot: PlotState, from: number, to: number, step: number, covered = false): PlotState => {
  let p = plot;
  for (let t = from; t < to; t += step) p = advancePlot(p, corn, rules, covered, t, Math.min(to, t + step));
  return p;
};

describe('growth', () => {
  it('a watered crop grows at full speed and ripens exactly on time', () => {
    const plot = { ...sow('c'), wetUntil: T0 + 10 * H };
    const grown = advancePlot(plot, corn, rules, false, T0, T0 + 3 * H);
    expect(grown.ripeAt).toBeNull();
    expect(growthShare(grown, corn, rules)).toBeCloseTo(0.75);
    const ripe = advancePlot(plot, corn, rules, false, T0, T0 + 6 * H);
    expect(ripe.ripeAt).toBeCloseTo(T0 + 4 * H, 3);
  });

  it('an unwatered crop grows at half speed: twice as long', () => {
    const ripe = advancePlot(sow('c'), corn, rules, false, T0, T0 + 9 * H);
    expect(ripe.ripeAt).toBeCloseTo(T0 + 8 * H, 3);
  });

  it('watering for part of the time: wet hours at full speed, then dry at half', () => {
    const plot = { ...sow('c'), wetUntil: T0 + 2 * H }; // 2 h wet = half; the other half takes 4 h dry
    const ripe = advancePlot(plot, corn, rules, false, T0, T0 + 20 * H);
    expect(ripe.ripeAt).toBeCloseTo(T0 + 6 * H, 3);
  });

  it('a sprinkler keeps the plot watered all the time', () => {
    const ripe = advancePlot(sow('c'), corn, rules, true, T0, T0 + 5 * H);
    expect(ripe.ripeAt).toBeCloseTo(T0 + 4 * H, 3);
  });

  it('fertiliser shortens the growth by a quarter and adds to the harvest', () => {
    const plot = { ...sow('c'), fertilized: true };
    expect(requiredMs(plot, corn, rules)).toBe(3 * H);
    const ripe = advancePlot(plot, corn, rules, true, T0, T0 + 4 * H);
    expect(ripe.ripeAt).toBeCloseTo(T0 + 3 * H, 3);
    expect(harvestYield(ripe, corn, rules, T0 + 3 * H)).toBe(4);
  });

  it('fertilising a crop that is already past the shorter time ripens it on the spot', () => {
    const grown = advancePlot(sow('c'), corn, rules, true, T0, T0 + 3.5 * H);
    expect(grown.ripeAt).toBeNull();
    const done = settlePlot({ ...grown, fertilized: true }, corn, rules, T0 + 3.5 * H);
    expect(done.ripeAt).toBe(T0 + 3.5 * H);
  });

  it('an empty plot and a ripe one do not change', () => {
    const empty = emptyPlot();
    expect(advancePlot(empty, undefined, rules, true, T0, T0 + H)).toBe(empty);
    const ripe = advancePlot(sow('c'), corn, rules, true, T0, T0 + 5 * H);
    expect(advancePlot(ripe, corn, rules, true, T0 + 5 * H, T0 + 9 * H)).toBe(ripe);
  });
});

describe('the same plot in every simulation mode', () => {
  const watered = { ...sow('c'), wetUntil: T0 + 2.5 * H };
  const span = 12 * H;
  const jump = advancePlot(watered, corn, rules, false, T0, T0 + span);

  it.each([60_000, 600_000, 7 * 60_000, H])('slices of %i ms give the same ripe time as one jump', (step) => {
    const sliced = run(watered, T0, T0 + span, step);
    expect(sliced.ripeAt).not.toBeNull();
    expect(sliced.ripeAt!).toBeCloseTo(jump.ripeAt!, -1); // within a few ms of float rounding
    expect(sliced.grown).toBeCloseTo(jump.grown, -1);
  });

  it('a covered plot too', () => {
    const a = run(sow('c'), T0, T0 + span, 60_000, true);
    const b = run(sow('c'), T0, T0 + span, 600_000, true);
    expect(a.ripeAt!).toBeCloseTo(b.ripeAt!, -1);
  });
});

describe('ripe, wilted, harvest', () => {
  const ripe = advancePlot(sow('c'), corn, rules, true, T0, T0 + 4 * H); // ripe at T0 + 4 h
  const ripeAt = ripe.ripeAt!;

  it('stages', () => {
    expect(plotStage(emptyPlot(), rules, T0)).toBe('empty');
    expect(plotStage(sow('c'), rules, T0)).toBe('growing');
    expect(plotStage(ripe, rules, ripeAt + 47 * H)).toBe('ripe');
    expect(plotStage(ripe, rules, ripeAt + 49 * H)).toBe('wilted');
  });

  it('a crop left more than 48 h gives half, never nothing', () => {
    expect(harvestYield(ripe, corn, rules, ripeAt + H)).toBe(3);
    expect(harvestYield(ripe, corn, rules, ripeAt + 49 * H)).toBe(1); // floor(3 × 0.5)
    expect(harvestYield(ripe, { growMs: 1, yield: 1 }, rules, ripeAt + 49 * H)).toBe(1);
    expect(harvestYield({ ...ripe, fertilized: true }, corn, rules, ripeAt + 49 * H)).toBe(2); // floor(4 × 0.5)
  });
});
