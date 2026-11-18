// Admin "Dữ liệu chiến đấu" (tools/admin/combatDbModel.ts): the database lists every combat entity and skill of the game exactly once,
// its numbers are the runtime's own (fighterStats, withClass), Unique / Common skills follow the game's identity rules, pictures never
// borrow another entity's art, and the filters / sorts combine as the page promises.
import { describe, expect, it } from 'vitest';
import manifest from '../../public/assets/manifest/assets.json';
import { ADVENTURE_CONTENT, AB, ENEMY_LIST, SKILL_LIST, TREES, identityOf } from '../../src/areas/adventure/logic/config/content';
import { fighterStats, newFighter } from '../../src/areas/adventure/logic/fighters';
import { withClass } from '../../src/areas/adventure/logic/foes';
import { enemyInits } from '../../src/areas/adventure/logic/encounter';
import { FARM_CONTENT } from '../../src/areas/farm/logic/config/content';
import { FISH_LIST } from '../../src/areas/aquarium/logic/config/content';
import {
  artLookup,
  buildCombatDb,
  emptyEntityQuery,
  emptySkillQuery,
  queryEntities,
  querySkills,
  summarize,
  type Entity,
  type ManifestRow,
} from '../../tools/admin/combatDbModel';

const ROWS: ManifestRow[] = Object.values(manifest)
  .filter(Array.isArray)
  .flat()
  .map((r: { id: string; status?: string; asset?: string }) => ({ id: r.id, status: r.status, url: r.asset ? `/assets/${r.asset}` : null }));
const db = buildCombatDb(ROWS);
const file = ADVENTURE_CONTENT.lineages;

describe('Combat Database: every entity and skill, once', () => {
  it('lists every combat animal of lineages.json and every enemy of enemies.json', () => {
    expect(db.animals.map((a) => a.id).sort()).toEqual([...Object.keys(file.species), ...Object.keys(file.fish)].sort());
    expect(db.monsters.map((m) => m.id)).toEqual(ENEMY_LIST.map((e) => e.id));
    expect(db.skills.map((s) => s.id)).toEqual(SKILL_LIST.map((s) => s.id));
    expect(new Set(db.animals.map((a) => a.id)).size).toBe(db.animals.length);
  });

  it('names and pictures come from the Farm / Aquarium rows and the enemy rows', () => {
    for (const a of db.animals) {
      const row = a.source === 'farm' ? FARM_CONTENT.species.species.find((s) => s.id === a.id)! : FISH_LIST.find((f) => f.id === a.id)!;
      expect(a.name).toBe(row.nameVi);
      expect(a.art.id).toBe('artId' in row ? row.artId : row.art);
      expect(a.rarity).toBe(row.rarity);
    }
    for (const m of db.monsters) {
      const e = ENEMY_LIST.find((x) => x.id === m.id)!;
      expect([m.name, m.art.id, m.element, m.stats]).toEqual([e.nameVi, e.art, e.element, e.stats]);
    }
  });

  it('summary counts the real tables', () => {
    const s = summarize(db);
    expect(s.animals).toBe(Object.keys(file.species).length + Object.keys(file.fish).length);
    expect(s.monsters).toBe(ENEMY_LIST.length);
    expect(s.skills).toBe(SKILL_LIST.length);
    expect(s.classes).toBe(ADVENTURE_CONTENT.classes.classes.length);
    expect(s.elements).toBe(ADVENTURE_CONTENT.elements.elements.length);
    expect(Object.values(s.skillsByType).reduce((n, x) => n + x, 0)).toBe(SKILL_LIST.length);
    expect(s.incomplete).toBe([...db.animals, ...db.monsters].filter((e) => e.status !== 'complete').length);
  });
});

describe('Combat Database: numbers are the runtime\'s', () => {
  it('an animal\'s stats are a level-1 fighter\'s stats in the game (no gear, no Bond)', () => {
    for (const a of db.animals) {
      const kind = a.source === 'farm' ? 'pig' : 'fish';
      const identity = identityOf({ kind, speciesId: a.id, family: 'FARM' } as Parameters<typeof identityOf>[0])!;
      expect(a.stats).toEqual(fighterStats(newFighter(0), { rarity: a.rarity as never, hearts: 0 }, identity));
    }
  });

  it('a monster\'s battle stats per group class / corruption are withClass on its enemy row', () => {
    for (const m of db.monsters) {
      for (const s of m.scaled) {
        const [init] = withClass(enemyInits([m.id]), { kind: s.kind, corruption: s.corruption });
        expect(s.stats).toEqual(init!.stats);
      }
      expect(m.scaled.reduce((n, s) => n + s.count, 0)).toBe(m.appearances.length);
    }
  });
});

