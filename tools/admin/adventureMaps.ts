// Admin "Bản đồ khu" (decision 037, spec §20): an area of Sobi Adventure drawn as its grid. Paint the ground (walk, path, bridge, wall,
// water), put or remove props (their whole footprint shows), move a thing (chest, group, gate, spring, traveller, stone, shrine, portal,
// spawn). The game's own map checks (§3.10) run on every change: a problem is listed in red and the save stays off until it is fixed.
import { MAP_LIST, PROP_LIST, PROPS, type AreaMap } from '../../src/areas/adventure/logic/config/content';
import { mapProblems, thingsOf } from '../../src/areas/adventure/logic/maps';
import { esc } from './labels';
import { COLOUR, GROUND } from './mapCanvas';
import { post, rememberMessage } from './store';

/** The letter of each class of enemy group on the grid (decision 045). */
const FOE_LETTER: Record<AreaMap['groups'][number]['kind'], string> = { normal: '1', elite: 'E', mutant: 'M', subboss: 'S', boss: 'B', special: '*' };

type Tool = { kind: 'ground'; char: string } | { kind: 'prop'; id: string } | { kind: 'erase' } | { kind: 'move'; what: string | null };


const page = {
  maps: structuredClone(MAP_LIST) as AreaMap[],
  mapId: MAP_LIST[0]!.id,
  tool: { kind: 'ground', char: '#' } as Tool,
  dirty: false,
};

const current = () => page.maps.find((m) => m.id === page.mapId)!;

/** What stands on a tile: a label and a colour, for drawing. */
function overlay(map: AreaMap): Map<string, { text: string; colour: string; id: string }> {
  const out = new Map<string, { text: string; colour: string; id: string }>();
  const mark = (x: number, y: number, w: number, h: number, text: string, colour: string, id: string) => {
    for (let yy = y; yy < y + h; yy += 1) for (let xx = x; xx < x + w; xx += 1) out.set(`${xx},${yy}`, { text: xx === x && yy === y ? text : '', colour, id });
  };
  // Overhead covers first (decision 045): what stands under them draws over their shade.
  for (const c of map.covers) mark(c.x, c.y, c.w, c.h, '▒', '#2a5e28', c.id);
  for (const p of map.props) {
    const def = PROPS[p.prop];
    if (def) mark(p.x, p.y, def.w, def.h, '▲', '#3f6b35', `prop:${p.x},${p.y}`);
  }
  const KIND: Record<string, [string, string]> = { chest: ['C', '#f2c14e'], node: ['H', '#9fd36b'], gate: ['G', '#e0703a'], puzzle: ['Z', '#f0d060'], spring: ['W', '#5fb8e8'], npc: ['N', '#c79bf2'], lore: ['L', '#d8cbb0'], shrine: ['R', '#f29bc6'], portal: ['P', '#b98cf0'], exit: ['>', '#fff6d8'] };
  for (const t of thingsOf(map)) mark(t.x, t.y, t.w, t.h, KIND[t.kind]![0], KIND[t.kind]![1], t.kind === 'portal' ? 'portal' : t.id);
  for (const g of map.groups) out.set(`${g.x},${g.y}`, { text: FOE_LETTER[g.kind], colour: '#e05050', id: g.id });
  out.set(`${map.spawn.x},${map.spawn.y}`, { text: 'S', colour: '#ffffff', id: 'spawn' });
  return out;
}

function moveThing(map: AreaMap, id: string, x: number, y: number) {
  if (id === 'spawn') map.spawn = { x, y };
  else if (id === 'portal') map.portal = { x, y };
  else
    for (const list of [map.chests, map.nodes, map.gates, map.springs, map.npcs, map.lore, map.groups] as { id: string; x: number; y: number }[][]) {
      const row = list.find((r) => r.id === id);
      if (row) {
        row.x = x;
        row.y = y;
      }
    }
  if (map.shrine?.id === id) map.shrine = { ...map.shrine, x, y };
}

function click(x: number, y: number, rerender: () => void) {
  const map = current();
  const tool = page.tool;
  if (tool.kind === 'ground') {
    const row = map.terrain[y]!;
    map.terrain[y] = row.slice(0, x) + tool.char + row.slice(x + 1);
  } else if (tool.kind === 'prop') map.props.push({ prop: tool.id, x, y });
  else if (tool.kind === 'erase') {
    map.props = map.props.filter((p) => {
      const def = PROPS[p.prop];
      return !def || x < p.x || y < p.y || x >= p.x + def.w || y >= p.y + def.h;
    });
  } else if (tool.what === null) {
    const hit = overlay(map).get(`${x},${y}`);
    if (hit && !hit.id.startsWith('prop:')) page.tool = { kind: 'move', what: hit.id };
    return rerender();
  } else {
    moveThing(map, tool.what, x, y);
    page.tool = { kind: 'move', what: null };
  }
  page.dirty = true;
  rerender();
}

