// One user's save in tabs (DECISIONS AD-1, AM-1): Hồ sơ · Tiền tệ · Kho đồ · Heo · Tiến trình ·
// Trang trí & thành tích · Trạng thái. Every field the game reads is editable here or shown read-only
// (system history: transactions, breeding records). Pigs are chosen on image cards (pigCards.ts).
// Each tab edits only its own group through userEdits.ts (validated against the game's save
// schema); "Lưu" writes the whole draft once. Dangerous actions ask for confirmation.
import { BREED_IDS, BREEDS } from '../../src/areas/farm/logic/config/breeds';
import { ACHIEVEMENTS } from '../../src/areas/farm/logic/config/achievements';
import { DECORS } from '../../src/areas/farm/logic/config/decor';
import { GENDER_VALUES, ITEM_ID_VALUES, type Gender, type ItemId } from '../../src/core/config/ids';
import { DECOR_ID_VALUES, STAT_ID_VALUES, type BreedId } from '../../src/areas/farm/logic/config/ids';
import { randomId } from '../../src/core/rng';
import { happiness } from '../../src/areas/farm/logic/happiness';
import { esc, gold, rarityBadge, rowImage } from './labels';
import { bindPigCardGrid, pigCardGrid } from './pigCards';
import { confirmDanger, openModal } from './modal';
import { artUrl, state } from './store';
import * as E from './userEdits';
import { archiveOpen, openProfile, saveOpen, users } from './users';
import { vi } from '../../src/i18n/vi';

const TABS = [['profile', 'Hồ sơ'], ['currency', 'Tiền tệ'], ['inventory', 'Kho đồ'], ['pigs', 'Heo'], ['progress', 'Tiến trình'], ['extras', 'Trang trí & thành tích'], ['state', 'Trạng thái game']] as const;
type Tab = (typeof TABS)[number][0];
let tab: Tab = 'profile';

const rng = { next: () => Math.random() };
const date = (ms: number | null) => (ms ? new Date(ms).toLocaleString('vi-VN') : '—');
const breedName = (id: string) => state.rows.find((r) => r.id === id)?.nameVi ?? id;
const breedImage = (id: string) => {
  const row = state.rows.find((r) => r.id === id);
  return row ? rowImage(row) : null;
};
const DAY_MS = 86_400_000;
const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60_000) / DAY_MS);
const thumb = (url: string | null) => (url ? `<img class="thumb" src="${esc(url)}" alt="" />` : '');
const ITEM_NAME: Record<ItemId, string> = { FOOD_BASIC: vi.shop.FOOD_BASIC, MEDICINE_COMMON: vi.shop.MEDICINE_COMMON };

function edit(e: E.Edit, rerender: () => void) {
  const o = users.open!;
  try {
    o.draft = E.apply(o.draft, e);
    o.edits.push(e);
    o.dirty = true;
    state.message = null;
  } catch (x) {
    state.message = { kind: 'error', text: (x as Error).message };
  }
  rerender();
}

const num = (name: string, label: string, value: number, attrs = '') =>
  `<label class="field"><span>${esc(label)}</span><input type="number" name="${name}" value="${value}" step="1" ${attrs} /></label>`;
const check = (name: string, label: string, on: boolean) =>
  `<label class="check"><input type="checkbox" name="${name}" ${on ? 'checked' : ''} /> ${esc(label)}</label>`;
const form = (id: string, body: string, submit = 'Áp dụng') =>
  `<form class="panel tab-form" data-form="${id}"><div class="form-grid">${body}</div><div class="form-actions"><button class="btn btn-primary">${submit}</button></div></form>`;

