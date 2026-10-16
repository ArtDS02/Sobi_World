// The tabs of the user editor (decision 036). Each control applies its change to the draft when it is committed (a
// number on Enter / leaving the field, a switch at once) through worldEdits; Area tabs are drawn by userFarm.ts and
// userParts.ts. Item names and pictures come from idNames.ts.
import { AREAS } from '../../src/app/areas';
import { ACHIEVEMENTS, CODEX as CODEX_RULES } from '../../src/core/config/goals';
import { INVENTORY } from '../../src/core/config/inventory';
import { ITEMS } from '../../src/core/config/items';
import { WORLD_LEVELS } from '../../src/core/config/progression';
import { areaXp } from '../../src/core/progression/levels';
import type { Currency } from '../../src/core/save/world';
import { vi } from '../../src/i18n/vi';
import { STAT_ID_VALUES } from '../../content/schemas/vocab';
import { ENUM_LABEL, humanize } from './fieldLabels';
import { imageOf, loadNames, nameOf } from './idNames';
import { esc, gold } from './labels';
import { bindLiveSection, liveSection } from './liveSection';
import { confirmDanger } from './modal';
import type { Tab } from './userDetail';
import { areaIcon, edit } from './userDraft';
import { bindFarmTab, farmTab } from './userFarm';
import { bindPart, partEditor } from './userParts';
import { users } from './users';
import * as W from './worldEdits';

const rng = { next: () => Math.random() };
const now = () => Date.now();
const date = (ms: number | null | undefined) => (ms ? new Date(ms).toLocaleString('vi-VN') : '—');
const DAY_MS = 86_400_000;
const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60_000) / DAY_MS);
const draft = () => users.open!.draft;

const CURRENCY: Record<Currency, { icon: string; label: string; steps: number[] }> = {
  coins: { icon: '🪙', label: 'Sobi Coin', steps: [100, 1_000, 10_000] },
  gems: { icon: '💎', label: 'Ngọc', steps: [10, 50, 100] },
  eventTokens: { icon: '🎟️', label: 'Vé Lễ Hội', steps: [10, 50, 100] },
};

const STAT_LABEL: Record<string, string> = {
  pigsBought: 'Heo đã mua', pigsSold: 'Heo đã bán', births: 'Heo con chào đời', ordersFulfilled: 'Đơn heo đã giao', giftsOpened: 'Hộp quà đã mở',
  pigsCleaned: 'Lần dọn chuồng', pigsTreated: 'Lần chữa heo', breedings: 'Lần phối giống', goldEarned: 'Sobi Coin đã kiếm', bestStreak: 'Chuỗi ngày dài nhất',
  pigsPetted: 'Lần vuốt ve', feeds: 'Lần cho ăn', manureCollected: 'Phân đã dọn', slotsOwned: 'Chuồng sở hữu', decorOwned: 'Trang trí sở hữu',
  maxHearts: 'Tim cao nhất', cropsPlanted: 'Cây đã gieo', cropsHarvested: 'Cây đã thu', crafts: 'Mẻ chế biến', boardOrders: 'Đơn Bảng đơn',
  dailyGoalsDone: 'Mục tiêu ngày đã xong', fishCaught: 'Cá câu được', tanksCleaned: 'Lần thay nước', flowersHarvested: 'Hoa đã hái',
  potionsBrewed: 'Potion đã nấu', battlesWon: 'Trận thắng', adventuresCleared: 'Lần hạ trùm',
};

const numberField = (attr: string, label: string, value: number, extra = '') =>
  `<label class="field"><span>${esc(label)}</span><input type="number" ${attr} value="${value}" step="1" min="0" ${extra} /></label>`;
const switchRow = (attr: string, label: string, on: boolean) =>
  `<label class="check"><span class="switch"><input type="checkbox" ${attr} ${on ? 'checked' : ''} /><span></span></span> ${esc(label)}</label>`;
const thumb = (url: string | null) => (url ? `<img src="${esc(url)}" alt="" loading="lazy" />` : '<span class="sf-row__dot"></span>');

