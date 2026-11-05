// The Map Editor's checks in the admin's words (decision 047): every problem of an area as the game finds it (`mapIssues`, the
// arrivals against their spawns, the map graph) plus what a publish would refuse or warn about, each with its level, the display
// name of the object it concerns (never its id), plain Vietnamese and the tile it stands on — the tile always comes from the check
// itself or from the object's own row, never guessed. Levels follow the publish: "error" keeps it off, "warn" passes (the publish
// fixes it or only notes it), "info" are hints for a better area. Pure.
import { CHEST_TYPES, DEFAULT_SPAWN, arrivalProblems, spawnIn } from '../../content/schemas/adventure/maps';
import { DECOR, ELEMENT_NAMES, ENEMIES, EVENTS, PROPS, type AreaMap } from '../../src/areas/adventure/logic/config/content';
import { mapIssues, type IssueSubject, type MapIssue } from '../../src/areas/adventure/logic/maps';
import { GROUND } from './mapGround';
import type { ObjRef } from './mapEditModel';
import { graphText } from './mapNetwork';

export type IssueLevel = 'error' | 'warn' | 'info';

export interface EditorIssue {
  /** Stable while the problem stays (markers and the list keep their pick across redraws). */
  key: string;
  level: IssueLevel;
  /** The object it is about, by display name ('' = the area itself). */
  name: string;
  message: string;
  /** The tile it concerns, from the check or the object's row; absent = the area as a whole. */
  x?: number;
  y?: number;
  /** The object to select on "Đi tới", when it is on this area. */
  ref?: ObjRef;
}

export const LEVEL_LABEL: Record<IssueLevel, string> = { error: 'Lỗi nghiêm trọng', warn: 'Cảnh báo', info: 'Thông tin' };

const CHEST_LABEL: Record<(typeof CHEST_TYPES)[number], string> = { wood: 'Rương gỗ', silver: 'Rương bạc', gold: 'Rương vàng', hidden: 'Rương ẩn' };
const GROUP_LABEL: Record<string, string> = { normal: 'Nhóm quái', elite: 'Kẻ canh khu', mutant: 'Quái đột biến', subboss: 'Trùm phụ', boss: 'Trùm', special: 'Nhóm đặc biệt' };
const COVER_LABEL: Record<string, string> = { canopy: 'tán cây', rock: 'mái đá', roof: 'mái sập' };
const GROUND_NAME = Object.fromEntries(GROUND) as Record<string, string>;
const elementName = (el: string) => (ELEMENT_NAMES as Record<string, { nameVi?: string } | undefined>)[el]?.nameVi ?? el;

/** Which side of the area a tile is on, as a compass word ('' = inside). */
function sideOf(map: Pick<AreaMap, 'cols' | 'rows'>, x: number, y: number, w = 1, h = 1): string {
  if (x + w - 1 >= map.cols - 2) return 'Đông';
  if (x <= 1) return 'Tây';
  if (y <= 1) return 'Bắc';
  if (y + h - 1 >= map.rows - 2) return 'Nam';
  return '';
}

/** "#2" when an area has more than one of a kind, so two chests read apart. */
const nth = (list: readonly { id: string }[], id: string) => (list.length > 1 ? ` #${list.findIndex((r) => r.id === id) + 1}` : '');

/** The object of a check as an editor reference (null = not on this area). */
export function refOf(map: AreaMap, s: IssueSubject): ObjRef | null {
  const lists: Partial<Record<IssueSubject['kind'], ObjRef['kind']>> = { chest: 'chests', node: 'nodes', gate: 'gates', puzzle: 'puzzles', spring: 'springs', npc: 'npcs', lore: 'lore', exit: 'exits', group: 'groups', spawnPoint: 'spawns', cover: 'covers', decor: 'scenery' };
  if (s.kind === 'spawn') return { kind: 'spawn', id: DEFAULT_SPAWN };
  if (s.kind === 'portal') return { kind: 'portal', id: map.id };
  if (s.kind === 'shrine') return map.shrine ? { kind: 'shrine', id: map.shrine.id } : null;
  if (s.kind === 'prop') {
    const [prop, at] = s.id.split('@');
    const [x, y] = (at ?? '').split(',').map(Number);
    const i = map.props.findIndex((p) => p.prop === prop && p.x === x && p.y === y);
    return i >= 0 ? { kind: 'props', id: String(i) } : null;
  }
  const kind = lists[s.kind];
  if (!kind) return null;
  const rows = kind === 'scenery' ? map.scenery ?? [] : ((map as unknown as Record<string, { id: string }[] | undefined>)[kind] ?? []);
  return rows.some((r) => r.id === s.id) ? { kind, id: s.id } : null;
}

