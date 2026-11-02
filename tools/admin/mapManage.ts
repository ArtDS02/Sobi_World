// Admin "Quản lý map" (decision 047, Map Builder GĐ2): every area of Sobi Adventure, published or draft, in one table — search and
// filter by zone and status; create an area (blank or from a template), copy one, rename it, note what it is for, put a draft aside,
// delete a draft (listing the exits that lead to it first). Every change lands in a draft (tools/admin/data/adventure, through the dev
// API) and never in the game until it is published. The operations themselves live in mapModel.ts.
import { z } from 'zod';
import { mapSchema } from '../../content/schemas/adventure/maps';
import { zoneSchema } from '../../content/schemas/adventure/zones';
import { esc } from './labels';
import * as M from './mapModel';
import { confirmDanger, openModal } from './modal';
import { openExits } from './mapExits';
import { graphProblems } from './mapLinks';
import { openSpawns } from './mapSpawns';
import { json, post } from './store';

const API = '/__admin/adventure/maps';

const page = {
  data: null as M.BuilderData | null,
  error: null as string | null,
  message: null as string | null,
  query: '',
  zone: '',
  status: '' as M.MapStatus | '',
};

/** The builder's data as the game reads it: rows parsed by the game's own schemas (defaults filled in). */
async function fetchData(): Promise<M.BuilderData> {
  const raw = await json<{ published: unknown[]; zones: unknown[]; drafts: Record<string, { road: 'main' | 'branch'; map: unknown }>; meta: Record<string, M.MapMeta> }>(API);
  return {
    published: z.array(mapSchema).parse(raw.published),
    zones: z.array(zoneSchema).parse(raw.zones),
    drafts: Object.fromEntries(Object.entries(raw.drafts).map(([id, d]) => [id, { road: d.road, map: mapSchema.parse(d.map) }])),
    meta: raw.meta,
  };
}

const zoneName = (data: M.BuilderData, id: string) => data.zones.find((z) => z.id === id)?.nameVi ?? id;
const mapOf = (data: M.BuilderData, id: string) => M.workingMaps(data).find((m) => m.id === id)!;

const draftOf = M.draftOf;

async function act(run: () => Promise<unknown>, done: string, rerender: () => void) {
  await run();
  page.data = await fetchData();
  page.message = done;
  rerender();
}

const zoneOptions = (data: M.BuilderData, selected: string) =>
  data.zones.map((z) => `<option value="${z.id}"${z.id === selected ? ' selected' : ''}>${esc(z.nameVi)}</option>`).join('');

