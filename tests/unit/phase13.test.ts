// GĐ13: what integration found. World Development counts the buildings at level 3 or more (decision 013), the same
// number for the unlock gate and for the Order Board's view.
import { describe, expect, it } from 'vitest';
import { AREAS } from '../../src/app/areas';
import { GOALS } from '../../src/app/goals';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { aquariumOf, withAquarium } from '../../src/areas/aquarium/logic/save/lens';
import { cloudOf, withCloud } from '../../src/areas/cloud/logic/save/lens';
import { gardenOf, withGarden } from '../../src/areas/garden/logic/save/lens';
import { aquariumArea } from '../../src/areas/aquarium';
import { cloudArea } from '../../src/areas/cloud';
import { gardenArea } from '../../src/areas/garden';
import { FARM_AREA_ID, farmOf, withFarm } from '../../src/areas/farm/logic/save/lens';
import { mulberry32 } from '../../src/core/rng';
import { defaultSettings, type WorldSave } from '../../src/core/save/world';

const T0 = 20_000 * 86_400_000;

function openWorld(): WorldSave {
  const ctx = { now: T0, rng: mulberry32(1), dayOffsetMs: 0 };
  const fresh = SAVE_CODEC.newWorld(ctx, defaultSettings());
  return cloudArea.init(aquariumArea.init(gardenArea.init(fresh, ctx), ctx), ctx);
}

describe('World Development counts buildings at level 3 or more', () => {
  it('starts at none, then one point for each building that reaches level 3', () => {
    const w = openWorld();
    expect(AREAS.buildingsLv3(w)).toBe(0);
    const base = AREAS.worldDevelopment(w);

    const trough = withFarm(w, { ...farmOf(w), trough: { ...farmOf(w).trough, level: 3, capacity: 200 } });
    expect(AREAS.buildingsLv3(trough)).toBe(1);

    const garden = withGarden(trough, { ...gardenOf(trough), sprinkler: 3 });
    const tank = withAquarium(garden, { ...aquariumOf(garden), tank: { ...aquariumOf(garden).tank, level: 4 } });
    const spring = withCloud(tank, { ...cloudOf(tank), spring: { ...cloudOf(tank).spring, level: 3 } });
    expect(AREAS.buildingsLv3(spring)).toBe(4);
    expect(AREAS.worldDevelopment(spring)).toBe(base + 4);
  });

  it('level 2 does not count', () => {
    const w = openWorld();
    const lvl2 = withGarden(w, { ...gardenOf(w), sprinkler: 2 });
    expect(AREAS.buildingsLv3(lvl2)).toBe(0);
  });

  it('the Order Board sees the same World Development as the unlock gate', () => {
    const w = openWorld();
    const built = withFarm(withGarden(w, { ...gardenOf(w), sprinkler: 3 }), { ...farmOf(w), trough: { ...farmOf(w).trough, level: 3, capacity: 200 } });
    expect(AREAS.buildingsLv3(built)).toBe(2);
    expect(GOALS.view(built).worldDevelopment).toBe(AREAS.worldDevelopment(built));
    expect(GOALS.view(w).worldDevelopment).toBe(AREAS.worldDevelopment(w));
    expect(FARM_AREA_ID in built.areas).toBe(true);
  });
});
