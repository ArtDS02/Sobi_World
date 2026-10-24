// Decision 039: the quick win over a weak group, the variants a group wears (and the golden one running away), the bonds of two Guardian
// lines, feats and titles, what the creatures say, the area tips, the Umbraflux Rift and its Nightmares, the softer loss, and the
// v2 → v3 migration (a real v2 slice and a trip on its way).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { battleAct, engage, interact, returnToCamp, riftNext, seeTip, startRift, startRun } from '../../src/areas/adventure/logic/actions/run';
import { activeSynergies, hasTitle, pickQuip, quipLine, titleOf, titlesOf, withSynergies } from '../../src/areas/adventure/logic/bonds';
import { AB, AFFIXES, ENGAGEMENT, MAPS, RIFT, TITLES, ZONES } from '../../src/areas/adventure/logic/config/content';
import { floorReward, floorScale, nightmareAt, riftDay, riftEnemies, ruleOfDay } from '../../src/areas/adventure/logic/rift';
import { adventureOf, withAdventure } from '../../src/areas/adventure/logic/save/lens';
import { ADVENTURE_MIGRATIONS } from '../../src/areas/adventure/logic/migrations';
import { adventureStateSchema, newFeats, type RunMember } from '../../src/areas/adventure/logic/state';
import { groupAffix, quickWinnable, withAffix } from '../../src/areas/adventure/logic/variants';
import { enemyInits } from '../../src/areas/adventure/logic/encounter';
import { groupEnemies } from '../../src/areas/adventure/logic/actions/trip';
import { COMBAT_CONTEXT } from '../../src/areas/adventure/logic/config/content';
import { tileCenter } from '../../src/areas/adventure/logic/maps';
import { escapeIn, stepFx } from '../../src/areas/adventure/ui/battleFloaters';
import { startBattle } from '../../src/systems/combat';
import type { BattleEvent } from '../../src/systems/combat/types';
import type { WorldSave } from '../../src/core/save/world';
import type { Raw } from '../../src/core/save/migrate';
import { T0, adventureWorld, ctxAt, err, fight, keys, ok, squad, standBy, strong } from './adventureKit';

const roster = squad;
const F1 = MAPS.map_forest_edge!;
const start = (w: WorldSave) => ok(startRun(w, { zoneId: 'zone_forest', keys, roster }, ctxAt(T0)));
const eventsOf = (r: { ok: boolean; events?: readonly { type: string }[] }) => (r.ok ? (r.events ?? []) : []);
const normal = F1.groups.find((g) => g.kind === 'normal')!;

/** The trip on with its seed replaced (a variant or no variant on `normal`). */
function withSeed(w: WorldSave, seed: number): WorldSave {
  const a = adventureOf(w);
  return withAdventure(w, { ...a, run: { ...a.run!, seed } });
}
const seedWhere = (test: (seed: number) => boolean): number => {
  for (let s = 1; s < 50_000; s += 1) if (test(s)) return s;
  throw new Error('no seed');
};

