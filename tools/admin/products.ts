// Shop / products page (DECISIONS AD-1): the draft of src/core/config/products.ts — create, edit,
// activate/deactivate, price, icon, category, quantity, order, with a live card preview. Saving
// posts the draft; the dev API validates again and rewrites the PRODUCTS block the game reads.
import { ITEM_ID_VALUES } from '../../src/core/config/ids';
import { ITEMS } from '../../src/core/config/items';
import { CURRENCY_VALUES, PRODUCT_CATEGORY_VALUES, PRODUCTS, type ProductDef } from '../../src/core/config/products';
import { productIssues, type Issue } from '../../scripts/admin/rules';
import { esc, gold } from './labels';
import { mountList } from './listKit';
import { byNumber, byText, reverse } from './listQuery';
import { confirmDanger, openModal } from './modal';
import { post, rememberMessage, state } from './store';

export const CATEGORY_LABEL: Record<string, string> = { FOOD: 'Thức ăn', MEDICINE: 'Thuốc', SUPPLY: 'Vật dụng', SPECIAL: 'Đặc biệt' };
const ITEM_LABEL: Record<string, string> = { FOOD_BASIC: 'Thức ăn (FOOD_BASIC)', MEDICINE_COMMON: 'Thuốc (MEDICINE_COMMON)' };

const draft = { rows: PRODUCTS.map((p) => ({ ...p })) as ProductDef[], dirty: false, saving: false };
const shipped = new Set(PRODUCTS.map((p) => p.id));

const issues = (): Issue[] =>
  productIssues(draft.rows, {
    itemIds: ITEM_ID_VALUES,
    categories: PRODUCT_CATEGORY_VALUES,
    currencies: CURRENCY_VALUES,
    assetIds: new Set(state.art.map((a) => a.id)),
    shippedIds: [...shipped],
  });
const iconUrl = (id: string) => state.art.find((a) => a.id === id)?.url ?? null;

/** The card as the game's shop draws it (icon, name, description, price, owned, buy). */
function preview(p: ProductDef) {
  const url = iconUrl(p.icon);
  const unit = Math.round((p.priceGold / Math.max(1, p.quantity)) * 10) / 10;
  return `<div class="shop-preview${p.active ? '' : ' is-off'}">
    <div class="shop-preview__pic">${url ? `<img src="${esc(url)}" alt="" />` : '✕'}</div>
    <div><b>${esc(p.nameVi || 'Tên sản phẩm')}</b><p>${esc(p.descVi)}</p>
      <p class="shop-preview__price">🪙 ${gold(p.priceGold || 0)}${p.quantity > 1 ? ` · ${p.quantity} cái (${unit}/cái)` : ''}</p>
      <span class="btn btn-small btn-primary">Mua</span>${p.active ? '' : ' <span class="badge status-warn">Ngừng bán</span>'}</div>
  </div>`;
}

