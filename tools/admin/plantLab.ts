// Admin "Cây đung đưa": how the plants of one area sway — the old whole-picture tilt beside the stem bend (systems/animation/plantBend.ts),
// or every plant of the area at once — with the bend's numbers tunable live. One area at a time (its own backdrop, plot art and plants;
// never mixed). Reads only: the numbers the game runs are in code (`CLOUD_VIEW.bend`); "Sao chép số" copies the tuned ones to hand over.
import * as Phaser from 'phaser';
import { CLOUD_BACKDROP_ART, CLOUD_PLOT_ART } from '../../src/areas/cloud/logic/art';
import { FLOWER_LIST } from '../../src/areas/cloud/logic/config/content';
import { CLOUD_VIEW } from '../../src/areas/cloud/scene/cloudView';
import { GARDEN_BACKDROP_ART, PLOT_ART } from '../../src/areas/garden/logic/art';
import { CROP_LIST } from '../../src/areas/garden/logic/config/content';
import { GARDEN_VIEW } from '../../src/areas/garden/scene/gardenView';
import { esc } from './labels';
import { PlantLabScene, type LabArea, type PlantLabState, type Stage, type Tune } from './plantLabScene';
import { json } from './store';
import './rigLab.css';
import './plantLab.css';

type AreaId = 'cloud' | 'garden';
interface AreaDef extends LabArea {
  label: string;
  /** Plants (art ids) that bend in the game today. */
  live: readonly string[];
  note: string;
}

const B = CLOUD_VIEW.bend;
const AREAS: Record<AreaId, AreaDef> = {
  cloud: {
    label: '🌸 Sobi Cloud',
    backdrop: CLOUD_BACKDROP_ART,
    plot: CLOUD_PLOT_ART,
    plants: FLOWER_LIST.map((f) => ({ id: f.id, name: f.nameVi, art: f.art })),
    sway: CLOUD_VIEW.sway,
    live: B.arts,
    note: 'Trong game: uốn theo thân đang thử cho các hoa có nhãn "Đang thử"; hoa khác vẫn xoay cứng.',
  },
  garden: {
    label: '🌱 Sobi Garden',
    backdrop: GARDEN_BACKDROP_ART,
    plot: PLOT_ART.soil,
    plants: CROP_LIST.map((c) => ({ id: c.id, name: c.nameVi, art: c.art })),
    sway: GARDEN_VIEW.sway,
    live: [],
    note: 'Trong game: Garden chưa bật uốn theo thân (mọi cây vẫn xoay cứng). Ở đây xem trước bằng số của Cloud.',
  },
};
const STAGES: readonly [Stage, string][] = [['sprout', '🌱 Mầm'], ['grow', '🌿 Đang lớn'], ['ripe', '🌼 Chín'], ['wilt', '🥀 Héo']];
const SPEEDS = [1, 0.5, 0.25];
const gameTune = (): Tune => ({ root: B.root, stiff: B.stiff, lag: B.lag, sprout: B.sprout, grow: B.grow, ripe: B.ripe, wilt: B.wilt });

const images = new Map<string, { asset?: string }>();
const tunes: Record<AreaId, Tune> = { cloud: gameTune(), garden: gameTune() };
const picked: Record<AreaId, string> = { cloud: AREAS.cloud.plants[0]?.id ?? '', garden: AREAS.garden.plants[0]?.id ?? '' };
const ui = { area: 'cloud' as AreaId, q: '', copied: false };
const state: PlantLabState = { area: AREAS.cloud, plant: picked.cloud, stage: 'ripe', view: 'compare', allBend: true, speed: 1, gust: true, stem: false, tune: tunes.cloud, images };
let game: Phaser.Game | null = null;
let guard = 0;

function setArea(id: AreaId) {
  ui.area = id;
  state.area = AREAS[id];
  state.plant = picked[id];
  state.tune = tunes[id];
}

const thumb = (art: string) => {
  const row = images.get(`${art}_ripe`);
  return row?.asset ? `/assets/${row.asset}` : '';
};

function grid(): string {
  const a = AREAS[ui.area];
  const cards = a.plants
    .filter((p) => !ui.q || `${p.name} ${p.id}`.toLowerCase().includes(ui.q.toLowerCase()))
    .map((p) => {
      const img = thumb(p.art);
      const on = state.view === 'compare' && p.id === state.plant;
      return `<button class="rl-card${on ? ' on' : ''}" data-plant="${esc(p.id)}" title="${esc(p.id)}">
        <span class="rl-thumb">${img ? `<img src="${esc(img)}" loading="lazy" alt="">` : '❔'}</span>
        <b>${esc(p.name)}</b><small>${a.live.includes(p.art) ? '<em class="pl-live">Đang thử</em>' : 'Xoay cứng'}</small></button>`;
    })
    .join('');
  return cards || '<p class="rl-empty">Không có cây phù hợp.</p>';
}