/** New area: blank or from a template (`from` preselects one: "Nhân bản"). */
function openCreate(data: M.BuilderData, rerender: () => void, from?: string) {
  const working = M.workingMaps(data);
  const src = from ? mapOf(data, from) : undefined;
  const name = src ? `${src.nameVi} (bản sao)` : '';
  openModal({
    title: from ? 'Nhân bản map' : 'Tạo map mới',
    submit: from ? 'Nhân bản' : 'Tạo bản nháp',
    body: `<div class="form-grid">
      <label class="field"><span>Tên map</span><input name="nameVi" value="${esc(name)}" required /></label>
      <label class="field"><span>Map ID (không đổi được sau khi publish)</span><input name="id" class="mono" value="${src ? M.freeId('map', M.slugOf(name), M.mapIds(data)) : ''}" /></label>
      <label class="field"><span>Vùng</span><select name="zoneId">${zoneOptions(data, src?.zoneId ?? data.zones[0]?.id ?? '')}</select></label>
      <label class="field"><span>Vị trí trong vùng</span><select name="road"><option value="branch">Nhánh phụ</option><option value="main">Đường chính</option></select></label>
      <label class="field"><span>Bắt đầu từ</span><select name="from"><option value="">Map trống</option>${working.map((m) => `<option value="${m.id}"${m.id === from ? ' selected' : ''}>Mẫu: ${esc(m.nameVi)} (${m.cols}×${m.rows})</option>`).join('')}</select></label>
      <label class="field" data-size><span>Kích thước (ô) rộng × cao</span><span class="toolbar"><input name="cols" type="number" value="64" min="${M.MAP_SIZE.minCols}" max="${M.MAP_SIZE.maxCols}" /> × <input name="rows" type="number" value="36" min="${M.MAP_SIZE.minRows}" max="${M.MAP_SIZE.maxRows}" /></span></label>
      <label class="field"><span>Mô tả (cho admin)</span><textarea name="descriptionVi" rows="2"></textarea></label>
    </div>
    <p class="muted">Bản nháp không vào game cho tới khi publish. Mẫu: chép địa hình, nền vẽ và mọi vật với id mới; không chép lối ra (kết nối tự đặt ở cả hai đầu). Đường chính có luật trùm / đi nhanh — map mới nên để nhánh.</p>`,
    onOpen: (f) => {
      const idInput = f.elements.namedItem('id') as HTMLInputElement;
      let touched = false;
      idInput.addEventListener('input', () => (touched = true));
      const nameInput = f.elements.namedItem('nameVi') as HTMLInputElement;
      nameInput.addEventListener('input', () => {
        if (!touched) idInput.value = M.freeId('map', M.slugOf(nameInput.value), M.mapIds(data));
      });
      const size = f.querySelector<HTMLElement>('[data-size]')!;
      const fromSelect = f.elements.namedItem('from') as HTMLSelectElement;
      const sync = () => (size.hidden = fromSelect.value !== '');
      fromSelect.addEventListener('change', sync);
      sync();
    },
    onSubmit: async (f) => {
      const v = Object.fromEntries(new FormData(f)) as Record<string, string>;
      const nameVi = v.nameVi!.trim();
      if (!nameVi) return 'Cần tên map';
      const id = v.id!.trim() || M.freeId('map', M.slugOf(nameVi), M.mapIds(data));
      const bad = M.mapIdProblem(data, id);
      if (bad) return bad;
      const template = v.from ? working.find((m) => m.id === v.from) : undefined;
      const map = template
        ? M.copyMap(template, { id, nameVi, zoneId: v.zoneId! }, M.thingIds(working))
        : M.blankMap({ id, nameVi, zoneId: v.zoneId!, cols: Number(v.cols), rows: Number(v.rows) });
      await act(async () => {
        await post(`${API}/draft`, { draft: { map, road: v.road }, create: true });
        if (v.descriptionVi?.trim()) await post(`${API}/meta`, { id, patch: { descriptionVi: v.descriptionVi.trim() } });
      }, `Đã tạo bản nháp ${nameVi} (${id}).`, rerender);
    },
  });
}

function openRename(data: M.BuilderData, id: string, rerender: () => void) {
  const map = mapOf(data, id);
  const idFree = M.canChangeId(data, id);
  openModal({
    title: `Đổi tên · ${map.nameVi}`,
    submit: 'Lưu',
    body: `<div class="form-grid">
      <label class="field"><span>Tên map</span><input name="nameVi" value="${esc(map.nameVi)}" required /></label>
      <label class="field"><span>Map ID${idFree ? '' : ' (đã khóa: đã publish hoặc có lối ra trỏ tới)'}</span><input name="id" class="mono" value="${id}" ${idFree ? '' : 'disabled'} /></label>
      <label class="field"><span>Mô tả (cho admin)</span><textarea name="descriptionVi" rows="3">${esc(data.meta[id]?.descriptionVi ?? '')}</textarea></label>
    </div>${M.isPublished(data, id) ? '<p class="muted">Đổi tên map đã publish tạo bản nháp; game đổi tên khi publish.</p>' : ''}`,
    onSubmit: async (f) => {
      const v = Object.fromEntries(new FormData(f)) as Record<string, string>;
      const nameVi = v.nameVi!.trim();
      if (!nameVi) return 'Cần tên map';
      const nextId = idFree ? v.id!.trim() : id;
      const bad = M.mapIdProblem(data, nextId, id);
      if (bad) return bad;
      await act(async () => {
        if (nameVi !== map.nameVi || nextId !== id) {
          const draft = draftOf(data, id);
          draft.map.nameVi = nameVi;
          draft.map.id = nextId;
          await post(`${API}/draft`, { draft, ...(nextId !== id ? { previousId: id } : {}) });
        }
        if ((v.descriptionVi ?? '') !== (data.meta[id]?.descriptionVi ?? '')) await post(`${API}/meta`, { id: nextId, patch: { descriptionVi: v.descriptionVi } });
      }, `Đã lưu ${nameVi}.`, rerender);
    },
  });
}

