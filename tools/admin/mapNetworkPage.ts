// Admin "Mạng map" (decision 047, Map Builder GĐ5): every area of Sobi Adventure as a node and every connection as an edge (the exits
// both ways between two areas: arrow = one-way, dashed = locked, faint = inactive, red = set up wrong). Drag nodes to arrange the
// diagram (saved in meta.json, never in the areas), drag the background to pan, wheel to zoom; search, filter by zone and status.
// Click a node for the area (its exits, its spawns; double-click opens its exits), an edge for its exits (open one to edit it); the warnings of the whole world
// are listed beside and select their area. The model is mapNetwork.ts.
import { esc } from './labels';
import { editExits, editSpawns, fetchBuilder, postMeta } from './mapApi';
import { EXIT_KIND_LABEL, LOCK_LABEL } from './mapLinks';
import { openSimulation } from './mapSimulate';
import { STATUS_ICON, zoneVisual } from './mapManage';
import { optionHtml } from './richSelect';
import * as M from './mapModel';
import { NODE, autoLayout, networkEdges, networkWarnings, nodePositions, type NetEdge, type Point } from './mapNetwork';

const lastClick = { id: null as string | null, at: 0 };

type Selection = { kind: 'node'; id: string } | { kind: 'edge'; key: string } | null;

const page = {
  data: null as M.BuilderData | null,
  pos: {} as Record<string, Point>,
  view: { x: 0, y: 0, scale: 1 },
  fitted: false,
  selected: null as Selection,
  query: '',
  zone: '',
  status: '' as M.MapStatus | '',
  message: '',
};

const STATUS_FILL: Record<M.MapStatus, string> = { published: '#dff3df', changed: '#fff1c9', draft: '#e8e1fb', disabled: '#e4e4e4' };
const centre = (id: string): Point => ({ x: page.pos[id]!.x + NODE.w / 2, y: page.pos[id]!.y + NODE.h / 2 });

/** The point where the segment from `from` towards the centre of node `id` meets that node's box. */
function atBorder(from: Point, id: string): Point {
  const c = centre(id);
  const dx = from.x - c.x;
  const dy = from.y - c.y;
  const t = Math.min(dx ? NODE.w / 2 / Math.abs(dx) : Infinity, dy ? NODE.h / 2 / Math.abs(dy) : Infinity, 1);
  return { x: c.x + dx * t, y: c.y + dy * t };
}

const shown = (data: M.BuilderData, m: AreaMapLike) =>
  (!page.zone || m.zoneId === page.zone) && (!page.status || M.statusOf(data, m.id) === page.status);
type AreaMapLike = { id: string; zoneId: string; nameVi: string };

function svgContent(data: M.BuilderData, edges: NetEdge[], warned: Map<string, number>): string {
  const maps = M.workingMaps(data);
  const q = page.query.trim().toLowerCase();
  const sel = page.selected;
  const edgeSvg = edges
    .map((e) => {
      const live = e.exits.filter((x) => !x.inactive);
      const oneFrom = !e.twoWay && live.length > 0 ? live[0]!.from : null;
      const [s, t] = oneFrom === e.b ? [e.b, e.a] : [e.a, e.b];
      const p1 = atBorder(centre(t), s);
      const p2 = atBorder(centre(s), t);
      const cls = ['mnet__edge', e.locked ? 'is-locked' : '', e.inactive ? 'is-inactive' : '', e.problems.length ? 'has-problem' : '', sel?.kind === 'edge' && sel.key === e.key ? 'is-selected' : ''].join(' ');
      const dim = !shown(data, maps.find((m) => m.id === e.a)!) && !shown(data, maps.find((m) => m.id === e.b)!);
      return `<g class="${cls}"${dim ? ' opacity="0.2"' : ''}><line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"${oneFrom ? ' marker-end="url(#mnet-arrow)"' : ''}/>
        <line class="mnet__hit" data-edge="${e.key}" x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}"><title>${esc(`${e.exits.length} lối ra${e.twoWay ? ' · hai chiều' : ' · một chiều'}${e.locked ? ' · có khoá' : ''}`)}</title></line></g>`;
    })
    .join('');
  const nodeSvg = maps
    .map((m) => {
      const p = page.pos[m.id]!;
      const status = M.statusOf(data, m.id);
      const hit = q && `${m.nameVi} ${m.id}`.toLowerCase().includes(q);
      const dim = !shown(data, m) || (q && !hit);
      const n = warned.get(m.id) ?? 0;
      const cls = ['mnet__node', sel?.kind === 'node' && sel.id === m.id ? 'is-selected' : '', hit ? 'is-hit' : '', n ? 'has-problem' : '', status === 'disabled' ? 'is-off' : ''].join(' ');
      return `<g class="${cls}" data-node="${m.id}" transform="translate(${p.x},${p.y})"${dim ? ' opacity="0.25"' : ''}>
        <rect width="${NODE.w}" height="${NODE.h}" rx="10" fill="${STATUS_FILL[status]}"/>
        <text x="10" y="23" class="mnet__name">${esc(m.nameVi.length > 20 ? `${m.nameVi.slice(0, 19)}…` : m.nameVi)}</text>
        <text x="10" y="42" class="mnet__id">${esc(M.STATUS_LABEL[status])}</text>
        ${n ? `<circle cx="${NODE.w - 12}" cy="12" r="10" class="mnet__badge"/><text x="${NODE.w - 12}" y="16" text-anchor="middle" class="mnet__badge-text">${n}</text>` : ''}
        <title>${esc(`${m.nameVi} (${m.id})`)}</title></g>`;
    })
    .join('');
  return `<defs><marker id="mnet-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker></defs>${edgeSvg}${nodeSvg}`;
}

