// "Kiểm tra & Publish" of the Map Builder (decision 047, GĐ7): pick the drafts to publish (a connection between two new areas goes
// together), see every check on the world as it would be — errors keep the button off, warnings only inform — and give the English of
// every new or changed text. Publishing writes the game's files all or nothing on the dev API; the dashboard then reloads. Also the
// history of an area: an earlier published version comes back as its draft.
import enTexts from '../../content/i18n/en.json';
import { esc } from './labels';
import { MAP_API } from './mapApi';
import * as M from './mapModel';
import { blockingChecks, planPublish, publishable, MAPS_FILE, type PublishPlan } from './mapPublish';
import { openModal } from './modal';
import { json, post, reloadSoon, rememberMessage } from './store';

const EN = ((enTexts as Record<string, Record<string, string>>)[MAPS_FILE] ?? {}) as Record<string, string>;

/** Opens the dialog with `preselect` ticked (default: every draft that can be published). */
export function openPublish(data: M.BuilderData, preselect?: readonly string[]) {
  const all = publishable(data);
  const chosen = new Set(preselect?.filter((id) => all.includes(id)) ?? all);
  const answers: Record<string, string> = {};
  const name = (id: string) => data.drafts[id]?.map.nameVi ?? id;
  let plan: PublishPlan = planPublish(data, [...chosen], EN);

  openModal({
    title: 'Kiểm tra & Publish',
    submit: 'Publish vào game',
    wide: true,
    body: '<div data-pub></div>',
    onOpen: (form) => {
      const host = form.querySelector<HTMLElement>('[data-pub]')!;
      const button = form.querySelector<HTMLButtonElement>('[type=submit]')!;
      const paint = () => {
        plan = planPublish(data, [...chosen], EN);
        const blocking = blockingChecks(plan, answers);
        const errors = plan.checks.filter((c) => c.level === 'error');
        const warns = plan.checks.filter((c) => c.level === 'warn');
        button.disabled = plan.ids.length === 0 || blocking.length > 0;
        host.innerHTML = `${all.length === 0 ? '<p class="muted">Không có bản nháp nào để publish.</p>' : ''}
          <div class="mpub__drafts">${all
            .map((id) => `<label class="check"><input type="checkbox" data-pick="${id}"${chosen.has(id) ? ' checked' : ''}/> <b>${esc(name(id))}</b> <span class="mono muted">${id}</span> <span class="badge mapm__status mapm__status--${M.isPublished(data, id) ? 'ok' : 'new'}">${M.isPublished(data, id) ? 'sửa map đã publish' : 'map mới'}</span></label>`)
            .join('')}</div>
          <p>${plan.ids.length} map được publish${plan.changed.length > plan.ids.length ? ` · ${plan.changed.length - plan.ids.length} map khác chỉ cập nhật điểm tới của lối ra` : ''}.</p>
          <h4>${errors.length ? `⛔ Lỗi (${errors.length}) — sửa xong mới publish được` : '✓ Không có lỗi'}</h4>
          ${errors.length ? `<ul class="amap__problems">${errors.map((c) => `<li>${esc(c.text)}</li>`).join('')}</ul>` : ''}
          ${warns.length ? `<h4>⚠ Cảnh báo (${warns.length})</h4><ul class="mpub__warns">${warns.map((c) => `<li>${esc(c.text)}</li>`).join('')}</ul>` : ''}
          ${plan.english.length ? `<h4>Tiếng Anh (${plan.english.length}) — game có bản tiếng Anh</h4><div class="mpub__en">${plan.english
            .map((t) => `<label class="field"><span>${esc(t.vi)}${t.stale ? ' <em>(tiếng Việt đã đổi)</em>' : ''} <small class="mono muted">${esc(t.path)}</small></span><input data-en="${esc(t.path)}" value="${esc(answers[t.path] ?? t.en)}" /></label>`)
            .join('')}</div>` : ''}`;
        host.querySelectorAll<HTMLInputElement>('[data-pick]').forEach((c) => c.addEventListener('change', () => {
          if (c.checked) chosen.add(c.dataset.pick!);
          else chosen.delete(c.dataset.pick!);
          paint();
        }));
        host.querySelectorAll<HTMLInputElement>('[data-en]').forEach((i) => i.addEventListener('input', () => {
          answers[i.dataset.en!] = i.value;
          button.disabled = plan.ids.length === 0 || blockingChecks(plan, answers).length > 0;
        }));
      };
      paint();
    },
    onSubmit: async () => {
      const blocking = blockingChecks(plan, answers);
      if (blocking.length) return blocking.map((c) => c.text).join('\n');
      const english = Object.fromEntries(plan.english.map((t) => [t.path, (answers[t.path] ?? t.en).trim()]));
      const r = await post<{ published: string[]; moved: string[] }>(`${MAP_API}/publish`, { ids: plan.ids, english });
      rememberMessage(`Đã publish ${r.published.length} map vào game${r.moved.length ? ` (${r.moved.length} lối ra cập nhật điểm tới)` : ''}. Bản cũ ở Lịch sử.`);
      reloadSoon();
    },
  });
}

