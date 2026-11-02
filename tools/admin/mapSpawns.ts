// "Điểm xuất hiện" of the Map Builder (decision 047, GĐ3): the arrival points of one area on its grid — the default spawn (portal,
// camp) and the named ones exits land on. Pick a point, click the grid to move it; rename, turn, add, delete (not one an exit lands on
// by name). Shows which exits land where and what the area's checks say. Saving keeps a draft; the exits of other areas follow a
// moved spawn when published.
import type { AreaMap } from '../../src/areas/adventure/logic/config/content';
import { mapProblems } from '../../src/areas/adventure/logic/maps';
import { esc } from './labels';
import { cellFor, drawMapGrid, tileOfEvent, type GridMark } from './mapCanvas';
import * as M from './mapModel';
import { openModal } from './modal';

const FACING_LABEL: Record<M.Facing, string> = { up: '↑ Lên', down: '↓ Xuống', left: '← Trái', right: '→ Phải' };

/** The marks of an area on its grid, the spawns on top (the selected one outlined). */
function marksOf(map: AreaMap, selected: string): GridMark[] {
  const marks: GridMark[] = [
    { x: map.portal.x, y: map.portal.y, w: 2, h: 2, colour: '#b98cf0', text: 'P' },
    ...map.exits.map((e): GridMark => ({ x: e.x, y: e.y, w: e.w, h: e.h, colour: '#fff6d8', text: '>' })),
    ...map.groups.map((g): GridMark => ({ x: g.x, y: g.y, colour: '#e05050' })),
  ];
  for (const sp of M.spawnsOf(map)) marks.push({ x: sp.x, y: sp.y, colour: sp.id === 'spawn_default' ? '#ffffff' : '#ffd84a', text: 'S', strong: sp.id === selected });
  return marks;
}

export function openSpawns(data: M.BuilderData, draft: M.MapDraft, save: (draft: M.MapDraft) => Promise<void>) {
  const map = draft.map;
  const others = M.workingMaps(data).map((m) => (m.id === map.id ? map : m));
  const arrivals = M.arrivalsInto(others, map.id);
  let selected = 'spawn_default';
  let note = '';
  openModal({
    title: `Điểm xuất hiện · ${map.nameVi}`,
    submit: 'Lưu bản nháp',
    wide: true,
    body: `<p class="muted">Chọn một điểm rồi bấm lên lưới để dời. Trắng = điểm mặc định (cổng dịch chuyển, từ Trại); vàng = điểm có tên, lối ra của map khác chọn điểm này để tới. Tím P = cổng dịch chuyển, &gt; = lối ra, đỏ = nhóm quái.</p>
      <div class="mspawn"><div class="mspawn__grid"><canvas data-grid></canvas></div><div class="mspawn__side" data-side></div></div>`,
    onOpen: (form) => {
      const canvas = form.querySelector<HTMLCanvasElement>('[data-grid]')!;
      const side = form.querySelector<HTMLElement>('[data-side]')!;
      const cell = cellFor(map, 720);
      const paint = () => {
        drawMapGrid(canvas, map, cell, marksOf(map, selected));
        const problems = [...mapProblems(map, others), ...M.arrivalMismatches(others, map)].filter((p) => /spawn|arrival|lands/.test(p));
        side.innerHTML = `${M.spawnsOf(map)
          .map((sp) => {
            const on = M.arrivalsOn(arrivals, sp);
            const named = sp.id !== 'spawn_default';
            return `<div class="mspawn__row${sp.id === selected ? ' is-selected' : ''}" data-pick="${sp.id}">
              <div><b>${esc(sp.nameVi)}</b> <span class="mono muted">${sp.id}</span> · ${sp.x},${sp.y}</div>
              ${named ? `<div class="toolbar"><input data-name="${sp.id}" value="${esc(sp.nameVi)}" /><select data-facing="${sp.id}">${(Object.keys(FACING_LABEL) as M.Facing[]).map((f) => `<option value="${f}"${f === sp.facing ? ' selected' : ''}>${FACING_LABEL[f]}</option>`).join('')}</select><button type="button" class="btn btn-small" data-remove="${sp.id}">Xoá</button></div>` : ''}
              <small class="muted">${on.length ? `Lối ra tới đây: ${on.map((a) => `${esc(a.fromName)} · ${a.exit.id}${a.exit.arrive ? '' : ' (chưa gắn tên)'}`).join('; ')}` : 'Chưa có lối ra nào tới điểm này.'}</small>
            </div>`;
          })
          .join('')}
          <div class="toolbar"><input data-new-name placeholder="Tên điểm mới, vd. Từ Hang Đá" /><button type="button" class="btn btn-small" data-add>＋ Thêm điểm</button></div>
          ${note ? `<p class="status-warn">${esc(note)}</p>` : ''}
          ${problems.length ? `<ul class="amap__problems">${problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '<p class="ok">Các điểm xuất hiện và điểm tới đều hợp lệ.</p>'}
          <p class="muted">Dời điểm có tên: lối ra của map khác đi theo khi publish.</p>`;
        side.querySelectorAll<HTMLElement>('[data-pick]').forEach((row) => row.addEventListener('click', (e) => {
          if ((e.target as HTMLElement).closest('input, select, button')) return;
          selected = row.dataset.pick!;
          paint();
        }));
        side.querySelectorAll<HTMLInputElement>('[data-name]').forEach((i) => i.addEventListener('change', () => {
          map.spawns = map.spawns?.map((s) => (s.id === i.dataset.name ? { ...s, nameVi: i.value.trim() || s.nameVi } : s));
          paint();
        }));
        side.querySelectorAll<HTMLSelectElement>('[data-facing]').forEach((sel) => sel.addEventListener('change', () => {
          map.spawns = map.spawns?.map((s) => (s.id === sel.dataset.facing ? { ...s, facing: sel.value as M.Facing } : s));
          paint();
        }));
        side.querySelectorAll<HTMLButtonElement>('[data-remove]').forEach((b) => b.addEventListener('click', () => {
          note = M.removeSpawn(map, b.dataset.remove!, arrivals) ?? '';
          if (!note && selected === b.dataset.remove) selected = 'spawn_default';
          paint();
        }));
        side.querySelector('[data-add]')!.addEventListener('click', () => {
          const name = side.querySelector<HTMLInputElement>('[data-new-name]')!.value.trim();
          if (!name) return void ((note = 'Cần tên cho điểm mới'), paint());
          selected = M.addSpawn(map, name).id;
          note = 'Điểm mới đặt ở điểm mặc định: bấm lên lưới để dời.';
          paint();
        });
      };
      canvas.addEventListener('click', (e) => {
        const t = tileOfEvent(canvas, e, cell);
        if (t.x < 0 || t.y < 0 || t.x >= map.cols || t.y >= map.rows) return;
        M.moveSpawn(map, selected, t.x, t.y);
        note = '';
        paint();
      });
      paint();
    },
    onSubmit: () => save(draft),
  });
}
