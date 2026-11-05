// Pure filter logic of the World pages (Quản lý map, Mạng map, Thư viện asset): options come from the data that really exists,
// a parent filter narrows the child's list, and a chosen value that stopped being valid is reset. No DOM here (tests/scripts/worldFilters.test.ts).

export interface Facet {
  value: string;
  label: string;
  count: number;
}

export interface FacetSpec<T> {
  /** The facet value of an item. */
  of: (item: T) => string;
  /** Display name of a value. */
  label: (value: string) => string;
  /** Preferred order of values; others follow alphabetically. */
  order?: readonly string[];
}

/** The values present in `items` with their counts: nothing that no item has. */
export function facetOptions<T>(items: readonly T[], spec: FacetSpec<T>): Facet[] {
  const counts = new Map<string, number>();
  for (const it of items) counts.set(spec.of(it), (counts.get(spec.of(it)) ?? 0) + 1);
  const order = spec.order ?? [];
  const rank = (v: string) => {
    const i = order.indexOf(v);
    return i < 0 ? order.length : i;
  };
  return [...counts]
    .sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]))
    .map(([value, count]) => ({ value, label: spec.label(value), count }));
}

/** The chosen value if the list still has it, '' (= all) otherwise. */
export const reconcile = (chosen: string, facets: readonly Facet[]): string => (chosen && !facets.some((f) => f.value === chosen) ? '' : chosen);

/** Case-insensitive match of a search text against name / id fields. */
export function matchesQuery(query: string, ...fields: readonly (string | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  return !q || fields.join(' ').toLowerCase().includes(q);
}

export interface Cascade<T> {
  a: string;
  b: string;
  aFacets: Facet[];
  bFacets: Facet[];
  /** Items passing both chosen values (the search text is applied by the page). */
  shown: T[];
}

/** Two filters that narrow each other (zone × status): each list holds only what the other choice leaves; an invalid choice is reset (the parent wins a conflict). */
export function cascade<T>(items: readonly T[], a: FacetSpec<T>, b: FacetSpec<T>, chosen: { a: string; b: string }): Cascade<T> {
  const pass = (spec: FacetSpec<T>, value: string) => (it: T) => !value || spec.of(it) === value;
  let av = chosen.a;
  let bv = chosen.b;
  // The first filter is the parent: it only resets when no item has its value at all; the second must fit the parent's items.
  av = reconcile(av, facetOptions(items, a));
  bv = reconcile(bv, facetOptions(items.filter(pass(a, av)), b));
  return {
    a: av,
    b: bv,
    aFacets: facetOptions(items.filter(pass(b, bv)), a),
    bFacets: facetOptions(items.filter(pass(a, av)), b),
    shown: items.filter(pass(a, av)).filter(pass(b, bv)),
  };
}
