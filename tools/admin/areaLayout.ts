// Admin "Bố cục khu" (decision 057, B5): drag the fixed things of an Area's scene (the plot field, the buildings, the signs, the
// fishing spot) on its own backdrop and save where they stand into content/<area>/layout.json. The farm and the plaza keep their
// own editor ("Bố cục cảnh": free placements); the Adventure has its map builder. Positions only: art, depths and motion are code.
// Keyboard: arrows nudge the chosen spot (Shift ×10), Esc lets go of it.
import { aquariumLayoutFileSchema, cloudLayoutFileSchema, gardenLayoutFileSchema, type AreaLayoutFile, type LayoutSpot } from '../../content/schemas/shared/areaLayout';
import { AQUARIUM_PLACES } from '../../src/areas/aquarium/scene/aquariumView';
import { CLOUD_BACKDROP_ART } from '../../src/areas/cloud/logic/art';
import { PLOTS_PER_TIER } from '../../src/areas/cloud/logic/config/content';
import { CLOUD_VIEW } from '../../src/areas/cloud/scene/cloudView';
import { GARDEN_BACKDROP_ART } from '../../src/areas/garden/logic/art';
import { PLOTS_PER_ZONE } from '../../src/areas/garden/logic/config/content';
import { GARDEN_VIEW } from '../../src/areas/garden/scene/gardenView';
import { AQUARIUM_LAYOUT, CLOUD_LAYOUT, GARDEN_LAYOUT } from '../../src/core/config/areaLayout';
import { vi } from '../../src/i18n/vi';
import { esc } from './labels';
import { gridCells, moveSpot, nudgeSpot, patchSpot, sameLayout, toDesign, withMenuTop, type SpotField } from './areaLayoutModel';
import { artUrl, post, rememberMessage, reloadSoon } from './store';
import './areaLayout.css';

type AreaId = 'cloud' | 'garden' | 'aquarium';

interface AreaDef {
  label: string;
  file: string;
  schema: { safeParse(v: unknown): { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } } };
  /** The backdrop art of view `i`. */
  backdrop: (view: number) => string;
  viewLabel: (view: number) => string;
  /** The plot field's grid (columns, rows, cell size in design px), when the Area has one. */
  grid: { columns: number; rows: number; cell: { width: number; height: number } } | null;
}

const AREAS: Record<AreaId, AreaDef> = {
  cloud: {
    label: '☁️ Sobi Cloud',
    file: 'cloud/layout.json',
    schema: cloudLayoutFileSchema,
    backdrop: () => CLOUD_BACKDROP_ART,
    viewLabel: () => 'Đảo mây (mọi tầng dùng chung)',
    grid: { columns: CLOUD_VIEW.columns, rows: PLOTS_PER_TIER / CLOUD_VIEW.columns, cell: CLOUD_VIEW.plotSize },
  },
  garden: {
    label: '🌱 Sobi Garden',
    file: 'garden/layout.json',
    schema: gardenLayoutFileSchema,
    backdrop: () => GARDEN_BACKDROP_ART,
    viewLabel: () => 'Cánh đồng (mọi khu dùng chung)',
    grid: { columns: GARDEN_VIEW.columns, rows: PLOTS_PER_ZONE / GARDEN_VIEW.columns, cell: { width: GARDEN_VIEW.plotSize.width * GARDEN_VIEW.plotScale, height: GARDEN_VIEW.plotSize.height * GARDEN_VIEW.plotScale } },
  },
  aquarium: {
    label: '🐟 Sobi Aquarium',
    file: 'aquarium/layout.json',
    schema: aquariumLayoutFileSchema,
    backdrop: (view) => AQUARIUM_PLACES[Math.min(view, AQUARIUM_PLACES.length - 1)]!.art,
    viewLabel: (view) => `Bể cấp ${view + 1}`,
    grid: null,
  },
};

