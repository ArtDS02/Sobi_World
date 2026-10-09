// Overview page: totals, asset completion, distribution by rarity and family, open issues.
import { FAMILY_VALUES } from '../../src/areas/farm/logic/config/breeds';
import { RARITY_VALUES } from '../../src/core/config/rarity';
import { FAMILY_LABEL, RARITY_LABEL, art, esc, isNew } from './labels';
import { PRODUCTS } from '../../src/core/config/products';
import { PAIR_RULES } from '../../src/areas/farm/logic/config/breedingPairs';
import { state } from './store';

function card(icon: string, label: string, value: number | string, tone = '', href = '') {
  const tag = href ? 'a' : 'div';
  return `<${tag} class="stat ${tone}"${href ? ` href="${href}"` : ''}>
    <span class="stat__icon">${icon}</span>
    <span class="stat__value">${esc(value)}</span>
    <span class="stat__label">${esc(label)}</span></${tag}>`;
}

function bars(title: string, entries: [string, number, string][]) {
  const max = Math.max(1, ...entries.map((e) => e[1]));
  const rows = entries
    .map(
      ([label, n, cls]) => `<div class="bar">
        <span class="bar__label">${esc(label)}</span>
        <span class="bar__track"><span class="bar__fill ${cls}" style="width:${(n / max) * 100}%"></span></span>
        <span class="bar__value">${n}</span></div>`,
    )
    .join('');
  return `<section class="panel"><h3>${esc(title)}</h3>${rows}</section>`;
}

export function renderOverview(root: HTMLElement) {
  const rows = state.rows;
  const complete = rows.filter((r) => art(r).complete).length;
  const missing = rows.length - complete;
  const used = new Set(rows.flatMap((r) => {
    const m = art(r).manifest;
    return m ? [m.asset, m.sleepAsset ?? ''].filter(Boolean) : [];
  }));
  const errors = state.issues.filter((i) => i.level === 'error').length;
  const warns = state.issues.filter((i) => i.level === 'warn').length;
  const pct = rows.length ? Math.round((complete / rows.length) * 100) : 0;
  const unusedSource = state.inventory.filter((i) => !i.inGame && i.importedAs.length === 0).length;
  const unregistered = state.library.filter((i) => !i.rowId).length;

  const byRarity = RARITY_VALUES.map((r): [string, number, string] => [
    RARITY_LABEL[r]!, rows.filter((x) => x.rarity === r).length, `rarity-${r.toLowerCase()}`,
  ]);
  const byFamily = FAMILY_VALUES.map((f): [string, number, string] => [
    FAMILY_LABEL[f]!, rows.filter((x) => x.family === f).length, 'fill-family',
  ]).filter((e) => e[1] > 0);

  const top = state.issues.filter((i) => i.level !== 'info').slice(0, 6);
  const issueList = top.length
    ? top.map((i) => `<li class="issue ${i.level}"><b>${esc(i.speciesId ?? 'Asset')}</b> ${esc(i.text)}</li>`).join('')
    : '<li class="issue ok">✓ Không có lỗi hay cảnh báo</li>';

  root.innerHTML = `
    <div class="stats">
      ${card('🐷', 'Tổng số heo', rows.length, '', '#/pigs')}
      ${card('🎨', 'Concept art', state.pigs.length, '', '#/assets')}
      ${card('✅', 'Hoàn chỉnh', complete, 'tone-ok', '#/pigs?status=ok')}
      ${card('🧩', 'Thiếu asset', missing, missing ? 'tone-warn' : '', '#/pigs?status=warn')}
      ${card('🆕', 'Heo mới', rows.filter(isNew).length, 'tone-new', '#/pigs?status=new')}
      ${card('🖼️', 'Asset đang dùng', used.size)}
      ${card('⚠️', 'Vấn đề cần xử lý', errors + warns, errors ? 'tone-error' : warns ? 'tone-warn' : 'tone-ok', '#/validation')}
      ${card('📥', 'Ảnh nguồn chưa dùng', unusedSource, unusedSource ? 'tone-warn' : '', '#/assets?status=new')}
      ${card('📝', 'Ảnh chưa đăng ký manifest', unregistered, unregistered ? 'tone-error' : 'tone-ok', '#/library?reg=no')}
      ${card('🛒', 'Sản phẩm đang bán', PRODUCTS.filter((p) => p.active).length, '', '#/products')}
      ${card('🧬', 'Luật phối giống', PAIR_RULES.filter((r) => r.active).length, '', '#/breeding')}
      ${card('👤', 'Người chơi (save)', '→', '', '#/users')}
    </div>
    <section class="panel">
      <h3>Tiến độ asset</h3>
      <div class="progress"><span style="width:${pct}%"></span></div>
      <p class="muted">${complete}/${rows.length} heo có đủ asset bắt buộc (ảnh nhìn phải 512², trái = lật ngang, con = thu nhỏ khi chạy). Trước/sau không sản xuất theo chuẩn art §2.</p>
    </section>
    <div class="grid-2">
      ${bars('Theo độ hiếm', byRarity)}
      ${bars('Theo nhóm / chủ đề', byFamily)}
    </div>
    <section class="panel">
      <h3>Vấn đề mới nhất <a class="link" href="#/validation">Xem tất cả →</a></h3>
      <ul class="issues">${issueList}</ul>
    </section>`;
}