function tabBody(t: Tab): string {
  const s = users.open!.draft;
  const sum = E.summary(s);
  switch (t) {
    case 'profile':
      return `<section class="panel"><h3>Thông tin</h3><dl class="kv">
          <dt>Nguồn</dt><dd>${esc(users.open!.label)}</dd><dt>Tạo lúc</dt><dd>${date(s.createdAt)}</dd>
          <dt>Lưu lúc</dt><dd>${date(s.updatedAt)}</dd><dt>Xuất file gần nhất</dt><dd>${date(s.settings.lastExportAt)}</dd>
          <dt>Phiên bản save</dt><dd>v${s.schemaVersion}</dd></dl></section>
        ${form('settings', `${check('musicOn', 'Nhạc nền', s.settings.musicOn)}${check('sfxOn', 'Âm thanh', s.settings.sfxOn)}
          ${check('reduceMotion', 'Giảm chuyển động', s.settings.reduceMotion)}${check('tutorialDone', 'Đã xong hướng dẫn', s.settings.tutorialDone)}`)}`;
    case 'currency': {
      const tx = s.transactions.slice(0, 15).map((x) => `<tr><td>${date(x.at)}</td><td>${esc((vi.history as Record<string, string>)[x.type] ?? x.type)}</td>
        <td class="num ${x.amount < 0 ? 'neg' : 'pos'}">${x.amount > 0 ? '+' : ''}${gold(x.amount)}</td><td>${esc(x.note ?? '')}</td></tr>`).join('');
      return `${form('gold', `${num('gold', 'Vàng (đặt thành)', s.player.gold, 'min="0"')}<p class="muted span-2">Chênh lệch được ghi thành 1 giao dịch “Điều chỉnh của quản trị” trong lịch sử (vàng chỉ đổi qua giao dịch).</p>`)}
        <section class="panel"><h3>15 giao dịch gần nhất</h3><div class="table-wrap"><table class="table"><tbody>${tx || '<tr><td>Chưa có</td></tr>'}</tbody></table></div></section>`;
    }
    case 'inventory':
      return form('inventory', `${ITEM_ID_VALUES.map((id) => num(`item-${id}`, ITEM_NAME[id], s.inventory[id], 'min="0"')).join('')}
        ${num('trough', `Thức ăn trong máng (tối đa ${s.trough.capacity})`, s.trough.food, `min="0" max="${s.trough.capacity}"`)}`);
    case 'pigs':
      return `<div class="toolbar"><span class="muted">${s.pigs.length}/${s.player.unlockedSlots} chuồng · ${sum.pregnant} mang thai · ${sum.sick} ốm</span>
          <button class="btn btn-primary" data-add-pig type="button">＋ Tặng heo</button></div>
        <div class="table-wrap"><table class="table"><thead><tr><th></th><th>Tên</th><th>Giống</th><th>Giới</th><th>Lớn</th><th>No</th><th>Sạch</th><th>Vui</th><th>Tình trạng</th><th></th></tr></thead><tbody>
        ${s.pigs.map((p) => `<tr><td>${thumb(breedImage(p.breed))}</td>
          <td><b>${esc(p.name)}</b></td><td>${esc(breedName(p.breed))} ${rarityBadge(BREEDS[p.breed].rarity)}</td><td>${p.gender === 'MALE' ? '♂' : '♀'}</td>
          <td class="num">${Math.round(p.growthProgress)}%</td><td class="num">${Math.round(p.hunger)}</td><td class="num">${Math.round(p.cleanliness)}</td>
          <td class="num">${happiness(p)}</td><td>${p.isSick ? '<span class="badge status-error">Ốm</span>' : ''}${p.pregnancy ? '<span class="badge status-new">Mang thai</span>' : ''}</td>
          <td class="row-actions"><button class="btn btn-small" data-pig="${esc(p.id)}">✏️</button><button class="btn btn-small" data-rm-pig="${esc(p.id)}">🗑</button></td></tr>`).join('') || '<tr><td colspan="10">Chưa có heo</td></tr>'}
        </tbody></table></div>
        <section class="panel"><h3>Heo con chờ nhận (${s.nursery.length})</h3><div class="table-wrap"><table class="table"><tbody>
        ${s.nursery.map((p) => `<tr><td>${thumb(breedImage(p.breed))}</td><td><b>${esc(p.name)}</b></td><td>${esc(breedName(p.breed))} ${rarityBadge(BREEDS[p.breed].rarity)}</td>
          <td>${p.gender === 'MALE' ? '♂' : '♀'}</td><td>Thế hệ ${p.generation}</td><td>${date(p.bornAt)}</td>
          <td class="row-actions"><button class="btn btn-small" data-nursery="${esc(p.id)}">✏️</button><button class="btn btn-small" data-rm-nursery="${esc(p.id)}">🗑</button></td></tr>`).join('') || '<tr><td>Không có heo con chờ nhận</td></tr>'}
        </tbody></table></div></section>`;
    case 'progress':
      return `${form('progress', `${num('xp', `XP (cấp ${sum.level}${sum.nextXp !== null ? `, cấp sau ở ${sum.nextXp} XP` : ', tối đa'})`, s.player.xp, 'min="0"')}
          ${num('slots', 'Chuồng đã mở', s.player.unlockedSlots, 'min="1"')}<p class="muted span-2">Đổi XP thì sức chứa máng theo cấp mới (luật §8.6).</p>`)}
        <form class="panel tab-form" data-form="discovered"><h3>Sổ sưu tập (${sum.discovered}/${BREED_IDS.length})</h3>
          <div class="check-grid">${BREED_IDS.map((id) => check(`d-${id}`, breedName(id), s.collection.discoveredBreeds.includes(id))).join('')}</div>
          <div class="form-actions"><button class="btn btn-primary">Áp dụng</button></div></form>`;
    case 'extras': {
      const claimed = s.progress.claimed;
      return `<form class="panel tab-form" data-form="decor"><h3>Trang trí đang sở hữu (${s.decor.length}/${DECOR_ID_VALUES.length})</h3>
          <div class="pick-grid">${DECOR_ID_VALUES.map((id) => `<label class="pick${s.decor.includes(id) ? ' is-on' : ''}">${thumb(artUrl(DECORS[id].artId))}
            <b>${esc(vi.decor[id])}</b><small>+${DECORS[id].happyBonus} vui · ${gold(DECORS[id].priceGold)} vàng</small>
            <input type="checkbox" name="decor-${id}" ${s.decor.includes(id) ? 'checked' : ''} /></label>`).join('')}</div>
          <div class="form-actions"><button class="btn btn-primary">Áp dụng</button></div></form>
        <form class="panel tab-form" data-form="claimed"><h3>Thành tích đã nhận thưởng (${Object.keys(claimed).length}/${ACHIEVEMENTS.length})</h3>
          <p class="muted">Bỏ chọn = người chơi nhận lại được (không trừ vàng đã nhận). Chọn = coi như đã nhận, không cộng thưởng.</p>
          <div class="check-grid">${ACHIEVEMENTS.map((a) => check(`ach-${a.id}`, (vi.achievements as Record<string, string>)[a.id] ?? a.id, a.id in claimed)).join('')}</div>
          <div class="form-actions"><button class="btn btn-primary">Áp dụng</button></div></form>
        ${form('daily', `${num('streak', 'Chuỗi ngày nhận quà', s.progress.daily.streak, 'min="0"')}
          ${check('dailyToday', 'Hôm nay đã nhận quà ngày', s.progress.daily.lastDay === today())}
          <p class="muted span-2">Lần nhận gần nhất: ${s.progress.daily.lastDay === null ? 'chưa' : new Date(s.progress.daily.lastDay * DAY_MS).toLocaleDateString('vi-VN')}.</p>`)}
        ${form('stats', `${STAT_ID_VALUES.map((k) => num(`stat-${k}`, k, s.progress.stats[k] ?? 0, 'min="0"')).join('')}
          <p class="muted span-2">Bộ đếm cho thành tích (bán, sinh, đơn hàng…).</p>`)}
        <section class="panel"><h3>Chỉ đọc (do game tự sinh)</h3><dl class="kv">
          <dt>Lịch sử phối giống</dt><dd>${s.breedingRecords.length} lần</dd><dt>Giao dịch</dt><dd>${s.transactions.length} dòng (tab Tiền tệ)</dd>
          <dt>Hộp quà kế tiếp</dt><dd>${date(s.gifts.nextAt)}</dd><dt>Máng ăn tính tới</dt><dd>${date(s.trough.lastResolvedAt)}</dd></dl></section>`;
    }
    case 'state':
      return `<section class="panel"><h3>Đơn hàng đang mở (${s.orders.length})</h3><ul class="issues">${s.orders.map((o) => `<li class="issue info">${esc(breedName(o.wantBreed))} → ${gold(o.rewardGold)} vàng · hết hạn ${date(o.expiresAt)}</li>`).join('') || '<li class="issue info">Không có</li>'}</ul>
          <p><button class="btn" data-act="orders">Xoá đơn đang mở</button></p></section>
        <section class="panel"><h3>Hộp quà trên nông trại (${s.gifts.boxes.length})</h3><p><button class="btn" data-act="gifts">Xoá hộp quà</button></p></section>
        <section class="panel danger-zone"><h3>Vùng nguy hiểm</h3>
          <p><button class="btn btn-danger" data-act="reset">↺ Chơi lại từ đầu (reset save)</button></p>
          ${users.open!.source === 'disk' ? '<p><button class="btn btn-danger" data-act="archive">🗑 Xoá save (chuyển vào backups)</button></p>' : ''}</section>`;
  }
}

