// Overview page (decision 036): the whole Sobi World at a glance — what each Area holds (rows of its content files,
// how it opens), the players' saves, the art still missing, and the problems to fix. Every card links to its page.
import { ITEM_IDS } from '../../src/core/config/items';
import { RARITY_VALUES } from '../../src/core/config/rarity';
import { RARITY_LABEL, art, esc, isNew } from './labels';
import { json, state } from './store';

interface Data {
  files: Record<string, Record<string, unknown>>;
  saves: number;
}
let data: Data | null = null;
let loading = false;

async function loadData(rerender: () => void) {
  if (loading) return;
  loading = true;
  try {
    const [content, saves] = await Promise.all([
      json<{ files: Data['files'] }>('/__admin/content'),
      json<{ profiles: unknown[] }>('/__admin/saves').catch(() => ({ profiles: [] })),
    ]);
    data = { files: content.files, saves: saves.profiles.length };
  } catch {
    data = { files: {}, saves: 0 };
  }
  rerender();
}

const fileLink = (file: string) => `#/content/${encodeURIComponent(file)}`;
const rows = (file: string, key: string) => ((data?.files[file]?.[key] ?? []) as unknown[]).length;

function card(icon: string, label: string, value: number | string, href = '', tone = '') {
  const tag = href ? 'a' : 'div';
  return `<${tag} class="stat ${tone}"${href ? ` href="${href}"` : ''}><span class="stat__icon">${icon}</span>
    <span class="stat__value">${esc(value)}</span><span class="stat__label">${esc(label)}</span></${tag}>`;
}

interface AreaCard {
  id: string;
  icon: string;
  file: string;
  /** label, the content file and its list (null = the species draft), the page. */
  lines: (readonly [string, string | null, string])[];
}

const AREAS: AreaCard[] = [
  { id: 'farm', icon: '🐷', file: 'farm/area.json', lines: [['giống heo', null, ''], ['trang trí', 'farm/decor.json', 'decor']] },
  { id: 'garden', icon: '🌱', file: 'garden/area.json', lines: [['cây trồng', 'garden/crops.json', 'crops'], ['công thức lai', 'garden/hybrids.json', 'recipes']] },
  { id: 'aquarium', icon: '🐟', file: 'aquarium/area.json', lines: [['loài cá', 'aquarium/fish.json', 'fish'], ['cặp lai', 'aquarium/hybrids.json', 'recipes']] },
  { id: 'cloud', icon: '☁️', file: 'cloud/area.json', lines: [['loài hoa', 'cloud/flowers.json', 'flowers'], ['công thức lai', 'cloud/hybrids.json', 'recipes']] },
  { id: 'adventure', icon: '⚔️', file: 'adventure/area.json', lines: [['kẻ địch', 'adventure/enemies.json', 'enemies'], ['vùng', 'adventure/zones.json', 'zones'], ['kỹ năng', 'adventure/skills.json', 'skills']] },
];

function areaCard(a: AreaCard): string {
  const manifest = data?.files[a.file] as { name?: { vi?: string }; unlock?: { worldLevel?: number; worldDevelopment?: number } } | undefined;
  const unlock = manifest?.unlock;
  const opens = !unlock || (unlock.worldLevel === undefined && unlock.worldDevelopment === undefined)
    ? 'Mở từ đầu'
    : [unlock.worldLevel !== undefined ? `cấp ${unlock.worldLevel}` : '', unlock.worldDevelopment !== undefined ? `phát triển ${unlock.worldDevelopment}` : ''].filter(Boolean).join(' + ');
  const lines = a.lines.map(([label, file, key]) =>
    `<a href="${file ? fileLink(file) : '#/pigs'}"><b>${file ? rows(file, key) : state.rows.length}</b> ${esc(label)}</a>`);
  return `<section class="area-card area-${a.id}"><header><span class="area-card__icon">${a.icon}</span><div><h3>${esc(manifest?.name?.vi ?? a.id)}</h3>
    <small>${esc(opens)}</small></div></header><div class="area-card__lines">${lines.join('')}</div>
    <a class="link" href="${fileLink(a.file)}">Điều kiện mở khu →</a></section>`;
}

