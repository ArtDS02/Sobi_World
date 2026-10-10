// The guide (GĐ6, spec V2 §9, §13): the Areas' suggestions, the "next step" chip that always says what to do, and
// the NPC each Area has.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { AREAS } from '../../src/app/areas';
import { GOALS } from '../../src/app/goals';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { farmSuggestions } from '../../src/areas/farm/logic/suggest';
import { gardenArea } from '../../src/areas/garden';
import { gardenSuggestions } from '../../src/areas/garden/logic/suggest';
import { gardenOf } from '../../src/areas/garden/logic/save/lens';
import { NPCS, npcOf } from '../../src/core/config/goals';
import { WORLD_LEVELS } from '../../src/core/config/progression';
import { mulberry32 } from '../../src/core/rng';
import type { WorldSave } from '../../src/core/save/world';
import { vi } from '../../src/i18n/vi';
import { nextStepVm } from '../../src/ui/goals/nextStep';
import { farm } from './actionKit';
import { makePig } from './pigFactory';
import { inv } from './stateFactory';

const T0 = 20_000 * 86_400_000;
const H = 3_600_000;
const base = (): WorldSave => SAVE_CODEC.newWorld({ now: T0, rng: mulberry32(1) });
const keys = (list: { key: string }[]) => list.map((s) => s.key);

describe('farm suggestions', () => {
  it('an empty farm says to buy the first pig', () => {
    expect(keys(farmSuggestions(farm([]), T0))).toEqual(['suggest.farm.buyPig']);
  });

  it('care that cannot wait comes first: a critical pig, then a dry trough, then what is ready', () => {
    const critical = makePig({ id: 'a', isSick: true, lastSickAt: T0 - 50 * H, name: 'Mít' });
    const adult = makePig({ id: 'b', slotIndex: 1, growthProgress: 80, name: 'Đậu' });
    const s = farm([critical, adult], { trough: { food: 0, capacity: 30, lastResolvedAt: T0 }, manure: 4, inventory: inv() });
    const list = farmSuggestions(s, T0).sort((x, y) => y.priority - x.priority);
    expect(keys(list).slice(0, 2)).toEqual(['suggest.farm.critical', 'suggest.farm.fillTrough']);
    expect(list[0]).toMatchObject({ tone: 'alert', goto: { target: 'pig', id: 'a' } });
    expect(keys(list)).toEqual(expect.arrayContaining(['suggest.farm.rake', 'suggest.farm.ship', 'suggest.farm.pet']));
  });

  it('a pet or a sick pig is not offered for shipping; a pig already petted twice today is not offered to pet', () => {
    const pet = makePig({ id: 'p', growthProgress: 100, purpose: 'PET', petDay: 20_000, petCount: 2 });
    const list = farmSuggestions(farm([pet], { trough: { food: 20, capacity: 30, lastResolvedAt: T0 } }), T0 + H);
    expect(keys(list)).toEqual([]);
  });
});

describe('garden suggestions', () => {
  it('ripe crops and finished batches wait for the player; an idle garden is told what to start', () => {
    const w = gardenArea.init({ ...base(), world: { ...base().world, unlockedAreas: ['sobi_farm', 'sobi_garden'] } }, { now: T0, rng: mulberry32(1) });
    const idle = gardenSuggestions(gardenOf(w), T0);
    expect(keys(idle)).toEqual(['suggest.garden.plant', 'suggest.garden.buildMill']);
    const g = gardenOf(w);
    const ripe = { ...g, plots: g.plots.map((p, i) => (i < 2 ? { ...p, cropId: 'crop_corn', ripeAt: T0 - H } : p)) };
    expect(gardenSuggestions(ripe, T0)[0]).toMatchObject({ key: 'suggest.garden.harvest', params: { count: 2 } });
  });
});

describe('next step chip', () => {
  const input = (world: WorldSave, area: ReturnType<typeof AREAS.suggest> = [], place: 'plaza' | 'area' | 'garden' = 'area', day = 20_000) =>
    nextStepVm({ world, goals: GOALS, area, place, day, next: null });
  const claimedLogin = (w: WorldSave): WorldSave => ({ ...w, progression: { ...w.progression, daily: { lastDay: 20_000, streak: 1 } } });

  it('a new player in the plaza is told to walk into the farm', () => {
    expect(input(base(), [], 'plaza')?.text).toBe(vi.suggest.world.enterFarm);
  });

  it('care first, then the day\'s gift, then rewards, then orders, then the rest', () => {
    const w = claimedLogin(base());
    const care = [{ key: 'suggest.farm.critical', params: { name: 'Mít' }, priority: 95, tone: 'alert' as const, goto: { target: 'pig', id: 'a' } }];
    const top = input(w, care);
    expect(top).toMatchObject({ tone: 'alert', goto: { target: 'pig', id: 'a' } });
    expect(input(base(), [])!.text).toBe(vi.suggest.world.login); // the gift beats a mere hint
    const reachedLevel = { ...w, progression: { ...w.progression, areas: { sobi_farm: { xp: WORLD_LEVELS.xp[4]! } } } };
    expect(input(reachedLevel, [])!.text).toBe(vi.suggest.world.reward); // LEVEL_5 waits to be claimed
  });

  it('a board order the bag can fill is offered; with nothing urgent the day\'s goal is the answer', () => {
    const w = claimedLogin(GOALS.settle(base(), base(), [], { now: T0, rng: mulberry32(1), dayOffsetMs: 0 }).state);
    const order = w.goals.board.slots[0]!;
    const stocked = { ...w, inventory: { items: { ...w.inventory.items, ...Object.fromEntries(order.lines.map((l) => [l.itemId, l.qty])) } } };
    expect(input(stocked)!.goto).toEqual({ target: 'panel', id: 'orders' });
    expect(input(w)!.text).toContain('Mục tiêu hôm nay');
  });

  it('says how to open the next Area when nothing else is left, and never claims "more" below zero', () => {
    const w = claimedLogin(base());
    const vm = nextStepVm({ world: { ...w, goals: { ...w.goals, daily: { day: 20_000, goals: [], bonusClaimed: false } } }, goals: GOALS, area: [], place: 'area', day: 20_000, next: { name: 'Sobi Garden', level: 3 } })!;
    expect(vm.text).toContain('Sobi Garden');
    expect(vm.more).toBe(0);
  });

  it('the registry gathers the open Areas\' suggestions, most urgent first', () => {
    const w = { ...base(), areas: base().areas };
    const list = AREAS.suggest(w, T0, 0);
    expect(list.map((s) => s.priority)).toEqual([...list.map((s) => s.priority)].sort((a, b) => b - a));
  });
});

describe('NPCs', () => {
  const ids = new Set(
    (JSON.parse(readFileSync('public/assets/manifest/assets.json', 'utf8')) as { props: { id: string }[] }).props.map((p) => p.id),
  );

  it('every Area that names an NPC has it, with a picture the manifest knows and something to say', () => {
    for (const area of [...AREAS.modules.map((m) => m.manifest)]) {
      if (!area.npc) continue;
      const npc = NPCS.find((n) => n.id === area.npc);
      expect(npc, area.npc).toBeDefined();
      expect(npc!.area).toBe(area.id);
      expect(ids.has(npc!.artId), npc!.artId).toBe(true);
      expect(npc!.topics.length).toBeGreaterThan(2);
    }
    expect(npcOf('sobi_farm')?.nameVi).toBeTruthy();
    expect(npcOf('sobi_garden')?.nameVi).toBeTruthy();
    expect(npcOf('nowhere')).toBeUndefined();
  });
});
