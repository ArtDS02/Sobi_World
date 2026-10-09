// The plaza (spec §3.1): five doors for five Areas, closed ones say why, the character appears where
// they should, and the layout is walkable (spawn, every door reachable).
import { describe, expect, it } from 'vitest';
import { AREAS } from '../../src/app/areas';
import { PLAZA_ID, newPlayer } from '../../src/core/player/player';
import { arrivalSpot, DOOR_STEP_PX } from '../../src/areas/plaza/logic/arrival';
import { PLAZA_LAYOUT } from '../../src/areas/plaza/logic/config/content';
import { portalPrompt, portalViews } from '../../src/areas/plaza/logic/portals';
import { plazaWalkable } from '../../src/areas/plaza/logic/walkable';
import { footprintOf } from '../../src/systems/layout/footprint';
import { canStand, directionTo, nearestInteractable, stepCharacter } from '../../src/systems/character';
import { vi } from '../../src/i18n/vi';
import { makeState } from './stateFactory';
import { world } from './worldKit';

const infos = () => AREAS.areas(world(makeState()));
const views = () => portalViews(infos());
const areaOf = (portal: string) => views().get(portal)?.areaId;
const feet = { halfW: 16, halfH: 7 };

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
    expect(v.get('garden_gate')).toMatchObject({ status: 'soon', name: 'Sobi Garden' });
    expect(v.get('garden_gate')?.conditions).toEqual(['Sobi Farm cấp 3 (hiện 1)']);
    expect(v.get('sea_dock')?.conditions).toHaveLength(2);
    expect(v.get('sky_tree')?.conditions).toHaveLength(3);
    expect(v.get('portal_gate')?.conditions).toEqual(['Sobi Farm cấp 8 (hiện 1)', 'Phát triển thế giới 20 (hiện 1)']);
  });

  it('shows the farm level as it grows (the numbers come from the save)', () => {
    const rich = world(makeState());
    const leveled = { ...rich, progression: { ...rich.progression, areas: { ...rich.progression.areas, sobi_farm: { xp: 100_000 } } } };
    const v = portalViews(AREAS.areas(leveled));
    expect(v.get('garden_gate')?.conditions).toEqual([]); // conditions met, but the Area is not built
    expect(v.get('garden_gate')?.status).toBe('soon');
  });

  it('prompts: an open door has an action, a closed one only the reason', () => {
    const v = views();
    expect(portalPrompt(v.get('pig_barn')!)).toEqual({ action: 'Vào Sobi Farm', title: 'Vào Sobi Farm', lines: [] });
    const closed = portalPrompt(v.get('garden_gate')!);
    expect(closed.action).toBeNull();
    expect(closed.title).toContain(vi.plaza.soon);
    expect(closed.lines[0]).toBe(vi.plaza.conditions);
  });
});

describe('arrival', () => {
  const walk = plazaWalkable(PLAZA_LAYOUT, [], feet);
  const w = PLAZA_LAYOUT.designSize.width;
  const h = PLAZA_LAYOUT.designSize.height;

  it('a new character appears at the spawn', () => {
    const a = arrivalSpot(PLAZA_LAYOUT, walk, areaOf, newPlayer(), null);
    expect(a.x).toBeCloseTo(PLAZA_LAYOUT.spawn.x * w);
    expect(a.y).toBeCloseTo(PLAZA_LAYOUT.spawn.y * h);
  });

  it('the game opens at the saved spot in the plaza', () => {
    const a = arrivalSpot(PLAZA_LAYOUT, walk, areaOf, { area: PLAZA_ID, x: 300, y: 700, facing: 'left' }, null);
    expect(a).toEqual({ x: 300, y: 700, facing: 'left' });
  });

  it('saved in an Area (closed while inside): the game opens in front of its door', () => {
    const farmDoor = PLAZA_LAYOUT.placements.find((p) => p.portal === 'pig_barn')!;
    const a = arrivalSpot(PLAZA_LAYOUT, walk, areaOf, { area: 'sobi_farm', x: 5, y: 5, facing: 'up' }, null);
    expect(a.x).toBeCloseTo(farmDoor.x * w);
    expect(a.y).toBeCloseTo(farmDoor.y * h + DOOR_STEP_PX);
    expect(a.facing).toBe('down');
  });

  it('leaving an Area puts the character at its door, whatever was saved', () => {
    const farmDoor = PLAZA_LAYOUT.placements.find((p) => p.portal === 'pig_barn')!;
    const a = arrivalSpot(PLAZA_LAYOUT, walk, areaOf, { area: PLAZA_ID, x: 900, y: 800, facing: 'up' }, 'sobi_farm');
    expect(a.x).toBeCloseTo(farmDoor.x * w);
  });

  it('a saved spot outside the ground is brought back in', () => {
    const a = arrivalSpot(PLAZA_LAYOUT, walk, areaOf, { area: PLAZA_ID, x: -400, y: 99_999, facing: 'down' }, null);
    expect(canStand(a, walk)).toBe(true);
  });
});

describe('layout is walkable', () => {
  // The scene draws art at the layout's width; these tests use the same placement boxes with a
  // nominal aspect (height = 1.1 × width), enough to prove spawn and doors are not walled in.
  const boxes = PLAZA_LAYOUT.placements.map((p) => {
    const width = p.width ?? 200;
    const height = p.height ?? width * 1.1;
    const x = p.x * PLAZA_LAYOUT.designSize.width;
    const y = p.y * PLAZA_LAYOUT.designSize.height;
    return { p, rect: { x: x - width / 2, y: y - height, width, height } };
  });
  const walk = plazaWalkable(
    PLAZA_LAYOUT,
    boxes.filter((b) => b.p.solid).map((b) => footprintOf(b.rect)),
    feet,
  );

  it('the spawn is standable', () => {
    const a = arrivalSpot(PLAZA_LAYOUT, walk, areaOf, newPlayer(), null);
    expect(canStand(a, walk)).toBe(true);
  });

  it('from the spawn the character can reach every door and use it', () => {
    for (const b of boxes.filter((x) => x.p.portal)) {
      const door = { id: b.p.portal!, x: b.rect.x + b.rect.width / 2, y: b.rect.y + b.rect.height, reach: PLAZA_LAYOUT.portalReach };
      let s = { ...arrivalSpot(PLAZA_LAYOUT, walk, areaOf, newPlayer(), null), moving: false };
      for (let i = 0; i < 4000 && !nearestInteractable([door], s); i++) {
        const dir = directionTo(s, { x: door.x, y: door.y + 30 }, 5);
        s = stepCharacter(s, dir, 16, 280, walk);
        // Walls: nudge sideways when stuck against an object in front of the door.
        if (!s.moving && i % 7 === 0) s = stepCharacter(s, { x: 1, y: 0 }, 16, 280, walk);
      }
      expect(nearestInteractable([door], s), `door ${door.id} reachable`).not.toBeNull();
    }
  });

  it('the door fronts are not blocked: a character stands right below each door', () => {
    for (const b of boxes.filter((x) => x.p.portal)) {
      const front = { x: b.rect.x + b.rect.width / 2, y: b.rect.y + b.rect.height + DOOR_STEP_PX };
      expect(canStand(front, walk), `front of ${b.p.portal}`).toBe(true);
    }
  });
});