/** The display name of an object of an area: its own name when it has one, else what it is (with its side, element, look…). */
export function objectName(map: AreaMap, ref: ObjRef, mapName: (id: string) => string = (id) => id): string {
  switch (ref.kind) {
    case 'spawn':
      return 'Điểm xuất hiện mặc định';
    case 'portal':
      return 'Cổng dịch chuyển';
    case 'shrine':
      return map.shrine ? `Đền Guardian hệ ${elementName(map.shrine.element)}` : 'Đền Guardian';
    case 'props': {
      const p = map.props[Number(ref.id)];
      return p ? (PROPS[p.prop]?.nameVi ?? 'Vật trang trí') : 'Vật trang trí';
    }
    case 'scenery': {
      const d = map.scenery?.find((x) => x.id === ref.id);
      return (d && DECOR[d.asset]?.nameVi) || 'Asset trang trí';
    }
    case 'exits': {
      const e = map.exits.find((x) => x.id === ref.id);
      if (!e) return 'Lối ra';
      const side = sideOf(map, e.x, e.y, e.w, e.h);
      return `${e.kind === 'gate' ? 'Cổng' : 'Lối ra'}${side ? ` phía ${side}` : ''} (tới ${mapName(e.to)})`;
    }
    case 'chests': {
      const c = map.chests.find((x) => x.id === ref.id);
      return `${CHEST_LABEL[c?.type ?? 'wood']}${nth(map.chests, ref.id)}`;
    }
    case 'nodes': {
      const n = map.nodes.find((x) => x.id === ref.id);
      return `${n?.kind === 'ore' ? 'Mỏ quặng' : 'Bụi thảo dược'}${nth(map.nodes, ref.id)}`;
    }
    case 'gates': {
      const g = map.gates.find((x) => x.id === ref.id);
      if (!g) return 'Cổng nguyên tố';
      return `${g.look === 'crack' ? 'Tường giả' : 'Cổng nguyên tố'} hệ ${elementName(g.element)}`;
    }
    case 'puzzles': {
      const p = map.puzzles.find((x) => x.id === ref.id);
      return `Câu đố hệ ${p ? elementName(p.element) : '?'}${nth(map.puzzles, ref.id)}`;
    }
    case 'springs':
      return `Suối hồi${nth(map.springs, ref.id)}`;
    case 'npcs': {
      const n = map.npcs.find((x) => x.id === ref.id);
      const ev = n ? EVENTS[n.event]?.nameVi : undefined;
      return ev ? `Người lữ hành “${ev}”` : 'Người lữ hành';
    }
    case 'lore': {
      const l = map.lore.find((x) => x.id === ref.id);
      const words = (l?.textVi ?? '').split(/\s+/).filter(Boolean);
      return words.length ? `Bia lore “${words.slice(0, 5).join(' ')}${words.length > 5 ? '…' : ''}”` : 'Bia lore';
    }
    case 'groups': {
      const g = map.groups.find((x) => x.id === ref.id);
      if (!g) return 'Nhóm quái';
      const first = g.pool[0]?.enemies[0];
      const foe = first ? ENEMIES[first]?.nameVi : undefined;
      return `${GROUP_LABEL[g.kind] ?? 'Nhóm quái'}${foe ? ` ${foe}` : ''}`;
    }
    case 'spawns': {
      const s = map.spawns?.find((x) => x.id === ref.id);
      return s ? `Điểm tới “${s.nameVi}”` : 'Điểm tới';
    }
    case 'covers': {
      const c = map.covers.find((x) => x.id === ref.id);
      return `Lối ẩn (${COVER_LABEL[c?.look ?? 'canopy'] ?? 'lớp che'})`;
    }
  }
}

