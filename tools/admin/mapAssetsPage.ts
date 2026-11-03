// Admin "Thư viện asset" (decision 047, Map Builder GĐ6b): the decorations every area shares (content/adventure/scenery.json) — a
// picture, its name in both languages, a category, its drawn width, which tiles under its foot block the way and how it stands. Find
// and filter them, see where each is placed, change one (every placement follows: an area keeps only where it stands and what it
// overrides), add one from a picture already in the game or upload a new PNG, delete one placed nowhere. The page reloads after a save.
import enTexts from '../../content/i18n/en.json';
import { SCENERY_CATEGORIES, SCENERY_MODES } from '../../content/schemas/adventure/scenery';
import { DECOR_LIST, type DecorAsset } from '../../src/areas/adventure/logic/config/content';
import { esc } from './labels';
import { slugOf } from './mapModel';
import { confirmDanger, openModal } from './modal';
import { optionHtml } from './richSelect';
import { artUrl, json, post, reloadSoon, rememberMessage, state } from './store';

const API = '/__admin/adventure/assets';
const CATEGORY_LABEL: Record<(typeof SCENERY_CATEGORIES)[number], string> = {
  tree: 'Cây',
  bush: 'Bụi',
  rock: 'Đá',
  building: 'Nhà',
  ruin: 'Tàn tích',
  water: 'Nước',
  flower: 'Hoa',
  light: 'Đèn / sáng',
  cover: 'Lớp che',
  other: 'Khác',
};
const MODE_LABEL: Record<(typeof SCENERY_MODES)[number], string> = { normal: 'Nằm trên đất', occluder: 'Che theo chân', foreground: 'Luôn ở trên', cover: 'Lớp che (mờ khi tới gần)' };

const page = { query: '', category: '', use: null as Record<string, string[]> | null };
const enName = (id: string) => (enTexts as Record<string, Record<string, string>>)['adventure/scenery.json']?.[`assets/${id}/nameVi`] ?? '';
const feet = (a: Pick<DecorAsset, 'foot'>) => a.foot.map((r) => `${r.x},${r.y},${r.w},${r.h}`).join('; ');
const parseFeet = (t: string) =>
  t
    .split(';')
    .map((p) => p.split(',').map((n) => Math.round(Number(n.trim()))))
    .filter((n) => n.length === 4 && n.every(Number.isFinite))
    .map(([x, y, w, h]) => ({ x: x!, y: y!, w: Math.max(1, w!), h: Math.max(1, h!) }));
const CATEGORY_ICON: Record<(typeof SCENERY_CATEGORIES)[number], string> = { tree: '🌳', bush: '🌿', rock: '🪨', building: '🏠', ruin: '🏛️', water: '💧', flower: '🌸', light: '🏮', cover: '🍃', other: '✨' };
const MODE_ICON: Record<(typeof SCENERY_MODES)[number], string> = { normal: '⬇️', occluder: '↕️', foreground: '⬆️', cover: '🫥' };
const options = <T extends string>(list: readonly T[], label: Record<T, string>, sel: string, icons?: Record<T, string>) => list.map((v) => optionHtml(v, label[v], v === sel, icons ? { icon: icons[v] } : {})).join('');

/** The fields shared by "edit", "from a picture" and "upload". */
function fieldsHtml(a: Partial<DecorAsset>, opts: { idEditable: boolean; artPick: boolean }) {
  return `<div class="form-grid">
    <label class="field"><span>Tên (tiếng Việt)</span><input name="nameVi" value="${esc(a.nameVi ?? '')}" required /></label>
    <label class="field"><span>Tên (tiếng Anh)</span><input name="nameEn" value="${esc(a.id ? enName(a.id) : '')}" required /></label>
    <label class="field"><span>Asset ID</span><input name="id" class="mono" value="${esc(a.id ?? '')}" ${opts.idEditable ? '' : 'disabled'} placeholder="decor_ten" /></label>
    ${opts.artPick ? `<label class="field"><span>Ảnh (id trong manifest)</span><input name="art" class="mono" list="mass-art" value="${esc(a.art ?? '')}" /><datalist id="mass-art">${state.art.filter((r) => r.section === 'props' || r.section === 'environment').map((r) => `<option value="${esc(r.id)}"></option>`).join('')}</datalist></label>` : ''}
    <label class="field"><span>Loại</span><select name="category" data-rich>${options(SCENERY_CATEGORIES, CATEGORY_LABEL, a.category ?? 'other', CATEGORY_ICON)}</select></label>
    <label class="field"><span>Cách đứng</span><select name="mode" data-rich>${options(SCENERY_MODES, MODE_LABEL, a.mode ?? 'occluder', MODE_ICON)}</select></label>
    <label class="field"><span>Rộng khi vẽ (ô)</span><input name="w" type="number" step="0.25" min="0.25" value="${a.w ?? 2}" /></label>
    <label class="field"><span>Chân cách đáy ảnh (0–0,9 chiều cao)</span><input name="anchorY" type="number" step="0.05" min="0" max="0.9" value="${a.anchorY ?? 0}" /></label>
    <label class="field"><span>Ô chặn quanh chân "x,y,w,h; …" (trống = đi xuyên)</span><input name="foot" value="${esc(a.foot ? feet(a as DecorAsset) : '0,0,1,1')}" /></label>
  </div><p class="muted">Ô chặn tính từ ô dưới chân (0,0); vd. cây 1 ô gốc: <code>0,0,1,1</code>, tảng đá rộng 2: <code>-1,0,2,1</code>.</p>`;
}

