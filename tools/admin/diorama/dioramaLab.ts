// Admin "Diorama map (G0)": the prototype of the 2.5D diorama map (docs/research/ADVENTURE_MAP_VFX_LESSONS.md §10–11) on one real
// area, to compare with today's painted map before choosing the map's future. Walk with WASD / arrows; time of day, quality and wind
// switch live; the four review spots put the party where the comparison shots are taken. Reads the game's content; writes nothing.
import { Diorama, type DioramaOpts } from './world';
import '../rigLab.css';
import './diorama.css';

/** The review spots on Bìa Rừng (tile x, y): spawn, the bridge, the pond, the stairs to the old oak. */
export const SPOTS: readonly { name: string; x: number; y: number }[] = [
  { name: '1 · Điểm xuất phát', x: 3, y: 18 },
  { name: '2 · Cầu gỗ', x: 22, y: 16 },
  { name: '3 · Hồ sen', x: 24, y: 24 },
  { name: '4 · Bậc lên cổ thụ', x: 45, y: 13 },
];

let live: Diorama | null = null;
let guard = 0;
const opts: DioramaOpts = { time: 'day', quality: 'full', wind: true };

export function renderDioramaLab(content: HTMLElement) {
  content.innerHTML = `
    <section class="dio">
      <header class="dio__bar">
        <strong>🏞️ Diorama map — prototype G0 · Bìa Rừng</strong>
        <span class="dio__group">${(['day', 'golden', 'night'] as const).map((t) => `<button class="rl-chip${opts.time === t ? ' is-on' : ''}" data-time="${t}">${{ day: '☀️ Ngày', golden: '🌇 Chiều', night: '🌙 Đêm' }[t]}</button>`).join('')}</span>
        <span class="dio__group">${(['full', 'light'] as const).map((q) => `<button class="rl-chip${opts.quality === q ? ' is-on' : ''}" data-quality="${q}">${q === 'full' ? 'Đẹp' : 'Nhẹ'}</button>`).join('')}</span>
        <button class="rl-chip${opts.wind ? ' is-on' : ''}" data-wind>🍃 Gió</button>
        <span class="dio__group">${SPOTS.map((s, i) => `<button class="rl-chip" data-spot="${i}">${s.name}</button>`).join('')}</span>
        <span class="dio__fps" data-fps>…</span>
      </header>
      <div class="dio__stage" data-stage><p class="dio__loading">Đang dựng diorama…</p></div>
      <p class="dio__hint">Đi: W A S D / phím mũi tên. Chỉ là bản thử trong Admin: game, nội dung và save không đổi.</p>
    </section>`;
  const stage = content.querySelector<HTMLElement>('[data-stage]')!;
  mount(stage);
  content.querySelector('.dio__bar')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('button');
    if (!b) return;
    if (b.dataset.time) opts.time = b.dataset.time as DioramaOpts['time'];
    if (b.dataset.wind !== undefined) opts.wind = !opts.wind;
    if (b.dataset.spot) {
      const s = SPOTS[Number(b.dataset.spot)]!;
      live?.goto(s.x, s.y);
      return;
    }
    if (b.dataset.quality && b.dataset.quality !== opts.quality) {
      opts.quality = b.dataset.quality as DioramaOpts['quality'];
      renderDioramaLab(content);
      return;
    }
    live?.setOpts({ ...opts });
    content.querySelectorAll<HTMLElement>('[data-time]').forEach((x) => x.classList.toggle('is-on', x.dataset.time === opts.time));
    content.querySelector('[data-wind]')?.classList.toggle('is-on', opts.wind);
  });
}

function mount(stage: HTMLElement) {
  live?.dispose();
  window.clearInterval(guard);
  const d = new Diorama(stage, 'map_forest_edge', { ...opts });
  live = d;
  (window as unknown as { diorama?: Diorama }).diorama = d;
  d.start()
    .then(() => stage.querySelector('.dio__loading')?.remove())
    .catch((e: unknown) => {
      stage.innerHTML = `<p class="dio__loading">Không dựng được: ${(e as Error).message}</p>`;
    });
  guard = window.setInterval(() => {
    const fps = document.querySelector('[data-fps]');
    if (fps && d.ready) fps.textContent = `${Math.round(d.fps)} FPS`;
    if (stage.isConnected) return;
    window.clearInterval(guard);
    d.dispose();
    if (live === d) live = null;
  }, 500);
}
