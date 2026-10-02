// Source asset page: every image in asset/animals/asset/ with the concept it belongs to and whether
// the game uses it. Unused images can be copied into pigs/base/ (never over an existing file).
import { esc } from './labels';
import { importArt, state, type InventoryItem } from './store';

function statusOf(i: InventoryItem): [string, string] {
  if (i.identical) return ['ok', 'Đang dùng trong game'];
  if (state.rows.some((r) => r.artId === i.stem)) return ['ok', 'Đang dùng trong game'];
  if (i.inGame) return ['warn', i.version ? `Bản v${i.version} của concept đang dùng` : 'Khác bản đang dùng'];
  return ['new', 'Chưa dùng'];
}

function card(i: InventoryItem) {
  const [tone, label] = statusOf(i);
  const live = state.files.has(`pigs/base/${i.concept}.png`);
  const compare = i.inGame && !i.identical && live
    ? `<span class="compare"><img src="/assets/pigs/base/${esc(i.concept)}.png" alt="" loading="lazy" /><small>đang dùng</small></span>`
    : '';
  const canImport = tone !== 'ok' && state.apiOnline;
  return `<li class="src-card">
    <span class="src-card__imgs"><span class="compare"><img src="/asset/animals/asset/${esc(i.name)}" alt="" loading="lazy" /><small>nguồn</small></span>${compare}</span>
    <b>${esc(i.name)}</b>
    <small>Concept: ${esc(i.concept)}${i.version ? ` · v${esc(i.version)}` : ''}</small>
    <span class="badge status-${tone === 'new' ? 'warn' : tone}">${esc(label)}</span>
    ${canImport ? `<button class="btn btn-small" data-import="${esc(i.name)}" data-suggest="${esc(i.inGame ? i.stem : i.concept)}">Nhập vào game…</button>` : ''}
  </li>`;
}

export function renderAssets(root: HTMLElement) {
  const inv = state.inventory;
  const used = inv.filter((i) => statusOf(i)[0] === 'ok').length;
  root.innerHTML = `
    <div class="summary-row">
      <span class="badge status-ok">✓ ${used} đang dùng</span>
      <span class="badge status-warn">⚠ ${inv.length - used} chưa dùng / bản thay thế</span>
    </div>
    <p class="muted">Ảnh trong <code>asset/animals/asset/</code>. Mỗi heo là 1 ảnh 512² nhìn phải; trái = lật ngang khi chạy; trước/sau không sản xuất (chuẩn art §2).
      “Nhập vào game” chép ảnh sang <code>public/assets/pigs/base/&lt;art id&gt;.png</code> và không bao giờ ghi đè ảnh đang có; sau đó gán ảnh cho heo mới ở mục Heo.</p>
    ${state.apiOnline ? '' : '<p class="empty">Cần chạy <code>npm run admin</code> để đọc thư mục nguồn.</p>'}
    <ul class="src-grid">${inv.map(card).join('')}</ul>`;

  root.addEventListener('click', async (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-import]');
    if (!b) return;
    const artId = prompt('Art id mới (pig_ten, không trùng ảnh đang có):', b.dataset.suggest);
    if (!artId) return;
    try {
      await importArt(b.dataset.import!, artId.trim());
    } catch (err) {
      alert((err as Error).message);
    }
  });
}
