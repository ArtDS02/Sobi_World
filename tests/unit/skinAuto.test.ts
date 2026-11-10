// Decision 057, B7: a cloud tier / garden zone that changes its plot skin by the time of day or by the season. Presentation only:
// the assigned skin stays in the save, the scene state shows the moment's pick among the skins the player owns.
import { describe, expect, it } from 'vitest';
import plotSkinsRaw from '../../content/shared/plotSkins.json';
import { plotSkinsFileSchema } from '../../content/schemas/shared/plotSkins';
import { SAVE_CODEC } from '../../src/app/saveCodec';
import { cloudArea } from '../../src/areas/cloud';
import { cloudPresentation } from '../../src/areas/cloud/feedback';
import { applyTierSkin, setTierSkinAuto } from '../../src/areas/cloud/logic/actions/buildings';
import { sceneState as cloudScene } from '../../src/areas/cloud/logic/derived';
import { cloudOf } from '../../src/areas/cloud/logic/save/lens';
import { CLOUD_MIGRATIONS, cloudStateSchema } from '../../src/areas/cloud/logic/state';
import { gardenArea } from '../../src/areas/garden';
import { gardenPresentation } from '../../src/areas/garden/feedback';
import { applyZoneSkin, setZoneSkinAuto } from '../../src/areas/garden/logic/actions/buildings';
import { sceneState as gardenScene } from '../../src/areas/garden/logic/derived';
import { gardenOf } from '../../src/areas/garden/logic/save/lens';
import { GARDEN_MIGRATIONS, gardenStateSchema } from '../../src/areas/garden/logic/state';
import { DAY_PHASES } from '../../src/core/config/dayNight';
import { PLOT_SKINS } from '../../src/core/config/plotSkins';
import { SEASON_IDS } from '../../src/core/config/seasons';
import { autoPick, shownSkin, shownSkins, SKIN_AUTO_RULES, skinMoment, withAuto, type SkinAutoRules, type SkinMoment } from '../../src/core/plots/skinAuto';
import { mulberry32 } from '../../src/core/rng';
import { parseSave } from '../../src/core/save/migrate';
import type { WorldSave } from '../../src/core/save/world';
import type { ActionContext } from '../../src/core/types';
import { vi } from '../../src/i18n/vi';
import { skinAutoVm } from '../../src/ui/world/skinForgeVm';

const DAY = 86_400_000;
const HOUR = 3_600_000;
/** 2024-01-15 00:00 UTC (a winter month in the game's calendar). */
const JAN = Date.UTC(2024, 0, 15);
const ctxAt = (now = JAN): ActionContext => ({ now, rng: mulberry32(5) });
const ok = (r: { ok: boolean; state?: WorldSave; error?: string }): WorldSave => {
  if (!r.ok) throw new Error(`action failed: ${r.error}`);
  return r.state as WorldSave;
};
const err = (r: { ok: boolean; error?: string }): string | undefined => (r.ok ? undefined : r.error);

function world(owned: string[] = []): WorldSave {
  const fresh = SAVE_CODEC.newWorld(ctxAt());
  const opened = gardenArea.init(cloudArea.init(fresh, ctxAt()), ctxAt());
  return { ...opened, cosmetics: { ...opened.cosmetics, plotSkins: owned } };
}

const RULES: SkinAutoRules = {
  time: { dawn: ['a'], morning: [], day: [], afternoon: [], sunset: ['b', 'a'], night: ['c', 'b'] },
  season: { spring: ['a'], summer: [], autumn: ['b'], winter: ['c', 'a'] },
};
const at = (phase: SkinMoment['phase'], season: SkinMoment['season'] = 'summer'): SkinMoment => ({ phase, season });