export function renderOverview(root: HTMLElement, rerender: () => void) {
  if (!data && state.apiOnline) void loadData(rerender);
  const pigs = state.rows;
  const complete = pigs.filter((r) => art(r).complete).length;
  const errors = state.issues.filter((i) => i.level === 'error').length;
  const warns = state.issues.filter((i) => i.level === 'warn').length;
  const unusedSource = state.inventory.filter((i) => !i.inGame && i.importedAs.length === 0).length;
  const unregistered = state.library.filter((i) => !i.rowId).length;
  const pct = pigs.length ? Math.round((complete / pigs.length) * 100) : 0;
  const top = state.issues.filter((i) => i.level !== 'info').slice(0, 6);
  const byRarity = RARITY_VALUES.map((r) => [RARITY_LABEL[r] ?? r, pigs.filter((x) => x.rarity === r).length, `rarity-${r.toLowerCase()}`] as const);
  const max = Math.max(1, ...byRarity.map((b) => b[1]));
  root.innerHTML = `
    <section class="hero"><div><h2>Chào mừng đến bảng quản trị Sobi World 👋</h2>
      <p>Sửa mọi nội dung của 5 khu (Farm, Garden, Aquarium, Cloud, Adventure), quản lý save của người chơi và asset. Mọi thay đổi đều được kiểm bằng chính luật của game trước khi ghi.</p></div>
      <div class="hero__actions"><a class="btn btn-primary" href="#/users">👤 Người chơi</a><a class="btn" href="#/content">📚 Nội dung game</a></div></section>
    <div class="stats">
      ${card('👤', 'Save người chơi', data ? data.saves : '…', '#/users')}
      ${card('📦', 'Vật phẩm', ITEM_IDS.length, fileLink('shared/items.json'))}
      ${card('⚙️', 'Công thức chế biến', data ? rows('shared/recipes.json', 'recipes') : '…', fileLink('shared/recipes.json'))}
      ${card('🎪', 'Lễ hội', data ? rows('shared/festivals.json', 'festivals') : '…', fileLink('shared/festivals.json'))}
      ${card('🏆', 'Thành tựu', data ? rows('shared/achievements.json', 'achievements') : '…', fileLink('shared/achievements.json'))}
      ${card('⚠️', 'Vấn đề dữ liệu heo', errors + warns, '#/validation', errors ? 'tone-error' : warns ? 'tone-warn' : 'tone-ok')}
    </div>
    <h3 class="section-title">Các khu</h3>
    <div class="area-grid">${AREAS.map(areaCard).join('')}</div>
    <div class="grid-2">
      <section class="panel"><h3>🎨 Asset heo</h3><div class="progress"><span style="width:${pct}%"></span></div>
        <p class="muted">${complete}/${pigs.length} giống heo có đủ ảnh · ${pigs.filter(isNew).length} giống mới.</p>
        <p><a class="chip" href="#/assets?status=new">📥 ${unusedSource} ảnh nguồn chưa dùng</a> <a class="chip${unregistered ? ' chip-error' : ''}" href="#/library?reg=no">📝 ${unregistered} ảnh chưa đăng ký</a></p>
        ${byRarity.map(([label, n, cls]) => `<div class="bar"><span class="bar__label">${esc(label)}</span><span class="bar__track"><span class="bar__fill ${cls}" style="width:${(n / max) * 100}%"></span></span><span class="bar__value">${n}</span></div>`).join('')}
      </section>
      <section class="panel"><h3>🩺 Vấn đề mới nhất <a class="link" href="#/validation">Xem tất cả →</a></h3>
        <ul class="issues">${top.length ? top.map((i) => `<li class="issue ${i.level}"><b>${esc(i.speciesId ?? 'Asset')}</b> ${esc(i.text)}</li>`).join('') : '<li class="issue ok">✓ Không có lỗi hay cảnh báo</li>'}</ul>
      </section>
    </div>`;
}
