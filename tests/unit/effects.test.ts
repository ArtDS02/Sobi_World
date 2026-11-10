// Decision 057 (B8): the effects intensity setting — the pure scale table, what the atmosphere shows at each level, the save
// migration and its default, and the action that changes it.
import { describe, expect, it } from 'vitest';
import v12 from '../fixtures/save-v12-derived.json';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { setEffects } from '../../src/areas/farm/logic/actions/setSetting';
import { migrate } from '../../src/core/save/migrate';
import { defaultSettings, EFFECTS_MODES, worldSaveSchema, type WorldSave } from '../../src/core/save/world';
import { ATMOSPHERE_MAX, atmosphereAt, atmosphereFor, effectsScale, effectsWith, particleCounts, particleCountsFor } from '../../src/systems/animation/rankAtmosphere';
import { ctx, expectError, expectOk, farm } from './actionKit';

function migrated(input: unknown): WorldSave {
  const r = migrate(structuredClone(input), SAVE_CODEC);
  if (!r.ok) throw new Error(`migration failed: ${r.error}`);
  return r.save;
}

describe('effects scale (pure)', () => {
  it('off shows no light and no particles, light shows half without quick twinkling, full is the look as it was', () => {
    expect(effectsScale('off')).toEqual({ particles: 0, light: 0, twinkle: false, breathe: false, upgrade: 'none', crossfade: false });
    expect(effectsScale('light')).toEqual({ particles: 0.5, light: 0.5, twinkle: false, breathe: true, upgrade: 'short', crossfade: true });
    expect(effectsScale('full')).toEqual({ particles: 1, light: 1, twinkle: true, breathe: true, upgrade: 'full', crossfade: true });
  });

  it('with "Giảm chuyển động" the stricter setting wins: nothing moving plays, the amount of light still follows the level', () => {
    expect(effectsWith('full', true)).toMatchObject({ particles: 1, light: 1, twinkle: false, upgrade: 'none', crossfade: false });
    expect(effectsWith('light', true)).toMatchObject({ particles: 0.5, upgrade: 'none', crossfade: false });
    expect(effectsWith('off', true)).toEqual(effectsScale('off'));
    for (const mode of EFFECTS_MODES) expect(effectsWith(mode, false)).toEqual(effectsScale(mode));
  });
});

describe('the atmosphere of a rank at each effects level', () => {
  it('full is exactly the rank table', () => {
    for (let rank = 1; rank <= 5; rank += 1) expect(atmosphereFor(rank, 'full')).toEqual(atmosphereAt(rank));
  });

  it('off: no rays, sparkles, petals or fireflies at any rank (the still vignette stays)', () => {
    for (let rank = 1; rank <= 5; rank += 1) {
      const a = atmosphereFor(rank, 'off');
      expect([a.rays, a.rayAlpha, a.glow, a.sparkles, a.petals, a.fireflies]).toEqual([0, 0, 0, 0, 0, 0]);
      expect(a.vignette).toBe(atmosphereAt(rank).vignette);
      expect(particleCountsFor(rank, 'both', 'off')).toEqual({ petals: 0, fireflies: 0 });
    }
  });

  it('light: about half the particles and rays half as strong', () => {
    const full = atmosphereAt(5);
    const light = atmosphereFor(5, 'light');
    expect(light.sparkles).toBe(Math.ceil(full.sparkles / 2));
    expect(light.petals).toBe(Math.ceil(full.petals / 2));
    expect(light.fireflies).toBe(Math.ceil(full.fireflies / 2));
    expect(light.rays).toBe(full.rays);
    expect(light.rayAlpha).toBeCloseTo(full.rayAlpha / 2);
    for (let rank = 1; rank <= 5; rank += 1) {
      for (const kind of ['petal', 'firefly', 'both', 'none'] as const) {
        const f = particleCounts(rank, kind);
        const l = particleCountsFor(rank, kind, 'light');
        expect(l).toEqual({ petals: Math.ceil(f.petals / 2), fireflies: Math.ceil(f.fireflies / 2) });
        expect(particleCountsFor(rank, kind, 'full')).toEqual(f);
        expect(l.petals).toBeLessThanOrEqual(ATMOSPHERE_MAX.petals);
      }
    }
  });

  it('never washes the plots: the bloom over the field is 0 at every rank and level', () => {
    for (const mode of EFFECTS_MODES) for (let rank = 1; rank <= 5; rank += 1) expect(atmosphereFor(rank, mode).glow).toBe(0);
  });
});

describe('the setting in the save', () => {
  it('a new world starts on full, or on light when the system asks for less motion', () => {
    expect(defaultSettings().effects).toBe('full');
    expect(defaultSettings({ reduceMotion: false }).effects).toBe('full');
    expect(defaultSettings({ reduceMotion: true }).effects).toBe('light');
    expect(SAVE_CODEC.newWorld(ctx(1), { reduceMotion: true }).settings.effects).toBe('light');
  });

  it('v12 → v13: an old save gets full; one that already reduces motion gets light; a value already there is kept', () => {
    expect(migrated(v12).settings.effects).toBe('full');
    const calm = structuredClone(v12) as unknown as { settings: Record<string, unknown> };
    calm.settings.reduceMotion = true;
    expect(migrated(calm).settings).toMatchObject({ reduceMotion: true, effects: 'light' });
    const chosen = structuredClone(v12) as unknown as { settings: Record<string, unknown> };
    chosen.settings.effects = 'off';
    expect(migrated(chosen).settings.effects).toBe('off');
    const junk = structuredClone(v12) as unknown as { settings: Record<string, unknown> };
    junk.settings.effects = 'blinding';
    expect(migrated(junk).settings.effects).toBe('full');
  });

  it('the schema takes only the three levels', () => {
    const save = migrated(v12);
    expect(worldSaveSchema.safeParse(save).success).toBe(true);
    expect(worldSaveSchema.safeParse({ ...save, settings: { ...save.settings, effects: 'max' } }).success).toBe(false);
    const { effects: _gone, ...rest } = save.settings;
    expect(worldSaveSchema.safeParse({ ...save, settings: rest }).success).toBe(false);
  });
});

describe('setEffects', () => {
  it('changes the level and emits SETTING_CHANGED; the same level again is nothing to do; a bad value is refused', () => {
    const r = expectOk(setEffects(farm(), { value: 'light' }, ctx()));
    expect(r.state.settings.effects).toBe('light');
    expect(r.events).toContainEqual({ type: 'SETTING_CHANGED', key: 'effects', value: 'light' });
    expectError((s) => setEffects(s, { value: 'light' }, ctx()), r.state, 'NOTHING_TO_DO');
    expectError((s) => setEffects(s, { value: 'max' as never }, ctx()), farm(), 'INVALID_REQUEST');
  });

  it('touches nothing else: the farm is the same apart from the setting', () => {
    const before = farm();
    const r = expectOk(setEffects(before, { value: 'off' }, ctx()));
    expect({ ...r.state, settings: before.settings, updatedAt: before.updatedAt }).toEqual(before);
  });
});
