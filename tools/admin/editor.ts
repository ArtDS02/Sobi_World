// Pig detail / editor drawer: preview (adult/baby, four directions, sleep) and the gameplay fields
// the game really has. An empty stat field inherits the rarity tier (same rule as breeds.ts).
import type { SpeciesRowData } from '../../scripts/admin/speciesText';
import { WORLD_LEVELS } from '../../src/core/config/progression';
import { FAMILY_VALUES, RARITY_TIER } from '../../src/areas/farm/logic/config/breeds';
import { FARM_VIEW } from '../../src/areas/farm/scene/config/farmView';
import { RARITY_VALUES } from '../../src/core/config/rarity';
import { FAMILY_LABEL, RARITY_LABEL, art, assetUrl, esc, gold, hexColor, hours, rowImage, stats } from './labels';
import { openPicker, pickButton, type PickItem } from './picker';
import { freeArtIds, state, updateRow } from './store';

const NUMBERS = ['buyGold', 'unlockLevel', 'sellGold', 'growthSec', 'pregnancySec', 'maxWeight'] as const;
const FIELD_LABEL: Record<(typeof NUMBERS)[number], string> = {
  buyGold: 'Giá mua (trống = không bán, chỉ lai)',
  unlockLevel: `Cấp mở khoá shop (1–${WORLD_LEVELS.maxLevel})`,
  sellGold: 'Giá bán gốc',
  growthSec: 'Thời gian trưởng thành (giây)',
  pregnancySec: 'Thời gian mang thai (giây)',
  maxWeight: 'Cân nặng tối đa (kg, hiển thị)',
};

function dirCell(label: string, body: string) {
  return `<figure class="dir"><div class="dir__img">${body}</div><figcaption>${label}</figcaption></figure>`;
}

function preview(row: SpeciesRowData, baby: boolean) {
  const a = art(row);
  const src = esc(rowImage(row));
  const scale = baby ? FARM_VIEW.PIG_GROWTH_SCALE.baby : FARM_VIEW.PIG_GROWTH_SCALE.adult;
  const img = (flip: boolean) => a.right
    ? `<img src="${src}" alt="" style="transform:scale(${flip ? -scale : scale}, ${scale})" />`
    : '<span class="missing">✕ Thiếu ảnh</span>';
  const na = '<span class="na">Không sản xuất<br /><small>chuẩn art §2</small></span>';
  const sleep = a.manifest?.sleepAsset
    ? a.sleep ? `<img src="${esc(assetUrl(a.manifest.sleepAsset))}" alt="" />` : '<span class="missing">✕ Thiếu file</span>'
    : '<span class="na">Ảnh thường + fx_zzz<br /><small>DECISIONS Q5</small></span>';
  return `
    <div class="preview" style="--pig:${hexColor(row.color)}">
      <div class="preview__stage">${img(false)}</div>
      <div class="seg" role="tablist">
        <button data-stage="adult" class="${baby ? '' : 'is-on'}">Trưởng thành</button>
        <button data-stage="baby" class="${baby ? 'is-on' : ''}">Heo con (×${FARM_VIEW.PIG_GROWTH_SCALE.baby})</button>
      </div>
    </div>
    <div class="dirs">
      ${dirCell(`Trái ${a.left ? '✓' : '✕'} <small>lật ngang</small>`, img(true))}
      ${dirCell(`Phải ${a.right ? '✓' : '✕'}`, img(false))}
      ${dirCell('Trước —', na)}
      ${dirCell('Sau —', na)}
      ${dirCell(`Ngủ ${a.sleep === false ? '✕' : a.sleep ? '✓' : '—'}`, sleep)}
    </div>`;
}

