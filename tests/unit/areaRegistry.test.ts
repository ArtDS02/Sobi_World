// Area registry (ARCHITECTURE §5): a fake Area built from src/areas/_template registers next to the
// farm and gets a save slice, migrations, simulation, events, levels and lock state with no world code.
import { describe, expect, it } from 'vitest';
import { createTemplateArea } from '../../src/areas/_template';
import { farmArea } from '../../src/areas/farm';
import { legacyToWorld } from '../../src/areas/farm/logic/save/legacy';
import { farmOf } from '../../src/areas/farm/logic/save/lens';
import { createAreaRegistry, type AreaManifest } from '../../src/core/area-registry/registry';
import { WORLD_DEVELOPMENT } from '../../src/core/config/progression';
import { mulberry32 } from '../../src/core/rng';
import { parseSave } from '../../src/core/save/migrate';
import { defaultSettings, type WorldSave } from '../../src/core/save/world';
import { vi as strings } from '../../src/i18n/vi';

const H = 3_600_000;
const T0 = 1_700_000_000_000;
const ctx = (now = T0) => ({ now, rng: mulberry32(5) });
const manifest = (patch: Partial<AreaManifest> = {}): AreaManifest => ({
  id: 'test_garden',
  name: { vi: 'Vườn thử' },
  portalInPlaza: 'garden_gate',
  unlock: {},
  buildings: [],
  produces: ['item_test_crop'],
  consumes: ['FOOD_BASIC'],
  ...patch,
});
const registry = (patch?: Partial<AreaManifest>) =>
  createAreaRegistry([farmArea, createTemplateArea(manifest(patch))], WORLD_DEVELOPMENT);

describe('area registry', () => {
  it('refuses duplicate ids and an empty build', () => {
    expect(() => createAreaRegistry([farmArea, farmArea], WORLD_DEVELOPMENT)).toThrow(/twice/);
    expect(() => createAreaRegistry([], WORLD_DEVELOPMENT)).toThrow(/no area/);
  });

  it('a new world starts every open Area; the first one is current', () => {
    const w = registry().newWorld(ctx(), defaultSettings());
    expect(Object.keys(w.areas)).toEqual(['sobi_farm', 'test_garden']);
    expect(w.world).toEqual({ currentArea: 'sobi_farm', unlockedAreas: ['sobi_farm', 'test_garden'] });
    expect(w.wallet.coins).toBe(5000); // the farm's starter coins, through the ledger
    expect(w.transactions[0]).toMatchObject({ type: 'INITIAL_GOLD', currency: 'coins', amount: 5000 });
  });

  it('a locked Area stays out of the save and shows what it needs', () => {
    const reg = registry({ unlock: { areaLevels: { sobi_farm: 3 }, worldDevelopment: 2 } });
    const w = reg.newWorld(ctx(), defaultSettings());
    expect(Object.keys(w.areas)).toEqual(['sobi_farm']);
    const garden = reg.areas(w).find((a) => a.manifest.id === 'test_garden')!;
    expect(garden.unlocked).toBe(false);
    expect(garden.gaps).toEqual([
      { kind: 'areaLevel', areaId: 'sobi_farm', need: 3, have: 1 },
      { kind: 'worldDevelopment', need: 2, have: 1 },
    ]);
  });

  it('advance runs every Area with one formula and maps their events to world events', () => {
    const reg = registry();
    const w = reg.newWorld(ctx(), defaultSettings());
    const r = reg.advance(w, T0 + 5 * H, mulberry32(1), 0, 'offline');
    expect((r.state.areas.test_garden as { harvests: number }).harvests).toBe(2);
    expect(farmOf(r.state).trough.lastResolvedAt).toBe(T0 + 5 * H);
    expect(reg.simulatedAt(r.state)).toBe(T0 + 5 * H);
    expect(reg.toWorldEvents(r.events)).toContainEqual({
      type: 'crop.harvested', area: 'test_garden', plotId: 'template', cropId: 'template', quantity: 2,
    });
    expect(reg.summary(r.events)).toContainEqual({ key: 'summary.template.harvests', params: { count: 2 } });
  });

  it('levels and World Development come from every Area', () => {
    const reg = registry();
    const w = reg.newWorld(ctx(), defaultSettings());
    const leveled: WorldSave = { ...w, progression: { ...w.progression, areas: { sobi_farm: { xp: 600 }, test_garden: { xp: 150 } } } };
    expect(reg.levels(leveled)).toEqual({ sobi_farm: 4, test_garden: 2 });
    expect(reg.worldDevelopment(leveled, 25)).toBe(4 + 2 + 2);
  });

  it('the save codec validates and migrates each Area slice', () => {
    const reg = registry();
    const codec = reg.codec(legacyToWorld, defaultSettings);
    const w = reg.newWorld(ctx(), defaultSettings());
    expect(parseSave(JSON.stringify(w), codec)).toEqual({ ok: true, save: w, fromVersion: 8 });
    // A v1 slice of the template (`done` counter) migrates to v2 (`harvests`).
    const v1 = { ...w, areas: { ...w.areas, test_garden: { version: 1, growth: 10, done: 3, lastTickedAt: T0 } } };
    const r = parseSave(JSON.stringify(v1), codec);
    expect(r.ok && r.save.areas.test_garden).toEqual({ version: 2, growth: 10, harvests: 3, lastTickedAt: T0 });
    const broken = { ...w, areas: { ...w.areas, test_garden: { version: 2, growth: 999, harvests: 0, lastTickedAt: T0 } } };
    expect(parseSave(JSON.stringify(broken), codec)).toEqual({ ok: false, error: 'SAVE_CORRUPT' });
  });

  it('an Area this build does not know keeps its data in the save', () => {
    const farmOnly = createAreaRegistry([farmArea], WORLD_DEVELOPMENT);
    const w = registry().newWorld(ctx(), defaultSettings());
    const r = parseSave(JSON.stringify(w), farmOnly.codec(legacyToWorld, defaultSettings));
    expect(r.ok && r.save.areas.test_garden).toEqual(w.areas.test_garden);
    expect(r.ok && farmOnly.advance(r.save, T0 + H, mulberry32(1), 0).state.areas.test_garden).toEqual(w.areas.test_garden);
  });

  it('every farm summary line has its text', () => {
    const lines = farmArea.getSummary!([
      { type: 'BIRTH' }, { type: 'PIG_BECAME_ADULT' }, { type: 'PIG_BECAME_SICK' }, { type: 'ORDER_NEW' }, { type: 'GIFT_SPAWNED' },
    ]);
    expect(lines).toHaveLength(5);
    for (const { key } of lines) {
      const text = key.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], strings);
      expect(typeof text, key).toBe('string');
    }
  });
});