function askDelete(data: M.BuilderData, id: string, rerender: () => void) {
  const map = mapOf(data, id);
  if (M.isPublished(data, id)) {
    confirmDanger('Bỏ bản nháp', `Bỏ mọi thay đổi chưa publish của ${map.nameVi}? Bản đang chơi trong game giữ nguyên.`, 'Bỏ nháp', () =>
      act(() => post(`${API}/delete`, { id }), `Đã bỏ bản nháp của ${map.nameVi}.`, rerender),
    );
    return;
  }
  const refs = M.referencesTo(data, id);
  const list = refs.length ? ` Lối ra đang dẫn tới map này (sẽ báo lỗi tới khi sửa): ${refs.map((r) => `${r.fromName} · ${r.exitId}`).join('; ')}.` : ' Không có lối ra nào dẫn tới map này.';
  confirmDanger('Xoá map nháp', `Xoá hẳn bản nháp ${map.nameVi} (${id})?${list}`, 'Xoá map', () => act(() => post(`${API}/delete`, { id }), `Đã xoá ${map.nameVi}.`, rerender), id);
}

/** "Lối ra" of an area: saves the drafts it touched and its exit notes, then opens the next area's when asked. */
function editExits(data: M.BuilderData, id: string, rerender: () => void) {
  openExits(data, id, async ({ drafts, notes, next }) => {
    await act(async () => {
      for (const draft of drafts) await post(`${API}/draft`, { draft });
      await post(`${API}/meta`, { id, patch: { exits: notes } });
    }, `Đã lưu lối ra của ${drafts[0]!.map.nameVi}${drafts.length > 1 ? ` và ${drafts.length - 1} map đích` : ''} (bản nháp).`, rerender);
    if (next) editExits(page.data!, next, rerender);
  });
}

function rowHtml(data: M.BuilderData, s: M.MapSummary): string {
  const published = s.status === 'published' || s.status === 'changed';
  const tone = s.status === 'disabled' ? 'warn' : published ? 'ok' : 'new';
  const check = s.problems.length ? `<span class="status-error" title="${esc(s.problems.join('\n'))}">⚠ ${s.problems.length} lỗi</span>` : '<span class="status-ok">✓</span>';
  const btn = (a: string, label: string, extra = '') => `<button class="btn btn-small" data-act="${a}" data-id="${s.id}" ${extra}>${label}</button>`;
  return `<tr>
    <td><b>${esc(s.nameVi)}</b><br><span class="mono muted">${s.id}</span>${s.descriptionVi ? `<br><small class="muted">${esc(s.descriptionVi)}</small>` : ''}</td>
    <td>${esc(zoneName(data, s.zoneId))}<br><small class="muted">${s.road === 'main' ? 'Đường chính' : 'Nhánh'}</small></td>
    <td>${s.cols}×${s.rows}</td>
    <td><span class="badge mapm__status mapm__status--${tone}">${M.STATUS_LABEL[s.status]}</span></td>
    <td>${s.exitsOut} ra · ${s.exitsIn} vào</td>
    <td>${check}</td>
    <td><small>${s.updatedAt ? esc(new Date(s.updatedAt).toLocaleString('vi-VN')) : '—'}</small></td>
    <td class="mapm__acts">
      ${published ? `<a class="btn btn-small" href="#/adventure-maps/${s.id}">Sửa</a>` : btn('edit', 'Sửa', 'disabled title="Editor cho bản nháp: Map Builder GĐ6"')}
      ${btn('exits', 'Lối ra')}${btn('spawns', 'Điểm xuất hiện')}${btn('copy', 'Nhân bản')}${btn('rename', 'Đổi tên')}
      ${published ? '' : btn('toggle', s.status === 'disabled' ? 'Bật' : 'Tắt')}
      ${s.status === 'published' ? '' : btn('delete', s.status === 'changed' ? 'Bỏ nháp' : 'Xoá')}
    </td></tr>`;
}

