// The Aquarium's screens as data (hud, bar, fish card, tank, dock, bag, breeding), the rod's mini-game maths, the scene's
// pure parts, the presentation of its events, the admin time travel and the art it needs in the manifest.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { aquariumArea } from '../../src/areas/aquarium';
import { aquariumPresentation } from '../../src/areas/aquarium/feedback';
import { aquariumArtIds } from '../../src/areas/aquarium/logic/art';
import { AB, FISH_LIST } from '../../src/areas/aquarium/logic/config/content';
import { sceneState } from '../../src/areas/aquarium/logic/derived';
import { AQUARIUM_EVENT_TYPES, type AquariumEvent } from '../../src/areas/aquarium/logic/events';
import { rewindAquarium, rewindAquariumInWorld } from '../../src/areas/aquarium/logic/rewind';
import { aquariumOf, withAquarium } from '../../src/areas/aquarium/logic/save/lens';
import { AQUARIUM_DESIGN, AQUARIUM_VIEW, eggSpot, fishIcon, fishScale } from '../../src/areas/aquarium/scene/aquariumView';
import { barVm, bagVm, breedablePairs, hudVm, tankVm } from '../../src/areas/aquarium/ui/aquariumVm';
import { dockVm, markerAt, MINI, scoreOf, zoneCentre } from '../../src/areas/aquarium/ui/dockVm';
import { fishCardVm } from '../../src/areas/aquarium/ui/fishCardVm';
import { mulberry32 } from '../../src/core/rng';
import type { WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';
import type { Fish } from '../../src/areas/aquarium/logic/state';

const H = 3_600_000;
const T0 = 20_000 * 86_400_000;
const NOON = T0 + 12 * H;
const NIGHT = T0 + 22 * H;
const ctxAt = (now: number): ActionContext => ({ now, rng: mulberry32(5) });

const fish = (over: Partial<Fish> = {}): Fish => ({
  id: 'f1',
  breed: 'fish_clownfish',
  name: 'Sóng',
  gender: 'FEMALE',
  growthProgress: 100,
  hunger: 80,
  cleanliness: 90,
  isSick: false,
  generation: 1,
  createdAt: T0,
  lastTickedAt: T0,
  ...over,
});

function base(fishList: Fish[] = [fish()], bag: Record<string, number> = {}, coins = 10_000): WorldSave {
  const opened = aquariumArea.init(SAVE_CODEC.newWorld(ctxAt(T0 - 30 * 86_400_000)), ctxAt(T0));
  const a = aquariumOf(opened);
  return withAquarium({ ...opened, wallet: { ...opened.wallet, coins }, inventory: { items: { ...bag } } }, { ...a, fish: fishList, lastTickedAt: T0 });
}

describe('hud and bar', () => {
  it('shows the wallet, the world level and the way to the next one', () => {
    const w = base();
    const v = hudVm({ ...w, progression: { ...w.progression, areas: { sobi_aquarium: { xp: 150 } } } });
    expect(v.level).toBe('Cấp 2');
    expect(v.xp).toBe('150/383 KN');
    expect(v.coins).toBe('10.000');
  });

  it('every button says why it is off', () => {
    const empty = barVm(base([], {}), NOON, 0);
    expect(empty.feedAll.reason).toBe('Bể chưa có cá');
    expect(empty.scales.reason).toBe('Chưa có vảy');
    expect(empty.bag.reason).toBe('Túi chưa có cá');
    expect(empty.breed.reason).not.toBeNull();
    expect(empty.fish.reason).toBeNull(); // never cast
    const hungry = barVm(base([fish({ hunger: 30 })], {}, 0), NOON, 0);
    expect(hungry.feedAll.reason).toBe('Hết thức ăn cá, không đủ Sobi Coin để mua');
    const fed = barVm(base([fish({ hunger: 30 })], { FOOD_FISH: 2 }), NOON, 0);
    expect(fed.feedAll.reason).toBeNull();
    expect(barVm(base([fish({ hunger: 30 })], {}, 0), NOON, 0).feedAll.reason).toBe('Hết thức ăn cá, không đủ Sobi Coin để mua');
    expect(barVm(base([fish({ hunger: 30 })], {}, 100), NOON, 0).feedAll.reason).toBeNull(); // the shortfall is bought
    expect(barVm(base([fish({ hunger: 100 })], { FOOD_FISH: 2 }), NOON, 0).feedAll.reason).toBe('Cá đều no');
    expect(barVm(withAquarium(base(), { ...aquariumOf(base()), lastCastAt: NOON - 30_000 }), NOON, 0).fish.reason).toContain('nghỉ');
    expect(barVm(base([fish({ cleanliness: 100 })]), T0, 0).water.reason).toBe('Nước đang trong');
  });
});

describe('a fish card', () => {
  it('names the fish, its needs, hearts, favourite, traits and what each button can do', () => {
    const w = base([fish({ traits: ['trait_sweet'], bond: 45 })], { FOOD_FISH: 1 });
    const c = fishCardVm(w, 'f1', NOON, 0)!;
    expect(c).toMatchObject({ name: 'Sóng', speciesName: 'Cá Hề', stageText: 'Cá trưởng thành', genderText: 'Cái', hearts: 2, heartsText: '♥♥♡♡♡' });
    expect(c.needText.hunger).toBe('No: 80%');
    expect(c.traits.map((t) => t.name)).toEqual(['Ngọt ngào']);
    expect(c.feed.reason).toBeNull();
    expect(c.treat.reason).toBe('Cá khỏe');
    expect(c.pet.reason).toBeNull();
    expect(c.sell.reason).toBeNull();
    expect(c.sell.label).toContain(String(c.quote.price).slice(0, 1));
    expect(c.quote.lines.at(-1)).toContain('Nhận được');
    expect(c.purposes.map((p) => p.id)).toEqual(['SHIP', 'BREED', 'PET']);
    expect(fishCardVm(w, 'nope', NOON, 0)).toBeNull();
  });

  it('a hidden trait shows as a lock until five hearts, then by name', () => {
    const closed = fishCardVm(base([fish({ hiddenTrait: 'trait_golden_hoof', bond: 20 })]), 'f1', NOON, 0)!;
    expect(closed.traits[0]).toMatchObject({ name: '???', hidden: 'locked' });
    const open = fishCardVm(base([fish({ hiddenTrait: 'trait_golden_hoof', bond: 100 })]), 'f1', NOON, 0)!;
    expect(open.traits[0]).toMatchObject({ name: 'Móng vàng', hidden: 'open' });
  });

  it('an ill fish warns how long it has, a baby cannot be sold, a pet cannot either', () => {
    const ill = fishCardVm(base([fish({ isSick: true, lastSickAt: T0 })], { MEDICINE_COMMON: 1 }), 'f1', T0 + 10 * H, 0)!;
    expect(ill.health).toMatchObject({ state: 'ill', text: 'Đang bệnh' });
    expect(ill.health.warning).toContain('nguy kịch');
    expect(ill.treat.reason).toBeNull();
    const critical = fishCardVm(base([fish({ isSick: true, lastSickAt: T0 })], {}), 'f1', T0 + 60 * H, 0)!;
    expect(critical.health).toMatchObject({ state: 'critical' });
    expect(critical.health.warning).toContain('mất cá');
    expect(fishCardVm(base([fish({ growthProgress: 20 })]), 'f1', T0, 0)!.sell.reason).toBe('Cá chưa đủ lớn');
    expect(fishCardVm(base([fish({ purpose: 'PET' })]), 'f1', NOON, 0)!.sell.reason).toBe('Đây là cá cảnh');
  });
});

describe('the tank, the dock, the bag, breeding', () => {
  it('the tank card: capacity, water, scales, eggs and the next level with what it takes', () => {
    const w = base([fish()], {}, 100_000);
    const v = tankVm(w, NOON, 0);
    expect(v.levelText).toBe('Bể cấp 1: chứa 5 cá (1/5)');
    expect(v.waterState).toBe('Nước trong veo');
    expect(v.upgrade?.reason).toBeNull();
    expect(v.upgrade?.label).toContain('cấp 2');
    expect(v.maxText).toBeNull();
    const poor = tankVm(base([fish()], {}, 0), NOON, 0);
    expect(poor.upgrade?.reason).toBe('Thiếu Sobi Coin');
    const lvl3 = tankVm(withAquarium(w, { ...aquariumOf(w), tank: { ...aquariumOf(w).tank, level: 2 } }), NOON, 0);
    expect(lvl3.upgrade?.reason).toContain('Vảy cá');
    expect(lvl3.upgradeNeeds).toEqual([{ name: 'Vảy cá', have: 0, need: 10 }]);
    const top = tankVm(withAquarium(w, { ...aquariumOf(w), tank: { ...aquariumOf(w).tank, level: 4 } }), NOON, 0);
    expect(top.upgrade).toBeNull();
    expect(top.maxText).toBe('Bể đã ở cấp cao nhất.');
    const dirty = tankVm(withAquarium(w, { ...aquariumOf(w), tank: { ...aquariumOf(w).tank, water: 20 } }), NOON, 0);
    expect(dirty.waterState).toContain('đục');
  });

  it('the dock: the odds sum to 100%, night fish are listed only at night, unknown species stay "???"', () => {
    const w = base();
    const day = dockVm(w, NOON, 0);
    const night = dockVm(w, NIGHT, 0);
    expect(day.night).toBe(false);
    expect(night.night).toBe(true);
    expect(day.odds.reduce((n, o) => n + o.percent, 0)).toBeCloseTo(100, 6);
    expect(night.odds.length).toBeGreaterThan(day.odds.length);
    expect(day.odds.filter((o) => o.name === '???').length).toBe(day.odds.length - 1); // all but the oyster
    const met = { ...w, collection: { ...w.collection, discovered: { fish: ['fish_goldfish'] } } };
    expect(dockVm(met, NOON, 0).odds.some((o) => o.name === 'Cá Vàng')).toBe(true);
    expect(dockVm(w, NOON, 0).odds[0]!.percent).toBeGreaterThan(dockVm(w, NOON, 0).odds.at(-1)!.percent);
  });

  it('the bag lists caught fish and oysters with their prices; only fish can be released', () => {
    const w = base([fish()], { item_fish_betta: 2, item_pearl: 1, item_scale: 4, FOOD_FISH: 3 });
    const rows = bagVm(w);
    expect(rows.map((r) => r.itemId)).toEqual(['item_fish_betta', 'item_pearl']); // scales and feed are not "fish in the bag"
    expect(rows[0]!.release).not.toBeNull();
    expect(rows[1]!.release).toBeNull();
    expect(rows[0]!.sellAll.label).toContain('440');
    const full = bagVm(base(Array.from({ length: 5 }, (_, i) => fish({ id: `x${i}` })), { item_fish_betta: 1 }));
    expect(full[0]!.release?.reason).toBe('Bể đã đầy cá');
  });

  it('breeding lists the pairs the rules allow, with the traits they can pass', () => {
    const w = base([fish({ id: 'm', gender: 'MALE', traits: ['trait_plump'] }), fish({ id: 'f', traits: ['trait_sweet'] }), fish({ id: 'g', gender: 'MALE', isSick: true })], { FOOD_FISH: 4 });
    const pairs = breedablePairs(w, NOON);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ aId: 'm', bId: 'f', speciesName: 'Cá Hề' });
    expect(pairs[0]!.traitNames.sort()).toEqual(['Mập mạp', 'Ngọt ngào']);
    expect(breedablePairs(base([fish({ id: 'm', gender: 'MALE', breed: 'fish_perch' }), fish({ id: 'f', breed: 'fish_perch' })]), NOON)).toEqual([]);
  });
});

