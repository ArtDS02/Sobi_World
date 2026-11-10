// Admin "Khuông & cảnh bậc": see a cloud tier / garden zone as the game draws it for any upgrade rank (1-5) and any plot skin, with
// the scenery layers that rank shows, the art status of each (placeholder or final), the skin's mood and what the next upgrade
// costs. Preview only: nothing here is saved; the numbers live in content/cloud/tiers.json, content/garden/zones.json and
// content/shared/plotSkins.json (edited in "Nội dung game").
import * as Phaser from 'phaser';
import { CLOUD_SCENERY } from '../../src/areas/cloud/scene/cloudView';
import { CLOUD_TIERS, TIER_COUNT } from '../../src/areas/cloud/logic/config/content';
import { GARDEN_SCENERY } from '../../src/areas/garden/scene/gardenView';
import { GARDEN_TIERS, ZONE_COUNT } from '../../src/areas/garden/logic/config/content';
import { PLOT_SKINS, skinTheme } from '../../src/core/config/plotSkins';
import { bonusPctOf, nextUpgrade } from '../../src/systems/plants/tiers';
import { layersAtRank, type SceneryLayer } from '../../src/systems/animation/rankScenery';
import { atmosphereAt, particleCounts } from '../../src/systems/animation/rankAtmosphere';
import { vi } from '../../src/i18n/vi';
import { esc } from './labels';
import { PlotLabScene, type PlotLabArea, type PlotLabState } from './plotLabScene';
import { json } from './store';
import './rigLab.css';
import './plotLab.css';

const images = new Map<string, { asset?: string; status?: string }>();
const state: PlotLabState = { area: 'cloud', group: 0, rank: 5, skin: null, night: false, still: false, sprites: false, effects: 'full', images };
let game: Phaser.Game | null = null;
let guard = 0;
let auto = 0;

const AREAS: Record<PlotLabArea, { label: string; groups: number; groupName: (g: number) => string; scenery: readonly SceneryLayer[]; rules: typeof CLOUD_TIERS; rankName: (id: string) => string; plots: number }> = {
  cloud: { label: '☁️ Sobi Cloud (tầng mây)', groups: TIER_COUNT, groupName: (g) => `Tầng ${g + 1} · ${vi.cloud.tierNames[g] ?? ''}`, scenery: CLOUD_SCENERY, rules: CLOUD_TIERS, rankName: (id) => vi.cloud.rankNames[id as keyof typeof vi.cloud.rankNames] ?? id, plots: 15 },
  garden: { label: '🌱 Sobi Garden (khu đất)', groups: ZONE_COUNT, groupName: (g) => `Khu ${g + 1} · ${vi.garden.zoneNames[g] ?? ''}`, scenery: GARDEN_SCENERY, rules: GARDEN_TIERS, rankName: (id) => vi.garden.rankNames[id as keyof typeof vi.garden.rankNames] ?? id, plots: 24 },
};
const skinName = (id: string) => vi.plotSkin.names[id as keyof typeof vi.plotSkin.names] ?? id;
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/** The art ids a layer shows for the group on screen (a per-group list shows its own entry). */
function shownArt(l: SceneryLayer, group: number): string[] {
  if (typeof l.art === 'string') return [l.art];
  return [l.art[group] ?? l.art[0]!];
}

function atmosphereLine(): string {
  const at = atmosphereAt(state.rank);
  const parts = particleCounts(state.rank, skinTheme(state.skin)?.particles ?? 'both');
  if (state.rank <= 1) return '<p><b>Không khí:</b> bậc 1 không thêm gì (cảnh y như bản thường).</p>';
  return `<p><b>Không khí bậc ${state.rank}</b> (vẽ bằng code, đổi màu theo mẫu): vignette ${Math.round(at.vignette * 100)}% · ${at.rays} tia sáng · bloom ${Math.round(at.glow * 100)}% · ${at.sparkles} điểm lấp lánh · ${parts.petals} cánh hoa / lá rơi · ${parts.fireflies} đom đóm.</p>`;
}

