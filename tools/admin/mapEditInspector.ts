// The Map Editor's inspector (decision 047, GĐ6): exact numbers for what is selected — tile and size, and the fields of its kind
// that only pick among what the game already has (a chest's table and look, a traveller's event, a gate's element, a lore text…).
// Enemy groups are shown, never changed here (no new fight rules). `inspectorHtml` draws; `applyField` writes one field.
import { CHEST_TYPES, COVER_LOOKS, FACINGS, GATE_LOOKS } from '../../content/schemas/adventure/maps';
import { ELEMENT_NAMES, ENEMIES, EVENTS, LOOT_TABLES, PROP_LIST, type AreaMap } from '../../src/areas/adventure/logic/config/content';
import { esc } from './labels';
import { OBJ_LABEL, findObject, setBox, type ObjRef } from './mapEditModel';

const opt = (v: string, label: string, sel: boolean) => `<option value="${esc(v)}"${sel ? ' selected' : ''}>${esc(label)}</option>`;
const select = (field: string, value: string, options: [string, string][]) =>
  `<select data-insp="${field}">${options.map(([v, l]) => opt(v, l, v === value)).join('')}</select>`;
const field = (label: string, control: string) => `<label class="field"><span>${esc(label)}</span>${control}</label>`;
const num = (f: string, v: number) => `<input type="number" data-insp="${f}" value="${v}" />`;

type AnyRow = Record<string, unknown> & { id: string };
const rowOf = (map: AreaMap, ref: ObjRef): AnyRow | undefined =>
  ref.kind === 'shrine' ? (map.shrine as AnyRow | undefined) : ((map as unknown as Record<string, AnyRow[] | undefined>)[ref.kind]?.find((r) => r.id === ref.id));

const elements = (): [string, string][] => Object.entries(ELEMENT_NAMES).map(([id, e]) => [id, (e as { nameVi?: string }).nameVi ?? id]);
const tables = (): [string, string][] => Object.keys(LOOT_TABLES).map((t) => [t, t]);

/** The inspector for one object of `map`. */
export function inspectorHtml(map: AreaMap, ref: ObjRef): string {
  const o = findObject(map, ref);
  if (!o) return '';
  const row = rowOf(map, ref);
  const parts = [
    `<h4>${esc(OBJ_LABEL[ref.kind])}</h4><p class="mono muted">${esc(ref.kind === 'props' ? map.props[Number(ref.id)]!.prop : ref.id)}</p>`,
    field('Ô (x, y)', `<span class="toolbar">${num('x', o.x)}${num('y', o.y)}</span>`),
  ];
  if (o.sizable) parts.push(field('Rộng × cao (ô)', `<span class="toolbar">${num('w', o.w)}${num('h', o.h)}</span>`));
  switch (ref.kind) {
    case 'chests':
      parts.push(field('Loại rương', select('type', String(row!.type ?? 'wood'), CHEST_TYPES.map((t) => [t, t]))), field('Bảng phần thưởng', select('table', String(row!.table), tables())));
      break;
    case 'nodes':
      parts.push(field('Bảng phần thưởng', select('table', String(row!.table), tables())));
      break;
    case 'gates':
      parts.push(field('Hệ', select('element', String(row!.element), elements())), field('Hình', select('look', String(row!.look ?? 'gate'), GATE_LOOKS.map((l) => [l, l === 'crack' ? 'Tường giả có vết nứt' : 'Cổng nguyên tố']))));
      break;
    case 'covers':
      parts.push(field('Hình lớp che', select('look', String(row!.look), COVER_LOOKS.map((l) => [l, { canopy: 'Tán cây', rock: 'Mái đá', roof: 'Mái sập' }[l]]))));
      break;
    case 'puzzles':
      parts.push(field('Hệ', select('element', String(row!.element), elements())), field('Mở cổng', select('gate', String(row!.gate), map.gates.map((g) => [g.id, g.id]))));
      break;
    case 'npcs':
      parts.push(field('Sự kiện', select('event', String(row!.event), Object.values(EVENTS).map((e) => [e.id, e.nameVi]))));
      break;
    case 'lore':
      parts.push(field('Lời trên bia', `<textarea data-insp="textVi" rows="4">${esc(row!.textVi)}</textarea>`), '<p class="muted">Bia mới / lời mới cần bản tiếng Anh khi publish.</p>');
      break;
    case 'spawns':
      parts.push(field('Tên', `<input data-insp="nameVi" value="${esc(row!.nameVi)}" />`), field('Hướng', select('facing', String(row!.facing ?? 'down'), FACINGS.map((f) => [f, f]))));
      break;
    case 'groups': {
      const enemies = ((row!.pool as { enemies: string[] }[]) ?? []).flatMap((p) => p.enemies).map((e) => ENEMIES[e]?.nameVi ?? e);
      parts.push(`<p>Hạng: <b>${esc(row!.kind)}</b>${row!.sleep ? ' · đang ngủ' : ''}<br>Quái: ${esc([...new Set(enemies)].join(', '))}</p><p class="muted">Chỉ dời / nhân bản ở đây; chỉ số trận giữ nguyên.</p>`);
      break;
    }
    case 'props':
      parts.push(field('Vật', select('prop', map.props[Number(ref.id)]!.prop, PROP_LIST.map((p) => [p.id, `${p.nameVi} (${p.w}×${p.h})`]))));
      break;
    case 'exits':
      parts.push('<button type="button" class="btn btn-small" data-open="exits">Sửa ở hộp Lối ra</button>');
      break;
    default:
      break;
  }
  parts.push('<div class="toolbar"><button type="button" class="btn btn-small" data-cmd="duplicate">Nhân bản (Ctrl+D)</button><button type="button" class="btn btn-small" data-cmd="delete">Xoá (Del)</button></div>');
  return parts.join('');
}

/** Writes one inspector field of `ref` (numbers rounded, positions kept inside the area). */
export function applyField(map: AreaMap, ref: ObjRef, name: string, value: string) {
  const o = findObject(map, ref);
  if (!o) return;
  if (name === 'x' || name === 'y' || name === 'w' || name === 'h') return setBox(map, ref, { x: o.x, y: o.y, w: o.w, h: o.h, [name]: Number(value) || 0 });
  if (ref.kind === 'props' && name === 'prop') {
    map.props[Number(ref.id)] = { ...map.props[Number(ref.id)]!, prop: value };
    return;
  }
  const row = rowOf(map, ref);
  if (!row) return;
  if (name === 'type' && value === 'wood') delete row.type;
  else if (name === 'look' && ref.kind === 'gates' && value === 'gate') delete row.look;
  else row[name] = value;
}
