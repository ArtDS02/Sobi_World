// Breed map page (DECISIONS BR-2): the game's breeding graph (src/core/engine/breedMap.ts, built
// from the same breedingOutcomes / MUTATIONS / pair table the game uses) as generation columns.
// Clicking a pig pans to it, highlights it, dims everything unrelated and lights up its whole
// lineage — parents, ancestors (pink "DNA" lines) and descendants (green).
import { MUTATIONS } from '../../src/areas/farm/logic/config/breedingRules';
import { BREEDS } from '../../src/areas/farm/logic/config/breeds';
import type { BreedId } from '../../src/areas/farm/logic/config/ids';
import { breedMap, lineage, type BreedMap, type BreedMapEdge } from '../../src/areas/farm/logic/breedMap';
import { RARITY_LABEL, esc, rarityBadge } from './labels';

const COL_W = 240;
const NODE_W = 178;
const NODE_H = 48;
const ROW_H = 60;
const PAD = 28;
const HEAD = 40;

export interface PigLook {
  name: (id: string) => string;
  img: (id: string) => string | null;
}

let cached: BreedMap | null = null;
let selected: BreedId | null = null;
/** Built on first open (≈ 2 300 pair tables), then kept: the data only changes with a code save. */
const mapOf = () => (cached ??= breedMap());

const pct = (n: number) => `${n >= 10 ? Math.round(n) : Math.round(n * 10) / 10} %`;
const KIND_LABEL: Record<BreedMapEdge['kind'], string> = { route: 'Đường lai chính', recipe: 'Công thức đột biến', pair: 'Bảng ghi đè cặp' };

function layout(map: BreedMap) {
  const pos = new Map<BreedId, { x: number; y: number }>();
  const rows = new Array<number>(map.generations).fill(0);
  for (const n of map.nodes) {
    const row = rows[n.generation]!++;
    pos.set(n.id, { x: PAD + n.generation * COL_W, y: HEAD + PAD + row * ROW_H });
  }
  const height = HEAD + PAD * 2 + Math.max(...rows) * ROW_H;
  return { pos, width: PAD * 2 + (map.generations - 1) * COL_W + NODE_W, height };
}

function edgePath(a: { x: number; y: number }, b: { x: number; y: number }) {
  const x1 = a.x + NODE_W,
    y1 = a.y + NODE_H / 2,
    x2 = b.x,
    y2 = b.y + NODE_H / 2;
  const bend = Math.max(60, Math.abs(x2 - x1) / 2);
  return `M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}`;
}

export function renderBreedMap(root: HTMLElement, look: PigLook) {
  const map = mapOf();
  const { pos, width, height } = layout(map);
  const cols = Array.from({ length: map.generations }, (_, g) =>
    `<div class="bmap__col" style="left:${PAD + g * COL_W}px;width:${NODE_W}px">${g === 0 ? 'Thế hệ 0 · Cửa hàng' : `Thế hệ ${g}`}</div>`).join('');
  const nodes = map.nodes.map((n) => {
    const p = pos.get(n.id)!;
    const src = look.img(n.id);
    return `<button type="button" class="bmap__node rarity-line-${BREEDS[n.id].rarity.toLowerCase()}${n.route && !n.route.strong ? ' is-weak' : ''}"
      data-node="${n.id}" style="left:${p.x}px;top:${p.y}px;width:${NODE_W}px;height:${NODE_H}px" title="${esc(look.name(n.id))}">
      ${src ? `<img src="${esc(src)}" alt="" loading="lazy" />` : '<span></span>'}<span class="bmap__name">${esc(look.name(n.id))}</span></button>`;
  }).join('');
  const edges = map.edges.map((e, i) =>
    `<path class="bmap__edge kind-${e.kind}" data-edge="${i}" d="${edgePath(pos.get(e.from)!, pos.get(e.to)!)}"><title>${esc(look.name(e.from))} × ${esc(look.name(e.partner))} → ${esc(look.name(e.to))}: ${pct(e.percent)} (${KIND_LABEL[e.kind]})</title></path>`).join('');
  const options = [...map.nodes].sort((a, b) => look.name(a.id).localeCompare(look.name(b.id), 'vi'))
    .map((n) => `<option value="${n.id}">${esc(look.name(n.id))} — ${esc(RARITY_LABEL[BREEDS[n.id].rarity] ?? '')}</option>`).join('');
  root.innerHTML = `
    <div class="bmap__bar">
      <label class="field inline"><span>Tìm heo</span><select data-jump><option value="">— chọn để xem phả hệ —</option>${options}</select></label>
      <span class="bmap__legend"><i class="lg route"></i>Đường lai chính <i class="lg recipe"></i>Công thức <i class="lg up"></i>Tổ tiên <i class="lg down"></i>Hậu duệ <i class="lg weak"></i>Chỉ có đường hiếm (&lt; 5 %)</span>
      <button type="button" class="btn btn-small" data-clear>✕ Bỏ chọn</button>
    </div>
    <div class="bmap">
      <div class="bmap__viewport" data-viewport>
        <div class="bmap__world" style="width:${width}px;height:${height}px">${cols}
          <svg class="bmap__edges" width="${width}" height="${height}" aria-hidden="true">${edges}</svg>${nodes}</div>
      </div>
      <aside class="panel bmap__info" data-info></aside>
    </div>`;
  const viewport = root.querySelector<HTMLElement>('[data-viewport]')!;
  const world = root.querySelector<HTMLElement>('.bmap__world')!;
  const info = root.querySelector<HTMLElement>('[data-info]')!;
  const jump = root.querySelector<HTMLSelectElement>('[data-jump]')!;

  const focus = (id: BreedId | null, pan = true) => {
    selected = id;
    jump.value = id ?? '';
    world.classList.toggle('has-focus', id !== null);
    const l = id ? lineage(map, id) : null;
    world.querySelectorAll<HTMLElement>('[data-node]').forEach((el) => {
      const n = el.dataset.node as BreedId;
      el.classList.toggle('is-selected', n === id);
      el.classList.toggle('is-up', !!l?.ancestors.has(n));
      el.classList.toggle('is-down', !!l?.descendants.has(n));
    });
    world.querySelectorAll<SVGPathElement>('[data-edge]').forEach((el) => {
      const e = map.edges[Number(el.dataset.edge)]!;
      const on = !!l?.edges.has(e);
      const up = on && (e.to === id || l!.ancestors.has(e.to));
      el.classList.toggle('is-up', up);
      el.classList.toggle('is-down', on && !up);
      if (on) el.parentNode!.appendChild(el); // lit lines on top
    });
    info.innerHTML = id ? infoHtml(map, id, look, l!) : '<p class="muted">Bấm một heo trên sơ đồ để xem bố mẹ, tổ tiên và hậu duệ. Sơ đồ dùng chính dữ liệu phối giống của game.</p>';
    if (id && pan) {
      const p = pos.get(id)!;
      const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      viewport.scrollTo({ left: p.x + NODE_W / 2 - viewport.clientWidth / 2, top: p.y + NODE_H / 2 - viewport.clientHeight / 2, behavior: smooth ? 'smooth' : 'auto' });
    }
  };
  root.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-node],[data-goto],[data-clear]');
    if (!t) return;
    if (t.dataset.clear !== undefined) return focus(null);
    focus((t.dataset.node ?? t.dataset.goto) as BreedId);
  });
  jump.addEventListener('change', () => focus((jump.value || null) as BreedId | null));
  focus(selected);
}

