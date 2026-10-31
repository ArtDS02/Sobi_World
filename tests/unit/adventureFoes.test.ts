// The six classes of enemy group and their corruption (decision 045): which ones stay beaten and which the party may flee, how a class
// and a corruption level remake the enemies (stats against the class's own level, Light weakness, resistances, dark skills, the
// umbraflux tag, a grown element), what they give, the sleeping groups (stunned at the start, touched only up close) and the special
// groups that wait for rain or night.
import { describe, expect, it } from 'vitest';
import { engage, startRun } from '../../src/areas/adventure/logic/actions/run';
import { AB, MAPS } from '../../src/areas/adventure/logic/config/content';
import { enemyInits } from '../../src/areas/adventure/logic/encounter';
import { areaCorruption, canFlee, corruptionOf, corruptionOfTags, foePresent, foeReward, groupNow, grownElement, isGuardian, staysBeaten, withClass } from '../../src/areas/adventure/logic/foes';
import { tileCenter } from '../../src/areas/adventure/logic/maps';
import { adventureOf } from '../../src/areas/adventure/logic/save/lens';
import { T0, adventureWorld, ctxAt, err, keys, ok, squad, strong } from './adventureKit';

const mossling = () => enemyInits(['enemy_mossling'])[0]!;

describe('classes', () => {
  it('guardians, groups beaten for good, groups the party may run from', () => {
    expect(['normal', 'elite', 'mutant', 'subboss', 'boss', 'special'].map((kind) => [kind, isGuardian({ kind } as never), staysBeaten({ kind } as never), canFlee({ kind } as never)])).toEqual([
      ['normal', false, false, true],
      ['elite', true, true, false],
      ['mutant', false, false, true],
      ['subboss', false, true, false],
      ['boss', true, true, false],
      ['special', false, true, false],
    ]);
  });
  it('a group without a corruption has the one of its class', () => {
    expect(corruptionOf({ kind: 'normal' })).toBe(AB.foes.classes.normal.corruption);
    expect(corruptionOf({ kind: 'boss' })).toBe(AB.foes.classes.boss.corruption);
    expect(corruptionOf({ kind: 'normal', corruption: 3 })).toBe(3);
  });
  it('a mutant or a special grows the second element of its table (or its own), the other classes none', () => {
    expect(grownElement({ kind: 'mutant' }, 'NATURE')).toBe(AB.foes.secondElement.NATURE);
    expect(grownElement({ kind: 'special', element2: 'FIRE' }, 'NATURE')).toBe('FIRE');
    expect(grownElement({ kind: 'special', element2: 'NATURE' }, 'NATURE')).toBeNull();
    expect(grownElement({ kind: 'elite' }, 'NATURE')).toBeNull();
  });
});

describe('remaking the enemies', () => {
  it('a class at its own corruption fights as the enemy was made', () => {
    const base = mossling();
    const [e] = withClass([base], { kind: 'normal' });
    expect(e!.stats).toEqual(base.stats);
    expect(e!.skills).toEqual(base.skills);
    expect(e!.tags).toEqual(expect.arrayContaining(['foe:normal', 'corruption:1']));
    expect(e!.tags).not.toContain('umbraflux');
    expect(corruptionOfTags(e!.tags ?? [])).toBe(1);
  });
  it('higher corruption: stronger, weaker to Light, darker skills, the umbraflux tag', () => {
    const base = mossling();
    const [e] = withClass([base], { kind: 'normal', corruption: 4 });
    const lv = AB.foes.corruption[3]!;
    expect(e!.stats.hp).toBeCloseTo(base.stats.hp * lv.stats, 5);
    expect(e!.stats.spd).toBe(base.stats.spd);
    expect(e!.mods?.elementResist?.LIGHT).toBeCloseTo(-lv.lightWeak, 5);
    expect(e!.mods?.elementResist?.FIRE).toBeCloseTo(lv.resist, 5);
    expect(e!.skills.map((s) => s.id)).toEqual([...base.skills.map((s) => s.id), 'skill_e_shadow_bite', 'skill_e_curse']);
    expect(e!.tags).toContain('umbraflux');
  });
  it('a boss at its own corruption keeps its stats, skills and resistances, but Light still hurts it more', () => {
    const base = enemyInits(['enemy_old_treant'])[0]!;
    const [e] = withClass([base], { kind: 'boss' });
    expect(e!.stats).toEqual(base.stats);
    expect(e!.skills).toEqual(base.skills);
    expect(e!.mods?.elementResist?.FIRE ?? 0).toBe(base.mods?.elementResist?.FIRE ?? 0);
    expect(e!.mods?.elementResist?.LIGHT).toBeCloseTo((base.mods?.elementResist?.LIGHT ?? 0) - AB.foes.corruption[AB.foes.classes.boss.corruption - 1]!.lightWeak, 5);
    expect(e!.tags).toContain('umbraflux');
  });
  it('a mutant: its class stats, its grown element, its class in its name', () => {
    const base = mossling();
    const [e] = withClass([base], { kind: 'mutant' });
    expect(e!.stats.hp).toBeCloseTo(base.stats.hp * AB.foes.classes.mutant.stats.hp!, 5);
    expect(e!.element2).toBe(AB.foes.secondElement.NATURE);
    expect(e!.name).toContain(AB.foes.classes.mutant.nameVi);
  });
  it('a sleeping group starts the battle stunned', () => {
    const [e] = withClass([mossling()], { kind: 'normal', sleep: true });
    expect(e!.statuses).toEqual([{ status: 'stun', turns: 1 }]);
  });
  it('rewards: the class, then corruption against the level of the class', () => {
    const normal = AB.foes.classes.normal;
    expect(foeReward({ kind: 'normal' })).toEqual({ reward: normal.reward, drops: normal.drops });
    expect(foeReward({ kind: 'normal', corruption: 2 }).reward).toBeCloseTo(normal.reward * AB.foes.corruption[1]!.reward, 5);
    expect(foeReward({ kind: 'subboss' })).toEqual({ reward: AB.foes.classes.subboss.reward, drops: AB.foes.classes.subboss.drops });
  });
});

