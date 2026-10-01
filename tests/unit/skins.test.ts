import { describe, expect, it } from 'vitest';
import manifestJson from '../../public/assets/manifest/assets.json';
import { buyPig } from '../../src/core/actions/buyPig';
import { buySkin, equipSkin } from '../../src/core/actions/skins';
import { parseManifest } from '../../src/core/assets/manifestSchema';
import { createAssetRegistry } from '../../src/core/assets/registry';
import { BALANCE } from '../../src/core/config/balance';
import { advancePig } from '../../src/core/engine/advancePig';
import { discoverBreed, discoverSkin } from '../../src/core/engine/collection';
import { happiness } from '../../src/core/engine/happiness';
import { sellPrice } from '../../src/core/engine/pricing';
import { mulberry32 } from '../../src/core/rng';
import type { SaveGame } from '../../src/core/types';
import { vi } from '../../src/i18n/vi';
import { collectionVm, pigSkins, shopSkins } from '../../src/ui/skinsVm';
import { ctx, expectError, expectOk, farm } from './actionKit';
import { makePig } from './pigFactory';

const parsed = parseManifest(structuredClone(manifestJson));
if (!parsed.ok) throw new Error(parsed.message);
const assets = createAssetRegistry(parsed.manifest);
const skins = assets.skins;
const HOUR = 3600 * 1000;

const rich = (patch: Partial<SaveGame> = {}): SaveGame => {
  const s = farm([makePig({ growthProgress: 100 })], patch);
  return { ...s, player: { ...s.player, gold: 50_000, ...patch.player } };
};
const buy = (s: SaveGame, skinId: string) => buySkin(s, { skinId }, ctx(), skins);
const equip = (s: SaveGame, skinId: string, pigId = 'pig-1') =>
  equipSkin(s, { pigId, skinId }, ctx(), skins);

describe('buySkin (§8.13)', () => {
  it('charges priceGold, owns the skin, SKIN_PURCHASE, SKIN_BOUGHT, skin discovery bonus', () => {
    const s = rich();
    const r = expectOk(buy(s, 'pig_farmer'));
    const price = skins.get('pig_farmer')!.priceGold!;
    expect(r.state.player.ownedSkins).toContain('pig_farmer');
    expect(r.state.player.gold).toBe(s.player.gold - price + BALANCE.DISCOVERY_BONUS_GOLD);
    expect(r.state.transactions.map((t) => [t.type, t.amount])).toEqual(
      expect.arrayContaining([
        ['SKIN_PURCHASE', -price],
        ['DISCOVERY_BONUS', BALANCE.DISCOVERY_BONUS_GOLD],
      ]),
    );
    expect(r.state.collection.discoveredSkins).toContain('pig_farmer');
    expect(r.events.map((e) => e.type)).toEqual(
      expect.arrayContaining(['SKIN_BOUGHT', 'DISCOVERY']),
    );
    expect(r.events).toContainEqual({ type: 'SKIN_BOUGHT', skinId: 'pig_farmer', gold: -price });
  });

  it('rejects unknown, owned, unaffordable, not-for-sale and level-locked skins', () => {
    expectError((s) => buy(s, 'pig_nope'), rich(), 'INVALID_REQUEST');
    expectError((s) => buy(s, 'pig_classic'), rich(), 'SKIN_ALREADY_OWNED');
    const poor = rich();
    expectError(
      (s) => buy(s, 'pig_farmer'),
      { ...poor, player: { ...poor.player, gold: 10 } },
      'INSUFFICIENT_GOLD',
    );
    const thienlong = rich();
    const notOwned = { ...thienlong, player: { ...thienlong.player, ownedSkins: [] } };
    expectError((s) => buy(s, 'pig_thienlong'), notOwned, 'INSUFFICIENT_GOLD');
    expectError((s) => buy(s, 'pig_christmas'), rich(), 'LEVEL_TOO_LOW');
    const lv3 = rich();
    expectOk(buy({ ...lv3, player: { ...lv3.player, xp: BALANCE.LEVEL_XP[2]! } }, 'pig_christmas'));
  });
});

