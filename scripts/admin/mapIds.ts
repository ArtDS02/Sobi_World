// The Adventure ids a player's save may hold (decision 047, state.ts): area ids (the trip, the fog, the portals), zone ids (cleared
// zones), treasure chests, element gates, exits (shortcuts), overhead covers (secrets), puzzles, lore stones, and the groups beaten for
// good (`<mapId>/<groupId>`: every class but normal and mutant). A content save of maps.json / zones.json may move or change them, never
// drop one that is published: the save would point at nothing.
type Row = { id?: unknown; kind?: unknown };
type MapRow = Record<string, unknown> & { id?: unknown };

const LISTS = ['chests', 'gates', 'exits', 'covers', 'puzzles', 'lore'] as const;
const FOR_GOOD = new Set(['elite', 'subboss', 'boss', 'special']);

const rows = (value: unknown, key: string): Row[] => {
  const list = (value as Record<string, unknown> | null)?.[key];
  return Array.isArray(list) ? (list as Row[]) : [];
};
const str = (v: unknown): v is string => typeof v === 'string';

/** The save-held ids of a maps.json value. */
export function savedMapIds(value: unknown): Set<string> {
  const out = new Set<string>();
  for (const m of rows(value, 'maps') as MapRow[]) {
    if (!str(m.id)) continue;
    out.add(m.id);
    for (const key of LISTS) for (const r of rows(m, key)) if (str(r.id)) out.add(r.id);
    for (const g of rows(m, 'groups')) if (str(g.id) && str(g.kind) && FOR_GOOD.has(g.kind)) out.add(`${m.id}/${g.id}`);
  }
  return out;
}

/** The problems of saving `after` over `before` for a file whose ids saves hold (none for other files). */
export function savedIdProblems(file: string, before: unknown, after: unknown): string[] {
  let removed: string[] = [];
  if (file === 'adventure/maps.json') {
    const now = savedMapIds(after);
    removed = [...savedMapIds(before)].filter((id) => !now.has(id));
  } else if (file === 'adventure/zones.json') {
    const now = new Set(rows(after, 'zones').map((z) => z.id));
    removed = rows(before, 'zones').map((z) => z.id).filter((id): id is string => str(id) && !now.has(id));
  }
  return removed.length ? [`Không được xoá id đã publish (save của người chơi còn giữ): ${removed.join(', ')}`] : [];
}
