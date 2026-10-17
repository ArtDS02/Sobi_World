// Adventure V2 trips (decision 037, spec §2–§3, §16): starting at the entrance or a lit portal, walking on the grid, using things within
// reach (treasure chest once per save, gates that need an element, springs once per trip), touching a group starts a battle, the area's
// guardian lights its portal, the boss clears the zone (SP the first time), fleeing, exits, portals, going home, losing, the quick trip,
// and that a saved trip plays on the same way.
import { describe, expect, it } from 'vitest';
import { engage, flee, interact, moveTo, returnToCamp, startRun, sweepZone, takeExit, travel } from '../../src/areas/adventure/logic/actions/run';
import { AB, MAPS } from '../../src/areas/adventure/logic/config/content';
import { tileCenter } from '../../src/areas/adventure/logic/maps';
import { adventureOf, withAdventure } from '../../src/areas/adventure/logic/save/lens';
import type { WorldSave } from '../../src/core/save/world';
import { T0, adventureWorld, ctxAt, err, fight, keys, ok, squad, standBy, strong, walkTrip } from './adventureKit';

const roster = squad;
const start = (w: WorldSave, zoneId = 'zone_forest', mapId?: string) => ok(startRun(w, { zoneId, keys, roster, ...(mapId ? { mapId } : {}) }, ctxAt(T0)));
const F1 = MAPS.map_forest_edge!;

describe('starting a trip', () => {
  it('starts at the entrance spawn, charges the energy, freezes the team', () => {
    const w = start(strong(adventureWorld()));
    const run = adventureOf(w).run!;
    expect(run).toMatchObject({ mapId: 'map_forest_edge', phase: 'explore' });
    expect({ x: run.x, y: run.y }).toEqual(tileCenter(F1, F1.spawn.x, F1.spawn.y));
    expect(adventureOf(w).fighters[squad[0]!.key]!.energy).toBe(AB.run.energyMax - AB.run.energyCost);
    expect(run.team).toHaveLength(3);
  });
  it('an unlit portal cannot be a starting point; a locked zone is refused', () => {
    expect(err(startRun(strong(adventureWorld()), { zoneId: 'zone_forest', mapId: 'map_forest_deep', keys, roster }, ctxAt(T0)))).toBe('PORTAL_INACTIVE');
    expect(err(startRun(strong(adventureWorld()), { zoneId: 'zone_mountain', keys, roster }, ctxAt(T0)))).toBe('ZONE_NOT_CLEARED');
  });
});

describe('walking and using things', () => {
  it('the walker cannot stand in a wall; things are used only within reach', () => {
    const w = start(strong(adventureWorld()));
    expect(err(moveTo(w, { x: 5, y: 5 }, ctxAt(T0)))).toBe('BLOCKED');
    const chest = F1.chests.find((c) => c.id === 'chest_f1_grove')!;
    expect(err(interact(w, { ...tileCenter(F1, F1.spawn.x, F1.spawn.y), id: chest.id }, ctxAt(T0)))).toBe('TOO_FAR');
  });
  it('a treasure chest opens once for the whole save; its loot waits for the end of the trip', () => {
    let w = start(strong(adventureWorld()));
    w = ok(interact(w, { ...standBy(w, F1.id, 'chest_f1_grove'), id: 'chest_f1_grove' }, ctxAt(T0)));
    expect(adventureOf(w).openedChests).toContain('chest_f1_grove');
    expect(Object.keys(adventureOf(w).run!.loot).length).toBeGreaterThan(0);
    expect(err(interact(w, { ...standBy(w, F1.id, 'chest_f1_grove'), id: 'chest_f1_grove' }, ctxAt(T0)))).toBe('ALREADY_OPENED');
  });
  it('a gate needs a companion of its element; a spring heals once per area per trip', () => {
    let w = start(strong(adventureWorld()));
    const gate = F1.gates[0]!;
    const near = tileCenter(F1, gate.x, gate.y + 1);
    expect(err(interact(w, { ...near, id: gate.id }, ctxAt(T0)))).toBe('GATE_NEEDS_ELEMENT');
    const spring = F1.springs[0]!;
    const run = adventureOf(w).run!;
    w = withAdventure(w, { ...adventureOf(w), run: { ...run, team: run.team.map((m) => ({ ...m, hp: 1 })) } });
    w = ok(interact(w, { ...standBy(w, F1.id, spring.id), id: spring.id }, ctxAt(T0)));
    expect(adventureOf(w).run!.team[0]!.hp).toBeGreaterThan(1);
    expect(err(interact(w, { ...standBy(w, F1.id, spring.id), id: spring.id }, ctxAt(T0)))).toBe('SPRING_USED');
  });
});