function assetOf(f: HTMLFormElement, base: Partial<DecorAsset>): { asset: Record<string, unknown>; nameEn: string } {
  const v = Object.fromEntries(new FormData(f)) as Record<string, string>;
  const anchorY = Number(v.anchorY);
  return {
    asset: {
      id: (v.id ?? base.id ?? '').trim(),
      nameVi: v.nameVi!.trim(),
      art: (v.art ?? base.art ?? '').trim(),
      category: v.category,
      w: Number(v.w),
      ...(anchorY > 0 ? { anchorY } : {}),
      foot: parseFeet(v.foot ?? ''),
      mode: v.mode,
    },
    nameEn: v.nameEn!.trim(),
  };
}

const done = (msg: string) => {
  rememberMessage(msg);
  reloadSoon();
};

function openEdit(a: DecorAsset | null) {
  openModal({
    title: a ? `Sửa asset · ${a.nameVi}` : 'Asset mới từ ảnh có sẵn',
    submit: 'Lưu',
    wide: true,
    body: `${a && artUrl(a.art) ? `<img class="massets__big" src="${artUrl(a.art)}" alt="" />` : ''}${fieldsHtml(a ?? {}, { idEditable: !a, artPick: true })}
      ${a ? `<p class="muted">Đang đặt trên: ${esc((page.use?.[a.id] ?? []).join(', ') || 'chưa map nào')}. Đổi ở đây thì mọi chỗ đặt đổi theo.</p>` : ''}`,
    onOpen: (f) => {
      if (a) return;
      const name = f.elements.namedItem('nameVi') as HTMLInputElement;
      const id = f.elements.namedItem('id') as HTMLInputElement;
      name.addEventListener('input', () => (id.value = `decor_${slugOf(name.value)}`));
    },
    onSubmit: async (f) => {
      const body = assetOf(f, a ?? {});
      if (!a && DECOR_LIST.some((x) => x.id === body.asset.id)) return `Id ${String(body.asset.id)} đã có`;
      await post(`${API}/save`, body);
      done(`Đã lưu asset ${String(body.asset.nameVi)}.`);
    },
  });
}

function openUpload() {
  openModal({
    title: 'Tải ảnh asset mới',
    submit: 'Tải lên',
    wide: true,
    body: `<label class="field"><span>Ảnh PNG (nền trong suốt, đã cắt sát)</span><input name="file" type="file" accept="image/png" required /></label>
      ${fieldsHtml({}, { idEditable: true, artPick: false })}<p class="muted">Ảnh lưu ở <code>public/assets/props/adventure_decor/adv_decor_&lt;tên&gt;.png</code> và vào manifest.</p>`,
    onOpen: (f) => {
      const name = f.elements.namedItem('nameVi') as HTMLInputElement;
      const id = f.elements.namedItem('id') as HTMLInputElement;
      name.addEventListener('input', () => (id.value = `decor_${slugOf(name.value)}`));
    },
    onSubmit: async (f) => {
      const file = (f.elements.namedItem('file') as HTMLInputElement).files?.[0];
      if (!file) return 'Chọn một ảnh PNG';
      const body = assetOf(f, {});
      if (DECOR_LIST.some((x) => x.id === body.asset.id)) return `Id ${String(body.asset.id)} đã có`;
      body.asset.art = `adv_${String(body.asset.id)}`;
      const data = btoa(Array.from(new Uint8Array(await file.arrayBuffer()), (b) => String.fromCharCode(b)).join(''));
      await post(`${API}/upload`, { ...body, data });
      done(`Đã tải ảnh và thêm asset ${String(body.asset.nameVi)}.`);
    },
  });
}

