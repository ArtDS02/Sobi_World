// Search / filter / sort / paginate for every admin list (DECISIONS AD-1). Pure, unit-tested; the
// DOM toolbar around it is listKit.ts.

export interface FilterDef<T> {
  key: string;
  label: string; // "all" option text, e.g. "Mọi danh mục"
  options: readonly (readonly [value: string, label: string])[];
  test: (item: T, value: string) => boolean;
}

export interface SortDef<T> {
  key: string;
  label: string;
  compare: (a: T, b: T) => number;
}

export interface ListState {
  q: string;
  filters: Record<string, string>;
  sort: string;
  page: number;
}

export interface ListQuery<T> {
  /** Text searched (case and accent insensitive): name, id, tags… */
  text: (item: T) => readonly (string | null | undefined)[];
  filters: readonly FilterDef<T>[];
  sorts: readonly SortDef<T>[];
  pageSize: number;
}

/** Lowercase without Vietnamese accents, so "heo rong" finds "Heo Rồng". */
export const fold = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

export const emptyState = (sort = ''): ListState => ({ q: '', filters: {}, sort, page: 0 });

/** Number of active criteria (search counts as one), for the "N bộ lọc" badge. */
export const activeCount = (s: ListState) =>
  (s.q.trim() ? 1 : 0) + Object.values(s.filters).filter(Boolean).length;

export function runQuery<T>(items: readonly T[], q: ListQuery<T>, s: ListState) {
  const words = fold(s.q).split(/\s+/).filter(Boolean);
  let rows = items.filter((item) => {
    if (words.length) {
      const hay = fold(q.text(item).filter(Boolean).join(' '));
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return q.filters.every((f) => !s.filters[f.key] || f.test(item, s.filters[f.key]!));
  });
  const sort = q.sorts.find((x) => x.key === s.sort) ?? q.sorts[0];
  if (sort) rows = rows.map((r, i) => ({ r, i })).sort((a, b) => sort.compare(a.r, b.r) || a.i - b.i).map((x) => x.r);
  const pages = Math.max(1, Math.ceil(rows.length / q.pageSize));
  const page = Math.min(Math.max(0, s.page), pages - 1);
  return { total: rows.length, pages, page, rows: rows.slice(page * q.pageSize, (page + 1) * q.pageSize) };
}

/** Compare helpers for SortDef. */
export const byText = <T>(get: (t: T) => string) => (a: T, b: T) => get(a).localeCompare(get(b), 'vi');
export const byNumber = <T>(get: (t: T) => number) => (a: T, b: T) => get(a) - get(b);
export const reverse = <T>(cmp: (a: T, b: T) => number) => (a: T, b: T) => cmp(b, a);