/** Every pig image for the picker: free ones selectable, ones another species uses greyed out. */
function artChoices(row: SpeciesRowData): PickItem[] {
  const ids = [...new Set([...state.pigs.map((p) => p.id), ...freeArtIds(row.id)])];
  return ids.map((id) => {
    const m = state.pigs.find((p) => p.id === id);
    const owner = state.rows.find((r) => r.artId === id && r.id !== row.id);
    return {
      id,
      label: m?.nameVi ?? id,
      url: `/assets/${m?.asset ?? `pigs/base/${id}.png`}`,
      group: owner ? 'Đang dùng bởi heo khác' : m ? 'Chưa gán heo' : 'Chưa đăng ký manifest',
      note: m ? id : `${id} · đăng ký khi lưu`,
      blocked: owner ? `Đang dùng: ${owner.nameVi}` : null,
    };
  });
}

function form(row: SpeciesRowData, isNew: boolean) {
  const tier = RARITY_TIER[row.rarity as keyof typeof RARITY_TIER];
  const s = stats(row);
  const sel = (name: string, values: readonly string[], labels: Record<string, string>, cur: string) =>
    `<select name="${name}">${values.map((v) => `<option value="${v}"${v === cur ? ' selected' : ''}>${esc(labels[v] ?? v)}</option>`).join('')}</select>`;
  const num = (k: (typeof NUMBERS)[number]) => {
    const own = row[k];
    const ph = k === 'buyGold' ? 'không bán' : k === 'unlockLevel' ? '1' : String((tier as Record<string, unknown>)?.[k] ?? '—');
    return `<label class="field"><span>${FIELD_LABEL[k]}</span>
      <input type="number" min="0" step="1" name="${k}" value="${own ?? ''}" placeholder="${esc(ph)} (mặc định)" /></label>`;
  };
  const issues = state.issues.filter((i) => i.speciesId === row.id);
  return `
    <form class="editor-form">
      <div class="form-grid">
        <label class="field"><span>Tên heo</span><input name="nameVi" value="${esc(row.nameVi)}" required /></label>
        <label class="field"><span>Pig ID</span><input name="id" value="${esc(row.id)}" ${isNew ? '' : 'readonly'} placeholder="PIG_TEN_HEO" /></label>
        <label class="field"><span>Độ hiếm</span>${sel('rarity', RARITY_VALUES, RARITY_LABEL, row.rarity)}</label>
        <label class="field"><span>Nhóm / chủ đề</span>${sel('family', FAMILY_VALUES, FAMILY_LABEL, row.family)}</label>
        <div class="field"><span>Ảnh (art id) <a class="link" href="#/library">Thư viện →</a></span>${pickButton('artId', row.artId, row.artId ? rowImage(row) : null, state.pigs.find((p) => p.id === row.artId)?.nameVi ?? (row.artId || 'Chọn ảnh'))}</div>
        <label class="field"><span>Màu dự phòng</span><input type="color" name="color" value="${hexColor(row.color)}" /></label>
        ${NUMBERS.map(num).join('')}
        <label class="check"><input type="checkbox" name="breedable" ${s.breedable ? 'checked' : ''} /> Lai được</label>
        <label class="check"><input type="checkbox" name="enabled" ${s.enabled ? 'checked' : ''} /> Đang dùng (bỏ chọn = tắt)</label>
      </div>
      <p class="muted">Suy ra (D16, không sửa): no đầy ${hours(s.growthSec / 3)} · sạch đầy ${hours(s.growthSec * 0.75)} · lớn ${hours(s.growthSec)} · bán ${gold(s.sellGold)} vàng.
        Hạnh phúc / đói / sức khoẻ do hệ chăm sóc chung tính, không có chỉ số riêng theo heo.</p>
      ${issues.length ? `<ul class="issues">${issues.map((i) => `<li class="issue ${i.level}">${esc(i.text)}</li>`).join('')}</ul>` : '<p class="ok-line">✓ Dữ liệu và asset hợp lệ</p>'}
      <div class="form-actions">
        <button type="button" class="btn" data-close>Đóng</button>
        <button type="submit" class="btn btn-primary">${isNew ? 'Thêm vào danh sách' : 'Áp dụng'}</button>
      </div>
    </form>`;
}

