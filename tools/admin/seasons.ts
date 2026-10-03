// Admin page "Mùa & hiệu ứng" (DECISIONS SE-1, MU-2): the seasonal art each building / prop has
// (missing season → default art) and the tuning of the seasonal environment FX — global on / off +
// density, per effect on / off, density and spawn rate. The effects themselves (art, motion,
// day / night condition) are config/seasonFx.ts; "Lưu" writes only its admin block through the dev
// API. Season preview of the farm: Bố cục nông trại → Mùa, or the game's ?season= dev flag.
import type { DayPhase } from '../../src/core/config/dayNight';
import { SEASON_FX_LIMITS, SEASON_FX_TUNING, type SeasonFxTuning } from '../../src/core/config/seasonFx';
import { SEASON_FX } from '../../src/core/config/seasonFxTable';
import { SEASON_IDS, type SeasonId } from '../../src/core/config/seasons';
import { seasonFxIssues } from '../../src/core/engine/seasonFx';
import { esc } from './labels';
import { json, post, rememberMessage, state } from './store';

const SEASON_LABEL: Record<SeasonId, string> = { spring: '🌸 Xuân', summer: '☀️ Hạ', autumn: '🍂 Thu', winter: '❄️ Đông' };
const PHASE_LABEL: Record<DayPhase, string> = {
  dawn: 'bình minh', morning: 'sáng', day: 'ngày', afternoon: 'chiều', sunset: 'hoàng hôn', night: 'đêm',
};

const LAYER_LABEL = { ground: 'dưới heo', air: 'trên cảnh', glow: 'phát sáng trên lớp đêm' } as const;

type Rows = { id: string; asset?: string; seasons?: Partial<Record<SeasonId, string>> }[];
const page = {
  draft: JSON.parse(JSON.stringify(SEASON_FX_TUNING)) as SeasonFxTuning & {
    emitters: Record<string, { enabled: boolean; density: number; spawnRate: number }>;
  },
  dirty: false,
  art: null as Rows | null,
};

const tuning = (id: string) => page.draft.emitters[id] ?? { enabled: true, density: 1, spawnRate: 1 };

async function loadArt(rerender: () => void) {
  const m = await json<{ props: Rows; buildings: Rows }>(`/assets/manifest/assets.json?t=${Date.now()}`);
  page.art = [...m.buildings, ...m.props];
  rerender();
}

function variantsHtml() {
  if (!page.art) return '<p class="muted">Đang tải manifest…</p>';
  const cell = (r: Rows[number], s: SeasonId) => {
    const path = r.seasons?.[s];
    return path
      ? `<td><img class="thumb" src="/assets/${esc(path)}" alt="" loading="lazy" /></td>`
      : `<td><span class="badge">mặc định</span></td>`;
  };
  return `<table class="table"><thead><tr><th>Công trình / vật</th><th>Mặc định</th>${SEASON_IDS.map((s) => `<th>${SEASON_LABEL[s]}</th>`).join('')}</tr></thead><tbody>
    ${page.art.map((r) => `<tr><td>${esc(r.id)}</td><td>${r.asset ? `<img class="thumb" src="/assets/${esc(r.asset)}" alt="" loading="lazy" />` : '—'}</td>${SEASON_IDS.map((s) => cell(r, s)).join('')}</tr>`).join('')}
  </tbody></table>
  <p class="muted">Mùa thiếu art → game vẽ art mặc định (không bao giờ biến mất). Vị trí, kích thước, va chạm giữ nguyên ở mọi mùa (canvas mùa = canvas mặc định). Art mùa cắt bằng <code>npm run art:seasons</code>.</p>`;
}

