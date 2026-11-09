// Decision 056: forging plot skins — the content rules, the blueprint conditions, paying in coins or Gems through the ledger,
// applying a skin to a cloud tier / garden zone, the forge's card data, and the world save's `cosmetics`.
import { describe, expect, it } from 'vitest';
import { plotSkinsFileSchema } from '../../content/schemas/shared/plotSkins';
import { GOALS } from '../../src/app/goals';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { cloudArea } from '../../src/areas/cloud';
import { applyTierSkin } from '../../src/areas/cloud/logic/actions/buildings';
import { sceneState as cloudScene } from '../../src/areas/cloud/logic/derived';
import { cloudOf } from '../../src/areas/cloud/logic/save/lens';
import { gardenArea } from '../../src/areas/garden';
import { applyZoneSkin } from '../../src/areas/garden/logic/actions/buildings';
import { sceneState as gardenScene } from '../../src/areas/garden/logic/derived';
import { gardenOf } from '../../src/areas/garden/logic/save/lens';
import { PLOT_SKIN_RULES, SKIN_ART_IDS, skinArtId } from '../../src/core/config/plotSkins';
import { WORLD_LEVELS } from '../../src/core/config/progression';
import { goalsEventsToWorld } from '../../src/core/goals/events';
import { skinStatus, unlockMet } from '../../src/core/plots/skins';
import { mulberry32 } from '../../src/core/rng';
import type { WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';
import { skinCardsVm, skinStripVm } from '../../src/ui/world/skinForgeVm';

const T0 = 20_000 * 86_400_000;
const ctxAt = (seed = 5): ActionContext => ({ now: T0, rng: mulberry32(seed) });
const ok = (r: { ok: boolean; state?: WorldSave; error?: string }): WorldSave => {
  if (!r.ok) throw new Error(`action failed: ${r.error}`);
  return r.state as WorldSave;
};
const err = (r: { ok: boolean; error?: string }): string | undefined => (r.ok ? undefined : r.error);

const skin = (id: string) => PLOT_SKIN_RULES.skins.find((s) => s.id === id)!;
const atLevel = (w: WorldSave, level: number): WorldSave => ({ ...w, progression: { ...w.progression, areas: { ...w.progression.areas, world: { xp: WORLD_LEVELS.xp[level - 1]! } } } });
/** A world with the Cloud and the Garden open, coins, gems and a bag; level 30 unless told. */
function world(bag: Record<string, number> = {}, coins = 100_000, gems = 100, level = 30): WorldSave {
  const fresh = SAVE_CODEC.newWorld(ctxAt());
  const opened = gardenArea.init(cloudArea.init(fresh, ctxAt()), ctxAt());
  return atLevel({ ...opened, wallet: { ...opened.wallet, coins, gems }, inventory: { items: { ...bag } } }, level);
}
const STARRY_BAG = { item_flower_moon_lily: 20, item_ancient_rune: 2 };

describe('content', () => {
  it('has the four v1 skins, each priced the same in coins and Gems (1 Gem = 500 coins)', () => {
    expect(PLOT_SKIN_RULES.skins.map((s) => s.id)).toEqual(['verdant', 'pearl_sea', 'crystal', 'starry']);
    expect(PLOT_SKIN_RULES.gemRate).toBe(500);
    for (const s of PLOT_SKIN_RULES.skins) expect(s.coins).toBe(s.gems * 500);
    expect([skin('verdant').coins, skin('verdant').gems]).toEqual([10_000, 20]);
    expect([skin('starry').coins, skin('starry').gems]).toEqual([30_000, 60]);
  });
  it('the schema refuses a price that is not gems x gemRate, and a duplicate id', () => {
    const base = structuredClone(PLOT_SKIN_RULES);
    expect(plotSkinsFileSchema.safeParse(base).success).toBe(true);
    const off = structuredClone(base);
    off.skins[0]!.coins += 1;
    expect(plotSkinsFileSchema.safeParse(off).success).toBe(false);
    const dup = structuredClone(base);
    dup.skins[1]!.id = dup.skins[0]!.id;
    expect(plotSkinsFileSchema.safeParse(dup).success).toBe(false);
  });
  it('every skin has a cloud bed and a dry and a watered soil bed', () => {
    expect(SKIN_ART_IDS).toHaveLength(12);
    expect(skinArtId('crystal', 'soil_wet')).toBe('skin_crystal_soil_wet');
  });
});

describe('blueprints', () => {
  it('Starry opens at world level 30', () => {
    expect(unlockMet(world({}, 0, 0, 29), skin('starry').unlock, WORLD_LEVELS)).toBe(false);
    expect(unlockMet(world({}, 0, 0, 30), skin('starry').unlock, WORLD_LEVELS)).toBe(true);
  });
  it('Pearl Sea opens with 10 fish in the Codex', () => {
    const w = world();
    const fish = (n: number): WorldSave => ({ ...w, collection: { ...w.collection, discovered: { ...w.collection.discovered, fish: Array.from({ length: n }, (_, i) => `fish_${i}`) } } });
    expect(unlockMet(fish(9), skin('pearl_sea').unlock, WORLD_LEVELS)).toBe(false);
    expect(unlockMet(fish(10), skin('pearl_sea').unlock, WORLD_LEVELS)).toBe(true);
  });
  it('Crystal opens once the Cloud lab has given a Crystal Peony', () => {
    const w = world();
    expect(unlockMet(w, skin('crystal').unlock, WORLD_LEVELS)).toBe(false);
    const g = cloudOf(w);
    const found = { ...w, areas: { ...w.areas, sobi_cloud: { ...g, lab: { found: ['flower_crystal_peony'], misses: {} } } } };
    expect(unlockMet(found, skin('crystal').unlock, WORLD_LEVELS)).toBe(true);
  });
  it('Verdant opens when the forest boss was beaten', () => {
    const w = world();
    expect(unlockMet(w, skin('verdant').unlock, WORLD_LEVELS)).toBe(false);
    const beaten = { ...w, areas: { ...w.areas, sobi_adventure: { cleared: { zone_forest: 2 } } } };
    expect(unlockMet(beaten, skin('verdant').unlock, WORLD_LEVELS)).toBe(true);
    expect(skinStatus(beaten, skin('verdant'), WORLD_LEVELS)).toBe('forgeable');
    expect(skinStatus(world(), skin('verdant'), WORLD_LEVELS)).toBe('locked');
  });
});

describe('forging', () => {
  it('pays coins through the ledger, takes the materials, adds the skin for good and gives 30 XP once', () => {
    const w = world(STARRY_BAG);
    const after = ok(GOALS.forgeSkin('starry', 'coins')(w, ctxAt()));
    expect(after.wallet.coins).toBe(100_000 - 30_000);
    expect(after.wallet.gems).toBe(100);
    expect(after.inventory.items.item_flower_moon_lily).toBe(0);
    expect(after.inventory.items.item_ancient_rune).toBe(0);
    expect(after.cosmetics.plotSkins).toEqual(['starry']);
    expect(after.transactions[0]).toMatchObject({ currency: 'coins', type: 'PLOT_SKIN_FORGE', amount: -30_000, refId: 'starry' });
    expect(after.progression.areas.world?.xp).toBe(WORLD_LEVELS.xp[29]! + 30);
  });
  it('pays Gems instead when the player chooses (60 Gems), coins untouched', () => {
    const after = ok(GOALS.forgeSkin('starry', 'gems')(world(STARRY_BAG), ctxAt()));
    expect(after.wallet.gems).toBe(40);
    expect(after.wallet.coins).toBe(100_000);
    expect(after.transactions[0]).toMatchObject({ currency: 'gems', type: 'PLOT_SKIN_FORGE', amount: -60 });
  });
  it('refuses, changing nothing: locked, owned, missing materials, short coins, short Gems, unknown skin', () => {
    const w = world(STARRY_BAG);
    expect(err(GOALS.forgeSkin('verdant', 'coins')(w, ctxAt()))).toBe('SKIN_LOCKED');
    const owned = ok(GOALS.forgeSkin('starry', 'coins')(w, ctxAt()));
    expect(err(GOALS.forgeSkin('starry', 'coins')({ ...owned, inventory: { items: STARRY_BAG } }, ctxAt()))).toBe('ALREADY_OWNED');
    expect(err(GOALS.forgeSkin('starry', 'coins')(world({ item_flower_moon_lily: 19, item_ancient_rune: 2 }), ctxAt()))).toBe('INSUFFICIENT_ITEM');
    expect(err(GOALS.forgeSkin('starry', 'coins')(world(STARRY_BAG, 29_999), ctxAt()))).toBe('INSUFFICIENT_GOLD');
    expect(err(GOALS.forgeSkin('starry', 'gems')(world(STARRY_BAG, 100_000, 59), ctxAt()))).toBe('INSUFFICIENT_GOLD');
    expect(err(GOALS.forgeSkin('nope', 'coins')(w, ctxAt()))).toBe('INVALID_REQUEST');
    expect(w.cosmetics.plotSkins).toEqual([]);
  });
  it('its events read as standard world events (skin forged, currency and items out)', () => {
    const r = GOALS.forgeSkin('starry', 'gems')(world(STARRY_BAG), ctxAt());
    if (!r.ok) throw new Error('x');
    const events = goalsEventsToWorld(r.events);
    expect(events).toContainEqual({ type: 'plot.skinForged', area: 'world', skinId: 'starry' });
    expect(events).toContainEqual({ type: 'currency.changed', area: 'world', currency: 'gems', amount: -60 });
    expect(events).toContainEqual({ type: 'item.removed', area: 'world', itemId: 'item_ancient_rune', quantity: 2 });
  });
});

describe('applying a skin', () => {
  const forged = (): WorldSave => ok(GOALS.forgeSkin('starry', 'coins')(world(STARRY_BAG), ctxAt()));
  it('dresses one cloud tier / garden zone only, and null puts the plain look back', () => {
    const w = forged();
    const dressed = ok(applyTierSkin(w, { group: 1, skinId: 'starry' }, ctxAt()));
    expect(cloudScene(cloudOf(dressed), T0).skins.slice(0, 3)).toEqual([null, 'starry', null]);
    expect(cloudScene(cloudOf(ok(applyTierSkin(dressed, { group: 1, skinId: null }, ctxAt()))), T0).skins[1]).toBeNull();
    const garden = ok(applyZoneSkin(w, { group: 2, skinId: 'starry' }, ctxAt()));
    expect(gardenScene(gardenOf(garden), T0).zoneSkins).toEqual([null, null, 'starry', null]);
  });
  it('refuses a skin the player does not own and a group that does not exist; costs nothing', () => {
    const w = world();
    expect(err(applyTierSkin(w, { group: 0, skinId: 'starry' }, ctxAt()))).toBe('INVALID_REQUEST');
    expect(err(applyZoneSkin(w, { group: 0, skinId: 'starry' }, ctxAt()))).toBe('INVALID_REQUEST');
    expect(err(applyTierSkin(forged(), { group: 99, skinId: 'starry' }, ctxAt()))).toBe('INVALID_REQUEST');
    const free = ok(applyTierSkin(forged(), { group: 0, skinId: 'starry' }, ctxAt()));
    expect(free.wallet).toEqual(forged().wallet);
  });
  it('a skin never changes yield, speed, the plots or the Codex: only the picture of the group', () => {
    const w = forged();
    const dressed = ok(applyTierSkin(w, { group: 0, skinId: 'starry' }, ctxAt()));
    expect(cloudOf(dressed).plots).toEqual(cloudOf(w).plots);
    expect(cloudOf(dressed).tierLevels).toEqual(cloudOf(w).tierLevels);
    expect(dressed.collection).toEqual(w.collection);
  });
});

describe('the forge cards', () => {
  const probe = (w: WorldSave) => (id: string, pay: 'coins' | 'gems') => {
    const r = GOALS.forgeSkin(id, pay)(w, ctxAt());
    return r.ok ? null : r.error;
  };
  it('says owned / locked with its hint / what is missing / ready, per button', () => {
    const w = world({ item_flower_moon_lily: 5 });
    const cards = skinCardsVm(w, probe(w));
    const by = (id: string) => cards.find((c) => c.itemId === id)!;
    expect(by('verdant').buys.map((b) => b.reason)).toEqual(['Mở khi hạ trùm Rừng Thì Thầm', 'Mở khi hạ trùm Rừng Thì Thầm']);
    expect(by('starry').buys.map((b) => b.reason)).toEqual(['Thiếu vật liệu', 'Thiếu vật liệu']);
    expect(by('starry').buys.map((b) => b.price)).toEqual(['30.000', '60']);
    expect(by('starry').buys[1]!.icon).toBe('gem');
    const ready = world(STARRY_BAG);
    expect(skinCardsVm(ready, probe(ready)).find((c) => c.itemId === 'starry')!.buys.map((b) => b.reason)).toEqual([null, null]);
    const poor = world(STARRY_BAG, 100, 3);
    expect(skinCardsVm(poor, probe(poor)).find((c) => c.itemId === 'starry')!.buys.map((b) => b.reason)).toEqual(['Không đủ Sobi Coin.', 'Không đủ Gems.']);
    const done = ok(GOALS.forgeSkin('starry', 'coins')(ready, ctxAt()));
    expect(skinCardsVm(done, probe(done)).find((c) => c.itemId === 'starry')!.owned).toBe('Đã có');
  });
  it('the strip offers Plain and every owned skin, the worn one active', () => {
    const w = ok(GOALS.forgeSkin('starry', 'coins')(world(STARRY_BAG), ctxAt()));
    expect(skinStripVm(w, 'starry').map((c) => [c.skinId, c.active])).toEqual([[null, false], ['starry', true]]);
    expect(skinStripVm(w, null)[0]!.active).toBe(true);
  });
});

describe('world save', () => {
  it('a new world starts with no skins', () => {
    expect(SAVE_CODEC.newWorld(ctxAt()).cosmetics).toEqual({ plotSkins: [] });
  });
});