describe('variants (decision 039 §2)', () => {
  it('only normal groups wear one, the same for the whole trip, about as often as the content says', () => {
    const boss = MAPS.map_forest_heart!.groups.find((g) => g.kind === 'boss')!;
    let worn = 0;
    for (let s = 0; s < 2000; s += 1) {
      expect(groupAffix(s, 'map_forest_heart', boss)).toBeNull();
      const a = groupAffix(s, F1.id, normal);
      expect(groupAffix(s, F1.id, normal)).toBe(a);
      if (a) worn += 1;
    }
    expect(worn / 2000).toBeGreaterThan(ENGAGEMENT.affixChance - 0.05);
    expect(worn / 2000).toBeLessThan(ENGAGEMENT.affixChance + 0.05);
  });
  it('a variant scales the stats, adds its statuses and tags; the battle starts with them', () => {
    const base = enemyInits(['enemy_mossling']);
    const [soaked] = withAffix(base, AFFIXES.affix_soaked!);
    expect(soaked!.statuses).toEqual([{ status: 'wet', turns: 4 }]);
    const [armored] = withAffix(base, AFFIXES.affix_armored!);
    expect(armored!.stats.def).toBeCloseTo(base[0]!.stats.def * 1.35);
    expect(armored!.tags).toContain('affix:affix_armored');
    const battle = startBattle(1, [...withAffix(base, AFFIXES.affix_soaked!), { id: 'me', side: 'ally', name: 'me', element: 'FIRE', stats: base[0]!.stats, skills: [], statuses: [{ status: 'shield', turns: 3, amountPct: 0.2 }] }], COMBAT_CONTEXT).state;
    expect(battle.combatants.find((c) => c.side === 'enemy')!.statuses.map((s) => s.id)).toContain('wet');
    const shield = battle.combatants.find((c) => c.id === 'me')!.statuses.find((s) => s.id === 'shield');
    expect(shield?.amount).toBe(Math.round(base[0]!.stats.hp * 0.2));
  });
  it('a group with a variant pays more than the same group without', () => {
    const plain = seedWhere((s) => groupAffix(s, F1.id, normal) === null);
    const rich = seedWhere((s) => groupAffix(s, F1.id, normal)?.id === 'affix_bloodlust' && groupEnemies(s, F1.id, normal).join() === groupEnemies(plain, F1.id, normal).join());
    const coinsWith = (seed: number) => {
      const w = withSeed(start(strong(adventureWorld(), 20)), seed);
      const r = engage(w, { ...tileCenter(F1, normal.x, normal.y), groupId: normal.id, quick: false }, ctxAt(T0));
      return adventureOf(fight(ok(r))).run!.coins;
    };
    expect(coinsWith(rich)).toBeGreaterThan(coinsWith(plain));
  });
  it('a golden group runs away after its rounds: gone for the trip, nothing won', () => {
    const golden = seedWhere((s) => groupAffix(s, F1.id, normal)?.id === 'affix_golden');
    let w = withSeed(start(strong(adventureWorld(), 1)), golden);
    w = ok(engage(w, { ...tileCenter(F1, normal.x, normal.y), groupId: normal.id }, ctxAt(T0)));
    expect(adventureOf(w).run!.phase).toBe('battle');
    let escaped = false;
    for (let i = 0; i < 40 && adventureOf(w).run!.phase === 'battle'; i += 1) {
      const r = battleAct(w, { action: { kind: 'guard' } }, ctxAt(T0));
      escaped ||= eventsOf(r).some((e) => e.type === 'ADVENTURE_FOE_ESCAPED');
      w = ok(r);
    }
    const run = adventureOf(w).run!;
    expect(escaped).toBe(true);
    expect(run.phase).toBe('explore');
    expect(run.defeated).toContain(`${F1.id}/${normal.id}`);
    expect(run.coins).toBe(0);
  });
});

describe('quick win (decision 039 §2)', () => {
  const plain = seedWhere((s) => groupAffix(s, F1.id, normal) === null);
  it('a far stronger team beats a plain normal group at once, for a share of the rewards; quick: false plays it', () => {
    const w = withSeed(start(strong(adventureWorld(), 30)), plain);
    const run = adventureOf(w).run!;
    expect(quickWinnable(run.team, 30, 10, groupEnemies(plain, F1.id, normal), normal, null)).toBe(true);
    const r = engage(w, { ...tileCenter(F1, normal.x, normal.y), groupId: normal.id }, ctxAt(T0));
    const after = adventureOf(ok(r)).run!;
    expect(after.phase).toBe('explore');
    expect(after.defeated).toContain(`${F1.id}/${normal.id}`);
    const won = eventsOf(r).find((e) => e.type === 'ADVENTURE_BATTLE_WON') as { quick?: boolean } | undefined;
    expect(won?.quick).toBe(true);
    expect(adventureOf(ok(r)).fighters[keys[0]!]!.feats.battles).toBe(1);
    const played = adventureOf(ok(engage(w, { ...tileCenter(F1, normal.x, normal.y), groupId: normal.id, quick: false }, ctxAt(T0)))).run!;
    expect(played.phase).toBe('battle');
  });
  it('never for a team still within the zone, a weak team, a guardian or a variant', () => {
    const run = adventureOf(withSeed(start(strong(adventureWorld(), 1)), plain)).run!;
    expect(quickWinnable(run.team, 30, 10, ['enemy_forest_wolf', 'enemy_forest_wolf', 'enemy_forest_wolf'], normal, null)).toBe(false);
    const strongTeam = adventureOf(start(strong(adventureWorld(), 30))).run!.team;
    expect(quickWinnable(strongTeam, 10, 10, ['enemy_mossling'], normal, null)).toBe(false);
    expect(quickWinnable(strongTeam, 30, 10, ['enemy_mossling'], { kind: 'elite' }, null)).toBe(false);
    expect(quickWinnable(strongTeam, 30, 10, ['enemy_mossling'], normal, AFFIXES.affix_soaked!)).toBe(false);
  });
});

