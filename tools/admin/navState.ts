// Sidebar preferences (admin plan step 3): which nav groups are folded and whether the sidebar shows icons only. Kept in
// localStorage per viewer; every read and write is guarded, the dashboard works without storage.
const KEY = 'sobi-admin-nav-v1';

export interface NavPrefs {
  collapsed: string[];
  icons: boolean;
}

export function readPrefs(storage: Pick<Storage, 'getItem'> | null = safeStorage()): NavPrefs {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return { collapsed: [], icons: false };
    const p = JSON.parse(raw) as Partial<NavPrefs>;
    return {
      collapsed: Array.isArray(p.collapsed) ? p.collapsed.filter((g): g is string => typeof g === 'string') : [],
      icons: p.icons === true,
    };
  } catch {
    return { collapsed: [], icons: false };
  }
}

export function writePrefs(p: NavPrefs, storage: Pick<Storage, 'setItem'> | null = safeStorage()): void {
  try {
    storage?.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private window or blocked storage: the choice just is not remembered */
  }
}

function safeStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** A group is folded when the viewer folded it, unless it holds the page that is open (that one opens itself). */
export const isFolded = (group: string, prefs: NavPrefs, hasActive: boolean): boolean => prefs.collapsed.includes(group) && !hasActive;

/** New prefs after a click on a group title. */
export function toggleGroup(prefs: NavPrefs, group: string): NavPrefs {
  const folded = prefs.collapsed.includes(group);
  return { ...prefs, collapsed: folded ? prefs.collapsed.filter((g) => g !== group) : [...prefs.collapsed, group] };
}

/** New prefs after "fold all" (true) / "open all" (false). */
export const setAll = (prefs: NavPrefs, groups: readonly string[], fold: boolean): NavPrefs => ({ ...prefs, collapsed: fold ? [...groups] : [] });
