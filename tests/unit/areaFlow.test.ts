// Moving between the plaza and the Areas (GĐ3): hooks in order, nothing happens for the same place or an
// unknown Area, and — the point of the phase — walking between places never changes the numbers.
import { describe, expect, it } from 'vitest';
import { AREAS } from '../../src/app/areas';
import { createAreaFlow } from '../../src/app/areaFlow';
import { buyPig } from '../../src/areas/farm/logic/actions/buyPig';
import { farmOf } from '../../src/areas/farm/logic/save/lens';
import { newGame } from '../../src/areas/farm/logic/save/newFarm';
import { bindFarmStage } from '../../src/areas/farm/stage';
import { setPlayerSpot } from '../../src/core/player/player';
import { mulberry32 } from '../../src/core/rng';
import { world } from './worldKit';

const HOUR = 3_600_000;
const T0 = 1_700_000_000_000;

function recorder() {
  const log: string[] = [];
  const flow = createAreaFlow({
    plaza: { enter: (from) => log.push(`plaza.enter(${from})`), exit: () => log.push('plaza.exit') },
    area: (id) =>
      id === 'sobi_farm' ? { onEnter: () => log.push('farm.enter'), onExit: () => log.push('farm.exit') } : undefined,
    changed: (to, from) => log.push(`changed(${from}->${to})`),
  });
  return { log, flow };
}

describe('area flow', () => {
  it('leaves one place and enters the next, then reports the change', () => {
    const { log, flow } = recorder();
    expect(flow.current()).toBe('plaza');
    expect(flow.go('sobi_farm')).toBe(true);
    expect(flow.go('plaza')).toBe(true);
    expect(log).toEqual([
      'plaza.exit',
      'farm.enter',
      'changed(plaza->sobi_farm)',
      'farm.exit',
      'plaza.enter(sobi_farm)',
      'changed(sobi_farm->plaza)',
    ]);
  });

  it('ignores the same place and an Area that is not built', () => {
    const { log, flow } = recorder();
    expect(flow.go('plaza')).toBe(false);
    expect(flow.go('sobi_garden')).toBe(false);
    expect(flow.current()).toBe('plaza');
    expect(log).toEqual([]);
  });

  it('the farm hooks drive whatever canvas is bound, and nothing when none is', () => {
    const calls: string[] = [];
    AREAS.get('sobi_farm')?.onEnter?.(); // no canvas bound: harmless
    bindFarmStage({ enter: () => calls.push('enter'), exit: () => calls.push('exit') });
    AREAS.get('sobi_farm')?.onEnter?.();
    AREAS.get('sobi_farm')?.onExit?.();
    bindFarmStage(null);
    expect(calls).toEqual(['enter', 'exit']);
  });
});

describe('walking between places keeps the numbers', () => {
  function herd() {
    let s = newGame({ now: T0, rng: mulberry32(1) });
    for (const gender of ['FEMALE', 'MALE'] as const) {
      const r = buyPig(s, { breed: 'PIG_EARTH_PINK', gender }, { now: T0, rng: mulberry32(2) });
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    }
    return world(s);
  }
  const run = (visit: boolean) => {
    let w = herd();
    const { flow } = recorder();
    for (let h = 1; h <= 72; h++) {
      if (visit && h % 5 === 0) {
        flow.go(flow.current() === 'plaza' ? 'sobi_farm' : 'plaza');
        const spot = setPlayerSpot(w, { area: flow.current(), x: h, y: h, facing: 'left' }, { now: T0, rng: mulberry32(h), dayOffsetMs: 0 });
        if (spot.ok) w = spot.state;
      }
      w = AREAS.advance(w, T0 + h * HOUR, mulberry32(7), 0, 'online').state;
    }
    return w;
  };

  it('three days with many trips = the same farm, wallet, items and progress as staying put', () => {
    const away = run(true);
    const still = run(false);
    expect(farmOf(away)).toEqual(farmOf(still));
    expect({ ...away, player: still.player }).toEqual(still);
  });
});