function layerTable(): string {
  if (!state.sprites) return '<p class="muted">Sprite trang trí dán thêm đang TẮT trong game (nhìn thô so với nền). Bật công tắc "Hiện sprite trang trí cũ" để so sánh.</p>';
  const a = AREAS[state.area];
  const rows = layersAtRank(a.scenery, state.rank).flatMap((l) =>
    shownArt(l, state.group).map((id) => {
      const status = images.get(id)?.status ?? '?';
      const src = images.get(id)?.asset;
      return `<tr><td>${src ? `<img src="/assets/${esc(src)}" alt="">` : ''}</td><td><code>${esc(id)}</code></td><td>${esc(l.kind)}${l.drift ? ` ×${l.drift.count}` : ''}</td><td>từ bậc ${l.minRank}${l.maxRank ? ` đến ${l.maxRank}` : ''}</td><td class="${status === 'placeholder' ? 'pl-ph' : 'pl-ok'}">${status === 'placeholder' ? 'placeholder' : status}</td></tr>`;
    }),
  );
  return rows.length ? `<table class="plot-layers"><thead><tr><th></th><th>Ảnh</th><th>Loại</th><th>Hiện</th><th>Trạng thái</th></tr></thead><tbody>${rows.join('')}</tbody></table>` : '<p class="muted">Bậc 1: chưa có lớp trang trí nào (đúng như trong game).</p>';
}

function info(): string {
  const a = AREAS[state.area];
  const name = a.rankName(a.rules.ids[state.rank - 1] ?? '');
  const step = nextUpgrade(a.rules, state.group, state.rank);
  const theme = skinTheme(state.skin);
  const items = step ? Object.entries(step.items).map(([k, n]) => `${n} × ${vi.shop[k as keyof typeof vi.shop] ?? k}`).join(', ') : '';
  return `<div class="plot-info">
    <p><b>${esc(a.groupName(state.group))}</b> · bậc ${state.rank}/${a.rules.ids.length} <b>${esc(name)}</b> · bội thu <b>+${bonusPctOf(a.rules, state.rank)}%</b> · mẫu <b>${state.skin ? esc(skinName(state.skin)) : 'Mặc định'}</b></p>
    <p>${step ? `Nâng lên bậc ${step.tier}: <b>${step.coins.toLocaleString('vi-VN')}</b> xu + ${esc(items)}; cần cấp thế giới ${step.worldLevel}, đủ ${a.plots} ô.` : 'Bậc cao nhất: không còn nâng tiếp.'}</p>
    <p>${theme ? `Chủ đề của mẫu: nền <i class="plot-sw" style="background:${hex(theme.backdrop)}"></i> · trang trí <i class="plot-sw" style="background:${hex(theme.scenery)}"></i> · khung <i class="plot-sw" style="background:${hex(theme.frame)}"></i> · hạt bay: ${theme.particles}` : 'Mẫu mặc định: cảnh giữ màu riêng của tầng / khu.'}</p>
  </div>`;
}