describe('Combat Database: Unique / Common skills', () => {
  it('animals: the four Unique slots and Ultimate follow identityOf; Common = the default class tree', () => {
    for (const a of db.animals) {
      const kind = a.source === 'farm' ? 'pig' : 'fish';
      const identity = identityOf({ kind, speciesId: a.id, family: 'FARM' } as Parameters<typeof identityOf>[0])!;
      const own = a.source === 'farm' ? file.species[a.id]! : file.fish[a.id]!;
      expect(a.unique.map((u) => u.skillId)).toEqual(identity.unique);
      expect(a.unique.map((u) => u.role)).toEqual(identity.unique.map((_, i) => (own.unique?.[i] ? 'own' : 'line')));
      expect(a.unique.map((u) => u.unlockLevel)).toEqual(AB.levels.uniqueUnlockLevels);
      expect(a.ultimate).toMatchObject({ skillId: identity.ultimate, role: own.ultimate ? 'ultimate-own' : 'ultimate-line' });
      expect(a.common.map((u) => u.skillId)).toEqual(TREES[identity.classId].map((n) => n.skill));
      expect(a.common.every((u) => u.role === 'class')).toBe(true);
    }
  });

  it('monsters: own vs shared by how many enemies list the skill; phase and corruption skills apart', () => {
    const lists = ENEMY_LIST.map((e) => new Set([...e.skills, ...e.phases.flatMap((p) => p.addSkills)]));
    for (const m of db.monsters) {
      const e = ENEMY_LIST.find((x) => x.id === m.id)!;
      for (const u of m.skills.filter((x) => x.role === 'enemy-own' || x.role === 'enemy-shared')) {
        const n = lists.filter((l) => l.has(u.skillId)).length;
        expect(u.role).toBe(n > 1 ? 'enemy-shared' : 'enemy-own');
      }
      expect(m.skills.filter((u) => u.role === 'phase').map((u) => u.skillId)).toEqual(e.phases.flatMap((p) => p.addSkills));
      for (const u of m.skills.filter((x) => x.role === 'corruption')) expect(AB.foes.corruption.some((l) => l.skill === u.skillId)).toBe(true);
    }
  });

  it('every skill knows who uses it; unused skills are the ones nothing references', () => {
    const referenced = new Set<string>();
    for (const a of db.animals) for (const u of a.skills) referenced.add(u.skillId);
    for (const e of ENEMY_LIST) [...e.skills, ...e.phases.flatMap((p) => p.addSkills)].forEach((s) => referenced.add(s));
    for (const l of AB.foes.corruption) if (l.skill) referenced.add(l.skill);
    expect(db.unusedSkills.sort()).toEqual(SKILL_LIST.map((s) => s.id).filter((id) => !referenced.has(id)).sort());
    for (const a of db.animals) for (const u of a.skills) expect(db.skills.find((s) => s.id === u.skillId)!.users.some((x) => x.id === a.id)).toBe(true);
    for (const s of db.skills) if (s.sharing === 'own') expect(new Set(s.users.map((u) => u.id)).size).toBe(1);
  });
});

describe('Combat Database: pictures', () => {
  it('a missing or empty row is Missing Asset, a placeholder row says so; never another id\'s picture', () => {
    const look = artLookup([
      { id: 'pig_a', status: 'production', url: '/assets/a.png' },
      { id: 'pig_b', status: 'placeholder', url: '/assets/b.png' },
      { id: 'pig_c', status: 'production', url: null },
    ]);
    expect(look('pig_a')).toEqual({ id: 'pig_a', url: '/assets/a.png', state: 'production' });
    expect(look('pig_b').state).toBe('placeholder');
    expect(look('pig_c')).toEqual({ id: 'pig_c', url: null, state: 'missing' });
    expect(look('pig_x')).toEqual({ id: 'pig_x', url: null, state: 'missing' });
  });

  it('an entity without its picture is a placeholder entity, and its art id is its own', () => {
    const noKnight = buildCombatDb(ROWS.filter((r) => r.id !== 'pig_knight'));
    const knight = noKnight.animals.find((a) => a.id === 'PIG_KNIGHT')!;
    expect(knight.art).toEqual({ id: 'pig_knight', url: null, state: 'missing' });
    expect(knight.status).toBe('placeholder');
    expect(knight.checks.find((c) => c.key === 'art')!.ok).toBe(false);
  });
});