describe('on the map', () => {
  it('a special group waits for its sky', () => {
    expect(foePresent({ when: 'rain' }, { rain: false, night: true })).toBe(false);
    expect(foePresent({ when: 'rain' }, { rain: true, night: false })).toBe(true);
    expect(foePresent({ when: 'night' }, { rain: true, night: false })).toBe(false);
    expect(foePresent({}, { rain: false, night: false })).toBe(true);
  });
  it('touching a sleeping group: the party moves first, the enemies are stunned', () => {
    const map = MAPS.map_forest_edge!;
    const g = map.groups.find((x) => x.sleep)!;
    let w = ok(startRun(strong(adventureWorld()), { zoneId: 'zone_forest', keys, roster: squad }, ctxAt(T0)));
    w = ok(engage(w, { ...tileCenter(map, g.x, g.y), groupId: g.id, quick: false }, ctxAt(T0)));
    const battle = adventureOf(w).run!.battle!;
    const foes = battle.combatants.filter((c) => c.side === 'enemy');
    expect(foes.every((c) => c.statuses.some((s) => s.id === 'stun') || c.hp <= 0)).toBe(true);
    expect(foes.every((c) => c.tags.includes(`foe:${g.kind}`))).toBe(true);
  });
  it('a sleeping group is touched only up close', () => {
    const map = MAPS.map_forest_edge!;
    const g = map.groups.find((x) => x.sleep)!;
    const w = ok(startRun(strong(adventureWorld()), { zoneId: 'zone_forest', keys, roster: squad }, ctxAt(T0)));
    const at = tileCenter(map, g.x, g.y);
    // Just beyond the sleeping reach, inside the usual one, on whichever side is walkable.
    const off = AB.explore.touch * AB.foes.sleepTouch + map.tile + 4;
    const tries = [{ x: at.x - off, y: at.y }, { x: at.x + off, y: at.y }, { x: at.x, y: at.y - off }, { x: at.x, y: at.y + off }];
    const results = tries.map((p) => err(engage(w, { ...p, groupId: g.id, quick: false }, ctxAt(T0))));
    expect(results.some((r) => r === 'TOO_FAR')).toBe(true);
    expect(results.every((r) => r === 'TOO_FAR' || r === 'BLOCKED')).toBe(true);
  });
});

describe('purification (decision 045)', () => {
  const ruins = MAPS.map_ruins_gate!;
  it('an area keeps its corruption until its zone boss falls, then loses a step', () => {
    expect(areaCorruption(ruins, { cleared: {} })).toBe(ruins.corruption);
    expect(areaCorruption(ruins, { cleared: { zone_ruins: 1 } })).toBe(Math.max(0, ruins.corruption - AB.foes.purify.area));
    expect(areaCorruption(ruins, { cleared: { zone_forest: 1 } })).toBe(ruins.corruption);
  });
  it('in a purified zone the normal groups are a step less corrupted, never under 1; the others stay', () => {
    expect(corruptionOf(groupNow({ kind: 'normal', corruption: 3 }, true))).toBe(3 - AB.foes.purify.normal);
    expect(corruptionOf(groupNow({ kind: 'normal' }, true))).toBe(1);
    expect(corruptionOf(groupNow({ kind: 'elite', corruption: 3 }, true))).toBe(3);
    expect(corruptionOf(groupNow({ kind: 'normal', corruption: 3 }, false))).toBe(3);
  });
  it('every area of the content has a corruption that rises along the journey', () => {
    const pct = (id: string) => MAPS[id]!.corruption;
    expect(pct('map_forest_edge')).toBeLessThan(pct('map_mountain_foot'));
    expect(pct('map_mountain_foot')).toBeLessThan(pct('map_ruins_gate'));
    expect(pct('map_ruins_gate')).toBeLessThan(pct('map_ruins_sanctum'));
  });
});
