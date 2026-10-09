// Game layout editor page (DECISIONS AD-1): asset library → drag onto the farm frame → edit
// properties → save into content/farm/layout.json, the layout the game draws (no code change needed).
// Keyboard: arrows nudge (Shift ×10), Delete, Ctrl+D duplicate, Ctrl+Z / Ctrl+Y, Esc.
import { FARM_LAYOUT } from '../../src/areas/farm/scene/config/layout';
import { FARM_CONTENT } from '../../src/areas/farm/logic/config/content';
import { PLAZA_LAYOUT } from '../../src/areas/plaza/logic/config/content';
import { PLANNED_AREAS } from '../../src/core/config/plannedAreas';
import { TROUGH_PROP_ID } from '../../src/core/config/assetIds';
import { SEASON_IDS, SEASON_LOOKS, type SeasonId } from '../../src/core/config/seasons';
import { parseSeason } from '../../src/core/engine/season';
import { layoutIssues } from '../../scripts/admin/rules';
import { esc } from './labels';
import { mountList } from './listKit';
import { byNumber, byText } from './listQuery';
import { History, add, duplicate, moveTo, patch, remove, reorder, type Design, type Placement } from './layoutModel';
import { mountStage, preloadSizes, sizeOf } from './layoutStage';
import { confirmDanger } from './modal';
import { openPicker } from './picker';
import { LAYER_LABEL, properties as propsForm, readProps as readPropsForm, type PortalChoices } from './layoutProps';
import { artUrl, json, post, state } from './store';

type SeasonFiles = Partial<Record<SeasonId, string>>;
interface Manifest {
  props: { id: string; seasons?: SeasonFiles }[];
  buildings: { id: string; seasons?: SeasonFiles }[];
  layout: { designSize: Design; walkArea: { x: number; y: number; width: number; height: number }; placements: Placement[] };
}

/** Which layout the editor edits: the farm's, or the plaza's (GĐ3: its objects, its doors, where the character walks and appears). */
type Target = 'farm' | 'plaza';
const TARGET_LABEL: Record<Target, string> = { farm: '🐷 Nông trại', plaza: '🏛️ Sảnh Sobi' };
const AREAS_WITH_DOORS = [FARM_CONTENT.area, ...PLANNED_AREAS];
/** Every door of the plaza: portal id → the name of the Area it leads to. */
const PORTALS: PortalChoices = AREAS_WITH_DOORS.map((m) => [m.portalInPlaza, `${m.name.vi} (${m.portalInPlaza})`] as const);
interface PlazaMeta { walkArea: { x: number; y: number; width: number; height: number }; spawn: { x: number; y: number }; portalReach: number }
const plazaMetaOf = (): PlazaMeta => ({ walkArea: { ...PLAZA_LAYOUT.walkArea }, spawn: { ...PLAZA_LAYOUT.spawn }, portalReach: PLAZA_LAYOUT.portalReach });

let refocus = false;
const ed = {
  target: 'farm' as Target,
  meta: plazaMetaOf(),
  savedMeta: plazaMetaOf(),
  loaded: false,
  design: { width: 1600, height: 900 } as Design,
  walk: { x: 0, y: 0, width: 1, height: 1 },
  list: [] as Placement[],
  saved: [] as Placement[],
  sel: null as number | null,
  history: new History(),
  preview: false,
  showWalk: true,
  snap: 10,
  /** Season preview (SE-1): the game draws the same layout with each season's art; null = default art. */
  season: null as SeasonId | null,
  seasons: new Map<string, SeasonFiles>(),
};
const SEASON_LABEL: Record<SeasonId, string> = { spring: '🌸 Xuân', summer: '☀️ Hạ', autumn: '🍂 Thu', winter: '❄️ Đông' };
export const SECTION_LABEL: Record<string, string> = { props: 'Đồ vật', buildings: 'Công trình', environment: 'Môi trường', ui: 'UI', fx: 'Hiệu ứng' };
/** Art of `id` as the game draws it in the previewed season (fallback: the default file). */
const urlOf = (id: string) => {
  const path = ed.season ? ed.seasons.get(id)?.[ed.season] : undefined;
  return path ? `/assets/${path}` : artUrl(id);
};
const dirty = () => JSON.stringify(ed.list) !== JSON.stringify(ed.saved) || (ed.target === 'plaza' && JSON.stringify(ed.meta) !== JSON.stringify(ed.savedMeta));
const issues = () =>
  layoutIssues(ed.list, { assetIds: new Set(state.art.map((a) => a.id)), troughId: TROUGH_PROP_ID, ...(ed.target === 'plaza' ? { plaza: { portals: PORTALS.map(([id]) => id) } } : {}) });

