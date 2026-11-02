// Map Builder connections (decision 047, GĐ4): the exits between areas — a new exit, where it lands (a spawn of the area it leads to,
// picked or made where the admin clicks), the way back set up at both ends on purpose (never guessed), one-way ways, what may be
// removed (a published exit id stays: saves hold it), and the zones as they will be once the drafts are published (for the graph
// checks). Pure; the "Lối ra" dialog (mapExits.ts) only calls these.
import { DEFAULT_SPAWN, spawnIn } from '../../content/schemas/adventure/maps';
import type { AreaMap, Zone } from '../../src/areas/adventure/logic/config/content';
import { mapGraphProblems } from '../../src/areas/adventure/logic/mapGraph';
import { freeId, isPublished, thingIds, workingMaps, type BuilderData, type Exit, type Facing } from './mapModel';

export const EXIT_KIND_LABEL: Record<NonNullable<Exit['kind']>, string> = {
  gate: 'Cổng dịch chuyển',
  trail: 'Lối mòn',
  cave: 'Cửa hang',
  bridge: 'Cầu',
  stairs: 'Bậc thang',
  shore: 'Bờ nước',
  tunnel: 'Đường hầm',
};

export const LOCK_LABEL: Record<'none' | NonNullable<Exit['lock']>, string> = {
  none: 'Luôn mở (chỉ cần vùng đích đã mở)',
  guardian: 'Sau kẻ canh khu (hạ kẻ canh / trùm mới mở)',
  shortcut: 'Lối tắt (mở khi đi lối về từ phía bên kia)',
};

const stem = (mapId: string) => mapId.replace(/^map_/, '');

/** How the party faces arriving on a tile at the rim of an area: into the area; elsewhere down. */
export function facingInto(map: Pick<AreaMap, 'cols' | 'rows'>, x: number, y: number): Facing {
  if (x <= 1) return 'right';
  if (x >= map.cols - 2) return 'left';
  if (y <= 1) return 'down';
  if (y >= map.rows - 2) return 'up';
  return 'down';
}

/** The zones as they will be once the drafts are published: a new area joins its zone's main road or side areas. */
export function workingZones(data: BuilderData): Zone[] {
  return data.zones.map((z) => {
    const fresh = Object.entries(data.drafts).filter(([id, d]) => !isPublished(data, id) && d.map.zoneId === z.id && !data.meta[id]?.disabled);
    if (fresh.length === 0) return z;
    const main = fresh.filter(([, d]) => d.road === 'main').map(([id]) => id);
    const side = fresh.filter(([, d]) => d.road === 'branch').map(([id]) => id);
    return { ...z, maps: [...z.maps, ...main], ...(side.length || z.branches ? { branches: [...(z.branches ?? []), ...side] } : {}) };
  });
}

/** The areas as a publish would send them: switched-off drafts out, inactive exits out. */
export function liveMaps(data: BuilderData, maps = workingMaps(data)): AreaMap[] {
  return maps
    .filter((m) => !data.meta[m.id]?.disabled)
    .map((m) => {
      const notes = data.meta[m.id]?.exits;
      return notes && m.exits.some((e) => notes[e.id]?.inactive) ? { ...m, exits: m.exits.filter((e) => !notes[e.id]?.inactive) } : m;
    });
}

/** The graph problems (decision 043 + one-way ways) of the builder's world, by the area they concern. */
export function graphProblems(data: BuilderData, maps = workingMaps(data)): (mapId: string) => string[] {
  const all = mapGraphProblems(liveMaps(data, maps), workingZones(data));
  return (mapId) => all.filter((p) => new RegExp(`\\b${mapId}\\b`).test(p));
}

/** Lands `exit` on a spawn of `dest`: its tile and facing come from the spawn (the default spawn faces down). */
export function landOn(exit: Exit, dest: AreaMap, spawnId: string) {
  const sp = spawnIn(dest, spawnId);
  if (!sp) return;
  exit.arrive = spawnId;
  exit.arriveX = sp.x;
  exit.arriveY = sp.y;
  exit.facing = sp.facing ?? 'down';
}

/**
 * The spawn of `dest` on a clicked tile: the one standing there, or a new `spawn_from_<from>` facing into the area. Returns its id
 * (`dest` gains the new spawn).
 */
export function spawnAt(dest: AreaMap, from: Pick<AreaMap, 'id' | 'nameVi'>, x: number, y: number): string {
  if (dest.spawn.x === x && dest.spawn.y === y) return DEFAULT_SPAWN;
  const here = dest.spawns?.find((s) => s.x === x && s.y === y);
  if (here) return here.id;
  const id = freeId('spawn', `from_${stem(from.id)}`, new Set([DEFAULT_SPAWN, ...(dest.spawns ?? []).map((s) => s.id)]));
  dest.spawns = [...(dest.spawns ?? []), { id, nameVi: `Từ ${from.nameVi}`, x, y, facing: facingInto(dest, x, y) }];
  return id;
}

/**
 * A new exit of `from` at a tile, leading to `to` and landing on its default spawn until the admin picks the arrival. Its id
 * `exit_<from>_to_<to>` is free across the whole game (`taken`).
 */
export function newExit(from: AreaMap, to: AreaMap, at: { x: number; y: number }, taken: ReadonlySet<string>): Exit {
  const exit: Exit = { id: freeId('exit', `${stem(from.id)}_to_${stem(to.id)}`, taken), x: at.x, y: at.y, w: 1, h: 2, to: to.id, arriveX: 0, arriveY: 0, kind: 'trail' };
  landOn(exit, to, DEFAULT_SPAWN);
  from.exits.push(exit);
  return exit;
}

/** The exits of `dest` that lead back to `from`. */
export const waysBack = (dest: AreaMap, from: AreaMap): Exit[] => dest.exits.filter((e) => e.to === from.id);

/** Why an exit cannot go (or null, and it is gone): a published exit id stays for good (saves remember opened shortcuts). */
export function removeExit(data: BuilderData, map: AreaMap, exitId: string): string | null {
  const published = data.published.find((m) => m.id === map.id)?.exits.some((e) => e.id === exitId);
  if (published) return 'Lối ra đã publish không xoá được (save giữ id). Có thể dời, đổi đích, khoá hoặc đổi điểm tới.';
  map.exits = map.exits.filter((e) => e.id !== exitId);
  return null;
}

/** Ids taken by every thing of every area the builder knows (exit ids are unique across the game). */
export const takenIds = (data: BuilderData, extra: readonly AreaMap[] = []): Set<string> => thingIds([...workingMaps(data), ...extra]);
