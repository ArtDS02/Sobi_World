// Admin "Map Editor" (decision 047, Map Builder GĐ6): one area on a big canvas — its painted background, ground, grid, heights and
// every object. Tools: select / move / resize (drag, Shift for more, drag an empty spot to box-select), brush, rectangle and flood fill
// for the ground (walk / block and the other tiles), heights, a cover rectangle (a hidden way), eraser (objects), place a copy of an
// object kind. Wheel zooms, right / middle drag or Space pans; Ctrl+Z / Ctrl+Y, Del, Ctrl+D, Ctrl+C / Ctrl+V, arrows nudge, Ctrl+S
// saves the draft. The work of each area stays in memory while the admin is open, so leaving the page loses nothing.
import type { AreaMap } from '../../src/areas/adventure/logic/config/content';
import { mapProblems } from '../../src/areas/adventure/logic/maps';
import { esc } from './labels';
import { editExits, editSpawns, fetchBuilder, postDraft } from './mapApi';
import { COLOUR, GROUND } from './mapCanvas';
import { DECOR, DECOR_LIST } from '../../src/areas/adventure/logic/config/content';
import { ImageCache, LAYER_LABEL, OBJ_STYLE, drawEditor, fitView, tileAtScreen, type Ghost, type Layers, type View } from './mapEditCanvas';
import { artUrl } from './store';
import { applyField, inspectorHtml } from './mapEditInspector';
import * as E from './mapEditModel';
import { graphProblems } from './mapLinks';
import * as M from './mapModel';
import { optionHtml } from './richSelect';
import { openPreview, openPublish } from './mapPublishDialog';
import { openSimulation } from './mapSimulate';

type Tool = 'select' | 'brush' | 'rect' | 'fill' | 'height' | 'cover' | 'erase' | 'place' | 'decor';

const TOOLS: [Tool, string, string][] = [
  ['select', '🖱️ Chọn', 'V'],
  ['brush', '🖌️ Cọ', 'B'],
  ['rect', '▭ Chữ nhật', 'R'],
  ['fill', '🪣 Đổ loang', 'F'],
  ['height', '⛰️ Độ cao', 'H'],
  ['cover', '🌳 Lối ẩn', 'C'],
  ['erase', '🧽 Tẩy vật', 'E'],
];

interface EditorState {
  data: M.BuilderData;
  draft: M.MapDraft;
  history: E.EditHistory<AreaMap>;
  dirty: boolean;
  view: View | null;
  /** The view follows the canvas size until the admin zooms or pans. */
  autoFit: boolean;
  tool: Tool;
  ground: string;
  height: number;
  size: number;
  place: E.Addable | null;
  /** The library asset the decoration tool places, and the library search. */
  decor: string | null;
  decorQuery: string;
  layers: Layers;
  selected: E.ObjRef[];
  clipboard: { kind: E.ObjKind; ref: E.ObjRef; dx: number; dy: number }[];
  message: string;
}

const states = new Map<string, EditorState>();

/** Unsaved work in any area (the dashboard asks before closing). */
export const editorDirty = () => [...states.values()].some((s) => s.dirty);

/** A row to copy for a new object of a kind: from this area first, else the same zone, else anywhere. */
function templateOf(st: EditorState, kind: E.Addable): (Record<string, unknown> & { id: string; x: number; y: number }) | undefined {
  const map = st.draft.map;
  const maps = [map, ...M.workingMaps(st.data).filter((m) => m.id !== map.id && m.zoneId === map.zoneId), ...M.workingMaps(st.data).filter((m) => m.zoneId !== map.zoneId)];
  for (const m of maps) {
    const rows = (m as unknown as Record<string, (Record<string, unknown> & { id: string; x: number; y: number })[] | undefined>)[kind];
    const row = kind === 'groups' ? rows?.find((r) => r.kind === 'normal') : rows?.[0];
    if (row) return row;
  }
  return undefined;
}