describe('the rod\'s mini-game', () => {
  it('the marker sweeps 0 → 1 → 0, the score is 1 on the green spot and 0 far away', () => {
    expect(markerAt(0)).toBe(0);
    expect(markerAt(MINI.periodMs / 2)).toBe(1);
    expect(markerAt(MINI.periodMs)).toBeCloseTo(0, 9);
    expect(markerAt(MINI.periodMs / 4)).toBeCloseTo(0.5, 9);
    expect(scoreOf(0.5, 0.5)).toBe(1);
    expect(scoreOf(0.5 + MINI.zoneHalf, 0.5)).toBeGreaterThan(AB.fishing.missBelow);
    expect(scoreOf(0.5 + MINI.scoreSpan, 0.5)).toBe(0);
    expect(scoreOf(0.95, 0.2)).toBe(0);
  });

  it('the green spot is the same for a cast and stays inside the bar', () => {
    for (let t = 0; t < 50; t += 1) {
      const c = zoneCentre(T0 + t * 7919);
      expect(c).toBeGreaterThanOrEqual(0.2);
      expect(c).toBeLessThanOrEqual(0.8);
      expect(zoneCentre(T0 + t * 7919)).toBe(c);
    }
    expect(new Set(Array.from({ length: 30 }, (_, i) => zoneCentre(T0 + i * 1000)))).not.toEqual(new Set([zoneCentre(T0)]));
  });

  it('the zone is wide enough that a pull inside it is never a miss', () => {
    expect(scoreOf(0.5 + MINI.zoneHalf, 0.5)).toBeGreaterThan(AB.fishing.missBelow);
  });
});

