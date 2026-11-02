// What a publish of the Map Builder would do (decision 047, GĐ7), pure: the world after it — the published areas with the chosen
// drafts laid over (inactive exits left out), the new areas in their zones, every exit that names a spawn moved onto it — and every
// check the game would make on it, by severity: the game's schema, each area's own checks, the graph, the ids saves hold, and the
// English of every new or changed text (the game ships in two languages). Errors keep the publish off; warnings only inform.
import { mapsFileSchema } from '../../content/schemas/adventure/maps';
import type { AreaMap, Zone } from '../../src/areas/adventure/logic/config/content';
import { mapGraphProblems } from '../../src/areas/adventure/logic/mapGraph';
import { mapProblems } from '../../src/areas/adventure/logic/maps';
import { translatableTexts } from '../../src/i18n/contentText';
import { savedIdProblems } from '../../scripts/admin/mapIds';
import { graphText } from './mapNetwork';
import { isPublished, resolveArrivals, type BuilderData } from './mapModel';

export const MAPS_FILE = 'adventure/maps.json';

export interface Check {
  level: 'error' | 'warn';
  mapId: string | null;
  text: string;
}

/** A text the publish needs in English: its path in en.json, the Vietnamese, the English known so far ('' = none). */
export interface EnglishText {
  path: string;
  vi: string;
  en: string;
  /** The Vietnamese changed since the English was written. */
  stale: boolean;
}

export interface PublishPlan {
  ids: string[];
  /** maps.json as it would be. */
  maps: AreaMap[];
  zones: Zone[];
  /** Areas whose row changes: the chosen ones and those whose exits follow a moved spawn. */
  changed: string[];
  /** Exits moved onto their spawn (in areas not chosen too). */
  moved: string[];
  checks: Check[];
  english: EnglishText[];
}

/** A draft as it is published: its inactive exits left out. */
export function publishedRow(data: BuilderData, id: string): AreaMap {
  const map = data.drafts[id]!.map;
  const notes = data.meta[id]?.exits ?? {};
  return { ...map, exits: map.exits.filter((e) => !notes[e.id]?.inactive) };
}

/** The drafts that can be published: every draft not switched off. */
export const publishable = (data: BuilderData): string[] => Object.keys(data.drafts).filter((id) => !data.meta[id]?.disabled);

export function planPublish(data: BuilderData, ids: readonly string[], en: Readonly<Record<string, string>>): PublishPlan {
  const chosen = ids.filter((id) => data.drafts[id] && !data.meta[id]?.disabled);
  const checks: Check[] = [];
  const err = (mapId: string | null, text: string) => checks.push({ level: 'error', mapId, text });
  const warn = (mapId: string | null, text: string) => checks.push({ level: 'warn', mapId, text });
  const name = (id: string) => data.drafts[id]?.map.nameVi ?? data.published.find((m) => m.id === id)?.nameVi ?? id;

  let maps = data.published.map((m) => (chosen.includes(m.id) ? publishedRow(data, m.id) : m));
  for (const id of chosen) if (!isPublished(data, id)) maps.push(publishedRow(data, id));
  const resolved = resolveArrivals(maps);
  maps = resolved.maps;
  const changed = new Set(chosen);
  for (const m of maps) if (m.exits.some((e) => resolved.moved.includes(e.id))) changed.add(m.id);

  const zones = data.zones.map((z) => {
    const fresh = chosen.filter((id) => !isPublished(data, id) && data.drafts[id]!.map.zoneId === z.id);
    if (!fresh.length) return z;
    const main = fresh.filter((id) => data.drafts[id]!.road === 'main');
    const side = fresh.filter((id) => data.drafts[id]!.road === 'branch');
    return { ...z, maps: [...z.maps, ...main], ...(side.length || z.branches ? { branches: [...(z.branches ?? []), ...side] } : {}) };
  });

  for (const id of chosen) {
    const was = data.published.find((m) => m.id === id);
    const now = data.drafts[id]!.map;
    if (was && was.zoneId !== now.zoneId) err(id, `${name(id)}: map đã publish không đổi vùng được (${was.zoneId} → ${now.zoneId})`);
    if (was && (was.cols !== now.cols || was.rows !== now.rows)) warn(id, `${name(id)}: đổi cỡ map đã publish — sương mù đã khám phá của người chơi sẽ lệch (không mất tiến trình)`);
    for (const e of publishedRow(data, id).exits) {
      if (!maps.some((m) => m.id === e.to)) err(id, `${name(id)}: lối ra ${e.id} dẫn tới ${name(e.to)} — map đó chưa publish (chọn publish cùng)`);
    }
  }
  for (const id of ids) if (data.meta[id]?.disabled) warn(id, `${name(id)}: đang tạm tắt, không publish`);

  // The game's own checks, on the world as it would be.
  const parsed = mapsFileSchema.safeParse({ maps });
  if (!parsed.success) for (const i of parsed.error.issues) err(null, `Cấu trúc maps.json: ${i.message}${i.path.length ? ` (${i.path.join('.')})` : ''}`);
  for (const m of maps) for (const p of mapProblems(m, maps)) err(m.id, p);
  for (const p of mapGraphProblems(maps, zones)) err(maps.find((m) => p.includes(m.id))?.id ?? null, graphText(p, name));
  for (const p of savedIdProblems(MAPS_FILE, { maps: data.published }, { maps })) err(null, p);
  if (resolved.moved.length) warn(null, `${resolved.moved.length} lối ra đi theo điểm tới đã dời: ${resolved.moved.join(', ')}`);

  // English for every new or changed text of the areas.
  const before = translatableTexts(MAPS_FILE, { maps: data.published });
  const after = translatableTexts(MAPS_FILE, { maps });
  const english: EnglishText[] = [];
  for (const [path, vi] of after) {
    const known = en[path] ?? '';
    const stale = before.has(path) && before.get(path) !== vi;
    if (!known || stale) english.push({ path, vi, en: known, stale });
  }
  return { ids: chosen, maps, zones, changed: [...changed], moved: resolved.moved, checks, english };
}

/** Errors left once the English answers are in (`answers` by path). */
export function blockingChecks(plan: PublishPlan, answers: Readonly<Record<string, string>>): Check[] {
  const missing = plan.english.filter((t) => !(answers[t.path] ?? (t.stale ? '' : t.en)).trim());
  return [...plan.checks.filter((c) => c.level === 'error'), ...missing.map((t): Check => ({ level: 'error', mapId: null, text: `Cần tiếng Anh cho "${t.vi}" (${t.path})` }))];
}