describe('equipSkin (§8.13)', () => {
  it('sets pig.skinId and emits SKIN_EQUIPPED; free and reversible', () => {
    const bought = expectOk(buy(rich(), 'pig_farmer')).state;
    const r = expectOk(equip(bought, 'pig_farmer'));
    expect(r.state.pigs[0]!.skinId).toBe('pig_farmer');
    expect(r.state.player.gold).toBe(bought.player.gold);
    expect(r.events).toEqual([{ type: 'SKIN_EQUIPPED', pigId: 'pig-1', skinId: 'pig_farmer' }]);
    expect(expectOk(equip(r.state, 'pig_classic')).state.pigs[0]!.skinId).toBe('pig_classic');
  });

  it('rejects a skin not owned, an unknown skin and an unknown pig', () => {
    expectError((s) => equip(s, 'pig_farmer'), rich(), 'SKIN_NOT_OWNED');
    expectError((s) => equip(s, 'pig_nope'), rich(), 'INVALID_REQUEST');
    expectError((s) => equip(s, 'pig_classic', 'nobody'), rich(), 'PIG_NOT_FOUND');
  });

  it('rejects a breed outside allowedBreeds', () => {
    const only = {
      ...skins,
      get: (id: string) => ({ ...skins.get(id)!, allowedBreeds: ['PIG_MYTHICAL' as const] }),
    };
    expectError(
      (s) => equipSkin(s, { pigId: 'pig-1', skinId: 'pig_classic' }, ctx(), only),
      rich(),
      'SKIN_BREED_NOT_ALLOWED',
    );
  });

  it('skin changes no number: same sellPrice, happiness and growth with any skin (D19)', () => {
    const base = makePig({ growthProgress: 40, hunger: 70, cleanliness: 55 });
    const dressed = { ...base, skinId: 'pig_wizard' };
    expect(sellPrice(dressed)).toBe(sellPrice(base));
    expect(happiness(dressed)).toBe(happiness(base));
    const a = advancePig(base, 6 * HOUR, mulberry32(3));
    const b = advancePig(dressed, 6 * HOUR, mulberry32(3));
    expect({ ...b, skinId: base.skinId }).toEqual(a);
  });
});

describe('collection book (§8.15, §14.5)', () => {
  it('breed discovery bonus fires exactly once; its default skin enters the book with it', () => {
    const s = farm();
    const first = expectOk(buyPig(s, { breed: 'PIG_EARTH_PINK', gender: 'MALE' }, ctx()));
    expect(first.state.collection).toEqual({
      discoveredBreeds: ['PIG_EARTH_PINK'],
      discoveredSkins: ['pig_classic'],
    });
    const second = expectOk(
      buyPig(first.state, { breed: 'PIG_EARTH_PINK', gender: 'FEMALE' }, ctx()),
    );
    expect(second.events.some((e) => e.type === 'DISCOVERY')).toBe(false);
    expect(second.state.transactions.filter((t) => t.type === 'DISCOVERY_BONUS')).toHaveLength(1);
    expect(discoverBreed(second.state, 'PIG_EARTH_PINK', ctx())).toEqual({
      state: second.state,
      events: [],
    });
  });

  it('skin discovery bonus fires exactly once per skin', () => {
    const once = discoverSkin(farm(), 'pig_farmer', ctx());
    expect(once.events.filter((e) => e.type === 'DISCOVERY')).toEqual([
      { type: 'DISCOVERY', kind: 'SKIN', id: 'pig_farmer', gold: BALANCE.DISCOVERY_BONUS_GOLD },
    ]);
    expect(discoverSkin(once.state, 'pig_farmer', ctx())).toEqual({
      state: once.state,
      events: [],
    });
  });

  it('view: undiscovered entries are silhouettes; progress counts found entries', () => {
    const s = farm([], {
      collection: { discoveredBreeds: ['PIG_EARTH_PINK'], discoveredSkins: [] },
    });
    const vm = collectionVm(s, assets);
    expect(vm.breeds.map((b) => b.found)).toEqual([true, false, false, false]);
    expect(vm.breeds[1]!.name).toBe(vi.collection.undiscovered);
    expect(vm.breedProgress).toBe('1/4');
    expect(vm.skins).toHaveLength(skins.all().length);
    // Pre-R07B saves: a discovered breed's default skin shows as found.
    expect(vm.skins.filter((e) => e.found).map((e) => e.id)).toEqual(['pig_classic']);
    expect(vm.skins[0]!.thumb).toMatch(/^assets\//);
  });

  it('view: shop shows level lock first; wardrobe lists owned skins, the worn one disabled', () => {
    const shop = shopSkins(rich(), 0, assets);
    expect(shop.find((c) => c.id === 'pig_christmas')!.button.reason).toBe(t3());
    expect(shop.find((c) => c.id === 'pig_farmer')!.button.reason).toBeNull();
    const wardrobe = pigSkins(rich(), rich().pigs[0]!, assets);
    expect(wardrobe.map((w) => w.id)).toEqual(rich().player.ownedSkins);
    expect(wardrobe[0]!.button.reason).toBe(vi.action.equipped);
  });
});

const t3 = () => vi.shop.slotLocked.replace('{level}', '3');