/** What each spot is, in the owner's words. */
const SPOT_LABEL: Record<string, string> = {
  field: 'Ô trồng (ô đầu tiên)',
  spring: vi.cloud.spring,
  cauldron: vi.cloud.cauldron,
  springLabel: 'Biển tên suối',
  cauldronLabel: 'Biển tên vạc',
  title: 'Bảng tên tầng',
  tierUp: 'Mũi tên lên tầng',
  tierDown: 'Mũi tên xuống tầng',
  bird: 'Chỗ đậu của chim mây',
  mill: vi.garden.mill,
  composter: vi.garden.composter,
  sprinkler: vi.garden.sprinkler,
  eggs: 'Trứng cá (quả đầu tiên)',
  scales: 'Đống vảy',
  shop: 'Quầy cửa hàng',
  plaque: 'Bảng tên bể',
  rod: 'Cần câu (gốc cán)',
  bite: 'Chỗ cá cắn câu',
  dock: 'Vùng bấm chỗ câu',
};
const FIELD_LABEL: Record<SpotField, string> = { x: 'x', y: 'y', scale: 'Tỉ lệ', stepX: 'Bước ngang', stepY: 'Bước dọc', width: 'Rộng', height: 'Cao' };
const FIELD_ORDER: readonly SpotField[] = ['x', 'y', 'scale', 'stepX', 'stepY', 'width', 'height'];

/** The layouts as the game loaded them (the admin reloads after a save, so this is always what is on disk). */
const LOADED: Record<AreaId, AreaLayoutFile> = { cloud: CLOUD_LAYOUT, garden: GARDEN_LAYOUT, aquarium: AQUARIUM_LAYOUT };
const ed = {
  area: 'cloud' as AreaId,
  view: 0,
  draft: { ...LOADED },
  sel: null as string | null,
  snap: 5,
  saving: false,
  error: '',
};

export const areaLayoutDirty = (): boolean => (Object.keys(LOADED) as AreaId[]).some((a) => !sameLayout(ed.draft[a], LOADED[a]));

const file = () => ed.draft[ed.area];
const spots = (): Record<string, LayoutSpot> => file().views[ed.view]?.spots ?? {};
const pct = (n: number, of: number) => `${((n / of) * 100).toFixed(3)}%`;

function pinStyle(s: LayoutSpot): string {
  const d = file().designSize;
  return `left:${pct(s.x, d.width)};top:${pct(s.y, d.height)}`;
}

/** The ghost shapes of a spot: every plot of the field, the click box of the fishing spot. */
function shapes(key: string, s: LayoutSpot): string {
  const d = file().designSize;
  const box = (x: number, y: number, w: number, h: number, cls: string) => `<i class="al-shape ${cls}" data-shape="${esc(key)}" style="left:${pct(x - w / 2, d.width)};top:${pct(y - h / 2, d.height)};width:${pct(w, d.width)};height:${pct(h, d.height)}"></i>`;
  const grid = AREAS[ed.area].grid;
  if (key === 'field' && grid) return gridCells(s, grid.columns, grid.rows).map((c) => box(c.x, c.y, grid.cell.width, grid.cell.height, 'al-shape--cell')).join('');
  if (s.width !== undefined && s.height !== undefined) return box(s.x, s.y, s.width, s.height, 'al-shape--box');
  return '';
}

function stageHtml(): string {
  const url = artUrl(AREAS[ed.area].backdrop(ed.view));
  const d = file().designSize;
  const all = Object.entries(spots());
  const menuTop = file().sideMenu.top;
  return `<div class="al-stage" style="aspect-ratio:${d.width}/${d.height}">
    ${url ? `<img class="al-bg" src="${esc(url)}" alt="" draggable="false">` : '<p class="muted al-nobg">Chưa có ảnh nền cho màn này.</p>'}
    ${all.map(([key, s]) => shapes(key, s)).join('')}
    <i class="al-menu" style="top:${menuTop}%" title="Nút menu bên phải (${menuTop}% từ trên)">⋮</i>
    ${all.map(([key, s]) => `<button type="button" class="al-pin${ed.sel === key ? ' is-sel' : ''}" data-pin="${esc(key)}" style="${pinStyle(s)}" title="${esc(SPOT_LABEL[key] ?? key)}"><span>${esc(SPOT_LABEL[key] ?? key)}</span></button>`).join('')}
  </div>`;
}