function fxHtml() {
  const d = page.draft;
  const L = SEASON_FX_LIMITS;
  const rows = SEASON_IDS.map((s) => {
    const list = SEASON_FX[s];
    return list.map((e, i) => {
      const t = tuning(e.id);
      const when = e.phases ? e.phases.map((p) => PHASE_LABEL[p]).join(', ') : 'luôn';
      return `<tr>${i === 0 ? `<th rowspan="${list.length}">${SEASON_LABEL[s]}</th>` : ''}
        <td>${esc(e.labelVi)}<div class="muted">${esc(e.id)} · ${LAYER_LABEL[e.layer]}</div></td>
        <td>${esc(when)}</td>
        <td><input type="checkbox" data-fx="${e.id}.enabled" ${t.enabled ? 'checked' : ''} aria-label="Bật" /></td>
        <td><input type="number" min="0" max="${L.densityMax}" step="0.1" data-fx="${e.id}.density" value="${t.density}" /></td>
        <td><input type="number" min="${L.spawnRateMin}" max="${L.spawnRateMax}" step="0.25" data-fx="${e.id}.spawnRate" value="${t.spawnRate}" /></td>
        <td>${Math.min(L.maxActiveCap, Math.round(e.maxActive * d.density * t.density))}</td></tr>`;
    }).join('');
  }).join('');
  return `<div class="form-grid">
      <label class="check"><input type="checkbox" data-global="enabled" ${d.enabled ? 'checked' : ''} /> Bật hiệu ứng mùa</label>
      <label class="field"><span>Mật độ chung (0…${L.densityMax})</span><input type="number" min="0" max="${L.densityMax}" step="0.1" data-global="density" value="${d.density}" /></label>
    </div>
    <table class="table"><thead><tr><th>Mùa</th><th>Hiệu ứng</th><th>Khi nào</th><th>Bật</th><th>Mật độ ×</th><th>Tốc độ sinh ×</th><th>Tối đa cùng lúc</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="muted">Ngày / đêm lấy từ đồng hồ ngày-đêm của game (đom đóm chỉ có đêm hè, tia nắng / bụi nắng chỉ ban ngày). Hiệu ứng là sprite PNG trong suốt (<code>npm run art:season-fx</code>), không bấm được, không ảnh hưởng heo / va chạm / camera; tắt hẳn khi người chơi bật "Giảm chuyển động".</p>`;
}

export function renderSeasons(root: HTMLElement, rerender: () => void) {
  if (!page.art) void loadArt(rerender).catch((e: unknown) => (state.message = { kind: 'error', text: String(e) }));
  const issues = seasonFxIssues(page.draft);
  root.innerHTML = `
    <div class="dn__buttons">
      <button type="button" class="btn btn-primary" data-save ${page.dirty && issues.length === 0 && state.apiOnline ? '' : 'disabled'}>💾 Lưu hiệu ứng vào game</button>
      <button type="button" class="btn btn-small" data-reset ${page.dirty ? '' : 'disabled'}>↺ Bỏ thay đổi</button>
    </div>
    <ul class="issues">${issues.map((x) => `<li class="issue error">${esc(x)}</li>`).join('')}</ul>
    <h3>Hiệu ứng môi trường theo mùa</h3>${fxHtml()}
    <h3>Art công trình theo mùa</h3>${variantsHtml()}`;
  const touch = () => {
    page.dirty = true;
    rerender();
  };
  root.querySelectorAll<HTMLInputElement>('[data-global]').forEach((el) =>
    el.addEventListener('change', () => {
      if (el.dataset.global === 'enabled') page.draft.enabled = el.checked;
      else page.draft.density = Number(el.value);
      touch();
    }),
  );
  root.querySelectorAll<HTMLInputElement>('[data-fx]').forEach((el) =>
    el.addEventListener('change', () => {
      const [id, field] = el.dataset.fx!.split('.') as [string, 'enabled' | 'density' | 'spawnRate'];
      const t = { ...tuning(id) };
      if (field === 'enabled') t.enabled = el.checked;
      else t[field] = Number(el.value);
      page.draft.emitters[id] = t;
      touch();
    }),
  );
  root.querySelector('[data-reset]')!.addEventListener('click', () => {
    page.draft = JSON.parse(JSON.stringify(SEASON_FX_TUNING)) as typeof page.draft;
    page.dirty = false;
    rerender();
  });
  root.querySelector('[data-save]')!.addEventListener('click', async () => {
    // Only non-default rows are written, so the config block stays short.
    const emitters = Object.fromEntries(
      Object.entries(page.draft.emitters).filter(([, t]) => !(t.enabled && t.density === 1 && t.spawnRate === 1)),
    );
    try {
      await post('/__admin/season-fx', { tuning: { ...page.draft, emitters } });
      page.dirty = false;
      rememberMessage('Đã lưu hiệu ứng mùa vào game (src/core/config/seasonFx.ts).');
    } catch (e) {
      state.message = { kind: 'error', text: (e as Error).message };
    }
    rerender();
  });
}