function draw(root: HTMLElement) {
  const data = page.data!;
  const graph = graphProblems(data);
  const all = M.summaries(data).map((s) => ({ ...s, problems: [...s.problems, ...graph(s.id)] }));
  const q = page.query.trim().toLowerCase();
  const shown = all.filter((s) => (!page.zone || s.zoneId === page.zone) && (!page.status || s.status === page.status) && (!q || `${s.nameVi} ${s.id}`.toLowerCase().includes(q)));
  const count = (st: M.MapStatus) => all.filter((s) => s.status === st).length;
  root.innerHTML = `<h3>Quản lý map (Sobi Adventure)</h3>
    <p class="muted">${all.length} map · ${count('published') + count('changed')} đã publish (${count('changed')} có nháp) · ${count('draft')} nháp · ${count('disabled')} tạm tắt. Map đã publish không xoá, không tắt được (save người chơi còn giữ id).</p>
    ${page.message ? `<p class="ok">${esc(page.message)}</p>` : ''}
    <div class="toolbar">
      <input class="search" type="search" placeholder="Tìm tên hoặc id…" value="${esc(page.query)}" data-q />
      <select data-zone><option value="">Mọi vùng</option>${zoneOptions(data, page.zone)}</select>
      <select data-status><option value="">Mọi trạng thái</option>${(Object.keys(M.STATUS_LABEL) as M.MapStatus[]).map((st) => `<option value="${st}"${st === page.status ? ' selected' : ''}>${M.STATUS_LABEL[st]}</option>`).join('')}</select>
      <button class="btn btn-primary" data-new>＋ Tạo map mới</button>
    </div>
    <table class="table mapm"><thead><tr><th>Map</th><th>Vùng</th><th>Cỡ</th><th>Trạng thái</th><th>Kết nối</th><th>Kiểm tra</th><th>Cập nhật</th><th></th></tr></thead>
      <tbody>${shown.map((s) => rowHtml(data, s)).join('') || '<tr><td colspan="8" class="muted">Không có map khớp bộ lọc.</td></tr>'}</tbody></table>`;
  const rerender = () => draw(root);
  const q$ = root.querySelector<HTMLInputElement>('[data-q]')!;
  q$.addEventListener('input', () => {
    page.query = q$.value;
    rerender();
    const again = root.querySelector<HTMLInputElement>('[data-q]')!;
    again.focus();
    again.setSelectionRange(again.value.length, again.value.length);
  });
  root.querySelector<HTMLSelectElement>('[data-zone]')!.addEventListener('change', (e) => ((page.zone = (e.target as HTMLSelectElement).value), rerender()));
  root.querySelector<HTMLSelectElement>('[data-status]')!.addEventListener('change', (e) => ((page.status = (e.target as HTMLSelectElement).value as M.MapStatus | ''), rerender()));
  root.querySelector('[data-new]')!.addEventListener('click', () => openCreate(data, rerender));
  root.querySelectorAll<HTMLButtonElement>('[data-act]').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.id!;
      const run = {
        spawns: () => openSpawns(data, draftOf(data, id), (draft) => act(() => post(`${API}/draft`, { draft }), `Đã lưu điểm xuất hiện của ${draft.map.nameVi} (bản nháp).`, rerender)),
        exits: () => editExits(data, id, rerender),
        copy: () => openCreate(data, rerender, id),
        rename: () => openRename(data, id, rerender),
        toggle: () => void act(() => post(`${API}/meta`, { id, patch: { disabled: M.statusOf(data, id) !== 'disabled' } }), 'Đã đổi trạng thái.', rerender).catch((e: unknown) => alert((e as Error).message)),
        delete: () => askDelete(data, id, rerender),
      }[b.dataset.act as 'copy'];
      run?.();
    }),
  );
}

export function renderMapManage(root: HTMLElement) {
  if (page.data) return draw(root);
  root.innerHTML = '<p class="loading">Đang tải danh sách map…</p>';
  fetchData().then(
    (d) => {
      page.data = d;
      draw(root);
    },
    (e: unknown) => (root.innerHTML = `<p class="empty">Không tải được map (cần <code>npm run admin</code>): ${esc((e as Error).message)}</p>`),
  );
}