function overview(): string {
  const w = draft();
  const o = users.open!;
  const s = W.summary(w);
  return `<div class="grid-2">
    <section class="panel"><h3>Hồ sơ save</h3><dl class="kv">
      <dt>Nguồn</dt><dd>${esc(o.label)}</dd><dt>Phiên bản save</dt><dd>v${w.schemaVersion}</dd>
      <dt>Tạo lúc</dt><dd>${date(w.meta.createdAt)}</dd><dt>Cập nhật</dt><dd>${date(w.meta.updatedAt)}</dd>
      <dt>Lần game ghi cuối</dt><dd>${date(w.meta.lastSavedAt)}</dd><dt>Xuất file gần nhất</dt><dd>${date(w.settings.lastExportAt)}</dd>
      <dt>Khu đang đứng</dt><dd>${esc(AREAS.get(w.world.currentArea)?.manifest.name.vi ?? w.world.currentArea)}</dd></dl></section>
    <section class="panel"><h3>Cấp Sobi World ${s.level}</h3><div class="progress"><span style="width:${s.percent}%"></span></div>
      <p class="muted">${gold(s.xp)} KN${s.nextXp !== null ? ` · cấp sau ở ${gold(s.nextXp)} KN` : ' · cấp tối đa'}</p>
      <dl class="kv"><dt>Túi đồ</dt><dd>${s.bagSlots}/${INVENTORY.slots} ô</dd><dt>Bộ sưu tập</dt><dd>${s.codex} mục</dd>
      <dt>Heo</dt><dd>${s.pigs}/${s.slots} chuồng${s.sick ? ` · <span class="badge status-error">${s.sick} ốm</span>` : ''}</dd></dl></section>
  </div>
  <section class="panel"><h3>Cài đặt trong game</h3><div class="check-grid">
    ${switchRow('data-setting="musicOn"', 'Nhạc nền', w.settings.musicOn)}${switchRow('data-setting="sfxOn"', 'Âm thanh', w.settings.sfxOn)}
    ${switchRow('data-setting="reduceMotion"', 'Giảm chuyển động', w.settings.reduceMotion)}${switchRow('data-setting="tutorialDone"', 'Đã xong hướng dẫn', w.settings.tutorialDone)}</div></section>
  <section class="panel"><h3>Tặng nhanh</h3><p class="toolbar">
    <button class="btn" data-give="coins:1000">🪙 +1.000</button><button class="btn" data-give="coins:10000">🪙 +10.000</button>
    <button class="btn" data-give="gems:50">💎 +50 Ngọc</button><button class="btn" data-give="eventTokens:50">🎟️ +50 vé</button>
    <span class="muted">Mỗi lần tặng ghi một giao dịch “Điều chỉnh của quản trị”.</span></p></section>`;
}

function wallet(): string {
  const w = draft();
  const cards = (Object.keys(CURRENCY) as Currency[]).map((c) => {
    const d = CURRENCY[c];
    return `<section class="panel"><h3>${d.icon} ${d.label}</h3><div class="wallet__value">${gold(w.wallet[c])}</div>
      ${numberField(`data-currency="${c}"`, 'Đặt thành', w.wallet[c])}
      <p class="toolbar">${d.steps.map((n) => `<button class="btn btn-small" data-give="${c}:${n}">+${gold(n)}</button>`).join('')}
        <button class="btn btn-small" data-give="${c}:-${w.wallet[c]}" ${w.wallet[c] ? '' : 'disabled'}>Về 0</button></p></section>`;
  });
  const tx = w.transactions.slice(0, 60).map((x) => `<tr><td>${date(x.at)}</td><td>${CURRENCY[x.currency]?.icon ?? ''} ${esc((vi.history as Record<string, unknown>)[x.type] as string ?? humanize(x.type))}</td>
    <td class="num ${x.amount < 0 ? 'neg' : 'pos'}">${x.amount > 0 ? '+' : ''}${gold(x.amount)}</td><td class="muted">${esc(x.note ?? x.refId ?? '')}</td></tr>`).join('');
  return `<p class="muted">Đổi số dư = một giao dịch “Điều chỉnh của quản trị” trong lịch sử (tiền chỉ đổi qua giao dịch). Gõ số rồi Enter.</p>
    <div class="wallet">${cards.join('')}</div>
    <section class="panel"><h3>Giao dịch gần nhất (${w.transactions.length})</h3><div class="table-wrap"><table class="table"><thead><tr><th>Lúc</th><th>Loại</th><th>Số tiền</th><th>Ghi chú</th></tr></thead><tbody>${tx || '<tr><td colspan="4" class="muted">Chưa có</td></tr>'}</tbody></table></div></section>`;
}