function panelHtml(): string {
  const rows = Object.entries(spots())
    .map(([key, s]) => {
      const inputs = FIELD_ORDER.filter((f) => s[f] !== undefined)
        .map((f) => `<label>${FIELD_LABEL[f]}<input type="number" step="${f === 'scale' ? 0.05 : 1}" value="${s[f]}" data-spot="${esc(key)}" data-field="${f}"></label>`)
        .join('');
      return `<div class="al-row${ed.sel === key ? ' is-sel' : ''}" data-row="${esc(key)}"><b>${esc(SPOT_LABEL[key] ?? key)}</b> <code>${esc(key)}</code><div class="al-fields">${inputs}</div></div>`;
    })
    .join('');
  return `<div class="al-panel">
    ${rows}
    <div class="al-row"><b>Nút menu bên phải</b><div class="al-fields"><label>Cách mép trên (%)<input type="number" min="0" max="90" step="1" value="${file().sideMenu.top}" data-menu-top></label></div></div>
  </div>`;
}

function html(): string {
  const a = AREAS[ed.area];
  const views = file().views;
  const dirty = !sameLayout(file(), LOADED[ed.area]);
  return `<section class="al">
    <h2>📐 Bố cục khu</h2>
    <p class="muted">Kéo các chấm trên cảnh để đổi chỗ suối, vạc, cối xay, ô trồng, bảng tên… rồi bấm Lưu. Game dùng vị trí mới ở lần chạy / tải lại tới. Chỉ đổi vị trí: tranh, lớp trên dưới và chuyển động vẫn do code quyết định.</p>
    <div class="al-bar">
      <span class="chips">${(Object.keys(AREAS) as AreaId[]).map((id) => `<button type="button" class="chip${id === ed.area ? ' is-on' : ''}" data-area="${id}">${AREAS[id].label}${sameLayout(ed.draft[id], LOADED[id]) ? '' : ' •'}</button>`).join('')}</span>
      ${views.length > 1 ? `<span class="chips">${views.map((_, i) => `<button type="button" class="chip${i === ed.view ? ' is-on' : ''}" data-view="${i}">${esc(a.viewLabel(i))}</button>`).join('')}</span>` : `<span class="muted">${esc(a.viewLabel(0))}</span>`}
      <label>Bắt lưới <select data-snap>${[1, 5, 10, 20].map((n) => `<option value="${n}"${n === ed.snap ? ' selected' : ''}>${n} px</option>`).join('')}</select></label>
      <button type="button" class="btn" data-reset${dirty ? '' : ' disabled'}>Bỏ thay đổi</button>
      <button type="button" class="btn btn--primary" data-save${dirty && !ed.saving ? '' : ' disabled'}>${ed.saving ? 'Đang lưu…' : `Lưu ${esc(a.file)}`}</button>
    </div>
    ${ed.error ? `<p class="al-error" role="alert">${esc(ed.error)}</p>` : ''}
    <div class="al-work">${stageHtml()}${panelHtml()}</div>
  </section>`;
}