describe('bonds, feats, titles, words (decision 039 §4)', () => {
  const member = (key: string, lineage: RunMember['lineage']): RunMember =>
    ({ key, name: key, art: '', lineage, classId: 'mage', element: 'WATER', element2: null, stats: {} as RunMember['stats'], hp: 10, mp: 0, rage: 0, skills: [], ultimate: '', mods: { elementDamage: {}, elementResist: {}, statusChance: {}, statusResist: {}, categoryDamage: {} } }) as RunMember;
  it('two lines of a bond in one team share its bonus; one alone does not', () => {
    expect(activeSynergies(['nam_hai', 'loi_duong']).map((s) => s.id)).toContain('synergy_sea_storm');
    expect(activeSynergies(['nam_hai', 'quy_son']).map((s) => s.id)).not.toContain('synergy_sea_storm');
    const team = withSynergies([member('a', 'nam_hai'), member('b', 'loi_duong')]);
    expect(team[0]!.mods.elementDamage.LIGHTNING).toBeCloseTo(0.15);
    expect(withSynergies([member('a', 'nam_hai')])[0]!.mods.elementDamage.LIGHTNING).toBeUndefined();
  });
  it('titles follow the feats; the highest rank shows', () => {
    const f = { feats: { ...newFeats(), battles: 120, bestHit: 350 }, bossClears: ['zone_forest'] };
    expect(hasTitle(f, TITLES.title_veteran!)).toBe(true);
    expect(hasTitle(f, TITLES.title_titan!)).toBe(false);
    expect(titleOf(f)?.id).toBe('title_root_calmer');
    expect(titlesOf({ feats: newFeats(), bossClears: [] })).toEqual([]);
  });
  it('a battle counts in the feats; a chest always makes someone speak', () => {
    let w = start(strong(adventureWorld(), 12));
    w = fight(ok(engage(w, { ...tileCenter(F1, normal.x, normal.y), groupId: normal.id, quick: false }, ctxAt(T0))));
    const f = adventureOf(w).fighters[keys[0]!]!;
    expect(f.feats.battles).toBe(1);
    expect(f.feats.bestHit).toBeGreaterThan(0);
    const chest = F1.chests.find((c) => c.id === 'chest_f1_grove')!;
    const r = interact(w, { ...standBy(w, F1.id, chest.id), id: chest.id }, ctxAt(T0));
    expect(eventsOf(r).some((e) => e.type === 'ADVENTURE_QUIP')).toBe(true);
  });
  it('words are drawn from the seed; every line has its sayings', () => {
    const team = [member('a', 'moc_mau')];
    expect(pickQuip(team, 'bossVi', 3, true)).toEqual(pickQuip(team, 'bossVi', 3, true));
    expect(quipLine('moc_mau', 'winVi', 5).length).toBeGreaterThan(0);
  });
});

