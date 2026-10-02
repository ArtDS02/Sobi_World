// Asset source page: every image in asset/animals/asset/ with its concept and whether the game uses
// it, plus uploads from the computer. Importing copies the image into pigs/base/ AND registers its
// manifest row in one step (DECISIONS AD-1), so it is selectable in "Tạo heo mới" immediately.
import { esc } from './labels';
import { mountList } from './listKit';
import { byText, reverse } from './listQuery';
import { openModal } from './modal';
import { importArt, state, uploadArt, type InventoryItem } from './store';

type Tone = 'ok' | 'imported' | 'variant' | 'new';

function statusOf(i: InventoryItem): [Tone, string] {
  if (i.identical || state.rows.some((r) => r.artId === i.stem)) return ['ok', 'Đang dùng trong game'];
  if (i.importedAs.length) return ['imported', `Đã nhập → ${i.importedAs.join(', ')}`];
  if (i.inGame) return ['variant', i.version ? `Bản v${i.version} của concept đang dùng` : 'Khác bản đang dùng'];
  return ['new', 'Chưa dùng'];
}

const TONE_CLASS: Record<Tone, string> = { ok: 'status-ok', imported: 'status-new', variant: 'status-warn', new: 'status-warn' };

/** Suggested art id for an import: the concept when free, else the stem, else stem_2, … */
function suggestId(i: InventoryItem): string {
  const taken = (id: string) => state.files.has(`pigs/base/${id}.png`) || state.pigs.some((p) => p.id === id);
  for (const base of [i.concept, i.stem]) if (!taken(base)) return base;
  let n = 2;
  while (taken(`${i.stem}_${n}`)) n++;
  return `${i.stem}_${n}`;
}

const prettyName = (id: string) =>
  'Heo ' + id.replace(/^pig_/, '').replace(/_v?\d+$/, '').split('_').map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ');

function card(i: InventoryItem) {
  const [tone, label] = statusOf(i);
  const live = state.files.has(`pigs/base/${i.concept}.png`);
  const compare = i.inGame && !i.identical && live
    ? `<span class="compare"><img src="/assets/pigs/base/${esc(i.concept)}.png" alt="" loading="lazy" /><small>đang dùng</small></span>`
    : '';
  const target = i.importedAs.find((id) => !state.rows.some((r) => r.artId === id));
  const actions = !state.apiOnline
    ? ''
    : tone === 'imported' && target
      ? `<a class="btn btn-small btn-primary" href="#/pigs/new?art=${esc(target)}">🐷 Tạo heo từ ảnh này</a>`
      : tone === 'variant' || tone === 'new'
        ? `<button class="btn btn-small" data-import="${esc(i.name)}">📥 Nhập vào game…</button>`
        : '';
  return `<div class="src-card">
    <span class="src-card__imgs"><span class="compare"><img src="/asset/animals/asset/${esc(i.name)}" alt="" loading="lazy" /><small>nguồn</small></span>${compare}</span>
    <b>${esc(i.name)}</b>
    <small>Concept: ${esc(i.concept)}${i.version ? ` · v${esc(i.version)}` : ''}</small>
    <span class="badge ${TONE_CLASS[tone]}">${esc(label)}</span>
    ${actions}
  </div>`;
}

const idFields = (artId: string, nameVi: string) => `
  <label class="field"><span>Art id (pig_ten — chữ thường, số, _)</span><input name="artId" value="${esc(artId)}" pattern="pig_[a-z0-9_]+" required /></label>
  <label class="field"><span>Tên hiển thị (manifest)</span><input name="nameVi" value="${esc(nameVi)}" required /></label>
  <label class="check"><input type="checkbox" name="create" checked /> Mở “Tạo heo mới” với ảnh này sau khi nhập</label>`;

function afterAdd(form: HTMLFormElement, artId: string) {
  if (new FormData(form).get('create') === 'on') location.hash = `#/pigs/new?art=${encodeURIComponent(artId)}`;
}

function openImport(i: InventoryItem) {
  const artId = suggestId(i);
  openModal({
    title: `Nhập ${i.name}`,
    submit: 'Nhập vào game',
    body: `<img class="modal__preview" src="/asset/animals/asset/${esc(i.name)}" alt="" />${idFields(artId, prettyName(artId))}`,
    onSubmit: async (f) => {
      const d = new FormData(f);
      const id = String(d.get('artId')).trim();
      await importArt(i.name, id, String(d.get('nameVi')).trim());
      afterAdd(f, id);
    },
  });
}