describe('content: the automatic skin table', () => {
  it('names every phase and season, and only skins that exist', () => {
    expect(Object.keys(SKIN_AUTO_RULES.time).sort()).toEqual([...DAY_PHASES].sort());
    expect(Object.keys(SKIN_AUTO_RULES.season).sort()).toEqual([...SEASON_IDS].sort());
    const ids = new Set(PLOT_SKINS.map((s) => s.id));
    for (const list of [...Object.values(SKIN_AUTO_RULES.time), ...Object.values(SKIN_AUTO_RULES.season)]) for (const id of list) expect(ids.has(id)).toBe(true);
  });

  it('the schema refuses an unknown skin in the table', () => {
    const bad = structuredClone(plotSkinsRaw) as { auto: { time: Record<string, string[]> } };
    bad.auto.time.night = ['no_such_skin'];
    expect(plotSkinsFileSchema.safeParse(bad).success).toBe(false);
    expect(plotSkinsFileSchema.safeParse(plotSkinsRaw).success).toBe(true);
  });
});

describe('skinMoment', () => {
  it('follows the local time of day and the local month', () => {
    expect(skinMoment(JAN + 23 * HOUR, 0).phase).toBe('night');
    expect(skinMoment(JAN + 12 * HOUR, 0).phase).toBe('day');
    // 23:00 UTC is 06:00 the next day at UTC+7.
    expect(skinMoment(JAN + 23 * HOUR, 7 * HOUR).phase).not.toBe('night');
    expect(skinMoment(JAN, 0).season).toBe('winter');
    expect(skinMoment(Date.UTC(2024, 2, 15), 0).season).toBe('spring');
    // The last hour of a month already belongs to the next one east of UTC.
    expect(skinMoment(Date.UTC(2024, 0, 31, 23), 7 * HOUR).season).toBe(skinMoment(Date.UTC(2024, 1, 1, 6), 0).season);
  });

  it('wraps before 1970 and past midnight without leaving the day', () => {
    expect(DAY_PHASES).toContain(skinMoment(-5 * HOUR, 0).phase);
    expect(skinMoment(JAN + DAY + 23 * HOUR, 0).phase).toBe('night');
  });
});

describe('shownSkin', () => {
  it('off: always the assigned skin', () => {
    expect(shownSkin('x', null, at('night'), ['a', 'b', 'c'], RULES)).toBe('x');
    expect(shownSkin(null, null, at('night'), ['a', 'b', 'c'], RULES)).toBeNull();
  });

  it('on: the first wished skin the player owns', () => {
    expect(autoPick('time', at('night'), ['a', 'b', 'c'], RULES)).toBe('c');
    expect(autoPick('time', at('night'), ['a', 'b'], RULES)).toBe('b');
    expect(autoPick('season', at('day', 'winter'), ['a'], RULES)).toBe('a');
    expect(shownSkin('x', 'time', at('sunset'), ['a'], RULES)).toBe('a');
  });

  it('on, but nothing fits: the assigned skin stays (never a skin the player does not own)', () => {
    expect(shownSkin('x', 'time', at('day'), ['a', 'b', 'c'], RULES)).toBe('x');
    expect(shownSkin('x', 'time', at('night'), ['a'], RULES)).toBe('x');
    expect(shownSkin(null, 'season', at('day', 'summer'), ['a'], RULES)).toBeNull();
    expect(autoPick('time', at('night'), [], RULES)).toBeNull();
  });

  it('shownSkins reads sparse lists per group', () => {
    expect(shownSkins(['x'], [null, 'time'], 3, at('night'), ['c'], RULES)).toEqual(['x', 'c', null]);
    expect(shownSkins(undefined, undefined, 2, at('night'), ['c'], RULES)).toEqual([null, null]);
  });

  it('withAuto pads with null and replaces in place', () => {
    expect(withAuto(undefined, 2, 'season')).toEqual([null, null, 'season']);
    expect(withAuto(['time', 'season'], 0, null)).toEqual([null, 'season']);
  });
});