function pigModal(id: string | null, rerender: () => void) {
  const s = users.open!.draft;
  const p = id ? s.pigs.find((x) => x.id === id)! : null;
  const genders = GENDER_VALUES.map((g) => `<option value="${g}"${g === (p?.gender ?? 'FEMALE') ? ' selected' : ''}>${g === 'MALE' ? '♂ Đực' : '♀ Cái'}</option>`).join('');
  openModal({
    title: p ? `Sửa ${p.name}` : 'Tặng heo mới',
    submit: p ? 'Áp dụng' : 'Thêm heo',
    body: `<div class="form-grid">
      <label class="field"><span>Tên (1–16 ký tự)</span><input name="name" value="${esc(p?.name ?? '')}" maxlength="16" required /></label>
      <label class="field"><span>Giới tính</span><select name="gender">${genders}</select></label>
      ${p ? `${num('generation', 'Thế hệ', p.generation ?? 1, 'min="1"')}${num('growthProgress', 'Lớn (%)', Math.round(p.growthProgress), 'min="0" max="100"')}${num('hunger', 'No (0–100)', Math.round(p.hunger), 'min="0" max="100"')}
        ${num('cleanliness', 'Sạch (0–100)', Math.round(p.cleanliness), 'min="0" max="100"')}${check('isSick', 'Đang ốm', p.isSick)}` : ''}
      </div><h4>Giống heo</h4>${pigCardGrid('breed', p?.breed ?? 'PIG_EARTH_PINK')}`,
    wide: true,
    onOpen: (f) => bindPigCardGrid(f),
    onSubmit: (f) => {
      const d = new FormData(f);
      const str = (k: string) => String(d.get(k) ?? '');
      const e = p
        ? E.patchPig(p.id, { name: str('name'), breed: str('breed') as BreedId, gender: str('gender') as Gender, growthProgress: Number(str('growthProgress')),
            hunger: Number(str('hunger')), cleanliness: Number(str('cleanliness')), isSick: d.get('isSick') === 'on', generation: Number(str('generation')) })
        : E.addPig(str('breed') as BreedId, str('gender') as Gender, str('name'), Date.now(), randomId(rng));
      E.apply(users.open!.draft, e); // throws → message stays in the modal
      edit(e, rerender);
    },
  });
}

