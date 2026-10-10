// Decorations you place, store and move (GĐ6, spec V2 §9): a placed one lifts the mood of the pen, a stored one does
// not; every spot of a decoration has its placement in the farm layout.
import { describe, expect, it } from 'vitest';
import { arrangeDecor } from '../../src/areas/farm/logic/actions/arrangeDecor';
import { DECORS, DECOR_IDS } from '../../src/areas/farm/logic/config/decor';
import { decorBonus, penMood, placedDecor } from '../../src/areas/farm/logic/decor';
import { FARM_LAYOUT } from '../../src/areas/farm/scene/config/layout';
import { shopDecor } from '../../src/areas/farm/ui/actionsVm';
import { farmOf, withFarm } from '../../src/areas/farm/logic/save/lens';
import { ctx, expectError, expectOk, farm } from './actionKit';
import { world } from './worldKit';
import { makePig } from './pigFactory';

const owning = (ids: (keyof typeof DECORS)[]) => farm([makePig({ growthProgress: 100 })], { decor: ids });

describe('decorations', () => {
  it('a save from before GĐ6 has every decoration placed on its first spot', () => {
    const s = owning(['DECOR_HAY_BALE', 'DECOR_FENCE']);
    expect(placedDecor(s)).toEqual(['DECOR_HAY_BALE', 'DECOR_FENCE']);
    expect(decorBonus(s)).toBe(DECORS.DECOR_HAY_BALE.happyBonus + DECORS.DECOR_FENCE.happyBonus);
  });

  it('storing takes the bonus away, placing gives it back; neither costs anything', () => {
    const s = owning(['DECOR_FENCE']);
    const stored = expectOk(arrangeDecor(s, { decorId: 'DECOR_FENCE', op: 'store' }, ctx(10)));
    expect(decorBonus(stored.state)).toBe(0);
    expect(placedDecor(stored.state)).toEqual([]);
    expect(stored.state.player.gold).toBe(s.player.gold);
    expect(stored.events).toContainEqual({ type: 'DECOR_ARRANGED', decorId: 'DECOR_FENCE', op: 'store' });
    expectError((x) => arrangeDecor(x, { decorId: 'DECOR_FENCE', op: 'store' }, ctx()), stored.state, 'NOTHING_TO_DO');
    const back = expectOk(arrangeDecor(stored.state, { decorId: 'DECOR_FENCE', op: 'place' }, ctx(20)));
    expect(decorBonus(back.state)).toBe(DECORS.DECOR_FENCE.happyBonus);
    expectError((x) => arrangeDecor(x, { decorId: 'DECOR_FENCE', op: 'place' }, ctx()), back.state, 'NOTHING_TO_DO');
  });

  it('moving goes to the next spot and round again; a stored decoration cannot be moved', () => {
    let s = owning(['DECOR_WINDMILL']);
    const spots = DECORS.DECOR_WINDMILL.spots;
    const seen = [0];
    for (let i = 0; i < spots; i += 1) {
      s = expectOk(arrangeDecor(s, { decorId: 'DECOR_WINDMILL', op: 'move' }, ctx(i))).state;
      seen.push(s.decorPlan!.DECOR_WINDMILL!.spot);
    }
    expect(seen).toEqual([0, 1, 2, 0]);
    const stored = expectOk(arrangeDecor(s, { decorId: 'DECOR_WINDMILL', op: 'store' }, ctx())).state;
    expectError((x) => arrangeDecor(x, { decorId: 'DECOR_WINDMILL', op: 'move' }, ctx()), stored, 'NOTHING_TO_DO');
  });

  it('only what the player owns can be arranged', () => {
    expectError((x) => arrangeDecor(x, { decorId: 'DECOR_FENCE', op: 'store' }, ctx()), owning([]), 'INVALID_REQUEST');
  });

  it('pets and decorations both lift the pen; stored decorations do not', () => {
    const pets = [1, 2].map((i) => makePig({ id: `p${i}`, slotIndex: i, growthProgress: 100, purpose: 'PET' }));
    const s = farm(pets, { decor: ['DECOR_HAY_BALE'], decorPlan: { DECOR_HAY_BALE: { spot: 1, stored: false } } });
    expect(penMood(s)).toBe(2 + DECORS.DECOR_HAY_BALE.happyBonus);
    expect(penMood({ ...s, decorPlan: { DECOR_HAY_BALE: { spot: 1, stored: true } } })).toBe(2);
  });

  it('the plan survives the world save (the farm slice) and the shop shows the buttons for owned decorations only', () => {
    const s = expectOk(arrangeDecor(owning(['DECOR_FENCE']), { decorId: 'DECOR_FENCE', op: 'move' }, ctx())).state;
    const reread = farmOf(withFarm(world(owning(['DECOR_FENCE'])), s));
    expect(reread.decorPlan).toEqual({ DECOR_FENCE: { spot: 1, stored: false } });
    const vm = shopDecor(s, 0);
    const fence = vm.items.find((i) => i.id === 'DECOR_FENCE')!;
    expect(fence.toggle?.label).toBeTruthy();
    expect(fence.move?.reason).toBeNull();
    expect(vm.items.find((i) => i.id === 'DECOR_WINDMILL')!.toggle).toBeNull();
  });

  it('the farm layout has a placement for every spot of every decoration', () => {
    for (const id of DECOR_IDS) {
      const spots = FARM_LAYOUT.placements.filter((p) => p.decor === id).map((p) => p.spot ?? 0).sort();
      expect(spots, id).toEqual(Array.from({ length: DECORS[id].spots }, (_, i) => i));
    }
  });
});
