// Admin "Map Editor" (decision 047, Map Builder GĐ6; editor layout redone): one area on a big canvas — its painted background, ground,
// walk overlay, grid, heights, every object and the problems the checks find, pinned on their tiles. Four parts: the toolbar (the
// area, the tools, what is shown, the checks), the palette (ground, objects to click or drag in, layers to hide or lock), the canvas
// and the inspector with the check list. Tools: select / move / resize (drag, Ctrl+click for more, drag an empty spot to box-select),
// ground brush / rectangle / flood fill, walk area (click toggles walk ↔ block), heights, a cover rectangle (a hidden way), eraser,
// place an object (a copy of one of its kind) or a library decoration. Shift+drag (or right / middle drag, or Space) pans, Ctrl+wheel
// zooms around the pointer, the wheel scrolls; Ctrl+Z / Ctrl+Y, Del, Ctrl+D, Ctrl+C / Ctrl+V, arrows nudge, F fits, Ctrl+S saves the
// draft. The work of each area stays in memory while the admin is open, so leaving the page loses nothing.
import type { AreaMap } from '../../src/areas/adventure/logic/config/content';
import { DECOR, DECOR_LIST, ENEMIES, PROPS } from '../../src/areas/adventure/logic/config/content';
import { WALK_TILES } from '../../src/areas/adventure/logic/maps';
import { openGuide } from './guide';
import { esc } from './labels';
import { editExits, editSpawns, fetchBuilder, postDraft } from './mapApi';
import { COLOUR, GROUND } from './mapCanvas';
import {
  ImageCache,
  LAYER_LABEL,
  OBJ_STYLE,
  OVERLAY_STYLE,
  centredOn,
  drawEditor,
  fitView,
  layerOf,
  markerAt,
  markerSpots,
  tileAtScreen,
  type Ghost,
  type Layers,
  type MarkerSpot,
  type Overlays,
  type View,
} from './mapEditCanvas';
import { icon } from './mapEditIcons';
import { applyField, propertyFields } from './mapEditInspector';
import * as E from './mapEditModel';
import { LEVEL_LABEL, editorIssues, objectName, type EditorIssue, type IssueLevel } from './mapIssues';
import { graphProblems } from './mapLinks';
import * as M from './mapModel';
import { openPreview, openPublish } from './mapPublishDialog';
import { openSimulation } from './mapSimulate';
import { imageOf } from './mapThumb';
import { artUrl } from './store';

type Tool = 'select' | 'move' | 'brush' | 'rect' | 'fill' | 'walk' | 'height' | 'cover' | 'erase' | 'place' | 'decor';
type PaintMode = 'brush' | 'rect' | 'fill';
type ToolButton = 'select' | 'paint' | 'place' | 'erase' | 'move' | 'walk' | 'height' | 'cover';

/** The toolbar's tools: icon, name, key, what it does. */
const TOOLS: [ToolButton, string, string, string, string][] = [
  ['select', 'pointer', 'Chọn', 'V', 'Bấm vật để chọn, kéo để dời. Kéo khoảng trống để chọn nhiều; Ctrl+bấm để thêm / bớt.'],
  ['paint', 'brush', 'Vẽ địa hình', 'B', 'Tô loại đất đang chọn ở cột trái: cọ, chữ nhật hoặc đổ loang.'],
  ['place', 'cube', 'Đặt đối tượng', 'O', 'Đặt rương, NPC, quái, suối, cổng… hoặc asset trang trí. Có thể kéo thả từ cột trái.'],
  ['erase', 'trash', 'Xoá', 'E', 'Bấm một vật để xoá (vật đã publish chỉ dời được).'],
  ['move', 'move', 'Di chuyển', 'M', 'Kéo vật để dời; kéo khoảng trống để kéo bản đồ.'],
  ['walk', 'walk', 'Vùng di chuyển', 'W', 'Bấm / kéo để đổi ô đi được ↔ bị chặn (bắt đầu ở ô đi được thì tô chặn, và ngược lại).'],
  ['height', 'mountain', 'Độ cao', 'H', 'Tô độ cao 0–9 (chỉ để vẽ nền, không đổi đường đi).'],
  ['cover', 'trees', 'Lối ẩn', 'C', 'Kéo một hình chữ nhật: lớp che (tán cây, mái đá…) giấu một lối đi.'],
];

const buttonOf = (t: Tool): ToolButton => (t === 'brush' || t === 'rect' || t === 'fill' ? 'paint' : t === 'decor' ? 'place' : t);

/** The kinds one may add, in the palette's words and pictures. */
const ADD_LABEL: Record<E.Addable, string> = { chests: 'Rương', npcs: 'NPC', groups: 'Quái vật', springs: 'Suối hồi', gates: 'Cổng nguyên tố', spawns: 'Điểm tới', nodes: 'Tài nguyên', lore: 'Bia lore', puzzles: 'Câu đố', covers: 'Lối ẩn' };
const ADD_ORDER: E.Addable[] = ['chests', 'npcs', 'groups', 'springs', 'gates', 'spawns', 'nodes', 'lore', 'puzzles', 'covers'];
const SHOWN_LAYERS: (keyof Layers)[] = ['background', 'ground', 'environment', 'objects', 'creatures', 'foreground', 'collision', 'elevation'];
const LAYER_ICON: Record<keyof Layers, string> = { background: '🖼️', ground: '🌱', environment: '🌳', objects: '🧰', creatures: '👾', foreground: '🌫️', collision: '🚧', grid: '#', elevation: '⛰️' };

interface EditorState {
  data: M.BuilderData;
  draft: M.MapDraft;
  history: E.EditHistory<AreaMap>;
  dirty: boolean;
  saving: boolean;
  savedAt: number | null;
  view: View | null;
  /** The view follows the canvas size until the admin zooms or pans. */
  autoFit: boolean;
  tool: Tool;
  paintMode: PaintMode;
  ground: string;
  height: number;
  size: number;
  place: E.Addable | null;
  /** The library asset the decoration tool places, and the palette's search. */
  decor: string | null;
  query: string;
  layers: Layers;
  locked: Partial<Record<keyof Layers, boolean>>;
  overlays: Overlays;
  rulers: boolean;
  leftTab: 'terrain' | 'objects' | 'layers';
  leftCollapsed: boolean;
  rightTab: 'issues' | 'props';
  issueFilter: IssueLevel | null;
  issues: EditorIssue[];
  /** The problem picked in the list (its key) and the marker (tile `x,y`) whose tooltip is open. */
  activeIssue: string | null;
  activeMarker: string | null;
  tip: string | null;
  selected: E.ObjRef[];
  /** A message to show once the editor is drawn again (after a dialog saved). */
  notice: string | null;
  clipboard: { kind: E.ObjKind; ref: E.ObjRef; dx: number; dy: number }[];
}

const states = new Map<string, EditorState>();
/** The listeners of the editor on a page root, removed before it is drawn again. */
const cleanups = new WeakMap<HTMLElement, () => void>();

/** Unsaved work in any area (the dashboard asks before closing). */
export const editorDirty = () => [...states.values()].some((s) => s.dirty);

/** A row to copy for a new object of a kind: from this area first, else the same zone, else anywhere. */
function templateOf(st: EditorState, kind: E.Addable): (Record<string, unknown> & { id: string; x: number; y: number }) | undefined {
  const map = st.draft.map;
  const maps = [map, ...M.workingMaps(st.data).filter((m) => m.id !== map.id && m.zoneId === map.zoneId), ...M.workingMaps(st.data).filter((m) => m.zoneId !== map.zoneId)];
  for (const m of maps) {
    const rows = (m as unknown as Record<string, (Record<string, unknown> & { id: string; x: number; y: number })[] | undefined>)[kind];
    const row = kind === 'groups' ? rows?.find((r) => r.kind === 'normal') : rows?.[0];
    if (row) return row;
  }
  return undefined;
}

/** The picture of an object, when the game has one. */
function pictureOf(map: AreaMap, ref: E.ObjRef): string | null {
  const row = (map as unknown as Record<string, Record<string, unknown>[] | undefined>)[ref.kind]?.find((r) => r.id === ref.id);
  switch (ref.kind) {
    case 'chests':
      return imageOf(`adv_map_chest_${String(row?.type ?? 'wood')}`);
    case 'nodes':
      return imageOf(`adv_node_${String(row?.kind ?? 'herb')}`);
    case 'gates':
      return imageOf(`adv_gate_${String(row?.element ?? 'nature').toLowerCase()}`);
    case 'groups': {
      const foe = (row?.pool as { enemies: string[] }[] | undefined)?.[0]?.enemies[0];
      return foe && ENEMIES[foe] ? imageOf(ENEMIES[foe].art) : null;
    }
    case 'props':
      return imageOf(PROPS[map.props[Number(ref.id)]?.prop ?? '']?.art ?? '');
    case 'scenery': {
      const d = map.scenery?.find((x) => x.id === ref.id);
      return d ? artUrl(DECOR[d.asset]?.art ?? '') : null;
    }
    default:
      return imageOf({ springs: 'adv_spring', npcs: 'adv_npc_traveler', lore: 'adv_lore_stone', portal: 'adv_portal', shrine: 'adv_shrine', puzzles: 'adv_map_puzzle_brazier' }[ref.kind as string] ?? '');
  }
}