function submitForm(id: string, f: HTMLFormElement, rerender: () => void) {
  const d = new FormData(f);
  const n = (k: string) => Number(d.get(k));
  const on = (k: string) => d.get(k) === 'on';
  const edits: Record<string, () => E.Edit> = {
    settings: () => E.setSettings({ musicOn: on('musicOn'), sfxOn: on('sfxOn'), reduceMotion: on('reduceMotion'), tutorialDone: on('tutorialDone') }),
    gold: () => E.setGold(n('gold'), Date.now(), rng),
    inventory: () => (s) => E.setTroughFood(n('trough'))(E.setInventory(Object.fromEntries(ITEM_ID_VALUES.map((i) => [i, n(`item-${i}`)])))(s)),
    progress: () => (s) => E.setSlots(n('slots'))(E.setXp(n('xp'))(s)),
    discovered: () => E.setDiscovered(BREED_IDS.filter((b) => on(`d-${b}`))),
    decor: () => E.setDecor(DECOR_ID_VALUES.filter((id) => on(`decor-${id}`))),
    claimed: () => E.setClaimed(ACHIEVEMENTS.map((a) => a.id).filter((id) => on(`ach-${id}`)), Date.now()),
    daily: () => {
      const last = users.open!.draft.progress.daily.lastDay;
      return E.setDaily(n('streak'), on('dailyToday') ? today() : last === today() ? today() - 1 : last);
    },
    stats: () => E.setStats(Object.fromEntries(STAT_ID_VALUES.map((k) => [k, n(`stat-${k}`)]))),
  };
  edit(edits[id]!(), rerender);
}

