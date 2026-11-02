// "Lối ra" of the Map Builder (decision 047, GĐ4): the exits of one area and where each leads, on two grids — this area and the one
// the selected exit leads to. Place an exit with a click; pick its destination area and the spawn it lands on (or click the
// destination grid: the spawn there, or a new one); set its size, look, lock, one-way, name, inactive. The way back is set up at the
// other end on purpose: click where it stands in the destination, then where it lands here. Saving keeps drafts of both areas.
import type { AreaMap } from '../../src/areas/adventure/logic/config/content';
import { mapProblems } from '../../src/areas/adventure/logic/maps';
import { esc } from './labels';
import { cellFor, drawMapGrid, tileOfEvent, type GridMark } from './mapCanvas';
import * as L from './mapLinks';
import * as M from './mapModel';
import { openModal } from './modal';

/** What the next click on a grid does. */
type Mode = { kind: 'exit' } | { kind: 'new'; to: string } | { kind: 'arrive' } | { kind: 'back' } | { kind: 'backArrive'; exitId: string };

const MODE_HINT: Record<Mode['kind'], string> = {
  exit: 'Bấm lưới map này để dời lối ra đang chọn.',
  new: 'Bấm lưới map này để đặt lối ra mới.',
  arrive: 'Bấm lưới map đích để chọn điểm tới (điểm có sẵn, hoặc tạo điểm mới ở ô đó).',
  back: 'Bấm lưới map đích để đặt lối về.',
  backArrive: 'Bấm lưới map này để chọn chỗ lối về tới.',
};

export interface ExitsSave {
  drafts: M.MapDraft[];
  notes: Record<string, M.ExitNote>;
  /** Open the "Lối ra" of this area after saving. */
  next?: string;
}

function marks(map: AreaMap, strongExit: string | null, strongSpawn: string | null, strongExits: ReadonlySet<string> = new Set()): GridMark[] {
  return [
    { x: map.portal.x, y: map.portal.y, w: 2, h: 2, colour: '#b98cf0', text: 'P' },
    ...map.groups.map((g): GridMark => ({ x: g.x, y: g.y, colour: '#e05050' })),
    ...M.spawnsOf(map).map((s): GridMark => ({ x: s.x, y: s.y, colour: s.id === 'spawn_default' ? '#ffffff' : '#ffd84a', text: 'S', strong: s.id === strongSpawn })),
    ...map.exits.map((e): GridMark => ({ x: e.x, y: e.y, w: e.w, h: e.h, colour: '#ff9b3d', text: '>', strong: e.id === strongExit || strongExits.has(e.id) })),
  ];
}

const option = (value: string, label: string, selected: boolean, disabled = false) => `<option value="${esc(value)}"${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}>${esc(label)}</option>`;

