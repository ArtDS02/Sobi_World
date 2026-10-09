// Validation of the admin-edited data besides species (DECISIONS AD-1): shop products, the breeding
// pair table and the farm layout. Shared by the dashboard (live) and the dev API (refuses to save on
// any error). Pure: no fs, no DOM.
import type { Issue } from './validate';

export type { Issue };

export const PRODUCT_ID = /^[A-Z][A-Z0-9_]*$/;
export const PAIR_ID = /^PAIR_[A-Z0-9_]+$/;

export interface ProductRow {
  id: string;
  nameVi: string;
  descVi: string;
  category: string;
  currency: string;
  itemId: string;
  quantity: number;
  priceGold: number;
  icon: string;
  sortOrder: number;
  active: boolean;
}

export interface ProductRules {
  itemIds: readonly string[];
  categories: readonly string[];
  currencies: readonly string[];
  assetIds: ReadonlySet<string>;
  /** Ids already shipped: transactions may reference them, so they stay (deactivate instead). */
  shippedIds: readonly string[];
}

const posInt = (n: unknown) => typeof n === 'number' && Number.isInteger(n) && n > 0;

export function productIssues(rows: readonly ProductRow[], r: ProductRules): Issue[] {
  const issues: Issue[] = [];
  const seen = new Set<string>();
  for (const p of rows) {
    const push = (level: Issue['level'], text: string) => issues.push({ level, speciesId: p.id, text });
    if (!PRODUCT_ID.test(p.id)) push('error', `ID "${p.id}" phải dạng CHU_HOA_SO`);
    if (seen.has(p.id)) push('error', 'Trùng ID sản phẩm');
    seen.add(p.id);
    if (!p.nameVi.trim()) push('error', 'Thiếu tên');
    if (!r.categories.includes(p.category)) push('error', `Danh mục "${p.category}" không hợp lệ`);
    if (!r.currencies.includes(p.currency)) push('error', `Tiền tệ "${p.currency}" không hợp lệ`);
    if (!r.itemIds.includes(p.itemId)) push('error', `Vật phẩm "${p.itemId}" không tồn tại`);
    if (!posInt(p.quantity) || p.quantity > 999) push('error', 'Số lượng mỗi lần mua phải 1–999');
    if (!posInt(p.priceGold)) push('error', 'Giá phải là số nguyên > 0');
    if (!Number.isInteger(p.sortOrder)) push('error', 'Thứ tự hiển thị phải là số nguyên');
    if (!r.assetIds.has(p.icon)) push('error', `Icon "${p.icon}" không có trong manifest`);
    if (!p.active) push('info', 'Đang ngừng bán');
  }
  for (const id of r.shippedIds) {
    if (!seen.has(id)) issues.push({ level: 'error', speciesId: id, text: 'Không được xoá sản phẩm đã phát hành — hãy ngừng bán' });
  }
  if (!rows.some((p) => p.active)) issues.push({ level: 'warn', speciesId: null, text: 'Cửa hàng không còn sản phẩm nào đang bán' });
  return sortIssues(issues);
}

export interface PairRuleRow {
  id: string;
  parents: readonly [string, string];
  outcomes: readonly { breed: string; percent: number }[];
  active: boolean;
  note?: string;
}

export interface PairRules {
  breeds: Readonly<Record<string, { breedable: boolean; enabled: boolean }>>;
  epsilon: number;
}

/** Unordered pair key: A + B and B + A are the same rule. */
export const pairKey = (a: string, b: string) => [a, b].sort().join('+');

export const outcomeTotal = (r: Pick<PairRuleRow, 'outcomes'>) =>
  Math.round(r.outcomes.reduce((s, o) => s + o.percent, 0) * 1000) / 1000;

export function pairIssues(rows: readonly PairRuleRow[], r: PairRules): Issue[] {
  const issues: Issue[] = [];
  const ids = new Set<string>();
  const pairs = new Map<string, string>();
  for (const rule of rows) {
    const push = (level: Issue['level'], text: string) => issues.push({ level, speciesId: rule.id, text });
    if (!PAIR_ID.test(rule.id)) push('error', `ID "${rule.id}" phải dạng PAIR_…`);
    if (ids.has(rule.id)) push('error', 'Trùng ID luật');
    ids.add(rule.id);
    for (const p of rule.parents) {
      const parent = r.breeds[p];
      if (!parent) push('error', `Heo bố/mẹ "${p}" không tồn tại`);
      else if (!parent.breedable) push('error', `${p} không lai được`);
    }
    const key = pairKey(...rule.parents);
    const other = pairs.get(key);
    if (other) push('error', `Trùng cặp với luật ${other} (A + B = B + A)`);
    else pairs.set(key, rule.id);
    if (rule.outcomes.length === 0) push('error', 'Cần ít nhất 1 kết quả');
    const seen = new Set<string>();
    for (const o of rule.outcomes) {
      const child = r.breeds[o.breed];
      if (!child) push('error', `Kết quả "${o.breed}" không tồn tại`);
      else if (!child.enabled) push('warn', `${o.breed} đang tắt — bị bỏ qua, phần còn lại chia lại cho đủ 100 %`);
      if (seen.has(o.breed)) push('error', `Kết quả ${o.breed} bị lặp`);
      seen.add(o.breed);
      if (!(Number.isFinite(o.percent) && o.percent > 0 && o.percent <= 100)) push('error', `Tỷ lệ của ${o.breed} phải trong (0, 100]`);
    }
    const total = outcomeTotal(rule);
    if (Math.abs(total - 100) > r.epsilon) push('error', `Tổng tỷ lệ = ${total} % (phải đúng 100 %)`);
    if (!rule.active) push('info', 'Đang tắt: cặp này dùng luật mặc định');
  }
  return sortIssues(issues);
}