function bag(): string {
  const w = draft();
  const items = w.inventory.items;
  const known = Object.values(ITEMS);
  const unknown = Object.keys(items).filter((id) => !ITEMS[id as keyof typeof ITEMS]);
  const cats = [...new Set(known.map((i) => i.category))];
  const cell = (id: string, cat: string, rarity: string) => {
    const n = items[id] ?? 0;
    return `<div class="item-cell${n ? ' has' : ''}" data-item-cell data-cat="${esc(cat)}" data-text="${esc(`${id} ${nameOf(id) ?? ''}`.toLowerCase())}">
      ${thumb(imageOf(id))}<span><b>${esc(nameOf(id) ?? id)}</b><small>${esc(ENUM_LABEL[rarity] ?? rarity)} · ${esc(id)}</small></span>
      <input type="number" min="0" step="1" value="${n}" data-item="${esc(id)}" aria-label="${esc(nameOf(id) ?? id)}" /></div>`;
  };
  const used = W.summary(w).bagSlots;
  return `<section class="panel"><h3>Túi đồ chung <span class="muted">${used}/${INVENTORY.slots} ô (mỗi ô tối đa ${INVENTORY.stack})</span></h3>
      <div class="progress"><span style="width:${Math.min(100, (used / INVENTORY.slots) * 100)}%"></span></div>
      ${used > INVENTORY.slots ? '<p class="issue warn">Túi đang vượt số ô: game vẫn giữ đồ nhưng người chơi không nhận thêm được cho tới khi dùng bớt.</p>' : ''}</section>
    <div class="toolbar"><input type="search" class="search-input" placeholder="Tìm vật phẩm…" data-bag-search />
      <select data-bag-cat><option value="">Mọi loại</option>${cats.map((c) => `<option value="${esc(c)}">${esc(ENUM_LABEL[c] ?? humanize(c))}</option>`).join('')}</select>
      <label class="check"><input type="checkbox" data-bag-owned /> Chỉ món đang có</label>
      <button class="btn btn-small" data-bag-clear>Xoá sạch túi</button></div>
    <div class="item-grid">${known.map((i) => cell(i.id, i.category, i.rarity)).join('')}${unknown.map((id) => cell(id, 'UNKNOWN', 'không rõ')).join('')}</div>`;
}

function progress(): string {
  const w = draft();
  const s = W.summary(w);
  const xpRows = AREAS.modules.map((m) => `<tr><td>${areaIcon(m.manifest.id)} ${esc(m.manifest.name.vi)}</td><td><input type="number" min="0" step="1" value="${areaXp(w, m.manifest.id)}" data-area-xp="${esc(m.manifest.id)}" /></td></tr>`).join('');
  const tiles = AREAS.modules.map((m) => {
    const id = m.manifest.id;
    const on = w.world.unlockedAreas.includes(id);
    const u = m.manifest.unlock;
    const rule = u.worldLevel === undefined && u.worldDevelopment === undefined ? 'Mở từ đầu' : `Mở ở cấp ${u.worldLevel ?? '—'}${u.worldDevelopment !== undefined ? ` + phát triển ${u.worldDevelopment}` : ''}`;
    return `<div class="area-tile${on ? '' : ' is-off'}"><h4>${areaIcon(id)} ${esc(m.manifest.name.vi)} ${switchRow(`data-area-open="${esc(id)}"`, '', on)}</h4>
      <small class="muted">${esc(rule)} · ${id in w.areas ? 'có dữ liệu' : 'chưa có dữ liệu (mở sẽ tạo mới)'}</small></div>`;
  }).join('');
  const stats = [...new Set([...STAT_ID_VALUES, ...Object.keys(w.progression.stats)])];
  const daily = w.progression.daily;
  return `<div class="grid-2"><section class="panel"><h3>KN Sobi World — cấp ${s.level}</h3>
      ${numberField('data-world-xp', 'Tổng KN (phần chênh cộng vào khu Farm)', s.xp)}
      <p class="muted">Bảng cấp: ${WORLD_LEVELS.xp.slice(0, 6).map(gold).join(' · ')} … (cấp tối đa ${WORLD_LEVELS.maxLevel}).</p>
      <table class="table"><thead><tr><th>Khu</th><th>KN của khu</th></tr></thead><tbody>${xpRows}</tbody></table></section>
    <section class="panel"><h3>Quà đăng nhập</h3><div class="form-grid">${numberField('data-streak', 'Chuỗi ngày', daily.streak)}
      ${switchRow('data-daily-today', 'Hôm nay đã nhận quà', daily.lastDay === today())}</div>
      <p class="muted">Lần nhận gần nhất: ${daily.lastDay === null ? 'chưa' : new Date(daily.lastDay * DAY_MS).toLocaleDateString('vi-VN')}.</p></section></div>
    <section class="panel"><h3>Các khu</h3><p class="muted">Bật = người chơi vào được khu đó (khu chưa có dữ liệu được tạo mới như lần mở đầu). Tắt chỉ khoá lại, dữ liệu vẫn giữ.</p>
      <div class="area-tiles">${tiles}</div></section>
    <section class="panel"><h3>Bộ đếm thành tích</h3><div class="sf-grid">${stats.map((k) => numberField(`data-stat="${esc(k)}"`, STAT_LABEL[k] ?? humanize(k), w.progression.stats[k] ?? 0)).join('')}</div></section>`;
}

