// Admin "Diorama map": the diorama renderer (src/areas/adventure/scene/diorama/) on any of the six Forest maps, to review it before it
// is in the game. Walk with WASD / arrows (the game's own `walkableOf` + `stepCharacter`, labDriver.ts); map, time of day, quality and
// wind switch live; the review points of the map's contract put the party where the comparison shots are taken; the simulation buttons
// put the groups to sleep, defeat them, make them golden, open the chests; exits and gates start shut (a fresh save) and open on a switch. Reads the game's content; writes nothing.
import { MAPS } from '../../../src/areas/adventure/logic/config/content';
import { CONTRACT_IDS, reviewSpots } from '../../../src/areas/adventure/scene/diorama/contracts';
import { DioramaView, type ViewOpts } from '../../../src/areas/adventure/scene/diorama/dioramaView';
import { loadArt } from './artResolver';
import { LabDriver } from './labDriver';
import { LAB_TEAM, labState } from './labState';
import '../rigLab.css';
import './diorama.css';

/** What the screenshot scripts reach through `window.diorama`. */
export interface LabHandle {
  readonly ready: boolean;
  readonly fps: number;
  readonly mapId: string;
  setOpts(o: ViewOpts): void;
  /** Draw calls, triangles and live objects of the last frame (for the FPS profile). */
  stats(): { calls: number; triangles: number; meshes: number };
  goto(x: number, y: number): void;
}

const ui = {
  map: 'map_forest_edge',
  time: 'day' as ViewOpts['time'],
  quality: 'full' as ViewOpts['quality'],
  wind: true,
  /** Exits and gates open (rebuilds the map); default shut, as in a fresh save. */
  gates: false,
  /** Element devices lit (a water wheel turns; rebuilds the map). */
  lit: false,
};
const sim = { asleep: false, defeated: false, golden: false, chests: false };
let live: { dispose(): void } | null = null;
let guard = 0;

const chip = (on: boolean, attrs: string, label: string) => `<button class="rl-chip${on ? ' is-on' : ''}" ${attrs}>${label}</button>`;

export function renderDioramaLab(content: HTMLElement) {
  const map = MAPS[ui.map]!;
  const spots = reviewSpots(map);
  content.innerHTML = `
    <section class="dio">
      <header class="dio__bar">
        <strong>🏞️ Diorama map</strong>
        <select data-map>${CONTRACT_IDS.map((id) => `<option value="${id}"${id === ui.map ? ' selected' : ''}>${id}</option>`).join('')}</select>
        <span class="dio__group">${(['day', 'golden', 'night'] as const).map((t) => chip(ui.time === t, `data-time="${t}"`, { day: '☀️ Ngày', golden: '🌇 Chiều', night: '🌙 Đêm' }[t])).join('')}</span>
        <span class="dio__group">${(['full', 'light'] as const).map((q) => chip(ui.quality === q, `data-quality="${q}"`, q === 'full' ? 'Đẹp' : 'Nhẹ')).join('')}</span>
        ${chip(ui.wind, 'data-wind', '🍃 Gió')}
        ${chip(ui.gates, 'data-gates', ui.gates ? '🚪 Cổng mở' : '🌿 Cổng đóng')}
        ${chip(ui.lit, 'data-lit', ui.lit ? '💧 Đã thắp' : '🌑 Chưa thắp')}
        <span class="dio__group">${spots.map((s, i) => chip(false, `data-spot="${i}"`, s.name)).join('')}</span>
        <span class="dio__group">${[
          ['asleep', '💤 Ngủ'],
          ['defeated', '🏆 Đã thắng'],
          ['golden', '✨ Tinh anh'],
          ['chests', '📦 Rương mở'],
        ]
          .map(([k, l]) => chip(sim[k as keyof typeof sim], `data-sim="${k}"`, l!))
          .join('')}</span>
        <span class="dio__fps" data-fps>…</span>
      </header>
      <div class="dio__stage" data-stage><p class="dio__loading">Đang dựng diorama…</p></div>
      <p class="dio__hint">Đi: W A S D / phím mũi tên. Chỉ là bản thử trong Admin: game, nội dung và save không đổi.</p>
    </section>`;
  const stage = content.querySelector<HTMLElement>('[data-stage]')!;
  mount(stage);
  content.querySelector('[data-map]')!.addEventListener('change', (e) => {
    ui.map = (e.target as HTMLSelectElement).value;
    renderDioramaLab(content);
  });
  content.querySelector('.dio__bar')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button');
    if (!b) return;
    const h = (window as unknown as { diorama?: LabHandle }).diorama;
    if (b.dataset.spot) {
      const s = spots[Number(b.dataset.spot)]!;
      h?.goto(s.x, s.y);
      return;
    }
    if (b.dataset.sim) {
      const k = b.dataset.sim as keyof typeof sim;
      sim[k] = !sim[k];
      b.classList.toggle('is-on', sim[k]);
      return;
    }
    if (b.dataset.gates !== undefined) {
      ui.gates = !ui.gates;
      renderDioramaLab(content);
      return;
    }
    if (b.dataset.lit !== undefined) {
      ui.lit = !ui.lit;
      renderDioramaLab(content);
      return;
    }
    if (b.dataset.time) ui.time = b.dataset.time as ViewOpts['time'];
    if (b.dataset.wind !== undefined) ui.wind = !ui.wind;
    if (b.dataset.quality && b.dataset.quality !== ui.quality) {
      ui.quality = b.dataset.quality as ViewOpts['quality'];
      renderDioramaLab(content);
      return;
    }
    h?.setOpts({ time: ui.time, quality: ui.quality, wind: ui.wind });
    content.querySelectorAll<HTMLElement>('[data-time]').forEach((x) => x.classList.toggle('is-on', x.dataset.time === ui.time));
    content.querySelector('[data-wind]')?.classList.toggle('is-on', ui.wind);
  });
}