describe('actions', () => {
  it('sets and clears the mode of a cloud tier, with an event, and leaves the assigned skin alone', () => {
    const w0 = ok(applyTierSkin(world(['starry']), { group: 0, skinId: 'starry' }, ctxAt()));
    const r = setTierSkinAuto(w0, { group: 0, mode: 'time' }, ctxAt());
    expect((r as { events: unknown[] }).events).toContainEqual({ type: 'CLOUD_SKIN_AUTO_SET', group: 0, mode: 'time' });
    const w1 = ok(r);
    expect(cloudOf(w1).tierSkinAuto).toEqual(['time']);
    expect(cloudOf(w1).tierSkins).toEqual(cloudOf(w0).tierSkins);
    expect(w1.wallet).toEqual(w0.wallet);
    expect(cloudOf(ok(setTierSkinAuto(w1, { group: 0, mode: null }, ctxAt()))).tierSkinAuto).toEqual([null]);
  });

  it('sets and clears the mode of a garden zone', () => {
    const r = setZoneSkinAuto(world(), { group: 1, mode: 'season' }, ctxAt());
    expect((r as { events: unknown[] }).events).toContainEqual({ type: 'GARDEN_SKIN_AUTO_SET', group: 1, mode: 'season' });
    expect(gardenOf(ok(r)).zoneSkinAuto).toEqual([null, 'season']);
  });

  it('refuses a group or a mode that does not exist', () => {
    expect(err(setTierSkinAuto(world(), { group: -1, mode: 'time' }, ctxAt()))).toBe('INVALID_REQUEST');
    expect(err(setTierSkinAuto(world(), { group: 99, mode: 'time' }, ctxAt()))).toBe('INVALID_REQUEST');
    expect(err(setTierSkinAuto(world(), { group: 0, mode: 'weekly' as never }, ctxAt()))).toBe('INVALID_REQUEST');
    expect(err(setZoneSkinAuto(world(), { group: 0.5, mode: 'time' }, ctxAt()))).toBe('INVALID_REQUEST');
    expect(err(setZoneSkinAuto(world(), { group: 0, mode: '' as never }, ctxAt()))).toBe('INVALID_REQUEST');
  });
});

describe('scene state', () => {
  const night = JAN + 23 * HOUR;
  const noon = JAN + 12 * HOUR;
  const nightPick = SKIN_AUTO_RULES.time.night[0]!;

  it('a cloud tier on "by time" shows the night skin at night and the assigned one when the hour wishes for nothing', () => {
    const w = ok(setTierSkinAuto(ok(applyTierSkin(world([nightPick, 'verdant']), { group: 0, skinId: 'verdant' }, ctxAt())), { group: 0, mode: 'time' }, ctxAt()));
    expect(cloudScene(cloudOf(w), night, 0, w.cosmetics.plotSkins).skins[0]).toBe(nightPick);
    expect(SKIN_AUTO_RULES.time.day).toEqual([]);
    expect(cloudScene(cloudOf(w), noon, 0, w.cosmetics.plotSkins).skins[0]).toBe('verdant');
    // The save still holds what the player chose.
    expect(cloudOf(w).tierSkins[0]).toBe('verdant');
  });

  it('never shows a skin the player does not own', () => {
    const w = ok(setTierSkinAuto(world([]), { group: 0, mode: 'time' }, ctxAt()));
    expect(cloudScene(cloudOf(w), night, 0, w.cosmetics.plotSkins).skins[0]).toBeNull();
    expect(cloudScene(cloudOf(w), night).skins[0]).toBeNull();
  });

  it('a garden zone on "by season" follows the month', () => {
    const winter = SKIN_AUTO_RULES.season.winter[0]!;
    const spring = SKIN_AUTO_RULES.season.spring[0]!;
    const w = ok(setZoneSkinAuto(world([winter, spring]), { group: 0, mode: 'season' }, ctxAt()));
    expect(gardenScene(gardenOf(w), JAN, 0, w.cosmetics.plotSkins).zoneSkins[0]).toBe(winter);
    expect(gardenScene(gardenOf(w), Date.UTC(2024, 2, 15), 0, w.cosmetics.plotSkins).zoneSkins[0]).toBe(spring);
    // A zone that is off keeps its own skin.
    const w2 = ok(applyZoneSkin(w, { group: 1, skinId: spring }, ctxAt()));
    expect(gardenScene(gardenOf(w2), JAN, 0, w2.cosmetics.plotSkins).zoneSkins[1]).toBe(spring);
  });
});

