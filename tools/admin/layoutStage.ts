// Layout editor canvas (DECISIONS AD-1): the 1600×900 farm frame scaled to fit, painted with the
// game's own sky + backdrop painters, placements as DOM images (same box, origin, rotation, mirror
// and stacking as the Phaser scene), drag to move, corner handle to resize, drop from the library.
import { PHASE_LOOKS } from '../../src/core/config/dayNight';
import type { BackdropPalette } from '../../src/core/config/seasons';
import { paintBackdrop } from '../../src/game/view/backdropPaint';
import { paintSky } from '../../src/game/view/skyPaint';
import { esc } from './labels';
import { boxOf, drawOrder, type Design, type Placement } from './layoutModel';

export interface StageHooks {
  list: () => readonly Placement[];
  selected: () => number | null;
  select: (i: number | null) => void;
  /** Live drag/resize preview (no history entry). */
  live: (i: number, next: Placement) => void;
  /** End of a drag/resize: `before` is the list when it started. */
  commit: (before: readonly Placement[]) => void;
  drop: (id: string, xPx: number, yPx: number) => void;
  urlOf: (id: string) => string | null;
  options: () => { preview: boolean; walk: boolean; snap: number };
  walkArea: { x: number; y: number; width: number; height: number };
  /** Season palette of the painted backdrop (SE-1); absent = the default (summer) look. */
  palette?: BackdropPalette;
}

const natural = new Map<string, { w: number; h: number }>();

/** Loads the art sizes the boxes need (once per url). */
export async function preloadSizes(urls: (string | null)[]) {
  await Promise.all(
    [...new Set(urls.filter((u): u is string => !!u && !natural.has(u)))].map(
      (u) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            natural.set(u, { w: img.naturalWidth, h: img.naturalHeight });
            resolve();
          };
          img.onerror = () => {
            natural.set(u, { w: 120, h: 120 });
            resolve();
          };
          img.src = u;
        }),
    ),
  );
}

export const sizeOf = (url: string | null) => (url && natural.get(url)) || { w: 120, h: 120 };

export function mountStage(host: HTMLElement, d: Design, h: StageHooks) {
  host.innerHTML = `<div class="stage" tabindex="0" aria-label="Khung nông trại 1600×900">
      <div class="stage__world" style="width:${d.width}px;height:${d.height}px">
        <canvas width="${d.width}" height="${d.height}"></canvas><div class="stage__walk"></div><div class="stage__items"></div>
      </div></div>`;
  const stage = host.querySelector<HTMLElement>('.stage')!;
  const world = host.querySelector<HTMLElement>('.stage__world')!;
  const items = host.querySelector<HTMLElement>('.stage__items')!;
  const ctx = host.querySelector('canvas')!.getContext('2d')!;
  const rect = { x: 0, y: 0, width: d.width, height: d.height };
  paintSky(ctx, rect, PHASE_LOOKS.day);
  paintBackdrop(ctx, rect, h.palette);
  const w = h.walkArea;
  Object.assign(host.querySelector<HTMLElement>('.stage__walk')!.style, {
    left: `${w.x * d.width}px`, top: `${w.y * d.height}px`, width: `${w.width * d.width}px`, height: `${w.height * d.height}px`,
  });

  let k = 1;
  const fit = () => {
    k = stage.clientWidth / d.width;
    world.style.transform = `scale(${k})`;
    stage.style.height = `${d.height * k}px`;
  };
  new ResizeObserver(fit).observe(stage);
  fit();
  const toWorld = (e: { clientX: number; clientY: number }) => {
    const r = world.getBoundingClientRect();
    return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k };
  };

  const styleOf = (p: Placement, z: number) => {
    const b = boxOf(p, sizeOf(h.urlOf(p.id)), d);
    const flip = p.flipX ? ' scaleX(-1)' : '';
    return `left:${b.left}px;top:${b.top}px;width:${b.w}px;height:${b.h}px;z-index:${z};transform-origin:${b.ox * 100}% ${b.oy * 100}%;transform:rotate(${p.rotation ?? 0}deg)${flip}`;
  };

  const draw = () => {
    const list = h.list();
    const order = drawOrder(list, d);
    const sel = h.selected();
    const o = h.options();
    stage.classList.toggle('is-preview', o.preview);
    stage.classList.toggle('show-walk', o.walk && !o.preview);
    items.innerHTML = order
      .map((i, z) => {
        const p = list[i]!;
        const url = h.urlOf(p.id);
        const cls = ['stage__item', i === sel ? 'is-selected' : '', p.visible === false ? 'is-hidden' : '', p.locked ? 'is-locked' : ''].join(' ');
        return `<div class="${cls}" data-i="${i}" style="${styleOf(p, z + 1)}" title="${esc(p.label ?? p.id)}">
          ${url ? `<img src="${esc(url)}" alt="" draggable="false" />` : `<span class="stage__missing">${esc(p.id)}</span>`}
          ${i === sel && !p.locked ? '<span class="stage__handle" data-handle></span>' : ''}</div>`;
      })
      .join('');
  };

  /** Restyles one item during a drag (cheap: no list redraw). */
  const restyle = (i: number, p: Placement) => {
    const el = items.querySelector<HTMLElement>(`[data-i="${i}"]`);
    if (el) el.setAttribute('style', styleOf(p, Number(el.style.zIndex)));
  };

  stage.addEventListener('pointerdown', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.stage__item');
    stage.focus({ preventScroll: true });
    if (!el) return h.select(null);
    const i = Number(el.dataset.i);
    const p0 = h.list()[i]!;
    if (h.selected() !== i) h.select(i);
    if (p0.locked || h.options().preview) return;
    const before = [...h.list()];
    const start = toWorld(e);
    const resizing = !!(e.target as HTMLElement).closest('[data-handle]');
    const b0 = boxOf(p0, sizeOf(h.urlOf(p0.id)), d);
    const snap = (v: number) => {
      const g = h.options().snap;
      return g > 1 ? Math.round(v / g) * g : v;
    };
    let moved = false;
    const move = (ev: PointerEvent) => {
      const at = toWorld(ev);
      const dx = at.x - start.x;
      const dy = at.y - start.y;
      if (!moved && Math.hypot(dx, dy) < 2) return;
      moved = true;
      let next: Placement;
      if (resizing) {
        const width = Math.max(8, Math.round(b0.w + dx));
        const keep = !p0.height || ev.shiftKey;
        next = keep
          ? { ...p0, width, ...(p0.height ? { height: Math.round((b0.h * width) / b0.w) } : {}) }
          : { ...p0, width, height: Math.max(8, Math.round(b0.h + dy)) };
      } else {
        next = { ...p0, x: Math.round((snap(p0.x * d.width + dx) / d.width) * 10000) / 10000, y: Math.round((snap(p0.y * d.height + dy) / d.height) * 10000) / 10000 };
      }
      h.live(i, next);
      restyle(i, next);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (moved) h.commit(before);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    e.preventDefault();
  });

  stage.addEventListener('dragover', (e) => {
    if (e.dataTransfer?.types.includes('text/x-unin-asset')) e.preventDefault();
  });
  stage.addEventListener('drop', (e) => {
    const id = e.dataTransfer?.getData('text/x-unin-asset');
    if (!id) return;
    e.preventDefault();
    const at = toWorld(e);
    h.drop(id, at.x, at.y);
  });

  draw();
  return { draw, stage };
}