function draw(root: HTMLElement) {
  const q = page.query.trim().toLowerCase();
  const list = DECOR_LIST.filter((a) => (!page.category || a.category === page.category) && (!q || `${a.nameVi} ${enName(a.id)} ${a.id} ${a.art}`.toLowerCase().includes(q)));
  root.innerHTML = `<h3>Thư viện asset (Sobi Adventure)</h3>
    <p class="muted">${DECOR_LIST.length} asset dùng chung cho mọi map: mỗi asset khai báo ảnh, cỡ, ô chặn, cách đứng một lần; map chỉ ghi chỗ đặt. Đặt asset trong Map Editor (cột trái).</p>
    <div class="toolbar">
      <input class="search" type="search" placeholder="Tìm asset…" value="${esc(page.query)}" data-q />
      <span class="mapm__filter"><select data-cat data-rich="compact">${optionHtml('', 'Mọi loại', !page.category, { icon: '🗂️' })}${options(SCENERY_CATEGORIES, CATEGORY_LABEL, page.category, CATEGORY_ICON)}</select></span>
      <button class="btn" data-from>＋ Từ ảnh có sẵn</button><button class="btn btn-primary" data-upload>⬆ Tải ảnh mới</button>
    </div>
    <div class="massets">${list
      .map((a) => {
        const used = page.use?.[a.id] ?? [];
        return `<div class="massets__card">
          <div class="massets__thumb">${artUrl(a.art) ? `<img src="${artUrl(a.art)}" alt="" />` : '<span class="status-error">thiếu ảnh</span>'}</div>
          <b>${esc(a.nameVi)}</b> <small class="muted">${esc(enName(a.id))}</small>
          <span class="mono muted">${a.id}</span>
          <small>${CATEGORY_LABEL[a.category]} · rộng ${a.w} ô · ${MODE_LABEL[a.mode]} · chặn ${a.foot.length ? feet(a) : 'không'}</small>
          <small class="muted">${page.use ? (used.length ? `Đặt trên ${used.length} map` : 'Chưa đặt') : '…'}</small>
          <div class="toolbar"><button class="btn btn-small" data-edit="${a.id}">Sửa</button><button class="btn btn-small" data-del="${a.id}" ${used.length ? 'disabled title="Đang đặt trên map"' : ''}>Xoá</button></div>
        </div>`;
      })
      .join('') || '<p class="muted">Không có asset khớp.</p>'}</div>`;
  const qi = root.querySelector<HTMLInputElement>('[data-q]')!;
  qi.addEventListener('input', () => {
    page.query = qi.value;
    draw(root);
    const again = root.querySelector<HTMLInputElement>('[data-q]')!;
    again.focus();
    again.setSelectionRange(again.value.length, again.value.length);
  });
  root.querySelector<HTMLSelectElement>('[data-cat]')!.addEventListener('change', (e) => ((page.category = (e.target as HTMLSelectElement).value), draw(root)));
  root.querySelector('[data-from]')!.addEventListener('click', () => openEdit(null));
  root.querySelector('[data-upload]')!.addEventListener('click', openUpload);
  root.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach((b) => b.addEventListener('click', () => openEdit(DECOR_LIST.find((a) => a.id === b.dataset.edit)!)));
  root.querySelectorAll<HTMLButtonElement>('[data-del]').forEach((b) =>
    b.addEventListener('click', () => confirmDanger('Xoá asset', `Xoá ${b.dataset.del} khỏi thư viện? (ảnh vẫn còn trong manifest)`, 'Xoá', async () => {
      await post(`${API}/delete`, { id: b.dataset.del });
      done(`Đã xoá ${b.dataset.del}.`);
    })),
  );
}

export function renderMapAssets(root: HTMLElement) {
  draw(root);
  json<{ use: Record<string, string[]> }>(API).then(
    (r) => {
      page.use = r.use;
      if (root.isConnected) draw(root);
    },
    () => undefined,
  );
}