function sideHtml(data: M.BuilderData, edges: NetEdge[], warnings: ReturnType<typeof networkWarnings>): string {
  const maps = M.workingMaps(data);
  const name = (id: string) => maps.find((m) => m.id === id)?.nameVi ?? id;
  const sel = page.selected;
  let detail = '<p class="muted">Bấm một map hoặc một đường nối để xem chi tiết.</p>';
  if (sel?.kind === 'node') {
    const m = maps.find((x) => x.id === sel.id)!;
    const status = M.statusOf(data, m.id);
    const ins = edges.filter((e) => e.exits.some((x) => x.exit.to === m.id)).length;
    detail = `<h4>${esc(m.nameVi)}</h4><p class="mono muted">${m.id}</p>
      <p>${esc(data.zones.find((z) => z.id === m.zoneId)?.nameVi ?? m.zoneId)} · ${m.cols}×${m.rows} · ${M.STATUS_LABEL[status]}<br>${m.exits.length} lối ra · ${ins} map dẫn tới</p>
      <div class="toolbar"><button class="btn btn-small" data-do="simulate">▶ Chạy thử</button><button class="btn btn-small" data-do="exits">Lối ra</button><button class="btn btn-small" data-do="spawns">Điểm xuất hiện</button>
<a class="btn btn-small" href="#/adventure-editor/${m.id}">Map Editor</a><a class="btn btn-small" href="#/adventure-world">Quản lý map</a></div>`;
  } else if (sel?.kind === 'edge') {
    const e = edges.find((x) => x.key === sel.key)!;
    detail = `<h4>${esc(name(e.a))} ↔ ${esc(name(e.b))}</h4>
      ${e.exits
        .map((x) => {
          const n = data.meta[x.from]?.exits?.[x.exit.id];
          const tags = [x.exit.lock ? LOCK_LABEL[x.exit.lock].split(' (')[0] : 'Luôn mở', EXIT_KIND_LABEL[x.exit.kind ?? 'gate'], x.exit.oneWay ? 'một chiều' : '', x.inactive ? 'tạm tắt' : ''].filter(Boolean);
          const dest = maps.find((m) => m.id === x.exit.to);
          const spawn = dest ? M.spawnsOf(dest).find((s) => s.id === x.exit.arrive)?.nameVi : null;
          return `<div class="mspawn__row"><div><b>${esc(n?.nameVi || `${name(x.from)} → ${name(x.exit.to)}`)}</b> <span class="mono muted">${x.exit.id}</span></div>
            <small>${esc(name(x.from))} → ${esc(name(x.exit.to))} · tới ${esc(spawn ?? `ô ${x.exit.arriveX},${x.exit.arriveY}`)} · ${esc(tags.join(' · '))}</small>
            <div><button class="btn btn-small" data-edit-exit="${x.from}|${x.exit.id}">Sửa lối ra này</button></div></div>`;
        })
        .join('')}
      ${e.problems.length ? `<ul class="amap__problems">${e.problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}`;
  }
  const list = warnings
    .filter((w) => !page.zone || maps.find((m) => m.id === w.mapId)?.zoneId === page.zone)
    .map((w) => `<li class="mnet__warn mnet__warn--${w.level}" data-warn="${w.mapId}">${w.level === 'error' ? '⛔' : '⚠'} ${esc(w.text)}</li>`)
    .join('');
  return `<div class="mnet__detail">${detail}</div>
    <h4>Cảnh báo (${warnings.length})</h4>${list ? `<ul class="mnet__warns">${list}</ul>` : '<p class="ok">Mạng map không có cảnh báo.</p>'}`;
}

function fit(root: HTMLElement) {
  const svg = root.querySelector<SVGSVGElement>('svg')!;
  const pts = Object.values(page.pos);
  if (!pts.length) return;
  const minX = Math.min(...pts.map((p) => p.x)) - 30;
  const minY = Math.min(...pts.map((p) => p.y)) - 30;
  const w = Math.max(...pts.map((p) => p.x)) + NODE.w + 30 - minX;
  const h = Math.max(...pts.map((p) => p.y)) + NODE.h + 30 - minY;
  const r = svg.getBoundingClientRect();
  const scale = Math.min(r.width / w, r.height / h, 1.5);
  page.view = { x: minX, y: minY, scale };
}

function draw(root: HTMLElement) {
  const data = page.data!;
  const edges = networkEdges(data);
  const warnings = networkWarnings(data);
  const warned = new Map<string, number>();
  for (const w of warnings) warned.set(w.mapId, (warned.get(w.mapId) ?? 0) + 1);
  const maps = M.workingMaps(data);
  root.innerHTML = `<h3>Mạng map (Sobi Adventure)</h3>
    <p class="muted">${maps.length} map · ${edges.length} đường nối. Kéo map để sắp xếp (chỉ đổi sơ đồ, không đổi map); kéo nền để di chuyển, cuộn để phóng to. Mũi tên = một chiều, nét đứt = có khoá, mờ = tạm tắt, đỏ = lỗi.</p>
    ${page.message ? `<p class="ok">${esc(page.message)}</p>` : ''}
    <div class="toolbar">
      <input class="search" type="search" placeholder="Tìm map…" value="${esc(page.query)}" data-q />
      <span class="mapm__filter"><select data-zone data-rich="compact">${optionHtml('', 'Mọi vùng', !page.zone, { icon: '🗺️' })}${data.zones.map((z) => optionHtml(z.id, z.nameVi, z.id === page.zone, zoneVisual(data, z.id))).join('')}</select></span>
      <span class="mapm__filter"><select data-status data-rich="compact">${optionHtml('', 'Mọi trạng thái', !page.status, { icon: '📋' })}${(Object.keys(M.STATUS_LABEL) as M.MapStatus[]).map((s) => optionHtml(s, M.STATUS_LABEL[s], s === page.status, { icon: STATUS_ICON[s] })).join('')}</select></span>
      <button class="btn" data-fit>Vừa khung</button><button class="btn" data-auto>Xếp tự động</button>
    </div>
    <div class="mnet"><svg class="mnet__svg"></svg><aside class="mnet__side">${sideHtml(data, edges, warnings)}</aside></div>`;
  const svg = root.querySelector<SVGSVGElement>('svg')!;
  const paint = () => {
    const r = svg.getBoundingClientRect();
    svg.setAttribute('viewBox', `${page.view.x} ${page.view.y} ${r.width / page.view.scale} ${r.height / page.view.scale}`);
    svg.innerHTML = svgContent(data, edges, warned);
  };
  if (!page.fitted) {
    fit(root);
    page.fitted = true;
  }
  paint();
  wire(root, svg, paint);
}

function wire(root: HTMLElement, svg: SVGSVGElement, paint: () => void) {
  const data = page.data!;
  const rerender = () => draw(root);
  const saved = async (msg: string) => {
    page.data = await fetchBuilder();
    page.pos = nodePositions(page.data);
    page.message = msg;
    rerender();
  };
  const q = root.querySelector<HTMLInputElement>('[data-q]')!;
  q.addEventListener('input', () => {
    page.query = q.value;
    paint();
  });
  root.querySelector<HTMLSelectElement>('[data-zone]')!.addEventListener('change', (e) => ((page.zone = (e.target as HTMLSelectElement).value), rerender()));
  root.querySelector<HTMLSelectElement>('[data-status]')!.addEventListener('change', (e) => ((page.status = (e.target as HTMLSelectElement).value as M.MapStatus | ''), paint()));
  root.querySelector('[data-fit]')!.addEventListener('click', () => (fit(root), paint()));
  root.querySelector('[data-auto]')!.addEventListener('click', async () => {
    if (!confirm('Xếp lại mọi map theo vùng? Vị trí đã kéo tay sẽ bị thay (map không đổi).')) return;
    const auto = autoLayout(data);
    for (const [id, p] of Object.entries(auto)) await postMeta(id, { node: p });
    page.fitted = false;
    await saved('Đã xếp lại sơ đồ theo vùng.');
  });
  root.querySelector('[data-do="simulate"]')?.addEventListener('click', () => page.selected?.kind === 'node' && openSimulation(data, page.selected.id));
  root.querySelector('[data-do="exits"]')?.addEventListener('click', () => page.selected?.kind === 'node' && editExits(data, page.selected.id, saved));
  root.querySelector('[data-do="spawns"]')?.addEventListener('click', () => page.selected?.kind === 'node' && editSpawns(data, M.draftOf(data, page.selected.id), saved));
  root.querySelectorAll<HTMLButtonElement>('[data-edit-exit]').forEach((b) => b.addEventListener('click', () => {
    const [from, exitId] = b.dataset.editExit!.split('|') as [string, string];
    editExits(data, from, saved, exitId);
  }));
  root.querySelectorAll<HTMLElement>('[data-warn]').forEach((li) => li.addEventListener('click', () => {
    if (!li.dataset.warn) return;
    page.selected = { kind: 'node', id: li.dataset.warn };
    rerender();
  }));

  // Drag a node, pan the background, click to select; wheel to zoom around the pointer.
  let drag: { node: string | null; edge: string | null; sx: number; sy: number; start: Point; moved: boolean } | null = null;
  svg.addEventListener('pointerdown', (e) => {
    const t = e.target as Element;
    const node = t.closest('[data-node]')?.getAttribute('data-node') ?? null;
    const edge = t.closest('[data-edge]')?.getAttribute('data-edge') ?? null;
    drag = { node, edge, sx: e.clientX, sy: e.clientY, start: node ? { ...page.pos[node]! } : { x: page.view.x, y: page.view.y }, moved: false };
    svg.setPointerCapture(e.pointerId);
  });
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = (e.clientX - drag.sx) / page.view.scale;
    const dy = (e.clientY - drag.sy) / page.view.scale;
    if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
    drag.moved = true;
    if (drag.node) page.pos[drag.node] = { x: Math.round(drag.start.x + dx), y: Math.round(drag.start.y + dy) };
    else page.view = { ...page.view, x: drag.start.x - dx, y: drag.start.y - dy };
    paint();
  });
  svg.addEventListener('pointerup', async () => {
    const d = drag;
    drag = null;
    if (!d) return;
    if (d.moved && d.node) {
      const p = page.pos[d.node]!;
      page.data!.meta = { ...page.data!.meta, [d.node]: { ...(page.data!.meta[d.node] ?? { descriptionVi: '', createdAt: '', updatedAt: '' }), node: p } };
      await postMeta(d.node, { node: p }).catch((err: unknown) => alert((err as Error).message));
      return;
    }
    if (d.moved) return;
    // A second click on the same area soon after opens its exits (the first click redrew the diagram, so no dblclick).
    const now = performance.now();
    if (d.node && lastClick.id === d.node && now - lastClick.at < 400) {
      lastClick.id = null;
      return editExits(data, d.node, saved);
    }
    lastClick.id = d.node;
    lastClick.at = now;
    page.selected = d.node ? { kind: 'node', id: d.node } : d.edge ? { kind: 'edge', key: d.edge } : null;
    rerender();
  });
  svg.addEventListener('wheel', (e) => {
    e.preventDefault();
    const r = svg.getBoundingClientRect();
    const k = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const scale = Math.min(3, Math.max(0.2, page.view.scale * k));
    const wx = page.view.x + (e.clientX - r.left) / page.view.scale;
    const wy = page.view.y + (e.clientY - r.top) / page.view.scale;
    page.view = { scale, x: wx - (e.clientX - r.left) / scale, y: wy - (e.clientY - r.top) / scale };
    paint();
  }, { passive: false });
}

export function renderMapNetwork(root: HTMLElement) {
  if (!page.data) root.innerHTML = '<p class="loading">Đang tải mạng map…</p>';
  else draw(root);
  fetchBuilder().then(
    (d) => {
      page.data = d;
      page.pos = nodePositions(d);
      draw(root);
    },
    (e: unknown) => (root.innerHTML = `<p class="empty">Không tải được map (cần <code>npm run admin</code>): ${esc((e as Error).message)}</p>`),
  );
}