function sidebar(): string {
  const a = AREAS[ui.area];
  const tabs = (Object.keys(AREAS) as AreaId[]).map((id) => `<button class="rl-tab${ui.area === id ? ' on' : ''}" data-area="${id}">${AREAS[id].label} <i>${AREAS[id].plants.length}</i></button>`).join('');
  return `<div class="rl-tabs">${tabs}</div>
    <p class="pl-status">${esc(a.note)}</p>
    <input class="rl-search" type="search" placeholder="Tìm cây theo tên hoặc id…" value="${esc(ui.q)}" data-search>
    <button class="rl-all${state.view === 'all' ? ' on' : ''}" data-all>🌾 Cả khu — xem tất cả cây</button>
    <div class="rl-grid">${grid()}</div>`;
}

function header(): string {
  const a = AREAS[ui.area];
  if (state.view === 'all') return `<h3>${esc(a.label)} — cả khu <small>${a.plants.length} cây cùng lúc, mỗi cây một nhịp như trong game</small></h3><span class="rl-now">${state.allBend ? 'Uốn theo thân' : 'Xoay cứng (cũ)'}</span>`;
  const p = a.plants.find((x) => x.id === state.plant);
  if (!p) return '';
  const img = thumb(p.art);
  return `${img ? `<img class="rl-head-img" src="${esc(img)}" alt="">` : ''}<h3>${esc(p.name)} <small>${esc(a.label)} · ${esc(p.id)}</small></h3>
    <span class="pl-sides"><span>◀ Xoay cứng (cũ)</span><span>Uốn theo thân (mới) ▶</span></span>`;
}

function slider(key: keyof Tune, label: string, min: number, max: number, step: number, fmt: (v: number) => string): string {
  const v = state.tune[key];
  return `<label class="pl-slider"><span>${esc(label)}</span><input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-tune="${key}"><b data-out="${key}">${fmt(v)}</b></label>`;
}
const FMT: Record<keyof Tune, (v: number) => string> = {
  root: (v) => `${Math.round(v * 100)}%`,
  stiff: (v) => `${Math.round(v * 100)}%`,
  lag: (v) => v.toFixed(2),
  sprout: (v) => `${v.toFixed(1)}°`,
  grow: (v) => `${v.toFixed(1)}°`,
  ripe: (v) => `${v.toFixed(1)}°`,
  wilt: (v) => `${v.toFixed(1)}°`,
};

function toolbar(): string {
  const chip = (on: boolean, attr: string, label: string) => `<button class="rl-chip${on ? ' on' : ''}" ${attr}>${esc(label)}</button>`;
  const toggle = (on: boolean, attr: string, label: string) => `<label class="rl-sw"><input type="checkbox" ${attr} ${on ? 'checked' : ''}><span></span>${esc(label)}</label>`;
  const stageLabel = STAGES.find(([s]) => s === state.stage)?.[1] ?? state.stage;
  return `
    <div class="rl-row"><span class="rl-lbl">Giai đoạn</span><div class="rl-chips">${STAGES.map(([s, l]) => chip(s === state.stage, `data-stage="${s}"`, l)).join('')}</div></div>
    <div class="rl-row rl-opts">
      <div class="rl-seg"><span>Tốc độ</span>${SPEEDS.map((x) => `<button class="${x === state.speed ? 'on' : ''}" data-speed="${x}">×${x}</button>`).join('')}</div>
      ${state.view === 'all' ? `<div class="rl-seg"><span>Cả khu</span><button class="${state.allBend ? 'on' : ''}" data-bend="1">Uốn</button><button class="${state.allBend ? '' : 'on'}" data-bend="0">Xoay cứng</button></div>` : ''}
      ${toggle(state.gust, 'data-gust', 'Gió giật')}${toggle(state.stem, 'data-stem', 'Hiện thân (đường uốn)')}
    </div>
    <div class="rl-row"><span class="rl-lbl">Tinh chỉnh</span><div class="pl-tune">
      ${slider('root', 'Gốc đứng yên', 0, 0.4, 0.01, FMT.root)}
      ${slider('stiff', 'Bông cứng từ', 0.3, 1, 0.01, FMT.stiff)}
      ${slider('lag', 'Ngọn trễ nhịp', 0, 2, 0.05, FMT.lag)}
      ${slider(state.stage, `Ngọn nghiêng — ${stageLabel}`, 0, 12, 0.1, FMT[state.stage])}
    </div></div>
    <div class="rl-row rl-opts">
      <button class="rl-chip" data-reset>↺ Về số trong game</button>
      <button class="rl-chip" data-copy>📋 Sao chép số</button>
      ${ui.copied ? '<small class="pl-copied">Đã sao chép — gửi cho agent để đưa vào game.</small>' : ''}
    </div>`;
}