function controls(): string {
  const a = AREAS[state.area];
  const chip = (on: boolean, attr: string, label: string) => `<button class="rl-chip${on ? ' on' : ''}" ${attr}>${esc(label)}</button>`;
  const toggle = (on: boolean, attr: string, label: string) => `<label class="rl-sw"><input type="checkbox" ${attr} ${on ? 'checked' : ''}><span></span>${esc(label)}</label>`;
  return `
    <div class="rl-row"><span class="rl-lbl">Khu</span><div class="rl-chips">${(Object.keys(AREAS) as PlotLabArea[]).map((id) => chip(id === state.area, `data-area="${id}"`, AREAS[id].label)).join('')}</div></div>
    <div class="rl-row"><span class="rl-lbl">${state.area === 'cloud' ? 'Tầng' : 'Khu đất'}</span><div class="rl-chips">${Array.from({ length: a.groups }, (_, g) => chip(g === state.group, `data-group="${g}" title="${esc(a.groupName(g))}"`, String(g + 1))).join('')}</div></div>
    <div class="rl-row"><span class="rl-lbl">Bậc</span><div class="rl-chips">${a.rules.ids.map((id, i) => chip(i + 1 === state.rank, `data-rank="${i + 1}"`, `${i + 1} · ${a.rankName(id)}`)).join('')}${chip(auto !== 0, 'data-auto', auto ? '⏸ Dừng tự chạy' : '▶ Tự chạy bậc 1→5')}</div></div>
    <div class="rl-row"><span class="rl-lbl">Mẫu</span><div class="rl-chips">${chip(state.skin === null, 'data-skin=""', 'Mặc định')}${PLOT_SKINS.map((s) => chip(state.skin === s.id, `data-skin="${esc(s.id)}"`, skinName(s.id))).join('')}</div></div>
    <div class="rl-row rl-opts">${toggle(state.night, 'data-night', 'Ban đêm')}${toggle(state.sprites, 'data-sprites', 'Hiện sprite trang trí cũ (để so sánh)')}${toggle(state.still, 'data-still', 'Giảm chuyển động')}</div>
    <div class="rl-row"><span class="rl-lbl">Cường độ hiệu ứng</span><div class="rl-chips">${(['off', 'light', 'full'] as const).map((m) => chip(state.effects === m, `data-effects="${m}"`, { off: 'Tắt', light: 'Nhẹ', full: 'Đầy đủ' }[m])).join('')}</div></div>`;
}

function mount(host: HTMLElement) {
  window.clearInterval(guard);
  guard = window.setInterval(() => {
    if (host.isConnected) return;
    window.clearInterval(guard);
    window.clearInterval(auto);
    auto = 0;
    game?.destroy(true);
    game = null;
  }, 400);
  game?.destroy(true);
  game = new Phaser.Game({ type: Phaser.WEBGL, parent: host, width: Math.max(1, host.clientWidth), height: Math.max(1, host.clientHeight), transparent: true, banner: false, audio: { noAudio: true }, scale: { mode: Phaser.Scale.RESIZE }, scene: [new PlotLabScene(state)] });
  (window as unknown as { plotLab?: { game: Phaser.Game; state: PlotLabState } }).plotLab = { game, state };
}

export function renderPlotLab(root: HTMLElement) {
  if (images.size === 0) {
    root.innerHTML = '<p class="muted">Đang tải manifest…</p>';
    void json<Record<string, unknown>>('/assets/manifest/assets.json').then((m) => {
      for (const rows of Object.values(m)) if (Array.isArray(rows)) for (const row of rows as { id: string; asset?: string; status?: string }[]) images.set(row.id, row);
      renderPlotLab(root);
    });
    return;
  }
  root.innerHTML = `
    <section class="rl plot-lab">
      <div class="plot-controls"></div>
      <div class="rl-stage plot-stage"></div>
      <div class="plot-below"></div>
    </section>`;
  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const refresh = () => {
    q('.plot-controls').innerHTML = controls();
    q('.plot-below').innerHTML = `${info()}${atmosphereLine()}${layerTable()}`;
  };
  refresh();
  q('.plot-lab').addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest('button');
    if (!t) return;
    const d = t.dataset;
    if (d.area) [state.area, state.group] = [d.area as PlotLabArea, 0];
    if (d.group) state.group = Number(d.group);
    if (d.rank) state.rank = Number(d.rank);
    if (d.skin !== undefined) state.skin = d.skin || null;
    if (d.effects) state.effects = d.effects as PlotLabState['effects'];
    if (t.hasAttribute('data-auto')) {
      window.clearInterval(auto);
      auto = auto ? 0 : window.setInterval(() => {
        state.rank = state.rank >= AREAS[state.area].rules.ids.length ? 1 : state.rank + 1;
        refresh();
      }, 2200);
    }
    refresh();
  });
  q('.plot-lab').addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.hasAttribute('data-night')) state.night = t.checked;
    if (t.hasAttribute('data-sprites')) {
      state.sprites = t.checked;
      refresh();
    }
    if (t.hasAttribute('data-still')) state.still = t.checked;
  });
  mount(q('.plot-stage'));
}