describe('battle effects (decision 039 §1)', () => {
  const ev = (...events: BattleEvent[]): BattleEvent[] => events;
  const battle = startBattle(1, [
    { id: 'a', side: 'ally', name: 'A', element: 'FIRE', stats: enemyInits(['enemy_mossling'])[0]!.stats, skills: [] },
    ...enemyInits(['enemy_mossling']),
  ], COMBAT_CONTEXT).state;
  const foe = battle.combatants.find((c) => c.side === 'enemy')!.id;
  it('numbers rise over the units a step touched; a crit shakes; at most four a unit', () => {
    const fx = stepFx(battle, ev(
      { type: 'damage', actor: 'a', target: foe, amount: 120, crit: true, mult: 1.5, skillId: null, absorbed: 0, element: 'FIRE' },
      { type: 'miss', actor: foe, target: 'a', skillId: null },
      { type: 'heal', actor: 'a', target: 'a', amount: 30, skillId: null },
    ));
    expect(fx.floaters.map((f) => [f.unit, f.tone])).toEqual([[foe, 'crit'], ['a', 'miss'], ['a', 'heal']]);
    expect(fx.shake).toBe(true);
    const many = stepFx(battle, ev(...Array.from({ length: 9 }, (): BattleEvent => ({ type: 'damage', actor: 'a', target: foe, amount: 1, crit: false, mult: 1, skillId: null, absorbed: 0, element: 'FIRE' }))));
    expect(many.floaters).toHaveLength(4);
  });
  it('one banner: an Ultimate before a phase before a reaction', () => {
    const reaction: BattleEvent = { type: 'reaction', target: foe, reaction: 'reaction_shock' };
    expect(stepFx(battle, ev(reaction)).banner?.kind).toBe('reaction');
    expect(stepFx(battle, ev(reaction, { type: 'phase', target: foe, phase: 1 })).banner?.kind).toBe('phase');
    expect(stepFx(battle, ev(reaction, { type: 'use', actor: 'a', skillId: 'skill_ult_nh', ultimate: true })).banner?.kind).toBe('ultimate');
    expect(stepFx(null, []).banner).toBeNull();
  });
  it('a golden group counts down the rounds it has left', () => {
    expect(escapeIn({ ...battle, round: 1 }, 3)).toBe(3);
    expect(escapeIn({ ...battle, round: 3 }, 3)).toBe(1);
    expect(escapeIn(battle, null)).toBeNull();
  });
});

describe('tips and the softer loss (decision 039 §5–6)', () => {
  it('a tip is read once; an unknown one is refused', () => {
    const w = ok(seeTip(adventureWorld(), { tipId: 'tip_forest_edge' }, ctxAt(T0)));
    expect(adventureOf(w).tipsSeen).toEqual(['tip_forest_edge']);
    expect(err(seeTip(w, { tipId: 'tip_forest_edge' }, ctxAt(T0)))).toBe('ALREADY_OPENED');
    expect(err(seeTip(w, { tipId: 'tip_nope' }, ctxAt(T0)))).toBe('INVALID_REQUEST');
  });
  it('a lost trip exhausts for one hour', () => {
    expect(AB.run.exhaustHours).toBe(1);
  });
});

describe('the Umbraflux Rift (decision 039 §3)', () => {
  const opened = (level = 30) => {
    const w = strong(adventureWorld(), level);
    const a = adventureOf(w);
    return withAdventure(w, { ...a, cleared: { zone_forest: 1, zone_mountain: 1, zone_ruins: 1 } });
  };
  it('opens after the Ruins boss', () => {
    expect(err(startRift(strong(adventureWorld()), { keys, roster }, ctxAt(T0)))).toBe('ZONE_NOT_CLEARED');
    const run = adventureOf(ok(startRift(opened(), { keys, roster }, ctxAt(T0)))).run!;
    expect(run.rift).toEqual({ floor: 0, ruleId: ruleOfDay(riftDay(T0)).id });
  });
  it('the rule changes with the day; floors grow stronger; Nightmares wait on their floors', () => {
    const rules = new Set(Array.from({ length: 30 }, (_, d) => ruleOfDay(d).id));
    expect(rules.size).toBeGreaterThan(3);
    expect(floorScale(11)).toBeCloseTo(1 + RIFT.perFloor * 10);
    expect(floorReward(10).coins).toBeGreaterThan(floorReward(1).coins);
    const rule = ruleOfDay(0);
    const f1 = riftEnemies(5, 1, rule);
    expect(f1).toHaveLength(RIFT.groupSize[0]);
    expect(riftEnemies(5, 1, rule)).toEqual(f1);
    const boss = riftEnemies(5, 10, rule)[0]!;
    expect(nightmareAt(10)?.enemy).toBe('enemy_old_treant');
    expect(boss.name).toBe(nightmareAt(10)!.nameVi);
    expect(boss.phases?.at(-1)?.hpBelow).toBe(0.3);
  });
  it('a floor won pays and records the best; leaving keeps it all and counts as a win', () => {
    let w = ok(startRift(opened(), { keys, roster }, ctxAt(T0)));
    const coins0 = w.wallet.coins;
    w = fight(ok(riftNext(w, ctxAt(T0))));
    const a = adventureOf(w);
    expect(a.run!.rift!.floor).toBe(1);
    expect(a.run!.phase).toBe('explore');
    expect(a.rift.best).toBe(1);
    expect(a.rift.dayBest).toBe(1);
    expect(w.wallet.coins).toBeGreaterThan(coins0);
    expect(a.fighters[keys[0]!]!.feats.rift).toBe(1);
    expect(err(engage(w, { ...tileCenter(F1, normal.x, normal.y), groupId: normal.id }, ctxAt(T0)))).toBe('WRONG_PHASE');
    const home = adventureOf(ok(returnToCamp(w, ctxAt(T0)))).run!;
    expect(home.result).toBe('win');
  });
  it('a lost floor ends the trip like a lost trip', () => {
    let w = ok(startRift(opened(1), { keys, roster }, ctxAt(T0)));
    const a0 = adventureOf(w);
    w = withAdventure(w, { ...a0, run: { ...a0.run!, rift: { ...a0.run!.rift!, floor: 29 } } });
    w = fight(ok(riftNext(w, ctxAt(T0))));
    expect(adventureOf(w).run!.result).toBe('lose');
  });
});