export function renderMapEditor(root: HTMLElement, mapId: string | null) {
  if (!mapId) return void (root.innerHTML = '<p class="empty">Chọn map ở <a href="#/adventure-world">Quản lý map</a> → Sửa.</p>');
  const st = states.get(mapId);
  if (st) return mount(root, st);
  root.innerHTML = '<p class="loading">Đang mở map…</p>';
  fetchBuilder().then(
    (data) => {
      if (!M.workingMaps(data).some((m) => m.id === mapId)) return void (root.innerHTML = `<p class="empty">Không có map ${esc(mapId)}.</p>`);
      const fresh: EditorState = {
        data,
        draft: M.draftOf(data, mapId),
        history: new E.EditHistory<AreaMap>(),
        dirty: false,
        view: null,
        autoFit: true,
        tool: 'select',
        ground: '#',
        height: 1,
        size: 1,
        place: null,
        decor: null,
        decorQuery: '',
        layers: { background: true, ground: true, environment: true, objects: true, creatures: true, foreground: true, collision: true, grid: true, elevation: false },
        selected: [],
        clipboard: [],
        message: '',
      };
      states.set(mapId, fresh);
      mount(root, fresh);
    },
    (e: unknown) => (root.innerHTML = `<p class="empty">Không tải được map: ${esc((e as Error).message)}</p>`),
  );
}