function checks(attr: string, entries: readonly { id: string; label: string; sub?: string }[], on: (id: string) => boolean): string {
  return `<div class="check-grid">${entries.map((e) => `<label class="check"><input type="checkbox" ${attr}="${esc(e.id)}" ${on(e.id) ? 'checked' : ''} /> <span>${esc(e.label)}${e.sub ? ` <small class="muted">${esc(e.sub)}</small>` : ''}</span></label>`).join('')}</div>`;
}

function codex(): string {
  const w = draft();
  const kinds = W.codexKinds().map((k) => {
    const found = new Set(w.collection.discovered[k.id] ?? []);
    return `<details class="sf-group" data-codex="${esc(k.id)}"><summary><b>${esc(k.name)}</b> <span class="muted">${found.size}/${k.entries.length}</span></summary><div class="sf-group__body">
      <p class="toolbar"><button class="btn btn-small" data-codex-all="${esc(k.id)}">Chọn hết</button><button class="btn btn-small" data-codex-none="${esc(k.id)}">Bỏ hết</button></p>
      ${checks('data-codex-entry', k.entries.map((e) => ({ id: `${k.id}|${e.id}`, label: e.name, sub: e.id })), (id) => found.has(id.split('|')[1]!))}</div></details>`;
  }).join('');
  const claimed = w.progression.claimed;
  return `<section class="panel"><h3>Bộ sưu tập (Codex)</h3><p class="muted">Tick = đã khám phá. Bỏ tick thì người chơi khám phá lại (và nhận lại thưởng khám phá).</p>${kinds}</section>
    <section class="panel"><h3>Mốc sưu tầm đã nhận (${w.collection.claimed.length}/${CODEX_RULES.milestones.length})</h3>
      ${checks('data-milestone', CODEX_RULES.milestones.map((m) => ({ id: m.id, label: `${m.entries} mục`, sub: m.id })), (id) => w.collection.claimed.includes(id))}</section>
    <section class="panel"><h3>Thành tựu đã nhận thưởng (${Object.keys(claimed).length}/${ACHIEVEMENTS.length})</h3>
      <p class="muted">Bỏ chọn = người chơi nhận lại được (không trừ thưởng đã nhận). Chọn = coi như đã nhận, không cộng thưởng.</p>
      ${checks('data-ach', ACHIEVEMENTS.map((a) => ({ id: a.id, label: nameOf(a.id) ?? a.id, sub: `${a.gems} Ngọc` })), (id) => id in claimed)}</section>`;
}

function world(): string {
  return `${liveSection(draft())}
    <section class="panel"><h3>⏩ Tua thời gian</h3>
      <p class="muted">Như người chơi đã tắt game từ lâu: mọi mốc thời gian của mọi khu lùi lại. Lần mở game tới sẽ bù đúng khoảng đó (đói, phân, cây lớn, cá, bệnh… và màn “Trong lúc bạn vắng mặt”). Lưu xong mới mở game.</p>
      <p class="toolbar">${[['1 giờ', 3_600_000], ['8 giờ', 8 * 3_600_000], ['1 ngày', DAY_MS], ['3 ngày', 3 * DAY_MS], ['7 ngày', 7 * DAY_MS]].map(([l, ms]) => `<button class="btn" data-rewind="${ms}">+${l}</button>`).join('')}</p></section>
    ${partEditor(['goals'], '📋 Bảng đơn & mục tiêu ngày')}
    ${partEditor(['player'], '🧒 Nhân vật (vị trí đứng)')}`;
}

