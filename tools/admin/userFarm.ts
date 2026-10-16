// The Farm tab of the user editor (decisions AD-1, AM-1, 036): pigs as a table with an edit dialog (species picked on
// image cards, pigCards.ts), the nursery, the trough, the pens, decorations, orders and gift boxes — the Farm's own
// edits (farmEdits.ts) run on its view of the world. Every other field of the Farm's state: the generic editor below.
import { BREEDS } from '../../src/areas/farm/logic/config/breeds';
import { DECORS } from '../../src/areas/farm/logic/config/decor';
import { DECOR_ID_VALUES, type BreedId } from '../../src/areas/farm/logic/config/ids';
import { BALANCE } from '../../src/areas/farm/logic/config/balance';
import { happiness } from '../../src/areas/farm/logic/happiness';
import { farmOf } from '../../src/areas/farm/logic/save/lens';
import { GENDER_VALUES, type Gender } from '../../src/core/config/ids';
import { randomId } from '../../src/core/rng';
import { vi } from '../../src/i18n/vi';
import { PURPOSE_VALUES } from '../../content/schemas/vocab';
import * as F from './farmEdits';
import { esc, gold, rarityBadge, rowImage } from './labels';
import { confirmDanger, openModal } from './modal';
import { bindPigCardGrid, pigCardGrid } from './pigCards';
import { artUrl, state } from './store';
import { edit } from './userDraft';
import { partEditor } from './userParts';
import { users } from './users';
import { onFarm } from './worldEdits';

const rng = { next: () => Math.random() };
const date = (ms: number | null | undefined) => (ms ? new Date(ms).toLocaleString('vi-VN') : '—');
const farm = () => farmOf(users.open!.draft);
const breedName = (id: string) => state.rows.find((r) => r.id === id)?.nameVi ?? id;
const breedImage = (id: string) => {
  const row = state.rows.find((r) => r.id === id);
  return row ? rowImage(row) : null;
};
const thumb = (url: string | null) => (url ? `<img class="thumb" src="${esc(url)}" alt="" />` : '');
const PURPOSE_LABEL: Record<string, string> = { SHIP: 'Xuất chuồng', BREED: 'Giống', PET: 'Thú cưng', ADVENTURE: 'Phiêu lưu' };
const pct = (n: number | undefined) => (n === undefined ? '—' : `${Math.round(n)}`);

const num = (name: string, label: string, value: number, attrs = '') =>
  `<label class="field"><span>${esc(label)}</span><input type="number" name="${name}" value="${value}" step="1" ${attrs} /></label>`;