/** The ground under a tile in words ("Nước", "Vách / tường"…). */
const groundAt = (map: AreaMap, x?: number, y?: number) => (x === undefined || y === undefined ? '' : GROUND_NAME[map.terrain[y]?.[x] ?? ''] ?? '');

/** One problem of `mapIssues` in plain Vietnamese. */
function issueMessage(map: AreaMap, i: MapIssue, name: string, other: string): string {
  switch (i.code) {
    case 'outside':
      return `${name} nằm sát / ngoài mép map — vật phải cách mép ít nhất 1 ô.`;
    case 'onWall':
      return `${name} đang nằm trên địa hình không thể đặt vật (${groundAt(map, i.x, i.y).toLowerCase() || 'vách đá hoặc mặt nước'}).`;
    case 'overlap':
      return `${name} chồng lên ${other} — mỗi ô chỉ có một vật.`;
    case 'unknownProp':
      return `${name}: loại vật này không còn trong thư viện.`;
    case 'unknownDecor':
      return 'Asset trang trí này không còn trong thư viện asset.';
    case 'decorFoot':
      return `Chân của một asset trang trí đè lên ${name} — dời asset hoặc thu nhỏ ô chặn của nó.`;
    case 'exitBlocked':
      return `${name} nằm trên ô không đi được — người chơi không bước vào được.`;
    case 'spawnBlocked':
      return 'Điểm xuất hiện của người chơi đang nằm trong vùng chặn di chuyển.';
    case 'unreachable':
      return `${name} không đi tới được (bị chặn kín, kể cả khi mở hết cổng nguyên tố).`;
    case 'groupStuck':
      return `${name} đứng ở chỗ không ai đi tới được.`;
    case 'notBehindGuardian':
      return other ? `${name} khoá sau kẻ canh khu nhưng lại gần lối vào hơn ${other}.` : `${name} khoá sau kẻ canh khu nhưng map không có kẻ canh khu nào.`;
    case 'behindGate':
      return `${name} bị chắn sau cổng nguyên tố — đường chính không được cần mở cổng nguyên tố.`;
    case 'coverOutside':
      return `${name} vượt ra ngoài map.`;
    case 'coverEmpty':
      return `${name} không che ô nào người chơi đi tới được.`;
    case 'coverHides':
      return `${name} đang che ${other} — lớp che không được che điểm xuất hiện, cổng dịch chuyển, lối ra hay kẻ canh khu.`;
    case 'spawnPointStuck':
      return `${name} nằm ở chỗ không đi được.`;
    case 'spawnPointOnGroup':
      return `${name} trùng ô với ${other}.`;
    case 'arrivalBlocked':
      return `Lối đến từ ${other} đáp xuống ô bị chặn.`;
    case 'arrivalOnGroup':
      return `Lối đến từ ${other} đáp đúng ô của một nhóm quái.`;
  }
}

/** A row's tile (top-left) on this area. */
function tileOfRef(map: AreaMap, ref: ObjRef | null): { x: number; y: number } | undefined {
  if (!ref) return undefined;
  if (ref.kind === 'spawn') return map.spawn;
  if (ref.kind === 'portal') return map.portal;
  if (ref.kind === 'shrine') return map.shrine;
  if (ref.kind === 'props') return map.props[Number(ref.id)];
  if (ref.kind === 'scenery') {
    const d = map.scenery?.find((x) => x.id === ref.id);
    return d && { x: Math.floor(d.x), y: Math.floor(d.y) };
  }
  return ((map as unknown as Record<string, { id: string; x: number; y: number }[] | undefined>)[ref.kind] ?? []).find((r) => r.id === ref.id);
}