function advanced(): string {
  const o = users.open!;
  return `<section class="panel"><h3>JSON của cả save</h3>
      <p class="muted">Sửa trực tiếp rồi bấm “Áp dụng JSON” — kiểm bằng đúng bộ đọc save của game (save cũ được nâng cấp như khi game mở). Chỉ dùng khi các tab khác không có chỗ sửa.</p>
      <textarea class="mono" rows="18" data-raw spellcheck="false">${esc(JSON.stringify(o.draft, null, 2))}</textarea>
      <p class="toolbar"><button class="btn btn-primary" data-raw-apply>Áp dụng JSON</button><button class="btn" data-download>⬇ Tải bản nháp (.json)</button></p></section>
    <section class="panel danger-zone"><h3>Vùng nguy hiểm</h3>
      <p><button class="btn btn-danger" data-act="reset">↺ Chơi lại từ đầu (thế giới mới)</button> <span class="muted">Bản cũ vào backups khi lưu.</span></p>
      ${o.source === 'disk' ? '<p><button class="btn btn-danger" data-act="archive">🗑 Xoá save (chuyển vào backups)</button></p>' : ''}</section>`;
}

export function userTabBody(tab: Tab): string {
  if (tab.startsWith('area:')) {
    const id = tab.slice(5);
    if (!(id in draft().areas)) return `<div class="panel empty-guide"><h3>${areaIcon(id)} Khu chưa có dữ liệu</h3><p>Người chơi chưa mở khu này. Bật ở tab <b>Tiến trình & khu</b> để tạo dữ liệu khởi đầu.</p></div>`;
    return id === 'sobi_farm' ? farmTab() : partEditor(['areas', id], `${areaIcon(id)} Dữ liệu ${AREAS.get(id)?.manifest.name.vi ?? id}`, true);
  }
  const bodies: Record<string, () => string> = { overview, wallet, bag, progress, codex, world, advanced };
  return (bodies[tab] ?? overview)();
}

/** Commits a number field on change (Enter / leaving it). */
const onNumber = (root: HTMLElement, sel: string, fn: (el: HTMLInputElement, n: number) => W.Edit, rerender: () => void) =>
  root.querySelectorAll<HTMLInputElement>(sel).forEach((el) => el.addEventListener('change', () => edit(fn(el, Number(el.value)), rerender)));

