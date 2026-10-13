// The plaza (spec §3.1): five doors for five Areas, closed ones say why, the character appears where
// they should, and the layout is walkable (spawn, every door reachable).
import { describe, expect, it } from 'vitest';
import { AREAS } from '../../src/app/areas';
import { PLAZA_LAYOUT } from '../../src/areas/plaza/logic/config/content';
import { portalPrompt, portalViews } from '../../src/areas/plaza/logic/portals';
import { vi } from '../../src/i18n/vi';
import { makeState } from './stateFactory';
import { world } from './worldKit';
import { mulberry32 } from '../../src/core/rng';

const infos = () => AREAS.areas(world(makeState()));
const views = () => portalViews(infos());

describe('portals', () => {
  it('has a door for every Area of the roadmap, each placed once in the layout', () => {
    const doors = PLAZA_LAYOUT.placements.filter((p) => p.portal).map((p) => p.portal);
    expect(new Set(doors).size).toBe(doors.length);
    expect([...views().keys()].sort()).toEqual([...doors].sort());
    expect(doors).toHaveLength(5);
    expect([...views().values()].map((v) => v.areaId).sort()).toEqual(
      ['sobi_adventure', 'sobi_aquarium', 'sobi_cloud', 'sobi_farm', 'sobi_garden'].sort(),
    );
  });

  it('the farm is open; the others are closed with their conditions (GAME_BALANCE §7)', () => {
    const v = views();
    expect(v.get('pig_barn')).toMatchObject({ status: 'open', conditions: [] });
    expect(v.get('garden_gate')).toMatchObject({ status: 'locked', name: 'Sobi Garden' });
    expect(v.get('sea_dock')).toMatchObject({ status: 'locked', name: 'Sobi Aquarium' });
    expect(v.get('garden_gate')?.conditions).toEqual(['Sobi World cấp 3 (hiện 1)']);
    expect(v.get('sea_dock')?.conditions).toEqual(['Sobi World cấp 6 (hiện 1)']);
    expect(v.get('sky_tree')?.conditions).toHaveLength(2);
    expect(v.get('portal_gate')?.conditions).toEqual(['Sobi World cấp 8 (hiện 1)', 'Phát triển thế giới 20 (hiện 1)']);
  });

  it('shows the farm level as it grows (the numbers come from the save)', () => {
    const rich = world(makeState());
    const leveled = { ...rich, progression: { ...rich.progression, areas: { ...rich.progression.areas, sobi_farm: { xp: 100_000 } } } };
    const v = portalViews(AREAS.areas(leveled));
    expect(v.get('garden_gate')?.conditions).toEqual([]); // conditions met; the world opens the door on its next step
    expect(v.get('garden_gate')?.status).toBe('locked');
    const opened = AREAS.advance(leveled, leveled.meta.updatedAt, mulberry32(1), 0);
    expect(opened.events).toEqual([
      { type: 'AREA_UNLOCKED', areaId: 'sobi_garden' },
      { type: 'AREA_UNLOCKED', areaId: 'sobi_aquarium' },
      { type: 'AREA_UNLOCKED', areaId: 'sobi_cloud' },
      { type: 'AREA_UNLOCKED', areaId: 'sobi_adventure' },
    ]);
    expect(opened.state.world.unlockedAreas).toContain('sobi_garden');
    expect(portalViews(AREAS.areas(opened.state)).get('garden_gate')?.status).toBe('open');
    expect(AREAS.advance(opened.state, opened.state.meta.updatedAt, mulberry32(1), 0).events).toEqual([]); // once
  });

  it('prompts: an open door has an action, a closed one only the reason', () => {
    const v = views();
    expect(portalPrompt(v.get('pig_barn')!)).toEqual({ action: 'Vào Sobi Farm', title: 'Vào Sobi Farm', lines: [] });
    const closed = portalPrompt(v.get('portal_gate')!); // every Area is built: a closed door says what it still needs
    expect(closed.action).toBeNull();
    expect(closed.title).toContain('Sobi Adventure');
    expect(closed.lines[0]).toBe(vi.plaza.conditions);
  });
});

describe('how the player acts (spec §4)', () => {
  it('only the plaza and Sobi Adventure have a walking character; every other Area is played with clicks', () => {
    const movement = Object.fromEntries(AREAS.areas(world(makeState())).map((a) => [a.manifest.id, a.manifest.movement]));
    expect(movement).toEqual({
      sobi_farm: 'click',
      sobi_garden: 'click',
      sobi_aquarium: 'click',
      sobi_cloud: 'click',
      sobi_adventure: 'character',
    });
  });
});