/** `selectExit` = the exit selected when it opens (from the map network); else the first. */
export function openExits(data: M.BuilderData, mapId: string, save: (s: ExitsSave) => Promise<void>, selectExit?: string) {
  const draft = M.draftOf(data, mapId);
  const map = draft.map;
  const touched = new Map<string, M.MapDraft>();
  const notes: Record<string, M.ExitNote> = structuredClone(data.meta[mapId]?.exits ?? {});
  const publishedExits = new Set(data.published.find((m) => m.id === mapId)?.exits.map((e) => e.id) ?? []);
  const areaOf = (id: string): AreaMap => (id === mapId ? map : (touched.get(id)?.map ?? M.workingMaps(data).find((m) => m.id === id)!));
  const edit = (id: string): AreaMap => {
    if (!touched.has(id)) touched.set(id, M.draftOf(data, id));
    return touched.get(id)!.map;
  };
  const world = () => M.workingMaps(data).map((m) => (m.id === mapId ? map : (touched.get(m.id)?.map ?? m)));
  let selected: string | null = (selectExit && map.exits.some((e) => e.id === selectExit) ? selectExit : map.exits[0]?.id) ?? null;
  let mode: Mode = { kind: 'exit' };
  let note = '';
  let next: string | undefined;

  openModal({
    title: `Lối ra · ${map.nameVi}`,
    submit: 'Lưu bản nháp',
    wide: true,
    body: `<div class="mspawn"><div class="mexit__grids">
        <p class="muted"><b>${esc(map.nameVi)}</b> — cam &gt; = lối ra, vàng S = điểm tới, trắng S = điểm mặc định, tím P = cổng dịch chuyển, đỏ = nhóm quái.</p><canvas data-a></canvas>
        <p class="muted" data-b-title></p><canvas data-b></canvas>
      </div><div class="mspawn__side" data-side></div></div>`,
    onOpen: (form) => {
      const canvasA = form.querySelector<HTMLCanvasElement>('[data-a]')!;
      const canvasB = form.querySelector<HTMLCanvasElement>('[data-b]')!;
      const side = form.querySelector<HTMLElement>('[data-side]')!;
      const cellA = cellFor(map, 600);
      let cellB = 4;
      const current = () => map.exits.find((e) => e.id === selected) ?? null;

      const paint = () => {
        const exit = current();
        const dest = exit ? areaOf(exit.to) : null;
        const back = exit && dest ? L.waysBack(dest, map) : [];
        drawMapGrid(canvasA, map, cellA, marks(map, selected, null, new Set()));
        canvasB.hidden = !dest;
        form.querySelector<HTMLElement>('[data-b-title]')!.innerHTML = dest ? `Map đích: <b>${esc(dest.nameVi)}</b> — viền hồng = điểm tới và lối về.` : 'Chọn một lối ra để xem map đích.';
        if (dest) {
          cellB = cellFor(dest, 600);
          drawMapGrid(canvasB, dest, cellB, marks(dest, null, exit!.arrive ?? null, new Set(back.map((e) => e.id))));
        }
        const all = world();
        const graph = L.graphProblems({ ...data, meta: { ...data.meta, [mapId]: { ...data.meta[mapId]!, exits: notes } } }, all);
        const problems = [
          ...mapProblems(map, all).filter((p) => /exit|arrival|spawn|portal/.test(p)),
          ...M.arrivalMismatches(all, map),
          ...graph(mapId),
          ...(dest ? [...M.arrivalMismatches(all, dest), ...graph(dest.id)].filter((p) => p.includes(mapId)) : []),
        ];
        const others = all.filter((m) => m.id !== mapId);
        side.innerHTML = `<p class="mexit__hint">👉 ${esc(MODE_HINT[mode.kind])}</p>
          ${map.exits
            .map((e) => {
              const to = areaOf(e.to);
              const backs = L.waysBack(to, map);
              const tags = [e.lock ? L.LOCK_LABEL[e.lock].split(' (')[0] : '', e.oneWay ? 'một chiều' : '', notes[e.id]?.inactive ? 'tạm tắt' : ''].filter(Boolean);
              return `<div class="mspawn__row${e.id === selected ? ' is-selected' : ''}" data-pick="${e.id}">
                <div><b>${esc(notes[e.id]?.nameVi || `Tới ${to.nameVi}`)}</b> <span class="mono muted">${e.id}</span></div>
                <small>→ ${esc(to.nameVi)} · ${esc(M.spawnsOf(to).find((s) => s.id === e.arrive)?.nameVi ?? `ô ${e.arriveX},${e.arriveY}`)}${tags.length ? ` · ${tags.join(' · ')}` : ''} · ${e.oneWay ? '' : backs.length ? '✓ có lối về' : '<span class="status-error">⚠ chưa có lối về</span>'}</small>
              </div>`;
            })
            .join('')}
          <div class="toolbar"><select data-new-to>${others.map((m) => option(m.id, m.nameVi, mode.kind === 'new' && mode.to === m.id)).join('')}</select><button type="button" class="btn btn-small" data-new>＋ Lối ra tới map này</button></div>
          ${exit ? fields(exit, dest!, back) : ''}
          ${note ? `<p class="status-warn">${esc(note)}</p>` : ''}
          ${problems.length ? `<ul class="amap__problems">${[...new Set(problems)].map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '<p class="ok">Lối ra và kết nối của map này hợp lệ.</p>'}`;
        wire(exit, dest);
      };

      const fields = (exit: M.Exit, dest: AreaMap, back: M.Exit[]) => {
        const live = publishedExits.has(exit.id);
        return `<div class="mexit__fields">
          <label class="field"><span>Tên (cho admin)</span><input data-f="name" value="${esc(notes[exit.id]?.nameVi ?? '')}" placeholder="Tới ${esc(dest.nameVi)}" /></label>
          <label class="field"><span>Map đích</span><select data-f="to">${world().filter((m) => m.id !== mapId).map((m) => option(m.id, m.nameVi, m.id === exit.to)).join('')}</select></label>
          <label class="field"><span>Điểm tới ở map đích</span><select data-f="arrive">${M.spawnsOf(dest).map((s) => option(s.id, `${s.nameVi} (${s.x},${s.y})`, s.id === exit.arrive)).join('')}</select></label>
          <button type="button" class="btn btn-small" data-mode="arrive">Chọn điểm tới trên lưới map đích</button>
          <label class="field"><span>Ô (x, y) · rộng × cao</span><span class="toolbar"><input type="number" data-f="x" value="${exit.x}" /><input type="number" data-f="y" value="${exit.y}" /><input type="number" min="1" data-f="w" value="${exit.w}" /><input type="number" min="1" data-f="h" value="${exit.h}" /></span></label>
          <label class="field"><span>Hình</span><select data-f="kind">${Object.entries(L.EXIT_KIND_LABEL).map(([k, n]) => option(k, n, (exit.kind ?? 'gate') === k)).join('')}</select></label>
          <label class="field"><span>Khoá</span><select data-f="lock">${Object.entries(L.LOCK_LABEL).map(([k, n]) => option(k, n, (exit.lock ?? 'none') === k, k === 'shortcut' && !!exit.oneWay)).join('')}</select></label>
          <label class="check"><input type="checkbox" data-f="oneWay" ${exit.oneWay ? 'checked' : ''} ${exit.lock === 'shortcut' ? 'disabled' : ''} /> Một chiều (không cần lối về)</label>
          <label class="check"><input type="checkbox" data-f="inactive" ${notes[exit.id]?.inactive ? 'checked' : ''} ${live ? 'disabled title="Lối ra đã publish không tắt được"' : ''} /> Tạm tắt (không publish)</label>
          <div><b>Lối về từ ${esc(dest.nameVi)}</b>: ${back.length ? back.map((b) => `<span class="mono">${b.id}</span> → ${esc(M.spawnsOf(map).find((s) => s.id === b.arrive)?.nameVi ?? `ô ${b.arriveX},${b.arriveY}`)}`).join('; ') : exit.oneWay ? 'không cần (một chiều)' : '<span class="status-error">chưa có</span>'}</div>
          <div class="toolbar">${exit.oneWay ? '' : '<button type="button" class="btn btn-small" data-mode="back">＋ Tạo lối về</button>'}
            <button type="button" class="btn btn-small" data-open-dest>Lưu & mở lối ra của map đích</button>
            <button type="button" class="btn btn-small" data-remove>Xoá lối ra</button></div>
        </div>`;
      };

      const wire = (exit: M.Exit | null, dest: AreaMap | null) => {
        side.querySelectorAll<HTMLElement>('[data-pick]').forEach((row) => row.addEventListener('click', () => {
          selected = row.dataset.pick!;
          mode = { kind: 'exit' };
          note = '';
          paint();
        }));
        side.querySelector('[data-new]')!.addEventListener('click', () => {
          mode = { kind: 'new', to: side.querySelector<HTMLSelectElement>('[data-new-to]')!.value };
          paint();
        });
        if (!exit || !dest) return;
        const field = (name: string) => side.querySelector<HTMLInputElement & HTMLSelectElement>(`[data-f="${name}"]`)!;
        const on = (name: string, fn: (el: HTMLInputElement & HTMLSelectElement) => void) => field(name).addEventListener('change', () => (fn(field(name)), paint()));
        on('name', (el) => (notes[exit.id] = { ...notes[exit.id], nameVi: el.value.trim() || undefined }));
        on('to', (el) => L.landOn(exit, areaOf((exit.to = el.value)), 'spawn_default'));
        on('arrive', (el) => L.landOn(exit, dest, el.value));
        for (const k of ['x', 'y', 'w', 'h'] as const) on(k, (el) => (exit[k] = Math.max(k === 'w' || k === 'h' ? 1 : 0, Math.round(Number(el.value)) || 0)));
        on('kind', (el) => (exit.kind = el.value as M.Exit['kind']));
        on('lock', (el) => (el.value === 'none' ? delete exit.lock : (exit.lock = el.value as M.Exit['lock'])));
        on('oneWay', (el) => (el.checked ? (exit.oneWay = true) : delete exit.oneWay));
        on('inactive', (el) => (notes[exit.id] = { ...notes[exit.id], inactive: el.checked || undefined }));
        side.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => b.addEventListener('click', () => ((mode = { kind: b.dataset.mode as 'arrive' | 'back' }), paint())));
        side.querySelector('[data-remove]')!.addEventListener('click', () => {
          note = L.removeExit(data, map, exit.id) ?? '';
          if (!note) {
            delete notes[exit.id];
            selected = map.exits[0]?.id ?? null;
            mode = { kind: 'exit' };
          }
          paint();
        });
        side.querySelector('[data-open-dest]')!.addEventListener('click', () => {
          next = exit.to;
          form.requestSubmit();
        });
      };

      canvasA.addEventListener('click', (e) => {
        const t = tileOfEvent(canvasA, e, cellA);
        const exit = current();
        if (mode.kind === 'new') {
          const created = L.newExit(map, areaOf(mode.to), t, L.takenIds(data, [map, ...[...touched.values()].map((d) => d.map)]));
          selected = created.id;
          note = 'Lối ra mới tới điểm mặc định của map đích: chọn điểm tới, rồi tạo lối về (hoặc đánh dấu một chiều).';
        } else if (mode.kind === 'backArrive') {
          const dest = edit(exit!.to);
          const back = dest.exits.find((x) => x.id === (mode as { exitId: string }).exitId)!;
          L.landOn(back, map, L.spawnAt(map, dest, t.x, t.y));
          note = 'Đã có lối về. Lưu để giữ cả hai map.';
        } else if (exit) {
          exit.x = t.x;
          exit.y = t.y;
          note = '';
        }
        mode = { kind: 'exit' };
        paint();
      });
      canvasB.addEventListener('click', (e) => {
        const exit = current();
        if (!exit) return;
        const t = tileOfEvent(canvasB, e, cellB);
        if (mode.kind === 'arrive') {
          const known = M.spawnsOf(areaOf(exit.to)).find((s) => s.x === t.x && s.y === t.y);
          // The new spawn goes into the destination's draft first, then the exit lands on it there.
          const spawnId = known ? known.id : L.spawnAt(edit(exit.to), map, t.x, t.y);
          L.landOn(exit, areaOf(exit.to), spawnId);
          mode = { kind: 'exit' };
          note = known ? '' : 'Đã tạo điểm tới mới ở map đích.';
        } else if (mode.kind === 'back') {
          const back = L.newExit(edit(exit.to), map, t, L.takenIds(data, [map, ...[...touched.values()].map((d) => d.map)]));
          mode = { kind: 'backArrive', exitId: back.id };
          note = `Đã đặt lối về ${back.id}. Giờ bấm lưới map này để chọn chỗ nó tới.`;
        }
        paint();
      });
      paint();
    },
    onSubmit: async () => {
      if (mode.kind === 'backArrive') return 'Lối về chưa có chỗ tới: bấm lưới map này để chọn, rồi lưu.';
      await save({ drafts: [draft, ...touched.values()], notes, next });
    },
  });
}
