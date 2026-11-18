// Admin "Dữ liệu chiến đấu" (#/combat-db[/animals|monsters|skills|report]): browse every combat animal, monster and skill of Sobi
// Adventure with their pictures, stats, classes, elements, skills (Unique / Common), combat properties and animation links. Read-only:
// the data comes from combatDbModel.ts (the game's own tables and functions), never a copy. One detail panel at a time on the right;
// a skill opened from an entity replaces the panel's content with a "back" link (no modal over a modal).
import { ADVENTURE_CONTENT, CLASSES, ELEMENT_CHART, ELEMENT_LIST, LINEAGE_LIST, SKILLS, STAT_RULES, STATUSES, ZONES, AB, type ClassId } from '../../src/areas/adventure/logic/config/content';
import { nameOfItem, statName } from '../../src/areas/adventure/ui/vmKit';
import { itemArtId } from '../../src/core/config/assetIds';
import type { Element, Stats, StatusId } from '../../src/systems/combat/types';
import {
  CLASS_IDS,
  EFFECT_KIND_LABEL,
  FOE_TYPE_ORDER,
  MAX_LEVEL,
  STAT_ORDER,
  affinities,
  animalStatsAt,
  buildCombatDb,
  className,
  effectText,
  elementColor,
  elementName,
  emptyEntityQuery,
  emptySkillQuery,
  foeTypeName,
  lineName,
  queryEntities,
  querySkills,
  skillEffectKind,
  statusName,
  summarize,
  type ArtInfo,
  type CombatDb,
  type DataStatus,
  type Entity,
  type EntityQuery,
  type ManifestRow,
  type SkillEntry,
  type SkillQuery,
  type SkillUse,
} from './combatDbModel';
import { presetBattleLab } from './battleLab';
import { presetRigLab } from './rigLab';
import { RARITY_LABEL, esc } from './labels';
import type { Visual } from './richSelect';
import { json } from './store';
import { facetOptions, type Facet } from './worldFilters';
import { emptyState, errorState, facetSelect, filterBar, filterCell, loadingState, pageIntro, searchBox, statusBadge, type Tone } from './worldUi';
import './combatDb.css';

type Tab = 'animals' | 'monsters' | 'skills' | 'report';
type DetailTab = 'overview' | 'skills' | 'props' | 'anim' | 'more';
type Panel = { kind: 'entity'; key: string; tab: DetailTab; level: number; classId: string } | { kind: 'skill'; id: string; back: Panel | null };

const TABS: readonly (readonly [Tab, string, string])[] = [
  ['animals', '🐾', 'Chiến binh'],
  ['monsters', '👹', 'Quái vật'],
  ['skills', '✨', 'Kỹ năng'],
  ['report', '📋', 'Báo cáo dữ liệu'],
];

const page = {
  db: null as CombatDb | null,
  loading: false,
  error: '',
  rows: [] as ManifestRow[],
  view: 'cards' as 'cards' | 'table',
  animals: emptyEntityQuery(),
  monsters: emptyEntityQuery(),
  skills: emptySkillQuery(),
  panel: null as Panel | null,
  root: null as HTMLElement | null,
  wired: false,
};

// ---- Small pieces -----------------------------------------------------------------------------------------------------------

const STATUS_TEXT: Record<DataStatus, [Tone, string]> = { complete: ['ok', '✓ Đầy đủ'], incomplete: ['warn', '◐ Thiếu dữ liệu'], placeholder: ['error', '▢ Placeholder'] };
const dataBadge = (s: DataStatus) => statusBadge(STATUS_TEXT[s][0], STATUS_TEXT[s][1]);
const TYPE_LABEL: Record<string, string> = { unique: 'Độc nhất', ultimate: 'Tuyệt kỹ', class: 'Chức nghiệp', enemy: 'Kỹ năng quái' };
const CATEGORY_LABEL: Record<string, string> = { physical: 'Vật lý', magical: 'Phép', hybrid: 'Lai', support: 'Hỗ trợ' };
const TARGET_LABEL: Record<string, string> = { enemy: '1 địch', allEnemies: 'Mọi địch', randomEnemies: 'Địch ngẫu nhiên', ally: '1 đồng minh', allAllies: 'Cả đội', self: 'Bản thân', all: 'Cả sân' };
const SHARING_LABEL: Record<string, [Tone, string]> = { own: ['info', 'Riêng 1 entity'], shared: ['ok', 'Dùng chung'], unused: ['off', 'Chưa dùng'] };
const ROLE_LABEL: Record<string, string> = {
  line: 'Của dòng',
  own: 'Riêng loài',
  'ultimate-line': 'Tuyệt kỹ của dòng',
  'ultimate-own': 'Tuyệt kỹ riêng loài',
  class: 'Cây class',
  'enemy-own': 'Riêng quái này',
  'enemy-shared': 'Quái dùng chung',
  phase: 'Thêm khi đổi pha',
  corruption: 'Theo cấp tha hóa',
};
const INTERACTION_LABEL: Record<string, [Tone, string]> = { STRONG: ['ok', 'Khắc'], WEAK: ['warn', 'Yếu'], RESIST: ['info', 'Kháng'], IMMUNE: ['off', 'Miễn'], NEUTRAL: ['off', 'Thường'] };
const ART_LABEL: Record<string, string> = { production: 'Art chính thức', placeholder: 'Placeholder', missing: 'Missing Asset' };

const pic = (a: ArtInfo, cls: string, alt = '') =>
  a.url
    ? `<img class="${cls}" src="${esc(a.url)}" alt="${esc(alt)}" loading="lazy" decoding="async" />`
    : `<span class="${cls} cdb-missing" title="${esc(a.id)}"><span aria-hidden="true">🖼️</span><b>Missing Asset</b><small>${esc(a.id)}</small></span>`;

const artOf = (id: string): ArtInfo => {
  const r = page.rows.find((x) => x.id === id);
  return r?.url ? { id, url: r.url, state: r.status === 'placeholder' ? 'placeholder' : 'production' } : { id, url: null, state: 'missing' };
};
const icon = (id: string, alt = '') => {
  const a = artOf(id);
  return a.url ? `<img class="cdb-ico" src="${esc(a.url)}" alt="${esc(alt)}" />` : '';
};

const elemChip = (e: string | null | undefined, small = false) => {
  if (!e) return `<span class="cdb-chip">${esc(elementName(e))}</span>`;
  const color = elementColor(e);
  return `<span class="cdb-chip cdb-chip--el${small ? ' is-small' : ''}" style="${color ? `--el:${color}` : ''}">${e === 'SELF' ? '' : icon(`ui_icon_elem_${e.toLowerCase()}`)}${esc(elementName(e))}</span>`;
};
const classChip = (c: string) => `<span class="cdb-chip cdb-chip--class">${icon(`ui_icon_class_${c}`)}${esc(className(c))}</span>`;
const foeChip = (k: string) => `<span class="cdb-chip cdb-chip--foe" data-foe="${esc(k)}">${k && k !== 'nightmare' ? icon(`ui_icon_foe_${k}`) : ''}${esc(foeTypeName(k))}</span>`;
const rarityChip = (r: string) => `<span class="badge rarity-${r.toLowerCase()}">${esc(RARITY_LABEL[r] ?? r)}</span>`;
const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : `${Math.round(n * 10) / 10}`);
const round = (n: number) => `${Math.round(n)}`;

const keyOf = (e: Entity) => `${e.kind}:${e.id}`;
const entityByKey = (key: string): Entity | undefined => {
  const db = page.db!;
  const [kind, id] = key.split(':') as [string, string];
  return kind === 'animal' ? db.animals.find((a) => a.id === id) : db.monsters.find((m) => m.id === id);
};
const skillOf = (id: string): SkillEntry | undefined => page.db!.skills.find((s) => s.id === id);

/** Unique / common split of an entity (animals: line / own slots + Ultimate vs the class tree; monsters: only theirs vs shared). */
function splitSkills(e: Entity): { unique: SkillUse[]; common: SkillUse[] } {
  if (e.kind === 'animal') return { unique: [...e.unique, e.ultimate], common: e.common };
  const shared = (u: SkillUse) => u.role === 'corruption' || skillOf(u.skillId)?.sharing === 'shared';
  return { unique: e.skills.filter((u) => !shared(u)), common: e.skills.filter(shared) };
}

// ---- Loading ------------------------------------------------------------------------------------------------------------------

function load(root: HTMLElement) {
  page.loading = true;
  json<Record<string, unknown>>('/assets/manifest/assets.json')
    .then((m) => {
      const rows: ManifestRow[] = [];
      for (const list of Object.values(m)) {
        if (!Array.isArray(list)) continue;
        for (const r of list as { id: string; status?: string; asset?: string }[]) rows.push({ id: r.id, status: r.status, url: r.asset ? `/assets/${r.asset}` : null });
      }
      page.rows = rows;
      page.db = buildCombatDb(rows);
    })
    .catch((e: Error) => (page.error = e.message))
    .finally(() => {
      page.loading = false;
      renderCombatDb(root, currentTab());
    });
}