describe('the save (v4, adventure-big-update-1)', () => {
  it('a real slice migrates on: guardians whose portal is lit and bosses of cleared zones stay beaten; a trip gets no board', () => {
    const fixture = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'adventure-slice-v2-real.json'), 'utf8')) as { slice: Raw };
    const v3 = ADVENTURE_MIGRATIONS[2]!(fixture.slice);
    const v4 = adventureStateSchema.parse(ADVENTURE_MIGRATIONS[3]!(v3));
    expect(v4.version).toBe(4);
    const lit = (v3.activePortals ?? []) as string[];
    for (const mapId of lit) {
      const g = MAPS[mapId]?.groups.find((x) => x.kind !== 'normal');
      if (g) expect(v4.beaten).toContain(`${mapId}/${g.id}`);
    }
    for (const zoneId of Object.keys((v3.cleared ?? {}) as object)) expect(v4.beaten).toContain(`${ZONES[zoneId]!.maps[2]}/${MAPS[ZONES[zoneId]!.maps[2]!]!.groups.find((g) => g.kind === 'boss')!.id}`);
    expect(v4.fighters).toEqual(adventureStateSchema.shape.fighters.parse(v3.fighters));
  });
});

describe('the save (v3)', () => {
  it('a real v2 slice migrates: fighters keep everything and start their feats; tips and the Rift begin empty', () => {
    const fixture = JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', 'adventure-slice-v2-real.json'), 'utf8')) as { slice: Raw };
    const a = adventureStateSchema.parse(ADVENTURE_MIGRATIONS[3]!(ADVENTURE_MIGRATIONS[2]!(fixture.slice)));
    const key = Object.keys(fixture.slice.fighters as object)[0]!;
    const before = (fixture.slice.fighters as Record<string, Raw>)[key]!;
    expect(a.fighters[key]).toMatchObject({ level: before.level, sp: before.sp, feats: newFeats() });
    expect(a.tipsSeen).toEqual([]);
    expect(a.rift).toEqual({ best: 0, day: -1, dayBest: 0, nightmares: [] });
  });
  it('a v2 trip on its way plays on as a zone trip', () => {
    const w = start(strong(adventureWorld()));
    const a = adventureOf(w);
    const without = (o: object, ...keys: string[]): Raw => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));
    const v2 = { ...without(a, 'tipsSeen', 'rift'), version: 2, run: without(a.run!, 'rift'), fighters: Object.fromEntries(Object.entries(a.fighters).map(([k, f]) => [k, without(f, 'feats')])) };
    const v3 = adventureStateSchema.parse(ADVENTURE_MIGRATIONS[3]!(ADVENTURE_MIGRATIONS[2]!(v2)));
    expect(v3.run).toEqual(a.run);
    expect(v3.fighters).toEqual(a.fighters);
  });
});