describe('the scene', () => {
  it('reads the state: who swims, the water, the scales, the eggs, the night', () => {
    const w = base([fish(), fish({ id: 'g', growthProgress: 10, hunger: 10 })], {});
    const s = sceneState(aquariumOf(w), NIGHT, 0);
    expect(s.fish.map((f) => f.id)).toEqual(['f1', 'g']);
    expect(s.night).toBe(true);
    expect(s.castReady).toBe(true);
    expect(s.fish[1]).toMatchObject({ stage: 'BABY', adult: false });
  });

  it('a fish grows on screen, shows its needs as an icon, and the eggs lie on the sand inside the tank', () => {
    expect(fishScale(0)).toBeLessThan(fishScale(50));
    expect(fishScale(100)).toBeCloseTo(0.8, 9);
    expect(fishIcon({ sick: true, hunger: 90 })).toBe('🤒');
    expect(fishIcon({ sick: false, hunger: 10 })).toBe('🍽');
    expect(fishIcon({ sick: false, hunger: 90 })).toBe('');
    const v = AQUARIUM_VIEW;
    for (let i = 0; i < AB.breeding.maxEggs + 2; i += 1) {
      const { x, y } = eggSpot(i);
      expect(x).toBeGreaterThan(v.water.left);
      expect(x).toBeLessThan(v.water.right);
      expect(y).toBeGreaterThan(v.water.bottom);
    }
    expect(v.water.right).toBeLessThan(AQUARIUM_DESIGN.width);
    expect(v.dock.x).toBeLessThan(AQUARIUM_DESIGN.width);
  });
});