function mount(stage: HTMLElement) {
  live?.dispose();
  window.clearInterval(guard);
  const map = MAPS[ui.map]!;
  const state = labState(map, ui.gates, ui.lit);
  // What the game hands the view: the exits that are shut block their tiles.
  const closed = map.exits.filter((e) => !state.exits.find((x) => x.id === e.id)?.open);
  let view: DioramaView | null = null;
  let driver: LabDriver | null = null;
  let raf = 0;
  let fps = 0;
  let last = 0;
  const win = { n: 0, t0: 0 };
  let built = false;
  let snap = true;
  const handle: LabHandle = {
    get ready() {
      return built && !!view?.ready;
    },
    get fps() {
      return fps;
    },
    mapId: ui.map,
    setOpts: (o) => view?.setOpts(o),
    stats: () => view?.stats() ?? { calls: 0, triangles: 0, meshes: 0 },
    goto: (x, y) => {
      driver?.goto(x, y);
      snap = true;
    },
  };
  const fit = new ResizeObserver(() => view?.setSize(stage.clientWidth, stage.clientHeight));
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dtMs = Math.min(50, now - last);
    last = now;
    if (!view?.ready || !driver) return;
    // Frames counted over real time (a frame-weighted average would hide a slow renderer behind the 50 ms step clamp).
    win.n += 1;
    if (now - win.t0 >= 700) {
      fps = (win.n * 1000) / (now - win.t0);
      win.n = 0;
      win.t0 = now;
    }
    for (const f of view.foes?.foes ?? [])
      view.foes!.setFoe(f.id, {
        asleep: sim.asleep,
        defeated: sim.defeated,
        golden: sim.golden,
        disguised: false,
      });
    for (const c of map.chests) view.foes?.setChest(c.id, sim.chests);
    view.frame({ dt: dtMs / 1000, pose: driver.step(dtMs), snap });
    snap = false;
    built = true;
  };
  (window as unknown as { diorama?: LabHandle }).diorama = handle;
  void loadArt()
    .then(async (art) => {
      view = new DioramaView(art, { time: ui.time, quality: ui.quality, wind: ui.wind }, window.devicePixelRatio);
      stage.appendChild(view.canvas);
      view.setSize(stage.clientWidth, stage.clientHeight);
      fit.observe(stage);
      driver = new LabDriver(map, LAB_TEAM.length);
      await view.enter(map, state, closed);
      stage.querySelector('.dio__loading')?.remove();
      last = performance.now();
      win.t0 = last;
      raf = requestAnimationFrame(frame);
    })
    .catch((e: unknown) => {
      stage.innerHTML = `<p class="dio__loading">Không dựng được: ${(e as Error).message}</p>`;
    });
  const me = {
    dispose() {
      cancelAnimationFrame(raf);
      fit.disconnect();
      driver?.dispose();
      view?.dispose();
    },
  };
  live = me;
  guard = window.setInterval(() => {
    const el = document.querySelector('[data-fps]');
    if (el && handle.ready) el.textContent = `${Math.round(fps)} FPS`;
    if (stage.isConnected) return;
    window.clearInterval(guard);
    me.dispose();
    if (live === me) live = null;
  }, 500);
}