/** Form → row: a stat equal to its tier default is left out, so the table stays minimal. */
function readForm(f: HTMLFormElement): SpeciesRowData {
  const d = new FormData(f);
  const str = (k: string) => String(d.get(k) ?? '').trim();
  const row: SpeciesRowData = {
    id: str('id').toUpperCase(),
    nameVi: str('nameVi'),
    rarity: str('rarity'),
    family: str('family'),
    artId: str('artId'),
    color: parseInt(str('color').slice(1), 16),
  };
  const tier = RARITY_TIER[row.rarity as keyof typeof RARITY_TIER] as Record<string, unknown>;
  for (const k of NUMBERS) {
    const v = str(k);
    if (v === '') continue;
    const n = Number(v);
    if (k === 'unlockLevel' ? n !== 1 : k === 'buyGold' || tier[k] !== n) row[k] = n;
  }
  if (row.buyGold === undefined) delete row.unlockLevel;
  const breedable = d.get('breedable') === 'on';
  if (breedable !== tier.breedable) row.breedable = breedable;
  if (d.get('enabled') !== 'on') row.enabled = false;
  return row;
}

/** `presetArt`: "Tạo heo từ ảnh này" links (#/pigs/new?art=pig_x) preselect the image. */
export function renderEditor(host: HTMLElement, id: string | null, onClose: () => void, presetArt?: string) {
  const existing = id ? state.rows.find((r) => r.id === id) : undefined;
  const isNew = !existing;
  const art0 = presetArt && freeArtIds().includes(presetArt) ? presetArt : (freeArtIds()[0] ?? '');
  const name0 = state.pigs.find((p) => p.id === art0)?.nameVi ?? '';
  const suggestedId = art0.toUpperCase();
  let row: SpeciesRowData = existing ?? {
    id: suggestedId, nameVi: name0, rarity: 'COMMON', family: 'FARM', artId: art0, color: 0xf7a8b8,
  };
  let baby = false;
  const draw = () => {
    host.innerHTML = `<div class="drawer-backdrop" data-close></div>
      <aside class="drawer" role="dialog" aria-label="${esc(row.nameVi || 'Heo mới')}">
        <header class="drawer__head">
          <div><h2>${esc(row.nameVi || 'Heo mới')}</h2><p class="muted">${esc(row.id || 'Chưa có ID')} · ${esc(row.artId || 'chưa chọn ảnh')}</p></div>
          <button class="icon-btn" data-close aria-label="Đóng">✕</button>
        </header>
        ${row.artId ? preview(row, baby) : '<p class="empty">Chưa có ảnh trống để gán. Nhập hoặc tải ảnh lên ở <a href="#/assets">Asset nguồn</a> trước.</p>'}
        ${form(row, isNew)}
      </aside>`;
    const f = host.querySelector<HTMLFormElement>('form')!;
    f.addEventListener('change', () => {
      row = readForm(f);
      draw();
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const next = readForm(f);
      if (isNew && state.rows.some((r) => r.id === next.id)) return alert(`ID ${next.id} đã tồn tại`);
      updateRow(existing?.id ?? next.id, next);
      onClose();
    });
    host.querySelector('[data-picker="artId"]')?.addEventListener('click', () =>
      openPicker({
        title: 'Chọn ảnh cho heo',
        items: artChoices(row),
        current: row.artId,
        onPick: (id) => {
          f.querySelector<HTMLInputElement>('[name=artId]')!.value = id;
          row = readForm(f);
          // A fresh pig takes the art's manifest name when none was typed yet.
          if (isNew && !row.nameVi) row.nameVi = state.pigs.find((p) => p.id === id)?.nameVi ?? '';
          if (isNew && !row.id) row.id = id.toUpperCase();
          draw();
        },
      }),
    );
    host.querySelectorAll<HTMLElement>('[data-close]').forEach((b) => b.addEventListener('click', onClose));
    host.querySelectorAll<HTMLElement>('[data-stage]').forEach((b) =>
      b.addEventListener('click', () => {
        baby = b.dataset.stage === 'baby';
        draw();
      }),
    );
  };
  draw();
}