describe('what its events say', () => {
  const sample: Record<AquariumEvent['type'], AquariumEvent> = {
    AQUARIUM_FISH_FED: { type: 'AQUARIUM_FISH_FED', fishId: 'a', itemId: 'FOOD_FISH' },
    AQUARIUM_FEED_BOUGHT: { type: 'AQUARIUM_FEED_BOUGHT', quantity: 2, gold: 40 },
    AQUARIUM_FISH_PETTED: { type: 'AQUARIUM_FISH_PETTED', fishId: 'a', hearts: 1 },
    AQUARIUM_FISH_TREATED: { type: 'AQUARIUM_FISH_TREATED', fishId: 'a' },
    AQUARIUM_TRAIT_REVEALED: { type: 'AQUARIUM_TRAIT_REVEALED', fishId: 'a', name: 'Sóng', traitId: 'trait_sweet' },
    AQUARIUM_WATER_CHANGED: { type: 'AQUARIUM_WATER_CHANGED' },
    AQUARIUM_CAST: { type: 'AQUARIUM_CAST', speciesId: 'fish_betta', itemId: 'item_fish_betta', quantity: 1, score: 0.9, night: false },
    AQUARIUM_RELEASED: { type: 'AQUARIUM_RELEASED', fishId: 'a', speciesId: 'fish_betta' },
    AQUARIUM_FISH_SOLD: { type: 'AQUARIUM_FISH_SOLD', fishId: 'a', speciesId: 'fish_betta', gold: 500 },
    AQUARIUM_CATCH_SOLD: { type: 'AQUARIUM_CATCH_SOLD', itemId: 'item_fish_betta', quantity: 2, gold: 440 },
    AQUARIUM_SCALES_COLLECTED: { type: 'AQUARIUM_SCALES_COLLECTED', quantity: 3, left: 0 },
    AQUARIUM_SCALES_SHED: { type: 'AQUARIUM_SCALES_SHED', count: 1 },
    AQUARIUM_TANK_UPGRADED: { type: 'AQUARIUM_TANK_UPGRADED', level: 2, gold: 800 },
    AQUARIUM_EGGS_LAID: { type: 'AQUARIUM_EGGS_LAID', speciesId: 'fish_betta', eggId: 'e', mutated: false },
    AQUARIUM_EGG_HATCHED: { type: 'AQUARIUM_EGG_HATCHED', fishId: 'a', speciesId: 'fish_betta', name: 'Bé Bơi' },
    AQUARIUM_FISH_SICK: { type: 'AQUARIUM_FISH_SICK', fishId: 'a', name: 'Sóng' },
    AQUARIUM_FISH_CRITICAL: { type: 'AQUARIUM_FISH_CRITICAL', fishId: 'a', name: 'Sóng' },
    AQUARIUM_FISH_DIED: { type: 'AQUARIUM_FISH_DIED', fishId: 'a', name: 'Sóng', speciesId: 'fish_betta' },
    AQUARIUM_PURPOSE_SET: { type: 'AQUARIUM_PURPOSE_SET', fishId: 'a', purpose: 'PET' },
    AQUARIUM_LEVEL_UP: { type: 'AQUARIUM_LEVEL_UP', level: 7 },
  };

  it('every event has a presentation (a sound or a toast, or deliberately none) and is never replayed in a catch-up', () => {
    for (const type of AQUARIUM_EVENT_TYPES) {
      expect(sample[type], type).toBeDefined();
      expect(aquariumPresentation(sample[type], 'action'), type).not.toBeUndefined();
      expect(aquariumPresentation(sample[type], 'catchup'), type).toBeNull();
    }
    expect(aquariumPresentation({ type: 'PIG_SOLD' }, 'action')).toBeNull(); // not its event
  });

  it('toasts name the fish, the amounts and the money', () => {
    expect(aquariumPresentation(sample.AQUARIUM_CAST, 'action')?.toast).toBe('Câu được Cá Betta Lụa!');
    expect(aquariumPresentation({ ...sample.AQUARIUM_CAST, speciesId: null, itemId: 'item_pearl' } as AquariumEvent, 'action')?.toast).toBe('Câu được Ngọc trai!');
    expect(aquariumPresentation({ ...sample.AQUARIUM_CAST, itemId: null, speciesId: null } as AquariumEvent, 'action')?.toast).toBe('Cá tuột mất rồi...');
    expect(aquariumPresentation(sample.AQUARIUM_FISH_SOLD, 'action')?.toast).toBe('Bán Cá Betta Lụa: +500 Sobi Coin');
    expect(aquariumPresentation(sample.AQUARIUM_CATCH_SOLD, 'action')?.toast).toContain('2 Cá Betta Lụa');
    expect(aquariumPresentation(sample.AQUARIUM_FISH_SICK, 'action')?.toast).toBe('Sóng bị bệnh');
    expect(aquariumPresentation(sample.AQUARIUM_TRAIT_REVEALED, 'action')?.toast).toContain('Ngọt ngào');
  });
});