/** `mapId` (from `#/adventure-maps/<id>`, the "Quản lý map" page) opens that area. */
export function renderAdventureMaps(root: HTMLElement, mapId?: string | null) {
  if (mapId && page.maps.some((m) => m.id === mapId)) page.mapId = mapId;
  const draw = () => {
    const map = current();
    const marks = overlay(map);
    const problems = mapProblems(map);
    const tool = page.tool;
    const cells = map.terrain
      .flatMap((row, y) => [...row].map((c, x) => {
        const m = marks.get(`${x},${y}`);
        return `<button class="amap__cell" data-x="${x}" data-y="${y}" style="background:${m?.colour ?? COLOUR[c] ?? '#000'}" title="${x},${y}${m ? ` · ${esc(m.id)}` : ''}">${m?.text ?? ''}</button>`;
      }))
      .join('');
    root.innerHTML = `<h3>Bản đồ khu (Sobi Adventure)</h3>
      <p class="muted">Bấm ô để tô / đặt. Mỗi vật chặn đủ cả đế (footprint). Lỗi lối đi hiện đỏ bên dưới; còn lỗi thì không lưu được.</p>
      <div class="form-grid">
        <label class="field"><span>Khu</span><select data-map>${page.maps.map((m) => `<option value="${m.id}"${m.id === page.mapId ? ' selected' : ''}>${esc(m.nameVi)} (${m.zoneId})</option>`).join('')}</select></label>
        <label class="field"><span>Công cụ</span><select data-tool>
          ${GROUND.map(([c, n]) => `<option value="g:${c}"${tool.kind === 'ground' && tool.char === c ? ' selected' : ''}>Tô: ${n}</option>`).join('')}
          ${PROP_LIST.map((p) => `<option value="p:${p.id}"${tool.kind === 'prop' && tool.id === p.id ? ' selected' : ''}>Đặt vật: ${esc(p.nameVi)} (${p.w}×${p.h})</option>`).join('')}
          <option value="e"${tool.kind === 'erase' ? ' selected' : ''}>Xoá vật</option>
          <option value="m"${tool.kind === 'move' ? ' selected' : ''}>Dời rương / quái / cổng / suối…${tool.kind === 'move' && tool.what ? ` (đang dời ${esc(tool.what)})` : ''}</option>
        </select></label>
        <button class="btn" data-save ${page.dirty && problems.length === 0 ? '' : 'disabled'}>Lưu vào game</button>
      </div>
      <div class="amap" style="grid-template-columns:repeat(${map.cols},18px)">${cells}</div>
      ${problems.length > 0 ? `<ul class="amap__problems">${problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '<p class="ok">Khu này qua mọi kiểm tra: không góc chết, đường chính không cần cổng nguyên tố.</p>'}`;
    root.querySelector<HTMLSelectElement>('[data-map]')!.addEventListener('change', (e) => {
      page.mapId = (e.target as HTMLSelectElement).value;
      history.replaceState(null, '', `#/adventure-maps/${page.mapId}`);
      draw();
    });
    root.querySelector<HTMLSelectElement>('[data-tool]')!.addEventListener('change', (e) => {
      const v = (e.target as HTMLSelectElement).value;
      page.tool = v.startsWith('g:') ? { kind: 'ground', char: v.slice(2) } : v.startsWith('p:') ? { kind: 'prop', id: v.slice(2) } : v === 'e' ? { kind: 'erase' } : { kind: 'move', what: null };
      draw();
    });
    root.querySelectorAll<HTMLButtonElement>('.amap__cell').forEach((b) => b.addEventListener('click', () => click(Number(b.dataset.x), Number(b.dataset.y), draw)));
    root.querySelector('[data-save]')!.addEventListener('click', async () => {
      try {
        await post('/__admin/content', { file: 'adventure/maps.json', value: { maps: page.maps } });
        page.dirty = false;
        rememberMessage('Đã lưu bản đồ khu vào content/adventure/maps.json.');
        draw();
      } catch (e) {
        alert((e as Error).message);
      }
    });
  };
  draw();
}