const opt = (values: readonly string[], labels: Record<string, string>, cur: string) =>
  values.map((v) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(labels[v] ?? v)}</option>`).join('');

function readForm(f: HTMLFormElement, base: ProductDef): ProductDef {
  const d = new FormData(f);
  const s = (k: string) => String(d.get(k) ?? '').trim();
  return {
    id: base.id || s('id').toUpperCase(),
    nameVi: s('nameVi'),
    descVi: s('descVi'),
    category: s('category') as ProductDef['category'],
    currency: s('currency') as ProductDef['currency'],
    itemId: s('itemId') as ProductDef['itemId'],
    quantity: Number(s('quantity')),
    priceGold: Number(s('priceGold')),
    icon: s('icon'),
    sortOrder: Number(s('sortOrder')),
    active: d.get('active') === 'on',
  };
}

function openEditor(existing: ProductDef | null, redraw: () => void) {
  const maxOrder = Math.max(0, ...draft.rows.map((p) => p.sortOrder));
  let p: ProductDef = existing ? { ...existing } : {
    id: '', nameVi: '', descVi: '', category: 'FOOD', currency: 'GOLD', itemId: 'FOOD_BASIC', quantity: 10,
    priceGold: ITEMS.FOOD_BASIC.priceGold * 10, icon: 'ui_btn_fill_trough', sortOrder: maxOrder + 10, active: true,
  };
  const icons = state.art.filter((a) => a.url && (a.section === 'ui' || a.section === 'props'));
  openModal({
    title: existing ? `Sửa ${existing.nameVi}` : 'Sản phẩm mới',
    submit: existing ? 'Áp dụng' : 'Thêm vào bản nháp',
    body: `<div class="split">
      <div class="form-grid">
        <label class="field"><span>ID</span><input name="id" value="${esc(p.id)}" ${existing ? 'readonly' : 'required'} placeholder="FOOD_PACK_10" /></label>
        <label class="field"><span>Tên</span><input name="nameVi" value="${esc(p.nameVi)}" required /></label>
        <label class="field span-2"><span>Mô tả</span><input name="descVi" value="${esc(p.descVi)}" /></label>
        <label class="field"><span>Danh mục</span><select name="category">${opt(PRODUCT_CATEGORY_VALUES, CATEGORY_LABEL, p.category)}</select></label>
        <label class="field"><span>Loại tiền</span><select name="currency">${opt(CURRENCY_VALUES, { GOLD: 'Vàng' }, p.currency)}</select></label>
        <label class="field"><span>Vật phẩm nhận được</span><select name="itemId">${opt(ITEM_ID_VALUES, ITEM_LABEL, p.itemId)}</select></label>
        <label class="field"><span>Số lượng mỗi lần mua</span><input type="number" name="quantity" min="1" max="999" step="1" value="${p.quantity}" /></label>
        <label class="field"><span>Giá (vàng)</span><input type="number" name="priceGold" min="1" step="1" value="${p.priceGold}" /></label>
        <label class="field"><span>Thứ tự hiển thị (nhỏ → trước)</span><input type="number" name="sortOrder" step="1" value="${p.sortOrder}" /></label>
        <label class="field span-2"><span>Icon / asset</span><select name="icon">${icons.map((a) => `<option value="${esc(a.id)}"${a.id === p.icon ? ' selected' : ''}>${esc(a.id)}</option>`).join('')}</select></label>
        <label class="check"><input type="checkbox" name="active" ${p.active ? 'checked' : ''} /> Đang bán</label>
      </div>
      <div><p class="muted">Xem trước trong shop</p><div data-preview>${preview(p)}</div>
        <p class="muted" data-unit></p></div>
    </div>`,
    onOpen: (f) => {
      const update = () => {
        p = readForm(f, existing ?? p);
        f.querySelector('[data-preview]')!.innerHTML = preview(p);
        const base = ITEMS[p.itemId]?.priceGold ?? 0;
        f.querySelector('[data-unit]')!.textContent = `Giá gốc 1 ${p.itemId}: ${gold(base)} vàng (đổ máng tính theo giá gốc).`;
      };
      f.addEventListener('input', update);
      update();
    },
    onSubmit: (f) => {
      const next = readForm(f, existing ?? p);
      if (!existing && draft.rows.some((r) => r.id === next.id)) return `ID ${next.id} đã tồn tại`;
      const errs = productIssues([next], { itemIds: ITEM_ID_VALUES, categories: PRODUCT_CATEGORY_VALUES, currencies: CURRENCY_VALUES, assetIds: new Set(state.art.map((a) => a.id)), shippedIds: [] })
        .filter((i) => i.level === 'error');
      if (errs.length) return errs.map((i) => i.text).join(' · ');
      const i = draft.rows.findIndex((r) => r.id === next.id);
      if (i < 0) draft.rows.push(next);
      else draft.rows[i] = next;
      draft.dirty = true;
      redraw();
    },
  });
}

function row(p: ProductDef) {
  const url = iconUrl(p.icon);
  const canDelete = !shipped.has(p.id);
  return `<tr class="${p.active ? '' : 'is-off'}">
    <td>${url ? `<img class="thumb" src="${esc(url)}" alt="" />` : ''}</td>
    <td><b>${esc(p.nameVi)}</b><br /><small class="mono">${esc(p.id)}</small></td>
    <td>${esc(CATEGORY_LABEL[p.category] ?? p.category)}</td>
    <td>${esc(p.itemId)} ×${p.quantity}</td>
    <td class="num">${gold(p.priceGold)}</td>
    <td class="num">${p.sortOrder}</td>
    <td>${p.active ? '<span class="badge status-ok">Đang bán</span>' : '<span class="badge status-warn">Ngừng bán</span>'}</td>
    <td class="row-actions">
      <button class="btn btn-small" data-edit="${esc(p.id)}">✏️ Sửa</button>
      <button class="btn btn-small" data-toggle="${esc(p.id)}">${p.active ? '⏸ Ngừng bán' : '▶ Bán lại'}</button>
      <button class="btn btn-small" data-del="${esc(p.id)}" ${canDelete ? '' : 'disabled title="Đã phát hành: save có thể tham chiếu — chỉ ngừng bán"'}>🗑</button>
    </td></tr>`;
}

async function save() {
  draft.saving = true;
  try {
    await post('/__admin/products', { rows: draft.rows });
    draft.dirty = false;
    rememberMessage(`Đã lưu ${draft.rows.length} sản phẩm vào game (src/core/config/products.ts).`);
  } catch (e) {
    state.message = { kind: 'error', text: (e as Error).message };
  } finally {
    draft.saving = false;
  }
}

export function renderProducts(root: HTMLElement, rerender: () => void) {
  const all = issues();
  const errors = all.filter((i) => i.level === 'error');
  const shopPigs = state.rows.filter((r) => r.buyGold != null && r.enabled !== false).length;
  root.innerHTML = `
    <div class="summary-row">
      <span class="badge status-ok">🛒 ${draft.rows.filter((p) => p.active).length} đang bán</span>
      <span class="badge status-warn">⏸ ${draft.rows.filter((p) => !p.active).length} ngừng bán</span>
      <a class="badge status-new" href="#/pigs?status=shop">🐷 ${shopPigs} heo bán trong shop (quản lý ở mục Heo)</a>
    </div>
    <div class="savebar">
      ${draft.dirty ? '<span class="badge status-warn">Chưa lưu</span><button class="btn" data-discard>Huỷ thay đổi</button>' : ''}
      <button class="btn btn-primary" data-save ${!draft.dirty || !state.apiOnline || errors.length ? 'disabled' : ''}>${draft.saving ? 'Đang lưu…' : '💾 Lưu sản phẩm vào game'}</button>
    </div>
    ${all.filter((i) => i.level !== 'info').length ? `<ul class="issues">${all.filter((i) => i.level !== 'info').map((i) => `<li class="issue ${i.level}">${esc(i.speciesId ?? '')} ${esc(i.text)}</li>`).join('')}</ul>` : ''}
    <div data-list></div>`;
  mountList(root.querySelector<HTMLElement>('[data-list]')!, {
    id: 'products',
    items: () => draft.rows,
    text: (p) => [p.id, p.nameVi, p.descVi, p.itemId, CATEGORY_LABEL[p.category]],
    filters: [
      { key: 'category', label: 'Mọi danh mục', options: PRODUCT_CATEGORY_VALUES.map((c) => [c, CATEGORY_LABEL[c] ?? c] as const), test: (p, v) => p.category === v },
      { key: 'active', label: 'Mọi trạng thái', options: [['on', 'Đang bán'], ['off', 'Ngừng bán']], test: (p, v) => (v === 'on') === p.active },
      { key: 'item', label: 'Mọi vật phẩm', options: ITEM_ID_VALUES.map((i) => [i, ITEM_LABEL[i] ?? i] as const), test: (p, v) => p.itemId === v },
    ],
    sorts: [
      { key: 'order', label: 'Thứ tự hiển thị', compare: byNumber((p) => p.sortOrder) },
      { key: 'az', label: 'Tên A-Z', compare: byText((p) => p.nameVi) },
      { key: 'za', label: 'Tên Z-A', compare: reverse(byText((p) => p.nameVi)) },
      { key: 'cheap', label: 'Giá thấp → cao', compare: byNumber((p) => p.priceGold) },
      { key: 'dear', label: 'Giá cao → thấp', compare: reverse(byNumber((p) => p.priceGold)) },
    ],
    pageSize: 50,
    placeholder: 'Tìm tên, ID, mô tả…',
    noun: 'sản phẩm',
    resultsClass: 'table-wrap',
    actions: `<button class="btn btn-primary" data-new type="button" ${state.apiOnline ? '' : 'disabled'}>＋ Thêm sản phẩm</button>`,
    render: (rows) => `<table class="table"><thead><tr><th></th><th>Sản phẩm</th><th>Danh mục</th><th>Nhận</th><th>Giá</th><th>Thứ tự</th><th>Trạng thái</th><th></th></tr></thead>
      <tbody>${rows.map(row).join('')}</tbody></table>`,
    bind: (el) => {
      const find = (id: string) => draft.rows.find((p) => p.id === id)!;
      el.querySelectorAll<HTMLElement>('[data-edit]').forEach((b) => b.addEventListener('click', () => openEditor(find(b.dataset.edit!), rerender)));
      el.querySelectorAll<HTMLElement>('[data-toggle]').forEach((b) =>
        b.addEventListener('click', () => {
          const p = find(b.dataset.toggle!);
          p.active = !p.active;
          draft.dirty = true;
          rerender();
        }),
      );
      el.querySelectorAll<HTMLElement>('[data-del]').forEach((b) =>
        b.addEventListener('click', () =>
          confirmDanger('Xoá sản phẩm', `Xoá ${b.dataset.del} khỏi bản nháp? (sản phẩm chưa phát hành)`, 'Xoá', () => {
            draft.rows = draft.rows.filter((p) => p.id !== b.dataset.del);
            draft.dirty = true;
            rerender();
          }),
        ),
      );
    },
  });
  root.querySelector('[data-new]')?.addEventListener('click', () => openEditor(null, rerender));
  root.querySelector('[data-save]')?.addEventListener('click', () => void save().then(rerender));
  root.querySelector('[data-discard]')?.addEventListener('click', () => {
    draft.rows = PRODUCTS.map((p) => ({ ...p }));
    draft.dirty = false;
    rerender();
  });
}

export const productsDirty = () => draft.dirty;