describe('the Codex of fish', () => {
  it('lists every species; an unmet one gives a clue (rarity, when it bites), never its name', () => {
    const kind = aquariumArea.codex?.().find((k) => k.id === 'fish');
    expect(kind?.entries.map((e) => e.id)).toEqual(FISH_LIST.map((f) => f.id));
    for (const e of kind!.entries) {
      const species = FISH_LIST.find((f) => f.id === e.id)!;
      expect(e.hint).toContain('Chưa khám phá');
      expect(e.hint).not.toContain(species.nameVi);
      expect(e.hint).toContain(species.nightOnly ? 'tối' : 'bến');
      expect(e.detail).toContain(species.nameVi.length > 0 ? species.descVi : '');
      expect(e.artId).toBe(species.art);
    }
  });
});

describe('admin time travel and art', () => {
  it('moves every clock of the tank back, nothing else', () => {
    const w = base([fish({ isSick: true, lastSickAt: T0, breedReadyAt: T0 + H })], {});
    const a = { ...aquariumOf(w), lastCastAt: T0 - 5_000, eggs: [{ id: 'e', species: 'fish_goldfish', startedAt: T0, hatchAt: T0 + 6 * H, gender: 'MALE' as const, generation: 2, traits: [] }] };
    const back = rewindAquarium(a, H);
    expect(back.lastTickedAt).toBe(T0 - H);
    expect(back.fish[0]).toMatchObject({ lastTickedAt: T0 - H, lastSickAt: T0 - H, breedReadyAt: T0 });
    expect(back.eggs[0]).toMatchObject({ startedAt: T0 - H, hatchAt: T0 + 5 * H });
    expect(back.lastCastAt).toBe(T0 - 5_000 - H);
    expect(back.fish[0]!.hunger).toBe(a.fish[0]!.hunger);
    expect(rewindAquariumInWorld(withAquarium(w, a), 0)).toEqual(withAquarium(w, a));
    expect(aquariumOf(rewindAquariumInWorld(withAquarium(w, a), H)).lastTickedAt).toBe(T0 - H);
  });

  it('every picture the aquarium draws is a row of the manifest', () => {
    const manifest = JSON.parse(readFileSync('public/assets/manifest/assets.json', 'utf8')) as Record<string, { id: string }[]>;
    const ids = new Set(Object.values(manifest).flatMap((rows) => (Array.isArray(rows) ? rows.map((r) => r.id) : [])));
    expect(aquariumArtIds().filter((id) => !ids.has(id))).toEqual([]);
    expect(aquariumArtIds()).toContain('fish_goldfish');
    expect(aquariumArtIds()).toContain('ui_item_pearl');
    expect(aquariumArtIds()).toContain('ui_item_food_fish');
    expect(aquariumArtIds().filter((id) => id.startsWith('fish_'))).toHaveLength(FISH_LIST.length);
  });
});