/** The earlier published versions of an area; one comes back as its draft. */
export async function openHistory(data: M.BuilderData, id: string, done: (message: string) => Promise<void>) {
  const { versions } = await json<{ versions: string[] }>(`${MAP_API}/history?id=${encodeURIComponent(id)}`);
  const map = M.workingMaps(data).find((m) => m.id === id)!;
  openModal({
    title: `Lịch sử · ${map.nameVi}`,
    submit: 'Đóng',
    body: versions.length
      ? `<p class="muted">Mỗi lần publish, bản đang chơi trước đó được giữ ở đây. "Đưa về nháp" chép bản đó thành bản nháp (ghi đè nháp hiện có), rồi publish như thường.</p>
        <ul class="mpub__history">${versions.map((at) => `<li>${esc(new Date(at).toLocaleString('vi-VN'))} <button type="button" class="btn btn-small" data-at="${esc(at)}">Đưa về nháp</button></li>`).join('')}</ul>`
      : '<p class="muted">Chưa có phiên bản cũ (map chưa publish lại lần nào từ Map Builder).</p>',
    onOpen: (form) =>
      form.querySelectorAll<HTMLButtonElement>('[data-at]').forEach((b) =>
        b.addEventListener('click', async () => {
          if (data.drafts[id] && !confirm('Bản nháp hiện có của map này sẽ bị thay. Tiếp tục?')) return;
          await post(`${MAP_API}/restore`, { id, at: b.dataset.at });
          form.querySelector<HTMLButtonElement>('[data-mclose]')?.click();
          await done(`Đã đưa bản ${new Date(b.dataset.at!).toLocaleString('vi-VN')} của ${map.nameVi} về bản nháp.`);
        }),
      ),
    onSubmit: () => undefined,
  });
}

/**
 * The area in the game's own renderer: the world as a publish of `ids` would make it, photographed in Electron on a throw-away save
 * (the whole area and the arrival view). Takes half a minute or so the first time.
 */
export function openPreview(ids: readonly string[], mapId: string) {
  openModal({
    title: 'Xem bằng game thật',
    submit: 'Đóng',
    wide: true,
    body: '<div data-shots><p class="loading">Đang dựng map trong game (Electron, save tạm)… có thể mất 30–60 giây.</p></div>',
    onOpen: (form) => {
      const host = form.querySelector<HTMLElement>('[data-shots]')!;
      post<{ shots: string[] }>(`${MAP_API}/preview`, { ids, mapId }).then(
        (r) => {
          host.innerHTML = r.shots.length
            ? `<p class="muted">Ảnh chụp từ renderer của game (sắp xếp chiều sâu, lớp che, asset, ánh sáng). Đi thử và va chạm: dùng "Chạy thử".</p>${r.shots.map((u) => `<a href="${u}" target="_blank"><img class="mpub__shot" src="${u}" alt="" /></a>`).join('')}`
            : '<p class="status-error">Không có ảnh nào được chụp.</p>';
        },
        (e: unknown) => (host.innerHTML = `<pre class="status-error">${esc((e as Error).message)}</pre>`),
      );
    },
    onSubmit: () => undefined,
  });
}