function mount(root: HTMLElement, st: EditorState) {
  const map = () => st.draft.map;
  const status = M.statusOf(st.data, map().id);
  root.innerHTML = `<div class="medit">
    <header class="medit__bar">
      <a class="btn btn-small" href="#/adventure-world">← Quản lý map</a>
      <b>${esc(map().nameVi)}</b> <span class="badge mapm__status mapm__status--${status === 'draft' ? 'new' : status === 'disabled' ? 'warn' : 'ok'}">${M.STATUS_LABEL[status]}</span>
      <span class="medit__dirty" data-dirty></span>
      <span class="medit__sep"></span>
      ${TOOLS.map(([t, label, key]) => `<button class="btn btn-small" data-tool="${t}" title="${key}">${label}</button>`).join('')}
      <span class="medit__sep"></span>
      <button class="btn btn-small" data-cmd="undo" title="Ctrl+Z">↶</button><button class="btn btn-small" data-cmd="redo" title="Ctrl+Y">↷</button>
      <button class="btn btn-small" data-cmd="fit">Vừa khung</button>
      <span class="medit__sep"></span>
      <button class="btn btn-small" data-cmd="exits">Lối ra</button><button class="btn btn-small" data-cmd="spawns">Điểm xuất hiện</button>
      <button class="btn btn-primary btn-small" data-cmd="save" title="Ctrl+S">Lưu nháp</button><button class="btn btn-small" data-cmd="simulate">▶ Chạy thử</button><button class="btn btn-small" data-cmd="preview">🎥 Xem bằng game</button><button class="btn btn-small" data-cmd="publish">Kiểm tra & Publish</button>
    </header>
    <aside class="medit__left" data-left></aside>
    <div class="medit__stage" data-stage><canvas data-canvas></canvas><div class="medit__status" data-status></div></div>
    <aside class="medit__right" data-right></aside>
  </div>`;
  const canvas = root.querySelector<HTMLCanvasElement>('[data-canvas]')!;
  const stage = root.querySelector<HTMLElement>('[data-stage]')!;
  const right = root.querySelector<HTMLElement>('[data-right]')!;
  const left = root.querySelector<HTMLElement>('[data-left]')!;
  const statusLine = root.querySelector<HTMLElement>('[data-status]')!;
  const images = new ImageCache(() => paint());
  let ghost: Ghost = null;
  let hover: E.Tile | null = null;

  const selectedKeys = () => new Set(st.selected.map(E.refKey));
  const paint = () => {
    if (!st.view) st.view = fitView(map(), canvas.width, canvas.height);
    drawEditor(canvas, map(), st.view, st.layers, images, selectedKeys(), ghost);
    root.querySelector<HTMLElement>('[data-dirty]')!.textContent = st.dirty ? '● chưa lưu' : '';
    root.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((b) => b.classList.toggle('is-active', b.dataset.tool === st.tool));
    (root.querySelector('[data-cmd="undo"]') as HTMLButtonElement).disabled = !st.history.canUndo;
    (root.querySelector('[data-cmd="redo"]') as HTMLButtonElement).disabled = !st.history.canRedo;
    statusLine.textContent = `${hover ? `Ô ${hover.x},${hover.y} · ${map().terrain[hover.y]?.[hover.x] ?? ''}` : ''} · ${Math.round(st.view.scale)} px/ô · ${map().cols}×${map().rows}`;
  };
  const change = (fn: () => void, keepSide = false) => {
    st.history.record(map());
    fn();
    st.dirty = true;
    paint();
    if (!keepSide) side();
  };

  const side = () => {
    const m = map();
    const sel = st.selected;
    const others = M.workingMaps(st.data).map((x) => (x.id === m.id ? m : x));
    const problems = [...mapProblems(m, others), ...M.arrivalMismatches(others, m), ...graphProblems({ ...st.data, drafts: { ...st.data.drafts, [m.id]: st.draft } })(m.id)];
    right.innerHTML = `${sel.length === 1 ? inspectorHtml(m, sel[0]!) : sel.length > 1 ? `<h4>${sel.length} vật đang chọn</h4><p class="muted">Kéo hoặc dùng phím mũi tên để dời cả nhóm.</p><div class="toolbar"><button type="button" class="btn btn-small" data-cmd="duplicate">Nhân bản</button><button type="button" class="btn btn-small" data-cmd="delete">Xoá</button></div>` : `<h4>${esc(m.nameVi)}</h4><p class="mono muted">${m.id}</p><p>${m.cols}×${m.rows} ô · ${m.scene ? `nền vẽ ${esc(m.scene.art)}` : 'vẽ bằng ô'}</p><p class="muted">Bấm một vật để chỉnh. Kéo khoảng trống để chọn nhiều.</p>`}
      ${st.message ? `<p class="status-warn">${esc(st.message)}</p>` : ''}
      <h4>Kiểm tra (${problems.length})</h4>${problems.length ? `<ul class="amap__problems">${problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '<p class="ok">Map qua mọi kiểm tra.</p>'}`;
    right.querySelectorAll<HTMLInputElement & HTMLSelectElement>('[data-insp]').forEach((el) =>
      el.addEventListener('change', () => change(() => applyField(map(), st.selected[0]!, el.dataset.insp!, el.value, (el as HTMLInputElement).checked))),
    );
    right.querySelectorAll<HTMLButtonElement>('[data-cmd]').forEach((b) => b.addEventListener('click', () => command(b.dataset.cmd!)));
    right.querySelector('[data-open="exits"]')?.addEventListener('click', () => command('exits'));
  };

  const palette = () => {
    left.innerHTML = `<h4>Đất</h4><div class="medit__swatches">${GROUND.map(([c, n]) => `<button class="medit__swatch${st.ground === c ? ' is-active' : ''}" data-ground="${esc(c)}" title="${esc(n)}"><i style="background:${COLOUR[c]}"></i>${esc(n)}</button>`).join('')}</div>
      <label class="field"><span>Cỡ cọ</span><select data-size data-rich="compact">${[1, 2, 3, 5].map((n) => optionHtml(String(n), `${n} × ${n} ô`, n === st.size, { icon: ['▪', '◾', '◼', '⬛'][[1, 2, 3, 5].indexOf(n)]! })).join('')}</select></label>
      <h4>Độ cao (chỉ để vẽ)</h4><div class="medit__swatches">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => `<button class="medit__swatch medit__swatch--n${st.height === h ? ' is-active' : ''}" data-height="${h}">${h}</button>`).join('')}</div>
      <h4>Thêm vật</h4><div class="medit__adds">${E.ADDABLE.map((k) => `<button class="btn btn-small${st.tool === 'place' && st.place === k ? ' is-active' : ''}" data-place="${k}"><b style="color:${OBJ_STYLE[k][1]}">${OBJ_STYLE[k][0]}</b> ${esc(E.OBJ_LABEL[k])}</button>`).join('')}</div>
      <h4>Asset trang trí <a class="muted" href="#/adventure-assets">(thư viện)</a></h4><input type="search" data-decor-q placeholder="Tìm asset…" value="${esc(st.decorQuery)}" />
      <div class="medit__decor">${DECOR_LIST.filter((d) => !st.decorQuery || `${d.nameVi} ${d.id} ${d.category}`.toLowerCase().includes(st.decorQuery.toLowerCase()))
        .map((d) => `<button class="medit__decor-item${st.tool === 'decor' && st.decor === d.id ? ' is-active' : ''}" data-decor="${d.id}" title="${esc(d.id)}">${artUrl(d.art) ? `<img src="${artUrl(d.art)}" alt="" />` : ''}<span>${esc(d.nameVi)}</span></button>`)
        .join('')}</div>
      <h4>Lớp hiển thị</h4>${(Object.keys(st.layers) as (keyof Layers)[]).map((k) => `<label class="check"><input type="checkbox" data-layer="${k}"${st.layers[k] ? ' checked' : ''}/> ${LAYER_LABEL[k]}</label>`).join('')}`;
    left.querySelectorAll<HTMLButtonElement>('[data-decor]').forEach((b) => b.addEventListener('click', () => {
      st.decor = b.dataset.decor!;
      st.tool = 'decor';
      st.message = `Bấm lên map để đặt ${DECOR[st.decor]?.nameVi ?? st.decor} (chân asset ở chỗ bấm).`;
      palette();
      side();
      paint();
    }));
    const dq = left.querySelector<HTMLInputElement>('[data-decor-q]')!;
    dq.addEventListener('input', () => {
      st.decorQuery = dq.value;
      palette();
      const again = left.querySelector<HTMLInputElement>('[data-decor-q]')!;
      again.focus();
      again.setSelectionRange(again.value.length, again.value.length);
    });
    left.querySelectorAll<HTMLButtonElement>('[data-ground]').forEach((b) => b.addEventListener('click', () => {
      st.ground = b.dataset.ground!;
      if (!['brush', 'rect', 'fill'].includes(st.tool)) st.tool = 'brush';
      palette();
      paint();
    }));
    left.querySelectorAll<HTMLButtonElement>('[data-height]').forEach((b) => b.addEventListener('click', () => {
      st.height = Number(b.dataset.height);
      st.tool = 'height';
      st.layers.elevation = true;
      palette();
      paint();
    }));
    left.querySelectorAll<HTMLButtonElement>('[data-place]').forEach((b) => b.addEventListener('click', () => {
      st.place = b.dataset.place as E.Addable;
      st.tool = 'place';
      st.message = templateOf(st, st.place) ? `Bấm lên map để đặt ${E.OBJ_LABEL[st.place].toLowerCase()} (sao chép một cái có sẵn, id mới).` : `Chưa có ${E.OBJ_LABEL[st.place].toLowerCase()} nào để sao chép.`;
      palette();
      side();
      paint();
    }));
    left.querySelector<HTMLSelectElement>('[data-size]')!.addEventListener('change', (e) => (st.size = Number((e.target as HTMLSelectElement).value)));
    left.querySelectorAll<HTMLInputElement>('[data-layer]').forEach((c) => c.addEventListener('change', () => ((st.layers[c.dataset.layer as keyof Layers] = c.checked), paint())));
  };

  const taken = () => new Set([...M.thingIds(M.workingMaps(st.data)), ...M.thingIds([map()])]);
  const landedOn = () => new Set(M.arrivalsInto(M.workingMaps(st.data), map().id).map((a) => a.exit.arrive).filter((x): x is string => !!x));
  const published = () => st.data.published.find((m) => m.id === map().id);

  async function command(cmd: string) {
    const m = map();
    if (cmd === 'undo' || cmd === 'redo') {
      const back = cmd === 'undo' ? st.history.undo(m) : st.history.redo(m);
      if (back) {
        st.draft.map = back;
        st.selected = st.selected.filter((r) => E.findObject(back, r));
        st.dirty = true;
      }
    } else if (cmd === 'fit') {
      st.view = null;
      st.autoFit = true;
    }
    else if (cmd === 'delete' && st.selected.length) {
      const before = structuredClone(m);
      const why = E.removeObjects(m, st.selected, published(), landedOn());
      if (JSON.stringify(before) !== JSON.stringify(m)) {
        st.history.record(before);
        st.dirty = true;
      }
      st.message = why.join(' · ');
      // What stayed (kept for good) stays selected; props are counted again after a removal.
      st.selected = st.selected.filter((r) => r.kind !== 'props' && E.findObject(m, r));
    } else if (cmd === 'duplicate' || cmd === 'paste') {
      const items = cmd === 'paste' ? st.clipboard : st.selected.map((ref) => ({ kind: ref.kind, ref, dx: 0, dy: 0 }));
      const anchor = cmd === 'paste' ? (hover ?? { x: 1, y: 1 }) : null;
      st.history.record(m);
      const ids = taken();
      const made: E.ObjRef[] = [];
      for (const it of items) {
        const o = E.findObject(m, it.ref);
        const at = anchor ? { x: anchor.x + it.dx, y: anchor.y + it.dy } : o ? { x: o.x + 1, y: o.y + 1 } : null;
        const r = at && E.duplicateObject(m, it.ref, at, ids);
        if (r) made.push(r);
      }
      if (made.length) {
        st.selected = made;
        st.dirty = true;
        st.message = '';
      } else st.message = 'Không nhân bản được (điểm mặc định, cổng dịch chuyển, đền, lối ra: mỗi thứ một / có hộp riêng).';
    } else if (cmd === 'copy') {
      const objs = st.selected.map((r) => E.findObject(m, r)).filter((o): o is E.EditObj => !!o);
      const x0 = Math.min(...objs.map((o) => o.x));
      const y0 = Math.min(...objs.map((o) => o.y));
      st.clipboard = objs.map((o) => ({ kind: o.kind, ref: { kind: o.kind, id: o.id }, dx: o.x - x0, dy: o.y - y0 }));
      st.message = `Đã chép ${objs.length} vật: Ctrl+V để dán ở ô đang trỏ.`;
    } else if (cmd === 'save') {
      try {
        await postDraft(st.draft);
        st.data = await fetchBuilder();
        st.dirty = false;
        st.message = 'Đã lưu bản nháp (game chưa đổi cho tới khi publish).';
        return mount(root, st);
      } catch (e) {
        st.message = (e as Error).message;
      }
    } else if (cmd === 'preview') {
      if (st.dirty) await command('save');
      if (!st.dirty) openPreview(st.data.drafts[m.id] ? [m.id] : [], m.id);
      return;
    } else if (cmd === 'simulate') {
      openSimulation(st.data, m.id, structuredClone(m));
      return;
    } else if (cmd === 'publish') {
      if (st.dirty) await command('save');
      if (!st.dirty) openPublish(st.data, [m.id]);
      return;
    } else if (cmd === 'exits' || cmd === 'spawns') {
      // The dialogs work on saved drafts: save first, then take back what they saved.
      if (st.dirty) await command('save');
      const reopen = async (msg: string) => {
        st.data = await fetchBuilder();
        st.history.record(map());
        st.draft = M.draftOf(st.data, m.id);
        st.message = msg;
        mount(root, st);
      };
      if (cmd === 'exits') editExits(st.data, m.id, reopen);
      else editSpawns(st.data, M.draftOf(st.data, m.id), reopen);
      return;
    }
    paint();
    side();
  }

  // ---- Mouse --------------------------------------------------------------------------------------------------------------
  let drag:
    | { kind: 'pan'; sx: number; sy: number; ox: number; oy: number }
    | { kind: 'move'; from: E.Tile; last: E.Tile; recorded: boolean }
    | { kind: 'resize'; ref: E.ObjRef; recorded: boolean }
    | { kind: 'paint'; last: E.Tile }
    | { kind: 'shape'; a: E.Tile }
    | { kind: 'box'; a: E.Tile; add: boolean }
    | null = null;
  let space = false;
  const tileOf = (e: PointerEvent | WheelEvent) => {
    const r = canvas.getBoundingClientRect();
    return tileAtScreen(st.view!, ((e.clientX - r.left) * canvas.width) / r.width, ((e.clientY - r.top) * canvas.height) / r.height);
  };
  /** The point under the pointer in tiles, with fractions (a decoration's foot). */
  const pointOf = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return { x: (((e.clientX - r.left) * canvas.width) / r.width) / st.view!.scale + st.view!.ox, y: (((e.clientY - r.top) * canvas.height) / r.height) / st.view!.scale + st.view!.oy };
  };
  const inArea = (t: E.Tile) => t.x >= 0 && t.y >= 0 && t.x < map().cols && t.y < map().rows;

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const t = tileOf(e);
    if (e.button === 1 || e.button === 2 || space) {
      drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: st.view!.ox, oy: st.view!.oy };
      st.autoFit = false;
      return;
    }
    const m = map();
    if (st.tool === 'select') {
      const one = st.selected.length === 1 ? E.findObject(m, st.selected[0]!) : undefined;
      if (one?.sizable && t.x === one.x + one.w - 1 && t.y === one.y + one.h - 1 && (one.w > 1 || one.h > 1 || e.altKey)) {
        drag = { kind: 'resize', ref: one, recorded: false };
        return;
      }
      const hit = E.objectAt(m, t.x, t.y);
      if (hit) {
        const k = E.refKey(hit);
        if (e.shiftKey) st.selected = selectedKeys().has(k) ? st.selected.filter((r) => E.refKey(r) !== k) : [...st.selected, hit];
        else if (!selectedKeys().has(k)) st.selected = [hit];
        drag = { kind: 'move', from: t, last: t, recorded: false };
      } else drag = { kind: 'box', a: t, add: e.shiftKey };
      st.message = '';
      side();
      paint();
    } else if (st.tool === 'brush' || st.tool === 'height') {
      st.history.record(m);
      st.dirty = true;
      applyStroke(t, t);
      drag = { kind: 'paint', last: t };
    } else if (st.tool === 'rect' || st.tool === 'cover') drag = { kind: 'shape', a: t };
    else if (st.tool === 'fill' && inArea(t)) change(() => E.paintTerrain(m, E.floodTiles(m, t), st.ground));
    else if (st.tool === 'erase') {
      const hit = E.objectAt(m, t.x, t.y);
      if (hit) {
        st.selected = [hit];
        void command('delete');
      }
    } else if (st.tool === 'decor' && st.decor && inArea(t)) {
      const at = pointOf(e);
      let made: E.ObjRef | null = null;
      change(() => (made = E.addDecor(map(), st.decor!, at, taken())));
      st.selected = made ? [made] : [];
      side();
      paint();
    } else if (st.tool === 'place' && st.place && inArea(t)) {
      const row = templateOf(st, st.place);
      if (row) {
        let made: E.ObjRef | null = null;
        change(() => (made = E.addRow(m, st.place!, row, t, taken())));
        st.selected = made ? [made] : [];
        st.message = made ? '' : 'Không đặt được (câu đố cần một cổng nguyên tố trong map).';
        side();
        paint();
      }
    }
  });
  const applyStroke = (a: E.Tile, b: E.Tile) => {
    const tiles = E.strokeTiles(a, b, st.size);
    if (st.tool === 'height') E.paintElevation(map(), tiles, st.height);
    else E.paintTerrain(map(), tiles, st.ground);
    paint();
  };
  canvas.addEventListener('pointermove', (e) => {
    const t = tileOf(e);
    hover = inArea(t) ? t : null;
    if (!drag) return paint();
    const m = map();
    if (drag.kind === 'pan') {
      st.view = { ...st.view!, ox: drag.ox - (e.clientX - drag.sx) / st.view!.scale, oy: drag.oy - (e.clientY - drag.sy) / st.view!.scale };
    } else if (drag.kind === 'move' && (t.x !== drag.last.x || t.y !== drag.last.y)) {
      if (!drag.recorded) st.history.record(m);
      drag.recorded = true;
      E.moveObjects(m, st.selected, t.x - drag.last.x, t.y - drag.last.y);
      drag.last = t;
      st.dirty = true;
    } else if (drag.kind === 'resize') {
      const o = E.findObject(m, drag.ref)!;
      if (!drag.recorded) st.history.record(m);
      drag.recorded = true;
      E.setBox(m, drag.ref, { x: o.x, y: o.y, w: t.x - o.x + 1, h: t.y - o.y + 1 });
      st.dirty = true;
    } else if (drag.kind === 'paint') {
      applyStroke(drag.last, t);
      drag.last = t;
    } else if (drag.kind === 'shape') ghost = { kind: 'rect', a: drag.a, b: t, colour: st.tool === 'cover' ? '#7fe07a' : '#ff2fd0' };
    else if (drag.kind === 'box') ghost = { kind: 'rect', a: drag.a, b: t, colour: '#3fa3ff' };
    paint();
  });
  canvas.addEventListener('pointerup', (e) => {
    const d = drag;
    drag = null;
    ghost = null;
    if (!d) return;
    const t = tileOf(e);
    const m = map();
    if (d.kind === 'shape' && st.tool === 'rect') change(() => E.paintTerrain(m, E.rectTiles(d.a, t), st.ground));
    else if (d.kind === 'shape' && st.tool === 'cover') {
      let ref: E.ObjRef | null = null;
      change(() => (ref = E.addCover(m, d.a, t, taken())));
      st.selected = ref ? [ref] : [];
      side();
    } else if (d.kind === 'box') {
      const inBox = E.objectsIn(m, d.a.x, d.a.y, t.x, t.y).map((o) => ({ kind: o.kind, id: o.id }));
      st.selected = d.add ? [...st.selected, ...inBox.filter((r) => !selectedKeys().has(E.refKey(r)))] : inBox;
      side();
    } else if (d.kind === 'move' || d.kind === 'resize' || d.kind === 'paint') side();
    paint();
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    const sx = ((e.clientX - r.left) * canvas.width) / r.width;
    const sy = ((e.clientY - r.top) * canvas.height) / r.height;
    const v = st.view!;
    const scale = Math.min(80, Math.max(2, v.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
    const wx = sx / v.scale + v.ox;
    const wy = sy / v.scale + v.oy;
    st.view = { scale, ox: wx - sx / scale, oy: wy - sy / scale };
    st.autoFit = false;
    paint();
  }, { passive: false });

  // ---- Keys (only while this editor is on screen and no field has the focus) ---------------------------------------------
  const onKey = (e: KeyboardEvent) => {
    if (!root.isConnected) return document.removeEventListener('keydown', onKey), document.removeEventListener('keyup', onKeyUp);
    if (document.querySelector('.modal-host') || (e.target instanceof Element && e.target.closest('input, textarea, select, .rsel'))) return;
    const k = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    const keyCmd = ctrl ? ({ z: e.shiftKey ? 'redo' : 'undo', y: 'redo', d: 'duplicate', c: 'copy', v: 'paste', s: 'save' } as Record<string, string>)[k] : undefined;
    if (keyCmd) {
      e.preventDefault();
      return void command(keyCmd);
    }
    if (k === ' ') return void ((space = true), e.preventDefault());
    if (k === 'delete' || k === 'backspace') return void command('delete');
    if (k === 'escape') return void ((st.selected = []), (st.tool = 'select'), palette(), side(), paint());
    if (k === 'g') return void ((st.layers.grid = !st.layers.grid), palette(), paint());
    const tool = TOOLS.find(([, , key]) => key.toLowerCase() === k)?.[0];
    if (tool) return void ((st.tool = tool), palette(), paint());
    const arrow = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] }[k];
    if (arrow && st.selected.length) {
      e.preventDefault();
      const n = e.shiftKey ? 5 : 1;
      change(() => E.moveObjects(map(), st.selected, arrow[0]! * n, arrow[1]! * n));
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === ' ') space = false;
  };
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKeyUp);

  root.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((b) => b.addEventListener('click', () => ((st.tool = b.dataset.tool as Tool), palette(), paint())));
  root.querySelectorAll<HTMLButtonElement>('.medit__bar [data-cmd]').forEach((b) => b.addEventListener('click', () => void command(b.dataset.cmd!)));
  const size = () => {
    const r = stage.getBoundingClientRect();
    canvas.width = Math.max(200, Math.floor(r.width));
    canvas.height = Math.max(200, Math.floor(r.height));
    if (st.autoFit) st.view = null;
    paint();
  };
  new ResizeObserver(size).observe(stage);
  palette();
  side();
  size();
}
