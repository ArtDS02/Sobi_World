// Display names and pictures of ids for the dashboard (decision 036): an item, species, crop, fish, flower, enemy,
// zone, trait… is shown by its name beside its id. Names come from the content rows themselves (nameVi, name.vi,
// titleVi), from the game's string tables (items, decorations, achievements, weather) and from the species draft.
import { itemArtId } from '../../src/core/config/assetIds';
import { vi } from '../../src/i18n/vi';
import { artUrl, json, state } from './store';

const names = new Map<string, string>();
const arts = new Map<string, string>();

const table = (o: Record<string, unknown>) => {
  for (const [k, v] of Object.entries(o)) if (typeof v === 'string' && !k.endsWith('_desc') && !names.has(k)) names.set(k, v);
};

/** Every row with an id in a content value: its name and its art id. */
function scan(value: unknown) {
  if (Array.isArray(value)) return value.forEach(scan);
  if (!value || typeof value !== 'object') return;
  const r = value as Record<string, unknown>;
  if (typeof r.id === 'string') {
    const n = [r.nameVi, (r.name as { vi?: unknown } | undefined)?.vi, r.titleVi].find((x) => typeof x === 'string' && x) as string | undefined;
    if (n && !names.has(r.id)) names.set(r.id, n);
    const a = [r.artId, r.art, r.icon].find((x) => typeof x === 'string') as string | undefined;
    if (a && !arts.has(r.id)) arts.set(r.id, a);
  }
  Object.values(r).forEach(scan);
}

let loaded: Promise<void> | null = null;

/** Builds the index once (content files from the dev API when it runs, the string tables always). */
export function loadNames(): Promise<void> {
  loaded ??= (async () => {
    for (const row of state.rows) names.set(row.id, row.nameVi);
    table(vi.shop as Record<string, unknown>);
    table(vi.decor as Record<string, unknown>);
    table(vi.achievements as Record<string, unknown>);
    table(vi.weather.names as Record<string, unknown>);
    if (!state.apiOnline) return;
    try {
      scan((await json<{ files: Record<string, unknown> }>('/__admin/content')).files);
    } catch {
      /* names from the string tables only */
    }
  })();
  return loaded;
}

/** Forget the index (after a content save the names may have changed). */
export const resetNames = () => {
  names.clear();
  arts.clear();
  loaded = null;
};

export const nameOf = (id: string): string | undefined => names.get(id);

/** Picture URL of an id: its row's art, else an item icon, else the manifest row with that id. */
export function imageOf(id: string): string | null {
  const art = arts.get(id);
  return (art ? artUrl(art) : null) ?? artUrl(itemArtId(id)) ?? artUrl(id) ?? speciesImage(id);
}

function speciesImage(id: string): string | null {
  const row = state.rows.find((r) => r.id === id);
  const pig = row ? state.pigs.find((p) => p.id === row.artId) : undefined;
  return pig ? `/assets/${pig.asset}` : null;
}