export function bindUserTab(tab: Tab, root: HTMLElement, page: HTMLElement, rerender: () => void, hooks: { archive: () => Promise<void> }) {
  void loadNames();
  if (tab === 'area:sobi_farm') bindFarmTab(root, rerender);
  root.querySelectorAll<HTMLElement>('[data-part]').forEach((host) => bindPart(host, page, rerender));
  root.querySelectorAll<HTMLInputElement>('[data-setting]').forEach((el) =>
    el.addEventListener('change', () => edit(W.setSettings({ [el.dataset.setting!]: el.checked }), rerender)));
  root.querySelectorAll<HTMLElement>('[data-give]').forEach((b) =>
    b.addEventListener('click', () => {
      const [c, n] = b.dataset.give!.split(':') as [Currency, string];
      edit(W.setCurrency(c, draft().wallet[c] + Number(n), now(), rng), rerender);
    }));
  onNumber(root, '[data-currency]', (el, n) => W.setCurrency(el.dataset.currency as Currency, n, now(), rng), rerender);
  // Bag: filters hide cells in place (no redraw: the numbers typed stay).
  const filterBag = () => {
    const q = root.querySelector<HTMLInputElement>('[data-bag-search]')?.value.trim().toLowerCase() ?? '';
    const cat = root.querySelector<HTMLSelectElement>('[data-bag-cat]')?.value ?? '';
    const owned = root.querySelector<HTMLInputElement>('[data-bag-owned]')?.checked ?? false;
    root.querySelectorAll<HTMLElement>('[data-item-cell]').forEach((c) => {
      c.hidden = (!!q && !(c.dataset.text ?? '').includes(q)) || (!!cat && c.dataset.cat !== cat) || (owned && !c.classList.contains('has'));
    });
  };
  root.querySelector('[data-bag-search]')?.addEventListener('input', filterBag);
  root.querySelector('[data-bag-cat]')?.addEventListener('change', filterBag);
  root.querySelector('[data-bag-owned]')?.addEventListener('change', filterBag);
  onNumber(root, '[data-item]', (el, n) => W.setItems({ [el.dataset.item!]: n }), rerender);
  root.querySelector('[data-bag-clear]')?.addEventListener('click', () =>
    confirmDanger('Xoá sạch túi', 'Bỏ mọi vật phẩm khỏi túi đồ chung?', 'Xoá sạch', () => edit(W.setItems(Object.fromEntries(Object.keys(draft().inventory.items).map((id) => [id, 0]))), rerender)));
  // Progress
  onNumber(root, '[data-world-xp]', (_el, n) => W.setWorldXp(n), rerender);
  onNumber(root, '[data-area-xp]', (el, n) => W.setAreaXp(el.dataset.areaXp!, n), rerender);
  onNumber(root, '[data-stat]', (el, n) => W.setStats({ [el.dataset.stat!]: n }), rerender);
  onNumber(root, '[data-streak]', (_el, n) => W.setDaily(n, draft().progression.daily.lastDay), rerender);
  root.querySelector<HTMLInputElement>('[data-daily-today]')?.addEventListener('change', (e) => {
    const d = draft().progression.daily;
    edit(W.setDaily(d.streak, (e.target as HTMLInputElement).checked ? today() : d.lastDay === today() ? today() - 1 : d.lastDay), rerender);
  });
  root.querySelectorAll<HTMLInputElement>('[data-area-open]').forEach((el) =>
    el.addEventListener('change', () => {
      const open = new Set(draft().world.unlockedAreas);
      if (el.checked) open.add(el.dataset.areaOpen!);
      else open.delete(el.dataset.areaOpen!);
      edit(W.setUnlockedAreas([...open], now(), rng), rerender);
    }));
  // Codex & achievements
  const kindIds = (kind: string) => W.codexKinds().find((k) => k.id === kind)?.entries.map((e) => e.id) ?? [];
  root.querySelectorAll<HTMLInputElement>('[data-codex-entry]').forEach((el) =>
    el.addEventListener('change', () => {
      const [kind, id] = el.dataset.codexEntry!.split('|') as [string, string];
      const ids = new Set(draft().collection.discovered[kind] ?? []);
      if (el.checked) ids.add(id);
      else ids.delete(id);
      edit(W.setDiscovered(kind, [...ids]), rerender);
    }));
  root.querySelectorAll<HTMLElement>('[data-codex-all]').forEach((b) => b.addEventListener('click', () => edit(W.setDiscovered(b.dataset.codexAll!, kindIds(b.dataset.codexAll!)), rerender)));
  root.querySelectorAll<HTMLElement>('[data-codex-none]').forEach((b) => b.addEventListener('click', () => edit(W.setDiscovered(b.dataset.codexNone!, []), rerender)));
  root.querySelectorAll<HTMLDetailsElement>('[data-codex]').forEach((d) => {
    const key = `sobi-admin:codex-open:${d.dataset.codex}`;
    d.open = sessionStorage.getItem(key) === '1';
    d.addEventListener('toggle', () => sessionStorage.setItem(key, d.open ? '1' : '0'));
  });
  const checked = (attr: string) => [...root.querySelectorAll<HTMLInputElement>(`[${attr}]`)].filter((i) => i.checked).map((i) => i.getAttribute(attr)!);
  root.querySelectorAll<HTMLInputElement>('[data-milestone]').forEach((el) => el.addEventListener('change', () => edit(W.setCodexClaimed(checked('data-milestone')), rerender)));
  root.querySelectorAll<HTMLInputElement>('[data-ach]').forEach((el) => el.addEventListener('change', () => edit(W.setClaimed(checked('data-ach'), now()), rerender)));
  // World & time
  bindLiveSection(root, rerender);
  root.querySelectorAll<HTMLElement>('[data-rewind]').forEach((b) => b.addEventListener('click', () => edit(W.rewind(Number(b.dataset.rewind)), rerender)));
  // Advanced
  root.querySelector('[data-raw-apply]')?.addEventListener('click', () => edit(W.replaceAll(root.querySelector<HTMLTextAreaElement>('[data-raw]')!.value), rerender));
  root.querySelector('[data-download]')?.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(draft())], { type: 'application/json' }));
    a.download = `sobiworld-save-admin-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  });
  const act: Record<string, () => void> = {
    reset: () => confirmDanger('Chơi lại từ đầu', 'Thay toàn bộ save bằng một thế giới mới (tiền, heo, mọi khu, tiến trình về ban đầu). Bản cũ vào backups khi lưu.', 'Reset save', () => edit(W.resetWorld(now(), rng), rerender), 'RESET'),
    archive: () => confirmDanger('Xoá save', 'Chuyển save.json vào backups/ — game sẽ bắt đầu thế giới mới, vẫn khôi phục được trong Cài đặt → Khôi phục bản sao lưu.', 'Xoá save', hooks.archive, 'XOA'),
  };
  root.querySelectorAll<HTMLElement>('[data-act]').forEach((b) => b.addEventListener('click', () => act[b.dataset.act!]?.()));
}