describe('save', () => {
  it('the slice migrations add an empty list and keep the skins', () => {
    const cloud = CLOUD_MIGRATIONS[2]!({ version: 2, tierSkins: ['starry'], tierLevels: [2] });
    expect(cloud).toMatchObject({ version: 3, tierSkins: ['starry'], tierLevels: [2], tierSkinAuto: [] });
    const garden = GARDEN_MIGRATIONS[1]!({ version: 1 });
    expect(garden).toMatchObject({ version: 2, zoneSkins: [], zoneLevels: [], zoneSkinAuto: [] });
  });

  it('a slice written by a development build before the field existed still loads (no save is refused)', () => {
    const w = world();
    // What such a build wrote to disk: the same slices without the new key (JSON drops an undefined field).
    const oldCloud = JSON.parse(JSON.stringify({ ...cloudOf(w), tierSkinAuto: undefined })) as ReturnType<typeof cloudOf>;
    const oldGarden = JSON.parse(JSON.stringify({ ...gardenOf(w), zoneSkinAuto: undefined })) as ReturnType<typeof gardenOf>;
    expect('tierSkinAuto' in oldCloud || 'zoneSkinAuto' in oldGarden).toBe(false);
    expect(cloudStateSchema.safeParse(oldCloud).success).toBe(true);
    expect(gardenStateSchema.safeParse(oldGarden).success).toBe(true);
    expect(cloudScene(oldCloud, JAN).skins[0]).toBeNull();
    expect(cloudStateSchema.safeParse({ ...oldCloud, tierSkinAuto: ['weekly'] }).success).toBe(false);
  });

  it('survives a round trip through the save codec', () => {
    const w = ok(setZoneSkinAuto(ok(setTierSkinAuto(world(), { group: 2, mode: 'season' }, ctxAt())), { group: 0, mode: 'time' }, ctxAt()));
    const loaded = parseSave(JSON.stringify(w), SAVE_CODEC);
    if (!loaded.ok) throw new Error('the save did not load');
    const back = loaded.save;
    expect(cloudOf(back).tierSkinAuto).toEqual([null, null, 'season']);
    expect(gardenOf(back).zoneSkinAuto).toEqual(['time']);
  });
});

describe('presentation', () => {
  it('toasts say what the tier / zone does now', () => {
    const c = cloudPresentation({ type: 'CLOUD_SKIN_AUTO_SET', group: 0, mode: 'time' } as never, 'action');
    expect(c?.toast).toContain(vi.cloud.tierNames[0]);
    expect(c?.toast).not.toContain('{');
    const g = gardenPresentation({ type: 'GARDEN_SKIN_AUTO_SET', group: 0, mode: null } as never, 'action');
    expect(g?.toast).toContain(vi.garden.zoneNames[0]);
    expect(g?.toast).not.toBe(c?.toast);
  });

  it('the forge row marks the mode and says what shows now', () => {
    const nightPick = SKIN_AUTO_RULES.time.night[0]!;
    const w = world([nightPick]);
    const off = skinAutoVm(w, null, null, at('night'));
    expect(off.chips.map((c) => [c.mode, c.active])).toEqual([[null, true], ['time', false], ['season', false]]);
    expect(off.showing).toBeNull();
    const on = skinAutoVm(w, null, 'time', at('night'));
    expect(on.chips.find((c) => c.active)?.mode).toBe('time');
    expect(on.showing).toContain(vi.plotSkin.names[nightPick as keyof typeof vi.plotSkin.names]);
    expect(skinAutoVm(w, null, 'time', at('day')).showing).toContain(vi.plotSkin.plain);
  });
});