describe('battles on the map', () => {
  it('touching a group starts a battle; winning removes it for the trip; a normal group can be fled', () => {
    let w = start(strong(adventureWorld()));
    const g = F1.groups.find((x) => x.kind === 'normal')!;
    w = ok(engage(w, { ...tileCenter(F1, g.x, g.y), groupId: g.id }, ctxAt(T0)));
    expect(adventureOf(w).run!.phase).toBe('battle');
    const fled = ok(flee(w, ctxAt(T0)));
    expect(adventureOf(fled).run).toMatchObject({ phase: 'explore', graceUntil: T0 + AB.explore.graceMs });
    w = fight(w);
    expect(adventureOf(w).run!.defeated).toContain(`${F1.id}/${g.id}`);
    expect(err(engage(w, { ...tileCenter(F1, g.x, g.y), groupId: g.id }, ctxAt(T0)))).toBe('ALREADY_OPENED');
  });
  it('the guardian cannot be fled and lights its area\'s portal', () => {
    let w = start(strong(adventureWorld()));
    const g = F1.groups.find((x) => x.kind === 'elite')!;
    w = ok(engage(w, { ...tileCenter(F1, g.x, g.y), groupId: g.id }, ctxAt(T0)));
    expect(err(flee(w, ctxAt(T0)))).toBe('CANNOT_FLEE');
    w = fight(w);
    expect(adventureOf(w).activePortals).toContain(F1.id);
  });
});

describe('a whole trip', () => {
  it('a strong team beats the forest: the zone is cleared, every portal lit, SP for the first time, a win', () => {
    let w = start(strong(adventureWorld(), 14));
    w = walkTrip(w);
    const a = adventureOf(w);
    expect(a.run!.result).toBe('win');
    expect(a.cleared.zone_forest).toBe(1);
    expect(a.activePortals).toEqual(expect.arrayContaining(['map_forest_edge', 'map_forest_deep', 'map_forest_heart']));
    expect(a.fighters[squad[0]!.key]!.sp).toBeGreaterThanOrEqual(AB.sp.bossFirstClear);
    expect(a.fighters[squad[0]!.key]!.bossClears).toEqual(['zone_forest']);
    expect(Object.keys(a.pending).length).toBeGreaterThan(0);
  });
  it('a weak team loses: nobody is lost, everyone is exhausted, what was found is kept', () => {
    const w = walkTrip(start(strong(adventureWorld(), 1, { loadout: {} })));
    const a = adventureOf(w);
    expect(a.run!.result).toBe('lose');
    expect(a.fighters[squad[0]!.key]!.exhaustedUntil).toBe(T0 + AB.run.exhaustHours * 3_600_000);
  });
  it('the same seed walks the same trip; a trip saved halfway ends the same', () => {
    const a = walkTrip(start(strong(adventureWorld(), 12)));
    const b = walkTrip(JSON.parse(JSON.stringify(start(strong(adventureWorld(), 12)))));
    expect(adventureOf(a).run).toEqual(adventureOf(b).run);
  });
  it('exits lead to the next area; portals connect lit areas; going home is always allowed outside a battle', () => {
    let w = start(strong(adventureWorld(), 14));
    w = walkTrip(w);
    w = withAdventure(w, { ...adventureOf(w), run: null });
    w = start(w, 'zone_forest', 'map_forest_heart');
    expect(adventureOf(w).run!.mapId).toBe('map_forest_heart');
    const heart = MAPS.map_forest_heart!;
    w = ok(travel(w, { ...tileCenter(heart, heart.spawn.x, heart.spawn.y), to: 'map_forest_edge' }, ctxAt(T0)));
    expect(adventureOf(w).run!.mapId).toBe('map_forest_edge');
    const exit = F1.exits[0]!;
    w = ok(takeExit(w, { ...standBy(w, F1.id, exit.id), exitId: exit.id }, ctxAt(T0)));
    expect(adventureOf(w).run!.mapId).toBe('map_forest_deep');
    w = ok(returnToCamp(w, ctxAt(T0)));
    expect(adventureOf(w).run!.result).toBe('retreat');
  });
  it('the quick trip needs a cleared zone and brings a share of the loot without walking', () => {
    const w0 = strong(adventureWorld(), 14);
    expect(err(sweepZone(w0, { zoneId: 'zone_forest', keys, roster }, ctxAt(T0)))).toBe('ZONE_NOT_CLEARED');
    const cleared = withAdventure(w0, { ...adventureOf(w0), cleared: { zone_forest: 1 } });
    const w = ok(sweepZone(cleared, { zoneId: 'zone_forest', keys, roster }, ctxAt(T0)));
    expect(adventureOf(w).run).toMatchObject({ phase: 'done', result: 'sweep' });
    expect(adventureOf(w).run!.expGained).toBeGreaterThan(0);
  });
});