async function load() {
  const m = await json<Manifest>(`/assets/manifest/assets.json?t=${Date.now()}`);
  // content/farm/layout.json: a save rewrites it and Vite reloads the page with the new module.
  const source = ed.target === 'plaza' ? PLAZA_LAYOUT : FARM_LAYOUT;
  ed.design = source.designSize;
  ed.meta = plazaMetaOf();
  ed.savedMeta = plazaMetaOf();
  ed.walk = ed.target === 'plaza' ? ed.meta.walkArea : FARM_LAYOUT.walkArea;
  ed.list = [...source.placements];
  ed.saved = [...source.placements];
  ed.seasons = new Map([...m.props, ...m.buildings].filter((r) => r.seasons).map((r) => [r.id, r.seasons!]));
  ed.history.clear();
  ed.sel = null;
  await preloadSizes([
    ...state.art.map((a) => a.url),
    ...[...ed.seasons.values()].flatMap((s) => Object.values(s).map((p) => `/assets/${p}`)),
  ]);
  ed.loaded = true;
}

function change(next: Placement[], sel = ed.sel) {
  ed.history.push(ed.list);
  ed.list = next;
  ed.sel = sel !== null && sel < next.length ? sel : null;
}

export function renderLayout(root: HTMLElement, rerender: () => void) {
  if (!ed.loaded) {
    root.innerHTML = '<p class="loading">Đang tải layout… 🐷</p>';
    load().then(rerender, (e: unknown) => (root.innerHTML = `<p class="empty">${esc((e as Error).message)}</p>`));
    return;
  }
  const all = issues();
  const errors = all.filter((x) => x.level === 'error');
  root.innerHTML = `
    <div class="savebar">
      <label class="field inline"><span>Layout</span><select data-target>${(Object.keys(TARGET_LABEL) as Target[]).map((t) => `<option value="${t}"${t === ed.target ? ' selected' : ''}>${TARGET_LABEL[t]}</option>`).join('')}</select></label>
      <button class="btn btn-small" data-undo ${ed.history.canUndo ? '' : 'disabled'}>↶ Hoàn tác</button>
      <button class="btn btn-small" data-redo ${ed.history.canRedo ? '' : 'disabled'}>↷ Làm lại</button>
      <label class="check"><input type="checkbox" data-opt="preview" ${ed.preview ? 'checked' : ''} /> Xem trước</label>
      <label class="check"><input type="checkbox" data-opt="walk" ${ed.showWalk ? 'checked' : ''} /> ${ed.target === 'plaza' ? 'Vùng nhân vật đi' : 'Vùng heo đi'}</label>
      <label class="field inline"><span>Lưới</span><select data-snap>${[1, 5, 10, 20].map((g) => `<option value="${g}"${g === ed.snap ? ' selected' : ''}>${g === 1 ? 'tắt' : `${g}px`}</option>`).join('')}</select></label>
      <label class="field inline"><span>Mùa</span><select data-season><option value="">Mặc định</option>${SEASON_IDS.map((s) => `<option value="${s}"${s === ed.season ? ' selected' : ''}>${SEASON_LABEL[s]}</option>`).join('')}</select></label>
      <span class="spacer"></span>
      ${ed.target === 'farm' ? '<button class="btn btn-small" data-reset>↺ Về layout mặc định</button>' : ''}
      ${dirty() ? '<span class="badge status-warn">Chưa lưu</span><button class="btn btn-small" data-discard>Huỷ thay đổi</button>' : ''}
      <button class="btn btn-primary" data-save ${!dirty() || errors.length || !state.apiOnline ? 'disabled' : ''}>💾 Lưu layout vào game</button>
    </div>
    ${all.filter((x) => x.level !== 'info').length ? `<ul class="issues">${all.filter((x) => x.level !== 'info').map((x) => `<li class="issue ${x.level}">${esc(x.speciesId ?? 'Layout')} — ${esc(x.text)}</li>`).join('')}</ul>` : ''}
    ${ed.target === 'plaza' ? plazaMetaForm() : ''}
    <div class="layout-editor">
      <aside class="panel lib" data-lib></aside>
      <section class="layout-editor__center"><div data-stage></div><h3>Vật trong layout</h3><div data-placements></div></section>
      <aside class="panel" data-props-host>${propsForm(ed.list, ed.sel, ed.design, ed.target === 'plaza' ? PORTALS : undefined)}</aside>
    </div>`;

  const stage = mountStage(root.querySelector<HTMLElement>('[data-stage]')!, ed.design, {
    list: () => ed.list,
    selected: () => ed.sel,
    select: (i) => {
      ed.sel = i;
      stage.draw();
      root.querySelector<HTMLElement>('[data-props-host]')!.innerHTML = propsForm(ed.list, ed.sel, ed.design, ed.target === 'plaza' ? PORTALS : undefined);
      bindProps();
    },
    live: (i, next) => {
      ed.list = ed.list.map((p, k) => (k === i ? next : p));
    },
    commit: (before) => {
      ed.history.push(before);
      refocus = true;
      rerender();
    },
    drop: (id, x, y) => {
      const nat = sizeOf(urlOf(id));
      change(add(ed.list, id, x, y + nat.h / 2, ed.design, 4, Math.min(nat.w, 300)), ed.list.length);
      rerender();
    },
    urlOf,
    options: () => ({ preview: ed.preview, walk: ed.showWalk, snap: ed.snap }),
    walkArea: ed.walk,
    ...(ed.season ? { palette: SEASON_LOOKS[ed.season].backdrop } : {}),
  });

  const act = (fn: () => void) => () => {
    fn();
    rerender();
  };
  function bindProps() {
    const f = root.querySelector<HTMLFormElement>('[data-props]');
    if (!f || ed.sel === null) return;
    const i = ed.sel;
    f.addEventListener('change', act(() => {
      const next = readPropsForm(f, ed.design, ed.target === 'plaza');
      const p = ed.list[i]!;
      // Keep the stored fraction when the shown pixel did not change (no drift from rounding).
      const W = ed.design.width;
      const H = ed.design.height;
      next.x = Math.round(p.x * W) === Math.round(next.x! * W) ? p.x : Math.round(next.x! * 10000) / 10000;
      next.y = Math.round(p.y * H) === Math.round(next.y! * H) ? p.y : Math.round(next.y! * 10000) / 10000;
      change(patch(ed.list, i, next));
    }));
    f.querySelector('[data-picker="id"]')?.addEventListener('click', () =>
      openPicker({
        title: 'Thay asset',
        current: ed.list[i]!.id,
        items: state.art.filter((a) => a.url && SECTION_LABEL[a.section] && a.section !== 'ui' && a.section !== 'fx').map((a) => ({
          id: a.id, label: a.nameVi ?? a.id, url: a.url, group: SECTION_LABEL[a.section]!,
          note: ed.list.some((p) => p.id === a.id) ? `${a.id} · đang có trong layout` : a.id,
        })),
        onPick: (id) => {
          change(patch(ed.list, i, { id }));
          rerender();
        },
      }),
    );
    f.querySelectorAll<HTMLElement>('[data-quick]').forEach((b) =>
      b.addEventListener('click', act(() => {
        const q = b.dataset.quick;
        const p = ed.list[i]!;
        if (q === 'native') change(patch(ed.list, i, { width: undefined, height: undefined }));
        else if (q === 'ratio') change(patch(ed.list, i, { height: undefined, width: p.width ?? sizeOf(urlOf(p.id)).w }));
        else change(patch(ed.list, i, { x: 0.5 }));
      })),
    );
    f.querySelectorAll<HTMLElement>('[data-order]').forEach((b) =>
      b.addEventListener('click', act(() => {
        const r = reorder(ed.list, i, b.dataset.order as 'up');
        change(r.list, r.index);
      })),
    );
    f.querySelectorAll<HTMLElement>('[data-scale]').forEach((b) =>
      b.addEventListener('click', act(() => {
        const p = ed.list[i]!;
        const k = Number(b.dataset.scale);
        const base = p.width ?? sizeOf(urlOf(p.id)).w;
        change(patch(ed.list, i, { width: Math.round(base * k), ...(p.height ? { height: Math.round(p.height * k) } : {}) }));
      })),
    );
    f.querySelector('[data-dup]')?.addEventListener('click', act(() => change(duplicate(ed.list, i), i + 1)));
    f.querySelector('[data-del]')?.addEventListener('click', () =>
      confirmDanger('Xoá khỏi layout', `Xoá ${ed.list[i]!.label ?? ed.list[i]!.id} khỏi nông trại? (Ảnh vẫn còn trong thư viện.)`, 'Xoá', act(() => change(remove(ed.list, i), null))),
    );
  }
  bindProps();

  mountList(root.querySelector<HTMLElement>('[data-lib]')!, {
    id: 'layout-lib',
    items: () => state.art.filter((a) => a.url && a.section !== 'ui' && a.section !== 'fx'),
    text: (a) => [a.id, a.nameVi, SECTION_LABEL[a.section]],
    filters: [
      { key: 'section', label: 'Mọi loại', options: ['props', 'buildings', 'environment'].map((s) => [s, SECTION_LABEL[s]!] as const), test: (a, v) => a.section === v },
      { key: 'used', label: 'Đang dùng / chưa', options: [['used', 'Đang có trong layout'], ['unused', 'Chưa dùng']], test: (a, v) => (v === 'used') === ed.list.some((p) => p.id === a.id) },
    ],
    sorts: [{ key: 'az', label: 'Tên A-Z', compare: byText((a) => a.id) }],
    pageSize: 40,
    placeholder: 'Tìm asset…',
    noun: 'asset',
    resultsClass: 'lib__grid',
    render: (rows) => rows.map((a) => `<button type="button" class="lib__item" draggable="true" data-asset="${esc(a.id)}" title="Kéo vào khung hoặc bấm để thêm">
      <img src="${esc(a.url!)}" alt="" draggable="false" /><small>${esc(a.id)}</small></button>`).join(''),
    bind: (el) =>
      el.querySelectorAll<HTMLElement>('[data-asset]').forEach((b) => {
        b.addEventListener('dragstart', (e) => e.dataTransfer?.setData('text/x-unin-asset', b.dataset.asset!));
        b.addEventListener('click', () => {
          const nat = sizeOf(urlOf(b.dataset.asset!));
          change(add(ed.list, b.dataset.asset!, ed.design.width / 2, ed.design.height * 0.75, ed.design, 4, Math.min(nat.w, 300)), ed.list.length);
          rerender();
        });
      }),
  });

  mountList(root.querySelector<HTMLElement>('[data-placements]')!, {
    id: 'layout-placements',
    items: () => ed.list.map((p, i) => ({ p, i })),
    text: ({ p }) => [p.id, p.label, p.action, p.role],
    filters: [
      { key: 'layer', label: 'Mọi lớp', options: LAYER_LABEL.map((l, k) => [String(k), l] as const), test: ({ p }, v) => p.layer === Number(v) },
      { key: 'vis', label: 'Hiện / ẩn', options: [['on', 'Đang hiện'], ['off', 'Đang ẩn'], ['locked', 'Đang khoá']], test: ({ p }, v) => (v === 'locked' ? !!p.locked : (v === 'on') === (p.visible !== false)) },
      { key: 'action', label: 'Mọi tương tác', options: [['yes', 'Bấm được'], ['no', 'Trang trí']], test: ({ p }, v) => (v === 'yes') === !!p.action },
    ],
    sorts: [
      { key: 'list', label: 'Thứ tự trong data', compare: byNumber(({ i }) => i) },
      { key: 'layer', label: 'Theo lớp', compare: byNumber(({ p }) => p.layer) },
      { key: 'az', label: 'Tên A-Z', compare: byText(({ p }) => p.label ?? p.id) },
    ],
    pageSize: 50,
    placeholder: 'Tìm vật trong layout…',
    noun: 'vật',
    resultsClass: 'table-wrap',
    render: (rows) => `<table class="table"><tbody>${rows.map(({ p, i }) => `<tr class="${i === ed.sel ? 'is-selected' : ''}${p.visible === false ? ' is-off' : ''}" data-pick="${i}">
      <td>${urlOf(p.id) ? `<img class="thumb" src="${esc(urlOf(p.id)!)}" alt="" />` : ''}</td><td><b>${esc(p.label ?? p.id)}</b><br /><small class="mono">#${i + 1} ${esc(p.id)}</small></td>
      <td>Lớp ${p.layer}</td><td>${Math.round(p.x * ed.design.width)}, ${Math.round(p.y * ed.design.height)}</td><td>${p.width ?? '—'}${p.height ? `×${p.height}` : ''}</td>
      <td>${p.action ? `<span class="chip">${esc(p.action)}</span>` : ''}${p.visible === false ? ' 🙈' : ''}${p.locked ? ' 🔒' : ''}</td></tr>`).join('')}</tbody></table>`,
    bind: (el) => el.querySelectorAll<HTMLElement>('[data-pick]').forEach((r) => r.addEventListener('click', act(() => (ed.sel = Number(r.dataset.pick))))),
  });

  const bar = (sel: string, fn: () => void) => root.querySelector(sel)?.addEventListener('click', act(fn));
  bar('[data-undo]', () => (ed.list = ed.history.undo(ed.list) ?? ed.list));
  bar('[data-redo]', () => (ed.list = ed.history.redo(ed.list) ?? ed.list));
  bar('[data-discard]', () => change([...ed.saved], null));
  root.querySelector('[data-reset]')?.addEventListener('click', () =>
    confirmDanger('Về layout mặc định', 'Thay toàn bộ layout bằng bản mặc định (vẫn hoàn tác được, chưa ghi tới khi bấm Lưu).', 'Dùng layout mặc định', async () => {
      const r = await json<{ placements: Placement[] }>('/__admin/layout-default');
      change(r.placements, null);
      rerender();
    }),
  );
  root.querySelectorAll<HTMLInputElement>('[data-opt]').forEach((c) =>
    c.addEventListener('change', act(() => (c.dataset.opt === 'preview' ? (ed.preview = c.checked) : (ed.showWalk = c.checked)))),
  );
  root.querySelector<HTMLSelectElement>('[data-target]')?.addEventListener('change', (e) => {
    const next = (e.target as HTMLSelectElement).value as Target;
    if (dirty()) {
      state.message = { kind: 'error', text: 'Lưu hoặc huỷ thay đổi của layout hiện tại trước khi chuyển sang layout khác.' };
    } else {
      ed.target = next;
      ed.loaded = false;
    }
    rerender();
  });
  root.querySelectorAll<HTMLInputElement>('[data-meta]').forEach((input) =>
    input.addEventListener('change', act(() => setMeta(input.dataset.meta!, Number(input.value)))),
  );
  root.querySelector<HTMLSelectElement>('[data-snap]')?.addEventListener('change', (e) => (ed.snap = Number((e.target as HTMLSelectElement).value)));
  root.querySelector<HTMLSelectElement>('[data-season]')?.addEventListener('change', (e) => {
    ed.season = parseSeason((e.target as HTMLSelectElement).value);
    rerender();
  });
  root.querySelector('[data-save]')?.addEventListener('click', async () => {
    try {
      await post('/__admin/layout', { placements: ed.list, target: ed.target, ...(ed.target === 'plaza' ? { plaza: ed.meta } : {}) });
      ed.saved = [...ed.list];
      ed.savedMeta = JSON.parse(JSON.stringify(ed.meta)) as PlazaMeta;
      state.message = { kind: 'ok', text: `Đã lưu layout ${TARGET_LABEL[ed.target]} (${ed.list.length} vật). Game đọc layout mới khi tải lại (F5 / mở lại).` };
    } catch (e) {
      state.message = { kind: 'error', text: (e as Error).message };
    }
    rerender();
  });
  stage.stage.addEventListener('keydown', (e) => onKey(e, rerender));
  if (refocus) stage.stage.focus({ preventScroll: true });
  refocus = false;
}