/** The palette's picture of a kind to add. */
function addPicture(st: EditorState, kind: E.Addable): string | null {
  const row = templateOf(st, kind);
  if (kind === 'spawns' || kind === 'covers') return null;
  if (!row) return null;
  const fake = { ...st.draft.map, [kind]: [row] } as AreaMap;
  return pictureOf(fake, { kind, id: row.id });
}

const badge = (kind: E.ObjKind, big = false) => `<i class="medit__letter${big ? ' medit__letter--big' : ''}" style="--c:${OBJ_STYLE[kind][1]}">${esc(OBJ_STYLE[kind][0])}</i>`;

export function renderMapEditor(root: HTMLElement, mapId: string | null) {
  if (!mapId) return void (root.innerHTML = '<p class="empty">Chọn map ở <a href="#/adventure-world">Quản lý map</a> → Sửa.</p>');
  const st = states.get(mapId);
  if (st) return mount(root, st);
  root.innerHTML = '<p class="loading">Đang mở map…</p>';
  fetchBuilder().then(
    (data) => {
      if (!M.workingMaps(data).some((m) => m.id === mapId)) return void (root.innerHTML = `<p class="empty">Không có map ${esc(mapId)}.</p>`);
      const fresh: EditorState = {
        data,
        draft: M.draftOf(data, mapId),
        history: new E.EditHistory<AreaMap>(),
        dirty: false,
        saving: false,
        savedAt: null,
        view: null,
        autoFit: true,
        tool: 'select',
        paintMode: 'brush',
        ground: '#',
        height: 1,
        size: 1,
        place: null,
        decor: null,
        query: '',
        layers: { background: true, ground: true, environment: true, objects: true, creatures: true, foreground: true, collision: true, grid: true, elevation: false },
        locked: {},
        overlays: { walk: true, block: true, special: true, water: true },
        rulers: true,
        leftTab: 'terrain',
        leftCollapsed: false,
        rightTab: 'issues',
        issueFilter: null,
        issues: [],
        activeIssue: null,
        activeMarker: null,
        tip: null,
        selected: [],
        notice: null,
        clipboard: [],
      };
      states.set(mapId, fresh);
      mount(root, fresh);
    },
    (e: unknown) => (root.innerHTML = `<p class="empty">Không tải được map: ${esc((e as Error).message)}</p>`),
  );
}

