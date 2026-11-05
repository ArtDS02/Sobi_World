// Admin "Quản lý map" (decision 047, Map Builder GĐ2): every area of Sobi Adventure, published or draft, in one table — search and
// filter by zone and status; create an area (blank or from a template), copy one, rename it, note what it is for, put a draft aside,
// delete a draft (listing the exits that lead to it first). Every change lands in a draft (tools/admin/data/adventure, through the dev
// API) and never in the game until it is published. The operations themselves live in mapModel.ts.
import { esc } from './labels';
import { MAP_API as API, editExits, editSpawns, fetchBuilder as fetchData } from './mapApi';
import { editorIssues } from './mapIssues';
import { graphProblems } from './mapLinks';
import * as M from './mapModel';
import { confirmDanger, openModal } from './modal';
import { openHistory, openPublish } from './mapPublishDialog';
import { openSimulation } from './mapSimulate';
import { imageOf, mapThumb } from './mapThumb';
import { optionHtml, type Visual } from './richSelect';
import { post } from './store';

const page = {
  data: null as M.BuilderData | null,
  error: null as string | null,
  message: null as string | null,
  query: '',
  zone: '',
  status: '' as M.MapStatus | '',
};

const zoneName = (data: M.BuilderData, id: string) => data.zones.find((z) => z.id === id)?.nameVi ?? id;
const mapOf = (data: M.BuilderData, id: string) => M.workingMaps(data).find((m) => m.id === id)!;

const draftOf = M.draftOf;

async function act(run: () => Promise<unknown>, done: string, rerender: () => void) {
  await run();
  page.data = await fetchData();
  page.message = done;
  rerender();
}

/** A zone's card picture, a status's mark: the visuals of the dropdowns of the Map Builder pages. */
export const zoneVisual = (data: M.BuilderData, id: string): Visual => {
  const z = data.zones.find((x) => x.id === id);
  return z ? { img: imageOf(z.backdrop), sub: `${z.maps.length + (z.branches?.length ?? 0)} map` } : {};
};
export const STATUS_ICON: Record<M.MapStatus, string> = { published: '✅', changed: '✏️', draft: '📝', disabled: '⏸️' };
const zoneOptions = (data: M.BuilderData, selected: string) =>
  data.zones.map((z) => optionHtml(z.id, z.nameVi, z.id === selected, zoneVisual(data, z.id))).join('');

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
      <label class="field"><span>Vùng</span><select name="zoneId" data-rich>${zoneOptions(data, src?.zoneId ?? data.zones[0]?.id ?? '')}</select></label>
      <label class="field"><span>Vị trí trong vùng</span><select name="road" data-rich>${optionHtml('branch', 'Nhánh phụ', true, { icon: '🌿', sub: 'Khám phá thêm, không chặn đường tới trùm' })}${optionHtml('main', 'Đường chính', false, { icon: '🛤️', sub: 'Nằm trên đường tới trùm vùng' })}</select></label>
      <label class="field"><span>Bắt đầu từ</span><select name="from" data-rich>${optionHtml('', 'Map trống', !from, { icon: '⬜', sub: 'Viền chặn, đất ở giữa' })}${working.map((m) => optionHtml(m.id, `Mẫu: ${m.nameVi}`, m.id === from, { img: mapThumb(m), mapId: m.id, sub: `${m.cols}×${m.rows} ô` })).join('')}</select></label>
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

