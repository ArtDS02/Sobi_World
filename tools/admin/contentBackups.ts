// "Sao lưu" of a content file (plan step 7.2): the automatic copies the dev API keeps before each overwrite, with a restore
// button. A restore goes through the same checks as any save (schema, shipped ids), so it can be refused; the reason shows.
import { esc } from './labels';
import { openModal } from './modal';
import { json, post, rememberMessage } from './store';

interface Backup {
  name: string;
  at: number;
  size: number;
}

const when = (at: number) => new Date(at).toLocaleString('vi-VN');

export async function openBackups(file: string): Promise<void> {
  let list: Backup[] = [];
  let failed = '';
  try {
    list = (await json<{ backups: Backup[] }>(`/__admin/content/backups?file=${encodeURIComponent(file)}`)).backups;
  } catch (e) {
    failed = (e as Error).message;
  }
  const body = failed
    ? `<p class="status-error">Không đọc được danh sách: ${esc(failed)}</p>`
    : list.length === 0
      ? '<p class="muted">Chưa có bản sao lưu: bản đầu tiên được tạo ngay trước lần lưu kế tiếp.</p>'
      : `<p class="muted">Mỗi lần lưu, bản cũ được giữ lại (tối đa 20 bản mới nhất). Khôi phục = lưu lại bản đó, vẫn qua mọi kiểm tra của game.</p>
        <table class="table"><tbody>${list.map((b) => `<tr><td>${esc(when(b.at))}</td><td>${(b.size / 1024).toFixed(1)} KB</td>
          <td><button type="button" class="btn" data-restore="${esc(b.name)}">↺ Khôi phục</button></td></tr>`).join('')}</tbody></table>`;
  openModal({
    title: `🕘 Sao lưu: ${file}`,
    body,
    submit: 'Đóng',
    wide: true,
    onSubmit: () => undefined,
    onOpen: (form) => {
      form.querySelectorAll<HTMLButtonElement>('[data-restore]').forEach((btn) =>
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try {
            await post('/__admin/content/restore', { file, name: btn.dataset.restore });
            rememberMessage(`Đã khôi phục ${file} từ bản ${btn.dataset.restore}.`);
            location.reload(); // every page reads the restored file afresh
          } catch (e) {
            btn.disabled = false;
            form.querySelector('.modal__error')?.replaceChildren(document.createTextNode((e as Error).message));
            form.querySelector<HTMLElement>('.modal__error')!.hidden = false;
          }
        }),
      );
    },
  });
}