function mount(root: HTMLElement, st: EditorState) {
  cleanups.get(root)?.();
  const map = () => st.draft.map;
  const toolBtn = ([id, ic, label, key, tip]: (typeof TOOLS)[number]) =>
    `<button class="mtool" data-tool="${id}" data-tip="${esc(`${label} (${key}) — ${tip}`)}">${icon(ic, 20)}<span>${label}</span></button>`;
  const toggle = (cmd: string, label: string, tip: string) => `<button class="mtog" data-cmd="${cmd}" data-tip="${esc(tip)}"><i class="mtog__sw"></i><span>${label}</span></button>`;
  root.innerHTML = `<div class="medit">
    <header class="medit__head">
      <div class="medit__crumbs"><span class="medit__logo">✏️</span><b>Sobi World</b><span>›</span><span>Công cụ phát triển</span><span>›</span><a href="#/adventure-world">Quản lý map</a><span>›</span><b>Cập nhật bản đồ</b></div>
      <div class="medit__headR">
        <span class="medit__save" data-savestate></span>
        <button class="mbtn" data-cmd="save" data-tip="Lưu bản nháp (Ctrl+S). Game chưa đổi cho tới khi xuất bản.">${icon('save')}<span>Lưu nháp</span></button>
        <button class="mbtn" data-cmd="simulate" data-tip="Đi thử map trong Admin bằng luật đi của game (không lưu gì).">${icon('play')}<span>Chạy thử</span></button>
        <button class="mbtn" data-cmd="preview" data-tip="Chụp map bằng renderer thật của game (lưu nháp trước).">${icon('video')}<span>Xem bằng game</span></button>
        <button class="mbtn mbtn--primary" data-cmd="publish" data-tip="Kiểm tra toàn bộ rồi xuất bản vào game.">${icon('rocket')}<span>Xuất bản</span></button>
        <button class="mbtn mbtn--icon" data-cmd="guide" data-tip="Hướng dẫn Map Editor">${icon('help')}</button>
      </div>
    </header>
    <nav class="medit__tools">
      <section class="mgrp"><h5>Quản lý bản đồ</h5><div class="mgrp__row">
        <a class="mbtn" href="#/adventure-world" data-tip="Về danh sách bản đồ (việc đang làm vẫn giữ trong Admin)">${icon('back')}<span>Quay lại</span></a>
        <span class="medit__name" data-name></span><span class="mstatus" data-mstatus></span>
      </div></section>
      <section class="mgrp"><h5>Công cụ chỉnh sửa</h5><div class="mgrp__row">
        ${TOOLS.map(toolBtn).join('')}
        <details class="mmenu" data-menu><summary class="mtool" data-tip="Thêm: lối ra, điểm xuất hiện, chép / dán">${icon('more', 20)}<span>Thêm</span></summary><div class="mmenu__pop">
          <button data-cmd="exits">${icon('door')} Lối ra…</button><button data-cmd="spawns">${icon('flag')} Điểm xuất hiện…</button>
          <button data-cmd="copy">${icon('copy')} Chép (Ctrl+C)</button><button data-cmd="paste">${icon('copy')} Dán ở ô đang trỏ (Ctrl+V)</button>
        </div></details>
        <span class="mgrp__sep"></span>
        <div class="mundo"><button class="mbtn mbtn--icon" data-cmd="undo" data-tip="Hoàn tác (Ctrl+Z)">${icon('undo', 16)}</button><button class="mbtn mbtn--icon" data-cmd="redo" data-tip="Làm lại (Ctrl+Y)">${icon('redo', 16)}</button></div>
      </div></section>
      <section class="mgrp"><h5>Hiển thị</h5><div class="mgrp__row">
        ${toggle('grid', 'Lưới', 'Bật / tắt lưới ô (G)')}${toggle('walklayer', 'Vùng đi được', 'Bật / tắt lớp màu vùng di chuyển')}${toggle('rulers', 'Toạ độ', 'Bật / tắt số ô dọc mép bản đồ')}
        <div class="mzoom"><button class="mbtn mbtn--icon" data-cmd="zoomOut" data-tip="Thu nhỏ (Ctrl+cuộn xuống)">${icon('zoomOut')}</button><span class="mzoom__pct" data-zoom></span><button class="mbtn mbtn--icon" data-cmd="zoomIn" data-tip="Phóng to (Ctrl+cuộn lên)">${icon('zoomIn')}</button></div>
        <button class="mtool mtool--sm" data-cmd="fit" data-tip="Vừa khung: cả bản đồ (F)">${icon('fit', 20)}<span>Fit Map</span></button>
        <button class="mtool mtool--sm" data-cmd="zoom100" data-tip="100%: một ô bằng một ô trong game">${icon('target', 20)}<span>100%</span></button>
      </div></section>
      <section class="mgrp"><h5>Kiểm tra & xuất bản</h5><div class="mgrp__row">
        <button class="mtool" data-cmd="validate" data-tip="Chạy lại mọi kiểm tra và tới lỗi đầu tiên">${icon('check', 20)}<span>Kiểm tra bản đồ</span></button>
        <button class="mtool" data-cmd="issues" data-tip="Mở danh sách lỗi">${icon('alert', 20)}<span>Xem lỗi</span><i class="mcount" data-count></i></button>
      </div></section>
    </nav>
    <div class="medit__body" data-body>
      <aside class="medit__left" data-left></aside>
      <div class="medit__stage" data-stage>
        <canvas data-canvas></canvas>
        <div class="mfloat">
          <button data-cmd="zoomOut" data-tip="Thu nhỏ">${icon('zoomOut')}</button><button data-cmd="zoomIn" data-tip="Phóng to">${icon('zoomIn')}</button>
          <span class="mfloat__pct" data-zoom></span>
          <button data-cmd="fit" data-tip="Vừa khung (F)">${icon('fit')}</button>
          <button data-cmd="grid" data-tip="Lưới (G)" data-flag="grid">${icon('grid')}</button>
          <button data-cmd="layersTab" data-tip="Layer">${icon('layers')}</button>
        </div>
        <div class="mlegend" data-legend></div>
        <div class="mcoord" data-coord></div>
        <div class="mtip" data-tipbox hidden></div>
        <div class="mtoast" data-toast hidden></div>
      </div>
      <aside class="medit__right" data-right></aside>
    </div>
  </div>`;
  const canvas = root.querySelector<HTMLCanvasElement>('[data-canvas]')!;
  const stage = root.querySelector<HTMLElement>('[data-stage]')!;
  const right = root.querySelector<HTMLElement>('[data-right]')!;
  const left = root.querySelector<HTMLElement>('[data-left]')!;
  const tipBox = root.querySelector<HTMLElement>('[data-tipbox]')!;
  const toastBox = root.querySelector<HTMLElement>('[data-toast]')!;
  const images = new ImageCache(() => paint());
  let W = 800;
  let H = 600;
  let dpr = 1;
  let ghost: Ghost = null;
  let hover: E.Tile | null = null;
  /** The pointer on the canvas, screen px (the marker under it). */
  let pointer: { sx: number; sy: number } | null = null;
  let shiftDown = false;
  let space = false;
  let focus: { x: number; y: number; w: number; h: number; start: number } | null = null;
  let frame = 0;
  let spots: MarkerSpot[] = [];
  let toastTimer = 0;

  const selectedKeys = () => new Set(st.selected.map(E.refKey));
  const inArea = (t: E.Tile) => t.x >= 0 && t.y >= 0 && t.x < map().cols && t.y < map().rows;
  const fitScale = () => fitView(map(), W, H).scale;
  const minScale = () => Math.max(2, fitScale() * 0.4);
  const clampScale = (s: number) => Math.min(96, Math.max(minScale(), s));
  const pct = () => `${Math.round(((st.view?.scale ?? 1) / map().tile) * 100)}%`;

  const toast = (text: string, tone: 'ok' | 'warn' | 'error' | 'info' = 'info') => {
    toastBox.className = `mtoast mtoast--${tone}`;
    toastBox.textContent = text;
    toastBox.hidden = !text;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (toastBox.hidden = true), tone === 'error' ? 8000 : 4500);
  };

  // ---- Checks -------------------------------------------------------------------------------------------------------------
  const published = () => st.data.published.find((m) => m.id === map().id);
  const computeIssues = () => {
    const m = map();
    const maps = M.workingMaps(st.data).map((x) => (x.id === m.id ? m : x));
    const graph = graphProblems({ ...st.data, drafts: { ...st.data.drafts, [m.id]: st.draft } })(m.id);
    st.issues = editorIssues({ map: m, maps, graph, published: published() ?? null, publishedIds: new Set(st.data.published.map((p) => p.id)) });
    // A picked problem that is gone (fixed) lets go of its marker and tooltip.
    if (st.activeIssue && !st.issues.some((i) => i.key === st.activeIssue)) st.activeIssue = null;
    const tiles = new Set(st.issues.filter((i) => i.x !== undefined).map((i) => `${i.x},${i.y}`));
    if (st.activeMarker && !tiles.has(st.activeMarker)) st.activeMarker = null;
    if (st.tip && !tiles.has(st.tip)) st.tip = null;
  };
  const counts = () => ({ error: st.issues.filter((i) => i.level === 'error').length, warn: st.issues.filter((i) => i.level === 'warn').length, info: st.issues.filter((i) => i.level === 'info').length });

  // ---- Layers ---------------------------------------------------------------------------------------------------------------
  /** The layer the admin is working in: the selection's, or the current tool's. */
  const activeLayer = (): keyof Layers | null => {
    if (st.selected.length) return layerOf(map(), st.selected[0]!);
    if (['brush', 'rect', 'fill', 'walk'].includes(st.tool)) return 'collision';
    if (st.tool === 'height') return 'elevation';
    if (st.tool === 'cover') return 'foreground';
    if (st.tool === 'place' && st.place) return st.place === 'groups' ? 'creatures' : st.place === 'covers' ? 'foreground' : 'objects';
    if (st.tool === 'decor' && st.decor) return layerOf(map(), { kind: 'scenery', id: '' });
    return null;
  };
  const editable = (k: keyof Layers) => {
    if (!st.locked[k]) return true;
    toast(`Layer “${LAYER_LABEL[k]}” đang khoá — mở khoá ở tab Layer để sửa.`, 'warn');
    return false;
  };
  /** The top-most object on a tile that is shown and not locked. */
  const pick = (t: E.Tile) =>
    E.objectsOf(map())
      .reverse()
      .find((o) => t.x >= o.x && t.y >= o.y && t.x < o.x + o.w && t.y < o.y + o.h && st.layers[layerOf(map(), o)] && !st.locked[layerOf(map(), o)]);

  // ---- Drawing --------------------------------------------------------------------------------------------------------------
  const hoverTiles = (): E.Tile[] => {
    if (!hover) return [];
    if (st.tool === 'brush' || st.tool === 'walk' || st.tool === 'height') return E.strokeTiles(hover, hover, st.size).filter(inArea);
    return [hover];
  };
  const dragging = () => !!drag && drag.kind !== 'pan' && drag.kind !== 'box';
  const paint = () => {
    if (!st.view) st.view = fitView(map(), W, H);
    spots = dragging() ? [] : markerSpots(st.view, st.issues);
    const f = focus && performance.now() - focus.start < 2600 ? focus : null;
    drawEditor(canvas, map(), st.view, {
      width: W,
      height: H,
      dpr,
      layers: st.layers,
      overlays: st.overlays,
      images,
      selected: selectedKeys(),
      ghost,
      hover: drag?.kind === 'pan' ? [] : hoverTiles(),
      rulers: st.rulers,
      markers: spots,
      activeMarker: st.activeMarker,
      focus: f ? { ...f, phase: ((performance.now() - f.start) % 900) / 900 } : null,
    });
    const active = buttonOf(st.tool);
    root.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((b) => b.classList.toggle('is-active', b.dataset.tool === active));
    (root.querySelector('.mgrp [data-cmd="undo"]') as HTMLButtonElement).disabled = !st.history.canUndo;
    (root.querySelector('.mgrp [data-cmd="redo"]') as HTMLButtonElement).disabled = !st.history.canRedo;
    root.querySelectorAll<HTMLElement>('[data-zoom]').forEach((z) => (z.textContent = pct()));
    root.querySelector('[data-cmd="grid"].mtog')!.classList.toggle('is-on', st.layers.grid);
    root.querySelector('[data-flag="grid"]')!.classList.toggle('is-on', st.layers.grid);
    root.querySelector('[data-cmd="walklayer"]')!.classList.toggle('is-on', st.layers.collision);
    root.querySelector('[data-cmd="rulers"]')!.classList.toggle('is-on', st.rulers);
    const save = root.querySelector<HTMLElement>('[data-savestate]')!;
    save.className = `medit__save medit__save--${st.saving ? 'busy' : st.dirty ? 'dirty' : st.savedAt ? 'ok' : 'idle'}`;
    save.innerHTML = st.saving
      ? 'Đang lưu…'
      : st.dirty
        ? '● Chưa lưu'
        : st.savedAt
          ? `${icon('check', 16)} Đã lưu lúc ${new Date(st.savedAt).toLocaleTimeString('vi-VN')}`
          : 'Không có thay đổi';
    const status = M.statusOf(st.data, map().id);
    root.querySelector('[data-name]')!.textContent = map().nameVi;
    const ms = root.querySelector<HTMLElement>('[data-mstatus]')!;
    ms.className = `mstatus mstatus--${status === 'draft' ? 'new' : status === 'disabled' ? 'warn' : status === 'changed' ? 'changed' : 'ok'}`;
    ms.textContent = status === 'published' ? '✓ Đã xuất bản' : status === 'changed' ? '✓ Xuất bản · có nháp' : status === 'draft' ? 'Bản nháp' : M.STATUS_LABEL[status];
    ms.dataset.tip = status === 'changed' ? 'Bản đồ đã ở trong game; bản nháp có thay đổi chưa xuất bản.' : status === 'draft' ? 'Chưa có trong game.' : status === 'published' ? 'Bản trong game trùng bản đang sửa.' : 'Đang tạm tắt: không xuất bản.';
    const c = counts();
    const cnt = root.querySelector<HTMLElement>('[data-count]')!;
    cnt.textContent = String(c.error + c.warn);
    cnt.className = `mcount${c.error ? ' mcount--error' : c.warn ? ' mcount--warn' : ' mcount--ok'}`;
    const ground = hover ? GROUND.find(([ch]) => ch === map().terrain[hover!.y]?.[hover!.x])?.[1] : '';
    root.querySelector('[data-coord]')!.innerHTML = hover ? `<b>X: ${hover.x}, Y: ${hover.y}</b>${ground ? ` · ${esc(ground)}` : ''}` : `${map().cols} × ${map().rows} ô`;
    canvas.style.cursor = cursor();
    placeTip();
  };
  const legend = () => {
    const box = root.querySelector<HTMLElement>('[data-legend]')!;
    box.classList.toggle('is-off', !st.layers.collision);
    box.innerHTML = `<b>Vùng di chuyển${st.layers.collision ? '' : ' (đang tắt)'}</b>${(Object.keys(OVERLAY_STYLE) as (keyof Overlays)[])
      .map((k) => `<button data-overlay="${k}" class="${st.overlays[k] ? 'is-on' : ''}" data-tip="Bấm để bật / tắt riêng loại ô này"><i style="background:${OVERLAY_STYLE[k].fill}"></i>${OVERLAY_STYLE[k].label}</button>`)
      .join('')}`;
    box.querySelectorAll<HTMLButtonElement>('[data-overlay]').forEach((b) =>
      b.addEventListener('click', () => {
        const k = b.dataset.overlay as keyof Overlays;
        if (!st.layers.collision) st.layers.collision = true;
        else st.overlays[k] = !st.overlays[k];
        legend();
        paint();
      }),
    );
  };

  // ---- Camera ----------------------------------------------------------------------------------------------------------------
  const zoomAt = (scale: number, sx: number, sy: number) => {
    const v = st.view!;
    const s = clampScale(scale);
    const wx = sx / v.scale + v.ox;
    const wy = sy / v.scale + v.oy;
    st.view = { scale: s, ox: wx - sx / s, oy: wy - sy / s };
    st.autoFit = false;
  };
  const animateTo = (target: View) => {
    st.autoFit = false;
    // No frames while the window is hidden: go there at once.
    if (document.hidden) return void ((st.view = target), paint());
    const from = { ...st.view! };
    const t0 = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 380);
      const e = 1 - (1 - k) ** 3;
      // The middle of the screen travels straight while the zoom changes evenly.
      const scale = Math.exp(Math.log(from.scale) + (Math.log(target.scale) - Math.log(from.scale)) * e);
      const cx = from.ox + W / from.scale / 2 + (target.ox + W / target.scale / 2 - (from.ox + W / from.scale / 2)) * e;
      const cy = from.oy + H / from.scale / 2 + (target.oy + H / target.scale / 2 - (from.oy + H / from.scale / 2)) * e;
      st.view = centredOn(scale, cx, cy, W, H);
      paint();
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const pulse = () => {
    cancelAnimationFrame(frame);
    const loop = () => {
      paint();
      if (focus && performance.now() - focus.start < 2600) frame = requestAnimationFrame(loop);
      else {
        focus = null;
        paint();
      }
    };
    frame = requestAnimationFrame(loop);
  };

  // ---- Problems on the map ----------------------------------------------------------------------------------------------------
  const placeTip = () => {
    const spot = st.tip ? spots.find((s) => s.key === st.tip) : undefined;
    if (!spot || !st.view) return void (tipBox.hidden = true);
    const x = spot.cx - st.view.scale / 2;
    const top = spot.cy - 8;
    const below = top < 120;
    tipBox.hidden = false;
    tipBox.style.left = `${Math.max(150, Math.min(W - 150, x))}px`;
    tipBox.style.top = `${below ? spot.cy + st.view.scale + 10 : top}px`;
    tipBox.classList.toggle('is-below', below);
    const list = spot.issues;
    const html = `${list
      .slice(0, 3)
      .map((i) => `<div class="mtip__row mtip__row--${i.level}">${icon(i.level === 'error' ? 'error' : i.level === 'warn' ? 'alert' : 'info', 18)}<div><b>${esc(LEVEL_LABEL[i.level])}</b><p>${esc(i.message)}</p></div></div>`)
      .join('')}${list.length > 3 ? `<small>và ${list.length - 3} vấn đề khác ở ô này</small>` : ''}<small class="mtip__at">X: ${spot.x}, Y: ${spot.y}</small><button class="mtip__x" data-tipclose>${icon('close', 14)}</button>`;
    if (tipBox.dataset.html !== html) {
      tipBox.innerHTML = html;
      tipBox.dataset.html = html;
      tipBox.querySelector('[data-tipclose]')!.addEventListener('click', () => ((st.tip = null), paint()));
    }
  };
  /** Goes to a problem: the camera onto its tile, the tile and its object lit, the object's inspector, the tooltip. */
  const goTo = (i: EditorIssue) => {
    st.activeIssue = i.key;
    st.rightTab = 'issues';
    if (i.ref && E.findObject(map(), i.ref)) st.selected = [i.ref];
    if (i.x === undefined || i.y === undefined) {
      toast(`${i.name}: ${i.message}`, i.level === 'error' ? 'error' : 'info');
      side();
      return paint();
    }
    st.activeMarker = `${i.x},${i.y}`;
    st.tip = st.activeMarker;
    const scale = clampScale(Math.max(st.view!.scale, fitScale() * 2.4, 30));
    animateTo(centredOn(Math.min(scale, 64), i.x + 0.5, i.y + 0.5, W, H));
    focus = { x: i.x, y: i.y, w: 1, h: 1, start: performance.now() };
    pulse();
    side();
    paint();
  };
  const openSpot = (spot: MarkerSpot) => {
    st.activeMarker = spot.key;
    st.tip = spot.key;
    st.activeIssue = spot.issues[0]!.key;
    st.rightTab = 'issues';
    st.issueFilter = null;
    const ref = spot.issues.find((i) => i.ref)?.ref;
    if (ref && E.findObject(map(), ref)) st.selected = [ref];
    side();
    right.querySelector(`[data-issue="${CSS.escape(st.activeIssue)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    paint();
  };

  // ---- Right: object card, checks, properties -----------------------------------------------------------------------------------
  const change = (fn: () => void, keepSide = false) => {
    st.history.record(map());
    fn();
    st.dirty = true;
    if (!keepSide) side();
    paint();
  };
  const issueRow = (i: EditorIssue) => `<article class="missue missue--${i.level}${i.key === st.activeIssue ? ' is-active' : ''}" data-issue="${esc(i.key)}">
      <span class="missue__ico">${icon(i.level === 'error' ? 'error' : i.level === 'warn' ? 'alert' : 'info', 20)}</span>
      <div class="missue__body"><b>${esc(LEVEL_LABEL[i.level])}</b><p>${esc(i.message)}</p><small>${i.x !== undefined ? `Vị trí: X: ${i.x}, Y: ${i.y}` : 'Cả bản đồ'}</small></div>
      <button class="mbtn mbtn--go" data-goto="${esc(i.key)}"${i.x === undefined && !i.ref ? ' disabled' : ''}>Đi tới</button>
    </article>`;
  const objectCard = (): string => {
    const m = map();
    const sel = st.selected;
    if (sel.length > 1) {
      const names = sel.slice(0, 6).map((r) => `<li>${esc(objectName(m, r, mapName))}</li>`).join('');
      return `<header class="mcard__head"><h4>${sel.length} đối tượng đang chọn</h4><button class="mbtn mbtn--icon" data-cmd="deselect" data-tip="Bỏ chọn (Esc)">${icon('close', 16)}</button></header>
        <ul class="medit__names">${names}${sel.length > 6 ? `<li>… và ${sel.length - 6} vật khác</li>` : ''}</ul>
        <p class="muted">Kéo hoặc dùng phím mũi tên để dời cả nhóm.</p>
        <div class="mobj__acts"><button class="mbtn" data-cmd="duplicate">${icon('copy', 16)} Nhân bản</button><button class="mbtn mbtn--danger" data-cmd="delete">${icon('trash', 16)} Xoá</button></div>`;
    }
    if (sel.length === 1) {
      const ref = sel[0]!;
      const o = E.findObject(m, ref);
      if (!o) return '';
      const pic = pictureOf(m, ref);
      const layer = layerOf(m, ref);
      return `<header class="mcard__head"><h4>Thông tin đối tượng</h4><button class="mbtn mbtn--icon" data-cmd="deselect" data-tip="Bỏ chọn (Esc)">${icon('close', 16)}</button></header>
        <div class="mobj"><div class="mobj__pic">${pic ? `<img src="${pic}" alt="" />` : badge(ref.kind, true)}</div><div><b>${esc(objectName(m, ref, mapName))}</b><small>${esc(E.OBJ_LABEL[ref.kind])}</small></div></div>
        <div class="mfield"><span>Toạ độ X, Y</span><div><input type="number" data-box="x" value="${o.x}" /><input type="number" data-box="y" value="${o.y}" /></div></div>
        <div class="mfield"><span>Kích thước</span><div>${o.sizable ? `<input type="number" min="1" data-box="w" value="${o.w}" /><input type="number" min="1" data-box="h" value="${o.h}" />` : `<span class="mval">${o.w} × ${o.h}</span>`}</div></div>
        <div class="mfield"><span>Layer</span><div><span class="mval">${LAYER_ICON[layer]} ${esc(LAYER_LABEL[layer])}${st.locked[layer] ? ` ${icon('lock', 14)}` : ''}</span></div></div>
        <div class="mobj__acts"><button class="mbtn" data-cmd="duplicate" data-tip="Nhân bản (Ctrl+D)">${icon('copy', 16)} Nhân bản</button><button class="mbtn mbtn--danger" data-cmd="delete" data-tip="Xoá (Del)">${icon('trash', 16)} Xoá</button><button class="mbtn" data-rtab="props" data-tip="Các thuộc tính riêng của vật">${icon('sliders', 16)} Sửa thuộc tính</button></div>`;
    }
    const n = (k: keyof AreaMap) => ((m[k] as unknown[] | undefined) ?? []).length;
    return `<header class="mcard__head"><h4>Thông tin bản đồ</h4></header>
      <div class="mobj"><div class="mobj__pic">🗺️</div><div><b>${esc(m.nameVi)}</b><small>${m.cols} × ${m.rows} ô · ${m.scene ? 'nền vẽ liền' : 'vẽ bằng ô'}</small></div></div>
      <div class="mstats"><span>${n('chests')} rương</span><span>${n('groups')} nhóm quái</span><span>${n('exits')} lối ra</span><span>${n('springs')} suối</span><span>${n('nodes')} tài nguyên</span><span>${n('scenery')} asset</span></div>
      <p class="muted">Bấm một vật trên map để xem và sửa. Kéo khoảng trống để chọn nhiều.</p>`;
  };
  const mapName = (id: string) => M.workingMaps(st.data).find((m) => m.id === id)?.nameVi ?? 'map không tồn tại';
  const side = () => {
    computeIssues();
    const m = map();
    const c = counts();
    const shown = st.issues.filter((i) => !st.issueFilter || i.level === st.issueFilter);
    const chip = (lv: IssueLevel | null, label: string, n: number) => `<button class="mchip${lv ? ` mchip--${lv}` : ''}${st.issueFilter === lv ? ' is-on' : ''}" data-filter="${lv ?? ''}">${label} <b>${n}</b></button>`;
    const props =
      st.selected.length === 1
        ? propertyFields(m, st.selected[0]!) || '<p class="muted">Vật này không có thuộc tính riêng.</p>'
        : `<div class="mfield"><span>Mã bản đồ</span><div><code>${esc(m.id)}</code></div></div><div class="mfield"><span>Kích thước</span><div><span class="mval">${m.cols} × ${m.rows} ô · ô ${m.tile} px</span></div></div>
           <div class="mfield"><span>Nền</span><div><span class="mval">${m.scene ? esc(m.scene.art) : 'vẽ bằng ô'}</span></div></div><p class="muted">Tên, mô tả, vùng: đổi ở Quản lý map.</p>`;
    right.innerHTML = `<section class="mcard">${objectCard()}</section>
      <section class="mcard mcard--grow">
        <div class="mtabs"><button data-rtab="issues" class="${st.rightTab === 'issues' ? 'is-on' : ''}">Kiểm tra lỗi (${c.error + c.warn + c.info})</button><button data-rtab="props" class="${st.rightTab === 'props' ? 'is-on' : ''}">Thuộc tính</button></div>
        ${st.rightTab === 'issues'
          ? `<div class="mchips">${chip(null, 'Tất cả', st.issues.length)}${chip('error', 'Lỗi', c.error)}${chip('warn', 'Cảnh báo', c.warn)}${chip('info', 'Thông tin', c.info)}</div>
             <div class="missues">${shown.length ? shown.map(issueRow).join('') : `<p class="mok">${icon('check', 18)} ${st.issues.length ? 'Không có mục nào ở loại này.' : 'Bản đồ qua mọi kiểm tra.'}</p>`}</div>`
          : `<div class="mprops">${props}</div>`}
      </section>
      <section class="mcard mtips"><h4>💡 Mẹo sử dụng</h4><ul>
        <li><kbd>Shift</kbd> + kéo chuột: di chuyển bản đồ</li><li><kbd>Ctrl</kbd> + cuộn chuột: phóng to / thu nhỏ tại con trỏ</li>
        <li><kbd>F</kbd>: vừa khung · <kbd>G</kbd>: lưới · <kbd>Esc</kbd>: bỏ chọn</li><li><kbd>Ctrl</kbd> + bấm: chọn thêm · <kbd>Del</kbd>: xoá</li></ul></section>`;
    right.querySelectorAll<HTMLInputElement & HTMLSelectElement>('[data-insp]').forEach((el) =>
      el.addEventListener('change', () => {
        const ref = st.selected[0]!;
        if (editable(layerOf(map(), ref))) change(() => applyField(map(), ref, el.dataset.insp!, el.value, (el as HTMLInputElement).checked));
      }),
    );
    right.querySelectorAll<HTMLInputElement>('[data-box]').forEach((el) =>
      el.addEventListener('change', () => {
        const ref = st.selected[0]!;
        const o = E.findObject(map(), ref);
        if (o && editable(layerOf(map(), ref))) change(() => E.setBox(map(), ref, { x: o.x, y: o.y, w: o.w, h: o.h, [el.dataset.box!]: Number(el.value) || 0 }));
      }),
    );
    right.querySelectorAll<HTMLButtonElement>('[data-cmd]').forEach((b) => b.addEventListener('click', () => void command(b.dataset.cmd!)));
    right.querySelectorAll<HTMLButtonElement>('[data-rtab]').forEach((b) => b.addEventListener('click', () => ((st.rightTab = b.dataset.rtab as EditorState['rightTab']), side())));
    right.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((b) => b.addEventListener('click', () => ((st.issueFilter = (b.dataset.filter || null) as IssueLevel | null), side())));
    right.querySelectorAll<HTMLElement>('[data-issue]').forEach((el) =>
      el.addEventListener('click', () => {
        const i = st.issues.find((x) => x.key === el.dataset.issue);
        if (i) goTo(i);
      }),
    );
    right.querySelector('[data-open="exits"]')?.addEventListener('click', () => void command('exits'));
  };

  // ---- Left: ground, objects, layers --------------------------------------------------------------------------------------------
  const palette = () => {
    const body = root.querySelector<HTMLElement>('[data-body]')!;
    body.classList.toggle('is-left-collapsed', st.leftCollapsed);
    const tabs: [EditorState['leftTab'], string, string][] = [['terrain', 'mountain', 'Địa hình'], ['objects', 'cube', 'Đối tượng'], ['layers', 'layers', 'Layer']];
    if (st.leftCollapsed) {
      left.innerHTML = `<div class="mrail"><button data-collapse data-tip="Mở rộng cột trái">${icon('chevronRight')}</button>${tabs.map(([id, ic, label]) => `<button data-ltab="${id}" data-tip="${label}">${icon(ic)}</button>`).join('')}</div>`;
    } else {
      const q = st.query.trim().toLowerCase();
      const match = (text: string) => !q || text.toLowerCase().includes(q);
      const tile = ([c, n]: (typeof GROUND)[number]) =>
        `<button class="mtile${st.ground === c && ['brush', 'rect', 'fill'].includes(st.tool) ? ' is-active' : ''}" data-ground="${esc(c)}" data-tip="${esc(n)} — ${WALK_TILES.has(c) ? 'đi được' : 'chặn đường'}"><i class="mtile__sw" style="--c:${COLOUR[c]}"></i><span>${esc(n)}</span><em class="${WALK_TILES.has(c) ? 'is-walk' : 'is-block'}"></em></button>`;
      const seg = (attr: string, items: [string, string][], cur: string) => `<div class="mseg">${items.map(([v, label]) => `<button data-${attr}="${v}" class="${v === cur ? 'is-on' : ''}">${label}</button>`).join('')}</div>`;
      const terrain = `
        <h6>Cách tô</h6>${seg('mode', [['brush', `${icon('brush', 16)} Cọ`], ['rect', `${icon('rect', 16)} Chữ nhật`], ['fill', `${icon('bucket', 16)} Đổ loang`]], st.paintMode)}
        <h6>Cỡ cọ (cọ, vùng di chuyển, độ cao)</h6>${seg('size', [['1', '1×1'], ['2', '2×2'], ['3', '3×3'], ['5', '5×5']], String(st.size))}
        <h6>Đi được</h6><div class="mtiles">${GROUND.filter(([c]) => WALK_TILES.has(c)).map(tile).join('')}</div>
        <h6>Chặn đường</h6><div class="mtiles">${GROUND.filter(([c]) => !WALK_TILES.has(c)).map(tile).join('')}</div>
        <h6>Độ cao (chỉ để vẽ)</h6>${map().scene ? `<div class="mheights">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((h) => `<button data-height="${h}" class="${st.tool === 'height' && st.height === h ? 'is-on' : ''}">${h}</button>`).join('')}</div>` : '<p class="muted">Map vẽ bằng ô không có độ cao.</p>'}
        <p class="mnote">Công cụ <b>Vùng di chuyển</b> (W) đổi nhanh ô đi được ↔ bị chặn mà không cần chọn loại đất.</p>`;
      const addCard = (k: E.Addable) => {
        const pic = addPicture(st, k);
        return `<button class="mtile mtile--obj${st.tool === 'place' && st.place === k ? ' is-active' : ''}" data-place="${k}" draggable="true" data-drag="place:${k}" data-tip="${esc(`${E.OBJ_LABEL[k]} — bấm rồi bấm lên map, hoặc kéo thả vào map`)}">${pic ? `<img src="${pic}" alt="" />` : badge(k, true)}<span>${esc(ADD_LABEL[k])}</span></button>`;
      };
      const decor = DECOR_LIST.filter((d) => match(`${d.nameVi} ${d.category}`));
      const objects = `
        <label class="msearch">${icon('search', 16)}<input type="search" data-q placeholder="Tìm đối tượng, asset…" value="${esc(st.query)}" /></label>
        <h6>Đối tượng game</h6><div class="mtiles mtiles--obj">${ADD_ORDER.filter((k) => match(`${ADD_LABEL[k]} ${E.OBJ_LABEL[k]}`)).map(addCard).join('') || '<p class="muted">Không có.</p>'}</div>
        <h6>Asset trang trí <a href="#/adventure-assets">thư viện ›</a></h6>
        <div class="mtiles mtiles--decor">${decor.map((d) => `<button class="mtile mtile--obj${st.tool === 'decor' && st.decor === d.id ? ' is-active' : ''}" data-decor="${d.id}" draggable="true" data-drag="decor:${d.id}" data-tip="${esc(d.nameVi)} — bấm rồi bấm lên map, hoặc kéo thả">${artUrl(d.art) ? `<img src="${artUrl(d.art)}" alt="" />` : ''}<span>${esc(d.nameVi)}</span></button>`).join('') || '<p class="muted">Không có asset nào khớp.</p>'}</div>
        <p class="mnote">Mỗi đối tượng mới sao chép một cái cùng loại có sẵn (bảng thưởng, nhóm quái… giữ nguyên), mã mới.</p>`;
      const act = activeLayer();
      const count = (k: keyof Layers) => E.objectsOf(map()).filter((o) => layerOf(map(), o) === k).length;
      const layers = `<div class="mlayers">${SHOWN_LAYERS.map((k) => `<div class="mlayer${act === k ? ' is-active' : ''}${st.layers[k] ? '' : ' is-hidden'}">
          <button data-eye="${k}" data-tip="${st.layers[k] ? 'Ẩn' : 'Hiện'} layer">${icon(st.layers[k] ? 'eye' : 'eyeOff', 16)}</button>
          <span>${LAYER_ICON[k]} ${esc(LAYER_LABEL[k])}</span><small>${['collision', 'background', 'elevation'].includes(k) ? '' : count(k)}</small>
          <button data-lock="${k}" class="${st.locked[k] ? 'is-locked' : ''}" data-tip="${st.locked[k] ? 'Mở khoá' : 'Khoá để tránh sửa nhầm'}">${icon(st.locked[k] ? 'lock' : 'unlock', 16)}</button></div>`).join('')}</div>
        <p class="mnote">Layer sáng màu là layer đang thao tác. Layer khoá vẫn hiện nhưng không chọn, dời, xoá hay tô được.</p>`;
      left.innerHTML = `<div class="mltabs">${tabs.map(([id, ic, label]) => `<button data-ltab="${id}" class="${st.leftTab === id ? 'is-on' : ''}">${icon(ic, 16)} ${label}</button>`).join('')}<button class="mltabs__fold" data-collapse data-tip="Thu gọn cột trái">${icon('chevronLeft', 16)}</button></div>
        <div class="mlbody">${st.leftTab === 'terrain' ? terrain : st.leftTab === 'objects' ? objects : layers}</div>`;
    }
    left.querySelectorAll<HTMLButtonElement>('[data-ltab]').forEach((b) => b.addEventListener('click', () => ((st.leftTab = b.dataset.ltab as EditorState['leftTab']), (st.leftCollapsed = false), palette())));
    left.querySelector('[data-collapse]')?.addEventListener('click', () => ((st.leftCollapsed = !st.leftCollapsed), palette()));
    left.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((b) => b.addEventListener('click', () => ((st.paintMode = b.dataset.mode as PaintMode), setTool(st.paintMode))));
    left.querySelectorAll<HTMLButtonElement>('[data-size]').forEach((b) => b.addEventListener('click', () => ((st.size = Number(b.dataset.size)), palette(), paint())));
    left.querySelectorAll<HTMLButtonElement>('[data-ground]').forEach((b) => b.addEventListener('click', () => ((st.ground = b.dataset.ground!), setTool(st.paintMode))));
    left.querySelectorAll<HTMLButtonElement>('[data-height]').forEach((b) => b.addEventListener('click', () => ((st.height = Number(b.dataset.height)), setTool('height'))));
    left.querySelectorAll<HTMLButtonElement>('[data-place]').forEach((b) => b.addEventListener('click', () => choosePlace(b.dataset.place as E.Addable)));
    left.querySelectorAll<HTMLButtonElement>('[data-decor]').forEach((b) => b.addEventListener('click', () => chooseDecor(b.dataset.decor!)));
    left.querySelectorAll<HTMLElement>('[data-drag]').forEach((el) =>
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer?.setData('text/x-medit', el.dataset.drag!);
        if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
      }),
    );
    left.querySelectorAll<HTMLButtonElement>('[data-eye]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.eye as keyof Layers;
      st.layers[k] = !st.layers[k];
      palette();
      legend();
      paint();
    }));
    left.querySelectorAll<HTMLButtonElement>('[data-lock]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.lock as keyof Layers;
      st.locked[k] = !st.locked[k];
      st.selected = st.selected.filter((r) => !st.locked[layerOf(map(), r)]);
      palette();
      side();
      paint();
    }));
    const q = left.querySelector<HTMLInputElement>('[data-q]');
    q?.addEventListener('input', () => {
      st.query = q.value;
      palette();
      const again = left.querySelector<HTMLInputElement>('[data-q]')!;
      again.focus();
      again.setSelectionRange(again.value.length, again.value.length);
    });
  };
  const setTool = (t: Tool) => {
    st.tool = t;
    if (t === 'walk') st.layers.collision = true;
    if (t === 'height') st.layers.elevation = true;
    if (t === 'brush' || t === 'rect' || t === 'fill') st.paintMode = t;
    palette();
    legend();
    paint();
  };
  const choosePlace = (k: E.Addable) => {
    st.place = k;
    st.tool = 'place';
    if (!templateOf(st, k)) toast(`Chưa có ${E.OBJ_LABEL[k].toLowerCase()} nào trong game để sao chép.`, 'warn');
    else toast(`Bấm lên map để đặt ${ADD_LABEL[k].toLowerCase()} (hoặc kéo thả từ cột trái).`);
    palette();
    paint();
  };
  const chooseDecor = (id: string) => {
    st.decor = id;
    st.tool = 'decor';
    toast(`Bấm lên map để đặt ${DECOR[id]?.nameVi ?? 'asset'} (chân asset ở chỗ bấm).`);
    palette();
    paint();
  };

  // ---- Commands ---------------------------------------------------------------------------------------------------------------
  const taken = () => new Set([...M.thingIds(M.workingMaps(st.data)), ...M.thingIds([map()])]);
  const landedOn = () => new Set(M.arrivalsInto(M.workingMaps(st.data), map().id).map((a) => a.exit.arrive).filter((x): x is string => !!x));

  async function command(cmd: string) {
    const m = map();
    const menu = root.querySelector<HTMLDetailsElement>('[data-menu]');
    if (menu) menu.open = false;
    if (cmd === 'undo' || cmd === 'redo') {
      const back = cmd === 'undo' ? st.history.undo(m) : st.history.redo(m);
      if (back) {
        st.draft.map = back;
        st.selected = st.selected.filter((r) => E.findObject(back, r));
        st.dirty = true;
      }
    } else if (cmd === 'fit') {
      st.view = fitView(map(), W, H);
      st.autoFit = true;
    } else if (cmd === 'zoomIn' || cmd === 'zoomOut') zoomAt(st.view!.scale * (cmd === 'zoomIn' ? 1.25 : 0.8), W / 2, H / 2);
    else if (cmd === 'zoom100') zoomAt(m.tile, W / 2, H / 2);
    else if (cmd === 'grid') st.layers.grid = !st.layers.grid;
    else if (cmd === 'walklayer') {
      st.layers.collision = !st.layers.collision;
      legend();
      palette();
    } else if (cmd === 'rulers') st.rulers = !st.rulers;
    else if (cmd === 'layersTab') {
      st.leftTab = 'layers';
      st.leftCollapsed = false;
      palette();
    } else if (cmd === 'guide') return openGuide('map-editor');
    else if (cmd === 'deselect') st.selected = [];
    else if (cmd === 'validate' || cmd === 'issues') {
      computeIssues();
      st.rightTab = 'issues';
      const c = counts();
      if (cmd === 'validate') {
        st.issueFilter = null;
        toast(c.error ? `Còn ${c.error} lỗi nghiêm trọng, ${c.warn} cảnh báo — chưa xuất bản được.` : c.warn ? `Không có lỗi nghiêm trọng; ${c.warn} cảnh báo cần xem.` : 'Bản đồ qua mọi kiểm tra.', c.error ? 'error' : c.warn ? 'warn' : 'ok');
        const first = st.issues.find((i) => i.level !== 'info' && i.x !== undefined);
        if (first) return goTo(first);
      }
    } else if (cmd === 'delete' && st.selected.length) {
      const refs = st.selected.filter((r) => editable(layerOf(m, r)));
      const before = structuredClone(m);
      const why = E.removeObjects(m, refs, published(), landedOn());
      if (JSON.stringify(before) !== JSON.stringify(m)) {
        st.history.record(before);
        st.dirty = true;
      }
      if (why.length) toast(why.join(' · '), 'warn');
      // What stayed (kept for good) stays selected; props are counted again after a removal.
      st.selected = st.selected.filter((r) => r.kind !== 'props' && E.findObject(m, r));
    } else if (cmd === 'duplicate' || cmd === 'paste') {
      const items = cmd === 'paste' ? st.clipboard : st.selected.map((ref) => ({ kind: ref.kind, ref, dx: 0, dy: 0 }));
      if (!items.length) return;
      const anchor = cmd === 'paste' ? (hover ?? { x: 1, y: 1 }) : null;
      st.history.record(m);
      const ids = taken();
      const made: E.ObjRef[] = [];
      for (const it of items) {
        const o = E.findObject(m, it.ref);
        const at = anchor ? { x: anchor.x + it.dx, y: anchor.y + it.dy } : o ? { x: o.x + 1, y: o.y + 1 } : null;
        const r = at && E.duplicateObject(m, it.ref, at, ids);
        if (r) made.push(r);
      }
      if (made.length) {
        st.selected = made;
        st.dirty = true;
      } else toast('Không nhân bản được (điểm mặc định, cổng dịch chuyển, đền, lối ra: mỗi thứ một / có hộp riêng).', 'warn');
    } else if (cmd === 'copy') {
      const objs = st.selected.map((r) => E.findObject(m, r)).filter((o): o is E.EditObj => !!o);
      if (!objs.length) return toast('Chọn vật trước khi chép.', 'warn');
      const x0 = Math.min(...objs.map((o) => o.x));
      const y0 = Math.min(...objs.map((o) => o.y));
      st.clipboard = objs.map((o) => ({ kind: o.kind, ref: { kind: o.kind, id: o.id }, dx: o.x - x0, dy: o.y - y0 }));
      toast(`Đã chép ${objs.length} vật: Ctrl+V để dán ở ô đang trỏ.`, 'ok');
    } else if (cmd === 'save') {
      st.saving = true;
      paint();
      try {
        await postDraft(st.draft);
        st.data = await fetchBuilder();
        st.dirty = false;
        st.savedAt = Date.now();
        toast('Đã lưu bản nháp (game chưa đổi cho tới khi xuất bản).', 'ok');
      } catch (e) {
        toast(`Lưu không được: ${(e as Error).message}`, 'error');
      } finally {
        st.saving = false;
      }
    } else if (cmd === 'preview') {
      if (st.dirty) await command('save');
      if (!st.dirty) openPreview(st.data.drafts[m.id] ? [m.id] : [], m.id);
      return;
    } else if (cmd === 'simulate') {
      openSimulation(st.data, m.id, structuredClone(m));
      return;
    } else if (cmd === 'publish') {
      if (st.dirty) await command('save');
      if (!st.dirty) openPublish(st.data, [m.id]);
      return;
    } else if (cmd === 'exits' || cmd === 'spawns') {
      // The dialogs work on saved drafts: save first, then take back what they saved.
      if (st.dirty) await command('save');
      const reopen = async (msg: string) => {
        st.data = await fetchBuilder();
        st.history.record(map());
        st.draft = M.draftOf(st.data, m.id);
        st.notice = msg;
        mount(root, st);
      };
      if (cmd === 'exits') editExits(st.data, m.id, reopen);
      else editSpawns(st.data, M.draftOf(st.data, m.id), reopen);
      return;
    }
    side();
    paint();
  }

  // ---- Mouse --------------------------------------------------------------------------------------------------------------
  let drag:
    | { kind: 'pan'; sx: number; sy: number; ox: number; oy: number }
    | { kind: 'move'; from: E.Tile; last: E.Tile; recorded: boolean }
    | { kind: 'resize'; ref: E.ObjRef; recorded: boolean }
    | { kind: 'paint'; last: E.Tile; char?: string }
    | { kind: 'shape'; a: E.Tile }
    | { kind: 'box'; a: E.Tile; add: boolean }
    | null = null;
  const screenOf = (e: { clientX: number; clientY: number }) => {
    const r = canvas.getBoundingClientRect();
    return { sx: e.clientX - r.left, sy: e.clientY - r.top };
  };
  const tileOf = (e: { clientX: number; clientY: number }) => {
    const { sx, sy } = screenOf(e);
    return tileAtScreen(st.view!, sx, sy);
  };
  /** The point under the pointer in tiles, with fractions (a decoration's foot). */
  const pointOf = (e: { clientX: number; clientY: number }) => {
    const { sx, sy } = screenOf(e);
    return { x: sx / st.view!.scale + st.view!.ox, y: sy / st.view!.scale + st.view!.oy };
  };
  const cursor = (): string => {
    if (drag?.kind === 'pan') return 'grabbing';
    if (shiftDown || space) return 'grab';
    if (pointer && markerAt(spots, pointer.sx, pointer.sy)) return 'pointer';
    const over = hover ? pick(hover) : undefined;
    if (st.tool === 'select') return over ? 'pointer' : 'default';
    if (st.tool === 'move') return over ? 'move' : 'grab';
    if (st.tool === 'erase') return over ? 'pointer' : 'not-allowed';
    if (st.tool === 'place' || st.tool === 'decor') return 'copy';
    return 'crosshair';
  };

  const placeObject = (k: E.Addable, t: E.Tile) => {
    const layer = k === 'groups' ? 'creatures' : k === 'covers' ? 'foreground' : 'objects';
    if (!inArea(t) || !editable(layer)) return;
    const row = templateOf(st, k);
    if (!row) return toast(`Chưa có ${E.OBJ_LABEL[k].toLowerCase()} nào để sao chép.`, 'warn');
    let made: E.ObjRef | null = null;
    change(() => (made = E.addRow(map(), k, row, t, taken())));
    st.selected = made ? [made] : [];
    if (!made) toast('Không đặt được (câu đố cần một cổng nguyên tố trong map).', 'warn');
    side();
    paint();
  };
  const placeDecor = (id: string, at: { x: number; y: number }) => {
    if (!inArea({ x: Math.floor(at.x), y: Math.floor(at.y) }) || !editable(layerOf(map(), { kind: 'scenery', id: '' }))) return;
    let made: E.ObjRef | null = null;
    change(() => (made = E.addDecor(map(), id, at, taken())));
    st.selected = made ? [made] : [];
    side();
    paint();
  };
  const applyStroke = (a: E.Tile, b: E.Tile, char?: string) => {
    const tiles = E.strokeTiles(a, b, st.size);
    if (st.tool === 'height') E.paintElevation(map(), tiles, st.height);
    else E.paintTerrain(map(), tiles, char ?? st.ground);
    paint();
  };

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    shiftDown = e.shiftKey;
    const t = tileOf(e);
    const ctrl = e.ctrlKey || e.metaKey;
    // Pan: Shift + left drag (or right / middle drag, or Space held) — it never edits.
    if (e.button === 1 || e.button === 2 || space || (e.button === 0 && e.shiftKey)) {
      drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: st.view!.ox, oy: st.view!.oy };
      st.autoFit = false;
      return paint();
    }
    if (e.button !== 0) return;
    // A problem marker: its details, whatever the tool.
    const { sx, sy } = screenOf(e);
    const spot = !ctrl ? markerAt(spots, sx, sy) : undefined;
    if (spot) return openSpot(spot);
    if (st.tip) st.tip = null;
    const m = map();
    if (st.tool === 'select' || st.tool === 'move') {
      const one = st.selected.length === 1 ? E.findObject(m, st.selected[0]!) : undefined;
      if (one?.sizable && t.x === one.x + one.w - 1 && t.y === one.y + one.h - 1 && (one.w > 1 || one.h > 1 || e.altKey) && !st.locked[layerOf(m, one)]) {
        drag = { kind: 'resize', ref: one, recorded: false };
        return;
      }
      const hit = pick(t);
      if (hit) {
        const k = E.refKey(hit);
        if (ctrl) st.selected = selectedKeys().has(k) ? st.selected.filter((r) => E.refKey(r) !== k) : [...st.selected, hit];
        else if (!selectedKeys().has(k)) st.selected = [hit];
        drag = { kind: 'move', from: t, last: t, recorded: false };
      } else if (st.tool === 'move') {
        drag = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: st.view!.ox, oy: st.view!.oy };
        st.autoFit = false;
      } else drag = { kind: 'box', a: t, add: ctrl };
      side();
      paint();
    } else if ((st.tool === 'brush' || st.tool === 'walk') && inArea(t)) {
      if (!editable('collision')) return;
      // The walk tool flips: starting on walkable ground it blocks, on blocked ground it opens (plain ground).
      const char = st.tool === 'walk' ? (WALK_TILES.has(m.terrain[t.y]![t.x]!) ? '#' : '.') : undefined;
      st.history.record(m);
      st.dirty = true;
      applyStroke(t, t, char);
      drag = { kind: 'paint', last: t, char };
    } else if (st.tool === 'height' && inArea(t)) {
      if (!m.scene) return toast('Map vẽ bằng ô không có độ cao.', 'warn');
      if (!editable('elevation')) return;
      st.history.record(m);
      st.dirty = true;
      applyStroke(t, t);
      drag = { kind: 'paint', last: t };
    } else if (st.tool === 'rect' && editable('collision')) drag = { kind: 'shape', a: t };
    else if (st.tool === 'cover' && editable('foreground')) drag = { kind: 'shape', a: t };
    else if (st.tool === 'fill' && inArea(t) && editable('collision')) change(() => E.paintTerrain(m, E.floodTiles(m, t), st.ground));
    else if (st.tool === 'erase') {
      const hit = pick(t);
      if (hit) {
        st.selected = [hit];
        void command('delete');
      }
    } else if (st.tool === 'decor' && st.decor) placeDecor(st.decor, pointOf(e));
    else if (st.tool === 'place') {
      if (st.place) placeObject(st.place, t);
      else toast('Chọn một đối tượng ở cột trái (tab Đối tượng) rồi bấm lên map.', 'warn');
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    shiftDown = e.shiftKey;
    pointer = screenOf(e);
    const t = tileOf(e);
    hover = inArea(t) ? t : null;
    if (!drag) return paint();
    const m = map();
    if (drag.kind === 'pan') {
      st.view = { ...st.view!, ox: drag.ox - (e.clientX - drag.sx) / st.view!.scale, oy: drag.oy - (e.clientY - drag.sy) / st.view!.scale };
    } else if (drag.kind === 'move' && (t.x !== drag.last.x || t.y !== drag.last.y)) {
      if (!drag.recorded) st.history.record(m);
      drag.recorded = true;
      E.moveObjects(m, st.selected, t.x - drag.last.x, t.y - drag.last.y);
      drag.last = t;
      st.dirty = true;
    } else if (drag.kind === 'resize') {
      const o = E.findObject(m, drag.ref)!;
      if (!drag.recorded) st.history.record(m);
      drag.recorded = true;
      E.setBox(m, drag.ref, { x: o.x, y: o.y, w: t.x - o.x + 1, h: t.y - o.y + 1 });
      st.dirty = true;
    } else if (drag.kind === 'paint') {
      applyStroke(drag.last, t, drag.char);
      drag.last = t;
    } else if (drag.kind === 'shape') ghost = { kind: 'rect', a: drag.a, b: t, colour: st.tool === 'cover' ? '#7fe07a' : (COLOUR[st.ground] ?? '#ff2fd0') };
    else if (drag.kind === 'box') ghost = { kind: 'rect', a: drag.a, b: t, colour: '#22d3ee' };
    paint();
  });
  const endDrag = (e: PointerEvent) => {
    const d = drag;
    drag = null;
    ghost = null;
    if (!d) return paint();
    const t = tileOf(e);
    const m = map();
    if (d.kind === 'shape' && st.tool === 'rect') change(() => E.paintTerrain(m, E.rectTiles(d.a, t), st.ground));
    else if (d.kind === 'shape' && st.tool === 'cover') {
      let ref: E.ObjRef | null = null;
      change(() => (ref = E.addCover(m, d.a, t, taken())));
      st.selected = ref ? [ref] : [];
      side();
    } else if (d.kind === 'box') {
      const inBox = E.objectsIn(m, d.a.x, d.a.y, t.x, t.y)
        .filter((o) => st.layers[layerOf(m, o)] && !st.locked[layerOf(m, o)])
        .map((o) => ({ kind: o.kind, id: o.id }));
      st.selected = d.add ? [...st.selected, ...inBox.filter((r) => !selectedKeys().has(E.refKey(r)))] : inBox;
      side();
    } else if (d.kind === 'move' || d.kind === 'resize' || d.kind === 'paint') side();
    paint();
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => {
    pointer = null;
    if (drag) return;
    hover = null;
    paint();
  });
  // Ctrl + wheel zooms around the pointer (a pinch on a touchpad too); the wheel alone scrolls the map.
  canvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const { sx, sy } = screenOf(e);
      if (e.ctrlKey || e.metaKey) zoomAt(st.view!.scale * Math.exp(-Math.max(-60, Math.min(60, e.deltaY)) * 0.0035), sx, sy);
      else {
        const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
        const dy = e.shiftKey && !e.deltaX ? 0 : e.deltaY;
        st.view = { ...st.view!, ox: st.view!.ox + dx / st.view!.scale, oy: st.view!.oy + dy / st.view!.scale };
        st.autoFit = false;
      }
      hover = inArea(tileOf(e)) ? tileOf(e) : null;
      paint();
    },
    { passive: false },
  );
  // Drag and drop from the palette: an object on the tile, a decoration's foot on the point.
  canvas.addEventListener('dragover', (e) => {
    if (!e.dataTransfer?.types.includes('text/x-medit')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const t = tileOf(e);
    hover = inArea(t) ? t : null;
    paint();
  });
  canvas.addEventListener('drop', (e) => {
    const what = e.dataTransfer?.getData('text/x-medit');
    if (!what) return;
    e.preventDefault();
    const [kind, id] = what.split(':') as [string, string];
    if (kind === 'place') {
      st.place = id as E.Addable;
      st.tool = 'place';
      placeObject(st.place, tileOf(e));
    } else if (kind === 'decor') {
      st.decor = id;
      st.tool = 'decor';
      placeDecor(id, pointOf(e));
    }
    palette();
  });

  // ---- Keys (only while this editor is on screen and no field has the focus) ---------------------------------------------
  const onKey = (e: KeyboardEvent) => {
    if (!root.isConnected) return cleanup();
    if (e.key === 'Shift' && !shiftDown) {
      shiftDown = true;
      paint();
    }
    if (document.querySelector('.modal-host') || (e.target instanceof Element && e.target.closest('input, textarea, select, .rsel'))) return;
    const k = e.key.toLowerCase();
    const ctrl = e.ctrlKey || e.metaKey;
    const keyCmd = ctrl ? ({ z: e.shiftKey ? 'redo' : 'undo', y: 'redo', d: 'duplicate', c: 'copy', v: 'paste', s: 'save' } as Record<string, string>)[k] : undefined;
    if (keyCmd) {
      e.preventDefault();
      return void command(keyCmd);
    }
    if (ctrl || e.altKey) return;
    if (k === ' ') return void ((space = true), e.preventDefault(), paint());
    if (k === 'delete' || k === 'backspace') return void command('delete');
    if (k === 'escape') {
      if (st.tip) st.tip = null;
      else {
        st.selected = [];
        st.tool = 'select';
      }
      palette();
      side();
      return paint();
    }
    if (k === 'g') return void command('grid');
    if (k === 'f') return void command('fit');
    if (k === 'r') return setTool('rect');
    if (k === '+' || k === '=') return void command('zoomIn');
    if (k === '-') return void command('zoomOut');
    const tool = TOOLS.find(([, , , key]) => key.toLowerCase() === k)?.[0];
    if (tool) return void toolClick(tool);
    const arrow = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] }[k];
    if (arrow && st.selected.length) {
      e.preventDefault();
      const n = e.shiftKey ? 5 : 1;
      change(() => E.moveObjects(map(), st.selected.filter((r) => !st.locked[layerOf(map(), r)]), arrow[0]! * n, arrow[1]! * n));
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.key === ' ') space = false;
    if (e.key === 'Shift') shiftDown = false;
    if (root.isConnected) paint();
  };
  const onBlur = () => ((shiftDown = false), (space = false));
  const onDocClick = (e: MouseEvent) => {
    const menu = root.querySelector<HTMLDetailsElement>('[data-menu]');
    if (menu?.open && !(e.target instanceof Node && menu.contains(e.target))) menu.open = false;
  };
  const resize = new ResizeObserver(() => size());
  const cleanup = () => {
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('keyup', onKeyUp);
    document.removeEventListener('click', onDocClick);
    window.removeEventListener('blur', onBlur);
    resize.disconnect();
    cancelAnimationFrame(frame);
    clearTimeout(toastTimer);
    cleanups.delete(root);
  };
  cleanups.set(root, cleanup);
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('click', onDocClick);
  window.addEventListener('blur', onBlur);

  const toolClick = (b: ToolButton) => {
    if (b === 'paint') {
      st.leftTab = 'terrain';
      st.leftCollapsed = false;
      return setTool(st.paintMode);
    }
    if (b === 'place') {
      st.leftTab = 'objects';
      st.leftCollapsed = false;
      if (st.decor && st.tool !== 'place') return chooseDecor(st.decor);
      if (st.place) return choosePlace(st.place);
      toast('Chọn một đối tượng ở cột trái rồi bấm lên map (hoặc kéo thả vào map).');
      return setTool('place');
    }
    if (b === 'height' && !map().scene) toast('Map vẽ bằng ô không có độ cao.', 'warn');
    if (b === 'height') st.leftTab = 'terrain';
    setTool(b);
  };
  root.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach((b) => b.addEventListener('click', () => toolClick(b.dataset.tool as ToolButton)));
  root.querySelectorAll<HTMLButtonElement>('.medit__head [data-cmd], .medit__tools [data-cmd], .mfloat [data-cmd]').forEach((b) => b.addEventListener('click', () => void command(b.dataset.cmd!)));
  const size = () => {
    const r = stage.getBoundingClientRect();
    W = Math.max(200, Math.floor(r.width));
    H = Math.max(200, Math.floor(r.height));
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    if (st.autoFit || !st.view) st.view = fitView(map(), W, H);
    paint();
  };
  resize.observe(stage);
  palette();
  legend();
  side();
  size();
  if (st.notice) toast(st.notice, 'ok');
  st.notice = null;
}