function onKey(e: KeyboardEvent, rerender: () => void) {
  const i = ed.sel;
  const ctrl = e.ctrlKey || e.metaKey;
  const done = () => {
    e.preventDefault();
    refocus = true;
    rerender();
  };
  if (ctrl && e.key.toLowerCase() === 'z') return void ((ed.list = ed.history.undo(ed.list) ?? ed.list), done());
  if (ctrl && e.key.toLowerCase() === 'y') return void ((ed.list = ed.history.redo(ed.list) ?? ed.list), done());
  if (i === null) return;
  const p = ed.list[i]!;
  if (e.key === 'Escape') return void ((ed.sel = null), done());
  if (ctrl && e.key.toLowerCase() === 'd') return void (change(duplicate(ed.list, i), i + 1), done());
  if (e.key === 'Delete') return void (change(remove(ed.list, i), null), done());
  const step = e.shiftKey ? 10 : 1;
  const dir: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  const v = dir[e.key];
  if (v && !p.locked) {
    change(moveTo(ed.list, i, p.x * ed.design.width + v[0], p.y * ed.design.height + v[1], ed.design));
    done();
  }
}

/** Walk area, spawn and door reach of the plaza as pixels in the form; stored as fractions of the frame. */
function plazaMetaForm(): string {
  const { width: W, height: H } = ed.design;
  const f = (label: string, key: string, value: number) =>
    `<label class="field"><span>${label}</span><input type="number" data-meta="${key}" value="${Math.round(value)}" /></label>`;
  const w = ed.meta.walkArea;
  return `<div class="panel form-grid" data-plaza-meta><h4>Sảnh: chỗ nhân vật đi và xuất hiện (px)</h4>
    ${f('Vùng đi: X', 'walk.x', w.x * W)}${f('Y', 'walk.y', w.y * H)}${f('Rộng', 'walk.width', w.width * W)}${f('Cao', 'walk.height', w.height * H)}
    ${f('Xuất hiện: X', 'spawn.x', ed.meta.spawn.x * W)}${f('Y', 'spawn.y', ed.meta.spawn.y * H)}${f('Tầm với cổng', 'reach', ed.meta.portalReach)}</div>`;
}

function setMeta(key: string, value: number) {
  const { width: W, height: H } = ed.design;
  if (!Number.isFinite(value)) return;
  const unit = (v: number, size: number) => Math.min(1, Math.max(0, Math.round((v / size) * 10000) / 10000));
  const [group, field] = key.split('.') as [string, 'x' | 'y' | 'width' | 'height'];
  if (key === 'reach') ed.meta.portalReach = Math.max(1, Math.round(value));
  else if (group === 'walk') ed.meta.walkArea[field] = unit(value, field === 'x' || field === 'width' ? W : H);
  else if (group === 'spawn') ed.meta.spawn[field as 'x' | 'y'] = unit(value, field === 'x' ? W : H);
  ed.walk = ed.meta.walkArea;
}

export const layoutDirty = () => ed.loaded && dirty();