export function farmTab(): string {
  const s = farm();
  const pigs = s.pigs.map((p) => `<tr><td>${thumb(breedImage(p.breed))}</td>
      <td><b>${esc(p.name)}</b><br /><small class="muted">${p.gender === 'MALE' ? '♂' : '♀'} · thế hệ ${p.generation ?? 1}</small></td>
      <td>${esc(breedName(p.breed))} ${BREEDS[p.breed] ? rarityBadge(BREEDS[p.breed].rarity) : ''}</td>
      <td class="num">${Math.round(p.growthProgress)}%</td><td class="num">${pct(p.hunger)}</td><td class="num">${pct(p.cleanliness)}</td>
      <td class="num">${pct(p.energy)}</td><td class="num">${happiness(p)}</td><td class="num">${pct(p.bond)}</td>
      <td>${p.isSick ? '<span class="badge status-error">Ốm</span> ' : ''}${p.pregnancy ? '<span class="badge status-new">Mang thai</span> ' : ''}${p.purpose ? `<span class="chip">${esc(PURPOSE_LABEL[p.purpose] ?? p.purpose)}</span>` : ''}</td>
      <td class="row-actions"><button class="btn btn-small" data-pig="${esc(p.id)}" title="Sửa">✏️</button><button class="btn btn-small btn-ghost-danger" data-rm-pig="${esc(p.id)}" title="Xoá">🗑</button></td></tr>`).join('');
  const nursery = s.nursery.map((p) => `<tr><td>${thumb(breedImage(p.breed))}</td><td><b>${esc(p.name)}</b></td><td>${esc(breedName(p.breed))}</td>
      <td>${p.gender === 'MALE' ? '♂' : '♀'}</td><td>Thế hệ ${p.generation}</td><td>${date(p.bornAt)}</td>
      <td class="row-actions"><button class="btn btn-small" data-nursery="${esc(p.id)}">✏️</button><button class="btn btn-small btn-ghost-danger" data-rm-nursery="${esc(p.id)}">🗑</button></td></tr>`).join('');
  return `<section class="panel"><div class="toolbar"><h3 style="margin:0">🐷 Heo (${s.pigs.length}/${s.player.unlockedSlots} chuồng)</h3>
      <button class="btn btn-primary" data-add-pig type="button">＋ Tặng heo</button></div>
      <div class="table-wrap"><table class="table"><thead><tr><th></th><th>Tên</th><th>Giống</th><th>Lớn</th><th>No</th><th>Sạch</th><th>Năng lượng</th><th>Vui</th><th>Thân thiết</th><th>Tình trạng</th><th></th></tr></thead>
      <tbody>${pigs || '<tr><td colspan="11" class="muted">Chưa có heo</td></tr>'}</tbody></table></div></section>
    <section class="panel"><h3>🍼 Heo con chờ nhận (${s.nursery.length})</h3><div class="table-wrap"><table class="table"><tbody>
      ${nursery || '<tr><td class="muted">Không có heo con chờ nhận</td></tr>'}</tbody></table></div></section>
    <section class="panel"><h3>🏠 Chuồng & máng ăn</h3><div class="form-grid">
      <label class="field"><span>Chuồng đã mở (tối đa ${BALANCE.MAX_SLOTS})</span><input type="number" min="1" max="${BALANCE.MAX_SLOTS}" value="${s.player.unlockedSlots}" data-farm-slots /></label>
      <label class="field"><span>Thức ăn trong máng (máng cấp ${s.trough.level}, chứa ${s.trough.capacity})</span><input type="number" min="0" max="${s.trough.capacity}" value="${s.trough.food}" data-farm-trough /></label></div></section>
    <section class="panel"><h3>🌻 Trang trí đang sở hữu (${s.decor.length}/${DECOR_ID_VALUES.length})</h3>
      <div class="pick-grid">${DECOR_ID_VALUES.map((id) => `<label class="pick${s.decor.includes(id) ? ' is-on' : ''}">${thumb(artUrl(DECORS[id].artId))}
        <b>${esc(vi.decor[id] ?? id)}</b><small>+${DECORS[id].happyBonus} vui · ${gold(DECORS[id].priceGold)} xu</small>
        <input type="checkbox" data-decor="${id}" ${s.decor.includes(id) ? 'checked' : ''} /></label>`).join('')}</div></section>
    <section class="panel"><h3>📦 Đơn heo & hộp quà</h3><p class="muted">${s.orders.length} đơn heo đang mở · ${s.gifts.boxes.length} hộp quà trên nông trại · hộp tới: ${date(s.gifts.nextAt)}</p>
      <p class="toolbar"><button class="btn" data-farm-act="orders" ${s.orders.length ? '' : 'disabled'}>Xoá đơn heo đang mở</button><button class="btn" data-farm-act="gifts" ${s.gifts.boxes.length ? '' : 'disabled'}>Xoá hộp quà</button></p></section>
    ${partEditor(['areas', 'sobi_farm'], '🛠️ Dữ liệu Nông trại (mọi trường)', true)}`;
}

function pigModal(id: string | null, rerender: () => void) {
  const p = id ? farm().pigs.find((x) => x.id === id)! : null;
  const genders = GENDER_VALUES.map((g) => `<option value="${g}"${g === (p?.gender ?? 'FEMALE') ? ' selected' : ''}>${g === 'MALE' ? '♂ Đực' : '♀ Cái'}</option>`).join('');
  const purposes = `<option value="">— chưa chọn —</option>${PURPOSE_VALUES.map((v) => `<option value="${v}"${p?.purpose === v ? ' selected' : ''}>${PURPOSE_LABEL[v] ?? v}</option>`).join('')}`;
  openModal({
    title: p ? `Sửa ${p.name}` : 'Tặng heo mới',
    submit: p ? 'Áp dụng' : 'Thêm heo',
    body: `<div class="form-grid">
      <label class="field"><span>Tên (1–16 ký tự)</span><input name="name" value="${esc(p?.name ?? '')}" maxlength="16" required /></label>
      <label class="field"><span>Giới tính</span><select name="gender">${genders}</select></label>
      ${p ? `${num('growthProgress', 'Lớn (%)', Math.round(p.growthProgress), 'min="0" max="100"')}${num('generation', 'Thế hệ', p.generation ?? 1, 'min="1"')}
        ${num('hunger', 'No (0–100)', Math.round(p.hunger), 'min="0" max="100"')}${num('cleanliness', 'Sạch (0–100)', Math.round(p.cleanliness), 'min="0" max="100"')}
        ${num('energy', 'Năng lượng (0–100)', Math.round(p.energy ?? 100), 'min="0" max="100"')}${num('bond', 'Thân thiết (0–100, 20 = 1 tim)', Math.round(p.bond ?? 0), 'min="0" max="100"')}
        <label class="field"><span>Mục đích nuôi</span><select name="purpose">${purposes}</select></label>
        <label class="check"><input type="checkbox" name="isSick" ${p.isSick ? 'checked' : ''} /> Đang ốm</label>` : ''}
      </div><h4>Giống heo</h4>${pigCardGrid('breed', p?.breed ?? 'PIG_EARTH_PINK')}`,
    wide: true,
    onOpen: (f) => bindPigCardGrid(f),
    onSubmit: (f) => {
      const d = new FormData(f);
      const str = (k: string) => String(d.get(k) ?? '');
      const purpose = str('purpose');
      const farmEdit = p
        ? F.patchPig(p.id, {
            name: str('name'), breed: str('breed') as BreedId, gender: str('gender') as Gender, growthProgress: Number(str('growthProgress')),
            hunger: Number(str('hunger')), cleanliness: Number(str('cleanliness')), energy: Number(str('energy')), bond: Number(str('bond')),
            isSick: d.get('isSick') === 'on', generation: Number(str('generation')), purpose: purpose ? (purpose as (typeof PURPOSE_VALUES)[number]) : null,
          }, Date.now())
        : F.addPig(str('breed') as BreedId, str('gender') as Gender, str('name'), Date.now(), randomId(rng));
      farmEdit(farm()); // throws → the message stays in the dialog
      edit(onFarm(farmEdit), rerender);
    },
  });
}

