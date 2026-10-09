// Property panel of the layout editor (DECISIONS AD-1): position, size, layer, transform, state,
// asset and interaction of the selected placement, and the form → placement patch.
import { FARM_ACTIONS } from '../../src/areas/farm/scene/config/layout';
import { vi } from '../../src/i18n/vi';
import { esc } from './labels';
import type { Design, Placement } from './layoutModel';
import { sizeOf } from './layoutStage';
import { artUrl as urlOf } from './store';
import { pickButton } from './picker';

export const LAYER_LABEL = ['0 · Trời / mây', '1 · Hậu cảnh xa', '2 · Mặt đất', '3 · Trang trí nền', '4 · Cùng lớp heo (xếp theo Y)', '5 · Trên cùng'];
const ACTION_LABEL: Record<string, string> = { ...vi.farm };

const field = (label: string, name: string, value: unknown, type = 'number', attrs = '') =>
  `<label class="field"><span>${label}</span><input type="${type}" name="${name}" value="${esc(value ?? '')}" ${attrs} /></label>`;

/** The plaza's doors the property panel offers: portal id → name of its Area. */
export type PortalChoices = readonly (readonly [string, string])[];

export function properties(list: readonly Placement[], i: number | null, design: Design, portals?: PortalChoices): string {
  const p = i === null ? null : list[i];
  if (!p || i === null) return '<p class="muted">Chọn một vật trên khung để sửa. Kéo asset từ thư viện bên trái vào khung để thêm.</p>';
  const nat = sizeOf(urlOf(p.id));
  const opt = (values: readonly string[], cur: string | undefined, none: string) =>
    [`<option value="">${none}</option>`, ...values.map((v) => `<option value="${v}"${v === cur ? ' selected' : ''}>${esc(ACTION_LABEL[v] ?? v)}</option>`)].join('');
  return `<form class="props" data-props>
    <div class="props__head">${urlOf(p.id) ? `<img class="thumb" src="${esc(urlOf(p.id)!)}" alt="" />` : ''}<div><b>${esc(p.label ?? p.id)}</b><small class="mono">#${i + 1} · ${esc(p.id)} · ảnh gốc ${nat.w}×${nat.h}</small></div></div>
    <h4>Vị trí (px, điểm neo = ${Math.round((p.originX ?? 0.5) * 100)}% ngang, ${Math.round((p.originY ?? 1) * 100)}% dọc)</h4>
    <div class="form-grid">${field('X', 'x', Math.round(p.x * design.width))}${field('Y', 'y', Math.round(p.y * design.height))}</div>
    <h4>Kích thước (trống = theo ảnh gốc / giữ tỷ lệ)</h4>
    <div class="form-grid">${field('Rộng', 'width', p.width, 'number', 'min="1"')}${field('Cao', 'height', p.height, 'number', 'min="1"')}</div>
    <div class="dn__buttons"><button type="button" class="btn btn-small" data-quick="native">↺ Cỡ gốc</button><button type="button" class="btn btn-small" data-quick="ratio">⛓ Giữ tỷ lệ (bỏ Cao)</button>
      <button type="button" class="btn btn-small" data-quick="centerX">↔ Căn giữa ngang</button></div>
    <h4>Lớp</h4>
    <div class="form-grid"><label class="field span-2"><span>Layer / z-index</span><select name="layer">${LAYER_LABEL.map((l, k) => `<option value="${k}"${k === p.layer ? ' selected' : ''}>${l}</option>`).join('')}</select></label></div>
    <div class="dn__buttons"><button type="button" class="btn btn-small" data-order="back">⇊ Dưới cùng</button><button type="button" class="btn btn-small" data-order="down">↓ Xuống</button>
      <button type="button" class="btn btn-small" data-order="up">↑ Lên</button><button type="button" class="btn btn-small" data-order="front">⇈ Trên cùng</button></div>
    <h4>Biến đổi</h4>
    <div class="form-grid">${field('Xoay (°)', 'rotation', p.rotation ?? 0, 'number', 'min="-360" max="360" step="1"')}
      <label class="field"><span>Phóng to (× rộng/cao)</span><span class="dn__buttons"><button type="button" class="btn btn-small" data-scale="0.9">−10%</button><button type="button" class="btn btn-small" data-scale="1.1">+10%</button></span></label>
      <label class="check"><input type="checkbox" name="flipX" ${p.flipX ? 'checked' : ''} /> Lật ngang</label></div>
    <h4>Trạng thái</h4>
    <div class="form-grid"><label class="check"><input type="checkbox" name="visible" ${p.visible === false ? '' : 'checked'} /> Hiển thị</label>
      <label class="check"><input type="checkbox" name="locked" ${p.locked ? 'checked' : ''} /> Khoá (không kéo được)</label></div>
    <h4>Asset & tương tác</h4>
    <div class="form-grid">
      ${field('Tên trong editor', 'label', p.label ?? '', 'text', 'maxlength="40"')}
      <div class="field span-2"><span>Asset hiện tại → thay</span>${pickButton('id', p.id, urlOf(p.id), p.id)}</div>
      ${portals
        ? `<label class="field"><span>Cổng dẫn tới</span><select name="portal"><option value="">— không phải cổng —</option>${portals.map(([id, name]) => `<option value="${id}"${id === p.portal ? ' selected' : ''}>${esc(name)}</option>`).join('')}</select></label>
      <label class="check"><input type="checkbox" name="solid" ${p.solid ? 'checked' : ''} /> Chặn đường (nhân vật không đi xuyên)</label>`
        : `<label class="field"><span>Bấm vào mở</span><select name="action">${opt(FARM_ACTIONS, p.action, '— không —')}</select></label>
      <label class="check"><input type="checkbox" name="signed" ${p.signed ? 'checked' : ''} /> Ảnh có sẵn biển tên</label>`}
    </div>
    <p class="muted">${p.role ? `Vai trò: <b>${esc(p.role)}</b> (duy nhất, giữ nguyên). ` : ''}Lớp 4 được game xếp theo Y cùng heo.</p>
    <div class="dn__buttons"><button type="button" class="btn btn-small" data-dup>⧉ Nhân bản</button><button type="button" class="btn btn-small btn-danger" data-del>🗑 Xoá khỏi layout</button></div>
  </form>`;
}

export function readProps(f: HTMLFormElement, design: Design, plaza = false): Partial<Placement> {
  const d = new FormData(f);
  const n = (k: string) => (String(d.get(k) ?? '').trim() === '' ? undefined : Number(d.get(k)));
  const s = (k: string) => String(d.get(k) ?? '').trim() || undefined;
  return {
    x: (n('x') ?? 0) / design.width, y: (n('y') ?? 0) / design.height, width: n('width'), height: n('height'),
    layer: Number(d.get('layer')), rotation: n('rotation') ?? 0, flipX: d.get('flipX') === 'on', visible: d.get('visible') === 'on',
    locked: d.get('locked') === 'on', label: s('label'), id: String(d.get('id')),
    ...(plaza ? { portal: s('portal'), solid: d.get('solid') === 'on' } : { action: s('action') as Placement['action'], signed: d.get('signed') === 'on' }),
  };
}