function infoHtml(map: BreedMap, id: BreedId, look: PigLook, l: ReturnType<typeof lineage>) {
  const n = map.nodes.find((x) => x.id === id)!;
  const chip = (x: BreedId) => `<button type="button" class="bmap__chip" data-goto="${x}">${esc(look.name(x))}</button>`;
  const parentsOf = map.edges.filter((e) => e.to === id);
  const childrenOf = [...new Set(map.edges.filter((e) => e.from === id).map((e) => e.to))];
  const recipesIn = MUTATIONS.filter((m) => m.result === id);
  const recipesOut = MUTATIONS.filter((m) => m.parents.includes(id));
  const src = look.img(id);
  const route = n.route
    ? `<p>Lai từ ${chip(n.route.a)} × ${chip(n.route.b)} — <b>${pct(n.route.percent)}</b>${n.route.strong ? '' : ' <span class="badge status-warn">nhánh hiếm</span>'}</p>`
    : '<p>Bán trong cửa hàng (gốc phả hệ).</p>';
  return `
    <div class="bmap__head">${src ? `<img src="${esc(src)}" alt="" />` : ''}<div><h3>${esc(look.name(id))}</h3>${rarityBadge(BREEDS[id].rarity)} <span class="badge">Thế hệ ${n.generation}</span></div></div>
    ${route}
    <p class="muted">${l.ancestors.size} tổ tiên · ${l.descendants.size} hậu duệ${BREEDS[id].breedable ? '' : ' · không phối giống được (huyền thoại)'}</p>
    <h4>Bố mẹ trên sơ đồ</h4><div class="bmap__chips">${[...new Set(parentsOf.map((e) => e.from))].map(chip).join('') || '<span class="muted">—</span>'}</div>
    <h4>Con trực tiếp</h4><div class="bmap__chips">${childrenOf.map(chip).join('') || '<span class="muted">—</span>'}</div>
    <h4>Công thức ra con này</h4>${recipesIn.length ? `<ul class="bmap__list">${recipesIn.map((m) => `<li>${chip(m.parents[0])} × ${chip(m.parents[1])} <small>+${m.weight} điểm</small></li>`).join('')}</ul>` : '<p class="muted">—</p>'}
    <h4>Công thức dùng con này</h4>${recipesOut.length ? `<ul class="bmap__list">${recipesOut.map((m) => `<li>× ${chip(m.parents[0] === id ? m.parents[1] : m.parents[0])} → ${chip(m.result)}</li>`).join('')}</ul>` : '<p class="muted">—</p>'}`;
}