/** The actions of a row past "Sửa" and "Chạy thử", as a menu (one line per row, aligned). */
function moreMenu(s: M.MapSummary): string {
  const published = s.status === 'published' || s.status === 'changed';
  type Item = [action: string, icon: string, label: string, sub: string];
  const items: Item[] = [
    ['exits', '🚪', 'Lối ra', 'Nối với map khác'],
    ['spawns', '📍', 'Điểm xuất hiện', 'Nơi người chơi tới'],
    ['copy', '⧉', 'Nhân bản', 'Map mới từ map này'],
    ['rename', '✎', 'Đổi tên / mô tả', ''],
  ];
  if (s.status === 'changed' || s.status === 'draft') items.push(['publish', '✔', 'Kiểm tra & Publish', 'Đưa vào game']);
  if (published) items.push(['history', '🕘', 'Lịch sử', 'Quay lại bản cũ']);
  else items.push(['toggle', s.status === 'disabled' ? '▶' : '⏸', s.status === 'disabled' ? 'Bật lại' : 'Tạm tắt', 'Chỉ bản nháp']);
  if (s.status !== 'published') items.push(['delete', '🗑', s.status === 'changed' ? 'Bỏ bản nháp' : 'Xoá map nháp', '']);
  return `<select class="mapm__more" data-act-menu data-id="${s.id}" data-rich="compact" aria-label="Thêm thao tác">${optionHtml('', 'Thêm', true, { icon: '⋯', label: true })}${items.map(([v, icon, label, sub]) => optionHtml(v, label, false, { icon, sub })).join('')}</select>`;
}

function rowHtml(data: M.BuilderData, s: M.MapSummary): string {
  const published = s.status === 'published' || s.status === 'changed';
  const tone = s.status === 'disabled' ? 'warn' : published ? 'ok' : 'new';
  const check = s.problems.length ? `<span class="status-error" title="${esc(s.problems.join('\n'))}">⚠ ${s.problems.length} lỗi</span>` : '<span class="status-ok">✓ Ổn</span>';
  const map = M.workingMaps(data).find((m) => m.id === s.id)!;
  return `<tr>
    <td class="mapm__thumb"><a href="#/adventure-editor/${s.id}" title="Mở Map Editor"><img data-map-thumb="${s.id}" src="${mapThumb(map)}" alt="" /></a></td>
    <td><b>${esc(s.nameVi)}</b><div class="mono muted">${s.id}</div>${s.descriptionVi ? `<small class="muted">${esc(s.descriptionVi)}</small>` : ''}</td>
    <td>${esc(zoneName(data, s.zoneId))}<div class="muted"><small>${s.road === 'main' ? 'Đường chính' : 'Nhánh'}</small></div></td>
    <td class="mapm__num">${s.cols}×${s.rows}</td>
    <td><span class="badge mapm__status mapm__status--${tone}">${STATUS_ICON[s.status]} ${M.STATUS_LABEL[s.status]}</span></td>
    <td class="mapm__num">${s.exitsOut} ra · ${s.exitsIn} vào</td>
    <td>${check}</td>
    <td><small>${s.updatedAt ? esc(new Date(s.updatedAt).toLocaleString('vi-VN')) : '—'}</small></td>
    <td><div class="mapm__acts">
      <a class="btn btn-small btn-primary" href="#/adventure-editor/${s.id}">Sửa</a>
      <button class="btn btn-small" data-act="simulate" data-id="${s.id}">▶ Chạy thử</button>
      ${moreMenu(s)}
    </div></td></tr>`;
}