export interface IssueInput {
  map: AreaMap;
  /** Every area as the builder knows it (this one included, as edited). */
  maps: readonly AreaMap[];
  /** The graph problems that name this area (English, `mapGraphProblems`). */
  graph: readonly string[];
  /** The area as published (null = never): a size change only warns. */
  published: AreaMap | null;
  /** Ids of the areas that are published (an exit to a draft must be published with it). */
  publishedIds: ReadonlySet<string>;
}

/** Every problem of the area being edited, errors first. */
export function editorIssues({ map, maps, graph, published, publishedIds }: IssueInput): EditorIssue[] {
  const out: EditorIssue[] = [];
  const byId = new Map(maps.map((m) => [m.id, m]));
  const mapName = (id: string) => (id === map.id ? map.nameVi : byId.get(id)?.nameVi ?? 'map không tồn tại');
  const nameOf = (ref: ObjRef | null, fallback = '') => (ref ? objectName(map, ref, mapName) : fallback);
  const add = (level: IssueLevel, key: string, name: string, message: string, at?: { x: number; y: number }, ref?: ObjRef | null) =>
    out.push({ key, level, name, message, ...(at ? { x: at.x, y: at.y } : {}), ...(ref ? { ref } : {}) });

  // The game's own checks: all of them keep a publish off.
  for (const i of mapIssues(map, maps)) {
    const ref = i.code.startsWith('arrival') ? null : refOf(map, i.subject);
    const otherRef = i.other && i.other.kind !== 'map' ? refOf(map, i.other) : null;
    const other = i.other?.kind === 'map' ? mapName(i.other.id) : nameOf(otherRef);
    const name = i.code.startsWith('arrival') ? `Lối đến từ ${mapName(i.other?.id ?? '')}` : nameOf(ref, i.code === 'unknownDecor' ? 'Asset trang trí' : 'Vật trên map');
    const at = i.x !== undefined && i.y !== undefined ? { x: i.x, y: i.y } : tileOfRef(map, ref);
    add('error', `${i.code}:${i.subject.kind}:${i.subject.id}:${i.x ?? ''},${i.y ?? ''}`, name, issueMessage(map, i, name, other), at, ref);
  }

  // Exits: a destination that exists, is published (or goes out with this one); the arrivals into this area against their spawns.
  for (const e of map.exits) {
    const ref: ObjRef = { kind: 'exits', id: e.id };
    const name = nameOf(ref);
    if (!byId.has(e.to)) add('error', `exitTo:${e.id}`, name, `${name} chưa được liên kết đến bản đồ đích hợp lệ — mở “Lối ra” để chọn map đích.`, e, ref);
    else if (!publishedIds.has(e.to)) add('warn', `exitDraft:${e.id}`, name, `${name} dẫn tới “${mapName(e.to)}” chưa publish — phải publish cùng lúc.`, e, ref);
    const dest = byId.get(e.to);
    for (const p of dest ? arrivalProblems(e, dest) : []) {
      if (/which .* does not have/.test(p)) add('error', `arriveMissing:${e.id}`, name, `${name} đáp xuống một điểm tới không còn trong “${mapName(e.to)}” — chọn lại điểm tới.`, e, ref);
      else add('warn', `arriveMoved:${e.id}`, name, `${name}: điểm tới ở “${mapName(e.to)}” đã dời / đổi hướng — khi publish, lối ra sẽ tự đi theo.`, e, ref);
    }
  }
  for (const other of maps) {
    if (other.id === map.id) continue;
    for (const e of other.exits.filter((x) => x.to === map.id)) {
      for (const p of arrivalProblems(e, map)) {
        const sp = e.arrive ? spawnIn(map, e.arrive) : undefined;
        const spRef: ObjRef | null = !sp ? null : e.arrive === DEFAULT_SPAWN ? { kind: 'spawn', id: DEFAULT_SPAWN } : { kind: 'spawns', id: e.arrive! };
        const name = `Lối đến từ ${other.nameVi}`;
        if (/which .* does not have/.test(p)) add('error', `arriveIn:${e.id}`, name, `${name} đáp xuống một điểm tới đã bị xoá khỏi map này — chọn lại điểm tới ở map kia.`, { x: e.arriveX, y: e.arriveY });
        else add('warn', `arriveInMoved:${e.id}`, name, `${name} vẫn đáp ở ô cũ (${e.arriveX}, ${e.arriveY}) — khi publish sẽ tự theo điểm tới đã dời.`, sp ?? { x: e.arriveX, y: e.arriveY }, spRef);
      }
    }
  }

  // The map graph (world-wide; the lines naming this area).
  for (const p of graph) {
    const exitId = p.match(/\bexit_[a-z0-9_]+/)?.[0];
    const exit = exitId ? map.exits.find((e) => e.id === exitId) : undefined;
    const ref: ObjRef | null = exit ? { kind: 'exits', id: exit.id } : null;
    let text = graphText(p, mapName);
    if (exit) text = text.replace(new RegExp(`lối (ra|tắt) ${exit.id}`), nameOf(ref));
    const boss = /side area holds a boss/.test(p) ? map.groups.find((g) => g.kind === 'boss') : undefined;
    const bossRef: ObjRef | null = boss ? { kind: 'groups', id: boss.id } : null;
    add('error', `graph:${p}`, exit ? nameOf(ref) : boss ? nameOf(bossRef) : map.nameVi, text.replace(/^[^:]+: /, ''), exit ?? boss, ref ?? bossRef);
  }

  // What a publish only notes.
  if (published && (published.cols !== map.cols || published.rows !== map.rows))
    add('warn', 'resized', map.nameVi, `Đã đổi cỡ map đã publish (${published.cols}×${published.rows} → ${map.cols}×${map.rows}): sương mù đã khám phá của người chơi sẽ lệch.`);

  // Hints for a better area.
  const arrivals = maps.flatMap((m) => m.exits.filter((e) => e.to === map.id));
  for (const sp of map.spawns ?? []) {
    if (!arrivals.some((e) => e.arrive === sp.id || (e.arriveX === sp.x && e.arriveY === sp.y))) {
      const ref: ObjRef = { kind: 'spawns', id: sp.id };
      add('info', `unusedSpawn:${sp.id}`, nameOf(ref), `${nameOf(ref)} chưa có lối ra nào đáp xuống.`, sp, ref);
    }
  }
  if (map.springs.length === 0) add('info', 'noSpring', map.nameVi, 'Map chưa có Suối hồi.');
  if (map.nodes.length === 0) add('info', 'noNode', map.nameVi, 'Khu vực này chưa có điểm tài nguyên.');
  if (map.chests.length === 0) add('info', 'noChest', map.nameVi, 'Map chưa có rương nào.');

  const order: Record<IssueLevel, number> = { error: 0, warn: 1, info: 2 };
  const seen = new Set<string>();
  return out.filter((i) => !seen.has(i.key) && seen.add(i.key)).sort((a, b) => order[a.level] - order[b.level]);
}

/** The game's checks of an area as Vietnamese lines `<area name>: …` (the publish dialog, the map list). */
export function problemLines(map: AreaMap, maps: readonly AreaMap[]): string[] {
  const mapName = (id: string) => maps.find((m) => m.id === id)?.nameVi ?? id;
  return mapIssues(map, maps).map((i) => {
    const ref = i.code.startsWith('arrival') ? null : refOf(map, i.subject);
    const otherRef = i.other && i.other.kind !== 'map' ? refOf(map, i.other) : null;
    const other = i.other?.kind === 'map' ? mapName(i.other.id) : otherRef ? objectName(map, otherRef, mapName) : '';
    const name = ref ? objectName(map, ref, mapName) : 'Vật trên map';
    const at = i.x !== undefined ? ` (ô ${i.x}, ${i.y})` : '';
    return `${map.nameVi}: ${issueMessage(map, i, name, other)}${at}`;
  });
}
