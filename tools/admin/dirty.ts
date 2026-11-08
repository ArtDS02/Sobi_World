// One view of "what is unsaved" across the dashboard (plan step 7.1). Each page keeps its own draft; this module only
// asks them: how many pages hold unsaved work, which, and which one "Lưu tất cả" should deal with next.
export interface DirtySource {
  /** Route of the page (`#/<page>`). */
  page: string;
  label: string;
  dirty: () => boolean;
}

export const dirtyPages = (sources: readonly DirtySource[]): DirtySource[] => sources.filter((s) => s.dirty());

/** The text of the header chip, or null when everything is saved. */
export function dirtyChip(sources: readonly DirtySource[]): string | null {
  const list = dirtyPages(sources);
  return list.length === 0 ? null : `● ${list.length} trang chưa lưu: ${list.map((s) => s.label).join(', ')}`;
}

/**
 * What "Lưu tất cả" does next: save the species draft in place when it is dirty (no navigation needed), otherwise open the
 * first page with unsaved work so its own save button (Ctrl+S) can be used; pages that reload after saving go one at a time.
 */
export function nextSaveStep(sources: readonly DirtySource[], page: string, speciesDirty: boolean): { kind: 'species' } | { kind: 'goto'; page: string } | { kind: 'click' } | null {
  if (speciesDirty) return { kind: 'species' };
  const list = dirtyPages(sources);
  if (list.length === 0) return null;
  return list.some((s) => s.page === page) ? { kind: 'click' } : { kind: 'goto', page: list[0]!.page };
}