function bindTab(root: HTMLElement, rerender: () => void) {
  root.querySelectorAll<HTMLFormElement>('[data-form]').forEach((f) =>
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      submitForm(f.dataset.form!, f, rerender);
    }),
  );
  root.querySelector('[data-add-pig]')?.addEventListener('click', () => pigModal(null, rerender));
  root.querySelectorAll<HTMLElement>('[data-pig]').forEach((b) => b.addEventListener('click', () => pigModal(b.dataset.pig!, rerender)));
  root.querySelectorAll<HTMLElement>('[data-nursery]').forEach((b) =>
    b.addEventListener('click', () => {
      const pig = users.open!.draft.nursery.find((p) => p.id === b.dataset.nursery)!;
      openModal({ title: `Đổi tên ${pig.name}`, submit: 'Áp dụng', body: `<label class="field"><span>Tên (1–16 ký tự)</span><input name="name" value="${esc(pig.name)}" maxlength="16" required /></label>`,
        onSubmit: (f) => edit(E.patchNursery(pig.id, String(new FormData(f).get('name') ?? '')), rerender) });
    }),
  );
  root.querySelectorAll<HTMLElement>('[data-rm-nursery]').forEach((b) => {
    const pig = users.open!.draft.nursery.find((p) => p.id === b.dataset.rmNursery)!;
    b.addEventListener('click', () => confirmDanger('Xoá heo con', `Xoá ${pig.name} khỏi danh sách chờ nhận?`, 'Xoá', () => edit(E.removeNursery(pig.id), rerender)));
  });
  root.querySelectorAll<HTMLElement>('[data-rm-pig]').forEach((b) => {
    const pig = users.open!.draft.pigs.find((p) => p.id === b.dataset.rmPig)!;
    b.addEventListener('click', () => confirmDanger('Xoá heo', `Xoá ${pig.name} khỏi save? Không hoàn vàng.`, 'Xoá heo', () => edit(E.removePig(pig.id), rerender)));
  });
  const act: Record<string, () => void> = {
    orders: () => confirmDanger('Xoá đơn hàng', 'Xoá mọi đơn đang mở? Game sẽ sinh đơn mới theo lịch.', 'Xoá đơn', () => edit(E.clearOrders, rerender)),
    gifts: () => confirmDanger('Xoá hộp quà', 'Xoá mọi hộp quà chưa mở?', 'Xoá hộp quà', () => edit(E.clearGifts, rerender)),
    reset: () => confirmDanger('Chơi lại từ đầu', 'Thay toàn bộ save bằng nông trại mới (vàng, heo, tiến trình về ban đầu). Bản cũ vào backups khi lưu.', 'Reset save', () => edit(E.resetSave(Date.now(), rng), rerender), 'RESET'),
    archive: () => confirmDanger('Xoá save', 'Chuyển save.json vào backups/ — game sẽ bắt đầu nông trại mới, vẫn khôi phục được trong Cài đặt → Khôi phục bản sao lưu.', 'Xoá save', async () => {
      state.message = { kind: 'ok', text: await archiveOpen() };
      location.hash = '#/users';
    }, 'XOA'),
  };
  root.querySelectorAll<HTMLElement>('[data-act]').forEach((b) => b.addEventListener('click', () => act[b.dataset.act!]!()));
}