describe('Combat Database: filters and sorts', () => {
  const q = (o: Partial<ReturnType<typeof emptyEntityQuery>>) => ({ ...emptyEntityQuery(), ...o });

  it('no filter shows everything; search matches name or id without case', () => {
    expect(queryEntities(db.animals, q({})).length).toBe(db.animals.length);
    expect(queryEntities(db.animals, q({ q: 'pig_knight' })).map((a) => a.id)).toEqual(['PIG_KNIGHT']);
    const byName = queryEntities(db.monsters, q({ q: 'SÓI' }));
    expect(byName.length).toBeGreaterThan(0);
    expect(byName.every((m) => m.name.toLowerCase().includes('sói'))).toBe(true);
  });

  it('filters combine (AND): class × element × status × skill', () => {
    const f = q({ classId: 'striker', element: 'METAL' });
    const shown = queryEntities(db.animals, f);
    expect(shown.length).toBeGreaterThan(0);
    expect(shown).toEqual(db.animals.filter((a) => a.classId === 'striker' && (a.element === 'METAL' || a.element2 === 'METAL')).sort((x, y) => x.name.localeCompare(y.name, 'vi') || x.id.localeCompare(y.id)));
    const skill = shown[0]!.unique[0]!.skillId;
    const narrower = queryEntities(db.animals, { ...f, skill, status: shown[0]!.status });
    expect(narrower.every((a) => a.skills.some((u) => u.skillId === skill) && a.status === shown[0]!.status)).toBe(true);
    expect(narrower.length).toBeLessThanOrEqual(shown.length);
    expect(queryEntities(db.animals, q({ classId: 'striker', element: 'NOPE' }))).toEqual([]);
  });

  it('monster type, zone and tag filters', () => {
    const bosses = queryEntities(db.monsters, q({ type: 'boss' }));
    expect(bosses.length).toBeGreaterThan(0);
    expect(bosses.every((m) => m.types.includes('boss') && m.boss)).toBe(true);
    // A non-boss in a boss group's pool is an escort, never a "boss".
    for (const m of db.monsters) if (!m.boss) expect(m.types).not.toContain('boss');
    for (const m of db.monsters) if (m.types.includes('escort')) expect(m.appearances.some((a) => a.kind === 'boss')).toBe(true);
    const zone = db.monsters.find((m) => m.appearances.length)!.appearances[0]!.zoneId;
    const inZone = queryEntities(db.monsters, q({ zone, type: 'normal' }));
    expect(inZone.every((m) => m.appearances.some((a) => a.zoneId === zone) && m.types.includes('normal'))).toBe(true);
    expect(queryEntities(db.monsters, q({ tag: 'umbraflux' })).every((m) => m.tags.includes('umbraflux'))).toBe(true);
  });

  it('sorts by a stat both ways, ties by name', () => {
    const up = queryEntities<Entity>(db.monsters, q({ sort: 'hp' }));
    for (let i = 1; i < up.length; i += 1) expect(up[i]!.stats.hp).toBeGreaterThanOrEqual(up[i - 1]!.stats.hp);
    const down = queryEntities<Entity>(db.animals, q({ sort: 'atk', desc: true }));
    for (let i = 1; i < down.length; i += 1) expect(down[i]!.stats.atk).toBeLessThanOrEqual(down[i - 1]!.stats.atk);
    const names = queryEntities(db.animals, q({ sort: 'name' })).map((a) => a.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'vi')));
  });

  it('skills: type × element × sharing × animation filters, sort by power', () => {
    const s = (o: Partial<ReturnType<typeof emptySkillQuery>>) => querySkills(db.skills, { ...emptySkillQuery(), ...o });
    expect(s({}).length).toBe(SKILL_LIST.length);
    const fire = s({ type: 'unique', element: 'FIRE' });
    expect(fire.length).toBeGreaterThan(0);
    expect(fire.every((x) => x.row.type === 'unique' && x.row.element === 'FIRE')).toBe(true);
    expect(s({ sharing: 'unused' }).map((x) => x.id).sort()).toEqual([...db.unusedSkills].sort());
    expect(s({ fx: 'no' }).every((x) => !x.fx.has)).toBe(true);
    expect(s({ icon: 'no' }).every((x) => x.icon.state === 'missing')).toBe(true);
    const power = s({ sort: 'power', desc: true });
    for (let i = 1; i < power.length; i += 1) expect(power[i]!.row.power * power[i]!.row.hits).toBeLessThanOrEqual(power[i - 1]!.row.power * power[i - 1]!.row.hits);
  });
});