function draw(root: HTMLElement) {
  const data = page.data!;
  const graph = graphProblems(data);
  const working = M.workingMaps(data);
  const publishedIds = new Set(data.published.map((m) => m.id));
  // The editor's own checks in Vietnamese: what a publish refuses or warns about (hints left out here).
  const problemsOf = (id: string) => {
    const map = working.find((m) => m.id === id)!;
    return editorIssues({ map, maps: working, graph: graph(id), published: data.published.find((m) => m.id === id) ?? null, publishedIds })
      .filter((i) => i.level !== 'info')
      .map((i) => `${i.level === 'warn' ? '⚠ ' : ''}${i.name}: ${i.message}${i.x !== undefined ? ` (ô ${i.x}, ${i.y})` : ''}`);
  };
  const all = M.summaries(data).map((s) => ({ ...s, problems: problemsOf(s.id) }));
  const q = page.query.trim().toLowerCase();
  const shown = all.filter((s) => (!page.zone || s.zoneId === page.zone) && (!page.status || s.status === page.status) && (!q || `${s.nameVi} ${s.id}`.toLowerCase().includes(q)));
  const count = (st: M.MapStatus) => all.filter((s) => s.status === st).length;
  root.innerHTML = `<h3>Quản lý map (Sobi Adventure)</h3>
    <p class="muted">${all.length} map · ${count('published') + count('changed')} đã publish (${count('changed')} có nháp) · ${count('draft')} nháp · ${count('disabled')} tạm tắt. Map đã publish không xoá, không tắt được (save người chơi còn giữ id).</p>
    ${page.message ? `<p class="ok">${esc(page.message)}</p>` : ''}
    <div class="toolbar">
      <input class="search" type="search" placeholder="Tìm tên hoặc id…" value="${esc(page.query)}" data-q />
      <span class="mapm__filter"><select data-zone data-rich="compact">${optionHtml('', 'Mọi vùng', !page.zone, { icon: '🗺️' })}${zoneOptions(data, page.zone)}</select></span>
      <span class="mapm__filter"><select data-status data-rich="compact">${optionHtml('', 'Mọi trạng thái', !page.status, { icon: '📋' })}${(Object.keys(M.STATUS_LABEL) as M.MapStatus[]).map((st) => optionHtml(st, M.STATUS_LABEL[st], st === page.status, { icon: STATUS_ICON[st] })).join('')}</select></span>
      <button class="btn" data-publish>✔ Kiểm tra & Publish</button>
      <button class="btn btn-primary" data-new>＋ Tạo map mới</button>
    </div>
    <div class="mapm-wrap"><table class="table mapm"><thead><tr><th></th><th>Map</th><th>Vùng</th><th>Cỡ</th><th>Trạng thái</th><th>Kết nối</th><th>Kiểm tra</th><th>Cập nhật</th><th></th></tr></thead>
      <tbody>${shown.map((s) => rowHtml(data, s)).join('') || '<tr><td colspan="9" class="muted">Không có map khớp bộ lọc.</td></tr>'}</tbody></table></div>`;
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
  root.querySelector('[data-publish]')!.addEventListener('click', () => openPublish(data));
  const runAct = (action: string, id: string) => {
    const run = {
      spawns: () => editSpawns(data, draftOf(data, id), (msg) => act(async () => {}, msg, rerender)),
      exits: () => editExits(data, id, (msg) => act(async () => {}, msg, rerender)),
      copy: () => openCreate(data, rerender, id),
      simulate: () => openSimulation(data, id),
      history: () => void openHistory(data, id, (msg) => act(async () => {}, msg, rerender)).catch((e: unknown) => alert((e as Error).message)),
      publish: () => openPublish(data, [id]),
      rename: () => openRename(data, id, rerender),
      toggle: () => void act(() => post(`${API}/meta`, { id, patch: { disabled: M.statusOf(data, id) !== 'disabled' } }), 'Đã đổi trạng thái.', rerender).catch((e: unknown) => alert((e as Error).message)),
      delete: () => askDelete(data, id, rerender),
    }[action as 'copy'];
    run?.();
  };
  root.querySelectorAll<HTMLButtonElement>('button[data-act]').forEach((b) => b.addEventListener('click', () => runAct(b.dataset.act!, b.dataset.id!)));
  root.querySelectorAll<HTMLSelectElement>('select[data-act-menu]').forEach((sel) =>
    sel.addEventListener('change', () => {
      const act = sel.value;
      sel.value = '';
      if (act) runAct(act, sel.dataset.id!);
    }),
  );
}

export function renderMapManage(root: HTMLElement) {
  // Read again on every visit: another page ("Mạng map") may have changed drafts.
  if (!page.data) root.innerHTML = '<p class="loading">Đang tải danh sách map…</p>';
  else draw(root);
  fetchData().then(
    (d) => {
      page.data = d;
      draw(root);
    },
    (e: unknown) => (root.innerHTML = `<p class="empty">Không tải được map (cần <code>npm run admin</code>): ${esc((e as Error).message)}</p>`),
  );
}