export function renderUserDetail(root: HTMLElement, id: string, rerender: () => void) {
  if (users.open?.id !== id) {
    if (id === 'file') return void (location.hash = '#/users');
    root.innerHTML = '<p class="loading">Đang mở save… 🐷</p>';
    openProfile(id).then(rerender, (e: unknown) => (root.innerHTML = `<p class="empty">${esc((e as Error).message)}</p>`));
    return;
  }
  const o = users.open;
  const sum = E.summary(o.draft);
  const problems = E.saveProblems(o.draft);
  root.innerHTML = `
    <a class="link" href="#/users">← Danh sách save</a>
    <div class="stats">
      <div class="stat"><span class="stat__icon">🪙</span><span class="stat__value">${gold(sum.gold)}</span><span class="stat__label">Vàng</span></div>
      <div class="stat"><span class="stat__icon">⭐</span><span class="stat__value">${sum.level}</span><span class="stat__label">Cấp (${gold(sum.xp)} XP)</span></div>
      <div class="stat"><span class="stat__icon">🐷</span><span class="stat__value">${sum.pigs}/${sum.slots}</span><span class="stat__label">Heo / chuồng</span></div>
      <div class="stat"><span class="stat__icon">📖</span><span class="stat__value">${sum.discovered}</span><span class="stat__label">Đã khám phá</span></div>
      <div class="stat"><span class="stat__icon">😊</span><span class="stat__value">${sum.avgHappiness ?? '—'}</span><span class="stat__label">Vui trung bình</span></div>
    </div>
    <div class="savebar">
      <span class="muted">${esc(o.label)}${o.source === 'disk' ? ' · Game đang mở sẽ tự tải lại save này sau khi lưu (không cần đóng game).' : ' · Lưu = tải file về để Nhập trong game.'}</span>
      ${o.dirty ? '<span class="badge status-warn">Chưa lưu</span><button class="btn" data-undo>Huỷ thay đổi</button>' : ''}
      <button class="btn btn-primary" data-save ${!o.dirty || problems.length ? 'disabled' : ''}>${o.source === 'disk' ? '💾 Lưu vào save' : '⬇ Tải file save'}</button>
    </div>
    ${problems.length ? `<ul class="issues">${problems.map((p) => `<li class="issue error">${esc(p)}</li>`).join('')}</ul>` : ''}
    <div class="seg tabs" role="tablist">${TABS.map(([k, l]) => `<button role="tab" data-tab="${k}" class="${k === tab ? 'is-on' : ''}">${l}</button>`).join('')}</div>
    <div data-tabbody>${tabBody(tab)}</div>`;
  root.querySelectorAll<HTMLElement>('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => {
      tab = b.dataset.tab as Tab;
      rerender();
    }),
  );
  root.querySelector('[data-undo]')?.addEventListener('click', () => {
    o.draft = o.original;
    o.edits = [];
    o.dirty = false;
    rerender();
  });
  root.querySelector('[data-save]')?.addEventListener('click', async () => {
    try {
      state.message = { kind: 'ok', text: await saveOpen() };
    } catch (e) {
      state.message = { kind: 'error', text: (e as Error).message };
    }
    rerender();
  });
  bindTab(root.querySelector<HTMLElement>('[data-tabbody]')!, rerender);
}

export const userDirty = () => !!users.open?.dirty;