export function bindFarmTab(root: HTMLElement, rerender: () => void) {
  root.querySelector('[data-add-pig]')?.addEventListener('click', () => pigModal(null, rerender));
  root.querySelectorAll<HTMLElement>('[data-pig]').forEach((b) => b.addEventListener('click', () => pigModal(b.dataset.pig!, rerender)));
  root.querySelectorAll<HTMLElement>('[data-rm-pig]').forEach((b) => {
    const pig = farm().pigs.find((p) => p.id === b.dataset.rmPig)!;
    b.addEventListener('click', () => confirmDanger('Xoá heo', `Xoá ${pig.name} khỏi save? Không hoàn tiền.`, 'Xoá heo', () => edit(onFarm(F.removePig(pig.id)), rerender)));
  });
  root.querySelectorAll<HTMLElement>('[data-nursery]').forEach((b) =>
    b.addEventListener('click', () => {
      const pig = farm().nursery.find((p) => p.id === b.dataset.nursery)!;
      openModal({
        title: `Đổi tên ${pig.name}`, submit: 'Áp dụng',
        body: `<label class="field"><span>Tên (1–16 ký tự)</span><input name="name" value="${esc(pig.name)}" maxlength="16" required /></label>`,
        onSubmit: (f) => edit(onFarm(F.patchNursery(pig.id, String(new FormData(f).get('name') ?? ''))), rerender),
      });
    }),
  );
  root.querySelectorAll<HTMLElement>('[data-rm-nursery]').forEach((b) => {
    const pig = farm().nursery.find((p) => p.id === b.dataset.rmNursery)!;
    b.addEventListener('click', () => confirmDanger('Xoá heo con', `Xoá ${pig.name} khỏi danh sách chờ nhận?`, 'Xoá', () => edit(onFarm(F.removeNursery(pig.id)), rerender)));
  });
  root.querySelector<HTMLInputElement>('[data-farm-slots]')?.addEventListener('change', (e) => edit(onFarm(F.setSlots(Number((e.target as HTMLInputElement).value))), rerender));
  root.querySelector<HTMLInputElement>('[data-farm-trough]')?.addEventListener('change', (e) => edit(onFarm(F.setTroughFood(Number((e.target as HTMLInputElement).value))), rerender));
  root.querySelectorAll<HTMLInputElement>('[data-decor]').forEach((el) =>
    el.addEventListener('change', () => {
      const on = [...root.querySelectorAll<HTMLInputElement>('[data-decor]')].filter((i) => i.checked).map((i) => i.dataset.decor as (typeof DECOR_ID_VALUES)[number]);
      edit(onFarm(F.setDecor(on)), rerender);
    }));
  const act: Record<string, () => void> = {
    orders: () => confirmDanger('Xoá đơn heo', 'Xoá mọi đơn heo đang mở? Game sẽ sinh đơn mới theo lịch.', 'Xoá đơn', () => edit(onFarm(F.clearOrders), rerender)),
    gifts: () => confirmDanger('Xoá hộp quà', 'Xoá mọi hộp quà chưa mở?', 'Xoá hộp quà', () => edit(onFarm(F.clearGifts), rerender)),
  };
  root.querySelectorAll<HTMLElement>('[data-farm-act]').forEach((b) => b.addEventListener('click', () => act[b.dataset.farmAct!]?.()));
}
