// The Map Editor's checks (decision 047): the game's map checks as data — code, object, tile — and the editor's list built on them:
// plain Vietnamese with display names (never ids), the level the publish gives them, the tile from the check itself.
import { describe, expect, it } from 'vitest';
import { MAP_LIST, type AreaMap } from '../../src/areas/adventure/logic/config/content';
import { mapIssues, mapProblems } from '../../src/areas/adventure/logic/maps';
import { editorIssues, objectName, problemLines } from '../../tools/admin/mapIssues';

const base = (): AreaMap => structuredClone(MAP_LIST.find((m) => m.chests.length > 0 && m.exits.length > 0)!);
const ids = (m: AreaMap) => [m.id, ...m.chests.map((c) => c.id), ...m.exits.map((e) => e.id), ...m.groups.map((g) => g.id), ...m.springs.map((s) => s.id)];
const editor = (m: AreaMap) => editorIssues({ map: m, maps: MAP_LIST.map((x) => (x.id === m.id ? m : x)), graph: [], published: MAP_LIST.find((x) => x.id === m.id)!, publishedIds: new Set(MAP_LIST.map((x) => x.id)) });

/** A chest of `m` moved onto its first wall tile inside the rim. */
function chestOnWall(m: AreaMap) {
  const chest = m.chests[0]!;
  for (let y = 1; y < m.rows - 1; y += 1)
    for (let x = 1; x < m.cols - 1; x += 1)
      if (m.terrain[y]![x] === '#') {
        chest.x = x;
        chest.y = y;
        return { chest, x, y };
      }
  throw new Error('no wall');
}

describe('map checks as data', () => {
  it('keeps the English lines the game and scripts read', () => {
    for (const m of MAP_LIST) expect(mapIssues(m).map((i) => `${m.id}: ${i.text}`)).toEqual(mapProblems(m));
  });

  it('names the object and the exact tile', () => {
    const m = base();
    const { chest, x, y } = chestOnWall(m);
    const wall = mapIssues(m).find((i) => i.code === 'onWall');
    expect(wall).toMatchObject({ subject: { kind: 'chest', id: chest.id }, x, y });
    expect(mapProblems(m)).toContain(`${m.id}: ${chest.id} stands on a wall or water at ${x},${y}`);
  });

  it('a blocked spawn is on the spawn tile', () => {
    const m = base();
    m.terrain = m.terrain.map((row, y) => (y === m.spawn.y ? `${row.slice(0, m.spawn.x)}#${row.slice(m.spawn.x + 1)}` : row));
    expect(mapIssues(m).find((i) => i.code === 'spawnBlocked')).toMatchObject({ x: m.spawn.x, y: m.spawn.y });
  });
});

describe('editor checks', () => {
  it('a fine area has no errors', () => {
    for (const m of MAP_LIST) expect(editor(structuredClone(m)).filter((i) => i.level === 'error')).toEqual([]);
  });

  it('says it in Vietnamese with the display name, the tile and the object to select', () => {
    const m = base();
    const { chest, x, y } = chestOnWall(m);
    const issue = editor(m).find((i) => i.level === 'error' && i.x === x && i.y === y)!;
    expect(issue.ref).toEqual({ kind: 'chests', id: chest.id });
    expect(issue.name).toBe(objectName(m, { kind: 'chests', id: chest.id }));
    expect(issue.message).toContain('đang nằm trên địa hình không thể đặt vật');
    expect(issue.message.toLowerCase()).toContain('vách');
    for (const id of ids(m)) expect(issue.message).not.toContain(id);
  });

  it('no id and no English in any message', () => {
    const m = base();
    chestOnWall(m);
    m.spawn = { ...m.exits[0]! };
    m.exits[0]!.to = 'map_nowhere';
    const all = editor(m);
    expect(all.length).toBeGreaterThan(2);
    for (const i of all) {
      for (const id of [...ids(m), 'map_nowhere']) expect(`${i.name} ${i.message}`).not.toContain(id);
      expect(i.message).not.toMatch(/\b(stands|cannot|blocked|exit|spawn|cover)\b/);
    }
    const exit = all.find((i) => i.ref?.kind === 'exits' && i.message.includes('chưa được liên kết'))!;
    expect(exit).toMatchObject({ level: 'error', x: m.exits[0]!.x, y: m.exits[0]!.y });
  });

  it('errors come first, then warnings, then hints', () => {
    const m = base();
    chestOnWall(m);
    m.springs = [];
    const order = editor(m).map((i) => i.level);
    expect(order).toEqual([...order].sort((a, b) => ['error', 'warn', 'info'].indexOf(a) - ['error', 'warn', 'info'].indexOf(b)));
    expect(order).toContain('info');
  });

  it('gives the publish dialog Vietnamese lines', () => {
    const m = base();
    chestOnWall(m);
    const lines = problemLines(m, MAP_LIST);
    expect(lines[0]).toMatch(new RegExp(`^${m.nameVi}: `));
    expect(lines.join('\n')).not.toContain(m.chests[0]!.id);
  });
});