export function openUpload() {
  openModal({
    title: 'Tải ảnh heo lên',
    submit: 'Tải lên & đăng ký',
    body: `<label class="field"><span>Ảnh PNG vuông (chuẩn: 512×512, nền trong suốt, heo nhìn sang phải)</span>
        <input type="file" name="file" accept="image/png" required /></label>
      <img class="modal__preview" alt="" hidden />
      ${idFields('', '')}`,
    onOpen: (f) => {
      const input = f.querySelector<HTMLInputElement>('[name=file]')!;
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        const img = f.querySelector<HTMLImageElement>('.modal__preview')!;
        if (!file) return;
        img.src = URL.createObjectURL(file);
        img.hidden = false;
        const stem = file.name.toLowerCase().replace(/\.png$/, '').replace(/[^a-z0-9_]+/g, '_');
        const id = stem.startsWith('pig_') ? stem : `pig_${stem}`;
        const idInput = f.querySelector<HTMLInputElement>('[name=artId]')!;
        if (!idInput.value) idInput.value = id;
        const name = f.querySelector<HTMLInputElement>('[name=nameVi]')!;
        if (!name.value) name.value = prettyName(id);
      });
    },
    onSubmit: async (f) => {
      const d = new FormData(f);
      const file = d.get('file') as File | null;
      if (!file || !file.size) return 'Chọn một file PNG';
      const id = String(d.get('artId')).trim();
      await uploadArt(file, id, String(d.get('nameVi')).trim());
      afterAdd(f, id);
    },
  });
}

const STATUS_OPTS = [['ok', 'Đang dùng'], ['imported', 'Đã nhập, chưa gán heo'], ['variant', 'Bản thay thế'], ['new', 'Chưa dùng']] as const;

export function renderAssets(root: HTMLElement) {
  const inv = state.inventory;
  const used = inv.filter((i) => statusOf(i)[0] === 'ok').length;
  root.innerHTML = `
    <div class="summary-row">
      <span class="badge status-ok">✓ ${used} đang dùng</span>
      <span class="badge status-warn">⚠ ${inv.length - used} chưa dùng / bản thay thế</span>
    </div>
    <p class="muted">Ảnh trong <code>asset/animals/asset/</code>. “Nhập vào game” chép ảnh sang <code>public/assets/pigs/base/&lt;art id&gt;.png</code>
      <b>và đăng ký luôn dòng manifest</b> — ảnh chọn được ngay trong “Tạo heo mới”. Không bao giờ ghi đè ảnh đang có.</p>
    ${state.apiOnline ? '' : '<p class="empty">Cần chạy <code>npm run admin</code> để đọc thư mục nguồn.</p>'}
    <div data-list></div>`;
  mountList(root.querySelector<HTMLElement>('[data-list]')!, {
    id: 'asset-source',
    items: () => state.inventory,
    text: (i) => [i.name, i.concept, ...i.importedAs],
    filters: [
      { key: 'status', label: 'Mọi trạng thái', options: STATUS_OPTS, test: (i, v) => statusOf(i)[0] === v },
      { key: 'version', label: 'Mọi phiên bản', options: [['base', 'Bản gốc'], ['v', 'Có số phiên bản (_vN)']], test: (i, v) => (v === 'v') === !!i.version },
    ],
    sorts: [
      { key: 'name', label: 'Tên A-Z', compare: byText((i) => i.name) },
      { key: 'name-desc', label: 'Tên Z-A', compare: reverse(byText((i) => i.name)) },
    ],
    pageSize: 60,
    placeholder: 'Tìm tên file, concept, art id…',
    noun: 'ảnh',
    resultsClass: 'src-grid',
    actions: state.apiOnline ? '<button class="btn btn-primary" data-upload type="button">⬆ Tải ảnh lên</button>' : '',
    render: (rows) => rows.map(card).join(''),
    bind: (el) =>
      el.querySelectorAll<HTMLElement>('[data-import]').forEach((b) =>
        b.addEventListener('click', () => openImport(state.inventory.find((i) => i.name === b.dataset.import)!)),
      ),
  });
  root.querySelector('[data-upload]')?.addEventListener('click', openUpload);
}