const currentTab = (): Tab => {
  const id = location.hash.replace(/^#\/?/, '').split('?')[0]!.split('/')[1];
  return TABS.some(([t]) => t === id) ? (id as Tab) : 'animals';
};

// ---- Page ------------------------------------------------------------------------------------------------------------------------

export function renderCombatDb(root: HTMLElement, tabId: string | null) {
  page.root = root;
  if (!page.wired) wire();
  const tab: Tab = TABS.some(([t]) => t === tabId) ? (tabId as Tab) : 'animals';
  if (!page.db && !page.error) {
    root.innerHTML = loadingState('Đang đọc dữ liệu chiến đấu và manifest asset…');
    if (!page.loading) load(root);
    return;
  }
  if (!page.db) {
    root.innerHTML = errorState(`Không đọc được manifest asset: ${esc(page.error)}. Chạy <code>npm run admin</code> rồi tải lại trang.`);
    return;
  }
  const db = page.db;
  const s = summarize(db);
  const tile = (icon: string, n: number, label: string, sub: string, tone = '') => `<div class="cdb-stat${tone ? ` cdb-stat--${tone}` : ''}"><span class="cdb-stat__icon" aria-hidden="true">${icon}</span><b>${n}</b><span>${esc(label)}</span><small>${sub}</small></div>`;
  const stats = `<section class="cdb-stats" aria-label="Tổng quan dữ liệu">
    ${tile('🐾', s.animals, 'Combat Animals', `${db.animals.filter((a) => a.source === 'farm').length} heo · ${db.animals.filter((a) => a.source === 'aquarium').length} cá`)}
    ${tile('👹', s.monsters, 'Monsters', `${db.monsters.filter((m) => m.boss).length} trùm · ${db.monsters.filter((m) => m.types.length === 0).length} chưa đặt`)}
    ${tile('✨', s.skills, 'Skills', Object.entries(s.skillsByType).map(([t, n]) => `${n} ${esc(TYPE_LABEL[t] ?? t)}`).join(' · '))}
    ${tile('🎓', s.classes, 'Classes', `${s.lines} dòng Guardian`)}
    ${tile('🌐', s.elements, 'Elements', `${s.statuses} trạng thái`)}
    ${tile('⚠️', s.incomplete, 'Thiếu dữ liệu', `${s.placeholder} placeholder · ${s.missingArt} thiếu ảnh`, s.incomplete ? 'warn' : 'ok')}
  </section>`;
  const counts: Record<Tab, number> = { animals: db.animals.length, monsters: db.monsters.length, skills: db.skills.length, report: db.inconsistencies.length + s.incomplete };
  const tabs = `<nav class="cdb-tabs" role="tablist">${TABS.map(([t, i, l]) => `<a role="tab" href="#/combat-db/${t}" class="cdb-tab${t === tab ? ' is-on' : ''}" aria-selected="${t === tab}"><span aria-hidden="true">${i}</span>${esc(l)}<span class="cdb-tab__n">${counts[t]}</span></a>`).join('')}</nav>`;
  root.innerHTML = `${pageIntro('Tra cứu toàn bộ dữ liệu combat của Sobi Adventure: chiến binh, quái vật, kỹ năng, chỉ số, nguyên tố, class, animation. Chỉ đọc — mọi số lấy trực tiếp từ <code>content/adventure/*.json</code> và hàm tính của game; sửa nội dung ở trang <a href="#/content">Nội dung game</a>.')}
    ${stats}${tabs}<div class="cdb-body" data-cdb-body></div><div data-cdb-panel></div>`;
  renderBody(tab);
  renderPanel();
}

function renderBody(tab: Tab) {
  const host = page.root?.querySelector<HTMLElement>('[data-cdb-body]');
  if (!host || !page.db) return;
  host.innerHTML = tab === 'animals' ? entityTab('animals') : tab === 'monsters' ? entityTab('monsters') : tab === 'skills' ? skillsTab() : reportTab();
}

/** Only the result list and count are redrawn while typing in the search box (the box keeps focus and caret). */
function renderResults(tab: Tab) {
  const host = page.root?.querySelector<HTMLElement>('[data-cdb-results]');
  const count = page.root?.querySelector<HTMLElement>('.wfilters__result');
  if (!host || !page.db) return;
  if (tab === 'skills') {
    const shown = querySkills(page.db.skills, page.skills);
    host.innerHTML = skillList(shown);
    if (count) count.innerHTML = resultLine(shown.length, page.db.skills.length, 'kỹ năng');
  } else if (tab !== 'report') {
    const list: Entity[] = tab === 'animals' ? page.db.animals : page.db.monsters;
    const shown = queryEntities(list, page[tab]);
    host.innerHTML = entityList(shown, tab);
    if (count) count.innerHTML = resultLine(shown.length, list.length, tab === 'animals' ? 'chiến binh' : 'quái');
  }
}

const resultLine = (n: number, total: number, unit: string) => `Hiển thị <b>${n}</b> / ${total} ${unit}${n < total ? ' (đang lọc)' : ''}`;

// ---- Entity lists ------------------------------------------------------------------------------------------------------------

/** facetSelect, with the "all" line showing how many items the list has (an item may count under several values). */
const facetSelectN = (total: number, ...args: Parameters<typeof facetSelect>) => facetSelect(...args).replace(/(<option value=""[^>]*data-sub=")\d+(")/, `$1${total}$2`);

const facets = <T,>(items: readonly T[], of: (t: T) => string | readonly string[], label: (v: string) => string, order?: readonly string[]): Facet[] => {
  const flat = items.flatMap((it) => {
    const v = of(it);
    return (Array.isArray(v) ? v : [v]).map((x) => ({ x }));
  });
  return facetOptions(flat, { of: (o) => o.x, label, order });
};

function entityTab(tab: 'animals' | 'monsters'): string {
  const db = page.db!;
  const q = page[tab];
  const list: Entity[] = tab === 'animals' ? db.animals : db.monsters;
  const elementOrder = ELEMENT_LIST.map((e) => e.id);
  const elFacets = facets(list, (e) => (e.element2 ? [e.element, e.element2] : [e.element]), (v) => elementName(v), elementOrder);
  const skillIds = [...new Set(list.flatMap((e) => e.skills.map((u) => u.skillId)))];
  const skillFacets = facets(skillIds.map((id) => ({ id })), (o) => o.id, (v) => SKILLS[v]?.nameVi ?? v).sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  for (const f of skillFacets) f.count = list.filter((e) => e.skills.some((u) => u.skillId === f.value)).length;
  const typeFacets = facets(list, (e) => [...new Set(e.skills.map((u) => SKILLS[u.skillId]?.type ?? '?'))], (v) => TYPE_LABEL[v] ?? v, ['unique', 'ultimate', 'class', 'enemy']);
  const statusFacets = facets(list, (e) => e.status, (v) => STATUS_TEXT[v as DataStatus][1], ['complete', 'incomplete', 'placeholder']);
  const elVisual = (v: string) => ({ img: artOf(`ui_icon_elem_${v.toLowerCase()}`).url });
  const cells: string[] = [filterCell('Tìm theo tên hoặc ID', searchBox(q.q, tab === 'animals' ? 'Heo Hiệp Sĩ, PIG_KNIGHT…' : 'Sói Đêm, enemy_forest_wolf…'), !!q.q).replace('class="wf', 'class="wf wf--search')];
  if (tab === 'animals') {
    const animals = db.animals;
    cells.push(filterCell('Class', facetSelectN(list.length, 'data-f="classId"', 'Mọi class', facets(animals, (a) => a.classId, className, CLASS_IDS), q.classId, (v) => ({ img: artOf(`ui_icon_class_${v}`).url })), !!q.classId));
    cells.push(filterCell('Nguyên tố (chính hoặc phụ)', facetSelectN(list.length, 'data-f="element"', 'Mọi nguyên tố', elFacets, q.element, elVisual), !!q.element));
    cells.push(filterCell('Dòng Guardian', facetSelectN(list.length, 'data-f="lineage"', 'Mọi dòng', facets(animals, (a) => a.lineage.id, lineName, LINEAGE_LIST.map((l) => l.id)), q.lineage), !!q.lineage));
    cells.push(filterCell('Độ hiếm', facetSelectN(list.length, 'data-f="rarity"', 'Mọi độ hiếm', facets(animals, (a) => a.rarity, (v) => RARITY_LABEL[v] ?? v, ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY']), q.rarity), !!q.rarity));
  } else {
    const monsters = db.monsters;
    cells.push(filterCell('Loại quái (nơi xuất hiện)', facetSelectN(list.length, 'data-f="type"', 'Mọi loại', facets(monsters, (m) => (m.types.length ? m.types : ['none']), (v) => (v === 'none' ? 'Chưa đặt trên map' : foeTypeName(v)), [...FOE_TYPE_ORDER, 'none']), q.type, (v) => ({ img: artOf(`ui_icon_foe_${v}`).url })), !!q.type));
    cells.push(filterCell('Nguyên tố (chính hoặc phụ)', facetSelectN(list.length, 'data-f="element"', 'Mọi nguyên tố', elFacets, q.element, elVisual), !!q.element));
    cells.push(filterCell('Vùng', facetSelectN(list.length, 'data-f="zone"', 'Mọi vùng', facets(monsters, (m) => [...new Set(m.appearances.map((a) => a.zoneId))], (v) => ZONES[v]?.nameVi ?? v, Object.keys(ZONES)), q.zone), !!q.zone));
    cells.push(filterCell('Thẻ', facetSelectN(list.length, 'data-f="tag"', 'Mọi thẻ', facets(monsters, (m) => m.tags, (v) => (v === 'umbraflux' ? 'Umbraflux (tha hóa)' : v === 'boss' ? 'Trùm' : v === 'elite' ? 'Tinh anh' : v)), q.tag), !!q.tag));
  }
  cells.push(filterCell('Trạng thái dữ liệu', facetSelectN(list.length, 'data-f="status"', 'Mọi trạng thái', statusFacets, q.status), !!q.status));
  cells.push(filterCell('Có kỹ năng', facetSelectN(list.length, 'data-f="skill"', 'Mọi kỹ năng', skillFacets, q.skill, (v) => ({ img: artOf(`ui_${v}`).url ?? artOf(`ui_icon_elem_${String(SKILLS[v]?.element ?? '').toLowerCase()}`).url })), !!q.skill));
  cells.push(filterCell('Có loại kỹ năng', facetSelectN(list.length, 'data-f="skillType"', 'Mọi loại', typeFacets, q.skillType), !!q.skillType));
  const sorts: [string, string][] = [['name', 'Tên'], ['id', 'ID'], [tab === 'animals' ? 'class' : 'type', tab === 'animals' ? 'Class' : 'Loại quái'], ['element', 'Nguyên tố'], ...(tab === 'animals' ? ([['rarity', 'Độ hiếm']] as [string, string][]) : []), ['hp', 'HP'], ['atk', 'ATK'], ['def', 'DEF'], ['matk', 'MATK'], ['mdef', 'MDEF'], ['spd', 'SPD'], ['skills', 'Số kỹ năng']];
  const shown = queryEntities(list, q);
  const active = Object.entries(q).some(([k, v]) => k !== 'sort' && k !== 'desc' && !!v);
  const tools = `<div class="cdb-tools">
      <label class="cdb-sort"><span>Sắp xếp</span><select data-f="sort">${sorts.map(([v, l]) => `<option value="${v}"${q.sort === v ? ' selected' : ''}>${l}</option>`).join('')}</select>
        <button type="button" class="btn btn-small" data-desc title="Đảo chiều">${q.desc ? '↓ Giảm dần' : '↑ Tăng dần'}</button></label>
      <div class="cdb-seg" role="group" aria-label="Kiểu hiển thị"><button type="button" class="btn btn-small${page.view === 'cards' ? ' is-on' : ''}" data-view="cards">▦ Thẻ</button><button type="button" class="btn btn-small${page.view === 'table' ? ' is-on' : ''}" data-view="table">☰ Bảng so sánh</button></div>
      <button type="button" class="btn btn-small" data-clear ${active ? '' : 'disabled'}>✕ Xoá bộ lọc</button>
    </div>`;
  return `${filterBar(cells.join(''), resultLine(shown.length, list.length, tab === 'animals' ? 'chiến binh' : 'quái'))}${tools}<div data-cdb-results>${entityList(shown, tab)}</div>`;
}

function entityList(list: readonly Entity[], tab: 'animals' | 'monsters'): string {
  if (list.length === 0) return emptyState('🔍', 'Không có entity nào khớp bộ lọc.', '<button type="button" class="btn" data-clear>✕ Xoá bộ lọc</button>');
  return page.view === 'table' ? entityTable(list, tab) : `<div class="cdb-grid">${list.map(entityCard).join('')}</div>`;
}

function entityCard(e: Entity): string {
  const { unique, common } = splitSkills(e);
  const color = elementColor(e.element);
  const chips = e.kind === 'animal' ? `${classChip(e.classId)}${elemChip(e.element, true)}${e.element2 ? elemChip(e.element2, true) : ''}` : `${foeChip(e.mainType)}${elemChip(e.element, true)}${e.element2 ? elemChip(e.element2, true) : ''}`;
  const mini = (['hp', 'atk', 'def'] as const).map((k) => `<span><small>${k.toUpperCase()}</small><b>${round(e.stats[k])}</b></span>`).join('');
  const sub = e.kind === 'animal' ? `${rarityChip(e.rarity)}<span class="cdb-muted">${esc(e.lineage.name)}</span>` : `<span class="cdb-muted">${e.tags.includes('umbraflux') ? 'Umbraflux · ' : ''}${e.appearances.length} nhóm${e.nightmareFloors.length ? ` · Vết Nứt T${e.nightmareFloors.join(', ')}` : ''}</span>`;
  return `<button type="button" class="cdb-card" data-open="${esc(keyOf(e))}" style="${color ? `--el:${color}` : ''}">
    <span class="cdb-card__art">${pic(e.art, 'cdb-card__img', e.name)}${e.art.state === 'placeholder' ? '<span class="cdb-card__flag">Placeholder</span>' : ''}</span>
    <span class="cdb-card__body">
      <span class="cdb-card__name">${esc(e.name)}</span>
      <code class="cdb-id">${esc(e.id)}</code>
      <span class="cdb-chips">${chips}</span>
      <span class="cdb-card__sub">${sub}</span>
      <span class="cdb-mini">${mini}</span>
      <span class="cdb-card__foot"><span title="${e.kind === 'animal' ? '4 ô Độc nhất + Tuyệt kỹ' : 'Kỹ năng chỉ quái này có'}">⭐ ${unique.length} riêng</span><span title="${e.kind === 'animal' ? 'Kỹ năng cây class mặc định' : 'Kỹ năng quái khác cũng có, kể cả theo tha hóa'}">🔗 ${common.length} chung</span>${dataBadge(e.status)}</span>
    </span>
  </button>`;
}

function entityTable(list: readonly Entity[], tab: 'animals' | 'monsters'): string {
  const q = page[tab];
  const th = (key: string, label: string) => `<th><button type="button" class="cdb-th${q.sort === key ? ' is-on' : ''}" data-sort="${key}">${label}${q.sort === key ? (q.desc ? ' ↓' : ' ↑') : ''}</button></th>`;
  const rows = list
    .map((e) => {
      const { unique, common } = splitSkills(e);
      return `<tr data-open="${esc(keyOf(e))}" tabindex="0">
        <td class="cdb-td-art">${pic(e.art, 'cdb-thumb', e.name)}</td>
        <td><b>${esc(e.name)}</b><br /><code class="cdb-id">${esc(e.id)}</code></td>
        <td>${e.kind === 'animal' ? classChip(e.classId) : foeChip(e.mainType)}</td>
        <td>${elemChip(e.element, true)}${e.element2 ? elemChip(e.element2, true) : ''}</td>
        ${STAT_ORDER.map((k) => `<td class="cdb-num">${round(e.stats[k])}</td>`).join('')}
        <td class="cdb-num">${unique.length}</td><td class="cdb-num">${common.length}</td>
        <td>${dataBadge(e.status)}</td>
      </tr>`;
    })
    .join('');
  return `<div class="cdb-tablewrap"><table class="cdb-table">
    <thead><tr><th></th>${th('name', 'Tên / ID')}${th(tab === 'animals' ? 'class' : 'type', tab === 'animals' ? 'Class' : 'Loại')}${th('element', 'Nguyên tố')}${STAT_ORDER.map((k) => th(k, k.toUpperCase())).join('')}<th>Riêng</th><th>Chung</th><th>Dữ liệu</th></tr></thead>
    <tbody>${rows}</tbody></table></div>
    <p class="cdb-note">${tab === 'animals' ? 'Chỉ số cấp 1, chưa tính trang bị và Gắn bó (công thức của game: chỉ số class × độ hiếm).' : 'Chỉ số gốc trong enemies.json; trong trận còn nhân theo loại nhóm và cấp tha hóa (xem chi tiết).'}</p>`;
}

// ---- Skills tab ------------------------------------------------------------------------------------------------------------------

function skillsTab(): string {
  const db = page.db!;
  const q = page.skills;
  const all = db.skills;
  const f = (attr: string, all0: string, list: Facet[], v: string, visual?: (x: string) => Visual) => facetSelectN(all.length, `data-s="${attr}"`, all0, list, v, visual);
  const cells = [
    filterCell('Tìm theo tên, ID, mô tả', searchBox(q.q, 'Chém Thép, skill_tg…'), !!q.q).replace('class="wf', 'class="wf wf--search'),
    filterCell('Loại kỹ năng', f('type', 'Mọi loại', facets(all, (s) => s.row.type, (v) => TYPE_LABEL[v] ?? v, ['unique', 'ultimate', 'class', 'enemy']), q.type), !!q.type),
    filterCell('Nguyên tố', f('element', 'Mọi nguyên tố', facets(all, (s) => s.row.element ?? 'NONE', (v) => (v === 'NONE' ? 'Không hệ' : elementName(v)), [...ELEMENT_LIST.map((e) => e.id), 'SELF', 'NONE']), q.element, (v) => ({ img: artOf(`ui_icon_elem_${v.toLowerCase()}`).url })), !!q.element),
    filterCell('Kiểu đòn', f('category', 'Mọi kiểu', facets(all, (s) => s.row.category, (v) => CATEGORY_LABEL[v] ?? v), q.category), !!q.category),
    filterCell('Mục tiêu', f('target', 'Mọi mục tiêu', facets(all, (s) => s.row.target, (v) => TARGET_LABEL[v] ?? v), q.target), !!q.target),
    filterCell('Tác dụng', f('effect', 'Mọi tác dụng', facets(all, (s) => skillEffectKind(s.row), (v) => EFFECT_KIND_LABEL[v] ?? v, ['damage', 'heal', 'shield', 'buff', 'debuff', 'utility']), q.effect), !!q.effect),
    filterCell('Trạng thái gây ra', f('status', 'Mọi trạng thái', facets(all.filter((s) => s.statuses.length), (s) => s.statuses, statusName), q.status), !!q.status),
    filterCell('Dùng chung', f('sharing', 'Tất cả', facets(all, (s) => s.sharing, (v) => SHARING_LABEL[v]![1], ['own', 'shared', 'unused']), q.sharing), !!q.sharing),
    filterCell('Animation riêng', f('fx', 'Tất cả', facets(all, (s) => (s.fx.has ? 'yes' : 'no'), (v) => (v === 'yes' ? 'Đã có' : 'Chưa có')), q.fx), !!q.fx),
    filterCell('Icon riêng', f('icon', 'Tất cả', facets(all, (s) => (s.icon.state === 'missing' ? 'no' : 'yes'), (v) => (v === 'yes' ? 'Đã có' : 'Chưa có (dùng icon nguyên tố)')), q.icon), !!q.icon),
  ];
  const sorts: [string, string][] = [['name', 'Tên'], ['id', 'ID'], ['type', 'Loại'], ['element', 'Nguyên tố'], ['power', 'Sức mạnh (power × số đòn)'], ['mp', 'MP'], ['cooldown', 'Hồi chiêu'], ['users', 'Số entity dùng']];
  const shown = querySkills(all, q);
  const active = Object.entries(q).some(([k, v]) => k !== 'sort' && k !== 'desc' && !!v);
  const tools = `<div class="cdb-tools">
    <label class="cdb-sort"><span>Sắp xếp</span><select data-s="sort">${sorts.map(([v, l]) => `<option value="${v}"${q.sort === v ? ' selected' : ''}>${l}</option>`).join('')}</select>
      <button type="button" class="btn btn-small" data-desc title="Đảo chiều">${q.desc ? '↓ Giảm dần' : '↑ Tăng dần'}</button></label>
    <button type="button" class="btn btn-small" data-clear ${active ? '' : 'disabled'}>✕ Xoá bộ lọc</button></div>`;
  return `${filterBar(cells.join(''), resultLine(shown.length, all.length, 'kỹ năng'))}${tools}<div data-cdb-results>${skillList(shown)}</div>`;
}

const skillIcon = (s: SkillEntry, cls = 'cdb-skill__ico') => {
  if (s.icon.url) return `<img class="${cls}" src="${esc(s.icon.url)}" alt="" loading="lazy" />`;
  const el = s.row.element && s.row.element !== 'SELF' ? artOf(`ui_icon_elem_${s.row.element.toLowerCase()}`) : artOf('ui_icon_adv_skill');
  return `<span class="${cls} cdb-ico-fallback" title="Chưa có icon riêng ui_${esc(s.id)} — game dùng icon nguyên tố">${el.url ? `<img src="${esc(el.url)}" alt="" />` : '✨'}<i>thiếu icon</i></span>`;
};

const costText = (s: SkillEntry) => (s.row.type === 'ultimate' ? `Nộ ${AB.rage.max}` : `${s.row.mpCost} MP`);
const powerText = (s: SkillEntry) => (s.row.power > 0 ? `${fmt(s.row.power)}×${s.row.category === 'magical' ? 'MATK' : s.row.category === 'hybrid' ? 'ATK/MATK' : 'ATK'}${s.row.hits > 1 ? ` · ${s.row.hits} đòn` : ''}` : '—');

function skillList(list: readonly SkillEntry[]): string {
  if (list.length === 0) return emptyState('🔍', 'Không có kỹ năng nào khớp bộ lọc.', '<button type="button" class="btn" data-clear>✕ Xoá bộ lọc</button>');
  const rows = list
    .map((s) => {
      const [tone, text] = SHARING_LABEL[s.sharing]!;
      return `<tr data-skill="${esc(s.id)}" tabindex="0">
        <td>${skillIcon(s)}</td>
        <td><b>${esc(s.row.nameVi)}</b><br /><code class="cdb-id">${esc(s.id)}</code></td>
        <td><span class="cdb-type cdb-type--${s.row.type}">${esc(TYPE_LABEL[s.row.type] ?? s.row.type)}</span></td>
        <td>${elemChip(s.row.element, true)}</td>
        <td>${esc(CATEGORY_LABEL[s.row.category] ?? s.row.category)}</td>
        <td>${esc(TARGET_LABEL[s.row.target] ?? s.row.target)}</td>
        <td class="cdb-num">${powerText(s)}</td>
        <td class="cdb-num">${costText(s)}</td>
        <td class="cdb-num">${s.row.cooldown || '—'}</td>
        <td class="cdb-effects">${s.row.effects.length ? s.row.effects.map((e) => `<span>${esc(effectText(e))}</span>`).join('') : '<span class="cdb-muted">—</span>'}</td>
        <td class="cdb-num" title="${esc(s.users.map((u) => u.name).join(', '))}">${new Set(s.users.map((u) => u.id)).size}</td>
        <td>${statusBadge(tone, text)}</td>
        <td>${s.fx.has ? statusBadge('ok', '✓ Có') : statusBadge('warn', 'Chưa có')}</td>
      </tr>`;
    })
    .join('');
  return `<div class="cdb-tablewrap"><table class="cdb-table cdb-table--skills"><thead><tr><th></th><th>Kỹ năng</th><th>Loại</th><th>Nguyên tố</th><th>Kiểu</th><th>Mục tiêu</th><th>Sát thương</th><th>Chi phí</th><th>Hồi chiêu</th><th>Hiệu ứng</th><th>Entity</th><th>Dùng chung</th><th>Animation</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ---- Report tab ------------------------------------------------------------------------------------------------------------------

function reportTab(): string {
  const db = page.db!;
  const all: Entity[] = [...db.animals, ...db.monsters];
  const notComplete = all.filter((e) => e.status !== 'complete');
  const noArt = all.filter((e) => e.art.state !== 'production');
  const noMotion = all.filter((e) => !e.animation.rig && e.animation.poses.length === 0);
  const noIcon = db.skills.filter((s) => s.icon.state === 'missing');
  const noFx = db.skills.filter((s) => !s.fx.has);
  const row = (e: Entity) => `<tr data-open="${esc(keyOf(e))}" tabindex="0"><td>${pic(e.art, 'cdb-thumb', e.name)}</td><td><b>${esc(e.name)}</b><br /><code class="cdb-id">${esc(e.id)}</code></td><td>${dataBadge(e.status)}</td><td>${e.checks.filter((c) => !c.ok).map((c) => `<div class="cdb-check${c.required ? '' : ' is-note'}">${c.required ? '✗' : 'ℹ'} ${esc(c.label)}${c.detail ? `<small>${esc(c.detail)}</small>` : ''}</div>`).join('')}</td></tr>`;
  const section = (title: string, n: number, body: string, tone: Tone = n ? 'warn' : 'ok') => `<section class="wpanel"><header class="wpanel__head"><span class="wpanel__title">${esc(title)}</span>${statusBadge(tone, `${n}`)}</header><div class="wpanel__body">${body}</div></section>`;
  const table = (rows: string) => `<div class="cdb-tablewrap"><table class="cdb-table"><thead><tr><th></th><th>Entity</th><th>Trạng thái</th><th>Thiếu gì</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  const skillChips = (list: readonly SkillEntry[]) => `<div class="cdb-chiplist">${list.map((s) => `<button type="button" class="cdb-chip cdb-chip--btn" data-skill="${esc(s.id)}">${esc(s.row.nameVi)} <code>${esc(s.id)}</code></button>`).join('')}</div>`;
  return `<div class="cdb-report">
    <p class="cdb-note">Quy ước trạng thái: <b>Placeholder</b> = ảnh đại diện là placeholder hoặc thiếu; <b>Thiếu dữ liệu</b> = có ảnh nhưng thiếu rig / key pose, skill không tồn tại hoặc skill chưa có animation riêng, hoặc quái chưa được đặt ở đâu; <b>Đầy đủ</b> = đạt mọi mục bắt buộc. Icon skill riêng là mục tuỳ chọn (game tự dùng icon nguyên tố).</p>
    ${section('Entity chưa đầy đủ', notComplete.length, notComplete.length ? table(notComplete.map(row).join('')) : '<p class="ok">Mọi entity đều đầy đủ.</p>')}
    ${section('Thiếu ảnh hoặc ảnh placeholder', noArt.length, noArt.length ? table(noArt.map(row).join('')) : '<p class="ok">Mọi chiến binh và quái đều có art chính thức trong manifest.</p>')}
    ${section('Chưa có rig và chưa có key pose trận', noMotion.length, noMotion.length ? `<div class="cdb-chiplist">${noMotion.map((e) => `<button type="button" class="cdb-chip cdb-chip--btn" data-open="${esc(keyOf(e))}">${esc(e.name)} <code>${esc(e.art.id)}</code></button>`).join('')}</div>` : '<p class="ok">Không có.</p>')}
    ${section('Kỹ năng chưa có icon riêng', noIcon.length, noIcon.length ? skillChips(noIcon) : '<p class="ok">Không có.</p>', noIcon.length ? 'info' : 'ok')}
    ${section('Kỹ năng chưa có animation riêng (battle_fx.json)', noFx.length, noFx.length ? skillChips(noFx) : '<p class="ok">Cả ' + db.skills.length + ' kỹ năng đều có kịch bản animation riêng.</p>')}
    ${section('Kỹ năng chỉ khai báo, chưa entity nào dùng', db.unusedSkills.length, db.unusedSkills.length ? skillChips(db.skills.filter((s) => s.sharing === 'unused')) : '<p class="ok">Không có.</p>')}
    ${section('Dữ liệu không đồng nhất giữa các file', db.inconsistencies.length, db.inconsistencies.length ? `<ul class="cdb-list">${db.inconsistencies.map((x) => `<li><code>${esc(x)}</code></li>`).join('')}</ul><p class="cdb-note">Chỉ báo cáo, trang này không sửa dữ liệu gameplay.</p>` : '<p class="ok">Không có.</p>')}
    ${section('Trường không có trong hệ thống hiện tại (N/A)', 4, `<ul class="cdb-list">
      <li><b>Passive riêng</b>: Combat V2 không có kỹ năng bị động; hiệu ứng thường trực đến từ trang bị, cộng hưởng dòng (engagement.json) và biến thể nhóm quái.</li>
      <li><b>AI riêng từng quái</b>: mọi quái dùng chung AI ý định (<code>src/systems/combat/ai.ts</code>, chọn đòn điểm cao nhất mỗi vòng); enemies.json không có trường AI.</li>
      <li><b>Điều kiện kích hoạt skill</b>: chỉ có pha trùm (<code>phases[].hpBelow</code>) và cấp tha hóa; không có điều kiện riêng theo skill.</li>
      <li><b>"SP Cost"</b>: kỹ năng tốn <b>MP</b> (Tuyệt kỹ tốn Nộ đầy); <b>SP</b> là điểm kỹ năng để mở / nâng nút cây class.</li></ul>`, 'info')}
  </div>`;
}

// ---- Detail panel -------------------------------------------------------------------------------------------------------------

function renderPanel() {
  const host = page.root?.querySelector<HTMLElement>('[data-cdb-panel]');
  if (!host) return;
  const p = page.panel;
  if (!p || !page.db) {
    host.innerHTML = '';
    document.body.classList.remove('cdb-locked');
    return;
  }
  const body = p.kind === 'entity' ? entityPanel(p) : skillPanel(p);
  host.innerHTML = `<div class="cdb-backdrop" data-close></div><aside class="cdb-panel" role="dialog" aria-modal="true" aria-label="Chi tiết" tabindex="-1">${body}</aside>`;
  document.body.classList.add('cdb-locked');
  host.querySelector<HTMLElement>('.cdb-panel')?.focus();
}

const DETAIL_TABS: readonly (readonly [DetailTab, string])[] = [
  ['overview', 'Tổng quan'],
  ['skills', 'Kỹ năng'],
  ['props', 'Thuộc tính chiến đấu'],
  ['anim', 'Animation & VFX'],
  ['more', 'Dữ liệu khác'],
];

function entityPanel(p: Extract<Panel, { kind: 'entity' }>): string {
  const e = entityByKey(p.key);
  if (!e) return errorState('Không tìm thấy entity.');
  const chips = e.kind === 'animal' ? `${classChip(e.classId)}${elemChip(e.element)}${e.element2 ? elemChip(e.element2) : ''}${rarityChip(e.rarity)}` : `${e.types.length ? e.types.map(foeChip).join('') : foeChip('')}${elemChip(e.element)}${e.element2 ? elemChip(e.element2) : ''}`;
  const color = elementColor(e.element);
  const head = `<header class="cdb-panel__head" style="${color ? `--el:${color}` : ''}">
      <div class="cdb-panel__art">${pic(e.art, 'cdb-panel__img', e.name)}</div>
      <div class="cdb-panel__id">
        <span class="cdb-eyebrow">${e.kind === 'animal' ? `Chiến binh · ${e.source === 'farm' ? 'Heo (Sobi Farm)' : 'Cá (Sobi Aquarium)'}` : 'Quái vật'}</span>
        <h2>${esc(e.name)}</h2><code class="cdb-id">${esc(e.id)}</code>
        <div class="cdb-chips">${chips}</div>
        <div>${dataBadge(e.status)}</div>
      </div>
      <button type="button" class="icon-btn cdb-panel__x" data-close aria-label="Đóng">✕</button>
    </header>`;
  const tabs = `<nav class="cdb-dtabs" role="tablist">${DETAIL_TABS.map(([t, l]) => `<button type="button" role="tab" class="cdb-dtab${p.tab === t ? ' is-on' : ''}" aria-selected="${p.tab === t}" data-dtab="${t}">${esc(l)}</button>`).join('')}</nav>`;
  const body = p.tab === 'overview' ? overview(e, p) : p.tab === 'skills' ? skillsSection(e) : p.tab === 'props' ? propsSection(e) : p.tab === 'anim' ? animSection(e) : moreSection(e);
  return `${head}${tabs}<div class="cdb-panel__body">${body}</div>`;
}

const block = (title: string, body: string, note = '') => `<section class="cdb-block"><h3>${esc(title)}${note ? `<small>${note}</small>` : ''}</h3>${body}</section>`;

/** Stat bars, each scaled against the highest value of that stat in the list it is compared with. */
function statBars(stats: Stats, peers: readonly Stats[]): string {
  return `<div class="cdb-bars">${STAT_ORDER.map((k) => {
    const max = Math.max(1, ...peers.map((s) => s[k]));
    const w = Math.max(2, Math.round((stats[k] / max) * 100));
    return `<div class="cdb-bar"><span class="cdb-bar__k" title="${esc(statName(k))}">${k.toUpperCase()}</span><span class="cdb-bar__track"><span style="width:${w}%"></span></span><b>${round(stats[k])}</b><small>${esc(statName(k))}</small></div>`;
  }).join('')}</div>`;
}

function overview(e: Entity, p: Extract<Panel, { kind: 'entity' }>): string {
  const idle = e.animation.poses.find((x) => x.id.endsWith('_idle'));
  const gallery = [
    `<figure>${pic(e.art, 'cdb-fig__img', e.name)}<figcaption>Portrait / ảnh chính<br /><code>${esc(e.art.id)}</code> · ${esc(ART_LABEL[e.art.state])}</figcaption></figure>`,
    `<figure>${idle ? pic(idle, 'cdb-fig__img') : '<span class="cdb-fig__img cdb-missing"><b>Chưa có</b><small>key pose cb_*_idle</small></span>'}<figcaption>Combat sprite (key pose idle)${idle ? `<br /><code>${esc(idle.id)}</code>` : ''}</figcaption></figure>`,
    e.kind === 'animal' ? `<figure>${pic(e.lineage.art, 'cdb-fig__img', e.lineage.guardian)}<figcaption>Guardian tổ của dòng<br /><code>${esc(e.lineage.art.id)}</code></figcaption></figure>` : '',
  ].join('');
  if (e.kind === 'animal') {
    const db = page.db!;
    const classId = (p.classId || e.classId) as ClassId;
    const stats = animalStatsAt(e, p.level, classId);
    const peers = db.animals.map((a) => animalStatsAt(a, p.level, a.classId));
    const growth = `Công thức của game: chỉ số class × (1 + ${Math.round(STAT_RULES.levelGrowth * 100)}% × (cấp − 1)) × hệ số độ hiếm (${RARITY_LABEL[e.rarity] ?? e.rarity}: ×${e.rarityMult}); MP, SPD tăng một nửa; ACC, EVA, CRIT không tăng. Chưa tính trang bị, khẩu phần và Gắn bó (+${Math.round(STAT_RULES.bondPerHeart * 100)}% / tim).`;
    return `<div class="cdb-gallery">${gallery}</div>
      ${block('Chỉ số chiến đấu', `<div class="cdb-statctl">
          <label>Cấp <input type="range" min="1" max="${MAX_LEVEL}" value="${p.level}" data-level /> <b data-level-out>${p.level}</b></label>
          <label>Class <select data-class>${CLASS_IDS.map((c) => `<option value="${c}"${c === classId ? ' selected' : ''}>${esc(className(c))}${c === e.classId ? ' (mặc định)' : ''}</option>`).join('')}</select></label>
        </div>${statBars(stats, peers)}<p class="cdb-note">${esc(growth)} Thanh so với chiến binh mạnh nhất cùng cấp. Đổi class ở Đền chỉ đổi chỉ số gốc và cây kỹ năng, dòng / nguyên tố / Độc nhất giữ nguyên.</p>`)}
      ${block('Nhận diện', `<dl class="cdb-dl">
        <dt>Dòng Guardian</dt><dd>${esc(e.lineage.name)} — ${esc(e.lineage.guardian)}</dd>
        <dt>Class mặc định</dt><dd>${esc(className(e.classId))} — ${esc(CLASSES[e.classId].descVi)}</dd>
        <dt>Nguyên tố</dt><dd>${elemChip(e.element)}${e.element2 ? ` + ${elemChip(e.element2)} (hệ phụ riêng loài)` : ''}</dd>
        <dt>Độ hiếm</dt><dd>${rarityChip(e.rarity)} ×${e.rarityMult}</dd>
        <dt>Nguồn</dt><dd>${e.source === 'farm' ? 'content/farm/species.json' : 'content/aquarium/fish.json'} · lineages.json → ${e.source === 'farm' ? 'species' : 'fish'}.${esc(e.id)}</dd></dl>`)}`;
  }
  const scaled = e.scaled.length
    ? `<div class="cdb-tablewrap"><table class="cdb-table cdb-table--tight"><thead><tr><th>Loại nhóm</th><th>Tha hóa</th>${STAT_ORDER.map((k) => `<th>${k.toUpperCase()}</th>`).join('')}<th>Hệ phụ</th><th>Skill thêm</th><th>Số nhóm</th></tr></thead><tbody>${e.scaled
        .map((s) => `<tr><td>${foeChip(s.kind)}</td><td class="cdb-num">◆${s.corruption}</td>${STAT_ORDER.map((k) => `<td class="cdb-num" title="${s.stats[k]}">${round(s.stats[k])}</td>`).join('')}<td>${s.element2 ? elemChip(s.element2, true) : '—'}</td><td>${s.extraSkills.map((id) => esc(SKILLS[id]?.nameVi ?? id)).join(', ') || '—'}</td><td class="cdb-num">${s.count}</td></tr>`)
        .join('')}</tbody></table></div><p class="cdb-note">Tính bằng hàm <code>withClass</code> của game trên dòng enemies.json: nhân theo loại nhóm (balance.json → foes.classes) và cấp tha hóa. Chưa gồm biến thể (affix) của nhóm thường, quy mô Vết Nứt.</p>`
    : '<p class="cdb-muted">Quái này chưa được đặt vào nhóm nào trên map (N/A).</p>';
  return `<div class="cdb-gallery">${gallery}</div>
    ${block('Chỉ số gốc (enemies.json)', `${statBars(e.stats, page.db!.monsters.map((m) => m.stats))}<p class="cdb-note">Thanh so với quái có chỉ số đó cao nhất.</p>`)}
    ${block('Chỉ số trong trận theo nơi xuất hiện', scaled)}
    ${block('Nhận diện', `<dl class="cdb-dl"><dt>Loại (nơi xuất hiện)</dt><dd>${e.types.length ? e.types.map(foeChip).join(' ') : 'Chưa đặt trên map'}</dd><dt>Thẻ</dt><dd>${e.tags.length ? e.tags.map((t) => `<code>${esc(t)}</code>`).join(' ') : '—'}</dd><dt>Cờ trùm</dt><dd>${e.boss ? 'Có (<code>boss: true</code>)' : 'Không'}</dd><dt>Nguyên tố</dt><dd>${elemChip(e.element)}${e.element2 ? ` + ${elemChip(e.element2)}` : ''}</dd></dl>`)}`;
}

function skillCard(u: SkillUse, e: Entity): string {
  const s = skillOf(u.skillId);
  if (!s) return `<div class="cdb-skill is-missing"><b>${esc(u.skillId)}</b><span class="cdb-muted">Không có trong skills.json</span></div>`;
  const r = s.row;
  const others = new Set(s.users.filter((x) => x.id !== e.id).map((x) => x.id)).size;
  const role = `${ROLE_LABEL[u.role] ?? u.role}${u.role === 'line' && e.kind === 'animal' ? ` ${e.lineage.name.replace(/^Dòng /, '')}` : ''}`;
  const meta = [
    u.slot !== undefined ? `Ô ${u.slot + 1} · mở ở cấp ${u.unlockLevel}` : '',
    u.node ? `Bậc ${u.node.tier} · nhánh ${u.node.branch} · mở ${u.node.unlockCost} SP${u.node.starter ? ' · có sẵn' : ''}` : '',
    u.hpBelow !== undefined ? `Khi máu < ${Math.round(u.hpBelow * 100)}%` : '',
    u.corruption ? `Tha hóa ◆${u.corruption} trở lên` : '',
  ].filter(Boolean).join(' · ');
  return `<button type="button" class="cdb-skill" data-skill="${esc(s.id)}">
    ${skillIcon(s)}
    <span class="cdb-skill__main">
      <span class="cdb-skill__name"><b>${esc(r.nameVi)}</b><code class="cdb-id">${esc(s.id)}</code></span>
      <span class="cdb-chips"><span class="cdb-type cdb-type--${r.type}">${esc(TYPE_LABEL[r.type] ?? r.type)}</span><span class="cdb-chip">${esc(role)}</span>${elemChip(r.element, true)}<span class="cdb-chip">${esc(CATEGORY_LABEL[r.category] ?? r.category)}</span><span class="cdb-chip">🎯 ${esc(TARGET_LABEL[r.target] ?? r.target)}</span></span>
      <span class="cdb-skill__nums"><span>⚔ ${powerText(s)}</span><span>💧 ${costText(s)}</span><span>⏱ ${r.cooldown ? `${r.cooldown} lượt` : 'không'}</span><span>🎯 ${r.accuracy}%</span>${r.maxLevel > 1 ? `<span>⬆ tối đa Lv${r.maxLevel}</span>` : ''}</span>
      ${r.effects.length ? `<span class="cdb-effects">${r.effects.map((x) => `<span>${esc(effectText(x))}</span>`).join('')}</span>` : ''}
      <span class="cdb-skill__desc">${esc(r.descVi)}</span>
      <span class="cdb-skill__foot">${meta ? `<span>${esc(meta)}</span>` : ''}<span>${others ? `🔗 ${others} entity khác cũng dùng` : '⭐ chỉ entity này'}</span>${s.fx.has ? statusBadge('ok', '🎬 Có animation') : statusBadge('warn', '🎬 Chưa có animation')}</span>
    </span>
  </button>`;
}

function skillsSection(e: Entity): string {
  if (e.kind === 'animal') {
    const tiers = [...new Set(e.common.map((u) => u.node!.tier))].sort((a, b) => a - b);
    return `${block('Kỹ năng riêng (Unique)', `<div class="cdb-skills">${e.unique.map((u) => skillCard(u, e)).join('')}</div>`, `4 ô Độc nhất của ${esc(e.lineage.name)} — ô "Riêng loài" thay ô của dòng`)}
      ${block('Tuyệt kỹ (Ultimate)', `<div class="cdb-skills">${skillCard(e.ultimate, e)}</div>`, `Tốn Nộ đầy (${AB.rage.max}), một lần mỗi trận`)}
      ${block(`Kỹ năng chung (cây class ${className(e.classId)})`, tiers.map((t) => `<h4 class="cdb-tier">Bậc ${t}</h4><div class="cdb-skills">${e.common.filter((u) => u.node!.tier === t).map((u) => skillCard(u, e)).join('')}</div>`).join(''), 'Mọi chiến binh cùng class đều học được; mở bằng SP')}`;
  }
  const { unique, common } = splitSkills(e);
  const group = (list: SkillUse[]) => (list.length ? `<div class="cdb-skills">${list.map((u) => skillCard(u, e)).join('')}</div>` : '<p class="cdb-muted">Không có.</p>');
  return `${block('Kỹ năng riêng của quái này', group(unique.filter((u) => u.role !== 'phase')))}
    ${block('Kỹ năng dùng chung với quái khác', group(common.filter((u) => u.role !== 'phase' && u.role !== 'corruption')))}
    ${block('Thêm khi đổi pha (trùm)', group(e.skills.filter((u) => u.role === 'phase')), e.phases.length ? '' : 'N/A — không có pha')}
    ${block('Thêm theo cấp tha hóa', group(e.skills.filter((u) => u.role === 'corruption')), 'Theo balance.json → foes.corruption, chỉ khi nhóm có tha hóa cao hơn mức của loại')}
    <p class="cdb-note">Quái không có kỹ năng Độc nhất / Tuyệt kỹ / cây class: chỉ có kỹ năng loại "enemy". Không có Nộ (rageMax = 0).</p>`;
}

function affinityTable(el: Element, overrides: Partial<Record<Element, string>> = {}): string {
  const a = affinities(el, overrides);
  const rows = (list: ReturnType<typeof affinities>['attack'], dir: string) =>
    list.length
      ? list.map((x) => `<span class="cdb-aff">${elemChip(x.element, true)}${statusBadge(INTERACTION_LABEL[x.interaction]?.[0] ?? 'off', `${INTERACTION_LABEL[x.interaction]?.[1] ?? x.interaction} ×${x.mult}`)}${overrides[x.element] && dir === 'def' ? '<small>(riêng quái)</small>' : ''}</span>`).join('')
      : '<span class="cdb-muted">Không có tương khắc (mọi hệ ×1)</span>';
  return `<div class="cdb-affs"><div><h4>${elemChip(el, true)} đánh vào</h4>${rows(a.attack, 'atk')}</div><div><h4>Bị đánh bởi</h4>${rows(a.defend, 'def')}</div></div>`;
}

function propsSection(e: Entity): string {
  const statuses = [...new Set(e.skills.flatMap((u) => skillOf(u.skillId)?.statuses ?? []))];
  const statusRows = statuses.length
    ? `<div class="cdb-statuslist">${statuses.map((st) => {
        const d = STATUSES[st];
        return `<div class="cdb-status">${icon(st === 'autoRevive' ? 'ui_icon_status_revive' : d?.kind === 'stat' && d.stat ? `ui_icon_stat_${d.stat.key}` : `ui_icon_status_${st}`)}<b>${esc(statusName(st))}</b>${statusBadge(d?.positive ? 'ok' : 'warn', d?.positive ? 'Có lợi' : 'Bất lợi')}<small>${esc(d?.descVi ?? '')}</small></div>`;
      }).join('')}</div>`
    : '<p class="cdb-muted">Kỹ năng của entity này không gây trạng thái.</p>';
  const dual = `Hai hệ: hệ số khắc của hai hệ nhân với nhau, kẹp trong [${ELEMENT_CHART.dualMin}, ${ELEMENT_CHART.dualMax}].`;
  if (e.kind === 'animal') {
    return `${block('Tương khắc nguyên tố', `${affinityTable(e.element)}${e.element2 ? `<h4 class="cdb-tier">Hệ phụ</h4>${affinityTable(e.element2)}<p class="cdb-note">${esc(dual)}</p>` : ''}`, 'elements.json → chart')}
      ${block('Kỹ năng bị động (Passive)', '<p class="cdb-muted">N/A — Combat V2 không có passive cho sinh vật. Bổ trợ thường trực đến từ trang bị (equipment.json), khẩu phần và cộng hưởng dòng bên dưới.</p>')}
      ${block('Cộng hưởng dòng (khi đội có cả hai dòng)', e.synergies.length ? `<ul class="cdb-list">${e.synergies.map((s) => `<li><b>${esc(s.name)}</b> — ${esc(s.desc)} <small class="cdb-muted">(${s.lines.map(lineName).map(esc).join(' + ')})</small></li>`).join('')}</ul>` : '<p class="cdb-muted">Không có.</p>', 'engagement.json → synergies')}
      ${block('Trạng thái kỹ năng có thể gây', statusRows)}
      ${block('Cơ chế khác', `<ul class="cdb-list"><li>Nộ tối đa ${AB.rage.max}: đầy thì dùng được Tuyệt kỹ một lần mỗi trận.</li><li>Ô Độc nhất mở ở cấp ${AB.levels.uniqueUnlockLevels.join(' / ')}.</li><li>Kháng trạng thái / kháng hệ riêng: N/A (chỉ có từ trang bị).</li></ul>`)}`;
  }
  const resist = Object.entries(e.statusResist);
  return `${block('Tương khắc nguyên tố', `${affinityTable(e.element, e.elementOverrides)}${e.element2 ? `<h4 class="cdb-tier">Hệ phụ</h4>${affinityTable(e.element2)}<p class="cdb-note">${esc(dual)}</p>` : ''}${Object.keys(e.elementOverrides).length ? `<p class="cdb-note">Ghi đè riêng (elementOverrides): ${Object.entries(e.elementOverrides).map(([k, v]) => `${esc(elementName(k))} → ${esc(INTERACTION_LABEL[v!]?.[1] ?? v)}`).join(', ')}</p>` : ''}<p class="cdb-note">Tha hóa còn cộng kháng mọi hệ và làm Ánh sáng đánh đau hơn theo cấp (balance.json → foes.corruption).</p>`)}
    ${block('Kháng / miễn trạng thái', `<dl class="cdb-dl"><dt>Kháng</dt><dd>${resist.length ? resist.map(([k, v]) => `${esc(statusName(k))} ${Math.round(v! * 100)}%`).join(' · ') : '—'}</dd><dt>Miễn nhiễm</dt><dd>${e.statusImmune.length ? e.statusImmune.map((s) => esc(statusName(s))).join(' · ') : '—'}</dd></dl>`)}
    ${block('Pha chiến đấu (trùm)', e.phases.length ? `<ol class="cdb-list">${e.phases.map((ph) => `<li>Khi máu &lt; <b>${Math.round(ph.hpBelow * 100)}%</b>: thêm ${ph.addSkills.map((s) => `<button type="button" class="cdb-link" data-skill="${esc(s)}">${esc(SKILLS[s]?.nameVi ?? s)}</button>`).join(', ') || '—'}${ph.statuses.length ? `; nhận ${ph.statuses.map((x) => `${esc(statusName(x.status))} ${x.turns} lượt`).join(', ')}` : ''}${ph.element ? `; đổi hệ sang ${elemChip(ph.element, true)}` : ''}</li>`).join('')}</ol>` : '<p class="cdb-muted">N/A — không có pha.</p>')}
    ${block('AI / cách đánh', '<p>Dùng AI ý định chung của hệ thống trận (<code>src/systems/combat/ai.ts</code>): đầu mỗi vòng chọn đòn có điểm cao nhất trong số kỹ năng đủ MP / hết hồi chiêu, máu dưới 30% có thể chọn Phòng thủ. <b>Không có cấu hình AI riêng cho quái này</b> (N/A trong enemies.json).</p>')}
    ${block('Trạng thái kỹ năng có thể gây', statusRows)}
    ${block('Biến thể nhóm thường (affix)', e.affixes.length ? `<ul class="cdb-list">${e.affixes.map((a) => `<li><b>${esc(a.name)}</b> — ${esc(a.desc)}</li>`).join('')}</ul><p class="cdb-note">Tỉ lệ ${Math.round(ADVENTURE_CONTENT.engagement.affixChance * 100)}% mỗi nhóm thường mỗi chuyến (engagement.json).</p>` : '<p class="cdb-muted">N/A — quái này không xuất hiện trong nhóm thường.</p>')}`;
}

function animSection(e: Entity): string {
  const a = e.animation;
  const rigBtn = a.rig ? `<button type="button" class="btn btn-small" data-rig="${esc(a.rig)}">🦴 Mở trong Rig sinh vật</button>` : '';
  const poses = a.poses.length ? `<div class="cdb-poses">${a.poses.map((x) => `<figure>${pic(x, 'cdb-pose__img')}<figcaption>${esc(x.id.replace(`cb_${e.art.id}_`, ''))}</figcaption></figure>`).join('')}</div>` : '<p class="cdb-muted">Chưa có key pose <code>cb_' + esc(e.art.id) + '_*</code> trong manifest.</p>';
  const rows = e.skills
    .map((u) => {
      const s = skillOf(u.skillId);
      if (!s) return '';
      return `<tr><td>${skillIcon(s, 'cdb-skill__ico cdb-skill__ico--sm')}</td><td><button type="button" class="cdb-link" data-skill="${esc(s.id)}">${esc(s.row.nameVi)}</button><br /><code class="cdb-id">${esc(s.id)}</code></td><td>${esc(ROLE_LABEL[u.role] ?? u.role)}</td><td>${s.fx.has ? statusBadge('ok', '✓ Có') : statusBadge('warn', 'Chưa có')}</td><td>${s.fx.vfx3d.map((f) => `<code>${esc(f)}</code>`).join(' ') || '—'}</td><td class="cdb-num">${s.fx.timing ? `${s.fx.timing.end} ms` : '—'}</td><td><button type="button" class="btn btn-small" data-play="${esc(s.id)}" data-actor="${esc(e.art.id)}" data-enemy="${e.kind === 'monster'}">▶ Xem</button></td></tr>`;
    })
    .join('');
  return `${block('Hình trong trận', `<dl class="cdb-dl"><dt>Rig (puppet)</dt><dd>${a.rig ? `${statusBadge('ok', '✓ Có')} <code>content/anim/rigs/${esc(a.rig)}.json</code> ${rigBtn}` : statusBadge('warn', 'Chưa có — trận dùng key pose hoặc ảnh tĩnh')}</dd><dt>Kiểu thân</dt><dd><code>${esc(a.body)}</code> ${a.bodyDeclared ? '(khai báo trong battle_fx.json)' : '(mặc định của game, chưa khai báo riêng)'}</dd><dt>Key pose</dt><dd>${a.poses.length} ảnh</dd></dl>${poses}`)}
    ${block('Animation từng kỹ năng', `<div class="cdb-tablewrap"><table class="cdb-table cdb-table--tight"><thead><tr><th></th><th>Kỹ năng</th><th>Vai trò</th><th>Kịch bản</th><th>Hiệu ứng 3D</th><th>Dài</th><th>Preview</th></tr></thead><tbody>${rows}</tbody></table></div><p class="cdb-note">"▶ Xem" mở Xưởng animation trận với đúng entity và kỹ năng này (preview chạy bằng sân trận của game). Đòn thường, phòng thủ, trạng thái dùng hành động chung trong battle_fx.json.</p>`)}`;
}

function moreSection(e: Entity): string {
  const checks = `<ul class="cdb-checks">${e.checks.map((c) => `<li class="${c.ok ? 'is-ok' : c.required ? 'is-bad' : 'is-note'}">${c.ok ? '✓' : c.required ? '✗' : 'ℹ'} ${esc(c.label)}${c.required ? '' : ' <small>(tuỳ chọn)</small>'}${c.detail ? `<small>${esc(c.detail)}</small>` : ''}</li>`).join('')}</ul>`;
  if (e.kind === 'animal') {
    const file = ADVENTURE_CONTENT.lineages;
    const raw = e.source === 'farm' ? file.species[e.id] : file.fish[e.id];
    return `${block('Kiểm tra độ đầy đủ', checks)}
      ${block('Dòng lineages.json của loài', `<pre class="cdb-json">${esc(JSON.stringify(raw, null, 2))}</pre>`)}
      ${block('Dòng Guardian', `<p>${esc(e.lineage.desc)}</p><pre class="cdb-json">${esc(JSON.stringify(LINEAGE_LIST.find((l) => l.id === e.lineage.id), null, 2))}</pre>`)}`;
  }
  const appear = e.appearances.length
    ? `<div class="cdb-tablewrap"><table class="cdb-table cdb-table--tight"><thead><tr><th>Vùng</th><th>Khu</th><th>Nhóm</th><th>Loại</th><th>Tha hóa</th><th>Ghi chú</th></tr></thead><tbody>${e.appearances.map((a) => `<tr><td>${esc(a.zoneName)}</td><td>${esc(a.mapName)} <code class="cdb-id">${esc(a.mapId)}</code></td><td><code>${esc(a.groupId)}</code></td><td>${foeChip(a.kind)}</td><td class="cdb-num">◆${a.corruption}</td><td>${[a.sleep ? 'Ngủ' : '', a.when === 'rain' ? 'Khi mưa' : a.when === 'night' ? 'Ban đêm' : '', a.disguise ? 'Giả rương' : ''].filter(Boolean).join(', ') || '—'}</td></tr>`).join('')}</tbody></table></div>`
    : '<p class="cdb-muted">Không có nhóm nào trên map.</p>';
  const drops = e.drops.length ? `<ul class="cdb-list">${e.drops.map((d) => `<li>${icon(itemArtId(d.itemId))}<b>${esc(nameOfItem(d.itemId))}</b> <code>${esc(d.itemId)}</code> — ${Math.round(d.chance * 100)}%, ${d.min === d.max ? d.min : `${d.min}–${d.max}`}</li>`).join('')}</ul>` : '<p class="cdb-muted">Không rơi vật phẩm.</p>';
  const raw = ADVENTURE_CONTENT.enemies.enemies.find((x) => x.id === e.id);
  return `${block('Kiểm tra độ đầy đủ', checks)}
    ${block('Nơi xuất hiện', `${appear}${e.nightmareFloors.length ? `<p>Trùm Ác Mộng ở Vết Nứt tầng ${e.nightmareFloors.join(', ')}.</p>` : ''}${e.escortFloors.length ? `<p>Hộ tống trùm Ác Mộng ở tầng ${e.escortFloors.join(', ')}.</p>` : ''}`)}
    ${block('Phần thưởng (gốc)', `<dl class="cdb-dl"><dt>Kinh nghiệm</dt><dd>${fmt(e.exp)} / chiến binh</dd><dt>Xu</dt><dd>${fmt(e.coins)}</dd></dl>${drops}<p class="cdb-note">Trong trận nhân theo loại nhóm và tha hóa (balance.json → foes); rương trùm có bảng loot riêng (zones.json → tables).</p>`)}
    ${block('Dòng enemies.json', `<pre class="cdb-json">${esc(JSON.stringify(raw, null, 2))}</pre>`)}`;
}

function skillPanel(p: Extract<Panel, { kind: 'skill' }>): string {
  const s = skillOf(p.id);
  if (!s) return errorState(`Không có kỹ năng ${esc(p.id)}.`);
  const r = s.row;
  const [tone, text] = SHARING_LABEL[s.sharing]!;
  const back = p.back ? `<button type="button" class="btn btn-small" data-back>← Quay lại ${esc(p.back.kind === 'entity' ? (entityByKey(p.back.key)?.name ?? '') : (skillOf(p.back.id)?.row.nameVi ?? ''))}</button>` : '';
  const users = (kind: 'animal' | 'monster') => {
    const list = s.users.filter((u) => u.kind === kind);
    if (!list.length) return '<p class="cdb-muted">Không có.</p>';
    return `<div class="cdb-users">${list.map((u) => {
      const e = entityByKey(`${u.kind}:${u.id}`);
      return `<button type="button" class="cdb-user" data-open="${esc(`${u.kind}:${u.id}`)}">${e ? pic(e.art, 'cdb-user__img', u.name) : ''}<span><b>${esc(u.name)}</b><small>${esc(ROLE_LABEL[u.role] ?? u.role)}</small></span></button>`;
    }).join('')}</div>`;
  };
  const nodes = ADVENTURE_CONTENT.classes.trees.flatMap((t) => t.nodes.filter((n) => n.skill === s.id).map((n) => ({ ...n, classId: t.classId })));
  const per = Object.entries(r.perLevel).filter(([, v]) => v !== undefined);
  const firstUser = s.users[0];
  const actor = firstUser ? entityByKey(`${firstUser.kind}:${firstUser.id}`)?.art.id : undefined;
  return `<header class="cdb-panel__head cdb-panel__head--skill" style="${elementColor(r.element) ? `--el:${elementColor(r.element)}` : ''}">
      <div class="cdb-panel__art">${skillIcon(s, 'cdb-panel__ico')}</div>
      <div class="cdb-panel__id">${back}
        <span class="cdb-eyebrow">Kỹ năng · ${esc(TYPE_LABEL[r.type] ?? r.type)}</span>
        <h2>${esc(r.nameVi)}</h2><code class="cdb-id">${esc(s.id)}</code>
        <div class="cdb-chips"><span class="cdb-type cdb-type--${r.type}">${esc(TYPE_LABEL[r.type] ?? r.type)}</span>${statusBadge(tone, text)}${elemChip(r.element)}<span class="cdb-chip">${esc(CATEGORY_LABEL[r.category] ?? r.category)}</span><span class="cdb-chip">🎯 ${esc(TARGET_LABEL[r.target] ?? r.target)}</span>${s.fx.has ? statusBadge('ok', '🎬 Có animation') : statusBadge('warn', '🎬 Chưa liên kết animation')}</div>
      </div>
      <button type="button" class="icon-btn cdb-panel__x" data-close aria-label="Đóng">✕</button>
    </header>
    <div class="cdb-panel__body">
      ${block('Mô tả', `<p>${esc(r.descVi)}</p>`)}
      ${block('Số liệu', `<div class="cdb-numgrid">
        <div><small>Sức mạnh</small><b>${powerText(s)}</b></div>
        <div><small>Chi phí</small><b>${costText(s)}</b></div>
        <div><small>Hồi chiêu</small><b>${r.cooldown ? `${r.cooldown} lượt` : 'Không'}</b></div>
        <div><small>Chính xác</small><b>${r.accuracy}%</b></div>
        <div><small>Chí mạng thêm</small><b>${r.critBonus ? `+${fmt(r.critBonus * 100)}%` : '—'}</b></div>
        <div><small>Cấp tối đa</small><b>${r.maxLevel}</b></div></div>
        ${per.length ? `<p class="cdb-note">Mỗi cấp nâng: ${per.map(([k, v]) => `${esc(k)} ${(v as number) >= 0 ? '+' : ''}${fmt(v as number)}`).join(' · ')}</p>` : ''}`)}
      ${block('Tác dụng', r.effects.length ? `<ul class="cdb-list">${r.effects.map((x) => `<li>${esc(effectText(x))}</li>`).join('')}</ul>` : `<p class="cdb-muted">${r.power > 0 ? 'Chỉ gây sát thương.' : 'Không có.'}</p>`)}
      ${s.statuses.length ? block('Trạng thái gây ra', `<div class="cdb-statuslist">${s.statuses.map((st: StatusId) => `<div class="cdb-status"><b>${esc(statusName(st))}</b><small>${esc(STATUSES[st]?.descVi ?? '')}</small></div>`).join('')}</div>`) : ''}
      ${nodes.length ? block('Trong cây class', `<ul class="cdb-list">${nodes.map((n) => `<li>${classChip(n.classId)} <code>${esc(n.id)}</code> — bậc ${n.tier}, nhánh ${esc(n.branch)}, mở ${n.unlockCost} SP${n.upgradeCost.length ? `, nâng ${n.upgradeCost.join(' / ')} SP` : ''}${n.starter ? ', có sẵn' : ''}${n.requires.length ? `; cần ${n.requires.map((x) => `${esc(x.node)} Lv${x.level}`).join(' + ')}` : ''}</li>`).join('')}</ul>`) : ''}
      ${s.corruptionLevel ? block('Theo tha hóa', `<p>Mọi quái ở nhóm có cấp tha hóa ◆${s.corruptionLevel} trở lên (cao hơn mức mặc định của loại nhóm) được thêm kỹ năng này.</p>`) : ''}
      ${block('Animation & VFX', s.fx.has ? `<dl class="cdb-dl"><dt>Kịch bản</dt><dd>battle_fx.json → skills.${esc(s.id)} · ${s.fx.cues} cue</dd><dt>Nhịp</dt><dd>${s.fx.timing ? `ra đòn ${s.fx.timing.release} ms · trúng ${s.fx.timing.impact} ms · hết ${s.fx.timing.end} ms` : '—'}</dd><dt>Hiệu ứng 3D</dt><dd>${s.fx.vfx3d.map((f) => `<code>${esc(f)}</code>`).join(' ') || '—'}</dd><dt>Âm thanh</dt><dd>${s.fx.sounds.map((f) => `<code>${esc(f)}</code>`).join(' ') || '—'}</dd></dl>
        <button type="button" class="btn btn-small" data-play="${esc(s.id)}" data-actor="${esc(actor ?? '')}" data-enemy="${r.type === 'enemy'}">▶ Xem trong Xưởng animation trận</button>` : '<p class="cdb-muted">Chưa có kịch bản riêng trong battle_fx.json: trận dùng hình chung theo nguyên tố.</p>')}
      ${block(`Chiến binh dùng (${new Set(s.users.filter((u) => u.kind === 'animal').map((u) => u.id)).size})`, users('animal'), r.type === 'class' ? 'chiến binh có class này làm mặc định; đổi class ở Đền thì ai cũng học được' : '')}
      ${block(`Quái dùng (${new Set(s.users.filter((u) => u.kind === 'monster').map((u) => u.id)).size})`, users('monster'))}
      ${block('Dòng skills.json', `<pre class="cdb-json">${esc(JSON.stringify(r, null, 2))}</pre>`)}
    </div>`;
}

// ---- Events ---------------------------------------------------------------------------------------------------------------------

function openEntity(key: string) {
  const prev = page.panel;
  page.panel = { kind: 'entity', key, tab: prev?.kind === 'entity' && prev.key === key ? prev.tab : 'overview', level: 1, classId: '' };
  renderPanel();
}

function openSkill(id: string) {
  const prev = page.panel;
  page.panel = { kind: 'skill', id, back: prev };
  renderPanel();
}

function closePanel() {
  page.panel = null;
  renderPanel();
}

function wire() {
  page.wired = true;
  // One set of listeners on the document for the life of the admin page; each checks that the Combat Database is on screen.
  const here = () => !!page.root?.isConnected && location.hash.startsWith('#/combat-db');
  document.addEventListener('click', (ev) => {
    if (!here()) return;
    const t = ev.target instanceof Element ? ev.target : null;
    if (!t) return;
    const tab = currentTab();
    if (t.closest('[data-close]')) return closePanel();
    if (t.closest('[data-back]') && page.panel?.kind === 'skill') {
      page.panel = page.panel.back;
      return renderPanel();
    }
    const play = t.closest<HTMLElement>('[data-play]');
    if (play) {
      const enemy = play.dataset.enemy === 'true';
      const actor = play.dataset.actor || (enemy ? 'enemy_forest_wolf' : 'pig_knight');
      presetBattleLab({ skill: play.dataset.play!, fromEnemy: enemy, attacker: actor, target: enemy ? 'pig_knight' : 'enemy_forest_wolf' });
      closePanel();
      location.hash = '#/battle-lab';
      return;
    }
    const rig = t.closest<HTMLElement>('[data-rig]');
    if (rig) {
      presetRigLab(rig.dataset.rig!);
      closePanel();
      location.hash = '#/rig-lab';
      return;
    }
    const dtab = t.closest<HTMLElement>('[data-dtab]');
    if (dtab && page.panel?.kind === 'entity') {
      page.panel = { ...page.panel, tab: dtab.dataset.dtab as DetailTab };
      renderPanel();
      return;
    }
    const skill = t.closest<HTMLElement>('[data-skill]');
    if (skill) return openSkill(skill.dataset.skill!);
    const open = t.closest<HTMLElement>('[data-open]');
    if (open) return openEntity(open.dataset.open!);
    const view = t.closest<HTMLElement>('[data-view]');
    if (view) {
      page.view = view.dataset.view as 'cards' | 'table';
      return renderBody(tab);
    }
    const sort = t.closest<HTMLElement>('[data-sort]');
    if (sort && (tab === 'animals' || tab === 'monsters')) {
      const q = page[tab];
      if (q.sort === sort.dataset.sort) q.desc = !q.desc;
      else Object.assign(q, { sort: sort.dataset.sort, desc: STAT_ORDER.includes(sort.dataset.sort as keyof Stats) });
      return renderBody(tab);
    }
    if (t.closest('[data-desc]')) {
      if (tab === 'skills') page.skills.desc = !page.skills.desc;
      else if (tab !== 'report') page[tab].desc = !page[tab].desc;
      return renderBody(tab);
    }
    if (t.closest('[data-clear]')) {
      if (tab === 'skills') page.skills = { ...emptySkillQuery(), sort: page.skills.sort, desc: page.skills.desc };
      else if (tab !== 'report') page[tab] = { ...emptyEntityQuery(), sort: page[tab].sort, desc: page[tab].desc };
      return renderBody(tab);
    }
  });
  // Leaving the page with the panel open (browser back, a link) must not leave the page scroll locked.
  window.addEventListener('hashchange', () => {
    if (location.hash.startsWith('#/combat-db')) return;
    page.panel = null;
    document.body.classList.remove('cdb-locked');
  });
  document.addEventListener('keydown', (ev) => {
    if (!here()) return;
    if (ev.key === 'Escape' && page.panel) return closePanel();
    const row = ev.target instanceof HTMLElement ? ev.target : null;
    if (ev.key === 'Enter' && row?.matches('tr[data-open], tr[data-skill]')) row.click();
  });
  document.addEventListener('input', (ev) => {
    if (!here()) return;
    const t = ev.target as HTMLInputElement;
    const tab = currentTab();
    if (t.matches('[data-q]')) {
      if (tab === 'skills') page.skills.q = t.value;
      else if (tab !== 'report') page[tab].q = t.value;
      renderResults(tab);
      const clear = page.root?.querySelector<HTMLButtonElement>('.cdb-tools [data-clear]');
      const q: object = tab === 'skills' ? page.skills : tab !== 'report' ? page[tab] : {};
      if (clear) clear.disabled = !Object.entries(q).some(([k, v]) => k !== 'sort' && k !== 'desc' && !!v);
      t.closest('.wf')?.classList.toggle('is-set', !!t.value);
      return;
    }
    if (t.matches('[data-level]') && page.panel?.kind === 'entity') {
      page.panel = { ...page.panel, level: Number(t.value) };
      const e = entityByKey(page.panel.key);
      const bars = page.root?.querySelector<HTMLElement>('.cdb-panel .cdb-bars');
      const out = page.root?.querySelector<HTMLElement>('[data-level-out]');
      if (out) out.textContent = t.value;
      if (e?.kind === 'animal' && bars) {
        const classId = (page.panel.classId || e.classId) as ClassId;
        bars.outerHTML = statBars(animalStatsAt(e, page.panel.level, classId), page.db!.animals.map((a) => animalStatsAt(a, (page.panel as { level: number }).level, a.classId)));
      }
    }
  });
  document.addEventListener('change', (ev) => {
    if (!here()) return;
    const t = ev.target as HTMLSelectElement;
    const tab = currentTab();
    if (t.matches('[data-class]') && page.panel?.kind === 'entity') {
      page.panel = { ...page.panel, classId: t.value };
      return renderPanel();
    }
    const f = t.dataset.f as keyof EntityQuery | undefined;
    if (f && (tab === 'animals' || tab === 'monsters')) {
      (page[tab] as unknown as Record<string, string>)[f] = t.value;
      return renderBody(tab);
    }
    const s = t.dataset.s as keyof SkillQuery | undefined;
    if (s && tab === 'skills') {
      (page.skills as unknown as Record<string, string>)[s] = t.value;
      return renderBody(tab);
    }
  });
}