export interface PlacementRow {
  id: string;
  layer: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  role?: string;
  action?: string;
  visible?: boolean;
  portal?: string;
}

export interface LayoutRules {
  assetIds: ReadonlySet<string>; // non-pig manifest rows
  troughId: string;
  /** The plaza's layout (GĐ3): the doors it must hold, one for each of these portal ids. */
  plaza?: { portals: readonly string[] };
}

export function layoutIssues(rows: readonly PlacementRow[], r: LayoutRules): Issue[] {
  const issues: Issue[] = [];
  rows.forEach((p, i) => {
    const ref = `#${i + 1} ${p.id}`;
    const push = (level: Issue['level'], text: string) => issues.push({ level, speciesId: ref, text });
    if (!r.assetIds.has(p.id)) push('error', 'Asset không có trong manifest');
    if (!Number.isInteger(p.layer) || p.layer < 0 || p.layer > 5) push('error', 'Lớp phải 0–5');
    if (![p.x, p.y].every(Number.isFinite)) push('error', 'Vị trí không hợp lệ');
    else if (p.x < -0.25 || p.x > 1.25 || p.y < -0.25 || p.y > 1.25) push('warn', 'Nằm ngoài khung 1600×900');
    for (const [k, v] of [['Rộng', p.width], ['Cao', p.height]] as const) {
      if (v !== undefined && !(Number.isFinite(v) && v > 0)) push('error', `${k} phải > 0`);
    }
    if (p.rotation !== undefined && !(Math.abs(p.rotation) <= 360)) push('error', 'Góc xoay phải trong ±360°');
    if (p.visible === false && p.action) push('warn', 'Đang ẩn nhưng có hành động — người chơi không bấm được');
  });
  if (r.plaza) return sortIssues([...issues, ...plazaIssues(rows, r.plaza.portals)]);
  const troughs = rows.filter((p) => p.role === 'trough' || p.id === r.troughId);
  if (troughs.length > 1) issues.push({ level: 'error', speciesId: null, text: 'Chỉ được 1 máng ăn trong layout' });
  if (troughs.filter((p) => p.visible !== false).length === 0)
    issues.push({ level: 'warn', speciesId: null, text: 'Không có máng ăn hiển thị — heo không có chỗ ăn' });
  if (rows.filter((p) => p.role === 'orderBoard').length > 1)
    issues.push({ level: 'error', speciesId: null, text: 'Chỉ được 1 bảng đơn hàng (role orderBoard)' });
  const actions = new Map<string, number>();
  for (const p of rows) if (p.action && p.visible !== false) actions.set(p.action, (actions.get(p.action) ?? 0) + 1);
  for (const [a, n] of actions) if (n > 1) issues.push({ level: 'warn', speciesId: null, text: `${n} vật cùng mở "${a}"` });
  return sortIssues(issues);
}

/** The plaza has one visible door for every Area (spec §3.1) and no door the game does not know. */
function plazaIssues(rows: readonly PlacementRow[], portals: readonly string[]): Issue[] {
  const issues: Issue[] = [];
  const doors = rows.filter((p) => p.portal !== undefined);
  for (const id of portals) {
    const n = doors.filter((p) => p.portal === id && p.visible !== false).length;
    if (n !== 1) issues.push({ level: 'error', speciesId: null, text: `Cổng "${id}" phải có đúng 1 vật đang hiện, đang có ${n}` });
  }
  for (const p of doors) {
    if (!portals.includes(p.portal!)) issues.push({ level: 'error', speciesId: `${p.id}`, text: `Cổng "${p.portal}" không thuộc Area nào` });
  }
  return issues;
}

function sortIssues(issues: Issue[]): Issue[] {
  const order = { error: 0, warn: 1, info: 2 } as const;
  return issues.sort((a, b) => order[a.level] - order[b.level]);
}