function mount(host: HTMLElement) {
  window.clearInterval(guard);
  guard = window.setInterval(() => {
    if (host.isConnected) return;
    window.clearInterval(guard);
    game?.destroy(true);
    game = null;
  }, 400);
  game?.destroy(true);
  game = new Phaser.Game({ type: Phaser.WEBGL, parent: host, width: Math.max(1, host.clientWidth), height: Math.max(1, host.clientHeight), transparent: true, banner: false, audio: { noAudio: true }, scene: [new PlantLabScene(state)] });
  (window as unknown as { plantLab?: { game: Phaser.Game; state: PlantLabState } }).plantLab = { game, state };
}

/** The tuned numbers as the line of `CLOUD_VIEW.bend` in src/areas/cloud/scene/cloudView.ts. */
function numbers(): string {
  const t = state.tune;
  const r = (v: number) => Number(v.toFixed(2));
  return `bend: { arts: ${JSON.stringify([...B.arts]).replaceAll('"', "'").replaceAll(',', ', ')} as readonly string[], rows: ${B.rows}, root: ${r(t.root)}, stiff: ${r(t.stiff)}, lag: ${r(t.lag)}, sprout: ${r(t.sprout)}, grow: ${r(t.grow)}, ripe: ${r(t.ripe)}, wilt: ${r(t.wilt)} },`;
}

export function renderPlantLab(root: HTMLElement) {
  if (images.size === 0) {
    root.innerHTML = '<p class="muted">Đang tải manifest…</p>';
    void json<Record<string, unknown>>('/assets/manifest/assets.json').then((m) => {
      for (const rows of Object.values(m)) if (Array.isArray(rows)) for (const row of rows as { id: string; asset?: string }[]) images.set(row.id, row);
      renderPlantLab(root);
    });
    return;
  }
  root.innerHTML = `
    <section class="rl">
      <aside class="rl-side"></aside>
      <div class="rl-main">
        <div class="rl-head"></div>
        <div class="rl-stage"></div>
        <div class="rl-toolbar"></div>
        <p class="rl-note">Uốn theo thân: ụ đất dưới cùng (<b>gốc đứng yên</b>) không động, thân cong dần lên trên, phần từ <b>bông cứng từ</b> trở lên chỉ nghiêng và dời theo thân (không méo), ngọn đổi chiều chậm hơn thân (<b>ngọn trễ nhịp</b>). Nhịp và gió giật giống hệt trong game. Kéo thanh trượt chỉ để xem thử, không lưu: số chạy trong game nằm ở <code>CLOUD_VIEW.bend</code> (<code>src/areas/cloud/scene/cloudView.ts</code>).</p>
      </div>
    </section>`;
  const q = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel)!;
  const refresh = (searchOnly = false) => {
    if (searchOnly) q('.rl-grid').innerHTML = grid();
    else q('.rl-side').innerHTML = sidebar();
    q('.rl-head').innerHTML = header();
    q('.rl-toolbar').innerHTML = toolbar();
  };
  refresh();
  const section = q('.rl');
  section.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest('button');
    if (!t) return;
    const d = t.dataset;
    ui.copied = false;
    if (d.area) setArea(d.area as AreaId);
    if (d.plant) [state.plant, picked[ui.area], state.view] = [d.plant, d.plant, 'compare'];
    if (t.hasAttribute('data-all')) state.view = state.view === 'all' ? 'compare' : 'all';
    if (d.stage) state.stage = d.stage as Stage;
    if (d.speed) state.speed = Number(d.speed);
    if (d.bend) state.allBend = d.bend === '1';
    if (t.hasAttribute('data-reset')) Object.assign(state.tune, gameTune());
    if (t.hasAttribute('data-copy')) {
      const text = numbers();
      if (navigator.clipboard) void navigator.clipboard.writeText(text).catch(() => window.prompt('Sao chép dòng này:', text));
      else window.prompt('Sao chép dòng này:', text);
      ui.copied = true;
    }
    refresh();
  });
  section.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.hasAttribute('data-search')) {
      ui.q = t.value;
      return refresh(true);
    }
    const key = t.dataset.tune as keyof Tune | undefined;
    if (!key) return;
    state.tune[key] = Number(t.value);
    // The rigid top always starts above the fixed root: pushing one moves the other (its slider follows in place).
    const tn = state.tune;
    if (key === 'root' && tn.stiff < tn.root + 0.05) tn.stiff = Math.min(1, tn.root + 0.05);
    if (key === 'stiff' && tn.root > tn.stiff - 0.05) tn.root = Math.max(0, tn.stiff - 0.05);
    for (const k of ['root', 'stiff', key] as (keyof Tune)[]) {
      const input = root.querySelector<HTMLInputElement>(`[data-tune="${k}"]`);
      if (input && k !== key) input.value = String(tn[k]);
      const out = root.querySelector(`[data-out="${k}"]`);
      if (out) out.textContent = FMT[k](tn[k]);
    }
  });
  section.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.hasAttribute('data-gust')) state.gust = t.checked;
    if (t.hasAttribute('data-stem')) state.stem = t.checked;
  });
  mount(q('.rl-stage'));
}