async function save(rerender: () => void) {
  const a = AREAS[ed.area];
  const value = file();
  const checked = a.schema.safeParse(value);
  if (!checked.success) {
    ed.error = `Game từ chối bố cục này:\n${(checked.error?.issues ?? []).slice(0, 5).map((i) => `${i.path.join(' › ') || '(gốc)'}: ${i.message}`).join('\n')}`;
    return rerender();
  }
  ed.saving = true;
  ed.error = '';
  rerender();
  try {
    await post('/__admin/content', { file: a.file, value, texts: {}, requestId: `${Date.now().toString(36)}-area-layout` });
    rememberMessage(`Đã lưu ${a.file}. Game dùng vị trí mới ngay lần chạy / tải lại tới.`);
    reloadSoon();
  } catch (e) {
    ed.error = `Chưa lưu được ${a.file}: ${(e as Error).message}`;
  } finally {
    ed.saving = false;
    rerender();
  }
}

export function renderAreaLayout(content: HTMLElement) {
  const rerender = () => renderAreaLayout(content);
  content.innerHTML = html();
  const stage = content.querySelector<HTMLElement>('.al-stage');
  const set = (next: AreaLayoutFile) => (ed.draft = { ...ed.draft, [ed.area]: next });

  content.querySelectorAll<HTMLElement>('[data-area]').forEach((b) => (b.onclick = () => ((ed.area = b.dataset.area as AreaId), (ed.view = 0), (ed.sel = null), (ed.error = ''), rerender())));
  content.querySelectorAll<HTMLElement>('[data-view]').forEach((b) => (b.onclick = () => ((ed.view = Number(b.dataset.view)), (ed.sel = null), rerender())));
  content.querySelector<HTMLSelectElement>('[data-snap]')?.addEventListener('change', (e) => (ed.snap = Number((e.target as HTMLSelectElement).value)));
  content.querySelector<HTMLElement>('[data-reset]')?.addEventListener('click', () => (set(LOADED[ed.area]), (ed.error = ''), rerender()));
  content.querySelector<HTMLElement>('[data-save]')?.addEventListener('click', () => void save(rerender));
  content.querySelectorAll<HTMLInputElement>('[data-field]').forEach((input) => {
    input.onchange = () => (set(patchSpot(file(), ed.view, input.dataset.spot!, input.dataset.field as SpotField, Number(input.value))), (ed.sel = input.dataset.spot!), rerender());
  });
  content.querySelector<HTMLInputElement>('[data-menu-top]')?.addEventListener('change', (e) => (set(withMenuTop(file(), Number((e.target as HTMLInputElement).value))), rerender()));
  content.querySelectorAll<HTMLElement>('[data-row]').forEach((row) => row.addEventListener('pointerdown', () => (ed.sel = row.dataset.row!)));

  if (!stage) return;
  stage.querySelectorAll<HTMLElement>('[data-pin]').forEach((pin) => {
    const key = pin.dataset.pin!;
    pin.onpointerdown = (down) => {
      down.preventDefault();
      pin.setPointerCapture(down.pointerId);
      ed.sel = key;
      const before = spots()[key]!;
      const start = toDesign(file(), stage.getBoundingClientRect(), down.clientX, down.clientY);
      pin.onpointermove = (move) => {
        const now = toDesign(file(), stage.getBoundingClientRect(), move.clientX, move.clientY);
        set(moveSpot(file(), ed.view, key, before.x + now.x - start.x, before.y + now.y - start.y, ed.snap));
        // Live: only this pin moves while dragging; the whole page is redrawn when the pointer lets go.
        pin.setAttribute('style', pinStyle(spots()[key]!));
      };
      pin.onpointerup = () => ((pin.onpointermove = null), (pin.onpointerup = null), rerender());
    };
    pin.onkeydown = (e) => {
      const step = e.shiftKey ? 10 : 1;
      const by: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      const d = by[e.key];
      if (e.key === 'Escape') return void ((ed.sel = null), rerender());
      if (!d) return;
      e.preventDefault();
      set(nudgeSpot(file(), ed.view, key, d[0], d[1]));
      ed.sel = key;
      rerender();
      content.querySelector<HTMLElement>(`[data-pin="${key}"]`)?.focus();
    };
  });
}
