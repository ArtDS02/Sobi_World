// The Map Editor's inspector (decision 047, GĐ6): exact numbers for what is selected — tile and size, and the fields of its kind
// that only pick among what the game already has (a chest's table and look, a traveller's event, a gate's element, a lore text…).
// Enemy groups are shown, never changed here (no new fight rules). `inspectorHtml` draws; `applyField` writes one field.
import { CHEST_TYPES, COVER_LOOKS, FACINGS, GATE_LOOKS } from '../../content/schemas/adventure/maps';
import { SCENERY_MODES } from '../../content/schemas/adventure/scenery';
import { DECOR, DECOR_LIST, ELEMENT_NAMES, ENEMIES, EVENTS, LOOT_TABLES, PROP_LIST, type AreaMap } from '../../src/areas/adventure/logic/config/content';
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
  if (ref.kind === 'scenery') return decorHtml(map, ref.id);
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

const MODE_LABEL: Record<(typeof SCENERY_MODES)[number], string> = {
  normal: 'Normal — nằm trên mặt đất',
  occluder: 'Che theo chân (depth-sort)',
  foreground: 'Luôn ở trên (tiền cảnh)',
  cover: 'Lớp che — mờ khi đội tới gần',
};
const rects = (list: readonly { x: number; y: number; w: number; h: number }[] | undefined) => (list ?? []).map((r) => `${r.x},${r.y},${r.w},${r.h}`).join('; ');
const parseRects = (text: string) =>
  text
    .split(';')
    .map((p) => p.split(',').map((n) => Math.round(Number(n.trim()))))
    .filter((n) => n.length === 4 && n.every(Number.isFinite) && n[2]! >= 1 && n[3]! >= 1)
    .map(([x, y, w, h]) => ({ x: x!, y: y!, w: w!, h: h! }));

/** The inspector of a decoration: its asset, foot point, size, turn, mirror, stance, blocked tiles, fade. */
function decorHtml(map: AreaMap, id: string): string {
  const d = map.scenery!.find((x) => x.id === id)!;
  const a = DECOR[d.asset];
  const dec = (f: string, v: number | undefined, step = 0.25) => `<input type="number" step="${step}" data-insp="${f}" value="${v ?? ''}" placeholder="tự động" />`;
  return [
    `<h4>${esc(OBJ_LABEL.scenery)}</h4><p class="mono muted">${esc(id)}</p>`,
    field('Asset', select('asset', d.asset, DECOR_LIST.map((x) => [x.id, x.nameVi]))),
    field('Chân (x, y) — ô, có số lẻ', `<span class="toolbar">${dec('fx', d.x)}${dec('fy', d.y)}</span>`),
    field(`Rộng × cao (ô; trống = ${a?.w ?? '?'} × theo ảnh)`, `<span class="toolbar">${dec('dw', d.w)}${dec('dh', d.h)}</span>`),
    field('Xoay (độ)', dec('rotate', d.rotate, 5)),
    `<label class="check"><input type="checkbox" data-insp="flip"${d.flip ? ' checked' : ''} /> Lật ngang</label>`,
    field('Cách đứng', select('mode', d.mode ?? a?.mode ?? 'occluder', SCENERY_MODES.map((m) => [m, MODE_LABEL[m]]))),
    field('Ô chặn quanh chân "x,y,w,h; …" (trống = của asset)', `<input data-insp="foot" value="${esc(d.foot ? rects(d.foot) : '')}" placeholder="${esc(rects(a?.foot))}" />`),
    field('Mờ còn (0 = ẩn hẳn) · bán kính (ô)', `<span class="toolbar">${dec('fadeAlpha', d.fade?.alpha, 0.1)}${dec('fadeRadius', d.fade?.radius, 0.5)}</span>`),
    field('Vùng kích hoạt "x,y,w,h" (ô; trống = theo bán kính)', `<input data-insp="fadeArea" value="${esc(d.fade?.area ? rects([d.fade.area]) : '')}" />`),
    '<div class="toolbar"><button type="button" class="btn btn-small" data-cmd="duplicate">Nhân bản (Ctrl+D)</button><button type="button" class="btn btn-small" data-cmd="delete">Xoá (Del)</button></div>',
  ].join('');
}

/** Writes one field of a decoration (blank = back to the library's). */
function applyDecor(map: AreaMap, id: string, name: string, value: string, checked: boolean) {
  map.scenery = map.scenery?.map((d) => {
    if (d.id !== id) return d;
    const next = { ...d } as Record<string, unknown> & typeof d;
    const n = value.trim() === '' ? undefined : Number(value);
    const set = (k: string, v: unknown) => (v === undefined || (typeof v === 'number' && !Number.isFinite(v)) ? delete next[k] : (next[k] = v));
    if (name === 'asset') next.asset = value;
    else if (name === 'fx' && n !== undefined) next.x = n;
    else if (name === 'fy' && n !== undefined) next.y = n;
    else if (name === 'dw') set('w', n && n >= 0.25 ? n : undefined);
    else if (name === 'dh') set('h', n && n >= 0.25 ? n : undefined);
    else if (name === 'rotate') set('rotate', n ? Math.max(-180, Math.min(180, n)) : undefined);
    else if (name === 'flip') set('flip', checked ? true : undefined);
    else if (name === 'mode') set('mode', value === (DECOR[d.asset]?.mode ?? 'occluder') ? undefined : value);
    else if (name === 'foot') set('foot', value.trim() === '' ? undefined : parseRects(value));
    else if (name.startsWith('fade')) {
      const fade = { alpha: d.fade?.alpha ?? 0, ...d.fade } as NonNullable<typeof d.fade>;
      if (name === 'fadeAlpha') fade.alpha = n === undefined ? 0 : Math.max(0, Math.min(1, n));
      if (name === 'fadeRadius') {
        if (n && n >= 0.5) fade.radius = n;
        else delete fade.radius;
      }
      if (name === 'fadeArea') {
        const [r] = parseRects(value);
        if (r) fade.area = r;
        else delete fade.area;
      }
      set('fade', name === 'fadeAlpha' && n === undefined && !fade.radius && !fade.area ? undefined : fade);
    }
    return next;
  });
}

/** Writes one inspector field of `ref` (numbers rounded, positions kept inside the area). */
export function applyField(map: AreaMap, ref: ObjRef, name: string, value: string, checked = false) {
  if (ref.kind === 'scenery') return applyDecor(map, ref.id, name, value, checked);
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
